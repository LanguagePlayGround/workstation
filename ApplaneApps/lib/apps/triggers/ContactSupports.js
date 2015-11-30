var Constants = require("ApplaneDB/lib/Constants.js");


exports.onPreSave = function (document, db) {
    if (document.type == "insert") {
        return handleInsert(document, db);
    } else if (document.type == "update") {
        return db.connectUnauthorized("daffodilsw").then(function (daffodildb) {
            var updatedField = document.getUpdatedFields();
            var id = document.get("_id");
            var update = {};
            if (updatedField) {
                for (var i = 0; i < updatedField.length; i++) {
                    var value = document.get(updatedField[i]);
                    update[updatedField[i]] = value;
                    if (updatedField[i] === "subject") {
                        update["task"] = value;
                    }
                }
            }
            if (Object.keys(update).length > 0) {
                return daffodildb.update({$collection:"tasks", $update:[
                    {_id:id, $set:update}
                ], $modules:{Role:0}})
            }
        });
    } else {
        var id = document.get("_id");
        return  db.connectUnauthorized("daffodilsw").then(function (daffodildb) {
            return daffodildb.update({$collection:"tasks", $delete:[
                {_id:id}
            ], $modules:{Role:0}})
        })
    }
}

//we have require to insert pl.contactSupport Data into Daffodilsw>Tasks(with employee and Delivery information, which we got from applane Customer table, by default employee is Amit.Singh and delivery is nothing) , At last we are cancelling update to pl.contactSupport -- Rajit garg
function handleInsert(document, db) {
    var dbName = db.db.databaseName;
    var daffodildb = undefined;
    var employeeid = undefined;
    var deliveryid = undefined;
    var insert = {};
    return db.connectUnauthorized("daffodilsw").then(
        function (daffodilsw) {
            daffodildb = daffodilsw
            var filter = {};
            filter[Constants.ApplaneCustomers.DB] = dbName
            var query = {$collection:Constants.ApplaneCustomers.TABLE, $filter:filter, $limit:1};
            return daffodildb.query(query)
        }).then(
        function (result) {
            if (result && result.result && result.result.length > 0) {
                deliveryid = result.result[0][Constants.ApplaneCustomers.DELIVERYID];
                employeeid = result.result[0][Constants.ApplaneCustomers.EMPLOYEEID];
                if (deliveryid) {
                    var query = {$collection:"deliveries", $filter:{"_id":deliveryid._id}, $limit:1, $fields:{"entity_id":1}};
                    return daffodildb.query(query)
                }
            }
        }).then(
        function (deliveries) {
            if (deliveries && deliveries.result && deliveries.result.length > 0) {
                insert["delivery_id"] = {"_id":deliveries.result[0]._id};
                if (deliveries.result[0].entity_id) {
                    insert["entity_id"] = deliveries.result[0].entity_id;
                }
            }
            if (!employeeid) {
                employeeid = {
                    "_id":"53a437e36dc89c02007cbbf0"
                }
            }
            var query = {$collection:"employees", $filter:{"_id":employeeid._id}, $limit:1, $fields:{"business_unit_id":1, "department_id":1}};
            return daffodildb.query(query)
        }).then(
        function (employees) {
            if (employees && employees.result && employees.result.length > 0) {
                insert["ownerid"] = {"_id":employees.result[0]._id}
                if (employees.result[0].business_unit_id) {
                    insert["business_unit_id"] = employees.result[0].business_unit_id[0]
                }
                if (employees.result[0].department_id) {
                    insert["department_id"] = employees.result[0].department_id
                }
            }
            if (!db.user || !db.user._id || !db.user.username) {
                throw new Error("db user-id and username must be present.")
            }
            insert["customer_support_info"] = {"db":dbName, "user":{"_id":db.user._id, "username":db.user.username}, "date":new Date()};
            insert["subject"] = document.get(Constants.ContactSupports.SUBJECT);
            insert["description"] = document.get(Constants.ContactSupports.DESCRIPTION);
            insert["attachment"] = document.get(Constants.ContactSupports.ATTACHMENT);
            insert["task_type"] = document.get(Constants.ContactSupports.TYPE);
            insert["applicationTags"] = document.get(Constants.ContactSupports.APPLICATION_TAGS);
            insert["priority"] = {
                "_id":"53ad0776a2191b0500b99c8c",
                "name":"5"
            };
            insert["isContactSupport"] = true;
            insert["task"] = document.get(Constants.ContactSupports.SUBJECT);
            insert["goal"] = {
                "_id":"540d2e479d5b416154483f05",
                "name":"Delivery"
            };
            return daffodildb.update({$collection:"tasks", $insert:[insert], $modules:{Role:0}});
        }).then(function (result) {
            document.cancelResult = result && result.tasks && result.tasks.$insert ? result.tasks.$insert[0] : {};
            document.setCancelUpdates();
        });
}

//we are querying Daffodilsw > Tasks, and showing this data   - Rajit garg
exports.onQuery = function (query, result, db) {
    var dbName = db.db.databaseName;
    var filter = query.$filter || {};
    var scope = filter[Constants.ContactSupports.SCOPE];
    if ((!scope) || scope === Constants.ContactSupports.Scope.SELF) {
        //complete filter
        filter["customer_support_info.db"] = dbName;
        filter["customer_support_info.user._id"] = db.user._id
    } else if (scope === Constants.ContactSupports.Scope.ORGANIZATION) {
        filter["customer_support_info.db"] = dbName;
    }
    delete filter[Constants.ContactSupports.SCOPE];
    return resolveFilterForApplicationTags(filter, db).then(
        function () {
            return  db.connectUnauthorized("daffodilsw")
        }).then(
        function (daffodildb) {
            var query = {$collection:"tasks", $filter:filter, $sort:{_id:-1}, $modules:{Role:0}};
            return daffodildb.query(query);
        }).then(function (data) {
            var newResult = [];
            for (var i = 0; i < data.result.length; i++) {
                newResult.push({"_id":data.result[i]._id, "subject":data.result[i].subject, "description":data.result[i].description, "status":data.result[i].status, "completeddate":data.result[i].completeddate, "ownerid":data.result[i].ownerid, "task_progress":data.result[i].task_progress, "attachment":data.result[i].attachment, task_type:data.result[i].task_type, "applicationTags":data.result[i].applicationTags, totalWatches:data.result[i].totalWatches});
            }
            result.result = newResult;
        })
};


function resolveFilterForApplicationTags(filter, db) {
    if (filter[Constants.CustomerTags.APPLICATION_TAGS + "._id"]) {
        var d = require("q").defer();
        d.resolve();
        return d.promise;
    } else {
        return getApplicationTagsIds(db).then(function (applicationTags) {
            if (applicationTags && applicationTags.length > 0) {
//                filter[Constants.CustomerTags.APPLICATION_TAGS + "._id"] = {"$in":applicationTags};
            } else {
                filter["customer_support_info.db"] = db.db.databaseName;
            }
        })

    }
}

function getApplicationTagsIds(db) {
    var filter = {};
    filter[Constants.CustomerTags.CLIENT_DB] = db.db.databaseName;
    return db.query({$collection:Constants.CustomerTags.TABLE, $filter:filter}).then(function (customerTags) {
        if (customerTags && customerTags.result && customerTags.result.length > 0 && customerTags.result[0][Constants.CustomerTags.APPLICATION_TAGS] && customerTags.result[0][Constants.CustomerTags.APPLICATION_TAGS].length > 0) {
            var applicationTags = customerTags.result[0][Constants.CustomerTags.APPLICATION_TAGS];
            var applicationTagsIds = [];
            for (var i = 0; i < applicationTags.length; i++) {
                applicationTagsIds.push(applicationTags[i]._id);
            }
            return applicationTagsIds;

        } else {
            return [];
        }
    })
}

//this function insert entry into taskWatches Collection if taskid and user not already exist and also increment totalWatches in tasks collection
exports.populateTaskWatches = function (parameters, db) {
    if (!parameters || !parameters._id) {
        throw new Error("Task Id is mandatory to insert.");
    }
    var daffodildb = undefined;
    var id = parameters._id;
    return db.connectUnauthorized("daffodilsw").then(
        function (daffodildb1) {
            daffodildb = daffodildb1;
            var filter = {};
            filter["taskId"] = id;
            filter["customer_support_info.user._id"] = db.user._id;
            var query = {$collection:"taskWatches", $filter:filter, $limit:1};
            return daffodildb.query(query)
        }).then(
        function (taskWatches) {
            if (!taskWatches || !taskWatches.result || !taskWatches.result.length > 0) {
                return handleTaskWatches(id, daffodildb, db);
            }
        })
};


function handleTaskWatches(id, daffodildb, db) {
    var insert = {};
    insert["taskId"] = id;
    insert["customer_support_info"] = {"db":db.db.databaseName, "user":{"_id":db.user._id, "username":db.user.username}, "date":new Date()};
    return daffodildb.update({$collection:"taskWatches", $insert:[insert], $modules:{Role:0}}).then(
        function () {
            return daffodildb.update({$collection:"tasks", $update:[
                {_id:id, $inc:{totalWatches:1}}
            ], $modules:{Role:0}});
        })
}

exports.getCustomerTags = function (parameters, db) {
    return getApplicationTagsIds(db);
};




