var Q = require("q");
var Utility = require("ApplaneCore/apputil/util.js")
var Constants = require("./Constants.js");
var SELF = require("./ModuleManager.js");
var QueryUtility = require("./QueryUtility.js");

var modulesCache = {};
//TODO Pending Tasks
//Event manager revised updated field on basis if new property fire/not


/**
 *  Module Sequence is required for Child Module.
 *  We need to run module in different sequences in case of update and query.
 *
 */



var modules = [
    {index:1, name:"DataTypeModule", path:"./modules/DataTypeModule.js", require:{query:["TriggerModule"], update:["Schedule"]}, events:[
        {event:"onValue", type:"number", function:"onValue"} ,
        {event:"onValue", type:"integer", function:"onValue"},
        {event:"onValue", type:"decimal", function:"onValue"},
        {event:"onValue", type:"string", function:"onValue"},
        {event:"onValue", type:"date", function:"onValue"},
        {event:"onValue", type:"boolean", function:"onValue"},
        {event:"onValue", type:"json", function:"onValue"},
        {event:"onValue", type:"duration", function:"onValue"},
        {event:"onValue", type:"objectid", function:"onValue"},
        {event:"onValue", type:"emailid", function:"onValue"},
        {event:"onValue", type:"phonenumber", function:"onValue"}
    ]},
    {index:1, name:"UserSorting", path:"./modules/UserSorting.js", require:{update:["SequenceModule"] }, events:[
        {event:"onSave", pre:true, function:"onPreSave"}
    ]},
    {index:1, name:"Recursion", path:"./modules/Recursion.js", require:{query:["DBRef"], update:false}},
    {index:1, name:"DBRef", path:"./modules/DBRef.js", require:{query:["SubQuery"], update:false}},
    {index:1, name:"UDTModule", path:"./modules/UDTModule.js", require:{query:["UEModule"], update:false}},
    {index:1, name:"UEModule", path:"./modules/UEModule.js", require:{ query:["Child"], update:false}},
    {index:1, name:"ValidationModule", path:"./modules/ValidationModule.js", require:{ query:false, update:["SelfRecursiveModule"]}, events:[
        {event:"onSave", pre:true, function:"onPreSave"}
    ]},
    {index:1, name:"SelfRecursiveModule", path:"./modules/SelfRecursiveModule.js", require:{query:false, update:["Child"]}, events:[
        {event:"onSave", pre:true, function:"onPreSave"}
    ]},
    {index:1, name:"Schedule", path:"./modules/Schedule.js", require:{query:false, update:["Cascade"]}, events:[
        {event:"onValue", type:"schedule", function:"onValue"}
    ]},
    {index:1, name:"SubQuery", path:"./modules/SubQuery.js", require:{ query:["Group"], update:false}},
    {index:1, name:"Group", path:"./modules/Group.js", require:{query:["Function"], update:false}},
    {index:1, name:"GroupRecursion", path:"./modules/GroupRecursion.js", require:{query:["UDTModule"], update:false}},
    {index:1, name:"SequenceModule", path:"./modules/SequenceModule.js", require:{update:["LowerCaseModule"], query:false}, events:[
        {event:"onSave", pre:true, function:"onPreSave"}
    ]},
    {index:1, name:"LowerCaseModule", path:"./modules/LowerCaseModule.js", require:{update:["ValidationModule"], query:false}, events:[
        {event:"onSave", pre:true, function:"onPreSave"}
    ]},
    {index:1, name:"Function", path:"./modules/Function.js", require:{query:["DataTypeModule"], update:false}},
    {index:1, name:"Child", path:"./modules/Child.js", require:{query:["Recursion"], update:["HistoryLogs"]}, events:[
        {event:"onSave", pre:true, function:"onPreSave"},
        {event:"onSave", post:true, function:"onPostSave"}
    ]},
    {index:1, name:"Replicate", path:"./modules/Replicate.js", require:{query:false}, events:[
        {event:"onSave", post:true, function:"onPostSave"}
    ]},
    {index:1, name:"Cascade", path:"./modules/Cascade.js", require:{query:false, update:["TriggerRequiredFields"]}, events:[
        {event:"onSave", pre:true, function:"onPreSave"}
    ]},
    {index:1, name:"MergeLocalAdminDB", path:"./modules/MergeLocalAdminDB.js", require:{query:false, update:["Transaction"]}, events:[
        {event:"onSave", pre:true, function:"onPreSave"}
    ]},
    {index:1, name:"TriggerRequiredFields", path:"./modules/TriggerRequiredFields.js", require:{query:false, update:["TriggerModule"]}, events:[
        {event:"onSave", pre:true, function:"onPreSave"}
    ]},
    {index:1, name:"TriggerModule", path:"./modules/TriggerModule.js", events:[
        {event:"onInsert", function:"onInsert"},
        {event:"onValue", function:"onValue"},
        {event:"onSave", pre:true, function:"onPreSave"},
        {event:"onSave", post:true, function:"onPostSave"}
    ], require:{query:["HistoryLogs"], update:["UserSorting"]}},
    {index:1, name:"Role", path:"./modules/Role.js", require:{query:["GroupRecursion"], update:["DataTypeModule"]}, events:[
        {event:"onSave", pre:true, function:"onPreSave"}
    ]},
    {index:1, name:"HistoryLogs", path:"./modules/HistoryLogs.js", require:{query:["CollectionHierarchy"], update:["CollectionHierarchy"]}, events:[
        {event:"onSave", pre:true, function:"onPreSave"}
    ]},
    {index:1, name:"CollectionHierarchy", path:"./modules/CollectionHierarchy.js", require:{update:["TransactionModule"]}, events:[
        {event:"onSave", pre:true, function:"onPreSave"}
    ]},
    {index:1, name:"TransactionModule", path:"./modules/TransactionModule.js", require:{query:false}, events:[
        {event:"onSave", pre:true, function:"onPreSave"},
        {event:"onCommit", pre:true, function:"onCommit"},
        {event:"onRollback", pre:true, function:"onRollback"}
    ]}

];


var queryModules = [];
var updateModules = [];


exports.getSequence = function (sequenceType) {
    if (sequenceType === "query") {
        return queryModules;
    } else {
        return updateModules;
    }
}

exports.registerModule = function (module) {
    modules.push(module);
    populateModuleSequence("query", true);
    populateModuleSequence("update", true);
}

exports.unRegisterModule = function (name) {
    if (!name) {
        return;
    }
    for (var i = 0; i < modules.length; i++) {
        if (modules[i].name === name) {
            modules.splice(i, 1);
        }
    }
    populateModuleSequence("query", true);
    populateModuleSequence("update", true);
}

function isModuleUsedInEvents(events) {
    if (!events || events.length == 0) {
        return false;
    }
    for (var i = 0; i < events.length; i++) {
        if (events[i].require) {
            return true;
        }
    }
}

exports.doAggregate = function (query, events, pipelines, options, db) {
    if (query[Constants.Query.MODULES] === false || query[Constants.Query.EVENTS] === false || !events || events.length === 0) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    return Utility.iterateArrayWithPromise(events,
        function (index, event) {
            if (event.event === "onAggregate" && event.pre) {
                return db.invokeFunction(event.function, [query, pipelines], options);
            }
        })
}

exports.doQuery = function (query, events, collection, options, db) {
    var p = executeDoQueryInModules(query, events, collection, options, db);
    if (Q.isPromise(p)) {
        return p.then(function () {
            return executeEvents(events, "pre", undefined, [query], db, options);
        })
    } else {
        return executeEvents(events, "pre", undefined, [query], db, options);
    }
}

function executeDoQueryInModules(query, events, collection, options, db) {
    var modules = query[Constants.Query.MODULES];
    if (modules === false) {
        return;
    }
    populateModuleSequence("query");
    validateModules(query[Constants.Query.MODULES]);
    var isModuleUsed = isModuleUsedInEvents(events);
    return Utility.iterateArrayWithoutPromise(queryModules,
        function (index, module) {
            var p = undefined;
            if (isModuleUsed) {
                p = executeEvents(events, "pre", module.name, [query], db, options);
            }
            if (p) {
                return p.then(function () {
                    return execPreModule(module, query, collection, db, options);
                })
            } else {
                return execPreModule(module, query, collection, db, options);
            }

        })
}


function execPreModule(module, query, collection, db, options) {
    var moduleRequired = SELF.isModuleRequired(query[Constants.Query.MODULES], module);
    if (moduleRequired) {
        var resource = getResource(module.path);
        var method = module.doQuery || "doQuery";
        if (resource && resource[method]) {
            return resource[method](query, collection, db, options);
        }
    }
}

exports.doResult = function (query, result, events, collection, options, db) {
    var p = executeDoResultModules(query, result, events, collection, options, db);
    if (Q.isPromise(p)) {
        return p.then(function () {
            return executeEvents(events, "post", undefined, [query, result], db, options);
        })
    } else {
        return executeEvents(events, "post", undefined, [query, result], db, options);
    }
}

function execPostModule(module, query, result, collection, db, options) {
    var moduleRequired = SELF.isModuleRequired(query[Constants.Query.MODULES], module);
    if (moduleRequired) {
        var resource = getResource(module.path);
        var method = module.doResult || "doResult";
        if (resource && resource[method]) {
            return resource[method](query, result, collection, db, options);
        }
    }
}

function executeDoResultModules(query, result, events, collection, options, db) {
    var modules = query[Constants.Query.MODULES];
    if (modules === false) {
        return;
    }
    populateModuleSequence("query");
    var isModuleUsed = isModuleUsedInEvents(events);
    return Utility.iterateArrayWithoutPromise(queryModules,
        function (index, module) {
            var p = undefined;
            if (isModuleUsed) {
                p = executeEvents(events, "post", module.name, [query, result], db, options);
            }
            if (p) {
                return p.then(function () {
                    return execPostModule(module, query, result, collection, db, options);
                })
            } else {
                return execPostModule(module, query, result, collection, db, options);
            }
        }, true)
}

function executeEvents(events, type, moduleName, parameters, db, options) {
    return Utility.iterateArrayWithoutPromise(events,
        function (index, event) {
            if (event[type] && event.event === "onQuery" && event.processed !== true && (!moduleName || (event.require && event.require === moduleName))) {
                return db.invokeFunction(event.function, parameters, options).then(function () {
                    event.processed = true;
                });
            }
        })
}

exports.doBatchQuery = function (queries, options, db) {
    populateModuleSequence("query");
    return Utility.iterateArrayWithPromise(queryModules,
        function (index, module) {
            var resource = getResource(module.path);
            var method = module.doBatchQuery || "doBatchQuery";
            if (resource && resource[method]) {
                return resource[method](queries, db, options);
            }
        }
    )
}


exports.doBatchResult = function (queries, result, options, db) {
    populateModuleSequence("query");
    return Utility.reverseIterator(queryModules,
        function (index, module) {
            var resource = getResource(module.path);
            var method = module.doBatchResult || "doBatchResult";
            if (resource && resource[method]) {
                return resource[method](queries, result, db, options);
            }
        }
    )
}


function populateModuleSequence(sequenceType, repopulate) {
    if (!repopulate && ((sequenceType === "query" && queryModules.length > 0 ) || (sequenceType === "update" && updateModules.length > 0))) {
        return;
    }
    var moduleClone = Utility.deepClone(modules);
    populateRequired(moduleClone, sequenceType);
    for (var i = 0; i < moduleClone.length; i++) {
        var module = moduleClone[i];
        var requiredModule = module.require && module.require[sequenceType] ? module.require[sequenceType] : null;
        if (Array.isArray(requiredModule)) {
            for (var j = 0; j < requiredModule.length; j++) {
                var reqModule = requiredModule[j];
                for (var k = 0; k < moduleClone.length; k++) {
                    if (reqModule === moduleClone[k].name) {
                        moduleClone[k].index = moduleClone[k].index + 1;
                    }
                }
            }
        }
    }
    sortModules(moduleClone);
    if (sequenceType === "query") {
        queryModules = [];
        for (var i = 0; i < moduleClone.length; i++) {
            if (moduleClone[i].require) {
                if (moduleClone[i].require.query !== false) {
                    queryModules.push(moduleClone[i]);
                }
            } else {
                queryModules.push(moduleClone[i]);
            }
        }
    } else {
        updateModules = [];
        for (var i = 0; i < modules.length; i++) {
            if (moduleClone[i].require) {
                if (moduleClone[i].require.update !== false) {
                    updateModules.push(moduleClone[i]);
                }
            } else {
                updateModules.push(moduleClone[i]);
            }
        }
    }
}

function populateRequired(modules, sequenceType) {
    var noOfModules = modules.length;
    for (var i = 0; i < noOfModules; i++) {
        var module = modules[i];
        var requiredModules = modules[i].require && modules[i].require[sequenceType] ? modules[i].require[sequenceType] : null;
        if (Array.isArray(requiredModules)) {
            for (var j = 0; j < noOfModules; j++) {
                var innerRequiredModules = modules[j].require && modules[j].require[sequenceType] ? modules[j].require[sequenceType] : null;
                if (Array.isArray(innerRequiredModules)) {
                    var noOfInnerRequiredModules = innerRequiredModules.length;
                    for (var k = 0; k < noOfInnerRequiredModules; k++) {
                        if (innerRequiredModules[k] === module.name) {
                            for (var l = 0; l < requiredModules.length; l++) {
                                if (modules[j].name === requiredModules[l]) {
                                    throw new Error("Recursion cannot require [" + modules[j].name + "] in [" + requiredModules[l] + "]");
                                }
                                if (innerRequiredModules.indexOf(requiredModules[l]) === -1) {
                                    innerRequiredModules.push(requiredModules[l]);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

exports.isModuleRequired = function (modulesInfo, module) {
    if (modulesInfo === false) {
        return false;
    }
    var moduleNames = modulesInfo ? Object.keys(modulesInfo) : undefined;
    if (!moduleNames || moduleNames.length == 0) {
        return true;
    }
    var moduleValue = modulesInfo[moduleNames[0]];
    return (moduleValue === 1 && modulesInfo[module.name] ) || (moduleValue === 0 && modulesInfo[module.name] === undefined) ? true : false;
}

function validateModules(modulesInfo) {
    var moduleNames = modulesInfo ? Object.keys(modulesInfo) : undefined;
    if (!moduleNames || moduleNames.length == 0) {
        return true;
    }
    var moduleValue = modulesInfo[moduleNames[0]];
    for (var i = 1; i < moduleNames.length; i++) {
        if (modulesInfo[moduleNames[i]] !== moduleValue) {
            throw new Error("Can not Mix modules of inclusion and exclusion");
        }
    }
    if (modulesInfo["TriggerModule"] === 0) {
        throw new Error("TriggerModule cannot be excluded.Exclude Modules found [" + JSON.stringify(modulesInfo) + "]");
    }
}

function sortModules(moduleClone) {
    for (var i = 0; i < moduleClone.length - 1; i++) {
        for (var j = i + 1; j < moduleClone.length; j++) {
            if (moduleClone[i].index > moduleClone[j].index) {
                var temp = moduleClone[i];
                moduleClone[i] = moduleClone[j];
                moduleClone[j] = temp;
            }
        }
    }
}

exports.triggerModules = function (event, doc, collection, db, options) {
    options = options || {};
    populateModuleSequence("update");
    validateModules(options[Constants.Query.MODULES]);
    var oldRecord = doc && doc.oldRecord ? doc.oldRecord : null;
    var fields = collection ? collection.getValue("fields") : undefined;
    if (event === "onSave" && options.post === true) {
        return Utility.reverseIterator(updateModules,
            function (index, module) {
                return executeModule(event, doc, fields, module, oldRecord, collection, db, options);
            })
    } else {
        return Utility.iterateArrayWithPromise(updateModules,
            function (index, module) {
                return executeModule(event, doc, fields, module, oldRecord, collection, db, options);
            })
    }
}

function executeModule(event, doc, fields, module, oldRecord, collection, db, options) {
    var moduleRequired = SELF.isModuleRequired(options[Constants.Query.MODULES], module);
    if (moduleRequired) {
        var updatedFields = options.fields;
        if (event == "onSave") {
            //in on save we will provide original oldValue to each module, required for transaction module
            //also onSave event will not be defined on fields, so we have done updatedFields=undefined here to stop iteration on fields
            doc.oldRecord = oldRecord;
            updatedFields = undefined;
        }
        var p = Utility.iterateArrayWithoutPromise(updatedFields,
            function (updatedFieldIndex, updatedField) {
                //this will run only for type base module like number module
                return fireEvent(event, doc, fields, updatedField, collection, module, db, options);
            })
        //this will run for non field type based module like trigger module, onSave Event, onInsert Event
        if (Q.isPromise(p)) {
            return p.then(function () {
                return fireEvent(event, doc, fields, undefined, collection, module, db, options);
            })
        } else {
            return fireEvent(event, doc, fields, undefined, collection, module, db, options);
        }
    }
}

function getResource(path) {
    if (modulesCache[path]) {
        return modulesCache[path];
    } else {
        var resource = require(path);
        modulesCache[path] = resource;
        return resource;
    }
}

function fireEvent(event, doc, fields, updatedField, collection, module, db, options) {
    var fieldInfo = getFieldDef(updatedField, fields, options ? options.parentFields : undefined);
    var e = getEvent(event, module, updatedField, fieldInfo, options);
    if (!e) {
        return;
    }
    var requiredModule = getResource(module.path);
    options = QueryUtility.getReference(options);
    options.updatedFieldInfo = fieldInfo;
    return requiredModule[e.function](event, doc, collection, db, options);
}

function getEvent(event, module, field, fieldInfo, options) {
    var events = module.events;
    if (!events || events.length == 0) {
        return;
    }
    for (var i = 0; i < events.length; i++) {
        var e = events[i];
        if (e.event == event) {
            var type = e.type;
            if (!type && !field) {
                if (options && options.pre && options.pre == e.pre) {
                    return  e;
                } else if (options && options.post && options.post == e.post) {
                    return  e;
                } else if (!options || (!options.pre && !options.post)) {
                    return e;
                }

            } else if (type && field) {
                if (fieldInfo && fieldInfo.type == type) {
                    return e;
                }
            }

        }

    }
}

function getFieldDef(field, fields, parentFields) {
    if (!field || !fields || fields.length == 0) {
        return undefined;
    }
    var parentField = undefined;
    if (parentFields && parentFields.length > 0) {
        parentField = parentFields[0];
        var newParentFields = [];
        for (var i = 1; i < parentFields.length; i++) {
            newParentFields.push(parentFields[i]);
        }
        parentFields = newParentFields;
    }

    for (var i = 0; i < fields.length; i++) {
        var f = fields[i];
        if (parentField) {
            if (f.field && f.field == parentField) {
                return getFieldDef(field, f.fields, parentFields);
            }
        } else if (f.field && f.field == field) {
            return f;
        }


    }
}

exports.triggerWorkflowEvents = function (operation, data, collection, db, options) {
    if (options && (options.$events === false || options.$workflowevents === false)) {
        return;
    }
    var collectionName = collection.getValue(Constants.Admin.Collections.COLLECTION);
    var workflowevents = collection.getValue(Constants.Admin.Collections.WORK_FLOW_EVENTS);
    return Utility.iterateArrayWithPromise(workflowevents, function (index, workflowevent) {
        var triggerEvents = workflowevent[Constants.Admin.WorkFlowEvents.TRIGGER_EVENT];
        if (triggerEvents && typeof triggerEvents == "string") {
            triggerEvents = JSON.parse(triggerEvents);
        }
        if (triggerEvents && triggerEvents.indexOf(operation) !== -1) {
            if (operation === "onUpdate") {
                return db.update({$collection:Constants.WorkFlow.WORKFLOW, $delete:{$query:{"fk._id":data._id}}, $events:false}).then(
                    function () {
                        return db.update({$collection:collectionName, $update:{_id:data._id, $unset:{__events:"1"}}, $events:false});
                    }).then(function () {
                        return db.fireWorkflowEvent(workflowevent, data, collectionName, db, options);
                    });
            } else {
                return db.fireWorkflowEvent(workflowevent, data, collectionName, db, options);
            }
        }
    })
}

