

exports.onQuery = function (query, result, db) {
    result = result || {};
    result.result =  result.result || [];

    return db.invokeFunction("Porting.manageTxs", [
        {"get": true, "status": {"$in": ["rollback", "commit", "pending"]}, "asGroup": true}
    ]).then(function (pendingTxns) {
        if(!pendingTxns || pendingTxns.length===0){
                //no need to do anything
        }else{

            for (var i = 0; i < pendingTxns.length; i++) {
                var data = pendingTxns[i].data;
                for (var j = 0; j < data.length; j++) {
                    result.result.push({"db": pendingTxns[i].db, "count": data[j].count,"min": data[j].minTime, "max": data[j].maxTime, "serverName": data[j]._id.serverName, "status": data[j]._id.status });

                }
            }
        }
    })
};

