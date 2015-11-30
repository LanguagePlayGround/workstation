var Utils = require("ApplaneCore/apputil/util.js");
var Q = require('q');
var Constants = require("ApplaneDB/lib/Constants.js");
var Utility = require("./Utility.js");
var CacheService = require("ApplaneDB/lib/CacheService.js");

// to populate the indicators to show that these actions are included in customization of qviews.
exports.populateCustomizationIndicators = function (query, result, db, options) {
    var parameters = query.$parameters || {};
    var sourceid = parameters.sourceid;
    var viewid = parameters.viewid;
    return db.query({$collection:"pl.qviewcustomizations", "$filter":{_id:sourceid}, $fields:{"qActions":1}}).then(
        function (customizationData) {
            if (customizationData && customizationData.result && customizationData.result.length > 0) {
                var qActions = customizationData.result[0].qActions;
                if (qActions && qActions.length > 0) {
                    populateIndicator(qActions, result.result, "customizationEnabled");
                }
            }
            return db.query({"$collection":"pl.qviews", "$filter":{id:viewid}});
        }).then(function (qviewData) {
            if (qviewData && qviewData.result && qviewData.result.length > 0) {
                var qActions = qviewData.result[0].qActions;
                if (qActions && qActions.length > 0) {
                    populateIndicator(qActions, result.result, "qviewEnabled");
                }
            }
        })
}

function populateIndicator(qActions, allActions, expression) {
    for (var i = 0; i < qActions.length; i++) {
        var qAction = qActions[i];
        var index = Utils.isExists(allActions, qAction.qaction, "_id");
        if (index !== undefined) {
            var actionInfo = allActions[index];
            actionInfo[expression] = true;
        }
    }
}


// function to add actions to customization or to qviews form the collection actions.
exports.addActions = function (params, db, options) {
    if (params.addToCustomization) {
        var sourceid = params.sourceid;
        var selectedActions = params._id;
        return db.update({$collection:"pl.qviewcustomizations", $upsert:{$query:{_id:sourceid}}}).then(
            function (data) {
                return db.query({$collection:"pl.qviewcustomizations", $filter:{_id:sourceid}});
            }).then(function (customizationData) {
                if (customizationData && customizationData.result && customizationData.result.length > 0) {
                    customizationData = customizationData.result[0];
                    var qActions = customizationData.qActions || [];
                    var actionsToBeInserted = [];
                    for (var i = 0; i < selectedActions.length; i++) {
                        var selectedAction = selectedActions[i];
                        var found = false;
                        for (var j = 0; j < qActions.length; j++) {
                            if (Utils.deepEqual(qActions[j].qaction._id, Utils.getObjectId(selectedAction))) {
                                found = true;
                            }
                        }
                        if (!found) {
                            actionsToBeInserted.push({qaction:{_id:selectedAction}});
                        }
                    }
                    console.log("actions to be inserted>>" + JSON.stringify(actionsToBeInserted));
                    if (actionsToBeInserted.length > 0) {
                        return db.update({$collection:"pl.qviewcustomizations", $update:{_id:customizationData._id, $set:{qActions:{$insert:actionsToBeInserted}}}});
                    }
                }

            })
    } else if (params.addToQview) {
        var viewid = params.view__id;
        var selectedActions = params._id;
        return db.query({$collection:"pl.qviews", $filter:{id:viewid}}).then(function (qviewsData) {
            if (qviewsData && qviewsData.result && qviewsData.result.length > 0) {
                qviewsData = qviewsData.result[0];
                var qActions = qviewsData.qActions || [];
                var actionsToBeInserted = [];
                for (var i = 0; i < selectedActions.length; i++) {
                    var selectedAction = selectedActions[i];
                    var found = false;
                    for (var j = 0; j < qActions.length; j++) {
                        if (Utils.deepEqual(qActions[j].qaction._id, selectedAction)) {
                            found = true;
                        }
                    }
                    if (!found) {
                        actionsToBeInserted.push({qaction:{_id:selectedAction}});
                    }
                }
                if (actionsToBeInserted.length > 0) {
                    return db.update({$collection:"pl.qviews", $update:{_id:qviewsData._id, $set:{qActions:{$insert:actionsToBeInserted}}}});
                }
            }
        })
    }
}
