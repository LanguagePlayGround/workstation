var Utils = require("ApplaneCore/apputil/util.js");
exports.saveUserState = function (updates, db) {
    var state = updates.state;
    var view_id = updates.viewid;
    var sourceid = updates.sourceid;
    if (!view_id) {
        throw new Error("viewid not found while saving userstate");
        return;
    }
    var user = db.user;
    var stateUpdates = {};
    if (state.filterSpaceInfo) {
        stateUpdates.$set = stateUpdates.$set || {};
        for (var i = 0; i < state.filterSpaceInfo.length; i++) {
            var key = "filterspace." + state.filterSpaceInfo[i].filterspace + ".filter.filterInfo";
            stateUpdates.$set[key] = JSON.stringify(state.filterSpaceInfo[i]);
        }
    }
    if (state.removedFilterSpaceInfo) {
        stateUpdates.$unset = stateUpdates.$unset || {};
        for (var i = 0; i < state.removedFilterSpaceInfo.length; i++) {
            var index = Utils.isExists(state.filterSpaceInfo, state.removedFilterSpaceInfo[i], "filterspace");
            if (index === undefined) {
                var key = "filterspace." + state.removedFilterSpaceInfo[i].filterspace;
                stateUpdates.$unset[key] = "";
            }
        }
    }
    if (state.filterInfo) {
        stateUpdates.$set = stateUpdates.$set || {};
        var key = "viewstate." + sourceid + "." + view_id + ".filter.filterInfo";
        stateUpdates.$set[key] = JSON.stringify(state.filterInfo);
    } else {
        stateUpdates.$unset = stateUpdates.$unset || {};
        var key = "viewstate." + sourceid + "." + view_id + ".filter";
        stateUpdates.$unset[key] = "";
    }
    if (state.sortInfo) {
        stateUpdates.$set = stateUpdates.$set || {};
        var key = "viewstate." + sourceid + "." + view_id + ".sort.sortInfo";
        stateUpdates.$set[key] = JSON.stringify(state.sortInfo);
    } else {
        stateUpdates.$unset = stateUpdates.$unset || {};
        var key = "viewstate." + sourceid + "." + view_id + ".sort";
        stateUpdates.$unset[key] = "";
    }

    if (state.groupInfo) {
        stateUpdates.$set = stateUpdates.$set || {};
        var key = "viewstate." + sourceid + "." + view_id + ".group.groupInfo";
        stateUpdates.$set[key] = JSON.stringify(state.groupInfo);
    } else {
        stateUpdates.$unset = stateUpdates.$unset || {};
        var key = "viewstate." + sourceid + "." + view_id + ".group";
        stateUpdates.$unset[key] = "";
    }

    if (state.lastSelectedInfo) {
        stateUpdates.$set = stateUpdates.$set || {};
        var key = "viewstate." + sourceid + "." + view_id + ".lastSelectedInfo";
        stateUpdates.$set[key] = state.lastSelectedInfo
    } else {
        stateUpdates.$unset = stateUpdates.$unset || {};
        var key = "viewstate." + sourceid + "." + view_id + ".lastSelectedInfo";
        stateUpdates.$unset[key] = "";
    }
    if (state.recursionInfo) {
        stateUpdates.$set = stateUpdates.$set || {};
        var key = "viewstate." + sourceid + "." + view_id + ".recursion.recursionInfo";
        stateUpdates.$set[key] = JSON.stringify(state.recursionInfo);
    } else {
        stateUpdates.$unset = stateUpdates.$unset || {};
        var key = "viewstate." + sourceid + "." + view_id + ".recursion";
        stateUpdates.$unset[key] = "";
    }
    if (Object.keys(stateUpdates).length > 0) {
        stateUpdates.$query = {_id: user._id};
        return db.mongoUpdate({$collection: "pl.users", $update: stateUpdates});
    }

}


exports.saveFieldCustomization = function (updates, db) {
    var Utils = require("ApplaneCore/apputil/util.js");
    var Constants = require("ApplaneDB/lib/Constants.js");
    var userid = undefined;
    if ((!updates.scope) || updates.scope === "self") {
        userid = db.user._id;
    }
    return  Utils.iterateArrayWithPromise(updates.fieldCustomizations, function (index, update) {
        if (!update.collection || !update._id) {
            throw new Error("collection and _id is mandatory to upsert into pl.fieldcustomizations")
        }
        var collectionId = undefined;
        var qViewId = undefined;
        return getCollectionId(update.collection, db).then(
            function (cId) {
                collectionId = cId;
                return getQviewId(update.qview, db)
            }).then(
            function (vId) {
                qViewId = vId
            }).then(function () {
                if (!qViewId && update.sourceid) {
                    throw new Error("Qview is mandatory if sourceid is defined.");
                }

                var filter = {};
                filter[Constants.FieldCustomizations.COLLECTION_ID] = collectionId;
                filter[Constants.FieldCustomizations.FIELD_ID] = update._id;
                if (update.sourceid) {
                    filter[Constants.FieldCustomizations.SOURCE_ID] = update.sourceid;
                }
                if (qViewId) {
                    filter[Constants.FieldCustomizations.QVIEW_ID] = qViewId;
                }
                if (userid) {
                    filter[Constants.UserFieldCustomizations.USER_ID] = userid;
                }

                var fieldSet = {};
                fieldSet[Constants.FieldCustomizations.FIELD_ID] = {"_id": update._id};
                fieldSet[Constants.FieldCustomizations.COLLECTION_ID] = {"_id": collectionId};
                if (qViewId) {
                    fieldSet[Constants.FieldCustomizations.QVIEW_ID] = {"_id": qViewId};
                }
                if (userid) {
                    filter[Constants.UserFieldCustomizations.USER_ID] = {_id: userid};
                }
                for (var j = 0; j < Constants.FieldCustomizations.MERGE_PROPERTIES.length; j++) {
                    var prop = Constants.FieldCustomizations.MERGE_PROPERTIES[j];
                    if (update[prop] !== undefined) {
                        fieldSet[prop] = update[prop];
                    }

                }
                var collection = userid ? Constants.UserFieldCustomizations.TABLE : Constants.FieldCustomizations.TABLE;
                return db.update({$collection: collection, $upsert: {$query: filter, $set: fieldSet}});
            })
    })
}

function fetchUserState(params, db) {
    var userService = {};
    if (params.fetchUser) {
        return db[params.fetchUser](params.fetchUserKey, params.fetchUserId).then(function (usr) {
            userService.fetch = params.fetch;
            return usr[params.userMethod](params.usrV, params.usrVFilter, params.usrVParams)
        }).then(function (userServiceResult) {
                return userService.result = userServiceResult;
            })
    }
}
exports.fetchUserStateObject = function (arg, db) {
    return fetchUserState(arg, db);
}

function getQviewId(qview, db) {
    if (!qview) {
        var d = require("q").defer();
        d.resolve();
        return d.promise;
    }
    return db.query({$collection: "pl.qviews", $filter: {id: qview}}).then(function (result) {
        if (result.result.length === 0) {
            throw new Error("Qview not found for id [" + qview + "]");
        }
        return result.result[0]._id;
    })
}

function getCollectionId(collection, db) {
    return db.query({$collection: "pl.collections", $filter: {collection: collection}}).then(function (result) {
        if (result.result.length === 0) {
            throw new Error("Collection not found for [" + collection + "]");
        }
        return result.result[0]._id;
    })
}

exports.deleteFieldCustomization = function (params, db) {
    var Constants = require("ApplaneDB/lib/Constants.js");
    var scope = params.scope;
    var userid = undefined;
    if (!scope || scope === "self") {
        userid = db.user._id;
    }
    var collectionId = undefined;
    var qViewId = undefined;
    return getCollectionId(params.collection, db).then(
        function (cId) {
            collectionId = cId;
            return getQviewId(params.qview, db)
        }).then(
        function (vId) {
            qViewId = vId
        }).then(function () {
            if (!qViewId && params.sourceid) {
                throw new Error("Qview is mandatory if sourceid is defined.");
            }
            var filter = {};
            filter[Constants.FieldCustomizations.COLLECTION_ID] = collectionId;
            if (qViewId) {
                filter[Constants.FieldCustomizations.QVIEW_ID] = qViewId;
            }
            if (params.sourceid) {
                filter[Constants.FieldCustomizations.SOURCE_ID] = params.sourceid;
            }
            if (userid) {
                filter[Constants.UserFieldCustomizations.USER_ID] = userid;
            }
            if (params.fieldid) {
                filter[Constants.FieldCustomizations.FIELD_ID] = params.fieldid;
            }
            var collection = userid ? Constants.UserFieldCustomizations.TABLE : Constants.FieldCustomizations.TABLE;
            //$events will be false to avoid change logs for delete customizations.
            return db.update({$collection: collection, $delete: {$query: filter}, $events: false}).then(
                function (update) {
                    return db.getAdminDB();
                }).then(
                function (adminDB) {
                    return adminDB.query({$collection: "pl.dbs", $filter: {db: db.db.databaseName, admindb: {$exists: true}}, $fields: {admindb: 1}});
                }).then(
                function (result) {
                    if (result.result.length > 0) {
                        return  result.result[0].admindb;
                    }
                }).then(
                function (commitDb) {
                    if (commitDb) {
                        return db.connectUnauthorized(commitDb);
                    }
                }).then(function (commitDB) {
                    if (commitDB) {
                        return commitDB.update({$collection: collection, $delete: {$query: filter}, $events: false});
                    }
                })
        })
}