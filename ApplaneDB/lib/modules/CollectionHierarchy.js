/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 16/2/15
 * Time: 2:01 AM
 * To change this template use File | Settings | File Templates.
 */

var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");

exports.doQuery = function (query, collection, db) {
    var childCollections = collection.getValue("__childCollections");
    if (childCollections && childCollections.length > 0) {
        query.$filter = query.$filter || {};
        query.$filter.__collection = {$in:childCollections};
    }
}

exports.onPreSave = function (event, document, collection, db, options) {
    if (document.type === "insert") {
        var rootCollection = collection.getValue("__rootCollection");
        if (rootCollection) {
            var collectionName = collection.getValue(Constants.Admin.Collections.COLLECTION);
            document.set("__collection", collectionName);
        }
    }
}
