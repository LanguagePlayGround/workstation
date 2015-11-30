//filters ---	http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/query-dsl-script-filter.html
//aggregation --- http://www.elasticsearch.org/guide/en/elasticsearch/reference/current/search-aggregations-bucket-filters-aggregation.html
// query parameters -- http://www.elasticsearch.org/guide/en/elasticsearch/reference/1.x/search-request-source-filtering.html
// (AND/OR/NOT vs bool) -- http://www.elasticsearch.org/blog/all-about-elasticsearch-filter-bitsets/

// issues
// for sorting mapping must be defined on that fields
// total count is provided in the find query . it is good performance wise.



// Comparison between mongodb and elastic search

/* >>> Aggregate Query on voucherlineitems takes 1100 ms in  mongodb
 >>> Aggregatge Query on voucherlineitems in elasticsearch takes
 1. In date range aggregation query with group by on accountid and adding top hits (1 record)>>>> 280ms
 2. In date range aggregation query with group by on accountid >>> 170ms
 3. Aggregate query with filter of a financial year >>>  100ms

 >>> Aggregate Query on voucher when run on mongo takes 18000 ms (With accountids in filter)
 >>> Aggregate Query on voucher when run on mongo takes 2600 ms (Without accountids in filter)
 >>> Aggregate Query on voucher takes (150 ms -- 200ms)(With accountids in filter)
 >>> Aggregate Query on voucher takes 150 ms (Without accountids filter)

 */


/*
 // fields inclusion ,exclusion can be specified
 "_source": {
 "include":["gender_id"],
 "exclude": ["name"]
 }
 */


/*
 * {
 "bool" : {
 "must" :     [],  All of these clauses must match. The equivalent of AND
 "should" :   [],  At least one of these clauses must match. The equivalent of OR.
 "must_not" : [],  All of these clauses must not match. The equivalent of NOT.
 }
 }
 *
 * */


var url = "127.0.0.1:9200";
var elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
    host:url
});


//****************************************************** query in elastic search ************************************************************************************************************
// mapping of voucher
//{"properties":{"_id":{"type":"string","index":"not_analyzed"},"__key__":{"type":"string","index":"not_analyzed"},"business_unit_id":{"type":"object","properties":{"_id":{"type":"string","index":"not_analyzed"},"name":{"type":"string","index":"not_analyzed"}}},"cr_amount":{"type":"object","properties":{"amount":{"type":"double"},"type":{"type":"object","properties":{"_id":{"type":"string","index":"not_analyzed"},"currency":{"type":"string","index":"not_analyzed"}}}}},"dr_amount":{"type":"object","properties":{"amount":{"type":"double"},"type":{"type":"object","properties":{"_id":{"type":"string","index":"not_analyzed"},"currency":{"type":"string","index":"not_analyzed"}}}}},"location_id":{"type":"object","properties":{"_id":{"type":"string","index":"not_analyzed"},"name":{"type":"string","index":"not_analyzed"}}},"narration":{"type":"string","index":"not_analyzed"},"new_vocuher_no":{"type":"object","properties":{"series":{"type":"string","index":"not_analyzed"}}},"old_number":{"type":"string","index":"not_analyzed"},"source_id":{"type":"string","index":"not_analyzed"},"source_type":{"type":"string","index":"not_analyzed"},"source_type_temp":{"type":"string","index":"not_analyzed"},"voucher_date":{"type":"date"},"voucher_line_item":{"type":"nested","properties":{"_id":{"type":"string","index":"not_analyzed"},"_parentcolumn_":{"type":"string","index":"not_analyzed"},"account_id":{"type":"object","properties":{"_id":{"type":"string","index":"not_analyzed"},"name":{"type":"string","index":"not_analyzed"}}},"amount":{"type":"object","properties":{"amount":{"type":"double"},"type":{"type":"object","properties":{"_id":{"type":"string","index":"not_analyzed"},"currency":{"type":"string","index":"not_analyzed"}}}}},"cr_amount":{"type":"object","properties":{"amount":{"type":"double"},"type":{"type":"object","properties":{"_id":{"type":"string","index":"not_analyzed"},"currency":{"type":"string","index":"not_analyzed"}}}}},"dr_amount":{"type":"object","properties":{"amount":{"type":"double"},"type":{"type":"object","properties":{"_id":{"type":"string","index":"not_analyzed"},"currency":{"type":"string","index":"not_analyzed"}}}}},"business_unit_id":{"type":"object","properties":{"_id":{"type":"string","index":"not_analyzed"},"name":{"type":"string","index":"not_analyzed"}}},"location_id":{"type":"object","properties":{"_id":{"type":"string","index":"not_analyzed"},"name":{"type":"string","index":"not_analyzed"}}},"isreconcilied":{"type":"boolean"},"entity_id":{"type":"object","properties":{"_id":{"type":"string","index":"not_analyzed"},"name":{"type":"string","index":"not_analyzed"}}}}}}}


// put mapping in the voucherlineitems collection
client.indices.putMapping({index:"daffodilsw", type:"vouchers", "body":{
    "vouchers":{
        "properties":{"_id":{"type":"string", "index":"not_analyzed"}, "__key__":{"type":"string", "index":"not_analyzed"}, "business_unit_id":{"type":"object", "properties":{"_id":{"type":"string", "index":"not_analyzed"}, "name":{"type":"string", "index":"not_analyzed"}}}, "cr_amount":{"type":"object", "properties":{"amount":{"type":"double"}, "type":{"type":"object", "properties":{"_id":{"type":"string", "index":"not_analyzed"}, "currency":{"type":"string", "index":"not_analyzed"}}}}}, "dr_amount":{"type":"object", "properties":{"amount":{"type":"double"}, "type":{"type":"object", "properties":{"_id":{"type":"string", "index":"not_analyzed"}, "currency":{"type":"string", "index":"not_analyzed"}}}}}, "location_id":{"type":"object", "properties":{"_id":{"type":"string", "index":"not_analyzed"}, "name":{"type":"string", "index":"not_analyzed"}}}, "narration":{"type":"string", "index":"not_analyzed"}, "new_vocuher_no":{"type":"object", "properties":{"series":{"type":"string", "index":"not_analyzed"}}}, "old_number":{"type":"string", "index":"not_analyzed"}, "source_id":{"type":"string", "index":"not_analyzed"}, "source_type_temp":{"type":"string", "index":"not_analyzed"}, "voucher_date":{"type":"date"}, "voucher_line_item":{"type":"nested", "properties":{"_id":{"type":"string", "index":"not_analyzed"}, "_parentcolumn_":{"type":"string", "index":"not_analyzed"}, "account_id":{"type":"object", "properties":{"_id":{"type":"string", "index":"not_analyzed"}, "name":{"type":"string", "index":"not_analyzed"}}}, "amount":{"type":"object", "properties":{"amount":{"type":"double"}, "type":{"type":"object", "properties":{"_id":{"type":"string", "index":"not_analyzed"}, "currency":{"type":"string", "index":"not_analyzed"}}}}}, "cr_amount":{"type":"object", "properties":{"amount":{"type":"double"}, "type":{"type":"object", "properties":{"_id":{"type":"string", "index":"not_analyzed"}, "currency":{"type":"string", "index":"not_analyzed"}}}}}, "dr_amount":{"type":"object", "properties":{"amount":{"type":"double"}, "type":{"type":"object", "properties":{"_id":{"type":"string", "index":"not_analyzed"}, "currency":{"type":"string", "index":"not_analyzed"}}}}}, "business_unit_id":{"type":"object", "properties":{"_id":{"type":"string", "index":"not_analyzed"}, "name":{"type":"string", "index":"not_analyzed"}}}, "location_id":{"type":"object", "properties":{"_id":{"type":"string", "index":"not_analyzed"}, "name":{"type":"string", "index":"not_analyzed"}}}, "isreconcilied":{"type":"boolean"}, "entity_id":{"type":"object", "properties":{"_id":{"type":"string", "index":"not_analyzed"}, "name":{"type":"string", "index":"not_analyzed"}}}}}}  }
}
}, function (err, res) {
    console.log("err>>>" + err);
    console.log("res>>>>" + JSON.stringify(res));
})


/*
 client.indices.getMapping({
 index:"megacorp",
 type:"voucherlineitems",
 }, function (err, res) {
 console.log("err>>>>" + err);
 console.log("res>>>>" + JSON.stringify(res));
 })
 */

/*client.indices.clearCache({
 "index":"daffodilsw",
 "type":"voucherlineitems"}, function (err, res) {
 console.log("err>>" + err);
 console.log("res of clear cache>>>" + JSON.stringify(res));
 })*/


// sorting in the aggregation query
/*client.search({"index":"daffodilsw", "type":"voucherlineitems", searchType:"count", "body":{
 "aggs":{
 "all_accounts":{
 "terms":{
 "field":"account_id._id",
 "order":{"totalamount":"desc"},
 size:0
 },
 "aggs":{
 "totalamount":{
 "sum":{"field":"amount.amount"}
 }
 }
 }
 }
 }
 }).then(
 function (searchData) {
 console.log("serach Data>>>>>" + JSON.stringify(searchData));
 }).catch(function (err) {
 console.log("errr>>>>>>" + err);
 })*/


client.search({"index":"daffodilsw", "type":"voucher", searchType:"count", "body":{
    "aggs":{
        "voucher_line_item":{
            "nested":{
                "path":"voucher_line_item"
            }, "aggs":{
                "accountidsfilter":{
                    "filter":{
                        "terms":{
                            "voucher_line_item.account_id._id":["53a6658279df44bac98f953b", "546dc818e48a53b866eed00d", "53ae738479df44bac9b0b9b8", "53a6658479df44bac98f953e", "53a6659379df44bac98f953f", "53a6659379df44bac98f9540", "53a6659479df44bac98f9541", "53a6659779df44bac98f9545", "53a6659779df44bac98f9546", "53a6659b79df44bac98f954c", "53a6659c79df44bac98f954e", "53a6659e79df44bac98f954f", "53a6659e79df44bac98f9550", "53a6659f79df44bac98f9551", "53a6659f79df44bac98f9552", "53a665a179df44bac98f9553", "53a665a179df44bac98f9554", "53a665a279df44bac98f9555", "53a665a379df44bac98f9556", "53a665a379df44bac98f9557", "53a665a479df44bac98f9558", "53a665a579df44bac98f955a", "53a665a679df44bac98f955b", "53a665a779df44bac98f955c", "53a665a779df44bac98f955d", "53a665a879df44bac98f955f", "53a665aa79df44bac98f9561", "53a665ab79df44bac98f9564", "53a665ad79df44bac98f9569", "53a665ae79df44bac98f956c", "53a665af79df44bac98f956d", "53a665af79df44bac98f956e", "53a665b179df44bac98f9572", "53a665b179df44bac98f9573", "53a665b279df44bac98f9574", "53a665b279df44bac98f9575", "53a665b479df44bac98f9579", "53a665b579df44bac98f957c", "53a665b679df44bac98f957d", "53a665b779df44bac98f9580", "53ad5bbe79df44bac9b0b16c", "53ad5bc079df44bac9b0b173", "53ad5bc179df44bac9b0b175", "53ad5bc179df44bac9b0b177", "53ad5bc279df44bac9b0b179", "53ad5bc279df44bac9b0b17b", "53ad5bc379df44bac9b0b17f", "53ad5bc479df44bac9b0b182", "53ad5bc579df44bac9b0b184", "53ad5bc579df44bac9b0b186", "53ad5bc579df44bac9b0b188", "53ad5bc679df44bac9b0b18a", "53ad5bc679df44bac9b0b18c", "53ad5bc779df44bac9b0b18e", "53ad5bc779df44bac9b0b190", "53ad5bc879df44bac9b0b192", "53ad5bc879df44bac9b0b194", "53ad5bc979df44bac9b0b196", "53ad5bca79df44bac9b0b19b", "53ad5bcb79df44bac9b0b19d", "53ad5bcd79df44bac9b0b1a7", "54be1fe788e6504e1384bc70", "53ad5bcc79df44bac9b0b19f", "53ad5bcc79df44bac9b0b1a3", "53ad5bcd79df44bac9b0b1a5", "53ad5bce79df44bac9b0b1a9", "53ad5bce79df44bac9b0b1ab", "53ad5bcf79df44bac9b0b1ad", "53ad5bd079df44bac9b0b1af", "53ad5bd179df44bac9b0b1b3", "53ad5bd179df44bac9b0b1b5", "53ad5d7679df44bac9b0b1b7", "53ad5d7879df44bac9b0b1b8", "53ad5d7a79df44bac9b0b1b9", "53ad5d7c79df44bac9b0b1ba", "53ad5d7e79df44bac9b0b1bb", "53ad5d8079df44bac9b0b1bc", "53ad5d8879df44bac9b0b1bd", "53ad5d8b79df44bac9b0b1be", "53ad5d8d79df44bac9b0b1bf", "53ad5d9679df44bac9b0b1c0", "53ad5d9b79df44bac9b0b1c1", "53ad5da279df44bac9b0b1c3", "53ad5da479df44bac9b0b1c4", "53ad5da779df44bac9b0b1c5", "53ad5da979df44bac9b0b1c6", "53ad5dac79df44bac9b0b1c7", "53ad5dae79df44bac9b0b1c8", "53ad5db579df44bac9b0b1c9", "53ad5db779df44bac9b0b1ca", "53ad5db979df44bac9b0b1cb", "53ad5dbf79df44bac9b0b1cc", "53ad5dc179df44bac9b0b1cd", "53ad5dc379df44bac9b0b1ce", "53ad5dc779df44bac9b0b1cf", "53ad5dd879df44bac9b0b1d0", "53ad5ddb79df44bac9b0b1d1", "53ad5de179df44bac9b0b1d2", "53ad5deb79df44bac9b0b1d3", "53ad5dee79df44bac9b0b1d4", "53ad5df479df44bac9b0b1d5", "53ad5df779df44bac9b0b1d6", "53ad5dfd79df44bac9b0b1d8", "53ad5dff79df44bac9b0b1d9", "53ad5e0679df44bac9b0b1db", "53ad5e0879df44bac9b0b1dc", "53ad5e0979df44bac9b0b1dd", "53ad5e0b79df44bac9b0b1de", "53ad5e0d79df44bac9b0b1df", "53ad5e1179df44bac9b0b1e0", "53ad5e1379df44bac9b0b1e1", "53ad5e1479df44bac9b0b1e2", "53ad5e1779df44bac9b0b1e3", "53ad5e1b79df44bac9b0b1e5", "53ad5e1c79df44bac9b0b1e6", "53ad5e1e79df44bac9b0b1e7", "53ad5e2179df44bac9b0b1e8", "53ad5e2479df44bac9b0b1e9", "53ad5e2a79df44bac9b0b1ea", "53ad5e2b79df44bac9b0b1eb", "53ad5e3079df44bac9b0b1ec", "53ad5e3179df44bac9b0b1ed", "53ad5e3579df44bac9b0b1ee", "53ad5e3979df44bac9b0b1ef", "53ad5e3b79df44bac9b0b1f0", "53ad5e4579df44bac9b0b1f1", "53ad5e4979df44bac9b0b1f2", "53ad5e5379df44bac9b0b1f3", "53ad5e5779df44bac9b0b1f4", "53ad5e5879df44bac9b0b1f5", "53ad5e5c79df44bac9b0b1f6", "53ad5e5f79df44bac9b0b1f7", "53ad5e6379df44bac9b0b1f8", "53ad5e6e79df44bac9b0b1f9", "53ad5e6f79df44bac9b0b1fa", "53ad5e7279df44bac9b0b1fb", "53ad5e7479df44bac9b0b1fc", "53ad5e7579df44bac9b0b1fd", "53ad5e7979df44bac9b0b1ff", "53ad5e7c79df44bac9b0b200", "53ad5e7e79df44bac9b0b201", "53ad5e7f79df44bac9b0b202", "53ad5e8079df44bac9b0b203", "53ad5e8279df44bac9b0b204", "53ad5e8479df44bac9b0b205", "53ad5e8579df44bac9b0b206", "53ad5e8e79df44bac9b0b207", "53ad5e9079df44bac9b0b208", "53ad5e9379df44bac9b0b209", "53ad5e9579df44bac9b0b20a", "53ad5e9879df44bac9b0b20b", "53ad5ea279df44bac9b0b20c", "53ad5ea379df44bac9b0b20d", "53ad5ea779df44bac9b0b20e", "53ad5eab79df44bac9b0b20f", "53ad5eae79df44bac9b0b210", "53ad5eb079df44bac9b0b211", "53ad5eb479df44bac9b0b212", "53ad5eb579df44bac9b0b213", "53ad5eb879df44bac9b0b214", "53ad5eba79df44bac9b0b215", "53ad5ec079df44bac9b0b216", "53ad5ec379df44bac9b0b217", "53ad5ec579df44bac9b0b218", "53ad5ec679df44bac9b0b219", "53ad5ec879df44bac9b0b21a", "53ad5ecb79df44bac9b0b21b", "53ad5ecd79df44bac9b0b21c", "53ad5ecf79df44bac9b0b21d", "53ad5ed079df44bac9b0b21e", "53ad5ed279df44bac9b0b21f", "53ad5ed779df44bac9b0b220", "53ad5edd79df44bac9b0b221", "53ad5edf79df44bac9b0b222", "53ad5ee279df44bac9b0b223", "53ad5ee579df44bac9b0b224", "53ad5ee779df44bac9b0b225", "53ad5ee979df44bac9b0b226", "53ad5eeb79df44bac9b0b227", "53ad5eee79df44bac9b0b228", "53ad752f79df44bac9b0b229", "53ad753179df44bac9b0b22a", "53ad753379df44bac9b0b22b", "53ad753479df44bac9b0b22c", "53ad753679df44bac9b0b22d", "53ad753979df44bac9b0b22e", "53ad753e79df44bac9b0b22f", "53ad754179df44bac9b0b230", "53ad754379df44bac9b0b231", "53ad754679df44bac9b0b232", "53ad754879df44bac9b0b233", "54ba0b8a01fe7c50135c7056", "53ad754a79df44bac9b0b234", "53ad754b79df44bac9b0b235", "53ad754d79df44bac9b0b236", "53ad755079df44bac9b0b237", "53ad755179df44bac9b0b238", "53ad755379df44bac9b0b239", "53ad755679df44bac9b0b23a", "53ad755979df44bac9b0b23b", "53ad756179df44bac9b0b23c", "53ad756379df44bac9b0b23d", "53ad756579df44bac9b0b23f", "53ad756679df44bac9b0b240", "53ad756879df44bac9b0b241", "53ad756979df44bac9b0b242", "53ad756b79df44bac9b0b243", "53ad756d79df44bac9b0b244", "53ad756e79df44bac9b0b245", "53ad757079df44bac9b0b246", "53ad757179df44bac9b0b247", "53ad757379df44bac9b0b248", "53ad757579df44bac9b0b249", "53ad757679df44bac9b0b24a", "53ad757779df44bac9b0b24b", "53ad757979df44bac9b0b24c", "53ad757a79df44bac9b0b24d", "53ad757c79df44bac9b0b24e", "53ad757d79df44bac9b0b24f", "53ad757f79df44bac9b0b250", "53ad758079df44bac9b0b251", "53ad758279df44bac9b0b252", "53ad758379df44bac9b0b253", "53ad758579df44bac9b0b254", "53ad758679df44bac9b0b255", "53ad758979df44bac9b0b256", "53ad758a79df44bac9b0b257", "53ad758b79df44bac9b0b258", "53ad758d79df44bac9b0b259", "53ad758f79df44bac9b0b25a", "53ad759179df44bac9b0b25b", "53ad759279df44bac9b0b25c", "53ad759379df44bac9b0b25d", "53ad759579df44bac9b0b25e", "53ad759679df44bac9b0b25f", "53ad759879df44bac9b0b260", "53ad759c79df44bac9b0b261", "53ad759d79df44bac9b0b262", "53ad759f79df44bac9b0b263", "53ad75a279df44bac9b0b264", "53ad75a379df44bac9b0b265", "53ad75a479df44bac9b0b266", "53ad75a679df44bac9b0b267", "53ad75a779df44bac9b0b268", "53ad75a979df44bac9b0b269", "53ad75aa79df44bac9b0b26a", "53ad75ac79df44bac9b0b26b", "53ad75ae79df44bac9b0b26c", "53ad75b079df44bac9b0b26d", "53ad75b279df44bac9b0b26e", "53ad75b379df44bac9b0b26f", "53ad75b579df44bac9b0b270", "53ad75b679df44bac9b0b271", "53ad75b779df44bac9b0b272", "53ad75b979df44bac9b0b273", "53ad75ba79df44bac9b0b274", "53ad75bc79df44bac9b0b275", "53ad75bd79df44bac9b0b276", "53ad75bf79df44bac9b0b277", "53ad75c179df44bac9b0b278", "53ad75c279df44bac9b0b279", "53ad75c479df44bac9b0b27a", "53ad75c579df44bac9b0b27b", "53ad75c679df44bac9b0b27c", "53ad75c979df44bac9b0b27d", "53ad75cb79df44bac9b0b27e", "53ad75ce79df44bac9b0b27f", "53ad75cf79df44bac9b0b280", "53ad75d279df44bac9b0b281", "53ad75d379df44bac9b0b282", "53ad75d579df44bac9b0b283", "53ad75d679df44bac9b0b284", "53ad75d879df44bac9b0b285", "53ad75db79df44bac9b0b286", "53ad75e179df44bac9b0b287", "53ad75e579df44bac9b0b289", "53ad75e779df44bac9b0b28a", "53ad75e879df44bac9b0b28b", "53ad75e979df44bac9b0b28c", "53ad75eb79df44bac9b0b28d", "53ad75ec79df44bac9b0b28e", "53ad75ee79df44bac9b0b28f", "53ad75ef79df44bac9b0b290", "53ad75f179df44bac9b0b291", "53ad75f479df44bac9b0b292", "53ad75fb79df44bac9b0b293", "53ad760479df44bac9b0b294", "53ad760579df44bac9b0b295", "53ad760879df44bac9b0b296", "53ad760a79df44bac9b0b297", "53ad760e79df44bac9b0b298", "53ad760f79df44bac9b0b299", "53ad761179df44bac9b0b29a", "53ad761479df44bac9b0b29b", "53ad761c79df44bac9b0b29d", "53ad761f79df44bac9b0b29e", "53ad762979df44bac9b0b29f", "53ad762a79df44bac9b0b2a0", "53ad762c79df44bac9b0b2a1", "53ad762d79df44bac9b0b2a2", "53ad762f79df44bac9b0b2a3", "53ad763279df44bac9b0b2a4", "53ad763379df44bac9b0b2a5", "53ad763479df44bac9b0b2a6", "53ad763679df44bac9b0b2a7", "53ad763779df44bac9b0b2a8", "53ad763979df44bac9b0b2a9", "53ad763c79df44bac9b0b2aa", "53ad763d79df44bac9b0b2ab", "53ad763f79df44bac9b0b2ac", "53ad764079df44bac9b0b2ad", "53ad764179df44bac9b0b2ae", "53ad764379df44bac9b0b2af", "53ad764479df44bac9b0b2b0", "53ad764579df44bac9b0b2b1", "53ad764779df44bac9b0b2b2", "53ad764879df44bac9b0b2b3", "53ad764a79df44bac9b0b2b4", "53ad764b79df44bac9b0b2b5", "53ad764d79df44bac9b0b2b6", "53ad764e79df44bac9b0b2b7", "53ad764f79df44bac9b0b2b8", "53ad765179df44bac9b0b2b9", "53ad765279df44bac9b0b2ba", "53ad765479df44bac9b0b2bb", "53ad765579df44bac9b0b2bc", "53ad765679df44bac9b0b2bd", "53ad765779df44bac9b0b2be", "53ad765979df44bac9b0b2bf", "53ad765a79df44bac9b0b2c0", "53ad765b79df44bac9b0b2c1", "53ad765c79df44bac9b0b2c2", "53ad765e79df44bac9b0b2c3", "53ad765f79df44bac9b0b2c4", "53ad766179df44bac9b0b2c5", "53ad766279df44bac9b0b2c6", "53ad766379df44bac9b0b2c7", "53ad766479df44bac9b0b2c8", "53ad766679df44bac9b0b2c9", "53ad766779df44bac9b0b2ca", "53ad766879df44bac9b0b2cb", "53ad766979df44bac9b0b2cc", "53ad766b79df44bac9b0b2cd", "53ad766c79df44bac9b0b2ce", "53ad766d79df44bac9b0b2cf", "53ad766f79df44bac9b0b2d0", "53ad767079df44bac9b0b2d1", "53ad767279df44bac9b0b2d2", "53ad767479df44bac9b0b2d3", "53ad767679df44bac9b0b2d4", "53ad767779df44bac9b0b2d5", "53ad767879df44bac9b0b2d6", "53ad767a79df44bac9b0b2d7", "53ad767b79df44bac9b0b2d8", "53ad767d79df44bac9b0b2d9", "53ad767e79df44bac9b0b2da", "53ad767f79df44bac9b0b2db", "53ad768179df44bac9b0b2dc", "53ad768379df44bac9b0b2dd", "53ad768479df44bac9b0b2de", "53ad768679df44bac9b0b2df", "53ad768779df44bac9b0b2e0", "53ad768879df44bac9b0b2e1", "53ad768a79df44bac9b0b2e2", "53ad768b79df44bac9b0b2e3", "53ad768e79df44bac9b0b2e4", "53ad768f79df44bac9b0b2e5", "53ad769179df44bac9b0b2e6", "53ad769279df44bac9b0b2e7", "53ad769379df44bac9b0b2e8", "53ad769579df44bac9b0b2e9", "53ad769679df44bac9b0b2ea", "53ad769779df44bac9b0b2eb", "53ad769879df44bac9b0b2ec", "53ad769a79df44bac9b0b2ed", "53ad769b79df44bac9b0b2ee", "53ad769c79df44bac9b0b2ef", "53ad769e79df44bac9b0b2f0", "53ad769f79df44bac9b0b2f1", "53ad76a079df44bac9b0b2f2", "53ad76a379df44bac9b0b2f4", "53ad76a479df44bac9b0b2f5", "53ad76a679df44bac9b0b2f6", "53ad76a779df44bac9b0b2f7", "53ad76a979df44bac9b0b2f8", "53ad76aa79df44bac9b0b2f9", "53ad76ab79df44bac9b0b2fa", "53ad76ad79df44bac9b0b2fb", "53ad76ae79df44bac9b0b2fc", "53ad76b179df44bac9b0b2fd", "53ad76b279df44bac9b0b2fe", "53ad76b479df44bac9b0b2ff", "53ad76b579df44bac9b0b300", "53ad76b679df44bac9b0b301", "53ad76b979df44bac9b0b302", "53ad76ba79df44bac9b0b303", "53ad76bc79df44bac9b0b304", "53ad76bd79df44bac9b0b305", "53ad76be79df44bac9b0b306", "53ad76c079df44bac9b0b307", "53ad76c179df44bac9b0b308", "53ad76c279df44bac9b0b309", "53ad76c479df44bac9b0b30a", "53ad76c579df44bac9b0b30b", "53ad76c679df44bac9b0b30c", "53ad76c879df44bac9b0b30d", "53ad76c979df44bac9b0b30e", "53ad76cb79df44bac9b0b30f", "53ad76cc79df44bac9b0b310", "53ad76cd79df44bac9b0b311", "53ad76cf79df44bac9b0b312", "53ad76d079df44bac9b0b313", "53ad76d179df44bac9b0b314", "53ad76d379df44bac9b0b315", "53ad76d479df44bac9b0b316", "53ad76d579df44bac9b0b317", "53ad76d779df44bac9b0b318", "53ad76d879df44bac9b0b319", "53ad76d979df44bac9b0b31a", "53ad76db79df44bac9b0b31b", "53ad76dc79df44bac9b0b31c", "53ad76dd79df44bac9b0b31d", "53ad76df79df44bac9b0b31e", "53ad76e079df44bac9b0b31f", "53ad76e179df44bac9b0b320", "53ad76e379df44bac9b0b321", "53ad76e479df44bac9b0b322", "53ad76e579df44bac9b0b323", "53ad76e779df44bac9b0b324", "53ad76e979df44bac9b0b325", "53ad76eb79df44bac9b0b326", "53ad76ec79df44bac9b0b327", "53ad76ed79df44bac9b0b328", "53ad76ef79df44bac9b0b329", "53ad76f079df44bac9b0b32a", "53ad76f179df44bac9b0b32b", "53ad76f279df44bac9b0b32c", "53ad76f479df44bac9b0b32d", "53ad76f579df44bac9b0b32e", "53ad76f779df44bac9b0b32f", "53ad76f879df44bac9b0b330", "53ad76fa79df44bac9b0b331", "53ad76fb79df44bac9b0b332", "53ad76fc79df44bac9b0b333", "53ad76fe79df44bac9b0b334", "53ad76ff79df44bac9b0b335", "53ad770079df44bac9b0b336", "53ad770279df44bac9b0b337", "53ad770379df44bac9b0b338", "53ad770479df44bac9b0b339", "53ad770679df44bac9b0b33a", "53ad770779df44bac9b0b33b", "53ad770a79df44bac9b0b33c", "53ad770b79df44bac9b0b33d", "53ad770d79df44bac9b0b33e", "53ad770f79df44bac9b0b33f", "53ad771179df44bac9b0b340", "53ad771279df44bac9b0b341", "53ad771379df44bac9b0b342", "53ad771579df44bac9b0b343", "53ad771679df44bac9b0b344", "53ad771879df44bac9b0b345", "53ad771979df44bac9b0b346", "53ad771a79df44bac9b0b347", "53ad771d79df44bac9b0b348", "53ad771e79df44bac9b0b349", "53ad772079df44bac9b0b34a", "53ad772179df44bac9b0b34b", "53ad772279df44bac9b0b34c", "53ad772479df44bac9b0b34d", "53ad772579df44bac9b0b34e", "53ad772679df44bac9b0b34f", "53ad772879df44bac9b0b350", "53ad772979df44bac9b0b351", "53ad772b79df44bac9b0b352", "53ad772e79df44bac9b0b354", "53ad773279df44bac9b0b357", "53ad773479df44bac9b0b358", "53ad773579df44bac9b0b359", "53ad773a79df44bac9b0b35a", "53ad773c79df44bac9b0b35b", "53ad773d79df44bac9b0b35c", "53ad774079df44bac9b0b35d", "53ad774179df44bac9b0b35e", "53ad774279df44bac9b0b35f", "53ad774479df44bac9b0b360", "53ad774579df44bac9b0b361", "53ad774679df44bac9b0b362", "53ad774879df44bac9b0b363", "53ad774979df44bac9b0b364", "53ad774a79df44bac9b0b365", "53ad774d79df44bac9b0b366", "53ad774e79df44bac9b0b367", "53ad775079df44bac9b0b368", "53ad775179df44bac9b0b369", "53ad775279df44bac9b0b36a", "53ad775379df44bac9b0b36b", "53ad775579df44bac9b0b36c", "53ad775679df44bac9b0b36d", "53ad775879df44bac9b0b36e", "53ad775979df44bac9b0b36f", "53ad775a79df44bac9b0b370", "53ad775b79df44bac9b0b371", "53ad775d79df44bac9b0b372", "53ad775e79df44bac9b0b373", "53ad775f79df44bac9b0b374", "53ad776179df44bac9b0b375", "53ad776279df44bac9b0b376", "53ad776379df44bac9b0b377", "53ad776479df44bac9b0b378", "53ad776679df44bac9b0b379", "53ad776779df44bac9b0b37a", "53ad776879df44bac9b0b37b", "53ad776a79df44bac9b0b37c", "53ad776b79df44bac9b0b37d", "53ad776c79df44bac9b0b37e", "53ad776e79df44bac9b0b37f", "53ad776f79df44bac9b0b380", "53ad777179df44bac9b0b381", "53ad777279df44bac9b0b382", "53ad777479df44bac9b0b383", "53ad777679df44bac9b0b384", "53ad777779df44bac9b0b385", "53ad777979df44bac9b0b386", "53ad777a79df44bac9b0b387", "53ad777b79df44bac9b0b388", "53ad777d79df44bac9b0b389", "53ad777e79df44bac9b0b38a", "53ad778079df44bac9b0b38b", "53ad778179df44bac9b0b38c", "53ad778379df44bac9b0b38d", "53ad778479df44bac9b0b38e", "53ad778579df44bac9b0b38f", "53ad778779df44bac9b0b390", "53ad778879df44bac9b0b391", "53ad778979df44bac9b0b392", "53ad778a79df44bac9b0b393", "53ad778c79df44bac9b0b394", "53ad778d79df44bac9b0b395", "53ad778e79df44bac9b0b396", "53ad779079df44bac9b0b397", "53ad779179df44bac9b0b398", "53ad779279df44bac9b0b399", "53ad779479df44bac9b0b39a", "53ad779579df44bac9b0b39b", "53ad779779df44bac9b0b39c", "53ad779879df44bac9b0b39d", "53ad779979df44bac9b0b39e", "53ad779a79df44bac9b0b39f", "53ad779c79df44bac9b0b3a0", "53ad779d79df44bac9b0b3a1", "53ad779e79df44bac9b0b3a2", "53ad77a079df44bac9b0b3a3", "53ad77a179df44bac9b0b3a4", "53ad77a279df44bac9b0b3a5", "53ad77a479df44bac9b0b3a6", "53ad77a579df44bac9b0b3a7", "53ad77a679df44bac9b0b3a8", "53ad77a779df44bac9b0b3a9", "53ad77a979df44bac9b0b3aa", "53ad77aa79df44bac9b0b3ab", "53ad77ab79df44bac9b0b3ac", "53ad77ad79df44bac9b0b3ad", "53ad77ae79df44bac9b0b3ae", "53ad77af79df44bac9b0b3af", "53ad77b179df44bac9b0b3b0", "53ad77b279df44bac9b0b3b1", "53ad77b379df44bac9b0b3b2", "53ad77b579df44bac9b0b3b3", "53ad77b679df44bac9b0b3b4", "53ad77b879df44bac9b0b3b5", "53ad77b979df44bac9b0b3b6", "53ad77ba79df44bac9b0b3b7", "53ad77bc79df44bac9b0b3b8", "53ad77bd79df44bac9b0b3b9", "53ad77be79df44bac9b0b3ba", "53ad77c079df44bac9b0b3bc", "53ad77c179df44bac9b0b3bd", "53ad77c279df44bac9b0b3be", "53ad77c379df44bac9b0b3c0", "53ad77c579df44bac9b0b3c1", "53ad77c679df44bac9b0b3c2", "53ad77c779df44bac9b0b3c3", "53ad77c979df44bac9b0b3c4", "53ad77ca79df44bac9b0b3c5", "53ad77cb79df44bac9b0b3c6", "53ad77ce79df44bac9b0b3c7", "53ad77cf79df44bac9b0b3c8", "53ad77d079df44bac9b0b3c9", "53ad77d279df44bac9b0b3ca", "53ad77d379df44bac9b0b3cb", "53ad77d479df44bac9b0b3cc", "53ad77d679df44bac9b0b3cd", "53ad77d779df44bac9b0b3ce", "53ad77d879df44bac9b0b3cf", "53ad77da79df44bac9b0b3d0", "53ad77db79df44bac9b0b3d1", "53ad77dc79df44bac9b0b3d2", "53ad77de79df44bac9b0b3d3", "53ad77df79df44bac9b0b3d4", "53ad77e079df44bac9b0b3d5", "53ad77e279df44bac9b0b3d6", "53ad77e379df44bac9b0b3d7", "53ad77e479df44bac9b0b3d8", "53ad77e679df44bac9b0b3d9", "53ad77e779df44bac9b0b3da", "53ad77e879df44bac9b0b3db", "53ad77eb79df44bac9b0b3dc", "53ad77ec79df44bac9b0b3dd", "53ad77ed79df44bac9b0b3de", "53ad77ef79df44bac9b0b3df", "53ad77f079df44bac9b0b3e0", "53ad77f279df44bac9b0b3e1", "53ad77f379df44bac9b0b3e2", "53ad77f579df44bac9b0b3e3", "53ad77f679df44bac9b0b3e4", "53ad77f879df44bac9b0b3e5", "53ad77f979df44bac9b0b3e6", "53ad77fc79df44bac9b0b3e7", "53ad77fd79df44bac9b0b3e8", "53ad77ff79df44bac9b0b3e9", "53ad780179df44bac9b0b3ea", "53ad780279df44bac9b0b3eb", "53ad780379df44bac9b0b3ec", "53ad780579df44bac9b0b3ed", "53ad780679df44bac9b0b3ee", "53ad780779df44bac9b0b3ef", "53ad780879df44bac9b0b3f0", "53ad780a79df44bac9b0b3f1", "53ad780b79df44bac9b0b3f2", "53ad780d79df44bac9b0b3f3", "53ad780e79df44bac9b0b3f4", "53ad780f79df44bac9b0b3f5", "53ad781079df44bac9b0b3f6", "53ad781679df44bac9b0b3f7", "53ad781879df44bac9b0b3f8", "53ad781979df44bac9b0b3f9", "53ad781a79df44bac9b0b3fa", "53ad781c79df44bac9b0b3fb", "53ad781d79df44bac9b0b3fc", "53ad781e79df44bac9b0b3fd", "53ad781f79df44bac9b0b3fe", "53ad782179df44bac9b0b3ff", "53ad782479df44bac9b0b400", "53ad782579df44bac9b0b401", "53ad782679df44bac9b0b402", "53ad782879df44bac9b0b403", "53ad782979df44bac9b0b404", "53ad782a79df44bac9b0b405", "53ad782d79df44bac9b0b406", "53ad783079df44bac9b0b408", "53ad783179df44bac9b0b409", "53ad783279df44bac9b0b40a", "53ad783479df44bac9b0b40b", "53ad783579df44bac9b0b40c", "53ad783779df44bac9b0b40d", "53ad783879df44bac9b0b40e", "53ad783a79df44bac9b0b40f", "53ad783b79df44bac9b0b410", "53ad783f79df44bac9b0b412", "53ad784079df44bac9b0b413", "53ad784479df44bac9b0b414", "53ad784579df44bac9b0b415", "53ad784779df44bac9b0b416", "53ad784879df44bac9b0b417", "53ad784979df44bac9b0b418", "53ad784b79df44bac9b0b419", "53ad784c79df44bac9b0b41a", "53ad784e79df44bac9b0b41b", "53ad785079df44bac9b0b41c", "53ad785179df44bac9b0b41d", "53ad785279df44bac9b0b41e", "53ad785379df44bac9b0b41f", "53ad785579df44bac9b0b420", "53ad785679df44bac9b0b421", "53ad785779df44bac9b0b422", "53ad785879df44bac9b0b423", "53ad785a79df44bac9b0b424", "53ad785b79df44bac9b0b425", "53ad785c79df44bac9b0b426", "53ad785d79df44bac9b0b427", "53ad786079df44bac9b0b428", "53ad786379df44bac9b0b429", "53ad786479df44bac9b0b42a", "53ad786679df44bac9b0b42b", "53ad786779df44bac9b0b42c", "53ad786879df44bac9b0b42d", "53ad786a79df44bac9b0b42e", "53ad786c79df44bac9b0b42f", "53ad786d79df44bac9b0b430", "53ad786f79df44bac9b0b431", "53ad787079df44bac9b0b432", "53ad787179df44bac9b0b433", "53ad787279df44bac9b0b434", "53ad787379df44bac9b0b435", "53ad787679df44bac9b0b436", "53ad787779df44bac9b0b437", "53ad787879df44bac9b0b438", "53ad787979df44bac9b0b439", "53ad787b79df44bac9b0b43a", "53ad787c79df44bac9b0b43b", "53ad787d79df44bac9b0b43c", "53ad787e79df44bac9b0b43d", "53ad788079df44bac9b0b43e", "53ad788179df44bac9b0b43f", "54b50a0e90f43df023269b8d", "53ad788479df44bac9b0b440", "53ad788579df44bac9b0b441", "53ad788679df44bac9b0b442", "53ad788c79df44bac9b0b445", "53ad788e79df44bac9b0b446", "53ad788f79df44bac9b0b447", "53ad789079df44bac9b0b448", "53ad789279df44bac9b0b449", "53ad789379df44bac9b0b44a", "53ad789479df44bac9b0b44b", "53ad789679df44bac9b0b44c", "53ad789779df44bac9b0b44d", "53ad789879df44bac9b0b44e", "53ad789a79df44bac9b0b44f", "53ad789b79df44bac9b0b450", "53ad789d79df44bac9b0b451", "53ad789e79df44bac9b0b452", "53ad789f79df44bac9b0b453", "53ad78a279df44bac9b0b454", "53ad78a379df44bac9b0b455", "53ad78a479df44bac9b0b456", "53ad78a879df44bac9b0b457", "53ad78a979df44bac9b0b458", "53ad78ab79df44bac9b0b459", "53ad78ad79df44bac9b0b45a", "53ad78b179df44bac9b0b45b", "53ad78b279df44bac9b0b45c", "53ad78b379df44bac9b0b45d", "53ad78b479df44bac9b0b45e", "53ad78b679df44bac9b0b45f", "53ad78b779df44bac9b0b460", "53ad78b879df44bac9b0b461", "53ad78ba79df44bac9b0b462", "53ad78bc79df44bac9b0b463", "53ad78bd79df44bac9b0b464", "53ad78c079df44bac9b0b465", "53ad78c179df44bac9b0b466", "53ad78c379df44bac9b0b467", "53ad78c479df44bac9b0b468", "53ad78c679df44bac9b0b469", "53ad78c779df44bac9b0b46a", "53ad78ca79df44bac9b0b46b", "53ad78cb79df44bac9b0b46c", "53ad78cc79df44bac9b0b46d", "53ad78cd79df44bac9b0b46e", "53ad78cf79df44bac9b0b46f", "53ad78d079df44bac9b0b470", "53ad78d179df44bac9b0b471", "53ad78d279df44bac9b0b472", "53ad78d479df44bac9b0b473", "53ad78d579df44bac9b0b474", "53ad78d679df44bac9b0b475", "53ad78d779df44bac9b0b476", "53ad78d979df44bac9b0b477", "53ad78da79df44bac9b0b478", "53ad78de79df44bac9b0b47a", "53ad78df79df44bac9b0b47b", "53ad78e079df44bac9b0b47c", "53ad78e279df44bac9b0b47d", "53ad78e379df44bac9b0b47e", "53ad78e479df44bac9b0b47f", "53ad78e579df44bac9b0b480", "53ad78e779df44bac9b0b481", "53ad78e979df44bac9b0b483", "53ad78eb79df44bac9b0b484", "53ad78ec79df44bac9b0b485", "53ad78ed79df44bac9b0b486", "53ad78ee79df44bac9b0b487", "53ad78f079df44bac9b0b488", "53ad78f279df44bac9b0b489", "53ad78f479df44bac9b0b48a", "53ad78f579df44bac9b0b48b", "53ad790479df44bac9b0b48c", "53ad790679df44bac9b0b48d", "53ad790879df44bac9b0b48e", "53ad790b79df44bac9b0b48f", "53ad790d79df44bac9b0b490", "53ad791279df44bac9b0b491", "53ad791379df44bac9b0b492", "53ad791879df44bac9b0b493", "53ad791979df44bac9b0b494", "53ad791b79df44bac9b0b495", "53ad791c79df44bac9b0b496", "53ad791e79df44bac9b0b498", "53ad791f79df44bac9b0b499", "53ad792079df44bac9b0b49a", "53ad792179df44bac9b0b49b", "53ad792479df44bac9b0b49c", "53ad792679df44bac9b0b49d", "53ad792779df44bac9b0b49e", "53ad792979df44bac9b0b49f", "53ad792a79df44bac9b0b4a0", "53ad792b79df44bac9b0b4a1", "53ad792c79df44bac9b0b4a2", "53ad792d79df44bac9b0b4a3", "53ad792f79df44bac9b0b4a4", "53ad793079df44bac9b0b4a5", "53ad793179df44bac9b0b4a6", "53ad793279df44bac9b0b4a7", "53ad793479df44bac9b0b4a8", "53ad793579df44bac9b0b4a9", "53ad793879df44bac9b0b4aa", "53ad793979df44bac9b0b4ab", "53ad793b79df44bac9b0b4ac", "53ad793c79df44bac9b0b4ad", "53ad793d79df44bac9b0b4ae", "53ad794079df44bac9b0b4af", "53ad794179df44bac9b0b4b0", "53ad794279df44bac9b0b4b1", "53ad794479df44bac9b0b4b2", "53ad794579df44bac9b0b4b3", "53ad794679df44bac9b0b4b4", "53ad794879df44bac9b0b4b5", "53ad794979df44bac9b0b4b6", "53ad794b79df44bac9b0b4b7", "53ad794c79df44bac9b0b4b8", "53ad794d79df44bac9b0b4b9", "53ad794e79df44bac9b0b4ba", "53ad795079df44bac9b0b4bb", "53ad795279df44bac9b0b4bc", "53ad795479df44bac9b0b4bd", "53ad795579df44bac9b0b4be", "53ad795679df44bac9b0b4bf", "53ad795879df44bac9b0b4c0", "53ad795b79df44bac9b0b4c1", "53ad795c79df44bac9b0b4c2", "53ad795d79df44bac9b0b4c3", "53ad795f79df44bac9b0b4c4", "53ad796079df44bac9b0b4c6", "53ad796179df44bac9b0b4c7", "53ad796379df44bac9b0b4c8", "53ad797479df44bac9b0b4c9", "53ad797679df44bac9b0b4ca", "53ad797779df44bac9b0b4cb", "53ad797879df44bac9b0b4cc", "53ad797a79df44bac9b0b4cd", "53ad797b79df44bac9b0b4ce", "53ad797d79df44bac9b0b4cf", "53ad797f79df44bac9b0b4d0", "53ad798079df44bac9b0b4d1", "53ad798179df44bac9b0b4d2", "53ad798379df44bac9b0b4d3", "53ad798579df44bac9b0b4d4", "53ad798779df44bac9b0b4d5", "53ad798879df44bac9b0b4d6", "53ad798979df44bac9b0b4d7", "53ad798b79df44bac9b0b4d8", "53ad799179df44bac9b0b4d9", "53ad799579df44bac9b0b4da", "53ad799779df44bac9b0b4db", "53ad799879df44bac9b0b4dc", "53ad799979df44bac9b0b4dd", "53ad799a79df44bac9b0b4de", "53ad799b79df44bac9b0b4df", "53ad799d79df44bac9b0b4e0", "53ad799e79df44bac9b0b4e1", "53ad799f79df44bac9b0b4e2", "53ad79a179df44bac9b0b4e3", "53ad79a379df44bac9b0b4e4", "53ad79a479df44bac9b0b4e5", "53ad79a679df44bac9b0b4e6", "53ad79a779df44bac9b0b4e7", "53ad79a979df44bac9b0b4e8", "53ad79aa79df44bac9b0b4e9", "53ad79ab79df44bac9b0b4ea", "53ad79ad79df44bac9b0b4eb", "53ad79ae79df44bac9b0b4ec", "53ad79af79df44bac9b0b4ed", "53ad79b279df44bac9b0b4ee", "53ad79b679df44bac9b0b4ef", "53ad79b779df44bac9b0b4f0", "53ad79b879df44bac9b0b4f1", "53ad79b979df44bac9b0b4f2", "53ad79bb79df44bac9b0b4f3", "53ad79bc79df44bac9b0b4f4", "53ad79bd79df44bac9b0b4f5", "53ad79bf79df44bac9b0b4f6", "53ad79c279df44bac9b0b4f7", "53ad79c379df44bac9b0b4f8", "53ad79c579df44bac9b0b4f9", "53ad79ca79df44bac9b0b4fb", "53ad79cc79df44bac9b0b4fc", "53ad79cd79df44bac9b0b4fd", "53ad79cf79df44bac9b0b4fe", "53ad79d279df44bac9b0b4ff", "53ad79d679df44bac9b0b500", "53ad79d779df44bac9b0b501", "53ad79d979df44bac9b0b502", "53ad79db79df44bac9b0b503", "53ad79dc79df44bac9b0b504", "53ad79e179df44bac9b0b505", "53ad79e379df44bac9b0b506", "53ad79e479df44bac9b0b507", "53ad79e579df44bac9b0b508", "53ad79e679df44bac9b0b509", "53ad79ea79df44bac9b0b50a", "53ad79eb79df44bac9b0b50b", "53ad79ed79df44bac9b0b50c", "53ad79ee79df44bac9b0b50d", "53ad79ef79df44bac9b0b50e", "53ad79f179df44bac9b0b50f", "53ad79f479df44bac9b0b510", "53ad79f579df44bac9b0b511", "53ad79f679df44bac9b0b512", "53ad79f879df44bac9b0b513", "53ad79fb79df44bac9b0b514", "53ad79fc79df44bac9b0b515", "53ad79ff79df44bac9b0b516", "53ad7a0179df44bac9b0b517", "53ad7a0379df44bac9b0b518", "53ad7a0479df44bac9b0b519", "53ad7a0779df44bac9b0b51a", "53ad7a0979df44bac9b0b51b", "53ad7a0a79df44bac9b0b51c", "53ad7a0b79df44bac9b0b51d", "53ad7a0c79df44bac9b0b51e", "53ad7a0d79df44bac9b0b51f", "53ad7a1279df44bac9b0b520", "53ad7a1379df44bac9b0b521", "53ad7a1479df44bac9b0b522", "53ad7a1679df44bac9b0b523", "53ad7a1779df44bac9b0b524", "53ad7a1a79df44bac9b0b525", "53ad7a1b79df44bac9b0b526", "53ad7a2279df44bac9b0b527", "53ad7a2379df44bac9b0b528", "53ad7a2679df44bac9b0b52a", "53ad7a2979df44bac9b0b52b", "53ad7a2b79df44bac9b0b52c", "53ad7a2d79df44bac9b0b52d", "53ad7a2e79df44bac9b0b52e", "53ad7a2f79df44bac9b0b52f", "53ad7a3179df44bac9b0b530", "53ad7a3279df44bac9b0b531", "53ad7a3379df44bac9b0b532", "53ad7a3479df44bac9b0b533", "53ad7a3679df44bac9b0b534", "53ad7a3779df44bac9b0b535", "53ad7a3879df44bac9b0b536", "53ad7a3a79df44bac9b0b537", "53ad7a3b79df44bac9b0b538", "53ad7a3e79df44bac9b0b539", "53ad7a4179df44bac9b0b53a", "53ad7a4279df44bac9b0b53b", "53ad7a4379df44bac9b0b53c", "53ad7a4579df44bac9b0b53d", "53ad7a4679df44bac9b0b53e", "53ad7a4779df44bac9b0b53f", "53ad7a4879df44bac9b0b540", "53ad7a4a79df44bac9b0b541", "53ad7a4b79df44bac9b0b542", "53ad7a4c79df44bac9b0b543", "53ad7a4e79df44bac9b0b544", "53ad7a4f79df44bac9b0b545", "53ad7a5079df44bac9b0b546", "53ad7a5179df44bac9b0b547", "53ad7a5379df44bac9b0b548", "53ad7a5479df44bac9b0b549", "53ad7a5579df44bac9b0b54a", "53ad7a5679df44bac9b0b54b", "53ad7a5979df44bac9b0b54c", "53ad7a5c79df44bac9b0b54d", "53ad7a5e79df44bac9b0b54e", "53ad7a5f79df44bac9b0b54f", "53ad7a6079df44bac9b0b550", "53ad7a6a79df44bac9b0b551", "53ad7a6c79df44bac9b0b552", "53ad7a6e79df44bac9b0b553", "53ad7a6f79df44bac9b0b554", "53ad7a7079df44bac9b0b555", "53ad7a7279df44bac9b0b556", "53ad7a7379df44bac9b0b557", "53ad7a7579df44bac9b0b558", "53ad7a7779df44bac9b0b559", "53ad7a7a79df44bac9b0b55a", "53ad7a7b79df44bac9b0b55b", "53ad7a7c79df44bac9b0b55c", "53ad7a7e79df44bac9b0b55d", "53ad7a7f79df44bac9b0b55e", "53ad7a8079df44bac9b0b55f", "53ad7a8179df44bac9b0b560", "53ad7a8279df44bac9b0b561", "53ad7a8579df44bac9b0b562", "53ad7a8779df44bac9b0b563", "53ad7a8879df44bac9b0b564", "53ad7a8a79df44bac9b0b565", "53ad7a8b79df44bac9b0b566", "53ad7a8d79df44bac9b0b567", "53ad7a8e79df44bac9b0b568", "53ad7a8f79df44bac9b0b569", "53ad7a9079df44bac9b0b56a", "53ad7a9279df44bac9b0b56b", "53ad7a9479df44bac9b0b56c", "53ad7a9579df44bac9b0b56d", "53ad7a9779df44bac9b0b56e", "53ad7a9879df44bac9b0b56f", "53ad7a9f79df44bac9b0b570", "53ad7aa479df44bac9b0b572", "53ad7aa579df44bac9b0b573", "53ad7aa679df44bac9b0b574", "53ad7aa779df44bac9b0b575", "53ad7aaa79df44bac9b0b576", "53ad7aaf79df44bac9b0b577", "53ad7ab179df44bac9b0b578", "53ad7ab279df44bac9b0b579", "53ad7ab579df44bac9b0b57a", "53ad7ab679df44bac9b0b57b", "53ad7ab779df44bac9b0b57c", "53ad7ab979df44bac9b0b57d", "53ad7aba79df44bac9b0b57e", "53ad7abc79df44bac9b0b57f", "53ad7abd79df44bac9b0b580", "53ad7ac079df44bac9b0b582", "53ad7ac179df44bac9b0b583", "53ad7ac479df44bac9b0b584", "53ad7ac779df44bac9b0b585", "53ad7ac879df44bac9b0b586", "53ad7acb79df44bac9b0b587", "53ad7acc79df44bac9b0b588", "53ad7ace79df44bac9b0b589", "53ad7acf79df44bac9b0b58a", "53ad7ad079df44bac9b0b58b", "53ad7ad179df44bac9b0b58c", "53ad7ad279df44bac9b0b58d", "53ad7ad479df44bac9b0b58e", "53ad7ad579df44bac9b0b58f", "53ad7ad679df44bac9b0b590", "53ad7adb79df44bac9b0b591", "53ad7adc79df44bac9b0b592", "53ad7ade79df44bac9b0b593", "53ad7adf79df44bac9b0b594", "53ad7ae079df44bac9b0b595", "53ad7ae279df44bac9b0b596", "53ad7ae479df44bac9b0b597", "53ad7ae679df44bac9b0b598", "53ad7ae779df44bac9b0b599", "53ad7ae879df44bac9b0b59a", "53ad7ae979df44bac9b0b59b", "53ad7aeb79df44bac9b0b59c", "53ad7aec79df44bac9b0b59d", "53ad7aed79df44bac9b0b59e", "53ad7af079df44bac9b0b59f", "53ad7af379df44bac9b0b5a0", "53ad7af579df44bac9b0b5a2", "53ad7af679df44bac9b0b5a3", "53ad7af779df44bac9b0b5a4", "53ad7af979df44bac9b0b5a5", "53ad7afa79df44bac9b0b5a6", "53ad7afb79df44bac9b0b5a7", "53ad7afe79df44bac9b0b5a8", "53ad7b0179df44bac9b0b5a9", "53ad7b0379df44bac9b0b5aa", "53ad7b0579df44bac9b0b5ab", "53ad7b0679df44bac9b0b5ac", "53ad7b0879df44bac9b0b5ad", "53ad7b0979df44bac9b0b5ae", "53ad7b0a79df44bac9b0b5af", "53ad7b0c79df44bac9b0b5b0", "53ad7b0f79df44bac9b0b5b1", "53ad7b1079df44bac9b0b5b2", "53ad7b1179df44bac9b0b5b3", "53ad7b1f79df44bac9b0b5b4", "53ad7b2279df44bac9b0b5b5", "53ad7b2479df44bac9b0b5b6", "53ad7b2579df44bac9b0b5b7", "53ad7b2779df44bac9b0b5b8", "53ad7b2979df44bac9b0b5b9", "53ad7b2a79df44bac9b0b5ba", "53ad7b2b79df44bac9b0b5bb", "53ad7b2d79df44bac9b0b5bc", "53ad7b2e79df44bac9b0b5bd", "53ad7b3079df44bac9b0b5be", "53ad7b3579df44bac9b0b5bf", "53ad7b3779df44bac9b0b5c0", "53ad7b3879df44bac9b0b5c1", "53ad7b3979df44bac9b0b5c2", "53ad7b3b79df44bac9b0b5c3", "53ad7b3c79df44bac9b0b5c4", "53ad7b4b79df44bac9b0b5c5", "53ad7b4c79df44bac9b0b5c6", "53ad7b4d79df44bac9b0b5c7", "53ad7b4f79df44bac9b0b5c8", "53ad7b5179df44bac9b0b5c9", "53ad7b5279df44bac9b0b5ca", "53ad7b5479df44bac9b0b5cb", "53ad7b5579df44bac9b0b5cc", "53ad7b5679df44bac9b0b5cd", "53ad7b5979df44bac9b0b5ce", "53ad7b5b79df44bac9b0b5cf", "53ad7b5e79df44bac9b0b5d0", "53ad7b5f79df44bac9b0b5d1", "53ad7b6079df44bac9b0b5d2", "53ad7b6279df44bac9b0b5d3", "53ad7b6379df44bac9b0b5d4", "53ad7b6679df44bac9b0b5d5", "53ad7b6779df44bac9b0b5d6", "53ad7b6a79df44bac9b0b5d7", "53ad7b6b79df44bac9b0b5d8", "53ad7b6c79df44bac9b0b5d9", "53ad7b6e79df44bac9b0b5da", "53ad7b6f79df44bac9b0b5db", "53ad7b7079df44bac9b0b5dc", "53ad7b7379df44bac9b0b5dd", "53ad7b7579df44bac9b0b5de", "53ad7b7679df44bac9b0b5df", "53ad7b7c79df44bac9b0b5e0", "53ad7b7d79df44bac9b0b5e1", "53ad7b7e79df44bac9b0b5e2", "53ad7b8079df44bac9b0b5e3", "53ad7b8179df44bac9b0b5e4", "53ad7b8279df44bac9b0b5e5", "53ad7b8379df44bac9b0b5e6", "53ad7b8579df44bac9b0b5e7", "53ad7b8679df44bac9b0b5e8", "53ad7b8a79df44bac9b0b5e9", "53ad7b9179df44bac9b0b5ea", "53ad7b9279df44bac9b0b5eb", "53ad7b9679df44bac9b0b5ed", "53ad7b9879df44bac9b0b5ee", "53ad7b9a79df44bac9b0b5ef", "53ad7b9b79df44bac9b0b5f0", "53ad7b9e79df44bac9b0b5f1", "53ad7b9f79df44bac9b0b5f2", "53ad7ba579df44bac9b0b5f3", "53ad7ba879df44bac9b0b5f5", "53ad7baa79df44bac9b0b5f6", "53ad7baf79df44bac9b0b5f7", "53ad7bb079df44bac9b0b5f8", "53ad7bba79df44bac9b0b5f9", "53ad7bbf79df44bac9b0b5fa", "53ad7bc079df44bac9b0b5fb", "53ad7bc179df44bac9b0b5fc", "53ad7bc979df44bac9b0b5fd", "53ad7bca79df44bac9b0b5fe", "53ad7bcc79df44bac9b0b5ff", "53ad7bcd79df44bac9b0b600", "53ad7bd079df44bac9b0b601", "53ad7bd279df44bac9b0b602", "53ad7bd479df44bac9b0b603", "53ad7bd579df44bac9b0b604", "53ad7bdd79df44bac9b0b605", "53ad7bdf79df44bac9b0b606", "53ad7be079df44bac9b0b607", "53ad7be379df44bac9b0b608", "53ad7be479df44bac9b0b609", "53ad7be579df44bac9b0b60a", "53ad7be779df44bac9b0b60b", "53ad7be979df44bac9b0b60d", "53ad7beb79df44bac9b0b60e", "53ad7bec79df44bac9b0b60f", "53ad7bee79df44bac9b0b610", "53ad7bf279df44bac9b0b611", "53ad7bf779df44bac9b0b612", "53ad7bf879df44bac9b0b613", "53ad7bfc79df44bac9b0b614", "53ad7bfd79df44bac9b0b615", "53ad7bff79df44bac9b0b616", "53ad7c0079df44bac9b0b617", "53ad7c0179df44bac9b0b618", "53ad7c0379df44bac9b0b619", "53ad7c0479df44bac9b0b61a", "53ad7c0579df44bac9b0b61b", "53ad7c0679df44bac9b0b61c", "53ad7c0779df44bac9b0b61d", "53ad7c0879df44bac9b0b61e", "53ad7c0a79df44bac9b0b61f", "53ad7c0b79df44bac9b0b620", "53ad7c0e79df44bac9b0b621", "53ad7c1079df44bac9b0b622", "53ad7c1179df44bac9b0b623", "53ad7c1279df44bac9b0b624", "53ad7c1379df44bac9b0b625", "53ad7c1579df44bac9b0b626", "53ad7c1979df44bac9b0b629", "53ad7c1d79df44bac9b0b62c", "53ad7c1e79df44bac9b0b62d", "53ad7c1f79df44bac9b0b62e", "53ad7c2179df44bac9b0b62f", "53ad7c2279df44bac9b0b630", "53ad7c2379df44bac9b0b631", "53ad7c2779df44bac9b0b634", "53ad7c3679df44bac9b0b638", "53ad7c3779df44bac9b0b639", "53ad7c3979df44bac9b0b63b", "53ad7c3b79df44bac9b0b63c", "53ad7c3c79df44bac9b0b63d", "53ad7c3e79df44bac9b0b63f", "53ad7dcc79df44bac9b0b655", "53ad7e5a79df44bac9b0b660", "53ad7e5c79df44bac9b0b661", "53ad7e5d79df44bac9b0b662", "53ad7e5e79df44bac9b0b663", "53ad7e6079df44bac9b0b664", "53ad7e6279df44bac9b0b665", "53ad7e6a79df44bac9b0b666", "53ad7e6c79df44bac9b0b667", "53ad7e6d79df44bac9b0b668", "53ad7e6f79df44bac9b0b669", "53ad7e7179df44bac9b0b66a", "53ad7e7279df44bac9b0b66c", "53ad7e7379df44bac9b0b66d", "53ad7e7579df44bac9b0b66e", "53ad7e7679df44bac9b0b66f", "53ad7e7879df44bac9b0b670", "53ad7e7d79df44bac9b0b671", "53ad7e8079df44bac9b0b672", "53ad7e8279df44bac9b0b673", "53ad7e8479df44bac9b0b674", "53ad7e8579df44bac9b0b675", "53ad7e8779df44bac9b0b676", "53ad7e8879df44bac9b0b677", "53ad7e8979df44bac9b0b678", "53ad7e8b79df44bac9b0b679", "53ad7e8c79df44bac9b0b67a", "53ad7e8d79df44bac9b0b67b", "53ad7e8e79df44bac9b0b67c", "53ad7e9079df44bac9b0b67d", "53ad7e9179df44bac9b0b67e", "53ad7e9279df44bac9b0b67f", "53ad7e9579df44bac9b0b681", "53ad7e9679df44bac9b0b682", "53ad7e9779df44bac9b0b683", "53ad7e9979df44bac9b0b684", "53ad7e9a79df44bac9b0b685", "53ad7e9b79df44bac9b0b686", "53ad7e9c79df44bac9b0b687", "53ad7e9e79df44bac9b0b688", "53ad7e9f79df44bac9b0b689", "53ad7ea079df44bac9b0b68a", "53ad7ea279df44bac9b0b68c", "53ad7ea479df44bac9b0b68d", "53ad7ea579df44bac9b0b68e", "53ad7ea779df44bac9b0b68f", "53ad7ea979df44bac9b0b690", "53ad7eaa79df44bac9b0b691", "53ad7eab79df44bac9b0b692", "53ad7ead79df44bac9b0b693", "53ad7eaf79df44bac9b0b694", "53ad7eb079df44bac9b0b695", "53ad7eb279df44bac9b0b696", "53ad7eb379df44bac9b0b697", "53ad7eb579df44bac9b0b698", "53ad7eb679df44bac9b0b699", "53ad7eb879df44bac9b0b69a", "53ad7eb979df44bac9b0b69b", "53ad7eba79df44bac9b0b69c", "53ad7ebd79df44bac9b0b69d", "53ad7ebe79df44bac9b0b69e", "53ad7ec279df44bac9b0b6a1", "53ad7ec479df44bac9b0b6a2", "53ad7ec579df44bac9b0b6a3", "53ad7ec679df44bac9b0b6a4", "53ad7eca79df44bac9b0b6a8", "53ad7ecc79df44bac9b0b6a9", "53ad7ece79df44bac9b0b6aa", "53ad7ed179df44bac9b0b6ae", "53ad7ed279df44bac9b0b6af", "53ad7ed379df44bac9b0b6b0", "53ad7ed579df44bac9b0b6b1", "53ad7ed679df44bac9b0b6b3", "53ad7ed879df44bac9b0b6b5", "53ad7ed979df44bac9b0b6b6", "53ad7edc79df44bac9b0b6ba", "53ad7edd79df44bac9b0b6bb", "53ad7ee079df44bac9b0b6bc", "53ad7ee279df44bac9b0b6bd", "53ad7ee479df44bac9b0b6be", "53ad7ee579df44bac9b0b6bf", "53ad7ee679df44bac9b0b6c0", "53ad7ee879df44bac9b0b6c1", "53ad7ee979df44bac9b0b6c2", "53ad7eea79df44bac9b0b6c3", "53ad7eec79df44bac9b0b6c4", "53ad7eef79df44bac9b0b6c6", "53ad7ef179df44bac9b0b6c7", "53ad7ef379df44bac9b0b6c8", "53ad7ef479df44bac9b0b6c9", "53ad7ef779df44bac9b0b6ca", "53ad7ef879df44bac9b0b6cb", "53ad7efa79df44bac9b0b6cc", "53ad7efb79df44bac9b0b6cd", "53ad7efe79df44bac9b0b6ce", "53ad7f0279df44bac9b0b6d0", "53ad7f0479df44bac9b0b6d1", "53ad7f0579df44bac9b0b6d2", "53ad7f0679df44bac9b0b6d3", "53ad7f0879df44bac9b0b6d4", "53ad7f0979df44bac9b0b6d5", "53ad7f0c79df44bac9b0b6d7", "53ad7f0d79df44bac9b0b6d8", "53ad7f0e79df44bac9b0b6d9", "53ad7f1079df44bac9b0b6da", "53ad7f1279df44bac9b0b6dd", "53ad7f1479df44bac9b0b6de", "53ad7f1779df44bac9b0b6e1", "53ad7f1879df44bac9b0b6e2", "53ad7f1a79df44bac9b0b6e3", "53ad7f1b79df44bac9b0b6e4", "53ad7f1c79df44bac9b0b6e5", "53ad7f1e79df44bac9b0b6e6", "53ad7f2679df44bac9b0b6ec", "53ad7f2879df44bac9b0b6ed", "53ad7f2979df44bac9b0b6ee", "53ad7f2b79df44bac9b0b6ef", "53ad7f2c79df44bac9b0b6f0", "53ad7f2e79df44bac9b0b6f1", "53ad7f2f79df44bac9b0b6f2", "53ad7f3179df44bac9b0b6f3", "53ad7f3279df44bac9b0b6f4", "53ad7f3379df44bac9b0b6f5", "53ad7f3479df44bac9b0b6f6", "53ad7f3779df44bac9b0b6f7", "53ad7f3879df44bac9b0b6f8", "53ad7f3a79df44bac9b0b6fa", "53ad7f3b79df44bac9b0b6fb", "53ad7f3d79df44bac9b0b6fc", "53ad7f3e79df44bac9b0b6fd", "53ad7f4079df44bac9b0b6fe", "53ad7f4179df44bac9b0b6ff", "53ad7f4279df44bac9b0b700", "53ad7f4479df44bac9b0b701", "53ad7f4579df44bac9b0b702", "53ad7f4679df44bac9b0b703", "53ad7f4779df44bac9b0b704", "53ad7f4979df44bac9b0b705", "53ad7f4a79df44bac9b0b706", "53ad7f4c79df44bac9b0b707", "53ad7f4d79df44bac9b0b708", "53ad7f4e79df44bac9b0b709", "53ad7f5079df44bac9b0b70b", "53ad7f5179df44bac9b0b70c", "53ad7f5279df44bac9b0b70d", "53ad7f5479df44bac9b0b70e", "53ad7f5579df44bac9b0b70f", "53ad7f5679df44bac9b0b710", "53ad7f5879df44bac9b0b712", "53ad7f5979df44bac9b0b714", "53ad7f5a79df44bac9b0b715", "53ad7f5c79df44bac9b0b716", "53ad7f5d79df44bac9b0b717", "53ad7f5e79df44bac9b0b718", "53ad7f6079df44bac9b0b719", "53ad7f6279df44bac9b0b71a", "53ad7f6379df44bac9b0b71b", "53ad7f6479df44bac9b0b71c", "53ad7f6579df44bac9b0b71d", "53ad7f6779df44bac9b0b71f", "53ad7f6c79df44bac9b0b723", "53ad7f6d79df44bac9b0b724", "53ad7f6f79df44bac9b0b725", "53ad7f7079df44bac9b0b727", "53ad7f7479df44bac9b0b72a", "53ad7f7579df44bac9b0b72b", "53ad7f7679df44bac9b0b72c", "53ad7f7879df44bac9b0b72d", "53ad7f7979df44bac9b0b72e", "53ad7f7a79df44bac9b0b72f", "53ad7f7b79df44bac9b0b730", "53ad7f7d79df44bac9b0b731", "53ad7f7e79df44bac9b0b732", "53ad7f7f79df44bac9b0b733", "53ad7f8079df44bac9b0b734", "53ad7f8179df44bac9b0b735", "53ad7f8379df44bac9b0b736", "53ad7f8479df44bac9b0b737", "53ad7f8779df44bac9b0b738", "53ad7f8879df44bac9b0b739", "53ad7f8979df44bac9b0b73a", "53ad7f8a79df44bac9b0b73b", "53ad7f8c79df44bac9b0b73c", "53ad7f8d79df44bac9b0b73d", "53ad7f8e79df44bac9b0b73e", "53ad7f8f79df44bac9b0b73f", "53ad7f9679df44bac9b0b746", "53ad7f9779df44bac9b0b747", "53ad7f9979df44bac9b0b748", "53ad7f9a79df44bac9b0b749", "53ad7f9b79df44bac9b0b74a", "53ad7f9e79df44bac9b0b74c", "53ad7f9f79df44bac9b0b74d", "53ad7fa279df44bac9b0b750", "53ad7fa479df44bac9b0b751", "53ad7fa579df44bac9b0b752", "53ad7fa679df44bac9b0b753", "53ad7fad79df44bac9b0b759", "53ad7faf79df44bac9b0b75a", "53ad7fb179df44bac9b0b75c", "53ad7fb379df44bac9b0b75d", "53ad7fb479df44bac9b0b75e", "53ad7fb679df44bac9b0b760", "53ad7fb879df44bac9b0b761", "53ad7fba79df44bac9b0b762", "53ad7fbc79df44bac9b0b763", "53ad7fbe79df44bac9b0b764", "53ad7fbf79df44bac9b0b765", "53ad7fc079df44bac9b0b767", "53ad7fc279df44bac9b0b768", "53ad7fc379df44bac9b0b769", "53ad7fc479df44bac9b0b76a", "53ad7fc679df44bac9b0b76b", "53ad7fc779df44bac9b0b76c", "53ad7fc879df44bac9b0b76d", "53ad7fca79df44bac9b0b76e", "53ad7fcb79df44bac9b0b76f", "53ad7fcd79df44bac9b0b770", "53ad7fcf79df44bac9b0b773", "53ad7fd279df44bac9b0b776", "53ad7fd479df44bac9b0b778", "53ad7fd579df44bac9b0b779", "53ad7fd679df44bac9b0b77a", "53ad7fd879df44bac9b0b77b", "53ad7fd979df44bac9b0b77c", "53ad7fda79df44bac9b0b77d", "53ad7fdc79df44bac9b0b77e", "53ad7fdd79df44bac9b0b77f", "53ad7fe079df44bac9b0b780", "53ad7fe179df44bac9b0b781", "53ad7fe279df44bac9b0b782", "53ad7fe679df44bac9b0b787", "53ad7fe879df44bac9b0b788", "53ad7fe979df44bac9b0b78a", "53ad7feb79df44bac9b0b78b", "53ad7fec79df44bac9b0b78c", "53ad7fee79df44bac9b0b78d", "53ad7fef79df44bac9b0b78e", "53ad7ff079df44bac9b0b78f", "53ad7ff279df44bac9b0b790", "53ad7ff379df44bac9b0b791", "53ad7ff479df44bac9b0b792", "53ad7ff679df44bac9b0b793", "53ad7ff779df44bac9b0b794", "53ad7ff979df44bac9b0b795", "53ad7ffa79df44bac9b0b796", "53ad7ffb79df44bac9b0b797", "53ad7ffd79df44bac9b0b798", "53ad7ffe79df44bac9b0b799", "53ad7fff79df44bac9b0b79a", "53ad800179df44bac9b0b79b", "53ad800279df44bac9b0b79c", "53ad800479df44bac9b0b79d", "53ad800579df44bac9b0b79e", "53ad800779df44bac9b0b79f", "53ad800879df44bac9b0b7a0", "53ad800979df44bac9b0b7a1", "53ad800b79df44bac9b0b7a2", "53ad800c79df44bac9b0b7a3", "53ad800d79df44bac9b0b7a4", "53ad801079df44bac9b0b7a5", "53ad801379df44bac9b0b7a9", "53ad801479df44bac9b0b7aa", "53ad801579df44bac9b0b7ab", "53ad801779df44bac9b0b7ac", "53ad801879df44bac9b0b7ad", "53ad801979df44bac9b0b7ae", "53ad801b79df44bac9b0b7af", "53ad801c79df44bac9b0b7b0", "53ad801e79df44bac9b0b7b1", "53ad801f79df44bac9b0b7b3", "53ad802179df44bac9b0b7b4", "53ad802279df44bac9b0b7b5", "53ad802579df44bac9b0b7b7", "53ad802779df44bac9b0b7b8", "53ad802879df44bac9b0b7b9", "53ad802979df44bac9b0b7ba", "53ad802e79df44bac9b0b7bd", "53ad803079df44bac9b0b7be", "53ad803479df44bac9b0b7c1", "53ad803679df44bac9b0b7c2", "53ad803779df44bac9b0b7c3", "53ad803979df44bac9b0b7c4", "53ad803a79df44bac9b0b7c5", "53ad803e79df44bac9b0b7c8", "53ad804079df44bac9b0b7ca", "53ad804279df44bac9b0b7cb", "53ad804379df44bac9b0b7cc", "53ad804479df44bac9b0b7ce", "53ad804579df44bac9b0b7cf", "53ad804779df44bac9b0b7d0", "53ad804879df44bac9b0b7d1", "53ad804a79df44bac9b0b7d2", "53ad804b79df44bac9b0b7d3", "53ad804d79df44bac9b0b7d4", "53ad804e79df44bac9b0b7d5", "53ad805079df44bac9b0b7d6", "53ad805179df44bac9b0b7d7", "53ad805279df44bac9b0b7d8", "53ad805479df44bac9b0b7d9", "53ad805579df44bac9b0b7da", "53ad805679df44bac9b0b7db", "53ad805879df44bac9b0b7dc", "53ad805979df44bac9b0b7dd", "53ad805b79df44bac9b0b7de", "53ad805d79df44bac9b0b7df", "53ad805e79df44bac9b0b7e0", "53ad805f79df44bac9b0b7e1", "53ad806a79df44bac9b0b7e3", "53ad806b79df44bac9b0b7e4", "53ad806d79df44bac9b0b7e5", "53ad806e79df44bac9b0b7e6", "53ad807779df44bac9b0b7eb", "53ad807879df44bac9b0b7ec", "53ad807979df44bac9b0b7ed", "53ad807b79df44bac9b0b7ee", "53ad807c79df44bac9b0b7ef", "53ad807d79df44bac9b0b7f0", "53ad808079df44bac9b0b7f2", "53ad808379df44bac9b0b7f3", "53ad808479df44bac9b0b7f4", "53ad808579df44bac9b0b7f5", "53ad808879df44bac9b0b7f8", "53ad808979df44bac9b0b7f9", "53ad808b79df44bac9b0b7fa", "53ad808e79df44bac9b0b7fb", "53ad808f79df44bac9b0b7fc", "53ad809079df44bac9b0b7fd", "53ad809279df44bac9b0b7fe", "53ad809679df44bac9b0b800", "53ad809879df44bac9b0b801", "53ad809a79df44bac9b0b802", "53ad809c79df44bac9b0b803", "53ad809d79df44bac9b0b804", "53ad809e79df44bac9b0b805", "53ad80a079df44bac9b0b806", "53ad80a179df44bac9b0b807", "53ad80a379df44bac9b0b808", "53ad80a479df44bac9b0b809", "53ad80a679df44bac9b0b80a", "53ad80a779df44bac9b0b80b", "53ad80a979df44bac9b0b80c", "53ad80b579df44bac9b0b814", "53ad80b879df44bac9b0b816", "53ad80bc79df44bac9b0b819", "53ad80be79df44bac9b0b81a", "53ad80bf79df44bac9b0b81b", "53ad80c079df44bac9b0b81c", "53ad80c179df44bac9b0b81d", "53ad80c479df44bac9b0b81f", "53ad80ca79df44bac9b0b822", "53ad80cb79df44bac9b0b823", "53ad80cd79df44bac9b0b824", "53ad80ce79df44bac9b0b825", "53ad80d179df44bac9b0b827", "53ad80d279df44bac9b0b828", "53ad80d479df44bac9b0b829", "53ad80d579df44bac9b0b82a", "53ad80d679df44bac9b0b82b", "53ad80d879df44bac9b0b82c", "53ad80d979df44bac9b0b82d", "53ad80dc79df44bac9b0b82f", "53ad80df79df44bac9b0b832", "53ad80e879df44bac9b0b838", "53ad80e979df44bac9b0b839", "53ad80f379df44bac9b0b841", "53ad80f479df44bac9b0b842", "53ad80f679df44bac9b0b843", "53ad80f779df44bac9b0b844", "53ad80f879df44bac9b0b845", "53ad80f979df44bac9b0b846", "53ad80fb79df44bac9b0b847", "53ad810579df44bac9b0b850", "53ad810779df44bac9b0b851", "53ad810879df44bac9b0b852", "53ad811179df44bac9b0b857", "53ad811279df44bac9b0b858", "53ad811379df44bac9b0b859", "53ad811579df44bac9b0b85a", "53ad811779df44bac9b0b85b", "53ad811879df44bac9b0b85c", "53ad811a79df44bac9b0b85d", "53ad811d79df44bac9b0b85f", "53ad812179df44bac9b0b862", "53ad812779df44bac9b0b865", "53ad812879df44bac9b0b866", "53ad812c79df44bac9b0b869", "53ad812e79df44bac9b0b86a", "53ad813179df44bac9b0b86c", "53ad813379df44bac9b0b86e", "53ad813579df44bac9b0b86f", "53ad813879df44bac9b0b871", "53ad814879df44bac9b0b87b", "53ad814979df44bac9b0b87c", "53ad814a79df44bac9b0b87d", "53ad815279df44bac9b0b881", "53ad815479df44bac9b0b882", "53ad815579df44bac9b0b883", "53ad815779df44bac9b0b884", "53ad815879df44bac9b0b885", "53ad815a79df44bac9b0b886", "53ad815c79df44bac9b0b888", "53ad815e79df44bac9b0b889", "53ad815f79df44bac9b0b88a", "53ad816279df44bac9b0b88c", "53ad816479df44bac9b0b88d", "53ad816579df44bac9b0b88e", "53ad816779df44bac9b0b88f", "53ad816879df44bac9b0b890", "53ad816a79df44bac9b0b891", "53ad816b79df44bac9b0b892", "53ad816c79df44bac9b0b893", "53ad816e79df44bac9b0b894", "53ad816f79df44bac9b0b895", "53ad817179df44bac9b0b896", "53ad817279df44bac9b0b897", "53ad817479df44bac9b0b898", "53ad817579df44bac9b0b899", "53ad817779df44bac9b0b89a", "53ad817879df44bac9b0b89b", "53ad817979df44bac9b0b89c", "53ad817b79df44bac9b0b89d", "53ad817c79df44bac9b0b89e", "53ad817e79df44bac9b0b89f", "53ad817f79df44bac9b0b8a0", "53ad818179df44bac9b0b8a1", "53ad818279df44bac9b0b8a2", "53ad818579df44bac9b0b8a4", "53ad818679df44bac9b0b8a5", "53ad818879df44bac9b0b8a6", "53ad818b79df44bac9b0b8a7", "53ad818d79df44bac9b0b8a8", "53ad818f79df44bac9b0b8a9", "53ad819179df44bac9b0b8aa", "53ad819279df44bac9b0b8ab", "53ad819479df44bac9b0b8ac", "53ad819879df44bac9b0b8af", "53ad819979df44bac9b0b8b0", "53ad819b79df44bac9b0b8b1", "53ad819c79df44bac9b0b8b2", "53ad819d79df44bac9b0b8b3", "53ad81a079df44bac9b0b8b5", "53ad81a379df44bac9b0b8b6", "53ad81a479df44bac9b0b8b7", "53ad81a679df44bac9b0b8b8", "53ad81a779df44bac9b0b8b9", "53ad81a979df44bac9b0b8bb", "53ad81ab79df44bac9b0b8bc", "53ad81af79df44bac9b0b8bf", "53ad81b079df44bac9b0b8c0", "53ad81b579df44bac9b0b8c3", "53ad81b679df44bac9b0b8c4", "53ad81b979df44bac9b0b8c7", "53ad81bc79df44bac9b0b8c9", "53ad81bf79df44bac9b0b8ca", "53ad81c179df44bac9b0b8cc", "53ad81c279df44bac9b0b8cd", "53ad81c679df44bac9b0b8cf", "53ad81c879df44bac9b0b8d0", "53ad81cd79df44bac9b0b8d2", "53ad81d179df44bac9b0b8d4", "53ad81d279df44bac9b0b8d5", "53ad81d379df44bac9b0b8d6", "53ad81d579df44bac9b0b8d7", "53ad81d679df44bac9b0b8d8", "53ad81d879df44bac9b0b8d9", "53ad81da79df44bac9b0b8da", "53ad81db79df44bac9b0b8db", "53ad81dc79df44bac9b0b8dc", "53ad81de79df44bac9b0b8dd", "53ad81e179df44bac9b0b8de", "53ad81e479df44bac9b0b8e0", "53ad81e779df44bac9b0b8e2", "53ad81e979df44bac9b0b8e3", "53ad81ea79df44bac9b0b8e4", "53ad81ec79df44bac9b0b8e5", "53ad81ed79df44bac9b0b8e6", "53ad81ef79df44bac9b0b8e7", "53ad81f079df44bac9b0b8e8", "53ad81f279df44bac9b0b8e9", "53ad81f379df44bac9b0b8ea", "53ad81f479df44bac9b0b8eb", "53ad81f679df44bac9b0b8ec", "53ad81f779df44bac9b0b8ed", "53ad81f979df44bac9b0b8ee", "53ad81fa79df44bac9b0b8ef", "53ad81fc79df44bac9b0b8f0", "53ad81fd79df44bac9b0b8f1", "53ad81fe79df44bac9b0b8f2", "53ad820279df44bac9b0b8f4", "53ad820579df44bac9b0b8f7", "53ad820679df44bac9b0b8f8", "53ad820879df44bac9b0b8f9", "53ad820b79df44bac9b0b8fc", "53ad820d79df44bac9b0b8fd", "53ad820f79df44bac9b0b8fe", "53ad821179df44bac9b0b8ff", "53ad821279df44bac9b0b900", "53ad821479df44bac9b0b901", "53ad821579df44bac9b0b902", "53ad821679df44bac9b0b903", "53ad821879df44bac9b0b904", "53ad821979df44bac9b0b905", "53ad821c79df44bac9b0b907", "53ad821f79df44bac9b0b908", "53ad822079df44bac9b0b909", "53ad822279df44bac9b0b90a", "53ad822379df44bac9b0b90b", "53ad822479df44bac9b0b90c", "53ad822679df44bac9b0b90d", "53ad822779df44bac9b0b90e", "53ad822979df44bac9b0b90f", "53ad822c79df44bac9b0b910", "53ad822d79df44bac9b0b911", "53ad823079df44bac9b0b913", "53ad823279df44bac9b0b914", "53ad823379df44bac9b0b915", "53ad823579df44bac9b0b916", "53ad823679df44bac9b0b917", "53ad823879df44bac9b0b918", "53ad823979df44bac9b0b919", "53ad823b79df44bac9b0b91b", "53ad823c79df44bac9b0b91c", "53ad823d79df44bac9b0b91d", "53ad824079df44bac9b0b91e", "53ad824279df44bac9b0b91f", "53ad824579df44bac9b0b920", "53ad824679df44bac9b0b921", "53ad824979df44bac9b0b923", "53ad824b79df44bac9b0b924", "53ad824c79df44bac9b0b925", "53ad825679df44bac9b0b926", "53ad825779df44bac9b0b927", "53ad825879df44bac9b0b928", "53ad825a79df44bac9b0b929", "53ad825b79df44bac9b0b92a", "53ad825c79df44bac9b0b92b", "53ad825d79df44bac9b0b92c", "53ad825f79df44bac9b0b92d", "53ad826079df44bac9b0b92e", "53ad826279df44bac9b0b92f", "53ad826379df44bac9b0b930", "53ad826479df44bac9b0b931", "53ad826779df44bac9b0b932", "53ad826979df44bac9b0b933", "53ad826a79df44bac9b0b934", "53ad826d79df44bac9b0b935", "53ad827079df44bac9b0b937", "53ad827179df44bac9b0b938", "53ad827379df44bac9b0b939", "53ad827479df44bac9b0b93a", "53ad827679df44bac9b0b93b", "53ad827779df44bac9b0b93c", "53ad827879df44bac9b0b93d", "53ad827a79df44bac9b0b93e", "53ad827c79df44bac9b0b93f", "53ad827d79df44bac9b0b940", "53ad827f79df44bac9b0b941", "53ad828079df44bac9b0b942", "53ad828279df44bac9b0b943", "53ad828379df44bac9b0b944", "53ad828579df44bac9b0b945", "53ad828679df44bac9b0b946", "53ad828879df44bac9b0b947", "53ad828979df44bac9b0b948", "53ad828c79df44bac9b0b94a", "53ad828d79df44bac9b0b94b", "53ad828e79df44bac9b0b94c", "53ad829079df44bac9b0b94d", "53ad829179df44bac9b0b94e", "53ad829379df44bac9b0b94f", "53ad829479df44bac9b0b950", "53ad829679df44bac9b0b952", "53ad829879df44bac9b0b953", "53ad829979df44bac9b0b954", "53ad829a79df44bac9b0b955", "53ad829c79df44bac9b0b956", "53ad829d79df44bac9b0b957", "53ad829e79df44bac9b0b958", "53ad82a179df44bac9b0b95a", "53ad82a279df44bac9b0b95b", "53ad82a479df44bac9b0b95c", "53ad82a779df44bac9b0b95d", "53ad82a879df44bac9b0b95e", "53ad82a979df44bac9b0b95f", "53ad82ab79df44bac9b0b960", "53ad82ac79df44bac9b0b961", "53ad82ad79df44bac9b0b962", "53ad82af79df44bac9b0b963", "53ad82b079df44bac9b0b964", "53ad82b179df44bac9b0b966", "53ad82b379df44bac9b0b967", "53ad82b479df44bac9b0b968", "53ad82b579df44bac9b0b969", "53ad82b779df44bac9b0b96a", "53ad82b879df44bac9b0b96b", "53ad82bb79df44bac9b0b96d", "53ad82bd79df44bac9b0b96e", "53ad82be79df44bac9b0b96f", "53ad82c079df44bac9b0b970", "53ad82c179df44bac9b0b971", "53ad82c379df44bac9b0b972", "53ad82c679df44bac9b0b973", "53ad82c779df44bac9b0b974", "53ad82c879df44bac9b0b975", "53ad82ca79df44bac9b0b976", "53ad82cb79df44bac9b0b977", "53ad82cd79df44bac9b0b978", "53ad82ce79df44bac9b0b979", "53ad82d079df44bac9b0b97a", "53ad82d179df44bac9b0b97b", "53ad82d379df44bac9b0b97c", "53ad82d479df44bac9b0b97e", "53ad82d579df44bac9b0b97f", "53ad82d779df44bac9b0b980", "53ad82d879df44bac9b0b981", "53ad82da79df44bac9b0b983", "53ad82db79df44bac9b0b984", "53ad82dc79df44bac9b0b985", "53ad82dd79df44bac9b0b986", "53ad82df79df44bac9b0b987", "53ad82e079df44bac9b0b988", "53ad82e279df44bac9b0b989", "53ad82e679df44bac9b0b98b", "53ad82e979df44bac9b0b98d", "53ad82ea79df44bac9b0b98e", "53ad82eb79df44bac9b0b98f", "53ad82ed79df44bac9b0b990", "53ad82ee79df44bac9b0b991", "53ad82ef79df44bac9b0b992", "53ad82f179df44bac9b0b993", "53ad82f279df44bac9b0b994", "53ad82f379df44bac9b0b995", "53ad82f579df44bac9b0b996", "53ad82f679df44bac9b0b997", "53ad82f979df44bac9b0b998", "53ad82fa79df44bac9b0b999", "53ad82fd79df44bac9b0b99b", "53ad82fe79df44bac9b0b99d", "53ad830079df44bac9b0b99e", "53ad830179df44bac9b0b99f", "53ad830279df44bac9b0b9a0", "53ad830479df44bac9b0b9a1", "53ad830579df44bac9b0b9a4", "53ad830679df44bac9b0b9a5", "53ad830879df44bac9b0b9a7", "53ad830979df44bac9b0b9a9", "53ad830b79df44bac9b0b9ab", "53ad830c79df44bac9b0b9ae", "53ae736b79df44bac9b0b9b5", "53ae738479df44bac9b0b9b8", "53ae738479df44bac9b0b9bb", "53ae738879df44bac9b0b9c5", "53ae738b79df44bac9b0b9cf", "53ae739079df44bac9b0b9dd", "53ae7ccb79df44bac9b0ba1a", "53ae899879df44bac9b0ba22", "53ae8a0879df44bac9b0bad0", "53ae8a8779df44bac9b0bb95", "53ae8c9479df44bac9b0bf23", "53ae8c9779df44bac9b0bf2a", "53ae8d5879df44bac9b0c069", "53aeaba879df44bac9b0c1ef", "53aeac3a79df44bac9b0c2f0", "53aeac3d79df44bac9b0c2f8", "53aeacd079df44bac9b0c461", "53aeace279df44bac9b0c4d8", "53aeace579df44bac9b0c4ed", "53aeace779df44bac9b0c4f9", "53aeacea79df44bac9b0c50b", "53aeacec79df44bac9b0c51e", "53aeacf079df44bac9b0c539", "53aeacf279df44bac9b0c548", "53aeacf579df44bac9b0c55c", "53aeacf879df44bac9b0c570", "53aeacfb79df44bac9b0c582", "53aeacfd79df44bac9b0c598", "53aead0079df44bac9b0c5ac", "53aead0b79df44bac9b0c5f4", "53aead0e79df44bac9b0c609", "53aead1e79df44bac9b0c65e", "53aeadb479df44bac9b0c846", "53aeb46279df44bac9b0d855", "53aeb73779df44bac9b0dd90", "53aeb81479df44bac9b0df10", "53b1235179df44bac9b0ed10", "53b1235479df44bac9b0ed13", "53b1235a79df44bac9b0ed18", "53b1235d79df44bac9b0ed1b", "53b1235f79df44bac9b0ed1d", "53b1236579df44bac9b0ed24", "53b1239d79df44bac9b0ed27", "53b123a279df44bac9b0ed2a", "53b1255479df44bac9b0ed38", "53b1255679df44bac9b0ed40", "53b1255779df44bac9b0ed49", "53b1255b79df44bac9b0ed4a", "53b1255e79df44bac9b0ed4b", "53b1257079df44bac9b0ed66", "53b1257079df44bac9b0ed67", "53b1259979df44bac9b0ed95", "53b125b179df44bac9b0edb4", "53b125b279df44bac9b0edb5", "53b125b679df44bac9b0edbc", "53b125b879df44bac9b0edc1", "53b125e379df44bac9b0edf3", "53b125ee79df44bac9b0ee04", "53b125f179df44bac9b0ee06", "53b125fa79df44bac9b0ee16", "53b125fa79df44bac9b0ee18", "53b1261379df44bac9b0ee3b", "53b1261479df44bac9b0ee3c", "53b1261579df44bac9b0ee3e", "53b1261779df44bac9b0ee43", "53b12b4b79df44bac9b0ee4e", "53b12b4d79df44bac9b0ee51", "53b12b9079df44bac9b0ee90", "53b12ba279df44bac9b0ee9e", "53b12bae79df44bac9b0eeac", "53b12bc179df44bac9b0eec0", "53b12bde79df44bac9b0eedc", "53b12c5279df44bac9b0ef5c", "53b12c7579df44bac9b0ef81", "53b12c9a79df44bac9b0efac", "53b12ca479df44bac9b0efb4", "53b12d2879df44bac9b0f05e", "53b1301679df44bac9b0f081", "53b131d079df44bac9b0f08d", "53b131d179df44bac9b0f08e", "53b131f479df44bac9b0f09e", "53b1322979df44bac9b0f0d6", "53b1326379df44bac9b0f112", "53b1329f79df44bac9b0f14a", "53b1330779df44bac9b0f1b5", "53b1330879df44bac9b0f1b7", "53b1368479df44bac9b0f293", "53b1368579df44bac9b0f294", "53b1369979df44bac9b0f295", "53b136e379df44bac9b0f2ec", "53b1371e79df44bac9b0f328", "53b1372f79df44bac9b0f333", "53b1375c79df44bac9b0f33f", "53b137d279df44bac9b0f3b6", "53b1383879df44bac9b0f3e2", "53b1383979df44bac9b0f3e3", "53b1387c79df44bac9b0f417", "53b1389879df44bac9b0f42d", "53b1399679df44bac9b0f4e8", "53b13a9179df44bac9b0f59e", "53b13b2979df44bac9b0f624", "53b13ba479df44bac9b0f6ac", "53b13c2679df44bac9b0f718", "53b13c6d79df44bac9b0f757", "53b13d9079df44bac9b0f800", "53b13f7e79df44bac9b0f967", "53b13f7e79df44bac9b0f968", "53b1409279df44bac9b0fa19", "53b140a879df44bac9b0fa22", "53b144ba79df44bac9b0fd71", "53b145c079df44bac9b0fe5b", "53b149d879df44bac9b101e8", "53b149e379df44bac9b101e9", "53b14db379df44bac9b105a9", "53b14db679df44bac9b105ae", "53b1588179df44bac9b10d53", "53b15ad579df44bac9b10fc8", "53b15d9c79df44bac9b11337", "53b15e6979df44bac9b1143b", "53b15fa879df44bac9b115aa", "53b1603d79df44bac9b11676", "53b161e279df44bac9b1173b", "53b1651079df44bac9b1189e", "53b3c50b79df44bac9b11d7a", "53b3c85879df44bac9b11db2", "53c0d39979df44bac9b1a216", "53c0d54b79df44bac9b1a21f", "53c0d54b79df44bac9b1a220", "53c0d54d79df44bac9b1a223", "53c0d54d79df44bac9b1a224", "53c0d56079df44bac9b1a232", "53c0d56779df44bac9b1a238", "53c0d5a979df44bac9b1a264", "53c0d5e279df44bac9b1a290", "53c0d63279df44bac9b1a2ab", "53c0dd3779df44bac9b1a3a9", "53c0e34079df44bac9b1a3d1", "53c0e3b779df44bac9b1a3fd", "53c0e3ba79df44bac9b1a406", "53c1138379df44bac9b1a5a4", "53c1142679df44bac9b1a64a", "53c1142879df44bac9b1a64f", "53c114e879df44bac9b1a72c", "53c1150279df44bac9b1a77d", "53c1156879df44bac9b1a871", "53c1156e79df44bac9b1a877", "53c1157379df44bac9b1a87c", "53c1157479df44bac9b1a87d", "53c1157579df44bac9b1a87e", "53c1157b79df44bac9b1a87f", "53c1158879df44bac9b1a880", "53c1159d79df44bac9b1a885", "53c115b079df44bac9b1a88a", "53c115b979df44bac9b1a88b", "53c115bb79df44bac9b1a88c", "53c115bd79df44bac9b1a88d", "53c115c679df44bac9b1a88e", "53c115c879df44bac9b1a88f", "53c115d979df44bac9b1a896", "53c115f479df44bac9b1a89b", "53c115fa79df44bac9b1a89c", "53c1169f79df44bac9b1a8d5", "53c1179f79df44bac9b1a940", "53c117d179df44bac9b1a9a8", "53c118da79df44bac9b1aa51", "53c118dd79df44bac9b1aa52", "53c118de79df44bac9b1aa53", "53c118df79df44bac9b1aa54", "53c118e179df44bac9b1aa55", "53c118e479df44bac9b1aa58", "53c118e579df44bac9b1aa5b", "53c118e879df44bac9b1aa5c", "53c118e979df44bac9b1aa5d", "53c118f479df44bac9b1aa5e", "53c118f679df44bac9b1aa5f", "53c118f779df44bac9b1aa60", "53c118f779df44bac9b1aa61", "53c118fc79df44bac9b1aa62", "53c1190179df44bac9b1aa63", "53c1190279df44bac9b1aa64", "53c12a8079df44bac9b1ac23", "53c12fa779df44bac9b1ac39", "53c12fbd79df44bac9b1ac3f", "53c1393879df44bac9b1acbd", "53c139f779df44bac9b1ad3e", "53c141c279df44bac9b1b0b4", "53c141c479df44bac9b1b0b6", "53c141d779df44bac9b1b0c8", "53c1420d79df44bac9b1b106", "53c1421779df44bac9b1b10f", "53c1421779df44bac9b1b110", "53c1421879df44bac9b1b112", "53c1434079df44bac9b1b216", "53c1434979df44bac9b1b223", "53c1434a79df44bac9b1b224", "53c1436c79df44bac9b1b26e", "53c1437979df44bac9b1b287", "53c1437e79df44bac9b1b292", "53c1439b79df44bac9b1b2e6", "53c143a379df44bac9b1b2fc", "53c143ff79df44bac9b1b3c3", "53c1440a79df44bac9b1b3db", "53c1440b79df44bac9b1b3dc", "53c1442f79df44bac9b1b42d", "53c1444e79df44bac9b1b46a", "53c1444f79df44bac9b1b46c", "53c1444f79df44bac9b1b46f", "53c1444f79df44bac9b1b471", "53c1445179df44bac9b1b472", "53c1445279df44bac9b1b477", "53c1456e79df44bac9b1b644", "53c146b079df44bac9b1b837", "53c1485279df44bac9b1ba9b", "53c1496479df44bac9b1bbf7", "53c1497679df44bac9b1bc27", "53c14a0d79df44bac9b1bd25", "53c14a8979df44bac9b1bdff", "53c14b6f79df44bac9b1bf52", "53c14da179df44bac9b1c347", "53c38e3179df44bac9b1ccbf", "53c38f5979df44bac9b1ced0", "53c3967179df44bac9b1d244", "53c396bf79df44bac9b1d332", "53c396c279df44bac9b1d33e", "53c396f779df44bac9b1d3e4", "53c396fa79df44bac9b1d3ec", "53c3970279df44bac9b1d405", "53c3970679df44bac9b1d416", "53c3970879df44bac9b1d41e", "53c3972979df44bac9b1d469", "53c3976d79df44bac9b1d4ad", "53c3977d79df44bac9b1d4be", "53c3978279df44bac9b1d4c4", "53c397a479df44bac9b1d4e7", "53c397aa79df44bac9b1d4ee", "53c397b679df44bac9b1d4fa", "53c397cc79df44bac9b1d510", "53c397ef79df44bac9b1d535", "53c399f179df44bac9b1d779", "53c39a5b79df44bac9b1d7e7", "53c39ab579df44bac9b1d842", "53c39acf79df44bac9b1d85a", "53c39ad679df44bac9b1d862", "53c39ad679df44bac9b1d863", "53c39b0579df44bac9b1d892", "53c39b0679df44bac9b1d894", "53c39b0779df44bac9b1d896", "53c39b0879df44bac9b1d898", "53c39b5579df44bac9b1d8d8", "53c39b5579df44bac9b1d8d9", "53c39b5679df44bac9b1d8db", "53c39b8379df44bac9b1d90c", "53c39b8379df44bac9b1d90d", "53c39bce79df44bac9b1d951", "53c39bd079df44bac9b1d954", "53c39be979df44bac9b1d96b", "53c39be979df44bac9b1d96c", "53c39bea79df44bac9b1d96e", "53c39bf279df44bac9b1d976", "53c39bf379df44bac9b1d978", "53c39bf479df44bac9b1d97a", "53c39bf579df44bac9b1d97c", "53c39bf679df44bac9b1d97e", "53c39c1179df44bac9b1d99a", "53c39c1179df44bac9b1d99b", "53c39d6a79df44bac9b1db13", "53c39d6b79df44bac9b1db15", "53c39d6c79df44bac9b1db17", "53c39d6d79df44bac9b1db19", "53c39d6e79df44bac9b1db1b", "53c39d6f79df44bac9b1db1d", "53c39d7179df44bac9b1db20", "53c39d7279df44bac9b1db22", "53c39d7c79df44bac9b1db2d", "53c39d7f79df44bac9b1db31", "53c39d8079df44bac9b1db33", "53c39da779df44bac9b1db5a", "53c39daa79df44bac9b1db5e", "53c39dc379df44bac9b1db75", "53c39dc379df44bac9b1db76", "53c39dda79df44bac9b1db8b", "53c39e1779df44bac9b1dbc4", "53c39e1779df44bac9b1dbc5", "53c39e4579df44bac9b1dbfc", "53c39e4679df44bac9b1dbfe", "53c39e4679df44bac9b1dbff", "53c39e7a79df44bac9b1dc24", "53c39e7b79df44bac9b1dc26", "53c39e7e79df44bac9b1dc29", "53c39e7e79df44bac9b1dc2a", "53c39e7e79df44bac9b1dc2b", "53c39e7f79df44bac9b1dc2c", "53c39ea279df44bac9b1dc4f", "53c39ea279df44bac9b1dc50", "53c39ea279df44bac9b1dc52", "53c39eaf79df44bac9b1dc5a", "53c39ef879df44bac9b1dc98", "53c39ef879df44bac9b1dc99", "53c39eff79df44bac9b1dca1", "53c39f0079df44bac9b1dca3", "53c39f2279df44bac9b1dcc1", "53c39f2279df44bac9b1dcc2", "53c39f2679df44bac9b1dcc6", "53c39f2679df44bac9b1dcc7", "53c39f2779df44bac9b1dcc8", "53c39f3379df44bac9b1dcd2", "53c39f3379df44bac9b1dcd3", "53c39f6479df44bac9b1dd34", "53c39f6b79df44bac9b1dd3b", "53c39f8a79df44bac9b1dd5d", "53c39fbc79df44bac9b1dd8b", "53c3a00879df44bac9b1ddcd", "53c3e3f879df44bac9b1eb2a", "53c3e67379df44bac9b1eca4", "53c3e84979df44bac9b1eff6", "53c3eceb79df44bac9b1f461", "53c4afc579df44bac9b1f77a", "53c4ccf179df44bac9b1ff0d", "53c4ccf179df44bac9b1ff0e", "53c4ccfb79df44bac9b1ff1b", "53c4cd8c79df44bac9b1ff8a", "53c4fdff79df44bac9b2076d", "53c8c8be79df44bac9b2dfe4", "53c8c8c679df44bac9b2dfeb", "53c8c8da79df44bac9b2dffe", "53c8c90279df44bac9b2e01a", "53c8c90379df44bac9b2e01c", "53c8c90b79df44bac9b2e025", "53c8c90f79df44bac9b2e029", "53c8c91779df44bac9b2e030", "53c8c92a79df44bac9b2e04a", "53c8c94979df44bac9b2e06d", "53c902af79df44bac9b2e665", "53c902b179df44bac9b2e668", "53c902b379df44bac9b2e66b", "53c902b379df44bac9b2e66c", "53c902b779df44bac9b2e671", "53c902e979df44bac9b2e6b5", "53c902e979df44bac9b2e6b6", "53c902fd79df44bac9b2e6e0", "53c9030279df44bac9b2e6f7", "53c9030279df44bac9b2e6f8", "53c9030e79df44bac9b2e714", "53c9030e79df44bac9b2e715", "53c9032b79df44bac9b2e737", "53c9034c79df44bac9b2e768", "53ccbb4679df44bac9b306c7", "53cce38379df44bac9b33b5c", "53ccf42b79df44bac9b34577", "53ce198279df44bac9b3626c", "53cf91d879df44bac9b3a025", "53cf924e79df44bac9b3a07c", "53d126af79df44bac9b3e33c", "53d1294979df44bac9b3e550", "53d12a9f79df44bac9b3e63b", "53d9ccd779df44bac9b43049", "53d9ccd879df44bac9b43056", "53d9ccdf79df44bac9b4308b", "53d9ccec79df44bac9b430d6", "53d9ccfa79df44bac9b430f7", "53d9ce3979df44bac9b43147", "53d9ce3b79df44bac9b43156", "53d9ce4279df44bac9b43195", "53d9ce4379df44bac9b431a2", "53d9ce4579df44bac9b431b0", "53d9ce4679df44bac9b431bb", "53d9ce4879df44bac9b431d0", "53d9ce4a79df44bac9b431e9", "53d9ce4a79df44bac9b431f3", "53d9ce4f79df44bac9b43224", "53d9ce5879df44bac9b43284", "53d9ce5b79df44bac9b432a7", "53d9ce6279df44bac9b432f0", "53d9ce6679df44bac9b43312", "53d9ce6779df44bac9b4331e", "53d9ce6779df44bac9b4331f", "53d9ce6779df44bac9b43323", "53d9ce6879df44bac9b43332", "53d9ce6e79df44bac9b4336a", "53d9ce6e79df44bac9b4336f", "53d9ce7879df44bac9b433d4", "53d9ce7b79df44bac9b433f1", "53d9ce8879df44bac9b43482", "53d9ce8979df44bac9b4348e", "53d9ce8e79df44bac9b434c9", "53d9ce9b79df44bac9b43554", "53d9ce9e79df44bac9b43577", "53d9cea479df44bac9b435ce", "53d9cea579df44bac9b435d8", "53d9ceaa79df44bac9b4360f", "53d9cead79df44bac9b43633", "53d9ceb179df44bac9b43668", "53d9ceb279df44bac9b43674", "53d9ceb379df44bac9b43680", "53d9ceb479df44bac9b43685", "53d9ceb579df44bac9b43697", "53d9ceb579df44bac9b4369b", "53d9ceb879df44bac9b436b5", "53d9ceb879df44bac9b436b7", "53d9cebc79df44bac9b436e9", "53d9cebd79df44bac9b436f5", "53d9cec179df44bac9b4371e", "53d9cec279df44bac9b4372d", "53d9cec479df44bac9b43738", "53d9cec479df44bac9b4373c", "53d9cecc79df44bac9b43794", "53d9ced079df44bac9b437cb", "53d9ced379df44bac9b437e8", "53d9ced579df44bac9b43802", "53d9ced679df44bac9b43807", "53d9cede79df44bac9b4385b", "53d9cee579df44bac9b438b0", "53d9cee979df44bac9b438d5", "53d9ceee79df44bac9b43913", "53d9cef179df44bac9b43938", "53d9cef579df44bac9b43963", "53d9cef579df44bac9b43967", "53d9cef979df44bac9b4398d", "53dafc3279df44bac9b4748c", "53db0f1179df44bac9b47517", "53db140e79df44bac9b4756e", "53dca90679df44bac9b47a35", "53dca90779df44bac9b47a36", "53dca91479df44bac9b47a37", "53dca91879df44bac9b47a38", "53dca91979df44bac9b47a39", "53dca91f79df44bac9b47a3a", "53dca92179df44bac9b47a3b", "53dcaa7579df44bac9b47bc5", "53dcaa7879df44bac9b47bc6", "53dcaa7c79df44bac9b47bca", "53dcaa8279df44bac9b47bd2", "53dcaa8a79df44bac9b47bdc", "53e4c27d79df44bac9b568e7", "53e4c5a679df44bac9b569b2", "53e4c5ef79df44bac9b56a24", "53e5a7cb79df44bac9b585f9", "53e9f72179df44bac9b673e0", "53ef0c0779df44bac9b7c3db", "53f1bd00be93e108007626cd", "53f49da7433c1e0d00ec537a", "53f4a3e20aba340c007ab1e7", "53f5b4e8c6fc950c007761be", "53f6c91ef641a90a00f40ba1", "53f7255eff7fc70c00589607", "53f97f370f0c4c0a0091a47b", "53f97ff2f494930a00b028ad", "53f995ab43bfc70800e0b731", "53fac72e1f897b0a0094e450", "53fafaffaa8c420800f66336", "53fb08dc79df44bac9b904b3", "53fb50a369a26a77632bada4", "53fc26eb2b3a620a0007adcb", "53fdbb5fb26c610c00520783", "53feba73210aee0c002cf304", "53fefe2bd1ba860c008c5fc3", "53ff012c35a0cd0e00da2ea4", "540418f1bff54a6d6345ae74", "5405d1cbc0e3fee648091612", "5406a971fddc2ff75ace4623", "5406f7cb1999d07571cd4aef", "54096d09f6aef30777182c9b", "54097ca8f6aef3077718840d", "540980ccf6aef3077718a17a", "5409cbcbf6aef307771a821b", "540d4837bd43e6554dd5c80e", "540d6e3d9d5b41615455d689", "540f08445d20628a1de8ba16", "540f08445d20628a1de8ba17", "541021995ef207bc2226816a", "541022745ef207bc22268234", "5411401d5d20628a1de91b43", "5411401d5d20628a1de91b44", "54118c1cce4d844b052c9ab1", "54118c6fce4d844b052c9b17", "5416d4d21e9d5deb3a4f1926", "541937a008711ffc714d2b32", "541abad108711ffc714ef6d6", "54210f4ac9b2fac76ef8863b", "54214757c9b2fac76ef8b051", "542158d2c9b2fac76ef8ed5b", "54227d1fc9b2fac76efa2a46", "5422a41cc9b2fac76efa511b", "5423d7f7939f0794291563f4", "54253b41ac4ff22a4b29d8da", "542bbcfcb3d78e0264434ccf", "542c100c3edf3cd00bac0379", "542e70729e6cb4c906ffb1d0", "542fb631ed8c8adfc184ddf5", "542fb636ed8c8adfc184ddf6", "542fb639ed8c8adfc184ddf7", "542fb639ed8c8adfc184ddf8", "542fb660ed8c8adfc184de63", "542fb661ed8c8adfc184de64", "542fb661ed8c8adfc184de65", "542fb663ed8c8adfc184de66", "542fb663ed8c8adfc184de67", "542fb666ed8c8adfc184de68", "542fb667ed8c8adfc184de69", "542fb668ed8c8adfc184de6a", "542fb669ed8c8adfc184de6b", "542fb687ed8c8adfc184debe", "542fb688ed8c8adfc184dec0", "542fb68bed8c8adfc184dec7", "54321b950a57c9021738063d", "54321c140a57c90217380655", "54321c840a57c90217380670", "5432231f0a57c90217380a5f", "543223200a57c90217380a63", "543223200a57c90217380a67", "543223200a57c90217380a6f", "543223200a57c90217380a73", "543223200a57c90217380a77", "543223210a57c90217380a7b", "543223210a57c90217380a7f", "543223210a57c90217380a83", "543223210a57c90217380a87", "543223210a57c90217380a8b", "543223220a57c90217380a97", "543223230a57c90217380aa1", "543223240a57c90217380aaf", "543223240a57c90217380ab7", "543223250a57c90217380abd", "543223250a57c90217380ac3", "543223260a57c90217380ad1", "543224930a57c90217380b1f", "5433c75b9338bc3e0bc46d09", "5434fe056e93b4b329c75c87", "543518d66e93b4b329c780ef", "543b951bed8c8adfc184e97e", "543b951ded8c8adfc184e982", "543b9520ed8c8adfc184e987", "543b9521ed8c8adfc184e98a", "543b9522ed8c8adfc184e98d", "543b9524ed8c8adfc184e990", "543b9526ed8c8adfc184e993", "543b9529ed8c8adfc184e998", "543b952ced8c8adfc184e99c", "543b952ded8c8adfc184e99f", "543b9530ed8c8adfc184e9a4", "543b9532ed8c8adfc184e9a7", "543b9693ed8c8adfc184e9ad", "543b9694ed8c8adfc184e9b0", "543b9695ed8c8adfc184e9b3", "543b9696ed8c8adfc184e9b4", "543b9699ed8c8adfc184e9b9", "543b96a7ed8c8adfc184e9c6", "543b96a8ed8c8adfc184e9c9", "543b96abed8c8adfc184e9cd", "543b96afed8c8adfc184e9d3", "543b96b6ed8c8adfc184e9dc", "543b96bded8c8adfc184e9e4", "543b96caed8c8adfc184e9ee", "543b96cced8c8adfc184e9f3", "543b96ceed8c8adfc184e9f6", "543b96eaed8c8adfc184ea12", "543b96eced8c8adfc184ea15", "543b96efed8c8adfc184ea19", "543b96f5ed8c8adfc184ea21", "543b9703ed8c8adfc184ea31", "543b9704ed8c8adfc184ea34", "543b9706ed8c8adfc184ea37", "543b970aed8c8adfc184ea3e", "543b970ced8c8adfc184ea41", "543b9711ed8c8adfc184ea4a", "543b9725ed8c8adfc184ea5f", "543b9726ed8c8adfc184ea62", "543b9727ed8c8adfc184ea65", "543b9729ed8c8adfc184ea68", "543b972bed8c8adfc184ea6d", "543b972fed8c8adfc184ea72", "543b9738ed8c8adfc184ea7e", "543b973bed8c8adfc184ea83", "543b973ded8c8adfc184ea87", "543b9743ed8c8adfc184ea8f", "543b9745ed8c8adfc184ea92", "543b9749ed8c8adfc184ea99", "543b974aed8c8adfc184ea9c", "543b974ced8c8adfc184ea9f", "543b974ded8c8adfc184eaa2", "543b9757ed8c8adfc184eab1", "543b9759ed8c8adfc184eab4", "543b976aed8c8adfc184eacb", "543b976eed8c8adfc184ead0", "543b9776ed8c8adfc184eada", "543b9778ed8c8adfc184eadd", "543b977aed8c8adfc184eae1", "543b977ced8c8adfc184eae5", "543b977fed8c8adfc184eae9", "543b9780ed8c8adfc184eaec", "543b9782ed8c8adfc184eaef", "543b9785ed8c8adfc184eaf4", "543b9789ed8c8adfc184eafb", "543b978bed8c8adfc184eafe", "543b9790ed8c8adfc184eb05", "543b9791ed8c8adfc184eb08", "543b9793ed8c8adfc184eb0b", "543b9796ed8c8adfc184eb10", "543b97a0ed8c8adfc184eb1f", "543b97a4ed8c8adfc184eb27", "543b97a5ed8c8adfc184eb2a", "543b97a8ed8c8adfc184eb2f", "543b97aaed8c8adfc184eb34", "543b97bbed8c8adfc184eb4b", "543b97bced8c8adfc184eb4e", "543b97beed8c8adfc184eb51", "543b97c0ed8c8adfc184eb56", "543b97c2ed8c8adfc184eb59", "543b97c3ed8c8adfc184eb5c", "543b97cded8c8adfc184eb69", "543b97d8ed8c8adfc184eb7a", "543b97daed8c8adfc184eb7f", "543b97dced8c8adfc184eb82", "543b97dded8c8adfc184eb85", "543b97e1ed8c8adfc184eb8c", "543b97e5ed8c8adfc184eb93", "543b97e7ed8c8adfc184eb96", "543b97e8ed8c8adfc184eb99", "543b97efed8c8adfc184eba4", "543b97f0ed8c8adfc184eba7", "543b97f2ed8c8adfc184ebaa", "543b97f6ed8c8adfc184ebb1", "543b97f7ed8c8adfc184ebb4", "543b97f9ed8c8adfc184ebb7", "543b97fced8c8adfc184ebbc", "543b9800ed8c8adfc184ebc3", "543b9802ed8c8adfc184ebc6", "543b9803ed8c8adfc184ebc9", "543b9805ed8c8adfc184ebcc", "543b980fed8c8adfc184ebdc", "543b9812ed8c8adfc184ebe1", "543b9813ed8c8adfc184ebe4", "543b9815ed8c8adfc184ebe8", "543b982eed8c8adfc184ec01", "543b9833ed8c8adfc184ec07", "543b9835ed8c8adfc184ec0a", "543b9898ed8c8adfc184ec66", "543b989ced8c8adfc184ec6d", "543b989fed8c8adfc184ec71", "543b98a3ed8c8adfc184ec78", "543b98a6ed8c8adfc184ec7d", "543b9c97ed8c8adfc184ec8b", "543b9c9fed8c8adfc184ec99", "543b9ca0ed8c8adfc184ec9b", "543b9cb6ed8c8adfc184ecbe", "543b9cb9ed8c8adfc184ecc8", "543b9e33ed8c8adfc184eea5", "543b9e4aed8c8adfc184eebf", "543b9e4bed8c8adfc184eec2", "543b9e4bed8c8adfc184eec3", "543b9e57ed8c8adfc184eed3", "543b9e5eed8c8adfc184eedd", "543b9e68ed8c8adfc184eeed", "543b9e73ed8c8adfc184eefc", "543b9e8fed8c8adfc184ef18", "543b9e91ed8c8adfc184ef1b", "543b9e99ed8c8adfc184ef26", "543b9ea1ed8c8adfc184ef33", "543b9ebfed8c8adfc184ef5a", "543bae18a54c212b7f0369cc", "543ce735a54c212b7f0527d1", "543cf256a54c212b7f053f05", "543e650ea54c212b7f069699", "543f8bab774946ac11a41933", "543f947ea54c212b7f07864b", "54410033160d15693ae3fc4a", "544100af160d15693ae3fcad", "54462fd5448403d3160ee298", "54474f48448403d3160fa679", "544765042cc3964a6185054b", "544765d32cc3964a618505d1", "544783f60de3d09e57d41802", "544b3b3281e5ffe4269ff28d", "544b3ca281e5ffe4269ff3b7", "544c865081e5ffe426a02d61", "544de36681e5ffe426a0d8fc", "544f219581e5ffe426a455a0", "544f3bb581e5ffe426a51609", "544f426681e5ffe426a59136", "544f57ef81e5ffe426a6201b", "544f704581e5ffe426a75e82", "544f771f81e5ffe426a7de83", "5451cc1a81e5ffe426ad7ddc", "5451e91132c97fb45abe383c", "54532f85c4f92bdd650867f7", "5454d18b6485172520a6739a", "5454d45e6485172520a6803e", "5455c2456577902720ceb0e0", "5455eb1e6577902720cecbb2", "5455ebb56485172520a6bbe4", "5455ec2f6577902720cecc36", "5455ecf06577902720ceccce", "5455ed8e6577902720ceccf0", "5455edfa6577902720cecd59", "5458a3024e9bef964387f872", "5458a90e4e9bef96438805b5", "5458c4440406ba9843449a2a", "545b24870406ba9843481c52", "545b25780406ba9843481d0b", "545b3f230406ba9843483a31", "545c76364e9bef96438bfe0c", "545c775e4e9bef96438bfe7a", "545ca5070406ba984349f374", "545ca5220406ba984349f3b8", "545ca9914e9bef96438c3464", "545cb1494e9bef96438c43aa", "545cdb678e735e2df0a55706", "545cdb748e735e2df0a55723", "545cdb798e735e2df0a55730", "545cdb7b8e735e2df0a55734", "545cdb898e735e2df0a55751", "545cdb8f8e735e2df0a5575d", "545cdb9e8e735e2df0a5577c", "545cdbf88e735e2df0a5581d", "545cdbfe8e735e2df0a5582b", "545dfcd24e9bef96438cd625", "5461d977ec134c74181c9a5c", "5461da5eec134c74181c9bea", "5461ee512f3985451da65bfa", "5461effb2f3985451da65f76", "5462d061c0e58fa62f7a173f", "5462d59051baf6162f5b206b", "5462da6bc0e58fa62f7a1edc", "5462db3ec0e58fa62f7a2056", "5462e4c3c0e58fa62f7a2dc5", "54635f4d9e2663d467ff4c9e", "546439dc7762b6a27bf9b963", "54649eaaf286d4a47ba0c38e", "5465f1357762b6a27bfacd6e", "54687fdef286d4a47ba2b650", "54698d79f286d4a47ba31240", "5469eae1f286d4a47ba4090e", "546b42c9f286d4a47ba54d4d", "546cb00e7762b6a27bfe0db8", "546cb00f7762b6a27bfe0e06", "546cb00f7762b6a27bfe0e12", "546cb0117762b6a27bfe0ec8", "546cb0157762b6a27bfe1022", "546cb0167762b6a27bfe1079", "546cb0177762b6a27bfe107c", "546cb0177762b6a27bfe1091", "546cb0177762b6a27bfe10b2", "546cb01b7762b6a27bfe11dc", "546cb0547762b6a27bfe2510", "546cb06f7762b6a27bfe2e57", "546cb07e7762b6a27bfe3367", "546cb0e57762b6a27bfe577a", "546cb1227762b6a27bfe6b2a", "546dabb07762b6a27bfee128", "546dc818e48a53b866eed00d", "546dd06cf59e8e7977e69c63", "546dd078f59e8e7977e69caa", "546dd07df59e8e7977e69cca", "546dd0a1f59e8e7977e69d88", "546dd0faf59e8e7977e69eff", "546dd172f59e8e7977e6a0cc", "546eeddaf286d4a47ba8b99d", "546f5590f286d4a47ba99185", "546f6a14f286d4a47ba9f16a", "5472e743e2036f8310d7830c", "54745b8850003a811044b3a7", "5474b51150003a8110450ad3", "54757571e2036f8310da6fd6", "54761809e2036f8310dbc2cd", "5476c61950003a811046b031", "5476c88be2036f8310dc5786", "547c4c3a51d0bd240e91ae5b", "547c8093b43070220e8fc8ea", "547c8ad051d0bd240e9248de", "547c8b3951d0bd240e924976", "547c8c7e51d0bd240e924bb0", "547da84651d0bd240e936fa7", "547ed38251d0bd240e94fe59", "547f44cda3a236024565b6a5", "547f4614a3a236024565b7af", "547f48225011dd00458fd8ec", "54803ce2a3a23602456628bf", "5481ade2a3a236024567f0a9", "5481bee0a3a2360245680236", "54853c0e5011dd0045916858", "548691136de7962a1c976fc3", "5486ef3691e41e2c1c397d56", "54885eab6de7962a1c985264", "548940ed91e41e2c1c3aeba6", "548963b66de7962a1c989c96", "548a92f2a16f953b26962c88", "548ab9c491e41e2c1c3bf6d9", "548b2d3b91e41e2c1c3c543e", "548b328591e41e2c1c3c55d3", "548eeba26de7962a1c99e5ce", "549154868416202619604f3a", "54915c287a0fe02819dac1cb", "5493f3414809106a20da9ccd", "549a5c74650bd56c20452d02", "549a5e8c4809106a20dd981d", "549fa2f30db933850b71404b", "549fab710db933850b714145", "549faf391d37c3870b4224b0", "549fcb5c1d37c3870b422951", "54a107e11d37c3870b42a8f7", "54a10b3b1d37c3870b42ade3", "54a138860db933850b71bf71", "54a13baf1d37c3870b42f9d1", "54a244ae1d37c3870b4376d5", "54a24d120db933850b721dbc", "54a2891a1d37c3870b43f419", "54a542a1125e7e0b4dbae7f1", "54a542a1125e7e0b4dbae7f5", "54a542a1125e7e0b4dbae7f9", "54a542a1125e7e0b4dbae801", "54a542a2125e7e0b4dbae805", "54a640e4125e7e0b4dbbe246", "54a7bf5d5886f9ae14fd90d4", "54a8f8545886f9ae14fdbc0b", "54a9020e5886f9ae14fdbdaa", "54a9049f5886f9ae14fdbed4", "54a906975886f9ae14fdbf68", "54a908c05886f9ae14fdc001", "54a9217a5886f9ae14fddcac", "54aa4ad833eb78ac14b37e14", "54aa74dd5886f9ae14fe9dec", "54aa74dd5886f9ae14fe9dee", "54aa75025886f9ae14fe9e03", "54aa754d5886f9ae14fe9e34", "54aa754d5886f9ae14fe9e36", "54aa754d5886f9ae14fe9e38", "54aa75b65886f9ae14fe9e53", "54aa75b75886f9ae14fe9e55", "54aa75b75886f9ae14fe9e57", "54aa75d233eb78ac14b3ad1b", "54aa798d33eb78ac14b3afc8", "54aa7db55886f9ae14feabc9", "54ad22dc5886f9ae1400bbfb", "54ad238f5886f9ae1400bdad", "54ad23e65886f9ae1400be47", "54ae1a345886f9ae14016559", "54ae679a33eb78ac14b889a0", "54ae921033eb78ac14b9211e", "54af818141482a195c203f5b", "54af8736471d421b5c768171", "54afd92433eb78ac14bb63df", "54afdecf5886f9ae1404b48a", "54b2458e5fe1dbdb1eb2409f", "54b353be99b12edd1e72120d", "54b36f7499b12edd1e723307", "54b3aace5fe1dbdb1eb2a731", "54b4e5b0674b7cbe1ab45dbf", "54b4e637674b7cbe1ab45dcb", "54b4e664674b7cbe1ab45dd7", "54b4e684674b7cbe1ab45de3", "54b4e69a674b7cbe1ab45def", "54b4e780674b7cbe1ab45e5f", "54b4e94f674b7cbe1ab45f33", "54b4ea19674b7cbe1ab45f99", "54b4ea71674b7cbe1ab45fb9", "54b4ea86674b7cbe1ab45fc5", "54b4ea97674b7cbe1ab45fd1", "54b4eaae674b7cbe1ab45fdd", "54b4ed1299b12edd1e739c12", "54b4ef53674b7cbe1ab461a7", "54b4ef8e674b7cbe1ab461dd", "54b507e0674b7cbe1ab46ad9", "54b7611d253d2383103e9764", "54b7a189253d2383103f024e", "54b7a2e3253d2383103f041a", "54b8a0db4424850654738aac", "54b8a3694424850654738b79", "54bf511503776f912e0915e4", "54c0c5df6300c9794680ffff", "54c1153c6300c97946818291", "54c11825cff2f2774695559c", "54c1efae6300c9794681dd78", "54c208847bfade13224b142d", "54c24c827bfade13224bbb8e", "54c389e71502bf8775a3be94", "54c6266e6b3c8ee804f06f05"]
                        }
                    },
                    "aggs":{
                        "all_accounts":{
                            "terms":{
                                "field":"voucher_line_item.account_id._id",
                                size:0
                            },
                            "aggs":{
                                "totalamount":{
                                    "sum":{
                                        "field":"voucher_line_item.amount.amount"
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
}).then(
    function (searchData) {
        console.log("serach Data>>>>>" + JSON.stringify(searchData));
    }).catch(function (err) {
        console.log("errr>>>>>>" + err);
    })


//filter and sorting in aggregate query
client.search({"index":"daffodilsw", "type":"voucherlineitems", searchType:"count", "body":{
    "query":{
        "filtered":{
            "filter":{
                "range":{
                    "voucher_id.voucher_date":{
                        "from":"2014-01-01",
                        "to":"2015-01-01"
                    },
                    "_cache":false
                }
            }
        }
    }, "aggs":{
        "all_accounts":{
            "terms":{
                "field":"account_id._id",
                "order":{"totalamount":"desc"},
                size:0
            },
            "aggs":{
                "totalamount":{
                    "sum":{"field":"amount.amount"}
                }
            }
        }
    }

}
}).then(
    function (searchData) {
        console.log("serach Data>>>>>" + JSON.stringify(searchData));
    }).catch(function (err) {
        console.log("errr>>>>>>" + err);
    });

/*client.search({"index":"daffodilsw", "type":"voucher", searchType:"count", "body":{
 "query":{
 "filtered":{
 "filter":{
 "range":{
 "voucher_date":{
 "from":"2014-01-01",
 "to":"2015-01-01"
 }
 }
 }
 }
 }, "aggs":{
 "nested_voucherlineitems":{
 "nested":{
 "path":"voucher_line_item"
 }, "aggs":{
 "all_accounts":{
 "terms":{
 "field":"voucher_line_item.account_id._id",
 "order":{"totalamount":"desc"},
 size:0
 },
 "aggs":{
 "totalamount":{
 "sum":{"field":"voucher_line_item.amount.amount"}
 }
 }
 }
 }
 }

 }

 }
 }).then(
 function (searchData) {
 console.log("serach Data>>>>>" + JSON.stringify(searchData));
 }).catch(function (err) {
 console.log("errr>>>>>>" + err);
 });*/


// date range aggregation
client.search({"index":"daffodilsw", "type":"voucherlineitems", searchType:"count", "body":{
    "aggs":{
        "fywiseaccountstotal":{
            "date_range":{
                "field":"voucher_id.voucher_date",
                "format":"YYYY-MM-DD",
                "ranges":[
                    {"from":"2012-04-01", "to":"2013-04-01"},
                    {"from":"2013-04-01", "to":"2014-04-01"},
                    {"from":"2014-04-01", "to":"2015-04-01"}
                ]
            },
            "aggs":{
                "accountwise":{
                    "terms":{
                        "field":"account_id._id",
                        size:0
                    }, "aggs":{
                        "top_hit_account":{
                            "top_hits":{
                                _source:{
                                    include:["account_id", "amount"]
                                }, size:1
                            }
                        }, "totalamount":{
                            "sum":{"field":"amount.amount"}
                        }
                    }
                }
            }
        }
    }

}
}).then(
    function (searchData) {
        console.log("serach Data>>>>>" + JSON.stringify(searchData));
    }).catch(function (err) {
        console.log("errr>>>>>>" + err);
    });


// filter on nested data
/*GET megacorp/sellers/_search?search_type=count
 {
 "aggs": {
 "sellers": {
 "nested": {
 "path": "sellers"
 },
 "aggs": {
 "trusted_filter": {
 "filter": {
 "term": {
 "sellers.trusted":false
 }
 },
 "aggs": {
 "name_terms": {
 "terms": {
 "field": "sellers.name"
 }
 }
 }
 }
 }
 }
 }
 }

 // filter resellers by name and get the max price
 GET megacorp/products/_search?search_type=count
 {
 "aggs": {
 "resellers": {
 "nested": {
 "path": "resellers"
 },
 "aggs": {
 "name_filter": {
 "filter": {
 "term": {
 "resellers.name":"apple"
 }
 },
 "aggs": {
 "name_terms": {
 "terms": {
 "field": "resellers.name"
 }
 ,"aggs":{
 "maxQuantity":{
 "max":{"field":"resellers.price"}
 }
 }
 }
 }
 }
 }
 }
 }
 }*/


//*****************************************************end of query in elastic search ***********************************************************************************************
//*****************************************************start of update in elastic search ***********************************************************************************************
/*client.indices.putMapping({index:"megacorp", type:"countries", "body":{
 "countries":{
 "properties":{"country":{"type":"string", "index":"not_analyzed"}, "states":{"type":"object", "properties":{"state":{"type":"string", "index":"not_analyzed"}, "cities":{"type":"nested", "properties":{"city":{"type":"string", "index":"not_analyzed"}, "schools":{"type":"nested", "properties":{"school":{"type":"string", "index":"not_analyzed"}}}}}}}}  }
 }
 }, function (err, res) {
 console.log("err>>>" + err);
 console.log("res>>>>" + JSON.stringify(res));
 })*/


client.index({"index":"megacorp", "type":"countries", id:1, body:{country:"India", code:"91", "states":{ state:"haryana", "cities":[
    {"city":"hisar", "schools":[
        {"school":"vdjs"},
        { "school":"model"}
    ]},
    {"city":"sirsa", "schools":[
        {"school":"jindal"},
        {"school":"modern"}
    ]},
    {"city":"rohtak", "schools":[
        {"school":"dav"},
        {"school":"high school"}
    ]}
]}
}}).then(
    function (indexedData) {
        console.log("data indexed>>>" + JSON.stringify(indexedData));
    }).catch(function (err) {
        console.log("Err in data indexing>>>" + err);
    })


/*client.update({"index":"megacorp", "type":"countries", "id":"AUtN6zndsIzwcpRjg7KC", body:{
 "script":"for (int i = 0; i < ctx._source.states.cities.size(); i++){if(ctx._source.states.cities[i].city == citytobeupdated){ctx._source.states.cities[i].city=newname;}}",
 "params":{
 "new_name":"haryana1",
 "newcity":{"city":"bathinda"},
 "citytobeupdated":"hisar",
 "newname":"hisar-e-firoza"
 }
 }}, function (err, res) {
 console.log("Err in update>>>>" + err);
 console.log("res in update>>>>" + JSON.stringify(res));
 })*/

/*client.update({"index":"megacorp", "type":"countries", "id":1, body:{
 "script":"ctx._source.views +=1",
 "upsert":{
 "views":1
 }
 }}, function (err, res) {
 console.log("err in update>>>" + err);
 console.log("Res in update>>>" + JSON.stringify(res));
 })*/

/*

 client.update({"index":"megacorp", "type":"employees", "body":{
 "query":{
 "term":{"departments":"development"}
 }, "script":"ctx._source.counter =1"
 }}, function (err, res) {
 console.log("Err>>>" + err);
 console.log("Res>>>" + JSON.stringify(res));
 })
 */


/*client.bulk({
 body:[
 {"index":{"_index":"megacorp", _type:"tasks", _id:1}},
 {"task":"testing"},
 {"update":{"_index":"megacorp", "_type":"tasks", _id:1}},
 {"doc":{"priority":"high"}},
 {"index":{"_index":"megacorp", _type:"tasks", _id:3}},
 {"task":"second testing task"},
 {"delete":{"_index":"megacorp", "_type":"tasks", "_id":3}}
 ]
 }, function (err, res) {
 console.log("err....." + err);
 console.log("res>>>" + JSON.stringify(res));
 })*/


//*****************************************************end of update in elastic search ***********************************************************************************************



//
////var body = {
////    properties:{
////        tag1         : {"type" : "string", "index" : "not_analyzed"},
////    }
////}


//
//client.indices.getMapping({
//    index:"megacorp",
//    type:"employees",
//}, function (err, res) {
//    console.log("err>>>>" + err);
//    console.log("res>>>>" + JSON.stringify(res));
//})
//
////client.search({"index":"t*", "type":"persons", from:5, size:5}).then(
////    function (searchData) {
////        console.log("serach Data>>>>>" + JSON.stringify(searchData));
////    }).catch(function (err) {
////        console.log("errr>>>>>>" + err);
////    })
//
////client.indices.existsAlias({"index":"sachintest", type:"persons", id:1}).then(
////    function (searchData) {
////        console.log("serach Data>>>>>" + JSON.stringify(searchData));
////    }).catch(function (err) {
////        console.log("errr>>>>>>" + err);
////    })
//
////client.getSource({"index":"sachintest", "type":"persons", id:1}).then(
////    function (searchData) {
////        console.log("serach Data>>>>>" + JSON.stringify(searchData));
////    }).catch(function (err) {
////        console.log("errr>>>>>>" + err);
////    })
//
//
////client.indices.putMapping({index:"sachintest", type:"mappingtest", "mapping":{
////    "mappingtest":{
////        "properties":{
////            "tweet":{
////                "type":"string",
////                "analyzer":"english"
////            },
////            "date":{
////                "type":"date"
////            },
////            "name":{
////                "type":"string"
////            },
////            "user_id":{
////                "type":"long"
////            }
////        }
////    }
////}
////}, function (err, res) {
////    console.log("err>>>" + err);
////    console.log("res>>>>" + JSON.stringify(res));
////})
//
////var body = {
////    properties:{
////        tag1         : {"type" : "string", "index" : "not_analyzed"},
////    }
////}
////
////client.indices.putMapping({index:"sachintest", type:"tweet", body:body},function(err,res){
////    console.log("err>>>>>>" + err);
////    console.log("res>>>>" + JSON.stringify(res));
////});
//
////client.indices.analyze({"index":"sachintest", "type":"stringtest", analyzer:"standard", text:"Sachin bansla"}).then(
////    function (searchData) {
////        console.log("serach Data>>>>>" + JSON.stringify(searchData));
////    }).catch(function (err) {
////        console.log("errr>>>>>>" + err);
////    });
//
////client.index({"index":"sachintest", "type":"stringtest", id:2, body:{"doc":"Quick brown foxes leap over lazy dogs in summer"}}).then(
////    function (insertData) {
////        console.log("insertData>>>>>" + JSON.stringify(insertData));
////    }).catch(function (err) {
////        console.log("errr>>>>>>" + err);
////    })
//
////client.ping({
////    requestTimeout: 1000,
////    // undocumented params are appended to the query string
////    hello: "elasticsearch!"
////}, function (error) {
////    if (error) {
////        console.error('elasticsearch cluster is down!');
////    } else {
////        console.log('All is well');
////    }
////});
//
////client.create({"index":"test", "type":"persons11", id:1, body:{"name":"Sachin"}}).then(
////    function (insertData) {
////        console.log("insertData>>>>>" + JSON.stringify(insertData));
////    }).catch(function (err) {
////        console.log("errr>>>>>>" + err);
////    })
//
////client.index({"index":"test", "type":"persons111", id:5, body:{"name":"Sachin11", age:25, languages:[
////    {"language":"English", read:true, speak:false, write:true},
////    {"language":"Hindi", read:true, speak:true, write:true}
////]}}).then(
////    function (insertData) {
////        console.log("insertData>>>>>" + JSON.stringify(insertData));
////    }).catch(function (err) {
////        console.log("errr>>>>>>" + err);
////    })
//
////client.search({"index":"test", "type":"persons111"}).then(function (searchData) {
////    console.log("serach Data>>>>>" + JSON.stringify(searchData));
////}).catch(function (err) {
////console.log("errr>>>>>>" + err);
////})
//
////client.search({"index":"test", "type":"persons111",body:{query:{match:{name:"Sachin"}}}}).then(function (searchData) {
////    console.log("serach Data>>>>>" + JSON.stringify(searchData));
////}).catch(function (err) {
////        console.log("errr>>>>>>" + err);
////    })
//
////client.search({"index":"test", "type":"persons111",body:{query:{match:{name:"Sachin"}}}}).then(function (searchData) {
////    console.log("serach Data>>>>>" + JSON.stringify(searchData));
////}).catch(function (err) {
////        console.log("errr>>>>>>" + err);
////    })
//
////client.count({"index":"test", "type":"persons"}).then(
////    function (countData) {
////        console.log("countData>>>>>" + JSON.stringify(countData));
////    }).catch(function (err) {
////        console.log("errr>>>>>>" + err);
////    });
//
//
//
//


