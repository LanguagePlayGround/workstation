(function (definition) {

    // Turn off strict mode for this function so we can assign to global.Q
    /* jshint strict: false */
    // Sachin
    // This file will function properly as a <script> tag, or a module
    // using CommonJS and NodeJS or RequireJS module formats.  In
    // Common/Node/RequireJS, the module exports the Q API and when
    // executed as a simple <script>, it creates a Q global instead.

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

        // CommonJS
    } else if (typeof exports === "object") {
        module.exports = definition();

        // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

        // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

        // <script>
    } else {
        EventManager = definition();
    }

})(function () {
    "use strict";


// end of shims
// beginning of real work

    /**
     * Constructs a promise for an immediate reference, passes promises through, or
     * coerces promises from different systems.
     * @param value immediate reference or promise
     */
    var Q = require("q");
    var Utils = require("ApplaneCore/apputil/util.js");
    var ModuleManager = require("../../lib/ModuleManager.js");
    var TotalCount = 0;

    function EventManager(value) {

    }

    EventManager.triggerEvents = function (event, document, events, collection, db, options) {
//        console.log("----------------Start triggerEvent called...." + event);
//        console.log("----------------document called...." + JSON.stringify(document));
//        console.log("----------------options called...." + JSON.stringify(options));
        var d = Q.defer();
        options = options || {};
        options = Utils.deepClone(options);
        if (options.level >= 50) {
            throw new Error("More than 50 retries, Recursion level >>>>>options>>>" + JSON.stringify(options) + ">>>>>document>>>" + JSON.stringify(document))
        }
        var mergedDocument = undefined;
        if (event == "onInsert") {
            mergedDocument = {};
        } else if (event == "onValue") {
            mergedDocument = document.convertToJSON();
            options.fields = options.fields || document.getRevisedUpdatedFields();
        } else if (event == "onSave") {
            mergedDocument = document.convertToJSON();
            if (!options.pre && !options.post) {
                d.reject(new Error("No pre/post found in onSave"));
                return d.promise;
            }
        }
        Utils.iterateArrayWithPromise(options.fields,
            function (index, updatedField) {
                var d1 = Q.defer();
                var updatedFieldDoc = document.getDocuments(updatedField, ["insert", "update", "delete"]);
                if (!updatedFieldDoc) {
                    d1.resolve();
                    return d1.promise;
                }
                if (!Array.isArray(updatedFieldDoc)) {
                    updatedFieldDoc = [updatedFieldDoc];
                }
//                console.log(">>NestedupdatedField >>>>>>>>>>>>>>>>>" + JSON.stringify(updatedField));
                Utils.iterateArrayWithPromise(updatedFieldDoc,
                    function (docIndex, nestedDoc) {
//                        console.log("nested doc>>>" + JSON.stringify(nestedDoc));
                        var nestedOptions = Utils.deepClone(options);
                        nestedOptions.parentFields = nestedOptions.parentFields || [];
                        nestedOptions.parentFields.push(updatedField);
                        var nestedEvent = undefined;
                        if (nestedDoc.type == "insert") {
                            delete nestedOptions.fields;
                            nestedEvent = "onInsert";
                        } else if (nestedDoc.type == "update") {
                            nestedOptions.fields = nestedDoc.getRevisedUpdatedFields();
                            nestedEvent = "onValue";
                        } else if (nestedDoc.type == "delete") {
                            nestedEvent = "onValue";
//                            nestedOptions.fields = nestedDoc.getRevisedUpdatedFields();
                        }
                        if (nestedDoc.type == "delete") {
                            return handleNestedDelete(nestedEvent, nestedDoc, collection, db, nestedOptions)
                        } else if (nestedEvent) {
                            return ModuleManager.triggerModules(nestedEvent, nestedDoc, collection, db, nestedOptions);
                        }
                    }).then(
                    function () {
                        //nested doc has done its all work, now it should
                        var documentJSON = document.convertToJSON();
                        mergedDocument[updatedField] = documentJSON[updatedField];
                        d1.resolve();
                    }).fail(function (err) {
                        d1.reject(err);
                    });


                return d1.promise;
            }).then(
            function () {
                //client side value should not be processed again
                if (!options.$onValueProcessed) {
                    return invokeTriggers(event, document, events, db, options);
                }
            }).then(
            function () {
                if (!options.post) {

                    document.oldRecord = mergedDocument;
                    var revisedUpdatedFields = document.getRevisedUpdatedFields();
//                    console.log(">>>>revisedUpdatedFields >>>>>>>>>>>>>>>>>>" + JSON.stringify(revisedUpdatedFields));
//                    console.log("$$$$$$$document is now" + JSON.stringify(document));
//                    console.log("options>>>>" + JSON.stringify(options));


                    if (revisedUpdatedFields && revisedUpdatedFields.length > 0) {
                        options.level = options.level || 0;
                        options.level = options.level + 1;
                        options.fields = revisedUpdatedFields;
                        delete options.pre;
                        delete options.post;
                        return ModuleManager.triggerModules("onValue", document, collection, db, options);
                    }
                }
            }).then(
            function () {
                d.resolve();
            }).fail(function (err) {
                d.reject(err);
            })
        return d.promise;
    }

    function handleNestedDelete(nestedEvent, document, collection, db, nestedOptions) {
        var nestedDocUpdates = document.updates;
        var nestedDocUpdateOldRecord = Utils.deepClone(document.oldRecord);
        var updatedFields = Object.keys(document.oldRecord);
        var nestedOptions = Utils.deepClone(nestedOptions);

        document.updates = Utils.deepClone(document.oldRecord);
        document.type = "delete";
        nestedOptions.fields = updatedFields;

        return Utils.iterateArrayWithPromise(updatedFields,
            function (index, updatedField) {
                var innerNestedOptions = Utils.deepClone(nestedOptions);
                innerNestedOptions.parentFields = innerNestedOptions.parentFields || [];
                innerNestedOptions.parentFields.push(updatedField)
                var nestedDocs = document.getDocuments(updatedField);
                if (nestedDocs) {
                    if (!Array.isArray(nestedDocs)) {
//                        nestedDocs = [nestedDocs];
                        return;
                    }
                    return Utils.iterateArrayWithPromise(nestedDocs, function (nestedDocIndex, nestedDoc) {
                        return handleNestedDelete(nestedEvent, nestedDoc, collection, db, innerNestedOptions).then(function () {
                            document.oldRecord[updatedField] = null;
                        });
                    })
                } else {
                    return;
                }
            }).then(
            function () {
                for (var k in document.updates) {
                    if (k !== "_id") {
                        document.updates[k] = null;
                    }
                }
                return ModuleManager.triggerModules(nestedEvent, document, collection, db, nestedOptions);
            }).then(function () {
                document.updates = nestedDocUpdates;
                document.oldRecord = nestedDocUpdateOldRecord;
            })


    }

    function invokeTriggers(event, document, events, db, options) {
//        console.log("invoking triggers for event>>>" + event + ">>>options>>>>" + JSON.stringify(options));
        var d = Q.defer();
        getTriggers(event, events, options).then(
            function (triggers) {
//                console.log("triggers>>>>>>>>>>>>>>>>" + JSON.stringify(triggers));
                return executeTriggers(document, triggers, db, options);
            }).then(
            function () {
                d.resolve();
            }).fail(function (err) {
                d.reject(err);
            })
        return d.promise;
    }

    function executeTriggers(document, triggers, db, options) {
        var d = Q.defer();
        Utils.iterateArrayWithPromise(triggers,
            function (index, trigger) {
                var triggerOptions = trigger.options;
                if (triggerOptions) {
                    triggerOptions = JSON.parse(triggerOptions);
                }
                if (options) {
                    triggerOptions = triggerOptions || {};
                    for (var k in options) {
                        if (triggerOptions[k] === undefined) {
                            triggerOptions[k] = options[k];
                        }
                    }
                }
                return db.invokeFunction(trigger.function, [document], triggerOptions);
            }).then(
            function () {
                d.resolve();
            }).fail(function (err) {
                d.reject(err);
            })
        return d.promise;
    }

    function getTriggers(event, events, options) {
//        console.log("......getTriggers" + JSON.stringify(options) + ">>event>>>" + event)
        var d = Q.defer();
        var eventsToTrigger = [];
        if (options && options.$events !== undefined) {
            events = options.$events;
        }
        if (events) {
            for (var i = 0; i < events.length; i++) {
                var e = events[i];
                if (e.eventName == event) {
                    options = options || {};
                    if (e.client && !options.client) {
                        continue;
                    }
                    var needToAdd = false;
                    if (event == "onInsert") {
//                        console.log("options >>>>>>>>>>>>>>>" + JSON.stringify(options));
                        if (!options.parentFields && !e.fields) {
                            needToAdd = true;
                        } else if (options.parentFields && e.fields) {
                            if (needToAddEventFields(e.fields, options.fields, options.parentFields)) {
                                needToAdd = true;
                            }
                        } else {
                            //do not add
                        }
                    } else if (options.fields && e.fields) {
                        if (needToAddEventFields(e.fields, options.fields, options.parentFields)) {
                            needToAdd = true;
                        }
                    } else if ((options.pre && e.pre == options.pre)) {
                        needToAdd = true;
                    } else if (options.post && e.post == options.post) {
                        needToAdd = true;
                    }

                    if (needToAdd) {
//                        console.log(">>>>>>adding triger>>>>>>>>>>" + JSON.stringify(e));
                        var trigerAlreadyAdded = false;
                        for (var j = 0; j < eventsToTrigger.length; j++) {
                            var evetntToTrigger = eventsToTrigger[j];
                            if (Utils.deepEqual(evetntToTrigger.function, e.function) && (!e.options || Utils.deepEqual(evetntToTrigger.options, e.options) )) {
                                trigerAlreadyAdded = true;
                                break;

                            }

                        }
                        if (!trigerAlreadyAdded) {
                            eventsToTrigger.push(e);
                        }
                    }
                }
            }
        }
//    console.log(">>>eventsToTrigger>>>>" + JSON.stringify(eventsToTrigger))
        d.resolve(eventsToTrigger);
        return d.promise;
    }

    function needToAddEventFields(eventFields, fields, parentFields) {
//    console.log("eventFields>>>>" + JSON.stringify(eventFields))
//    console.log("fields>>>>" + JSON.stringify(fields))
//    console.log("parentFields>>>>" + JSON.stringify(parentFields))
        if ((!fields || fields.length == 0) && (!eventFields || eventFields.length == 0) && (!parentFields || parentFields.length == 0)) {
            //it will return onInsert/onSave
            return true;
        }
        if (eventFields) {
            for (var i = 0; i < eventFields.length; i++) {
                var eventField = eventFields[i];
                if (Utils.isJSONObject(eventField) && parentFields && parentFields.length > 0 && eventField[parentFields[0]]) {
                    var newParentFields = [];
                    for (var j = 1; j < parentFields.length; j++) {
                        newParentFields.push(parentFields[j]);
                    }
                    return needToAddEventFields(eventField[parentFields[0]], fields, newParentFields);
                } else if (typeof eventField == "string" && (!parentFields || parentFields.length == 0)) {
                    // check for  onValue
                    if (fields) {
                        for (var j = 0; j < fields.length; j++) {
                            var field = fields[j];
                            if (Utils.isExists(eventFields, field) !== undefined) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }

    return EventManager;

});




