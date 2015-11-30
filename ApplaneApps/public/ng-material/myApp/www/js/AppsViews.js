/*move to app-component.js to generate minified version for before commit*/
var AppViews = {};
(function () {

    AppViews.POPUP_WIDTH = "810px";
    AppViews.POPUP_HEIGHT = "450px";
    AppViews.SHORT_POPUP_WIDTH = "410px";
    AppViews.SHORT_POPUP_HEIGHT = "200px";

    AppViews.__insertEvents__ = [
        {
            function:{source:"ApplaneFunctions/lib/AppSystemEvents",
                name:"onInsert"},
            event:"onInsert"
        }
    ]

    AppViews.__gaeportings__ = {"viewOptions":{refresh:true, width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, refreshDataOnLoad:true, viewControl:false, "id":"__gaeportings__", "label":"Porting details", "_id":"537b55fe2edb4ef819000025", "collection":"pl.gaemappings", "collection_id":"537b55fe2edb4ef81900001f", "actions":[
        {"label":"Port data", "type":"invoke", "onRow":true, "function":"gaeDataPorting", "collectionid":{"collection":"pl.gaemappings", "_id":"537b55fe2edb4ef81900001f"}, "_id":"537b577a2edb4ef8190000be"}
    ], "fields":[
        {"index":null, "visibility":true, "field":"id", "label":"id", "type":"string", "ui":"text"},
        {"index":null, "visibility":true, "field":"jobname", "label":"Job name", "type":"string", "ui":"text"},
        {"index":null, "visibility":true, "field":"inprogress", "label":"inprogress", "type":"boolean", "ui":"checkbox"},
        {"index":null, "visibility":true, "field":"tableid", "label":"tableid", "type":"string", "ui":"text"},
        {"index":null, "visibility":true, "field":"ported", "label":"ported", "type":"number", "ui":"number"},
        {"index":null, "visibility":true, "field":"status", "label":"status", "type":"string", "ui":"text"},
        {"index":null, "visibility":true, "field":"totalcount", "label":"totalcount", "type":"string", "ui":"text"},
        {"index":null, "visibility":true, "field":"source", "label":"source", "type":"string", "ui":"text"},
        {"index":null, "visibility":true, "field":"excelfile", "label":"excel", "type":"file", "ui":"file"},
        {"index":null, "visibility":true, "field":"targetdatabase", "label":"Target Database", "type":"string", "ui":"text"},
        {"index":null, "visibility":true, "field":"portingtype", "label":"Porting type", "type":"string", "ui":"text"},
        {"index":null, "visibility":true, "field":"cursor", "label":"Cursor", "type":"string", "ui":"text"},
        {"index":null, "visibility":true, "field":"limit", "label":"Limit", "type":"string", "ui":"text"},
        {"index":null, "visibility":true, "field":"noofrecords", "label":"noofrecords", "type":"string", "ui":"text"},
        {"index":null, "visibility":true, "field":"noofprocess", "label":"noOfProcess", "type":"string", "ui":"text"},
        {"index":null, "visibility":true, "field":"pid", "label":"Process id", "type":"string", "ui":"text"},
        {"index":null, "visibility":true, "field":"startFromPreviousCursor", "label":"startFromPreviousCursor", "type":"boolean", "ui":"checkbox"},
        {"index":null, "visibility":true, "field":"skipTx", "label":"skipTx", "type":"boolean", "ui":"checkbox"},
        {"index":null, "visibility":true, "field":"skipCount", "label":"skipCount", "type":"boolean", "ui":"checkbox"},
        {"index":null, "visibility":true, "field":"sync", "label":"sync", "type":"boolean", "ui":"checkbox"},
        {"index":null, "visibility":true, "field":"stopporting", "label":"Stop porting", "type":"boolean", "ui":"checkbox"},
        {"index":null, "visibility":false, visibilityForm:true, "field":"processStatus", "label":"processStatus", "type":"object", multiple:true, "ui":"grid", fields:[
            {"index":null, "visibilityForm":true, "field":"process", "label":"Process", "type":"string", "ui":"text"},
            {"index":null, "visibilityForm":true, "field":"inprogress", "label":"in Progress", "type":"boolean", "ui":"checkbox"},
            {"index":null, "visibilityForm":true, "field":"status", "label":"status", "type":"string", "ui":"text"},
            {"index":null, "visibilityForm":true, "field":"cursor", "label":"cursor", "type":"number", "ui":"number"},
            {"index":null, "visibilityForm":true, "field":"endcursor", "label":"endcursor", "type":"number", "ui":"number"},
            {"index":null, "visibilityForm":true, "field":"ported", "label":"ported", "type":"number", "ui":"number"}
        ]}
    ], "queryGrid":{"$collection":"pl.gaemappings", $sort:{id:1}}, "queryForm":{"$collection":"pl.gaemappings"}}}
    AppViews.__createrole__ = {viewOptions:{ width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, ui:"form", id:"__createrole__", showLabel:true, label:"Create Role", viewControl:false, resize:false, fields:[
        {label:"Role", field:"role", visibilityGrid:true, visibilityForm:true, ui:"text", width:"200px"},
        {label:"Span", field:"span", visibilityGrid:true, visibilityForm:true, ui:"number", type:"number", width:"200px"} ,
        {"label":"Do Not Synch", "field":"doNotSynch", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"200px"},
        {"label":"Privileges", "field":"privileges", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", nestedGridPosition:"form", doNotResolveVisibilityWithParent:true, "width":"200px", multiple:true, fields:[
            {label:"Type", field:"type", visibilityGrid:false, visibilityForm:true, ui:"autocomplete", type:"string", width:"200px", options:["Collection", "Default", "Regex", "Collection Groups", "Function"]},
            {label:"Collection", field:"collection", visibilityGrid:false, visibilityForm:true, ui:"autocomplete", "upsert":true, type:"string", width:"200px", collection:"pl.collections", displayField:"collection", filterable:true, when:"!$type || $type==='Collection' || $type==='Regex'"},
            {label:"Collection Groups", field:"collectionGroups", visibilityGrid:false, visibilityForm:true, ui:"autocomplete", multiple:true, type:"string", width:"200px", collection:"pl.collections", displayField:"collection", filterable:true, when:"$type==='Collection Groups'", nestedGridPosition:"form"},
            {label:"Function Name", field:"functionName", visibilityGrid:false, visibilityForm:true, ui:"autocomplete", type:"string", width:"200px", when:"$type==='Function'", nestedGridPosition:"form", upsert:true, options:["Utility.getApplicationCollections"]},
            {label:"Function Parameters", field:"functionParameters", visibilityGrid:false, visibilityForm:true, ui:"text", "json":true, type:"string", width:"200px", when:"$type==='Function'", nestedGridPosition:"form"},
            {"label":"Fields Availability", "field":"fieldsAvailability", "visibilityGrid":false, nestedGridPosition:"form", "visibilityForm":true, "ui":"autocomplete", type:"string", options:["Exclude", "Include" ]},
            {label:"Fields", field:"fieldInfos", visibilityGrid:false, visibilityForm:true, ui:"grid", nestedGridPosition:"form", doNotResolveVisibilityWithParent:true, type:"object", "multiple":true, width:"200px", when:"$fieldsAvailability", fields:[
                {"label":"Field", "field":"field", "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", upsert:true, collection:"pl.fields", displayField:"field", parameters:{collection:"$collection"}, filter:{"collectionid.collection":"$collection"}, mandatory:true, events:[
                    {
                        function:"Fields.postQuery",
                        event:"onQuery",
                        post:true
                    }
                ]}
            ]},

            {"label":"Filter UI", "field":"filterUI", "visibilityGrid":false, "visibilityForm":true, nestedGridPosition:"form", "ui":"autocomplete", type:"string", options:["json", "grid"]},
            {"label":"Filter", "field":"filterJSON", "visibilityGrid":false, "visibilityForm":true, nestedGridPosition:"form", "ui":"text", type:"string", when:"$filterUI=='json'"},
            {label:"Filters", field:"filterInfos", visibilityGrid:false, visibilityForm:true, ui:"grid", nestedGridPosition:"form", doNotResolveVisibilityWithParent:true, type:"object", "multiple":true, when:"$filterUI=='grid'", width:"200px", fields:[
                {"label":"Field", "field":"field", "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", upsert:true, collection:"pl.fields", displayField:"field", parameters:{collection:"$collection"}, filter:{"collectionid.collection":"$collection"}, mandatory:true, events:[
                    {
                        function:"Fields.postQuery",
                        event:"onQuery",
                        post:true
                    }
                ]},
                {"label":"Operator", "field":"operator", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", options:["$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin"]},
                {"label":"Value", "field":"value", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", upsert:true, options:["$$CurrentUser", "$$UserRoles"], mandatory:true},
                {"label":"AND/OR", "field":"logicalOperator", "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", options:["AND", "OR"]}
            ]},

            {"label":"Actions Availability", "field":"actionsAvailability", "visibilityGrid":false, "visibilityForm":true, nestedGridPosition:"form", "ui":"autocomplete", type:"string", options:["Exclude", "Include"]},
            {label:"Actions", field:"actionInfos", visibilityGrid:false, visibilityForm:true, ui:"grid", nestedGridPosition:"form", doNotResolveVisibilityWithParent:true, type:"object", "multiple":true, width:"200px", when:"$actionsAvailability", fields:[
                {"label":"Action", "field":"action", "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", mandatory:true, collection:"pl.actions", displayField:"id", parameters:{collection:"$collection"}, filter:{"collectionid.collection":"$collection"}},
                {label:"Filter JSON", field:"filterJSON", visibilityGrid:false, visibilityForm:true, ui:"text", type:"string", width:"200px"}
            ]},
            {"label":"Views Availability", "field":"viewsAvailability", "visibilityGrid":false, "visibilityForm":true, nestedGridPosition:"form", "ui":"autocomplete", type:"string", options:["Exclude", "Include"]},
            {label:"Views", field:"viewInfos", visibilityGrid:false, visibilityForm:true, ui:"grid", nestedGridPosition:"form", doNotResolveVisibilityWithParent:true, type:"object", "multiple":true, width:"200px", when:"$viewsAvailability", fields:[
                {"label":"View", "field":"view", "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", collection:"pl.qviews", displayField:"id", parameters:{collection:"$collection"}, filter:{"collection.collection":"$collection"}, mandatory:true}
            ]},


            {label:"Operations", field:"operationInfos", visibilityGrid:false, visibilityForm:true, ui:"grid", nestedGridPosition:"form", doNotResolveVisibilityWithParent:true, type:"object", mandatory:true, "multiple":true, width:"200px", fields:[
                {"label":"Type", "field":"type", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", options:["find", "insert", "update", "remove"], mandatory:true},
                {"label":"Sequence", "field":"sequence", "visibilityGrid":false, "visibilityForm":true, "ui":"number", type:"number"},
                {"label":"Primary Fields", "field":"primaryFields", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", type:"boolean", when:"$type=='find'"},
                {"label":"Fields Availability", "field":"fieldsAvailability", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", options:["Exclude", "Include"]},
                {"label":"Fields", field:"fieldInfos", visibilityGrid:false, visibilityForm:true, ui:"grid", nestedGridPosition:"form", doNotResolveVisibilityWithParent:true, type:"object", "multiple":true, width:"200px", when:"$fieldsAvailability", fields:[
                    {"label":"Field", "field":"field", "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", upsert:true, collection:"pl.fields", displayField:"field", parameters:{collection:"$collection"}, filter:{"collectionid.collection":"$collection"}, mandatory:true, events:[
                        {
                            function:"Fields.postQuery",
                            event:"onQuery",
                            post:true
                        }
                    ]}
                ]},
                {"label":"Filter UI", "field":"filterUI", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", options:["json", "grid"]},
                {"label":"Filter", "field":"filterJSON", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", when:"$filterUI=='json'"},
                {label:"Filters", field:"filterInfos", visibilityGrid:false, visibilityForm:true, ui:"grid", nestedGridPosition:"form", doNotResolveVisibilityWithParent:true, type:"object", "multiple":true, when:"$filterUI=='grid'", width:"200px", fields:[
                    {"label":"Field", "field":"field", "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", upsert:true, collection:"pl.fields", displayField:"field", parameters:{collection:"$collection"}, filter:{"collectionid.collection":"$collection"}, mandatory:true, events:[
                        {
                            function:"Fields.postQuery",
                            event:"onQuery",
                            post:true
                        }
                    ]},
                    {"label":"Operator", "field":"operator", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", options:["$eq", "$ne", "$gt", "$gte", "$lt", "$lte", "$in", "$nin"]},
                    {"label":"Value", "field":"value", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", upsert:true, options:["$$CurrentUser", "$$UserRoles"], mandatory:true},
                    {"label":"AND/OR", "field":"logicalOperator", "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", options:["AND", "OR"]}
                ]}
            ]},

            {label:"FilterName", field:"filterName", visibilityGrid:false, visibilityForm:true, ui:"string", type:"string", width:"200px", nestedGridPosition:"form"},
            {label:"Regex", field:"regex", visibilityGrid:false, visibilityForm:true, ui:"checkbox", type:"boolean", width:"200px", nestedGridPosition:"form"},
            {label:"Show Result In JSON", field:"showResultInJSON", visibilityGrid:false, visibilityForm:true, ui:"checkbox", nestedGridPosition:"form", type:"boolean", width:"200px"},
            {label:"Resource", field:"resource", visibilityGrid:false, visibilityForm:true, ui:"text", type:"string", nestedGridPosition:"form", json:true, width:"200px", editableWhen:"false", when:"$showResultInJSON"},
            {label:"Operations", field:"actions", visibilityGrid:false, visibilityForm:true, ui:"text", type:"string", nestedGridPosition:"form", json:true, width:"200px", editableWhen:"false", when:"$showResultInJSON"},
            {label:"Views", field:"views", visibilityGrid:false, visibilityForm:true, ui:"text", type:"string", nestedGridPosition:"form", json:true, width:"200px", editableWhen:"false", when:"$showResultInJSON"}

        ]},
        {"label":"Roles", "field":"roles", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", nestedGridPosition:"form", "width":"200px", multiple:true, fields:[
            {"label":"Role", "field":"role", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"fk", "width":"200px", collection:"pl.roles", displayField:"role"},
            {"label":"Span", "field":"span", "visibilityGrid":false, "visibilityForm":true, "ui":"number", type:"number", "width":"200px", editableWhen:"false"}
        ]}
    ], collection:"pl.roles", "queryGrid":{"$collection":"pl.roles", $sort:{role:1}}}};

    AppViews.__editrole__ = {viewOptions:{ width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, ui:"grid", id:"__editrole__", showLabel:true, label:"Roles", viewControl:false, close:false, refreshDataOnLoad:true, resize:false, fields:AppViews.__createrole__.viewOptions.fields, collection:"pl.roles", "queryGrid":{"$collection":"pl.roles", $sort:{role:1}, $limit:50, $events:[
        {event:"onQuery", function:"MainCollectionEvents.executeResultForNavigation", post:true},
        {event:"onQuery", function:"MainCollectionEvents.onResult", post:false}
    ]}}};

    AppViews.__createapplication__ = {viewOptions:{width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, ui:"form", viewControl:false, resize:false, id:"__createapplication__", showLabel:true, label:"Create Application", fields:[
        {label:"Index", field:"index", visibilityGrid:true, visibilityForm:true, ui:"number", width:"200px"},
        {label:"Id", field:"id", visibilityGrid:true, visibilityForm:true, ui:"text", width:"200px", mandatory:true},
        {label:"Label", field:"label", visibilityGrid:true, visibilityForm:true, ui:"text", width:"200px", mandatory:true},
        {label:"Module Name", field:"moduleName", visibilityGrid:true, visibilityForm:true, ui:"text", width:"200px"},
        {label:"DB", field:"db", visibilityGrid:true, visibilityForm:true, ui:"text", width:"200px"},
        {"label":"Default Menu", "field":"defaultmenu", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"fk", "width":"200px", collection:"pl.menus", displayField:"label", filter:{application:"$current_application"}, parameters:{"current_application":"$_id"}},
        {"label":"Do Not Synch", "field":"doNotSynch", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", "width":"200px"},
        {"label":"Un Publish", "field":"unpublished", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", "width":"200px"},
        {label:"Roles", field:"roles", visibilityGrid:false, visibilityForm:true, resize:false, viewControl:false, ui:"grid", width:"200px", multiple:true, fields:[
            {label:"Role", field:"role", visibilityGrid:false, visibilityForm:true, ui:"autocomplete", type:"fk", width:"200px", collection:"pl.roles", displayField:"role", mandatory:true}
        ]},
        {label:"Collections", field:"collections", visibilityGrid:false, visibilityForm:true, resize:false, viewControl:false, ui:"grid", width:"200px", multiple:true, fields:[
            {label:"Collection", field:"collection", visibilityGrid:false, visibilityForm:true, ui:"autocomplete", type:"string", width:"200px", collection:"pl.collections", displayField:"collection", mandatory:true}
        ]}
    ], collection:"pl.applications"}};

    AppViews.__editapplication__ = {viewOptions:{width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, ui:"grid", viewControl:false, resize:false, close:false, id:"__editapplication__", showLabel:true, label:"Applications", refreshDataOnLoad:true, fields:AppViews.__createapplication__.viewOptions.fields, collection:"pl.applications",
        queryGrid:{$collection:"pl.applications", $sort:{label:1}, $limit:50, $events:[
            {event:"onQuery", function:"MainCollectionEvents.executeResultForNavigation", post:true},
            {event:"onQuery", function:"MainCollectionEvents.onResult", post:false}
        ]},
        actions:[
            {"label":"Menus", "type":"view", qviews:[
                {id:"__editemenu__"}
            ], "onRow":true, parameters:{"currentappid":"$_id"}}
        ]
    }};

    AppViews.__userNotifications__ = {"viewOptions":{"ui":"grid", "id":"__userNotifications__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, insert:false, close:true, showLabel:true, refreshDataOnLoad:true, refresh:false, viewControl:false, "label":"User Notifications", "fields":[
        {"label":"Notification", "field":"notificationid", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string", editableWhen:"false"},
        {"label":"Status", "field":"status", "visibilityGrid":true, "visibilityForm":true, type:"string", "ui":"autocomplete", type:"string", options:["On", "Off"]}
    ], "collection":"dummyUserNotifications"}};

    AppViews.__processes__ = {"viewOptions":{"ui":"grid", "id":"__processes__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, edit:false, insert:false, close:true, showLabel:true, refreshDataOnLoad:true, refresh:false, viewControl:false, "label":"Processes", "fields":[
        {"label":"Name", "field":"name", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string"},
        {"label":"Status", "field":"status", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string"},
        {"label":"Total", "field":"total", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string"},
        {"label":"Processed", "field":"processed", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string"},
        {"label":"Date", "field":"date", "visibilityGrid":true, "visibilityForm":true, "ui":"date", type:"date", "time":true},
        {"label":"Details", "field":"detail", visibilityForm:true, "ui":"grid", type:"object", fields:[
            {"label":"Message", "field":"message", "visibilityForm":true, "ui":"text", type:"string"},
            {"label":"Status", "field":"status", "visibilityForm":true, "ui":"text", type:"string"},
            {"label":"Error", "field":"error", "visibilityForm":true, "ui":"text", type:"string"}

        ]}
    ], "collection":"pl.processes", queryGrid:{$collection:"pl.processes", $filter:{"user._id":"$user._id"}, $fields:{name:1, status:1, total:1, processed:1, date:1}, $limit:10, $sort:{_id:-1}}, queryForm:{$collection:"pl.processes", $fields:{detail:1}}}};


    AppViews.__logs__ = {"viewOptions":{"ui":"grid", "id":"__logs__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refreshDataOnLoad:true, refresh:false, viewControl:false, "label":"Logs", "fields":[

        {"label":"URL", "field":"url", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string"},
        {"label":"Type", "field":"type", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string"},
        {"label":"Info", "field":"info", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string"},
        {"label":"Username", "field":"username", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string"},
        {"label":"Start Time", "field":"startTime", "visibilityGrid":true, "visibilityForm":true, "ui":"date", type:"date"},
        {"label":"End Time", "field":"endTime", "visibilityGrid":true, "visibilityForm":true, "ui":"date", type:"date" },
        {"label":"Total Time", "field":"totalTime", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string"},
        {"label":"Count", "field":"count", "visibilityGrid":true, "visibilityForm":true, "ui":"number", type:"number"},
        {"label":"Logs", "field":"logs", visibilityForm:true, "ui":"grid", type:"object", fields:[
            {"label":"Type", "field":"type", "visibilityForm":true, "ui":"text", type:"string"},
            {"label":"Log", "field":"log", "visibilityForm":true, "ui":"text", type:"string"},
            {"label":"Status", "field":"status", "visibilityForm":true, "ui":"text", type:"string"},
            {"label":"Error", "field":"error", "visibilityForm":true, "ui":"text", type:"string"},
            {"label":"Start Time", "field":"startTime", "visibilityForm":true, "ui":"date", type:"date"},
            {"label":"End Time", "field":"endTime", "visibilityForm":true, "ui":"date", type:"date"},
            {"label":"Total Time", "field":"totalTime", "visibilityForm":true, "ui":"text", type:"string"}
        ]}


    ], "collection":"pl.logs", queryGrid:{$collection:"pl.logs", $fields:{url:1, info:1, username:1, startTime:1, endTime:1, totalTime:1}, $limit:10, $sort:{_id:-1}, $filter:{token:"$token"}}, queryForm:{$collection:"pl.logs", $fields:{logs:1}}}};

    AppViews.__commitlogs__ = {"viewOptions":{"ui":"grid", "id":"__commitlogs__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:false, showLabel:true, refreshDataOnLoad:true, refresh:false, viewControl:false, "label":"Commit Logs", "fields":[
        {"label":"Info", "field":"info", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string"},
        {"label":"Type", "field":"type", "visibilityGrid":true, "visibilityForm":true, "ui":"autocomplete", type:"string", options:["Commit", "SetFields", "EnsureIndexes", "SlowQuery"], filterable:true},
        {"label":"Status", "field":"status", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string"},
        {"label":"Error", "field":"error", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string"},
        {"label":"Username", "field":"username", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", type:"boolean"},
        {"label":"Start Time", "field":"startTime", "visibilityGrid":true, "visibilityForm":true, "ui":"date", type:"date"},
        {"label":"End Time", "field":"endTime", "visibilityGrid":true, "visibilityForm":true, "ui":"date", type:"date" },
        {"label":"Total Time", "field":"totalTime", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string"}
    ], "collection":"pl.logs", queryGrid:{$collection:"pl.logs", $fields:{url:1, info:1, username:1, startTime:1, endTime:1, totalTime:1, status:1, error:1}, $limit:10, $sort:{_id:-1}, $filter:{type:"Commit"}}, queryForm:{$collection:"pl.logs"}}};

    AppViews.__collectionfields__ = [
        {"label":"Field", "field":"field", "visibilityGrid":true, "visibilityForm":true, "ui":"text", "width":"100px", group:"Default", ftsEnable:true, freeze:true, sortable:true, filterable:true, ftsEnable:true},
        {"label":"Index", "field":"index", "visibilityGrid":true, "visibilityForm":true, "ui":"number", "width":"40px", group:"Default", sortable:true},
        {"label":"Index Grid", "field":"indexGrid", "visibilityGrid":true, "visibilityForm":true, "ui":"number", "width":"40px", group:"grid"},
        {"label":"Index Form", "field":"indexForm", "visibilityGrid":true, "visibilityForm":true, "ui":"number", "width":"40px", group:"form"},
        {"label":"Label", "field":"label", "visibilityGrid":true, "visibilityForm":true, "ui":"text", "width":"100px", group:"Default", ftsEnable:true},
        {"label":"Type", "field":"type", "visibilityGrid":true, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"100px", options:["boolean", "currency", "date", "daterange", "duration", "file", "fk", "json", "number", "objectid", "object", "schedule", "sequence", "string", "unit"], group:"Default", filterable:true},
        {"label":"UI", "field":"ui", "visibilityGrid":true, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"100px", "options":["autocomplete", "checkbox", "currency", "date", "daterange", "dragAndDrop", "duration", "file", "grid", "html", "image", "json", "number", "rte", "schedule", "text", "textarea", "time", "unit", "radio"], group:"Default", filterable:true},
        {"label":"Json", "field":"json", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"60px", group:"Default"},
        {"label":"HTML", "field":"html", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", type:"string", when:"this.ui=='html'", group:"Default"},
        {"label":"Visibility", "field":"visibility", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", "width":"60px", group:"Default"},
        {"label":"Header Freeze", "field":"headerFreeze", "when":"this.ui == 'grid'", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"80px", group:"Default"},
        {"label":"toFixed", "field":"toFixed", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", type:"string", when:"this.ui=='currency' || this.ui=='duration'  || this.ui=='number'", group:"Default"},
        {"label":"toFixedAggregate", "field":"toFixedAggregate", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", type:"string", when:"this.ui=='currency' || this.ui=='duration'  || this.ui=='number'", group:"Default"},
        {"label":"Hide Unit", "field":"hideUnit", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"boolean", when:"this.ui=='currency' || this.ui=='duration'", group:"Default"},
        {"label":"Style", "field":"colStyle", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", type:"string", group:"Default"},
        {"label":"Freeze", "field":"freeze", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"boolean", group:"Default"},
        {"label":"Word Wrap", "field":"wordWrap", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"boolean", group:"Default"},
        {"label":"To Lower Case", "field":"toLowerCase", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"boolean", group:"Default", when:"this.type == 'string' || this.type =='sequence'"},
        {"label":"Use  Lower Case", "field":"useLowerCase", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"boolean", group:"Default", when:"this.type == 'fk'"},
        {"label":"Primary", "field":"primary", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"boolean", group:"Default"},
        {"label":"Time", "field":'time', "visibilityGrid":false, "visibilityForm":true, "when":"this.ui == 'date'", "group":"Default", "width":"200px", "ui":"checkbox"},
        {"label":"RefferedCollection", "field":"collection", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", group:"Default", "collection":"pl.collections", displayField:"collection", type:"string", when:"this.ui=='autocomplete'", filterable:true},
        {"label":"Parent Field Id", "field":"parentfieldid", "visibilityGrid":true, "visibilityForm":true, "ui":"autocomplete", type:"fk", collection:"pl.fields", displayField:"field", otherDisplayFields:["label"], "width":"100px", group:"Default", filter:{collectionid:"$collection_id"}, parameters:{collection_id:"$collection_id"}, filterable:true},
        {"label":"Recursion", "field":"recursion", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", type:"string", group:"Default", when:"this.ui=='autocomplete'"},
        {"label":"Display Field", "field":"displayField", "upsert":true, "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", group:"Default", collection:"pl.fields", displayField:"field", parameters:{refferedcollection:"$collection"}, filter:{"collectionid.collection":"$refferedcollection"}, when:"this.ui=='autocomplete'"},
        {"label":"Sort", "field":"sort", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"100px", group:"Default", when:"this.ui=='autocomplete'"},
        {"label":"Other Display Field", "field":"otherDisplayFields", "upsert":true, "visibilityGrid":false, multiple:true, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"200px", group:"Default", collection:"pl.fields", displayField:"field", parameters:{refferedcollection:"$collection"}, filter:{"collectionid.collection":"$refferedcollection"}, when:"this.ui=='autocomplete'"},
        {"label":"setFields", "field":"set", "upsert":true, "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", multiple:true, group:"Default", collection:"pl.fields", displayField:"field", parameters:{refferedcollection:"$collection"}, filter:{"collectionid.collection":"$refferedcollection"}, when:"this.ui=='autocomplete'"},
        {"label":"Non Persistent", "field":"nonPersistent", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", "width":"60px", group:"Default"},
        {"label":"Role", "field":"roleid", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", collection:"pl.roles", displayField:"role", type:"fk", group:"Default", when:"this.type=='fk'"},
        {"label":"Transient", "field":"transient", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"60px", group:"Default"},
        {"label":"Aggregate", "field":"aggregate", "visibilityGrid":false, "visibilityForm":true, type:"string", "ui":"autocomplete", options:["sum"], "width":"100px", group:"Default"},
        {"label":"Aggregate Defination", "field":"aggregateDefination", "visibilityGrid":false, "visibilityForm":true, type:"string", "ui":"text", "width":"100px", group:"Default"},
        {"label":"Field Group", "field":"fieldGroup", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"100px", group:"Default"},
        {"label":"Form Group", "field":"group", visibility:true, "ui":"autocomplete", type:"fk", "width":"100px", collection:"pl.formgroups", group:"Default", displayField:"title", set:["title"], filter:{collectionid:"$collection_id"}, parameters:{collection_id:"$collection_id"}},
        {"label":"Referred View", "field":"referredView", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", "json":true, "width":"200px", group:"Default"},
        {"label":"Responsive Columns", "field":"responsiveColumns", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", "json":true, "width":"200px", group:"Default"},
        {"label":"When", "field":"when", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", group:"Default" },
        {"label":"Referred When", "field":"referredWhen", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", group:"Default" },
        {"label":"Editable When", "field":"editableWhen", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", group:"Default" },
        {"label":"Form Type", "field":"formType", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "type":"string", "options":["Short", "Descriptive"], "width":"200px", group:"Default" },
        {"label":"Custom Filter", "field":"customFilter", "visibilityGrid":false, "visibilityForm":true, "when":"this.ui == 'date'", "ui":"json", type:"json", "width":"200px", group:"Default"},
        {"label":"Upsert", "field":"upsert", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default", when:"this.ui=='autocomplete'" },
        {"label":"Upsert Fields", "field":"upsertFields", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", multiple:true, group:"Default", collection:"pl.fields", displayField:"field", parameters:{refferedcollection:"$collection"}, filter:{"collectionid.collection":"$refferedcollection"}, when:"this.ui=='autocomplete'"},
        {"label":"Cascade", "field":"cascade", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default", when:"this.ui=='autocomplete'" },
        {"label":"Hyperlink Enabled", "field":"hyperlinkEnabled", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default"},
        {"label":"Cache", "field":"cache", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default", when:"this.ui=='autocomplete'  || this.ui =='currency' " },
        {"label":"Multiple", "field":"multiple", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default"},
        {"label":"Mandatory", "field":"mandatory", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default"},
        {"label":"Options", "field":"options", "visibilityGrid":false, "visibilityForm":true, "ui":"json", type:"json", "width":"200px", group:"Default", when:"this.ui=='autocomplete'"},
        {"label":"Radio Options", "field":"radioOptions", "visibilityGrid":true, "visibilityForm":true, "ui":"autocomplete", type:"string", multiple:true, options:[], upsert:true, "width":"200px", group:"Default", when:"this.ui=='radio'"},

        {"label":"FilterSpace", "field":"filterspace", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", group:"Default", "collection":"pl.filterspace", displayField:"space", type:"string", when:"this.ui=='autocomplete'"},
        {"label":"Filter", "field":"filter", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", group:"Default", when:"this.ui=='autocomplete'"},
        {"label":"Visibility Filter", "field":"visibilityFilter", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"200px", "options":["Always"], group:"Default"},
        {"label":"Default Filter", "field":"defaultFilter", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", "width":"200px", group:"Default"},
        {"label":"Parameters", "field":"parameters", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", group:"Default", when:"this.ui=='autocomplete'"},
        {"label":"Width", "field":"width", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", group:"Default"},
        {"label":"Auto Width Column", "field":"autoWidthColumn", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default"},
        {"label":"Update", "field":"update", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default"},
        {"label":"Filterable", "field":"filterable", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default"},
        {"label":"Boolean Filter Mapping", "field":"booleanFilterMapping", "visibilityGrid":false, "visibilityForm":true, "ui":"json", type:"json", when:"this.filterable && this.ui=='checkbox'", "width":"200px", group:"Default"},
        {"label":"Multiple Filterable", "field":"multipleFilterable", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default"},
        {"label":"Sortable", "field":"sortable", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default"},
        {"label":"Groupable", "field":"groupable", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default"},
        {"label":"Aggregatable", "field":"aggregatable", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default"},
        {"label":"Show Null Filter", "field":"showNullFilter", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"boolean", group:"Default"},
        //this field is added.If a user enable this field then he can filter the field for checking null values
        {"label":"FTS Enable", "field":"ftsEnable", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default"},
        {"label":"Events", "field":"events", "json":true, "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", type:"string", group:"Default", "when":"this.ui == 'autocomplete'"},
        {"label":"Collection Id", "field":"collectionid", "visibilityGrid":false, "visibilityForm":false, "ui":"autocomplete", "width":"200px", collection:"pl.collections", displayField:"collection", type:"fk", group:"Default"},
        {"label":"Visibility Grid", "field":"visibilityGrid", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"grid"},
        {"label":"Visibility Form", "field":"visibilityForm", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"form"},
        {"label":"When Grid", "field":"whenGrid", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", group:"grid" },
        {"label":"When Form", "field":"whenForm", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", group:"form" },
        {"label":"Editable When Grid", "field":"editableWhenGrid", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", group:"grid" },
        {"label":"Editable When Form", "field":"editableWhenForm", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", group:"form" },

        {"label":"Ui Grid", "field":"uiGrid", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", group:"grid"},
        {"label":"Ui Form", "field":"uiForm", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", group:"form"},

        {"label":"Query", "field":"query", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "json":true, "width":"200px", group:"form", type:"string", when:"this.type=='object'"}     ,

        {"label":"On View", "field":"customizationEnabled", index:72, "visibilityGrid":true, "visibilityForm":false, "ui":"checkbox", "type":"boolean", "width":"100px", "editableWhenGrid":"false", "filterable":true},
        {"label":"On Qview", "field":"qviewEnabled", "visibilityGrid":true, index:73, "visibilityForm":false, "ui":"checkbox", "type":"boolean", "width":"100px", "editableWhenGrid":"false", "filterable":true},
        {"label":"Alias", "field":"alias", "visibilityGrid":false, index:75, "visibilityForm":true, "ui":"text", "type":"string", "width":"100px", "filterable":true},
        {"label":"Drill Down Enabled", "field":"drillDownEnabled", "visibilityGrid":false, index:74, "visibilityForm":true, "ui":"checkbox", "type":"boolean", "width":"100px", "filterable":true},
        {"label":"Drill Down Value", "field":"drillDownValue", "visibilityGrid":false, index:75, "visibilityForm":true, "ui":"text", "type":"string", "width":"100px", "filterable":true},
        {"label":"Drill Down Unwind", "field":"drillDownUnwind", "visibilityGrid":false, index:75, "visibilityForm":true, "ui":"text", "type":"string", "width":"100px", "filterable":true}
    ];

    AppViews.__addfield__ = {"viewOptions":{"ui":"form", "id":"__addfield__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, viewControl:false, saveOptions:{editMode:true}, "label":"Add Field", "fields":angular.copy(AppViews.__collectionfields__),
        events:[
            {
                function:{source:"ApplaneFunctions/lib/AppSystemEvents",
                    name:"onInsert"},
                event:"onInsert"
            },
            {
                function:{source:"ApplaneFunctions/lib/AppSystemEvents",
                    name:"onValueChange", type:"js"},
                event:"onValue:[\"type\", \"ui\", \"parentfieldid\"]"
            }
        ], "collection":"pl.fields", groups:[
            {title:"Default", label:"Default", separator:true, showTitle:false, showLabel:true},
            {title:"grid", label:"grid", separator:true, showTitle:true, showLabel:true},
            {title:"form", label:"form", separator:true, showTitle:true, showLabel:true}
        ], queryGrid:{$collection:"pl.fields", $limit:1000, $filter:{collectionid:"$collection_id", __system__:{$ne:true}}, $sort:{field:1}, $events:[
            {
                function:"Fields.populateCustomizationIndicators",
                event:"onQuery",
                post:true
            }
        ]},
        queryForm:{$collection:"pl.fields", $filter:{collectionid:"$collection_id"}}}};

    AppViews.__editfield__ = { "viewOptions":{refreshDataOnLoad:true, "ui":"grid", "id":"__editfield__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, navigation:true, showLabel:true, refresh:false, viewControl:false, "label":"Fields", "fields":AppViews.__addfield__.viewOptions.fields,
        events:AppViews.__addfield__.viewOptions.events,
        "collection":"pl.fields", groups:[
            {title:"Default", label:"Default", separator:true, showTitle:false, showLabel:true},
            {title:"grid", label:"grid", separator:true, showTitle:true, showLabel:true},
            {title:"form", label:"form", separator:true, showTitle:true, showLabel:true}
        ], actions:[
            {"id":"addToCustomization", "label":"Add To View", visibility:true, "type":"invoke", "function":"Fields.addFields", "onHeader":true, "requireSelectedRows":true, "requestView":true, parameters:{"sourceid":"$sourceid", "addToCustomization":true, "view__id":"$viewid"}, when:"$sourceid"} ,
            {"id":"addToQview", "label":"Add To Qview", visibility:true, "type":"invoke", "function":"Fields.addFields", "onHeader":true, "requireSelectedRows":true, "requestView":true, parameters:{"sourceid":"$sourceid", "addToQview":true, "view__id":"$viewid"}},
            {label:"View Fields", type:"view", qviews:[
                {id:"__selfquickviewfieldcustomization__"}
            ], parameters:{"collection_id":"$collection_id", sourceid:"$sourceid", "view_id":"$view_id", "viewid":"$viewid", "customizationFields":true}, when:"$sourceid"},
            {label:"Q Fields", type:"view", qviews:[
                {id:"__selfquickviewfield__"}
            ], parameters:{"collection_id":"$collection_id", sourceid:"$sourceid", "view_id":"$view_id", "viewid":"$viewid", "qviewFields":true}}
        ], queryGrid:AppViews.__addfield__.viewOptions.queryGrid, queryForm:AppViews.__addfield__.viewOptions.queryForm}};


    AppViews.__selfquickviewfieldcustomization__ = {popup:true, "viewOptions":{setAsNull:true, refreshDataOnLoad:true, "ui":"grid", "id":"__selfquickviewfieldcustomization__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, viewControl:false, "insert":false, "label":"Fields", "fields":[
        {"label":"Q Fields", "field":"qFields", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", multiple:true, type:"object", "when":"this.ui == 'grid' || this.ui == 'form'", fields:angular.copy(AppViews.__collectionfields__)  }
    ], viewFields:["qFields"], "collection":"pl.qviewcustomizations", groups:[
        {title:"Default", label:"Default", separator:false, showTitle:false, showLabel:true}
    ], queryGrid:{
        $collection:"pl.qviewcustomizations", "$fields":{"qFields":1}, $events:[
            {function:"QviewCustomizations.mergeFieldsOnResult", event:"onQuery", post:true},
            {function:"QviewCustomizations.onPreSave", event:"onPreSave", "pre":true}
        ], "$parameters":{"customizationFields":true}, "$filter":{_id:"$sourceid"}
    }, queryForm:{$collection:"pl.qviewcustomizations", "$filter":{_id:"$sourceid"}}
    }}
    AppViews.__selfquickviewfield__ = {popup:true, "viewOptions":{setAsNull:true, refreshDataOnLoad:true, "ui":"grid", "id":"__selfquickviewfield__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, viewControl:false, "insert":false, "label":"Qview Fields", "fields":[
        {"label":"Q Fields", "field":"qFields", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", multiple:true, type:"object", "when":"this.ui == 'grid' || this.ui == 'form'", fields:angular.copy(AppViews.__collectionfields__)}
    ], viewFields:["qFields"], "collection":"pl.qviews", groups:[
        {title:"Default", label:"Default", separator:false, showTitle:false, showLabel:true}
    ], queryGrid:{
        $collection:"pl.qviews", "$fields":{"qFields":1}, $events:[
            {function:"QviewCustomizations.mergeFieldsOnResult", event:"onQuery", post:true}
        ], "$parameters":{"qviewFields":true}, $filter:{_id:"$view_id"}
    }, queryForm:{$collection:"pl.qviews", "$filter":{_id:"$view_id"}}
    }}

    AppViews.__quickviewfields__ = [
        {"label":"Id", "field":"id", "visibilityGrid":true, "visibilityForm":true, "ui":"text", "width":"200px", group:"Default", "referredView":{"id":"$id", "parameters":{"id":"$id"}}},
        {"label":"Label", "field":"label", "visibilityGrid":true, "visibilityForm":true, "ui":"text", "width":"200px", group:"Default"},
        {"label":"Index", "field":"index", "visibilityGrid":true, "visibilityForm":true, "ui":"number", "width":"200px", group:"Default"},
        {"label":"UI", "field":"ui", "visibilityGrid":true, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"200px", "options":["grid", "form", "dashboard", "html", "aggregate", "aggregateGrid", "graph"], group:"Default"},
        {"label":"Graph Type", "field":"graphType", "visibilityGrid":true, "visibilityForm":true, "when":"this.ui=='graph'", "ui":"autocomplete", type:"string", "width":"200px", "options":["bar-chart", "pie-chart"], group:"Default"},
        {"label":"X-axis Field", "field":"xAxisField", "visibilityGrid":true, "visibilityForm":true, "when":"this.ui=='graph' && this.graphType=='bar-chart'", "ui":"text", type:"string", "width":"200px", group:"Default"},
        {"label":"Y-axis Field", "field":"yAxisField", "visibilityGrid":true, "visibilityForm":true, "when":"this.ui=='graph' && this.graphType=='bar-chart'", "ui":"text", type:"string", "width":"200px", group:"Default"},
        {"label":"Arc Label", "field":"arcLable", "visibilityGrid":true, "visibilityForm":true, "when":"this.ui=='graph' && this.graphType=='pie-chart'", "ui":"text", type:"string", "width":"200px", group:"Default"},
        {"label":"Arc Value", "field":"arcValue", "visibilityGrid":true, "visibilityForm":true, "when":"this.ui=='graph' && this.graphType=='pie-chart'", "ui":"text", type:"string", "width":"200px", group:"Default"},
        {"label":"Dashboard Layout", "field":"dashboardLayout", "visibilityGrid":true, "visibilityForm":true, "ui":"autocomplete", type:"string", "options":["1 Column", "2 Columns", "3 Columns"], "width":"200px", group:"Default"},
        {"label":"Quick View Style", "field":"qViewStyle", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", type:"string", group:"Other Info", "when":"this.ui == 'grid'"},
        {"label":"Responsive Columns", "field":"responsiveColumns", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", "width":"200px", group:"Other Info", "when":"this.ui == 'grid'"},
        {"label":"Primary Field", "field":"primaryField", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "collection":"pl.fields", displayField:"field", "upsert":true, filter:{collectionid:"$collection_id"}, parameters:{"collection_id":"$collection_id"}, type:"string", "width":"200px", group:"Other Info", "when":"this.ui == 'grid' || this.ui == 'form'"},
        {"label":"Template", "field":"template", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", "width":"200px", when:"this.ui == 'html'", group:"Default"},
        {"label":"Template Type", "field":"templateType", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"200px", "options":["ejs", "xslt"], when:"this.ui == 'html'", group:"Default"},
        {"label":"DashboardType", "field":"dashboardType", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"200px", "options":["AutoHeight", "FixedHeight", "AdvanceDashboard"], group:"Default", "when":"this.ui == 'dashboard'"},
        {"label":"Insert View", "field":"insertView", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", "collection":"pl.collections", displayField:"collection", "width":"200px", group:"Default", "when":"this.dashboardType != 'AdvanceDashboard'"},
        {"label":"Insert View Detail", "field":"insertViewDetail", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", json:true, "width":"200px", group:"Default", "when":"this.dashboardType != 'AdvanceDashboard'"},
        {"label":"Drilldown View", "field":"drildownView", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", "collection":"pl.collections", displayField:"collection", "width":"200px", group:"Default", "when":"this.dashboardType != 'AdvanceDashboard'"},
        {"label":"Drilldown View Detail", "field":"drildownViewDetail", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", json:true, "width":"200px", group:"Default", "when":"this.dashboardType != 'AdvanceDashboard'"},
        {"label":"List View", "field":"listView", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", "collection":"pl.collections", displayField:"collection", "width":"200px", group:"Default", "when":"this.dashboardType != 'AdvanceDashboard'"},
        {"label":"List View Detail", "field":"listViewDetail", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", json:true, "width":"200px", group:"Default", "when":"this.dashboardType != 'AdvanceDashboard'"},
        {"label":"Collection", "field":"collection", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", collection:"pl.collections", displayField:"collection", type:"fk", group:"Default"},
        {"label":"Main Collection", "field":"mainCollection", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", collection:"pl.collections", displayField:"collection", type:"fk", group:"Default", "filterable":true},
        {"label":"Aggregate Type", "field":"aggregateType", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", options:["range", "as_on", "due", "forecast", "expression"], "width":"200px", group:"Default", when:"this.ui == 'aggregate'"},
        {"label":"Aggregate Expression", "field":"aggregateExpression", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", "width":"200px", group:"Default", when:"this.aggregateType == 'expression'"},
        {"label":"Do Not Synch", "field":"doNotSynch", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"200px", group:"Default"},
        {"label":"Value", "field":"value", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", group:"Default", collection:"pl.fields", displayField:"field", parameters:{refferedcollection:"$collection.collection"}, filter:{"collectionid.collection":"$refferedcollection", "type":{"$in":["duration", "currency", "number"]}}, when:"this.ui == 'aggregate'"},
        {"label":"Date", "field":"date", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", group:"Default", collection:"pl.fields", displayField:"field", parameters:{refferedcollection:"$collection.collection"}, filter:{"collectionid.collection":"$refferedcollection", "type":"date"}, when:"this.aggregateType === 'range' || this.aggregateType == 'as_on' || this.aggregateType == 'forecast'"},
        {"label":"Due Date", "field":"dueDate", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", group:"Default", collection:"pl.fields", displayField:"field", parameters:{refferedcollection:"$collection.collection"}, filter:{"collectionid.collection":"$refferedcollection", "type":"date"}, when:"this.aggregateType == 'due'"},
        {"label":"Receive Date", "field":"receiveDate", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", group:"Default", collection:"pl.fields", displayField:"field", parameters:{refferedcollection:"$collection.collection"}, filter:{"collectionid.collection":"$refferedcollection", "type":"date"}, when:"this.aggregateType == 'due'"},
        {"label":"AggregateSpan", "field":"aggregateSpan", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", type:"string", group:"Default", when:"this.dashboardType == 'AdvanceDashboard'"},
        {"label":"Filter", "field":"filter", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", "width":"200px", group:"Query"},
        {"label":"Action Availability", "field":"actionAvailability", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"200px", group:"Default", options:["available", "hidden", "override"], "when":"this.ui == 'grid'"},
        {"label":"Event Availability", "field":"eventAvailability", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"200px", group:"Default", options:["available"], "when":"this.ui == 'grid'"},
        {"label":"Recursion", "field":"recursion", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", json:true, "width":"200px", group:"Query"},
        {"label":"Group", "field":"group", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", json:true, "width":"200px", group:"Query"},
        {"label":"Unwind", "field":"unwind", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", json:true, "width":"200px", group:"Query"},
        {"label":"Transform", "field":"transform", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", "width":"200px", group:"Query", "when":"this.ui == 'grid'"},
        {"label":"Role", "field":"roleid", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", collection:"pl.roles", displayField:"role", type:"fk", group:"Default", "when":"this.ui == 'grid'"},
        {"label":"Role Field", "field":"roleField", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", group:"Default", collection:"pl.fields", displayField:"field", parameters:{refferedcollection:"$collection"}, filter:{"collectionid":"$refferedcollection._id"}, "when":"this.ui == 'grid'"},
        {"label":"Hidden", "field":"hidden", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"200px", group:"Other Info"},
        {"label":"Limit", "field":"limit", "visibilityGrid":false, "visibilityForm":true, "ui":"number", type:"number", "width":"200px", group:"Query"},
        {"label":"Fetch count", "field":"fetchCount", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"200px", group:"Other Info", "when":"this.ui == 'grid'"},
        {"label":"Field Customization", "field":"fieldCustomization", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"200px", group:"Other Info"},
        {"label":"Query Event", "field":"queryEvent", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", type:"string", group:"Query"},
        {"label":"Sort", "field":"sort", "visibilityGrid":false, "visibilityForm":true, "ui":"text", json:true, "width":"200px", type:"text", group:"Query"},
        {"label":"Insert", "field":"insert", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"text", group:"Other Info"},
        {"label":"Insert Mode", "field":"insertMode", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "type":"string", "width":"200px", "options":["grid", "form", "both"], "when":"this.insert", group:"Other Info"},
        {"label":"Edit", "field":"edit", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"text", group:"Other Info"},
        {"label":"Delete", "field":"delete", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"text", group:"Other Info"},
        {"label":"Detail", "field":"detail", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"text", group:"Other Info"},
        {"label":"Aggregate Position", "field":"aggregatePosition", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "type":"fk", "options":["header", "footer", "both"], "width":"200px", type:"text", group:"Other Info", "when":"this.ui == 'grid'"},
        {"label":"Show Selection", "field":"checkboxSelection", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"text", group:"Other Info", "when":"this.ui == 'grid'"},
        {"label":"Hide Unit", "field":"hideUnit", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"text", group:"Other Info"},
        {"label":"Auto Width Column", "field":"autoWidthColumn", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"text", group:"Other Info", "when":"this.ui == 'grid'"},
        {"label":"Navigation", "field":"navigation", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "type":"boolean", "width":"200px", group:"Other Info", "when":"this.ui == 'grid'"},
        {"label":"Run As Batch Query", "field":"runAsBatchQuery", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"text", group:"Query", when:"this.ui == 'dashboard'"},
        {"label":"Reload View On Filter Change", "field":"reloadViewOnFilterChange", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"text", group:"Other Info"},
        {"label":"Update Mode", "field":"updateMode", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", "width":"200px", group:"Other Info", "when":"this.ui == 'grid'"},
        {"label":"Cross Tab Info", "field":"crossTabInfo", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", "width":"200px", group:"Default", "when":"this.ui == 'grid'"},
        {"label":"Span Report", "field":"spanreport", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", "width":"200px", group:"Default", "when":"this.ui == 'grid'"},
        {"label":"Fullmode", "field":"fullMode", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"200px", group:"Other Info"},
        {"label":"Show Zero If Null", "field":"showZeroIfNull", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"200px", group:"Other Info", "when":"this.ui == 'grid'"},
        {"label":"Large Font", "field":"largeFont", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"200px", group:"Other Info", "when":"this.ui == 'grid'"},
        {"label":"Across DB", "field":"acrossDB", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", "width":"200px", group:"Other Info"},
        {"label":"Execute On Client", "field":"executeOnClient", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"200px", group:"Default", when:"this.dashboardType === 'AdvanceDashboard'"},
        {"label":"Upsert", "field":"upsert", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default", type:"boolean"},
        {"label":"Upsert Fields", "field":"upsertFields", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", type:"string", group:"Default", json:true, when:"$upsert"},
        {"label":"Field Availability", "field":"fieldAvailability", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", group:"Default", options:["available", "hidden", "override"]},
        {"label":"Do Not Merge Field Customization", "field":"doNotMergeFieldCustomizations", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"text", group:"Other Info", "when":"this.ui == 'grid'"},
        {"label":"Do Not Merge User Field Customization", "field":"doNotMergeUserFieldCustomizations", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"text", group:"Other Info", "when":"this.ui == 'grid'"}
    ]

    AppViews.__additionalquickviewfields__ = [
        {"label":"Views", "field":"views", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", multiple:true, type:"object", "when":"this.ui == 'dashboard'", fields:[
            {"label":"Index", "field":"index", type:"number", ui:"number", "visibilityForm":true, "width":'50px'} ,
            {"label":"Alias", "field":"alias", type:"string", "ui":"text", "visibilityForm":true, "width":'100px'},
            {"label":"Primary", "field":"primary", type:"boolean", "ui":"checkbox", "visibilityForm":true, "width":'30px'},
            {"label":"Col Span", "field":"colSpan", type:"number", "ui":"number", "visibilityForm":true, "width":'30px'},
            {"label":"Collection", "field":"collection", "visibilityForm":true, "ui":"autocomplete", "width":"100px", group:"Default", "collection":"pl.collections", displayField:"collection", type:"string"},
            {"label":"View", "field":"id", "visibilityForm":true, "ui":"autocomplete", "width":"100px", type:"string", group:"Default", collection:"pl.qviews", displayField:"id", parameters:{collection:"$collection"}, filter:{"collection.collection":"$collection"}},
            {"label":"Left", "field":"left", type:"string", ui:"text", "width":'50px', "visibilityForm":true, when:"this.dashboardType !== 'AdvanceDashboard'"} ,
            {"label":"Right", "field":"right", type:"string", ui:"text", "width":'50px', "visibilityForm":true, when:"this.dashboardType !== 'AdvanceDashboard'"},
            {"label":"Top", "field":"top", type:"string", ui:"text", "width":'50px', "visibilityForm":true, when:"this.dashboardType !== 'AdvanceDashboard'"},
            {"label":"Bottom", "field":"bottom", type:"string", "width":'50px', ui:"text", "visibilityForm":true, when:"this.dashboardType !== 'AdvanceDashboard'"},
            {"label":"Show Action", "field":"showAction", type:"boolean", "width":'50px', ui:"checkbox", "visibilityForm":true},
            {"label":"View Info", "field":"viewInfo", type:"string", "width":'100px', "ui":"text", "visibilityForm":true},
            {"label":"Group", "field":"group", type:"string", "width":'100px', "ui":"text", "visibilityForm":true},
            {"label":"Name", "field":"name", type:"string", "width":'100px', "ui":"text", "visibilityForm":true},
            {"label":"Query Group", "field":"queryGroup", "width":'100px', type:"string", "ui":"text", "visibilityForm":true},
            {"label":"Parameter Mappings", "field":"parametermappings", "width":'100px', type:"string", "ui":"text", "visibilityForm":true},
            {"label":"Parent", "field":"parent", "width":'100px', type:"string", "ui":"text", "visibilityForm":true}
        ]},
        {"label":"Aggregates", "field":"aggregates", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", multiple:true, type:"object", "when":"this.ui == 'dashboard'", fields:[
            {"label":"Index", "field":"index", type:"number", ui:"number", "visibilityForm":true, "width":'50px'} ,
            {"label":"Alias", "field":"alias", type:"string", "ui":"text", "visibilityForm":true, "width":'100px'},
            {"label":"Column", "field":"column", type:"number", "ui":"number", "visibilityForm":true, "width":'100px'},
            {"label":"Collection", "field":"collection", "visibilityForm":true, "ui":"autocomplete", "width":"100px", group:"Default", "collection":"pl.collections", displayField:"collection", type:"string"},
            {"label":"View", "field":"id", "visibilityForm":true, "ui":"autocomplete", "width":"100px", type:"string", group:"Default", collection:"pl.qviews", displayField:"id", parameters:{collection:"$collection"}, filter:{"collection.collection":"$collection"}},
            {"label":"View Info", "field":"viewInfo", type:"string", "width":'100px', "ui":"text", "visibilityForm":true},
            {"label":"Group", "field":"group", type:"string", "width":'100px', "ui":"text", "visibilityForm":true},
            {"label":"Name", "field":"name", type:"string", "width":'100px', "ui":"text", "visibilityForm":true},
            {"label":"Query Group", "field":"queryGroup", "width":'100px', type:"string", "ui":"text", "visibilityForm":true},
            {"label":"Parameter Mappings", "field":"parametermappings", "width":'100px', type:"string", "ui":"text", "visibilityForm":true},
            {"label":"Parent", "field":"parent", "width":'100px', type:"string", "ui":"text", "visibilityForm":true}
        ]},
        {"label":"Groups", "field":"dashboardGroups", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", multiple:true, type:"object", "when":"this.ui == 'dashboard'", fields:[
            {"label":"Name", "field":"name", type:"string", "ui":"text", "visibilityForm":true},
            {"label":"Show Name", "field":"showName", type:"boolean", "ui":"checkbox", "visibilityForm":true}
        ]},
        {"label":"Roles", "field":"roles", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", nestedGridPosition:"form", "width":"200px", multiple:true, fields:[
            {"label":"Role", "field":"role", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"fk", "width":"200px", collection:"pl.roles", displayField:"role", mandatory:true}
        ]}
    ]

    AppViews.__allquickviewfields__ = angular.copy(AppViews.__quickviewfields__);
    AppViews.__allquickviewfields__.push.apply(AppViews.__allquickviewfields__, AppViews.__additionalquickviewfields__);

    AppViews.__addquickview__ = {"viewOptions":{"ui":"form", "id":"__addquickview__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, viewControl:false, "label":"Add Quick view", "fields":angular.copy(AppViews.__allquickviewfields__), events:[
        {
            function:{source:"ApplaneFunctions/lib/AppSystemEvents",
                name:"onInsert"},
            event:"onInsert"
        },
        {
            function:{source:"ApplaneFunctions/lib/AppSystemEvents",
                name:"onQViewInsert"},
            event:"onInsert"
        }
    ], "collection":"pl.qviews", groups:[
        {title:"Default", label:"Default", separator:false, showTitle:false, showLabel:true},
        {title:"Query", label:"Query", separator:true, showTitle:true, showLabel:true},
        {title:"Other Info", label:"Other Info", separator:false, showTitle:true, showLabel:true}
    ], queryGrid:{
        $collection:"pl.qviews", $filter:{mainCollection:{"$$whenDefined":{"key":"$mainCollection_id"}}},
        $limit:50, $sort:{id:1}, $events:[
            {event:"onQuery", function:"MainCollectionEvents.executeResultForNavigation", post:true},
            {event:"onQuery", function:"MainCollectionEvents.onResult", post:false}
        ], $fields:{responsiveColumns:1, qViewStyle:1, id:1, label:1, filter:1, hidden:1, limit:1, recursion:1, group:1, roleid:1, roleField:1, unwind:1, transform:1, fetchCount:1, "collection._id":1, "collection.collection":1, "mainCollection._id":1, "mainCollection.collection":1, index:1, queryEvent:1, sort:1, ui:1, dashboardType:1, template:1, templateType:1, "actionAvailability":1, "insert":1, "insertMode":1, "edit":1, "delete":1, "detail":1, "reloadViewOnFilterChange":1, "batchQuery":1, "updateMode":1, "checkboxSelection":1, "navigation":1, "fieldCustomization":1, "aggregatePosition":1, "hideUnit":1, "primaryField":1, "autoWidthColumn":1, "crossTabInfo":1, "fullMode":1, "spanreport":1, "showZeroIfNull":1, "largeFont":1, "acrossDB":1, "advancedDashboardOptions":1, "value":1, "date":1, "aggregateExpression":1, "aggregateType":1, "runAsBatchQuery":1, "dueDate":1, "receiveDate":1, "insertView":1, "drildownView":1, "listView":1, "insertViewDetail":1, "drildownViewDetail":1, "listViewDetail":1, executeOnClient:1, "dashboardLayout":1, "graphType":1, "xAxisField":1, "yAxisField":1, "arcLable":1, "arcValue":1, "doNotMergeUserFieldCustomizations":1, "doNotMergeFieldCustomizations":1}},
        queryForm:{
            $collection:"pl.qviews",
            $fields:{eventAvailability:1, fieldAvailability:1, "upsert":1, "upsertFields":1, roles:1, fields:1, "actions._id":1, "actions.id":1, "actions.label":1, "actions.type":1, "actions.filterType":1, "actions.ui":1, "actions.asParameter":1, "actions.field":1, "actions.collection":1, "actions.displayField":1, "qFields._id":1, "qFields.availability":1, "qFields.visibility":1, "qFields.visibilityForm":1, "qFields.index":1, "qFields.indexForm":1, "qFields.filter":1, "qFields.editableWhen":1, "qFields.when":1, "qFields.qfield._id":1, "qFields.qfield.field":1, "views":1, "aggregates":1, "dashboardGroups":1
            }, $limit:50}}};

    AppViews.__editquickview__ = {"viewOptions":{ refreshDataOnLoad:true, "ui":"grid", "id":"__editquickview__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:false, navigation:true, showLabel:true, refresh:false, viewControl:false, "label":"Quick views", "fields":AppViews.__addquickview__.viewOptions.fields, "groups":AppViews.__addquickview__.viewOptions.groups,
        actions:[
            {"label":"References", "type":"view", qviews:[
                {id:"__quickviewreference__"}
            ], "visibility":true}
        ],
        events:AppViews.__addquickview__.viewOptions.events,
        "collection":"pl.qviews", queryGrid:AppViews.__addquickview__.viewOptions.queryGrid, queryForm:AppViews.__addquickview__.viewOptions.queryForm}};

    AppViews.__quickviewreference__ = {"viewOptions":{ refreshDataOnLoad:true, "ui":"grid", "id":"__quickviewreference__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:false, navigation:true, showLabel:true, refresh:false, viewControl:false, "insert":false, edit:false, delete:false, "label":"Quick views Reference", "fields":[
        {"label":"Id", "field":"id", "visibilityGrid":true, "visibilityForm":true, "ui":"text", "width":"200px", group:"Default", "referredView":{"id":"$id", "parameters":{"id":"$id"}}},
        {"label":"Main Collection", "field":"mainCollection", "visibilityGrid":true, "visibilityForm":true, "ui":"autocomplete", "width":"200px", collection:"pl.collections", displayField:"collection", type:"fk", group:"Default", "filterable":true},
        {"label":"References", "field":"noOfReferences", "visibilityGrid":true, "visibilityForm":true, "ui":"number", "type":"number", "width":"200px", group:"Default", sortable:true, filterable:true, "referredView":{"id":"__qviewReferences__", "parameters":{"id":"$id"}, "$filter":{"id":"$id"}, "ui":"form"}}
    ], actions:[
        {id:"populateQviewReferences", "label":"Populate Qview References", type:"invoke", "onHeader":true, "function":"Porting.populateQviewReference", "visibility":true}
    ], "groups":AppViews.__addquickview__.viewOptions.groups,
        events:AppViews.__addquickview__.viewOptions.events,
        "collection":"pl.qviews",
        queryGrid:{
            $collection:"pl.qviews",
            $limit:50, $sort:{id:1}, $events:[
                {event:"onQuery", function:"MainCollectionEvents.executeResultForNavigation", post:true},
                {event:"onQuery", function:"MainCollectionEvents.onResult", post:false}
            ], $fields:{id:1, noOfReferences:1, mainCollection:1}},
        queryForm:{
            $collection:"pl.qviews",
            $fields:{id:1, noOfReferences:1, mainCollection:1}, $limit:50}
    }};

    AppViews.__selfquickview__ = {};
    AppViews.__selfquickview__.viewOptions = angular.copy(AppViews.__editquickview__.viewOptions);
    AppViews.__selfquickview__.viewOptions.id = "__selfquickview__";
    AppViews.__selfquickview__.viewOptions.label = "Edit Qview";
    AppViews.__selfquickview__.viewOptions.setAsNull = true;
    AppViews.__selfquickview__.viewOptions.queryGrid.$filter = {_id:"$view_id"};
    AppViews.__selfquickview__.viewOptions.actions = [
        {label:"Edit View", type:"view", qviews:[
            {id:"__selfquickviewcustomization__"}
        ], parameters:{"collection_id":"$collection_id", sourceid:"$sourceid", "view_id":"$view_id", "viewid":"$viewid"}, "when":"$sourceid" }
    ]

    AppViews.__selfquickviewcustomization__ = {popup:true, "viewOptions":{setAsNull:true, "insert":false, refreshDataOnLoad:true, "ui":"grid", "id":"__selfquickviewcustomization__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, viewControl:false, "label":"Edit View", "fields":angular.copy(AppViews.__quickviewfields__), "upsertFields":JSON.stringify(["_id"]), upsert:true, "collection":"pl.qviewcustomizations", groups:[
        {title:"Default", label:"Default", separator:false, showTitle:false, showLabel:true},
        {title:"Query", label:"Query", separator:true, showTitle:true, showLabel:true},
        {title:"Other Info", label:"Other Info", separator:false, showTitle:true, showLabel:true}
    ], queryGrid:{
        $collection:"pl.qviewcustomizations",
        "$filter":{_id:"$sourceid"}, $events:[
            {function:"QviewCustomizations.onResult", event:"onQuery", post:true} ,
            {function:"QviewCustomizations.onPreSave", event:"onSave", pre:true}
        ]
    }, queryForm:{$collection:"pl.qviewcustomizations", "$filter":{_id:"$sourceid"}}
    }}


    AppViews.__actionfields__ = [
        {"label":"Index", "field":"index", "visibilityGrid":true, "visibilityForm":true, "ui":"number", type:"number", "width":"70px"},
        {"label":"Id", "field":"id", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string", "width":"100px", "filterable":true},
        {"label":"Label", "field":"label", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string", "width":"200px"},
        {"label":"Type", "field":"type", "visibilityGrid":true, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"100px", options:["invoke", "view", "filter"]},
        {"label":"When", "field":"when", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string", "width":"100px"},
        {"label":"On Row", "field":"onRow", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", "width":"70px"},
        {"label":"On Header", "field":"onHeader", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", "width":"70px"},
        {"label":"Function", "field":"function", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"200px", when:"this.type == 'invoke'", upsert:true, options:["ExportViewService.exportExcelView", "Porting.importExcelData", "ResolveTemplate.resolveTemplate"]},
        {"label":"Template ID", "field":"templateId", "visibilityGrid":true, "visibilityForm":true, "ui":"autocomplete", type:"fk", "width":"100px", "collection":"pl.templates", displayField:"id", filter:{collectionid:"$collection_id"}, parameters:{collection_id:"$collection_id"}, when:"this.function == 'ResolveTemplate.resolveTemplate' "},
        {"label":"Preview", "field":"preview", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", "width":"70px", when:"this.function == 'ResolveTemplate.resolveTemplate' "},
        {"label":"Request View", "field":"requestView", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px"},
        {"label":"Download File", "field":"downloadFile", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", when:"this.type == 'invoke'"},
        {"label":"Refresh Data", "field":"refreshData", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", when:"this.type == 'invoke'"},
        {"label":"Async", "field":"async", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"200px", when:"this.type == 'invoke'"},
        {"label":"Visibility", "field":"visibility", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"70px"},
        {"label":"Visibility Grid", "field":"visibilityGrid", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"70px"},
        {"label":"Visibility Form", "field":"visibilityForm", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"70px"},
        {"label":"Filter Type", "field":"filterType", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"200px", options:["date", "fk", "string", "boolean"], when:"this.type == 'filter'"},
        {"label":"Filter UI", "field":"ui", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"200px", options:["autocomplete", "date", "text", "checkbox"], when:"this.type == 'filter'"},
        {"label":"Boolean Filter Mapping", "field":"booleanFilterMapping", "visibilityGrid":false, "visibilityForm":true, "ui":"json", type:"json", when:"this.ui=='checkbox'", "width":"200px", group:"Default"},
        {"label":"As Parameter", "field":"asParameter", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"200px", when:"this.type == 'filter'"},
        {"label":"Field", "field":"field", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", "width":"200px", when:"this.type == 'filter'"},
        {"label":"Action Field", "field":"actionField", "visibilityGrid":false, "visibilityForm":true, "ui":"text", type:"string", "width":"200px"},
        {"label":"Require Selected Rows", "field":"requireSelectedRows", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"200px", when:"this.type == 'invoke'"},
        {"label":"Collection", "field":"collection", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"200px", "collection":"pl.collections", displayField:"collection", when:"this.type == 'view' || this.filterType == 'fk'"},
        {"label":"Display Field", "field":"displayField", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"200px", collection:"pl.fields", displayField:"field", parameters:{refferedcollection:"$collection"}, filter:{"collectionid.collection":"$refferedcollection"}, when:"this.filterType == 'fk'"},
        {"label":"Collection Id", "field":"collectionid", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", collection:"pl.collections", displayField:"collection", type:"fk"},
        {"label":"Filter", "field":"filter", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", type:"string", when:"this.type == 'view'"},
        {"label":"Parameters", "field":"parameters", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", type:"string", when:"this.type == 'view' || this.type == 'invoke'"},
        {"label":"Visibility Filter", "field":"visibilityFilter", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", options:["Always"], when:"this.type == 'filter'"},
        {"label":"Class", "field":"class", "visibilityGrid":false, "visibilityForm":true, type:"string", "ui":"autocomplete", options:["bar-chart", "excel", "pie-chart", "print", "reload"], "width":"100px" },
        {"label":"Default Filter", "field":"defaultFilter", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", type:"string", when:"this.type == 'filter'"},
        {"label":"Default Quick View", "field":"defaultqview", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"fk", "width":"200px", collection:"pl.qviews", displayField:"id", when:"this.type == 'view'", filter:{"collection.collection":"$collectionid"}, parameters:{collectionid:"$collection"}},
        {"label":"Multiple", "field":"multiple", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"200px", when:"this.filterType == 'fk'"},
        {"label":"Custom Filter", "field":"customFilter", "visibilityGrid":false, "visibilityForm":true, "when":"this.ui == 'date'", "ui":"json", type:"json", "width":"200px", when:"this.filterType == 'date'"},
        {"label":"On View", "field":"customizationEnabled", index:72, "visibilityGrid":true, "visibilityForm":false, "ui":"checkbox", "type":"boolean", "width":"100px", "editableWhenGrid":"false", "filterable":true},
        {"label":"On Qview", "field":"qviewEnabled", "visibilityGrid":true, index:73, "visibilityForm":false, "ui":"checkbox", "type":"boolean", "width":"100px", "editableWhenGrid":"false", "filterable":true}
    ]

    AppViews.__additionalactionfields__ = [
        //  qviews to provide view type actions on row(child view)
        {when:"this.type == 'view'", "label":"Quick views", "field":"qviews", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", "width":"200px", viewControl:false, navigation:false, multiple:true, fields:[
            {"label":"Index", "field":"index", "visibilityGrid":false, "visibilityForm":true, "ui":"number", "width":"200px"},
            {"label":"Collection", "field":"collection", "visibilityForm":true, "ui":"autocomplete", "width":"200px", "collection":"pl.collections", displayField:"collection", type:"string"},
            {"label":"Id", "field":"id", "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", collection:"pl.qviews", displayField:"id", parameters:{collection:"$collection"}, filter:{"collection.collection":"$collection"}},
            {"label":"Label", "field":"label", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px"},
            {"label":"UI", "field":"ui", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px"},
            {"label":"Limit", "field":"limit", "visibilityGrid":false, "visibilityForm":true, "ui":"number", "width":"200px"}
        ]},
        {when:"this.type == 'invoke'", "label":"Fields", "field":"fields", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", "width":"200px", viewControl:false, navigation:false, multiple:true, fields:[
            {"label":"Label", "field":"label", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px"},
            {"label":"Field", "field":"field", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px"},
            {"label":"Type", "field":"type", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"200px", "options":["string", "fk", "duration", "boolean", "currency", "file", "number", "grid", "date", "json"], group:"Default"},
            {"label":"UI", "field":"ui", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"200px", "options":["text", "autocomplete", "duration", "checkbox", "currency", "file", "number", "grid", "date", "json"], group:"Default"},
            {"label":"Referred Collection", "field":"collection", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", group:"Default", "collection":"pl.collections", displayField:"collection", type:"string"},
            {"label":"Display Field", "field":"displayField", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px"},
            {"label":"Multiple", "field":"multiple", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default"},
            {"label":"Options", "field":"options", "visibilityGrid":false, "visibilityForm":true, "ui":"json", type:"json", "width":"200px", group:"Default"},
            {"label":"Other Display Field", "field":"otherDisplayFields", "upsert":true, "visibilityForm":true, multiple:true, "ui":"autocomplete", type:"string", "width":"200px", collection:"pl.fields", displayField:"field", parameters:{refferedcollection:"$collection"}, filter:{"collectionid.collection":"$refferedcollection"}},
            {"label":"Filter", "field":"filter", "visibilityForm":true, "ui":"text", type:"string", "width":"200px"},
            {"label":"Parameters", "field":"parameters", "visibilityForm":true, "ui":"text", "width":"200px", type:"string"},
            {"label":"Role", "field":"roleid", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", "width":"200px", collection:"pl.roles", displayField:"role", type:"fk"}
        ]},
        // qviewids to show actions on these qviews if provided
        /*{"label":"Qview Ids", "field":"qviewids", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", "width":"200px", viewControl:false, navigation:false, multiple:true, fields:[
         {"label":"Id", "field":"id", "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", collection:"pl.qviews", displayField:"id", parameters:{"collectionid":"$collectionid"}, filter:{"collection":"$collectionid._id"}}
         ]}  ,*/
        {"label":"Roles", "field":"roles", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", nestedGridPosition:"form", "width":"200px", multiple:true, fields:[
            {"label":"Role", "field":"role", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"fk", "width":"200px", collection:"pl.roles", displayField:"role", mandatory:true}
        ]}
    ];
    AppViews.__allactionfields__ = angular.copy(AppViews.__actionfields__);
    AppViews.__allactionfields__.push.apply(AppViews.__allactionfields__, AppViews.__additionalactionfields__);

    AppViews.__addaction__ = {"viewOptions":{ "ui":"form", "id":"__addaction__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, viewControl:false, "label":"Add action", "fields":angular.copy(AppViews.__allactionfields__), events:AppViews.__insertEvents__, "collection":"pl.actions", queryGrid:{$collection:"pl.actions", $filter:{collectionid:"$collection_id"}, "$events":[
        {
            function:"Actions.populateCustomizationIndicators",
            event:"onQuery",
            post:true
        },
        {
            function:{source:"ApplaneFunctions/lib/AppSystemEvents",
                name:"onInsert"},
            event:"onInsert"
        }
    ]}, queryForm:{$collection:"pl.actions", $filter:{collectionid:"$collection_id"}}}};

    AppViews.__editaction__ = {
        "viewOptions":{
            refreshDataOnLoad:true, "ui":"grid", "id":"__editaction__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, navigation:true, viewControl:false, "label":"Actions", "fields":AppViews.__addaction__.viewOptions.fields,
            "events":AppViews.__insertEvents__,
            "collection":"pl.actions",
            queryGrid:AppViews.__addaction__.viewOptions.queryGrid, queryForm:AppViews.__addaction__.viewOptions.queryForm,
            actions:[
                {label:"Q Actions", type:"view", qviews:[
                    {id:"__selfquickviewaction__"}
                ], parameters:{"collection_id":"$collection_id", sourceid:"$sourceid", "view_id":"$view_id", "viewid":"$viewid", "qviewActions":true}},
                {label:"View Actions", type:"view", qviews:[
                    {id:"__selfquickviewactioncustomization__"}
                ], parameters:{"collection_id":"$collection_id", sourceid:"$sourceid", "view_id":"$view_id", "viewid":"$viewid", "customizationActions":true}, when:"$sourceid"},
                {"id":"addToQview", "label":"Add To Qview", visibility:true, "type":"invoke", "function":"Actions.addActions", "onHeader":true, "requireSelectedRows":true, "requestView":true, parameters:{"sourceid":"$sourceid", "addToQview":true, "view__id":"$viewid"}/*, when: "$sourceid"*/},
                {"id":"addToCustomization", "label":"Add To View", visibility:true, "type":"invoke", "function":"Actions.addActions", "onHeader":true, "requireSelectedRows":true, "requestView":true, parameters:{"sourceid":"$sourceid", "addToCustomization":true, "view__id":"$viewid"}, when:"$sourceid"}
            ]
        }};

    AppViews.__selfquickviewaction__ = {popup:true, "viewOptions":{ refreshDataOnLoad:true, "ui":"grid", "id":"__selfquickviewaction__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, viewControl:false, "insert":false, "label":"Qview Actions", "fields":[
        {"label":"Q Actions", "field":"qActions", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", multiple:true, type:"object", "when":"this.ui == 'grid' || this.ui == 'form'", fields:angular.copy(AppViews.__actionfields__)}
    ], viewFields:["qActions"], "collection":"pl.qviews", groups:[
        {title:"Default", label:"Default", separator:false, showTitle:false, showLabel:true}
    ], queryGrid:{
        $collection:"pl.qviews", "$fields":{"qActions":1}, $events:[
            {function:"QviewCustomizations.mergeFieldsOnResult", event:"onQuery", post:true}
        ], "$parameters":{"qviewActions":true}, $filter:{_id:"$view_id"}
    }, queryForm:{$collection:"pl.qviews", "$filter":{_id:"$view_id"}}
    }}


    AppViews.__selfquickviewactioncustomization__ = {popup:true, "viewOptions":{ refreshDataOnLoad:true, "ui":"grid", "id":"__selfquickviewactioncustomization__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, viewControl:false, "insert":false, "label":"Fields", "fields":[
        {"label":"Q Actions", "field":"qActions", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", multiple:true, type:"object", "when":"this.ui == 'grid' || this.ui == 'form'", fields:angular.copy(AppViews.__actionfields__)  }
    ], viewFields:["qActions"], "collection":"pl.qviewcustomizations", groups:[
        {title:"Default", label:"Default", separator:false, showTitle:false, showLabel:true}
    ], queryGrid:{
        $collection:"pl.qviewcustomizations", "$fields":{"qFields":1}, $events:[
            {function:"QviewCustomizations.mergeFieldsOnResult", event:"onQuery", post:true},
            {function:"QviewCustomizations.onPreSave", event:"onPreSave", "pre":true}
        ], "$parameters":{"customizationActions":true}, "$filter":{_id:"$sourceid"}
    }, queryForm:{$collection:"pl.qviewcustomizations", "$filter":{_id:"$sourceid"}}
    }}

    AppViews.__manageevents__ = {"viewOptions":{ refreshDataOnLoad:true, "ui":"grid", "id":"__manageevents__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, "label":"Events", "fields":[
        {"label":"Collection Id", "field":"collectionid", "visibilityGrid":false, "visibilityForm":false, "ui":"autocomplete", "width":"200px", collection:"pl.collections", displayField:"collection", type:"fk"},
        {"label":"Event", "field":"event", "visibility":true, "ui":"text", "width":"200px"},
        {"label":"Function", "field":"function", "visibility":true, "ui":"text", "width":"200px"},
        {"label":"Pre", "field":"pre", "visibility":true, "ui":"checkbox", "width":"200px"},
        {"label":"Post", "field":"post", "visibility":true, "ui":"checkbox", "width":"200px"},
        {"label":"Require", "field":"require", "visibility":true, "ui":"text", "width":"200px"},
        {"label":"Options", "field":"options", "visibility":true, "ui":"text", "width":"200px", type:"string"},
        {"label":"Client", "field":"client", "visibility":true, "ui":"checkbox", "width":"200px"},
        {"label":"Server", "field":"server", "visibility":true, "ui":"checkbox", "width":"200px"},
        {"label":"Required Fields", "field":"requiredfields", "visibility":true, "ui":"text", "width":"200px", type:"string"},
        {"label":"Required Modules", "field":"requiredmodules", "visibility":true, "ui":"text", "width":"200px", type:"string"}
    ], groups:[
        {title:"Default", label:"Default", separator:false, showTitle:false, showLabel:true}
    ], "collection":"pl.events", queryGrid:{$collection:"pl.events", $filter:{collectionid:"$collection_id"}}, queryForm:{$collection:"pl.events", $filter:{collectionid:"$collection_id"}}}};

    AppViews.__manageworkflowevents__ = {"viewOptions":{refreshDataOnLoad:true, "ui":"grid", "id":"__manageworkflowevents__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, "label":"Workflow Events", "fields":[
        {"label":"Collection Id", "field":"collectionid", "visibilityGrid":false, "visibilityForm":false, "ui":"autocomplete", "width":"200px", collection:"pl.collections", displayField:"collection", type:"fk"},
        {"label":"Event", "field":"event", "visibility":true, "ui":"text", "width":"200px"},
        {"label":"Action", "field":"action", "visibility":true, "ui":"text", "width":"200px"},
        {"label":"Condition", "field":"condition", "visibility":true, "ui":"text", "width":"200px"},
        {"label":"Trigger Event", "field":"triggerEvent", "visibility":true, "ui":"text", "width":"200px"},
        {"label":"Parameters", "field":"parameters", "visibility":true, "ui":"text", "width":"200px"}
    ], groups:[
        {title:"Default", label:"Default", separator:false, showTitle:false, showLabel:true}
    ], "collection":"pl.workflowevents", queryGrid:{$collection:"pl.workflowevents", $filter:{collectionid:"$collection_id"}}, queryForm:{$collection:"pl.workflowevents", $filter:{collectionid:"$collection_id"}}}};

    AppViews.__managetrigger__ = {"viewOptions":{ refreshDataOnLoad:true, "ui":"grid", "id":"__managetrigger__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:false, showLabel:true, refresh:false, "label":"Collection", insert:true, delete:false, "fields":[
        {"label":"Collection", "field":"collection", "visibilityGrid":true, "visibilityForm":true, "type":"string", "ui":"text", "width":"200px", group:"Default", "editableWhen":"$__insert__"},
//        {"label": "Parent Collection", "field": "parentCollection", "visibilityGrid": true, "visibilityForm": true, "type":"string", "ui": "autocomplete", "width": "200px", group: "Default", "editableWhen": "$__insert__", collection: "pl.collections", displayField: "collection"},
        {"label":"Global", "field":"global", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"200px", group:"Default"},
        {"label":"HistoryEnabled", "field":"historyEnabled", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default"},
        {"label":"History Fields", "field":"historyFields", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string", "width":"200px", group:"Default"},
        {"label":"Responsive Columns", "field":"responsiveColumns", "visibilityGrid":true, "visibilityForm":true, "ui":"text", "width":"200px", group:"Default"},
        {"label":"User Sorting", "field":"userSorting", "visibilityGrid":true, "visibilityForm":true, "ui":"text", "width":"200px", group:"Default"},
        {"label":"Do Not Synch", "field":"doNotSynch", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"boolean", group:"Default"},
        {"label":"Primary Field", "field":"primaryField", "visibilityGrid":true, "visibilityForm":true, "ui":"autocomplete", "collection":"pl.fields", displayField:"field", "upsert":true, filter:{collectionid:"$collection_id"}, parameters:{"collection_id":"$collection_id"}, type:"string", "width":"200px", group:"Default"},
        {"label":"Fetch count", "field":"fetchCount", "visibilityGrid":false, "visibilityForm":true, "ui":"checkbox", type:"boolean", "width":"100px", group:"Default"},
        {"label":"Comment Enabled", "field":"commentEnabled", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Comment Enabled"},
        {"label":"Source", "field":"comment_source", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", group:"Comment Enabled", "when":'$commentEnabled'},
        {"label":"Event", "field":"comment_event", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", group:"Comment Enabled", "when":'$commentEnabled'},
        {"label":"Display Field", "field":"comment_displayField", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px", group:"Comment Enabled", "when":'$commentEnabled'}
    ], actions:[
        {id:"Collection", "label":"Collection", type:"filter", "field":"_id", "visibility":true, "filterType":"string", "ui":"autocomplete", collection:"pl.collections", displayField:"collection"},
        {id:"synchChild", "label":"Synch Child", type:"invoke", "onHeader":true, "function":"Fields.synchChild", "parameters":{ "collection":"$collection"}, "visibility":true},
        {id:"populateDrillDownView", "label":"Populate Drill Down View", type:"invoke", "onHeader":true, "function":"Fields.populateDrillDownView", "parameters":{ "collection":"$collection"}, "visibility":true},
        {"label":"Fields", "type":"view", qviews:[
            {id:"__editfield__"}
        ], "onRow":true, parameters:{"collection_id":"$_id"}},
        {"label":"Actions", "type":"view", qviews:[
            {id:"__editaction__"}
        ], "onRow":true, parameters:{"collection_id":"$_id"}},
        {"label":"Qviews", "type":"view", qviews:[
            {id:"__editquickview__"}
        ], "onRow":true, parameters:{"mainCollection_id":"$_id"}},
        {"label":"Events", "type":"view", qviews:[
            {id:"__manageevents__"}
        ], "onRow":true, parameters:{"collection_id":"$_id"}},
        {"label":"WorkFlow Events", "type":"view", qviews:[
            {id:"__manageworkflowevents__"}
        ], "onRow":true, parameters:{"collection_id":"$_id"}},
        {"label":"Templates", "type":"view", qviews:[
            {id:"__edittemplates__"}
        ], "onRow":true, parameters:{"collection_id":"$_id"}},
        {"label":"Indexes", "type":"view", qviews:[
            {id:"__manageIndexes__"}
        ], "onRow":true, parameters:{"collection_id":"$_id"}},
        {"label":"Form Groups", "type":"view", qviews:[
            {id:"__manageFormGroup__"}
        ], "onRow":true, parameters:{"collection_id":"$_id"}},
        {"label":"Series", "type":"view", qviews:[
            {id:"__series__"}
        ], "onRow":true, parameters:{"collection_id":"$_id"}},
        {"label":"Filter Space", "type":"view", qviews:[
            {id:"__filterspace__"}
        ], "onRow":true, parameters:{"collection_id":"$_id"}}
    ], groups:[
        {title:"Default", label:"Default", separator:false, showTitle:false, showLabel:true},
        {title:"Comment Enabled", label:"Comment Enabled", separator:false, showTitle:true, showLabel:true}
    ], "collection":"pl.collections", queryGrid:{$collection:"pl.collections", $filter:{_id:{"$$whenDefined":{"key":"$collection_id"}}}, $sort:{collection:1}, $limit:50, $events:[
        {event:"onQuery", function:"MainCollectionEvents.executeResultForNavigation", post:true},
        {event:"onQuery", function:"MainCollectionEvents.onResult", post:false}
    ]}, queryForm:{$collection:"pl.collections", $filter:{_id:"$collection_id"}}}};


    AppViews.__manageIndexes__ = {"viewOptions":{refreshDataOnLoad:true, "ui":"grid", "id":"__manageIndexes__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, "label":"Indexes", "fields":[
        {"label":"Collection Id", "field":"collectionid", "visibilityGrid":false, "visibilityForm":false, "ui":"autocomplete", "width":"200px", collection:"pl.collections", displayField:"collection", type:"fk"},
        {"label":"Name", "field":"name", visibility:true, "ui":"text", "width":"200px", type:"string"},
        {"label":"Indexes", "field":"indexes", visibility:true, "ui":"text", "width":"200px", type:"string"},
        {"label":"Unique", "field":"unique", visibility:true, "ui":"checkbox", "width":"200px", type:"boolean"},
        {"label":"Background", "field":"background", visibility:true, "ui":"checkbox", "width":"200px", type:"boolean"},
        {"label":"Drop Dups", "field":"dropDups", visibility:true, "ui":"checkbox", "width":"200px", type:"boolean"},
        {"label":"Expire After Seconds", "field":"expireAfterSeconds", visibility:true, "ui":"number", "width":"200px", type:"number"}
    ], events:[
        {
            function:{source:"ApplaneFunctions/lib/AppSystemEvents",
                name:"onInsertIndexes"},
            event:"onInsert"
        }
    ],
        "collection":"pl.indexes",
        queryGrid:{$collection:"pl.indexes", $filter:{collectionid:"$collection_id"}, $sort:{index:1}},
        queryForm:{$collection:"pl.indexes", $filter:{collectionid:"$collection_id"}, $sort:{index:1}}
    }};


    AppViews.__manageFormGroup__ = {"viewOptions":{refreshDataOnLoad:true, "ui":"grid", "id":"__manageFormGroup__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, "label":"Form Groups", "fields":[
        {"label":"Collection Id", "field":"collectionid", "visibilityGrid":false, "visibilityForm":false, "ui":"autocomplete", "width":"200px", collection:"pl.collections", displayField:"collection", type:"fk"},
        {"label":"Index", "field":"index", visibility:true, "ui":"number", "width":"200px", type:"number"},
        {"label":"Title", "field":"title", visibility:true, "ui":"text", "width":"200px", type:"string"},
        {"label":"No. of columns per row", "field":"noOfColumnsPerRow", visibility:true, "ui":"number", "width":"200px", type:"number"},
        {"label":"When", "field":"when", visibility:true, "ui":"text", "width":"200px", type:"string"},
        {"label":"Tab Label", "field":"tabLabel", visibility:true, "ui":"text", "width":"200px", type:"string"},
        {"label":"Show title", "field":"showTitle", visibility:true, "ui":"checkbox", "width":"200px", type:"boolean"},
        {"label":"Separator", "field":"separator", visibility:true, "ui":"checkbox", "width":"200px", type:"boolean"},
        {"label":"Show label", "field":"showLabel", visibility:true, "ui":"checkbox", "width":"200px", type:"boolean"},
        {"label":"type", "field":"type", visibility:true, "ui":"autocomplete", "width":"200px", type:"string", options:["flow"]}

    ], events:AppViews.__insertEvents__,
        "collection":"pl.formgroups",
        queryGrid:{$collection:"pl.formgroups", $filter:{collectionid:"$collection_id"}, $sort:{index:1}},
        queryForm:{$collection:"pl.formgroups", $filter:{collectionid:"$collection_id"}, $sort:{index:1}}
    }};


    AppViews.__createfunction__ = {"viewOptions":{ "ui":"form", "id":"__createfunction__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, "label":"Create Function", "fields":[
        {"label":"Name", "field":"name", "visibilityGrid":true, "visibilityForm":true, "ui":"text", "width":"200px" },
        {"label":"Source", "field":"source", "visibilityGrid":true, "visibilityForm":true, "ui":"text", "width":"200px"},
        {"label":"Type", "field":"type", "visibilityGrid":true, "visibilityForm":true, "ui":"text", "width":"200px"},
        {"label":"Do Not Synch", "field":"doNotSynch", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", "width":"200px", type:"boolean"}
    ], "collection":"pl.functions"}};

    AppViews.__editfunction__ = {"viewOptions":{refreshDataOnLoad:true, "ui":"grid", "id":"__editfunction__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:false, viewControl:false, showLabel:true, refresh:false, "label":"Functions", "fields":AppViews.__createfunction__.viewOptions.fields, "collection":"pl.functions", queryGrid:{$collection:"pl.functions", $sort:{name:1}, $limit:50, $events:[
        {event:"onQuery", function:"MainCollectionEvents.executeResultForNavigation", post:true},
        {event:"onQuery", function:"MainCollectionEvents.onResult", post:false}
    ]}}};

    AppViews.__createmenu__ = {"viewOptions":{ "ui":"form", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, "id":"__createmenu__", "label":"Add Menu", showLabel:true, saveOptions:{editMode:true}, resize:false, "fields":[
        {"label":"Index", "field":"index", "visibilityGrid":true, "visibilityForm":true, "ui":"number", "width":"50px"},
        {"label":"Label", "field":"label", "visibilityGrid":true, "visibilityForm":true, "ui":"text", "width":"200px"},
        {"label":"Collection", "field":"collection", "visibilityGrid":true, "visibilityForm":true, "ui":"text", "width":"200px"},
        {"label":"When", "field":"when", "visibilityGrid":true, "visibilityForm":true, "ui":"text", "width":"200px"},
        {"label":"Application", "field":"application", "visibilityGrid":false, "visibilityForm":false, "ui":"autocomplete", "width":"200px", collection:"pl.applications", displayField:"label", type:"fk"},
        {"label":"Parent Menu", "field":"parentmenu", "visibilityGrid":true, "visibilityForm":true, "ui":"autocomplete", type:"fk", "width":"200px", collection:"pl.menus", displayField:"label", filter:{application:"$currentappid"}, parameters:{currentappid:"$currentappid"}},
        {"label":"Default Quick View", "field":"defaultqview", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"fk", "width":"200px", collection:"pl.qviews", displayField:"id", parameters:{collection:"$collection"}, filter:{"collection.collection":"$collection"}},
        {"label":"Quick views", "field":"qviews", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", "width":"200px", multiple:true, fields:[
            {"label":"Collection", "field":"collection", "visibilityForm":true, "ui":"autocomplete", "width":"200px", group:"Default", "collection":"pl.collections", displayField:"collection", type:"string"},
            {"label":"Id", "field":"id", "visibilityForm":true, "ui":"autocomplete", "width":"200px", type:"string", group:"Default", collection:"pl.qviews", displayField:"id", parameters:{collection:"$collection"}, filter:{"collection.collection":"$collection"}},
            {"label":"Index", "field":"index", "visibilityGrid":false, "visibilityForm":true, "ui":"number", "width":"200px"},
            {"label":"Label", "field":"label", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px"},
            {"label":"UI", "field":"ui", "visibilityGrid":false, "visibilityForm":true, "ui":"text", "width":"200px"},
            {"label":"Limit", "field":"limit", "visibilityGrid":false, "visibilityForm":true, "ui":"number", "width":"200px"}
        ]}
    ], events:AppViews.__insertEvents__, "collection":"pl.menus", queryGrid:{$collection:"pl.menus", $filter:{application:"$currentappid"}, $sort:{index:1}}, queryForm:{$collection:"pl.menus", $filter:{application:"$currentappid"}}}};


    AppViews.__editemenu__ = {
        "viewOptions":{
            refreshDataOnLoad:true, "ui":"grid", close:true, width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, "id":"__editemenu__", "label":"Menus",
            showLabel:true, resize:false, "fields":AppViews.__createmenu__.viewOptions.fields, viewControl:false,
            events:AppViews.__insertEvents__,
            "collection":"pl.menus",
            queryGrid:AppViews.__createmenu__.viewOptions.queryGrid,
            queryForm:AppViews.__createmenu__.viewOptions.queryForm
        }};


    AppViews.__edituser__ = { "viewOptions":{refreshDataOnLoad:true, "ui":"grid", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, viewControl:false, "id":"__edituser__", close:true, showLabel:true, "label":"Users", "fields":[
        {"label":"Name", "field":"username", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string", "width":"200px", group:"Default", filterable:true},
        {"label":"Emailid", "field":"emailid", "visibilityGrid":true, "visibilityForm":true, "ui":"text", type:"string", "width":"200px", group:"Default", filterable:true},
        {"label":"FullName", "field":"fullname", "visibilityGrid":true, "visibilityForm":true, "ui":"text", "width":"200px", group:"Default"},
        {"label":"Password", "field":"password", "visibilityGrid":false, "visibilityForm":true, "ui":"password", group:"Default"},
        {"label":"Page size", "field":"no_of_records", "visibilityGrid":true, "visibilityForm":true, "ui":"number", "width":"200px", group:"Default"},
        {"label":"Admin", "field":"admin", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default"},
        {"label":"Developer", "field":"developer", "visibilityGrid":true, "visibilityForm":true, "ui":"checkbox", "width":"200px", group:"Default"},
        {"label":"Status", "field":"status", "visibilityGrid":true, "visibilityForm":true, "ui":"autocomplete", type:"string", "width":"200px", group:"Default", options:["active", "deactive"]},
        {"label":"Roles", "field":"roles", "visibilityGrid":false, "visibilityForm":true, "ui":"grid", "width":"200px", multiple:true, fields:[
            {"label":"Role", "field":"role", "visibilityGrid":false, "visibilityForm":true, "ui":"autocomplete", type:"fk", "width":"200px", collection:"pl.roles", displayField:"role", "fields":[
                {"label":"Span", "field":"span", "visibilityGrid":false, "visibilityForm":true, "ui":"number", type:"number", "width":"200px", editableWhen:"false"}
            ]}
        ]}
    ], groups:[
        {title:"Default", label:"Default", separator:false, showTitle:false, showLabel:true}
    ], "collection":"pl.users", queryGrid:{$collection:"pl.users", $fields:{username:1, emailid:1, fullname:1, no_of_records:1, admin:1, status:1, developer:1}, $sort:{username:1}, $limit:100}, queryForm:{$collection:"pl.users", $fields:{"roles._id":1, "roles.role.role":1, "roles.role.span":1}}}};

    AppViews.__emailtracker__ = { "viewOptions":{refreshDataOnLoad:true, "ui":"grid", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, viewControl:false, "id":"__emailtracker__", close:false, showLabel:true, "label":"Email Tracker", "fields":[
        {"label":"Function", "field":"function", "visibilityGrid":true, "visibilityForm":true, "ui":"text", "width":"200px"}
    ], "collection":"pl.emailtrackers"}};
    AppViews.__qviewReferences__ = {"viewOptions":{ refreshDataOnLoad:true, "ui":"grid", "id":"__qviewReferences__", "responsiveColumns":'{"$title": "fk.label", "$rightField": "type", "$otherFields": ["mainfk.label"]}', width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:false, showLabel:true, refresh:false, "label":"Qview References", insert:true, delete:false, "fields":[
        {"label":"Qview Id", "field":"id", "visibilityGrid":true, "visibilityForm":true, "type":"string", "ui":"text", "width":"200px", group:"Default", "filterable":true},
        {"label":"Collection", "field":"collection", "visibilityGrid":true, "visibilityForm":true, "type":"string", "ui":"text", "width":"200px", group:"Default"}  ,
        {"label":"Fk", "field":"fk.label", "visibilityGrid":true, "visibilityForm":true, "type":"string", "ui":"text", "width":"200px", group:"Default"},
        {"label":"Main Fk", "field":"mainfk.label", "visibilityGrid":true, "visibilityForm":true, "type":"string", "ui":"text", "width":"200px", group:"Default"},
        {"label":"Type", "field":"type", "visibilityGrid":true, "visibilityForm":true, "type":"string", "ui":"text", "width":"200px", group:"Default"}
    ], "collection":"qviewReferences", queryGrid:{$collection:"qviewReferences", $limit:50, $filter:{id:"$id"}}, queryForm:{$collection:"qviewReferences"}}};

    AppViews.__filterspace__ = {"viewOptions":{refreshDataOnLoad:true, "ui":"grid", "id":"__filterspace__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, "label":"Filter Space", "fields":[
        {"label":"Space", "field":"space", visibility:true, "ui":"text", "width":"200px", type:"string"}
    ],
        "collection":"pl.filterspace",
        queryGrid:{$collection:"pl.filterspace", $sort:{index:1}},
        queryForm:{$collection:"pl.filterspace", $sort:{index:1}}
    }};

    AppViews.__series__ = {"viewOptions":{refreshDataOnLoad:true, "ui":"grid", "id":"__series__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, "label":"Series", "fields":[
        {"label":"Collection", "field":"collection", filterable:true, "visibility":true, "ui":"text", "width":"200px", type:"string"},
        {"label":"Series", "field":"series", filterable:true, visibility:true, "ui":"text", "width":"200px", type:"string"},
        {"label":"Number", "field":"number", filterable:true, visibility:true, "ui":"text", "width":"200px", type:"number"}
    ],
        "collection":"pl.series",
        queryGrid:{$collection:"pl.series", $sort:{index:1}},
        queryForm:{$collection:"pl.series", $sort:{index:1}}
    }};

    AppViews.__setfield__ = {"viewOptions":{refreshDataOnLoad:true, "ui":"form", "id":"__setfield__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, "label":"Set Field", "fields":[
        {field:"db", label:"Db", type:"string", ui:"text", visibility:true},
        {field:"collection", label:"Collection", type:"string", ui:"text", visibility:true},
        {field:"field", label:"Field", type:"string", ui:"text", visibility:true},
        {field:"filter", label:"Filter", type:"string", ui:"text", visibility:true},
        {field:"cursor", label:"Cursor", type:"number", ui:"number", visibility:true},
        {field:"limit", label:"Limit", type:"number", ui:"number", visibility:true}
    ]
    }};

    AppViews.__commit__ = {"viewOptions":{refreshDataOnLoad:true, "ui":"form", "id":"__commit__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, "label":"Commit", "fields":[
        {field:"commit", label:"Commit", type:"boolean", ui:"checkbox", visibility:false, "width":"200px"},
        {field:"type", label:"Type", type:"string", ui:"autocomplete", visibility:true, "width":"200px", options:["application", "collection", "function", "role", "filterspace", "emailtracker", "fieldCustomization", "qview", "qviewCustomization"]},
        {field:"value", label:"Value", type:"string", ui:"text", visibility:true, "width":"200px"}
    ]
    }};

    AppViews.__removeCache__ = {"viewOptions":{refreshDataOnLoad:true, "ui":"form", "id":"__removeCache__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, "label":"Remove Cache", "fields":[
        {field:"all", label:"Clear Complete Cache", type:"boolean", ui:"checkbox", visibility:false, "width":"200px"},
        {"label":"DB", "field":"db", "ui":"autocomplete", "width":"200px", visibility:true, type:"string", collection:"pl.dbs", displayField:"db", events:[
            {
                function:"Porting.getDbs",
                event:"onQuery",
                post:true
            }
        ]},
        {field:"username", label:"User Name", type:"string", ui:"autocomplete", visibility:true, "width":"200px", collection:"pl.users", displayField:"username", parameters:{"db":"$db"}, events:[
            {
                function:"Porting.getUser",
                event:"onQuery",
                post:true
            }
        ]}
    ]
    }};

    AppViews.__ensureindexes__ = {"viewOptions":{refreshDataOnLoad:true, "ui":"form", "id":"__ensureindexes__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, "label":"Ensure Indexes", "fields":[
        {"field":"db", "label":"DB", type:"string", "ui":"autocomplete", "width":"200px", visibility:true, collection:"pl.dbs", displayField:"db", events:[
            {
                function:"Porting.getDbs",
                event:"onQuery",
                post:true
            }
        ]},
        {"label":"Collection", "field":"collection", "visibility":true, "ui":"autocomplete", type:"string", "width":"200px", collection:"pl.collections", displayField:"collection"}
    ]
    }};

    AppViews.__usersetting__ = {"viewOptions":{data:"data", refreshDataOnLoad:true, "ui":"form", "id":"__usersetting__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, "label":"Setting", "fields":[
        {"label":"Full Name", "field":"fullname", visibility:true, "ui":"text", "width":"200px", type:"string", group:"Default"} ,
        {"label":"User Name", "field":"username", visibility:true, "ui":"text", "width":"200px", type:"string", group:"Default", editableWhen:"false"} ,
        {"label":"Emailid", "field":"emailid", visibility:true, "ui":"text", "width":"200px", type:"string", group:"Default", editableWhen:"false"},
        {"label":"Page size", "field":"no_of_records", visibility:true, "ui":"number", "width":"200px", type:"number", group:"Default"},
        {"label":"Calender Enabled", "field":"calenderenabled", visibility:true, "ui":"checkbox", "width":"200px", type:"boolean", group:"Default"},
        {"label":"Mail Track Enabled", "field":"mailtrackenabled", visibility:true, "ui":"checkbox", "width":"200px", type:"boolean", group:"Default"},
        {"label":"Image", "field":"image", visibility:true, "ui":"image", "width":"200px", type:"file", group:"Default"}
    ], groups:[
        {title:"Default", label:"Default", separator:false, showTitle:false, showLabel:true}
    ],
        "collection":"pl.users",
        queryGrid:{$collection:"pl.users", $filter:{_id:{"$function":{"Functions.CurrentUser":{"_id":1}}}}, $fields:{username:1, emailid:1, no_of_records:1, "mailtrackenabled":1, calenderenabled:1, image:1, fullname:1}},
        queryForm:{$collection:"pl.users", $filter:{_id:{"$function":{"Functions.CurrentUser":{"_id":1}}}}, $fields:{username:1, emailid:1, no_of_records:1, "mailtrackenabled":1, calenderenabled:1, image:1, fullname:1}}
    }, data:[
        {}
    ]};

    AppViews.__addtemplates__ = {"viewOptions":{"ui":"form", "id":"__addtemplates__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, viewControl:false, "label":"Add Templates", "fields":[
        {"label":"Template", "field":"template", visibility:true, "ui":"textarea", "width":"200px", type:"string"} ,
        {"label":"Template Type", "field":"templateType", "visibility":true, "ui":"autocomplete", type:"string", "width":"200px", "options":["ejs", "xslt"]},
        {"label":"Type", "field":"type", visibility:true, "ui":"autocomplete", type:"string", "width":"200px", options:["print", "sendMail"], group:"Default"},
        {"label":"Function", "field":"function", visibility:true, "ui":"text", "width":"200px", type:"string"} ,
        {"label":"Query", "field":"query", visibility:true, "ui":"text", "width":"200px", type:"string"} ,
        {"label":"Id", "field":"id", visibility:true, "ui":"text", "width":"200px", type:"string"} ,
        {"label":"Collection", "field":"collectionid", visibility:false, "ui":"autocomplete", "width":"200px", collection:"pl.collections", displayField:"collection", type:"fk", group:"Default"},
        {"label":"To", "field":"to", visibility:true, "ui":"text", "width":"200px", type:"string", when:"this.type=='sendMail'"}  ,
        {"label":"Subject", "field":"subject", visibility:true, "ui":"text", "width":"200px", type:"string", when:"this.type=='sendMail'"} ,
        {"label":"From", "field":"from", visibility:true, "ui":"text", "width":"200px", type:"string", when:"this.type=='sendMail'"},
        {"label":"Attachments", "field":"attachments", visibility:true, "ui":"text", "width":"200px", type:"string", when:"this.type=='sendMail'"}
    ], "collection":"pl.templates",
        queryGrid:{$collection:"pl.templates", $filter:{"collectionid":"$collection_id"}, $fields:{template:1, templateType:1, type:1, function:1, query:1, id:1, to:1, subject:1, from:1, attachments:1}, $sort:{_id:-1}},
        queryForm:{$collection:"pl.templates", $filter:{"collectionid":"$collection_id"}, $fields:{template:1, templateType:1, type:1, function:1, query:1, id:1, to:1, subject:1, from:1, attachments:1}, $sort:{_id:-1}}
    }};

    AppViews.__edittemplates__ = {
        "viewOptions":{
            refreshDataOnLoad:true, "ui":"grid", "id":"__edittemplates__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, navigation:false, viewControl:false, "label":"Templates", "fields":AppViews.__addtemplates__.viewOptions.fields,
            "collection":"pl.templates",
            queryGrid:AppViews.__addtemplates__.viewOptions.queryGrid, queryForm:AppViews.__addtemplates__.viewOptions.queryForm
        }};

    AppViews.__otherFunctions__ = {"viewOptions":{refreshDataOnLoad:true, "ui":"form", "id":"__otherFunctions__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, "label":"Other Functions", "fields":[
        {field:"functionName", label:"Function Name", type:"string", ui:"autocomplete", visibility:true, "width":"200px", options:["Clear Cache", "Clear View State", "Get User Role Previleges", "Set Field", "Ensure Indexes", "Remove Collection"]},
        {"label":"DB", "field":"db", "ui":"autocomplete", "width":"200px", visibility:true, type:"string", collection:"pl.dbs", displayField:"db", events:[
            {
                function:"Porting.getDbs",
                event:"onQuery",
                post:true
            }
        ]},
        {field:"username", label:"User Name", type:"string", ui:"autocomplete", visibility:true, "width":"200px", collection:"pl.users", displayField:"username", parameters:{"db":"$db"}, "when":"this.functionName == 'Clear Cache' || this.functionName =='Clear View State' || this.functionName =='Get User Role Previleges'", events:[
            {
                function:"Porting.getUser",
                event:"onQuery",
                post:true
            }
        ]},
        {field:"all", label:"Clear Complete Cache", type:"boolean", ui:"checkbox", visibility:false, "width":"200px", "when":"this.functionName == 'Clear Cache'"},
        {field:"view_id", label:"View Id", type:"string", ui:"text", visibility:true, "width":"200px", "when":"this.functionName == 'Clear View State'"},
        {field:"viewstate", label:"View State", type:"boolean", ui:"checkbox", visibility:true, "width":"200px", "when":"this.functionName == 'Clear View State'"},
        {field:"state", label:"State", type:"boolean", ui:"checkbox", visibility:true, "width":"200px", "when":"this.functionName == 'Clear View State'"},
        {field:"collection", label:"Collection", type:"string", ui:"autocomplete", visibility:true, "width":"200px", collection:"pl.collections", displayField:"collection", "when":"this.functionName == 'Get User Role Previleges' || this.functionName == 'Set Field'  || (this.type=='Collection' && this.functionName =='Ensure Indexes' ) || this.functionName =='Remove Collection' "},
        {field:"field", label:"Field", type:"string", ui:"text", visibility:true, "when":"this.functionName == 'Set Field' "},
        {field:"filter", label:"Filter", type:"string", ui:"text", visibility:true, "when":"this.functionName == 'Set Field' "},
        {field:"cursor", label:"Cursor", type:"number", ui:"number", visibility:true, "when":"this.functionName == 'Set Field' "},
        {field:"limit", label:"Limit", type:"number", ui:"number", visibility:true, "when":"this.functionName == 'Set Field' "} ,
        {field:"all", label:"All", type:"boolean", ui:"checkbox", visibility:false, "width":"200px", "when":"this.functionName == 'Get User Role Previleges'"}
    ]
    }};

    AppViews.__addmslowqueries__ = {"viewOptions":{navigation:true, "ui":"form", "id":"__addmslowqueries__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, viewControl:false, "label":"Add Slow query logs", "fields":[
        {"label":"namespace", "field":"namespace", visibility:true, "ui":"text", "width":"200px", type:"string", filterable:true} ,
        {"label":"operation", "field":"operation", visibility:true, "ui":"autocomplete", type:"string", "width":"50px", options:["query", "update", "command", "insert", "remove"], filterable:true },
        {"label":"duration", "field":"duration", visibility:true, "ui":"number", "width":"50px", type:"string", sortable:true} ,
        {"label":"numYields", "field":"numYields", visibility:true, "ui":"text", "width":"50px", type:"string"} ,
        {"label":"datetime", "field":"datetime", visibility:true, "ui":"date", time:true, "width":"100px", type:"date", filterable:true} ,
        {"label":"nreturned", "field":"nreturned", visibility:false, "ui":"text", "width":"50px"},
        {"label":"ntoreturn", "field":"ntoreturn", visibility:true, "ui":"text", "width":"50px", type:"string"}  ,
        {"label":"nscanned", "field":"nscanned", visibility:true, "ui":"text", "width":"50px", type:"string", sortable:true} ,
        {"label":"r", "field":"r", visibility:true, "ui":"text", "width":"50px", type:"string"},
        {"label":"line_str", "field":"line_str", visibility:true, "ui":"text", type:"string", width:"2000px"},
        {"label":"Token", "field":"split_tokens", visibility:true, "ui":"JSON", type:"string", width:"500px"}
    ], "collection":"pl.mslowqueries",
        queryGrid:{$collection:"pl.mslowqueries", $filter:{operation:"query"}, $sort:{duration:-1}, $limit:100}

    }};

    AppViews.__mslowqueries__ = {
        "viewOptions":{
            saveUserState:false, navigation:true, refreshDataOnLoad:true, "ui":"grid", "id":"__mslowqueries__", width:AppViews.POPUP_WIDTH, height:AppViews.POPUP_HEIGHT, resize:false, close:true, showLabel:true, refresh:false, viewControl:false, "label":"Slow queries", "fields":AppViews.__addmslowqueries__.viewOptions.fields,
            "collection":AppViews.__addmslowqueries__.viewOptions.collection,
            queryGrid:AppViews.__addmslowqueries__.viewOptions.queryGrid, queryForm:AppViews.__addmslowqueries__.viewOptions.queryForm
        }};

    AppViews.__appstudio__ = {label:"AppStudio", _id:"__appstudio__", menus:[
        {_id:"__editapplication__", __system__:true, label:"Applications", application:{_id:"__appstudio__"}, collection:"pl.applications", qviews:[
            {id:"__editapplication__", closeViewIndex:0}
        ]},
        {_id:"__managetrigger__", __system__:true, label:"Collection", application:{_id:"__appstudio__"}, collection:"pl.collections", qviews:[
            {id:"__managetrigger__", closeViewIndex:0}
        ]},
        {_id:"__editrole__", __system__:true, label:"Roles", application:{_id:"__appstudio__"}, collection:"pl.roles", qviews:[
            {id:"__editrole__", closeViewIndex:0}
        ]},
        {_id:"__editfunction__", __system__:true, label:"Functions", application:{_id:"__appstudio__"}, collection:"pl.functions", qviews:[
            {id:"__editfunction__", closeViewIndex:0}
        ]},
        {_id:"__editquickview__", __system__:true, label:"QViews", application:{_id:"__appstudio__"}, collection:"pl.qviews", qviews:[
            {id:"__editquickview__", closeViewIndex:0}
        ]},
        {_id:"__emailtracker__", __system__:true, label:"Email Tracker", application:{_id:"__appstudio__"}, collection:"pl.emailtrackers", qviews:[
            {id:"__emailtracker__", closeViewIndex:0}
        ]}
    ]};


})();
