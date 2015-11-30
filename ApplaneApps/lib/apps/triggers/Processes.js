exports.update = function (parameters, db, options) {
    if (parameters && parameters.data) {
        var update = parameters.data;
        var process = parameters.process;
        var operation = update.$insert ? "insert" : update.$update ? "update" : update.$delete ? "delete" : update.$upsert ? "upsert" : "";
        var collection = update.$collection;
        var recordid = update["$" + operation]._id;
        return db.update(update).then(function (result) {
            if (result && operation === "insert") {
                if (result[collection] && result[collection]["$insert"] && result[collection]["$insert"].length > 0) {
                    recordid = result[collection]["$insert"][0]._id;
                }
            }
            process.message = JSON.stringify({operation: operation, collection: collection, recordid: recordid});
        });
    }
}