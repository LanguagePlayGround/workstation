/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 16/6/14
 * Time: 11:04 AM
 * To change this template use File | Settings | File Templates.
 */

var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");
var BusinessLogicError = require("ApplaneError/lib/BusinessLogicError");
var Q = require("q");

exports.onPreSave = function (event, document, collection, db, options) {
    if (document.type === "delete") {
        var collectionName = collection.getValue(Constants.Admin.Collections.COLLECTION);
        var sTime = new Date();
        return db.query({$collection:"pl.referredfks", $filter:{"referredcollectionid.collection":collectionName, replicate:{$in:[null, false]}}, $fields:{collectionid:1, field:1, cascade:1}}).then(
            function (fieldsResult) {
                db.logMongoTime("CascadeQueryCount", (new Date() - sTime), true);
                fieldsResult = fieldsResult.result;
                if (fieldsResult.length === 0) {
                    return;
                }
                return Utils.iterateArrayWithPromise(fieldsResult,
                    function (index, fieldResult) {
                        var field = fieldResult.field;
                        field = field.replace(/\.\$/g, "");
                        var countQuery = {};
                        countQuery[field + "._id"] = document.getOld("_id");
                        var updateCollectionName = fieldResult.collectionid.collection;
                        return db.collection({collection:updateCollectionName}).then(
                            function (referredCollection) {
                                return referredCollection.count(countQuery);
                            }).then(function (count) {
                                if (count > 0) {
                                    if (fieldResult.cascade) {
                                        return db.update({$collection:updateCollectionName, $delete:[
                                            {$query:countQuery}
                                        ], $modules:options.$modules, $events:options.$events});
                                    } else {
                                        throw new BusinessLogicError("Record cannot be deleted as it is referred in collection [" + fieldResult.collectionid.collection + "] having record [" + JSON.stringify(document) + "]>>>>>>Query>>>" + JSON.stringify(countQuery));
                                    }
                                }
                            })
                    })
            })
    }
}

