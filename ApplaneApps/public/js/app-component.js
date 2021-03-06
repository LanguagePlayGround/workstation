
/*AppsViews starts from here*/
var AppViews = {};
(function () {

    AppViews.POPUP_WIDTH = "810px";
    AppViews.POPUP_HEIGHT = "450px";
    AppViews.SHORT_POPUP_WIDTH = "410px";
    AppViews.SHORT_POPUP_HEIGHT = "200px";

    AppViews.__insertEvents__ = [
        {
            function: {source: "ApplaneFunctions/lib/AppSystemEvents",
                name: "onInsert"},
            event: "onInsert"
        }
    ]

    AppViews.__privileges__ = [
        {label: "Collection", field: "collection", visibilityGrid: false, visibilityForm: true, ui: "autocomplete", "upsert": true, type: "string", width: "200px", collection: "pl.collections", displayField: "collection", filterable: true, when: "$type==='Collection' || $type==='Regex'", mandatory: true},
        {"label": "Fields Availability", "field": "fieldsAvailability", "visibilityGrid": false, nestedGridPosition: "form", "visibilityForm": true, "ui": "autocomplete", type: "string", options: ["Exclude", "Include" ], when: "$type==='Collection' || $type==='Regex' || $type==='Default'"},
        {label: "Fields", field: "fieldInfos", visibilityGrid: false, visibilityForm: true, ui: "grid", nestedGridPosition: "form", doNotResolveVisibilityWithParent: true, type: "object", "multiple": true, width: "200px", when: "$fieldsAvailability", fields: [
            {"label": "Field", "field": "field", "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", upsert: true, collection: "pl.fields", displayField: "field", parameters: {collection: "$collection"}, filter: {"collectionid.collection": "$collection"}, mandatory: true, events: [
                {
                    function: "Fields.postQuery",
                    event: "onQuery",
                    post: true
                }
            ]}
        ]},
        {"label": "Filter UI", "field": "filterUI", "visibilityGrid": false, "visibilityForm": true, nestedGridPosition: "form", "ui": "autocomplete", type: "string", options: ["json", "grid"], when: "$type==='Collection' || $type==='Regex' || $type==='Default'"},
        {"label": "Filter", "field": "filterJSON", "visibilityGrid": false, "visibilityForm": true, nestedGridPosition: "form", "ui": "text", type: "string", when: "$filterUI=='json'"},
        {label: "Filters", field: "filterInfos", visibilityGrid: false, visibilityForm: true, ui: "grid", nestedGridPosition: "form", doNotResolveVisibilityWithParent: true, type: "object", "multiple": true, when: "$filterUI=='grid'", width: "200px", fields: [
            {"label": "Field", "field": "field", "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", upsert: true, collection: "pl.fields", displayField: "field", parameters: {collection: "$collection"}, filter: {"collectionid.collection": "$collection"}, mandatory: true, events: [
                {
                    function: "Fields.postQuery",
                    event: "onQuery",
                    post: true
                }
            ]},
            {"label": "Operator", "field": "operator", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", options: ["$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin"]},
            {"label": "Value", "field": "value", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", upsert: true, options: ["$$CurrentUser", "$$UserRoles"], mandatory: true},
            {"label": "AND/OR", "field": "logicalOperator", "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", options: ["AND", "OR"]}
        ]},

        {"label": "Actions Availability", "field": "actionsAvailability", "visibilityGrid": false, "visibilityForm": true, nestedGridPosition: "form", "ui": "autocomplete", type: "string", options: ["Exclude", "Include"], when: "$type==='Collection' || $type==='Regex' || $type==='Default'"},
        {label: "Actions", field: "actionInfos", visibilityGrid: false, visibilityForm: true, ui: "grid", nestedGridPosition: "form", doNotResolveVisibilityWithParent: true, type: "object", "multiple": true, width: "200px", when: "$actionsAvailability", fields: [
            {"label": "Action", "field": "action", "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", mandatory: true, collection: "pl.actions", displayField: "id", parameters: {collection: "$collection"}, filter: {"collectionid.collection": "$collection"}},
            {label: "Filter JSON", field: "filterJSON", visibilityGrid: false, visibilityForm: true, ui: "text", type: "string", width: "200px"}
        ]},
        {"label": "Views Availability", "field": "viewsAvailability", "visibilityGrid": false, "visibilityForm": true, nestedGridPosition: "form", "ui": "autocomplete", type: "string", options: ["Exclude", "Include"], when: "$type==='Collection' || $type==='Regex' || $type==='Default'"},
        {label: "Views", field: "viewInfos", visibilityGrid: false, visibilityForm: true, ui: "grid", nestedGridPosition: "form", doNotResolveVisibilityWithParent: true, type: "object", "multiple": true, width: "200px", when: "$viewsAvailability", fields: [
            {"label": "View", "field": "view", "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", collection: "pl.qviews", displayField: "id", parameters: {collection: "$collection"}, filter: {"collection.collection": "$collection"}, mandatory: true}
        ]},

        {label: "Operations", field: "operationInfos", visibilityGrid: false, visibilityForm: true, ui: "grid", nestedGridPosition: "form", doNotResolveVisibilityWithParent: true, type: "object", mandatory: true, "multiple": true, width: "200px", when: "$type==='Collection' || $type==='Regex' || $type==='Default'", fields: [
            {"label": "Type", "field": "type", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", options: ["find", "insert", "update", "remove", "fk"], mandatory: true},
            {"label": "Sequence", "field": "sequence", "visibilityGrid": false, "visibilityForm": true, "ui": "number", type: "number"},
            {"label": "Primary Fields", "field": "primaryFields", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", nestedGridPosition: "form", doNotResolveVisibilityWithParent: true, when: "$type=='find'"},
            {"label": "Fields Availability", "field": "fieldsAvailability", "visibilityGrid": false, nestedGridPosition: "form", doNotResolveVisibilityWithParent: true, "visibilityForm": true, "ui": "autocomplete", type: "string", options: ["Exclude", "Include"]},
            {"label": "Fields", field: "fieldInfos", visibilityGrid: false, visibilityForm: true, ui: "grid", nestedGridPosition: "form", doNotResolveVisibilityWithParent: true, type: "object", "multiple": true, width: "200px", when: "$fieldsAvailability", fields: [
                {"label": "Field", "field": "field", "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", upsert: true, collection: "pl.fields", displayField: "field", parameters: {collection: "$collection"}, filter: {"collectionid.collection": "$collection"}, mandatory: true, events: [
                    {
                        function: "Fields.postQuery",
                        event: "onQuery",
                        post: true
                    }
                ]}
            ]},
            {"label": "Filter UI", "field": "filterUI", "visibilityGrid": false, "visibilityForm": true, nestedGridPosition: "form", doNotResolveVisibilityWithParent: true, "ui": "autocomplete", type: "string", options: ["json", "grid"]},
            {"label": "Filter", "field": "filterJSON", "visibilityGrid": false, "visibilityForm": true, nestedGridPosition: "form", doNotResolveVisibilityWithParent: true, "ui": "text", type: "string", when: "$filterUI=='json'"},
            {label: "Filters", field: "filterInfos", visibilityGrid: false, visibilityForm: true, ui: "grid", nestedGridPosition: "form", doNotResolveVisibilityWithParent: true, type: "object", "multiple": true, when: "$filterUI=='grid'", width: "200px", fields: [
                {"label": "Field", "field": "field", "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", upsert: true, collection: "pl.fields", displayField: "field", parameters: {collection: "$collection"}, filter: {"collectionid.collection": "$collection"}, mandatory: true, events: [
                    {
                        function: "Fields.postQuery",
                        event: "onQuery",
                        post: true
                    }
                ]},
                {"label": "Operator", "field": "operator", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", options: ["$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin"]},
                {"label": "Value", "field": "value", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", upsert: true, options: ["$$CurrentUser", "$$UserRoles"], mandatory: true},
                {"label": "AND/OR", "field": "logicalOperator", "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", options: ["AND", "OR"]}
            ]},
            {"label": "Fk Infos", field: "fkInfos", visibilityGrid: false, visibilityForm: true, ui: "grid", nestedGridPosition: "form", doNotResolveVisibilityWithParent: true, type: "object", "multiple": true, width: "200px", when: "$type==='fk'", fields: [
                {"label": "Field", "field": "field", "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", upsert: true, collection: "pl.fields", displayField: "field", parameters: {collection: "$collection"}, filter: {"collectionid.collection": "$collection"}, mandatory: true, events: [
                    {
                        function: "Fields.postQuery",
                        event: "onQuery",
                        post: true
                    }
                ]},
                {label: "Privilege", field: "privilegeid", visibilityGrid: false, visibilityForm: true, ui: "autocomplete", type: "fk", width: "200px", collection: "pl.rolePrivileges", displayField: "id", mandatory: true}
            ]}
        ]},
        {label: "FilterName", field: "filterName", visibilityGrid: false, visibilityForm: true, ui: "string", type: "string", width: "200px", nestedGridPosition: "form", when: "$type==='Collection' || $type==='Regex' || $type==='Default'"},
        {label: "Regex", field: "regex", visibilityGrid: false, visibilityForm: true, ui: "checkbox", type: "boolean", width: "200px", nestedGridPosition: "form", when: "$type==='Collection' || $type==='Regex' || $type==='Default'"},
        {label: "Show Result In JSON", field: "showResultInJSON", visibilityGrid: false, visibilityForm: true, ui: "checkbox", nestedGridPosition: "form", type: "boolean", width: "200px", when: "$type"},
        {label: "Resource", field: "resource", visibilityGrid: false, visibilityForm: true, ui: "text", type: "string", nestedGridPosition: "form", json: true, width: "200px", editableWhen: "false", when: "$showResultInJSON"},
        {label: "Operations", field: "actions", visibilityGrid: false, visibilityForm: true, ui: "text", type: "string", nestedGridPosition: "form", json: true, width: "200px", editableWhen: "false", when: "$showResultInJSON"},
        {label: "Views", field: "views", visibilityGrid: false, visibilityForm: true, ui: "text", type: "string", nestedGridPosition: "form", json: true, width: "200px", editableWhen: "false", when: "$showResultInJSON"}
    ]

    AppViews.__gaeportings__ = {"viewOptions": {refresh: true, width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, refreshDataOnLoad: true, viewControl: false, "id": "__gaeportings__", "label": "Porting details", "_id": "537b55fe2edb4ef819000025", "collection": "pl.gaemappings", "collection_id": "537b55fe2edb4ef81900001f", "actions": [
        {"label": "Port data", "type": "invoke", "onRow": true, "function": "GAEDataPorting.portData", "collectionid": {"collection": "pl.gaemappings", "_id": "537b55fe2edb4ef81900001f"}, "_id": "537b577a2edb4ef8190000be"},
        {"label": "Port All data", "async": true, "type": "invoke", "onRow": true, "function": "GAEDataPorting.portAllData", "collectionid": {"collection": "pl.gaemappings", "_id": "537b55fe2edb4ef81900001f"}, "_id": "537b577a2edb4ef8190000be", fields: [
            {"index": 1, "field": "targetDatabase", "label": "Target Database", "type": "string", "ui": "text"},
            {"index": 2, "field": "sourceDatabase", "label": "Source Database", "type": "string", "ui": "text"},
            {"index": 3, "field": "organizationId", "label": "Organization Id", "type": "string", "ui": "text"}
        ]}
    ], "fields": [
        {"index": null, "visibility": true, "field": "id", "label": "id", "type": "string", "ui": "text"},
        {"index": null, "visibility": true, "field": "jobname", "label": "Job name", "type": "string", "ui": "text"},
        {"index": null, "visibility": true, "field": "inprogress", "label": "inprogress", "type": "boolean", "ui": "checkbox"},
        {"index": null, "visibility": true, "field": "tableid", "label": "tableid", "type": "string", "ui": "text"},
        {"index": null, "visibility": true, "field": "ported", "label": "ported", "type": "number", "ui": "number"},
        {"index": null, "visibility": true, "field": "status", "label": "status", "type": "string", "ui": "text"},
        {"index": null, "visibility": true, "field": "totalcount", "label": "totalcount", "type": "string", "ui": "text"},
        {"index": null, "visibility": true, "field": "source", "label": "source", "type": "string", "ui": "text"},
        {"index": null, "visibility": true, "field": "excelfile", "label": "excel", "type": "file", "ui": "file"},
        {"index": null, "visibility": true, "field": "targetdatabase", "label": "Target Database", "type": "string", "ui": "text"},
        {"index": null, "visibility": true, "field": "portingtype", "label": "Porting type", "type": "string", "ui": "text"},
        {"index": null, "visibility": true, "field": "cursor", "label": "Cursor", "type": "string", "ui": "text"},
        {"index": null, "visibility": true, "field": "limit", "label": "Limit", "type": "string", "ui": "text"},
        {"index": null, "visibility": true, "field": "noofrecords", "label": "noofrecords", "type": "string", "ui": "text"},
        {"index": null, "visibility": true, "field": "noofprocess", "label": "noOfProcess", "type": "string", "ui": "text"},
        {"index": null, "visibility": true, "field": "pid", "label": "Process id", "type": "string", "ui": "text"},
        {"index": null, "visibility": true, "field": "startFromPreviousCursor", "label": "startFromPreviousCursor", "type": "boolean", "ui": "checkbox"},
        {"index": null, "visibility": true, "field": "skipTx", "label": "skipTx", "type": "boolean", "ui": "checkbox"},
        {"index": null, "visibility": true, "field": "skipCount", "label": "skipCount", "type": "boolean", "ui": "checkbox"},
        {"index": null, "visibility": true, "field": "sync", "label": "sync", "type": "boolean", "ui": "checkbox"},
        {"index": null, "visibility": true, "field": "stopporting", "label": "Stop porting", "type": "boolean", "ui": "checkbox"},
        {"index": null, "visibility": false, visibilityForm: true, "field": "processStatus", "label": "processStatus", "type": "object", multiple: true, "ui": "grid", fields: [
            {"index": null, "visibilityForm": true, "field": "process", "label": "Process", "type": "string", "ui": "text"},
            {"index": null, "visibilityForm": true, "field": "inprogress", "label": "in Progress", "type": "boolean", "ui": "checkbox"},
            {"index": null, "visibilityForm": true, "field": "status", "label": "status", "type": "string", "ui": "text"},
            {"index": null, "visibilityForm": true, "field": "cursor", "label": "cursor", "type": "number", "ui": "number"},
            {"index": null, "visibilityForm": true, "field": "endcursor", "label": "endcursor", "type": "number", "ui": "number"},
            {"index": null, "visibilityForm": true, "field": "ported", "label": "ported", "type": "number", "ui": "number"}
        ]},
        {"index": null, "visibility": false, visibilityForm: true, "field": "childMappings", "label": "child porting", "type": "object", multiple: true, "ui": "grid", fields: [
            {"index": null, "visibilityForm": true, "field": "index", "label": "Index", "type": "number", "ui": "number"},
            {"label": "Porting Id", "field": "id", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "fk", "width": "200px", collection: "pl.gaemappings", mandatory: true, displayField: "id", "fields": [
            ]},
            {"index": null, "visibilityForm": true, "field": "process", "label": "Process", "type": "string", "ui": "text"}

        ]}
    ], "queryGrid": {"$collection": "pl.gaemappings", $sort: {id: 1}}, "queryForm": {"$collection": "pl.gaemappings"}}}

    AppViews.__rolePrivileges__ = [
        {label: "Type", field: "type", visibilityGrid: false, visibilityForm: true, ui: "autocomplete", type: "string", width: "200px", options: ["Collection", "Default", "Regex", "Privilege"], mandatory: true},
        {label: "Privilege", field: "privilegeid", visibilityGrid: false, visibilityForm: true, ui: "autocomplete", type: "fk", width: "200px", collection: "pl.rolePrivileges", displayField: "id", filterable: true, when: "$type==='Privilege'"}
    ]
    AppViews.__rolePrivileges__.push.apply(AppViews.__rolePrivileges__, AppViews.__privileges__);
    AppViews.__createrole__ = {viewOptions: { width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, ui: "form", id: "__createrole__", showLabel: true, label: "Create Role", viewControl: false, resize: false, fields: [
        {label: "Id", field: "id", visibilityGrid: true, visibilityForm: true, ui: "text", width: "200px"},
        {label: "Role", field: "role", visibilityGrid: true, visibilityForm: true, ui: "text", width: "200px"},
        {label: "Span", field: "span", visibilityGrid: true, visibilityForm: true, ui: "number", type: "number", width: "200px"} ,
        {label: "New Role", field: "newRole", visibilityGrid: false, visibilityForm: true, ui: "checkbox", type: "boolean", width: "200px"} ,
        {"label": "Parent Role", "field": "parentroleid", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "fk", "width": "200px", collection: "pl.roles", displayField: "id"},
        {"label": "Do Not Synch", "field": "doNotSynch", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px"},
        {"label": "Group", "field": "group", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", editableWhen: false},
        {"label": "Default", "field": "default", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", editableWhen: false},
        {"label": "Application", "field": "applicationid", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", editableWhen: false},
        {"label": "Privileges", "field": "privileges", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", nestedGridPosition: "form", doNotResolveVisibilityWithParent: true, when: "!$group", "width": "200px", multiple: true, fields: AppViews.__rolePrivileges__},
        {"label": "Menus Availability", "field": "menusAvailability", "visibilityGrid": false, "visibilityForm": true, nestedGridPosition: "form", "ui": "autocomplete", type: "string", options: ["Exclude", "Include"]},
        {label: "Menus", field: "menuInfos", visibilityGrid: false, visibilityForm: true, ui: "grid", nestedGridPosition: "form", doNotResolveVisibilityWithParent: true, type: "object", "multiple": true, width: "200px", when: "$menusAvailability", fields: [
            {"label": "Menu", "field": "menu", "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "fk", collection: "pl.menus", displayField: "label", parameters: {applicationid: "$applicationid"}, filter: {"application.id": "$applicationid"}, mandatory: true}
        ]},
        {"label": "Child Roles", "field": "childRoles", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", nestedGridPosition: "form", "width": "200px", multiple: true, when: "this.group", fields: [
            {"label": "Application", "field": "appid", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", collection: "pl.applications", displayField: "id", filter: {group: {$ne: true}, newRole: true}, mandatory: true},
            {"label": "Role", "field": "role", filterable: true, "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "fk", "width": "200px", collection: "pl.roles", displayField: "id", filter: {applicationid: "$appid"}, parameters: {appid: "$appid"}, "fields": [
                {"label": "Span", "field": "span", "visibilityGrid": false, "visibilityForm": true, "ui": "number", type: "number", "width": "200px", editableWhen: "false"},
                {"label": "Group", "field": "group", "visibilityGrid": false, "visibilityForm": true, "ui": "number", type: "number", "width": "200px", editableWhen: "false"}
            ]}
        ]},
        {"label": "Roles", "field": "roles", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", nestedGridPosition: "form", "width": "200px", multiple: true, fields: [
            {"label": "Role", "field": "role", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "fk", "width": "200px", collection: "pl.roles", mandatory: true, displayField: "id", "fields": [
                {"label": "Span", "field": "span", "visibilityGrid": false, "visibilityForm": true, "ui": "number", type: "number", "width": "200px", editableWhen: "false"}
            ]}
        ]}
    ], collection: "pl.roles", "queryGrid": {"$collection": "pl.roles", $sort: {role: 1}}}};

    AppViews.__editrole__ = {viewOptions: { width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, ui: "grid", id: "__editrole__", showLabel: true, label: "Roles", viewControl: false, close: false, refreshDataOnLoad: true, resize: false, fields: AppViews.__createrole__.viewOptions.fields, collection: "pl.roles", "queryGrid": {"$collection": "pl.roles", $sort: {role: 1}, $limit: 50, $events: [
        {event: "onQuery", function: "MainCollectionEvents.executeResultForNavigation", post: true},
        {event: "onQuery", function: "MainCollectionEvents.onResult", post: false}
    ]}}};

    AppViews.__savedPrivileges__ = [
        {label: "Id", field: "id", visibilityGrid: true, visibilityForm: true, ui: "text", width: "200px", mandatory: true},
        {label: "Type", field: "type", visibilityGrid: false, visibilityForm: true, ui: "autocomplete", type: "string", width: "200px", options: ["Collection", "Default", "Regex"], mandatory: true}
    ]
    AppViews.__savedPrivileges__.push.apply(AppViews.__savedPrivileges__, AppViews.__privileges__);

    AppViews.__createroleprivileges__ = {viewOptions: { width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, ui: "form", id: "__createroleprivileges__", showLabel: true, label: "Create Role Privileges", viewControl: false, resize: false, fields: AppViews.__savedPrivileges__, collection: "pl.rolePrivileges", "queryGrid": {"$collection": "pl.rolePrivileges", $sort: {role: 1}}}};

    AppViews.__editroleprivilege__ = {viewOptions: { width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, ui: "grid", id: "__editroleprivilege__", showLabel: true, label: "Role Privileges", viewControl: false, close: false, refreshDataOnLoad: true, resize: false, fields: AppViews.__createroleprivileges__.viewOptions.fields, collection: "pl.roles", "queryGrid": {"$collection": "pl.rolePrivileges", $sort: {id: 1}, $limit: 50, $events: [
        {event: "onQuery", function: "MainCollectionEvents.executeResultForNavigation", post: true},
        {event: "onQuery", function: "MainCollectionEvents.onResult", post: false}
    ]}}};

    AppViews.__services__ = {"viewOptions": {data: "data", refreshDataOnLoad: true, "ui": "form", "id": "__services__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, "label": "Services", "fields": [
        {"label": "Id", "field": "id", visibility: true, mandatory: true, "ui": "text", "width": "200px", type: "string", group: "Default"} ,
        {"label": "Type", "field": "type", visibilityGrid: false, visibilityForm: true, "ui": "autocomplete", "width": "200px", mandatory: true, uiMandatory: true, type: "string", group: "Default", options: ["query", "function", "update", "batchquery"]} ,
        {"label": "Query", "field": "query", visibilityGrid: false, visibilityForm: true, "ui": "textarea", "width": "200px", mandatory: true, type: "string", json: true, group: "Default", when: "this.type=='query'"},
        {"label": "Function", "field": "function", visibilityGrid: false, visibilityForm: true, "ui": "text", "width": "200px", mandatory: true, type: "string", group: "Default", when: "this.type=='function'"},
        {"label": "Update", "field": "update", visibilityGrid: false, visibilityForm: true, "ui": "text", "width": "200px", mandatory: true, type: "string", group: "Default", when: "this.type=='update'"},
        {"label": "Batch Query", "field": "batchquery", visibilityGrid: false, visibilityForm: true, "ui": "textarea", "width": "200px", mandatory: true, type: "string", group: "Default", when: "this.type=='batchquery'"}
    ],
        "collection": "pl.services"
    }};

    AppViews.__editServices__ = {viewOptions: { width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, ui: "grid", id: "__editServices__", showLabel: true, label: "Services", viewControl: false, close: false, refreshDataOnLoad: true, resize: false, fields: AppViews.__services__.viewOptions.fields, collection: "pl.services", "queryGrid": {"$collection": "pl.services", $sort: {id: 1}, $limit: 50, $events: [
        {event: "onQuery", function: "MainCollectionEvents.executeResultForNavigation", post: true},
        {event: "onQuery", function: "MainCollectionEvents.onResult", post: false}
    ]}}};

    AppViews.__createapplication__ = {viewOptions: {width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, ui: "form", viewControl: false, resize: false, id: "__createapplication__", showLabel: true, label: "Create Application", fields: [
        {label: "Index", field: "index", visibilityGrid: true, visibilityForm: true, ui: "number", width: "200px"},
        {label: "Id", field: "id", visibilityGrid: true, visibilityForm: true, ui: "text", width: "200px", mandatory: true},
        {label: "Label", field: "label", visibilityGrid: true, visibilityForm: true, ui: "text", width: "200px", mandatory: true},
        {label: "Module Name", field: "moduleName", visibilityGrid: true, visibilityForm: true, ui: "text", width: "200px"},
        {label: "DB", field: "db", visibilityGrid: true, visibilityForm: true, ui: "text", width: "200px"},
        {"label": "Default Menu", "field": "defaultmenu", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "fk", "width": "200px", collection: "pl.menus", displayField: "label", filter: {application: "$current_application"}, parameters: {"current_application": "$_id"}},
        {label: "Default Role", field: "defaultRoleId", visibilityGrid: false, visibilityForm: true, ui: "autocomplete", type: "fk", width: "200px", collection: "pl.roles", displayField: "id"},
        {"label": "Do Not Synch", "field": "doNotSynch", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", "width": "200px"},
        {"label": "Un Publish", "field": "unpublished", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", "width": "200px"},
        {"label": "Group", "field": "group", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", "width": "200px"},
        {"label": "New Role", "field": "newRole", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", "width": "200px"},
        {"label": "Add Role To User", "field": "addRoleToUser", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", "width": "200px"},
        {label: "Roles", field: "roles", visibilityGrid: false, visibilityForm: true, resize: false, viewControl: false, ui: "grid", width: "200px", multiple: true, when: "!$group", fields: [
            {"label": "Role", "field": "role", filterable: true, "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "fk", "width": "200px", collection: "pl.roles", mandatory: true, displayField: "id"}
        ]},
        {label: "Collections", field: "collections", visibilityGrid: false, visibilityForm: true, resize: false, viewControl: false, ui: "grid", width: "200px", multiple: true, when: "!$group", fields: [
            {label: "Collection", field: "collection", visibilityGrid: false, visibilityForm: true, ui: "autocomplete", type: "string", width: "200px", collection: "pl.collections", displayField: "collection", mandatory: true}
        ]},
        {label: "Child Applications", field: "childApplications", visibilityGrid: false, visibilityForm: true, resize: false, viewControl: false, ui: "grid", width: "200px", multiple: true, when: "$group", fields: [
            {label: "Application", field: "application", visibilityGrid: false, visibilityForm: true, ui: "autocomplete", type: "fk", width: "200px", collection: "pl.applications", displayField: "id", mandatory: true, filter: {group: {$ne: true}}}
        ]},
        {label: "Setup", field: "setupViews", visibilityGrid: false, visibilityForm: true, resize: false, viewControl: false, ui: "grid", width: "200px", multiple: true, when: "!$group", fields: [
            {label: "Index", field: "index", visibilityGrid: false, visibilityForm: true, ui: "number", type: "number", width: "100px"},
            {label: "Label", field: "label", visibilityGrid: false, visibilityForm: true, ui: "text", type: "string", width: "200px"},
            {label: "View", field: "view", visibilityGrid: false, visibilityForm: true, ui: "autocomplete", type: "string", width: "200px", collection: "pl.qviews", displayField: "id", mandatory: true},
            {label: "UI", field: "ui", visibilityGrid: false, visibilityForm: true, ui: "text", type: "string", width: "200px"},
            {label: "limit", field: "limit", visibilityGrid: false, visibilityForm: true, ui: "number", type: "number", width: "200px"}
        ]}
    ], collection: "pl.applications"}};

    AppViews.__editapplication__ = {viewOptions: {width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, ui: "grid", viewControl: false, resize: false, close: false, id: "__editapplication__", showLabel: true, label: "Applications", refreshDataOnLoad: true, fields: AppViews.__createapplication__.viewOptions.fields, collection: "pl.applications",
        queryGrid: {$collection: "pl.applications", $sort: {label: 1}, $limit: 50, $events: [
            {event: "onQuery", function: "MainCollectionEvents.executeResultForNavigation", post: true},
            {event: "onQuery", function: "MainCollectionEvents.onResult", post: false}
        ]},
        actions: [
            {"label": "Menus", "type": "view", qviews: [
                {id: "__editemenu__"}
            ], "onRow": true, parameters: {"currentappid": "$_id"}}
        ]
    }};

    AppViews.__userNotifications__ = {"viewOptions": {"ui": "grid", "id": "__userNotifications__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, insert: false, close: true, showLabel: true, refreshDataOnLoad: true, refresh: false, viewControl: false, "label": "User Notifications", "fields": [
        {"label": "Notification", "field": "notificationid", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string", editableWhen: "false"},
        {"label": "Status", "field": "status", "visibilityGrid": true, "visibilityForm": true, type: "string", "ui": "autocomplete", type: "string", options: ["On", "Off"]}
    ], "collection": "dummyUserNotifications"}};

    AppViews.__processes__ = {"viewOptions": {"ui": "grid", "id": "__processes__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, edit: false, insert: false, close: true, showLabel: true, refreshDataOnLoad: true, refresh: false, viewControl: false, "label": "Processes", "fields": [
        {"label": "Name", "field": "name", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string", filterable: true},
        {"label": "Status", "field": "status", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string", filterable: true},
        {"label": "Total", "field": "total", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string"},
        {"label": "Processed", "field": "processed", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string"},
        {"label": "Error Count", "field": "errorCount", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string"},
        {"label": "Date", "field": "date", "visibilityGrid": true, "visibilityForm": true, "ui": "date", type: "date", "time": true},
        {"label": "Details", "field": "detail", visibilityForm: true, "ui": "grid", type: "object", fields: [
            {"label": "Index", "field": "index", "visibilityForm": true, "ui": "number", type: "number"},
            {"label": "Message", "field": "message", "visibilityForm": true, "ui": "text", type: "string"},
            {"label": "Status", "field": "status", "visibilityForm": true, "ui": "text", type: "string"},
            {"label": "Error", "field": "error", "visibilityForm": true, "ui": "text", type: "string"},
            {"label": "Processed", "field": "processed", "visibilityForm": true, "ui": "text", type: "number"}

        ]}
    ], "collection": "pl.processes", queryGrid: {$collection: "pl.processes", $filter: {"user._id": "$user._id"}, $fields: {name: 1, status: 1, total: 1, processed: 1, date: 1, errorCount: 1}, $limit: 10, $sort: {_id: -1}}, queryForm: {$collection: "pl.processes", $fields: {detail: 1}}}};


    AppViews.__logs__ = {"viewOptions": {"ui": "grid", "id": "__logs__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refreshDataOnLoad: true, refresh: false, viewControl: false, "label": "Logs", "fields": [

        {"label": "URL", "field": "url", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string"},
        {"label": "Type", "field": "type", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string"},
        {"label": "Info", "field": "info", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string"},
        {"label": "Username", "field": "username", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string"},
        {"label": "Start Time", "field": "startTime", "visibilityGrid": true, "visibilityForm": true, "ui": "date", type: "date"},
        {"label": "End Time", "field": "endTime", "visibilityGrid": true, "visibilityForm": true, "ui": "date", type: "date" },
        {"label": "Total Time", "field": "totalTime", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string"},
        {"label": "Count", "field": "count", "visibilityGrid": true, "visibilityForm": true, "ui": "number", type: "number"},
        {"label": "Logs", "field": "logs", visibilityForm: true, "ui": "grid", type: "object", fields: [
            {"label": "Type", "field": "type", "visibilityForm": true, "ui": "text", type: "string"},
            {"label": "Log", "field": "log", "visibilityForm": true, "ui": "text", type: "string"},
            {"label": "Status", "field": "status", "visibilityForm": true, "ui": "text", type: "string"},
            {"label": "Error", "field": "error", "visibilityForm": true, "ui": "text", type: "string"},
            {"label": "Start Time", "field": "startTime", "visibilityForm": true, "ui": "date", type: "date"},
            {"label": "End Time", "field": "endTime", "visibilityForm": true, "ui": "date", type: "date"},
            {"label": "Total Time", "field": "totalTime", "visibilityForm": true, "ui": "text", type: "string"}
        ]}


    ], "collection": "pl.logs", queryGrid: {$collection: "pl.logs", $fields: {url: 1, info: 1, username: 1, startTime: 1, endTime: 1, totalTime: 1}, $limit: 10, $sort: {_id: -1}, $filter: {token: "$token"}}, queryForm: {$collection: "pl.logs", $fields: {logs: 1}}}};

    AppViews.__commitlogs__ = {"viewOptions": {"ui": "grid", "id": "__commitlogs__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: false, showLabel: true, refreshDataOnLoad: true, refresh: false, viewControl: false, "label": "Commit Logs", "fields": [
        {"label": "Info", "field": "info", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string"},
        {"label": "Type", "field": "type", "visibilityGrid": true, "visibilityForm": true, "ui": "autocomplete", type: "string", options: ["Commit", "SetFields", "EnsureIndexes", "SlowQuery"], filterable: true},
        {"label": "Status", "field": "status", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string"},
        {"label": "Error", "field": "error", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string"},
        {"label": "Username", "field": "username", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", type: "boolean"},
        {"label": "Start Time", "field": "startTime", "visibilityGrid": true, "visibilityForm": true, "ui": "date", type: "date"},
        {"label": "End Time", "field": "endTime", "visibilityGrid": true, "visibilityForm": true, "ui": "date", type: "date" },
        {"label": "Total Time", "field": "totalTime", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string"}
    ], "collection": "pl.logs", queryGrid: {$collection: "pl.logs", $fields: {url: 1, info: 1, username: 1, startTime: 1, endTime: 1, totalTime: 1, status: 1, error: 1}, $limit: 10, $sort: {_id: -1}, $filter: {type: "Commit"}}, queryForm: {$collection: "pl.logs"}}};

    AppViews.__collectionfields__ = [
        {"label": "Field", "field": "field", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "100px", group: "Default", ftsEnable: true, freeze: true, sortable: true, filterable: true, ftsEnable: true},
        {"label": "Index", "field": "index", "visibilityGrid": true, "visibilityForm": true, "ui": "number", "width": "40px", group: "Default", sortable: true},
        {"label": "Index Grid", "field": "indexGrid", "visibilityGrid": true, "visibilityForm": true, "ui": "number", "width": "40px", group: "grid"},
        {"label": "Index Form", "field": "indexForm", "visibilityGrid": true, "visibilityForm": true, "ui": "number", "width": "40px", group: "form"},
        {"label": "Label", "field": "label", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "100px", group: "Default", ftsEnable: true},
        {"label": "Type", "field": "type", "visibilityGrid": true, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "100px", options: ["boolean", "currency", "date", "decimal", "daterange", "duration", "file", "fk", "integer", "json", "number", "objectid", "object", "schedule", "sequence", "string", "unit", "emailid", "phonenumber"], group: "Default", filterable: true},
        {"label": "UI", "field": "ui", "visibilityGrid": true, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "100px", "options": ["autocomplete", "checkbox", "currency", "date", "daterange", "dragAndDrop", "duration", "file", "googlePlace", "grid", "html", "image", "json", "number", "rte", "schedule", "text", "textarea", "time", "unit", "radio", "anchor", "select"], group: "Default", filterable: true},
        {"label": "Mobile", "field": "mobile", "when": "this.type == 'phonenumber'", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "80px", group: "Default"},
        {"label": "Json", "field": "json", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "60px", group: "Default"},
        {"label": "HTML", "field": "html", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", type: "string", when: "this.ui=='html'", group: "Default"},
        {"label": "Visibility", "field": "visibility", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", "width": "60px", group: "Default"},
        {"label": "Header Freeze", "field": "headerFreeze", "when": "this.ui == 'grid'", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "80px", group: "Default"},
        {"label": "toFixed", "field": "toFixed", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", type: "string", when: "this.ui=='currency' || this.ui=='duration'  || this.ui=='number'", group: "Default"},
        {"label": "toFixedAggregate", "field": "toFixedAggregate", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", type: "string", when: "this.ui=='currency' || this.ui=='duration'  || this.ui=='number'", group: "Default"},
        {"label": "Hide Unit", "field": "hideUnit", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "boolean", when: "this.ui=='currency' || this.ui=='duration'", group: "Default"},
        {"label": "Style", "field": "colStyle", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", type: "string", group: "Default"},
        {"label": "Freeze", "field": "freeze", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "boolean", group: "Default"},
        {"label": "Word Wrap", "field": "wordWrap", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "boolean", group: "Default"},
        {"label": "To Lower Case", "field": "toLowerCase", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "boolean", group: "Default", when: "this.type == 'string' || this.type =='sequence'"},
        {"label": "Use  Lower Case", "field": "useLowerCase", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "boolean", group: "Default", when: "this.type == 'fk'"},
        {"label": "Primary", "field": "primary", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "boolean", group: "Default"},
        {"label": "Time", "field": 'time', "visibilityGrid": false, "visibilityForm": true, "when": "this.ui == 'date'", "group": "Default", "width": "200px", "ui": "checkbox"},
        {"label": "RefferedCollection", "field": "collection", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", group: "Default", "collection": "pl.collections", displayField: "collection", type: "string", when: "this.ui=='autocomplete'", filterable: true},
        {"label": "Parent Field Id", "field": "parentfieldid", "visibilityGrid": true, "visibilityForm": true, "ui": "autocomplete", type: "fk", collection: "pl.fields", displayField: "field", otherDisplayFields: ["label"], "width": "100px", group: "Default", filter: {collectionid: "$collection_id"}, parameters: {collection_id: "$collection_id"}, filterable: true},
        {"label": "Recursion", "field": "recursion", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", type: "string", group: "Default", when: "this.ui=='autocomplete'"},
        {"label": "Display Field", "field": "displayField", "upsert": true, "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", group: "Default", collection: "pl.fields", displayField: "field", parameters: {refferedcollection: "$collection"}, filter: {"collectionid.collection": "$refferedcollection"}, when: "this.ui=='autocomplete'"},
        {"label": "Self Recursive", "field": "selfRecursive", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", group: "Default", collection: "pl.fields", when: "this.ui=='autocomplete'", "options": ["on", "off"]},
        {"label": "Sort", "field": "sort", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "100px", group: "Default", when: "this.ui=='autocomplete'"},
        {"label": "Other Display Field", "field": "otherDisplayFields", "upsert": true, "visibilityGrid": false, multiple: true, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", group: "Default", collection: "pl.fields", displayField: "field", parameters: {refferedcollection: "$collection"}, filter: {"collectionid.collection": "$refferedcollection"}, when: "this.ui=='autocomplete'"},
        {"label": "setFields", "field": "set", "upsert": true, "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", collection: "pl.fields", displayField: "field", parameters: {refferedcollection: "$collection"}, filter: {"collectionid.collection": "$refferedcollection"}, when: "this.ui=='autocomplete'"},
        {"label": "Non Persistent", "field": "nonPersistent", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", "width": "60px", group: "Default"},
        {"label": "Role", "field": "roleid", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", collection: "pl.roles", displayField: "id", type: "fk", group: "Default", when: "this.type=='fk'"},
        {"label": "Transient", "field": "transient", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "60px", group: "Default"},
        {"label": "Aggregate", "field": "aggregate", "visibilityGrid": false, "visibilityForm": true, type: "string", "ui": "autocomplete", options: ["sum", "avg"], "width": "100px", group: "Default"},
        {"label": "Aggregate Defination", "field": "aggregateDefination", "visibilityGrid": false, "visibilityForm": true, type: "string", "ui": "text", "width": "100px", group: "Default"},
        {"label": "Field Group", "field": "fieldGroup", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "100px", group: "Default"},
        {"label": "Form Group", "field": "group", visibility: true, "ui": "autocomplete", type: "fk", "width": "100px", collection: "pl.formgroups", group: "Default", displayField: "title", set: ["title"], filter: {collectionid: "$collection_id"}, parameters: {collection_id: "$collection_id"}},
        {"label": "Referred View", "field": "referredView", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", "json": true, "width": "200px", group: "Default"},
        {"label": "Responsive Columns", "field": "responsiveColumns", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", "json": true, "width": "200px", group: "Default"},
        {"label": "When", "field": "when", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "Default" },
        {"label": "Referred When", "field": "referredWhen", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "Default" },
        {"label": "Editable When", "field": "editableWhen", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "Default" },
        {"label": "Form Type", "field": "formType", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "type": "string", "options": ["Short", "Descriptive"], "width": "200px", group: "Default" },
        {"label": "Custom Filter", "field": "customFilter", "visibilityGrid": false, "visibilityForm": true, "when": "this.ui == 'date'", "ui": "json", type: "json", "width": "200px", group: "Default"},
        {"label": "Upsert", "field": "upsert", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default", when: "this.ui=='autocomplete'" },
        {"label": "Upsert Fields", "field": "upsertFields", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", collection: "pl.fields", displayField: "field", parameters: {refferedcollection: "$collection"}, filter: {"collectionid.collection": "$refferedcollection"}, when: "this.ui=='autocomplete'"},
        {"label": "Cascade", "field": "cascade", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default", when: "this.ui=='autocomplete'" },
        {"label": "Hyperlink Enabled", "field": "hyperlinkEnabled", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "Cache", "field": "cache", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default", when: "this.ui=='autocomplete'  || this.ui =='currency' " },
        {"label": "Multiple", "field": "multiple", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "Mandatory", "field": "mandatory", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "UI Mandatory", "field": "uiMandatory", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "Options", "field": "options", "visibilityGrid": false, "visibilityForm": true, "ui": "json", type: "json", "width": "200px", group: "Default", when: "this.ui=='autocomplete' || this.ui=='select' "},
        {"label": "Radio Options", "field": "radioOptions", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", multiple: true, options: [], upsert: true, "width": "200px", group: "Default", when: "this.ui=='radio'"},
        {"label": "Supported Extensions", "field": "supportedExtensions", "visibilityGrid": false, multiple: true, "visibilityForm": true, "ui": "autocomplete", type: "string", upsert: true, options: [".xlsx", ".png", ".jpeg", ".jpg", ".gif", ".tif", ".txt"], "width": "200px", group: "Default", when: "this.type=='file' || this.ui=='image'"},
        {"label": "Anchor Target", "field": "anchorTarget", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", multiple: true, options: [], upsert: true, "width": "200px", group: "Default", when: "this.ui=='anchor'"},
        {"label": "Recursive Filter", "field": "recursiveFilter", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default", when: "this.filterable==true"},
        {"label": "Validate In Excel", "field": "validateInExcel", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "Unit Editable When", "field": "unitEditableWhen", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "Default", when: "this.type==='currency' || this.type==='duration'"},
        {"label": "Recursive Filter Field", "field": "recursiveFilterField", "visibilityGrid": true, "visibilityForm": true, "ui": "autocomplete", "collection": "pl.fields", displayField: "field", "upsert": true, filter: {"collectionid.collection": "$collection_id"}, parameters: {"collection_id": "$collection"}, type: "string", "width": "200px", group: "Default", when: "this.recursiveFilter"},
        {"label": "Upload Limit(In Bytes)", "field": "uploadLimit", "visibilityGrid": true, "visibilityForm": true, "ui": "number", "width": "40px", group: "Default", when: "this.type==='file'"},
        {"label": "FilterSpace", "field": "filterspace", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", group: "Default", "collection": "pl.filterspace", displayField: "space", type: "string", when: "this.ui=='autocomplete'"},
        {"label": "Filter", "field": "filter", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "Default", when: "this.ui=='autocomplete' || this.ui=='currency'"},
        {"label": "Visibility Filter", "field": "visibilityFilter", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", "options": ["Always"], group: "Default"},
        {"label": "Default Filter", "field": "defaultFilter", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", group: "Default"},
        {"label": "Parameters", "field": "parameters", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "Default", when: "this.ui=='autocomplete' || this.ui=='currency'"},
        {"label": "Width", "field": "width", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "Default"},
        {"label": "Auto Width Column", "field": "autoWidthColumn", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "Update", "field": "update", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "Filterable", "field": "filterable", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "Boolean Filter Mapping", "field": "booleanFilterMapping", "visibilityGrid": false, "visibilityForm": true, "ui": "json", type: "json", when: "this.filterable && this.ui=='checkbox'", "width": "200px", group: "Default"},
        {"label": "Multiple Filterable", "field": "multipleFilterable", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "Sortable", "field": "sortable", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "Groupable", "field": "groupable", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "Aggregatable", "field": "aggregatable", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "Show Null Filter", "field": "showNullFilter", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "boolean", group: "Default"},
        //this field is added.If a user enable this field then he can filter the field for checking null values
        {"label": "FTS Enable", "field": "ftsEnable", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "Events", "field": "events", "json": true, "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", type: "string", group: "Default", "when": "this.ui == 'autocomplete'"},
        {"label": "Collection Id", "field": "collectionid", "visibilityGrid": false, "visibilityForm": false, "ui": "autocomplete", "width": "200px", collection: "pl.collections", displayField: "collection", type: "fk", group: "Default"},
        {"label": "Visibility Grid", "field": "visibilityGrid", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "grid"},
        {"label": "Visibility Form", "field": "visibilityForm", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "form"},
        {"label": "When Grid", "field": "whenGrid", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "grid" },
        {"label": "When Form", "field": "whenForm", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "form" },
        {"label": "Editable When Grid", "field": "editableWhenGrid", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "grid" },
        {"label": "Editable When Form", "field": "editableWhenForm", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "form" },
        {"label": "Image Field", "field": "imageField", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", group: "Default", collection: "pl.fields", displayField: "field", parameters: {refferedcollection: "$collection"}, filter: {"collectionid.collection": "$refferedcollection", "ui": "image"}, when: "this.ui=='autocomplete'"},

        {"label": "Ui Grid", "field": "uiGrid", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "grid"},
        {"label": "Ui Form", "field": "uiForm", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "form"},

        {"label": "Query", "field": "query", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "json": true, "width": "200px", group: "form", type: "string", when: "this.type=='object'"}     ,

        {"label": "On View", "field": "customizationEnabled", index: 72, "visibilityGrid": true, "visibilityForm": false, "ui": "checkbox", "type": "boolean", "width": "100px", "editableWhenGrid": "false", "filterable": true},
        {"label": "On Qview", "field": "qviewEnabled", "visibilityGrid": true, index: 73, "visibilityForm": false, "ui": "checkbox", "type": "boolean", "width": "100px", "editableWhenGrid": "false", "filterable": true},
        {"label": "Alias", "field": "alias", "visibilityGrid": false, index: 75, "visibilityForm": true, "ui": "text", "type": "string", "width": "100px", "filterable": true},
        {"label": "Drill Down Enabled", "field": "drillDownEnabled", "visibilityGrid": false, index: 74, "visibilityForm": true, "ui": "checkbox", "type": "boolean", "width": "100px", "filterable": true},
        {"label": "Drill Down Value", "field": "drillDownValue", "visibilityGrid": false, index: 75, "visibilityForm": true, "ui": "text", "type": "string", "width": "100px", "filterable": true},
        {"label": "Drill Down Unwind", "field": "drillDownUnwind", "visibilityGrid": false, index: 75, "visibilityForm": true, "ui": "text", "type": "string", "width": "100px", "filterable": true}
    ];

    AppViews.__addfield__ = {"viewOptions": {"ui": "form", "id": "__addfield__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, viewControl: false, saveOptions: {editMode: true}, "label": "Add Field", "fields": angular.copy(AppViews.__collectionfields__),
        events: [
            {
                function: {source: "ApplaneFunctions/lib/AppSystemEvents",
                    name: "onInsert"},
                event: "onInsert"
            },
            {
                function: {source: "ApplaneFunctions/lib/AppSystemEvents",
                    name: "onValueChange", type: "js"},
                event: "onValue:[\"type\", \"ui\", \"parentfieldid\"]"
            }
        ], "collection": "pl.fields", groups: [
            {title: "Default", label: "Default", separator: true, showTitle: false, showLabel: true},
            {title: "grid", label: "grid", separator: true, showTitle: true, showLabel: true},
            {title: "form", label: "form", separator: true, showTitle: true, showLabel: true}
        ], queryGrid: {$collection: "pl.fields", $limit: 1000, $filter: {collectionid: "$collection_id", __system__: {$ne: true}}, $sort: {field: 1}, $events: [
            {
                function: "Fields.populateCustomizationIndicators",
                event: "onQuery",
                post: true
            }
        ]},
        queryForm: {$collection: "pl.fields", $filter: {collectionid: "$collection_id"}}}};

    AppViews.__editfield__ = { "viewOptions": {refreshDataOnLoad: true, "ui": "grid", "id": "__editfield__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, navigation: true, showLabel: true, refresh: false, viewControl: false, "label": "Fields", "fields": AppViews.__addfield__.viewOptions.fields,
        events: AppViews.__addfield__.viewOptions.events,
        "collection": "pl.fields", groups: [
            {title: "Default", label: "Default", separator: true, showTitle: false, showLabel: true},
            {title: "grid", label: "grid", separator: true, showTitle: true, showLabel: true},
            {title: "form", label: "form", separator: true, showTitle: true, showLabel: true}
        ], actions: [
            {"id": "addToCustomization", "label": "Add To View", visibility: true, "type": "invoke", "function": "Fields.addFields", "onHeader": true, "requireSelectedRows": true, "requestView": true, parameters: {"sourceid": "$sourceid", "addToCustomization": true, "view__id": "$viewid"}, when: "$sourceid"} ,
            {"id": "addToQview", "label": "Add To Qview", visibility: true, "type": "invoke", "function": "Fields.addFields", "onHeader": true, "requireSelectedRows": true, "requestView": true, parameters: {"sourceid": "$sourceid", "addToQview": true, "view__id": "$viewid"}},
            {label: "View Fields", type: "view", qviews: [
                {id: "__selfquickviewfieldcustomization__"}
            ], parameters: {"collection_id": "$collection_id", sourceid: "$sourceid", "view_id": "$view_id", "viewid": "$viewid", "customizationFields": true}, when: "$sourceid"},
            {label: "Q Fields", type: "view", qviews: [
                {id: "__selfquickviewfield__"}
            ], parameters: {"collection_id": "$collection_id", sourceid: "$sourceid", "view_id": "$view_id", "viewid": "$viewid", "qviewFields": true}}
        ], queryGrid: AppViews.__addfield__.viewOptions.queryGrid, queryForm: AppViews.__addfield__.viewOptions.queryForm}};


    AppViews.__selfquickviewfieldcustomization__ = {popup: true, "viewOptions": {setAsNull: true, refreshDataOnLoad: true, "ui": "grid", "id": "__selfquickviewfieldcustomization__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, viewControl: false, "insert": false, "label": "Fields", "fields": [
        {"label": "Q Fields", "field": "qFields", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", multiple: true, type: "object", "when": "this.ui == 'grid' || this.ui == 'form'", fields: angular.copy(AppViews.__collectionfields__)  }
    ], viewFields: ["qFields"], "collection": "pl.qviewcustomizations", groups: [
        {title: "Default", label: "Default", separator: false, showTitle: false, showLabel: true}
    ], queryGrid: {
        $collection: "pl.qviewcustomizations", "$fields": {"qFields": 1}, $events: [
            {function: "QviewCustomizations.mergeFieldsOnResult", event: "onQuery", post: true},
            {function: "QviewCustomizations.onPreSave", event: "onPreSave", "pre": true}
        ], "$parameters": {"customizationFields": true}
    }, queryForm: {$collection: "pl.qviewcustomizations", "$filter": {_id: "$sourceid"}}
    }}
    AppViews.__selfquickviewfield__ = {popup: true, "viewOptions": {setAsNull: true, refreshDataOnLoad: true, "ui": "grid", "id": "__selfquickviewfield__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, viewControl: false, "insert": false, "label": "Qview Fields", "fields": [
        {"label": "Q Fields", "field": "qFields", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", multiple: true, type: "object", "when": "this.ui == 'grid' || this.ui == 'form'", fields: angular.copy(AppViews.__collectionfields__)}
    ], viewFields: ["qFields"], "collection": "pl.qviews", groups: [
        {title: "Default", label: "Default", separator: false, showTitle: false, showLabel: true}
    ], queryGrid: {
        $collection: "pl.qviews", "$fields": {"qFields": 1}, $events: [
            {function: "QviewCustomizations.mergeFieldsOnResult", event: "onQuery", post: true}
        ], "$parameters": {"qviewFields": true}
    }, queryForm: {$collection: "pl.qviews", "$filter": {_id: "$view_id"}}
    }}

    AppViews.__quickviewfields__ = [
        {"label": "Id", "field": "id", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "200px", group: "Default", "referredView": {"id": "$id", "parameters": {"id": "$id"}}},
        {"label": "Label", "field": "label", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "200px", group: "Default"},
        {"label": "Index", "field": "index", "visibilityGrid": true, "visibilityForm": true, "ui": "number", "width": "200px", group: "Default"},
        {"label": "UI", "field": "ui", "visibilityGrid": true, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", "options": ["grid", "form", "dashboard", "html", "aggregate", "aggregateGrid", "graph", "composite"], group: "Default"},
        {"label": "Width", "field": "width", "visibilityGrid": true, "visibilityForm": true, "ui": "number", type: "number", "width": "200px", group: "Default", "when": "this.ui == 'graph'"},
        {"label": "Height", "field": "height", "visibilityGrid": true, "visibilityForm": true, "ui": "number", type: "number", "width": "200px", group: "Default", "when": "this.ui == 'graph'"},
        {"label": "Font Size", "field": "fontSize", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", group: "Default", "when": "this.ui == 'graph'"},
        {"label": "Graph Type", "field": "graphType", "visibilityGrid": true, "visibilityForm": true, "when": "this.ui=='graph'", "ui": "autocomplete", type: "string", "width": "200px", "options": ["bar-chart", "pie-chart"], group: "Default"},
        {"label": "X-axis Field", "field": "xAxisField", "visibilityGrid": true, "visibilityForm": true, "when": "this.ui=='graph' && this.graphType=='bar-chart'", "ui": "text", type: "string", "width": "200px", group: "Default"},
        {"label": "X-axis Scale", "field": "xAxisScale", "visibilityGrid": false, "visibilityForm": true, "when": "this.ui=='graph' && this.graphType=='bar-chart'", "ui": "checkbox", type: "boolean", "width": "200px", group: "Default"},
        {"label": "Bar Graph Type", "field": "barGraphType", "visibilityGrid": false, "visibilityForm": true, "when": "this.ui=='graph' && this.graphType=='bar-chart'", "ui": "autocomplete", type: "string", "width": "200px", options: ["grouped", "simple"], group: "Default"},
        {"label": "Tiny Mode", "field": "tinyMode", "visibilityGrid": false, "visibilityForm": true, "when": "this.ui=='graph' && this.graphType=='bar-chart' && this.barGraphType!='grouped'", "ui": "checkbox", type: "boolean", "width": "200px", group: "Default"},
        {"label": "Bar Width For Tiny Mode", "field": "barWidthForTinyMode", "visibilityGrid": true, "visibilityForm": true, "ui": "number", type: "number", "width": "200px", group: "Default", "when": "this.ui == 'graph' && this.graphType=='bar-chart' && this.tinyMode && this.barGraphType!='grouped'"},
        {"label": "Y-axis Field", "field": "yAxisField", "visibilityGrid": true, "visibilityForm": true, "when": "this.ui=='graph' && this.graphType=='bar-chart' && this.barGraphType!='grouped'", "ui": "text", type: "string", "width": "200px", group: "Default"},
        {"label": "Y-axis Scale", "field": "yAxisScale", "visibilityGrid": false, "visibilityForm": true, "when": "this.ui=='graph' && this.graphType=='bar-chart'", "ui": "checkbox", type: "boolean", "width": "200px", group: "Default"},
        {"label": "Show Legend", "field": "showLegend", "visibilityGrid": false, "visibilityForm": true, "when": "this.ui=='graph' && this.graphType=='bar-chart'", "ui": "checkbox", type: "boolean", "width": "200px", group: "Default"},
        {"label": "Colors(Hash Code)", "field": "colors", "visibilityGrid": false, "visibilityForm": true, "when": "this.ui=='graph' && this.graphType=='bar-chart'", "ui": "text", type: "string", multiple: true, "width": "200px", group: "Default"},
        {"label": "Show Tool Tip", "field": "showToolTip", "visibilityGrid": false, "visibilityForm": true, "when": "this.ui=='graph' && this.graphType=='bar-chart'", "ui": "checkbox", type: "boolean", "width": "200px", group: "Default"},
        {"label": "Legend Width", "field": "legendWidth", "visibilityGrid": true, "visibilityForm": true, "ui": "number", type: "number", "width": "200px", group: "Default", "when": "this.ui=='graph' && this.graphType=='bar-chart'"},
        {"label": "Show Text On Bar", "field": "showTextOnBar", "visibilityGrid": false, "visibilityForm": true, "when": "this.ui=='graph' && this.graphType=='bar-chart'", "ui": "checkbox", type: "boolean", "width": "200px", group: "Default"},
        {"label": "Show Horizontal Grid Line", "field": "showHorizontalGridLine", "visibilityGrid": false, "visibilityForm": true, "when": "this.ui=='graph' && this.graphType=='bar-chart'", "ui": "checkbox", type: "boolean", "width": "200px", group: "Default"},
        {"label": "Margin", "field": "margin", "visibilityGrid": false, "visibilityForm": true, "when": "this.ui=='graph' && this.graphType=='bar-chart'", "ui": "text", type: "string", json: true, "width": "200px", group: "Default"},
        {"label": "Arc Label", "field": "arcLable", "visibilityGrid": true, "visibilityForm": true, "when": "this.ui=='graph' && this.graphType=='pie-chart'", "ui": "text", type: "string", "width": "200px", group: "Default"},
        {"label": "Arc Value", "field": "arcValue", "visibilityGrid": true, "visibilityForm": true, "when": "this.ui=='graph' && this.graphType=='pie-chart'", "ui": "text", type: "string", "width": "200px", group: "Default"},
        {"label": "Dashboard Layout", "field": "dashboardLayout", "visibilityGrid": true, "visibilityForm": true, "ui": "autocomplete", type: "string", "options": ["1 Column", "2 Columns", "3 Columns", "4 Columns", "5 Columns", "6 Columns", "7 Columns", "8 Columns", "9 Columns", "10 Columns"], "width": "200px", group: "Default"},
        {"label": "Quick View Style", "field": "qViewStyle", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", type: "string", group: "Other Info", "when": "this.ui == 'grid'"},
        {"label": "Responsive Columns", "field": "responsiveColumns", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", group: "Other Info", "when": "this.ui == 'grid'"},
        {"label": "Primary Field", "field": "primaryField", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "collection": "pl.fields", displayField: "field", "upsert": true, filter: {collectionid: "$collection_id"}, parameters: {"collection_id": "$collection_id"}, type: "string", "width": "200px", group: "Other Info", "when": "this.ui == 'grid' || this.ui == 'form'"},
        {"label": "Template", "field": "template", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", when: "this.ui == 'html'", group: "Default"},
        {"label": "Template Type", "field": "templateType", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", "options": ["ejs", "xslt"], when: "this.ui == 'html'", group: "Default"},
        {"label": "DashboardType", "field": "dashboardType", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", "options": ["AutoHeight", "FixedHeight", "AdvanceDashboard"], group: "Default", "when": "this.ui == 'dashboard'"},
        {"label": "Insert View", "field": "insertView", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "collection": "pl.qviews", displayField: "id", "width": "200px", group: "Default", "when": "this.dashboardType != 'AdvanceDashboard'"},
        {"label": "Detail View", "field": "detailView", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "collection": "pl.qviews", displayField: "id", "width": "200px", group: "Default", "when": "this.dashboardType != 'AdvanceDashboard'"},
        {"label": "Group Count Disabled", "field": "groupCountDisabled", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "Insert View Detail", "field": "insertViewDetail", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", json: true, "width": "200px", group: "Default", "when": "this.dashboardType != 'AdvanceDashboard'"},
        {"label": "Drilldown View", "field": "drildownView", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "collection": "pl.collections", displayField: "collection", "width": "200px", group: "Default", "when": "this.dashboardType != 'AdvanceDashboard'"},
        {"label": "Drilldown View Detail", "field": "drildownViewDetail", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", json: true, "width": "200px", group: "Default", "when": "this.dashboardType != 'AdvanceDashboard'"},
        {"label": "List View", "field": "listView", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "collection": "pl.collections", displayField: "collection", "width": "200px", group: "Default", "when": "this.dashboardType != 'AdvanceDashboard'"},
        {"label": "List View Detail", "field": "listViewDetail", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", json: true, "width": "200px", group: "Default", "when": "this.dashboardType != 'AdvanceDashboard'"},
        {"label": "Collection", "field": "collection", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", collection: "pl.collections", displayField: "collection", type: "fk", group: "Default"},
        {"label": "Main Collection", "field": "mainCollection", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", collection: "pl.collections", displayField: "collection", type: "fk", group: "Default", "filterable": true},
        {"label": "Aggregate Type", "field": "aggregateType", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", options: ["range", "as_on", "due", "forecast", "expression"], "width": "200px", group: "Default", when: "this.ui == 'aggregate'"},
        {"label": "Aggregate Expression", "field": "aggregateExpression", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", group: "Default", when: "this.aggregateType == 'expression'"},
        {"label": "Do Not Synch", "field": "doNotSynch", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", group: "Default"},
        {"label": "Value", "field": "value", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", group: "Default", collection: "pl.fields", displayField: "field", parameters: {refferedcollection: "$collection.collection"}, filter: {"collectionid.collection": "$refferedcollection", "type": {"$in": ["duration", "currency", "number"]}}, when: "this.ui == 'aggregate'"},
        {"label": "Date", "field": "date", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", group: "Default", collection: "pl.fields", displayField: "field", parameters: {refferedcollection: "$collection.collection"}, filter: {"collectionid.collection": "$refferedcollection", "type": "date"}, when: "this.aggregateType === 'range' || this.aggregateType == 'as_on' || this.aggregateType == 'forecast'"},
        {"label": "Due Date", "field": "dueDate", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", group: "Default", collection: "pl.fields", displayField: "field", parameters: {refferedcollection: "$collection.collection"}, filter: {"collectionid.collection": "$refferedcollection", "type": "date"}, when: "this.aggregateType == 'due'"},
        {"label": "Receive Date", "field": "receiveDate", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", group: "Default", collection: "pl.fields", displayField: "field", parameters: {refferedcollection: "$collection.collection"}, filter: {"collectionid.collection": "$refferedcollection", "type": "date"}, when: "this.aggregateType == 'due'"},
        {"label": "AggregateSpan", "field": "aggregateSpan", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", type: "string", group: "Default", when: "this.dashboardType == 'AdvanceDashboard'"},
        {"label": "Filter", "field": "filter", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", group: "Query"},
        {"label": "Action Availability", "field": "actionAvailability", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", group: "Default", options: ["available", "hidden", "override"], "when": "this.ui == 'grid'"},
        {"label": "Event Availability", "field": "eventAvailability", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", group: "Default", options: ["available"], "when": "this.ui == 'grid'"},
        {"label": "Recursion", "field": "recursion", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", json: true, "width": "200px", group: "Query"},
        {"label": "Recursion Enabled", "field": "recursionEnabled", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default", type: "boolean"},
        {"label": "Group", "field": "group", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", json: true, "width": "200px", group: "Query"},
        {"label": "Unwind", "field": "unwind", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", json: true, "width": "200px", group: "Query"},
        {"label": "Transform", "field": "transform", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", group: "Query", "when": "this.ui == 'grid'"},
        {"label": "Role", "field": "roleid", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", collection: "pl.roles", displayField: "id", type: "fk", group: "Default", "when": "this.ui == 'grid'"},
        {"label": "Role Field", "field": "roleField", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", group: "Default", collection: "pl.fields", displayField: "field", parameters: {refferedcollection: "$collection"}, filter: {"collectionid": "$refferedcollection._id"}, "when": "this.ui == 'grid'"},
        {"label": "Hidden", "field": "hidden", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", group: "Other Info"},
        {"label": "Limit", "field": "limit", "visibilityGrid": false, "visibilityForm": true, "ui": "number", type: "number", "width": "200px", group: "Query"},
        {"label": "Fetch count", "field": "fetchCount", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", group: "Other Info", "when": "this.ui == 'grid'"},
        {"label": "Field Customization", "field": "fieldCustomization", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", group: "Other Info"},
        {"label": "Query Event", "field": "queryEvent", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", type: "string", group: "Query"},
        {"label": "Sort", "field": "sort", "visibilityGrid": false, "visibilityForm": true, "ui": "text", json: true, "width": "200px", type: "text", group: "Query"},
        {"label": "Insert", "field": "insert", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "text", group: "Other Info"},
        {"label": "Insert Mode", "field": "insertMode", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "type": "string", "width": "200px", "options": ["grid", "form", "both"], "when": "this.insert", group: "Other Info"},
        {"label": "Edit", "field": "edit", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "text", group: "Other Info"},
        {"label": "Delete", "field": "delete", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "text", group: "Other Info"},
        {"label": "Detail", "field": "detail", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "text", group: "Other Info"},
        {"label": "Aggregate Position", "field": "aggregatePosition", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "options": ["header", "footer", "both"], "width": "200px", type: "text", group: "Other Info", "when": "this.ui == 'grid'"},
        {"label": "Show Selection", "field": "checkboxSelection", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "text", group: "Other Info", "when": "this.ui == 'grid'"},
        {"label": "Hide Unit", "field": "hideUnit", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "text", group: "Other Info"},
        {"label": "Auto Width Column", "field": "autoWidthColumn", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "text", group: "Other Info", "when": "this.ui == 'grid'"},
        {"label": "Navigation", "field": "navigation", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "type": "boolean", "width": "200px", group: "Other Info", "when": "this.ui == 'grid'"},
        {"label": "Run As Batch Query", "field": "runAsBatchQuery", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "text", group: "Query", when: "this.ui == 'dashboard'"},
        {"label": "Reload View On Filter Change", "field": "reloadViewOnFilterChange", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "text", group: "Other Info"},
        {"label": "Update Mode", "field": "updateMode", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", group: "Other Info", "when": "this.ui == 'grid'"},
        {"label": "Cross Tab Info", "field": "crossTabInfo", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", group: "Default", "when": "this.ui == 'grid'"},
        {"label": "Span Report", "field": "spanreport", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", group: "Default", "when": "this.ui == 'grid'"},
        {"label": "Fullmode", "field": "fullMode", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", group: "Other Info"},
        {"label": "Show Zero If Null", "field": "showZeroIfNull", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", group: "Other Info", "when": "this.ui == 'grid'"},
        {"label": "Large Font", "field": "largeFont", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", group: "Other Info", "when": "this.ui == 'grid'"},
        {"label": "Across DB", "field": "acrossDB", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", group: "Other Info"},
        {"label": "Execute On Client", "field": "executeOnClient", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", group: "Default", when: "this.dashboardType === 'AdvanceDashboard'"},
        {"label": "Enable FTS", "field": "enableFts", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", group: "Default", when: "this.dashboardType === 'AdvanceDashboard'"},
        {"label": "Upsert", "field": "upsert", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default", type: "boolean"},
        {"label": "Upsert Fields", "field": "upsertFields", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", type: "string", group: "Default", json: true, when: "$upsert"},
        {"label": "Field Availability", "field": "fieldAvailability", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", group: "Default", options: ["available", "hidden", "override"]},
        {"label": "Do Not Merge Field Customization", "field": "doNotMergeFieldCustomizations", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "text", group: "Other Info", "when": "this.ui == 'grid'"},
        {"label": "Do Not Merge User Field Customization", "field": "doNotMergeUserFieldCustomizations", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "text", group: "Other Info", "when": "this.ui == 'grid'"},
        {"label": "Aggregate Async", "field": "aggregateAsync", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "boolean", group: "Other Info"},
        {"label": "Export to Excel Span", "field": "exportToExcelSpan", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", type: "string", group: "Default"},
        {"label": "Theme", "field": "theme", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", group: "Default", options: ["list"], "when": "this.ui == 'grid'"},
        {"label": "List Title", upsert: true, "field": "listTitle", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", "when": "this.theme", collection: "pl.fields", displayField: "field", parameters: {collection: "$mainCollection.collection"}, filter: {"collectionid.collection": "$collection"}},
        {"label": "List Sub Title", upsert: true, "field": "listSubTitle", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", "when": "this.theme", collection: "pl.fields", displayField: "field", parameters: {collection: "$mainCollection.collection"}, filter: {"collectionid.collection": "$collection"}},
        {"label": "List Desc", upsert: true, "field": "listDesc", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", "when": "this.theme", collection: "pl.fields", displayField: "field", parameters: {collection: "$mainCollection.collection"}, filter: {"collectionid.collection": "$collection"}},
        {"label": "List Title Indicator", upsert: true, "field": "listTitleIndicator", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", "when": "this.theme", collection: "pl.fields", displayField: "field", parameters: {collection: "$mainCollection.collection"}, filter: {"collectionid.collection": "$collection"}},
        {"label": "List Sub Title Indicator", upsert: true, "field": "listSubTitleIndicator", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", "when": "this.theme", collection: "pl.fields", displayField: "field", parameters: {collection: "$mainCollection.collection"}, filter: {"collectionid.collection": "$collection"}},
        {"label": "List Desc Indicator", upsert: true, "field": "listDescIndicator", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", "when": "this.theme", collection: "pl.fields", displayField: "field", parameters: {collection: "$mainCollection.collection"}, filter: {"collectionid.collection": "$collection"}},
        {"label": "List Caption", upsert: true, "field": "listCaption", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", "when": "this.theme", collection: "pl.fields", displayField: "field", parameters: {collection: "$mainCollection.collection"}, filter: {"collectionid.collection": "$collection"}},
        {"label": "Meteor Tracker", "field": "meteorTracker", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", group: "Default"}
    ]

    AppViews.__additionalquickviewfields__ = [
        {"label": "Views", "field": "views", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", multiple: true, type: "object", "when": "(this.ui == 'dashboard' || this.ui == 'composite')", fields: [
            {"label": "Index", "field": "index", type: "number", ui: "number", "visibilityForm": true, "width": '50px'} ,
            {"label": "Alias", "field": "alias", type: "string", "ui": "text", "visibilityForm": true, "width": '100px'},
            {"label": "Primary", "field": "primary", type: "boolean", "ui": "checkbox", "visibilityForm": true, "width": '30px'},
            {"label": "Col Span", "field": "colSpan", type: "number", "ui": "number", "visibilityForm": true, "width": '30px'},
            {"label": "Height", "field": "height", type: "number", "ui": "number", "visibilityForm": true, "width": '30px'},
            {"label": "Collection", "field": "collection", "visibilityForm": true, "ui": "autocomplete", "width": "100px", group: "Default", "collection": "pl.collections", displayField: "collection", type: "string"},
            {"label": "View", "field": "id", "visibilityForm": true, "ui": "autocomplete", "width": "100px", type: "string", group: "Default", collection: "pl.qviews", displayField: "id", parameters: {collection: "$collection"}, filter: {"collection.collection": "$collection"}},
            {"label": "Left", "field": "left", type: "string", ui: "text", "width": '50px', "visibilityForm": true, when: "this.dashboardType !== 'AdvanceDashboard'"} ,
            {"label": "Right", "field": "right", type: "string", ui: "text", "width": '50px', "visibilityForm": true, when: "this.dashboardType !== 'AdvanceDashboard'"},
            {"label": "Top", "field": "top", type: "string", ui: "text", "width": '50px', "visibilityForm": true, when: "this.dashboardType !== 'AdvanceDashboard'"},
            {"label": "Bottom", "field": "bottom", type: "string", "width": '50px', ui: "text", "visibilityForm": true, when: "this.dashboardType !== 'AdvanceDashboard'"},
            {"label": "Show Action", "field": "showAction", type: "boolean", "width": '50px', ui: "checkbox", "visibilityForm": true},
            {"label": "View Info", "field": "viewInfo", type: "string", "width": '100px', "ui": "text", "visibilityForm": true},
            {"label": "Group", "field": "group", type: "string", "width": '100px', "ui": "text", "visibilityForm": true},
            {"label": "Name", "field": "name", type: "string", "width": '100px', "ui": "text", "visibilityForm": true},
            {"label": "Provide Parent Parameter", "field": "provideParentParameter", type: "string", "width": '100px', "ui": "text", "visibilityForm": true},
            {"label": "Watch Parent Parameter", "field": "watchParentParameter", type: "boolean", "width": '50px', ui: "checkbox", "visibilityForm": true},
            {"label": "Query Group", "field": "queryGroup", "width": '100px', type: "string", "ui": "text", "visibilityForm": true},
            {"label": "Parameter Mappings", "field": "parametermappings", "width": '100px', type: "string", "ui": "text", "visibilityForm": true},
            {"label": "Parent", "field": "parent", "width": '100px', type: "string", "ui": "text", "visibilityForm": true}
        ]},
        {"label": "Aggregates", "field": "aggregates", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", multiple: true, type: "object", "when": "this.ui == 'dashboard'", fields: [
            {"label": "Index", "field": "index", type: "number", ui: "number", "visibilityForm": true, "width": '50px'} ,
            {"label": "Alias", "field": "alias", type: "string", "ui": "text", "visibilityForm": true, "width": '100px'},
            {"label": "Column", "field": "column", type: "number", "ui": "number", "visibilityForm": true, "width": '100px'},
            {"label": "Collection", "field": "collection", "visibilityForm": true, "ui": "autocomplete", "width": "100px", group: "Default", "collection": "pl.collections", displayField: "collection", type: "string"},
            {"label": "View", "field": "id", "visibilityForm": true, "ui": "autocomplete", "width": "100px", type: "string", group: "Default", collection: "pl.qviews", displayField: "id", parameters: {collection: "$collection"}, filter: {"collection.collection": "$collection"}},
            {"label": "View Info", "field": "viewInfo", type: "string", "width": '100px', "ui": "text", "visibilityForm": true},
            {"label": "Group", "field": "group", type: "string", "width": '100px', "ui": "text", "visibilityForm": true},
            {"label": "Name", "field": "name", type: "string", "width": '100px', "ui": "text", "visibilityForm": true},
            {"label": "Query Group", "field": "queryGroup", "width": '100px', type: "string", "ui": "text", "visibilityForm": true},
            {"label": "Parameter Mappings", "field": "parametermappings", "width": '100px', type: "string", "ui": "text", "visibilityForm": true},
            {"label": "Parent", "field": "parent", "width": '100px', type: "string", "ui": "text", "visibilityForm": true}
        ]},
        {"label": "Groups", "field": "dashboardGroups", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", multiple: true, type: "object", "when": "this.ui == 'dashboard'", fields: [
            {"label": "Name", "field": "name", type: "string", "ui": "text", "visibilityForm": true},
            {"label": "Show Name", "field": "showName", type: "boolean", "ui": "checkbox", "visibilityForm": true}
        ]},
        {"label": "Roles", "field": "roles", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", nestedGridPosition: "form", "width": "200px", multiple: true, fields: [
            {"label": "Role", "field": "role", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "fk", "width": "200px", collection: "pl.roles", displayField: "id", mandatory: true}
        ]}
    ]

    AppViews.__allquickviewfields__ = angular.copy(AppViews.__quickviewfields__);
    AppViews.__allquickviewfields__.push.apply(AppViews.__allquickviewfields__, AppViews.__additionalquickviewfields__);

    AppViews.__addquickview__ = {"viewOptions": {"ui": "form", "id": "__addquickview__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, viewControl: false, "label": "Add Quick view", "fields": angular.copy(AppViews.__allquickviewfields__), events: [
        {
            function: {source: "ApplaneFunctions/lib/AppSystemEvents",
                name: "onInsert"},
            event: "onInsert"
        },
        {
            function: {source: "ApplaneFunctions/lib/AppSystemEvents",
                name: "onQViewInsert"},
            event: "onInsert"
        }
    ], "collection": "pl.qviews", groups: [
        {title: "Default", label: "Default", separator: false, showTitle: false, showLabel: true},
        {title: "Query", label: "Query", separator: true, showTitle: true, showLabel: true},
        {title: "Other Info", label: "Other Info", separator: false, showTitle: true, showLabel: true}
    ], queryGrid: {
        $collection: "pl.qviews", $filter: {mainCollection: {"$$whenDefined": {"key": "$mainCollection_id"}}},
        $limit: 50, $sort: {id: 1}, $events: [
            {event: "onQuery", function: "MainCollectionEvents.executeResultForNavigation", post: true},
            {event: "onQuery", function: "MainCollectionEvents.onResult", post: false}
        ], $fields: {responsiveColumns: 1, qViewStyle: 1, id: 1, label: 1, filter: 1, hidden: 1, limit: 1, recursion: 1, group: 1, roleid: 1, roleField: 1, unwind: 1, transform: 1, fetchCount: 1, "collection._id": 1, "collection.collection": 1, "mainCollection._id": 1, "mainCollection.collection": 1, index: 1, queryEvent: 1, sort: 1, ui: 1, dashboardType: 1, template: 1, templateType: 1, "actionAvailability": 1, "insert": 1, "insertMode": 1, "edit": 1, "delete": 1, "detail": 1, "reloadViewOnFilterChange": 1, "batchQuery": 1, "updateMode": 1, "checkboxSelection": 1, "navigation": 1, "fieldCustomization": 1, "aggregatePosition": 1, "hideUnit": 1, "primaryField": 1, "autoWidthColumn": 1, "crossTabInfo": 1, "fullMode": 1, "spanreport": 1, "showZeroIfNull": 1, "largeFont": 1, "acrossDB": 1, "advancedDashboardOptions": 1, "value": 1, "date": 1, "aggregateExpression": 1, "aggregateType": 1, "runAsBatchQuery": 1, "dueDate": 1, "receiveDate": 1, "insertView": 1, "drildownView": 1, "listView": 1, "insertViewDetail": 1, "drildownViewDetail": 1, "listViewDetail": 1, executeOnClient: 1, "dashboardLayout": 1, "graphType": 1, recursionEnabled: 1, "xAxisField": 1, barWidthForTinyMode: 1, tinyMode: 1, "xAxisScale": 1, margin: 1, showHorizontalGridLine: 1, showTextOnBar: 1, showToolTip: 1, barGraphType: 1, colors: 1, "showLegend": 1, legendWidth: 1, "yAxisScale": 1, "yAxisField": 1, "arcLable": 1, "arcValue": 1, "doNotMergeUserFieldCustomizations": 1, "doNotMergeFieldCustomizations": 1, "detailView": 1}},
        queryForm: {
            $collection: "pl.qviews",
            $fields: {aggregateAsync: 1, eventAvailability: 1, fieldAvailability: 1, "upsert": 1, "upsertFields": 1, roles: 1, fields: 1, "actions._id": 1, "actions.id": 1, "actions.label": 1, "actions.type": 1, "actions.filterType": 1, "actions.ui": 1, "actions.asParameter": 1, "actions.field": 1, "actions.collection": 1, "actions.displayField": 1, "qFields._id": 1, "qFields.availability": 1, "qFields.visibility": 1, "qFields.visibilityForm": 1, "qFields.index": 1, "qFields.indexForm": 1, "qFields.filter": 1, "qFields.editableWhen": 1, "qFields.when": 1, "qFields.qfield._id": 1, "qFields.qfield.field": 1, "views": 1, "aggregates": 1, "dashboardGroups": 1, "theme": 1, "listTitle": 1, "listSubTitle": 1, "listDesc": 1, "listTitleIndicator": 1, "listSubTitleIndicator": 1, "listDescIndicator": 1, "listCaption": 1, "width": 1, "height": 1, "fontSize": 1, "meteorTracker": 1, captionSize: 1
            }, $limit: 50}}};

    AppViews.__editquickview__ = {"viewOptions": { refreshDataOnLoad: true, "ui": "grid", "id": "__editquickview__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: false, navigation: true, showLabel: true, refresh: false, viewControl: false, "label": "Quick views", "fields": AppViews.__addquickview__.viewOptions.fields, "groups": AppViews.__addquickview__.viewOptions.groups,
        actions: [
            {"label": "References", "type": "view", qviews: [
                {id: "__quickviewreference__"}
            ], "visibility": true}
        ],
        events: AppViews.__addquickview__.viewOptions.events,
        "collection": "pl.qviews", queryGrid: AppViews.__addquickview__.viewOptions.queryGrid, queryForm: AppViews.__addquickview__.viewOptions.queryForm}};

    AppViews.__quickviewreference__ = {"viewOptions": { refreshDataOnLoad: true, "ui": "grid", "id": "__quickviewreference__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: false, navigation: true, showLabel: true, refresh: false, viewControl: false, "insert": false, edit: false, delete: false, "label": "Quick views Reference", "fields": [
        {"label": "Id", "field": "id", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "200px", group: "Default", "referredView": {"id": "$id", "parameters": {"id": "$id"}}},
        {"label": "Main Collection", "field": "mainCollection", "visibilityGrid": true, "visibilityForm": true, "ui": "autocomplete", "width": "200px", collection: "pl.collections", displayField: "collection", type: "fk", group: "Default", "filterable": true},
        {"label": "References", "field": "noOfReferences", "visibilityGrid": true, "visibilityForm": true, "ui": "number", "type": "number", "width": "200px", group: "Default", sortable: true, filterable: true, "referredView": {"id": "__qviewReferences__", "parameters": {"id": "$id"}, "$filter": {"id": "$id"}, "ui": "form"}}
    ], actions: [
        {id: "populateQviewReferences", "label": "Populate Qview References", type: "invoke", "onHeader": true, "function": "Porting.populateQviewReference", "visibility": true}
    ], "groups": AppViews.__addquickview__.viewOptions.groups,
        events: AppViews.__addquickview__.viewOptions.events,
        "collection": "pl.qviews",
        queryGrid: {
            $collection: "pl.qviews",
            $limit: 50, $sort: {id: 1}, $events: [
                {event: "onQuery", function: "MainCollectionEvents.executeResultForNavigation", post: true},
                {event: "onQuery", function: "MainCollectionEvents.onResult", post: false}
            ], $fields: {id: 1, noOfReferences: 1, mainCollection: 1}},
        queryForm: {
            $collection: "pl.qviews",
            $fields: {id: 1, noOfReferences: 1, mainCollection: 1}, $limit: 50}
    }};

    AppViews.__selfquickview__ = {};
    AppViews.__selfquickview__.viewOptions = angular.copy(AppViews.__editquickview__.viewOptions);
    AppViews.__selfquickview__.viewOptions.id = "__selfquickview__";
    AppViews.__selfquickview__.viewOptions.label = "Edit Qview";
    AppViews.__selfquickview__.viewOptions.setAsNull = true;
    AppViews.__selfquickview__.viewOptions.queryGrid.$filter = {_id: "$view_id"};
    AppViews.__selfquickview__.viewOptions.actions = [
        {label: "Edit View", type: "view", qviews: [
            {id: "__selfquickviewcustomization__"}
        ], parameters: {"collection_id": "$collection_id", sourceid: "$sourceid", "view_id": "$view_id", "viewid": "$viewid"}, "when": "$sourceid" }
    ]

    AppViews.__selfquickviewcustomization__ = {popup: true, "viewOptions": {setAsNull: true, "insert": false, refreshDataOnLoad: true, "ui": "grid", "id": "__selfquickviewcustomization__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, viewControl: false, "label": "Edit View", "fields": angular.copy(AppViews.__quickviewfields__), "upsertFields": JSON.stringify(["_id"]), upsert: true, "collection": "pl.qviewcustomizations", groups: [
        {title: "Default", label: "Default", separator: false, showTitle: false, showLabel: true},
        {title: "Query", label: "Query", separator: true, showTitle: true, showLabel: true},
        {title: "Other Info", label: "Other Info", separator: false, showTitle: true, showLabel: true}
    ], queryGrid: {
        $collection: "pl.qviewcustomizations",
        "$filter": {_id: "$sourceid"}, $events: [
            {function: "QviewCustomizations.onResult", event: "onQuery", post: true} ,
            {function: "QviewCustomizations.onPreSave", event: "onSave", pre: true}
        ]
    }, queryForm: {$collection: "pl.qviewcustomizations", "$filter": {_id: "$sourceid"}}
    }}


    AppViews.__actionfields__ = [
        {"label": "Index", "field": "index", "visibilityGrid": true, "visibilityForm": true, "ui": "number", type: "number", "width": "70px"},
        {"label": "Id", "field": "id", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string", "width": "100px", "filterable": true},
        {"label": "Label", "field": "label", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string", "width": "200px"},
        {"label": "Type", "field": "type", "visibilityGrid": true, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "100px", options: ["invoke", "view", "filter", "print"]},
        {"label": "When", "field": "when", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string", "width": "100px"},
        {"label": "On Row", "field": "onRow", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", "width": "70px"},
        {"label": "On Header", "field": "onHeader", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", "width": "70px"},
        {"label": "Function", "field": "function", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", when: "this.type == 'invoke'", upsert: true, options: ["ExportViewService.exportExcelView", "Porting.importExcelData", "ResolveTemplate.resolveTemplate"]},
        {"label": "Template ID", "field": "templateId", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "fk", "width": "100px", "collection": "pl.templates", displayField: "id", filter: {collectionid: "$collection_id"}, parameters: {collection_id: "$collection_id"}, when: "this.function == 'ResolveTemplate.resolveTemplate' "},
        {"label": "Preview", "field": "preview", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "70px", when: "this.function == 'ResolveTemplate.resolveTemplate' "},
        {"label": "Request View", "field": "requestView", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px"},
        {"label": "Download File", "field": "downloadFile", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", when: "this.type == 'invoke'"},
        {"label": "Refresh Data", "field": "refreshData", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", when: "this.type == 'invoke'"},
        {"label": "Async", "field": "async", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", when: "this.type == 'invoke'"},
        {"label": "Visibility", "field": "visibility", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "70px"},
        {"label": "Visibility Grid", "field": "visibilityGrid", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "70px"},
        {"label": "Visibility Form", "field": "visibilityForm", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "70px"},
        {"label": "Filter Type", "field": "filterType", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", options: ["date", "fk", "string", "boolean"], when: "this.type == 'filter'"},
        {"label": "Filter UI", "field": "ui", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", options: ["autocomplete", "date", "text", "checkbox"], when: "this.type == 'filter'"},
        {"label": "FilterSpace", "field": "filterspace", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", group: "Default", "collection": "pl.filterspace", displayField: "space", type: "string", when: "this.type=='filter'"},
        {"label": "Boolean Filter Mapping", "field": "booleanFilterMapping", "visibilityGrid": false, "visibilityForm": true, "ui": "json", type: "json", when: "this.ui=='checkbox'", "width": "200px", group: "Default"},
        {"label": "As Parameter", "field": "asParameter", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", when: "this.type == 'filter'"},
        {"label": "Show Filter In Left", "field": "showFilterInLeft", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", when: "this.type == 'filter' && this.ui == 'autocomplete' "},
        {"label": "Field", "field": "field", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", when: "this.type == 'filter'"},
        {"label": "Action Field", "field": "actionField", "visibilityGrid": false, "visibilityForm": true, "ui": "text", type: "string", "width": "200px"},
        {"label": "Require Selected Rows", "field": "requireSelectedRows", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", when: "this.type == 'invoke'"},
        {"label": "Collection", "field": "collection", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", "collection": "pl.collections", displayField: "collection", when: "this.type == 'view' || this.filterType == 'fk'"},
        {"label": "Display Field", "field": "displayField", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", collection: "pl.fields", displayField: "field", parameters: {refferedcollection: "$collection"}, filter: {"collectionid.collection": "$refferedcollection"}, when: "this.filterType == 'fk'"},
        {"label": "Collection Id", "field": "collectionid", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", collection: "pl.collections", displayField: "collection", type: "fk"},
        {"label": "Filter", "field": "filter", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", type: "string", when: "this.type == 'view' || this.type == 'filter'"},
        {"label": "Parameters", "field": "parameters", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", type: "string", when: "this.type == 'view' || this.type == 'invoke'"},
        {"label": "Visibility Filter", "field": "visibilityFilter", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", options: ["Always"], when: "this.type == 'filter'"},
        {"label": "Class", "field": "class", "visibilityGrid": false, "visibilityForm": true, type: "string", "ui": "autocomplete", options: ["bar-chart", "excel", "pie-chart", "print", "reload", "vehicle-start", "vehicle-moving", "vehicle-stop", "reached", "waiting", "loaded", "phone-call"], "width": "100px" },
        {"label": "Default Filter", "field": "defaultFilter", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", type: "string", when: "this.type == 'filter'"},
        {"label": "Default Quick View", "field": "defaultqview", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "fk", "width": "200px", collection: "pl.qviews", displayField: "id", when: "this.type == 'view'", filter: {"collection.collection": "$collectionid"}, parameters: {collectionid: "$collection"}},
        {"label": "Multiple", "field": "multiple", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", when: "this.filterType == 'fk'"},
        {"label": "Custom Filter", "field": "customFilter", "visibilityGrid": false, "visibilityForm": true, "when": "this.ui == 'date'", "ui": "json", type: "json", "width": "200px", when: "this.filterType == 'date'"},
        {"label": "On View", "field": "customizationEnabled", index: 72, "visibilityGrid": true, "visibilityForm": false, "ui": "checkbox", "type": "boolean", "width": "100px", "editableWhenGrid": "false", "filterable": true},
        {"label": "On Qview", "field": "qviewEnabled", "visibilityGrid": true, index: 73, "visibilityForm": false, "ui": "checkbox", "type": "boolean", "width": "100px", "editableWhenGrid": "false", "filterable": true},
        {"label": "FK Role Filter", "field": "roleid", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", collection: "pl.roles", displayField: "id", type: "fk"},
        {"label": "Recursion", "field": "recursion", "visibilityGrid": false, "visibilityForm": true, "ui": "string", "width": "200px", type: "string", json: true, when: "this.type == 'filter' && this.ui == 'autocomplete'"},
        {"label": "View", "field": "view", "visibilityForm": true, "ui": "autocomplete", "width": "100px", type: "string", group: "Default", collection: "pl.qviews", displayField: "id", parameters: {collection: "$collection"}, filter: {"collection.collection": "$collection"}},
        {"label": "Recursive Filter", "field": "recursiveFilter", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default", when: "this.ui == 'autocomplete'"},
        {"label": "Recursive Filter Field", "field": "recursiveFilterField", "visibilityGrid": true, "visibilityForm": true, "ui": "autocomplete", "collection": "pl.fields", displayField: "field", "upsert": true, parameters: {refferedcollection: "$collection"}, filter: {"collectionid.collection": "$refferedcollection"}, type: "string", "width": "200px", group: "Default", when: "this.recursiveFilter"},
        {"label": "Options", "field": "options", multiple: true, "visibilityGrid": false, "visibilityForm": true, "ui": "string", type: "string", "width": "200px", group: "Default", when: "this.ui=='autocomplete'"},
        {"label": "Views", "field": "views", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", multiple: true, type: "object", "when": "this.type == 'filter' && this.ui == 'autocomplete'", fields: [
            {"label": "Alias", "field": "alias", type: "string", "ui": "text", "visibilityForm": true, "width": '100px', mandatory: true},
            {"label": "Filter FIeld", "field": "filterField", "width": '100px', type: "string", "ui": "text", "visibilityForm": true, mandatory: true},
            {"label": "As Parameter", "field": "asParameter", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px"}
        ]}
    ]

    AppViews.__additionalactionfields__ = [
        //  qviews to provide view type actions on row(child view)
        {when: "this.type == 'view'", "label": "Quick views", "field": "qviews", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", "width": "200px", viewControl: false, navigation: false, multiple: true, fields: [
            {"label": "Index", "field": "index", "visibilityGrid": false, "visibilityForm": true, "ui": "number", "width": "200px"},
            {"label": "Collection", "field": "collection", "visibilityForm": true, "ui": "autocomplete", "width": "200px", "collection": "pl.collections", displayField: "collection", type: "string"},
            {"label": "Id", "field": "id", "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", collection: "pl.qviews", displayField: "id", parameters: {collection: "$collection"}, filter: {"collection.collection": "$collection"}},
            {"label": "Label", "field": "label", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px"},
            {"label": "UI", "field": "ui", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px"},
            {"label": "Limit", "field": "limit", "visibilityGrid": false, "visibilityForm": true, "ui": "number", "width": "200px"}
        ]},
        {when: "this.type == 'invoke'", "label": "Fields", "field": "fields", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", "width": "200px", viewControl: false, navigation: false, multiple: true, fields: [
            {"label": "Index", "field": "index", "visibilityGrid": false, "visibilityForm": true, "ui": "number", type: "number", "width": "70px"},
            {"label": "Label", "field": "label", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px"},
            {"label": "Field", "field": "field", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px"},
            {"label": "Type", "field": "type", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", "options": ["string", "fk", "duration", "boolean", "currency", "file", "number", "grid", "date", "json", "object"], group: "Default"},
            {"label": "UI", "field": "ui", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", "options": ["text", "autocomplete", "duration", "checkbox", "currency", "file", "googlePlace", "number", "grid", "date", "json", "googlePlace"], group: "Default"},
            {"label": "Referred Collection", "field": "collection", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", group: "Default", "collection": "pl.collections", displayField: "collection", type: "string"},
            {"label": "Display Field", "field": "displayField", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px"},
            {"label": "Multiple", "field": "multiple", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
            {"label": "Options", "field": "options", "visibilityGrid": false, "visibilityForm": true, "ui": "json", type: "json", "width": "200px", group: "Default"},
            {"label": "Other Display Field", "field": "otherDisplayFields", "upsert": true, "visibilityForm": true, multiple: true, "ui": "autocomplete", type: "string", "width": "200px", collection: "pl.fields", displayField: "field", parameters: {refferedcollection: "$collection"}, filter: {"collectionid.collection": "$refferedcollection"}},
            {"label": "Filter", "field": "filter", "visibilityForm": true, "ui": "text", type: "string", "width": "200px"},
            {"label": "Parameters", "field": "parameters", "visibilityForm": true, "ui": "text", "width": "200px", type: "string"},
            {"label": "Role", "field": "roleid", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", collection: "pl.roles", displayField: "id", type: "fk"},
            {"label": "Time", "field": 'time', "visibilityGrid": true, "visibilityForm": true, "group": "Default", "width": "200px", "ui": "checkbox"},
            {"label": "Upsert", "field": 'upsert', "visibilityGrid": true, "visibilityForm": true, "group": "Default", "width": "200px", "ui": "checkbox"}
        ]},
        // qviewids to show actions on these qviews if provided
        /*{"label":"Qview Ids", "field":"qviewids", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", "width":"200px", viewControl:false, navigation:false, multiple:true, fields:[
         {"label":"Id", "field":"id", "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", collection:"pl.qviews", displayField:"id", parameters:{"collectionid":"$collectionid"}, filter:{"collection":"$collectionid._id"}}
         ]}  ,*/
        {"label": "Roles", "field": "roles", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", nestedGridPosition: "form", "width": "200px", multiple: true, fields: [
            {"label": "Role", "field": "role", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "fk", "width": "200px", collection: "pl.roles", displayField: "id", mandatory: true}
        ]}
    ];
    AppViews.__allactionfields__ = angular.copy(AppViews.__actionfields__);
    AppViews.__allactionfields__.push.apply(AppViews.__allactionfields__, AppViews.__additionalactionfields__);

    AppViews.__addaction__ = {"viewOptions": { "ui": "form", "id": "__addaction__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, viewControl: false, "label": "Add action", "fields": angular.copy(AppViews.__allactionfields__), events: AppViews.__insertEvents__, "collection": "pl.actions", queryGrid: {$collection: "pl.actions", $filter: {collectionid: "$collection_id"}, "$events": [
        {
            function: "Actions.populateCustomizationIndicators",
            event: "onQuery",
            post: true
        }
    ]}, queryForm: {$collection: "pl.actions", $filter: {collectionid: "$collection_id"}}}};

    AppViews.__editaction__ = {
        "viewOptions": {
            refreshDataOnLoad: true, "ui": "grid", "id": "__editaction__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, navigation: true, viewControl: false, "label": "Actions", "fields": AppViews.__addaction__.viewOptions.fields,
            "events": [
                {
                    function: {source: "ApplaneFunctions/lib/AppSystemEvents",
                        name: "onInsert"},
                    event: "onInsert"
                },
                {
                    function: {source: "ApplaneFunctions/lib/AppSystemEvents",
                        name: "onActionValueChange", type: "js"},
                    event: "onValue:[\"function\"]"
                }
            ],
            "collection": "pl.actions",
            queryGrid: AppViews.__addaction__.viewOptions.queryGrid, queryForm: AppViews.__addaction__.viewOptions.queryForm,
            actions: [
                {label: "Q Actions", type: "view", qviews: [
                    {id: "__selfquickviewaction__"}
                ], parameters: {"collection_id": "$collection_id", sourceid: "$sourceid", "view_id": "$view_id", "viewid": "$viewid", "qviewActions": true}},
                {label: "View Actions", type: "view", qviews: [
                    {id: "__selfquickviewactioncustomization__"}
                ], parameters: {"collection_id": "$collection_id", sourceid: "$sourceid", "view_id": "$view_id", "viewid": "$viewid", "customizationActions": true}, when: "$sourceid"},
                {"id": "addToQview", "label": "Add To Qview", visibility: true, "type": "invoke", "function": "Actions.addActions", "onHeader": true, "requireSelectedRows": true, "requestView": true, parameters: {"sourceid": "$sourceid", "addToQview": true, "view__id": "$viewid"}/*, when: "$sourceid"*/},
                {"id": "addToCustomization", "label": "Add To View", visibility: true, "type": "invoke", "function": "Actions.addActions", "onHeader": true, "requireSelectedRows": true, "requestView": true, parameters: {"sourceid": "$sourceid", "addToCustomization": true, "view__id": "$viewid"}, when: "$sourceid"}
            ]
        }};

    AppViews.__selfquickviewaction__ = {popup: true, "viewOptions": { refreshDataOnLoad: true, "ui": "grid", "id": "__selfquickviewaction__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, viewControl: false, "insert": false, "label": "Qview Actions", "fields": [
        {"label": "Q Actions", "field": "qActions", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", multiple: true, type: "object", "when": "this.ui == 'grid' || this.ui == 'form'", fields: angular.copy(AppViews.__actionfields__)}
    ], viewFields: ["qActions"], "collection": "pl.qviews", groups: [
        {title: "Default", label: "Default", separator: false, showTitle: false, showLabel: true}
    ], queryGrid: {
        $collection: "pl.qviews", "$fields": {"qActions": 1}, $events: [
            {function: "QviewCustomizations.mergeFieldsOnResult", event: "onQuery", post: true}
        ], "$parameters": {"qviewActions": true}, $filter: {_id: "$view_id"}
    }, queryForm: {$collection: "pl.qviews", "$filter": {_id: "$view_id"}}
    }}


    AppViews.__selfquickviewactioncustomization__ = {popup: true, "viewOptions": { refreshDataOnLoad: true, "ui": "grid", "id": "__selfquickviewactioncustomization__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, viewControl: false, "insert": false, "label": "Fields", "fields": [
        {"label": "Q Actions", "field": "qActions", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", multiple: true, type: "object", "when": "this.ui == 'grid' || this.ui == 'form'", fields: angular.copy(AppViews.__actionfields__)  }
    ], viewFields: ["qActions"], "collection": "pl.qviewcustomizations", groups: [
        {title: "Default", label: "Default", separator: false, showTitle: false, showLabel: true}
    ], queryGrid: {
        $collection: "pl.qviewcustomizations", "$fields": {"qFields": 1}, $events: [
            {function: "QviewCustomizations.mergeFieldsOnResult", event: "onQuery", post: true},
            {function: "QviewCustomizations.onPreSave", event: "onPreSave", "pre": true}
        ], "$parameters": {"customizationActions": true}, "$filter": {_id: "$sourceid"}
    }, queryForm: {$collection: "pl.qviewcustomizations", "$filter": {_id: "$sourceid"}}
    }}

    AppViews.__manageevents__ = {"viewOptions": { refreshDataOnLoad: true, "ui": "grid", "id": "__manageevents__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, "label": "Events", "fields": [
        {"label": "Collection Id", "field": "collectionid", "visibilityGrid": false, "visibilityForm": false, "ui": "autocomplete", "width": "200px", collection: "pl.collections", displayField: "collection", type: "fk"},
        {"label": "Index", "field": "index", "visibility": true, "ui": "number", "width": "200px"},
        {"label": "Event", "field": "event", "visibility": true, "ui": "text", "width": "200px"},
        {"label": "Function", "field": "function", "visibility": true, "ui": "text", "width": "200px"},
        {"label": "Pre", "field": "pre", "visibility": true, "ui": "checkbox", "width": "200px"},
        {"label": "Post", "field": "post", "visibility": true, "ui": "checkbox", "width": "200px"},
        {"label": "Require", "field": "require", "visibility": true, "ui": "text", "width": "200px"},
        {"label": "Options", "field": "options", "visibility": true, "ui": "text", "width": "200px", type: "string"},
        {"label": "Client", "field": "client", "visibility": true, "ui": "checkbox", "width": "200px"},
        {"label": "Server", "field": "server", "visibility": true, "ui": "checkbox", "width": "200px"},
        {"label": "Required Fields", "field": "requiredfields", "visibility": true, "ui": "text", "width": "200px", type: "string"},
        {"label": "Required Modules", "field": "requiredmodules", "visibility": true, "ui": "text", "width": "200px", type: "string"}
    ], groups: [
        {title: "Default", label: "Default", separator: false, showTitle: false, showLabel: true}
    ], "collection": "pl.events", queryGrid: {$collection: "pl.events", $filter: {collectionid: "$collection_id"}}, queryForm: {$collection: "pl.events", $filter: {collectionid: "$collection_id"}}}};

    AppViews.__manageworkflowevents__ = {"viewOptions": {refreshDataOnLoad: true, "ui": "grid", "id": "__manageworkflowevents__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, "label": "Workflow Events", "fields": [
        {"label": "Collection Id", "field": "collectionid", "visibilityGrid": false, "visibilityForm": false, "ui": "autocomplete", "width": "200px", collection: "pl.collections", displayField: "collection", type: "fk"},
        {"label": "Event", "field": "event", "visibility": true, "ui": "text", "width": "200px"},
        {"label": "Action", "field": "action", "visibility": true, "ui": "text", "width": "200px"},
        {"label": "Condition", "field": "condition", "visibility": true, "ui": "text", "width": "200px"},
        {"label": "Trigger Event", "field": "triggerEvent", "visibility": true, "ui": "text", "width": "200px"},
        {"label": "Parameters", "field": "parameters", "visibility": true, "ui": "text", "width": "200px"}
    ], groups: [
        {title: "Default", label: "Default", separator: false, showTitle: false, showLabel: true}
    ], "collection": "pl.workflowevents", queryGrid: {$collection: "pl.workflowevents", $filter: {collectionid: "$collection_id"}}, queryForm: {$collection: "pl.workflowevents", $filter: {collectionid: "$collection_id"}}}};

    AppViews.__managetrigger__ = {"viewOptions": { refreshDataOnLoad: true, "ui": "grid", "id": "__managetrigger__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: false, showLabel: true, refresh: false, "label": "Collection", insert: true, delete: false, "fields": [
        {"label": "Collection", "field": "collection", "visibilityGrid": true, "visibilityForm": true, "type": "string", "ui": "text", "width": "200px", group: "Default", "editableWhen": "$__insert__"},
        {"label": "Parent Collection", "field": "parentCollection", "visibilityGrid": true, "visibilityForm": true, "type": "string", "ui": "autocomplete", "width": "200px", group: "Default", "editableWhen": "$__insert__", collection: "pl.collections", displayField: "collection"},
        {"label": "Global", "field": "global", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", group: "Default"},
        {"label": "HistoryEnabled", "field": "historyEnabled", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "History Fields", "field": "historyFields", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", group: "Default"},
        {"label": "Responsive Columns", "field": "responsiveColumns", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "200px", group: "Default"},
        {"label": "User Sorting", "field": "userSorting", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "200px", group: "Default"},
        {"label": "Do Not Synch", "field": "doNotSynch", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "boolean", group: "Default"},
        {"label": "Primary Field", "field": "primaryField", "visibilityGrid": true, "visibilityForm": true, "ui": "autocomplete", "collection": "pl.fields", displayField: "field", "upsert": true, filter: {collectionid: "$collection_id"}, parameters: {"collection_id": "$collection_id"}, type: "string", "width": "200px", group: "Default"},
        {"label": "Fetch count", "field": "fetchCount", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "100px", group: "Default"},
        {"label": "Aggregate Async", "field": "aggregateAsync", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "100px", group: "Default"},
        {"label": "Comment Enabled", "field": "commentEnabled", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Comment Enabled"},
        {"label": "Source", "field": "comment_source", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "Comment Enabled", "when": '$commentEnabled'},
        {"label": "Event", "field": "comment_event", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "Comment Enabled", "when": '$commentEnabled'},
        {"label": "Display Field", "field": "comment_displayField", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px", group: "Comment Enabled", "when": '$commentEnabled'},
        {"label": "Theme", "field": "theme", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", group: "Default", options: ["list"]},
        {"label": "List Title", upsert: true, "field": "listTitle", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", "when": "this.theme", collection: "pl.fields", displayField: "field", parameters: {collection: "$collection"}, filter: {"collectionid.collection": "$collection"}},
        {"label": "List Sub Title", upsert: true, "field": "listSubTitle", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", "when": "this.theme", collection: "pl.fields", displayField: "field", parameters: {collection: "$collection"}, filter: {"collectionid.collection": "$collection"}},
        {"label": "List Desc", upsert: true, "field": "listDesc", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", "when": "this.theme", collection: "pl.fields", displayField: "field", parameters: {collection: "$collection"}, filter: {"collectionid.collection": "$collection"}},
        {"label": "List Title Indicator", upsert: true, "field": "listTitleIndicator", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", "when": "this.theme", collection: "pl.fields", displayField: "field", parameters: {collection: "$collection"}, filter: {"collectionid.collection": "$collection"}},
        {"label": "List Sub Title Indicator", upsert: true, "field": "listSubTitleIndicator", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", "when": "this.theme", collection: "pl.fields", displayField: "field", parameters: {collection: "$collection"}, filter: {"collectionid.collection": "$collection"}},
        {"label": "List Desc Indicator", upsert: true, "field": "listDescIndicator", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", "when": "this.theme", collection: "pl.fields", displayField: "field", parameters: {collection: "$collection"}, filter: {"collectionid.collection": "$collection"}},
        {"label": "List Caption", upsert: true, "field": "listCaption", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", multiple: true, group: "Default", "when": "this.theme", collection: "pl.fields", displayField: "field", parameters: {collection: "$collection"}, filter: {"collectionid.collection": "$collection"}},
        {"label": "Meteor Tracker", "field": "meteorTracker", "visibilityGrid": false, "visibilityForm": true, "ui": "checkbox", type: "boolean", "width": "200px", group: "Default"}
    ], actions: [
        {id: "Collection", "label": "Collection", type: "filter", "field": "_id", "visibility": true, "filterType": "string", "ui": "autocomplete", collection: "pl.collections", displayField: "collection"},
        {id: "synchChild", "label": "Synch Child", type: "invoke", "onHeader": true, "function": "Fields.synchChild", "parameters": { "collection": "$collection"}, "visibility": true},
        {id: "populateDrillDownView", "label": "Populate Drill Down View", type: "invoke", "onHeader": true, "function": "Fields.populateDrillDownView", "parameters": { "collection": "$collection"}, "visibility": true},
        {"label": "Fields", "type": "view", qviews: [
            {id: "__editfield__"}
        ], "onRow": true, parameters: {"collection_id": "$_id"}},
        {"label": "Actions", "type": "view", qviews: [
            {id: "__editaction__"}
        ], "onRow": true, parameters: {"collection_id": "$_id"}},
        {"label": "Qviews", "type": "view", qviews: [
            {id: "__editquickview__"}
        ], "onRow": true, parameters: {"mainCollection_id": "$_id"}},
        {"label": "Events", "type": "view", qviews: [
            {id: "__manageevents__"}
        ], "onRow": true, parameters: {"collection_id": "$_id"}},
        {"label": "WorkFlow Events", "type": "view", qviews: [
            {id: "__manageworkflowevents__"}
        ], "onRow": true, parameters: {"collection_id": "$_id"}},
        {"label": "Templates", "type": "view", qviews: [
            {id: "__edittemplates__"}
        ], "onRow": true, parameters: {"collection_id": "$_id"}},
        {"label": "Indexes", "type": "view", qviews: [
            {id: "__manageIndexes__"}
        ], "onRow": true, parameters: {"collection_id": "$_id"}},
        {"label": "Form Groups", "type": "view", qviews: [
            {id: "__manageFormGroup__"}
        ], "onRow": true, parameters: {"collection_id": "$_id"}},
        {"label": "Series", "type": "view", qviews: [
            {id: "__series__"}
        ], "onRow": true, parameters: {"collection_id": "$_id"}},
        {"label": "Filter Space", "type": "view", qviews: [
            {id: "__filterspace__"}
        ], "onRow": true, parameters: {"collection_id": "$_id"}}
    ], groups: [
        {title: "Default", label: "Default", separator: false, showTitle: false, showLabel: true},
        {title: "Comment Enabled", label: "Comment Enabled", separator: false, showTitle: true, showLabel: true}
    ], "collection": "pl.collections", queryGrid: {$collection: "pl.collections", $filter: {_id: {"$$whenDefined": {"key": "$collection_id"}}}, $sort: {collection: 1}, $limit: 50, $events: [
        {event: "onQuery", function: "MainCollectionEvents.executeResultForNavigation", post: true},
        {event: "onQuery", function: "MainCollectionEvents.onResult", post: false}
    ]}, queryForm: {$collection: "pl.collections", $filter: {_id: "$collection_id"}}}};


    AppViews.__manageIndexes__ = {"viewOptions": {refreshDataOnLoad: true, "ui": "grid", "id": "__manageIndexes__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, "label": "Indexes", "fields": [
        {"label": "Collection Id", "field": "collectionid", "visibilityGrid": false, "visibilityForm": false, "ui": "autocomplete", "width": "200px", collection: "pl.collections", displayField: "collection", type: "fk"},
        {"label": "Name", "field": "name", visibility: true, "ui": "text", "width": "200px", type: "string"},
        {"label": "Indexes", "field": "indexes", visibility: true, "ui": "text", "width": "200px", type: "string"},
        {"label": "Unique", "field": "unique", visibility: true, "ui": "checkbox", "width": "200px", type: "boolean"},
        {"label": "Message", "field": "message", visibility: true, "ui": "text", "width": "200px", type: "string", when: "this.unique==true"},
        {"label": "Background", "field": "background", visibility: true, "ui": "checkbox", "width": "200px", type: "boolean"},
        {"label": "Sparse", "field": "sparse", visibility: true, "ui": "checkbox", "width": "200px", type: "boolean"},
        {"label": "Drop Dups", "field": "dropDups", visibility: true, "ui": "checkbox", "width": "200px", type: "boolean"},
        {"label": "Expire After Seconds", "field": "expireAfterSeconds", visibility: true, "ui": "number", "width": "200px", type: "number"}
    ], events: [
        {
            function: {source: "ApplaneFunctions/lib/AppSystemEvents",
                name: "onInsertIndexes"},
            event: "onInsert"
        }
    ],
        "collection": "pl.indexes",
        queryGrid: {$collection: "pl.indexes", $filter: {collectionid: "$collection_id"}, $sort: {index: 1}},
        queryForm: {$collection: "pl.indexes", $filter: {collectionid: "$collection_id"}, $sort: {index: 1}}
    }};


    AppViews.__manageFormGroup__ = {"viewOptions": {refreshDataOnLoad: true, "ui": "grid", "id": "__manageFormGroup__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, "label": "Form Groups", "fields": [
        {"label": "Collection Id", "field": "collectionid", "visibilityGrid": false, "visibilityForm": false, "ui": "autocomplete", "width": "200px", collection: "pl.collections", displayField: "collection", type: "fk"},
        {"label": "Index", "field": "index", visibility: true, "ui": "number", "width": "200px", type: "number"},
        {"label": "Title", "field": "title", visibility: true, "ui": "text", "width": "200px", type: "string"},
        {"label": "No. of columns per row", "field": "noOfColumnsPerRow", visibility: true, "ui": "number", "width": "200px", type: "number"},
        {"label": "When", "field": "when", visibility: true, "ui": "text", "width": "200px", type: "string"},
        {"label": "Tab Label", "field": "tabLabel", visibility: true, "ui": "text", "width": "200px", type: "string"},
        {"label": "Show title", "field": "showTitle", visibility: true, "ui": "checkbox", "width": "200px", type: "boolean"},
        {"label": "Separator", "field": "separator", visibility: true, "ui": "checkbox", "width": "200px", type: "boolean"},
        {"label": "Show label", "field": "showLabel", visibility: true, "ui": "checkbox", "width": "200px", type: "boolean"},
        {"label": "type", "field": "type", visibility: true, "ui": "autocomplete", "width": "200px", type: "string", options: ["flow"]}

    ], events: AppViews.__insertEvents__,
        "collection": "pl.formgroups",
        queryGrid: {$collection: "pl.formgroups", $filter: {collectionid: "$collection_id"}, $sort: {index: 1}},
        queryForm: {$collection: "pl.formgroups", $filter: {collectionid: "$collection_id"}, $sort: {index: 1}}
    }};


    AppViews.__createfunction__ = {"viewOptions": { "ui": "form", "id": "__createfunction__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, "label": "Create Function", "fields": [
        {"label": "Name", "field": "name", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "200px" },
        {"label": "Source", "field": "source", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "200px"},
        {"label": "Type", "field": "type", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "200px"},
        {"label": "Do Not Synch", "field": "doNotSynch", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", "width": "200px", type: "boolean"}
    ], "collection": "pl.functions"}};

    AppViews.__editfunction__ = {"viewOptions": {refreshDataOnLoad: true, "ui": "grid", "id": "__editfunction__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: false, viewControl: false, showLabel: true, refresh: false, "label": "Functions", "fields": AppViews.__createfunction__.viewOptions.fields, "collection": "pl.functions", queryGrid: {$collection: "pl.functions", $sort: {name: 1}, $limit: 50, $events: [
        {event: "onQuery", function: "MainCollectionEvents.executeResultForNavigation", post: true},
        {event: "onQuery", function: "MainCollectionEvents.onResult", post: false}
    ]}}};

    AppViews.__createQuery__ = {"viewOptions": { "ui": "form", "id": "__createQuery__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, "label": "Create Query", "fields": [
        {"label": "ID", "field": "id", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "200px" },
        {"label": "Query", "field": "query", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "200px"}
    ], "collection": "pl.queries"}};

    AppViews.__editQuery__ = {"viewOptions": {refreshDataOnLoad: true, "ui": "grid", "id": "__editQuery__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: false, viewControl: false, showLabel: true, refresh: false, "label": "Add Query", "fields": AppViews.__createQuery__.viewOptions.fields, "collection": "pl.queries", queryGrid: {$collection: "pl.queries", $sort: {name: 1}, $limit: 50}}};

    AppViews.__createmenu__ = {"viewOptions": { "ui": "form", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, "id": "__createmenu__", "label": "Add Menu", showLabel: true, saveOptions: {editMode: true}, resize: false, "fields": [
        {"label": "Index", "field": "index", "visibilityGrid": true, "visibilityForm": true, "ui": "number", "width": "50px"},
        {"label": "Label", "field": "label", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "200px"},
        {"label": "Collection", "field": "collection", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "200px"},
        {"label": "When", "field": "when", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "200px"},
        {"label": "Application", "field": "application", "visibilityGrid": false, "visibilityForm": false, "ui": "autocomplete", "width": "200px", collection: "pl.applications", displayField: "id", type: "fk"},
        {"label": "Parent Menu", "field": "parentmenu", "visibilityGrid": true, "visibilityForm": true, "ui": "autocomplete", type: "fk", "width": "200px", collection: "pl.menus", displayField: "label", filter: {application: "$currentappid"}, parameters: {currentappid: "$currentappid"}},
        {"label": "Default Quick View", "field": "defaultqview", "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "fk", "width": "200px", collection: "pl.qviews", displayField: "id", parameters: {collection: "$collection"}, filter: {"collection.collection": "$collection"}},
        {"label": "Quick views", "field": "qviews", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", "width": "200px", multiple: true, fields: [
            {"label": "Collection", "field": "collection", "visibilityForm": true, "ui": "autocomplete", "width": "200px", group: "Default", "collection": "pl.collections", displayField: "collection", type: "string"},
            {"label": "Id", "field": "id", "visibilityForm": true, "ui": "autocomplete", "width": "200px", type: "string", group: "Default", collection: "pl.qviews", displayField: "id", parameters: {collection: "$collection"}, filter: {"collection.collection": "$collection"}},
            {"label": "Index", "field": "index", "visibilityGrid": false, "visibilityForm": true, "ui": "number", "width": "200px"},
            {"label": "Label", "field": "label", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px"},
            {"label": "UI", "field": "ui", "visibilityGrid": false, "visibilityForm": true, "ui": "text", "width": "200px"},
            {"label": "Limit", "field": "limit", "visibilityGrid": false, "visibilityForm": true, "ui": "number", "width": "200px"}
        ]}
    ], events: AppViews.__insertEvents__, "collection": "pl.menus", queryGrid: {$collection: "pl.menus", $filter: {application: "$currentappid"}, $sort: {index: 1}}, queryForm: {$collection: "pl.menus", $filter: {application: "$currentappid"}}}};


    AppViews.__editemenu__ = {
        "viewOptions": {
            refreshDataOnLoad: true, "ui": "grid", close: true, width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, "id": "__editemenu__", "label": "Menus",
            showLabel: true, resize: false, "fields": AppViews.__createmenu__.viewOptions.fields, viewControl: false,
            events: AppViews.__createmenu__.viewOptions.events,
            "collection": "pl.menus",
            queryGrid: AppViews.__createmenu__.viewOptions.queryGrid,
            queryForm: AppViews.__createmenu__.viewOptions.queryForm
        }};


    AppViews.__edituser__ = { "viewOptions": {refreshDataOnLoad: true, "ui": "grid", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, viewControl: false, "id": "__edituser__", close: true, showLabel: true, "label": "Users", "fields": [
        {"label": "Name", "field": "username", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", group: "Default", filterable: true},
        {"label": "Emailid", "field": "emailid", "visibilityGrid": true, "visibilityForm": true, "ui": "text", type: "string", "width": "200px", group: "Default", filterable: true},
        {"label": "FullName", "field": "fullname", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "200px", group: "Default"},
        {"label": "Password", "field": "password", "visibilityGrid": false, "visibilityForm": true, "ui": "password", group: "Default"},
        {"label": "Page size", "field": "no_of_records", "visibilityGrid": true, "visibilityForm": true, "ui": "number", "width": "200px", group: "Default"},
        {"label": "Admin", "field": "admin", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "Developer", "field": "developer", "visibilityGrid": true, "visibilityForm": true, "ui": "checkbox", "width": "200px", group: "Default"},
        {"label": "Status", "field": "status", "visibilityGrid": true, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", group: "Default", options: ["active", "deactive"]},
        {"label": "Roles", "field": "roles", "visibilityGrid": false, "visibilityForm": true, "ui": "grid", "width": "200px", multiple: true, fields: [
            {"label": "Application", "field": "appid", "visibilityGrid": true, "visibilityForm": true, "ui": "autocomplete", type: "string", "width": "200px", collection: "pl.applications", displayField: "id"},
            {"label": "Role", "field": "role", filterable: true, "visibilityGrid": false, "visibilityForm": true, "ui": "autocomplete", type: "fk", "width": "200px", collection: "pl.roles", displayField: "id", filter: {applicationid: "$appid"}, parameters: {appid: "$appid"}, "fields": [
                {"label": "Span", "field": "span", "visibilityGrid": false, "visibilityForm": true, "ui": "number", type: "number", "width": "200px", editableWhen: "false"},
                {"label": "Group", "field": "group", "visibilityGrid": false, "visibilityForm": true, "ui": "number", type: "number", "width": "200px", editableWhen: "false"}
            ]}
        ]}
    ], groups: [
        {title: "Default", label: "Default", separator: false, showTitle: false, showLabel: true}
    ], "collection": "pl.users", queryGrid: {$collection: "pl.users", $fields: {username: 1, emailid: 1, fullname: 1, no_of_records: 1, admin: 1, status: 1, developer: 1}, $sort: {username: 1}, $limit: 100}, queryForm: {$collection: "pl.users", $fields: {"roles._id": 1, "roles.role.role": 1, "roles.role.id": 1, "roles.role.span": 1, "roles.role.group": 1, "roles.appid": 1}}}};

    AppViews.__emailtracker__ = { "viewOptions": {refreshDataOnLoad: true, "ui": "grid", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, viewControl: false, "id": "__emailtracker__", close: false, showLabel: true, "label": "Email Tracker", "fields": [
        {"label": "Function", "field": "function", "visibilityGrid": true, "visibilityForm": true, "ui": "text", "width": "200px"}
    ], "collection": "pl.emailtrackers"}};
    AppViews.__qviewReferences__ = {"viewOptions": { refreshDataOnLoad: true, "ui": "grid", "id": "__qviewReferences__", "responsiveColumns": '{"$title": "fk.label", "$rightField": "type", "$otherFields": ["mainfk.label"]}', width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: false, showLabel: true, refresh: false, "label": "Qview References", insert: true, delete: false, "fields": [
        {"label": "Qview Id", "field": "id", "visibilityGrid": true, "visibilityForm": true, "type": "string", "ui": "text", "width": "200px", group: "Default", "filterable": true},
        {"label": "Collection", "field": "collection", "visibilityGrid": true, "visibilityForm": true, "type": "string", "ui": "text", "width": "200px", group: "Default"}  ,
        {"label": "Fk", "field": "fk.label", "visibilityGrid": true, "visibilityForm": true, "type": "string", "ui": "text", "width": "200px", group: "Default"},
        {"label": "Main Fk", "field": "mainfk.label", "visibilityGrid": true, "visibilityForm": true, "type": "string", "ui": "text", "width": "200px", group: "Default"},
        {"label": "Type", "field": "type", "visibilityGrid": true, "visibilityForm": true, "type": "string", "ui": "text", "width": "200px", group: "Default"}
    ], "collection": "qviewReferences", queryGrid: {$collection: "qviewReferences", $limit: 50, $filter: {id: "$id"}}, queryForm: {$collection: "qviewReferences"}}};

    AppViews.__filterspace__ = {"viewOptions": {refreshDataOnLoad: true, "ui": "grid", "id": "__filterspace__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, "label": "Filter Space", "fields": [
        {"label": "Space", "field": "space", visibility: true, "ui": "text", "width": "200px", type: "string"}
    ],
        "collection": "pl.filterspace",
        queryGrid: {$collection: "pl.filterspace", $sort: {index: 1}},
        queryForm: {$collection: "pl.filterspace", $sort: {index: 1}}
    }};

    AppViews.__series__ = {"viewOptions": {refreshDataOnLoad: true, "ui": "grid", "id": "__series__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, "label": "Series", "fields": [
        {"label": "Collection", "field": "collection", filterable: true, "visibility": true, "ui": "text", "width": "200px", type: "string"},
        {"label": "Series", "field": "series", filterable: true, visibility: true, "ui": "text", "width": "200px", type: "string"},
        {"label": "Number", "field": "number", filterable: true, visibility: true, "ui": "text", "width": "200px", type: "number"}
    ],
        "collection": "pl.series",
        queryGrid: {$collection: "pl.series", $sort: {index: 1}},
        queryForm: {$collection: "pl.series", $sort: {index: 1}}
    }};

    AppViews.__setfield__ = {"viewOptions": {refreshDataOnLoad: true, "ui": "form", "id": "__setfield__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, "label": "Set Field", "fields": [
        {field: "db", label: "Db", type: "string", ui: "text", visibility: true},
        {field: "collection", label: "Collection", type: "string", ui: "text", visibility: true},
        {field: "field", label: "Field", type: "string", ui: "text", visibility: true},
        {field: "filter", label: "Filter", type: "string", ui: "text", visibility: true},
        {field: "cursor", label: "Cursor", type: "number", ui: "number", visibility: true},
        {field: "limit", label: "Limit", type: "number", ui: "number", visibility: true}
    ]
    }};

    AppViews.__commit__ = {"viewOptions": {refreshDataOnLoad: true, "ui": "form", "id": "__commit__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, "label": "Commit", "fields": [
        {field: "commit", label: "Commit", type: "boolean", ui: "checkbox", visibility: false, "width": "200px"},
        {field: "type", label: "Type", type: "string", ui: "autocomplete", visibility: true, "width": "200px", options: ["application", "collection", "function", "role", "filterspace", "emailtracker", "fieldCustomization", "qview", "qviewCustomization", "service", "pl_applications", "pl_views"]},
        {field: "value", label: "Value", type: "string", ui: "text", visibility: true, "width": "200px"}
    ]
    }};

    AppViews.__removeCache__ = {"viewOptions": {refreshDataOnLoad: true, "ui": "form", "id": "__removeCache__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, "label": "Remove Cache", "fields": [
        {field: "all", label: "Clear Complete Cache", type: "boolean", ui: "checkbox", visibility: false, "width": "200px"},
        {"label": "DB", "field": "db", "ui": "autocomplete", "width": "200px", visibility: true, type: "string", collection: "pl.dbs", displayField: "db", events: [
            {
                function: "Porting.getDbs",
                event: "onQuery",
                post: true
            }
        ]},
        {field: "username", label: "User Name", type: "string", ui: "autocomplete", visibility: true, "width": "200px", collection: "pl.users", displayField: "username", parameters: {"db": "$db"}, events: [
            {
                function: "Porting.getUser",
                event: "onQuery",
                post: true
            }
        ]}
    ]
    }};

    AppViews.__ensureindexes__ = {"viewOptions": {refreshDataOnLoad: true, "ui": "form", "id": "__ensureindexes__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, "label": "Ensure Indexes", "fields": [
        {"field": "db", "label": "DB", type: "string", "ui": "autocomplete", "width": "200px", visibility: true, collection: "pl.dbs", displayField: "db", events: [
            {
                function: "Porting.getDbs",
                event: "onQuery",
                post: true
            }
        ]},
        {"label": "Collection", "field": "collection", "visibility": true, "ui": "autocomplete", type: "string", "width": "200px", collection: "pl.collections", displayField: "collection"}
    ]
    }};

    AppViews.__usersetting__ = {"viewOptions": {data: "data", refreshDataOnLoad: true, "ui": "form", "id": "__usersetting__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, "label": "Setting", "fields": [
        {"label": "Full Name", "field": "fullname", visibility: true, "ui": "text", "width": "200px", type: "string", group: "Default"} ,
        {"label": "User Name", "field": "username", visibility: true, "ui": "text", "width": "200px", type: "string", group: "Default", editableWhen: "false"} ,
        {"label": "Emailid", "field": "emailid", visibility: true, "ui": "text", "width": "200px", type: "string", group: "Default", editableWhen: "false"},
        {"label": "Page size", "field": "no_of_records", visibility: true, "ui": "number", "width": "200px", type: "number", group: "Default"},
        {"label": "Calender Enabled", "field": "calenderenabled", visibility: true, "ui": "checkbox", "width": "200px", type: "boolean", group: "Default"},
        {"label": "Mail Track Enabled", "field": "mailtrackenabled", visibility: true, "ui": "checkbox", "width": "200px", type: "boolean", group: "Default"},
        {"label": "Image", "field": "image", visibility: true, "ui": "image", "width": "200px", type: "file", group: "Default"}
    ], groups: [
        {title: "Default", label: "Default", separator: false, showTitle: false, showLabel: true}
    ],
        "collection": "pl.users",
        queryGrid: {$collection: "pl.users", $filter: {_id: {"$function": {"Functions.CurrentUser": {"_id": 1}}}}, $fields: {username: 1, emailid: 1, no_of_records: 1, "mailtrackenabled": 1, calenderenabled: 1, image: 1, fullname: 1}},
        queryForm: {$collection: "pl.users", $filter: {_id: {"$function": {"Functions.CurrentUser": {"_id": 1}}}}, $fields: {username: 1, emailid: 1, no_of_records: 1, "mailtrackenabled": 1, calenderenabled: 1, image: 1, fullname: 1}}
    }, data: [
        {}
    ]};

    AppViews.__addtemplates__ = {"viewOptions": {"ui": "form", "id": "__addtemplates__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, viewControl: false, "label": "Add Templates", "fields": [
        {"label": "Template", "field": "template", visibility: true, "ui": "textarea", "width": "200px", type: "string"} ,
        {"label": "Template Type", "field": "templateType", "visibility": true, "ui": "autocomplete", type: "string", "width": "200px", "options": ["ejs", "xslt"]},
        {"label": "Type", "field": "type", visibility: true, "ui": "autocomplete", type: "string", "width": "200px", options: ["print", "sendMail"], group: "Default"},
        {"label": "Function", "field": "function", visibility: true, "ui": "text", "width": "200px", type: "string"} ,
        {"label": "Query", "field": "query", visibility: true, "ui": "text", "width": "200px", type: "string"} ,
        {"label": "Id", "field": "id", visibility: true, "ui": "text", "width": "200px", type: "string"} ,
        {"label": "Collection", "field": "collectionid", visibility: false, "ui": "autocomplete", "width": "200px", collection: "pl.collections", displayField: "collection", type: "fk", group: "Default"},
        {"label": "To", "field": "to", visibility: true, "ui": "text", "width": "200px", type: "string", when: "this.type=='sendMail'"}  ,
        {"label": "Subject", "field": "subject", visibility: true, "ui": "text", "width": "200px", type: "string", when: "this.type=='sendMail'"} ,
        {"label": "From", "field": "from", visibility: true, "ui": "text", "width": "200px", type: "string", when: "this.type=='sendMail'"},
        {"label": "Attachments", "field": "attachments", visibility: true, "ui": "text", "width": "200px", type: "string", when: "this.type=='sendMail'"}
    ], "collection": "pl.templates",
        queryGrid: {$collection: "pl.templates", $filter: {"collectionid": "$collection_id"}, $fields: {template: 1, templateType: 1, type: 1, function: 1, query: 1, id: 1, to: 1, subject: 1, from: 1, attachments: 1}, $sort: {_id: -1}},
        queryForm: {$collection: "pl.templates", $filter: {"collectionid": "$collection_id"}, $fields: {template: 1, templateType: 1, type: 1, function: 1, query: 1, id: 1, to: 1, subject: 1, from: 1, attachments: 1}, $sort: {_id: -1}}
    }};

    AppViews.__edittemplates__ = {
        "viewOptions": {
            refreshDataOnLoad: true, "ui": "grid", "id": "__edittemplates__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, navigation: false, viewControl: false, "label": "Templates", "fields": AppViews.__addtemplates__.viewOptions.fields,
            "collection": "pl.templates",
            queryGrid: AppViews.__addtemplates__.viewOptions.queryGrid, queryForm: AppViews.__addtemplates__.viewOptions.queryForm
        }};

    AppViews.__otherFunctions__ = {"viewOptions": {refreshDataOnLoad: true, "ui": "form", "id": "__otherFunctions__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, "label": "Other Functions", "fields": [
        {field: "functionName", label: "Function Name", type: "string", ui: "autocomplete", visibility: true, "width": "200px", options: ["Clear Cache", "Clear View State", "Get User Role Previleges", "Set Field", "Ensure Indexes", "Remove Collection", "Get Multiple Updated Fields", "Update Multiple Updated Fields"]},
        {"label": "DB's", "field": "dbs", "ui": "autocomplete", "width": "200px", visibility: true, multiple: true, "when": "this.functionName == 'Set Field'", type: "string", collection: "pl.dbs", displayField: "db", events: [
            {
                function: "Porting.getDbs",
                event: "onQuery",
                post: true
            }
        ]},
        {"label": "DB", "field": "db", "ui": "autocomplete", "width": "200px", visibility: true, "when": "this.functionName != 'Set Field'", type: "string", collection: "pl.dbs", displayField: "db", events: [
            {
                function: "Porting.getDbs",
                event: "onQuery",
                post: true
            }
        ]},
        {field: "username", label: "User Name", type: "string", ui: "autocomplete", visibility: true, "width": "200px", collection: "pl.users", displayField: "username", parameters: {"db": "$db"}, "when": "this.functionName == 'Clear Cache' || this.functionName =='Clear View State' || this.functionName =='Get User Role Previleges'", events: [
            {
                function: "Porting.getUser",
                event: "onQuery",
                post: true
            }
        ]},
        {field: "all", label: "Clear Complete Cache", type: "boolean", ui: "checkbox", visibility: false, "width": "200px", "when": "this.functionName == 'Clear Cache'"},
        {field: "view_id", label: "View Id", type: "string", ui: "text", visibility: true, "width": "200px", "when": "this.functionName == 'Clear View State'"},
        {field: "viewstate", label: "View State", type: "boolean", ui: "checkbox", visibility: true, "width": "200px", "when": "this.functionName == 'Clear View State'"},
        {field: "state", label: "State", type: "boolean", ui: "checkbox", visibility: true, "width": "200px", "when": "this.functionName == 'Clear View State'"},
        {field: "collection", label: "Collection", type: "string", ui: "autocomplete", visibility: true, "width": "200px", collection: "pl.collections", displayField: "collection", "when": "this.functionName == 'Get User Role Previleges' || this.functionName == 'Set Field'  ||  this.functionName =='Ensure Indexes' ||  this.functionName =='Update Multiple Updated Fields' || this.functionName =='Remove Collection' "},
        {field: "fields", label: "Fields", type: "string", ui: "autocomplete", visibility: true, multiple: true, upsert: true, "when": "this.functionName == 'Set Field'", collection: "pl.fields", displayField: "field", filter: {"collectionid.collection": "$collection"}, parameters: {"collection": "$collection"}},
        {field: "field", label: "Field", type: "string", ui: "text", visibility: true, "when": "this.functionName == 'Update Multiple Updated Fields'"},
        {field: "type", label: "Type", type: "string", ui: "autocomplete", options: ["Remove", "Update"], visibility: true, "when": "this.functionName == 'Update Multiple Updated Fields'"},
        {field: "filter", label: "Filter", type: "string", ui: "text", visibility: true, "when": "this.functionName == 'Set Field' "},
        {field: "cursor", label: "Cursor", type: "number", ui: "number", visibility: true, "when": "this.functionName == 'Set Field' "},
        {field: "limit", label: "Limit", type: "number", ui: "number", visibility: true, "when": "this.functionName == 'Set Field' "} ,
        {field: "all", label: "All", type: "boolean", ui: "checkbox", visibility: false, "width": "200px", "when": "this.functionName == 'Get User Role Previleges'"}
    ]
    }};

    AppViews.__addmslowqueries__ = {"viewOptions": {navigation: true, "ui": "form", "id": "__addmslowqueries__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, viewControl: false, "label": "Add Slow query logs", "fields": [
        {"label": "namespace", "field": "namespace", visibility: true, "ui": "text", "width": "200px", type: "string", filterable: true} ,
        {"label": "operation", "field": "operation", visibility: true, "ui": "autocomplete", type: "string", "width": "50px", options: ["query", "update", "command", "insert", "remove"], filterable: true },
        {"label": "duration", "field": "duration", visibility: true, "ui": "number", "width": "50px", type: "string", sortable: true} ,
        {"label": "numYields", "field": "numYields", visibility: true, "ui": "text", "width": "50px", type: "string"} ,
        {"label": "datetime", "field": "datetime", visibility: true, "ui": "date", time: true, "width": "100px", type: "date", filterable: true} ,
        {"label": "nreturned", "field": "nreturned", visibility: false, "ui": "text", "width": "50px"},
        {"label": "ntoreturn", "field": "ntoreturn", visibility: true, "ui": "text", "width": "50px", type: "string"}  ,
        {"label": "nscanned", "field": "nscanned", visibility: true, "ui": "text", "width": "50px", type: "string", sortable: true} ,
        {"label": "r", "field": "r", visibility: true, "ui": "text", "width": "50px", type: "string"},
        {"label": "line_str", "field": "line_str", visibility: true, "ui": "text", type: "string", width: "2000px"},
        {"label": "Token", "field": "split_tokens", visibility: true, "ui": "JSON", type: "string", width: "500px"}
    ], "collection": "pl.mslowqueries",
        queryGrid: {$collection: "pl.mslowqueries", $filter: {operation: "query"}, $sort: {duration: -1}, $limit: 100}

    }};

    AppViews.__mslowqueries__ = {
        "viewOptions": {
            saveUserState: false, navigation: true, refreshDataOnLoad: true, "ui": "grid", "id": "__mslowqueries__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, viewControl: false, "label": "Slow queries", "fields": AppViews.__addmslowqueries__.viewOptions.fields,
            "collection": AppViews.__addmslowqueries__.viewOptions.collection,
            queryGrid: AppViews.__addmslowqueries__.viewOptions.queryGrid, queryForm: AppViews.__addmslowqueries__.viewOptions.queryForm
        }};

    AppViews.__add_application_new__ = {"viewOptions": {navigation: true, "ui": "form", "id": "__add_application_new__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, viewControl: true, "label": "Add Applications_New", "fields": [
        {"label": "id", "field": "id", visibility: true, "ui": "text", "width": "150px", type: "string"} ,
        {"label": "menus", "field": "menus", visibility: true, "ui": "text", "width": "800px", type: "string", json: true}
    ], "collection": "pl_applications",
        queryGrid: {$collection: "pl_applications"}
    }};

    AppViews.__edit_application_new__ = {
        "viewOptions": {
            saveUserState: false, navigation: true, refreshDataOnLoad: true, "ui": "grid", "id": "__edit_application_new__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, viewControl: true, "label": "Applications_New", "fields": AppViews.__add_application_new__.viewOptions.fields,
            "collection": AppViews.__add_application_new__.viewOptions.collection,
            queryGrid: AppViews.__add_application_new__.viewOptions.queryGrid, queryForm: AppViews.__add_application_new__.viewOptions.queryForm
        }};

    AppViews.__add_views_new__ = {"viewOptions": {navigation: true, "ui": "form", "id": "__add_views_new__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, viewControl: true, "label": "Add View_New", "fields": [
        {"label": "id", "field": "id", visibility: true, "ui": "text", "width": "150px", type: "string"} ,
        {"label": "struct", "field": "struct", visibility: true, "ui": "text", "width": "800px", type: "string", json: true}
    ], "collection": "pl_views",
        queryGrid: {$collection: "pl_views"}
    }};

    AppViews.__edit_views_new__ = {
        "viewOptions": {
            saveUserState: false, navigation: true, refreshDataOnLoad: true, "ui": "grid", "id": "__edit_views_new__", width: AppViews.POPUP_WIDTH, height: AppViews.POPUP_HEIGHT, resize: false, close: true, showLabel: true, refresh: false, viewControl: true, "label": "View_New", "fields": AppViews.__add_views_new__.viewOptions.fields,
            "collection": AppViews.__add_views_new__.viewOptions.collection,
            queryGrid: AppViews.__add_views_new__.viewOptions.queryGrid, queryForm: AppViews.__add_views_new__.viewOptions.queryForm
        }};

    AppViews.__appstudio__ = {label: "AppStudio", _id: "__appstudio__", menus: [
        {_id: "__edit_application_new__", __system__: true, when: "user.appcenterDeveloper", label: "Applications New", application: {_id: "__appstudio__"}, collection: "pl_applications", qviews: [
            {id: "__edit_application_new__", closeViewIndex: 0}
        ]},
        {_id: "__editapplication__", __system__: true, label: "Applications", when: "!user.appcenterDeveloper", application: {_id: "__appstudio__"}, collection: "pl.applications", qviews: [
            {id: "__editapplication__", closeViewIndex: 0}
        ]},
        {_id: "__edit_views_new__", __system__: true, when: "user.appcenterDeveloper", label: "Views New", application: {_id: "__appstudio__"}, collection: "pl_views", qviews: [
            {id: "__edit_views_new__", closeViewIndex: 0}
        ]},
        {_id: "__managetrigger__", __system__: true, label: "Collection", application: {_id: "__appstudio__"}, collection: "pl.collections", qviews: [
            {id: "__managetrigger__", closeViewIndex: 0}
        ]},
        {_id: "__editrole__", __system__: true, label: "Roles", application: {_id: "__appstudio__"}, collection: "pl.roles", qviews: [
            {id: "__editrole__", closeViewIndex: 0}
        ]},
        {_id: "__editfunction__", __system__: true, label: "Functions", application: {_id: "__appstudio__"}, collection: "pl.functions", qviews: [
            {id: "__editfunction__", closeViewIndex: 0}
        ]},
        {_id: "__editquickview__", __system__: true, label: "QViews", application: {_id: "__appstudio__"}, collection: "pl.qviews", qviews: [
            {id: "__editquickview__", closeViewIndex: 0}
        ]},
        {_id: "__emailtracker__", __system__: true, label: "Email Tracker", application: {_id: "__appstudio__"}, collection: "pl.emailtrackers", qviews: [
            {id: "__emailtracker__", closeViewIndex: 0}
        ]},
        {id: "__editServices__", __system__: true, label: "Services", application: {_id: "__appstudio__"}, collection: "pl.services", qviews: [
            {id: "__editServices__", closeViewIndex: 0}
        ]}
    ]};
})();

/* angular-strp starts from here*/
(function (window, document, undefined) {
    'use strict';

    angular.module('ngCookies', ['ng']).
        factory('$cookies', ['$rootScope', '$browser', function ($rootScope, $browser) {
            var cookies = {},
                lastCookies = {},
                lastBrowserCookies,
                runEval = false,
                copy = angular.copy,
                isUndefined = angular.isUndefined;

            //creates a poller fn that copies all cookies from the $browser to service & inits the service
            $browser.addPollFn(function () {
                var currentCookies = $browser.cookies();
                if (lastBrowserCookies != currentCookies) { //relies on browser.cookies() impl
                    lastBrowserCookies = currentCookies;
                    copy(currentCookies, lastCookies);
                    copy(currentCookies, cookies);
                    if (runEval) $rootScope.$apply();
                }
            })();

            runEval = true;

            //at the end of each eval, push cookies
            //TODO: this should happen before the "delayed" watches fire, because if some cookies are not
            //      strings or browser refuses to store some cookies, we update the model in the push fn.
            $rootScope.$watch(push);

            return cookies;


            /**
             * Pushes all the cookies from the service to the browser and verifies if all cookies were
             * stored.
             */
            function push() {
                var name,
                    value,
                    browserCookies,
                    updated;

                //delete any cookies deleted in $cookies
                for (name in lastCookies) {
                    if (isUndefined(cookies[name])) {
                        $browser.cookies(name, undefined);
                    }
                }

                //update all cookies updated in $cookies
                for (name in cookies) {
                    value = cookies[name];
                    if (!angular.isString(value)) {
                        value = '' + value;
                        cookies[name] = value;
                    }
                    if (value !== lastCookies[name]) {
                        $browser.cookies(name, value);
                        updated = true;
                    }
                }

                //verify what was actually stored
                if (updated) {
                    updated = false;
                    browserCookies = $browser.cookies();

                    for (name in cookies) {
                        if (cookies[name] !== browserCookies[name]) {
                            //delete or reset all cookies that the browser dropped from $cookies
                            if (isUndefined(browserCookies[name])) {
                                delete cookies[name];
                            } else {
                                cookies[name] = browserCookies[name];
                            }
                            updated = true;
                        }
                    }
                }
            }
        }]).
        factory('$cookieStore', ['$cookies', function ($cookies) {

            return {
                /**
                 * @ngdoc method
                 * @name $cookieStore#get
                 *
                 * @description
                 * Returns the value of given cookie key
                 *
                 * @param {string} key Id to use for lookup.
                 * @returns {Object} Deserialized cookie value.
                 */
                get: function (key) {
                    var value = $cookies[key];
                    return value ? angular.fromJson(value) : value;
                },

                /**
                 * @ngdoc method
                 * @name $cookieStore#put
                 *
                 * @description
                 * Sets a value for given cookie key
                 *
                 * @param {string} key Id for the `value`.
                 * @param {Object} value Value to be stored.
                 */
                put: function (key, value) {
                    $cookies[key] = angular.toJson(value);
                },

                /**
                 * @ngdoc method
                 * @name $cookieStore#remove
                 *
                 * @description
                 * Remove given cookie
                 *
                 * @param {string} key Id of the key-value pair to delete.
                 */
                remove: function (key) {
                    delete $cookies[key];
                }
            };

        }]);

    angular.module('mgcrea.ngStrap', [
        'mgcrea.ngStrap.datepicker',
        'mgcrea.ngStrap.timepicker',
        'mgcrea.ngStrap.tooltip',
        'mgcrea.ngStrap.typeahead'
    ]);

    angular.module('mgcrea.ngStrap.datepicker', ['mgcrea.ngStrap.helpers.dateParser', 'mgcrea.ngStrap.tooltip'])

        .provider('$datepicker', function () {

            var defaults = this.defaults = {
                animation: 'am-fade',
                prefixClass: 'datepicker',
                placement: 'bottom-left',
                template: 'datepicker/datepicker.tpl.html',
                trigger: 'downkey', // downKey trigger is for show the calender template with nav-down key
                container: false,
                keyboard: true,
                html: false,
                delay: 0,
                // lang: $locale.id,
                useNative: false,
                dateType: 'date',
                dateFormat: 'shortDate',
                modelDateFormat: null,
                dayFormat: 'dd',
                strictFormat: false,
                autoclose: true,
                minDate: -Infinity,
                maxDate: +Infinity,
                startView: 0,
                minView: 0,
                startWeek: 0,
                daysOfWeekDisabled: '',
                iconLeft: 'glyphicon glyphicon-chevron-left',
                iconRight: 'glyphicon glyphicon-chevron-right'
            };

            this.$get = ["$window", "$document", "$rootScope", "$sce", "$locale", "dateFilter", "datepickerViews", "$tooltip", function ($window, $document, $rootScope, $sce, $locale, dateFilter, datepickerViews, $tooltip) {

                var bodyEl = angular.element($window.document.body);
                var isNative = /(ip(a|o)d|iphone|android)/ig.test($window.navigator.userAgent);
                var isTouch = ('createTouch' in $window.document) && isNative;
                if (!defaults.lang) defaults.lang = $locale.id;

                function DatepickerFactory(element, controller, config) {

                    var $datepicker = $tooltip(element, angular.extend({}, defaults, config));
                    var parentScope = config.scope;
                    var options = $datepicker.$options;
                    var scope = $datepicker.$scope;
                    if (options.startView) options.startView -= options.minView;

                    // View vars

                    var pickerViews = datepickerViews($datepicker);
                    $datepicker.$views = pickerViews.views;
                    var viewDate = pickerViews.viewDate;
                    scope.$mode = options.startView;
                    scope.$iconLeft = options.iconLeft;
                    scope.$iconRight = options.iconRight;
                    var $picker = $datepicker.$views[scope.$mode];

                    // Scope methods

                    scope.$select = function (date, $event) {
                        $event.stopPropagation();
                        $event.preventDefault();
                        $datepicker.select(date);

                    };
                    scope.$selectPane = function (value, $event) {
                        $event.stopPropagation();
                        $event.preventDefault();
                        $datepicker.$selectPane(value);
                    };
                    scope.$toggleMode = function ($event) {
                        $event.stopPropagation();
                        $event.preventDefault();
                        $datepicker.setMode((scope.$mode + 1) % $datepicker.$views.length);
                    };
                    // Public methods
                    $datepicker.update = function (date) {
                        // console.warn('$datepicker.update() newValue=%o', date);
                        if (angular.isDate(date) && !isNaN(date.getTime())) {
                            $datepicker.$date = date;
                            $picker.update.call($picker, date);
                        }
                        // Build only if pristine
                        $datepicker.$build(true);
                    };

                    $datepicker.updateDisabledDates = function (dateRanges) {
                        options.disabledDateRanges = dateRanges;
                        for (var i = 0, l = scope.rows.length; i < l; i++) {
                            angular.forEach(scope.rows[i], $datepicker.$setDisabledEl);
                        }
                    };

                    $datepicker.select = function (date, keep) {
                        // console.warn('$datepicker.select', date, scope.$mode);
                        if (!angular.isDate(controller.$dateValue)) controller.$dateValue = new Date(date);
                        if (!scope.$mode || keep) {
                            controller.$setViewValue(angular.copy(date));
                            controller.$render();
                            if (options.autoclose && !keep) {
                                $datepicker.hide(false);      // set false to keep focus alive on element
                            }
                        } else {
                            angular.extend(viewDate, {year: date.getFullYear(), month: date.getMonth(), date: date.getDate()});
                            $datepicker.setMode(scope.$mode - 1);
                            $datepicker.$build();
                        }
                        if (!scope.$$phase) {     // need to apply if change form panel view
                            scope.$apply();
                        }
                    };

                    $datepicker.setCustomDate = function (date) {
                        // function to handle manual entered date value
                        if (!date && controller.$viewValue) {
                            // code to handle string keywords (today, yesterday, sun, jan, today+1, etc.) for date value
                            var elmValue = controller.$viewValue;
                            //start: in datejs we found issue in april and august months, so we manualy prepend / before month name : Naveen Singh 21/11/2014 .
                            var isAprilOrAugust = /a(p|u)/.test(elmValue);
                            if (isAprilOrAugust) {
                                elmValue = elmValue.replace(/a/g, "/a");
                            }
                            // end :
                            date = Date.parse(elmValue);
                            $datepicker.select(date);
                            return;
                        }
                        if (typeof date != "object") {
                            return;
                        }
                        date = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
                        controller.$setViewValue(date);
                    }
                    $datepicker.setMode = function (mode) {
                        // console.warn('$datepicker.setMode', mode);
                        scope.$mode = mode;
                        $picker = $datepicker.$views[scope.$mode];
                        $datepicker.$build();
                    };

                    // Protected methods

                    $datepicker.$build = function (pristine) {
                        // console.warn('$datepicker.$build() viewDate=%o', viewDate);
                        if (pristine === true && $picker.built) return;
                        if (pristine === false && !$picker.built) return;
                        $picker.build.call($picker);
                    };

                    $datepicker.$updateSelected = function () {
                        for (var i = 0, l = scope.rows.length; i < l; i++) {
                            angular.forEach(scope.rows[i], updateSelected);
                        }
                    };

                    $datepicker.$isSelected = function (date) {
                        return $picker.isSelected(date);
                    };

                    $datepicker.$setDisabledEl = function (el) {
                        el.disabled = $picker.isDisabled(el.date);
                    };

                    $datepicker.$selectPane = function (value) {
                        var steps = $picker.steps;
                        var targetDate = new Date(Date.UTC(viewDate.year + ((steps.year || 0) * value), viewDate.month + ((steps.month || 0) * value), viewDate.date + ((steps.day || 0) * value)));
                        angular.extend(viewDate, {year: targetDate.getUTCFullYear(), month: targetDate.getUTCMonth(), date: targetDate.getUTCDate()});
                        $datepicker.$build();
                    };

                    $datepicker.$onMouseDown = function (evt) {
                        // Prevent blur on mousedown on .dropdown-menu
                        evt.preventDefault();
                        evt.stopPropagation();
                        // Emulate click for mobile devices
                        if (isTouch) {
                            var targetEl = angular.element(evt.target);
                            if (targetEl[0].nodeName.toLowerCase() !== 'button') {
                                targetEl = targetEl.parent();
                            }
                            targetEl.triggerHandler('click');
                        }
                    };
                    $datepicker.$onKeyDown = function (evt) {
                        if (!/(13|37|38|39|40|27)/.test(evt.keyCode) || evt.shiftKey || evt.altKey) {
                            return;
                        }
                        evt.preventDefault();
                        evt.stopPropagation();
                        if (evt.keyCode == 27) {
                            $datepicker.hide();
                            return;
                        }

                        // comment below code as we handle enter key event in $picker.onKeyDown , Naveen Singh 19/11/2014
//                        if (evt.keyCode === 13) {
//                            if (controller.$dateValue) {
//                                $datepicker.select(new Date(controller.$dateValue));
//                            } else {
//                                $datepicker.select(new Date());
//                            }
//                            if (!scope.$mode) {
//                                return $datepicker.hide(true);
//                            } else {
//                                return scope.$apply(function () {
//                                    $datepicker.setMode(scope.$mode - 1);
//                                });
//                            }
//                        }

                        // Navigate with keyboard
                        $picker.onKeyDown(evt);
                        parentScope.$digest();
                    };

                    // Private

                    function updateSelected(el) {
                        el.selected = $datepicker.$isSelected(el.date);
                    }

                    function focusElement() {
                        element[0].focus();
                    }

                    // Overrides

                    var _init = $datepicker.init;
                    $datepicker.init = function () {
                        if (isNative && options.useNative) {
                            element.prop('type', 'date');
                            element.css('-webkit-appearance', 'textfield');
                            return;
                        } else if (isTouch) {
                            element.prop('type', 'text');
                            element.attr('readonly', 'true');
                            element.on('click', focusElement);
                        }
                        _init();
                    };
                    var _destroy = $datepicker.destroy;
                    $datepicker.destroy = function () {
                        if (isNative && options.useNative) {
                            element.off('click', focusElement);
                        }
                        _destroy();
                    };
                    var _show = $datepicker.show;
                    $datepicker.show = function () {

                        var prevElement = element.prev();
//                        prevElement.focus();                           // uncomment this to set focus on previous element on which calender icon is bind,  Naveen Singh : 20/11/2014
                        prevElement.bind('keydown', function (evt) {
                            if (evt.keyCode == 27) {
                                $datepicker.hide();
                            }
                        });

                        _show();

                        setTimeout(function () {
                            if (!$datepicker.$element) {
                                return;
                            }
                            $datepicker.$element.on(isTouch ? 'touchstart' : 'mousedown', $datepicker.$onMouseDown);
                            if (options.keyboard) {
                                element.on('keydown', $datepicker.$onKeyDown);
                            }
                        });
                    };
                    var _hide = $datepicker.hide;
                    $datepicker.hide = function (blur) {
                        if (!$datepicker.$element) {
                            return;
                        }
                        $datepicker.$element.off(isTouch ? 'touchstart' : 'mousedown', $datepicker.$onMouseDown);
                        if (options.keyboard) {
                            element.off('keydown', $datepicker.$onKeyDown);
                        }
                        _hide(blur);
                    };
                    return $datepicker;
                }

                DatepickerFactory.defaults = defaults;
                return DatepickerFactory;

            }];

        })

        .directive('bsDatepicker', ["$window", "$parse", "$q", "$locale", "dateFilter", "$datepicker", "$dateParser", "$timeout", function ($window, $parse, $q, $locale, dateFilter, $datepicker, $dateParser, $timeout) {

            var defaults = $datepicker.defaults;
            var isNative = /(ip(a|o)d|iphone|android)/ig.test($window.navigator.userAgent);
            var isNumeric = function (n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            };

            return {
                restrict: 'EAC',
                require: 'ngModel',
                link: function postLink(scope, element, attr, controller) {

                    // Directive options
                    var options = {scope: scope, controller: controller};
                    angular.forEach(['placement', 'container', 'delay', 'trigger', 'keyboard', 'html', 'animation', 'template', 'autoclose', 'dateType', 'dateFormat', 'modelDateFormat', 'dayFormat', 'strictFormat', 'startWeek', 'startDate', 'useNative', 'lang', 'startView', 'minView', 'iconLeft', 'iconRight', 'daysOfWeekDisabled'], function (key) {
                        if (angular.isDefined(attr[key])) options[key] = attr[key];
                    });

                    // Visibility binding support
                    attr.bsShow && scope.$watch(attr.bsShow, function (newValue, oldValue) {
                        if (!datepicker || !angular.isDefined(newValue)) return;
                        if (angular.isString(newValue)) newValue = !!newValue.match(',?(datepicker),?');
                        newValue === true ? datepicker.show() : datepicker.hide();
                    });

                    // Initialize datepicker
                    var datepicker = $datepicker(element, controller, options);
                    var prevElement = element.prev();
                    prevElement.bind('blur', function (evt) {
                        datepicker.hide();
                    });

                    element.bind('blur', function (evt) {
                        datepicker.setCustomDate(controller.$modelValue);
                        datepicker.hide();
                    });
                    options = datepicker.$options;
                    // Set expected iOS format
                    if (isNative && options.useNative) options.dateFormat = 'yyyy-MM-dd';

                    // Observe attributes for changes
                    angular.forEach(['minDate', 'maxDate'], function (key) {
                        // console.warn('attr.$observe(%s)', key, attr[key]);
                        angular.isDefined(attr[key]) && attr.$observe(key, function (newValue) {
                            // console.warn('attr.$observe(%s)=%o', key, newValue);
                            if (newValue === 'today') {
                                var today = new Date();
                                datepicker.$options[key] = +new Date(today.getFullYear(), today.getMonth(), today.getDate() + (key === 'maxDate' ? 1 : 0), 0, 0, 0, (key === 'minDate' ? 0 : -1));
                            } else if (angular.isString(newValue) && newValue.match(/^".+"$/)) { // Support {{ dateObj }}
                                datepicker.$options[key] = +new Date(newValue.substr(1, newValue.length - 2));
                            } else if (isNumeric(newValue)) {
                                datepicker.$options[key] = +new Date(parseInt(newValue, 10));
                            } else if (angular.isString(newValue) && 0 === newValue.length) { // Reset date
                                datepicker.$options[key] = key === 'maxDate' ? +Infinity : -Infinity;
                            } else {
                                datepicker.$options[key] = +new Date(newValue);
                            }
                            // Build only if dirty
                            !isNaN(datepicker.$options[key]) && datepicker.$build(false);
                        });
                    });

                    // Watch model for changes
                    scope.$watch(attr.ngModel, function (newValue, oldValue) {
                        datepicker.update(controller.$dateValue);
                    }, true);

                    // Normalize undefined/null/empty array,
                    // so that we don't treat changing from undefined->null as a change.
                    function normalizeDateRanges(ranges) {
                        if (!ranges || !ranges.length) return null;
                        return ranges;
                    }

                    if (angular.isDefined(attr.disabledDates)) {
                        scope.$watch(attr.disabledDates, function (disabledRanges, previousValue) {
                            disabledRanges = normalizeDateRanges(disabledRanges);
                            previousValue = normalizeDateRanges(previousValue);

                            if (disabledRanges !== previousValue) {
                                datepicker.updateDisabledDates(disabledRanges);
                            }
                        });
                    }

                    var dateParser = $dateParser({format: options.dateFormat, lang: options.lang, strict: options.strictFormat});

                    // viewValue -> $parsers -> modelValue
                    controller.$parsers.unshift(function (viewValue) {
                        // console.warn('$parser("%s"): viewValue=%o', element.attr('ng-model'), viewValue);
                        // Null values should correctly reset the model value & validity
                        if (!viewValue) {
                            controller.$setValidity('date', true);
                            return;
                        }
                        var parsedDate = dateParser.parse(viewValue, controller.$dateValue);
                        if (!parsedDate || isNaN(parsedDate.getTime())) {
                            controller.$setValidity('date', false);
                            return;
                        } else {
                            var isMinValid = isNaN(datepicker.$options.minDate) || parsedDate.getTime() >= datepicker.$options.minDate;
                            var isMaxValid = isNaN(datepicker.$options.maxDate) || parsedDate.getTime() <= datepicker.$options.maxDate;
                            var isValid = isMinValid && isMaxValid;
                            controller.$setValidity('date', isValid);
                            controller.$setValidity('min', isMinValid);
                            controller.$setValidity('max', isMaxValid);
                            // Only update the model when we have a valid date
                            if (isValid) controller.$dateValue = parsedDate;
                        }
                        if (options.dateType === 'string') {
                            return dateFilter(parsedDate, options.modelDateFormat || options.dateFormat);
                        } else if (options.dateType === 'number') {
                            return controller.$dateValue.getTime();
                        } else if (options.dateType === 'iso') {
                            return controller.$dateValue.toISOString();
                        } else {
                            return new Date(controller.$dateValue);
                        }
                    });

                    // modelValue -> $formatters -> viewValue
                    controller.$formatters.push(function (modelValue) {
                        // console.warn('$formatter("%s"): modelValue=%o (%o)', element.attr('ng-model'), modelValue, typeof modelValue);
                        var date;
                        if (angular.isUndefined(modelValue) || modelValue === null) {
                            date = NaN;
                        } else if (angular.isDate(modelValue)) {
                            date = modelValue;
                        } else if (options.dateType === 'string') {
                            date = dateParser.parse(modelValue, null, options.modelDateFormat);
                        } else {
                            date = new Date(modelValue);
                        }
                        // Setup default value?
                        // if(isNaN(date.getTime())) {
                        //   var today = new Date();
                        //   date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0);
                        // }
                        controller.$dateValue = date;
                        return controller.$dateValue;
                    });

                    // viewValue -> element
                    controller.$render = function () {
                        // console.warn('$render("%s"): viewValue=%o', element.attr('ng-model'), controller.$viewValue);
                        element.val(!controller.$dateValue || isNaN(controller.$dateValue.getTime()) ? '' : dateFilter(controller.$dateValue, options.dateFormat));
                    };

                    // Garbage collection
                    scope.$on('$destroy', function () {
                        if (datepicker) datepicker.destroy();
                        options = null;
                        datepicker = null;
                    });

                }
            };

        }])

        .provider('datepickerViews', function () {

            var defaults = this.defaults = {
                dayFormat: 'dd',
                daySplit: 7
            };

            // Split array into smaller arrays
            function split(arr, size) {
                var arrays = [];
                while (arr.length > 0) {
                    arrays.push(arr.splice(0, size));
                }
                return arrays;
            }

            // Modulus operator
            function mod(n, m) {
                return ((n % m) + m) % m;
            }

            this.$get = ["$locale", "$sce", "dateFilter", function ($locale, $sce, dateFilter) {

                return function (picker) {

                    var scope = picker.$scope;
                    var options = picker.$options;

                    var weekDaysMin = $locale.DATETIME_FORMATS.SHORTDAY;
                    var weekDaysLabels = weekDaysMin.slice(options.startWeek).concat(weekDaysMin.slice(0, options.startWeek));
                    var weekDaysLabelsHtml = $sce.trustAsHtml('<th class="dow text-center">' + weekDaysLabels.join('</th><th class="dow text-center">') + '</th>');

                    var startDate = picker.$date || (options.startDate ? new Date(options.startDate) : new Date());
                    var viewDate = {year: startDate.getFullYear(), month: startDate.getMonth(), date: startDate.getDate()};
                    var timezoneOffset = startDate.getTimezoneOffset() * 6e4;

                    var views = [
                        {
                            format: options.dayFormat,
                            split: 7,
                            steps: { month: 1 },
                            update: function (date, force) {
                                if (!this.built || force || date.getFullYear() !== viewDate.year || date.getMonth() !== viewDate.month) {
                                    angular.extend(viewDate, {year: picker.$date.getFullYear(), month: picker.$date.getMonth(), date: picker.$date.getDate()});
                                    picker.$build();
                                } else if (date.getDate() !== viewDate.date) {
                                    viewDate.date = picker.$date.getDate();
                                    picker.$updateSelected();
                                }
                            },
                            build: function () {
                                var firstDayOfMonth = new Date(viewDate.year, viewDate.month, 1), firstDayOfMonthOffset = firstDayOfMonth.getTimezoneOffset();
                                var firstDate = new Date(+firstDayOfMonth - mod(firstDayOfMonth.getDay() - options.startWeek, 7) * 864e5), firstDateOffset = firstDate.getTimezoneOffset();
                                var today = new Date().toDateString();
                                // Handle daylight time switch
                                if (firstDateOffset !== firstDayOfMonthOffset) firstDate = new Date(+firstDate + (firstDateOffset - firstDayOfMonthOffset) * 60e3);
                                var days = [], day;
                                var today1 = new Date()
                                for (var i = 0; i < 42; i++) { // < 7 * 6
                                    day = new Date(firstDate.getFullYear(), firstDate.getMonth(), firstDate.getDate() + i);
                                    days.push({date: day, isToday: day.toDateString() === today, label: dateFilter(day, this.format), selected: (picker.$date && this.isSelected(day)) || ((!picker.$date) && (day.getDate() == today1.getDate()) && (day.getMonth() == today1.getMonth())), muted: day.getMonth() !== viewDate.month, disabled: this.isDisabled(day)});
                                }
                                scope.title = dateFilter(firstDayOfMonth, 'MMMM yyyy');
                                scope.showLabels = true;
                                scope.labels = weekDaysLabelsHtml;
                                scope.rows = split(days, this.split);
                                this.built = true;
                            },
                            isSelected: function (date) {
                                return picker.$date && date.getFullYear() === picker.$date.getFullYear() && date.getMonth() === picker.$date.getMonth() && date.getDate() === picker.$date.getDate();
                            },
                            isDisabled: function (date) {
                                var time = date.getTime();

                                // Disabled because of min/max date.
                                if (time < options.minDate || time > options.maxDate) return true;

                                // Disabled due to being a disabled day of the week
                                if (options.daysOfWeekDisabled.indexOf(date.getDay()) !== -1) return true;

                                // Disabled because of disabled date range.
                                if (options.disabledDateRanges) {
                                    for (var i = 0; i < options.disabledDateRanges.length; i++) {
                                        if (time >= options.disabledDateRanges[i].start) {
                                            if (time <= options.disabledDateRanges[i].end) return true;

                                            // The disabledDateRanges is expected to be sorted, so if time >= start,
                                            // we know it's not disabled.
                                            return false;
                                        }
                                    }
                                }

                                return false;
                            },
                            onKeyDown: function (evt) {
                                if (!(picker.$date)) {
                                    picker.$date = new Date();
                                }
                                var actualTime = picker.$date.getTime();
                                var newDate;

                                if (evt.keyCode === 37) newDate = new Date(actualTime - 1 * 864e5);
                                else if (evt.keyCode === 38) newDate = new Date(actualTime - 7 * 864e5);
                                else if (evt.keyCode === 39) newDate = new Date(actualTime + 1 * 864e5);
                                else if (evt.keyCode === 40) newDate = new Date(actualTime + 7 * 864e5);
                                else if (evt.keyCode === 13) {
                                    // start: 19/11/2014 :  Naveen Singh
                                    // code to select with date value with enter key
                                    newDate = picker.$date;
                                    if (!this.isDisabled(newDate)) {
                                        newDate = new Date(newDate.getFullYear(), newDate.getMonth(), newDate.getDate(), 0, 0, 0);
                                        picker.select(newDate, false);
                                    }
                                    return;
                                }
                                picker.$date = newDate;
                                // code to set {selected = true} for current date
                                for (var i = 0, l = scope.rows.length; i < l; i++) {
                                    angular.forEach(scope.rows[i], function (dt) {
                                        if (dt.selected) {
                                            dt.selected = false;
                                        }
                                        if ((dt.date.getDate() == newDate.getDate()) && (dt.date.getMonth() == newDate.getMonth())) {
                                            dt.selected = true;
                                            picker.$build();
                                        }
                                    });
                                }
                                picker.update.call(picker, newDate);
                                // end : Naveen Singh.
                            }
                        },
                        {
                            name: 'month',
                            format: 'MMM',
                            split: 4,
                            steps: { year: 1 },
                            update: function (date, force) {
                                if (!this.built || date.getFullYear() !== viewDate.year) {
                                    angular.extend(viewDate, {year: picker.$date.getFullYear(), month: picker.$date.getMonth(), date: picker.$date.getDate()});
                                    picker.$build();
                                } else if (date.getMonth() !== viewDate.month) {
                                    angular.extend(viewDate, {month: picker.$date.getMonth(), date: picker.$date.getDate()});
                                    picker.$updateSelected();
                                }
                            },
                            build: function () {
                                var firstMonth = new Date(viewDate.year, 0, 1);
                                var months = [], month;
                                for (var i = 0; i < 12; i++) {
                                    month = new Date(viewDate.year, i, 1);
                                    months.push({date: month, label: dateFilter(month, this.format), selected: picker.$isSelected(month), disabled: this.isDisabled(month)});
                                }
                                scope.title = dateFilter(month, 'yyyy');
                                scope.showLabels = false;
                                scope.rows = split(months, this.split);
                                this.built = true;
                            },
                            isSelected: function (date) {
                                return picker.$date && date.getFullYear() === picker.$date.getFullYear() && date.getMonth() === picker.$date.getMonth();
                            },
                            isDisabled: function (date) {
                                var lastDate = +new Date(date.getFullYear(), date.getMonth() + 1, 0);
                                return lastDate < options.minDate || date.getTime() > options.maxDate;
                            },
                            onKeyDown: function (evt) {
                                var actualMonth = picker.$date.getMonth();
                                var newDate = new Date(picker.$date);

                                if (evt.keyCode === 37) newDate.setMonth(actualMonth - 1);
                                else if (evt.keyCode === 38) newDate.setMonth(actualMonth - 4);
                                else if (evt.keyCode === 39) newDate.setMonth(actualMonth + 1);
                                else if (evt.keyCode === 40) newDate.setMonth(actualMonth + 4);

                                if (!this.isDisabled(newDate)) picker.select(newDate, true);
                            }
                        },
                        {
                            name: 'year',
                            format: 'yyyy',
                            split: 4,
                            steps: { year: 12 },
                            update: function (date, force) {
                                if (!this.built || force || parseInt(date.getFullYear() / 20, 10) !== parseInt(viewDate.year / 20, 10)) {
                                    angular.extend(viewDate, {year: picker.$date.getFullYear(), month: picker.$date.getMonth(), date: picker.$date.getDate()});
                                    picker.$build();
                                } else if (date.getFullYear() !== viewDate.year) {
                                    angular.extend(viewDate, {year: picker.$date.getFullYear(), month: picker.$date.getMonth(), date: picker.$date.getDate()});
                                    picker.$updateSelected();
                                }
                            },
                            build: function () {
                                var firstYear = viewDate.year - viewDate.year % (this.split * 3);
                                var years = [], year;
                                for (var i = 0; i < 12; i++) {
                                    year = new Date(firstYear + i, 0, 1);
                                    years.push({date: year, label: dateFilter(year, this.format), selected: picker.$isSelected(year), disabled: this.isDisabled(year)});
                                }
                                scope.title = years[0].label + '-' + years[years.length - 1].label;
                                scope.showLabels = false;
                                scope.rows = split(years, this.split);
                                this.built = true;
                            },
                            isSelected: function (date) {
                                return picker.$date && date.getFullYear() === picker.$date.getFullYear();
                            },
                            isDisabled: function (date) {
                                var lastDate = +new Date(date.getFullYear() + 1, 0, 0);
                                return lastDate < options.minDate || date.getTime() > options.maxDate;
                            },
                            onKeyDown: function (evt) {
                                var actualYear = picker.$date.getFullYear(),
                                    newDate = new Date(picker.$date);

                                if (evt.keyCode === 37) newDate.setYear(actualYear - 1);
                                else if (evt.keyCode === 38) newDate.setYear(actualYear - 4);
                                else if (evt.keyCode === 39) newDate.setYear(actualYear + 1);
                                else if (evt.keyCode === 40) newDate.setYear(actualYear + 4);

                                if (!this.isDisabled(newDate)) picker.select(newDate, true);
                            }
                        }
                    ];

                    return {
                        views: options.minView ? Array.prototype.slice.call(views, options.minView) : views,
                        viewDate: viewDate
                    };

                };

            }];

        });

    angular.module('mgcrea.ngStrap.helpers.dateParser', []).provider('$dateParser', [
        '$localeProvider',
        function ($localeProvider) {
            var proto = Date.prototype;

            function isNumeric(n) {
                return !isNaN(parseFloat(n)) && isFinite(n);
            }

            var defaults = this.defaults = {
                format: 'shortDate',
                strict: false
            };
            this.$get = [
                '$locale',
                function ($locale) {
                    var DateParserFactory = function (config) {
                        var options = angular.extend({}, defaults, config);
                        var $dateParser = {};
                        var regExpMap = {
                            'sss': '[0-9]{3}',
                            'ss': '[0-5][0-9]',
                            's': options.strict ? '[1-5]?[0-9]' : '[0-9]|[0-5][0-9]',
                            'mm': '[0-5][0-9]',
                            'm': options.strict ? '[1-5]?[0-9]' : '[0-9]|[0-5][0-9]',
                            'HH': '[01][0-9]|2[0-3]',
                            'H': options.strict ? '1?[0-9]|2[0-3]' : '[01]?[0-9]|2[0-3]',
                            'hh': '[0][1-9]|[1][012]',
                            'h': options.strict ? '[1-9]|1[012]' : '0?[1-9]|1[012]',
                            'a': 'AM|PM',
                            'EEEE': $locale.DATETIME_FORMATS.DAY.join('|'),
                            'EEE': $locale.DATETIME_FORMATS.SHORTDAY.join('|'),
                            'dd': '0[1-9]|[12][0-9]|3[01]',
                            'd': options.strict ? '[1-9]|[1-2][0-9]|3[01]' : '0?[1-9]|[1-2][0-9]|3[01]',
                            'MMMM': $locale.DATETIME_FORMATS.MONTH.join('|'),
                            'MMM': $locale.DATETIME_FORMATS.SHORTMONTH.join('|'),
                            'MM': '0[1-9]|1[012]',
                            'M': options.strict ? '[1-9]|1[012]' : '0?[1-9]|1[012]',
                            'yyyy': '[1]{1}[0-9]{3}|[2]{1}[0-9]{3}',
                            'yy': '[0-9]{2}',
                            'y': options.strict ? '-?(0|[1-9][0-9]{0,3})' : '-?0*[0-9]{1,4}'
                        };
                        var setFnMap = {
                            'sss': proto.setMilliseconds,
                            'ss': proto.setSeconds,
                            's': proto.setSeconds,
                            'mm': proto.setMinutes,
                            'm': proto.setMinutes,
                            'HH': proto.setHours,
                            'H': proto.setHours,
                            'hh': proto.setHours,
                            'h': proto.setHours,
                            'dd': proto.setDate,
                            'd': proto.setDate,
                            'a': function (value) {
                                var hours = this.getHours();
                                return this.setHours(value.match(/pm/i) ? hours + 12 : hours);
                            },
                            'MMMM': function (value) {
                                return this.setMonth($locale.DATETIME_FORMATS.MONTH.indexOf(value));
                            },
                            'MMM': function (value) {
                                return this.setMonth($locale.DATETIME_FORMATS.SHORTMONTH.indexOf(value));
                            },
                            'MM': function (value) {
                                return this.setMonth(1 * value - 1);
                            },
                            'M': function (value) {
                                return this.setMonth(1 * value - 1);
                            },
                            'yyyy': proto.setFullYear,
                            'yy': function (value) {
                                return this.setFullYear(2000 + 1 * value);
                            },
                            'y': proto.setFullYear
                        };
                        var regex, setMap;
                        $dateParser.init = function () {
                            $dateParser.$format = $locale.DATETIME_FORMATS[options.format] || options.format;
                            regex = regExpForFormat($dateParser.$format);
                            setMap = setMapForFormat($dateParser.$format);
                        };
                        $dateParser.isValid = function (date) {
                            if (angular.isDate(date))
                                return !isNaN(date.getTime());
                            return regex.test(date);
                        };
                        $dateParser.parse = function (value, baseDate) {
                            if (angular.isDate(value))
                                return value;
                            var matches = regex.exec(value);
                            if (!matches)
                                return false;
                            var date = baseDate || new Date(0);
                            for (var i = 0; i < matches.length - 1; i++) {
                                setMap[i] && setMap[i].call(date, matches[i + 1]);
                            }
                            return date;
                        };
                        // Private functions
                        function setMapForFormat(format) {
                            var keys = Object.keys(setFnMap), i;
                            var map = [], sortedMap = [];
                            // Map to setFn
                            var clonedFormat = format;
                            for (i = 0; i < keys.length; i++) {
                                if (format.split(keys[i]).length > 1) {
                                    var index = clonedFormat.search(keys[i]);
                                    format = format.split(keys[i]).join('');
                                    if (setFnMap[keys[i]])
                                        map[index] = setFnMap[keys[i]];
                                }
                            }
                            // Sort result map
                            angular.forEach(map, function (v) {
                                sortedMap.push(v);
                            });
                            return sortedMap;
                        }

                        function escapeReservedSymbols(text) {
                            return text.replace(/\//g, '[\\/]').replace('/-/g', '[-]').replace(/\./g, '[.]').replace(/\\s/g, '[\\s]');
                        }

                        function regExpForFormat(format) {
                            var keys = Object.keys(regExpMap), i;
                            var re = format;
                            // Abstract replaces to avoid collisions
                            for (i = 0; i < keys.length; i++) {
                                re = re.split(keys[i]).join('${' + i + '}');
                            }
                            // Replace abstracted values
                            for (i = 0; i < keys.length; i++) {
                                re = re.split('${' + i + '}').join('(' + regExpMap[keys[i]] + ')');
                            }
                            format = escapeReservedSymbols(format);
                            return new RegExp('^' + re + '$', ['i']);
                        }

                        $dateParser.init();
                        return $dateParser;
                    };
                    return DateParserFactory;
                }
            ];
        }
    ]);

    angular.module('mgcrea.ngStrap.helpers.dimensions', []).factory('dimensions', [
        '$document',
        '$window',
        function ($document, $window) {
            var jqLite = angular.element;
            var fn = {};
            /**
             * Test the element nodeName
             * @param element
             * @param name
             */
            var nodeName = fn.nodeName = function (element, name) {
                return element.nodeName && element.nodeName.toLowerCase() === name.toLowerCase();
            };
            /**
             * Returns the element computed style
             * @param element
             * @param prop
             * @param extra
             */
            fn.css = function (element, prop, extra) {
                var value;
                if (element.currentStyle) {
                    //IE
                    value = element.currentStyle[prop];
                } else if (window.getComputedStyle) {
                    value = window.getComputedStyle(element)[prop];
                } else {
                    value = element.style[prop];
                }
                return extra === true ? parseFloat(value) || 0 : value;
            };
            /**
             * Provides read-only equivalent of jQuery's offset function:
             * @required-by bootstrap-tooltip, bootstrap-affix
             * @url http://api.jquery.com/offset/
             * @param element
             */
            fn.offset = function (element) {
                var boxRect = element.getBoundingClientRect();
                var docElement = element.ownerDocument;
                return {
                    width: element.offsetWidth,
                    height: element.offsetHeight,
                    top: boxRect.top + (window.pageYOffset || docElement.documentElement.scrollTop) - (docElement.documentElement.clientTop || 0),
                    left: boxRect.left + (window.pageXOffset || docElement.documentElement.scrollLeft) - (docElement.documentElement.clientLeft || 0)
                };
            };
            /**
             * Provides read-only equivalent of jQuery's position function
             * @required-by bootstrap-tooltip, bootstrap-affix
             * @url http://api.jquery.com/offset/
             * @param element
             */
            fn.position = function (element) {
                var offsetParentRect = {
                    top: 0,
                    left: 0
                }, offsetParentElement, offset;
                // Fixed elements are offset from window (parentOffset = {top:0, left: 0}, because it is it's only offset parent
                if (fn.css(element, 'position') === 'fixed') {
                    // We assume that getBoundingClientRect is available when computed position is fixed
                    offset = element.getBoundingClientRect();
                } else {
                    // Get *real* offsetParentElement
                    offsetParentElement = offsetParent(element);
                    offset = fn.offset(element);
                    // Get correct offsets
                    offset = fn.offset(element);
                    if (!nodeName(offsetParentElement, 'html')) {
                        offsetParentRect = fn.offset(offsetParentElement);
                    }
                    // Add offsetParent borders
                    offsetParentRect.top += fn.css(offsetParentElement, 'borderTopWidth', true);
                    offsetParentRect.left += fn.css(offsetParentElement, 'borderLeftWidth', true);
                }
                // Subtract parent offsets and element margins
                return {
                    width: element.offsetWidth,
                    height: element.offsetHeight,
                    top: offset.top - offsetParentRect.top - fn.css(element, 'marginTop', true),
                    left: offset.left - offsetParentRect.left - fn.css(element, 'marginLeft', true)
                };
            };
            /**
             * Returns the closest, non-statically positioned offsetParent of a given element
             * @required-by fn.position
             * @param element
             */
            var offsetParent = function offsetParentElement(element) {
                var docElement = element.ownerDocument;
                var offsetParent = element.offsetParent || docElement;
                if (nodeName(offsetParent, '#document'))
                    return docElement.documentElement;
                while (offsetParent && !nodeName(offsetParent, 'html') && fn.css(offsetParent, 'position') === 'static') {
                    offsetParent = offsetParent.offsetParent;
                }
                return offsetParent || docElement.documentElement;
            };
            /**
             * Provides equivalent of jQuery's height function
             * @required-by bootstrap-affix
             * @url http://api.jquery.com/height/
             * @param element
             * @param outer
             */
            fn.height = function (element, outer) {
                var value = element.offsetHeight;
                if (outer) {
                    value += fn.css(element, 'marginTop', true) + fn.css(element, 'marginBottom', true);
                } else {
                    value -= fn.css(element, 'paddingTop', true) + fn.css(element, 'paddingBottom', true) + fn.css(element, 'borderTopWidth', true) + fn.css(element, 'borderBottomWidth', true);
                }
                return value;
            };
            /**
             * Provides equivalent of jQuery's height function
             * @required-by bootstrap-affix
             * @url http://api.jquery.com/width/
             * @param element
             * @param outer
             */
            fn.width = function (element, outer) {
                var value = element.offsetWidth;
                if (outer) {
                    value += fn.css(element, 'marginLeft', true) + fn.css(element, 'marginRight', true);
                } else {
                    value -= fn.css(element, 'paddingLeft', true) + fn.css(element, 'paddingRight', true) + fn.css(element, 'borderLeftWidth', true) + fn.css(element, 'borderRightWidth', true);
                }
                return value;
            };
            return fn;
        }
    ]);

    angular.module('mgcrea.ngStrap.helpers.parseOptions', []).provider('$parseOptions', function () {
        var defaults = this.defaults = { regexp: /^\s*(.*?)(?:\s+as\s+(.*?))?(?:\s+group\s+by\s+(.*))?\s+for\s+(?:([\$\w][\$\w]*)|(?:\(\s*([\$\w][\$\w]*)\s*,\s*([\$\w][\$\w]*)\s*\)))\s+in\s+(.*?)(?:\s+track\s+by\s+(.*?))?$/ };
        this.$get = [
            '$parse',
            '$q',
            function ($parse, $q) {
                function ParseOptionsFactory(attr, config) {
                    var $parseOptions = {};
                    // Common vars
                    var options = angular.extend({}, defaults, config);
                    $parseOptions.$values = [];
                    // Private vars
                    var match, displayFn, valueName, keyName, groupByFn, valueFn, valuesFn;
                    $parseOptions.init = function () {
                        $parseOptions.$match = match = attr.match(options.regexp);
                        displayFn = $parse(match[2] || match[1]), valueName = match[4] || match[6], keyName = match[5], groupByFn = $parse(match[3] || '');
                        valueFn = $parse(match[2] ? match[1] : valueName);
                        valuesFn = $parse(match[7]);
                    };
                    $parseOptions.valuesFn = function (scope, controller) {
                        return $q.when(valuesFn(scope, controller)).then(function (values) {
                            $parseOptions.$values = values ? parseValues(values) : {};
                            return $parseOptions.$values;
                        });
                    };
                    $parseOptions.valuesFnApplane = function (scope, controller, typeaheadOptions) {
                        return $q.when(valuesFn(scope, controller)).then(function (values) {
                            if (values === undefined) {
                                return;
                            }
                            $parseOptions.$values = values ? parseValues(values, typeaheadOptions) : {};
                            return $parseOptions.$values;
                        });
                    };
                    $parseOptions.getParseValue = function (value, typeaheadOptions, skipTypeahead) {
                        var values = [];
                        values.push(value);
                        $parseOptions.$values = values ? parseValues(values, typeaheadOptions, skipTypeahead) : {};
                        return $parseOptions.$values;
                    };
                    // Private functions
                    function parseValues(values, typeaheadOptions, skipTypeahead) {
                        return values.map(function (match, index) {
                            var locals = {}, label, value;
                            locals[valueName] = match;
                            label = displayFn(locals);
                            if (!skipTypeahead && typeaheadOptions && typeaheadOptions.otherDisplayFields && typeaheadOptions.otherDisplayFields != "undefined") {
                                var otherSupportiveValue = typeaheadOptions.otherDisplayFields.split(',');
                                for (var i = 0; i < otherSupportiveValue.length; i++) {
                                    var bindingField = otherSupportiveValue[i].split('.');
                                    var bindedvalue = locals[valueName];
                                    for (var j = 0; j < bindingField.length; j++) {
                                        var obj = bindingField[j];
                                        if (angular.isDefined(bindedvalue[bindingField[j]])) {
                                            bindedvalue = bindedvalue[bindingField[j]];
                                        } else {
                                            bindedvalue = undefined;
                                        }
                                    }
                                    if (angular.isDefined(bindedvalue) && angular.isDefined(label)) {
                                        label += ' | ' + bindedvalue;
                                    }
                                }
                            }
                            value = valueFn(locals) || index;
                            return {
                                label: label,
                                value: value
                            };
                        });
                    }

                    $parseOptions.init();
                    return $parseOptions;
                }

                return ParseOptionsFactory;
            }
        ];
    });

    angular.version.minor < 3 && angular.version.dot < 14 && angular.module('ng').factory('$$rAF', [
        '$window',
        '$timeout',
        function ($window, $timeout) {
            var requestAnimationFrame = $window.requestAnimationFrame || $window.webkitRequestAnimationFrame || $window.mozRequestAnimationFrame;
            var cancelAnimationFrame = $window.cancelAnimationFrame || $window.webkitCancelAnimationFrame || $window.mozCancelAnimationFrame || $window.webkitCancelRequestAnimationFrame;
            var rafSupported = !!requestAnimationFrame;
            var raf = rafSupported ? function (fn) {
                var id = requestAnimationFrame(fn);
                return function () {
                    cancelAnimationFrame(id);
                };
            } : function (fn) {
                var timer = $timeout(fn, 16.66, false);
                // 1000 / 60 = 16.666
                return function () {
                    $timeout.cancel(timer);
                };
            };
            raf.supported = rafSupported;
            return raf;
        }
    ]);

    angular.module('mgcrea.ngStrap.timepicker', [
        'mgcrea.ngStrap.helpers.dateParser',
        'mgcrea.ngStrap.tooltip'
    ]).provider('$timepicker',
        function () {
            var defaults = this.defaults = {
                animation: 'am-fade',
                prefixClass: 'timepicker',
                placement: 'bottom-left',
                template: 'timepicker/timepicker.tpl.html',
                trigger: 'focus',
                container: false,
                keyboard: true,
                html: false,
                delay: 0,
                useNative: true,
                timeType: 'date',
                timeFormat: 'shortTime',
                autoclose: false,
                minTime: -Infinity,
                maxTime: +Infinity,
                length: 5,
                hourStep: 1,
                minuteStep: 5
            };
            this.$get = [
                '$window',
                '$document',
                '$rootScope',
                '$sce',
                '$locale',
                'dateFilter',
                '$tooltip',
                function ($window, $document, $rootScope, $sce, $locale, dateFilter, $tooltip) {
                    var bodyEl = angular.element($window.document.body);
                    var isTouch = 'createTouch' in $window.document;
                    var isNative = /(ip(a|o)d|iphone|android)/gi.test($window.navigator.userAgent);
                    if (!defaults.lang)
                        defaults.lang = $locale.id;
                    function timepickerFactory(element, controller, config) {
                        var $timepicker = $tooltip(element, angular.extend({}, defaults, config));
                        var parentScope = config.scope;
                        var options = $timepicker.$options;
                        var scope = $timepicker.$scope;
                        // View vars
                        var selectedIndex = 0;
                        var startDate = controller.$dateValue || new Date();
                        var viewDate = {
                            hour: startDate.getHours(),
                            meridian: startDate.getHours() < 12,
                            minute: startDate.getMinutes(),
                            second: startDate.getSeconds(),
                            millisecond: startDate.getMilliseconds()
                        };
                        var format = $locale.DATETIME_FORMATS[options.timeFormat] || options.timeFormat;
                        var formats = /(h+)[:]?(m+)[ ]?(a?)/i.exec(format).slice(1);
                        // Scope methods
                        scope.$select = function (date, index, $event) {
                            $event.stopPropagation();
                            $event.preventDefault();
                            $timepicker.select(date, index);
                        };
                        scope.$moveIndex = function (value, index, $event) {
                            $event.stopPropagation();
                            $event.preventDefault();
                            $timepicker.$moveIndex(value, index);
                        };
                        scope.$switchMeridian = function ($event, date) {
                            $event.stopPropagation();
                            $event.preventDefault();
                            $timepicker.switchMeridian(date);
                        };
                        // Public methods
                        $timepicker.update = function (date) {
                            // console.warn('$timepicker.update() newValue=%o', date);
                            if (angular.isDate(date) && !isNaN(date.getTime())) {
                                $timepicker.$date = date;
                                angular.extend(viewDate, {
                                    hour: date.getHours(),
                                    minute: date.getMinutes(),
                                    second: date.getSeconds(),
                                    millisecond: date.getMilliseconds()
                                });
                                $timepicker.$build();
                            } else if (!$timepicker.$isBuilt) {
                                $timepicker.$build();
                            }
                        };
                        $timepicker.select = function (date, index, keep) {
                            // console.warn('$timepicker.select', date, scope.$mode);
                            if (!controller.$dateValue || isNaN(controller.$dateValue.getTime()))
                                controller.$dateValue = new Date(1970, 0, 1);
                            if (!angular.isDate(date))
                                date = new Date(date);
                            if (index === 0)
                                controller.$dateValue.setHours(date.getHours());
                            else if (index === 1)
                                controller.$dateValue.setMinutes(date.getMinutes());
                            controller.$setViewValue(controller.$dateValue);
                            controller.$render();
                            if (options.autoclose && !keep) {
                                $timepicker.hide(true);
                            }
                        };
                        $timepicker.switchMeridian = function (date) {
                            var hours = (date || controller.$dateValue).getHours();
                            controller.$dateValue.setHours(hours < 12 ? hours + 12 : hours - 12);
                            controller.$render();
                            // to change date value by clicking AM, PM buttons
                            controller.$setViewValue(controller.$dateValue);
                        };
                        // Protected methods
                        $timepicker.$build = function () {
                            // console.warn('$timepicker.$build() viewDate=%o', viewDate);
                            var i, midIndex = scope.midIndex = parseInt(options.length / 2, 10);
                            var hours = [], hour;
                            for (i = 0; i < options.length; i++) {
                                hour = new Date(1970, 0, 1, viewDate.hour - (midIndex - i) * options.hourStep);
                                hours.push({
                                    date: hour,
                                    label: dateFilter(hour, formats[0]),
                                    selected: $timepicker.$date && $timepicker.$isSelected(hour, 0),
                                    disabled: $timepicker.$isDisabled(hour, 0)
                                });
                            }
                            var minutes = [], minute;
                            for (i = 0; i < options.length; i++) {
                                minute = new Date(1970, 0, 1, 0, viewDate.minute - (midIndex - i) * options.minuteStep);
                                minutes.push({
                                    date: minute,
                                    label: dateFilter(minute, formats[1]),
                                    selected: $timepicker.$date && $timepicker.$isSelected(minute, 1),
                                    disabled: $timepicker.$isDisabled(minute, 1)
                                });
                            }
                            var rows = [];
                            for (i = 0; i < options.length; i++) {
                                rows.push([
                                    hours[i],
                                    minutes[i]
                                ]);
                            }
                            scope.rows = rows;
                            scope.showAM = !!formats[2];
                            scope.isAM = ($timepicker.$date || hours[midIndex].date).getHours() < 12;
                            $timepicker.$isBuilt = true;
                        };
                        $timepicker.$isSelected = function (date, index) {
                            if (!$timepicker.$date)
                                return false;
                            else if (index === 0) {
                                return date.getHours() === $timepicker.$date.getHours();
                            } else if (index === 1) {
                                return date.getMinutes() === $timepicker.$date.getMinutes();
                            }
                        };
                        $timepicker.$isDisabled = function (date, index) {
                            var selectedTime;
                            if (index === 0) {
                                selectedTime = date.getTime() + viewDate.minute * 60000;
                            } else if (index === 1) {
                                selectedTime = date.getTime() + viewDate.hour * 3600000;
                            }
                            return selectedTime < options.minTime || selectedTime > options.maxTime;
                        };
                        $timepicker.$moveIndex = function (value, index) {
                            var targetDate;
                            if (index === 0) {
                                targetDate = new Date(1970, 0, 1, viewDate.hour + value * options.length, viewDate.minute);
                                angular.extend(viewDate, { hour: targetDate.getHours() });
                            } else if (index === 1) {
                                targetDate = new Date(1970, 0, 1, viewDate.hour, viewDate.minute + value * options.length * options.minuteStep);
                                angular.extend(viewDate, { minute: targetDate.getMinutes() });
                            }
                            $timepicker.$build();
                        };
                        $timepicker.$onMouseDown = function (evt) {
                            // Prevent blur on mousedown on .dropdown-menu
                            if (evt.target.nodeName.toLowerCase() !== 'input')
                                evt.preventDefault();
                            evt.stopPropagation();
                            // Emulate click for mobile devices
                            if (isTouch) {
                                var targetEl = angular.element(evt.target);
                                if (targetEl[0].nodeName.toLowerCase() !== 'button') {
                                    targetEl = targetEl.parent();
                                }
                                targetEl.triggerHandler('click');
                            }
                        };
                        $timepicker.$onKeyDown = function (evt) {
                            if (!/(38|37|39|40|13)/.test(evt.keyCode) || evt.shiftKey || evt.altKey)
                                return;
                            evt.preventDefault();
                            evt.stopPropagation();
                            // Close on enter
                            if (evt.keyCode === 13)
                                return $timepicker.hide(true);
                            // Navigate with keyboard
                            var newDate = new Date($timepicker.$date);
                            var hours = newDate.getHours(), hoursLength = dateFilter(newDate, 'h').length;
                            var minutes = newDate.getMinutes(), minutesLength = dateFilter(newDate, 'mm').length;
                            var lateralMove = /(37|39)/.test(evt.keyCode);
                            var count = 2 + !!formats[2] * 1;
                            // Navigate indexes (left, right)
                            if (lateralMove) {
                                if (evt.keyCode === 37)
                                    selectedIndex = selectedIndex < 1 ? count - 1 : selectedIndex - 1;
                                else if (evt.keyCode === 39)
                                    selectedIndex = selectedIndex < count - 1 ? selectedIndex + 1 : 0;
                            }
                            // Update values (up, down)
                            if (selectedIndex === 0) {
                                if (lateralMove)
                                    return createSelection(0, hoursLength);
                                if (evt.keyCode === 38)
                                    newDate.setHours(hours - options.hourStep);
                                else if (evt.keyCode === 40)
                                    newDate.setHours(hours + options.hourStep);
                            } else if (selectedIndex === 1) {
                                if (lateralMove)
                                    return createSelection(hoursLength + 1, hoursLength + 1 + minutesLength);
                                if (evt.keyCode === 38)
                                    newDate.setMinutes(minutes - options.minuteStep);
                                else if (evt.keyCode === 40)
                                    newDate.setMinutes(minutes + options.minuteStep);
                            } else if (selectedIndex === 2) {
                                if (lateralMove)
                                    return createSelection(hoursLength + 1 + minutesLength + 1, hoursLength + 1 + minutesLength + 3);
                                $timepicker.switchMeridian();
                            }
                            $timepicker.select(newDate, selectedIndex, true);
                            parentScope.$digest();
                        };
                        // Private
                        function createSelection(start, end) {
                            if (element[0].createTextRange) {
                                var selRange = element[0].createTextRange();
                                selRange.collapse(true);
                                selRange.moveStart('character', start);
                                selRange.moveEnd('character', end);
                                selRange.select();
                            } else if (element[0].setSelectionRange) {
                                element[0].setSelectionRange(start, end);
                            } else if (angular.isUndefined(element[0].selectionStart)) {
                                element[0].selectionStart = start;
                                element[0].selectionEnd = end;
                            }
                        }

                        function focusElement() {
                            element[0].focus();
                        }

                        // Overrides
                        var _init = $timepicker.init;
                        $timepicker.init = function () {
                            if (isNative && options.useNative) {
                                element.prop('type', 'time');
                                element.css('-webkit-appearance', 'textfield');
                                return;
                            } else if (isTouch) {
                                element.prop('type', 'text');
                                element.attr('readonly', 'true');
                                element.on('click', focusElement);
                            }
                            _init();
                        };
                        var _destroy = $timepicker.destroy;
                        $timepicker.destroy = function () {
                            if (isNative && options.useNative) {
                                element.off('click', focusElement);
                            }
                            _destroy();
                        };
                        var _show = $timepicker.show;
                        $timepicker.show = function () {
                            _show();
                            setTimeout(function () {
                                $timepicker.$element.on(isTouch ? 'touchstart' : 'mousedown', $timepicker.$onMouseDown);
                                if (options.keyboard) {
                                    element.on('keydown', $timepicker.$onKeyDown);
                                }
                            });
                        };
                        var _hide = $timepicker.hide;
                        $timepicker.hide = function (blur) {
                            $timepicker.$element.off(isTouch ? 'touchstart' : 'mousedown', $timepicker.$onMouseDown);
                            if (options.keyboard) {
                                element.off('keydown', $timepicker.$onKeyDown);
                            }
                            _hide(blur);
                        };
                        return $timepicker;
                    }

                    timepickerFactory.defaults = defaults;
                    return timepickerFactory;
                }
            ];
        }).directive('bsTimepicker', [
            '$window',
            '$parse',
            '$q',
            '$locale',
            'dateFilter',
            '$timepicker',
            '$dateParser',
            '$timeout',
            function ($window, $parse, $q, $locale, dateFilter, $timepicker, $dateParser, $timeout) {
                var defaults = $timepicker.defaults;
                var isNative = /(ip(a|o)d|iphone|android)/gi.test($window.navigator.userAgent);
                var requestAnimationFrame = $window.requestAnimationFrame || $window.setTimeout;
                return {
                    restrict: 'EAC',
                    require: 'ngModel',
                    link: function postLink(scope, element, attr, controller) {
                        // Directive options
                        var options = {
                            scope: scope,
                            controller: controller
                        };
                        angular.forEach([
                            'placement',
                            'container',
                            'delay',
                            'trigger',
                            'keyboard',
                            'html',
                            'animation',
                            'template',
                            'autoclose',
                            'timeType',
                            'timeFormat',
                            'useNative',
                            'hourStep',
                            'minuteStep'
                        ], function (key) {
                            if (angular.isDefined(attr[key]))
                                options[key] = attr[key];
                        });
                        // Initialize timepicker
                        if (isNative && (options.useNative || defaults.useNative))
                            options.timeFormat = 'HH:mm';
                        var timepicker = $timepicker(element, controller, options);
                        options = timepicker.$options;
                        // Initialize parser
                        var dateParser = $dateParser({
                            format: options.timeFormat,
                            lang: options.lang
                        });
                        // Observe attributes for changes
                        angular.forEach([
                            'minTime',
                            'maxTime'
                        ], function (key) {
                            // console.warn('attr.$observe(%s)', key, attr[key]);
                            angular.isDefined(attr[key]) && attr.$observe(key, function (newValue) {
                                if (newValue === 'now') {
                                    timepicker.$options[key] = new Date().setFullYear(1970, 0, 1);
                                } else if (angular.isString(newValue) && newValue.match(/^".+"$/)) {
                                    timepicker.$options[key] = +new Date(newValue.substr(1, newValue.length - 2));
                                } else {
                                    timepicker.$options[key] = dateParser.parse(newValue);
                                }
                                !isNaN(timepicker.$options[key]) && timepicker.$build();
                            });
                        });
                        // Watch model for changes
                        scope.$watch(attr.ngModel, function (newValue, oldValue) {
                            // console.warn('scope.$watch(%s)', attr.ngModel, newValue, oldValue, controller.$dateValue);
                            timepicker.update(controller.$dateValue);
                        }, true);
                        // viewValue -> $parsers -> modelValue
                        controller.$parsers.unshift(function (viewValue) {
                            // console.warn('$parser("%s"): viewValue=%o', element.attr('ng-model'), viewValue);
                            // Null values should correctly reset the model value & validity
                            if (!viewValue) {
                                controller.$setValidity('date', true);
                                return;
                            }
                            var parsedTime = dateParser.parse(viewValue, controller.$dateValue);
                            if (!parsedTime || isNaN(parsedTime.getTime())) {
                                controller.$setValidity('date', false);
                            } else {
                                var isValid = parsedTime.getTime() >= options.minTime && parsedTime.getTime() <= options.maxTime;
                                controller.$setValidity('date', isValid);
                                // Only update the model when we have a valid date
                                if (isValid)
                                    controller.$dateValue = parsedTime;
                            }
                            if (options.timeType === 'string') {
                                return dateFilter(viewValue, options.timeFormat);
                            } else if (options.timeType === 'number') {
                                return controller.$dateValue.getTime();
                            } else if (options.timeType === 'iso') {
                                return controller.$dateValue.toISOString();
                            } else {
                                return new Date(controller.$dateValue);
                            }
                        });
                        // modelValue -> $formatters -> viewValue
                        controller.$formatters.push(function (modelValue) {
                            // console.warn('$formatter("%s"): modelValue=%o (%o)', element.attr('ng-model'), modelValue, typeof modelValue);
                            var date;
                            if (angular.isUndefined(modelValue) || modelValue === null) {
                                date = NaN;
                            } else if (angular.isDate(modelValue)) {
                                date = modelValue;
                            } else if (options.timeType === 'string') {
                                date = dateParser.parse(modelValue);
                            } else {
                                date = new Date(modelValue);
                            }
                            // Setup default value?
                            // if(isNaN(date.getTime())) date = new Date(new Date().setMinutes(0) + 36e5);
                            controller.$dateValue = date;
                            return controller.$dateValue;
                        });
                        // viewValue -> element
                        controller.$render = function () {
//                        console.warn('$render("%s"): viewValue=%o', element.attr('ng-model'), controller.$viewValue);
                            element.val(!controller.$dateValue || isNaN(controller.$dateValue.getTime()) ? '' : dateFilter(controller.$dateValue, options.timeFormat));
                        };
                        // Garbage collection
                        scope.$on('$destroy', function () {
                            timepicker.destroy();
                            options = null;
                            timepicker = null;
                        });
                    }
                };
            }
        ]);

    angular.module('mgcrea.ngStrap.tooltip', [
        'ngAnimate',
        'mgcrea.ngStrap.helpers.dimensions'
    ]).provider('$tooltip',
        function () {
            var defaults = this.defaults = {
                animation: 'am-fade',
                prefixClass: 'tooltip',
                prefixEvent: 'tooltip',
                container: false,
                placement: 'top',
                template: 'tooltip/tooltip.tpl.html',
                contentTemplate: false,
                trigger: 'hover focus',
                keyboard: false,
                html: false,
                show: false,
                title: '',
                type: '',
                delay: 0
            };
            this.$get = [
                '$window',
                '$rootScope',
                '$compile',
                '$q',
                '$templateCache',
                '$http',
                '$animate',
                '$timeout',
                'dimensions',
                '$$rAF',
                function ($window, $rootScope, $compile, $q, $templateCache, $http, $animate, $timeout, dimensions, $$rAF) {
                    var trim = String.prototype.trim;
                    var isTouch = 'createTouch' in $window.document;
                    var htmlReplaceRegExp = /ng-bind="/gi;

                    function TooltipFactory(element, config) {
                        var $tooltip = {};
                        // Common vars
                        var options = $tooltip.$options = angular.extend({}, defaults, config);
                        $tooltip.$promise = fetchTemplate(options.template);
                        var scope = $tooltip.$scope = options.scope && options.scope.$new() || $rootScope.$new();
                        if (options.delay && angular.isString(options.delay)) {
                            options.delay = parseFloat(options.delay);
                        }
                        // Support scope as string options
                        if (options.title) {
                            $tooltip.$scope.title = options.title;
                        }
                        // Provide scope helpers
                        scope.$hide = function () {
                            scope.$$postDigest(function () {
                                $tooltip.hide();
                            });
                        };
                        scope.$show = function () {
                            scope.$$postDigest(function () {
                                $tooltip.show();
                            });
                        };
                        scope.$toggle = function () {
                            scope.$$postDigest(function () {
                                $tooltip.toggle();
                            });
                        };
                        $tooltip.$isShown = scope.$isShown = false;
                        // Private vars
                        var timeout, hoverState;
                        // Support contentTemplate option
                        if (options.contentTemplate) {
                            $tooltip.$promise = $tooltip.$promise.then(function (template) {
                                var templateEl = angular.element(template);
                                return fetchTemplate(options.contentTemplate).then(function (contentTemplate) {
                                    var contentEl = findElement('[ng-bind="content"]', templateEl[0]);
                                    if (!contentEl.length)
                                        contentEl = findElement('[ng-bind="title"]', templateEl[0]);
                                    contentEl.removeAttr('ng-bind').html(contentTemplate);
                                    return templateEl[0].outerHTML;
                                });
                            });
                        }
                        // Fetch, compile then initialize tooltip
                        var tipLinker, tipElement, tipTemplate, tipContainer;
                        $tooltip.$promise.then(function (template) {
                            if (angular.isObject(template))
                                template = template.data;
                            if (options.html)
                                template = template.replace(htmlReplaceRegExp, 'ng-bind-html="');
                            template = trim.apply(template);
                            tipTemplate = template;
                            tipLinker = $compile(template);
                            $tooltip.init();
                        });
                        $tooltip.init = function () {
                            // Options: delay
                            if (options.delay && angular.isNumber(options.delay)) {
                                options.delay = {
                                    show: options.delay,
                                    hide: options.delay
                                };
                            }
                            // Replace trigger on touch devices ?
                            // if(isTouch && options.trigger === defaults.trigger) {
                            //   options.trigger.replace(/hover/g, 'click');
                            // }
                            // Options : container
                            if (options.container === 'self') {
                                tipContainer = element;
                            } else if (options.container) {
                                tipContainer = findElement(options.container);
                            }
                            // Options: trigger
                            var triggers = options.trigger.split(' ');
                            angular.forEach(triggers, function (trigger) {
                                if (trigger === 'click') {
                                    element.on('click', $tooltip.toggle);
                                } else if (trigger == 'default') {
                                    element.on(trigger === 'hover' ? 'mouseenter' : 'focus', $tooltip.enterDefaut);
                                    element.on(trigger === 'hover' ? 'mouseleave' : 'blur', $tooltip.leave);
                                    trigger !== 'hover' && element.on(isTouch ? 'touchstart' : 'mousedown', $tooltip.$onFocusElementMouseDown);
                                } else if (trigger == 'downkey') {                  // custom trigger to handle nav-down key
                                    element.on('keydown', $tooltip.onDownKey);
                                } else if (trigger !== 'manual') {
                                    element.on(trigger === 'hover' ? 'mouseenter' : 'focus', $tooltip.enter);
                                    element.on(trigger === 'hover' ? 'mouseleave' : 'blur', $tooltip.leave);
                                    trigger !== 'hover' && element.on(isTouch ? 'touchstart' : 'mousedown', $tooltip.$onFocusElementMouseDown);
                                }
                            });
                            // Options: show
                            if (options.show) {
                                scope.$$postDigest(function () {
                                    options.trigger === 'focus' ? element[0].focus() : $tooltip.show();
                                });
                            }
                        };
                        $tooltip.destroy = function () {
                            // Unbind events
                            var triggers = options.trigger.split(' ');
                            for (var i = triggers.length; i--;) {
                                var trigger = triggers[i];
                                if (trigger === 'click') {
                                    element.off('click', $tooltip.toggle);
                                } else if (trigger !== 'manual') {
                                    element.off(trigger === 'hover' ? 'mouseenter' : 'focus', $tooltip.enter);
                                    element.off(trigger === 'hover' ? 'mouseleave' : 'blur', $tooltip.leave);
                                    trigger !== 'hover' && element.off(isTouch ? 'touchstart' : 'mousedown', $tooltip.$onFocusElementMouseDown);
                                }
                            }
                            // Remove element
                            if (tipElement) {
                                tipElement.remove();
                                tipElement = null;
                            }
                            // Destroy scope
                            scope.$destroy();
                        };
                        $tooltip.enter = function () {
                            clearTimeout(timeout);
                            hoverState = 'in';
                            // Naveen Singh start 12-05-2014  : to hide the selected tooltip option
                            if (!options.delay || !options.delay.show) {          // to hide the selected tooltip option
                                return $tooltip.show();
                            }
                            timeout = setTimeout(function () {
                                if (hoverState === 'in')
                                    $tooltip.show();
                            }, options.delay.show);
                            // Naveen Singh End
                        };

                        // enterDefaut function is created due to focus
                        $tooltip.enterDefaut = function () {
                            clearTimeout(timeout);
                            hoverState = 'in';
                            // Naveen Singh start 12-05-2014  : to hide the selected tooltip option
//                            if (!options.delay || !options.delay.show) {          // to hide the selected tooltip option
//                                return $tooltip.show();
//                            }
//                            timeout = setTimeout(function () {
//                                if (hoverState === 'in')
//                                    $tooltip.show();
//                            }, options.delay.show);
                            // Naveen Singh End
                        };
                        $tooltip.show = function () {
                            scope.$emit(options.prefixEvent + '.show.before', $tooltip);
                            var parent = options.container ? tipContainer : null;
                            var after = options.container ? null : element;
                            // Hide any existing tipElement
                            if (tipElement)
                                tipElement.remove();
                            // Fetch a cloned element linked from template
                            tipElement = $tooltip.$element = tipLinker(scope, function (clonedElement, scope) {
                            });
                            // Set the initial positioning.
                            tipElement.css({
                                top: '0px',
                                left: '0px',
                                display: 'block'
                            }).addClass(options.placement);
                            // Options: animation
                            if (options.animation)
                                tipElement.addClass(options.animation);
                            // Options: type
                            if (options.type)
                                tipElement.addClass(options.prefixClass + '-' + options.type);
                            $animate.enter(tipElement, parent, after, function () {
                                scope.$emit(options.prefixEvent + '.show', $tooltip);
                            });
                            $tooltip.$isShown = scope.$isShown = true;
                            scope.$$phase || scope.$root.$$phase || scope.$digest();
                            $$rAF($tooltip.$applyPlacement);
                            // var a = bodyEl.offsetWidth + 1; ?
                            // Bind events
                            if (options.keyboard) {
                                if (options.trigger !== 'focus') {
                                    $tooltip.focus();
                                    tipElement.on('keyup', $tooltip.$onKeyUp);
                                } else {
                                    element.on('keyup', $tooltip.$onFocusKeyUp);
                                }
                            }
                        };
                        $tooltip.leave = function () {
                            clearTimeout(timeout);
                            hoverState = 'out';
                            if (!options.delay || !options.delay.hide) {
                                return $tooltip.hide();
                            }
                            timeout = setTimeout(function () {
                                if (hoverState === 'out') {
                                    $tooltip.hide();
                                }
                            }, options.delay.hide);
                        };
                        $tooltip.hide = function (blur) {
                            if (!$tooltip.$isShown)
                                return;
                            scope.$emit(options.prefixEvent + '.hide.before', $tooltip);
                            $animate.leave(tipElement, function () {
                                scope.$emit(options.prefixEvent + '.hide', $tooltip);
                            });
                            $tooltip.$isShown = scope.$isShown = false;
                            scope.$$phase || scope.$root.$$phase || scope.$digest();
                            // Unbind events
                            if (options.keyboard && tipElement !== null) {
                                tipElement.off('keyup', $tooltip.$onKeyUp);
                            }
                            // Allow to blur the input when hidden, like when pressing enter key
                            if (blur && options.trigger === 'focus') {
                                return element[0].blur();
                            }
                        };
                        $tooltip.toggle = function () {
                            $tooltip.$isShown ? $tooltip.leave() : $tooltip.enter();
                        };
                        $tooltip.onDownKey = function (evt) {
                            //function to handle nav-down key
                            if (evt.keyCode == 40 && !$tooltip.$isShown) {
                                $tooltip.enter();
                            }
                        };
                        $tooltip.focus = function () {
                            tipElement[0].focus();
                        };
                        // Protected methods
                        $tooltip.$applyPlacement = function () {
                            if (!tipElement)
                                return;
                            // Get the position of the tooltip element.
                            var elementPosition = getPosition();
                            // Get the height and width of the tooltip so we can center it.
                            var tipWidth = tipElement.prop('offsetWidth'), tipHeight = tipElement.prop('offsetHeight');
                            // Get the tooltip's top and left coordinates to center it with this directive.
                            var tipPosition = getCalculatedOffset(options.placement, elementPosition, tipWidth, tipHeight);
                            // Now set the calculated positioning.
                            tipPosition.top += 'px';
                            tipPosition.left += 'px';
                            tipPosition.maxWidth = '80%';
                            tipElement.css(tipPosition);
                        };
                        $tooltip.$onKeyUp = function (evt) {
                            evt.which === 27 && $tooltip.hide();
                        };
                        $tooltip.$onFocusKeyUp = function (evt) {
//                            evt.which === 27 && element[0].blur();   // we dont required blur on ESC key, we keep remain focus on current control
                        };
                        $tooltip.$onFocusElementMouseDown = function (evt) {
                            var triggers = options.trigger.split(' ');
                            if (triggers != "default") {
                                //To focus cursor in between text value in case of "default" trigger, we don't kill events
                                evt.preventDefault();
                                evt.stopPropagation();
                            }
//                            Some browsers do not auto-focus buttons (eg. Safari)
                            $tooltip.$isShown ? element[0].blur() : element[0].focus();
                        };
                        // Private methods
                        function getPosition() {
                            if (options.container === 'body') {
                                return dimensions.offset(element[0]);
                            } else {
                                return dimensions.position(element[0]);
                            }
                        }

                        function getCalculatedOffset(placement, position, actualWidth, actualHeight) {
                            var offset;
                            var windowWidth = $(window).width();
                            var isDatePicker = element.context.attributes["bs-datepicker"];
                            var split = placement.split('-');
                            switch (split[0]) {
                                case 'right':
                                    offset = {
                                        top: position.top + position.height / 2 - actualHeight / 2,
                                        left: position.left + position.width
                                    };
                                    break;
                                case 'bottom':
                                    /* ashish start --> to show the drop don properly, if space is avalilable then menus show on bottom else show on top */
                                    var windowHeight = $(window).height();
                                    var posY = position.top - $(window).scrollTop();
                                    var topToSet = 0;
                                    if ((position.top + actualHeight + position.height) >= windowHeight) {
                                        topToSet = position.top - position.height - actualHeight + 15;
                                    } else {
                                        topToSet = (posY + position.height);
                                    }

                                    if (topToSet < 0) {
                                        topToSet = position.top + position.height;
                                    }
                                    /* ashish end */
                                    if (position.left + actualWidth >= windowWidth) {
                                        position.left = windowWidth - actualWidth;
                                    }

                                    if (angular.isDefined(isDatePicker)) {
                                        if ((windowHeight - position.top) < actualHeight) {
                                            topToSet = position.top - actualHeight;
                                        }
                                    }

                                    offset = {
//                                        top:position.top + position.height,
                                        top: topToSet,
                                        left: position.left + position.width / 2 - actualWidth / 2
                                    };
                                    break;
                                case 'left':
                                    offset = {
                                        top: position.top + position.height / 2 - actualHeight / 2,
                                        left: position.left - actualWidth
                                    };
                                    break;
                                default:
                                    offset = {
                                        top: position.top - actualHeight,
                                        left: position.left + position.width / 2 - actualWidth / 2
                                    };
                                    break;
                            }
                            if (!split[1]) {
                                return offset;
                            }
                            // Add support for corners @todo css
                            if (split[0] === 'top' || split[0] === 'bottom') {
                                switch (split[1]) {
                                    case 'left':
                                        offset.left = position.left;
                                        break;
                                    case 'right':
                                        offset.left = position.left + position.width - actualWidth;
                                }
                            } else if (split[0] === 'left' || split[0] === 'right') {
                                switch (split[1]) {
                                    case 'top':
                                        offset.top = position.top - actualHeight;
                                        break;
                                    case 'bottom':
                                        offset.top = position.top + position.height;
                                }
                            }
                            return offset;
                        }

                        return $tooltip;
                    }

                    // Helper functions
                    function findElement(query, element) {
                        return angular.element((element || document).querySelectorAll(query));
                    }

                    function fetchTemplate(template) {
                        return $q.when($templateCache.get(template) || $http.get(template)).then(function (res) {
                            if (angular.isObject(res)) {
                                $templateCache.put(template, res.data);
                                return res.data;
                            }
                            return res;
                        });
                    }

                    return TooltipFactory;
                }
            ];
        }).directive('bsTooltip', [
            '$window',
            '$location',
            '$sce',
            '$tooltip',
            '$$rAF',
            function ($window, $location, $sce, $tooltip, $$rAF) {
                return {
                    restrict: 'EAC',
                    scope: true,
                    link: function postLink(scope, element, attr, transclusion) {
                        // Directive options
                        var options = { scope: scope };
                        angular.forEach([
                            'template',
                            'contentTemplate',
                            'placement',
                            'container',
                            'delay',
                            'trigger',
                            'keyboard',
                            'html',
                            'animation',
                            'type'
                        ], function (key) {
                            if (angular.isDefined(attr[key]))
                                options[key] = attr[key];
                        });
                        // Observe scope attributes for change
                        angular.forEach(['title'], function (key) {
                            attr[key] && attr.$observe(key, function (newValue, oldValue) {
                                scope[key] = $sce.trustAsHtml(newValue);
                                angular.isDefined(oldValue) && $$rAF(function () {
                                    tooltip && tooltip.$applyPlacement();
                                });
                            });
                        });
                        // Support scope as an object
                        attr.bsTooltip && scope.$watch(attr.bsTooltip, function (newValue, oldValue) {
                            if (angular.isObject(newValue)) {
                                angular.extend(scope, newValue);
                            } else {
                                scope.title = newValue;
                            }
                            angular.isDefined(oldValue) && $$rAF(function () {
                                tooltip && tooltip.$applyPlacement();
                            });
                        }, true);
                        // Initialize popover
                        var tooltip = $tooltip(element, options);
                        // Garbage collection
                        scope.$on('$destroy', function () {
                            tooltip.destroy();
                            options = null;
                            tooltip = null;
                        });
                    }
                };
            }
        ]);

    angular.module('mgcrea.ngStrap.typeahead', [
        'mgcrea.ngStrap.tooltip',
        'mgcrea.ngStrap.helpers.parseOptions'
    ]).provider('$typeahead',
        function () {
            var defaults = this.defaults = {
                animation: 'am-fade',
                prefixClass: 'typeahead',
                placement: 'bottom-left',
                template: 'typeahead/typeahead.tpl.html',
                trigger: 'default',
                container: false,
                keyboard: true,
                html: false,
                delay: 0,
                minLength: 0,
                filter: 'filter',
                limit: 6,
                multiple: false,
                upsert: false,
                otherDisplayFields: undefined
            };
            this.$get = [
                '$window',
                '$rootScope',
                '$tooltip',
                function ($window, $rootScope, $tooltip) {
                    var bodyEl = angular.element($window.document.body);

                    function TypeaheadFactory(element, config) {
                        var $typeahead = {};
                        // Common vars
                        var options = angular.extend({}, defaults, config);
                        var controller = options.controller;
                        $typeahead = $tooltip(element, options);
                        var parentScope = config.scope;
                        var scope = $typeahead.$scope;
                        scope.$matches = [];
                        scope.$activeIndex = 0;
                        scope.$activate = function (index) {
                            scope.$$postDigest(function () {
                                $typeahead.activate(index);
                            });
                        };
                        scope.$select = function (index, evt) {
                            scope.$$postDigest(function () {
                                $typeahead.select(index);
                            });
                        };
                        scope.$isVisible = function () {
                            return $typeahead.$isVisible();
                        };
                        // Public methods


                        /*Naveen start -->  on every key down we need to show options if options is not visible*/
                        $typeahead.$typeheadOptionsVisibility = false;
                        /*Naveen ends*/


                        $typeahead.update = function (matches) {
                            scope.$matches = matches;
                            if (scope.$activeIndex >= matches.length) {
                                scope.$activeIndex = 0;
                            }
                        };
                        $typeahead.activate = function (index) {
                            scope.$activeIndex = index;
                        };
                        $typeahead.select = function (index) {
                            var value = scope.$matches[index].value;
                            if (value == "No Data Found") {
                                $typeahead.hide();
                                return;
                            }
                            if (controller) {
                                if (options.multiple) {
                                    controller.$modelValue = controller.$modelValue || [];
                                    for (var i = 0; i < controller.$modelValue.length; i++) {
                                        var obj = controller.$modelValue[i];
                                        if (controller.$modelValue[i] == value) {
                                            alert('Error: Duplicate value is not allowed in multiple >>>>>>>');
                                            $typeahead.hide();
                                            return undefined;
                                        }

                                    }
                                    controller.$modelValue.push(value);
                                    controller.$setViewValue(controller.$modelValue.map(function (index) {
                                        return index;
                                    }));
                                    element.val('');
                                    /* ashish end*/
                                } else {
                                    controller.$setViewValue(value);
                                    scope.$activeIndex = 0;
                                }
                                if (!scope.$$phase) {
                                    scope.$apply();
                                }
                                /* ashish end for multiple value select*/
                                controller.$render();
                                if (parentScope)
                                    parentScope.$digest();
                            }
                            if (options.trigger === 'default') {
                                /*Naveen Start --> we remove blur event bcz due to this we lost focus issue and hide will be called for hide the pop up*/
                                $typeahead.hide();
//                                element[0].blur();
                                /*Naveen end*/
                            } else if ($typeahead.$isShown)
                                $typeahead.hide();

                            // Emit event
                            scope.$emit('$typeahead.select', value, index);
                        };
                        // Protected methods
                        $typeahead.$isVisible = function () {
                            if (!options.minLength || !controller) {
                                return !!scope.$matches.length;
                            }
                            // minLength support
                            return scope.$matches.length && angular.isString(controller.$viewValue) && controller.$viewValue.length >= options.minLength;
                        };
                        $typeahead.$getIndex = function (value) {
                            var l = scope.$matches.length, i = l;
                            if (!l)
                                return;
                            for (i = l; i--;) {
                                if (scope.$matches[i].value === value)
                                    break;
                            }
                            if (i < 0)
                                return;
                            return i;
                        };
                        $typeahead.$onMouseDown = function (evt) {
                            // Prevent blur on mousedown
                            evt.preventDefault();
                            evt.stopPropagation();
                        };
                        $typeahead.$onKeyDown = function (evt) {
                            /* ashish start --> show the drop down properly if space is avalibale show on bottom else on top*/
                            if ($typeahead.$element) {
                                setTimeout(function () {
                                    $typeahead.$applyPlacement();
                                }, 100)
                            }
                            /* ashish end */
                            if (!/(38|40|13|27)/.test(evt.keyCode))
                                return;

                            evt.preventDefault();
                            evt.stopPropagation();
                            // Select with enter
                            if (evt.keyCode === 27) {
                                return $typeahead.hide();
                            }
                            if (evt.keyCode === 13 && scope.$matches.length) {
                                return $typeahead.select(scope.$activeIndex);
                            }
                            // Navigate with keyboard
                            if (evt.keyCode === 38) {
                                /* Ashish start for scrolling the scroll bar */
                                var liElement = $typeahead.$element.find('li');
                                var active = angular.element(liElement[scope.$activeIndex])
                                    , prev = active.prev()

                                var ulHeight = $typeahead.$element.height();
                                var ulTop = $typeahead.$element.scrollTop();
                                var activeLiTop = angular.element(active).position().top;
                                var liHeight = $typeahead.$element.find('li').height();


                                if (!prev.length && liElement && liElement.length > 0) {
                                    $typeahead.$element.scrollTop(angular.element($typeahead.$element.find('li').last()).position().top);
                                    scope.$activeIndex = liElement.length;
                                } else {
                                    activeLiTop = prev.position().top;
                                    if (activeLiTop < 0) {
                                        var setScrollTop = ulTop - liHeight;
                                        $typeahead.$element.scrollTop(setScrollTop);
                                    }
                                }
                                /* Ashish end for scrolling the scroll bar */
                                scope.$activeIndex--;
                            } else if (evt.keyCode === 40) {
                                /* Ashish start for scrolling the scroll bar */
                                var liElement = $typeahead.$element.find('li');
                                var active = angular.element(liElement[scope.$activeIndex])
                                    , next = active.next()
                                var ulHeight = $typeahead.$element.height();
                                var ulTop = $typeahead.$element.scrollTop();
                                var activeLiTop = angular.element(active).position().top;
                                var liHeight = $typeahead.$element.find('li').height();
                                if (!next.length) {

                                    $typeahead.$element.scrollTop(0);
                                    scope.$activeIndex = -1;
                                } else {
                                    if ((activeLiTop + liHeight) > ulHeight) {
                                        var setScrollTop = ulTop + liHeight;
                                        $typeahead.$element.scrollTop(setScrollTop);
                                    }
                                }
                                /* Ashish end for scrolling the scroll bar */
                                scope.$activeIndex++;
                            } else if (angular.isUndefined(scope.$activeIndex))
                                scope.$activeIndex = 0;
                            scope.$digest();
                        };
                        // Overrides
                        var show = $typeahead.show;
                        $typeahead.show = function () {
                            scope.$activeIndex = 0;
                            show();
                            $typeahead.$typeheadOptionsVisibility = true;
                            setTimeout(function () {
                                $typeahead.$element.on('mousedown', $typeahead.$onMouseDown);
                                if (options.keyboard) {
                                    element.on('keydown', $typeahead.$onKeyDown);
                                }
                            });
                        };
                        var hide = $typeahead.hide;
                        $typeahead.hide = function () {
                            if (!$typeahead.$element) return;
                            $typeahead.$element.off('mousedown', $typeahead.$onMouseDown);
                            if (options.keyboard) {
                                element.off('keydown', $typeahead.$onKeyDown);
                            }
                            hide();
                            $typeahead.$typeheadOptionsVisibility = false;
                        };
                        return $typeahead;
                    }

                    TypeaheadFactory.defaults = defaults;
                    return TypeaheadFactory;
                }
            ];
        }).directive('bsTypeahead', [
            '$window',
            '$parse',
            '$q',
            '$typeahead',
            '$parseOptions',
            '$http',
            function ($window, $parse, $q, $typeahead, $parseOptions, $http) {
                var defaults = $typeahead.defaults;
                return {
                    restrict: 'EAC',
                    require: 'ngModel',
                    link: function postLink(scope, element, attr, controller) {
                        // Directive options
                        var options = {
                            scope: scope,
                            controller: controller
                        };
                        angular.forEach([
                            'placement',
                            'container',
                            'delay',
                            'trigger',
                            'keyboard',
                            'html',
                            'animation',
                            'template',
                            'filter',
                            'limit',
                            'minLength',
                            'multiple',
                            'upsert',
                            'otherDisplayFields'
                        ], function (key) {
                            if (angular.isDefined(attr[key]))
                                options[key] = attr[key];
                        });

                        // Build proper ngOptions
                        var filter = options.filter || defaults.filter;

//                    var limit = options.limit || defaults.limit;
                        var ngOptions = attr.ngOptions;
                        if (filter)
                            ngOptions += ' | ' + filter + ':$viewValue';
//                    if (limit)
//                        ngOptions += ' | limitTo:' + limit;
                        var parsedOptions = $parseOptions(ngOptions);
                        // Initialize typeahead
                        /*rohit Start*/
                        element.unbind("input").unbind("keydown").unbind("change");
                        /*rohit end*/
                        var typeahead = $typeahead(element, options);
                        // if(!dump) var dump = console.error.bind(console);
                        // Watch model for changes
                        /*rohit Start*/
                        element.bind("keyup", function (evt) {
                            if (evt.keyCode == 13 || evt.keyCode == 37 || evt.keyCode == 38 || evt.keyCode == 39 || evt.keyCode == 27 | evt.keyCode == 9 || evt.keyCode == 16) {
                                return; // 9 and 16 required to keep the options hide during tab-traversing
                            }
                            if (evt.keyCode == 40 && typeahead.$typeheadOptionsVisibility) {
                                return
                            }
                            handleChange(element.val());
                            if (!typeahead.$typeheadOptionsVisibility) {
                                typeahead.show();
                            }
                        });


                        /* ashish start */
//                    $aplly --> value not changed on grid when value select from form
                        element.bind("blur", function () {
                            if (controller.$modelValue === controller.$viewValue) {
                                //do nothing
                            } else {
                                //value are not same, we need to change model value
                                if (!options.multiple && (controller.$viewValue === undefined || controller.$viewValue === "")) {
                                    controller.$setViewValue(undefined);
                                } else if (angular.isDefined(options.upsert) && options.upsert !== "undefined") {
                                    var displayField = options.upsert;
                                    var elementValue = undefined;
                                    if (options.upsert == "") {
                                        elementValue = element.val();
                                    } else {
                                        elementValue = {};
                                        if (options.otherDisplayFields && options.otherDisplayFields != "undefined") {
                                            var otherValues = element.val().split('|');
                                            var otherFields = options.otherDisplayFields.split(',');
                                            for (var i = 0; i < otherValues.length; i++) {
                                                var otherDisplayField = otherValues[i].trim();
                                                if (i == 0) {
                                                    elementValue[displayField] = otherDisplayField;
                                                    continue;
                                                }
                                                if (otherFields[i - 1]) {
                                                    elementValue[otherFields[i - 1]] = otherDisplayField;
                                                }
                                            }
                                        } else {
                                            elementValue[displayField] = element.val();
                                        }
                                    }
                                    if (options.multiple) {
                                        if (options.multiple) {
                                            controller.$modelValue = controller.$modelValue || [];
                                            for (var i = 0; i < controller.$modelValue.length; i++) {
                                                var obj = controller.$modelValue[i];
                                                if (controller.$modelValue[i] == elementValue) {
                                                    alert('Error: Duplicate value is not allowed in multiple >>>>>>>');
                                                    $typeahead.hide();
                                                    return undefined;
                                                }

                                            }
                                            controller.$modelValue.push(elementValue);
                                            controller.$setViewValue(controller.$modelValue.map(function (index) {
                                                return index;
                                            }));
                                            element.val('');
                                            /* ashish end*/
                                        }
                                    } else {
                                        controller.$setViewValue(elementValue);
                                    }

                                } else if (options.multiple && angular.isDefined(controller.$modelValue)) {
                                    element.val("");
                                } else {
                                    for (var key in controller.$modelValue) {
                                        if (controller.$modelValue[key] == controller.$viewValue) {
                                            return;
                                        }
                                    }
                                    element.val("");
                                    controller.$setViewValue(undefined);
                                }


                            }
//                        if (ngOptions) {
//                            var matches = typeahead.$scope.$matches;
//                            var splitValue = ngOptions.split(" ");
//                            var elementValue = element.val();
//
////                            if (matches && matches.length > 0) {
////                                for (var i = 0; i < matches.length; i++) {
////                                    var match = matches[i];
////                                    if (match.label == elementValue) {
////                                        if (!scope.$$phase) {
////                                            scope.$apply();
////                                        }
////                                        return;
////                                    }
////                                }
////                            }
//
//                            if (splitValue && splitValue.length > 0) {
//                                if (elementValue.toString().trim().length == 0) {
//                                    if (!options.multiple) {
//                                        controller.$setViewValue(undefined);
//
//                                    }
////                                    return;
//                                }
//
//
//
////                                var firstValue = splitValue[0];
////                                var secondValue = splitValue[2];
////                                if (angular.isDefined(firstValue) && angular.isDefined(secondValue)) {
////                                    if (angular.equals(firstValue, secondValue)) { // case of string
////                                        setValueInModelOnBlur(elementValue);
////                                    } else { // case of object
////                                        var dotIndex = secondValue.indexOf('.');
////                                        if (dotIndex >= 0) {
////                                            var displayField = secondValue.substring(dotIndex + 1);
////                                            var obj = {};
////                                            obj[displayField] = elementValue;
////                                            setValueInModelOnBlur(obj);
////                                        }
////                                    }
////                                }
//                            }
//                        }


                            if (!scope.$$phase) {
                                scope.$apply();
                            }
                        });
                        /* ashish end*/

                        var nextElement = element.next();
                        nextElement.bind('mousedown', function (event) {
                            controller.$fetchAllData = true;
                            handleChange(element.val());
                            typeahead.show();                          // to show the all available options
                            controller.$fetchAllData = false;
                            scope.$activeIndex = 0;
                            setTimeout(function () {
                                typeahead.$applyPlacement();
                            }, 0)
                            element.focus();                           // to set focus on input element
                            event.preventDefault();
                            event.stopPropagation();
                        });

                        function setValueInModelOnBlur(value) {
                            if (options.multiple) {
                                controller.$modelValue = controller.$modelValue || [];
                                controller.$modelValue.push(value);
                                controller.$setViewValue(controller.$modelValue.map(function (index) {
                                    return index;
                                }));
                            } else {
                                controller.$setViewValue(value);
                            }

                        }


                        function handleChange(newValue) {
//                        scope.$modelValue = newValue;
                            controller.$viewValue = newValue;
                            //Set model value on the scope to custom templates can use it.
                            scope.loadingImage = true;

                            parsedOptions.valuesFnApplane(scope, controller, options).then(function (values) {

//                            if (values.length > limit)
//                                values = values.slice(0, limit);
                                // if(matches.length === 1 && matches[0].value === newValue) return;
                                if (values && values.length == 0) {
                                    values.push({label: "No Data Found", value: "No Data Found"});
                                }
                                if (values) {
                                    scope.loadingImage = false; //loading messge should remove only when data comes, if undefined comes,then we will not remove
                                    typeahead.update(values);
                                }
                                // Queue a new rendering that will leverage collection loading
//                            controller.$render();    // TODO: need to comment due to value get updated during typing
                                //Naveen SIngh Start: to populate tooltip after data comes form server
                                if (typeahead.$element) {
                                    setTimeout(function () {
                                        typeahead.$applyPlacement();
                                    }, 0)
                                }

                            });
                            if (!scope.$$phase) {
                                scope.$apply();
                            }

                        }

                        scope.$watch(attr.ngModel, function (newValue, oldValue) {
//                        handleChange(element.val());
                        });
                        /*rohit end*/
                        // Model rendering in view
                        controller.$render = function () {
                            // console.warn('$render', element.attr('ng-model'), 'controller.$modelValue', typeof controller.$modelValue, controller.$modelValue, 'controller.$viewValue', typeof controller.$viewValue, controller.$viewValue);
                            controller.$viewValue = controller.$modelValue;
                            if (options && !options.multiple) {
                                if (controller.$isEmpty(controller.$viewValue))
                                    return element.val('');
//                            var index = typeahead.$getIndex(controller.$modelValue);    // to remove the input value with backspace we need to pass input value instead of $modelValue
                                var inputElementValue = element[0].value;
//                            var index = typeahead.$getIndex(inputElementValue);
//                            var selected = angular.isDefined(index) ? typeahead.$scope.$matches[index].label : controller.$viewValue;
                                var selected = controller.$viewValue;
                                if (angular.isDefined(selected) && angular.isObject(selected)) {
                                    selected = getSelectedValue(selected);
                                }
                                if (angular.isDefined(selected) && selected !== null) {
                                    element.val(selected.replace(/<(?:.|\n)*?>/gm, '').trim());
                                }

                            }

                        };


                        /* for handle display expression [ashish start] */
                        function getSelectedValue(value) {
                            var selectedValue = parsedOptions.getParseValue(value, options, true);
                            if (selectedValue && selectedValue.length > 0) {
                                value = selectedValue[0].label;
                            }
                            return value;
                        }

                        /* [ashish end] */

                        // Garbage collection
                        scope.$on('$destroy', function () {
                            typeahead.destroy();
                            options = null;
                            typeahead = null;
                        });
                    }
                };
            }
        ]);

// tpl section:- it contains html for above modules
    angular.module('mgcrea.ngStrap.datepicker').run([
        '$templateCache',
        function ($templateCache) {
            $templateCache.put('datepicker/datepicker.tpl.html', '<div class="dropdown-menu datepicker" ng-class="\'datepicker-mode-\' + $mode" style="max-width: 320px"><table style="table-layout: fixed; height: 100%; width: 100%"><thead><tr class="text-center"><th><button tabindex="-1" type="button" class="btn btn-default pull-left" ng-click="$selectPane(-1, $event)"><i class="icon-chevron-left"></i></button></th><th colspan="{{ rows[0].length - 2 }}"><button tabindex="-1" type="button" class="btn btn-default btn-block text-strong" ng-click="$toggleMode($event)"><strong style="text-transform: capitalize" ng-bind="title"></strong></button></th><th><button tabindex="-1" type="button" class="btn btn-default pull-right" ng-click="$selectPane(+1, $event)"><i class="icon-chevron-right"></i></button></th></tr><tr ng-show="labels" ng-bind-html="labels"></tr></thead><tbody><tr ng-repeat="(i, row) in rows" height="{{ 100 / rows.length }}%"><td class="text-center" ng-repeat="(j, el) in row"><button tabindex="-1" type="button" class="btn btn-default" style="width: 100%" ng-class="{\'btn-primary\': el.selected}" ng-click="$select(el.date,$event)" ng-disabled="el.disabled"><span ng-class="{\'text-muted\': el.muted}" ng-bind="el.label"></span></button></td></tr></tbody></table></div>');
        }
    ]);

    angular.module('mgcrea.ngStrap.timepicker').run([
        '$templateCache',
        function ($templateCache) {
            $templateCache.put('timepicker/timepicker.tpl.html', '<div class="dropdown-menu timepicker" style="min-width: 0px;width: auto; padding: 10px;"><table height="100%"><thead><tr class="text-center"><th><button tabindex="-1" type="button" class="btn btn-default pull-left time-arrow" ng-click="$moveIndex(-1, 0, $event)">  <i class="icon-chevron-up"></i></button></th><th>&nbsp;</th><th><button tabindex="-1" type="button" class="btn btn-default pull-left time-arrow" ng-click="$moveIndex(-1, 1, $event)"><i class="icon-chevron-up"></i></button></th></tr></thead><tbody><tr ng-repeat="(i, row) in rows"><td class="text-center"><button tabindex="-1" style="width: 100%" type="button" class="btn btn-default" ng-class="{\'btn-primary\': row[0].selected}" ng-click="$select(row[0].date, 0, $event)" ng-disabled="row[0].disabled"><span ng-class="{\'text-muted\': row[0].muted}" ng-bind="row[0].label"></span></button></td><td><span ng-bind="i == midIndex ? \':\' : \' \'"></span></td><td class="text-center"><button tabindex="-1" ng-if="row[1].date" style="width: 100%" type="button" class="btn btn-default" ng-class="{\'btn-primary\': row[1].selected}" ng-click="$select(row[1].date, 1, $event)" ng-disabled="row[1].disabled"><span ng-class="{\'text-muted\': row[1].muted}" ng-bind="row[1].label"></span></button></td><td ng-if="showAM">&nbsp;</td><td ng-if="showAM"><button tabindex="-1" ng-show="i == midIndex - !isAM * 1" style="width: 100%" type="button" ng-class="{\'btn-primary\': !!isAM}" class="btn btn-default" ng-click="$switchMeridian($event)" ng-disabled="el.disabled">AM</button> <button tabindex="-1" ng-show="i == midIndex + 1 - !isAM * 1" style="width: 100%" type="button" ng-class="{\'btn-primary\': !isAM}" class="btn btn-default" ng-click="$switchMeridian($event)" ng-disabled="el.disabled">PM</button></td></tr></tbody><tfoot><tr class="text-center"><th><button tabindex="-1" type="button" class="btn btn-default pull-left time-arrow" ng-click="$moveIndex(1, 0, $event)"><i class="icon-chevron-down"></i></button></th><th>&nbsp;</th><th><button tabindex="-1" type="button" class="btn btn-default pull-left time-arrow" ng-click="$moveIndex(1, 1,$event)"><i class="icon-chevron-down"></i></button></th></tr></tfoot></table></div>');
        }
    ]);

    angular.module('mgcrea.ngStrap.tooltip').run([
        '$templateCache',
        function ($templateCache) {
            $templateCache.put('tooltip/tooltip.tpl.html', '<div class="tooltip in" ng-show="title"><div class="tooltip-arrow"></div><div class="tooltip-inner" ng-bind="title"></div></div>');
        }
    ]);

    angular.module('mgcrea.ngStrap.typeahead').run([
        '$templateCache',
        function ($templateCache) {
            $templateCache.put('typeahead/typeahead.tpl.html',
                    '   <ul tabindex="-1" style="max-height:150px;overflow: auto;" class="typeahead dropdown-menu" ng-show="$isVisible()" role="select">' +
                    '      <li role="presentation" ng-repeat="match in $matches" ng-class="{active: $index == $activeIndex}">' +
                    '         <a role="menuitem" tabindex="-1" ng-click="$select($index, $event)" title="{{match.label}}" class="pl-tooltip-options" ng-bind-html="match.label"></a>' +
                    '      </li>' +
                    '   </ul>');
        }
    ]);

})(window, document);

var pl = (pl === undefined) ? angular.module('pl', ['ngCookies', 'ngAnimate', 'ngSanitize', 'mgcrea.ngStrap']) : pl;

/*pl-grid starts from here*/
var INDEX_OFFSET = 100;

pl.controller('pl-grid-controller', function ($scope, $compile, $timeout, $parse) {
    var gridUnwatcher = {};


    var gridStartTime = new Date();
    $timeout(function () {
        var gridEndTime = new Date();
        $scope.workbenchOptions.gridRenderTime = "Grid : " + (gridEndTime - gridStartTime);
    }, 0);


    if (!$scope.gridOptions.alertMessageOptions) {
        $scope.gridOptions.alertMessageOptions = {};
        gridUnwatcher.alertMessageOptions = $scope.$watch("gridOptions.alertMessageOptions.message", function (newMess) {
            if ($scope.gridOptions.alertMessageOptions && $scope.gridOptions.alertMessageOptions.message) {
                //open a popup here
                alert($scope.gridOptions.alertMessageOptions.title + "\n" + $scope.gridOptions.alertMessageOptions.message);
            }
        })
    }

    if (!$scope.gridOptions.warningOptions) {
        $scope.gridOptions.warningOptions = {};
        gridUnwatcher.warningOptions = $scope.$watch("gridOptions.warningOptions.warnings", function (newWarnings) {
            if ($scope.gridOptions.warningOptions && $scope.gridOptions.warningOptions.warnings && $scope.gridOptions.warningOptions.warnings.length > 0) {
                //open a popup here
                alert($scope.gridOptions.warningOptions.title + "\n" + JSON.stringify($scope.gridOptions.warningOptions.warnings));
            }
        })
    }
    gridUnwatcher.validations = $scope.$watch("gridOptions.sharedOptions.validations", function (validations) {
        if (angular.isDefined(validations)) {
            var renderedRows = $scope.gridOptions.renderedRows;
            for (var j = 0; j < renderedRows.length; j++) {
                var row = renderedRows[j];
                var validationIndex = Utility.isExists(validations, row.entity, "_id");
                if (validationIndex === undefined) {
                    delete row.validations;
                } else {
                    row.validations = validations[validationIndex];
                }
            }
        }
    })

    $scope.dragDivVisibility = false;
    $scope.close = function () {
        $scope.gridOptions.sharedOptions.closed = true;
    };
    $scope.getDataMappingKey = function (entity, dataModel) {
        if (entity === undefined || dataModel === undefined) {
            return;
        }

        if (entity._id && dataModel.getKeyMapping()) {
            return Utility.getDataMappingKey(entity, dataModel.getKeyMapping());
        }
    };
    $scope.delete = function () {
        try {


            var rowsToDelete = [];
            for (var i = $scope.gridOptions.renderedRows.length - 1; i >= 0; i--) {
                if ($scope.gridOptions.renderedRows[i].__selected__) {
                    var dataRowIndex = $scope.getDataMappingKey($scope.gridOptions.renderedRows[i].entity, $scope.gridOptions.dataModel);
                    rowsToDelete.push(dataRowIndex);
                    $scope.gridOptions.renderedRows.splice(i, 1);
                }
            }
            if (rowsToDelete.length == 0) {
                $scope.gridOptions.shortMessageOptions.msg = "No row found for delete.";
                return;
            }
            $scope.gridOptions.sharedOptions.saveOptions.editMode = true;
            $scope.gridOptions.dataModel.delete(rowsToDelete).then(
                function () {
                    if ($scope.gridOptions.sharedOptions.pageOptions) {
                        if ($scope.gridOptions.sharedOptions.pageOptions.fetchCount) {
                            $scope.gridOptions.sharedOptions.pageOptions.count = $scope.gridOptions.sharedOptions.pageOptions.count - rowsToDelete.length;
                        }
                        if ($scope.gridOptions.renderedRows.length > 0) {
                            $scope.gridOptions.sharedOptions.pageOptions.label = '1-' + $scope.gridOptions.renderedRows.length;
                        } else {
                            $scope.gridOptions.sharedOptions.pageOptions.label = '0-0';
                        }
                    }
                    $scope.gridOptions.shortMessageOptions.msg = rowsToDelete.length + " row(s) deleted. Press Save to persist or Cancel to discard the changes";
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }).fail(function (err) {
                    var title = "delete in pl.grid";
                    var message = "Error in delete>>>" + err + "\n" + err.stack;
                    $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                });
        } catch (e) {
            var title = "delete in pl.grid";
            var message = "Error in delete >>>" + e + "\n" + e.stack;
            $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
        }
    }
    $scope.insert = function ($event, insertMode) {
        try {
            if ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            }
            if ((!insertMode) && $scope.gridOptions.sharedOptions.insertInfo) {
                insertMode = $scope.gridOptions.sharedOptions.insertInfo.insertMode;
            }

            if ((!insertMode || insertMode == "form" )) {
                $scope.gridOptions.sharedOptions.insertInfo.insert = {saveOptions: {editMode: true}, addNewRow: true, deAttached: true};
                return;
            }

            if ($scope.view.viewOptions.busyMessageOptions) {
                $scope.view.viewOptions.busyMessageOptions.msg = "Loading...";
            }
            $timeout(function () {
                $scope.gridOptions.dataModel.insert().then(
                    function (insertInfo) {
                        if (insertMode == "nestedForm") {
                            if ($scope.gridOptions.rowActions && $scope.gridOptions.rowActions.length > 0 && $scope.gridOptions.rowActions[0].type == "detail") {
                                $scope.gridOptions.sharedOptions.saveOptions.editMode = true;
                                $scope.gridOptions.rowActions[0].nestedForm = true;
                                $scope.rowActionOptionClick(0);
                            }
                        }
                        if ($scope.view.viewOptions.busyMessageOptions) {
                            delete $scope.view.viewOptions.busyMessageOptions.msg;
                        }
                        $scope.gridOptions.sharedOptions.saveOptions.editMode = true;
                        if ($scope.gridOptions.parentSharedOptions) {
                            $scope.gridOptions.parentSharedOptions.editMode = true;
                        }
                        $scope.setCurrentRow(insertInfo.entity);
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }

                    }).fail(function (err) {
                        $scope.gridOptions.save = false;
                        var title = "insert in pl.grid";
                        var message = "Error in insert>>>>" + err + "\n" + err.stack;
                        $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    });
            }, 0)
        } catch (err) {
            $scope.gridOptions.save = false;
            var title = "Insert in pl.grid";
            var message = "Error: >>>>> " + err + "\n" + err.stack;
            $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }

    }

    $scope.ftsSearch = function (val) {
        try {
            $scope.gridOptions.dataModel.setFts(val);
            $scope.refresh();
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.nestedTablelabelClick = function (row, col) {
        try {
            if (col) {
                $scope.setCurrentRow(row.entity);
                var view = $scope.getNestedView(col, $scope.gridOptions.sharedOptions);
                view.viewOptions.closeViewIndex = $scope.view.viewOptions.viewIndex + 1;
                view.viewOptions.close = true;
                view.viewOptions.viewResize = true;
                view.viewOptions.hideAccordion = true;
                $scope[$scope.view.viewOptions.openV](view)
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.next = function () {
        $scope.gridOptions.sharedOptions.pageOptions.cursor = $scope.gridOptions.sharedOptions.pageOptions.cursor + $scope.gridOptions.sharedOptions.pageOptions.pageSize;
    }
    $scope.previous = function () {
        $scope.gridOptions.sharedOptions.pageOptions.cursor = $scope.gridOptions.sharedOptions.pageOptions.cursor - $scope.gridOptions.sharedOptions.pageOptions.pageSize;
    }
    $scope.onSelectionChange = function (row) {
        try {
            if ($scope.gridOptions.dataModel.setSelectedRow) {
                $scope.gridOptions.dataModel.setSelectedRow(row.entity, row.__selected__);
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.refresh = function () {
        if ($scope.gridOptions.onRefresh) {
            return $scope[$scope.gridOptions.onRefresh]();
        }
    }
    $scope.rowActionOptionClick = function (newRownActionIndex, rowAction) {
        try {
            if (rowAction) {
                if (rowAction.type == 'update') {
                    $scope.update();
                    return;
                } else if (rowAction.type == 'delete') {
                    $scope.delete();
                    return;
                }
            }
            $scope.gridOptions.sharedOptions.selectedRowAction = newRownActionIndex;
            $scope.gridOptions.sharedOptions.currentRowChanged = undefined;  //for the first time when child view or detail open, currentRowChanged watch should not fire
            $scope.gridOptions.sharedOptions.selectedRowActionChanged = !$scope.gridOptions.sharedOptions.selectedRowActionChanged;
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.multiRowActionOptionClick = function (newRownActionIndex, $event) {
        try {
            var multiRowAction = $scope.gridOptions.multiRowActions[newRownActionIndex];
            var clone = angular.copy(multiRowAction);
            clone.sharedOptions = $scope.gridOptions.sharedOptions;
            if (clone.onClick) {
                $scope[clone.onClick](clone, $event);
            } else {
                var title = "multiRowActionOptionClick in pl.grid";
                var message = "No onclick defined in " + JSON.stringify(multiRowAction);
                $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
                return;
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.setPrimaryFieldValue = function (rowData) {
        try {
            if (rowData && $scope.gridOptions.sharedOptions && $scope.gridOptions.sharedOptions.primaryField) {
                var field = $scope.gridOptions.sharedOptions.primaryField;
                $scope.gridOptions.sharedOptions.primaryFieldValue = $scope.gridOptions.sharedOptions.primaryFieldValue || {};
                $scope.gridOptions.sharedOptions.primaryFieldValue.label = rowData[field];
                for (var i = 0; i < $scope.gridOptions.gridColumns.length; i++) {
                    var col = $scope.gridOptions.gridColumns[i];
                    if (col.field == $scope.gridOptions.sharedOptions.primaryField && col.displayField && $scope.gridOptions.sharedOptions.primaryFieldValue.label) {
                        $scope.gridOptions.sharedOptions.primaryFieldValue.label = $scope.gridOptions.sharedOptions.primaryFieldValue.label[col.displayField];
                        break;
                    }
                }
            }
        }
        catch (e) {
            var title = "plGrid in pl.grid";
            var message = 'Error in setPrimaryFieldValue >>> ' + e + '\n' + e.stack;
            $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
        }
    }

    //in case of saving confirm we get warning options error, which display proceed to save , on click of this we are calling this call back function, which recall the same saving method -- Rajit garg 27-mar-15
    var confirmFunction = function () {
        var options = {"confirmUserWarning": true};
        if ($scope.view.viewOptions.saveType === "save") {
            $scope.save(options);
        }
    };

    $scope.view.viewOptions.confirmFunction = confirmFunction;

    $scope.save = function (options) {
        try {
            $scope.view.viewOptions.saveType = "save";
            options = options || {};
            options.savingSource = "grid";
            options.$parse = $parse;
            $scope.gridOptions.dataModel.save(options).then(
                function () {
                    $scope.refresh();
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                })
        } catch (e) {
            var title = "save in pl.grid";
            var message = e + "\n" + e.stack;
            $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
        }
    }

    $scope.onFkClick = function (row, column) {
        try {
            if (row && row.entity && column && column.referredView && column.referredWhen) {
                var needToResolve = true;
                var resolvedValue = false;
                if (column.referredWhen == true || column.referredWhen == "true") {
                    needToResolve = false;
                    resolvedValue = true;
                }
                if (needToResolve) {
                    var getter = $parse(column.referredWhen);
                    var context = {row: row};
                    resolvedValue = getter(context);
                }
                if (!resolvedValue) {
                    return;
                }
                var field = column.field;
                $scope.setCurrentRow(row.entity);
                $scope.setPrimaryFieldValue(row.entity);
                $scope.gridOptions.sharedOptions.referredView = {field: field, referredView: column.referredView, currentRow: row.entity};
                if (column._id) {
                    $scope.gridOptions.sharedOptions.referredView.sourceid = column._id;
                }
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.openFieldActionPopup = function ($event, row, col) {
        /*code to open fieldAction popup if fieldActions is more 1 else call onFieldActionPopupClick method*/
        try {
            if (!col || !$scope.gridOptions.fieldActions || !$scope.gridOptions.fieldActions[col.field] || $scope.gridOptions.fieldActions[col.field].length == 0) {
                return;
            }
            if ($scope.gridOptions.fieldActions[col.field].length == 1) {
                $scope.onFieldActionPopupClick(row, col, 0);
            } else {
                var editHeaderOptionsTemplate = '<div>' +
                    '                               <div ng-repeat="fieldAction in gridOptions.fieldActions[col.field]" class="app-row-action app-cursor-pointer app-padding-five-px app-white-space-nowrap" ng-click="onFieldActionPopupClick(row, col, $index)">' +
                    '                                   <span class="app-padding-ten-px" ng-bind="fieldAction.label"></span>' +
                    '                               </div>' +
                    '                           </div>';
                var popupScope = $scope.$new();
                popupScope.col = col;
                popupScope.row = row;
                var p = new Popup({
                    autoHide: true,
                    deffered: true,
                    escEnabled: true,
                    hideOnClick: true,
                    html: $compile(editHeaderOptionsTemplate)(popupScope),
                    scope: popupScope,
                    element: $event.target
                });
                p.showPopup();
            }

        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    };

    $scope.onFieldActionPopupClick = function (row, col, index) {
        /*code to handle fieldActions click*/
        try {
            if (!$scope.gridOptions.fieldActions || !$scope.gridOptions.fieldActions[col.field] || !$scope.gridOptions.fieldActions[col.field][index]) {
                return;
            }
            var needToResolve = true;
            var resolvedValue = false;
            if (col.actionWhen == true || col.actionWhen == "true") {
                needToResolve = false;
                resolvedValue = true;
            }
            if (needToResolve) {
                var getter = $parse(col.actionWhen);
                var context = {row: row};
                resolvedValue = getter(context);
            }
            if (!resolvedValue) {
                return;
            }
            $scope.setCurrentRow(row.entity);
            $scope.gridOptions.sharedOptions.selectedFieldAction = $scope.gridOptions.fieldActions[col.field][index];
            $scope.gridOptions.sharedOptions.selectedFieldActionChanged = !$scope.gridOptions.sharedOptions.selectedFieldActionChanged;
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    };

    $scope.update = function () {
        $scope.gridOptions.openUpdateView = !$scope.gridOptions.openUpdateView;
    }

    $scope.resize = function (direction) {
        try {
            if ($scope.gridOptions.resizeV && $scope.gridOptions.sharedOptions && $scope.gridOptions.sharedOptions.resizable != false) {
                $scope[$scope.gridOptions.resizeV]($scope.gridOptions.viewIndex, direction);
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }
    if (!$scope.gridOptions.popup && $scope.gridOptions.parentSharedOptions && ($scope.gridOptions.sharedOptions.viewPosition == 'left' || $scope.gridOptions.sharedOptions.viewPosition == 'full')) {
        $scope.resize('left');
    }

    $scope.$on('$destroy', function () {
        if (gridUnwatcher) {
            for (var key in gridUnwatcher) {
                gridUnwatcher[key]();
            }
        }
    });
});

pl.directive("plGrid", ["$compile", "$timeout", function ($compile, $timeout) {
    'use strict';
    return {
        restrict: "A",
        scope: false,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    var gridUnwatcher = {};

                    function dataWatcher(data) {
//                        $scope.populateRenderedRows(data);
                        if ($scope.gridOptions.dataModel.populateKeyMapping) {
                            $scope.gridOptions.dataModel.populateKeyMapping();
                        }

                        $scope.repopulateRenderedRows(data);
                    }

                    $scope.columnReOrdering = function (srcIndex, targetIndex) {
                        var srcColumn = $scope.gridOptions.gridColumns[srcIndex];
                        var targetColumn = $scope.gridOptions.gridColumns[targetIndex];
                        var changes = Util.changeIndex($scope.gridOptions.gridColumns, $scope.gridOptions.colSequenceField, srcIndex, targetIndex)
                        $scope.gridOptions.gridColumns.splice(srcIndex, 1);
                        $scope.gridOptions.gridColumns.splice(targetIndex, 0, srcColumn);
                        return changes;

                    };

                    $scope.changeCurrentRow = function (row, renderedRowIndex) {
                        try {
                            if (row.groupData || row.aggregateRow) {
                                return;
                            }
                            if ($scope.gridOptions.renderedRows[renderedRowIndex]) {
                                $scope.gridOptions.renderedRowIndex = renderedRowIndex;
                                $scope.setPrimaryFieldValue($scope.gridOptions.renderedRows[renderedRowIndex].entity);
                                $scope.gridOptions.currentRow = row.entity;
                                $scope.gridOptions.currentRowChanged = !$scope.gridOptions.currentRowChanged;
                            } else if ($scope.gridOptions.provideParentParameter) {//this work is done when there is no rendered rows in left dashboard view and we have to load right dashboard view---case for notifying other dashboard view on click of one dashboard view--Ritesh Bansal
                                $scope.gridOptions.currentRowChanged = !$scope.gridOptions.currentRowChanged;
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.editRowHeaderAction = function ($event) {
                        try {
                            var editHeaderOptionsTemplate = '<div class="pl-header-actions-popup" >' +
                                '                               <div ng-repeat="col in gridOptions.gridColumns" class="app-row-action app-cursor-pointer app-padding-five-px" ng-if="col.label" >' +
                                '                               <input checked type="checkbox" /><span class="app-padding-ten-px" ng-bind="col.label"></span>' +
                                '                           </div>';
                            var popupScope = $scope.$new();
                            var p = new Popup({
                                autoHide: true,
                                deffered: true,
                                escEnabled: true,
                                hideOnClick: false,
                                html: $compile(editHeaderOptionsTemplate)(popupScope),
                                scope: popupScope,
                                element: $event.target
                            });
                            p.showPopup();
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.editRowAction = function (row) {
                        try {
                            row.editMode = !row.editMode;
                            $scope.gridOptions.sharedOptions.saveOptions.editMode = true;
                            if ($scope.gridOptions.parentSharedOptions) {
                                $scope.gridOptions.parentSharedOptions.editMode = true;
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.getSrcRowIndex = function () {
                        return $scope.srcRowIndex;
                    };
                    $scope.getRowDragable = function () {
                        return $scope.isRowDragable;
                    }
                    $scope.groupTemplate = function (data, renderedRow, parentGroup) {

                        try {
                            var groupLevel = 0;
                            var nextLevel = 0;
                            if (angular.isDefined(parentGroup)) {
                                groupLevel = parentGroup + 1;
                                nextLevel = groupLevel;
                            } else {
                                nextLevel = 1;
                            }

                            for (var i = 0; i < data.length; i++) {
                                var depth = groupLevel;
                                if (data[i] && angular.isDefined(data[i].__groupLevel)) {
                                    groupLevel = data[i].__groupLevel;
                                    if (angular.isDefined(data[i].__depth)) {
                                        nextLevel = data[i].__depth + 1;
                                        depth = data[i].__depth;
                                    }
                                }
                                var obj = {};
                                obj.__hidden__ = true;
                                obj.entity = data[i];

                                obj.level = nextLevel;

                                if ($scope.gridOptions.groupInfo && $scope.gridOptions.groupInfo[groupLevel]) {
                                    obj.__group__ = depth;
                                    if (angular.isDefined(data[i])) {
                                        var groupColumn = $scope.gridOptions.groupInfo[groupLevel];
                                        var groupCellTemplate = "";
                                        var colField = undefined;
//                                    for (var key in $scope.gridOptions.userPreferenceOptions.queryGroups) {
//                                        if (key == "_id") {
//                                            continue;
//                                        }
//                                        for (var j = 0; j < $scope.gridOptions.columns.length; j++) {
//                                            if (key == $scope.gridOptions.columns[j].field) {
//                                                colField = $scope.gridOptions.columns[j].label || '';
//                                            }
//
//                                        }
//                                        groupCellTemplate += "<span ng-show='row.entity." + key + "'>" + colField + ":&nbsp;<span>{{row.entity." + key + "}}</span>&nbsp;</span>"
//                                    }

                                        var fieldToBind = "row.entity." + groupColumn.field;
                                        if (groupColumn.displayField) {
                                            fieldToBind += "." + groupColumn.displayField;
                                        }
                                        groupCellTemplate += "<span style='font-weight: normal; '>" + groupColumn.label + "</span>: <span >{{" + fieldToBind + "}}</span> ("
                                        if ($scope.gridOptions.aggregateColumns) {
                                            for (var j = 0; j < $scope.gridOptions.aggregateColumns.length; j++) {
                                                var aggColumn = $scope.gridOptions.aggregateColumns[j];
                                                if (aggColumn.cellTemplate) {
                                                    groupCellTemplate += "<span style='font-weight: normal; '> " + aggColumn.label + ": </span>" + aggColumn.cellTemplate;
                                                }

                                            }
                                        }
                                        groupCellTemplate += ' )';

                                        obj.groupData = "<div ng-style='{\"margin-left\":row.__group__ * 32+\"px\"}' class='icon-plus pl-group-toggle-box' pl-grid-group style='padding-right: 3px;'  ng-click='toggleTree(row,$parent.$index," + groupLevel + " )' ></div>" +
                                            "<div class='app-white-space-nowrap group-template' ng-class='{\"app-font-weight-bold\": row.__group__ == 0}' >" +
                                            groupCellTemplate +
                                            "</div>";
                                        renderedRow.push(obj);
                                    }
                                } else if (data[i].children && data[i].children.length > 0) {
                                    obj.__hidden__ = false;
//                                obj.groupData = '<div ng-click="toggleTreeForChild(row, $parent.$index)" ng-show="row.entity.children" ><div pl-grid-group class="icon-plus pl-group-toggle-box">&nbsp;</div></div>';
                                    renderedRow.push(obj);
                                } else {
                                    renderedRow.push(obj);
                                }

                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.onViewControlOptionClick = function (option) {
                        try {
                            if ($scope.gridOptions.onViewControl) {
                                $scope[$scope.gridOptions.onViewControl](option)
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    var checkChildrenDataForRecursive = function (data, renderedRow, alias) {
                        if (data && data.length > 0) {
                            for (var i = 0; i < data.length; i++) {
                                if (data[i] === renderedRow) {
                                    return true;
                                }
                                if (data[i][alias]) {
                                    var found = checkChildrenDataForRecursive(data[i][alias], renderedRow, alias);
                                    if (found) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }

                    var checkDataForDeleteRow = function (data, renderedRows) {
                        if (!renderedRows) {
                            return;
                        }
                        var dataCount = data ? data.length : 0;
                        var checkRecursive = false;
                        var alias = undefined;
                        if ($scope.gridOptions.dataModel && $scope.gridOptions.dataModel.metadata && $scope.gridOptions.dataModel.metadata.transformRecursionToLinear && $scope.gridOptions.dataModel.keyMapping) {
                            checkRecursive = true;
                            alias = "children";
                            if ($scope.gridOptions.dataModel.query && $scope.gridOptions.dataModel.query.$recursion && $scope.gridOptions.dataModel.query.$recursion.$alias) {
                                alias = $scope.gridOptions.dataModel.query.$recursion.$alias;
                            }
                        }
                        for (var i = renderedRows.length - 1; i >= 0; i--) {
                            var rowInData = false;

                            if (checkRecursive) {
                                rowInData = checkChildrenDataForRecursive(data, renderedRows[i].entity, alias)
                            } else {
                                for (var j = 0; j < dataCount; j++) {
                                    if (renderedRows[i].entity === data[j]) {
                                        rowInData = true;
                                        break;
                                    }
                                }
                            }

                            if (!rowInData) {
//                                renderedRows.splice(i, 1);    // comment this line as we repopulateRenderedRows incase of delete.
                                return true;                    //return true and repopulateRenderedRows to keep dataModel index and dataRowIndex sync.
                            }
                        }
                    }

                    var checkDataForInsertRow = function (data, renderedRows) {
                        if (!data) {
                            return;
                        }
                        var dataRowIndex = undefined;
                        for (var i = 0; i < data.length; i++) {
                            var dataInRows = false;
                            for (var j = 0; j < renderedRows.length; j++) {
                                if (data[i] === renderedRows[j].entity) {
                                    dataInRows = true;
                                    break;
                                }
                            }
                            if (!dataInRows) {

                                if (data[i].__insert__) {
                                    renderedRows.splice(0, 0, {entity: data[i], editMode: true});
                                } else {
                                    renderedRows.push({entity: data[i]});
                                }
                            }
                        }
                    }

                    $scope.repopulateRenderedRows = function (data) {
                        try {
                            $scope.gridOptions.renderedRows = $scope.gridOptions.renderedRows || [];
                            var renderedRows = $scope.gridOptions.renderedRows;
                            var isRenderedRowRequired = checkDataForDeleteRow(data, renderedRows);
                            if (isRenderedRowRequired) {
                                $scope.populateRenderedRows(data);
                            } else {
                                checkDataForInsertRow(data, renderedRows);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    // it is used for showing columns in nested table on the basis of when value and value of gridOptions.reConfigureColumns is changed form pl-view.js
                    gridUnwatcher.reConfigureColumns = $scope.$watch("gridOptions.reConfigureColumns", function (newValue, oldValue) {
                        if (angular.isDefined(newValue)) {
                            $scope.populateColumns();
                        }
                    })

                    $scope.populateRenderedRows = function (data) {
                        try {
                            if ($scope.gridOptions.repopulateColumn) {
                                $scope.populateColumns();
                                $scope.gridOptions.repopulateColumn = false;
                            }
                            $scope.gridOptions.renderedRows = [];
                            var dataRowIndex = undefined;
                            if (data && data.length > 0) {
                                if ($scope.gridOptions.groupInfo && $scope.gridOptions.groupInfo.length > 0) {
                                    if (!angular.isDefined($scope.gridOptions.userPreferenceOptions.queryGroups)) {
                                        $scope.gridOptions.userPreferenceOptions.queryGroups = $scope.gridOptions.groupInfo[0];
                                    }
                                    $scope.groupTemplate(data, $scope.gridOptions.renderedRows, undefined);
                                } else {
                                    for (var i = 0; i < data.length; i++) {

                                        if (data[i].__insert__) {
                                            $scope.gridOptions.renderedRows.splice(0, 0, {entity: data[i], editMode: true});
                                        } else {
                                            $scope.gridOptions.renderedRows.push({entity: data[i], style: $scope.gridOptions.qViewStyle});
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.openRowActionPopUp = function ($event, row) {
                        try {
                            var optionsHtml = "<div class='app-max-height app-white-space-nowrap app-light-gray-backgroud-color' >" +
                                "   <div ng-repeat='rowAction in gridOptions.rowActions' >" +
                                "       <div ng-if='!rowAction.when' ng-bind='rowAction.label' class='app-row-action app-cursor-pointer app-padding-five-px' ng-click='rowActionOptionClick($index, rowAction)'></div>" +
                                "       <div ng-if='rowAction.when' ng-show='{{rowAction.when}} && {{!rowAction.hide}}' ng-bind='rowAction.label' class='app-row-action app-cursor-pointer app-padding-five-px' ng-click='rowActionOptionClick($index, rowAction)'></div>" +
                                "   </div>" +
                                "</div>";
                            var popupScope = $scope.$new();
                            popupScope.row = row;
                            var p = new Popup({
                                autoHide: true,
                                deffered: true,
                                escEnabled: true,
                                hideOnClick: true,
                                html: $compile(optionsHtml)(popupScope),
                                position: 'onPageClick',
                                scope: popupScope,
                                element: $event.target,
                                event: $event
                            });
                            p.showPopup();
                        } catch (err) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(err);
                            }
                        }
                    };

                    $scope.rowActionPopUp = function ($event, row) {
                        try {
                            if ($scope.gridOptions.resolveActionWithRow) {
                                row.loadingImage = true;
                                return $scope.resolveActions(row.entity, $scope.gridOptions.rowActions).then(function () {
                                    row.loadingImage = false;
                                    $scope.openRowActionPopUp($event, row);
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }).fail(function (err) {
                                    row.loadingImage = false;
                                    throw err;
                                })
                            } else {
                                $scope.openRowActionPopUp($event, row);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    };

                    $scope.multiRowActionPopUp = function ($event) {
                        try {
                            var optionsHtml = "<div class='app-max-height app-white-space-nowrap app-light-gray-backgroud-color' >" +
                                "<div ng-repeat='action in gridOptions.multiRowActions' class='app-row-action app-cursor-pointer' ng-show='{{action.when}}'>" +
                                "   <div ng-if='action.href' class='app-padding-five-px' ><a href='{{action.href}}' target='_blank' ng-bind='action.label' style='text-decoration: none; color: #58595b;'></a></div>" +
                                "   <div ng-if='!action.href' class='app-padding-five-px' ng-click='multiRowActionOptionClick($index, $event)' ng-bind='action.label'></div>" +
                                "</div>" +
                                "</div>";
                            var popupScope = $scope.$new();
                            var p = new Popup({
                                autoHide: true,
                                deffered: true,
                                escEnabled: true,
                                hideOnClick: true,
                                html: $compile(optionsHtml)(popupScope),
                                scope: popupScope,
                                element: $event.target
                            });
                            p.showPopup();
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.setEditMode = function (editMode) {
                        $scope.gridOptions.sharedOptions.saveOptions.editMode = editMode;
                    };
                    $scope.populateColumns = function () {
                        try {
                            var columns = $scope.gridOptions.columns;
                            var gridColumns = [];
                            var showSelectionCheckBox = $scope.gridOptions.showSelectionCheckbox;
                            //when groupby is applied to data than we don't populate row actions
//                            if ($scope.gridOptions.groupInfo && $scope.gridOptions.groupInfo.length > 0) {
//                                showSelectionCheckBox = false;
                            //                            }
                            if ($scope.gridOptions.checkboxSelection == false) {
                                showSelectionCheckBox = false;
                            }
                            if (($scope.gridOptions.groupInfo && $scope.gridOptions.groupInfo.length > 0) || ($scope.gridOptions.$recursion)) {
                                if ($scope.gridOptions.$recursion) {
//                                groupInfo.cellTemplate = '<div ng-click="toggleTreeForChild(row, $parent.$index)" ng-show="row.entity.children" ><div pl-grid-group class="icon-plus pl-group-toggle-box">&nbsp;</div></div>';
                                }
                                for (var i = 0; i < $scope.gridOptions.groupInfo.length; i++) {
                                    var groupInfo = {visibilityGrid: true, style: {width: "20px", height: "28px"}, __systemcolumn__: true};
                                    if (i == 0) {
                                        groupInfo.$group = true
                                    }
                                    gridColumns.push(groupInfo);
                                }
                            }
                            if (showSelectionCheckBox) {
                                var selectionCheckboxDef = {"style": {"width": "88px", height: "39px", padding: '3px 20px'}, __systemcolumn__: true};
                                var cellTemplate = "<div >" +
                                    "                  <div class='pl-row-action-wrapper'>";
                                if ($scope.gridOptions.multiRowActions) {
                                    cellTemplate += "<div class='pl-row-action-left'>" +
                                        "               <input class='app-margin-left-3px' tabindex='-1' type='checkbox' ng-model='row.__selected__' ";
                                    if ($scope.gridOptions.onSelectionChange) {
                                        cellTemplate += " ng-change='" + $scope.gridOptions.onSelectionChange + "(row)' ";
                                    }
                                    cellTemplate += " /></div>" +
                                        "                   <div ng-click='rowActionPopUp($event,row)' class='app-cursor-pointer pl-row-action-right'>" +
                                        "                       <i class='icon-caret-down'></i> " +
                                        '                       <img src="../images/loading.gif" class="pl-loading-image" style="height: 16px;width:16px;right:34px;" ng-show="row.loadingImage">' +
                                        "                   </div>";
                                    if ($scope.gridOptions.edit) {
                                        cellTemplate += "<div ng-click='editRowAction(row)' ng-class='{\"pl-box-shadow\":row.editMode == true}  ' class='app-cursor-pointer pl-edit-row'>" +
                                            "                <span class='edit-row-icon'></span>" +
                                            "            </div>";
                                    }
                                    cellTemplate += "</div>" +
                                        "           </div>" +
                                        "          </div>";
                                } else {
                                    cellTemplate += "<input style='margin-left:3px;' tabindex='-1' type='checkbox' ng-model='row.__selected__' ";
                                    if ($scope.gridOptions.onSelectionChange) {
                                        cellTemplate += " ng-change='" + $scope.gridOptions.onSelectionChange + "(row)' ";
                                    }
                                    cellTemplate += " /></div></div>";
                                }

                                selectionCheckboxDef.cellTemplate = cellTemplate;
                                selectionCheckboxDef.headerCellTemplate = "<div class='pl-grid-composite-header'>" +
                                    "                                       <div class='pl-grid-composite-container'>" +
                                    "                                           <div class='pl-grid-composite-header-left'><input tabindex='-1' type='checkbox' style=' margin: 7px 8px;' ng-model='gridOptions.__selected__' /></div>" +
                                    '                                           <div class="pl-grid-composite-header-middle" ng-click="multiRowActionPopUp($event)">' +
                                    '                                               <i class="icon-caret-down" style="height: 13px;"></i>' +
                                    '                                           </div>';
                                if ($scope.gridOptions.quickInsert) {
                                    selectionCheckboxDef.headerCellTemplate += "<div ng-click='insert($event, \"grid\")' title='Insert' class='pl-edit-row-header'>" +
                                        "                                          <span style='padding-left: 9px; display: block;'>" +
                                        "                                               <i class='icon-plus app-float-left' style='line-height: 28px'></i>" +
                                        "                                          </span>" +
                                        "                                      </div>";
                                }
                                selectionCheckboxDef.headerCellTemplate += "</div></div>";
                                gridColumns.push(selectionCheckboxDef);
                            }

                            if ($scope.gridOptions.rowDragable) {
                                var rowDragableDef = {__systemcolumn__: true};
                                rowDragableDef.style = {"width": "20px", height: "20px"};
                                rowDragableDef.dragRow = true;
                                rowDragableDef.cellTemplate = "<div class='pl-row-drag app-serial-number' ng-bind='$parent.$index+1'></div>";
                                gridColumns.push(rowDragableDef);
                            }

                            if ($scope.gridOptions.rowActions && $scope.gridOptions.rowActions.length > 0 && !$scope.gridOptions.multiRowActions) {
                                var rowActionDef = {__systemcolumn__: true};
                                rowActionDef.style = {"width": "20px", height: "20px"};
                                rowActionDef.cellTemplate = "<div style='width:20px;height:20px;' ng-click='rowActionPopUp($event,row)' class='app-row-action-arrow app-cursor-pointer'></div>";
                                gridColumns.push(rowActionDef);       //TODO: need to add this on conditional base
                            }
                            var colCount = columns ? columns.length : 0;


                            var autoWidthColumnEnabledAtFieldLevel = false;
                            for (var i = 0; i < colCount; i++) {
                                if (columns[i].autoWidthColumn) {
                                    delete columns[i].width;
                                    $scope.gridOptions.autoWidthColumn = autoWidthColumnEnabledAtFieldLevel = true;
                                }
                            }

                            var colCount = columns ? columns.length : 0;
                            if ($scope.gridOptions.autoWidthColumn) {
                                $scope.gridOptions.autoWidthColumn = false;
                                for (var i = 0; i < colCount; i++) {
                                    if (!columns[i].width || columns[i].width == 0 || columns[i].width == "0px" || columns[i].width == undefined || (columns[i].style && columns[i].style.width == undefined)) {
                                        delete columns[i].width;
                                        if (columns[i].style) {
                                            delete columns[i].style.width;
                                        }
                                        $scope.gridOptions.autoWidthColumn = true;
                                        break;
                                    }
                                }
                            }
                            for (var i = 0; i < colCount; i++) {
                                var column = columns[i];
                                if (column.visibilityGrid === false && column.visibility === false) {     //for handling of when condition
                                    continue;
                                }
                                if (column.when && column.when == 'false') {
                                    continue;
                                }
                                column.headerCellTemplate = column.headerCellTemplate || "<div ng-bind='col.label' title='{{col.label}}' class='text-overflow' ng-class='{\"app-margin-right-20px\":col.sortable}'></div>";
                                column.editableCellTemplate = column.editableCellTemplate || "<input ng-model='row." + column.field + "' type='text'/>";
                                column.style = column.style || {};
                                column.tabindex = 0;
                                column.style.width = column.style.width || column.width;
                                var autoWidthEnable = autoWidthColumnEnabledAtFieldLevel ? column.autoWidthColumn : $scope.gridOptions.autoWidthColumn;
                                if (autoWidthEnable) {
                                    column.style.flex = '1';
                                    column.flexible = true;
                                } else if (column.style.width == undefined) {
                                    column.style.width = "200px";
                                }
                                column.style['padding-left'] = '10px';
                                column.style['max-width'] = column.style.width;
                                column.style['min-width'] = column.style.width;
                                column.style['white-space'] = column.style.wordWrap ? column.style.wordWrap : column.wordWrap ? 'normal' : 'nowrap';
                                column.freeze = false;
                                if (column.freeze) {
                                    if (typeof column.style.width == 'string') {
                                        $scope.gridOptions.freezeStyle.width += parseInt(column.style.width.substr(0, column.style.width.length - 2)) + 11;
                                    } else {
                                        $scope.gridOptions.freezeStyle.width += column.style.width + 11;
                                    }
                                    $scope.gridOptions.freezeCol.push(column);
                                }
                                gridColumns.push(column);
                                if ($scope.gridOptions.sortInfo && $scope.gridOptions.sortInfo.length > 0) {
                                    for (var j = 0; j < $scope.gridOptions.sortInfo.length; j++) {
                                        var sortInfo = $scope.gridOptions.sortInfo[j];
                                        if (sortInfo.field === column.field) {
                                            column.value = sortInfo.value;
                                        }
                                    }
                                }
                            }
                            if ($scope.gridOptions.freezeCol) {
                                $scope.gridOptions.freezeHeaderStyle = {
                                    'width': $scope.gridOptions.freezeStyle.width + 'px'
                                }
                                $scope.gridOptions.freezeStyle.width += 5;
                                $scope.gridOptions.freezeStyle.width += 'px';
                            }
                            if (!$scope.gridOptions.autoWidthColumn) {
                                var zeroWidthColumn = {"tabindex": -1, style: {"padding": "0px", "border-right": "none"}, __systemcolumn__: true};
                                gridColumns.push(zeroWidthColumn);
                            }
                            $scope.gridOptions.gridColumns = gridColumns;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.populateToolbar = function () {

                        try {
                            $scope.toolBarOptions = {};

                            $scope.gridOptions.userPreferenceOptions = $scope.gridOptions.userPreferenceOptions || {};
                            $scope.gridOptions.userPreferenceOptions.reload = false;
                            if ($scope.gridOptions.filterColumns && $scope.gridOptions.filterColumns.length > 0) {
                                $scope.gridOptions.userPreferenceOptions.filterColumns = $scope.gridOptions.filterColumns;
                                $scope.gridOptions.userPreferenceOptions.filterInfo = $scope.gridOptions.filterInfo;
                            }

                            if ($scope.gridOptions.sortColumns && $scope.gridOptions.sortColumns.length > 0) {
                                $scope.gridOptions.userPreferenceOptions.sortColumns = $scope.gridOptions.sortColumns;
                                $scope.gridOptions.userPreferenceOptions.sortInfo = $scope.gridOptions.sortInfo;
                            }

                            if ($scope.gridOptions.groupColumns && $scope.gridOptions.groupColumns.length > 0) {
                                $scope.gridOptions.userPreferenceOptions.groupColumns = $scope.gridOptions.groupColumns;
                                $scope.gridOptions.userPreferenceOptions.aggregateColumns = $scope.gridOptions.aggregateColumns;
                                $scope.gridOptions.userPreferenceOptions.groupInfo = $scope.gridOptions.groupInfo;
                            }
                            if ($scope.gridOptions.recursiveColumns && $scope.gridOptions.recursiveColumns.length > 0) {
                                $scope.gridOptions.userPreferenceOptions.recursiveColumns = $scope.gridOptions.recursiveColumns;
                                $scope.gridOptions.userPreferenceOptions.recursionInfo = $scope.gridOptions.recursionInfo;
                            }

                            if ($scope.gridOptions.lastSelectedInfo) {
                                $scope.gridOptions.userPreferenceOptions.selectedType = $scope.gridOptions.lastSelectedInfo;
                            } else if ($scope.gridOptions.filterInfo && $scope.gridOptions.filterInfo.length > 0) {    // TODO: need to change with gridOptions
                                $scope.gridOptions.userPreferenceOptions.selectedType = "Filter";
                            } else if ($scope.gridOptions.sortInfo && $scope.gridOptions.sortInfo.length > 0) {
                                $scope.gridOptions.userPreferenceOptions.selectedType = 'Sort';
                            } else if ($scope.gridOptions.groupInfo && $scope.gridOptions.groupInfo.length > 0) {
                                $scope.gridOptions.userPreferenceOptions.selectedType = 'Group';
                            }


                            $scope.toolBarOptions.bottom = {left: [], center: [], right: []};
                            $scope.toolBarOptions.top = {left: [], center: [], right: []};
                            $scope.toolBarOptions.header = {left: {}, center: [], right: []};
                            var showResizeControl = $scope.gridOptions.viewResize !== undefined ? $scope.gridOptions.viewResize : true;

                            if (showResizeControl && $scope.gridOptions.parentSharedOptions) {
                                $scope.toolBarOptions.header.center.push({template: "<div ng-click=\"resize('left')\" ng-hide='gridOptions.sharedOptions.viewPosition == \"full\" || gridOptions.sharedOptions.resizable' ng-class='{\"pl-transform-180\":gridOptions.sharedOptions.viewPosition != \"right\"}' class=\"pl-resize-view app-cursor-pointer\"><i class=\"icon-double-angle-left\"></i></div>"});
                            }
                            if (!$scope.gridOptions.userPreferenceOptions.sortInfo && !$scope.gridOptions.userPreferenceOptions.filterInfo && !$scope.gridOptions.userPreferenceOptions.groupInfo) {
//                                $scope.gridOptions.addUserPreference = false;  /*dont set false as filter bar visible by default*/
                            }
                            if ($scope.gridOptions.addUserPreference) {
                                $scope.toolBarOptions.bottom.center.push({template: "<div ng-class='{\"pl-filter-background\":gridOptions.userPreferenceOptions.sortColumns || gridOptions.userPreferenceOptions.groupColumns  || gridOptions.userPreferenceOptions.filterColumns}' pl-user-preference='gridOptions.userPreferenceOptions'></div>"});
                            }

                            if ($scope.gridOptions.quickViewMenuGroup && $scope.gridOptions.quickViewMenuGroup.menus.length > 0) {
                                $scope.toolBarOptions.top.left.push({template: "<div pl-menu-group='gridOptions.quickViewMenuGroup' ></div>"});
                                $scope.toolBarOptions.header.left = $scope.gridOptions.quickViewMenuGroup;
                            }

                            if ($scope.gridOptions.showLabel) {
                                $scope.toolBarOptions.header.center.push({template: '<span ng-class=\'{"menu-align-margin":gridOptions.sharedOptions.viewPosition == \"full\" || gridOptions.sharedOptions.resizable}\' class="app-float-left pl-panel-label  app-padding-five-px app-font-size-sixteen-px app-font-weight-bold">' +
                                    '   <span  ng-bind="gridOptions.label"></span>' +
                                    '   <span ng-if="gridOptions.primaryFieldInfo && gridOptions.primaryFieldInfo.label">' +
                                    '       <span>(<span ng-bind="gridOptions.primaryFieldInfo.label"></span>)</span>' +
                                    '   </span>' +
                                    '</span>'});
                            }


                            if ($scope.gridOptions.ftsColumns && $scope.gridOptions.ftsColumns.length > 0) {
                                if ($scope.gridOptions.clientSearch) {
                                    $scope.gridOptions.clientSearchInfo = {};
                                }
                                $scope.gridOptions.ftsInfo = {columns: $scope.gridOptions.ftsColumns, onClick: "ftsSearch", clientSearchInfo: $scope.gridOptions.clientSearchInfo};
                                $scope.toolBarOptions.bottom.right.push({
                                    template: "<pl-fts data-info='gridOptions.ftsInfo' class='pl-sub-fts' ></pl-fts>"
                                });
                            }


                            $scope.saveCustomizationOptions = function ($event, template) {
                                try {
                                    if ($scope.gridOptions.admin) {
                                        var optionsHtml = "<div class='app-max-height app-white-space-nowrap app-light-gray-backgroud-color' >" +
                                            "               <div  class='app-row-action app-cursor-pointer pl-popup-label app-float-left' ng-click='saveAdminCustomization(\"view\")' >View</div>" +
                                            "               <div  class='app-row-action app-cursor-pointer pl-popup-label app-float-left' ng-click='saveAdminCustomization(\"qview\")' >Qview</div>" +
                                            "               <div  class='app-row-action app-cursor-pointer pl-popup-label app-float-left' ng-click='saveAdminCustomization(\"collection\")' >For all view</div>" +
                                            "               <div  class='app-row-action app-cursor-pointer pl-popup-label app-float-left' ng-click='saveCustomization()' >Self</div>" +
                                            "           </div>";
                                        var popupScope = $scope.$new();
                                        var p = new Popup({
                                            autoHide: true,
                                            deffered: true,
                                            escEnabled: true,
                                            hideOnClick: true,
                                            html: $compile(optionsHtml)(popupScope),
                                            scope: popupScope,
                                            element: $event.target
                                        });
                                        p.showPopup();
                                    } else {
                                        $scope.saveCustomization();
                                    }
                                } catch (e) {
                                    var title = "saveCustomization in pl.grid";
                                    var message = 'Error in plGrid saveCustomization >>>>' + e + '\n' + e.stack;
                                    $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
                                }
                            }


                            if ($scope.gridOptions.navigation && (!$scope.gridOptions.$recursion)) {
                                $scope.toolBarOptions.header.right.push({template: '<div class="flex-box app-font-weight-bold app-navigation app-text-align-center">' +
                                    '   <div class="app-height-thirty-px app-float-left app-width-twenty-px app-cursor-pointer" ng-click="previous()" ng-show="gridOptions.sharedOptions.pageOptions.hasPrevious"><i class="icon-chevron-left"></i></div>' +
                                    '<div ng-bind="gridOptions.sharedOptions.pageOptions.label" class="app-float-left"></div>' +
                                    '   <div ng-show="gridOptions.sharedOptions.pageOptions.fetchCount" class="app-float-left">{{"&nbsp;of&nbsp;"+gridOptions.sharedOptions.pageOptions.count}}</div>' +
                                    '   <div class="app-height-thirty-px app-float-left app-width-twenty-px app-cursor-pointer" ng-click="next()" ng-show="gridOptions.sharedOptions.pageOptions.hasNext" ><i class="icon-chevron-right"></i></div>' +
                                    '</div>'});
//                            $scope.toolBarOptions.header.left.lHeaderClass = 'flex-1';

                            }

                            if ($scope.gridOptions.insert) {
                                $scope.toolBarOptions.top.right.push({template: '<div  ng-click="insert()" ng-show="!gridOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="btn-blue app-cursor-pointer responsive">Create</div>'});
                                $scope.toolBarOptions.header.right.push({template: '<div  ng-click="insert()" ng-show="!gridOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="btn-blue app-cursor-pointer">Create</div>'});
                            }

                            if ($scope.gridOptions.save) {
                                $scope.toolBarOptions.top.right.push({template: '<div ng-click="refresh()" ng-show="gridOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="pl-cancel-btn app-cursor-pointer ng-scope responsive">Cancel</div>'});
                                $scope.toolBarOptions.top.right.push({template: '<div ng-click="save()" ng-show="gridOptions.save && gridOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="btn-blue app-cursor-pointer responsive">Save</div>'});
                                $scope.toolBarOptions.header.right.push({template: '<div ng-click="refresh()" ng-show="gridOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="pl-cancel-btn app-cursor-pointer ng-scope">Cancel</div>'});
                                $scope.toolBarOptions.header.right.push({template: '<div ng-click="save()" ng-show="gridOptions.save && gridOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="btn-blue app-cursor-pointer">Save</div>'});
                            }

                            $scope.gridOptions.multiRowActions = [];
                            if ($scope.gridOptions.delete) {
//                            $scope.gridOptions.rowActions.push({label:"Delete", title:"Delete", type:'delete', rowActionIndex:$scope.gridOptions.rowActions.length});
                                $scope.gridOptions.multiRowActions.push({label: "Delete", title: "Delete", onClick: 'delete', when: true});
                            }

                            if ($scope.gridOptions.refresh) {
                                $scope.toolBarOptions.top.right.push({label: "Refresh", title: "Refresh", onClick: 'refresh()', image: '', actionClass: 'app-refresh-button app-bar-button'});
                            }


                            if ($scope.gridOptions.updateColumns && $scope.gridOptions.updateColumns.length > 0) {
//                            $scope.gridOptions.rowActions.push({label:"Update", title:"Update", type:'update', rowActionIndex:$scope.gridOptions.rowActions.length});
                                $scope.gridOptions.multiRowActions.push({label: "Update", title: "Update", onClick: 'update', when: true});
                            }

                            if ($scope.gridOptions.headerActions && $scope.gridOptions.headerActions.length > 0) {
                                for (var i = 0; i < $scope.gridOptions.headerActions.length; i++) {
//                                $scope.gridOptions.rowActions.push($scope.gridOptions.headerActions[i]);
//                                $scope.gridOptions.rowActions[$scope.gridOptions.rowActions.length - 1].rowActionIndex = $scope.gridOptions.rowActions.length;
                                    $scope.gridOptions.multiRowActions.push($scope.gridOptions.headerActions[i]);
                                }
                            }
//                        if ($scope.gridOptions.setFieldsVisibility && $scope.gridOptions.setFieldsVisibilityOptions) {
//                            var template = "<div pl-menu-group='gridOptions.setFieldsVisibilityOptions' ></div>";
//                            $scope.toolBarOptions.bottom.right.push({template:template});
//                        }

//                        if ($scope.gridOptions.ftsColumns && $scope.gridOptions.ftsColumns.length > 0) {
//                            $scope.gridOptions.ftsInfo = {columns:$scope.gridOptions.ftsColumns, onClick:"ftsSearch"};
//                            $scope.toolBarOptions.bottom.right.push({
//                                template:"<pl-fts data-info='gridOptions.ftsInfo' ></pl-fts>"
//                            });
//                        }

                            if ($scope.gridOptions.toolbarActions) {
                                var template = "<div pl-menu-group='gridOptions.toolbarActions' ></div>";
                                $scope.toolBarOptions.header.right.push({template: template});
                                var template = "<div ng-repeat='action in gridOptions.toolbarActions' class='inline' ng-click='viewHeaderAction(action)' >" +
                                    "               <span ng-if='!action.showLabel' ng-show='{{action.when}}' ng-class='action.class' class='inline' title='{{action.label}}' ></span>" +
                                    "               <span ng-if='action.showLabel' ng-show='{{action.when}}' class='pl-cancel-btn tlbr-action-label text-overflow' title='{{action.label}}' ng-bind='action.label'></span>" +
                                    "           </div>";
                                $scope.toolBarOptions.bottom.right.push({template: template});
                            }
                            if ($scope.gridOptions.saveCustomization) {
                                $scope.toolBarOptions.bottom.right.push({template: '<div title="Save Customization" ng-show="gridOptions.sharedOptions.saveCustomizationEnable" class="app-cursor-pointer pl-letter-spacing flex samll-gap">' +
                                    '<span ng-click="saveCustomizationOptions($event)" class="pl-header-actions save-icon"></span>' +
                                    '</span>' +
                                    '</div>'});
                                if ($scope.gridOptions.fieldCustomization) {
                                    $scope.toolBarOptions.bottom.right.push({template: "<div title='Show/hide columns' class='manage-cols app-float-right' ng-click='showColumns($event)'><i class='dot'></i><i class='dot'></i><i class='dot'></i></div>"});
                                }
                            }

                            if ($scope.gridOptions.viewControl && $scope.gridOptions.viewControlOptions) {
                                var template = "<div pl-menu-group='gridOptions.viewControlOptions' ></div>";
                                $scope.toolBarOptions.header.center.push({template: template});
                            }
                            if ($scope.gridOptions.popupResize) {
                                $scope.popupResize();
//                            $scope.toolBarOptions.header.right.push({template:'<div  ng-click="popupResize()" pl-toggle title="Resize" ng-show="!gridOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="btn-blue app-cursor-pointer popup-resize"></div>'});
                            }
                            if ($scope.gridOptions.close) {
                                $scope.toolBarOptions.top.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text" ng-click="close()"><i class="icon-remove"></i></div>'});
                                $scope.toolBarOptions.header.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text" ng-click="close()"><i class="icon-remove"></i></div>'});
                            }
                            if (showResizeControl) {
                                $scope.toolBarOptions.header.right.push({template: "<div ng-click=\"resize('right')\" pl-resize  ng-show=\"gridOptions.sharedOptions.resizable\" class=\"pl-resize-view app-cursor-pointer\"><i class=\"icon-double-angle-right\"></i></div>"});
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.populateHeader = function () {
                        try {
                            var isFieldGroup = false;
                            for (var i = 0; i < $scope.gridOptions.gridColumns.length; i++) {
                                if ($scope.gridOptions.gridColumns[i].fieldGroup) {
                                    isFieldGroup = true;
                                    break;
                                }
                            }
                            if (!isFieldGroup) {
                                return;
                            }
                            $scope.gridOptions.headerColumns = [];                                                          // to contains top headers in grid column header
                            $scope.gridOptions.subHeaderColumns = [];                                                       // to contains sub-headers in grid column header
                            for (var i = 0; i < $scope.gridOptions.gridColumns.length; i++) {
                                var cloneColumn = angular.copy($scope.gridOptions.gridColumns[i]);
                                cloneColumn.colIndex = i;
                                if ($scope.gridOptions.gridColumns[i].fieldGroup) {
                                    var headerColumn = undefined;
                                    for (var j = 0; j < $scope.gridOptions.headerColumns.length; j++) {
                                        if (($scope.gridOptions.gridColumns[i].fieldGroup == $scope.gridOptions.headerColumns[j].label) && ($scope.gridOptions.headerColumns[j].headerColumn)) {
                                            headerColumn = $scope.gridOptions.headerColumns[j];
                                            break;
                                        }
                                    }
                                    if (headerColumn === undefined) {
                                        headerColumn = {};
                                        headerColumn.headerColumn = true;
                                        headerColumn.label = cloneColumn.fieldGroup;
                                        headerColumn.rowSpan = 1;
                                        headerColumn.colSpan = 0;
                                        headerColumn.headerCellTemplate = cloneColumn.headerCellTemplate;
                                        headerColumn.style = angular.copy(cloneColumn.style) || {};
                                        headerColumn.style.width = "0px";
                                        headerColumn.style.margin = "0px auto";
                                        headerColumn.subColumns = [];
                                        headerColumn.width = "0px";
                                        $scope.gridOptions.headerColumns.push(headerColumn);

                                    }
                                    headerColumn.subColumns.push(cloneColumn);
                                    headerColumn.colSpan++;
                                    if (headerColumn.style.width && cloneColumn.style && cloneColumn.style.width) {
                                        var preWidth = parseInt(headerColumn.style.width.substr(0, headerColumn.style.width.length - 2));
                                        var curWidth = parseInt(cloneColumn.style.width.substr(0, cloneColumn.style.width.length - 2));
                                        curWidth += preWidth;
                                        if (preWidth != 0) {
                                            curWidth += 11;
                                        }
                                        headerColumn.style.width = curWidth + "px";
                                    }

                                } else {
                                    cloneColumn.rowSpan = 2;
                                    cloneColumn.colSpan = 1;
                                    $scope.gridOptions.headerColumns.push(cloneColumn);
                                }

                            }
                            var newGridColumns = [];                                                                        // to maintain the order of gridColumns with fieldGroup headers
                            for (var i = 0; i < $scope.gridOptions.headerColumns.length; i++) {
                                if ($scope.gridOptions.headerColumns[i].subColumns) {
                                    for (var j = 0; j < $scope.gridOptions.headerColumns[i].subColumns.length; j++) {
                                        if ($scope.gridOptions.headerColumns[i].style) {
                                            var headerColWidth = parseInt($scope.gridOptions.headerColumns[i].style.width.substr(0, $scope.gridOptions.headerColumns[i].style.width.length - 2));
                                            headerColWidth += 16;
                                        }
                                        var totalChildCol = $scope.gridOptions.headerColumns[i].subColumns.length;
                                        var childWidth = Math.round(headerColWidth / totalChildCol) - 16;
                                        if (totalChildCol > 1 && totalChildCol < 3) {
                                            childWidth -= 1;     // NOTE: as every cell contains its own padding, so we have to align it to its parent field group
                                        } else if (totalChildCol >= 3) {
                                            childWidth -= 2;     // NOTE: as every cell contains its own padding, so we have to align it to its parent field group
                                        }
                                        $scope.gridOptions.gridColumns[$scope.gridOptions.headerColumns[i].subColumns[j].colIndex].width = childWidth + 'px';
                                        $scope.gridOptions.gridColumns[$scope.gridOptions.headerColumns[i].subColumns[j].colIndex].style = $scope.gridOptions.gridColumns[$scope.gridOptions.headerColumns[i].subColumns[j].colIndex].style || {};
                                        $scope.gridOptions.gridColumns[$scope.gridOptions.headerColumns[i].subColumns[j].colIndex].style.width = childWidth + 'px';
                                        $scope.gridOptions.headerColumns[i].subColumns[j].style = $scope.gridOptions.headerColumns[i].subColumns[j].style || {};
                                        $scope.gridOptions.headerColumns[i].subColumns[j].style.width = childWidth + 'px';
                                        $scope.gridOptions.subHeaderColumns.push($scope.gridOptions.headerColumns[i].subColumns[j]);
                                        newGridColumns.push($scope.gridOptions.gridColumns[$scope.gridOptions.headerColumns[i].subColumns[j].colIndex]);
                                    }
                                } else {
                                    newGridColumns.push($scope.gridOptions.gridColumns[$scope.gridOptions.headerColumns[i].colIndex]);
                                }
                            }
                            $scope.gridOptions.gridColumns = newGridColumns;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }


                    $scope.getCellTemplate = function (field) {
                        if ($scope.gridOptions.columns && $scope.gridOptions.columns.length > 0) {
                            for (var i = 0; i < $scope.gridOptions.columns.length; i++) {
                                if ($scope.gridOptions.columns[i].field == field) {
                                    return $scope.gridOptions.columns[i].cellTemplate;
                                }

                            }
                        }
                    }
                    $scope.getCurrentHeaderCell = function () {
                        return $scope.headerCell;
                    };
                    $scope.rowReOrdering = function (srcIndex, targetIndex) {
                        try {
                            var srcRow = $scope.gridOptions.renderedRows[srcIndex];
                            var targetRow = $scope.gridOptions.renderedRows[targetIndex];

                            var srcRowIndex = srcRow[$scope.gridOptions.sequenceField];
                            var targetRowIndex = targetRow[$scope.gridOptions.sequenceField];
                            if (srcRowIndex > targetRowIndex) {
                                var preTargetRow = $scope.gridOptions.gridColumns[targetIndex - 1];
                                if (angular.isUndefined(preTargetRow[$scope.gridOptions.sequenceField])) {
                                    srcRowIndex = (targetRowIndex - INDEX_OFFSET);
                                } else {
                                    var preTargetRowIndex = preTargetRow[$scope.gridOptions.sequenceField] || 0;
                                    srcRowIndex = (preTargetRowIndex + targetRowIndex ) / 2;
                                }
                            } else if (srcRowIndex < targetRowIndex) {
                                var nextTargetRow = $scope.gridOptions.gridColumns[targetIndex + 1];
                                if (angular.isUndefined(nextTargetRow[$scope.gridOptions.sequenceField])) {
                                    srcRowIndex = (targetRowIndex + INDEX_OFFSET);
                                } else {
                                    var nextTargetRowIndex = nextTargetRow[$scope.gridOptions.sequenceField] || 0;
                                    srcRowIndex = (nextTargetRowIndex + targetRowIndex ) / 2;
                                }
                            }
                            for (var i = 0; i < $scope.gridOptions.renderedRows.length; i++) {
                                var row = $scope.gridOptions.renderedRows[i];
                                if (row.entity._id == srcRow.entity._id) {
                                    row[$scope.gridOptions.sequenceField] = srcRowIndex;
                                    break;
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    };
                    $scope.setCurrentHeaderCell = function (headerCell) {
                        $scope.headerCell = headerCell;
                    };
                    $scope.setRowDragable = function (rowFlag) {
                        $scope.isRowDragable = rowFlag;
                    }
                    $scope.setSrcRowIndex = function (index) {
                        $scope.srcRowIndex = index;
                    };
                    $scope.setCurrentRow = function (entity) {
                        try {
                            var dataRowIndex = $scope.getDataMappingKey(entity, $scope.gridOptions.dataModel);
                            $scope.gridOptions.currentRow = entity;
                            $scope.gridOptions.sharedOptions.currentRow = entity;
                            $scope.gridOptions.sharedOptions.currentRowIndex = dataRowIndex;
                            $scope.gridOptions.sharedOptions.currentRowChanged = !$scope.gridOptions.sharedOptions.currentRowChanged;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    var addChildrenToRenderRow = function (index, childrens, parentLevel) {
                        var renderedRows = [];
                        if (childrens && childrens.length > 0) {
                            $scope.groupTemplate(childrens, renderedRows, parentLevel);
                        }
                        if (renderedRows && renderedRows.length > 0) {
                            for (var i = renderedRows.length - 1; i >= 0; i--) {
                                if ($scope.gridOptions.qViewStyle) {
                                    renderedRows[i].style = $scope.gridOptions.qViewStyle;
                                }
                                $scope.gridOptions.renderedRows.splice(index + 1, 0, renderedRows[i]);
                            }
                        }
                    }

                    $scope.toggleTree = function (row, index, parentLevel) {
                        try {
                            var childrens = row.entity.children;
                            if (row.__hidden__) {
                                addChildrenToRenderRow(index, childrens, parentLevel);
                            } else {
                                var data = $scope.gridOptions.renderedRows;
                                var curGroup = data[index].__group__;
                                var targetIndex = undefined;
                                for (var i = index + 1; i < data.length; i++) {
                                    if (curGroup >= data[i].__group__) {
                                        break;
                                    }
                                    targetIndex = i;
                                }
                                if (targetIndex && targetIndex > 0) {
                                    $scope.gridOptions.renderedRows.splice(index + 1, targetIndex - index);
                                }
                            }
                            row.__hidden__ = !row.__hidden__;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    };

                    $scope.toggleTreeForChild = function (row, index) {
                        try {
                            var childrens = row.entity.children;
                            if (!row.__hidden__) {
                                var parentLevel = undefined;
                                if ($scope.gridOptions.$recursion && $scope.gridOptions.$recursion.$primaryColumn) {
                                    parentLevel = row.level || 0;
                                }
                                addChildrenToRenderRow(index, childrens, parentLevel);
                            } else {
                                var data = $scope.gridOptions.renderedRows;
                                var curGroup = data[index].__group__;
                                var targetIndex = undefined;
                                if (row.entity.children && row.entity.children.length > 0) {
                                    var childToRemove = 0;
                                    for (var i = index + 1; i < data.length; i++) {
                                        var rowLevel = row.level || 0;
                                        if (rowLevel < data[i].level) {
                                            childToRemove++;
                                            continue;
                                        }
                                        break;
                                    }
                                    $scope.gridOptions.renderedRows.splice(index + 1, childToRemove);
                                }

                            }
                            row.__hidden__ = !row.__hidden__;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $timeout(function () {
                        // to open first level children in recusrion view
                        if ($scope.gridOptions && (!$scope.gridOptions.childrenAutoExpanded) && $scope.gridOptions.$recursion && $scope.gridOptions.$recursion.$expandLevel && $scope.gridOptions.renderedRows.length > 0) {
                            $scope.toggleTreeForChild($scope.gridOptions.renderedRows[0], 0);   // to open first level children in recursion view
                            $scope.gridOptions.childrenAutoExpanded = true;
                        }
                    }, 0);

                    $scope.watchData = function () {
                        try {
                            // watch view data  is set when dealing with cross tab view
                            if ($scope.gridOptions.watchViewData) {
                                gridUnwatcher.parentViewDataChanged = $scope.$parent.$watch("viewDataChanged", function (value) {
                                    if (angular.isDefined(value)) {
                                        if ($scope.gridOptions.repopulateColumn) {
                                            $scope.populateColumns();
                                            $scope.gridOptions.repopulateColumn = false;
                                        }
                                        $scope.repopulateRenderedRows($scope.viewData);
                                    }
                                });
                            } else {
                                $scope.populateRenderedRows(data);
                                gridUnwatcher.deepGridOptionsData = $scope.$parent.$watch($scope.gridOptions.data, dataWatcher, true);
                                gridUnwatcher.gridOptionsData = $scope.$parent.$watch($scope.gridOptions.data, dataWatcher);                                        // we need to add two data watcher due to references issues has been found during  insert/delete/update in $scope.gridOptions.data
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    try {
                        gridUnwatcher.insertFromPanel = $scope.$watch("gridOptions.sharedOptions.insertFromPanel", function (newValue, oldValue) {
                            if (!angular.equals(newValue, oldValue)) {
                                $scope.insert(undefined, 'nestedForm');
                            }
                        }, true);
                        gridUnwatcher.userPreferenceOptionsReload = $scope.$watch("gridOptions.userPreferenceOptions.reload", function (newValue, oldValue) {
                            if (!angular.equals(newValue, oldValue) && angular.isDefined(oldValue)) {
                                $scope.populateUserPreferene($scope.gridOptions.userPreferenceOptions, true);

                            }
                        });
                        gridUnwatcher.parentUserPreferenceOptionsReload = $scope.$watch("gridOptions.parentSharedOptions.userPreferenceOptions.reload", function (newValue, oldValue) {
                            if (!angular.equals(newValue, oldValue) && angular.isDefined(newValue)) {
                                $scope.populateUserPreferene($scope.gridOptions.parentSharedOptions.userPreferenceOptions, false);
                            }
                        });
                        gridUnwatcher.currentRowChanged = $scope.$watch("gridOptions.currentRowChanged", function (newValue, oldValue) {
                            if (angular.isDefined(newValue)) {
//                                var renderedRows = $scope.gridOptions.renderedRows || [];
//                                var renderedRow = undefined;
//                                var dataRowIndex = undefined;
//                                for (var i = 0; i < renderedRows.length; i++) {
//                                    dataRowIndex = $scope.getDataMappingKey(renderedRows[i], $scope.gridOptions.dataModel);
//                                    if (dataRowIndex === $scope.gridOptions.currentRow) {
//                                        renderedRow = renderedRows[i];
//                                        break;
//                                    }
//                                }
                                $scope.setCurrentRow($scope.gridOptions.currentRow);
                            }

                        });
                        gridUnwatcher.__selected__ = $scope.$watch("gridOptions.__selected__", function (newSelectedValue, oldSelectedValue) {
                            if (!angular.equals(newSelectedValue, oldSelectedValue)) {
                                for (var i = 0; i < $scope.gridOptions.renderedRows.length; i++) {
                                    $scope.gridOptions.renderedRows[i].__selected__ = newSelectedValue;
                                    if (angular.isDefined($scope.gridOptions.onSelectionChange)) {
                                        $scope[$scope.gridOptions.onSelectionChange]($scope.gridOptions.renderedRows[i]);
                                    }
                                }
                                if ($scope.gridOptions.sharedOptions && $scope.gridOptions.sharedOptions.pageOptions && $scope.gridOptions.sharedOptions.pageOptions.hasNext && $scope.gridOptions.sharedOptions.pageOptions.count) {
                                    $scope.gridOptions.sharedOptions.pageOptions.pageSelected = newSelectedValue;
                                    if (!$scope.gridOptions.sharedOptions.pageSelected) {
                                        $scope.gridOptions.sharedOptions.pageOptions.allRowSeleceted = false;
                                    }
                                }
                            }
                        });

                        $scope.gridOptions.sharedOptions = $scope.gridOptions.sharedOptions || {};
                        $scope.gridOptions.activeCellOptions = {};
                        $scope.gridOptions.resizeEnable = undefined;
                        $scope.gridOptions.leftDownKeyPress = undefined;
                        $scope.populateToolbar();
                        $scope.populateColumns();
                        $scope.countWatch = 0;

                        var toolBarTemplate = "<div style='overflow: hidden;display: table-row;'>" +
                            "                       <div style='position: relative;width: 100%;'>" +
                            "                       <div class='pl-row-drag-wrapper' ng-show='gridOptions.rowDragging' ng-bind='gridOptions.rowDraggingLabel'></div>" +
                            "                           <div class='pl-header-toolbar' >" +
                            "                               <pl-tool-bar-header></pl-tool-bar-header>" +
                            "                           </div>" +
                            "                           <div class='pl-toolbar' pl-tool-bar></div>" +
                            "                           <div class='app-text-align-center pl-clear light-theme app-color-black msg-row' ng-show='gridOptions.sharedOptions.pageOptions.pageSelected'>" +
                            "                               <span ng-if='!gridOptions.sharedOptions.pageOptions.allRowSeleceted'>" +
                            "                                   <span>All <b ng-bind='gridOptions.sharedOptions.pageOptions.endCursor'></b> records on this page are selected. </span>" +
                            "                                   <u class='app-cursor-pointer' ng-click='gridOptions.sharedOptions.pageOptions.allRowSeleceted = true;'>Select all <b ng-bind='gridOptions.sharedOptions.pageOptions.count | number'></b> records in {{gridOptions.label}}</u>" +
                            "                               </span>" +
                            "                               <span ng-if='gridOptions.sharedOptions.pageOptions.allRowSeleceted'>" +
                            "                                   All <b ng-bind='gridOptions.sharedOptions.pageOptions.count | number'></b> records in {{gridOptions.label}} are selected. <u class='app-cursor-pointer' ng-click='gridOptions.__selected__ = false;'>Clear selection</u>" +
                            "                               </span>" +
                            "                           </div>" +
                            "                       </div>" +
                            "                  </div>";
                        var template = '';
                        var data = $scope.$eval($scope.gridOptions.data);
                        if ($scope.gridOptions.aggregateData) {
                            var aggData = $scope.$eval($scope.gridOptions.aggregateData);
                            if (aggData) {
                                $scope.gridOptions.aggregateRenderedData = {entity: aggData, aggregateRow: true};
                            }
                        }
                        $scope.populateHeader();                                                                            // method to populate headerColumns in composite view if any fieldGroup found
                        if ($scope.gridOptions.headerFreeze) {
                            template = "<div class='app-grid'>" +
                                "               <div class='app-container'>" +
                                "                   <div class='app-wrapper'>" +
                                "                       <div class='app-wrapper-child'>" +
                                "                           <div style='display: table;table-layout:fixed;width: 100%;height: 100%;'>";

                            if ($scope.gridOptions.headerTemplate) {
                                template += $scope.gridOptions.headerTemplate;
                            }
                            if ($scope.gridOptions.toolbar) {
                                template += toolBarTemplate;
                            }

                            template += "                               <div style='overflow: hidden;display: table-row;'>" +
                                "                                   <div style='position: relative;width: 100%;'>";
                            if ($scope.gridOptions.freezeCol) {
                                template += "<div class='pl-freeze-header-area' ng-style='gridOptions.freezeHeaderStyle' ng-class='{\"pl-composite-header-height\":gridOptions.headerColumns}' pl-Freeze-header></div>";
                            }
                            template += "                                       <div style='overflow-x: hidden;left: 0px;right: 0px;' pl-grid-header></div>" +
                                "                                           </div>" +
                                "                                   </div>" +

                                "                              <div  style='display: table-row;height: 100%;'>" +
                                "                                  <div style='position: relative;height: 100%;'>" +
                                "                                       <div pl-grid-body class='grid-scroll pl-grid-body main-grid'></div>";

                            if ($scope.gridOptions.freezeCol) {
                                template += "<div pl-Freeze-column></div>";
                            }
                            template += "                                   </div>" +
                                "                              </div>" +

                                "                            </div>" +
                                "                         </div>" +
                                "                      </div>" +
                                "                   </div>" +
                                "             </div>";
                        } else {
                            template = "<div style='display: table;table-layout:fixed;width: 100%;height: 100%;'>";
                            if ($scope.gridOptions.headerTemplate) {
                                template += $scope.gridOptions.headerTemplate;
                            }
                            if ($scope.gridOptions.toolbar) {
                                template += toolBarTemplate;
                            }

                            template += "       <div style='display: table-row;height: 100%;'>" +
                                "           <div style='position: relative;height: 100%;'>";
                            if ($scope.gridOptions.freezeCol) {
                                template += "<pl-nested-freeze-grid></pl-nested-freeze-grid>";
                            }

                            template += "               <div style='  left: 0;overflow: auto;right: 0;top: 0;' class='main-grid' pl-handle-scroll >" +
                                "                   <table class='app-width-full' cellpadding='0' cellspacing='0'>" +
                                "                       <thead class='pl-static-col applane-grid-header' >" +
                                "                           <th pl-grid-header-cell ng-repeat='col in gridOptions.gridColumns' ng-style='col.style' ></th>" +
                                "                       </thead>" +
                                "                       <tbody class='applane-grid-body'>" +
                                "                           <tr ng-repeat='row in gridOptions.renderedRows'>" +
                                "                               <td class='pl-static-col applane-grid-cell' ng-repeat='col in gridOptions.gridColumns' pl-grid-cell tabindex='{{col.tabindex}}' ng-style='col.style' ng-click='changeCurrentRow(row,$parent.$index)'></td>" +
                                "                               <td class='pl-responsive-col' >" +
                                "                                    <a ng-click='changeCurrentRow(row, $index); rowActionPopUp($event,row)' ng-class='{\"row-sptr\":!gridOptions.responsiveColumns}' class='pl-responsive-link  flex flex-1'>" +
                                "                                       <pl-responsive-cell></pl-responsive-cell>" +
                                "                                    </a>" +
                                "                               </td>" +
                                "                           </tr>";
                            if ($scope.gridOptions.aggregateRenderedData) {
                                template += "<tr ng-init='row=gridOptions.aggregateRenderedData' >" +
                                    "<td pl-grid-footer-cell class='pl-static-col applane-grid-cell' style='border-right: none;' ng-repeat='col in gridOptions.gridColumns'  ng-style='col.style' tabindex='{{col.tabindex}}' ng-click='changeCurrentRow(row, $parent.$index)'>" +
                                    "</td>" +
                                    "</tr>";
                            }
                            template += "                       </tbody>" +
                                "                   </table>" +
                                "               </div>" +
                                "           </div>" +
                                "       </div>" +
                                "</div>";

                        }

                        template += "<div id='{{gridOptions.uniqueViewId}}-rowDrag' class='pl-row-drag-popup app-display-none' ></div>";

                        if ($scope.gridOptions.parentSharedOptions) {
                            $scope.gridOptions.parentSharedOptions.resizable = true;
                        }
                        $scope.watchData();

                        $scope.changeFilter = function (row, renderedRowIndex) { //these is for applying filter to other dashboard view on click of row of one dashboard view---case on click of project dashboard,task should change--Ritesh Bansal
                            if (row && row.entity) {
                                $scope.gridOptions.selectedValue = row.entity._id;
                            }
                            $scope.gridOptions.sharedOptions.onRecursiveIconClick = false;
                            $scope.changeCurrentRow(row, renderedRowIndex);
                        };
                        $scope.changeRecursiveFilter = function (row, renderedRowIndex) {//these is for applying recursive filter to other dashboard view on click of row of one dashboard view---case on click of project dashboard,task should change--Ritesh Bansal
                            $scope.gridOptions.selectedValue = row.entity._id;
                            $scope.gridOptions.sharedOptions.onRecursiveIconClick = true;
                            $scope.changeCurrentRow(row, renderedRowIndex);
                        };

                        $scope.openSelectedRecordHierarchy = function (record, level) {
                            $scope.toggleTreeForChild($scope.gridOptions.renderedRows[level], level);
                            if (record.children && record.children.level != undefined) {
                                $scope.openSelectedRecordHierarchy(record.children, (level + 1 + record.children.level));
                            }
                        };

                        $scope.getSelectedRecord = function (data, id, alias) {
                            if (!data || data.length === 0) {
                                return;
                            }
                            for (var i = 0; i < data.length; i++) {
                                var record = data[i];
                                if (Utility.deepEqual(record._id, id)) {
                                    return {record: record};
                                }
                                if (record[alias] && record[alias].length > 0) {
                                    var innerRecord = $scope.getSelectedRecord(record[alias], id, alias);
                                    if (innerRecord && innerRecord.record) {
                                        var hierarchyLevel = {level: i};
                                        if (innerRecord.hierarchyLevel) {
                                            hierarchyLevel.children = innerRecord.hierarchyLevel;
                                        }
                                        return {record: innerRecord.record, hierarchyLevel: hierarchyLevel};
                                    }
                                }
                            }
                        };

                        if ($scope.gridOptions.provideParentParameter) {//this work is done for selecting first record of left dashboard view as filter for second dashboard view---case for notifying other dashboard view on click of one dashboard view--Ritesh Bansal
                            var selectedRecord = {entity: data[0]};
                            if ($scope.gridOptions.$parameters && $scope.gridOptions.$parameters[$scope.gridOptions.provideParentParameter]) {
                                var alias = ($scope.gridOptions.$recursion && $scope.gridOptions.$recursion.$alias) ? $scope.gridOptions.$recursion.$alias : "children";
                                var id = $scope.gridOptions.$parameters[$scope.gridOptions.provideParentParameter];
                                var recordWithLevel = $scope.getSelectedRecord(data, id, alias);
                                var record = recordWithLevel ? recordWithLevel.record : undefined;
                                var openHierarchyLevel = recordWithLevel ? recordWithLevel.hierarchyLevel : undefined;
                                if (record) {
                                    selectedRecord.entity = record;
                                }
                                $timeout(function () {
                                    if (openHierarchyLevel && openHierarchyLevel.level) {
                                        $scope.openSelectedRecordHierarchy(openHierarchyLevel, openHierarchyLevel.level);
                                    }
                                }, 0);
                            }
                            $scope.changeFilter(selectedRecord, 0);
                        }
                        iElement.append(($compile)(template)($scope));
                        $scope.$on('$destroy', function () {
                            if (gridUnwatcher) {
                                for (var key in gridUnwatcher) {
                                    gridUnwatcher[key]();
                                }
                            }
                        });
                    }
                    catch (e) {
                        if ($scope.handleClientError) {
                            $scope.handleClientError(e);
                        }
                    }
                },
                post: function ($scope, iElement) {

                }
            }
        }
    };
}]);

pl.directive('plHandleScroll', [function () {
    return{
        restrict: 'A',
        link: function ($scope, iElement) {
            $scope.$watch('gridOptions.bodyScrollLeft', function () {
                $(iElement).scrollLeft($scope.gridOptions.bodyScrollLeft);
            });
        }
    }
}]);

pl.directive('plNestedFreezeGrid', ['$compile', function ($compile) {
    return{
        restrict: 'EAC',
        scope: false,
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    var template = "<div class='pl-nested-freeze-area'>" +
                        "           <table class='app-width-full' style='box-shadow: 0px 0px 5px #ddd;' cellpadding='0' cellspacing='0'>" +
                        "                       <thead class='applane-grid-header' >" +
                        "                           <th style='border-right: 1px solid #ddd;' pl-grid-header-cell ng-repeat='col in gridOptions.freezeCol' ng-style='col.style' ></th>" +
                        "                       </thead>" +
                        "                       <tbody class='applane-grid-body'>" +
                        "                           <tr ng-repeat='row in gridOptions.renderedRows'>" +
                        "                               <td class='applane-grid-cell' ng-repeat='col in gridOptions.freezeCol' pl-grid-cell tabindex='{{col.tabindex}}' ng-style='col.style' ng-click='changeCurrentRow(row, $parent.$index)'></td>" +
                        "                               <td class='pl-responsive-col' > <a ng-click='changeCurrentRow(row, $index); rowActionPopUp($event,row)' ng-class='{\"row-sptr\":!gridOptions.responsiveColumns}' class='pl-responsive-link flex flex-1'><pl-responsive-cell class='flex flex-1'></pl-responsive-cell></a></td>" +
                        "                           </tr>" +
                        "                       </tbody>" +
                        "                   </table>" +
                        "               </div>";
                    iElement.append($compile(template)($scope));
                }
            }
        }
    }
}]);

pl.directive('plFreezeColumn', ['$compile', function ($compile) {
    return{
        restrict: 'EAC',
        scope: false,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    var template = "<div class='pl-freeze-area' ng-style='gridOptions.freezeStyle'>" +
                        "               <div  class='pl-fixed-row'>" +
                        "                  <table style='table-layout: fixed;width: 100%;box-shadow: 0px 0px 5px #ddd;' cellpadding='0' cellspacing='0' class='applane-grid-body'>" +
                        "                      <tbody>" +
                        "                          <tr ng-repeat='row in gridOptions.renderedRows' ng-style='{{row.style}}' ng-class='{\"selected\":$index== gridOptions.renderedRowIndex}' >" +
                        "                              <td pl-grid-cell class='applane-grid-cell' ng-repeat='col in gridOptions.freezeCol'  ng-style='col.style' tabindex='{{col.tabindex}}' ng-click='changeCurrentRow(row, $parent.$index)'>" +
                        "                              </td>" +
                        "                              <td class='pl-responsive-col' ><a ng-click='changeCurrentRow(row, $index); rowActionPopUp($event,row)' ng-class='{\"row-sptr\":!gridOptions.responsiveColumns}' class='pl-responsive-link flex flex-1'><pl-responsive-cell></pl-responsive-cell></a> </td>" +
                        "                          </tr>" +
                        "                       </tbody>" +
                        "                  </table>" +
                        "               </div>" +
                        "           </div>";
                    iElement.append($compile(template)($scope));
                    $scope.$watch('gridOptions.scrollTop', function () {
                        $($(iElement).find('.pl-freeze-area')).scrollTop($scope.gridOptions.scrollTop);
                    });
                }
            }
        }
    }
}]);

pl.directive('plFreezeHeader', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: 'A',
        scope: false,
        compile: function () {
            return {
                post: function ($scope, iElement) {
                    var template = "<table class='applane-grid-header pl-table-header' cellpadding='0' cellspacing='0'>" +
                        "       <tr>" +
                        "           <th pl-grid-header-cell class='pl-fixed-heading' ng-repeat='col in gridOptions.freezeCol' ng-style='col.style'  rowspan='{{col.rowSpan}}' colspan='{{col.colSpan}}'></th>" +
                        "       </tr>" +
                        "</table>";
                    iElement.append($compile(template)($scope));

                    if ($scope.gridOptions.headerFreeze) {
                        $scope.$watch('gridOptions.scrollLeft', function () {
                            $(iElement).scrollLeft($scope.gridOptions.scrollLeft);
                        });
                    }
                }
            }
        }
    };
}]);

pl.directive('plGridBody', [
    '$compile', '$timeout', function ($compile, $timeout) {
        'use strict';
        return {
            restrict: 'A',
            scope: false,
            compile: function () {
                return {
                    pre: function ($scope, iElement, attrs) {
                        var template = "<table style='table-layout: fixed;width: 100%;' cellpadding='0' cellspacing='0' class='applane-grid-body'>" +
                            "               <tbody>" +
                            "                   <tr ng-if='(gridOptions.aggregatePosition == \"header\" || gridOptions.aggregatePosition == \"both\") && gridOptions.aggregateRenderedData' class='agg-row'  ng-init='row=gridOptions.aggregateRenderedData' >" +
                            "                       <td pl-grid-footer-cell class='pl-static-col applane-grid-cell' ng-repeat='col in gridOptions.gridColumns' ng-style='col.style' tabindex='{{col.tabindex}}' ng-click='changeCurrentRow(row, $parent.$index)'>" +
                            "                       </td>" +
                            "                  </tr>" +
                            "                   <tr ng-repeat='row in gridOptions.renderedRows";
                        if ($scope.gridOptions.clientSearch) {
                            template += " | filter:gridOptions.clientSearchInfo.value ";
                        }
                        template += "' ng-style='{{row.style}}' ng-class='{\"selected\":$index== gridOptions.renderedRowIndex}' ";
//                        if ($scope.gridOptions.groupInfo && $scope.gridOptions.groupInfo.length > 0) {                 // due to __hidden__ is no longer part of row/data
//                            template += " ng-show='!row.__hidden__' ";
//                        }
                        template += " >" +
                            "                       <td pl-grid-cell class='pl-static-col applane-grid-cell' ng-repeat='col in gridOptions.gridColumns'  ng-style='col.style' tabindex='{{col.tabindex}}' ng-click='changeCurrentRow(row, $parent.$index)'>" +
                            "                       </td>" +
                            "                       <td class='pl-responsive-col flex flex-1' >";
                        if ($scope.gridOptions.$recursion || $scope.gridOptions.provideParentParameter) {
                            template += "<a ng-class='{\"row-sptr\":!gridOptions.responsiveColumns}' class='pl-responsive-link flex flex-1'>";
                        } else {
                            template += "<a ng-click='changeCurrentRow(row, $index); rowActionPopUp($event,row)' ng-class='{\"row-sptr\":!gridOptions.responsiveColumns}' class='pl-responsive-link flex flex-1'>";
                        }

                        template += "<pl-responsive-cell class='flex flex-1'></pl-responsive-cell>" +
                            "     </a>" +
                            "     </td>" +
                            "     </tr>";
                        if ($scope.gridOptions.aggregateRenderedData) {
                            template += "<tr ng-init='row=gridOptions.aggregateRenderedData' ng-if='(gridOptions.aggregatePosition == \"footer\" || gridOptions.aggregatePosition == \"both\" || gridOptions.aggregatePosition == undefined)'>" +
                                "<td pl-grid-footer-cell class='pl-static-col applane-grid-cell' style='border-right: none;' ng-repeat='col in gridOptions.gridColumns'  ng-style='col.style' tabindex='{{col.tabindex}}' ng-click='changeCurrentRow(row, $parent.$index)'>" +
                                "</td>" +
                                "</tr>";
                        }

                        template += "               </tbody>" +
                            "           </table>";

                        iElement.append($compile(template)($scope));
                    },
                    post: function ($scope, iElement) {
                        if ($scope.gridOptions.headerFreeze) {
                            $(iElement).scroll(function () {
                                $scope.gridOptions.scrollLeft = $(iElement).scrollLeft();
                                $scope.gridOptions.scrollTop = $(iElement).scrollTop();
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            });
                        }

                        $scope.$watch('gridOptions.renderedRows', function (newValue, oldValue) {
                            $timeout(function () {
                                var grid = $(iElement).find('.applane-grid-body');
                                var gHeight = $(grid).height();
                                if ($scope.gridOptions) {
                                    if (gHeight > $(iElement).height()) {
                                        $scope.gridOptions.overflow = true;
                                    } else {
                                        $scope.gridOptions.overflow = false;
                                    }
                                }

                            }, 0);
                        }, true);
                        $scope.$watch('gridOptions.bodyScrollLeft', function () {
                            $(iElement).scrollLeft($scope.gridOptions.bodyScrollLeft);
                        });
                    }
                }
            }
        };
    }
]);

pl.directive('plResponsiveCell', ['$compile', '$document', '$timeout', function ($compile, $document, $timeout) {
    'use strict';
    return{
        restrict: 'EA',
        scope: false,
        compile: function () {
            return{
                post: function ($scope, iElement) {
                    var template = "";
                    if ($scope.gridOptions.provideParentParameter) { //this work is highlighting selected row and accordingly applying padding---case for notifying other dashboard view on click of one dashboard view--Ritesh Bansal
                        template += '<div class="flex flex-1" ng-class="{\'selected-Recursive-filter\':gridOptions.selectedValue===row.entity._id}" style="border-left:1px solid transparent;overflow:hidden;text-overflow: ellipsis;">';
                    } else {
                        template += '<div style="padding-left:20px;border-left:1px solid transparent;overflow:hidden;text-overflow: ellipsis;">';
                    }
                    $scope.getResponsiveTemplate = function (responsiveCol) {
                        try {
                            if (Utility.isJSONObject(responsiveCol)) {
                                if (responsiveCol.html) {
                                    responsiveCol.html = (responsiveCol.html).replace(/\$/g, "row.entity.").replace(/\'/g, "\"");
                                    template += responsiveCol.html;
                                } else if (responsiveCol.label) {
                                    for (var i = 0; i < $scope.gridOptions.gridColumns.length; i++) {
                                        var col = $scope.gridOptions.gridColumns[i];
                                        if (col.field == responsiveCol.field) {
                                            template += col.cellTemplate;
                                        }
                                    }
                                }
                            } else {
                                for (var i = 0; i < $scope.gridOptions.gridColumns.length; i++) {
                                    var col = $scope.gridOptions.gridColumns[i];
                                    if (col.field == responsiveCol) {
                                        if ($scope.gridOptions.$recursion && $scope.gridOptions.$recursion.$primaryColumn == col.field) { //this work is done for showing hierarchy in for dashboard view as responsive
                                            template += '<div  style="display:flex">' +
                                                '           <div style=\'padding-left:' + $scope.row.level * 20 + 'px;\' class="app-float-left">&nbsp;</div>' +
                                                '           <div ng-if="!(row.entity.children) || (row.entity.children.length == 0) " style=\'padding-left:18px;\' class="app-float-left">&nbsp;</div>' +
                                                '           <div ng-click="toggleTreeForChild(row, $index)" ng-if="row.entity.children && (row.entity.children.length > 0)" ng-class="{\'icon-minus\':row.__hidden__,\'icon-plus\':row.__hidden__!=true}" pl-grid-group style="min-width: 6px;max-height:9px" class="pl-group-toggle-box app-float-left">&nbsp;</div>' +
                                                '           <span style="min-width:14px;" ng-click="changeRecursiveFilter(row,$index)">' +
                                                '               <i ng-if="(row.entity.children) && (row.entity.children.length > 0) && gridOptions.provideParentParameter && gridOptions.sharedOptions.onRecursiveIconClick && gridOptions.selectedValue===row.entity._id" style="font-size: 12px; font-family: FontAwesome;" class="pl-shared icon-repeat"></i>' +
                                                '               <i ng-if="(row.entity.children) && (row.entity.children.length > 0) && gridOptions.provideParentParameter && (!gridOptions.sharedOptions.onRecursiveIconClick || gridOptions.selectedValue!=row.entity._id)" style="font-size: 12px; color: rgb(161, 161, 161);font-family: FontAwesome;" class="pl-shared icon-repeat"></i>' +
                                                '           </span>' +
                                                '           <span ng-click="changeFilter(row,$index)" style="overflow: hidden;text-overflow: ellipsis;">' +
                                                col.cellTemplate +
                                                '           </span>' +
                                                '       </div>';
                                        } else {
                                            if ($scope.gridOptions.provideParentParameter) {
                                                template += '<span ng-click="changeFilter(row,$index)" style="overflow: hidden;text-overflow: ellipsis;">' +
                                                    col.cellTemplate +
                                                    '           </span>'
                                            } else {
                                                template += col.cellTemplate;
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    if ($scope.gridOptions.responsiveColumns) {
                        var seperator = $scope.gridOptions.responsiveColumns.seperator || '|';
                        var responsiveCol = undefined;
                        var userDB = ApplaneDB.connection("userdb");
                        var token = userDB.token;
                        template += '<div class="responsive-row">';
                        if ($scope.gridOptions.responsiveColumns.$image) {
                            template += "           <div class='left-icon'>" +
                                "               <div class='inner'> " +
                                "                   <img alt='Image' ng-if='row.entity." + $scope.gridOptions.responsiveColumns.$image + ".key' class='icon-image' ng-src='/rest/file/download?token=" + token + "&filekey={{row.entity." + $scope.gridOptions.responsiveColumns.$image + ".key}}' />" +
                                "                   <img alt='Image' ng-if='!row.entity." + $scope.gridOptions.responsiveColumns.$image + ".key' class='icon-image' src='../images/user.ico' />" +
                                "               </div>" +
                                "           </div>";
                        }
                        template += '           <div class="rs-row-right" ng-class=\'{"rs-row":!gridOptions.responsiveColumns.$image && !gridOptions.$recursion}\'>' +
                            '               <div class="app-overflow-hiiden app-width-full rs-data">';
                        if ($scope.gridOptions.responsiveColumns.$title) {
                            template += "<div class='title-text'>";
                            responsiveCol = $scope.gridOptions.responsiveColumns.$title;
                            $scope.getResponsiveTemplate(responsiveCol);
                            template += '</div>';
                        }
                        if ($scope.gridOptions.responsiveColumns.$otherFields) {
                            template += "<div class='child-text'>";
                            responsiveCol = $scope.gridOptions.responsiveColumns.$otherFields;
                            if (Array.isArray(responsiveCol)) {
                                for (var j = 0; j < responsiveCol.length; j++) {
                                    $scope.getResponsiveTemplate(responsiveCol[j]);
                                    if (j < responsiveCol.length - 1) {
                                        template += "<i> " + seperator + " </i>";
                                    }
                                }
                            } else {
                                responsiveCol = $scope.gridOptions.responsiveColumns.$otherFields
                                $scope.getResponsiveTemplate(responsiveCol);
                            }
                            template += '</div>';
                        }
                        template += '</div>';
                        if ($scope.gridOptions.responsiveColumns.$rightField) {
                            template += "<div class='right-icon'>";
                            responsiveCol = $scope.gridOptions.responsiveColumns.$rightField;
                            $scope.getResponsiveTemplate(responsiveCol);
                            template += '</div>';
                        }
                        template += '</div>';
                    } else {
                        var primaryField = undefined;
                        var stringField = undefined;
                        for (var i = 0; i < $scope.gridOptions.gridColumns.length - 1; i++) {
                            var col = $scope.gridOptions.gridColumns[i];
                            if (col.primary) {
                                primaryField = true;
                                template += $scope.gridOptions.provideParentParameter ? ('<span ng-click="changeFilter(row,$index)">' + col.cellTemplate + '</span>') : ('<div><b>' + col.label + '</b>: ' + col.cellTemplate + '</div>'); //if we provideParentParameter , we do not want to see label---case on click of row of project dashboard,we have to notify other dashboard--Ritesh Bansal
                            } else if (col.ui == 'text' && stringField == undefined) {
                                stringField = $scope.gridOptions.provideParentParameter ? ('<span ng-click="changeFilter(row,$index)">' + col.cellTemplate + '</span>') : ('<b>' + col.label + '</b>: ' + col.cellTemplate);//if we provideParentParameter , we do not want to see label---case on click of row of project dashboard,we have to notify other dashboard-Ritesh Bansal
                                break;
                            } else if ((i == $scope.gridOptions.gridColumns.length - 2) && stringField == undefined && $scope.gridOptions.columns && $scope.gridOptions.columns.length > 0) {
                                stringField = $scope.gridOptions.columns[0].cellTemplate;
                            }
                        }
                        if (!primaryField && angular.isDefined(stringField)) {
                            template += '<div>' + stringField + '&nbsp;</div>';
                        }
                    }
                    template += '</div></div>';
                    iElement.append($compile(template)($scope));
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }
            }
        }
    }
}]);

pl.directive('plGridFooterCell', ['$compile', '$document', '$timeout', function ($compile, $document, $timeout) {
    'use strict';
    return {
        link: function ($scope, iElement) {
            $scope.renderCell = function () {
                try {
                    if ($scope.col.cellTemplate && $scope.col.aggregate) {
                        var cellTemplate = "<div class='applane-grid-cell-inner app-overflow-hiiden app-white-space-nowrap'>" +
                            ($scope.col.footerCellTemplate || $scope.col.cellTemplate) +
                            "</div>";
                        iElement.html($compile(cellTemplate)($scope));

                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    }

                } catch (e) {
                    if ($scope.handleClientError) {
                        $scope.handleClientError(e);
                    }
                }
            }
            $scope.renderCell();
        }
    }
}]);

pl.directive('plGridCell', ['$compile', '$document', '$timeout', function ($compile, $document, $timeout) {
    'use strict';
    return {
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement) {
                    $scope.$watch("row.editMode", function (newValue, oldValue) {
                        if (angular.isDefined(newValue)) {
                            /*here we have set tr height due to the flactuation, because of tr height increase in edit mode, during image upload--Rajit*/
                            var tr = iElement.closest('td').parent('tr');
                            tr.css({'height': tr.height() + 'px'});
                            if (newValue == true) {
                                $scope.editCell();
                            } else {
                                $scope.renderCell();
                            }
                        }
                    })
                    if (angular.isDefined($scope.row.entity) && angular.isDefined($scope.row.__group__) && $scope.row.entity.children) {
                        iElement.css({"border-right": "none", "outline": "none"});
                        iElement.removeClass('applane-grid-cell');
                        iElement.addClass('pl-parent-row-level-' + $scope.row.__group__);
                    }

                    if ($scope.gridOptions.userSorting) {
                        var flyingRow = $('.pl-row-drag-wrapper');
                        flyingRow.bind('mouseover', function (e) {
                            flyingRow.css({top: (e.pageY - 30)});
                        });
                        $scope.gridOptions.messageMap = {};
                        iElement.bind('mousedown', function (e) {
                            $scope.col.enableRowDrag = true;
                            $(iElement).addClass('pl-row-dragging');
                            $scope.gridOptions.sourceRowIndex = $scope.$parent.$index;
                        });
                        iElement.bind('mousemove', function (e) {
                            if ($scope.col.enableRowDrag) {
                                $(iElement).addClass('pl-row-dragging');
                                $('body').addClass('pl-no-select');
                                flyingRow.css({top: (e.pageY - 30)});
                                $scope.gridOptions.rowDraggingLabel = $scope.gridOptions.sourceRowIndex + 1;
                                $scope.gridOptions.rowDragging = true;
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                        })
                        iElement.bind('mouseup', function (e) {
                            if ($scope.col.enableRowDrag) {
                                $scope.gridOptions.targetRowIndex = $scope.$parent.$index;
                                $scope.reorderRows($scope.gridOptions.sourceRowIndex, $scope.gridOptions.targetRowIndex);
                                $scope.col.enableRowDrag = false;
                                $scope.gridOptions.rowDragging = false;
                                $('body').removeClass('pl-no-select');
                                $(iElement).removeClass('pl-row-dragging');
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                        });
                        $scope.reorderRows = function (srcIndex, targetIndex) {
                            try {
                                if (srcIndex !== targetIndex) {
                                    var srcRow = $scope.gridOptions.renderedRows[srcIndex];
                                    var targetRow = $scope.gridOptions.renderedRows[targetIndex];
                                    if ($scope.gridOptions.dataModel.query.$sort) {
                                        var sort = $scope.gridOptions.dataModel.query.$sort
                                        var keys = Object.keys(sort);
                                        var lastSortValue = undefined;
                                        var lastSortKey = undefined;
                                        if (keys && keys.length > 0) {
                                            lastSortKey = keys[keys.length - 1];
                                            lastSortValue = sort[lastSortKey];
                                        }
                                        var previousRow = $scope.gridOptions.renderedRows[targetIndex - 1];
                                        var nextRow = $scope.gridOptions.renderedRows[targetIndex + 1];
                                        var userSortingField = $scope.gridOptions.userSorting
                                        var targetValue = targetRow.entity[userSortingField];
                                        if (previousRow === undefined) {
                                            if (lastSortValue === -1) { // desc order
                                                srcRow.entity[userSortingField] = new Date().getTime();
                                            } else { // asc order
                                                srcRow.entity[userSortingField] = targetValue - 100;
                                            }
                                        } else if (nextRow === undefined) {
                                            if (lastSortValue === -1) {
                                                srcRow.entity[userSortingField] = targetValue - 100;
                                            } else {
                                                srcRow.entity[userSortingField] = new Date().getTime();
                                            }
                                        } else {
                                            if (srcIndex < targetIndex) {
                                                if (matchSortingFieldValues(nextRow, targetRow, sort)) {
                                                    var nextValue = nextRow.entity[userSortingField];
                                                    srcRow.entity[userSortingField] = (nextValue + targetValue) / 2;
                                                } else {
                                                    if (lastSortValue === -1) {
                                                        srcRow.entity[userSortingField] = targetValue - 100;
                                                    } else {
                                                        srcRow.entity[userSortingField] = targetValue + 100;
                                                    }
                                                }
                                            } else {
                                                if (matchSortingFieldValues(previousRow, targetRow, sort)) {
                                                    var previousValue = previousRow.entity[userSortingField];
                                                    srcRow.entity[userSortingField] = (previousValue + targetValue) / 2;
                                                } else {
                                                    if (lastSortValue === -1) {
                                                        srcRow.entity[userSortingField] = targetValue + 100;
                                                    } else {
                                                        srcRow.entity[userSortingField] = targetValue - 100;
                                                    }
                                                }
                                            }
                                        }
                                        // change the data corresponding to sorting fields

                                        var message = "";
                                        var sortingKeys = "";
                                        for (var i = 0; i < keys.length; i++) {
                                            var key = keys[i];
                                            sortingKeys += key + "-";
                                            var dotIndex = key.indexOf(".");
                                            var firstPart = key;
                                            if (dotIndex >= 0) {
                                                firstPart = key.substr(0, dotIndex);
                                            }
                                            var fieldDef = Utility.getField(firstPart, $scope.gridOptions.dataModel.metadata.fields);
                                            if (fieldDef) {
                                                if (!Utility.deepEqual(srcRow.entity[fieldDef.field], targetRow.entity[fieldDef.field])) {
                                                    var previousValue = Utility.resolveDot(srcRow.entity, key);
                                                    var newValue = Utility.resolveDot(targetRow.entity, key);
                                                    message += fieldDef.label + " - from  " + previousValue + " to " + newValue;
                                                    srcRow.entity[fieldDef.field] = targetRow.entity[fieldDef.field];
                                                }
                                            }
                                        }
                                        $scope.gridOptions.sharedOptions.saveOptions.editMode = true;
                                        if ($scope.gridOptions.messageMap[sortingKeys] === undefined && message.length > 0) {
                                            $scope.gridOptions.messageMap[sortingKeys] = true;
                                            var message = "Following values are getting changed of column " + message + ", Press Cancel to discard or Save to persist.";
                                            $scope.gridOptions.warningOptions.error = new Error(message);
                                        }
                                    }
                                    $scope.gridOptions.renderedRows.splice(srcIndex, 1);
                                    $scope.gridOptions.renderedRows.splice(targetIndex, 0, srcRow);
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }
                            } catch (e) {
                                if ($scope.handleClientError) {
                                    $scope.handleClientError(e);
                                }
                            }
                        }


                    }

                    $scope.renderCell = function () {
                        try {
                            if ($scope.col.$group && angular.isDefined($scope.row.__group__)) {
                                var groupIndex = $scope.row.__group__;

                                iElement.html($compile($scope.row.groupData)($scope));
                                iElement.attr("tabIndex", $scope.col.tabindex);
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }

                            } else {
                                //check, if row is groupby or not , if so, than we don't need to render the cellTemplate
                                if ($scope.col.cellTemplate && (!angular.isDefined($scope.row.__group__) || !$scope.row.entity.children)) {
                                    var cellTemplate = "<div class='applane-grid-cell-inner app-overflow-hiiden app-white-space-initial' ng-style='{{col.colStyle}}' ";
                                    if (angular.isDefined($scope.col.editableWhen)) {
                                        cellTemplate += " ng-show= '!row.editMode || !(" + $scope.col.editableWhen + ")' ";
                                    }
//                        if ($scope.gridOptions.$recursion && $scope.gridOptions.$recursion.$primaryColumn == $scope.col.field) {
                                    //when groupby and recursion apply together on data we add some padding to the parimaryColumn
//                            cellTemplate += "  ";
//                        }
                                    cellTemplate += ' >';
                                    if ($scope.gridOptions.$recursion && $scope.gridOptions.$recursion.$primaryColumn == $scope.col.field) {
                                        cellTemplate += '<div style=\'padding-left:' + $scope.row.level * 20 + 'px\;\' class="app-float-left">&nbsp;</div>' +
                                            '<div ng-if="!(row.entity.children) || (row.entity.children.length == 0) " style=\'padding-left:18px\;\' class="app-float-left">&nbsp;</div>' +
                                            ' <div ng-click="toggleTreeForChild(row, $parent.$parent.$index)" ng-if="row.entity.children && (row.entity.children.length > 0)" ng-class="{\'icon-minus\':gridOptions.$recursion.$expandLevel && !row.level}" pl-grid-group class="icon-plus pl-group-toggle-box app-float-left">&nbsp;</div>' +
                                            '<span class="primary-col"></span>';
                                    }

                                    cellTemplate += $scope.col.cellTemplate +
                                        "</div>";
                                    iElement.html($compile(cellTemplate)($scope));
                                    iElement.attr("tabIndex", $scope.col.tabindex);
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }
                            }

                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    iElement.bind('mouseover', function () {
                        $scope.col.mouseIn = true;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    });
                    iElement.bind('mouseout', function () {
                        $scope.col.mouseIn = false;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    });

                    var watch = undefined;
                    $scope.editCell = function (e) {
                        try {
                            if (angular.isDefined($scope.row.__group__)) {
                                return;
                            }
                            if ($scope.col.editableCellTemplate) {

                                var template = '';
                                if (angular.isDefined($scope.col.editableWhen) && $scope.col.editableWhen.length > 0) {
                                    template = "<div class='grid-edit-cell-template app-position-relative' ng-show='" + $scope.col.editableWhen + "'>" +
                                        $scope.col.editableCellTemplate +
                                        "</div>";
                                    iElement.append($compile(template)($scope));
                                } else {
                                    template = '<div class="grid-edit-cell-template app-position-relative">' +
                                        $scope.col.editableCellTemplate +
                                        '</div>';
                                    iElement.html($compile(template)($scope));

                                }
                                iElement.attr("tabIndex", "-1");
                                var inputElm = iElement.find('input')[0];
                                if (inputElm) {
                                    angular.element(inputElm).bind('focus', function ($event) {
                                        var mainGrid = '.main-grid';
                                        if ($scope.gridOptions.nested) {
                                            mainGrid = '.pl-form-wrapper .main-grid';
                                        }
                                        var gridElm = angular.element(mainGrid);
                                        var elmOffset = iElement.offset();
                                        var gridWidth = gridElm.width();
                                        if (elmOffset && gridWidth) {
                                            var elmLeft = iElement.offset().left;
                                            var gridSCrollLeft = gridElm.scrollLeft();
                                            if (elmLeft > (gridWidth)) {
                                                $scope.gridOptions.bodyScrollLeft = gridSCrollLeft + 200;
                                            } else if (elmLeft < 0) {
                                                gridSCrollLeft -= 200;
                                                gridSCrollLeft < 0 ? gridSCrollLeft = 0 : '';
                                                $scope.gridOptions.bodyScrollLeft = gridSCrollLeft;
                                            }
                                            if (!$scope.$$phase) {
                                                $scope.$apply();
                                            }
                                        }
                                    });
                                }

                                $scope.$on('$destroy', function ($event) {
                                    angular.element(inputElm).unbind('focus');
                                });
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    function matchSortingFieldValues(nextRow, targetRow, sort) {
                        var keys = Object.keys(sort);
                        var equal = true;
                        for (var i = 0; i < keys.length; i++) {
                            var key = keys[i];
                            if (key !== "_id") {
                                var dotIndex = key.indexOf(".");
                                if (dotIndex >= 0) {
                                    key = key.substr(0, dotIndex);
                                }
                                if (!Utility.deepEqual(nextRow.entity[key], targetRow.entity[key])) {
                                    equal = false;
                                    break;
                                }
                            }
                        }
                        return equal;
                    }


                    $scope.renderCell();

                    $scope.$on('$destroy', function ($event) {
                        iElement.unbind('mouseover');
                        iElement.unbind('mouseout');
                        iElement.unbind('mousedown');
                        iElement.unbind('mousemove');
                        iElement.unbind('mouseup');
                    });

                }
            }
        }
    }
}]);

pl.directive('plGridEditCellTemplate', [
    '$compile', '$timeout', function ($compile, $timeout) {
        return {
            restrict: 'E',
            compile: function () {
                return {
                    pre: function ($scope, iElement, attrs) {
                        var template = '<div class="grid-edit-cell-template app-position-relative">' +
                            $scope.col.editableCellTemplate +
                            '</div>';
                        iElement.html($compile(template)($scope));
//                        $scope.setEditMode(true);
//                        if (!$scope.$$phase) {
//                            $scope.$apply();
//                        }
                    },
                    post: function ($scope, iElement) {
                    }
                }
            }
        };
    }
]);

pl.directive('plGridHeader', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: 'A',
        scope: false,
        compile: function () {
            return {
                post: function ($scope, iElement) {
                    var template = "<table class='applane-grid-header pl-table-header' cellpadding='0' cellspacing='0'>" +
                        "       <tr>" +
                        "           <th ng-if='!gridOptions.headerColumns' pl-grid-header-cell ng-repeat='col in gridOptions.gridColumns' ng-style='col.style' rowspan='{{col.rowSpan}}' colspan='{{col.colSpan}}'></th>" +
                        "           <th ng-if='gridOptions.headerColumns' pl-grid-header-cell ng-repeat='col in gridOptions.headerColumns' ng-style='col.style'  rowspan='{{col.rowSpan}}' colspan='{{col.colSpan}}'></th>" +
                        "           <th ng-if='gridOptions.overflow' style='width:9px;border:none; min-width: 9px; padding:0;'>&nbsp;</th>" +
                        "       </tr>" +
                        "       <tr ng-if='gridOptions.subHeaderColumns'>" +
                        "           <th pl-grid-header-cell ng-repeat='col in gridOptions.subHeaderColumns'  ng-style='col.style' rowspan='{{col.rowSpan}}' colspan='{{col.colSpan}}' ></th>" +
                        "           <th ng-if='gridOptions.overflow' style='width:9px;border:none; min-width: 9px; padding:0;'>&nbsp;</th>" +
                        "       </tr>" +
                        "</table>" +
                        "<div id='{{gridOptions.uniqueViewId}}-col-resize' class='app-col-resize app-cursor-col-resize draggable' ></div>" +
                        "<div id='drag-{{gridOptions.uniqueViewId}}' ng-bind='gridOptions.dragLabel' ng-show='gridOptions.dragVisibility' class='drag'></div>";
                    iElement.append($compile(template)($scope));

                    if ($scope.gridOptions.headerFreeze) {
                        $scope.$watch('gridOptions.scrollLeft', function () {
                            $(iElement).scrollLeft($scope.gridOptions.scrollLeft);
                        });
                    }
                }
            }
        }
    };
}]);

pl.directive('plGridHeaderCell', [
    '$compile', '$timeout', function ($compile, $timeout) {
        'use strict';
        return {
            restrict: 'A',
            replace: true,
            compile: function () {
                return {
                    pre: function ($scope, iElement) {
                        var template = $scope.col.headerCellTemplate;
                        if ($scope.col.sortable) {
                            for (var i = 0; i < $scope.gridOptions.userPreferenceOptions.sortInfo.length; i++) {
                                var sortCol = $scope.gridOptions.userPreferenceOptions.sortInfo[i];
                                if (sortCol.field == $scope.col.field) {
                                    break;
                                }
                            }
                            var sortOptions = [
                                {label: 'Asc', onClick: 'onHeaderSort', value: 'Asc', when: true},
                                {label: 'Desc', onClick: 'onHeaderSort', value: 'Dsc', when: true},
                                {label: 'Reset', onClick: 'onHeaderSort', value: 'reset', when: 'col.value == "Asc" || col.value =="Dsc"  '}
                            ]
                            $scope.col.headerOptions = sortOptions;
                        }
                        if ($scope.col.headerCellTemplate) {
                            template = '<div class="flex-box app-position-relative block">' + $scope.col.headerCellTemplate + "<div ng-if='col.sortable' ng-mouseover='mousemoveOnHeader()' class='pl-col-options'><div ng-click='onHeaderSort(\"Asc\")' ng-class='{\"app-color-black\":col.value ==\"Asc\"}'><i class='icon-caret-up'></i></div><div ng-click='onHeaderSort(\"Dsc\")' ng-class='{\"app-color-black\":col.value ==\"Dsc\"}'><i class='icon-caret-down'></i></div></div></div>"
                        }
                        if (!template) {
                            template = "<div ng-style='col.style'>&nbsp;</div>";
                        }
                        var headerCell = $compile(template)($scope);
                        iElement.append(headerCell);
                    },
                    post: function ($scope, iElement) {
                        $scope.mousemoveOnHeader = function () {
                            $scope.col.mouseIn = true;
                        }
                        $timeout(function () {
                            var offset = iElement.offset();
                            var headerWidth = offset.left + iElement.outerWidth();
                            if (headerWidth >= $(window).width()) {
                                for (var i = 0; i < $scope.gridOptions.gridColumns.length; i++) {
                                    var col = $scope.gridOptions.gridColumns[i];
                                    if (col.flexible) {
                                        col.style = col.style || {};
                                        col.style.width = '100px';
                                    }
                                }
                            }
                        }, 0);
                        var id = $scope.gridOptions.uniqueViewId + '-col-resize';
                        iElement.bind('mousemove', function (e) {
                            if ($scope.col.sortable) {
                                $scope.mousemoveOnHeader();
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                            if ($scope.col.freeze) {
                                return;
                            }
                            var mousePosition = e.pageX;
                            var left = iElement.offset().left;
                            var width = iElement.outerWidth();
                            var totalWidth = (left + width);

                            if (angular.isUndefined($scope.col[$scope.gridOptions.colSequenceField])) {
                                $scope.checkMouseOnHeader();
                                return;
                            }


                            if ($scope.gridOptions.fieldResize && !$scope.gridOptions.autoWidthColumn) {
//                                $scope.resizeCol(e, left, mousePosition, totalWidth, width, $scope.col);
                                if ((mousePosition >= (totalWidth - 5)) && (mousePosition <= (totalWidth + 5))) {
                                    $('#' + id).css({'left': (totalWidth - 10) + 'px', 'top': iElement.offset().top + 'px', 'height': iElement.height(), width: '30px'});
                                    $scope.setCurrentHeaderCell({element: iElement, col: $scope.col});
                                    $('#' + id).bind("mousedown", function () {
                                        $scope.gridOptions.resizeEnable = true;
                                        $scope.resizeCol(e, left, mousePosition, totalWidth, width, $scope.col);
                                        $('#' + id).bind("mouseup", function (e) {
                                            $scope.gridOptions.resizeEnable = false;
                                            if ($scope.gridOptions.handleFieldDragChanges) {
                                                $scope[$scope.gridOptions.handleFieldDragChanges]($scope.col, 'resize');
                                            }
                                            if (!$scope.$$phase) {
                                                $scope.$apply();
                                            }
                                        });
                                    });
                                } else {
                                    $scope.gridOptions.resize = false;
                                }
                            }
                            if ($scope.gridOptions.leftDownKeyPress) {
                                $scope.col.dragging = true;
                                left = (mousePosition + 5) + "px"; // because padding of 5px on th
                                var outerHeight = iElement.outerHeight() + "px";
                                var divElement = $("#drag-" + $scope.gridOptions.uniqueViewId);
                                divElement.css({left: left, height: outerHeight});
                                $scope.gridOptions.dragVisibility = true;
                                divElement.bind("mousemove", function (e) {
                                    var coOrdinates = e.pageX;
                                    var left = (coOrdinates + 25) + "px";
                                    divElement.css({left: left});
                                });
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                        });

                        iElement.bind('mousedown', function () {
                            if (angular.isUndefined($scope.col[$scope.gridOptions.colSequenceField]) || !$scope.gridOptions.fieldDragable || $scope.col.freeze) {
                                return;
                            }
                            $scope.gridOptions.leftDownKeyPress = true;
                            $scope.gridOptions.resizeEnable = false;
                            $scope.gridOptions.dragLabel = $scope.col.label;
                            $scope.gridOptions.srcIndex = $scope.$index;
                            var outerWidth = iElement.outerWidth() + "px";
                            var divElement = $("#drag-" + $scope.gridOptions.uniqueViewId);
                            divElement.css({width: outerWidth});
                        });

                        $scope.colOptions = function (e) {
                            try {
                                if (!$scope.col.dragging && !($scope.gridOptions.resizeEnable) && $scope.col.sortable) {
                                    var editHeaderOptionsTemplate = '<div class="app-white-space-nowrap" >' +
                                        '                               <div class="pl-menu-group-label pl-overflow-y-scroll app-max-height-two-hundred" style="text-align: left" >' +
                                        "                                   <span style='display: block;' class='app-row-action app-padding-five-px' ng-repeat='headerOption in col.headerOptions' ng-show='{{headerOption.when}}' ng-click='onColumnOptionsClick(headerOption)'>" +
                                        "                                       <label class='app-cursor-pointer' ng-bind='headerOption.label' style='margin: 0;'></label>" +
                                        "                                   </span>" +
                                        '                               </div>' +
                                        '                           </div>';
                                    var popupScope = $scope.$new();
                                    var p = new Popup({
                                        autoHide: true,
                                        deffered: true,
                                        escEnabled: true,
                                        hideOnClick: true,
                                        addInElement: true,
                                        html: $compile(editHeaderOptionsTemplate)(popupScope),
                                        scope: popupScope,
                                        element: e.target
                                    });
                                    p.showPopup();
                                    $scope.onColumnOptionsClick = function (header) {
                                        try {
                                            if (header.onClick) {
                                                $scope[header.onClick](header.value);
                                            }
                                        } catch (e) {
                                            if ($scope.handleClientError) {
                                                $scope.handleClientError(e);
                                            }
                                        }
                                    }
                                }
                            } catch (e) {
                                if ($scope.handleClientError) {
                                    $scope.handleClientError(e);
                                }
                            }
                        }

                        $scope.onHeaderSort = function (sortOrder) {
                            try {
                                $scope.col.value = sortOrder;
                                $scope.gridOptions.userPreferenceOptions.sortInfo = [];
                                if (($scope.col.value == 'reset')) {
                                    $scope.gridOptions.userPreferenceOptions.removeSortInfo = $scope.gridOptions.userPreferenceOptions.removeSortInfo || [];
                                    $scope.gridOptions.userPreferenceOptions.removeSortInfo.push($scope.col);
                                } else {
                                    $scope.gridOptions.userPreferenceOptions.lastSelectedInfo = 'Sort';
                                    $scope.gridOptions.userPreferenceOptions.sortInfo.push($scope.col);
                                    $scope.gridOptions.userPreferenceOptions.selectedType = 'Sort';
                                    if ($scope.gridOptions.userPreferenceOptions.typeMenuGroupOptions) {
                                        $scope.gridOptions.userPreferenceOptions.typeMenuGroupOptions.label = 'Sort';
                                    }
                                }
                                $scope.gridOptions.userPreferenceOptions.apply = !$scope.gridOptions.userPreferenceOptions.apply;
                            } catch (e) {
                                if ($scope.handleClientError) {
                                    $scope.handleClientError(e);
                                }
                            }
                        }

                        iElement.bind('mouseup', function (e) {
                            if ($scope.col.__systemcolumn__ || angular.isUndefined($scope.col[$scope.gridOptions.colSequenceField]) || !$scope.gridOptions.fieldDragable || $scope.col.freeze || $scope.gridOptions.resizeEnable) {
                                return;
                            }
                            $scope.col.dragging = undefined;
                            $scope.gridOptions.dragVisibility = false;
                            $scope.gridOptions.leftDownKeyPress = false
                            $scope.gridOptions.targetIndex = $scope.$index;
                            var columnChanges = $scope.columnReOrdering($scope.gridOptions.srcIndex, $scope.gridOptions.targetIndex);
                            if ($scope.gridOptions.handleFieldDragChanges && columnChanges) {
                                for (var i = 0; i < columnChanges.length; i++) {
                                    var colChange = columnChanges[i];
                                    $scope[$scope.gridOptions.handleFieldDragChanges](colChange, 'drag');

                                }

                            }
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        });

                        iElement.bind('mouseout', function () {
                            $scope.col.mouseIn = false;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        });

                        $scope.checkMouseOnHeader = function () {
                            try {
                                if ($scope.gridOptions.dragVisibility) {
                                    $scope.gridOptions.dragVisibility = false;
                                    $scope.gridOptions.leftDownKeyPress = false;
                                    $('body').unbind('mouseup');
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }
                            } catch (e) {
                                if ($scope.handleClientError) {
                                    $scope.handleClientError(e);
                                }
                            }
                        }
                        $scope.resizeCol = function (e, left, mousePosition, totalWidth, width, col) {
                            try {
                                if ($scope.gridOptions.leftDownKeyPress) {
                                    return;
                                }
                                if ((mousePosition >= (totalWidth - 5)) && (mousePosition <= (totalWidth + 5))) {
                                    $('#' + id).css({'left': (totalWidth - 10) + 'px', 'top': iElement.offset().top + 'px', 'height': iElement.height()});
                                    $scope.setCurrentHeaderCell({element: iElement, col: $scope.col});
                                    $('body').bind('mousemove', function (e) {
                                        var headerCell = $scope.getCurrentHeaderCell();
                                        if ($scope.gridOptions && headerCell && $scope.gridOptions.resizeEnable == true) {
                                            var elementLeft = headerCell.element.offset().left;
                                            var width = e.pageX - elementLeft;
                                            if (width > 50) {
                                                headerCell.element.width(width);
                                                headerCell.col.style.width = width + 'px';
                                                $('#' + id).css({'left': (elementLeft + width - 10) + 'px'});
                                                if (!$scope.$$phase) {
                                                    $scope.$apply();
                                                }
                                            }
                                        }
                                    });
                                    $('body').bind('mouseup', function () {
                                        if (!$scope.gridOptions || !$scope.gridOptions.resizeEnable) {
                                            return;
                                        }
                                        $scope.gridOptions.resizeEnable = false;
                                        if ($scope.gridOptions.handleFieldDragChanges) {
                                            $scope[$scope.gridOptions.handleFieldDragChanges](col, 'resize');
                                        }
                                        if (!$scope.$$phase) {
                                            $scope.$apply();
                                        }
                                        $('body').unbind("mousemove");
                                        $('body').unbind('mouseup');
                                    });


                                } else {
                                    $scope.gridOptions.resize = false;
                                }
                            } catch (e) {
                                if ($scope.handleClientError) {
                                    $scope.handleClientError(e);
                                }
                            }
                        }
                        $scope.$on('$destroy', function ($event) {
                            iElement.unbind('mouseover');
                            iElement.unbind('mouseout');
                            iElement.unbind('mousedown');
                            iElement.unbind('mousemove');
                            iElement.unbind('mouseup');
                        });

                    }
                };
            }
        };
    }
]);

pl.directive('plGridGroup', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: 'A',
        link: function (scope, elm, attr, ngModelCtrl) {
            elm.bind('click', function () {
                if (elm.hasClass('icon-minus')) {
                    elm.removeClass('icon-minus');
                    elm.addClass('icon-plus');
                } else {
                    elm.removeClass('icon-plus');
                    elm.addClass('icon-minus');
                }

            });
        }
    };
}]);

pl.directive("plGridSetFieldVisibility", ["$compile", function ($compile) {
    'use strict';
    return {
        restrict: "E",
        replace: true,
        template: "<div class='pl-set-grid-visibility'>" +
            "          <div ng-repeat='col in gridOptions.columns'>" +
            "              <span><input type='checkbox' ng-model='col.visibilityForm' ng-change='selectField(col)'></span>" +
            "              <span ng-bind='col.label'></span>" +
            "          </div>" +
            "      </div>",
        compile: function () {
            return {

                post: function ($scope, iElement) {
                    $scope.selectField = function (field) {
                        var title = "plGridSetFieldVisibility in pl.grid";
                        var message = JSON.stringify(field);
                        $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
                    }
                }
            };
        }
    };
}]);

pl.directive('plResize', ['$compile', function ($compile) {
    return{
        restrict: 'A',
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    iElement.bind('click', function () {
                        var isimageToggle = iElement.hasClass('pl-transform-180')
                        if (isimageToggle) {
                            iElement.removeClass('pl-transform-180');
                        } else {
                            iElement.addClass('pl-transform-180')
                        }
                    });
                }
            }
        }
    }
}]);

/*pl-component startd from here*/

pl.filter('abs', function () {
    return function (val) {
        if (val < 0) {
            return Math.abs(val);
        } else {
            return val;
        }
    }
});
pl.filter('percentage', function () {
    return function (val) {
        if (angular.isNumber(val)) {
            val = Math.round(val);
        }
        if (val < 0) {
            val = Math.abs(val);
            return val + '%';
        } else if (val >= 0) {
            return val + '%';
        } else {
            return val;
        }
    }
});
pl.filter('zero', function () {
    return function (val, alias) {
        if (!val || val == '') {
            if (alias == 1) {
                return '-';
            } else {
                return 0;
            }
        } else {
            return val;
        }
    }
});

pl.directive('plFileUpload', function () {
    return {
        restrict: "A",
        replace: true,
        scope: true,
        require: 'ngModel',
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs, controller) {
                    iElement.bind('change', function () {
                        $scope.$apply(function () {
                            $scope.oFReader = new FileReader();
                            $scope.oFile = iElement[0].files[0];
                            $scope.oFReader.onload = $scope.uploadFile;
                            $scope.oFReader.readAsDataURL($scope.oFile);

                        });
                    });

                    $scope.uploadFile = function (evt) {
                        var isValidFileExtension = true;
                        var supportedExtensions = $scope.col.supportedExtensions;
                        var userFileExtension = undefined;
                        if ($scope.col.uploadLimit && ($scope.oFile.size > $scope.col.uploadLimit)) {
                            var error = new Error("File Size exceeds current upload limit of : " + $scope.col.uploadLimit + " bytes.");
                            if ($scope.handleClientError) {
                                $scope.handleClientError(error);
                            }
                            throw error;
                        }
                        if (supportedExtensions && supportedExtensions.length > 0) {
                            var fileName = $scope.oFile.name;
                            userFileExtension = fileName.substring(fileName.lastIndexOf("."));
                            var index = supportedExtensions.indexOf(userFileExtension);
                            if (index < 0) {
                                isValidFileExtension = false;
                            }
                        }

                        if (!isValidFileExtension) {
                            var error = new Error(userFileExtension + " is not supported. Supported file extensions are " + JSON.stringify(supportedExtensions));
                            if ($scope.handleClientError) {
                                $scope.handleClientError(error);
                            }
                            throw error;
                        }

                        $scope.loadFile($scope.oFile.name, $scope.oFile.type, evt.target.result).then(
                            function (result) {
                                if (angular.isUndefined(result) || angular.isUndefined(result.response)) {
                                    alert("Result not found !");
                                }

                                if (attrs.multiple) {
                                    var modelValue = controller.$modelValue || [];
                                    modelValue.push(result.response[0]);
                                    controller.$setViewValue(modelValue);
                                } else {
                                    controller.$setViewValue(result.response[0]);
                                }
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }).fail(function (err) {
                                if (err) {
                                    if ($scope.handleClientError) {
                                        $scope.handleClientError(err);
                                    }
                                }
                            });
                    }
                }
            };
        }
    }
});

pl.directive('plRemoveValue', function () {
    return {
        restrict: "EAC",
        require: "ngModel",
        compile: function () {
            return {
                post: function ($scope, iElement, attrs, controller) {
                    $scope.remove = function ($index, $event) {
                        try {

                            if (angular.isDefined($index) && angular.isDefined(controller.$modelValue) && angular.isArray(controller.$modelValue)) {
                                controller.$modelValue.splice($index, 1);
                                var modelValue = controller.$modelValue.length == 0 ? undefined : controller.$modelValue;
                                controller.$setViewValue(modelValue);
                            } else {
                                controller.$setViewValue(undefined);
                            }
                            $event.preventDefault();
                            $event.stopPropagation();

                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                }
            };
        }
    }
});

pl.directive('ngModelRemove', function () {
    return {
        restrict: 'A',
        priority: 1,
        require: 'ngModel',
        link: function (scope, elm, attr, ngModelCtrl) {
            if (attr.type === 'radio' || attr.type === 'checkbox') return;
            elm.unbind('input').unbind('change');
        }
    };
});

pl.directive('plDateFilter', ['$compile', '$filter', function ($compile, $filter) {
    return {
        restrict: "E",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs, controller) {
                    var template = "<div class='pl-date-filter-div-parent'>" +
                        "               <div class='app-date-filter-left-arrow-filter' ng-show='showNavigationButtons && !showCustomPopUp && !showNDaysPopUp' ng-click='dateFilterNavigation(false)'></div>" +
//                        "                   <span ng-show='dateWrapper && !showCustomPopUp && !showNDaysPopUp' ng-click='showOptions($event)' class='pl-date-filter-disable'></span>" +
                        "                   <input ng-show='!showCustomPopUp && !showNDaysPopUp' ng-blur='handleBlur()' type='text' placeholder='{{filter.label}}' ng-click='showOptions($event)' class='pl-date-filter-div' ng-class='{\"app-width-auto\":!showNavigationButtons}' ng-model='filter.value' title='{{filter.value}}'/>" +
                        "               <div class='app-date-filter-right-arrow-filter' ng-show='showNavigationButtons && !showCustomPopUp && !showNDaysPopUp' ng-click='dateFilterNavigation(true)'></div>" +
                        "               <input ng-show='!showCustomPopUp && !showNDaysPopUp && !showNDaysPopUp' class='app-grid-date-picker-calender-image app-float-right'  type='text' ng-model='filter.fieldValue' tabindex='-1' data-trigger='focus' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' bs-datepicker />" +
                        "               <pl-custom-filter ng-show='showCustomPopUp && !showNDaysPopUp'></pl-custom-filter>" +
                        "               <pl-n-days-filter ng-show='showNDaysPopUp && !showCustomPopUp'></pl-n-days-filter>" +
                        "           </div>" +
                        "           <div ng-show='filter.pastComparison' class='compare-image app-cursor-pointer  pl-theme-background pl-cross-filter ' title='Past Comparison' ng-class='{\"active\":filter.__pastComparisonEnabled}' ng-click='pastComparisonChange(filter)'/>";
                    iElement.append($compile(template)($scope));
                    if ($scope.filter == undefined) {
                        return;
                    }
                    if ($scope.filter.__span__) {
                        $scope.dateWrapper = true;
                    } else {
                        $scope.dateWrapper = undefined;
                    }
                    if ($scope.filter.label == undefined) {
                        $scope.filter.label = 'date';
                    }

                    $scope.initialFilterValue = $scope.filter.value;
                    $scope.pastComparisonChange = function (filter) {
                        filter.__pastComparisonEnabled = !filter.__pastComparisonEnabled;
                    }
                    $scope.setFilterDate = function (filter, startDate, endDate, setWrapper) {
                        try {
                            if (setWrapper == undefined) {
                                $scope.dateWrapper = true;
                            }
                            if (filter && filter.time) {
                                if (filter.__span__ != 'rangeFilter') {
                                    startDate.setHours(0);
                                    startDate.setMinutes(0);
                                    startDate.setSeconds(0);
                                    endDate.setHours(0);
                                    endDate.setMinutes(0);
                                    endDate.setSeconds(0);
                                }
                            } else {
                                startDate = Util.setDateWithZeroTimezone(startDate);
                                endDate = Util.setDateWithZeroTimezone(endDate);
                            }
                            if (filter && filter.filter) {
                                filter.filter.$gte = startDate;
                                filter.filter.$lt = endDate;
                            }
                            $scope.removeError();
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    function getValidDate(value) {
                        var split = value.split("/");
                        if (split && split.length == 3) {
                            var date = new Date(split[2] + "-" + split[1] + "-" + split[0]);
                            if (!isNaN(Date.parse(date))) {
                                return date;
                            }
                        } else {
                            return undefined;
                        }

                    }

                    $scope.erroHandling = function (msg) {
                        try {
                            if ($scope.gridOptions && $scope.gridOptions.warningOptions) {
                                $scope.gridOptions.warningOptions.error = msg;
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            } else {
                                alert(msg);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    };
                    $scope.removeError = function () {
                        try {
                            if ($scope.gridOptions && $scope.gridOptions.warningOptions && $scope.gridOptions.warningOptions.showWarning) {
                                delete $scope.gridOptions.warningOptions.error;
                                $scope.gridOptions.warningOptions.showWarning = false;
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.handleBlur = function () {
                        try {
                            $scope.removeError();
                            var value = $scope.filter.value;
                            if (!value || value.toString().length == 0 || ($scope.initialFilterValue == value)) {
                                return;
                            }

                            var compositeDate = /[0-9 a-z ]-/g.test(value);
                            var firstDate = undefined;
                            var secondDate = undefined;
                            if (compositeDate) {
                                firstDate = value.split("-");
                                if (firstDate && firstDate.length == 2) {
                                    secondDate = getValidDate(firstDate[1].trim().substr(0, 10));
                                    firstDate = getValidDate(firstDate[0].trim().substr(0, 10));
                                    if (secondDate == undefined) {
                                        secondDate = new Date('march');
                                    }
                                    if (!angular.isDefined(secondDate) || !angular.isDefined(firstDate)) {
                                        throw  new BusinessLogicError('Date not parsable. Either select from given options or provide in dd/mm/yyyy format.');
                                    }
                                    if ((secondDate.getDay() - firstDate.getDay()) == 6) {
                                        $scope.filter.__span__ = "week";
                                        $scope.showNavigationButtons = true;
                                    } else {
                                        $scope.filter.__span__ = 'manual';
                                        $scope.showNavigationButtons = false;
                                    }
                                    secondDate = new Date(secondDate.getFullYear(), secondDate.getMonth(), secondDate.getDate() + 1);
                                    $scope.filter.filter = {};
                                    $scope.setFilterDate($scope.filter, firstDate, secondDate, true);
                                    secondDate = new Date(secondDate.getFullYear(), secondDate.getMonth(), secondDate.getDate() - 1);
                                    var label = $filter('date')(firstDate, "dd/MM/yyyy") + " - " + $filter('date')(secondDate, "dd/MM/yyyy");
                                    $scope.filter.value = label;

                                }
                            } else if (/\//g.test(value)) {
                                var date = getValidDate(value);
                                if (date) {
                                    if (angular.isDefined(date)) {
                                        var nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
                                        $scope.filter.filter = {};
                                        $scope.setFilterDate($scope.filter, date, nextDate, true);
                                        $scope.filter.value = $filter('date')(date, "dd/MM/yyyy");
                                        $scope.filter.__span__ = 'date';
                                        $scope.showNavigationButtons = true;
                                    }
                                }
                            } else if (value) {
                                //code to handle string keywords (today, yesterday, sun, jan , today +1 etc.) for date value
                                var isAprilOrAugust = /a(p|u)/.test(value);
                                if (isAprilOrAugust) {
                                    value = value.replace(/a/g, "/a");
                                }
                                date = Date.parse(value);
                                if (date) {
                                    var nextDate = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
                                    $scope.filter.__span__ = 'date';
                                    $scope.showNavigationButtons = true;
                                    $scope.filter.filter = {};
                                    $scope.setFilterDate($scope.filter, date, nextDate, true);
                                    $scope.filter.value = $filter('date')(date, "dd/MM/yyyy");
                                } else {
                                    throw  new BusinessLogicError('Date not parsable. Either select from given options or provide in dd/mm/yyyy format.');
                                }
                            } else {
                                throw  new BusinessLogicError('Date not parsable. Either select from given options or provide in dd/mm/yyyy format.');
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }

                    }

                    $scope.customFilter = function () {
                        try {
                            $scope.currentDateOptions = undefined;
                            $scope.showCustomPopUp = !$scope.showCustomPopUp;
                            if ($scope.filter.toValue && $scope.filter.fromValue) {
                                $scope.applyCustomFilter();
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.customFilterOptions = function (__filterOptions__, filterOptions) {
                        try {
                            if (filterOptions && filterOptions.length > 0) {
                                var customFilter = undefined;
                                var filterIndex = filterOptions.length - 1;
                                for (var i = 0; i < filterOptions.length; i++) {
                                    if (filterOptions[i].selected) {
                                        filterIndex = i;
                                        break;
                                    }
                                }
                                customFilter = filterOptions[filterIndex];
                                customFilter.selected = true;
                                $scope.filter.filter = {};
                                $scope.showNavigationButtons = true;
                                $scope.filter.__span__ = 'customRange';
                                var startRange = new Date(customFilter.startRange);
                                var endRange = new Date(customFilter.endRange);
                                endRange = new Date(endRange.getFullYear(), endRange.getMonth(), endRange.getDate() + 1)
                                $scope.setFilterDate($scope.filter, startRange, endRange);
                                $scope.filter.value = customFilter.label;
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.getNextPrevCustomRange = function (filter, next, customFilter) {
                        try {
                            if (!filter || !customFilter || !customFilter.filterOptions) {
                                return;
                            }
                            var customFilterIndex = undefined;
                            for (var i = 0; i < customFilter.filterOptions.length; i++) {
                                var rangeFilter = customFilter.filterOptions[i];
                                if (rangeFilter.label == customFilter.value) {
                                    customFilterIndex = i;
                                    break;
                                }
                            }

                            if (customFilterIndex == undefined) {
                                return;
                            }
                            if (next && customFilterIndex < customFilter.filterOptions.length - 1) {
                                delete customFilter.filterOptions[customFilterIndex].selected;
                                customFilter.filterOptions[customFilterIndex + 1].selected = true;
                                $scope.customFilterOptions(undefined, customFilter.filterOptions);
                            } else if (!next && customFilterIndex > 0) {
                                delete customFilter.filterOptions[customFilterIndex].selected;
                                customFilter.filterOptions[customFilterIndex - 1].selected = true;
                                $scope.customFilterOptions(undefined, customFilter.filterOptions);
                            }

                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.currentDate = function (__currentDate) {
                        try {
                            $scope.showCustomPopUp = undefined;
                            $scope.filter.filter = {};
                            if (__currentDate) {
                                $scope.filter.filter = {$function: "Functions.CurrentDateFilter"};
                                $scope.showNavigationButtons = false;
                            } else {
                                $scope.showNavigationButtons = true;
                                $scope.filter.__span__ = 'date';
                                var currentDate = new Date();
                                currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                                var nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);
                                $scope.setFilterDate($scope.filter, currentDate, nextDate);
                            }
                            $scope.filter.value = $filter('date')(new Date(), "dd/MM/yyyy");
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }


                    $scope.currentWeek = function (_CurrentWeek) {
                        try {
                            $scope.showCustomPopUp = undefined;
                            var currentDate = new Date();
                            var first = currentDate.getDate() - currentDate.getDay();
                            var last = first + 6;
                            var weekFirstDay = new Date(currentDate);
                            weekFirstDay.setDate(first);
                            var weekLastDay = new Date(currentDate);
                            weekLastDay.setDate(last);
                            $scope.filter.filter = {};
                            if (_CurrentWeek) {
                                $scope.showNavigationButtons = false;
                                $scope.filter.filter = {$function: "Functions.CurrentWeekFilter"};
                            } else {
                                $scope.showNavigationButtons = true;
                                var nextDate = new Date(weekLastDay.getFullYear(), weekLastDay.getMonth(), weekLastDay.getDate() + 1);
                                $scope.filter.__span__ = 'week';
                                $scope.setFilterDate($scope.filter, weekFirstDay, nextDate);
                            }
                            var label = $filter('date')(weekFirstDay, "dd/MM/yyyy") + " - " + $filter('date')(weekLastDay, "dd/MM/yyyy");
                            $scope.filter.value = label;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.currentYear = function (__currentYear__) {
                        try {
                            $scope.showCustomPopUp = undefined;
                            $scope.filter.filter = {};
                            if (__currentYear__) {
                                $scope.showNavigationButtons = false;
                                $scope.filter.filter = {$function: "Functions.CurrentYearFilter"};
                            } else {
                                $scope.showNavigationButtons = true;
                                var currentDate = new Date();
                                var firstDay = new Date(currentDate.getFullYear(), 0, 1, 0, 0, 0);
                                var lastDay = new Date(firstDay.getFullYear() + 1, 0, 1, 0, 0, 0);
                                $scope.filter.__span__ = 'year';
                                $scope.setFilterDate($scope.filter, firstDay, lastDay);
                            }
                            $scope.filter.value = $filter('date')(new Date(), "yyyy");
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    };

                    $scope.currentMonth = function (__currentMonth__) {
                        try {
                            $scope.showCustomPopUp = undefined;
                            var currentDate = new Date();
                            $scope.filter.filter = {};
                            if (__currentMonth__) {
                                $scope.showNavigationButtons = false;
                                $scope.filter.filter = {$function: "Functions.CurrentMonthFilter"};
                            } else {
                                $scope.showNavigationButtons = true;
                                $scope.filter.__span__ = 'month';
                                var monthFirstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                                var nextMonthFirstDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
                                $scope.setFilterDate($scope.filter, monthFirstDay, nextMonthFirstDate);
                            }
                            $scope.filter.value = $filter('date')(currentDate, "MMMM-yyyy");
                            $scope.initialFilterValue = $scope.filter.value;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.currentQuarter = function (__quarter__) {
                        try {
                            $scope.showCustomPopUp = undefined;
                            var currentDate = new Date();
                            $scope.filter.filter = {};
                            $scope.showNavigationButtons = true;
                            $scope.filter.__span__ = 'quarter';
                            var quarterInfo = $scope.getQuarter(currentDate, 0);
                            if (quarterInfo) {
                                $scope.setFilterDate($scope.filter, quarterInfo.quarterFirstDay, quarterInfo.nextQuarterFirstDate);
                                $scope.filter.value = $filter('date')(quarterInfo.quarterFirstDay, "MMMM-yyyy") + " - " + $filter('date')(quarterInfo.nextQuarterFirstDate - 1, "MMMM-yyyy");
                                $scope.initialFilterValue = $scope.filter.value;
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }

                        }
                    }

                    $scope.currentFilter = function () {
                        try {
                            $scope.showCustomPopUp = undefined;
                            $scope.currentDateOptions = [
                                {label: "Current Date", onClick: "currentDate"},
                                {label: "Current Month", onClick: "currentMonth"},
                                {label: "Current Year", onClick: "currentYear"},
                                {label: "Current Week", onClick: "currentWeek"}
                            ];
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.dateFilterOptions = [
                        {label: "Date", onClick: "currentDate"},
                        {label: "Week", onClick: "currentWeek"},
                        {label: "Month", onClick: "currentMonth"},
                        {label: "Quarter", onClick: "currentQuarter"},
                        {label: "Year", onClick: "currentYear"},
                        {label: "Custom", onClick: "customFilter"},
                        {label: "Last N days", onClick: "lastNDays"}
                    ];

                    $scope.populateCustomFilter = function () {
                        try {
                            if ($scope.filter.customFilter && $scope.filter.filterOptions) {
                                $scope.dateFilterOptions.push({label: $scope.filter.customFilter.label, onClick: "customFilterOptions", options: $scope.filter.filterOptions});
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.populateCustomFilter();

                    $scope.dateFilterNavigation = function (next) {
                        try {
                            var fieldValue = $scope.filter;
                            if (!fieldValue) {
                                return;
                            }
                            var filter = fieldValue.filter;
                            if (fieldValue.filter[fieldValue.field]) {
                                filter = fieldValue.filter[fieldValue.field];
                            }
                            var __span__ = fieldValue.__span__;
                            if (__span__ == "customRange") {
                                $scope.getNextPrevCustomRange(filter, next, $scope.filter);
                                return;
                            }
                            if (__span__ == "date") {
                                $scope.getNextPrevDate(filter, next);
                            } else if (__span__ == "month") {
                                $scope.getNextPrevMonth(filter, next);
                            } else if (__span__ == "year") {
                                $scope.getNextPrevYear(filter, next);
                            } else if (__span__ == "week") {
                                $scope.getNextPrevWeek(filter, next);
                            } else if (__span__ == "quarter") {
                                $scope.getNextPrevQuarter(filter, next);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.filter = $scope.filter || {};

                    $scope.getQuarter = function (currentDate, quarterOffset) {
                        try {
                            if (currentDate) {
                                var currentQuarter = (Math.ceil((currentDate.getMonth() + 1) / 3)) + quarterOffset;
                                var quarterFirstDay = new Date(currentDate.getFullYear(), (currentQuarter * 3) - 3, 1);
                                var nextQuarterFirstDate = new Date(currentDate.getFullYear(), (currentQuarter * 3), 1);
                                return {
                                    'quarterFirstDay': quarterFirstDay,
                                    'nextQuarterFirstDate': nextQuarterFirstDate
                                }
                            } else {
                                alert('current quarter value not defined>>>>');
                                return;
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.getNextPrevQuarter = function (filter, next) {
                        try {
                            var quarterOffset = 1;
                            if (!next) {
                                quarterOffset = -1;
                            }
                            var currentFilter = new Date(filter.$gte);
                            $scope.filter.filter = {};
                            var quarterInfo = $scope.getQuarter(currentFilter, quarterOffset);
                            if (quarterInfo) {
                                $scope.filter.filter = {};
                                $scope.setFilterDate($scope.filter, quarterInfo.quarterFirstDay, quarterInfo.nextQuarterFirstDate);
                                $scope.filter.value = $filter('date')(quarterInfo.quarterFirstDay, "MMMM-yyyy") + " - " + $filter('date')(quarterInfo.nextQuarterFirstDate - 1, "MMMM-yyyy");
                                $scope.initialFilterValue = $scope.filter.value;
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.getNextPrevWeek = function (filter, next) {
                        try {
                            var currentFilter = new Date(filter.$gte);
                            var first = currentFilter.getDate() - currentFilter.getDay();
                            first = next ? first += 7 : first -= 7;
                            var weekFirstDay = new Date(currentFilter);
                            weekFirstDay.setDate(first);
                            var weekLastDay = new Date(currentFilter);
                            weekLastDay.setDate(first + 6);
                            var nextDate = new Date(weekLastDay.getFullYear(), weekLastDay.getMonth(), weekLastDay.getDate() + 1);
                            $scope.filter.filter = {};
                            $scope.setFilterDate($scope.filter, weekFirstDay, nextDate);
                            $scope.filter.value = $filter('date')(weekFirstDay, "dd/MM/yyyy") + " - " + $filter('date')(weekLastDay, "dd/MM/yyyy");
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }

                        }
                    }
                    $scope.getNextPrevYear = function (filter, next) {
                        try {
                            var currentFilter = new Date(filter.$gte);
                            $scope.filter.filter = {};
                            if (next) {
                                var nextDate = new Date(currentFilter.getFullYear() + 1, currentFilter.getMonth(), currentFilter.getDate());
                                var nextToNextDate = new Date(nextDate.getFullYear() + 1, nextDate.getMonth(), nextDate.getDate());
                                $scope.setFilterDate($scope.filter, nextDate, nextToNextDate);
                                $scope.filter.value = $filter('date')(nextDate, "yyyy");
                            } else {
                                var prevDate = new Date(currentFilter.getFullYear() - 1, currentFilter.getMonth(), currentFilter.getDate());
                                var nextToPrevDate = new Date(prevDate.getFullYear() + 1, prevDate.getMonth(), prevDate.getDate());
                                $scope.setFilterDate($scope.filter, prevDate, nextToPrevDate);
                                $scope.filter.value = $filter('date')(prevDate, "yyyy");
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.getNextPrevMonth = function (filter, next) {
                        try {
                            var currentFilter = new Date(filter.$gte);
                            $scope.filter.filter = {};
                            if (next) {
                                var nextDate = new Date(currentFilter.getFullYear(), currentFilter.getMonth() + 1, currentFilter.getDate());
                                var nextToNextDate = new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, nextDate.getDate());
                                $scope.setFilterDate($scope.filter, nextDate, nextToNextDate);
                                $scope.filter.value = $filter('date')(nextDate, "MMMM-yyyy");
                            } else {
                                var prevDate = new Date(currentFilter.getFullYear(), currentFilter.getMonth() - 1, currentFilter.getDate());
                                var nextToPrevDate = new Date(prevDate.getFullYear(), prevDate.getMonth() + 1, prevDate.getDate());
                                $scope.setFilterDate($scope.filter, prevDate, nextToPrevDate);
                                $scope.filter.value = $filter('date')(prevDate, "MMMM-yyyy");
                            }
                            $scope.initialFilterValue = $scope.filter.value;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.getNextPrevDate = function (filter, next) {
                        try {
                            var currentFilter = new Date(filter.$gte);
                            $scope.filter.filter = {};
                            if (next) {
                                var nextDate = new Date(currentFilter.getFullYear(), currentFilter.getMonth(), currentFilter.getDate() + 1);
                                var nextToNextDate = new Date(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate() + 1);
                                $scope.setFilterDate($scope.filter, nextDate, nextToNextDate);
                                $scope.filter.value = $filter('date')(nextDate, "dd/MM/yyyy");
                            } else {
                                var prevDate = new Date(currentFilter.getFullYear(), currentFilter.getMonth(), currentFilter.getDate() - 1);
                                var nextToPrevDate = new Date(prevDate.getFullYear(), prevDate.getMonth(), prevDate.getDate() + 1);
                                $scope.setFilterDate($scope.filter, prevDate, nextToPrevDate);
                                $scope.filter.value = $filter('date')(prevDate, "dd/MM/yyyy");
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.lastNDays = function () {
                        try {
                            $scope.dateWrapper = undefined;
                            $scope.showCustomPopUp = undefined;
                            $scope.currentDateOptions = undefined;
                            $scope.showNDaysPopUp = !$scope.showNDaysPopUp;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.selectDateFilterOptions = function (option) {
                        try {
                            if (option && option.onClick) {
                                $scope[option.onClick](false, option.options);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.selectCurrentFilterOptions = function (option) {
                        try {
                            $scope.dateWrapper = true;
                            if (option && option.onClick) {
                                $scope[option.onClick](true);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.$watch('filter.fieldValue', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            $scope.filter.filter = {};
                            $scope.filter.__span__ = 'date';
                            $scope.showNavigationButtons = true;
                            var nextDate = new Date(newValue.getFullYear(), newValue.getMonth(), newValue.getDate() + 1);
                            $scope.setFilterDate($scope.filter, newValue, nextDate);
                            $scope.filter.value = $filter('date')(newValue, "dd/MM/yyyy");
                        }
                    }, true);


                    var template = "<pl-date-filter-options></pl-date-filter-options>";
                    $scope.showOptions = function ($event) {
                        try {
                            var popupScope = $scope.$new();
                            var p = new Popup({
                                autoHide: true,
                                hideOnClick: true,
                                deffered: true,
                                escEnabled: true,
                                html: $compile(template)(popupScope),
                                scope: popupScope,
                                element: $event.target,
                                position: "bottom",
                                addInElement: false
                            });
                            p.showPopup();
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    var filter = $scope.filter.filter;
                    if (filter == "_CurrentDate") {
                        $scope.currentDate(false);
                    }

                    if (filter == "_CurrentWeek") {
                        $scope.currentWeek(false);
                    }

                    if (filter == "_CurrentMonth") {
                        $scope.currentMonth(false);
                    }

                    if (filter == "_CurrentYear") {
                        $scope.currentYear(false);
                    }

                    if ($scope.filter.__span__ && $scope.filter.__span__ != 'manual') {
                        $scope.showNavigationButtons = true;
                    }
                    if ($scope.filter.filter) {
                        if ($scope.filter.filter[$scope.filter.field] == "$$CurrentDateFilter") {
                            $scope.currentDate();
                        } else if ($scope.filter.filter[$scope.filter.field] == "$$CurrentWeekFilter") {
                            $scope.currentWeek();
                        } else if ($scope.filter.filter[$scope.filter.field] == "$$CurrentMonthFilter") {
                            $scope.currentMonth();
                        } else if ($scope.filter.filter[$scope.filter.field] == "$$CurrentQuarterFilter") {
                            $scope.currentQuarter();
                        } else if ($scope.filter.filter[$scope.filter.field] == "$$CurrentYearFilter") {
                            $scope.currentYear();
                        }
                    }
                }
            };
        }
    }
}]);

pl.directive('plDateFilterOptions', ['$compile', '$filter', function ($compile, $filter) {
    return {
        restrict: "E",
        template: "<ul class='pl-padding-none' style='min-width: 120px;'>" +
            "       <li class='pl-current-filter' style='display: none;'>Current" +
            "         <ul ng-show='currentDateOptions' class='pl-current-filter-options pl-padding-none'>" +
            "           <li class='pl-current-filter-option' ng-repeat='option in currentDateOptions' ng-click='selectCurrentFilterOptions(option)' ng-bind='option.label'></li>" +
            "         </ul>" +
            "       </li>" +
            "       <li class='pl-current-filter-option' ng-repeat='option in dateFilterOptions' ng-click='selectDateFilterOptions(option)' ng-bind='option.label'></li>" +
            "</ul>",

        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.currentFilter();
                }
            };
        }
    }
}]);

pl.directive('plCustomFilter', ['$compile', '$filter', function ($compile, $filter) {
    return {
        restrict: "E",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement) {
                    var template = " <div class='pl-custom-date-filter-div-parent'>" +
                        "                 <input type='text' ng-blur='handleFromKeyUp()' ng-model='filter.fromValue' class='pl-custom-date-filter-div' placeholder='From' />" +
                        "                 <input ng-if='filter.time' style='border:none; width: 60px; border-left:1px solid #CCCCCC; float: left;' placeholder='hh:mm' class='form-control' data-container='body' type='text' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' class='form-control' ng-model='filter.from' bs-timepicker />" +
                        "                 <input class='app-grid-date-picker-calender-image app-float-left' tabindex='-1' type='text' data-trigger='focus' ng-model='filter.from'  data-animation='am-flip-x' data-date-format='dd/MM/yyyy' bs-datepicker />" +
                        "            </div>" +
                        "            <div class='pl-custom-date-filter-div-parent'>" +
                        "                 <input type='text' ng-blur='handleToKeyUp()' ng-model='filter.toValue' class='pl-custom-date-filter-div' placeholder='To'/>" +
                        "                 <input ng-if='filter.time' style='border:none; width: 60px; border-left:1px solid #CCCCCC; float: left;' placeholder='hh:mm' class='form-control' data-container='body' type='text' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' class='form-control' ng-model='filter.to' bs-timepicker />" +
                        "                 <input class='app-grid-date-picker-calender-image app-float-left' tabindex='-1' type='text' data-trigger='focus' ng-model='filter.to'  data-animation='am-flip-x' data-date-format='dd/MM/yyyy' bs-datepicker />" +
                        "            </div>";

                    iElement.append($compile(template)($scope));
                    function getValidDate(value) {
                        if (!value) {
                            return;
                        }
                        var split = value.split("/");
                        if (split && split.length == 3) {
                            var date = new Date(split[2] + "-" + split[1] + "-" + split[0]);
                            if (!isNaN(Date.parse(date))) {
                                return date;
                            }
                        } else {
                            var isAprilOrAugust = /a(p|u)/.test(value);
                            if (isAprilOrAugust) {
                                value = value.replace(/a/g, "/a");
                            }
                            var date = Date.parse(value);
                            return date;
                        }

                    }

                    $scope.handleFromKeyUp = function () {
                        try {
                            var value = $scope.filter.fromValue;
                            if (!value || value.toString().length == 0) {
                                return;
                            }
                            var filterValue = $scope.filter;
                            if (value) {
                                var date = getValidDate(value);
                                if (angular.isDefined(date)) {
                                    filterValue.from = date;
                                    filterValue.fromValue = $filter('date')(date, "dd/MM/yyyy");
                                    if (filterValue.toValue && filterValue.fromValue) {
                                        $scope.applyCustomFilter();
                                    }
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }

                        }
                    }
                    $scope.handleToKeyUp = function () {
                        try {
                            var value = $scope.filter.toValue;
                            var filterValue = $scope.filter;
                            if (!value || value.toString().length == 0) {
                                return;
                            }
                            if (value) {
                                var date = getValidDate(value);
                                filterValue.to = date;
                                if (angular.isDefined(date)) {
                                    filterValue.toValue = $filter('date')(date, "dd/MM/yyyy");
                                    if (filterValue.toValue && filterValue.fromValue) {
                                        $scope.applyCustomFilter();
                                    }
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.$watch('filter.from', function (newValue, oldValue) {
                        if (newValue && !angular.equals(newValue, oldValue)) {
                            $scope.filter.fromValue = $filter('date')($scope.filter.from, "dd/MM/yyyy");
                            if ($scope.filter.toValue && $scope.filter.fromValue) {
                                $scope.applyCustomFilter();
                            }
                        }
                    }, true);

                    $scope.$watch('filter.to', function (newValue, oldVlaue) {
                        if (!angular.equals(newValue, oldVlaue)) {
                            $scope.filter.toValue = $filter('date')($scope.filter.to, "dd/MM/yyyy");
                            if ($scope.filter.toValue && $scope.filter.fromValue) {
                                $scope.applyCustomFilter();
                            }
                        }
                    }, true);


                    $scope.applyCustomFilter = function () {
                        try {
                            $scope.showNavigationButtons = undefined;
                            var filterValue = $scope.filter;
                            var from = filterValue.from;
                            var to = filterValue.to;
                            if (filterValue && to && from) {
                                $scope.filter.filter = {};
                                var nextDate = filterValue.time ? to : new Date(to.getFullYear(), to.getMonth(), to.getDate() + 1);
                                $scope.filter.__span__ = 'rangeFilter';
                                $scope.setFilterDate($scope.filter, from, nextDate);
                                delete $scope.filter.__span__;
                                $scope.filter.value = $filter('date')(from, filterValue.time ? "dd/MM/yyyy hh:mm a" : "dd/MM/yyyy") + " - " + $filter('date')(to, filterValue.time ? "dd/MM/yyyy hh:mm a" : "dd/MM/yyyy");
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }

                        }
                    }
                }
            };
        }
    }
}]);

pl.directive('plNDaysFilter', ['$compile', '$filter', function ($compile, $filter) {
    return {
        restrict: "E",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement) {
                    var template = "<input type='text' ng-blur='nLastDaysFilter()' ng-model='filter.lastNDays' placeholder='Days' class='pl-ndays-input'/>";
                    iElement.append($compile(template)($scope));

                    $scope.nLastDaysFilter = function () {
                        try {
                            var filterValue = $scope.filter;
                            if (filterValue.lastNDays > 0) {
                                if (filterValue) {
                                    var days = filterValue.lastNDays;
                                    var currentDate = new Date();
//                            currentDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                                    var nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1);

                                    var dateObj = new Date();
                                    dateObj = new Date(dateObj.setDate(dateObj.getDate() - days));
                                    dateObj = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
                                    filterValue.filter = {};
                                    $scope.setFilterDate($scope.filter, dateObj, nextDate);
                                    filterValue.value = $filter('date')(dateObj, "dd/MM/yyyy") + " - " + $filter('date')(currentDate, "dd/MM/yyyy");
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }

                        }
                    }
                }
            };
        }
    }
}]);

pl.directive('plJson', function () {
    return {
        restrict: 'A',
        priority: 1,
        require: 'ngModel',
        link: function (scope, element, attrs, ngModel) {
            if (!ngModel) {
                return;
            }

            ngModel.$render = function () {
                try {
                    var value = ngModel.$viewValue;
                    if (value) {
                        element.val(JSON.stringify(value));
                    }
                } catch (e) {
                    if ($scope.handleClientError) {
                        $scope.handleClientError(e);
                    }
                }
            };

            scope.onblur = function () {
                try {
                    var val = element.val();
                    if (val && val.trim().length > 0) {
                        ngModel.$setViewValue(JSON.parse(val.trim()));
                    } else {
                        ngModel.$setViewValue(undefined);
                    }
                } catch (e) {
                    if (scope.handleClientError) {
                        scope.handleClientError(e);
                    }
                }

            };
            element.unbind('input').unbind('change').unbind('keydown');
        }
    };
});

pl.directive('plFts', ['$compile', '$timeout', function ($compile, $timeout) {
    return {
        restrict: "E",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    var ftsInfo = $scope.$eval(attrs.info);
                    if (!ftsInfo) {
                        return;
                    }
                    var template = "<div  class='app-float-left fts-search'>" +
                        "   <div class='search flex'>" +
                        "   <input type='text' placeholder='Enter Search Text' class='app-float-left pl-search-text' /> " +
                        "   <div class='app-float-left' style='width: 22px;'>" +
                        "       <div class='app-float-left cross-image app-cursor-pointer' ng-show='ftsCross' title='Remove' ng-click='removeFtsSearch()'><i class='icon-remove'></i></div>" +
                        "   </div>   " +
                        "   <div class='app-float-left image app-cursor-pointer' ng-click='search(true)' title='Click here to search.' ></div>" +
                        "   </div>" +
                        "</div>";
                    iElement.append($compile(template)($scope));

                    iElement.find('input.pl-search-text').bind('keydown', function (e) {
                        var val = iElement.find('input.pl-search-text').val();
                        if (!val || angular.isUndefined(val) || val.toString().trim().length == 0) {
                            return;
                        }
                        if (e.keyCode == 13) {
                            $scope.search();
                            iElement.find('input').blur();
                        }
                    });

                    $scope.removeFtsSearch = function () {
                        try {
                            $scope[ftsInfo.onClick](undefined);
                            $scope.ftsCross = false;
                            iElement.find('input.pl-search-text').val('');
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.search = function (bySearch) {
                        try {
                            var responsiveFts = attrs.class;
                            var val = iElement.find('input.pl-search-text').val();
                            if (responsiveFts && bySearch) {
                                var ftsBox = iElement.find('.fts-search');
                                if (!$scope.expanded || $scope.expanded == false) {
                                    ftsBox.css({'width': '180px'});
                                    $scope.expanded = true;
                                    return;
                                } else {
                                    if (val == '') {
                                        ftsBox.css({'width': '30px'});
                                        $scope.expanded = false;
                                    }
                                }
                            }

                            if (!val || angular.isUndefined(val) || val.toString().trim().length == 0) {
                                return;
                            }
                            if (angular.isDefined(val)) {
                                var textToSearch = val.toString().trim();
                                if (textToSearch && textToSearch.length > 0) {
                                    if (ftsInfo.clientSearchInfo) {
                                        ftsInfo.clientSearchInfo.value = val;
                                    } else {
                                        $scope[ftsInfo.onClick](val);
                                        $scope.ftsCross = true;
                                    }
                                    $timeout(function () {
                                        iElement.find('input.pl-search-text').focus();
                                    }, 0)
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }
                            } else {
                                alert("Invalid Search Field");
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                }
            };
        }
    }
}]);

pl.directive('plAutocomplete', ['$compile', '$timeout', function ($compile, $timeout) {
    return {
        restrict: "E",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    var model = attrs.model;
                    var options = $scope.$eval(attrs.options);
                    var field = $scope.$eval(attrs.field);
                    var multiple = attrs.multiple;
                    var template = "";
                    var otherdisplayfields = attrs.otherdisplayfields;
                    var displayField = attrs.upsert;
                    var placeholder = attrs.placeholder || '';
                    var title = attrs.title || '';
                    if (multiple) {
                        var style = 'width: 20px;';
                        if (attrs.upsert) {
                            style += ' right:20px;';
                        }
                        var viewUI = attrs.viewui;
                        var displayRenderer = attrs.displayrenderer || "";
                        var editorModelField = attrs.editormodelfield || "";
                        var displayEditor = attrs.displayeditor || "";
                        var schedule = attrs.schedule;

                        template = "<div style='margin-right: 40px;'><div class='app-multiple-values' ng-repeat='value in " + model + "'>" +
                            "           <span class='value' ng-bind='value" + displayRenderer + "'></span>" +
//                            "           <span ng-repeat='otherCol in col.otherDisplayFields' ng-show='value[otherCol]'> | {{value[otherCol]}}</span>" +
                            "           <span pl-remove-value ng-model=" + model + " ng-click='remove($index, $event)' class='cross'><i class='icon-remove'></i></span>" +
                            "       </div></div>" +
                            "       <input ng-class='{\"error\":row.validations." + field.field + "}' style='clear: both;' title='" + title + "' data-container='body' data-upsert='" + displayField + "' data-other-display-fields='" + otherdisplayfields + "' class='form-control' placeholder='" + placeholder + "' ng-model=" + model + " data-multiple='true'  data-animation='am-flip-x' ng-options='" + options + "' bs-typeahead type='text' />" +
                            "       <input class='second-input' ng-class='{\"pl-full-right\":" + multiple + "}' type='text' tabindex='-1' style='" + style + "' >" +
                            "       <img src='../images/loading.gif' class='pl-loading-image' ng-show='loadingImage' />" +
                            "       <span ng-show='col.upsertView' class='pl-upsert' ng-click='handleLookupUpsert(" + attrs.field + ".field)'>&plus;</span>";

                        if (viewUI == 'grid') {
                            template = "<div class='pl-typeahead-wrapper' ng-class='{\"pl-schedule-template\":schedule}'>" +
                                "                           <div class='pl-typeahead-cell'>" +
                                template +
                                "                           </div>" +
                                "                        </div>";

                        } else if (viewUI == 'form') {
                            template = "  <div class='app-float-left app-white-backgroud-color app-width-full app-border left-full form-template pl-auto-multiple'>" +
                                template +
                                "                           </div>";
                        }
                    } else {
                        var validationDisplay = attrs.validationdisplay;
                        if (field.type === "fk") {
                            template = "<input title='" + title + "' ng-class='{\"error\":row.validations." + validationDisplay + "}' data-container='body' data-other-display-fields='" + otherdisplayfields + "' placeholder='" + placeholder + "' class='form-control' data-upsert='" + displayField + "' ng-model=" + model + "  data-animation='am-flip-x' ng-options='" + options + "' bs-typeahead type='text' />"
                        } else {
                            template = "<input title='" + title + "' ng-class='{\"error\":row.validations." + field.field + "}' data-container='body' data-other-display-fields='" + otherdisplayfields + "' placeholder='" + placeholder + "' class='form-control' data-upsert='" + displayField + "' ng-model=" + model + "  data-animation='am-flip-x' ng-options='" + options + "' bs-typeahead type='text' />"
                        }
                        template += "<input class='second-input' ng-class='{\"pl-full-right\":!" + field.upsertView + "}' type='text' tabindex='-1' style='width:20px;' >" +
                            "<img src='../images/loading.gif' class='pl-loading-image' ng-show='loadingImage' />" +
                            "<span ng-show='" + field.upsertView + "' class='pl-upsert' ng-click='handleLookupUpsert(" + attrs.field + ".field)'>&plus;</span>";
                    }


                    iElement.append($compile(template)($scope));
                }
            };
        }
    }
}]);

pl.directive('plDatePicker', ['$compile', '$filter', function ($compile, $filter) {
    return {
        restrict: "E",
        replace: true,

        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.model = attrs.model;
                    $scope.field = attrs.field;
                    var placeholder = attrs.placeholder || '';
                    var modelExpression = $scope.model + "." + $scope.field;
                    var schedule = attrs.schedule;
                    var title = attrs.title || '';

                    var template = "<div class='pl-date-picker'>";


                    if (schedule) {
                        var nextRunOnExpression = $scope.model + "." + $scope.field + ".nextDueOn";
                        template += "<pl-date-time class='pl-schedule-parent' bind='" + nextRunOnExpression + "' title='Next Due On' placeholder='Next Due On'></pl-date-time>" +
//                            "<input data-animation='am-flip-x' title='" + title + "' data-container='body' placeholder='" + placeholder + "'  type='text' ng-model='" + nextRunOnExpression + "' bs-datepicker  data-date-format='dd/MM/yyyy' />" +
                            "       <input type='text' class='app-schedule-image app-border-none-important' tabindex='-1' ng-click='showSchedule()'/>" +
                            "       <pl-schedule-drop-down field='" + attrs.field + "' placeholder='" + placeholder + "' ng-show='schedule' class='app-float-left app-width-full' style='z-index:25;'></pl-schedule-drop-down>";

                    } else {
                        template += "<input ng-class='{\"error\":row.validations." + $scope.field + "}' data-animation='am-flip-x' title='" + title + "' data-container='body' placeholder='" + placeholder + "'  type='text' ng-model='" + modelExpression + "' bs-datepicker  data-date-format='dd/MM/yyyy' />" +
                            "        <input class='app-grid-date-picker-calender-image app-float-right pl-right-calender' tabindex='-1' data-container='body' type='text' ng-model='" + modelExpression + "' data-trigger='focus' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' bs-datepicker />";
//                            "    <input data-container='body' class='pl-datepicker-image'  type='text' ng-model='" + modelExpression + "'  data-animation='am-flip-x' data-date-format='dd/MM/yyyy' bs-datepicker data-date-format='dd/MM/yyyy' />";
                    }


                    template += "</div>";

                    iElement.append($compile(template)($scope));


                },
                post: function ($scope, iElement, attrs) {
                    $scope.showSchedule = function () {
                        try {
                            $scope.schedule = !$scope.schedule;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                }
            };
        }
    }
}]);

pl.directive('plSetDateValue', ['$timeout', '$filter', function ($timeout, $filter) {
    return {
        restrict: 'A',
        require: 'ngModel',
        link: function (scope, elm, attr, controller) {
            $timeout(function () {
                if (controller.$modelValue) {
                    elm.val($filter('date')(controller.$modelValue, "dd/MM/yyyy"));
                }
            }, 0);


            elm.bind("keyup", function ($event) {
//                elm.val($filter('date')(controller.$modelValue, "dd/MM/yyyy"));
                scope.handleKeyDown($event);
            });

            elm.bind('blur', function () {
//                var elementValue = elm.val();
//                var dateRegex = /^(\d{1,2})(\/|-)(\d{1,2})(\/|-)(\d{4})$/;
//                var isDate = dateRegex.test(elementValue);
//                var temp = '';
//                if (!isDate) {
//                    temp = Date.parse(elementValue);
//
//                } else {
//                    temp = Date.parse(elementValue).toString("dd/MM/yyyy");
//                    temp = Date.parse(new Date(temp).toUTCString());
//                }
//
//                if (angular.isString(elementValue) && elementValue.toString().trim().length > 0) {
//                    controller.$setViewValue(temp);
//                }
            });

            scope.handleKeyDown = function ($event) {
                try {
                    if ($event.keyCode == 27) {
                        return;
                    }
                    return;
                    var elementValue = elm.val();
                    if (elementValue && elementValue.toString().trim().length > 0) {
                        scope.setValueInModel(elementValue);
                    }
                } catch (e) {
                    if (scope.handleClientError) {
                        scope.handleClientError(e);
                    }
                }
            }

            scope.$watch(attr.ngModel, function (newValue, oldValue) {
                if (newValue && typeof newValue == 'object') {
                    elm.val($filter('date')(controller.$modelValue, "dd/MM/yyyy"));
                    scope.setValueInModel(newValue);
                }
            });

            scope.setValueInModel = function (value) {
                try {
                    var splitValue = value.toString().split("/");
                    if (splitValue && splitValue.length == 3) {
//                    var dateObj = new Date(splitValue[2] + "-" + splitValue[1] + "-" + splitValue[0]);
//                    if (!isNaN(Date.parse(dateObj))) {
//                        controller.$setViewValue(dateObj);
//                    }
                        var date = Date.parse(elm.val());
                        if (date !== null) {
                            elm.val(date.toString("dd/MM/yyyy"));
                            controller.$setViewValue(date.toString("dd/MM/yyyy hh:mm:ss tt"));
                        }
                    }
                } catch (e) {
                    if (scope.handleClientError) {
                        scope.handleClientError(e);
                    }
                }

            }

        }
    };
}]);

pl.directive('plScheduleDropDown', ["$compile", "$filter", function ($compile, $filter) {
    return {
        restrict: "E",
        replace: true,
        scope: true,
        compile: function () {
            return  {
                pre: function ($scope, iElement, attrs) {
                    var model = $scope.model;
                    var field = attrs.field;
                    var frequency = 'frequency';
                    var time = 'time';
                    var componentModel = model + "." + field;
                    var monthDays = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24", "25", "26", "27", "28", "29", "30", "31"];
                    $scope.spanField = {options: ["None", "Minutely", "Hourly", "Daily", "Weekly", "Monthly", "Yearly"]};
                    $scope.frequency = angular.copy(monthDays);
                    var spanValue = componentModel + ".repeats";
                    $scope.repeatOn = $scope.repeatOn || {};
                    $scope.repeatEvery = {"options": angular.copy(monthDays)};

                    $scope.$watch(spanValue, function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue) && angular.isDefined(newValue)) {
                            if (newValue == 'Weekly') {
                                $scope.repeatOn.options = ["Mon", "Tue", "Wed", "Thr", "Fri", "Sat", "Sun"];
                            } else if (newValue == 'Yearly') {
                                $scope.repeatOn.options = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                            } else if (newValue == 'Monthly') {
                                $scope.repeatOn.options = angular.copy(monthDays);
                            }
                            var repeatOnValue = $scope.$eval(componentModel + ".repeatOn");
                            if (repeatOnValue) {
                                var componentValue = $scope.$eval(componentModel);
                                componentValue.repeatOn = [];
                            }
                        }
                    }, true);


                    var template = "      <div class='pl-schedule-wrapper' >" +
                        "                   <div class='app-padding-top-bottom-five-px' >" +
                        "                       <div id='firstElement' class='app-position-relative app-border'>" +
                        "                            <pl-autocomplete options='\"data as data for data in getLookupData($viewValue,spanField,$fetchAllData)\"' data-title='Repeats' data-placeholder='Repeats' field='spanField' model='" + componentModel + ".repeats'  ></pl-autocomplete>" +
                        "                       </div>" +
                        "                   </div>" +
                        "                   <div class='app-padding-top-bottom-five-px' ng-show='" + spanValue + " == \"Yearly\" || " + spanValue + " == \"Monthly\" || " + spanValue + " == \"Weekly\"'>" +
                        "                       <div class='app-position-relative app-border'>" +
                        "                           <pl-autocomplete viewui='grid' data-multiple='true' data-title='Repeat On' data-schedule='true' options='\"data as data for data in getLookupData($viewValue,repeatOn,$fetchAllData)\"' data-placeholder='Repeat On' field='repeatOn' model='" + componentModel + ".repeatOn'  ></pl-autocomplete>" +
                        "                       </div>" +
                        "                   </div>" +
                        "                   <div class='app-padding-top-bottom-five-px' ng-show='" + spanValue + " != \"None\"'>" +
                        "                       <div class='app-position-relative app-border' >" +
                        "                           <pl-autocomplete viewui='grid' options='\"data as data for data in getLookupData($viewValue,repeatEvery,$fetchAllData)\"' data-title='Repeat Every' data-placeholder='Repeat Every' field='repeatEvery' model='" + componentModel + ".repeatEvery'  ></pl-autocomplete>" +
                        "                       </div>" +
                        "                   </div>" +
                        "                   <div class='app-padding-top-bottom-five-px' ng-show='" + spanValue + " != \"None\"'>" +
                        "                       <pl-date-time bind='" + model + "." + field + ".startsOn' title='Starts On' placeholder='Starts On'></pl-date-time> " +
                        "                   </div>" +
                        "                   <div class='app-padding-top-bottom-five-px' ng-show='" + spanValue + " != \"None\"'>" +
                        "                       <pl-date-time bind='" + model + "." + field + ".nextDueOn' title='Next Due On' placeholder='Next Due On' ></pl-date-time> " +
                        "                   </div>" +
                        "                   <div class='app-padding-top-bottom-five-px'>" +
                        "                       <span class='app-border pl-apply-button'  ng-click='$parent.showSchedule()' style='color: #383838; padding: 3px 8px;'><i class='icon-ok'></i></span>" +
                        "                   </div>" +
                        "               </div>";

                    $(iElement).append($compile(template)($scope))
                }
            }
        }
    }
}]);

pl.directive('plDateTime', ['$compile', function ($compile) {
    return{
        restrict: "AEC",
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                    var bindTo = attrs.bind;
                    var title = attrs.title || '';
                    var placeholder = attrs.placeholder;
                    template = "<div  class='app-position-relative app-border' >" +
                        "      <div class='app-display-table-cell' style='width:65%;border-right: 1px solid #ccc;'>" +
                        "          <input class='form-control' title='" + title + "' placeholder='" + placeholder + "' data-container='body' type='text' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' class='form-control' ng-model='" + bindTo + "' bs-datepicker />" +
                        "      </div>" +
                        "      <div class='app-display-table-cell app-vertical-align-top' style='width:35%;'>" +
                        "          <input class='form-control' placeholder='hh:mm' data-container='body' type='text' data-animation='am-flip-x' data-date-format='dd/MM/yyyy' class='form-control' ng-model='" + bindTo + "' bs-timepicker />" +
                        "      </div>" +
                        " </div>";
                    iElement.append($compile(template)($scope));
                }
            }
        }
    }
}]);

pl.directive('plDropDown', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: "AE",
        replace: true,
        scope: false,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                    $scope.dropdownOptions = $scope.$eval(attrs.plDropDown);
                    if ($scope.dropdownOptions.length > 0) {
                        $scope.selectedIndex = attrs.selectedindex;
                        if ($scope.dropdownOptions[0].label) {
                            var template = "<div ng-click=\"parentRowAction($event)\" title={{dropdownOptions[selectedIndex].label}} class=\"pl-panel-label icon-caret-right-down \"  >" +
                                "           {{dropdownOptions[selectedIndex].label}} " +
                                "</div>";
                            iElement.append($compile(template)($scope));
                        }
                    }
                }
            }
        }
    }
}]);

pl.directive('pageslide', ['$timeout',
    function ($timeout) {
        var defaults = {};

        /* Return directive definition object */

        return {
            restrict: "EA",
            replace: false,
            transclude: false,
            scope: {
                psOpen: "=?"
            },
            link: function ($scope, el, attrs) {
                /* Inspect */
                //console.log($scope);
                //console.log(el);
                //console.log(attrs);

                /* parameters */
                var param = {};
                param.side = attrs.pageslide || 'left';
                param.speed = attrs.psSpeed || '0.5';
                param.size = attrs.psSize || '300px';
                param.className = attrs.psClass || 'ng-pageslide';

                /* DOM manipulation */
                var content = null;
                if (!attrs.href && el.children() && el.children().length) {
                    content = el.children()[0];
                } else {
                    content = (attrs.href) ? document.getElementById(attrs.href.substr(1)) : document.getElementById(attrs.psTarget.substr(1));
                }

                // Check for content
                if (!content)
                    throw new Error('You have to elements inside the <pageslide> or you have not specified a target href');
                var sliderWrapper = document.getElementsByClassName('pl-pageslide-wrapper');
                sliderWrapper[0].className = 'slider-wrapper pl-pageslide-wrapper';
                var slider = document.createElement('div');
                slider.className = param.className;
                /* Style setup */
                sliderWrapper[0].style.transition = 'all ' + param.speed + 's cubic-bezier(0.25, 0.8, 0.25, 1)';
                sliderWrapper[0].style.zIndex = 1000;
                sliderWrapper[0].style.position = 'fixed';
                sliderWrapper[0].style.left = 0;
                sliderWrapper[0].style.top = 0;
                sliderWrapper[0].style.bottom = 0;
                sliderWrapper[0].style.right = 0;
                sliderWrapper[0].style.width = 0;
                sliderWrapper[0].style.background = 'rgba(255, 255, 255, 0.7)';

                slider.style.transition = 'all ' + param.speed + 's cubic-bezier(0.25, 0.8, 0.25, 1)';
                slider.style.zIndex = 1000;
                slider.style.position = 'fixed';
                slider.style.width = "300px";
                slider.style.height = 0;
                slider.style.overflowY = 'auto';
                slider.style.background = 'rgb(75,93,103)';
                slider.style.transform = 'translate3d(-100%,0,0) scale(01)';
                switch (param.side) {
                    case 'right':
                        slider.style.height = attrs.psCustomHeight || '100%';
                        slider.style.top = attrs.psCustomTop || '0px';
                        slider.style.bottom = attrs.psCustomBottom || '0px';
                        slider.style.right = attrs.psCustomRight || '0px';
                        break;
                    case 'left':
                        slider.style.height = attrs.psCustomHeight || '100%';
                        slider.style.top = attrs.psCustomTop || '0px';
                        slider.style.bottom = attrs.psCustomBottom || '0px';
                        slider.style.left = attrs.psCustomLeft || '0px';
                        break;
                    case 'top':
                        slider.style.width = attrs.psCustomWidth || '100%';
                        slider.style.left = attrs.psCustomLeft || '0px';
                        slider.style.top = attrs.psCustomTop || '0px';
                        slider.style.right = attrs.psCustomRight || '0px';
                        break;
                    case 'bottom':
                        slider.style.width = attrs.psCustomWidth || '100%';
                        slider.style.bottom = attrs.psCustomBottom || '0px';
                        slider.style.left = attrs.psCustomLeft || '0px';
                        slider.style.right = attrs.psCustomRight || '0px';
                        break;
                }

                /* Append */
                document.body.appendChild(sliderWrapper[0]);
                sliderWrapper[0].appendChild(slider);
                slider.appendChild(content);

                /* Closed */
                function psClose(slider, param) {
                    if (slider.style.width !== 0 && slider.style.width !== 0) {
                        slider.style.transform = 'translate3d(-300px,0,0) scale(01)';
                        slider.style['-webkit-transform'] = 'translate3d(-300px,0,0) scale(01)';
                        slider.style['-moz-transform'] = 'translate3d(-300px,0,0) scale(01)';
                        slider.style['-o-transform'] = 'translate3d(-300px,0,0) scale(01)';
                        slider.style['-ms-transform'] = 'translate3d(-300px,0,0) scale(01)';
                        sliderWrapper[0].style.width = 0;
                        content.style.display = 'none';
                        switch (param.side) {
                            case 'right':
                                slider.style.width = '0px';
                                break;
                            case 'left':
                                slider.style.left = '0px';
                                break;
                            case 'top':
                                slider.style.height = '0px';
                                break;
                            case 'bottom':
                                slider.style.height = '0px';
                                break;
                        }
                    }
                    $scope.psOpen = false;
                }

                /* Open */
                function psOpen(slider, param) {
                    if (slider.style.width !== 0 && slider.style.width !== 0) {
                        slider.style.transform = 'translate3d(0%,0,0) scale(01)';
                        slider.style['-webkit-transform'] = 'translate3d(0,0,0) scale(01)';
                        slider.style['-moz-transform'] = 'translate3d(0,0,0) scale(01)';
                        slider.style['-o-transform'] = 'translate3d(0,0,0) scale(01)';
                        slider.style['-ms-transform'] = 'translate3d(0,0,0) scale(01)';
                        sliderWrapper[0].style.width = 'auto';
                        switch (param.side) {
                            case 'right':
                                slider.style.width = param.size;
                                break;
                            case 'left':
                                slider.style.width = param.size;
                                break;
                            case 'top':
                                slider.style.height = param.size;
                                break;
                            case 'bottom':
                                slider.style.height = param.size;
                                break;
                        }
                        setTimeout(function () {
                            content.style.display = 'block';
                        }, (param.speed * 100));

                    }
                }

                /*
                 * Watchers
                 * */

                $scope.$watch("psOpen", function (value) {
                    if (!!value) {
                        // Open
                        psOpen(slider, param);
                    } else {
                        // Close
                        psClose(slider, param);
                    }
                });

                // close panel on location change
                if (attrs.psAutoClose) {
                    $scope.$on("$locationChangeStart", function () {
                        psClose(slider, param);
                    });
                    $scope.$on("$stateChangeStart", function () {
                        psClose(slider, param);
                    });
                }


                /*
                 * Events
                 * */

                $scope.$on('$destroy', function () {
                    document.body.removeChild(slider);
                });

                var close_handler = (attrs.href) ? document.getElementById(attrs.href.substr(1) + '-close') : null;
                if (el[0].addEventListener) {
                    el[0].addEventListener('click', function (e) {
                        e.preventDefault();
                        psOpen(slider, param);
                    });

                    if (close_handler) {
                        close_handler.addEventListener('click', function (e) {
                            e.preventDefault();
                            psClose(slider, param);
                        });
                    }
                } else {
                    // IE8 Fallback code
                    el[0].attachEvent('onclick', function (e) {
                        e.returnValue = false;
                        psOpen(slider, param);
                    });

                    if (close_handler) {
                        close_handler.attachEvent('onclick', function (e) {
                            e.returnValue = false;
                            psClose(slider, param);
                        });
                    }
                }

            }
        };
    }
]);

pl.directive('plPageslideWrapper', ['$compile', function ($compile) {
    return{
        restrict: 'C',
        link: function ($scope, iElement, attrs) {
            document.body.onkeydown = function (evt) {
                if (evt.keyCode == 27) {
                    $scope.workbenchOptions.enableSliderMenu = undefined;
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }
            };
            iElement.bind('click', function (evt) {
                $scope.workbenchOptions.enableSliderMenu = undefined;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            });
            $scope.$on('$destroy', function ($event) {
                iElement.unbind('click');
            });
        }
    }
}]);

pl.directive('plToggle', ['$compile', function ($compiple) {
    return{
        restrict: 'A',
        replace: true,
        link: function ($scope, iElement, attrs) {
            iElement.bind('click', function ($event) {
                var isimageToggle = iElement.hasClass('expand')
                if (isimageToggle) {
                    iElement.removeClass('expand');
                } else {
                    iElement.addClass('expand')
                }
            });
        }
    }
}]);

pl.directive('plSlideMenu', ['$compile', function ($compile) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement) {
                    if ($scope.workbenchOptions.applications && $scope.workbenchOptions.selectedMenu && $scope.workbenchOptions.applications.length > 0) {
                        for (var i = 0; i < $scope.workbenchOptions.applications.length; i++) {
                            var obj = $scope.workbenchOptions.applications[i];
                            if ($scope.workbenchOptions.selectedMenu[$scope.workbenchOptions.applications[i]._id] == true) {
                                $scope.workbenchOptions.applications[i].open = true;
                            } else {
                                $scope.workbenchOptions.applications[i].open = false;
                            }

                        }
                    }
                },
                post: function ($scope, iElement) {
                    var template = '<div id="slideMenu"><pageslide ps-class="pl-pageslide" ps-open="workbenchOptions.enableSliderMenu" >' +
                        '           <div>' +
                        '               <div class="app-header"><img src="../images/applanelogo.png" /></div>' +
                        '           <nav>' +
                        "                <ul class='app-padding-zero-important silde-menu'>" +
                        "                    <li ng-repeat='application in workbenchOptions.applications' style='background-color: rgb(75,93,103)' class='app-position-relative' >" +
                        "                        <a ng-show='application.isVisible' ng-click='toggleAppMenu($event, application, workbenchOptions.applications, true)' ng-class='{\"pl-menu-text\":application.menus}' class='flex app-cursor-pointer menu-strip'>" +
                        "                             <span ng-bind='application.label' class='flex-1'></span>" +
                        "                         </a>" +
                        "                         <span class='app-position-absolute app-color-white' ng-click='toggleAppMenu($event, application, workbenchOptions.applications, true)' style='top:12px; left:10px;font-size:14px;' ><i ng-class='{\"icon-minus\":application.open, \"icon-plus\":!application.open }' class='no-hover app-cursor-pointer' ></i></span>" +
                        "                         <span class='app-position-absolute' style='top:8px; right:10px;'><i ng-class='{\"icon-chevron-down\":application.open, \"icon-chevron-left\":!application.open}' style='color: #fff; font-size: 7px;'></i></span>" +
                        "                         <ul id='{{application._id}}' ng-class='{\"hide-menu\":workbenchOptions.selectedMenu[application._id] != true}' >" +
                        "                             <li ng-repeat='menu in application.uiMenus' style='background-color: rgb(63,80,88);' class='app-position-relative'>" +
                        "                                 <a ng-show='menu.isVisible' ng-click='toggleAppMenu($event, menu, application.menus);' ng-class='{\"pl-selected-menu\": workbenchOptions.selectedMenu[menu._id] == true && !menu.menus}' class='flex app-cursor-pointer app-padding-five-px'>" +
                        "                                    <span ng-bind='menu.label' class='filler-width flex-1'></span>" +
                        "                                 </a>" +
                        "                                <span class='app-position-absolute' style='top:8px; left:10px;'><i ng-class='menu.icon' style='color: #fff;'></i></span>" +
                        "                                 <span class='app-position-absolute' ng-show='menu.menus' style='top:8px; right:10px;'><i ng-class='{\"icon-chevron-down\":menu.open, \"icon-chevron-left\":!menu.open}' style='color: #fff; font-size: 7px;'></i></span>" +
                        "                                 <div ng-class='{\"hide-menu\":workbenchOptions.selectedMenu[menu._id] != true}' id='{{menu._id}}'>" +
                        "                                       <ul class='pl-nested-menu'>" +
                        "                                         <li ng-repeat='menu_level_1 in menu.menus' class='app-position-relative' >" +
                        "                                             <a ng-click='toggleAppMenu($event, menu_level_1, menu.menus);' title={{menu_level_1.label}} ng-class='{\"pl-selected-menu\": workbenchOptions.selectedMenu[menu_level_1._id] == true && !menu_level_1.menus}' class='flex app-cursor-pointer app-padding-five-px'>" +
                        "                                                   <span ng-bind='menu_level_1.label' class='filler-width flex-1'></span>" +
                        "                                             </a>" +
                        "                                             <span class='app-position-absolute' ng-show='menu_level_1.menus' style='top:8px; right:10px;'><i ng-class='{\"icon-chevron-down\":menu_level_1.open, \"icon-chevron-left\":!menu_level_1.open}' style='color: #fff; font-size: 7px;'></i></span>" +
                        "                                               <div id='{{menu_level_1._id}}' ng-class='{\"hide-menu\":workbenchOptions.selectedMenu[menu_level_1._id] != true}' ng-if='menu_level_1.menus'>" +
                        "                                                   <ul class='pl-nested-menu'>" +
                        "                                                       <li ng-repeat='menu_level_2 in menu_level_1.menus' class='app-position-relative' >" +
                        "                                                           <a ng-click='toggleAppMenu($event, menu_level_2, menu_level_1.menus);' title={{menu_level_2.label}} ng-class='{\"pl-selected-menu\": workbenchOptions.selectedMenu[menu_level_2._id] == true && !menu_level_2.menus}' class='flex app-cursor-pointer app-padding-five-px'>" +
                        "                                                               <span ng-bind='menu_level_2.label' class='flex-1' ng-class='{\"app-menu-bold-font\":menu_level_2.menus}'></span>" +
                        "                                                           </a>" +
                        "                                                            <div id='{{menu_level_2._id}}'  ng-class='{\"hide-menu\":workbenchOptions.selectedMenu[menu_level_2._id] != true}' ng-if='menu_level_2.menus'>" +
                        "                                                                <ul ng-mouseover='setChildMenuPosition()' ng-mouseout='resetChildMenuPosition()' class='pl-nested-menu'>" +
                        "                                                                    <li ng-repeat='menu_level_3 in menu_level_2.menus' class='app-position-relative' >" +
                        "                                                                        <a title={{menu_level_3.label}} ng-class='{\"pl-selected-menu\": workbenchOptions.selectedMenu[menu_level_3._id] == true && !menu_level_3.menus}' class='flex app-cursor-pointer app-padding-five-px'>" +
                        "                                                                            <span ng-bind='menu_level_3.label' class='flex-1' ng-class='{\"app-menu-bold-font\":menu_level_3.menus}'></span>" +
                        "                                                                        </a>" +
                        "                                                                    </li>" +
                        "                                                                </ul>" +
                        "                                                            </div>" +
                        "                                                       </li>" +
                        "                                                   </ul>" +
                        "                                               </div>" +
                        "                                           </li>" +
                        "                                       </ul>" +
                        "                             </li>" +
                        "                         </ul>" +
                        "                    </li>" +
                        "                </ul>" +
                        '           </nav>' +
                        '       </div>' +
                        '   </pageslide>' +
                        '</div>';
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);

pl.directive('plToolBar', [ "$compile", function ($compile) {
    return {
        restrict: 'A',
        scope: false,
        compile: function () {
            return {
                post: function ($scope, iElement) {
                    var html = "";
                    if ($scope.toolBarOptions.top) {
                        html += "<div class='pl-top-toolbar' pl-tool-bar-row='top'></div>";
                    }
                    if ($scope.toolBarOptions.bottom && ($scope.toolBarOptions.bottom.left.length > 0 || $scope.toolBarOptions.bottom.center.length > 0 || $scope.toolBarOptions.bottom.right.length > 0 )) {
                        html += "<div class='pl-bottom-toolbar' ng-show='toolBarOptions.bottom.left.length > 0 || toolBarOptions.bottom.center.length > 0  || (toolBarOptions.bottom.right.length > 0 && gridOptions.sharedOptions.saveCustomizationEnable!= undefined) || gridOptions.sharedOptions.saveCustomizationEnable || toolBarOptions.bottom.right.length > 1'  pl-tool-bar-row='bottom'></div>";
                    }
                    iElement.append($compile(html)($scope));
                }
            }
        }
    };
}
]);

pl.directive('plToolBarRow', [ "$compile", function ($compile) {
    return {
        restrict: 'A',
        scope: true,
        compile: function () {
            return {
                post: function ($scope, iElement, attrs) {
                    if (attrs.plToolBarRow == "top") {
                        $scope.toolbarRowOptions = $scope.toolBarOptions.top;
                    } else if (attrs.plToolBarRow == "bottom") {
                        $scope.toolbarRowOptions = $scope.toolBarOptions.bottom;
                    } else {
                        alert("Not supported plToolBarRow>>>>[" + attrs.plToolBarRow + "]");
                    }

                    var html = "";
                    html += "<pl-left-tool-bar></pl-left-tool-bar>";
                    html += "<pl-center-tool-bar class='pl-top-middle-tollbar' ng-if='toolbarRowOptions.center'></pl-center-tool-bar>";
                    html += "<pl-right-tool-bar></pl-right-tool-bar>";
                    iElement.append($compile(html)($scope));
                }
            }
        }
    };
}
]);

pl.directive('plToolBarHeader', [ "$compile", function ($compile) {
    return {
        restrict: 'E',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                    if ($scope.toolBarOptions.header) {
                        $scope.toolbarHeaders = $scope.toolBarOptions.header.left;
                        $scope.toolbarCenterHeaders = $scope.toolBarOptions.header.center;
                        $scope.toolbarRightHeadersActions = $scope.toolBarOptions.header.right;
                    }
                    var template = '<div class="flex" style="min-height: 48px;">' +
                        '       <div class="app-float-left header-l-bar app-overflow-hiiden" ng-class="toolbarHeaders.lHeaderClass" >' +
                        "           <div>" +
                        "               <ul ng-if='toolbarHeaders.menus' style='padding-left: 0px; ' id='toolBarHeader'>" +
                        "                   <li ng-repeat='qMenu in toolbarHeaders.menus' ng-hide='qMenu.hide' ng-class='{\"qview-selecetd\":toolbarHeaders.selectedMenu == $index || (qMenu.mores && toolbarHeaders.selectedMenu >= toolbarHeaders.breakingIndex-1)}'>" +
                        "                       <span class='app-cursor-pointer' ng-click='qViewHeaderClick(qMenu, $event)' ng-bind='qMenu.label'></span> " +
                        "                   </li>" +
                        "               </ul>" +
                        "           </div>" +
                        '       </div>' +
                        '       <div class="app-bar-basic flex-1 header-r-bar">' +
                        '           <div pl-button ng-repeat="action in toolbarCenterHeaders" title="{{action.title}}" class="app-float-left"></div>' +
                        '     </div>' +
                        '       <div class="app-float-right header-r-bar" ng-class="toolbarHeaders.rHeaderClass">' +
                        '           <div pl-button ng-repeat="action in toolbarRightHeadersActions" ng-class="action.class" title="{{action.title}}" class="app-float-left"></div>' +
                        '       </div>' +
                        '    </div>';
                    iElement.append(($compile)(template)($scope));

                },
                post: function ($scope) {
                    $scope.qViewHeaderClick = function (qMenu, $event) {
                        try {
                            if (qMenu.onClick) {
                                $scope[qMenu.onClick](qMenu, $event);
                            } else {
                                $scope.onQuickViewSelection(qMenu);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.qViewHeaderPopup = function (qMenu, $event) {
                        try {
                            var html = "<div class='pl-overflow-y-scroll app-max-height-two-hundred'>" +
                                "           <div ng-repeat='moreMenu in toolbarHeaders.menus' class='app-white-space-nowrap app-cursor-pointer' ng-if='!(!moreMenu.hide || moreMenu._id ==\"__more\")'>" +
                                "               <div  ng-click='onQuickViewSelection(moreMenu)' ng-class='{\"pl-selected-menu\":toolbarHeaders.selectedMenu == $index}' class='app-row-action pl-popup-label'>{{moreMenu.label}}" +
                                "               </div>" +
                                "           </div>" +
                                "       </div>";
                            var popupScope = $scope.$new();
                            var p = new Popup({
                                autoHide: true,
                                deffered: true,
                                escEnabled: true,
                                hideOnClick: true,
                                html: $compile(html)(popupScope),
                                scope: popupScope,
                                element: $event.target,
                                event: $event
                            });
                            p.showPopup();
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                }
            }
        }
    };
}]);

pl.directive('plLeftToolBar', function () {
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="app-bar-basic">' +
            '           <div pl-button ng-repeat="action in toolbarRowOptions.left" title="{{action.title}}" class="app-float-left"></div>' +
            '     </div>'
    };
});

pl.directive('plRightToolBar', function () {
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="app-float-right flex r-bar">' +
            '           <div pl-button ng-repeat="action in toolbarRowOptions.right" title="{{action.title}}" class="app-float-left app-white-space-nowrap flex-box"></div>' +
            '     </div>'
    };
});

pl.directive('plCenterToolBar', function () {
    return {
        restrict: 'E',
        replace: true,
        template: '<div class="app-float-left">' +
            '           <div pl-button ng-repeat="action in toolbarRowOptions.center" title="{{action.title}}" class="app-float-left pl-middle-toolbar"></div>' +
            '     </div>'
    };
});

pl.directive('plButton', [
    '$compile', function ($compile) {
        return {
            restrict: 'A',
            scope: false,
            compile: function () {
                return {
                    pre: function ($scope, iElement) {
                        var template = $scope.action.template;
                        if (!template) {
                            template = "<div ";
                            if ($scope.action.onClick) {
                                template += " ng-click='" + $scope.action.onClick + "'";
                            }
                            if ($scope.action.actionClass) {
                                template += " ng-class = 'action.actionClass'";
                            }
                            if ($scope.action.showLabel) {
                                template += " ng-bind='action.label'";
                            }
                            template += " ></div>";
                        }
                        iElement.append($compile(template)($scope));

                    }

                }
            }
        };
    }]);

/* pl-user-preference starts form here*/

pl.controller('plUserPreferenceController', function ($scope, $compile, $timeout) {
    $scope.dragElement = function (scope, iElement, info, type) {
        iElement.bind('mousedown', function (e) {
            var offset = e.pageX;
            $('#drag-element').css({
                left: offset
            });
            $scope.userPreferenceOptions.srcIndex = $scope.$index;
            $scope.userPreferenceOptions.dragLabel = info.label;
            $scope.userPreferenceOptions.dragVisibility = true;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });

        iElement.bind('mousemove', function (e) {
            if ($scope.userPreferenceOptions.dragVisibility) {
                $('body').bind('mousemove', function (e) {
                    var offset = e.pageX;
                    $('#drag-element').css({
                        left: offset
                    });
                });
            }
            $('body').bind('mouseup', function (e) {
                $scope.checkMouseElement();
            });
        });

        iElement.bind('mouseup', function (e) {
            $('body').unbind('mousemove');
            $scope.userPreferenceOptions.targetIndex = $scope.$index;
            $scope.userPreferenceOptions.dragVisibility = false;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            $scope.reOrderingElements($scope.userPreferenceOptions.srcIndex, $scope.userPreferenceOptions.targetIndex, type);
        });


    };
    $scope.checkMouseElement = function () {
        if ($scope.userPreferenceOptions.dragVisibility) {
            $scope.userPreferenceOptions.dragVisibility = false;
            $timeout(function () {
                $('body').unbind('mouseup');
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }, 0)

        }
    }
    $scope.reOrderingElements = function (srcIndex, trgIndex, type) {
        var srcCol = $scope.userPreferenceOptions[type][srcIndex];
        $scope.userPreferenceOptions[type].splice(srcIndex, 1);
        $scope.userPreferenceOptions[type].splice(trgIndex, 0, srcCol);
        $scope.userPreferenceOptions.__apply__ = true;
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };
});

pl.directive('plUserPreference', [ "$compile", function ($compile) {
    return {
        restrict: 'EAC',
        template: "<div class='pl-select-type'>" +
            "       <span title='Filter' ng-click='userPreferenceOptions.selectedType = \"Filter\"' ng-class='{\"active\":userPreferenceOptions.selectedType == \"Filter\"}' class='user-preference-action filter'></span><span class='seperator'></span>" +
            "       <span title='Sort' ng-click='userPreferenceOptions.selectedType = \"Sort\"' ng-class='{\"active\":userPreferenceOptions.selectedType == \"Sort\"}' class='user-preference-action sort'></span><span class='seperator'></span>" +
            "       <span title='Group' ng-click='userPreferenceOptions.selectedType = \"Group\"' ng-class='{\"active\":userPreferenceOptions.selectedType == \"Group\"}' class='user-preference-action group'></span>" +
            "       <span ng-show='userPreferenceOptions.recursionEnabled' class='seperator'></span><span ng-click='userPreferenceOptions.selectedType = \"Recursion\"' ng-show='userPreferenceOptions.recursionEnabled' style='vertical-align: top;font-size:21px;' title='Recursion' ng-class='{\"active\":userPreferenceOptions.selectedType == \"Recursion\"}' class='user-preference-action icon-repeat'></span>" +
            "       </div>" +
//            "<div pl-menu-group='userPreferenceOptions.typeMenuGroupOptions' class='pl-select-type fltr-margin app-populate-default-filter'  ng-show='userPreferenceOptions.typeMenuGroupOptions.menus.length >0'></div>" +
            "<pl-group-info></pl-group-info>" +
            "<pl-sort-info></pl-sort-info>" +
            "<pl-filter-info></pl-filter-info>" +
            "<pl-recursion-info></pl-recursion-info>" +
            "<div class='pl-plus-button fltr-margin app-populate-default-filter ft' pl-menu-group='userPreferenceOptions.filterMenuGroupOptions' ng-show='userPreferenceOptions.selectedType == \"Filter\"'></div>" +
            "<div class='pl-plus-button fltr-margin app-populate-default-filter st' pl-menu-group='userPreferenceOptions.sortMenuGroupOptions' ng-show='userPreferenceOptions.selectedType == \"Sort\" '></div>" +
            "<div class='pl-plus-button fltr-margin app-populate-default-filter gp' pl-menu-group='userPreferenceOptions.groupsMenuGroupOptions' ng-show='userPreferenceOptions.selectedType == \"Group\" '></div>" +
            "<div class='pl-plus-button fltr-margin app-populate-default-filter gp' pl-menu-group='userPreferenceOptions.recursionMenuGroupOptions' ng-show='userPreferenceOptions.selectedType == \"Recursion\" '></div>" +
            "<div class='pl-user-preference-apply' ng-click='apply()' ng-show='userPreferenceOptions.__apply__' >" +
            "   <div class='pl-apply-button'><i class=\"icon-ok\"></i></div>" +
            "</div>" +
            "<div class='app-position-relative'><div id='drag-element' ng-bind='userPreferenceOptions.dragLabel' ng-show='userPreferenceOptions.dragVisibility' class='pl-grag-group'></div></div>" +
            "<div id='drag-group' ng-bind='userPreferenceOptions.groupLabel' ng-show='userPreferenceOptions.dragGroupVisibility' class='pl-grag-group'></div>" +
            "<pl-fts data-info='gridOptions.ftsInfo' class='pl-sub-fts' ></pl-fts>",
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.userPreferenceOptions = $scope.$eval(attrs.plUserPreference);
                    var userPreferenceOptions = $scope.userPreferenceOptions;
                    var filterOption = ['Filter', 'Sort', 'Group'];
                    userPreferenceOptions.typeMenuGroupOptions = {menus: [], displayField: "label", label: "Select Type", hideOnClick: true};
                    if (userPreferenceOptions.filterColumns && userPreferenceOptions.filterColumns.length > 0) {
                        userPreferenceOptions.typeMenuGroupOptions.menus.push({label: "Filter", onClick: 'showFiltersColumns', menuClass: "pl-type-options-parent"});
                    }
                    if (userPreferenceOptions.sortColumns && userPreferenceOptions.sortColumns.length > 0) {
                        userPreferenceOptions.typeMenuGroupOptions.menus.push({label: "Sort", onClick: 'showSortColumns'});
                    }

                    if (userPreferenceOptions.groupColumns && userPreferenceOptions.groupColumns.length > 0) {
                        userPreferenceOptions.typeMenuGroupOptions.menus.push({label: "Group", onClick: 'showGroupColumns'});
                    }

                    if (userPreferenceOptions.typeMenuGroupOptions.menus.length > 0) {
                        if (angular.isDefined(userPreferenceOptions.selectedType)) {
                            userPreferenceOptions.typeMenuGroupOptions.label = userPreferenceOptions.selectedType;
                        } else {
                            userPreferenceOptions.typeMenuGroupOptions.label = userPreferenceOptions.typeMenuGroupOptions.menus[0].label;
                            userPreferenceOptions.selectedType = userPreferenceOptions.typeMenuGroupOptions.label;
                        }
                    }


                    userPreferenceOptions.filterMenuGroupOptions = {template: "<div pl-filter class='pl-overflow-y-scroll app-max-height-two-hundred'></div>", iconClass: 'icon-plus app-font-size-14px mediumn-line-height', isDropdown: true, title: "Select filter columns"};
                    userPreferenceOptions.sortMenuGroupOptions = {template: "<div pl-sort class='pl-overflow-y-scroll app-max-height-two-hundred'></div>", iconClass: 'icon-plus app-font-size-14px mediumn-line-height', isDropdown: true, title: "Select sort columns"};
                    userPreferenceOptions.groupsMenuGroupOptions = {template: "<div pl-groups class='pl-overflow-y-scroll app-max-height-two-hundred'></div>", iconClass: 'icon-plus app-font-size-14px mediumn-line-height', isDropdown: true, title: "Select group columns"};
                    userPreferenceOptions.recursionMenuGroupOptions = {template: "<div pl-recursion class='pl-overflow-y-scroll app-max-height-two-hundred'></div>", iconClass: 'icon-plus app-font-size-14px mediumn-line-height', isDropdown: true, title: "Select Recursive columns"};
                },
                post: function ($scope) {
                    $scope.showFiltersColumns = function (menu) {
                        $scope.userPreferenceOptions.lastSelectedInfo = 'Filter';
                        $scope.userPreferenceOptions.selectedType = 'Filter';

                    }
                    $scope.showSortColumns = function (menu) {
                        $scope.userPreferenceOptions.lastSelectedInfo = 'Sort';
                        $scope.userPreferenceOptions.selectedType = 'Sort';
                    }
                    $scope.showGroupColumns = function (menu) {
                        $scope.userPreferenceOptions.lastSelectedInfo = 'Group';
                        $scope.userPreferenceOptions.selectedType = 'Group';
                    }

                    $scope.recursionSettingChange = function (index) {
                        $scope.userPreferenceOptions.groupInfo[index].recursion.$selected = !$scope.userPreferenceOptions.groupInfo[index].recursion.$selected;
                        $scope.showApplyButton();
                    }

                    $scope.apply = function () {
                        try {
                            // To clear row-selection/clear selection message when applying filter Rajit garg- 23/Mar/2015
                            if ($scope.gridOptions && $scope.gridOptions.__selected__) {
                                $scope.gridOptions.__selected__ = false;
                            }
                            var queryGroupInfo = undefined;
                            var querySorts = undefined;
                            var queryFilters = undefined;
                            var queryParameters = undefined;
                            var reloadViewOnRefresh = false;
                            if ($scope.userPreferenceOptions.removeGroupInfo) {
                                $scope.userPreferenceOptions.removeGroupInfo = undefined;
                                queryGroupInfo = null;
                            }
                            if ($scope.userPreferenceOptions.groupInfo && $scope.userPreferenceOptions.groupInfo.length > 0) {
                                queryGroupInfo = {_id: []};

                                for (var i = 0; i < $scope.userPreferenceOptions.groupInfo.length; i++) {
                                    var grpInfo = $scope.userPreferenceOptions.groupInfo[i];
                                    var grpField = grpInfo.field;
                                    var group_IdField = {};
                                    group_IdField[grpField] = "$" + grpField;
                                    queryGroupInfo._id.push(group_IdField);

                                    if (grpInfo.recursion && grpInfo.recursion.$selected) {
                                        var groupRecursion = angular.copy(grpInfo.recursion);
                                        groupRecursion.$removeRollupHierarchy = true;
                                        groupRecursion.$rollupHierarchyField = "self";
                                        groupRecursion.$childrenAsRow = true;
                                        groupRecursion.$selfAsChildren = true;
                                        groupRecursion.$primaryColumn = grpField;
                                        if (!groupRecursion.$childrenAlias) {
                                            groupRecursion.$childrenAlias = "Team";
                                        }
                                        if (!groupRecursion.$alias) {
                                            groupRecursion.$alias = "recursiveChildren";
                                        }
                                        groupRecursion.$rollup = [];
                                        queryGroupInfo.$recursion = groupRecursion;
                                    }
                                    queryGroupInfo[grpField] = {"$first": "$" + grpField}
                                }
                                if ($scope.userPreferenceOptions.aggregateColumns) {
                                    for (var i = 0; i < $scope.userPreferenceOptions.aggregateColumns.length; i++) {
                                        var gc = $scope.userPreferenceOptions.aggregateColumns[i];
                                        var ViewUtility = require("ApplaneDB/public/js/ViewUtility.js");
                                        ViewUtility.populateSortInGroup(queryGroupInfo, gc);
                                        var alias = gc.alias || gc.field;
                                        if (gc.aggregate == "count") {
                                            queryGroupInfo[alias] = {$sum: 1};
                                            if (queryGroupInfo.$recursion && queryGroupInfo.$recursion.$rollup) {
                                                queryGroupInfo.$recursion.$rollup.push(gc.field);
                                            }
                                        } else if (gc.aggregate == "sum" || gc.aggregate == "avg") {
                                            var gcAggregateWithDollar = "$" + gc.aggregate;
                                            queryGroupInfo[alias] = {};
                                            queryGroupInfo[alias][gcAggregateWithDollar] = "$" + gc.field;
                                            if (queryGroupInfo.$recursion && queryGroupInfo.$recursion.$rollup) {
                                                if (gc.type === "currency" || gc.ui === "currency") {
                                                    var rollUpColumn = {};
                                                    rollUpColumn[alias] = {"amount": {"$sum": "$amount"}, "type": {"$first": "$type"}};
                                                    queryGroupInfo.$recursion.$rollup.push(rollUpColumn);
                                                } else if (gc.type === "duration" || gc.ui === "duration") {
                                                    var rollUpColumn = {};
                                                    rollUpColumn[alias] = {"time": {"$sum": "$time"}, "unit": {"$first": "$unit"}};
                                                    queryGroupInfo.$recursion.$rollup.push(rollUpColumn);
                                                }
                                            }
                                        }
                                    }
                                }

                            }
                            if ($scope.userPreferenceOptions.removeSortInfo) {
                                $scope.userPreferenceOptions.removeSortInfo = undefined;
                                querySorts = null;
                            }
                            if ($scope.userPreferenceOptions.sortInfo && $scope.userPreferenceOptions.sortInfo.length > 0) {
                                querySorts = {};
                                for (var i = 0; i < $scope.userPreferenceOptions.sortInfo.length; i++) {
                                    var sortColumn = $scope.userPreferenceOptions.sortInfo[i];
                                    var sortValue = sortColumn.value;
                                    var sortField = sortColumn.field;
                                    if (sortColumn.displayField) {
                                        sortField += "." + sortColumn.displayField;
                                    }
                                    if (sortValue) {
                                        querySorts[sortField] = sortValue == "Dsc" ? -1 : 1;
                                    } else {
                                        querySorts[sortField] = 1;
                                        sortColumn.value = "Asc";

                                    }
                                    sortColumn.activeMode = false;
                                }
                            }

                            if ($scope.userPreferenceOptions.recursionInfo && $scope.userPreferenceOptions.recursionInfo.length > 0) {
                                $scope.userPreferenceOptions.recursionSelected = true;
                            }

                            if ($scope.userPreferenceOptions.removeFilterInfo) {
                                queryFilters = queryFilters || {};
                                queryParameters = queryParameters || {};
                                for (var i = 0; i < $scope.userPreferenceOptions.removeFilterInfo.length; i++) {
                                    var removeFilter = $scope.userPreferenceOptions.removeFilterInfo[i];
                                    queryParameters[removeFilter.field] = undefined;
                                    queryFilters[removeFilter.field] = undefined;

                                }
                                $scope.userPreferenceOptions.removeFilterInfo = undefined;
                            }
                            if ($scope.userPreferenceOptions.filterInfo && $scope.userPreferenceOptions.filterInfo.length > 0) {
                                queryFilters = queryFilters || {};
                                queryParameters = queryParameters || {};
                                for (var i = 0; i < $scope.userPreferenceOptions.filterInfo.length; i++) {
                                    var filterColumn = $scope.userPreferenceOptions.filterInfo[i];
                                    var filterField = filterColumn.field;
                                    var filterOperators = filterColumn.filterOperators;
                                    var filterValue = Util.resolveDot(filterColumn, filterField);
                                    var previousFilter = undefined;
                                    if (filterColumn.filter && filterColumn.filter[filterField]) {
                                        previousFilter = filterColumn.filter[filterField];
                                    }
                                    var valueToSet = undefined;
                                    /*if (filterColumn.reloadViewOnFilterChange) {
                                     reloadViewOnRefresh = filterColumn.reloadViewOnFilterChange;
                                     }*/

                                    if (filterColumn.ui == "number") {
                                        var index = filterValue ? filterValue.toString().indexOf('-') : -1;
                                        if (index > 0) {
                                            var splitValue = filterValue.split('-');
                                            if (splitValue && splitValue.length == 2) {
                                                valueToSet = {$gte: Number(splitValue[0]), $lt: Number(splitValue[1])};
                                            }
                                        } else {
                                            if ((typeof filterValue !== 'number')) {
                                                if (isNaN(Number(filterValue))) {
                                                    throw new Error("Error while casting for expression [" + filterColumn.field + "] with value [" + filterValue + "]");
                                                } else {
                                                    filterValue = Number(filterValue);
                                                }
                                            }
                                            var label = filterOperators.label;
                                            if (label == ">=") {
                                                valueToSet = {$gte: filterValue};
                                            } else if (label == "<") {
                                                valueToSet = {$lt: filterValue};
                                            } else if (label == "<=") {
                                                valueToSet = {$lte: filterValue};
                                            } else if (label == "!=") {
                                                valueToSet = {$ne: filterValue};
                                            } else {
                                                valueToSet = filterValue;
                                            }
                                        }
                                    } else if (filterColumn.ui == "text") {
                                        var label = filterOperators.label;
                                        valueToSet = filterValue;
                                    } else if (filterColumn.ui == "checkbox" && filterColumn.options) {
                                        var booleanFilterIndex = undefined;
                                        for (var j = 0; j < filterColumn.options.length; j++) {
                                            if (filterColumn[filterColumn.field] == filterColumn.options[j]) {
                                                booleanFilterIndex = j;
                                                break;
                                            }
                                        }
                                        if (booleanFilterIndex == 0) {
                                            valueToSet = true;
                                        } else if (booleanFilterIndex == 1) {
                                            valueToSet = {$in: [null, false]};
                                        }
                                    } else if (filterColumn.ui == "autocomplete" && filterOperators) {
                                        var label = filterOperators.label;
                                        if (filterValue) {
                                            if (filterColumn.type == 'string' && filterColumn.displayField) {
                                                filterValue = Util.resolveDot(filterValue, filterColumn.displayField);
                                            } else if (filterValue._id === "__idNone") {
                                                filterValue = {$exists: false};
                                            } else if (filterColumn.valueAsObject) {
                                                filterValue = filterValue;
                                            } else if (filterValue._id) {
                                                filterValue = filterValue._id
                                            }
                                        }


                                        if (filterColumn.multiple) {
                                            if (label == "==" || label == "!=" || label == "&&") {
                                                if (filterValue && angular.isArray(filterValue) && filterValue.length > 0) {
                                                    var keys = [];
                                                    for (var j = 0; j < filterValue.length; j++) {
                                                        if (filterValue[j]._id) {
                                                            keys.push(filterValue[j]._id);
                                                        } else if (typeof filterValue[j] == "string") {
                                                            keys.push(filterValue[j]);
                                                        }
                                                    }
                                                    if (keys.length > 0) {
                                                        valueToSet = {};
                                                        if (label == "==") {
                                                            valueToSet["$in"] = keys;
                                                        } else if (label == "!=") {
                                                            valueToSet["$nin"] = keys;
                                                        } else if (label == "&&") {
                                                            valueToSet["$all"] = keys;
                                                        }
                                                    }
                                                }
                                            }
                                        } else if (!filterColumn.multiple) {
                                            if (label == "==") {
                                                valueToSet = filterValue;
                                            } else if (label == "!=") {
                                                valueToSet = {$ne: filterValue};
                                            } else if (label == "..") {
                                                valueToSet = {$in: {}};
                                                valueToSet.$in = {"$$getRecursive": {key: filterValue, recursiveCollection: filterColumn.collection, recursiveField: filterColumn.recursiveFilterField}};
                                            }
                                        }

                                    } else if (filterColumn.ui == "date") {
                                        var filter = filterColumn.filter;

                                        if (filter) {
                                            if (angular.isString(filter)) {
                                                filter = JSON.parse(filter);
                                            }
                                            if (filter[filterField]) {
                                                filter = filter[filterField];
                                            }
                                            if (filter) {
                                                valueToSet = filter;
                                            }
                                        }


                                    }
                                    //incase of role, filterOptions will contain asParameter instaed of field level, in this case only selected role should be gone as parameter where as selected employee shold gone as filter
                                    if (filterColumn.asParameter || (valueToSet && valueToSet.asParameter)) {
                                        queryParameters[filterField] = valueToSet;
                                    } else {
                                        queryFilters[filterField] = valueToSet;
                                    }
                                    if (previousFilter && valueToSet) {
                                        //For role case, if role selected then it should be pass as parameter and previous filter should be removed and on the other hand if some value is selected in assign_to then previously selected role(eg.SELF) will be removed from parameters
                                        var previousFilteAsParameter = previousFilter.asParameter || false;
                                        var currentFilterAsParameter = valueToSet.asParameter || false;
                                        if (previousFilteAsParameter !== currentFilterAsParameter) {
                                            if (currentFilterAsParameter) {
                                                queryFilters[filterField] = undefined;
                                            } else {
                                                queryParameters[filterField] = undefined;
                                            }
                                        }


                                    }
                                    filterColumn.activeMode = false;

                                }
                            }
//                            $scope.userPreferenceOptions.reloadViewOnFilterChange = reloadViewOnRefresh;
                            $scope.userPreferenceOptions.queryGroups = queryGroupInfo;
                            $scope.userPreferenceOptions.querySorts = querySorts;
                            $scope.userPreferenceOptions.queryFilters = queryFilters;
                            $scope.userPreferenceOptions.queryParameters = queryParameters;
                            $scope.hideApplyButton();
                            $scope.userPreferenceOptions.reload = !$scope.userPreferenceOptions.reload;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.$watch('userPreferenceOptions.apply', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            $scope.apply();
                        }
                    });
                    $scope.showApplyButton = function () {
                        $scope.userPreferenceOptions.__apply__ = true;
                    }

                    $scope.hideApplyButton = function () {
                        $scope.userPreferenceOptions.__apply__ = false;
                    }
                    $scope.removeRecursiveColumnFromRecursionInfo = function (recursiveColumn, rePopulateInfo) {  //this work is done for applying recursion on recursion image clicked and then apply button clicked when recursionEnabled is true in qview--Ritesh
                        for (var i = 0; i < $scope.userPreferenceOptions.recursionInfo.length; i++) {               //on cross click of recursionInfo
                            var recursionInfo = $scope.userPreferenceOptions.recursionInfo[i];
                            if (recursionInfo.field && recursionInfo.field == recursiveColumn.field) {
                                recursiveColumn.__selected__ = false;
                                if (rePopulateInfo) {
                                    $scope.populateGroupInfo([recursionInfo], $scope.userPreferenceOptions.recursiveColumns);
                                }
                                $scope.userPreferenceOptions.recursionInfo.splice(i, 1);
                                $scope.userPreferenceOptions.recursionSelected = false;
                                $scope.showApplyButton();
                                break;
                            }
                        }
                        ($scope.userPreferenceOptions.recursionInfo.length == 0) ? $scope.userPreferenceOptions.lastSelectedInfo = undefined : $scope.userPreferenceOptions.lastSelectedInfo = 'Recursion';
                    }


                    $scope.removeGroupColumnFromGroupInfos = function (groupColumn, rePopulateInfo) {
                        for (var i = 0; i < $scope.userPreferenceOptions.groupInfo.length; i++) {
                            var groupInfo = $scope.userPreferenceOptions.groupInfo[i];
                            if (groupInfo.field && groupInfo.field == groupColumn.field) {
                                groupColumn.__selected__ = false;
                                if (rePopulateInfo) {
                                    $scope.populateGroupInfo([groupInfo], $scope.userPreferenceOptions.groupColumns);
                                }
                                $scope.userPreferenceOptions.removeGroupInfo = $scope.userPreferenceOptions.removeGroupInfo || [];
                                $scope.userPreferenceOptions.removeGroupInfo.push(groupColumn);
                                $scope.userPreferenceOptions.groupInfo.splice(i, 1);
                                $scope.showApplyButton();
                                break;
                            }
                        }
                        ($scope.userPreferenceOptions.groupInfo.length == 0) ? $scope.userPreferenceOptions.lastSelectedInfo = undefined : $scope.userPreferenceOptions.lastSelectedInfo = 'Group';
                    }

                    $scope.removeGroupColumnFromSortInfo = function (sortColumn, rePopulateInfo) {
                        for (var i = 0; i < $scope.userPreferenceOptions.sortInfo.length; i++) {
                            var sortInfo = $scope.userPreferenceOptions.sortInfo[i];
                            if (sortInfo.field && sortInfo.field == sortColumn.field) {
                                sortColumn.__selected__ = false;
                                if (rePopulateInfo) {
                                    $scope.populateSortInfo([sortInfo], $scope.userPreferenceOptions.sortColumns);
                                }
                                $scope.userPreferenceOptions.removeSortInfo = $scope.userPreferenceOptions.removeSortInfo || [];
                                $scope.userPreferenceOptions.removeSortInfo.push(sortInfo);
                                $scope.userPreferenceOptions.sortInfo.splice(i, 1);
                                $scope.showApplyButton();
                                break;
                            }
                        }
                        ($scope.userPreferenceOptions.sortInfo.length == 0) ? $scope.userPreferenceOptions.lastSelectedInfo = undefined : $scope.userPreferenceOptions.lastSelectedInfo = 'Sort';
                    }

                    $scope.removeFilterColumnFromFilterInfo = function (filterColumn, rePopulateInfo) {
                        for (var i = 0; i < $scope.userPreferenceOptions.filterInfo.length; i++) {
                            var filterInfo = $scope.userPreferenceOptions.filterInfo[i];
                            if (filterInfo.field && filterInfo.field == filterColumn.field) {
                                filterColumn.__selected__ = false;
                                if (rePopulateInfo) {
                                    $scope.populateFilterInfo([filterInfo], $scope.userPreferenceOptions.filterColumns);
                                }
                                $scope.userPreferenceOptions.removeFilterInfo = $scope.userPreferenceOptions.removeFilterInfo || [];
                                $scope.userPreferenceOptions.removeFilterInfo.push(filterColumn);
                                if (filterInfo && filterInfo[filterInfo.field]) {
                                    delete filterInfo[filterInfo.field];
                                }
                                $scope.userPreferenceOptions.filterInfo.splice(i, 1);
                                $scope.showApplyButton();
                                break;
                            }
                        }
                        ($scope.userPreferenceOptions.filterInfo.length == 0) ? $scope.userPreferenceOptions.lastSelectedInfo = undefined : $scope.userPreferenceOptions.lastSelectedInfo = 'Filter';
                    }
                }
            }
        }
    };
}]);

pl.directive('plRecursion', [ "$compile", function ($compile) {  //this work is done for applying recursion on recursion image clicked and then apply button clicked when recursionEnabled is true in qview--Ritesh
    return {
        restrict: 'A',
        template: "<div ng-repeat='recursiveColumn in userPreferenceOptions.recursiveColumns' class='pl-groups-options-parent '>" +
            "       <div class='app-white-space-nowrap app-width-full' style='margin-right: 5px;'>" +
            "           <span><input type='checkbox' ng-model='recursiveColumn.__selected__' ng-change='selectRecursiveColumn(recursiveColumn)'></span>" +
            "           <span ng-bind='recursiveColumn.label'  ng-class='{\"selected\":recursiveColumn.__selected__}'></span>" +
            "       </div>" +
            "    </div>",

        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.selectRecursiveColumn = function (recursiveColumn) {
                        $scope.userPreferenceOptions.lastSelectedInfo = 'Recursion';
                        $scope.showApplyButton();
                        if (recursiveColumn.__selected__) {
                            $scope.userPreferenceOptions.recursionInfo.push(recursiveColumn);
                        } else {
                            $scope.removeRecursiveColumnFromRecursionInfo(recursiveColumn);
                        }
                    }
                }
            }
        }
    };
}
]);


pl.directive('plRecursionInfo', [ "$compile", function ($compile) {//this work is done for applying recursion on recursion image clicked and then apply button clicked when recursionEnabled is true in qview--Ritesh
    return {
        restrict: 'E',
        template: "<div ng-show='userPreferenceOptions.recursionInfo.length > 0 && userPreferenceOptions.selectedType == \"Recursion\"' class='app-float-left'>" +
            "       <div class='applied-filter-parent app-float-left pl-group-parent fltr-applied' ng-repeat='rInfo in userPreferenceOptions.recursionInfo' >" +
            "           <span ng-bind='rInfo.label' class='app-float-left pl-user-preference-widget filter-max-width' style='color: #525252;'></span>" +
            "           <div class='app-float-right app-cursor-pointer  pl-theme-background pl-cross-filter' ng-click='removeRecursiveColumnFromRecursionInfo(rInfo, true)'>" +
            "               <div class='pl-remove-filter'><i class=\"icon-remove\"></i></div>" +
            "           </div>" +
            "       </div>" +
            "</div>"
    };
}
]);

pl.directive('plGroups', [ "$compile", function ($compile) {
    return {
        restrict: 'A',
        template: "<div ng-repeat='groupColumn in userPreferenceOptions.groupColumns' class='pl-groups-options-parent '>" +
            "       <div class='app-white-space-nowrap app-width-full' style='margin-right: 5px;'>" +
            "           <span><input type='checkbox' ng-model='groupColumn.__selected__' ng-change='selectGroupColumn(groupColumn)'></span>" +
            "           <span ng-bind='groupColumn.label'  ng-class='{\"selected\":groupColumn.__selected__}'></span>" +
            "       </div>" +
            "       <div ng-if='groupColumn.options' ng-repeat='option in groupColumn.options' class='app-float-left app-width-full' style='margin-right: 5px;'>" +
            "           <span><input type='checkbox' ng-model='groupColumn[option.field]'/></span>" +
            "           <span ng-bind='option.label'></span>" +
            "       </div>" +
            "    </div>",

        compile: function () {
            return {

                pre: function ($scope, iElement, attrs) {
                    $scope.selectGroupColumn = function (groupColumn) {
                        $scope.userPreferenceOptions.lastSelectedInfo = 'Group';
                        $scope.showApplyButton();
                        if (groupColumn.__selected__) {
                            $scope.userPreferenceOptions.groupInfo.push(groupColumn);
                        } else {
                            $scope.removeGroupColumnFromGroupInfos(groupColumn);
                        }

                    }
                }
            }
        }
    };
}
]);

pl.directive('plGroupInfo', [ "$compile", function ($compile) {
    return {
        restrict: 'E',
        template: "<div ng-show='userPreferenceOptions.groupInfo.length > 0 && userPreferenceOptions.selectedType == \"Group\"' class=' app-float-left'>" +
            "       <div class='applied-filter-parent app-float-left pl-group-parent fltr-applied' ng-repeat='gInfo in userPreferenceOptions.groupInfo' >" +
            "           <div ng-bind='gInfo.label' ng-controller='plUserPreferenceController' pl-group-drag class='app-float-left pl-user-preference-widget filter-max-width' style='color: #525252;'></div>" +
            "               <span class='recursion-image app-cursor-pointer  pl-theme-background pl-cross-filter ' ng-show='gInfo.recursion ' title='Recursive' ng-class='{\"active\":gInfo.recursion.$selected }' ng-click='recursionSettingChange($index)'></span>" +
            "           <div class='app-float-right app-cursor-pointer  pl-theme-background pl-cross-filter' ng-click='removeGroupColumnFromGroupInfos(gInfo, true)'>" +
            "               <div class='pl-remove-filter'><i class=\"icon-remove\"></i></div>" +
            "           </div>" +
            "       </div>" +
            "</div>"
    };
}
]);

pl.directive('plGroupDrag', ["$compile", function ($compile) {
    return{
        restrict: 'A',
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    $scope.dragElement($scope, iElement, $scope.gInfo, 'groupInfo');
                }
            }
        }
    }
}]);

pl.directive('plFilter', [ "$compile", function ($compile) {
    return {
        restrict: 'A',
        template: "<div ng-repeat='filterColumn in userPreferenceOptions.filterColumns' class='pl-filter-options-parent'>" +
            "           <span><input type='checkbox' ng-model='filterColumn.__selected__' ng-change='selectFilterColumn(filterColumn)' ></span>" +
            "           <span ng-bind='filterColumn.label' ng-class='{\"selected\":filterColumn.__selected__}'></span>" +
            "    </div>",
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.selectFilterColumn = function (filterColumn) {
                        $scope.userPreferenceOptions.lastSelectedInfo = 'Filter';
                        filterColumn.activeMode = true;
                        if (filterColumn.__selected__) {
                            $scope.userPreferenceOptions.filterInfo.push(filterColumn);
                        } else {
                            $scope.removeFilterColumnFromFilterInfo(filterColumn);
                        }
                        $scope.showApplyButton();
                    }
                }
            }
        }
    };
}]);

pl.directive('plFilterInfo', [ "$compile", "$filter", function ($compile, $filter) {
    return {
        restrict: 'E',
        template: "<div pl-group-info ng-show='userPreferenceOptions.filterInfo.length > 0 && userPreferenceOptions.selectedType == \"Filter\"' >" +
            "       <div class='applied-filter-parent app-float-left pl-group-parent pl-border-radius-3px fltr-applied' ng-repeat='filter in userPreferenceOptions.filterInfo'>" +
            "           <div pl-filter-template ng-show='!filter.activeMode' ng-click='filter.activeMode=true;userPreferenceOptions.__apply__=true;showCustomPopUp = undefined; showNDaysPopUp = undefined;' class='app-float-left filter-max-width  text-overflow'></div>" +
            "           <div pl-filter-editable-cell-template class='app-float-left pl-filter-edit-template' ng-show='filter.activeMode'></div>" +
            "           <div class='app-float-right app-cursor-pointe pl-theme-background pl-cross-filter ' ng-class='{\"show-on-hover\":!filter.activeMode}' ng-hide='filter.mandatory'>" +
            "               <div class='pl-remove-filter' ng-click='removeFilterColumnFromFilterInfo(filter, true)'><i class=\"icon-remove\" ></i></div>" +
            "           </div>" +
            "       </div>" +
            "</div>",

        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    var filterInfoLength = $scope.userPreferenceOptions.filterInfo ? $scope.userPreferenceOptions.filterInfo.length : 0;
                    for (var i = 0; i < filterInfoLength; i++) {
                        var filter = $scope.userPreferenceOptions.filterInfo[i];
                        if (filter.filter) {
                            if (Utility.isJSONObject(filter.filter[filter.field])) {
                                for (var key in filter.filter[filter.field]) {
                                    if (key == '$function') {
                                        var currentDate = new Date();
                                        if (filter.filter[filter.field][key] == 'Functions.CurrentDateFilter') {
                                            filter.value = $filter('date')(currentDate, "dd/MM/yyyy");
                                        } else if (filter.filter[filter.field][key] == 'Functions.CurrentWeekFilter') {
                                            var weekFirstDay = new Date(currentDate);
                                            weekFirstDay.setDate(currentDate.getDate() - currentDate.getDay());
                                            var weekLastDay = new Date(currentDate);
                                            weekLastDay.setDate((currentDate.getDate() - currentDate.getDay()) + 6);
                                            filter.value = $filter('date')(weekFirstDay, "dd/MM/yyyy") + " - " + $filter('date')(weekLastDay, "dd/MM/yyyy");
                                        } else if (filter.filter[filter.field][key] == 'Functions.CurrentMonthFilter') {
                                            filter.value = $filter('date')(currentDate, "MMMM-yyyy");
                                        } else if (filter.filter[filter.field][key] == 'Functions.CurrentYearFilter') {
                                            filter.value = $filter('date')(new Date(), "yyyy");
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };
}
]);

pl.directive('plFilterEditableCellTemplate', ['$compile', '$timeout', function ($compile, $timeout) {
    'use strict';
    return {
        restrict: 'A',
        link: function ($scope, iElement) {
            var template = $scope.filter.editableCellTemplate;

            if (angular.isUndefined(template) && $scope.userPreferenceOptions.filterColumns && $scope.userPreferenceOptions.filterColumns.length > 0) {
                for (var i = 0; i < $scope.userPreferenceOptions.filterColumns.length; i++) {
                    var filterColumn = $scope.userPreferenceOptions.filterColumns[i];
                    if (filterColumn.field == $scope.filter.field) {
                        template = filterColumn.editableCellTemplate;
                        var label = $scope.filter.filterOperators && $scope.filter.filterOperators.label ? $scope.filter.filterOperators.label : undefined;
                        if (label && filterColumn.filterOperators) {
                            $scope.filter.filterOperators = filterColumn.filterOperators;
                            $scope.filter.filterOperators.label = label;

                        }
                        break;
                    }
                }
            }
            iElement.append($compile(template)($scope));
            $scope.$watch('filter.activeMode', function (newValue) {
                if (newValue) {
                    $timeout(function () {
                        iElement.find('input.form-control').focus().select();
                    }, 0);
                }
            });

        }
    };
}]);

pl.directive('plFilterTemplate', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: 'A',
        link: function ($scope, iElement) {
            var template = $scope.filter.cellTemplate;
            if (angular.isUndefined(template) && $scope.userPreferenceOptions.filterColumns && $scope.userPreferenceOptions.filterColumns.length > 0) {
                for (var i = 0; i < $scope.userPreferenceOptions.filterColumns.length; i++) {
                    var filterColumn = $scope.userPreferenceOptions.filterColumns[i];
                    if (filterColumn.field == $scope.filter.field) {
                        template = filterColumn.cellTemplate;
                        break;
                    }
                }
            }


            iElement.append($compile(template)($scope));

        }
    };
}]);

pl.directive('plSort', [ "$compile", function ($compile) {
    return {
        restrict: 'A',
        template: "<div ng-repeat='sortColumn in userPreferenceOptions.sortColumns' class='pl-sort-options-parent'>" +
            "       <div class='app-float-left' style='margin-right:5px;'>" +
            "           <span><input type='checkbox' ng-model='sortColumn.__selected__' ng-change='selectSortColumn(sortColumn)'></span>" +
            "           <span ng-bind='sortColumn.label'  ng-class='{\"selected\":sortColumn.__selected__}'></span>" +
            "       </div>" +
            "    </div>",
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.selectSortColumn = function (sortColumn) {
                        $scope.userPreferenceOptions.lastSelectedInfo = 'Sort';
                        sortColumn.activeMode = true;
                        if (sortColumn.__selected__) {
                            $scope.userPreferenceOptions.sortInfo.push(sortColumn);
                        } else {
                            $scope.removeGroupColumnFromSortInfo(sortColumn);
                        }
                        $scope.showApplyButton();
                    }
                }
            }
        }
    };
}]);

pl.directive('plSortInfo', [ "$compile", function ($compile) {
    return {
        restrict: 'E',
        template: "<div ng-show='userPreferenceOptions.sortInfo.length > 0 && userPreferenceOptions.selectedType == \"Sort\"' class=' app-float-left'>" +
            "       <div class='applied-filter-parent app-float-left pl-group-parent fltr-applied' ng-repeat='sInfo in userPreferenceOptions.sortInfo'>" +

            "           <div ng-show='!sInfo.activeMode' ng-click='sInfo.activeMode=true;userPreferenceOptions.__apply__=true' class='app-float-left pl-user-preference-widget filter-max-width'>" +
            "               <span ng-bind='sInfo.label' title='{{sInfo.label}}' pl-sort-drag ng-controller='plUserPreferenceController'></span>" +
            "               <span ng-show='sInfo.value==\"Asc\"' class='icon-caret-up'></span>" +
            "               <span ng-show='sInfo.value==\"Dsc\"' class='icon-caret-right-down'></span>" +
            "           </div>" +

            "           <div ng-show='sInfo.activeMode' class='app-float-left pl-sort-template'>" +
            "               <span class='app-float-left app-padding-right-five-px' ng-bind-template='{{sInfo.label}} : '></span>" +
            "               <span class='app-float-left'>" +
            "                   <input type='radio' value='Asc' ng-model='sInfo.value' style='margin:6px 5px 0 0;'/>" +
            "               </span>" +
            "               <span class='app-float-left app-padding-right-five-px'>Asc</span>" +
            "               <span class='app-float-left '>" +
            "                   <input type='radio' value='Dsc' ng-model='sInfo.value' style='margin:6px 5px 0 0'/>" +
            "               </span>" +
            "               <span class='app-float-left app-padding-right-five-px'>Dsc</span>" +
            "           </div>" +
            "           <div class='app-float-right app-cursor-pointer pl-theme-background pl-cross-filter show-on-hover' ng-click='removeGroupColumnFromSortInfo(sInfo, true)'>" +
            "               <div class='pl-remove-filter' ><i class=\"icon-remove\"></i></div>" +
            "           </div>" +
            "           <div class='app-float-right app-cursor-pointer pl-theme-background pl-cross-filter' ng-if='sInfo.activeMode' ng-click='removeGroupColumnFromSortInfo(sInfo, true)'>" +
            "               <div class='pl-remove-filter' ><i class=\"icon-remove\"></i></div>" +
            "           </div>" +
            "       </div>" +
            "</div>"
    };
}
]);

pl.directive('plSortDrag', ["$compile" , function ($compile) {
    return{
        restrict: 'A',
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    $scope.dragElement($scope, iElement, $scope.sInfo, 'sortInfo');
                }
            }
        }
    }
}]);
/*text-angular.min starts from here*/
function a(a, b) {
    if (!a || "" === a || c.hasOwnProperty(a)) {
        throw"textAngular Error: A unique name is required for a Tool Definition";
    }
    if (b.display && ("" === b.display || 0 === angular.element(b.display).length) || !b.display && !b.buttontext && !b.iconclass) {
        throw'textAngular Error: Tool Definition for "' + a + '" does not have a valid display/iconclass/buttontext value';
    }
    c[a] = b
}

pl.value("taOptions", {toolbar: [
    ["h1", "h2", "h3", "h4", "h5", "h6", "p", "pre", "quote"],
    ["bold", "italics", "underline"],
    ["ul", "ol", "redo", "undo", "clear"] ,
    ["justifyLeft", "justifyCenter", "justifyRight"],
    ["html", "insertImage", "insertLink", "unlink"]
], classes: {focussed: "focussed", toolbar: "btn-toolbar", toolbarGroup: "btn-group", toolbarButton: "btn btn-default", toolbarButtonActive: "active", disabled: "disabled", textEditor: "form-control", htmlEditor: "form-control"}, setup: {textEditorSetup: function () {
}, htmlEditorSetup: function () {
}}});
var c = {};
pl.constant("taRegisterTool", a),
    pl.value("taTools", c),
    pl.config(["taRegisterTool", function (a) {
        angular.forEach(c, function (a, b) {
            delete c[b]
        }), a("html", {buttontext: "Toggle HTML", action: function () {
            this.$editor().switchView()
        }, activeState: function () {
            return this.$editor().showHtml
        }});
        var b = function (a) {
            return function () {
                return this.$editor().queryFormatBlockState(a)
            }
        }, d = function () {
            return this.$editor().wrapSelection("formatBlock", "<" + this.name.toUpperCase() + ">")
        };
        angular.forEach(["h1", "h2", "h3", "h4", "h5", "h6"], function (c) {
            a(c.toLowerCase(), {buttontext: c.toUpperCase(), action: d, activeState: b(c.toLowerCase())})
        }), a("p", {buttontext: "P", action: function () {
            return this.$editor().wrapSelection("formatBlock", "<P>")
        }, activeState: function () {
            return this.$editor().queryFormatBlockState("p")
        }}), a("pre", {buttontext: "pre", action: function () {
            return this.$editor().wrapSelection("formatBlock", "<PRE>")
        }, activeState: function () {
            return this.$editor().queryFormatBlockState("pre")
        }}), a("ul", {iconclass: "fa fa-list-ul", action: function () {
            return this.$editor().wrapSelection("insertUnorderedList", null)
        }, activeState: function () {
            return document.queryCommandState("insertUnorderedList")
        }}), a("ol", {iconclass: "fa fa-list-ol", action: function () {
            return this.$editor().wrapSelection("insertOrderedList", null)
        }, activeState: function () {
            return document.queryCommandState("insertOrderedList")
        }}), a("quote", {iconclass: "fa fa-quote-right", action: function () {
            return this.$editor().wrapSelection("formatBlock", "<BLOCKQUOTE>")
        }, activeState: function () {
            return this.$editor().queryFormatBlockState("blockquote")
        }}), a("undo", {iconclass: "fa fa-undo", action: function () {
            return this.$editor().wrapSelection("undo", null)
        }}), a("redo", {iconclass: "fa fa-repeat", action: function () {
            return this.$editor().wrapSelection("redo", null)
        }}), a("bold", {iconclass: "fa fa-bold", action: function () {
            return this.$editor().wrapSelection("bold", null)
        }, activeState: function () {
            return document.queryCommandState("bold")
        }, commandKeyCode: 98}), a("justifyLeft", {iconclass: "fa fa-align-left", action: function () {
            return this.$editor().wrapSelection("justifyLeft", null)
        }, activeState: function (a) {
            var b = !1;
            return a && (b = "left" === a.css("text-align") || "left" === a.attr("align") || "right" !== a.css("text-align") && "center" !== a.css("text-align") && !document.queryCommandState("justifyRight") && !document.queryCommandState("justifyCenter")), b = b || document.queryCommandState("justifyLeft")
        }}), a("justifyRight", {iconclass: "fa fa-align-right", action: function () {
            return this.$editor().wrapSelection("justifyRight", null)
        }, activeState: function (a) {
            var b = !1;
            return a && (b = "right" === a.css("text-align")), b = b || document.queryCommandState("justifyRight")
        }}), a("justifyCenter", {iconclass: "fa fa-align-center", action: function () {
            return this.$editor().wrapSelection("justifyCenter", null)
        }, activeState: function (a) {
            var b = !1;
            return a && (b = "center" === a.css("text-align")), b = b || document.queryCommandState("justifyCenter")
        }}), a("italics", {iconclass: "fa fa-italic", action: function () {
            return this.$editor().wrapSelection("italic", null)
        }, activeState: function () {
            return document.queryCommandState("italic")
        }, commandKeyCode: 105}), a("underline", {iconclass: "fa fa-underline", action: function () {
            return this.$editor().wrapSelection("underline", null)
        }, activeState: function () {
            return document.queryCommandState("underline")
        }, commandKeyCode: 117}), a("clear", {iconclass: "fa fa-ban", action: function (a, b) {
            this.$editor().wrapSelection("removeFormat", null);
            var c = [];
            if (this.$window.rangy && this.$window.rangy.getSelection && 1 === (c = this.$window.rangy.getSelection().getAllRanges()).length) {
                var d = angular.element(c[0].commonAncestorContainer), e = function (a) {
                    a = angular.element(a);
                    var b = a;
                    angular.forEach(a.children(), function (a) {
                        var c = angular.element("<p></p>");
                        c.html(angular.element(a).html()), b.after(c), b = c
                    }), a.remove()
                };
                angular.forEach(d.find("ul"), e), angular.forEach(d.find("ol"), e);
                var f = this.$editor(), g = function (a) {
                    a = angular.element(a), a[0] !== f.displayElements.text[0] && a.removeAttr("class"), angular.forEach(a.children(), g)
                };
                angular.forEach(d, g), "ol" === d[0].tagName.toLowerCase() || "ul" === d[0].tagName.toLowerCase() ? c[0].containsNode(d[0], !1) && e(d[0]) : "li" !== d[0].tagName.toLowerCase() && this.$editor().wrapSelection("formatBlock", "<p>")
            } else this.$editor().wrapSelection("formatBlock", "<p>");
            b()
        }}), a("insertImage", {iconclass: "fa fa-picture-o", action: function () {
            var a;
            return a = prompt("Please enter an image URL to insert", "http://"), "" !== a && "http://" !== a ? this.$editor().wrapSelection("insertImage", a) : void 0
        }}), a("insertLink", {iconclass: "fa fa-link", action: function () {
            var a;
            return a = prompt("Please enter an URL to insert", "http://"), "" !== a && "http://" !== a ? this.$editor().wrapSelection("createLink", a) : void 0
        }, activeState: function (a) {
            return a ? "A" === a[0].tagName : !1
        }}), a("unlink", {iconclass: "fa fa-unlink", action: function () {
            return this.$editor().wrapSelection("unlink", null)
        }, activeState: function (a) {
            return a ? "A" === a[0].tagName : !1
        }})
    }]),
    pl.directive("textAngular", ["$compile", "$timeout", "taOptions", "taSanitize", "textAngularManager", "$window", function (a, b, c, d, e, f) {
        return{
            require: "ngModel",
            scope: {},
            restrict: "EA",
            link: function (d, g, h, i) {
                var j, k, l, m, n, o, p, q, r = Math.floor(1e16 * Math.random()), s = h.name ? h.name : "textAngularEditor" + r;
                angular.extend(d, angular.copy(c), {wrapSelection: function (a, b) {
                    try {
                        document.execCommand(a, !1, b)
                    } catch (c) {
                    }
                    d.displayElements.text[0].focus()
                }, showHtml: !1}), h.taFocussedClass && (d.classes.focussed = h.taFocussedClass), h.taTextEditorClass && (d.classes.textEditor = h.taTextEditorClass), h.taHtmlEditorClass && (d.classes.htmlEditor = h.taHtmlEditorClass), h.taTextEditorSetup && (d.setup.textEditorSetup = d.$parent.$eval(h.taTextEditorSetup)), h.taHtmlEditorSetup && (d.setup.htmlEditorSetup = d.$parent.$eval(h.taHtmlEditorSetup)), p = g[0].innerHTML, g[0].innerHTML = "", d.displayElements = {forminput: angular.element("<input type='hidden' tabindex='-1' style='display: none;'>"), html: angular.element("<textarea></textarea>"), text: angular.element("<div></div>")}, d.setup.htmlEditorSetup(d.displayElements.html), d.setup.textEditorSetup(d.displayElements.text), d.displayElements.html.attr({id: "taHtmlElement", "ng-show": "showHtml", "ta-bind": "ta-bind", "ng-model": "html"}), d.displayElements.text.attr({id: "taTextElement", contentEditable: "true", "ng-hide": "showHtml", "ta-bind": "ta-bind", "ng-model": "html", "ng-model-options": '{ updateOn: \"blur\" }'}), g.append(d.displayElements.text), g.append(d.displayElements.html), d.displayElements.forminput.attr("name", s), g.append(d.displayElements.forminput), h.tabindex && (d.displayElements.text.attr("tabindex", h.tabindex), d.displayElements.html.attr("tabindex", h.tabindex)), h.placeholder && (d.displayElements.text.attr("placeholder", h.placeholder), d.displayElements.html.attr("placeholder", h.placeholder)), h.taDisabled && (d.displayElements.text.attr("ta-readonly", "disabled"), d.displayElements.html.attr("ta-readonly", "disabled"), d.disabled = d.$parent.$eval(h.taDisabled), d.$parent.$watch(h.taDisabled, function (a) {
                    d.disabled = a, d.disabled ? g.addClass(d.classes.disabled) : g.removeClass(d.classes.disabled)
                })), a(d.displayElements.text)(d), a(d.displayElements.html)(d), g.addClass("ta-root"), d.displayElements.text.addClass("ta-text ta-editor " + d.classes.textEditor), d.displayElements.html.addClass("ta-html ta-editor " + d.classes.textEditor), d._actionRunning = !1;
                var t = !1;
                if (d.startAction = function () {
                    return d._actionRunning = !0, f.rangy && f.rangy.saveSelection ? (t = f.rangy.saveSelection(), function () {
                        t && f.rangy.restoreSelection(t)
                    }) : void 0
                }, d.endAction = function () {
                    d._actionRunning = !1, t && rangy.removeMarkers(t), t = !1, d.updateSelectedStyles(), d.showHtml || d.updateTaBindtaTextElement()
                }, n = function () {
                    g.addClass(d.classes.focussed), q.focus()
                }, d.displayElements.html.on("focus", n), d.displayElements.text.on("focus", n), o = function (a) {
                    return b(function () {
                        d._actionRunning || document.activeElement === d.displayElements.html[0] || document.activeElement === d.displayElements.text[0] || (g.removeClass(d.classes.focussed), q.unfocus(), b(function () {
                            g.triggerHandler("blur")
                        }, 0))
                    }, 100), a.preventDefault(), !1
                }, d.displayElements.html.on("blur", o), d.displayElements.text.on("blur", o), d.queryFormatBlockState = function (a) {
                    return a.toLowerCase() === document.queryCommandValue("formatBlock").toLowerCase()
                }, d.switchView = function () {
                    d.showHtml = !d.showHtml, d.showHtml ? b(function () {
                        return d.displayElements.html[0].focus()
                    }, 100) : b(function () {
                        return d.displayElements.text[0].focus()
                    }, 100)
                }, h.ngModel) {
                    var u = !0;
                    i.$render = function () {
                        if (u) {
                            u = !1;
                            var a = d.$parent.$eval(h.ngModel);
                            void 0 !== a && null !== a || !p || "" === p || i.$setViewValue(p)
                        }
                        d.displayElements.forminput.val(i.$viewValue), document.activeElement !== d.displayElements.html[0] && document.activeElement !== d.displayElements.text[0] && (d.html = i.$viewValue || "")
                    }
                } else d.displayElements.forminput.val(p), d.html = p;
                if (d.$watch("html", function (a, b) {
                    a !== b && (h.ngModel && i.$setViewValue(a), d.displayElements.forminput.val(a))
                }), h.taTargetToolbars)q = e.registerEditor(s, d, h.taTargetToolbars.split(",")); else {
                    var v = angular.element('<div text-angular-toolbar name="textAngularToolbar' + r + '">');
                    h.taToolbar && v.attr("ta-toolbar", h.taToolbar), h.taToolbarClass && v.attr("ta-toolbar-class", h.taToolbarClass), h.taToolbarGroupClass && v.attr("ta-toolbar-group-class", h.taToolbarGroupClass), h.taToolbarButtonClass && v.attr("ta-toolbar-button-class", h.taToolbarButtonClass), h.taToolbarActiveButtonClass && v.attr("ta-toolbar-active-button-class", h.taToolbarActiveButtonClass), h.taFocussedClass && v.attr("ta-focussed-class", h.taFocussedClass), g.prepend(v), a(v)(d.$parent), q = e.registerEditor(s, d, ["textAngularToolbar" + r])
                }
                d.$on("$destroy", function () {
                    e.unregisterEditor(s)
                }), d._bUpdateSelectedStyles = !1, d.updateSelectedStyles = function () {
                    var a;
                    f.rangy && f.rangy.getSelection && 1 === (a = f.rangy.getSelection().getAllRanges()).length && a[0].commonAncestorContainer.parentNode !== d.displayElements.text[0] ? q.updateSelectedStyles(angular.element(a[0].commonAncestorContainer.parentNode)) : q.updateSelectedStyles(), d._bUpdateSelectedStyles && b(d.updateSelectedStyles, 200)
                }, j = function () {
                    d._bUpdateSelectedStyles || (d._bUpdateSelectedStyles = !0, d.$apply(function () {
                        d.updateSelectedStyles()
                    }))
                }, d.displayElements.html.on("keydown", j), d.displayElements.text.on("keydown", j), k = function () {
                    d._bUpdateSelectedStyles = !1
                }, d.displayElements.html.on("keyup", k), d.displayElements.text.on("keyup", k), l = function (a) {
                    d.$apply(function () {
                        return q.sendKeyCommand(a) ? (d._bUpdateSelectedStyles || d.updateSelectedStyles(), a.preventDefault(), !1) : void 0
                    })
                }, d.displayElements.html.on("keypress", l), d.displayElements.text.on("keypress", l), m = function () {
                    d._bUpdateSelectedStyles = !1, d.$apply(function () {
                        d.updateSelectedStyles()
                    })
                }, d.displayElements.html.on("mouseup", m), d.displayElements.text.on("mouseup", m)
            }}
    }]);
pl.directive("taBind", ["taSanitize", "$timeout", "taFixChrome", function (a, b, c) {
    return{require: "ngModel", scope: {}, link: function (d, e, f, g) {
        var h = void 0 !== e.attr("contenteditable") && e.attr("contenteditable"), i = h || "textarea" === e[0].tagName.toLowerCase() || "input" === e[0].tagName.toLowerCase(), j = !1, k = function () {
            if (h)return e[0].innerHTML;
            if (i)return e.val();
            throw"textAngular Error: attempting to update non-editable taBind"
        };
        d.$parent["updateTaBind" + (f.id || "")] = function () {
            j || g.$setViewValue(k())
        }, i && (e.on("paste cut", function () {
            j || b(function () {
                g.$setViewValue(k())
            }, 0)
        }), h ? (e.on("keyup", function () {
            j || g.$setViewValue(k())
        }), e.on("blur", function () {
            var a = k();
            "" === a && e.attr("placeholder") && e.addClass("placeholder-text"), j || g.$setViewValue(k()), g.$render()
        }), e.attr("placeholder") && (e.addClass("placeholder-text"), e.on("focus", function () {
            e.removeClass("placeholder-text"), g.$render()
        }))) : e.on("change blur", function () {
            j || g.$setViewValue(k())
        }));
        var l = function (b) {
            return g.$oldViewValue = a(c(b), g.$oldViewValue)
        };
        g.$parsers.push(l), g.$formatters.push(l), g.$render = function () {
            if (document.activeElement !== e[0]) {
                var a = g.$viewValue || "";
                h ? (e[0].innerHTML = "" === a && e.attr("placeholder") && e.hasClass("placeholder-text") ? e.attr("placeholder") : a, j || e.find("a").on("click", function (a) {
                    return a.preventDefault(), !1
                })) : "textarea" !== e[0].tagName.toLowerCase() && "input" !== e[0].tagName.toLowerCase() ? e[0].innerHTML = a : e.val(a)
            }
        }, f.taReadonly && (j = d.$parent.$eval(f.taReadonly), j ? (("textarea" === e[0].tagName.toLowerCase() || "input" === e[0].tagName.toLowerCase()) && e.attr("disabled", "disabled"), void 0 !== e.attr("contenteditable") && e.attr("contenteditable") && e.removeAttr("contenteditable")) : "textarea" === e[0].tagName.toLowerCase() || "input" === e[0].tagName.toLowerCase() ? e.removeAttr("disabled") : h && e.attr("contenteditable", "true"), d.$parent.$watch(f.taReadonly, function (a, b) {
            b !== a && (a ? (("textarea" === e[0].tagName.toLowerCase() || "input" === e[0].tagName.toLowerCase()) && e.attr("disabled", "disabled"), void 0 !== e.attr("contenteditable") && e.attr("contenteditable") && e.removeAttr("contenteditable")) : "textarea" === e[0].tagName.toLowerCase() || "input" === e[0].tagName.toLowerCase() ? e.removeAttr("disabled") : h && e.attr("contenteditable", "true"), j = a)
        }))
    }}
}]);
pl.factory("taFixChrome", function () {
    var a = function (a) {
        for (var b = angular.element("<div>" + a + "</div>"), c = angular.element(b).find("span"), d = 0; d < c.length; d++) {
            var e = angular.element(c[d]);
            e.attr("style") && e.attr("style").match(/line-height: 1.428571429;|color: inherit; line-height: 1.1;/i) && (e.attr("style", e.attr("style").replace(/( |)font-family: inherit;|( |)line-height: 1.428571429;|( |)line-height:1.1;|( |)color: inherit;/gi, "")), e.attr("style") && "" !== e.attr("style") || (e.next().length > 0 && "BR" === e.next()[0].tagName && e.next().remove(), e.replaceWith(e[0].innerHTML)))
        }
        var f = b[0].innerHTML.replace(/style="[^"]*?(line-height: 1.428571429;|color: inherit; line-height: 1.1;)[^"]*"/gi, "");
        return f !== b[0].innerHTML && (b[0].innerHTML = f), b[0].innerHTML
    };
    return a
});
pl.factory("taSanitize", ["$sanitize", function (a) {
    function b(a, c) {
        var d = [], e = a.children();
        return e.length && angular.forEach(e, function (a) {
            d = d.concat(b(angular.element(a), c))
        }), a.attr(c) && d.push(a), d
    }

    return function (c, d) {
        var e = angular.element("<div>" + c + "</div>");
        angular.forEach(b(e, "align"), function (a) {
            a.css("text-align", a.attr("align")), a.removeAttr("align")
        }), c = e[0].innerHTML;
        var f;
        try {
            f = a(c)
        } catch (g) {
            f = d || ""
        }
        return f
    }
}]);
pl.directive("textAngularToolbar", ["$compile", "textAngularManager", "taOptions", "taTools", "taToolExecuteAction", "$window", function (a, b, c, d, e, f) {
    return{scope: {name: "@"}, restrict: "EA", link: function (g, h, i) {
        if (!g.name || "" === g.name)throw"textAngular Error: A toolbar requires a name";
        angular.extend(g, angular.copy(c)), i.taToolbar && (g.toolbar = g.$parent.$eval(i.taToolbar)), i.taToolbarClass && (g.classes.toolbar = i.taToolbarClass), i.taToolbarGroupClass && (g.classes.toolbarGroup = i.taToolbarGroupClass), i.taToolbarButtonClass && (g.classes.toolbarButton = i.taToolbarButtonClass), i.taToolbarActiveButtonClass && (g.classes.toolbarButtonActive = i.taToolbarActiveButtonClass), i.taFocussedClass && (g.classes.focussed = i.taFocussedClass), g.disabled = !0, g.focussed = !1, h[0].innerHTML = "", h.addClass("ta-toolbar " + g.classes.toolbar), g.$watch("focussed", function () {
            g.focussed ? h.addClass(g.classes.focussed) : h.removeClass(g.classes.focussed)
        }), setupToolElement = function (b, c) {
            var d;
            if (d = angular.element(b && b.display ? b.display : "<button type='button'>"), d.addClass(g.classes.toolbarButton), d.attr("name", c.name), d.attr("unselectable", "on"), d.attr("ng-disabled", "isDisabled()"), d.attr("tabindex", "-1"), d.attr("ng-click", "executeAction()"), d.attr("ng-class", "displayActiveToolClass(active)"), d.on("mousedown", function (a) {
                return a.preventDefault(), !1
            }), b && !b.display && !c._display && (d[0].innerHTML = "", b.buttontext && (d[0].innerHTML = b.buttontext), b.iconclass)) {
                var e = angular.element("<i>"), f = d[0].innerHTML;
                e.addClass(b.iconclass), d[0].innerHTML = "", d.append(e), f && "" !== f && d.append("&nbsp;" + f)
            }
            return c._lastToolDefinition = angular.copy(b), a(d)(c)
        }, g.tools = {}, g._parent = {disabled: !0, showHtml: !1, queryFormatBlockState: function () {
            return!1
        }};
        var j = {$window: f, $editor: function () {
            return g._parent
        }, isDisabled: function () {
            return this.$eval("disabled") || this.$eval("disabled()") || "html" !== this.name && this.$editor().showHtml || this.$parent.disabled || this.$editor().disabled
        }, displayActiveToolClass: function (a) {
            return a ? g.classes.toolbarButtonActive : ""
        }, executeAction: e};
        angular.forEach(g.toolbar, function (a) {
            groupElement = angular.element("<div>"), groupElement.addClass(g.classes.toolbarGroup), angular.forEach(a, function (a) {
                g.tools[a] = angular.extend(g.$new(!0), d[a], j, {name: a}), g.tools[a].$element = setupToolElement(d[a], g.tools[a]), groupElement.append(g.tools[a].$element)
            }), h.append(groupElement)
        }), g.updateToolDisplay = function (a, b, c) {
            var d = g.tools[a];
            if (d) {
                if (d._lastToolDefinition && !c && (b = angular.extend({}, d._lastToolDefinition, b)), null === b.buttontext && null === b.iconclass && null === b.display)throw'textAngular Error: Tool Definition for updating "' + a + '" does not have a valid display/iconclass/buttontext value';
                null === b.buttontext && delete b.buttontext, null === b.iconclass && delete b.iconclass, null === b.display && delete b.display, toolElement = setupToolElement(b, d), d.$element.replaceWith(toolElement), d.$element = toolElement
            }
        }, b.registerToolbar(g), g.$on("$destroy", function () {
            b.unregisterToolbar(g.name)
        })
    }}
}]);
pl.service("taToolExecuteAction", ["$q", function (a) {
    return function (b) {
        void 0 !== b && (this.$editor = function () {
            return b
        });
        var c = a.defer(), d = c.promise, e = this.$editor();
        d["finally"](function () {
            e.endAction.call(e)
        });
        var f;
        try {
            f = this.action(c, e.startAction())
        } catch (g) {
        }
        (f || void 0 === f) && c.resolve()
    }
}]);
pl.service("textAngularManager", ["taToolExecuteAction", function (a) {
    var b = {}, d = {};
    return{registerEditor: function (e, f, g) {
        if (!e || "" === e)throw"textAngular Error: An editor requires a name";
        if (!f)throw"textAngular Error: An editor requires a scope";
        if (d[e])throw'textAngular Error: An Editor with name "' + e + '" already exists';
        var h = [];
        return angular.forEach(g, function (a) {
            b[a] && h.push(b[a])
        }), d[e] = {scope: f, toolbars: g, _registerToolbar: function (a) {
            this.toolbars.indexOf(a.name) >= 0 && h.push(a)
        }, editorFunctions: {disable: function () {
            angular.forEach(h, function (a) {
                a.disabled = !0
            })
        }, enable: function () {
            angular.forEach(h, function (a) {
                a.disabled = !1
            })
        }, focus: function () {
            angular.forEach(h, function (a) {
                a._parent = f, a.disabled = !1, a.focussed = !0
            })
        }, unfocus: function () {
            angular.forEach(h, function (a) {
                a.disabled = !0, a.focussed = !1
            })
        }, updateSelectedStyles: function (a) {
            angular.forEach(h, function (b) {
                angular.forEach(b.tools, function (b) {
                    b.activeState && (b.active = b.activeState(a))
                })
            })
        }, sendKeyCommand: function (b) {
            var d = !1;
            return(b.ctrlKey || b.metaKey) && angular.forEach(c, function (c, e) {
                if (c.commandKeyCode && c.commandKeyCode === b.which)for (var g = 0; g < h.length; g++)if (void 0 !== h[g].tools[e]) {
                    a.call(h[g].tools[e], f), d = !0;
                    break
                }
            }), d
        }}}, d[e].editorFunctions
    }, retrieveEditor: function (a) {
        return d[a]
    }, unregisterEditor: function (a) {
        delete d[a]
    }, registerToolbar: function (a) {
        if (!a)throw"textAngular Error: A toolbar requires a scope";
        if (!a.name || "" === a.name)throw"textAngular Error: A toolbar requires a name";
        if (b[a.name])throw'textAngular Error: A toolbar with name "' + a.name + '" already exists';
        b[a.name] = a, angular.forEach(d, function (b) {
            b._registerToolbar(a)
        })
    }, retrieveToolbar: function (a) {
        return b[a]
    }, retrieveToolbarsViaEditor: function (a) {
        var b = [], c = this;
        return angular.forEach(this.retrieveEditor(a).toolbars, function (a) {
            b.push(c.retrieveToolbar(a))
        }), b
    }, unregisterToolbar: function (a) {
        delete b[a]
    }, updateToolsDisplay: function (a) {
        var b = this;
        angular.forEach(a, function (a, c) {
            b.updateToolDisplay(c, a)
        })
    }, resetToolsDisplay: function () {
        var a = this;
        angular.forEach(c, function (b, c) {
            a.resetToolDisplay(c)
        })
    }, updateToolDisplay: function (a, c) {
        var d = this;
        angular.forEach(b, function (b, e) {
            d.updateToolbarToolDisplay(e, a, c)
        })
    }, resetToolDisplay: function (a) {
        var c = this;
        angular.forEach(b, function (b, d) {
            c.resetToolbarToolDisplay(d, a)
        })
    }, updateToolbarToolDisplay: function (a, c, d) {
        if (!b[a])throw'textAngular Error: No Toolbar with name "' + a + '" exists';
        b[a].updateToolDisplay(c, d)
    }, resetToolbarToolDisplay: function (a, d) {
        if (!b[a])throw'textAngular Error: No Toolbar with name "' + a + '" exists';
        b[a].updateToolDisplay(d, c[d], !0)
    }, refreshEditor: function (a) {
        if (!d[a])throw'textAngular Error: No Editor with name "' + a + '" exists';
        d[a].scope.updateTaBindtaTextElement(), d[a].scope.$$phase || d[a].scope.$digest()
    }}
}]);

/*applane-core statrs from here*/
var openPopup = new Array();
var counter = 0;
var Z_INDEX = 1000;

function Popup(options) {

    this.closeableIds = options.closeableIds;
    this.autoHide = options.autoHide;
    this.callBack = options.callBack;
    this.escEnabled = options.escEnabled;
    this.hideOnClick = options.hideOnClick;
    this.deffered = options.deffered;
    this.scope = options.scope;
    this.width = options.width;
    this.height = options.height;
    this.html = options.html;
    this.relativeElement = options.element;
    this.position = options.position;
    this.maxHeight = options.maxHeight;
    this.minHeight = options.minHeight;
    this.overflowY = options.overflowY;
    this.removeOtherAutoHidePopup = options.removeOtherAutoHidePopup;
    this.maxWidth = options.maxWidth;
    this.addInElement = options.addInElement;
    this.event = options.event;
    this.id = options.id;
    this.modal = !(this.autoHide);
    if (this.relativeElement && this.position != 'onchild' && this.position != 'right' && this.position != 'onPageClick') {
        this.position = null;
    }
    if (this.modal) {
        this.hideOnClick = false;
    }

    counter++;
    if (this.modal && this.autoHide) {
        this.parentid = 'innerpopup' + counter;
    } else {
        this.parentid = 'popup' + counter;
    }
    if (this.id) {
        this.id = 'popup-' + this.id;
    } else {
        this.id = 'popup' + counter;
    }

}

Popup.prototype.hide = function (e) {

    if (this.callBack != null) {
        var needToHide = this.callBack(false, e);
        if (isNotNull(needToHide) && needToHide == false) {
            return;
        }
    }


    while (openPopup.length > 0) {
        var popupLength = openPopup.length;
        if (popupLength > 0) {
            var lastPopup = openPopup[popupLength - 1];
            if (lastPopup.id == this.id) {
                $('#' + this.id).remove();
                openPopup.splice(popupLength - 1, 1);
                break;
            } else {
                lastPopup.hide(e);
            }


        }
    }
};
Popup.prototype.showPopup = function () {
    var that = this;
    if (that.deffered) {
        setTimeout(function () {
            that.show();
        }, 0);
    } else {
        that.show();
    }

};

Popup.prototype.show = function () {
    var that = this;
    if (this.removeOtherAutoHidePopup === undefined || this.removeOtherAutoHidePopup) {
        removeOtherAutoHidePopup(that);
    }

    if (this.callBack != null) {
        this.callBack(true);
    }


    var left = 0;
    var top = 0;


    var popupStyle = "";
    if (this.modal) {
        popupStyle = "top:0px;left:0px;bottom:0px;right:0px;overflow:auto;";
    } else {
        popupStyle = "top:" + top + "px; left:" + left + "px;";
    }


    popupStyle += ' z-index: ' + Z_INDEX + ';';
    var innerStyle = "";
    if (this.width) {
        innerStyle += "width:" + this.width + "px;";
    }
    if (this.maxWidth) {
        innerStyle += "max-width:" + this.maxWidth + "px;";
    }
    if (this.height) {
        innerStyle += "height:" + this.height + "px;";
    }

    if (this.maxHeight) {
        innerStyle += "max-height:" + this.maxHeight + "px;";
    }

    if (this.minHeight) {
        innerStyle += "min-height:" + this.minHeight + "px;";
    }

    if (this.overflowY) {
        innerStyle += "overflow-y:" + this.overflowY;
    }


    var htmlToShow = "<div id='" + this.id + "' style='" + popupStyle + "' class='popupContainer'><div id='inner" + this.id + "' style='" + innerStyle + "' class='popupwrapper app-mediumn-font'>" + "</div></div>";

    if (this.position == 'onchild') {
        var relativeElementHeight = $(this.relativeElement).height();
        var style = "min-height:" + relativeElementHeight + "px;width:" + this.width + "px;float:left;position:relative;z-index:" + Z_INDEX;
        htmlToShow = "<div id='" + this.id + "' class='popup_container' style='" + style + "'><div id='inner" + this.id + "' class='popup_wrapper'>" + "</div></div>";

        $(this.relativeElement).html(htmlToShow);

    } else {
        if (this.addInElement) {
            $(this.relativeElement).after(htmlToShow);
        } else {
            $('body').append(htmlToShow);
        }

    }

    openPopup.push(this);

    var popElement = $('#' + this.id);
    var innerElement = $('#inner' + this.id);
    innerElement.append($(this.html));


    if (this.position === 'center') {
        var windowHeight = $(window).height();
        var windowWidth = $(window).width();
        var actualHeight = innerElement.height();

        var innerWidth = innerElement.width();
        top = parseInt((windowHeight - actualHeight) / 2);
        left = parseInt((windowWidth - innerWidth) / 2);
        if (top < 0) {
            top = 0;
        }
        if (left < 0) {
            left = 0;
        }


        if (this.modal) {
            innerElement.css('left', left);
            innerElement.css('top', top);
        } else {
            popElement.css('left', left);
            popElement.css('top', top);
        }
    } else if (this.position === 'top-center') {

        var windowWidth = $(window).width();

        var innerWidth = innerElement.width();
        top = 5;
        left = parseInt((windowWidth - innerWidth) / 2);

        if (left < 0) {
            left = 0;
        }

        if (this.modal) {
            innerElement.css('left', left);
            innerElement.css('top', top);
        } else {
            popElement.css('left', left);
            popElement.css('top', top);
        }
    } else if (this.position == 'onPageClick') {
        var posX = this.event.clientX;
        var posY = this.event.clientY;
        var windowWidth = $(window).width();
        var windowHeight = $(window).height();
        var innerWidth = innerElement.width();
        var innerHeight = innerElement.height();
        if ((windowWidth - innerWidth) < (posX + 10)) {
            posX -= innerWidth;
        }
        if ((windowHeight - innerHeight) < (posY + 10)) {
            posY -= innerHeight;
        }
        popElement
            .css({
                top: posY,
                left: posX
            });

    } else if (this.relativeElement) {
        var offset = $(this.relativeElement).offset();
        var posY = offset.top - $(window).scrollTop();
        var posX = offset.left - $(window).scrollLeft();
        var elemHeight = $(this.relativeElement).offsetHeight;
        if (!elemHeight) {
            elemHeight = $(this.relativeElement).height();
        }
        var windowWidth = $(window).width();
        var innerWidth = innerElement.width();
        if ((posX + innerWidth) > windowWidth && posX >= innerWidth) {
            posX = (posX - innerWidth) + $(this.relativeElement).width();
//            posX = (posX - innerWidth) ;
        }
        if ((posX + innerWidth) >= windowWidth) {
            posX = 0;
        }
        var elementToSet = popElement;
        if (this.modal) {
            elementToSet = innerElement;
        }
        var topToSet = posY + elemHeight;
        if ((topToSet + innerElement.outerHeight()) >= $(window).height() && (topToSet >= (elemHeight + innerElement.outerHeight()))) {
            topToSet -= elemHeight + innerElement.outerHeight();
        }
        if (this.position == 'right') {
            if ((posX + innerWidth) > windowWidth) {
                posX -= innerWidth;
            } else {
//                posX += innerWidth;
            }
            topToSet = posY;
        }

        if (this.addInElement) {
            if (openPopup.length > 1) {  // handle nested pop up
                var lastPopUp = openPopup[openPopup.length - 2];
                var offset = $("#inner" + lastPopUp.id).offset();
                if ((offset.left + posX) > $(window).width()) {
                    var width = $("#inner" + lastPopUp.id).outerWidth();
                    posX += (width);
                    topToSet = offset.top;
                } else {
//                    posX = $(this.relativeElement).outerWidth();
                    var width = $("#inner" + lastPopUp.id).outerWidth();  //TODO: conditional work for application menu goes here.
                    topToSet = offset.top + $("#inner" + lastPopUp.id).height();
                    posX = $(this.relativeElement).outerWidth() + $(this.relativeElement).offset().left;   //TODO: add left so that popup will appear on left right side of the element
                }

            } else {
//                topToSet = $(this.relativeElement).outerHeight(true);
                if ((innerWidth + offset.left) > windowWidth) {
//                    posX = (offset.left - innerWidth);
                } else {
                    posX = offset.left;
                }
            }
        }
        if (this.position != 'onchild') {
            elementToSet
                .css({
                    top: topToSet,
                    left: posX
//                position:"absolute"
                });
        }


    } else {
        throw "Either position should be defined or relative Element should be passed";
    }


    popElement.css('visibility', 'visible');
};

function removeOtherAutoHidePopup(p) {

    var popupLength = openPopup.length;
    if (popupLength == 0) {
        return false;
    }
    var lastPopup = openPopup[popupLength - 1];
    var autoHide = lastPopup.autoHide;
    var modal = lastPopup.modal;
    if (autoHide && !modal) {
        var isChild = false;
        if (p.relativeElement) {
            isChild = ($("#" + lastPopup.id)).has($(p.relativeElement)).length > 0;
        }

        if (!isChild) {
            lastPopup.hide(null);
        }

    }
    return true;
}
function isNull(data) {
    return data == undefined || data == null;
}

function isNotNull(data) {
    return !(data == undefined || data == null);
}

function handleKeyDown(e) {
    if (e.keyCode === 27) {
        var popupLength = openPopup.length;
        if (popupLength == 0) {
            return;
        }
        var lastPopup = openPopup[popupLength - 1];

        if (lastPopup.escEnabled) {
            lastPopup.hide(e);
            var popupLength = openPopup.length;
            if (popupLength > 0) {
                handleKeyDown(e);
            }

        }
    }

}

$(document).on('keydown', function (e) {
    handleKeyDown(e);
});

function handleClick(e) {


    var popupLength = openPopup.length;
    if (popupLength == 0) {
        return;
    }
    var lastPopup = openPopup[popupLength - 1];

    var lastPopupId = lastPopup.parentid;

    var modal = lastPopup.modal;

    var targetElement = (e.target || e.srcElement);

    if (isNull(targetElement)) {
        return;
    }

    if (targetElement && targetElement.id && lastPopup.closeableIds && lastPopup.closeableIds.length > 0) {
        for (var i = 0; i < lastPopup.closeableIds.length; i++) {
            if (targetElement.id == lastPopup.closeableIds[i]) {
                lastPopup.hide();
                return;
            }
        }
    }

    if (lastPopup.hideOnClick) {
        lastPopup.hide(e);
        return;
    }

    if ($('#busy-message').css('display') == 'block') {
        return;
    }

    var innerElementFound = false;
    var targetParent = targetElement;

    var parentIdForDetail = targetParent.id;// to close detail form
    if (isNotNull(parentIdForDetail) && parentIdForDetail == lastPopup.id && lastPopup.escEnabled) {
        lastPopup.hide(e);
        return;
    }

    if (!innerElementFound) {
        while (true) {
            var parentId = targetParent.id;
            if (isNotNull(parentId) && parentId == lastPopupId) {
                innerElementFound = true;
                break;
            }

            targetParent = targetParent.parentNode;
            if (isNotNull(targetParent)) {
                var tagName = targetParent.tagName;
                if (isNull(tagName) || tagName.toLowerCase() == 'html' || tagName.toLowerCase() == 'body') {
                    break;
                }
            } else {
                break;
            }

        }
    }

    if (modal) {
        return;
    }
    if (!innerElementFound && lastPopup.escEnabled) {
        lastPopup.hide(e);
        var popupLength = openPopup.length;
        if (popupLength > 0) {
            handleClick(e);
        }
    }


}
$(document).on('click', function (e) {
    handleClick(e);
});

(function ($) {

    var $window = $(window);

    function UTCDate() {
        return new Date(Date.UTC.apply(Date, arguments));
    }

    function UTCToday() {
        var today = new Date();
        return UTCDate(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    }


    // Picker object

    var Datepicker = function (element, options) {
        var that = this;

        this._process_options(options);

        this.element = $(element);
        this.isInline = false;
        this.isInput = this.element.is('input');
        this.component = this.element.is('.date') ? this.element.find('.add-on, .btn') : false;

        this.hasInput = this.component && this.element.find('input').length;
        if (this.component && this.component.length === 0)
            this.component = false;

        this.component = this.element.siblings('[data-toggle="datepicker"]')


        this.picker = $(DPGlobal.template);
        this._buildEvents();
        this._attachEvents();

        if (this.isInline) {
            this.picker.addClass('datepicker-inline').appendTo(this.element);
        } else {
            this.picker.addClass('datepicker-dropdown dropdown-menu');
        }

        if (this.o.rtl) {
            this.picker.addClass('datepicker-rtl');
            this.picker.find('.prev i, .next i')
                .toggleClass('icon-arrow-left icon-arrow-right');
        }


        this.viewMode = this.o.startView;

        if (this.o.calendarWeeks)
            this.picker.find('tfoot th.today')
                .attr('colspan', function (i, val) {
                    return parseInt(val) + 1;
                });

        this._allow_update = false;

        this.setStartDate(this._o.startDate);
        this.setEndDate(this._o.endDate);
        this.setDaysOfWeekDisabled(this.o.daysOfWeekDisabled);

        this.fillDow();
        this.fillMonths();

        this._allow_update = true;

        this.update();
        this.showMode();

        if (this.isInline) {
            this.show();
        }
    };

    Datepicker.prototype = {
        constructor: Datepicker,

        _process_options: function (opts) {
            // Store raw options for reference
            this._o = $.extend({}, this._o, opts);
            // Processed options
            var o = this.o = $.extend({}, this._o);

            // Check if "de-DE" style date is available, if not language should
            // fallback to 2 letter code eg "de"
            var lang = o.language;
            if (!dates[lang]) {
                lang = lang.split('-')[0];
                if (!dates[lang])
                    lang = defaults.language;
            }
            o.language = lang;

            switch (o.startView) {
                case 2:
                case 'decade':
                    o.startView = 2;
                    break;
                case 1:
                case 'year':
                    o.startView = 1;
                    break;
                default:
                    o.startView = 0;
            }

            switch (o.minViewMode) {
                case 1:
                case 'months':
                    o.minViewMode = 1;
                    break;
                case 2:
                case 'years':
                    o.minViewMode = 2;
                    break;
                default:
                    o.minViewMode = 0;
            }

            o.startView = Math.max(o.startView, o.minViewMode);

            o.weekStart %= 7;
            o.weekEnd = ((o.weekStart + 6) % 7);

            var format = DPGlobal.parseFormat(o.format);
            if (o.startDate !== -Infinity) {
                if (!!o.startDate) {
                    if (o.startDate instanceof Date)
                        o.startDate = this._local_to_utc(this._zero_time(o.startDate));
                    else
                        o.startDate = DPGlobal.parseDate(o.startDate, format, o.language);
                } else {
                    o.startDate = -Infinity;
                }
            }
            if (o.endDate !== Infinity) {
                if (!!o.endDate) {
                    if (o.endDate instanceof Date)
                        o.endDate = this._local_to_utc(this._zero_time(o.endDate));
                    else
                        o.endDate = DPGlobal.parseDate(o.endDate, format, o.language);
                } else {
                    o.endDate = Infinity;
                }
            }

            o.daysOfWeekDisabled = o.daysOfWeekDisabled || [];
            if (!$.isArray(o.daysOfWeekDisabled))
                o.daysOfWeekDisabled = o.daysOfWeekDisabled.split(/[,\s]*/);
            o.daysOfWeekDisabled = $.map(o.daysOfWeekDisabled, function (d) {
                return parseInt(d, 10);
            });

            var plc = String(o.orientation).toLowerCase().split(/\s+/g),
                _plc = o.orientation.toLowerCase();
            plc = $.grep(plc, function (word) {
                return (/^auto|left|right|top|bottom$/).test(word);
            });
            o.orientation = {x: 'auto', y: 'auto'};
            if (!_plc || _plc === 'auto')
                ; // no action
            else if (plc.length === 1) {
                switch (plc[0]) {
                    case 'top':
                    case 'bottom':
                        o.orientation.y = plc[0];
                        break;
                    case 'left':
                    case 'right':
                        o.orientation.x = plc[0];
                        break;
                }
            }
            else {
                _plc = $.grep(plc, function (word) {
                    return (/^left|right$/).test(word);
                });
                o.orientation.x = _plc[0] || 'auto';

                _plc = $.grep(plc, function (word) {
                    return (/^top|bottom$/).test(word);
                });
                o.orientation.y = _plc[0] || 'auto';
            }
        },
        _events: [],
        _secondaryEvents: [],
        _applyEvents: function (evs) {
            for (var i = 0, el, ev; i < evs.length; i++) {
                el = evs[i][0];
                ev = evs[i][1];
                el.on(ev);
            }
        },
        _unapplyEvents: function (evs) {
            for (var i = 0, el, ev; i < evs.length; i++) {
                el = evs[i][0];
                ev = evs[i][1];
                el.off(ev);
            }
        },
        _buildEvents: function () {
            if (this.isInput) { // single input
                this._events = [
                    [this.element, {
//                        focus:$.proxy(this.show, this),
//                        keyup:$.proxy(this.update, this)
//                        keydown:$.proxy(this.keydown, this)
                    }],
                    [this.component, {
                        click: $.proxy(this.show, this)
                    }]
                ];
            }
            else if (this.component && this.hasInput) { // component: input + button
                this._events = [
                    // For components that are not readonly, allow keyboard nav
                    [this.element.find('input'), {
//                        focus:$.proxy(this.show, this),
//                        keyup:$.proxy(this.update, this),
//                        keydown:$.proxy(this.keydown, this)
                    }],
                    [this.component, {
                        click: $.proxy(this.show, this)
                    }]
                ];
            }
            else if (this.element.is('div')) {  // inline datepicker
                this.isInline = true;
            }
            else {
                this._events = [
                    [this.element, {
                        click: $.proxy(this.show, this)
                    }]
                ];
            }

            this._secondaryEvents = [
                [this.picker, {
                    click: $.proxy(this.click, this)
                }],
                [$(window), {
                    resize: $.proxy(this.place, this)
                }],
                [$(document), {
                    'mousedown touchstart': $.proxy(function (e) {
                        // Clicked outside the datepicker, hide it
                        if (!(
                            this.element.is(e.target) ||
                            this.element.find(e.target).length ||
                            this.picker.is(e.target) ||
                            this.picker.find(e.target).length
                            )) {
                            this.hide();
                        }
                    }, this)
                }]
            ];
        },
        _attachEvents: function () {
            this._detachEvents();
            this._applyEvents(this._events);
        },
        _detachEvents: function () {
            this._unapplyEvents(this._events);
        },
        _attachSecondaryEvents: function () {
            this._detachSecondaryEvents();
            this._applyEvents(this._secondaryEvents);
        },
        _detachSecondaryEvents: function () {
            this._unapplyEvents(this._secondaryEvents);
        },
        _trigger: function (event, altdate) {
            var date = altdate || this.date,
                local_date = this._utc_to_local(date);

            this.element.trigger({
                type: event,
                date: local_date,
                format: $.proxy(function (altformat) {
                    var format = altformat || this.o.format;
                    return DPGlobal.formatDate(date, format, this.o.language);
                }, this)
            });
        },

        show: function (e) {
            if (!this.isInline)
                this.picker.appendTo('body');
            this.picker.show();
            this.height = this.component ? this.component.outerHeight() : this.element.outerHeight();
            this.place();
            this._attachSecondaryEvents();
            if (e) {
                e.preventDefault();
            }
            this._trigger('show');
        },

        hide: function (e) {
            if (this.isInline) return;
            if (!this.picker.is(':visible')) return;
            this.picker.hide().detach();
            this._detachSecondaryEvents();
            this.viewMode = this.o.startView;
            this.showMode();

            if (
                this.o.forceParse &&
                (
                    this.isInput && this.element.val() ||
                    this.hasInput && this.element.find('input').val()
                    )
                )
//                this.setValue();
                this._trigger('hide');
        },

        remove: function () {
            this.hide();
            this._detachEvents();
            this._detachSecondaryEvents();
            this.picker.remove();
            delete this.element.data().datepicker;
            if (!this.isInput) {
                delete this.element.data().date;
            }
        },

        _utc_to_local: function (utc) {
            return new Date(utc.getTime() + (utc.getTimezoneOffset() * 60000));
        },
        _local_to_utc: function (local) {
            return new Date(local.getTime() - (local.getTimezoneOffset() * 60000));
        },
        _zero_time: function (local) {
            return new Date(local.getFullYear(), local.getMonth(), local.getDate());
        },
        _zero_utc_time: function (utc) {
            return new Date(Date.UTC(utc.getUTCFullYear(), utc.getUTCMonth(), utc.getUTCDate()));
        },

        getDate: function () {
            return this._utc_to_local(this.getUTCDate());
        },

        getUTCDate: function () {
            return this.date;
        },

        setDate: function (d) {
            this.setUTCDate(this._local_to_utc(d));
        },

        setUTCDate: function (d) {
            this.date = d;
            this.setValue();
        },

        setValue: function () {
            var formatted = this.formattedDate();
            if (!this.isInput) {
                if (this.component) {
                    this.element.find('input').val(formatted);
                }
            } else {
                this.element.val(formatted);
            }
        },

        formattedDate: function (format) {
            if (format === undefined)
                format = this.o.format;
            return DPGlobal.formatDate(this.date, format, this.o.language);
        },

        setStartDate: function (startDate) {
            this._process_options({startDate: startDate});
            this.update();
            this.updateNavArrows();
        },

        setEndDate: function (endDate) {
            this._process_options({endDate: endDate});
            this.update();
            this.updateNavArrows();
        },

        setDaysOfWeekDisabled: function (daysOfWeekDisabled) {
            this._process_options({daysOfWeekDisabled: daysOfWeekDisabled});
            this.update();
            this.updateNavArrows();
        },

        place: function () {
            if (this.isInline) return;
            var calendarWidth = this.picker.outerWidth(),
                calendarHeight = this.picker.outerHeight(),
                visualPadding = 10,
                windowWidth = $window.width(),
                windowHeight = $window.height(),
                scrollTop = $window.scrollTop();

            var zIndex = parseInt(this.element.parents().filter(
                function () {
                    return $(this).css('z-index') != 'auto';
                }).first().css('z-index')) + 10;
            var offset = this.component ? this.component.parent().offset() : this.element.offset();
            var height = this.component ? this.component.outerHeight(true) : this.element.outerHeight(false);
            var width = this.component ? this.component.outerWidth(true) : this.element.outerWidth(false);
            var left = offset.left,
                top = offset.top;

            this.picker.removeClass(
                    'datepicker-orient-top datepicker-orient-bottom ' +
                    'datepicker-orient-right datepicker-orient-left'
            );

            if (this.o.orientation.x !== 'auto') {
                this.picker.addClass('datepicker-orient-' + this.o.orientation.x);
                if (this.o.orientation.x === 'right')
                    left -= calendarWidth - width;
            }
            // auto x orientation is best-placement: if it crosses a window
            // edge, fudge it sideways
            else {
                // Default to left
                this.picker.addClass('datepicker-orient-left');
                if (offset.left < 0)
                    left -= offset.left - visualPadding;
                else if (offset.left + calendarWidth > windowWidth)
                    left = windowWidth - calendarWidth - visualPadding;
            }

            // auto y orientation is best-situation: top or bottom, no fudging,
            // decision based on which shows more of the calendar
            var yorient = this.o.orientation.y,
                top_overflow, bottom_overflow;
            if (yorient === 'auto') {
                top_overflow = -scrollTop + offset.top - calendarHeight;
                bottom_overflow = scrollTop + windowHeight - (offset.top + height + calendarHeight);
                if (Math.max(top_overflow, bottom_overflow) === bottom_overflow)
                    yorient = 'top';
                else
                    yorient = 'bottom';
            }
            this.picker.addClass('datepicker-orient-' + yorient);
            if (yorient === 'top')
                top += height;
            else
                top -= calendarHeight + parseInt(this.picker.css('padding-top'));

            this.picker.css({
                top: top,
                left: left,
                zIndex: zIndex
            });
        },

        _allow_update: true,
        update: function () {
            if (!this._allow_update) return;

            var oldDate = new Date(this.date),
                date, fromArgs = false;
            if (arguments && arguments.length && (typeof arguments[0] === 'string' || arguments[0] instanceof Date)) {
                date = arguments[0];
                if (date instanceof Date)
                    date = this._local_to_utc(date);
                fromArgs = true;
            } else {
                date = this.isInput ? this.element.val() : this.element.data('date') || this.element.find('input').val();
                delete this.element.data().date;
            }

            this.date = DPGlobal.parseDate(date, this.o.format, this.o.language);

            if (fromArgs) {
                // setting date by clicking
                this.setValue();
            } else if (date) {
                // setting date by typing
                if (oldDate.getTime() !== this.date.getTime())
                    this._trigger('changeDate');
            } else {
                // clearing date
                this._trigger('clearDate');
            }

            if (this.date < this.o.startDate) {
                this.viewDate = new Date(this.o.startDate);
                this.date = new Date(this.o.startDate);
            } else if (this.date > this.o.endDate) {
                this.viewDate = new Date(this.o.endDate);
                this.date = new Date(this.o.endDate);
            } else {
                this.viewDate = new Date(this.date);
                this.date = new Date(this.date);
            }
            this.fill();
        },

        fillDow: function () {
            var dowCnt = this.o.weekStart,
                html = '<tr>';
            if (this.o.calendarWeeks) {
                var cell = '<th tabindex="-1" class="cw">&nbsp;</th>';
                html += cell;
                this.picker.find('.datepicker-days thead tr:first-child').prepend(cell);
            }
            while (dowCnt < this.o.weekStart + 7) {
                html += '<th class="dow">' + dates[this.o.language].daysMin[(dowCnt++) % 7] + '</th>';
            }
            html += '</tr>';
            this.picker.find('.datepicker-days thead').append(html);
        },

        fillMonths: function () {
            var html = '',
                i = 0;
            while (i < 12) {
                html += '<span class="month">' + dates[this.o.language].monthsShort[i++] + '</span>';
            }
            this.picker.find('.datepicker-months td').html(html);
        },

        setRange: function (range) {
            if (!range || !range.length)
                delete this.range;
            else
                this.range = $.map(range, function (d) {
                    return d.valueOf();
                });
            this.fill();
        },

        getClassNames: function (date) {
            var cls = [],
                year = this.viewDate.getUTCFullYear(),
                month = this.viewDate.getUTCMonth(),
                currentDate = this.date.valueOf(),
                today = new Date();
            if (date.getUTCFullYear() < year || (date.getUTCFullYear() == year && date.getUTCMonth() < month)) {
                cls.push('old');
            } else if (date.getUTCFullYear() > year || (date.getUTCFullYear() == year && date.getUTCMonth() > month)) {
                cls.push('new');
            }
            // Compare internal UTC date with local today, not UTC today
            if (this.o.todayHighlight &&
                date.getUTCFullYear() == today.getFullYear() &&
                date.getUTCMonth() == today.getMonth() &&
                date.getUTCDate() == today.getDate()) {
                cls.push('today');
            }
            if (date.valueOf() == currentDate) {
                cls.push('active');
            }
            if (date.valueOf() < this.o.startDate || date.valueOf() > this.o.endDate ||
                $.inArray(date.getUTCDay(), this.o.daysOfWeekDisabled) !== -1) {
                cls.push('disabled');
            }
            if (this.range) {
                if (date > this.range[0] && date < this.range[this.range.length - 1]) {
                    cls.push('range');
                }
                if ($.inArray(date.valueOf(), this.range) != -1) {
                    cls.push('selected');
                }
            }
            return cls;
        },

        fill: function () {
            var d = new Date(this.viewDate),
                year = d.getUTCFullYear(),
                month = d.getUTCMonth(),
                startYear = this.o.startDate !== -Infinity ? this.o.startDate.getUTCFullYear() : -Infinity,
                startMonth = this.o.startDate !== -Infinity ? this.o.startDate.getUTCMonth() : -Infinity,
                endYear = this.o.endDate !== Infinity ? this.o.endDate.getUTCFullYear() : Infinity,
                endMonth = this.o.endDate !== Infinity ? this.o.endDate.getUTCMonth() : Infinity,
                currentDate = this.date && this.date.valueOf(),
                tooltip;
            this.picker.find('.datepicker-days thead th.datepicker-switch')
                .text(dates[this.o.language].months[month] + ' ' + year);
            this.picker.find('tfoot th.today')
                .text(dates[this.o.language].today)
                .toggle(this.o.todayBtn !== false);
            this.picker.find('tfoot th.clear')
                .text(dates[this.o.language].clear)
                .toggle(this.o.clearBtn !== false);
            this.updateNavArrows();
            this.fillMonths();
            var prevMonth = UTCDate(year, month - 1, 28, 0, 0, 0, 0),
                day = DPGlobal.getDaysInMonth(prevMonth.getUTCFullYear(), prevMonth.getUTCMonth());
            prevMonth.setUTCDate(day);
            prevMonth.setUTCDate(day - (prevMonth.getUTCDay() - this.o.weekStart + 7) % 7);
            var nextMonth = new Date(prevMonth);
            nextMonth.setUTCDate(nextMonth.getUTCDate() + 42);
            nextMonth = nextMonth.valueOf();
            var html = [];
            var clsName;
            while (prevMonth.valueOf() < nextMonth) {
                if (prevMonth.getUTCDay() == this.o.weekStart) {
                    html.push('<tr>');
                    if (this.o.calendarWeeks) {
                        // ISO 8601: First week contains first thursday.
                        // ISO also states week starts on Monday, but we can be more abstract here.
                        var
                        // Start of current week: based on weekstart/current date
                            ws = new Date(+prevMonth + (this.o.weekStart - prevMonth.getUTCDay() - 7) % 7 * 864e5),
                        // Thursday of this week
                            th = new Date(+ws + (7 + 4 - ws.getUTCDay()) % 7 * 864e5),
                        // First Thursday of year, year from thursday
                            yth = new Date(+(yth = UTCDate(th.getUTCFullYear(), 0, 1)) + (7 + 4 - yth.getUTCDay()) % 7 * 864e5),
                        // Calendar week: ms between thursdays, div ms per day, div 7 days
                            calWeek = (th - yth) / 864e5 / 7 + 1;
                        html.push('<td class="cw">' + calWeek + '</td>');

                    }
                }
                clsName = this.getClassNames(prevMonth);
                clsName.push('day');

                if (this.o.beforeShowDay !== $.noop) {
                    var before = this.o.beforeShowDay(this._utc_to_local(prevMonth));
                    if (before === undefined)
                        before = {};
                    else if (typeof(before) === 'boolean')
                        before = {enabled: before};
                    else if (typeof(before) === 'string')
                        before = {classes: before};
                    if (before.enabled === false)
                        clsName.push('disabled');
                    if (before.classes)
                        clsName = clsName.concat(before.classes.split(/\s+/));
                    if (before.tooltip)
                        tooltip = before.tooltip;
                }

                clsName = $.unique(clsName);
                html.push('<td class="' + clsName.join(' ') + '"' + (tooltip ? ' title="' + tooltip + '"' : '') + '>' + prevMonth.getUTCDate() + '</td>');
                if (prevMonth.getUTCDay() == this.o.weekEnd) {
                    html.push('</tr>');
                }
                prevMonth.setUTCDate(prevMonth.getUTCDate() + 1);
            }
            this.picker.find('.datepicker-days tbody').empty().append(html.join(''));
            var currentYear = this.date && this.date.getUTCFullYear();

            var months = this.picker.find('.datepicker-months')
                .find('th:eq(1)')
                .text(year)
                .end()
                .find('span').removeClass('active');
            if (currentYear && currentYear == year) {
                months.eq(this.date.getUTCMonth()).addClass('active');
            }
            if (year < startYear || year > endYear) {
                months.addClass('disabled');
            }
            if (year == startYear) {
                months.slice(0, startMonth).addClass('disabled');
            }
            if (year == endYear) {
                months.slice(endMonth + 1).addClass('disabled');
            }

            html = '';
            year = parseInt(year / 10, 10) * 10;
            var yearCont = this.picker.find('.datepicker-years')
                .find('th:eq(1)')
                .text(year + '-' + (year + 9))
                .end()
                .find('td');
            year -= 1;
            for (var i = -1; i < 11; i++) {
                html += '<span class="year' + (i == -1 ? ' old' : i == 10 ? ' new' : '') + (currentYear == year ? ' active' : '') + (year < startYear || year > endYear ? ' disabled' : '') + '">' + year + '</span>';
                year += 1;
            }
            yearCont.html(html);
        },

        updateNavArrows: function () {
            if (!this._allow_update) return;

            var d = new Date(this.viewDate),
                year = d.getUTCFullYear(),
                month = d.getUTCMonth();
            switch (this.viewMode) {
                case 0:
                    if (this.o.startDate !== -Infinity && year <= this.o.startDate.getUTCFullYear() && month <= this.o.startDate.getUTCMonth()) {
                        this.picker.find('.prev').css({visibility: 'hidden'});
                    } else {
                        this.picker.find('.prev').css({visibility: 'visible'});
                    }
                    if (this.o.endDate !== Infinity && year >= this.o.endDate.getUTCFullYear() && month >= this.o.endDate.getUTCMonth()) {
                        this.picker.find('.next').css({visibility: 'hidden'});
                    } else {
                        this.picker.find('.next').css({visibility: 'visible'});
                    }
                    break;
                case 1:
                case 2:
                    if (this.o.startDate !== -Infinity && year <= this.o.startDate.getUTCFullYear()) {
                        this.picker.find('.prev').css({visibility: 'hidden'});
                    } else {
                        this.picker.find('.prev').css({visibility: 'visible'});
                    }
                    if (this.o.endDate !== Infinity && year >= this.o.endDate.getUTCFullYear()) {
                        this.picker.find('.next').css({visibility: 'hidden'});
                    } else {
                        this.picker.find('.next').css({visibility: 'visible'});
                    }
                    break;
            }
        },

        click: function (e) {
            e.preventDefault();
            e.stopPropagation()
            this.element.focus()

            var target = $(e.target).closest('span, td, th');
            if (target.length == 1) {
                switch (target[0].nodeName.toLowerCase()) {
                    case 'th':
                        switch (target[0].className) {
                            case 'datepicker-switch':
                                this.showMode(1);
                                break;
                            case 'prev':
                            case 'next':
                                var dir = DPGlobal.modes[this.viewMode].navStep * (target[0].className == 'prev' ? -1 : 1);
                                switch (this.viewMode) {
                                    case 0:
                                        this.viewDate = this.moveMonth(this.viewDate, dir);
                                        this._trigger('changeMonth', this.viewDate);
                                        break;
                                    case 1:
                                    case 2:
                                        this.viewDate = this.moveYear(this.viewDate, dir);
                                        if (this.viewMode === 1)
                                            this._trigger('changeYear', this.viewDate);
                                        break;
                                }
                                this.fill();
                                break;
                            case 'today':
                                var date = new Date();
                                date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);

                                this.showMode(-2);
                                var which = this.o.todayBtn == 'linked' ? null : 'view';
                                this._setDate(date, which);
                                break;
                            case 'clear':
                                var element;
                                if (this.isInput)
                                    element = this.element;
                                else if (this.component)
                                    element = this.element.find('input');
                                if (element)
                                    element.val("");
                                this._trigger('changeDate');
                                this.update();
                                if (this.o.autoclose)
                                    this.hide();
                                break;
                        }
                        break;
                    case 'span':
                        if (!target.is('.disabled')) {
                            this.viewDate.setUTCDate(1);
                            if (target.is('.month')) {
                                var day = 1;
                                var month = target.parent().find('span').index(target);
                                var year = this.viewDate.getUTCFullYear();
                                this.viewDate.setUTCMonth(month);
                                this._trigger('changeMonth', this.viewDate);
                                if (this.o.minViewMode === 1) {
                                    this._setDate(UTCDate(year, month, day, 0, 0, 0, 0));
                                }
                            } else {
                                var year = parseInt(target.text(), 10) || 0;
                                var day = 1;
                                var month = 0;
                                this.viewDate.setUTCFullYear(year);
                                this._trigger('changeYear', this.viewDate);
                                if (this.o.minViewMode === 2) {
                                    this._setDate(UTCDate(year, month, day, 0, 0, 0, 0));
                                }
                            }
                            this.showMode(-1);
                            this.fill();
                        }
                        break;
                    case 'td':
                        if (target.is('.day') && !target.is('.disabled')) {
                            var day = parseInt(target.text(), 10) || 1;
                            var year = this.viewDate.getUTCFullYear(),
                                month = this.viewDate.getUTCMonth();
                            if (target.is('.old')) {
                                if (month === 0) {
                                    month = 11;
                                    year -= 1;
                                } else {
                                    month -= 1;
                                }
                            } else if (target.is('.new')) {
                                if (month == 11) {
                                    month = 0;
                                    year += 1;
                                } else {
                                    month += 1;
                                }
                            }
                            this._setDate(UTCDate(year, month, day, 0, 0, 0, 0));
                        }
                        break;
                }
            }
        },

        _setDate: function (date, which) {
            if (!which || which == 'date')
                this.date = new Date(date);
            if (!which || which == 'view')
                this.viewDate = new Date(date);
            this.fill();
            this.setValue();
            this._trigger('changeDate');
//            var element;
//            if (this.isInput) {
//                element = this.element;
//            } else if (this.component) {
//                element = this.element.find('input');
//            }
//            if (element) {
//                element.change();
//            }
            if (this.o.autoclose && (!which || which == 'date')) {
                this.hide();
            }
        },

        moveMonth: function (date, dir) {
            if (!dir) return date;
            var new_date = new Date(date.valueOf()),
                day = new_date.getUTCDate(),
                month = new_date.getUTCMonth(),
                mag = Math.abs(dir),
                new_month, test;
            dir = dir > 0 ? 1 : -1;
            if (mag == 1) {
                test = dir == -1
                    // If going back one month, make sure month is not current month
                    // (eg, Mar 31 -> Feb 31 == Feb 28, not Mar 02)
                    ? function () {
                    return new_date.getUTCMonth() == month;
                }
                    // If going forward one month, make sure month is as expected
                    // (eg, Jan 31 -> Feb 31 == Feb 28, not Mar 02)
                    : function () {
                    return new_date.getUTCMonth() != new_month;
                };
                new_month = month + dir;
                new_date.setUTCMonth(new_month);
                // Dec -> Jan (12) or Jan -> Dec (-1) -- limit expected date to 0-11
                if (new_month < 0 || new_month > 11)
                    new_month = (new_month + 12) % 12;
            } else {
                // For magnitudes >1, move one month at a time...
                for (var i = 0; i < mag; i++)
                    // ...which might decrease the day (eg, Jan 31 to Feb 28, etc)...
                    new_date = this.moveMonth(new_date, dir);
                // ...then reset the day, keeping it in the new month
                new_month = new_date.getUTCMonth();
                new_date.setUTCDate(day);
                test = function () {
                    return new_month != new_date.getUTCMonth();
                };
            }
            // Common date-resetting loop -- if date is beyond end of month, make it
            // end of month
            while (test()) {
                new_date.setUTCDate(--day);
                new_date.setUTCMonth(new_month);
            }
            return new_date;
        },

        moveYear: function (date, dir) {
            return this.moveMonth(date, dir * 12);
        },

        dateWithinRange: function (date) {
            return date >= this.o.startDate && date <= this.o.endDate;
        },

        keydown: function (e) {
            if (this.picker.is(':not(:visible)')) {
                if (e.keyCode == 27) // allow escape to hide and re-show picker
                    this.show();
                return;
            }
            var dateChanged = false,
                dir, day, month,
                newDate, newViewDate;
            switch (e.keyCode) {
                case 27: // escape
                    this.hide();
                    e.preventDefault();
                    break;
                case 37: // left
                case 39: // right
                    if (!this.o.keyboardNavigation) break;
                    dir = e.keyCode == 37 ? -1 : 1;
                    if (e.ctrlKey) {
                        newDate = this.moveYear(this.date, dir);
                        newViewDate = this.moveYear(this.viewDate, dir);
                        this._trigger('changeYear', this.viewDate);
                    } else if (e.shiftKey) {
                        newDate = this.moveMonth(this.date, dir);
                        newViewDate = this.moveMonth(this.viewDate, dir);
                        this._trigger('changeMonth', this.viewDate);
                    } else {
                        newDate = new Date(this.date);
                        newDate.setUTCDate(this.date.getUTCDate() + dir);
                        newViewDate = new Date(this.viewDate);
                        newViewDate.setUTCDate(this.viewDate.getUTCDate() + dir);
                    }
                    if (this.dateWithinRange(newDate)) {
                        this.date = newDate;
                        this.viewDate = newViewDate;
                        this.setValue();
                        this.update();
                        e.preventDefault();
                        dateChanged = true;
                    }
                    break;
                case 38: // up
                case 40: // down
                    if (!this.o.keyboardNavigation) break;
                    dir = e.keyCode == 38 ? -1 : 1;
                    if (e.ctrlKey) {
                        newDate = this.moveYear(this.date, dir);
                        newViewDate = this.moveYear(this.viewDate, dir);
                        this._trigger('changeYear', this.viewDate);
                    } else if (e.shiftKey) {
                        newDate = this.moveMonth(this.date, dir);
                        newViewDate = this.moveMonth(this.viewDate, dir);
                        this._trigger('changeMonth', this.viewDate);
                    } else {
                        newDate = new Date(this.date);
                        newDate.setUTCDate(this.date.getUTCDate() + dir * 7);
                        newViewDate = new Date(this.viewDate);
                        newViewDate.setUTCDate(this.viewDate.getUTCDate() + dir * 7);
                    }
                    if (this.dateWithinRange(newDate)) {
                        this.date = newDate;
                        this.viewDate = newViewDate;
                        this.setValue();
                        this.update();
                        e.preventDefault();
                        dateChanged = true;
                    }
                    break;
                case 13: // enter
                    this.hide();
                    e.preventDefault();
                    break;
                case 9: // tab
                    this.hide();
                    break;
            }
            if (dateChanged) {
                this._trigger('changeDate');
                var element;
                if (this.isInput) {
                    element = this.element;
                } else if (this.component) {
                    element = this.element.find('input');
                }
//                if (element) {
//                    element.change();
//                }
            }
        },

        showMode: function (dir) {
            if (dir) {
                this.viewMode = Math.max(this.o.minViewMode, Math.min(2, this.viewMode + dir));
            }
            /*
             vitalets: fixing bug of very special conditions:
             jquery 1.7.1 + webkit + show inline datepicker in bootstrap popover.
             Method show() does not set display css correctly and datepicker is not shown.
             Changed to .css('display', 'block') solve the problem.
             See https://github.com/vitalets/x-editable/issues/37

             In jquery 1.7.2+ everything works fine.
             */
            //this.picker.find('>div').hide().filter('.datepicker-'+DPGlobal.modes[this.viewMode].clsName).show();
            this.picker.find('>div').hide().filter('.datepicker-' + DPGlobal.modes[this.viewMode].clsName).css('display', 'block');
            this.updateNavArrows();
        }
    };

    var DateRangePicker = function (element, options) {
        this.element = $(element);
        this.inputs = $.map(options.inputs, function (i) {
            return i.jquery ? i[0] : i;
        });
        delete options.inputs;

        $(this.inputs)
            .datepicker(options)
            .bind('changeDate', $.proxy(this.dateUpdated, this));

        this.pickers = $.map(this.inputs, function (i) {
            return $(i).data('datepicker');
        });
        this.updateDates();
    };
    DateRangePicker.prototype = {
        updateDates: function () {
            this.dates = $.map(this.pickers, function (i) {
                return i.date;
            });
            this.updateRanges();
        },
        updateRanges: function () {
            var range = $.map(this.dates, function (d) {
                return d.valueOf();
            });
            $.each(this.pickers, function (i, p) {
                p.setRange(range);
            });
        },
        dateUpdated: function (e) {
            var dp = $(e.target).data('datepicker'),
                new_date = dp.getUTCDate(),
                i = $.inArray(e.target, this.inputs),
                l = this.inputs.length;
            if (i == -1) return;

            if (new_date < this.dates[i]) {
                // Date being moved earlier/left
                while (i >= 0 && new_date < this.dates[i]) {
                    this.pickers[i--].setUTCDate(new_date);
                }
            }
            else if (new_date > this.dates[i]) {
                // Date being moved later/right
                while (i < l && new_date > this.dates[i]) {
                    this.pickers[i++].setUTCDate(new_date);
                }
            }
            this.updateDates();
        },
        remove: function () {
            $.map(this.pickers, function (p) {
                p.remove();
            });
            delete this.element.data().datepicker;
        }
    };

    function opts_from_el(el, prefix) {
        // Derive options from element data-attrs
        var data = $(el).data(),
            out = {}, inkey,
            replace = new RegExp('^' + prefix.toLowerCase() + '([A-Z])'),
            prefix = new RegExp('^' + prefix.toLowerCase());
        for (var key in data)
            if (prefix.test(key)) {
                inkey = key.replace(replace, function (_, a) {
                    return a.toLowerCase();
                });
                out[inkey] = data[key];
            }
        return out;
    }

    function opts_from_locale(lang) {
        // Derive options from locale plugins
        var out = {};
        // Check if "de-DE" style date is available, if not language should
        // fallback to 2 letter code eg "de"
        if (!dates[lang]) {
            lang = lang.split('-')[0]
            if (!dates[lang])
                return;
        }
        var d = dates[lang];
        $.each(locale_opts, function (i, k) {
            if (k in d)
                out[k] = d[k];
        });
        return out;
    }

    var old = $.fn.datepicker;
    $.fn.datepicker = function (option) {
        var args = Array.apply(null, arguments);
        args.shift();
        var internal_return,
            this_return;
        this.each(function () {
            var $this = $(this),
                data = $this.data('datepicker'),
                options = typeof option == 'object' && option;
            if (!data) {
                var elopts = opts_from_el(this, 'date'),
                // Preliminary otions
                    xopts = $.extend({}, defaults, elopts, options),
                    locopts = opts_from_locale(xopts.language),
                // Options priority: js args, data-attrs, locales, defaults
                    opts = $.extend({}, defaults, locopts, elopts, options);
                if ($this.is('.input-daterange') || opts.inputs) {
                    var ropts = {
                        inputs: opts.inputs || $this.find('input').toArray()
                    };
                    $this.data('datepicker', (data = new DateRangePicker(this, $.extend(opts, ropts))));
                }
                else {
                    $this.data('datepicker', (data = new Datepicker(this, opts)));
                }
            }
            if (typeof option == 'string' && typeof data[option] == 'function') {
                internal_return = data[option].apply(data, args);
                if (internal_return !== undefined)
                    return false;
            }
        });
        if (internal_return !== undefined)
            return internal_return;
        else
            return this;
    };

    var defaults = $.fn.datepicker.defaults = {
        autoclose: false,
        beforeShowDay: $.noop,
        calendarWeeks: false,
        clearBtn: false,
        daysOfWeekDisabled: [],
        endDate: Infinity,
        forceParse: true,
        format: 'mm/dd/yyyy',
        keyboardNavigation: true,
        language: 'en',
//        minViewMode:0,
        orientation: "auto",
        rtl: false,
        startDate: -Infinity,
        startView: 0,
        todayBtn: false,
        todayHighlight: false,
        weekStart: 0
    };
    var locale_opts = $.fn.datepicker.locale_opts = [
        'format',
        'rtl',
        'weekStart'
    ];
    $.fn.datepicker.Constructor = Datepicker;
    var dates = $.fn.datepicker.dates = {
        en: {
            days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            daysShort: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
            daysMin: ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"],
            months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            today: "Today",
            clear: "Clear"
        }
    };

    var DPGlobal = {
        modes: [
            {
                clsName: 'days',
                navFnc: 'Month',
                navStep: 1
            },
            {
                clsName: 'months',
                navFnc: 'FullYear',
                navStep: 1
            },
            {
                clsName: 'years',
                navFnc: 'FullYear',
                navStep: 10
            }
        ],
        isLeapYear: function (year) {
            return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
        },
        getDaysInMonth: function (year, month) {
            return [31, (DPGlobal.isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
        },
        validParts: /dd?|DD?|mm?|MM?|yy(?:yy)?/g,
        nonpunctuation: /[^ -\/:-@\[\u3400-\u9fff-`{-~\t\n\r]+/g,
        parseFormat: function (format) {
            // IE treats \0 as a string end in inputs (truncating the value),
            // so it's a bad format delimiter, anyway
            var separators = format.replace(this.validParts, '\0').split('\0'),
                parts = format.match(this.validParts);
            if (!separators || !separators.length || !parts || parts.length === 0) {
                throw new Error("Invalid date format.");
            }
            return {separators: separators, parts: parts};
        },
        parseDate: function (date, format, language) {
            if (date instanceof Date) return date;
            if (typeof format === 'string')
                format = DPGlobal.parseFormat(format);
            if (/^[\-+]\d+[dmwy]([\s,]+[\-+]\d+[dmwy])*$/.test(date)) {
                var part_re = /([\-+]\d+)([dmwy])/,
                    parts = date.match(/([\-+]\d+)([dmwy])/g),
                    part, dir;
                date = new Date();
                for (var i = 0; i < parts.length; i++) {
                    part = part_re.exec(parts[i]);
                    dir = parseInt(part[1]);
                    switch (part[2]) {
                        case 'd':
                            date.setUTCDate(date.getUTCDate() + dir);
                            break;
                        case 'm':
                            date = Datepicker.prototype.moveMonth.call(Datepicker.prototype, date, dir);
                            break;
                        case 'w':
                            date.setUTCDate(date.getUTCDate() + dir * 7);
                            break;
                        case 'y':
                            date = Datepicker.prototype.moveYear.call(Datepicker.prototype, date, dir);
                            break;
                    }
                }
                return UTCDate(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0);
            }
            var parts = date && date.match(this.nonpunctuation) || [],
                date = new Date(),
                parsed = {},
                setters_order = ['yyyy', 'yy', 'M', 'MM', 'm', 'mm', 'd', 'dd'],
                setters_map = {
                    yyyy: function (d, v) {
                        return d.setUTCFullYear(v);
                    },
                    yy: function (d, v) {
                        return d.setUTCFullYear(2000 + v);
                    },
                    m: function (d, v) {
                        if (isNaN(d))
                            return d;
                        v -= 1;
                        while (v < 0) v += 12;
                        v %= 12;
                        d.setUTCMonth(v);
                        while (d.getUTCMonth() != v)
                            d.setUTCDate(d.getUTCDate() - 1);
                        return d;
                    },
                    d: function (d, v) {
                        return d.setUTCDate(v);
                    }
                },
                val, filtered, part;
            setters_map['M'] = setters_map['MM'] = setters_map['mm'] = setters_map['m'];
            setters_map['dd'] = setters_map['d'];
            date = UTCDate(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
            var fparts = format.parts.slice();
            // Remove noop parts
            if (parts.length != fparts.length) {
                fparts = $(fparts).filter(
                    function (i, p) {
                        return $.inArray(p, setters_order) !== -1;
                    }).toArray();
            }
            // Process remainder
            if (parts.length == fparts.length) {
                for (var i = 0, cnt = fparts.length; i < cnt; i++) {
                    val = parseInt(parts[i], 10);
                    part = fparts[i];
                    if (isNaN(val)) {
                        switch (part) {
                            case 'MM':
                                filtered = $(dates[language].months).filter(function () {
                                    var m = this.slice(0, parts[i].length),
                                        p = parts[i].slice(0, m.length);
                                    return m == p;
                                });
                                val = $.inArray(filtered[0], dates[language].months) + 1;
                                break;
                            case 'M':
                                filtered = $(dates[language].monthsShort).filter(function () {
                                    var m = this.slice(0, parts[i].length),
                                        p = parts[i].slice(0, m.length);
                                    return m == p;
                                });
                                val = $.inArray(filtered[0], dates[language].monthsShort) + 1;
                                break;
                        }
                    }
                    parsed[part] = val;
                }
                for (var i = 0, _date, s; i < setters_order.length; i++) {
                    s = setters_order[i];
                    if (s in parsed && !isNaN(parsed[s])) {
                        _date = new Date(date);
                        setters_map[s](_date, parsed[s]);
                        if (!isNaN(_date))
                            date = _date;
                    }
                }
            }
            return date;
        },
        formatDate: function (date, format, language) {
            return date.getFormattedDate(format)
        },
        headTemplate: '<thead>' +
            '<tr>' +
            '<th class="prev">&laquo;</th>' +
            '<th colspan="5" class="datepicker-switch"></th>' +
            '<th class="next">&raquo;</th>' +
            '</tr>' +
            '</thead>',
        contTemplate: '<tbody><tr><td colspan="7"></td></tr></tbody>',
        footTemplate: '<tfoot><tr><th colspan="7" class="today"></th></tr><tr><th colspan="7" class="clear"></th></tr></tfoot>'
    };
    DPGlobal.template = '<div class="datepicker">' +
        '<div class="datepicker-days">' +
        '<table class=" table-condensed">' +
        DPGlobal.headTemplate +
        '<tbody></tbody>' +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datepicker-months">' +
        '<table class="table-condensed">' +
        DPGlobal.headTemplate +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '<div class="datepicker-years">' +
        '<table class="table-condensed">' +
        DPGlobal.headTemplate +
        DPGlobal.contTemplate +
        DPGlobal.footTemplate +
        '</table>' +
        '</div>' +
        '</div>';

    $.fn.datepicker.DPGlobal = DPGlobal;


    /* DATEPICKER NO CONFLICT
     * =================== */

    $.fn.datepicker.noConflict = function () {
        $.fn.datepicker = old;
        return this;
    };


    /* DATEPICKER DATA-API
     * ================== */

    $(document).on(
        'focus.datepicker.data-api click.datepicker.data-api',
        '[data-provide="datepicker"]',
        function (e) {
            var $this = $(this);
            if ($this.data('datepicker')) return;
            e.preventDefault();
            // component click requires us to explicitly show it
            $this.datepicker('show');
        }
    );
    $(function () {
        $('[data-provide="datepicker-inline"]').datepicker();
    });

}(window.jQuery));

var dateFormat = function () {
    var token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) val = "0" + val;
            return val;
        };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var _ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d: d,
                dd: pad(d),
                ddd: dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m: m + 1,
                mm: pad(m + 1),
                mmm: dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy: String(y).slice(2),
                yyyy: y,
                h: H % 12 || 12,
                hh: pad(H % 12 || 12),
                H: H,
                HH: pad(H),
                M: M,
                MM: pad(M),
                s: s,
                ss: pad(s),
                l: pad(L, 3),
                L: pad(L > 99 ? Math.round(L / 10) : L),
                t: H < 12 ? "a" : "p",
                tt: H < 12 ? "am" : "pm",
                T: H < 12 ? "A" : "P",
                TT: H < 12 ? "AM" : "PM",
                Z: utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o: (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S: ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();

dateFormat.masks = {
    "default": "ddd mmm dd yyyy HH:MM:ss",
    shortDate: "m/d/yy",
    mediumDate: "mmm d, yyyy",
    longDate: "mmmm d, yyyy",
    fullDate: "dddd, mmmm d, yyyy",
    shortTime: "h:MM TT",
    mediumTime: "h:MM:ss TT",
    longTime: "h:MM:ss TT Z",
    isoDate: "yyyy-mm-dd",
    isoTime: "HH:MM:ss",
    isoDateTime: "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"

};

dateFormat.i18n = {
    dayNames: [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]
};

Date.prototype.getFormattedDate = function (mask, utc) {
    return dateFormat(this, mask, utc);
};

