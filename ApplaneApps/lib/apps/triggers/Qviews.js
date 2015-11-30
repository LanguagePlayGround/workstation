/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 1/7/14
 * Time: 8:24 PM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("ApplaneDB/lib/Constants.js");
var Utility = require("./Utility.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");

exports.onResult = function (query, result, db, options) {
    return Utility.onMergeResult(query, result, options, db);
}

exports.onPreSave = function (document, db, options) {
    var collectionName = document.collection;
    var collection = document.type === "delete" ? document.getOld(Constants.Admin.Qviews.COLLECTION) : document.get(Constants.Admin.Qviews.COLLECTION);
    if (document.type === "delete") {
        if (document.getOld(Constants.Admin.Qviews.ID) === collection.collection) {
            throw new Error("Default Qview [" + document.getOld(Constants.Admin.Qviews.ID) + "] cannot de deleted.");
        }
    }
    if (document.type === "update" && (!document.get(Constants.Admin.Qviews.COLLECTION) || document.getOld(Constants.Admin.Qviews.COLLECTION).collection !== document.get(Constants.Admin.Qviews.COLLECTION).collection)) {
        throw new Error("Collection can not be updated in Qviews having document [" + JSON.stringify(document) + "]");
    }
    var mainCollection = document.type === "delete" ? document.getOld(Constants.Admin.Qviews.MAIN_COLLECTION) : document.get(Constants.Admin.Qviews.MAIN_COLLECTION);
    if (mainCollection && !collection) {
        document.set("collection", mainCollection);
        collection = mainCollection;
    }
    validateViews(document);
    var fieldName = Utility.getField(collectionName);
    return Utility.validateData(document, collectionName, fieldName, db).then(function () {
        return validateQviewsEvents(document, db);
    }).then(function () {
        Utility.insertDefaultData(document, db);
        if (document.type === "update") {
            return Utility.updateLocalData(document.get("_id"), document.getOld(fieldName), db, collectionName, options);
        }
    })
}

exports.onPostSave = function (document, db, options) {
    var collectionName = document.collection;
    var fieldName = Utility.getField(collectionName);
    if (document.type === "update" || document.type === "delete") {
        return Utility.updateAppLock(document.getOld(fieldName), collectionName, db, options);
    }
}

function validateViews(document) {
    var cellids = {};
    var updatedFields = document.getUpdatedFields();
    for (var i = 0; i < updatedFields.length; i++) {
        var field = updatedFields[i];
        if (field === "views") {
            var viewDocs = document.getDocuments(field);
            if (viewDocs) {
                var parentExps = [];
                for (var j = 0; j < viewDocs.length; j++) {
                    var viewDoc = viewDocs[j];
                    var parent = viewDoc.get("parent");
                    if (parent) {
                        if (parentExps.indexOf(parent) === -1) {
                            parentExps.push(parent);
                        }
                    }
                    var alias = viewDoc.get("alias");
                    if (cellids[alias]) {
                        throw new Error("Two Views Cannot have same alias");
                    } else {
                        cellids[alias] = 1;
                    }
                }
                if (parentExps.length > 1) {
                    throw new Error("Cannot have two different parent expression " + JSON.stringify(parentExps));
                }
            }
        } else if (field === "recursionEnabled") {  //this work is done for applying recursion on recursion image clicked and then apply button clicked when recursionEnabled is true in qview--Ritesh
            var recursionEnabledValue = document.get("recursionEnabled");
            if (recursionEnabledValue) {
                var recursion = document.get("recursion");
                if (!recursion) {
                    throw new Error("Recursion is mandatory when Recursion Enabled is set as true.")
                }
                if (typeof recursion === "string") {
                    recursion = JSON.parse(recursion);
                }
                if (recursion.$primaryColumn === undefined) {
                    throw new Error("$primaryColumn is mandatory in Recursion when Recursion Enabled is set as true.")
                }
            }
        }
    }
}

//ensuring function is existing and loading
function validateQviewsEvents(document, db) {
    if (document.type === "insert" || document.type === "update") {
        var queryEvent = document.get(Constants.Admin.Qviews.QUERY_EVENT);
        if (queryEvent) {
            if (typeof queryEvent === "string") {
                queryEvent = JSON.parse(queryEvent);
            }
            if (Utils.isJSONObject(queryEvent)) {
                queryEvent = [queryEvent];
            }
            return Utils.iterateArrayWithPromise(queryEvent, function (index, qevent) {
                var functionName = qevent && qevent.function ? qevent.function : undefined;
                if (functionName) {
                    var functionDef = db.loadFunction(functionName);
                    if (Q.isPromise(functionDef)) {
                        return functionDef.then(function () {
                            //do not return anything
                        })
                    } else {
                        //do not return anything
                    }
                }
            })
        }
    }
}