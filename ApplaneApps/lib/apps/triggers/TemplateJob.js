/**
 * Created with IntelliJ IDEA.
 * User: Rajit
 * Date: 30/7/14
 * Time: 10:32 AM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("ApplaneDB/lib/Constants.js");
var Utility = require("./Utility.js");
var CacheService = require("ApplaneDB/lib/CacheService.js");

exports.onQuery = function (query) {
    Utility.checkFilterInQuery(query, "collectionid");
}

exports.onResult = function (query, result, db, options) {
    var localQuery = Utility.getlocalQuery(query.$filter, "pl.templates", "pl.collections", "collectionid");
    return Utility.populateResult(localQuery, result, db, options);
}

exports.onPreSave = function (document, db, options) {
    var template = document.get(Constants.Admin.Templates.TEMPLATE);
    var subject = document.get(Constants.Admin.Templates.SUBJECT);
    validateTemplate(template);
    validateTemplate(subject);
    var collection = document.type === "delete" ? document.getOld("collectionid") : document.get("collectionid");
    return Utility.updateLocalData(collection._id, collection.collection, db, "pl.collections", options);
}

exports.onPostSave = function (document, db, options) {
    var collection = document.type === "delete" ? document.getOld("collectionid") : document.get("collectionid");
    return CacheService.clearCache(collection._id, db, true).then(function () {
        return Utility.updateAppLock(collection.collection, "pl.collections", db, options);
    })
}

function validateTemplate(template) {
    if (template) {
        var startCount = getCount(template, "<%");
        var endCount = getCount(template, "%>");
        if (startCount != endCount) {
            throw new Error("[ StartCount = " + startCount + "---- EndCount = " + endCount + ">>>>> Template is = " + template + "]");
        }
    }
}

function getCount(template, toCheck) {
    if (!template || !toCheck) {
        return 0;
    }
    var count = 0;
    var startIndex = template.indexOf(toCheck);
    while (startIndex >= 0) {
        count = count + 1;
        startIndex = template.indexOf(toCheck, startIndex + 1);
    }
    return count;
}