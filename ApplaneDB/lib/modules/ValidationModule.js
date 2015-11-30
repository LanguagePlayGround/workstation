/**
 * Created by Manjeet on 7/10/14.
 */var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");
var BusinessLogicError = require("ApplaneError/lib/BusinessLogicError");

exports.onPreSave = function (event, document, collection, db, option) {
    var fields = collection.getValue(Constants.Admin.Collections.FIELDS);
    if (document.type !== "delete") {
        validate(fields, document.collection, document);
    }
}

function validate(fields, collection, document, parentField) {
    fields = fields || [];
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field[Constants.Admin.Fields.TYPE] === Constants.Admin.Fields.Type.OBJECT && field[Constants.Admin.Fields.MULTIPLE]) {
            handleArray(field, collection, document, field.fields, parentField);
        } else if (field.fields) {
            handleObject(field, collection, document, field.fields, parentField);
        } else {
            if (field[Constants.Admin.Fields.MANDATORY] && field[Constants.Admin.Fields.TYPE] !== Constants.Admin.Fields.Type.BOOLEAN) {
                if (document !== undefined && document !== null) {
                    var value = document.get(field.field);
                    if (value === undefined || value === null || value.toString().trim().length === 0) {
                        var pField = parentField !== undefined ? parentField + "." + (field.label ? field.label : field.field) : (field.label ? field.label : field.field);
                        throw new BusinessLogicError(Constants.ErrorCode.MANDATORY_FIELDS.MESSAGE + " [" + pField + "] in collection [" + collection + "]", Constants.ErrorCode.MANDATORY_FIELDS.CODE, JSON.stringify(document));
                    }
                }
            }
        }
    }
}

function handleArray(field, collection, document, fields, parentField) {
    var pField = parentField !== undefined ? parentField + "." + (field.label ? field.label : field.field) : (field.label ? field.label : field.field);
    if (field[Constants.Admin.Fields.MANDATORY]) {
        var documents = document.getDocuments(field[Constants.Admin.Fields.FIELD], ["insert", "update", "nochange"]);
        if (documents == undefined || documents.length === 0) {
            throw new BusinessLogicError(Constants.ErrorCode.MANDATORY_FIELDS.MESSAGE + " [" + pField + "] in collection [" + collection + "]", Constants.ErrorCode.MANDATORY_FIELDS.CODE, JSON.stringify(document));
        }
    }
    var documents = document.getDocuments(field.field, ["insert", "update"]) || [];
    for (var i = 0; i < documents.length; i++) {
        validate(fields, collection, documents[i], pField);
    }
}


function handleObject(field, collection, document, fields, parentField) {
    var pField = parentField !== undefined ? parentField + "." + (field.label ? field.label : field.field) : (field.label ? field.label : field.field);
    var documents = document ? document.getDocuments(field[Constants.Admin.Fields.FIELD]) : undefined;
    if (documents && Array.isArray(documents)) {
        for (var i = 0; i < documents.length; i++) {
            var innerDoc = documents[i];
            if (field[Constants.Admin.Fields.MANDATORY]) {
                if ((innerDoc === undefined) || (innerDoc && innerDoc.updates === null)) {
                    throw new BusinessLogicError(Constants.ErrorCode.MANDATORY_FIELDS.MESSAGE + " [" + pField + "] in collection [" + collection + "]", Constants.ErrorCode.MANDATORY_FIELDS.CODE, JSON.stringify(document));
                }
            }
            if (innerDoc && innerDoc.updates !== null) {
                validate(fields, collection, innerDoc, pField);
            }
        }
    } else {
        if (field[Constants.Admin.Fields.MANDATORY]) {
            if ((documents === undefined) || (documents && documents.updates === null)) {
                throw new BusinessLogicError(Constants.ErrorCode.MANDATORY_FIELDS.MESSAGE + " [" + pField + "] in collection [" + collection + "]", Constants.ErrorCode.MANDATORY_FIELDS.CODE, JSON.stringify(document));
            }
        }
        if (documents && documents.updates !== null) {
            validate(fields, collection, documents, pField);
        }
    }
}
