/**
 /**
 *
 * http://127.0.0.1:4500/rest/custom/module?module=GAEDataPorting&method=portData&parameters={"query":"select * from hris_employees where __key__=88 limit 1","database":"Daffodil"}&ask=baas
 * http://applanecrmhrd.appspot.com/sql/execute?query=show create table rfqquotation_criteria&dbName=DARCL&emailid=rohit.bansal@daffodilsw.com&password=daffodil&redirect=true&remoteaccess=jbbb123hrhk
 *
 * gaemappings__baas
 *     jobname
 *     inprogress
 *     id
 *     tableid
 *     ported
 *     status
 *     totalcount
 *     source : {
 *         sql : "select * from hris_employees ",
 *         alias : "employees"
 *         childs : [
 *          {sql:"select * from hris_documents where hris_employees={employees.__key__}",alias:"", childs:[]}
 *         ]
 *     }
 *
 */





var Utils = require("ApplaneCore/apputil/util.js");
var HttpUtil = require("ApplaneCore/apputil/httputil.js");
var GAE_MAPPINGS_TABLE = "pl.gaemappings";
var MongoClient = require("mongodb").MongoClient;
var Q = require("q");
var Self = require('./GAEDataPorting.js');
var key = {};

exports.portAllData = function (params, db) {
    key={};
    var recordId = params._id;
    var childMappings = undefined;
    var mapping = undefined;
    return getMapping(params._id, db).then(function (mappingResult) {
        mapping = mappingResult.result[0];

        if (mapping.inprogress) {
            throw new Error("Porting is already in progress for [" + mapping.id + "]");
        }
        return updateStatus({inprogress: true, status: "In Progress"}, recordId, db);
    }).then(function () {
        // clear the process field of all rows...
        if (mapping.startFromPreviousCursor !== true) {
            return clearAllChildMappingStatus(mapping, recordId, db);
        }
    }).then(function () {
        return db.query({$collection: GAE_MAPPINGS_TABLE, $filter: {_id: recordId}, $fields: {childMappings: 1}})
    }).then(function (childMappings) {
        childMappings = childMappings.result[0].childMappings || [];
        Utils.sort(childMappings, 'asc', "index");
        return Utils.iterateArrayWithPromise(childMappings, function (index, singleChildMapping) {  //one by one port all childs
            params._id = singleChildMapping.id._id;
            if (key[params._id] === true) {             // check two duplicate file is porting
                    throw new Error("duplication child porting found");
            }
            key[params._id] = true;
            var rowId = singleChildMapping._id;
            if (singleChildMapping && (singleChildMapping.process !== "Success" || !singleChildMapping.process)) { //skip successed child port if startfrompreviouscursor is true
                var error = undefined;
                return Self.portData(params, db).then(function () {
                    return checkForPortingStatus(params, db);   //wait till one port is sucess of fail
                }).fail(function(err){
                    error = err;
                }).then(function (childStatus) {
                    var childProcessUpdate = {};
                    childProcessUpdate.process = error ? "Error" : childStatus.status;
                    if(childStatus && childStatus.status==="Error"){
                        error = childStatus.error;
                    }
                    return db.update({$collection: GAE_MAPPINGS_TABLE, $update: [   //update child port row status
                        {
                            _id: recordId,
                            $set: {childMappings: { "$update": [
                                {_id: rowId, $set:childProcessUpdate}
                            ]}}
                        }
                    ]
                    }).then(function(){
                        if(error){
                            throw error;
                        }
                    })
                })
            }
        }).then(function () {
            return updateStatus({status: "Success", inprogress: false}, recordId, db);   // update the parent port status
        }).fail(function (err) {
            return updateStatus({status: "Error", inprogress: false, processStatus:[{status :JSON.stringify(Utils.getErrorInfo(err)), inprogress: false}]}, recordId, db);
        });
    });
}

function updateStatus(valueToSet, recordId, db) {
    return db.update({$collection: GAE_MAPPINGS_TABLE, $update: [
        {
            _id: recordId,
            $set: valueToSet
        }
    ]
    });
}

function clearAllChildMappingStatus(mapping, recordId, db) {
    var childMappings = mapping.childMappings || [];
    if (!childMappings || childMappings.length === 0) {
        return;
    }
    var childMappingUpdates = [];
    for (var i = 0; i < childMappings.length; i++) {
        var childMapping = childMappings[i];
        childMappingUpdates.push({_id: childMapping._id, $unset: {process: ""}});
    }
    return db.update({$collection: GAE_MAPPINGS_TABLE, $update: {_id: recordId, $set: {childMappings: {$update: childMappingUpdates}}}});
};


function checkForPortingStatus(params, db) {
    var d = Q.defer();
    var row = undefined;
    setTimeout(function () {
        db.query({$collection: GAE_MAPPINGS_TABLE, $filter: {_id: params._id}, $fields: {processStatus: 1, status: 1, inprogress: 1}}).then(
            function (result) {
                row = result.result[0];
                if (row.inprogress === true) {
                    return checkForPortingStatus(params, db);
                } else {
                    return {status:row.status,error:row.processStatus[0].status};
                }
            }).then(
            function (status) {
                d.resolve(status);
            }).fail(function (err) {
                d.reject(err);
            })
    }, 1000)
    return d.promise;
}

exports.portData = function (params, db) {
    var d = Q.defer();
    var portingtype = undefined;
    var cursor = undefined;
    var limit = undefined;
    var noOfRecords = undefined;
    var source = undefined;
    var database = undefined;
    var noofProcess = undefined;
    var processStatus = [];
    return getMapping(params._id, db).then(
        function (mappingResult) {
            mapping = mappingResult.result[0];
            if (mapping.jobname) {
                try {
                    mapping.jobname = JSON.parse(mapping.jobname);
                } catch (e) {
                    d.reject(new Error("Error in parsing jobname"));
                    return d.promise;
                }
            }
            if (params.targetDatabase) {
                mapping.targetdatabase = params.targetDatabase;
            }
            if (!mapping.targetdatabase) {
                d.reject(new Error("Select targetdatabase to port >>>>" + JSON.stringify(mapping)));
                return d.promise;
            }
            portingtype = mapping.portingtype;
            if (portingtype === undefined) {
                d.reject(new Error("Porting type is undefined >>>>" + JSON.stringify(mapping)));
                return d.promise;
            }
            source = mapping.source;
            if (!source) {
                d.reject(new Error("No source defined in mapping>>>>" + JSON.stringify(mapping)));
                return d.promise;
            }

            if (params.organizationId && source) {
                source = source.replace(/{_organizationid_}/ig, params.organizationId);
            }

            if (params.sourceDatabase && source) {
                source = source.replace(/{_db_}/ig, params.sourceDatabase);
            }
            mapping.source = source;

            source = JSON.parse(source);

            cursor = mapping.cursor;
            if (cursor === undefined) {
                cursor = 0;
            } else {
                cursor = Number(cursor);
            }

            limit = mapping.limit;
            if (limit === undefined) {
                limit = source.excel ? 2000 : 1;
            } else {
                limit = Number(limit);
            }


            noofProcess = mapping.noofprocess;
            if (noofProcess === undefined) {
                noofProcess = 1;
            } else {
                noofProcess = Number(noofProcess);
            }

            noOfRecords = mapping.noofrecords;
            if (noOfRecords === undefined) {
                noOfRecords = -1;
            } else {
                noOfRecords = Number(noOfRecords);
            }

            if (!source) {
                d.reject(new Error("Source not defined>>>>Mapping>>>>>" + JSON.stringify(mapping) + ">>>>>>>>>>source>>>>>" + JSON.stringify(source)));
                return d.promise;
            }
            if (!source.excel) {
                if (!source.database) {
                    d.reject(new Error("Select database to port >>>>" + JSON.stringify(mapping) + ">>>>>>>>>>source>>>>>" + JSON.stringify(source)));
                    return d.promise;
                }
                database = source.database.trim();

                if (!source.alias) {
                    d.reject(new Error("Source alias not defined>>>>Mapping>>>>>" + JSON.stringify(mapping) + ">>>>>>>>>>source>>>>>" + JSON.stringify(source)));
                    return d.promise;
                }
                if (!source.sql) {
                    d.reject(new Error("SQL not defined in source>>>>" + JSON.stringify(source) + ">>>>Mapping>>>" + JSON.stringify(mapping)));
                    return d.promise;
                }
            } else {
                if (!mapping.excelfile) {
                    throw new Error("Select file to upload.");
                }
                if (!source.mapping) {
                    throw new Error("Mapping is mandatory for excel porting.");
                }
            }


            if (source.childs) {
                for (var i = 0; i < source.childs.length; i++) {
                    var child = source.childs[i];
                    if (!child.alias) {
                        d.reject(new Error("alias not defined in child>>>" + JSON.stringify(child) + ">>>mapings>>>>" + JSON.stringify(mapping)));
                        return d.promise;
                    }
                    if (!child.sql) {
                        d.reject(new Error("sql not defined in child>>>" + JSON.stringify(child) + ">>>mapings>>>>" + JSON.stringify(mapping)));
                        return d.promise;
                    }

                    var childSql = child.sql;
                    if (childSql.indexOf(" where ") < 0) {
                        d.reject(new Error("Where clause does not exists in child >>>" + childSql + ">>>>Mapping>>>" + JSON.stringify(mapping)));
                        return d.promise;
                    }
                }
            }

            if (mapping.inprogress) {
                d.reject(new Error("Porting is already in progress for [" + mapping.id + "]"))
                return d.promise;
            }
            if (noofProcess > 1 && noOfRecords < 0) {
                noOfRecords = 500;
            }

            var startFromPreviousCursor = mapping.startFromPreviousCursor;
            var mappingProgress = {inprogress: true, status: "in progress", startFromPreviousCursor: true, pid: process.pid};
            if (startFromPreviousCursor) {
                processStatus = mapping.processStatus;
            } else {
                processStatus = [];
                for (var i = 0; i < noofProcess; i++) {
                    var startCursor = cursor + (i * noOfRecords);
                    var endCursor = (noOfRecords < 0) ? -1 : (startCursor + noOfRecords);
                    processStatus.push({_id: "Process" + i, cursor: startCursor, endcursor: endCursor, ported: 0});
                }
                mappingProgress.processStatus = processStatus;
                mappingProgress.ported = 0;
            }

            return updatePorgress({$query: {_id: mapping._id}, $set: mappingProgress}, db);

        }).then(
        function () {
            return portAsynch(processStatus, limit, mapping, database, portingtype, noofProcess, db);
        }).then(
        function (result) {
            d.resolve({result: result, showinpopup: true});
        }).fail(function (err) {
            return updatePorgress({$query: {_id: mapping._id}, $set: {status: "Error", inprogress: false}}, db).then(
                function () {
                    d.reject(err);
                }).fail(function () {
                    d.reject(err);
                });
        })


    return d.promise;


}

function portAsynch(processStatus, limit, mapping, database, portingtype, noofProcess, db) {
    var promises = [];
    var p = undefined;
    for (var i = 0; i < noofProcess; i++) {
        var db1 = db.asyncDB();
        if (mapping.sync && db.getLogger()) {
            db1.setLogger(db.getLogger());
        }
        p = processInBackground(processStatus[i].cursor, processStatus[i].endcursor, limit, processStatus[i].ported, mapping, database, portingtype, i, db1);
        promises.push(p);
    }
    var finalCursor = processStatus[noofProcess - 1].endcursor;
    var valuesToSet = {status: "Success", inprogress: false, startFromPreviousCursor: false};
    var valuesToUnset = {};
    if (finalCursor < 0) {
        valuesToUnset.cursor = "";
    } else {
        valuesToSet.cursor = finalCursor;
    }
    if (portingtype !== "port" || mapping.sync) {
        return p.then(
            function () {
                return updatePorgress({$query: {_id: mapping._id}, $set: valuesToSet, $unset: valuesToUnset}, db);
            }).fail(function (err) {
                return updatePorgress({$query: {_id: mapping._id}, $set: {status: "Error", inprogress: false}}, db);
            })
    } else {
        var finalDb = db.asyncDB();
        finalResolve(promises).then(
            function () {
                return updatePorgress({$query: {_id: mapping._id}, $set: valuesToSet, $unset: valuesToUnset}, finalDb);
            }).then(
            function () {
                finalDb.clean();
            }).fail(function (err) {
                return updatePorgress({$query: {_id: mapping._id}, $set: {status: "Error", inprogress: false}}, finalDb);
            })
        return {message: "Porting applied successfully", pid: process.pid};
    }


}

function finalResolve(promises) {
    var d = Q.defer();

    var promissesDone = 0;
    var resolveFunction = function () {
        promissesDone = promissesDone + 1;
        if (promissesDone == promises.length) {
            d.resolve();
        }
    }
    for (var i = 0; i < promises.length; i++) {
        promises[i].then(resolveFunction).fail(function (err) {
            d.reject(err);
            return;
        });
    }
    return d.promise;
}

function getMapping(_id, db) {
    return db.query({$collection: GAE_MAPPINGS_TABLE, $filter: {_id: _id}})
}

function processInBackground(cursor, endCursor, limit, ported, mapping, database, portType, processNumber, db) {

    var d = Q.defer();
    var source = JSON.parse(mapping.source);
    var data = undefined;
    var targetDatabase = mapping.targetdatabase;
    targetDatabase = targetDatabase.trim();
    var targetDb = undefined;
    db.connectUnauthorized(targetDatabase).then(
        function (tdb) {
            targetDb = tdb;
            var inProgresMessage = {};
            inProgresMessage["processStatus." + processNumber + "." + "inprogress"] = true;
            inProgresMessage["processStatus." + processNumber + "." + "status"] = "In progress";
            inProgresMessage["processStatus." + processNumber + "." + "process"] = processNumber;
            return updatePorgress({$query: {_id: mapping._id}, $set: inProgresMessage}, db);
        }).then(
        function () {
            return updateCount(source, database, mapping, db);
        }).then(
        function () {
            return  startPort(cursor, endCursor, limit, ported, mapping.tableid, mapping, database, portType, processNumber, db, targetDb);
        })
        .then(
        function (data1) {
            data = data1;
            var inProgresMessage = {};
            inProgresMessage["processStatus." + processNumber + "." + "inprogress"] = false;
            inProgresMessage["processStatus." + processNumber + "." + "status"] = "Success";
            inProgresMessage["processStatus." + processNumber + "." + "process"] = processNumber;
            return updatePorgress({$query: {_id: mapping._id}, $set: inProgresMessage}, db)

        }).then(
        function () {
            db.clean();
            targetDb.clean();
            d.resolve(data);
        }).fail(
        function (err) {
            var portingStatus = err.stack || err.message;
            if (!portingStatus) {
                portingStatus = "Error is not new Error >>>" + err
            }
            var inProgresMessage = {};
            inProgresMessage["processStatus." + processNumber + "." + "inprogress"] = false;
            inProgresMessage["processStatus." + processNumber + "." + "status"] = portingStatus;
            inProgresMessage["processStatus." + processNumber + "." + "process"] = processNumber;
            return updatePorgress({$query: {_id: mapping._id}, $set: inProgresMessage}, db).then(function () {
                throw err;
            })

        }).fail(function (err) {
            db.clean();
            targetDb.clean();
            d.reject(err);
        })

    return d.promise;


}

function updateCount(source, database, mapping, db) {
    if ((!source.countsql) || mapping.skipCount) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    return fetch(source.countsql, null, null, null, database).then(function (countResult) {
        if (countResult && countResult.length > 0) {
            var totalRecord = countResult[0]["count(*)"];
            return updatePorgress({$query: {_id: mapping._id}, $set: {totalcount: totalRecord}}, db);
        } else {
            throw(new Error("Count result not found"));
        }
    })


}

function startPort(cursor, endCursor, limit, ported, tableName, mapping, database, portType, processNumber, db, targetDb) {
    var d = Q.defer();
    if (endCursor > 0 && cursor >= endCursor) {
        d.resolve();
        return d.promise;
    }
    setImmediate(function () {

        var source = JSON.parse(mapping.source);

        var data = undefined;
        var newPorted = undefined;
        var newCursor = undefined;
        getData(cursor, source, database, mapping, limit, db).then(
            function (data1) {
                data = data1;
                if ((!data) || data === null || data.length == 0) {
                    data = undefined;
                    return;
                } else if (data.length > limit) {
                    throw (new Error("Data can not be large than expected>>>"))
                }

                if (portType != "port") {
                    return;
                }
                return Utils.asyncIterator(data, function (index, record) {
                    if (mapping.skipTx) {
                        return initateWithoutTx(mapping, record, tableName, targetDb);
                    } else {
                        return initateTx(mapping, record, tableName, targetDb);
                    }
                })
            }).then(
            function () {
                if (data) {
                    newPorted = ported + data.length;
                    newCursor = cursor + limit;
                    var inProgresMessage = {};
                    inProgresMessage["processStatus." + processNumber + "." + "ported"] = newPorted;
                    inProgresMessage["processStatus." + processNumber + "." + "cursor"] = newCursor;
                    return updatePorgress({$query: {_id: mapping._id}, $set: inProgresMessage, $inc: {ported: data.length}}, db)
                }


            }).then(
            function () {
                if ((!data) || data === null || source.excel) {
                    return;
                }
                return startPort(newCursor, endCursor, limit, newPorted, tableName, mapping, database, portType, processNumber, db, targetDb);
            }).then(
            function () {
                d.resolve(data);
            }).fail(function (err) {
                d.reject(err);
            });

    });
    return d.promise;


}


function updatePorgress(updates, db) {

    //check if we need to continue porting
//    console.log("update progress called" + JSON.stringify(updates))
    return db.query({$collection: GAE_MAPPINGS_TABLE, $filter: updates.$query}).then(function (response) {

        if (!response || response.result.length == 0 || response.result[0].stopporting) {
            throw (new Error("Stop porting encountered"));
            return;
        }
        return db.mongoUpdate(
            {$collection: GAE_MAPPINGS_TABLE, $update: [updates]}
        );
    })


}

function initateWithoutTx(mapping, record, tableName, db) {

    if (mapping.jobname) {
        console.log("udpate with job called...")
        return updateWithJob(mapping.jobname, record, db);
    } else {
        return update(record, tableName, db);
    }
}

function initateTx(mapping, record, tableName, db) {

    var d = Q.defer();
    db.startTransaction().then(
        function () {
            if (mapping.jobname) {
                console.log("udpate with job called...")
                return updateWithJob(mapping.jobname, record, db);
            } else {
                return update(record, tableName, db);
            }

        }).then(
        function () {
            console.log("...commiting .....")
            return  db.commitTransaction();
        }).then(
        function () {
            d.resolve();
        }).fail(
        function (err) {
//            console.log("Err caught in gae data porting>>>" + err)
            return db.rollbackTransaction().then(function () {
//                console.log("Err caught in gae data porting and rollback done>>>" + err)
                throw err;
            })

        }).fail(function (err) {
//            console.log("Err caught in gae data porting and final error>>>" + err)
            d.reject(err);
        });
    return d.promise;

}

function updateWithJob(jobName, record, db) {
    var d = Q.defer();
    db.invokeFunction(jobName, [record]).then(
        function () {
            d.resolve();
        }).fail(function (e) {
            d.reject(e);
        })

    return d.promise;
}

function update(operation, tableName, db) {
    var upsertQuery = {};
    if (operation.__key__) {
        upsertQuery.__key__ = upsertQuery;
    }
    return db.update({$collection: tableName, $events: false, $modules: {TriggerRequiredFields: 0, Replicate: 0}, $upsert: {$query: upsertQuery, $set: operation}});
}


function getData(cursor, source, database, mapping, limit, db) {
    var d = Q.defer();
    if (cursor === undefined) {
        d.reject(new Error("cursor can not defined>>>>Mapping>>>>>" + JSON.stringify(mapping) + ">>>>cursor>>>>>" + cursor));
        return d.promise;
    }

    if (source.gae && source.gae == true) {
        fetch(null, source, limit, cursor, database).then(
            function (fetchResult) {

                if (!fetchResult || fetchResult.length == 0) {
                    d.resolve(null);
                    return;
                }
                d.resolve(fetchResult);
                return;

            }).fail(function (err) {
                d.reject(err)
            });
    } else if (source.mongo && source.mongo == true) {
        fetchFromMongo(source, limit, cursor, database, db).then(
            function (fetchResult) {

                if (!fetchResult || fetchResult.length == 0) {
                    d.resolve(null);
                    return;
                }
                d.resolve(fetchResult);
                return;

            }).fail(function (err) {
                d.reject(err)
            });
    } else if (source.excel && source.excel == true) {
        var fileKey = mapping.excelfile.key;
        var excelMapping = source.mapping;
        fetchFromExcel(fileKey, excelMapping, db).then(
            function (fetchResult) {
                if (!fetchResult || fetchResult.length == 0) {
                    d.resolve(null);
                    return;
                }
                d.resolve(fetchResult);
                return;
            }).fail(function (err) {
                d.reject(err)
            });
    } else {
        var sql = source.sql;
        if (limit === undefined) {
            limit = 1;
        }
        sql += " limit " + cursor + ", " + limit;

        var fetchResult = undefined;
        fetch(sql, null, null, null, database).then(
            function (fetchResult1) {
                fetchResult = fetchResult1;

                if (!fetchResult || fetchResult.length == 0) {
                    fetchResult = null;
                    return;
                }
                if (!source.childs || source.childs.length == 0) {
                    return;
                }
                return Utils.iterateArrayWithPromise(fetchResult, function (index, fetchResultRecord) {

                    return Utils.iterateArrayWithPromise(source.childs, function (index, child) {
                        var childSql = child.sql;
                        for (var recordid in fetchResultRecord) {
                            var key = "{" + source.alias + "." + recordid + "}";
                            var keyIndex = childSql.indexOf(key);
                            while (keyIndex >= 0) {
                                childSql = childSql.replace(key, fetchResultRecord[recordid])
                                keyIndex = childSql.indexOf(key);
                            }
                        }

                        var childLimit = 500;
                        childSql += " limit 0," + childLimit;
                        return fetch(childSql, null, null, null, database).then(function (childResult) {
                            childResult = childResult || [];
                            if (childResult.length >= childLimit) {
                                throw(new Error("Childs exists beyond limit [" + childLimit + "], child query [" + childSql + "]"));
                            }
                            fetchResultRecord[child.alias] = childResult;

                        })

                    })

                })


            }).then(
            function () {
                d.resolve(fetchResult);
            }).fail(function (err) {
                d.reject(err);
            });
    }
    return d.promise;
}


function fetchFromExcel(filekey, mapping, db) {
    var parameters = [
        {fileKey: filekey, mapping: mapping}
    ];
    return db.invokeFunction("ImportExcelService.portExcelData", parameters);
}


function fetchFromMongo(source, limit, cursor, dbName, mydb) {
    if (!dbName) {
        throw new Error("dbname is undefined.");
    }
    var Config = require("ApplaneDB/Config.js").config;

    var url = Config.URL + "/" + "daffodilswmongo" + "/";
//    console.log("mongo url>>>" + url + ">>>curosr>>>" + cursor + ">>limit>>>" + limit);
    var d = Q.defer();
    if (!source) {
        d.resolve();
        return d.promise;
    }
    mydb.tempMongoConnection(url).then(function (db) {
        var mongoQuery = source.sql;
        var options = {};
        options.limit = limit;
        options.skip = cursor;
        var filter = mongoQuery.$filter || {};
        db.collection(mongoQuery.$collection).find(filter, options).toArray(function (err, result) {
            if (err) {
                throw err;
                return;
            }
            Utils.asyncIterator(result,
                function (index, row) {
                    return Utils.asyncIterator(source.child, function (index, childDef) {
                        var d1 = Q.defer();
                        var filterValue = Utils.resolveValue(row, (childDef.parentcolumn || "_id"));
                        var childFilter = {};
                        childFilter[childDef.relatedcolumn + "._id"] = Utils.isJSONObject(filterValue) ? filterValue._id : filterValue;
                        db.collection(childDef.collection).find(childFilter).toArray(function (err, result) {
                            if (err) {
                                d1.reject(err);
                                return;
                            }
                            row[childDef.alias || childDef.$collection] = result;
                            d1.resolve();
                        })
                        return d1.promise;
                    })
                }).then(
                function () {
                    for (var i = 0; i < result.length; i++) {
                        convert_IdTo__key___(result[i]);
                    }
                    d.resolve(result);
                }).fail(function (e) {
                    d.reject(e);
                })


        })

    })


    return d.promise;
}

function convert_IdTo__key___(updates) {
    if (!updates) {
        return;
    }
    var keys = Object.keys(updates);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = updates[key];
        if (key === "_id") {
            delete updates[key];
            updates["__key__"] = value;
        } else if (Array.isArray(value)) {
            for (var j = 0; j < value.length; j++) {
                if (Utils.isJSONObject(value[j])) {
                    convert_IdTo__key___(value[j]);
                }
            }
        } else if (Utils.isJSONObject(value)) {
            convert_IdTo__key___(value);
        }
    }
}


function fetch(query, source, limit, cursor, dbName) {
    if (!dbName) {
        throw new Error("dbName is undefined.");
    }
    var reqParam = {};
    if (source) {
        reqParam.source = JSON.stringify(source);
    }
    reqParam.limit = limit;
    reqParam.cursor = cursor;
    reqParam.query = query;
    reqParam.dbName = dbName;
    reqParam.remoteaccess = "jbbb123hrhk";
    reqParam.emailid = "rohit.bansal@daffodilsw.com";
    reqParam.password = "daffodil";
    reqParam.redirect = true;
//    console.log("Req param>>>>>" + JSON.stringify(reqParam));
    var service = {hostname: "mysql.applanessishrd.appspot.com", port: 80, method: "POST", path: "/sql/execute"};
    return HttpUtil.executeServiceAsPromise(service, reqParam).then(function (result) {
        var jsonResult = undefined;
        try {
            jsonResult = JSON.parse(result);
        } catch (e) {
            throw (new Error("Error in parsing result>>>>>" + result + ">>>>>>>>>"));
        }
        if (jsonResult.error) {
            throw (new Error(jsonResult.error));
        } else {
            return (jsonResult.result);
        }
    })
}

exports.resumePorting = function (db) {
    return;
    var d = Q.defer();
    db.query({$collection: GAE_MAPPINGS_TABLE, $filter: {inprogress: true, status: {$ne: "Error"}}}).then(
        function (result) {
            result = result.result;
//            console.log("result Length>>>>>>>>>>>>>" + JSON.stringify(result.length));
            for (var i = 0; i < result.length; i++) {
                var row = result[i];
                var db1 = db.asyncDB();
                db.update({$collection: GAE_MAPPINGS_TABLE, $update: [
                    {_id: row._id, $set: {resume: true, inprogress: false}}
                ]}).then(function () {
                    return  require("./GAEDataPorting.js").portData({_id: row._id}, db);
                })
            }
        }).fail(
        function (err) {
            d.resolve();
        }).fail(function (err) {
            d.reject(err);
        });
    return d.promise;
}