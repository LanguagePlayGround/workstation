var Constants = require("../Constants.js");

exports.onPreSave = function (event, document, collection, db, options) {
    if (db.isGlobalDB()) {
        return;
    }
    var global = collection.getValue(Constants.Admin.Collections.GLOBAL);
    if (!global) {
        return;
    }
    return mergeValueForGlobal(collection, db);
}

function mergeValueForGlobal(collection, db) {
    var collectionName = collection.getValue(Constants.Admin.Collections.COLLECTION);
    return collection.count().then(
        function (count) {
            if (count === 0) {
                return db.query({$collection:collectionName, $events:false, $modules:false});
            }
        }).then(function (data) {
            var result = data ? data.result : undefined;
            if (result && result.length > 0) {
                var update = {};
                update[Constants.Update.COLLECTION] = collectionName;
                update[Constants.Update.INSERT] = result;
                update[Constants.Query.MODULES] = {TransactionModule:1, HistoryLogs:1};
                update.$check_id = false;//when we were inserting data then the transaction module was checking for _id in the child and it was throwing duplicate key error
                return db.update(update);
            }
        })
}



