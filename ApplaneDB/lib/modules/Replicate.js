var Constants = require("../Constants.js");
/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 21/4/14
 * Time: 12:33 PM
 * To change this template use File | Settings | File Templates.
 */

var Utils = require("ApplaneCore/apputil/util.js");

exports.onPostSave = function (event, document, collection, db, options) {
    if (document.type === "update") {
        var updatedId = document.get("_id");
        var updatedFields = document.getUpdatedFields();
        if (!updatedFields || updatedFields.length === 0) {
            return;
        }
        var updatedFieldValues = getUpdatedFieldValues(document, updatedFields);
        if (Object.keys(updatedFieldValues).length === 0) {
            return;
        }
        return collection.get(Constants.Admin.Collections.REFERRED_FKS).then(
            function (referredFks) {
                return Utils.iterateArrayWithoutPromise(referredFks,
                    function (index, referredFk) {
                        var referredFkSet = referredFk[Constants.Admin.ReferredFks.SET];
                        if (!referredFkSet || referredFkSet.length === 0) {
                            return;
                        }
                        var referredField = referredFk[Constants.Admin.ReferredFks.FIELD];
                        var valueToSet = undefined;
                        var valueToUnset = undefined;
                        for (var i = 0; i < referredFkSet.length; i++) {
                            if (updatedFields.indexOf(referredFkSet[i]) != -1) {
                                var resolvedValues = Utils.resolveValue(updatedFieldValues, referredFkSet[i]);
                                if (resolvedValues === null) {
                                    valueToUnset = valueToUnset || {};
                                    valueToUnset[referredField + "." + referredFkSet[i]] = "";
                                } else {
                                    valueToSet = valueToSet || {};
                                    valueToSet[referredField + "." + referredFkSet[i]] = resolvedValues;
                                }
                            }
                        }
                        if (!valueToSet && !valueToUnset) {
                            return;
                        }

                        var query = {};
                        query[referredField.replace(/\.\$/g, "") + "._id"] = updatedId;
                        var update = {};
                        update[Constants.Update.Update.QUERY] = query;
                        update[Constants.Update.Update.SET] = valueToSet;
                        update[Constants.Update.Update.UNSET] = valueToUnset;
                        var updateQuery = {};
                        updateQuery[Constants.Query.COLLECTION] = referredFk[Constants.Admin.ReferredFks.COLLECTION_ID][Constants.Admin.Collections.COLLECTION];
                        updateQuery[Constants.Update.UPDATE] = [update];
                        return db.addToQueue({queueName:"replicate", mongoUpdates:updateQuery, options:{w:1, multi:true}});
                    })
            })
    }
}

function getUpdatedFieldValues(document, updatedFields) {
    var updatedFieldValues = {};
    if (updatedFields && updatedFields.length > 0) {
        for (var i = 0; i < updatedFields.length; i++) {
            var updatedField = updatedFields[i];
            var newValue = document.get(updatedField);
            var oldValue = document.getOld(updatedField);
            if (updatedField === "__history" || updatedField === "__txs__" || Utils.deepEqual(newValue, oldValue)) {
                updatedFields.splice(i, 1);
                i = i - 1;
            } else {
                updatedFieldValues[updatedField] = Utils.resolveValue(document.convertToJSON(), updatedField);
            }
        }
    }
    return updatedFieldValues;
}