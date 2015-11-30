var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
var MongodbManager = require("ApplaneBaas/lib/database/mongodb/MongoDBManager.js");


function removeBaasUserGroupIdFromApplications() {
    var query = {table: "applications__baas", columns: ["_id"], filter: {usergroups: "9d486e6a900b945bef0c01c78181a89f"}};
    var options = {ask: "baas", disablelogs: true};
    MongodbManager.startTransaction(options);
    DatabaseEngine.executeQuery(query, options, function (err, data) {
        if (err) {
            console.log(err.stack);
        } else {
            data = data.data;
            data.forEach(function (row) {
                row.usergroups = [
                    {_id: "9d486e6a900b945bef0c01c78181a89f", __type__: "delete"}
                ];
            });
            var updates = {table: "applications__baas", operations: data, excludejobs: true, excludemodules: true};
            UpdateEngine.executeUpdate(updates, options, function (err) {
                if (err) {
                    console.log("Error while saving ::::::::: " + err.stack);
                }
                MongodbManager.commitTransaction(options.txnid, options, function (err) {
                    if (err) {
                        console.log("Error while committing ::::::::: " + err.stack);
                    }
                    console.log("removeBaasUserGroupIdFromApplications complteed>>>>>>>>>>>>");
                })
            })
        }
    });
}

removeBaasUserGroupIdFromApplications();
