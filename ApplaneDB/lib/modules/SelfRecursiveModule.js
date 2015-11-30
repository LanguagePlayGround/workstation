/**
 * Created by Sachin.
 */
var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var BusinessLogicError = require("ApplaneError/lib/BusinessLogicError.js");

exports.onPreSave = function (event, document, collection, db, option) {
    if (document.type === "update") {
        var documentId = document.get("_id");
        var collectionName = collection.getValue(Constants.Admin.Collections.COLLECTION);
        var fields = collection.getValue(Constants.Admin.Collections.FIELDS);
        return Utils.iterateArrayWithoutPromise(fields, function (index, field) {
            if (field[Constants.Admin.Fields.TYPE] === Constants.Admin.Fields.Type.FK && field[Constants.Admin.Fields.COLLECTION] === collectionName) {
                // case :: in sixcontinents friends case , sachin is friend of manjeet and manjeet is friend of sachin.// manjeet (15-apr-2015)
                if (field[Constants.Admin.Fields.SELFRECURSIVE] == Constants.Admin.Fields.SelfRecursive.OFF) {
                    return;
                }
                var selfRecursiveDocuments = document.getDocuments(field[Constants.Admin.Fields.FIELD], ["insert", "update"]);
                if (!selfRecursiveDocuments) {
                    return;
                }
                if (!Array.isArray(selfRecursiveDocuments)) {
                    selfRecursiveDocuments = [selfRecursiveDocuments];
                }
                return Utils.iterateArrayWithoutPromise(selfRecursiveDocuments, function (index, selfRecursiveDocument) {
                    var selfDocumentId = selfRecursiveDocument.get("_id");
                    if (!selfDocumentId) {
                        return;
                    }
                    if (Utils.deepEqual(documentId, selfDocumentId)) {
                        throw new BusinessLogicError("Self reference can not be defined in field [" + field.field + "]");
                    }
                    var query = {$collection: field[Constants.Admin.Fields.COLLECTION], $filter: {_id: selfDocumentId}, $fields: {_id: 1}, $recursion: {_id: field.field + "._id"}, $modules: {Role: 0}};
                    return db.query(query).then(function (result) {
                        validateSelfRecursiveData(documentId, field.field, result.result);
                    })
                })
            }
        })
    }
}

function validateSelfRecursiveData(updateId, field, recursiveResult) {
    for (var i = 0; i < recursiveResult.length; i++) {
        var row = recursiveResult[i];
        if (Utils.deepEqual(updateId, row._id)) {
            throw new Error("Recursion found in saving data for field [" + field + "]");
        }
        if (row.children) {
            validateSelfRecursiveData(updateId, field, row.children);
        }
    }
}