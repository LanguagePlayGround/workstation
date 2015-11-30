/**
 * Created by rajit on 8/4/15.
 */
var Constants = require("ApplaneDB/lib/Constants.js");

//is used to display DB and its status and when-repeater in front instead of in nested require for pl.crons   ---Rajit garg 08/04/2015
exports.onResultView = function (query, result, db) {
    if (result && result.result && result.result.length > 0) {
        for (var i = 0; i < result.result.length; i++) {
            var dbs = result.result[i][Constants.Admin.Crons.DBS];
            if (dbs && dbs.length > 0) {
                result.result[i][Constants.Admin.Crons.DBS_STATUS] = "";
                for (var j = 0; j < dbs.length; j++) {
                    result.result[i][Constants.Admin.Crons.DBS_STATUS] += dbs[j][Constants.Admin.Crons.Dbs.DB] + "(" + dbs[j][[Constants.Admin.Crons.Dbs.STATUS]] + ");"
                }
            }
            var when = result.result[i][Constants.Admin.Crons.WHEN];
            if (when && when[Constants.Admin.Crons.REPEATS]) {
                result.result[i][Constants.Admin.Crons.REPEATS] = when[Constants.Admin.Crons.REPEATS];
            }
            var history = result.result[i]["__history"];
            if (history && history["__createdOn"]) {
                result.result[i][Constants.Admin.Crons.CREATED_ON] = history["__createdOn"];
            }
        }
    }
};

//is used to get dbs field in fields for pl-crons     ---Rajit garg 08/04/2015
exports.onQueryView = function (query, db) {
    if (query) {
        query["$fields"] = query["$fields"] || {};
        query["$fields"][Constants.Admin.Crons.DBS] = 1;
        query["$fields"]["__history"] = 1;
    }
};