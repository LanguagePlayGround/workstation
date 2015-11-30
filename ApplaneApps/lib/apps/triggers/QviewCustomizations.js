var Constants = require("ApplaneDB/lib/Constants.js");
var ViewConstants = require("ApplaneDB/lib/ViewConstants.js");
var Utility = require("./Utility.js");
var CacheService = require("ApplaneDB/lib/CacheService.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");
var fieldProperties = ViewConstants.FieldProperties;
var actionProperties = ViewConstants.ActionProperties;

var nonOverridableQviewProperties = ["id", "collection", "mainCollection"];
var nonOverridableQviewFieldsProperties = ["field", "type", "json", "toLowerCase", "useLowerCase", "collection", "parentfieldid", "set", "transient", "upsert", "upsertFields", "cascade", "mandatory", "collectionid"];

// to apply validations
exports.onPreSave = function (document, db, options) {
    var updatedFields = document.getUpdatedFields();
    if (updatedFields && updatedFields.length > 0) {
        for (var i = 0; i < nonOverridableQviewProperties.length; i++) {
            var property = nonOverridableQviewProperties[i];
            if (updatedFields.indexOf(property) !== -1) {
                throw new Error("Cannot Override property[" + property + "] at customization level");
            }

        }
        if (updatedFields.indexOf("qFields") !== -1) {
            var qFieldsDocs = document.getDocuments("qFields");
            for (var i = 0; i < qFieldsDocs.length; i++) {
                var qFieldDoc = qFieldsDocs[i];
                var innerUpdatedFields = qFieldDoc.getUpdatedFields();
                if (innerUpdatedFields && innerUpdatedFields.length > 0) {
                    for (var j = 0; j < nonOverridableQviewFieldsProperties.length; j++) {
                        var property = nonOverridableQviewFieldsProperties[j];
                        if (innerUpdatedFields.indexOf(property) !== -1) {
                            throw new Error("Cannot Override property[" + property + "] at customization level");
                        }

                    }
                }
            }
        }
    }
}


// to show  the quick view customization
exports.onResult = function (query, result, db) {
    var parameters = query.$parameters || {};
    var sourceid = parameters.sourceid;
    var viewid = parameters.viewid;
    return db.query({$collection: Constants.Admin.QVIEWS, $filter: {id: viewid}}).then(
        function (qviewData) {
            if (qviewData && qviewData.result && qviewData.result.length > 0) {
                if (result && result.result && result.result.length == 0) {
                    result.result.push({_id: Utils.getObjectId(sourceid)});
                }
                return mergeQviewData(result.result[0], qviewData.result[0]);
            }
        });
}

function mergeQviewData(result, qviewData) {
    var qViewProperties = ViewConstants.QViewProperties;
    for (var i = 0; i < qViewProperties.length; i++) {
        var property = qViewProperties[i];
        if (result[property] === undefined) {
            result[property] = qviewData[property];
        }
    }
    if (result["filter"] === undefined) {
        result["filter"] = qviewData["filter"];
    }
}

// to populate the customization fields and qview fields or customization actions or qview actions  when the view is opened
exports.mergeFieldsOnResult = function (query, result, db) {
    var parameters = query.$parameters || {};
    var filter = query.$filter;
    if (parameters.customizationFields) {
        return getCustomizationFields(filter, parameters, db).then(function (customizationFields) {
            customizationFields = customizationFields || [];
            result.result = customizationFields;
        });
    } else if (parameters.qviewFields) {
        return getQviewFields(filter, parameters, db).then(function (qviewFields) {
            qviewFields = qviewFields || [];
            result.result = qviewFields;
        });
    } else if (parameters.customizationActions) {
        return getCustomizationActions(parameters, db).then(function (customizationActions) {
            customizationActions = customizationActions || [];
            result.result = customizationActions;
        });
    } else if (parameters.qviewActions) {
        return getQviewActions(parameters, db).then(function (qviewActions) {
            qviewActions = qviewActions || [];
            result.result = qviewActions;
        });
    }


}


function getCustomizationActions(parameters, db) {
    var sourceid = parameters.sourceid;
    var viewid = parameters.viewid;
    var customizationActions = undefined;
    var collectionid = parameters.collection_id;
    return db.query({$collection: "pl.qviewcustomizations", "$filter": {"_id": sourceid}, "$fields": {"qActions": 1}}).then(
        function (customizationData) {
            if (customizationData && customizationData.result && customizationData.result.length > 0) {
                if (customizationData.result[0].qActions) {
                    customizationActions = customizationData.result[0].qActions;
                    return db.query({$collection: "pl.qviews", $filter: {"id": viewid}, $fields: {qActions: 1}});
                }
            }
        }).then(
        function (qviewData) {
            if (qviewData && qviewData.result && qviewData.result.length > 0) {
                var qviewActions = qviewData.result[0].qFields;
                if (qviewActions && qviewActions.length > 0) {
                    mergePropertiesWithQviews(customizationActions, qviewActions, "qaction", actionProperties);
                }
            }
            if (customizationActions) {
                return db.query({$collection: "pl.actions", $filter: {collectionid: collectionid}});
            }
        }).then(
        function (collectionActions) {
            if (collectionActions && collectionActions.result && collectionActions.result.length > 0) {
                collectionActions = collectionActions.result;
                mergeProperties(customizationActions, collectionActions, "qaction", actionProperties);
            }
        }).then(function () {
            if (customizationActions) {
                customizationActions = [
                    {_id: Utils.getObjectId(sourceid), qActions: customizationActions}
                ];
            }
            return customizationActions;
        })
}

function getCustomizationFields(filter, parameters, db) {
    var sourceid = parameters.sourceid;
    var viewid = parameters.viewid;
    var customizationFields = undefined;
    var collectionid = parameters.collection_id;
    return db.query({$collection: "pl.qviewcustomizations", "$filter": {"_id": sourceid}, "$fields": {"qFields": 1}}).then(
        function (customizationData) {
            if (customizationData && customizationData.result && customizationData.result.length > 0) {
                if (customizationData.result[0].qFields) {
                    customizationFields = customizationData.result[0].qFields;
                    return db.query({$collection: "pl.qviews", $filter: {"id": viewid}, $fields: {qFields: 1}});
                }
            }
        }).then(
        function (qviewData) {
            if (qviewData && qviewData.result && qviewData.result.length > 0) {
                var qviewFields = qviewData.result[0].qFields;
                if (qviewFields && qviewFields.length > 0) {
                    mergePropertiesWithQviews(customizationFields, qviewFields, "qfield", fieldProperties); //check for qview level override properties
                }
            }
            if (customizationFields) {
                return db.query({$collection: "pl.fields", $filter: {collectionid: collectionid}});
            }
        }).then(
        function (collectionFields) {
            if (collectionFields && collectionFields.result && collectionFields.result.length > 0) {
                collectionFields = collectionFields.result;
                mergeProperties(customizationFields, collectionFields, "qfield", fieldProperties);//check for filed level override properties
            }
        }).then(function () {
            if (customizationFields) {
                var newCustomizationFields = evaluateFilter(filter, customizationFields);
                customizationFields = [
                    {_id: Utils.getObjectId(sourceid), qFields: newCustomizationFields}
                ];
            }
            return customizationFields;
        })
}

function getQviewFields(filter, parameters, db) {
    var viewid = parameters.viewid;
    var qviewFields = undefined;
    var qView_id = undefined;
    var collectionid = parameters.collection_id;
    return db.query({$collection: "pl.qviews", $filter: {"id": viewid}, $fields: {qFields: 1}}).then(
        function (qviewData) {
            if (qviewData && qviewData.result && qviewData.result.length > 0) {
                if (qviewData.result[0].qFields && qviewData.result[0].qFields.length > 0) {
                    qView_id = qviewData.result[0]._id;
                    qviewFields = qviewData.result[0].qFields;
                    return db.query({$collection: "pl.fields", $filter: {collectionid: collectionid}});
                }
            }
        }).then(
        function (collectionFields) {
            if (collectionFields && collectionFields.result && collectionFields.result.length > 0) {
                collectionFields = collectionFields.result;
                mergeProperties(qviewFields, collectionFields, "qfield", fieldProperties);
            }
        }).then(function () {
            if (qviewFields) {
                var newQviewFields = evaluateFilter(filter, qviewFields);
                qviewFields = [
                    {_id: qView_id, qFields: newQviewFields}
                ];
            }
            return qviewFields;
        });
}

function evaluateFilter(filter, data) {
    if (filter && Object.keys(filter).length > 0) {
        if (filter.parentfieldid) {
            filter["parentfieldid._id"] = filter.parentfieldid;
            delete filter.parentfieldid;
            Utils.convert_IdToObjectIdInFilter(filter);
        }
        var newData = [];
        for (var i = 0; i < data.length; i++) {
            if (Utils.evaluateFilter(filter, data[i])) {
                newData.push(data[i]);
            }
        }
        return newData;
    } else {
        return data;
    }
}

function getQviewActions(parameters, db) {
    var viewid = parameters.viewid;
    var qviewActions = undefined;
    var qView_id = undefined;
    var collectionid = parameters.collection_id;
    return db.query({$collection: "pl.qviews", $filter: {"id": viewid}, $fields: {qActions: 1}}).then(
        function (qviewData) {
            if (qviewData && qviewData.result && qviewData.result.length > 0) {
                if (qviewData.result[0].qActions && qviewData.result[0].qActions.length > 0) {
                    qView_id = qviewData.result[0]._id;
                    qviewActions = qviewData.result[0].qActions;
                    return db.query({$collection: "pl.actions", $filter: {collectionid: collectionid}});
                }
            }
        }).then(
        function (collectionActions) {
            if (collectionActions && collectionActions.result && collectionActions.result.length > 0) {
                collectionActions = collectionActions.result;
                mergeProperties(qviewActions, collectionActions, "qaction", actionProperties);
            }
        }).then(function () {
            if (qviewActions) {
                qviewActions = [
                    {_id: qView_id, qActions: qviewActions}
                ];
            }
            return qviewActions;
        });
}

function mergePropertiesWithQviews(customizationFields, qviewFields, exp, properties) {  // merge ie. corrospond to id get the data from qview fileds
    for (var i = 0; i < customizationFields.length; i++) {
        var customizationField = customizationFields[i];
        for (var j = 0; j < qviewFields.length; j++) {
            var qviewField = qviewFields[j];
            if (Utils.deepEqual(customizationField[exp]._id, qviewField[exp]._id)) {
                overrideProperties(customizationField, qviewField, properties);
            }
        }
    }
}

function mergeProperties(mergeTos, mergeFroms, exp, properties) {
    for (var i = 0; i < mergeTos.length; i++) {
        var mergeTo = mergeTos[i];
        var index = Utils.isExists(mergeFroms, mergeTo[exp], "_id");
        if (index !== undefined) {
            var mergeFrom = mergeFroms[index];
            overrideProperties(mergeTo, mergeFrom, properties);
        }

    }
}

function overrideProperties(mergeToField, mergeFromField, properties) {  //evoerride mean if in qview user defined new label then it will be changed in qview field then show
    for (var i = 0; i < properties.length; i++) {
        var property = properties[i];
        if (mergeToField[property] === undefined) {
            mergeToField[property] = mergeFromField[property];
        }
    }
}


