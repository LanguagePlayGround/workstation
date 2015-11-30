var Constants = require("../Constants.js");
var ApplaneDBConstants = require("ApplaneDB/lib/Constants.js");
var Q = require("q");
var Utility = require("./Utility.js");
var BusinessLogicError = require("ApplaneError/lib/BusinessLogicError.js");

exports.onPreSave = function (document, db, options) {
    if (document.type === "update") {
        var updatedFields = document.getUpdatedFields();
        if (updatedFields.indexOf(ApplaneDBConstants.Admin.Menus.COLLECTION) >= 0) {
            var collection = document.get(ApplaneDBConstants.Admin.Menus.COLLECTION);
            var oldCollection = document.getOld(ApplaneDBConstants.Admin.Menus.COLLECTION);
            if (collection !== oldCollection) {
                throw new BusinessLogicError("Collection name cannot be changed in menus . New collection [" + collection + "] .. Old collection [" + oldCollection + "]");
            }
        }
    }
    if ((document.type === "insert" || document.type === "update" )) {
        var label = document.get("label");
        var identifer = Utility.getIndentifer(label);
        document.set("uri", identifer);
    }
    var application = document.type === "delete" ? document.getOld("application") : document.get("application");
    return Utility.updateLocalData(application._id, application.label, db, "pl.applications", options).then(function () {
        return require("./Menus.js").updateQviewFromMenu(document, db).then(function () {
            if (document.type === "insert") {
                var collection = document.get(ApplaneDBConstants.Admin.Menus.COLLECTION);
                var qviews = document.getDocuments(ApplaneDBConstants.Admin.Menus.QVIEWS);
                var label = document.get(ApplaneDBConstants.Admin.Menus.LABEL);
                if (collection && ((!qviews) || qviews.length == 0)) {
                    var identifier = Utility.getIndentifer(label);
                    document.insertDocument(ApplaneDBConstants.Admin.Menus.QVIEWS, [
                        {id: collection, collection: collection, label: label, uri: identifier}
                    ]);
                } else if (collection && qviews && qviews.length > 0) {
                    for (var i = 0; i < qviews.length; i++) {
                        var qview = qviews[i];
                        var label = qview.get("label");
                        var identifier = Utility.getIndentifer(label);
                        qview.set("uri", identifier);
                    }
                }
            } else if (document.type == "update") {
                var qviews = document.getDocuments(ApplaneDBConstants.Admin.Menus.QVIEWS, ["update", "insert"]);
                if (qviews && qviews.length > 0) {
                    for (var i = 0; i < qviews.length; i++) {
                        var qview = qviews[i];
                        var updatedFields = qview.getUpdatedFields();
                        if (updatedFields.indexOf("label") >= 0) {
                            var label = qview.get("label");
                            var identifier = Utility.getIndentifer(label);
                            qview.set("uri", identifier);
                        }
                    }
                }
            }
        });
    });
}

exports.updateQviewFromMenu = function (document, db) {
    var D = Q.defer();
    var collection = document.get(Constants.Menus.COLLECTION);
    if (!collection) {
        D.resolve();
        return D.promise;
    }
    collection = collection.trim();
    var collectionUpsert = {};
    collectionUpsert[ApplaneDBConstants.Update.Upsert.QUERY] = {};
    collectionUpsert[ApplaneDBConstants.Update.Upsert.QUERY][ApplaneDBConstants.Admin.Collections.COLLECTION] = collection;
    collectionUpsert[ApplaneDBConstants.Update.Upsert.FIELDS] = {};
    var collectionUpdates = {};
    collectionUpdates[ApplaneDBConstants.Update.COLLECTION] = ApplaneDBConstants.Admin.COLLECTIONS;
    collectionUpdates[ApplaneDBConstants.Update.UPSERT] = collectionUpsert;
    collectionUpdates.$applock = false;
    var collectionInfo = undefined;
    db.update(collectionUpdates).then(
        function (response) {
            collectionInfo = response[ApplaneDBConstants.Admin.COLLECTIONS][ApplaneDBConstants.Update.UPSERT][0];
            return db.query({$collection: Constants.QViews.TABLE, $filter: {id: collection}});
        }).then(
        function (result) {
            var qviewCount = result.result.length;
            if (qviewCount > 0) {
                return;
            }
            var qviewInsert = {};
            qviewInsert[Constants.QViews.ID] = collection;
            qviewInsert[Constants.QViews.UI] = "grid";
            qviewInsert[Constants.QViews.LABEL] = document.get(Constants.Menus.LABEL);
            qviewInsert[Constants.QViews.COLLECTION] = {};
            qviewInsert[Constants.QViews.COLLECTION][ApplaneDBConstants.Update.Upsert.QUERY] = {}
            qviewInsert[Constants.QViews.COLLECTION][ApplaneDBConstants.Update.Upsert.QUERY][ApplaneDBConstants.Query._ID] = collectionInfo[ApplaneDBConstants.Query._ID];

            qviewInsert[Constants.QViews.MAIN_COLLECTION] = {};
            qviewInsert[Constants.QViews.MAIN_COLLECTION][ApplaneDBConstants.Update.Upsert.QUERY] = {}
            qviewInsert[Constants.QViews.MAIN_COLLECTION][ApplaneDBConstants.Update.Upsert.QUERY][ApplaneDBConstants.Query._ID] = collectionInfo[ApplaneDBConstants.Query._ID];


            var qViewUpdates = {$collection: Constants.QViews.TABLE, $insert: qviewInsert, $applock: false};
            return db.update(qViewUpdates)
        }).then(
        function () {
            D.resolve();
        }).fail(function (err) {
            console.log("errorin menu trigger>>>>" + err)
            D.reject(err);
        })
    return D.promise;
}

exports.onPostSave = function (document, db, options) {
    var application = document.type === "delete" ? document.getOld("application") : document.get("application");
    return deleteChildMenu(document, db).then(function () {
        if (document.type === "update") {
            // when the label of the parent menu changes change the parentmenu.lable in child menus
            return changeChildMenuLabel(document, db);
        }
    }).then(function () {
            return Utility.updateAppLock(application.label, "pl.applications", db, options);
        })
}

function changeChildMenuLabel(document, db) {
    var _id = document.get("_id");
    var applicationDoc = document.getDocuments("application");
    var updatedFields = document.getUpdatedFields();
    if (updatedFields.indexOf("label") >= 0) {
        return db.query({$collection: "pl.menus", $filter: {"parentmenu._id": _id, "application": applicationDoc.get("_id")}}).then(function (childMenus) {
            if (childMenus && childMenus.result && childMenus.result.length > 0) {
                var updates = [];
                for (var i = 0; i < childMenus.result.length; i++) {
                    var menu = childMenus.result[i];
                    updates.push({_id: menu._id, $set: {"parentmenu": {_id: _id, label: document.get("label")}}});
                }
                if (updates && updates.length > 0) {
                    return db.update({$collection: "pl.menus", $update: updates, $applock: false});
                }
            }
        });
    }
}

exports.onQuery = function (query) {
    Utility.checkFilterInQuery(query, "application");
}

exports.onResult = function (query, result, db, options) {
    var localQuery = Utility.getlocalQuery(query.$filter, "pl.menus", "pl.applications", "application");
    return Utility.populateResult(localQuery, result, db, options);
}

function deleteChildMenu(document, db) {
    if (document.type === "delete") {
        var deleteQuery = {"parentmenu._id": document.get("_id"), "application._id": document.getOld("application")._id};
        return db.update({$collection: "pl.menus", $delete: [
            {$query: deleteQuery}
        ], $applock: false});
    } else {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
}
