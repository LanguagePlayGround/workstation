/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 4/28/14
 * Time: 10:57 AM
 * To change this template use File | Settings | File Templates.
 */
var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");

exports.onPreSave = function (event, document, collection, db, options) {
    return loadDocument(document, collection, db, options);
}

function loadDocument(document, collection, db, options) {
    var triggers = collection.getValue("events") || [];
    var values = getRequiredFields(triggers);
    var requiredFields = Object.keys(values.fields).length > 0 ? values.fields : undefined;
    if (requiredFields) {
        var query = {};
        query[Constants.Query.COLLECTION] = collection.options && collection.options[Constants.Admin.Collections.COLLECTION] ? collection.options : collection.mongoCollection.collectionName;
        query[Constants.Query.FIELDS] = requiredFields;
        var convertedJSON = document.convertToJSON();
        query[Constants.Query.DATA] = [convertedJSON];
        if (options[Constants.Query.EVENTS] === false) {
            query[Constants.Query.EVENTS] = false;
        }
        /*var requiredModules = values.modules;
        if (requiredModules !== undefined) {
            query[Constants.Query.MODULES] = JSON.parse(requiredModules);
        } else if (options[Constants.Query.MODULES] !== undefined) {
            query[Constants.Query.MODULES] = options[Constants.Query.MODULES];
        }*/
        query[Constants.Query.MODULES] = {"Role":0};
        return db.query(query).then(
            function (data) {
                if (data) {
                    document.setRequiredFieldsValues(data.result[0]);
                }
            })
    }
}

function getRequiredFields(triggers) {
    var finalFields = {};
    var modules = undefined;
    for (var i = 0; i < triggers.length; i++) {
        var trigger = triggers[i];
        var requiredFields = trigger[Constants.Trigger.Triggers.REQUIREDFIELDS];
        var requiredModules = trigger[Constants.Trigger.Triggers.REQUIREDMODULES];
        if (modules === undefined && requiredModules !== undefined) {
            modules = requiredModules;
        }
        requiredFields = requiredFields && !Utils.isJSONObject(requiredFields) ? JSON.parse(requiredFields) : requiredFields;
        if (requiredFields) {
            for (var key in requiredFields) {
                finalFields[key] = requiredFields[key];
            }
        }
    }
    return {fields:finalFields, modules:modules};
}