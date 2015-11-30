var ApplaneDB = require("ApplaneDB");
var config = {"SERVER_NAME": "local-manjeet", "CPUS": "1", "PORT": "5100", "URL": "mongodb://192.168.100.21:27023", "ESURL": "192.168.100.21:9200", "BASE_URL": "E:\\NewApplane\\node_modules\\AFBSource\\/node_modules", "Admin": {"DB": "pladmin", "USER_NAME": "admin", "PASSWORD": "damin"}, "MongoAdmin": {"DB": "admin", "USER_NAME": "daffodilsw", "PASSWORD": "daffodil-applane"}, "SERVICE_LOGS_ENABLED": true, "NEWRELIC_ENABLED": "false", "USER_CACHE": true, "USER_CACHE_PORT": "6199", "USER_CACHE_HOSTNAME": "127.0.0.1", "CACHE_TOKEN": "54eb02737a12a4k5j6s354ty54akj6s48c3f7"};
var Utility = require("ApplaneCore/apputil/util.js");
var totalTime = {};
var loadCount = 1;
var db = undefined;
var minTime = 1000000000000;
var maxTime = 0;
var totalTime = 0;
var minAggregateTime = 1000000000000;
var maxAggregateTime = 0;
var totalAggregateTime = 0;
var minMongoFindTime = 1000000000000;
var maxMongoFindTime = 0;
var totalMongoFindTime = 0;
var count = 0;
var Q = require("q");

var query = {};
var profitAndLossReportConsolidated = {function: "view.getView", parameters: [
    {"id": "pprofit_and_loss", "collection": "accounts", "label": "Profit and Loss (Consolidated)", "_id": "54e468ba059c6119109f2dc8", "index": 10, "uri": "profit-and-loss-consolidated", "sourceid": "54e468ba059c6119109f2dc8", "selectedMenu": "54e468ba059c6119109f2dc5", "hide": false}
]/*, options: {es: true}*/};

var profitAndLossReportMonthWise = {function: "view.getView", parameters: [
    {"collection": "voucherlineitems", "id": "profit_and_loss_neww", "index": 20, "label": "Profit and Loss (Month Wise)", "_id": "54e5aaf754b9eec86ffe13ff", "uri": "profit-and-loss-month-wise", "sourceid": "54e5aaf754b9eec86ffe13ff", "selectedMenu": "54e468ba059c6119109f2dc5", "hide": false}
], options: {es: true}};

var trialBalance = {function: "view.getView", parameters: [
    {"collection": "accounts", "id": "trial_balance_total_amount", "label": "Trial Balance", "_id": "54e72baedc63d54b57cb5db5", "uri": "trial-balance", "sourceid": "54e72baedc63d54b57cb5db5", "selectedMenu": "54e46a01059c6119109f2e3f", "hide": false}
], options: {es: true}};

var balanceSheet = {function: "view.getView", parameters: [
    {"id": "balance_sheet_new", "collection": "accounts", "label": "Balance Sheet", "_id": "54e46a01059c6119109f2e3a", "uri": "balance-sheet", "sourceid": "54e46a01059c6119109f2e3a", "selectedMenu": "54e46a01059c6119109f2e37", "hide": false}
], options: {es: true}};

var initiationLeads = {"initiation_leads__fy": {"$collection": "relationships", "runOnES": false, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2014-04-01T00:00:00.000Z", "$lt": "2015-04-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Active", "entity_id.is_free": {"$in": [null, false]}, "status_history.current_stage_id.name": "Initiation", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Active", "entity_id.is_free": {"$in": [null, false]}, "status_history.current_stage_id.name": "Initiation", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}, "initiation_leads__past__fy": {"$collection": "relationships", "runOnES": false, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2013-04-01T00:00:00.000Z", "$lt": "2014-04-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Active", "entity_id.is_free": {"$in": [null, false]}, "status_history.current_stage_id.name": "Initiation", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Active", "entity_id.is_free": {"$in": [null, false]}, "status_history.current_stage_id.name": "Initiation", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}, "initiation_leads__month": {"$collection": "relationships", "runOnES": false, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-02-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Active", "entity_id.is_free": {"$in": [null, false]}, "status_history.current_stage_id.name": "Initiation", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Active", "entity_id.is_free": {"$in": [null, false]}, "status_history.current_stage_id.name": "Initiation", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}, "initiation_leads__past__month": {"$collection": "relationships", "runOnES": false, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2014-12-01T00:00:00.000Z", "$lt": "2015-01-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Active", "entity_id.is_free": {"$in": [null, false]}, "status_history.current_stage_id.name": "Initiation", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Active", "entity_id.is_free": {"$in": [null, false]}, "status_history.current_stage_id.name": "Initiation", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}, "initiation_leads__quarter": {"$collection": "relationships", "runOnES": false, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-04-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Active", "entity_id.is_free": {"$in": [null, false]}, "status_history.current_stage_id.name": "Initiation", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Active", "entity_id.is_free": {"$in": [null, false]}, "status_history.current_stage_id.name": "Initiation", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}, "initiation_leads__past__quarter": {"$collection": "relationships", "runOnES": false, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2014-10-01T00:00:00.000Z", "$lt": "2015-01-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Active", "entity_id.is_free": {"$in": [null, false]}, "status_history.current_stage_id.name": "Initiation", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Active", "entity_id.is_free": {"$in": [null, false]}, "status_history.current_stage_id.name": "Initiation", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}};
var lostDueToNoResponse = {"lost_dueto_noResponse__fy": {"$collection": "relationships", "runOnES": false, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2014-04-01T00:00:00.000Z", "$lt": "2015-04-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}, "lost_dueto_noResponse__past__fy": {"$collection": "relationships", "runOnES": false, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2013-04-01T00:00:00.000Z", "$lt": "2014-04-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}, "lost_dueto_noResponse__month": {"$collection": "relationships", "runOnES": false, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-02-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}, "lost_dueto_noResponse__past__month": {"$collection": "relationships", "runOnES": false, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2014-12-01T00:00:00.000Z", "$lt": "2015-01-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}, "lost_dueto_noResponse__quarter": {"$collection": "relationships", "runOnES": false, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-04-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}, "lost_dueto_noResponse__past__quarter": {"$collection": "relationships", "runOnES": false, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2014-10-01T00:00:00.000Z", "$lt": "2015-01-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}};


var initiationLeadsES = {"initiation_leads__fy":{"$collection":"relationships","runOnES":true,"$similarqueries":{"date":"status_history.entry_date","queries":[{"alias":"initiation_leads__fy"},{"alias":"initiation_leads__past__fy"},{"alias":"initiation_leads__month"},{"alias":"initiation_leads__past__month"},{"alias":"initiation_leads__quarter"},{"alias":"initiation_leads__past__quarter"}]},"$cache":false,"$group":{"_id":null,"$fields":false,"count":{"$sum":1},"$sort":{"count":-1}},"$unwind":["status_history"],"$parameters":{"date":{"$gte":"2015-01-01T00:00:00.000Z","$lt":"2015-01-02T00:00:00.000Z"},"status_history.entry_date":{"$gte":"2014-04-01T00:00:00.000Z","$lt":"2015-04-01T00:00:00.000Z"}},"$filter":{"pipeline_status":"Active","entity_id.is_free":{"$in":[null,false]},"status_history.current_stage_id.name":"Initiation","profit_center_id":{"$function":{"Functions.whenDefined":{"key":"$profit_center_id"}}},"status_history.entry_date":"$status_history.entry_date"},"filter":{"pipeline_status":"Active","entity_id.is_free":{"$in":[null,false]},"status_history.current_stage_id.name":"Initiation","profit_center_id":{"$function":{"Functions.whenDefined":{"key":"$profit_center_id"}}},"status_history.entry_date":"$status_history.entry_date"}},"initiation_leads__past__fy":{"$collection":"relationships","runOnES":false,"$similarqueries":{"date":"status_history.entry_date","queries":[{"alias":"initiation_leads__fy"},{"alias":"initiation_leads__past__fy"},{"alias":"initiation_leads__month"},{"alias":"initiation_leads__past__month"},{"alias":"initiation_leads__quarter"},{"alias":"initiation_leads__past__quarter"}]},"$cache":true,"$group":{"_id":null,"$fields":false,"count":{"$sum":1},"$sort":{"count":-1}},"$unwind":["status_history"],"$parameters":{"date":{"$gte":"2015-01-01T00:00:00.000Z","$lt":"2015-01-02T00:00:00.000Z"},"status_history.entry_date":{"$gte":"2013-04-01T00:00:00.000Z","$lt":"2014-04-01T00:00:00.000Z"}},"$filter":{"pipeline_status":"Active","entity_id.is_free":{"$in":[null,false]},"status_history.current_stage_id.name":"Initiation","profit_center_id":{"$function":{"Functions.whenDefined":{"key":"$profit_center_id"}}},"status_history.entry_date":"$status_history.entry_date"},"filter":{"pipeline_status":"Active","entity_id.is_free":{"$in":[null,false]},"status_history.current_stage_id.name":"Initiation","profit_center_id":{"$function":{"Functions.whenDefined":{"key":"$profit_center_id"}}},"status_history.entry_date":"$status_history.entry_date"}},"initiation_leads__month":{"$collection":"relationships","runOnES":true,"$similarqueries":{"date":"status_history.entry_date","queries":[{"alias":"initiation_leads__fy"},{"alias":"initiation_leads__past__fy"},{"alias":"initiation_leads__month"},{"alias":"initiation_leads__past__month"},{"alias":"initiation_leads__quarter"},{"alias":"initiation_leads__past__quarter"}]},"$cache":false,"$group":{"_id":null,"$fields":false,"count":{"$sum":1},"$sort":{"count":-1}},"$unwind":["status_history"],"$parameters":{"date":{"$gte":"2015-01-01T00:00:00.000Z","$lt":"2015-01-02T00:00:00.000Z"},"status_history.entry_date":{"$gte":"2015-01-01T00:00:00.000Z","$lt":"2015-02-01T00:00:00.000Z"}},"$filter":{"pipeline_status":"Active","entity_id.is_free":{"$in":[null,false]},"status_history.current_stage_id.name":"Initiation","profit_center_id":{"$function":{"Functions.whenDefined":{"key":"$profit_center_id"}}},"status_history.entry_date":"$status_history.entry_date"},"filter":{"pipeline_status":"Active","entity_id.is_free":{"$in":[null,false]},"status_history.current_stage_id.name":"Initiation","profit_center_id":{"$function":{"Functions.whenDefined":{"key":"$profit_center_id"}}},"status_history.entry_date":"$status_history.entry_date"}},"initiation_leads__past__month":{"$collection":"relationships","runOnES":true,"$similarqueries":{"date":"status_history.entry_date","queries":[{"alias":"initiation_leads__fy"},{"alias":"initiation_leads__past__fy"},{"alias":"initiation_leads__month"},{"alias":"initiation_leads__past__month"},{"alias":"initiation_leads__quarter"},{"alias":"initiation_leads__past__quarter"}]},"$cache":false,"$group":{"_id":null,"$fields":false,"count":{"$sum":1},"$sort":{"count":-1}},"$unwind":["status_history"],"$parameters":{"date":{"$gte":"2015-01-01T00:00:00.000Z","$lt":"2015-01-02T00:00:00.000Z"},"status_history.entry_date":{"$gte":"2014-12-01T00:00:00.000Z","$lt":"2015-01-01T00:00:00.000Z"}},"$filter":{"pipeline_status":"Active","entity_id.is_free":{"$in":[null,false]},"status_history.current_stage_id.name":"Initiation","profit_center_id":{"$function":{"Functions.whenDefined":{"key":"$profit_center_id"}}},"status_history.entry_date":"$status_history.entry_date"},"filter":{"pipeline_status":"Active","entity_id.is_free":{"$in":[null,false]},"status_history.current_stage_id.name":"Initiation","profit_center_id":{"$function":{"Functions.whenDefined":{"key":"$profit_center_id"}}},"status_history.entry_date":"$status_history.entry_date"}},"initiation_leads__quarter":{"$collection":"relationships","runOnES":true,"$similarqueries":{"date":"status_history.entry_date","queries":[{"alias":"initiation_leads__fy"},{"alias":"initiation_leads__past__fy"},{"alias":"initiation_leads__month"},{"alias":"initiation_leads__past__month"},{"alias":"initiation_leads__quarter"},{"alias":"initiation_leads__past__quarter"}]},"$cache":false,"$group":{"_id":null,"$fields":false,"count":{"$sum":1},"$sort":{"count":-1}},"$unwind":["status_history"],"$parameters":{"date":{"$gte":"2015-01-01T00:00:00.000Z","$lt":"2015-01-02T00:00:00.000Z"},"status_history.entry_date":{"$gte":"2015-01-01T00:00:00.000Z","$lt":"2015-04-01T00:00:00.000Z"}},"$filter":{"pipeline_status":"Active","entity_id.is_free":{"$in":[null,false]},"status_history.current_stage_id.name":"Initiation","profit_center_id":{"$function":{"Functions.whenDefined":{"key":"$profit_center_id"}}},"status_history.entry_date":"$status_history.entry_date"},"filter":{"pipeline_status":"Active","entity_id.is_free":{"$in":[null,false]},"status_history.current_stage_id.name":"Initiation","profit_center_id":{"$function":{"Functions.whenDefined":{"key":"$profit_center_id"}}},"status_history.entry_date":"$status_history.entry_date"}},"initiation_leads__past__quarter":{"$collection":"relationships","runOnES":true,"$similarqueries":{"date":"status_history.entry_date","queries":[{"alias":"initiation_leads__fy"},{"alias":"initiation_leads__past__fy"},{"alias":"initiation_leads__month"},{"alias":"initiation_leads__past__month"},{"alias":"initiation_leads__quarter"},{"alias":"initiation_leads__past__quarter"}]},"$cache":false,"$group":{"_id":null,"$fields":false,"count":{"$sum":1},"$sort":{"count":-1}},"$unwind":["status_history"],"$parameters":{"date":{"$gte":"2015-01-01T00:00:00.000Z","$lt":"2015-01-02T00:00:00.000Z"},"status_history.entry_date":{"$gte":"2014-10-01T00:00:00.000Z","$lt":"2015-01-01T00:00:00.000Z"}},"$filter":{"pipeline_status":"Active","entity_id.is_free":{"$in":[null,false]},"status_history.current_stage_id.name":"Initiation","profit_center_id":{"$function":{"Functions.whenDefined":{"key":"$profit_center_id"}}},"status_history.entry_date":"$status_history.entry_date"},"filter":{"pipeline_status":"Active","entity_id.is_free":{"$in":[null,false]},"status_history.current_stage_id.name":"Initiation","profit_center_id":{"$function":{"Functions.whenDefined":{"key":"$profit_center_id"}}},"status_history.entry_date":"$status_history.entry_date"}}};

var lostDueToNoResponseES = {"lost_dueto_noResponse__fy": {"$collection": "relationships", "runOnES": true, "$similarqueries": {"date": "status_history.entry_date", "queries": [
    {"alias": "lost_dueto_noResponse__fy"},
    {"alias": "lost_dueto_noResponse__past__fy"},
    {"alias": "lost_dueto_noResponse__month"},
    {"alias": "lost_dueto_noResponse__past__month"},
    {"alias": "lost_dueto_noResponse__quarter"},
    {"alias": "lost_dueto_noResponse__past__quarter"}
]}, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2014-04-01T00:00:00.000Z", "$lt": "2015-04-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}, "lost_dueto_noResponse__past__fy": {"$collection": "relationships", "runOnES": true, "$similarqueries": {"date": "status_history.entry_date", "queries": [
    {"alias": "lost_dueto_noResponse__fy"},
    {"alias": "lost_dueto_noResponse__past__fy"},
    {"alias": "lost_dueto_noResponse__month"},
    {"alias": "lost_dueto_noResponse__past__month"},
    {"alias": "lost_dueto_noResponse__quarter"},
    {"alias": "lost_dueto_noResponse__past__quarter"}
]}, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2013-04-01T00:00:00.000Z", "$lt": "2014-04-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}, "lost_dueto_noResponse__month": {"$collection": "relationships", "runOnES": true, "$similarqueries": {"date": "status_history.entry_date", "queries": [
    {"alias": "lost_dueto_noResponse__fy"},
    {"alias": "lost_dueto_noResponse__past__fy"},
    {"alias": "lost_dueto_noResponse__month"},
    {"alias": "lost_dueto_noResponse__past__month"},
    {"alias": "lost_dueto_noResponse__quarter"},
    {"alias": "lost_dueto_noResponse__past__quarter"}
]}, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-02-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}, "lost_dueto_noResponse__past__month": {"$collection": "relationships", "runOnES": true, "$similarqueries": {"date": "status_history.entry_date", "queries": [
    {"alias": "lost_dueto_noResponse__fy"},
    {"alias": "lost_dueto_noResponse__past__fy"},
    {"alias": "lost_dueto_noResponse__month"},
    {"alias": "lost_dueto_noResponse__past__month"},
    {"alias": "lost_dueto_noResponse__quarter"},
    {"alias": "lost_dueto_noResponse__past__quarter"}
]}, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2014-12-01T00:00:00.000Z", "$lt": "2015-01-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}, "lost_dueto_noResponse__quarter": {"$collection": "relationships", "runOnES": true, "$similarqueries": {"date": "status_history.entry_date", "queries": [
    {"alias": "lost_dueto_noResponse__fy"},
    {"alias": "lost_dueto_noResponse__past__fy"},
    {"alias": "lost_dueto_noResponse__month"},
    {"alias": "lost_dueto_noResponse__past__month"},
    {"alias": "lost_dueto_noResponse__quarter"},
    {"alias": "lost_dueto_noResponse__past__quarter"}
]}, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-04-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}, "lost_dueto_noResponse__past__quarter": {"$collection": "relationships", "runOnES": true, "$similarqueries": {"date": "status_history.entry_date", "queries": [
    {"alias": "lost_dueto_noResponse__fy"},
    {"alias": "lost_dueto_noResponse__past__fy"},
    {"alias": "lost_dueto_noResponse__month"},
    {"alias": "lost_dueto_noResponse__past__month"},
    {"alias": "lost_dueto_noResponse__quarter"},
    {"alias": "lost_dueto_noResponse__past__quarter"}
]}, "$cache": false, "$group": {"_id": null, "$fields": false, "count": {"$sum": 1}, "$sort": {"count": -1}}, "$unwind": ["status_history"], "$parameters": {"date": {"$gte": "2015-01-01T00:00:00.000Z", "$lt": "2015-01-02T00:00:00.000Z"}, "status_history.entry_date": {"$gte": "2014-10-01T00:00:00.000Z", "$lt": "2015-01-01T00:00:00.000Z"}}, "$filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}, "filter": {"pipeline_status": "Lost", "entity_id.is_free": {"$in": [null, false]}, "status_history.exit_type": "Lost", "lost_to_lost_reason.reason": "NoResponse", "profit_center_id": {"$function": {"Functions.whenDefined": {"key": "$profit_center_id"}}}, "status_history.entry_date": "$status_history.entry_date"}}};


var executeQuery = function (db, query) {
    var data = [];
    for (var i = 0; i < loadCount; i++) {
        data.push(i);
    }
    var startTime = new Date();
    db.mongoTime = {};
    return Utility.iterateArrayWithPromise(data,function () {
        return db.batchQuery(lostDueToNoResponseES).then(function (result) {
            console.log("result..." + JSON.stringify(result));
        })
//        return db.query(query);
        /*return db.invokeFunction(profitAndLossReportConsolidated.function, profitAndLossReportConsolidated.parameters, profitAndLossReportConsolidated.options).then(function (result) {
         console.log("Result...." + JSON.stringify(result));
         });*/
    }).then(function (resp) {
            var endTime = new Date();
            var diff = endTime - startTime;
            var totalCpu = db.mongoTime.totalTime;
            var aggregateCpu = db.mongoTime.mongoAggregate;
            var mongoFindCpu = db.mongoTime.mongoFind;
//            console.log("Total promises..." + totalPromises);
//            console.log("total in query.." + (totalCpu));
            console.log("DB detail" + JSON.stringify(db.mongoTime))
            if (totalCpu < minTime) {
                minTime = totalCpu
            }
            if (totalCpu > maxTime) {
                maxTime = totalCpu;
            }
            if (aggregateCpu < minAggregateTime) {
                minAggregateTime = aggregateCpu
            }
            if (aggregateCpu > maxAggregateTime) {
                maxAggregateTime = aggregateCpu;
            }
            if (mongoFindCpu < minMongoFindTime) {
                minMongoFindTime = mongoFindCpu
            }
            if (mongoFindCpu > maxMongoFindTime) {
                maxMongoFindTime = mongoFindCpu;
            }

            totalTime = totalTime + totalCpu;
            totalAggregateTime = totalAggregateTime + aggregateCpu;
            totalMongoFindTime = totalMongoFindTime + mongoFindCpu;
            count = count + 1;
            console.log("Diff stats total time ... Min time ..." + minTime + "....max Time..." + maxTime + " Avg time " + (totalTime / count).toFixed(0) + " in " + count + " try of " + loadCount + " batch size");
            console.log("Diff stats aggregate time ... Min time ..." + minAggregateTime + "....max Time..." + maxAggregateTime + " Avg time " + (totalAggregateTime / count).toFixed(0) + " in " + count + " try of " + loadCount + " batch size");
            console.log("Diff stats mongo find time ... Min time ..." + minMongoFindTime + "....max Time..." + maxMongoFindTime + " Avg time " + (totalMongoFindTime / count).toFixed(0) + " in " + count + " try of " + loadCount + " batch size");
        }).fail(function (e) {
            console.log("error..." + e.stack)
        });


}

function clearCache(db) {
    var client = db.esClient();
    return client.indices.clearCache({
        "index": "daffodilsw",
        "type": "voucherlineitems"}).then(function (res) {
            console.log("clear cache");
        });
}


var makeQuery = function () {
    return ApplaneDB.configure(config).then(function () {
        return ApplaneDB.connect("mongodb://192.168.100.21:27023", "daffodilsw", {username: "Amit.Singh", "password": "amitaman1"}).then(function (db1) {
            db = db1;
        })
    }).fail(function (err) {
            console.log(err);

        })
}


function doQuery() {
    return executeQuery(db, query).then(function () {
        return Q.delay(1000).then(function () {
            return clearCache(db);
        }).then(function () {
                return doQuery()
            });
    })

}

makeQuery().then(function () {
    return doQuery();
});
