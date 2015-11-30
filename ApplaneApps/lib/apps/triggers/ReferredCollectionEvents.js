/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 25/12/14
 * Time: 12:54 PM
 * To change this template use File | Settings | File Templates.
 */

var Utility = require("./Utility.js");
var CacheService = require("ApplaneDB/lib/CacheService.js");
var Utils = require("ApplaneCore/apputil/util.js");
var BusinessLogicError = require("ApplaneError/lib/BusinessLogicError.js");

exports.onQuery = function (query) {
    Utility.checkFilterInQuery(query, "collectionid");
}

exports.onResult = function (query, result, db, options) {
    var filter = query.$filter;
    var collectionName = query.$collection;
    if (Utils.isJSONObject(collectionName)) {
        collectionName = collectionName.collection;
    }
    var localQuery = Utility.getlocalQuery(filter, collectionName, "pl.collections", "collectionid");
    return Utility.populateResult(localQuery, result, db, options);
}

exports.onPreSave = function (document, db, options) {
    if (db.isGlobalDB()) {
        return;
    }
    var collectionName = document.collection;
    var collection = getCollection(document);
    if (!collection) {
        throw new BusinessLogicError("collectionid is mandatory in collection [" + collectionName + "] with type [" + document.type + "]having updates[" + JSON.stringify(document.updates) + "]");
    }
    validateEvents(document, collectionName);
    return Utility.updateLocalData(collection._id, collection.collection, db, "pl.collections", options).then(function () {
        if (collectionName === "pl.actions" && document.get("type") == "view") {
            return require("./Menus.js").updateQviewFromMenu(document, db);
        }
    })
}

exports.onPostSave = function (document, db, options) {
    var collection = getCollection(document);
    return CacheService.clearCache(collection._id, db, true).then(
        function () {
            if (document.collection === "pl.indexes") {
                return db.invokeFunction("Porting.ensureIndexes", [
                    {db:db.db.databaseName, collection:[collection.collection]}
                ]);
            }
        }).then(function () {
            return Utility.updateAppLock(collection.collection, "pl.collections", db, options);
        })
}

function getCollection(document) {
    return document.type === "delete" ? document.getOld("collectionid") : document.get("collectionid");
}

function validateEvents(document, collection) {
    if (collection === "pl.events" && document.type !== "delete") {
        var eventDef = document.get("event");
        var indexOf = eventDef.indexOf(":");
        if (indexOf > 0) {
            var firstPart = eventDef.substring(0, indexOf)
            var eventFields = eventDef.substring(indexOf + 1);
            if (!eventFields || (firstPart !== "onInsert" && firstPart !== "onValue" && firstPart !== "onSave" && firstPart !== "onQuery" && firstPart !== "onAggregate")) {
                throw new BusinessLogicError("Event defined [" + JSON.stringify(eventDef) + "] is not valid");
            }
            try {
                eventFields = JSON.parse(eventFields);
            } catch (e) {
                throw new BusinessLogicError("Event [" + JSON.stringify(eventDef) + "] is not parsable");
            }
        } else {
            if (eventDef !== "onInsert" && eventDef !== "onSave" && eventDef !== "onQuery" && eventDef !== "onAggregate") {
                throw new BusinessLogicError("Event defined [" + JSON.stringify(eventDef) + "] is not valid");
            }
        }
    }
}

