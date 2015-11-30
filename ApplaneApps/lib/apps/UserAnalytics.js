var Utils = require("ApplaneCore/apputil/util.js");


exports.getUserAnalytics = function (query, result, db) {
    if (result && result.result && result.result.length > 0) {
        var ids = [];
        for (var i = 0; i < result.result.length; i++) {
            ids.push(result.result[i]._id);
        }
        var viewCountQuery = {$collection: "pl.servicelogs"};
        viewCountQuery.$parameters = query.$parameters;
        viewCountQuery.$filter = query.$filter ? Utils.deepClone(query.$filter) : {};
        viewCountQuery.$filter.view = true;
        viewCountQuery.$filter.db = {"$in": ids};
        viewCountQuery.$group = [
            {"_id": {"db": "$db", "subkeyL1": "$subkeyL1"}, $fields: false},
            {"_id": "$_id.db", viewCount: {"$sum": 1}, $fields: false}
        ];
        return db.query(viewCountQuery).then(function (queryResult) {
            var newResult = queryResult.result;
            if (newResult && newResult.length > 0) {
                for (var i = 0; i < newResult.length; i++) {
                    for (var j = 0; j < result.result.length; j++) {
                        if (result.result[j]._id === newResult[i]._id) {
                            result.result[j].viewCount = newResult[i].viewCount;
                            break;
                        }
                    }
                }
            }
        })
    }
}

