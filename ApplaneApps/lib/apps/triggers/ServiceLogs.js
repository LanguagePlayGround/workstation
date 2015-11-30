var Utils = require("ApplaneCore/apputil/util.js");


exports.onResult = function (query, result, db) {
//    console.log("result before >>>.."+JSON.stringify(result));
    var dbCall = {};   //map for db wise count
    var dbIntervalCall = {};  //map for db and interval wise count
    var dbServiceCall = {};  //map for db and serviceType count
    delete query.$events;   //delete event to save from recursion
    delete query.$limit;
    var finalResult = [];   //strore the records based on db wise count

    var filter = query.$filter || {};
    filter["totalTime"] = {$gt: 2000};
    query.$filter = filter;
    return db.query(query).then(function (result1) {
        if (result1 && result1.result && result1.result.length > 0) {
            for (var i = 0; i < result1.result.length; i++) {
                if(Object.keys(result1.result[i]._id).length > 0) {
                    result1.result[i].totalTimeInterval = "2000-Above";
                    var dbName = result1.result[i].db;
                    var dbServiceType = result1.result[i].serviceType;
                    dbCall[dbName] = dbCall[dbName] || 0;
                    dbCall[dbName] += result1.result[i].count;
                    dbServiceCall[dbName + dbServiceType] = dbServiceCall[dbName + dbServiceType] || 0;
                    dbServiceCall[dbName + dbServiceType] += result1.result[i].count;
                    dbIntervalCall[dbName + "- 2000-Above"] = dbIntervalCall[dbName + "- 2000-Above"] || 0;
                    dbIntervalCall[dbName + "- 2000-Above"] += result1.result[i].count;
                    result1.result[i].tTime = {$gt: 2000};
                    finalResult.push(result1.result[i]);
                }
            }
        }
        query.$filter["totalTime"] = {$gt: 1000, $lte: 2000};
        return db.query(query);
    })
        .then(function (result2) {
            if (result2 && result2.result && result2.result.length > 0) {
                for (var i = 0; i < result2.result.length; i++) {
                    if(Object.keys(result2.result[i]._id).length > 0) {
                        result2.result[i].totalTimeInterval = "1000-2000";
                        var dbName = result2.result[i].db;
                        var dbServiceType = result2.result[i].serviceType;
                        dbCall[dbName] = dbCall[dbName] || 0;
                        dbCall[dbName] += result2.result[i].count;
                        dbServiceCall[dbName + dbServiceType] = dbServiceCall[dbName + dbServiceType] || 0;
                        dbServiceCall[dbName + dbServiceType] += result2.result[i].count;
                        dbIntervalCall[dbName + "- 1000-2000"] = dbIntervalCall[dbName + "- 1000-2000"] || 0;
                        dbIntervalCall[dbName + "- 1000-2000"] += result2.result[i].count;
                        result2.result[i].tTime = {$gt: 1000, $lte: 2000};
                        finalResult.push(result2.result[i]);
                    }
                }
            }
            query.$filter["totalTime"] = {$gt: 500, $lte: 1000};
            return db.query(query);
        }).then(function (result3) {
            if (result3 && result3.result && result3.result.length > 0) {
                for (var i = 0; i < result3.result.length; i++) {
                    if(Object.keys(result3.result[i]._id).length > 0) {
                        result3.result[i].totalTimeInterval = "500-1000";
                        var dbName = result3.result[i].db;
                        var dbServiceType = result3.result[i].serviceType;
                        dbCall[dbName] = dbCall[dbName] || 0;
                        dbCall[dbName] += result3.result[i].count;
                        dbServiceCall[dbName + dbServiceType] = dbServiceCall[dbName + dbServiceType] || 0;
                        dbServiceCall[dbName + dbServiceType] += result3.result[i].count;
                        dbIntervalCall[dbName + "- 500-1000"] = dbIntervalCall[dbName + "- 500-1000"] || 0;
                        dbIntervalCall[dbName + "- 500-1000"] += result3.result[i].count;
                        result3.result[i].tTime = {$gt: 500, $lte: 1000};
                        finalResult.push(result3.result[i]);
                    }
                }
            }
            query.$filter["totalTime"] = {$gt: 100, $lte: 500};
            return db.query(query);
        }).then(function (result4) {
            if (result4 && result4.result && result4.result.length > 0) {
                for (var i = 0; i < result4.result.length; i++) {
                    if(Object.keys(result4.result[i]._id).length > 0) {
                        result4.result[i].totalTimeInterval = "100-500";
                        var dbServiceType = result4.result[i].serviceType;
                        var dbName = result4.result[i].db;
                        dbCall[dbName] = dbCall[dbName] || 0;
                        dbCall[dbName] += result4.result[i].count;
                        dbServiceCall[dbName + dbServiceType] = dbServiceCall[dbName + dbServiceType] || 0;
                        dbServiceCall[dbName + dbServiceType] += result4.result[i].count;
                        dbIntervalCall[dbName + "- 100-500"] = dbIntervalCall[dbName + "- 100-500"] || 0;
                        dbIntervalCall[dbName + "- 100-500"] += result4.result[i].count;
                        result4.result[i].tTime = {$gt: 100, $lte: 500};
                        finalResult.push(result4.result[i]);
                    }
                }
            }
            query.$filter["totalTime"] = {$lte: 100};
            return db.query(query);
        }).then(function (result5) {
            if (result5 && result5.result && result5.result.length > 0) {
                for (var i = 0; i < result5.result.length; i++) {
                    if(Object.keys(result5.result[i]._id).length > 0) {
//                        console.log("_id \n"+ JSON.stringify(result5.result[i]._id));
                        var dbName = result5.result[i].db;
                        var dbServiceType = result5.result[i].serviceType;
                        result5.result[i].totalTimeInterval = "0-100";
                        dbCall[dbName] = dbCall[dbName] || 0;
                        dbCall[dbName] += result5.result[i].count;
                        dbServiceCall[dbName + dbServiceType] = dbServiceCall[dbName + dbServiceType] || 0;
                        dbServiceCall[dbName + dbServiceType] += result5.result[i].count;
                        dbIntervalCall[dbName + "- 0-100"] = dbIntervalCall[dbName + "- 0-100"] || 0;
                        dbIntervalCall[dbName + "- 0-100"] += result5.result[i].count;
                        result5.result[i].tTime = {$lte: 100};
                        finalResult.push(result5.result[i]);
                    }
                }
            }
//            console.log("dbCall...." + JSON.stringify(dbCall));
//            console.log("dbServiceCall......" + JSON.stringify(dbServiceCall));
//            console.log("dbIntervalCall...." + JSON.stringify(dbIntervalCall));
            result.result = finalResult;
//            console.log("result.length ..." + result.result.length);
            //find the percentage of per servicetype query to total db queries
            for (var i = 0; i < result.result.length; i++) {
                var record = result.result[i];
                var count = record.count;
                var db = record.db;
                var serviceType = record.serviceType;
                var totalCalls = dbCall[db];
                var totalServiceCalls = dbServiceCall[db + serviceType];
                var percentage = (count / totalCalls) * 100;
                var servicePercentage = (count / totalServiceCalls) * 100;
                record.serviceTypePercentage = servicePercentage ? servicePercentage.toFixed(2) : 0;
                record.percentage = percentage ? percentage.toFixed(2) : 0;
            }

//            console.log("result before sorting...."+ JSON.stringify(result.result));
            // sorting the result according to serviceType...
            Utils.sort(result.result, "asc", 'serviceType');
//            console.log("result    "+ JSON.stringify(result.result));
            var newRecords = [];  //tsave the records depends upon the interval and db
            //find the percentage of per db queries in a interval to total db queries
            for (var key in dbCall) {
                if (dbIntervalCall[key + "- 2000-Above"] !== undefined) {
                    var dbIntervalCount = dbIntervalCall[key + "- 2000-Above"];
                    var count = dbCall[key];
                    var percentage2 = (dbIntervalCount / count) * 100;
                    var record = {};
                    record.db = key;
                    record.totalTimeInterval = "2000-Above";
                    record.percentage = percentage2.toFixed(2);
                    newRecords.push(record);
                }
                if (dbIntervalCall[key + "- 1000-2000"] !== undefined) {
                    var dbIntervalCount = dbIntervalCall[key + "- 1000-2000"];
                    var count = dbCall[key];
                    var percentage2 = (dbIntervalCount / count) * 100;
                    var record = {};
                    record.db = key;
                    record.totalTimeInterval = "1000-2000";
                    record.percentage = percentage2.toFixed(2);
                    newRecords.push(record);
                }
                if (dbIntervalCall[key + "- 500-1000"] !== undefined) {
                    var dbIntervalCount = dbIntervalCall[key + "- 500-1000"];
                    var count = dbCall[key];
                    var percentage2 = (dbIntervalCount / count) * 100;
                    var record = {};
                    record.db = key;
                    record.totalTimeInterval = "500-1000";
                    record.percentage = percentage2.toFixed(2);
                    newRecords.push(record);
                }
                if (dbIntervalCall[key + "- 100-500"] !== undefined) {
                    var dbIntervalCount = dbIntervalCall[key + "- 100-500"];
                    var count = dbCall[key];
                    var percentage2 = (dbIntervalCount / count) * 100;
                    var record = {};
                    record.db = key;
                    record.totalTimeInterval = "100-500";
                    record.percentage = percentage2.toFixed(2);
                    newRecords.push(record);
                }
                if (dbIntervalCall[key + "- 0-100"] !== undefined) {
                    var dbIntervalCount = dbIntervalCall[key + "- 0-100"];
                    var count = dbCall[key];
                    var percentage2 = (dbIntervalCount / count) * 100;
                    var record = {};
                    record.db = key;
                    record.totalTimeInterval = "0-100";
                    record.percentage = percentage2.toFixed(2);
                    newRecords.push(record);
                }
            }
            for (var i = 0; i < newRecords.length; i++) {
                result.result.unshift(newRecords[i]);
            }
        });

}
