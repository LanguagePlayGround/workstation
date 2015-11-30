/*
 * Basic Concept
 *   1.We are maintaining the transaction in the pl.txs collection.
 *   2 . On start of a transaction we create  a unique transaction id (txid)
 *   and insert a record with this transaction id as the _id of the record and set the status of this transaction as pending.
 *   3.If a new record is inserted or a previous one is deleted , we make an entry in the pl.txs collection with the reverse
 *     effect so that the transaction can be easily rollbacked.
 *    for eg :
 *         if we have to insert a record
 *         {$collection: "countries", $insert: [
 {_id: 1, country: "USA", code: "01"}
 ]}
 then we update the pl.txs record with the following updates
 {updates: [
 {tx: {$collection: "countries", $delete: [
 {_id: 1}
 ]}}

 *  4. In case of update we cannot keep the updates with the transaction table because if the record itself fails to execute then
 *       we are going to rollback the changes made by the udpate which will make the database inconsitent
 *  5. So we keep the reverse effects of the updates with the record itself
 *
 *      for eg:
 *       the record to be updated
 *      {$collection: "countries", $update: [
 {_id: 1, $set: {"country": "India"}}
 ]}
 then the record with the transaction will be like this
 {$collection: "countries", $update: [
 {_id: 1, $set: {"country": "India"}, __txs__: {txid: {tx: {_id: 1, $set: {"country": "USA"}}}}}
 ]}

 in case of $inc operation we are maintaining the aggregate of the changes made by transactions
 for eg : if one transaction increments the value by 10
 and the second one decrements the value by 20 then we update our __txs__ field in the record by +10 .

 NOTE:  We are maintaining  an object corresponding to the __txs__ field . Correponding to this __txs__ field
 a transactionid - transaction (key-value)  pair is maintained so that we can easily commit or rollback or unset the
 transactionid in the pl.txs field after commit or rollback.
 6. In case of rollback , update the status of the transaction as rollback so that in case of any failure during the
 rollback process we can easily rollback the remaining transactions
 7. In case of commit , update the status of the transaction as commit so that in case of any failure during the commit
 process we can easily commit the remaining transactions.
 NOTE : all the transaction updates are executed using mongoUpdate


 * */

var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");
var Self = require("./TransactionModule.js");
var Config = require("../../Config.js").config;
var MailService = require("../MailService.js");
var ApplaneError = require("ApplaneCore/apputil/ApplaneError.js");

exports.onPreSave = function (event, document, collection, db, option) {
    if (db.txid === undefined || Config.SERVER_NAME === undefined) {
        return;
    } else if (document.type === "insert") {
        return preInsert(document, collection, db);
    } else if (document.type === "delete") {
        return preDelete(document, collection, db);
    } else if (document.type === "update") {
        return preUpdate(document, collection, db);
    } else {
        return;
    }
};

exports.handleRollback = function (db, previousTransaction) {
    /*
     * query on the pl.txs collection to fetch the transaction corresponding to the txid
     * */
    var data = undefined;
    return getTransaction(db, {txid: db.txid}, {limit: 1}).then(
        function (transactions) {
            data = transactions;
            /*
             * process each operation in the transaction on by one
             * if no updated are found then delete the complete transaction
             * */
            if (data && data.length > 0) {
                if (Utils.deepEqual(data[0]._id === previousTransaction)) {
                    throw new Error("Unable to rollback as count is not getting decrementing in updates array >>>" + JSON.stringify(data));
                }
                return processRollbackUpdates(data[0], db);
            }
        }).then(
        function () {
            if (data && data.length > 0) {
                return deleteTransaction(data[0], db);
            }
        }).then(function () {
            if (data && data.length > 0) {
                return Self.handleRollback(db, data[0]._id);
            }
        });
}

exports.onRollback = function (event, doc, collection, db, options) {
    var log = undefined;
    if (db.logger) {
        log = db.logger.populateInitialLog("Transaction Module onRollback", {"type": "Txn Module : Rollback"}, db, false);
    }
    return Self.handleRollback(db, 0).then(
        function () {
            if (log) {
                db.logger.populateFinalLog(db, log, false);
            }
        }).fail(function (err) {
            var errDetail = {};
            errDetail.message = err.message;
            errDetail.stack = err.stack;
            return sendMail(db, errDetail).then(function () {
                throw err;
            });
        });
}

exports.onCommit = function (event, doc, collection, db, options) {
    var log = undefined;
    if (db.logger) {
        log = db.logger.populateInitialLog("Transaction Module onCommit", {"type": "Txn Module : Commit"}, db, false);
    }
    return Self.handleCommit(db).then(function () {
        if (log) {
            db.logger.populateFinalLog(db, log, false);
        }
    });
}

function checkInArray(array, documentId) {
    var index = Utils.isExists(array, {_id: documentId}, "_id");
    return index;
}

function deleteTransaction(data, db) {
    if (data) {
        var update = {}
        update[Constants.Query.COLLECTION] = Constants.TRANSACTIONS;
        update[Constants.Update.DELETE] = [
            {_id: data._id}
        ];
        var log = undefined;
        if (db.logger) {
            log = db.logger.populateInitialLog("Transaction Module onCommit/rollback delete transaction", update, db, false);
        }
        return db.mongoUpdate([update]).then(function () {
            if (log) {
                db.logger.populateFinalLog(db, log, false);
            }
        });
    }
}

function getTransaction(db, filter, options) {
    /*
     * order is applied on this query to ensure that the  transactions are rollbacked in descending order.
     * on this basis the sequence module work depends.
     * */

    var query = {};
    query[Constants.Query.COLLECTION] = Constants.TRANSACTIONS;
    query[Constants.Query.FILTER] = filter;
    query[Constants.Query.MODULES] = false;
    query[Constants.Query.EVENTS] = false;
    query[Constants.Query.SORT] = {_id: -1};
    if (options && options.limit) {
        query[Constants.Query.LIMIT] = 1;
    }
    return db.query(query).then(function (data) {
        return data && data.result && data.result.length > 0 ? data.result : [];
    });
}


function removeInsertandDeleteTransactions(db) {
    var update = [
        {$collection: Constants.TRANSACTIONS, $delete: [
            {txid: db.txid, $or: [
                {"tx.insert": {$exists: true}},
                { "tx.delete": {$exists: true}}
            ]}
        ]}
    ];
    return db.mongoUpdate(update);
}

function removeUpdateTransactions(db) {
    var data = undefined;
    return getTransaction(db, {txid: db.txid}, {limit: 1}).then(
        function (transactions) {
            if (transactions) {
                data = transactions;
                if (data && data.length > 0) {
                    return processCommitUpdates(data[0], db);
                }
            }
        }).then(
        function () {
            if (data && data.length > 0) {
                return deleteTransaction(data[0], db);
            }
        }).then(function () {
            if (data && data.length > 0) {
                return removeUpdateTransactions(db);
            }
        });
}

exports.handleCommit = function (db) {
    return removeInsertandDeleteTransactions(db).then(function () {
        return removeUpdateTransactions(db);
    });
}


function handleInc(tx, newKey, document, field) {
    tx.inc = tx.inc || [];
    var oldValue = 0;
    var index = undefined;
    for (var j = 0; j < tx.inc.length; j++) {
        if (tx.inc[j].key === newKey) {
            index = j;
            break;
        }
    }
    if (index !== undefined) {
        var oldValue = tx.inc[index].value;
        tx.inc[index].value = oldValue + (-1 * document.get(field));
    } else {
        tx.inc.push({key: newKey, value: (-1 * document.get(field))});
    }
}

function handleSet(tx, newKey, document, field) {
    tx.set = tx.set || [];
    var found = false;
    for (var j = 0; j < tx.set.length; j++) {
        if (tx.set[j].key === newKey) {
            found = true;
            break;
        }
    }
    if (!found) {
        var oldValue = document.getOld(field);
        if (oldValue === undefined || oldValue === null) {
            tx.unset = tx.unset || [];
            tx.unset.push({key: newKey, value: 1});
        } else {
            // check in unset before pushing to set
            var foundInUnset = false;
            if (tx.unset) {
                for (var j = 0; j < tx.unset.length; j++) {
                    if (tx.unset[j].key === newKey) {
                        foundInUnset = true;
                        break;
                    } else if (newKey.indexOf(tx.unset[j].key + ".") == 0) {
                        foundInUnset = true;
                        break;
                    }
                }
            }
            if (!foundInUnset) {
                tx.set.push({key: newKey, value: document.getOld(field)});
            }
        }
    }
}

function handleArray(documents, fieldInfo, field, array, pExp) {
    for (var i = 0; i < documents.length; i++) {
        var document = documents[i];
        var newExp = pExp ? pExp : field;
        if (document.type === "insert") {
            var documentId = document.get("_id");
            var index = checkInArray(array, documentId);
            if (index === undefined) {
                var sortExp = fieldInfo && fieldInfo.sort ? fieldInfo.sort : null;
                array.push({_id: documentId, type: "delete", field: newExp, sort: sortExp});
            }
        }
        if (document.type === "delete") {
            var documentId = document.get("_id");
            var index = checkInArray(array, documentId);
            if (index === undefined) {
                var sortExp = fieldInfo && fieldInfo.sort ? fieldInfo.sort : null;
                array.push({_id: documentId, type: "insert", field: newExp, value: document.oldRecord, sort: sortExp});
            }
        }
        if (document.type === "update") {
            var documentId = document.get("_id");
            var index = checkInArray(array, documentId);
            var update = {};
            if (index === undefined) {
                update._id = documentId;
                update.field = newExp;
                update.type = "update";
                array.push(update);
                handleArrayUpdate(document, newExp, update);
            } else {
                update = array[index];
                if (update.type === "update") {
                    handleArrayUpdate(document, newExp, update);
                }
            }
        }
    }
}

function handleArrayUpdate(document, field, update, pExp) {
    var updatedFields = document.getUpdatedFields() || [];
    for (var i = 0; i < updatedFields.length; i++) {
        var field = updatedFields[i];
        var documents = document.getDocuments(field);
        var newParentExp = pExp ? pExp + "." + field : field;
        if (Array.isArray(documents)) {
            handleSet(update, newParentExp, document, field);
        } else if (Utils.isJSONObject(documents)) {
            handleArrayUpdate(documents, field, update, newParentExp);
        } else {
            if (document.updates && document.updates.$inc && document.updates.$inc[field] !== undefined) {
                handleInc(update, newParentExp, document, field);
            } else if ((document.updates && document.updates.$unset && document.updates.$unset[field] !== undefined) || (document.updates && document.updates.$set && document.updates.$set[field] !== undefined)) {
                handleSet(update, newParentExp, document, field);
            } else if (document.updates && document.updates[field] && document.updates[field].$query) {
                throw new Error("updates for field[" + field + "] cannot contain $query >>> updates found are " + JSON.stringify(document.updates));
            } else if (document.updates && document.updates[field] !== undefined) {
                handleSet(update, newParentExp, document, field);
            } else {
                throw new Error("updates for field[" + field + "] must be in one of $set,$unset,$inc>>> updates found are " + JSON.stringify(document.updates));
            }

        }
    }
}

function handleDeleteOperationRollback(tx, recordId, collection, db) {
    var pull = {};
    pull[tx.field] = {_id: tx._id};
    pull["__txs__." + db.txid + ".tx.array"] = {_id: tx._id};
    var update = {$query: {_id: recordId}, $pull: pull};
    var updates = {$collection: collection, $update: update};
    var log = undefined;
    if (db.logger) {
        log = db.logger.populateInitialLog("Transaction Module onRollback delete from array", updates, db, false);
    }
    return db.mongoUpdate(updates).then(function () {
        if (log) {
            db.logger.populateFinalLog(db, log, false);
        }
    });
}

function handleInsertOperationRollback(tx, recordId, collection, db) {

    var push = {};
    var sort = {};
    if (tx.sort) {
        sort[tx.sort] = 1
    } else {
        sort["_id"] = 1
    }
    push[tx.field] = {$each: [tx.value], $sort: sort, $slice: -20000};
    var update = {$query: {_id: recordId}, $push: push};
    update.$pull = {};
    update.$pull["__txs__." + db.txid + ".tx.array"] = {_id: tx._id};
    var updates = {$collection: collection, $update: update};
    var log = undefined;
    if (db.logger) {
        log = db.logger.populateInitialLog("Transaction Module onRollback push into the array", updates, db, false);
    }
    return db.mongoUpdate(updates).then(function () {
        if (log) {
            db.logger.populateFinalLog(db, log, false);
        }
    });

}

function handleUpdateOperationRollback(recordId, tx, collection, db) {
    var d = Q.defer();
    var query = {}
    query._id = recordId;
    query[tx.field + "._id"] = tx._id;
    var update = {};
    if (tx.set !== undefined && tx.set.length > 0) {
        update.$set = {};
        for (var i = 0; i < tx.set.length; i++) {
            update.$set[tx.field + ".$." + tx.set[i].key] = tx.set[i].value;
        }
    }
    if (tx.inc !== undefined && tx.inc.length > 0) {
        update.$inc = {};
        for (var i = 0; i < tx.inc.length; i++) {
            update.$inc[tx.field + ".$." + tx.inc[i].key] = tx.inc[i].value;
        }
    }
    if (tx.unset !== undefined && tx.unset.length > 0) {
        update.$unset = {};
        for (var i = 0; i < tx.unset.length; i++) {
            update.$unset[tx.field + ".$." + tx.unset[i].key] = tx.unset[i].value;
        }
    }
    update.$pull = {};
    update.$pull["__txs__." + db.txid + ".tx.array"] = {_id: tx._id};
    var log = undefined;
    if (db.logger) {
        log = db.logger.populateInitialLog("Transaction Module onRollback update into array", update, db, false);
    }
    db.db.collection(collection).update(query, update, {w: 1}, function (err, result) {
        if (err) {
            d.reject(err);
            return;
        }
        if (log) {
            db.logger.populateFinalLog(db, log, false);
        }
        d.resolve(result);
    });
    return d.promise;
}

function handleArrayRollback(tx, recordId, db, collection) {
    var type = tx.type;
    if (type === "insert") {
        return handleInsertOperationRollback(tx, recordId, collection, db);
    } else if (type === "delete") {
        return handleDeleteOperationRollback(tx, recordId, collection, db);
    } else {
        return handleUpdateOperationRollback(recordId, tx, collection, db);
    }
}

function preInsert(document, collection, db) {
    if (document.cancelUpdates || db.txid === undefined) {
        return;
    }
    var documentId = document.get("_id");
    if (!documentId) {
        documentId = Utils.getUniqueObjectId();
        document.set("_id", documentId);
        document.check_id = false;
    }
    var collectionName = collection.getValue(Constants.Admin.Collections.COLLECTION);
    return check_Id(document, collectionName, db).then(function () {
        var tx = {collection: collectionName, delete: {_id: documentId}};
        return Self.insertTransaction(tx, db);
    })
}


// if check_id is true then we have to check whether the record exists or not and if the record already exists then we throw a duplicate error to manage the transaction effectively
// so that if the record already exists and a record is inserted with the same _id then we  manage a delete transaction and the old record will be deleted.
function check_Id(document, collectionName, db) {
    if (document.check_id) {
        return db.query({$collection: collectionName, $filter: {"_id": document.get("_id")}, "$events": false, $modules: false}).then(function (data) {
            if (data && data.result && data.result.length > 0) {
                throw new ApplaneError({"code": 11000, message: "MongoError: insertDocument :: caused by :: 11000 E11000 duplicate key error index: " + db.db.databaseName + "." + collectionName + " with document..." + JSON.stringify(document)});
            }
        })
    } else {
        var d = Q.defer();
        d.resolve(0);
        return d.promise;
    }
}

function preDelete(document, collection, db) {
    if (document.cancelUpdates || db.txid === undefined) {
        return;
    }
    var collectionName = collection.getValue(Constants.Admin.Collections.COLLECTION);
    var tx = {collection: collectionName, insert: document.oldRecord};
    return Self.insertTransaction(tx, db);
}

exports.insertTransaction = function (tx, db) {
    var update = [
        {$collection: Constants.TRANSACTIONS, $insert: [
            { tx: tx, status: "pending", txid: db.txid, lastmodifiedtime: new Date(), user: db.user, serverName: Config.SERVER_NAME, processid: process.pid}
        ]}
    ];
    return db.mongoUpdate(update);
}

function preUpdate(document, collection, db) {
    if (document.cancelUpdates || db.txid === undefined) {
        return
    }
    var documentId = document.get("_id");
    /*
     * query on the pl.txs collection to check whether a transaction is going on with collection with the same record updated that is  inserted or deleted in the same transaction
     * if the record is found the do nothing
     * else update the document with the reverse effect of the transaction and update the pl.txs collection with the id and name of the collection to be updated
     * */

    var toUpdate = true;
    var alreadyInProgress = false;
    var collectionName = collection.getValue(Constants.Admin.Collections.COLLECTION);
    return getTransaction(db, {txid: db.txid, "tx.collection": collectionName}).then(
        function (transactions) {
            var data = transactions;
            for (var i = 0; i < data.length; i++) {
                if ((data[i].tx.insert && Utils.deepEqual(data[i].tx.insert._id, documentId)) || (data[i].tx.delete && Utils.deepEqual(data[i].tx.delete._id, documentId))) {
                    toUpdate = false;
                }
                if (data[i].tx.update && Utils.deepEqual(data[i].tx.update._id, documentId)) {
                    alreadyInProgress = true;
                }
            }
            if (toUpdate && !alreadyInProgress) {
                var tx = {collection: collectionName, update: {_id: documentId}};
                return Self.insertTransaction(tx, db);
            }
        }).then(function () {
            if (toUpdate) {
                return updateDocument(document, collection, db);
            }
        });
}


function processRollbackUpdates(data, db) {
    /*
     * if the operation in transaction is insert or delete then rollback from the transaction
     * otherwise rollback from the document
     * */
    var tx = data.tx;
    if (tx) {
        if (tx.insert !== undefined) {
            var newTx = {};
            newTx[Constants.Query.COLLECTION] = tx.collection;
            newTx.$insert = tx.insert;
            var log = undefined;
            if (db.logger) {
                log = db.logger.populateInitialLog("Transaction Module onRollback insert record", newTx, db, false);
            }
            return db.mongoUpdate([newTx]).then(
                function () {
                    if (log) {
                        db.logger.populateFinalLog(db, log, false);
                    }
                }).fail(function (err) {
                    if (err.code !== 11000) {
                        throw err;
                    }
                });
        } else if (tx.delete !== undefined) {
            var newTx = {};
            newTx[Constants.Query.COLLECTION] = tx.collection;
            newTx.$delete = tx.delete;
            var log = undefined;
            if (db.logger) {
                log = db.logger.populateInitialLog("Transaction Module onRollback delete record", newTx, db, false);
            }
            return db.mongoUpdate([newTx]).then(function () {
                if (log) {
                    db.logger.populateFinalLog(db, log, false);
                }
            });

        } else if (tx.update !== undefined && tx.type == "sequence") {
            return db.mongoUpdate({$collection: tx.collection, $update: {$query: {number: tx.update.number, _id: tx.update._id, "series": tx.update.series, collection: tx.update.collection}, $inc: {number: -1}}});
        } else {
            return rollbackFromRecord(data._id, tx, undefined, db);
        }
    }
}

function processCommitUpdates(data, db) {
    var tx = data.tx;
    if (tx) {
        if (tx.update !== undefined && tx.type !== "sequence") {
            return removeTxsFromRecord(tx, db);
        }
    } else {
        throw new Error("Transaction not found in Transaction");
    }
}


function removeTxsFromRecord(tx, db) {
    var collection = tx.collection;
    var updates = tx.update;
    var query = {};
    query._id = updates._id;
    var unset = {};
    unset["__txs__." + db.txid] = "";
    var update = {$collection: collection, $update: {$query: query, $unset: unset}};
    var log = undefined;
    if (db.logger) {
        log = db.logger.populateInitialLog("Transaction Module onCommit remove __txs__ from record", update, db, false);
    }
    return db.mongoUpdate(update).then(function () {
        if (log) {
            db.logger.populateFinalLog(db, log, false);
        }
    });
}

function rollbackFromRecord(_id, tx, initialArrayCount, db) {
    /*
     * query on the collection reffered in the transaction and extract the updates
     * */
    var collection = tx.collection;
    var updates = tx.update;
    var query = {};
    query[Constants.Query.COLLECTION] = collection;
    query[Constants.Query.FILTER] = {_id: updates._id};
    query[Constants.Query.MODULES] = false;
    return db.query(query).then(function (data) {
        if (data && data.result && data.result.length > 0) {
            var transactions = data.result[0].__txs__ || {};
            var txToRollback = transactions[db.txid] ? transactions[db.txid]["tx"] : undefined;
            if (txToRollback) {
                var id = txToRollback._id;
                var array = txToRollback.array;
                if (array && array.length > 0) {
                    if (array.length == initialArrayCount) {
                        throw new Error("Unable to rollback array updates in record   as array count is not getting decrementing in updates array >>>" + JSON.stringify(array));
                    }
                    return handleArrayRollback(array[0], id, db, collection).then(function () {
                        return rollbackFromRecord(_id, tx, array.length, db);
                    });
                } else {
                    var newUpdate = {};
                    newUpdate[Constants.Update.QUERY] = {_id: id};
                    newUpdate.$unset = txToRollback.$unset || {};
                    newUpdate.$unset["__txs__." + db.txid] = "";
                    if (txToRollback.set && txToRollback.set.length > 0) {
                        newUpdate.$set = {};
                        handleBeforeRollback(txToRollback.set);
                        for (var i = 0; i < txToRollback.set.length; i++) {
                            newUpdate.$set[txToRollback.set[i].key] = txToRollback.set[i].value;
                        }
                    }
                    if (txToRollback.unset && txToRollback.unset.length > 0) {
                        handleBeforeRollback(txToRollback.unset);
                        for (var i = 0; i < txToRollback.unset.length; i++) {
                            newUpdate.$unset[txToRollback.unset[i].key] = txToRollback.unset[i].value;
                        }
                    }
                    if (txToRollback.inc && txToRollback.inc.length > 0) {
                        newUpdate.$inc = {};
                        for (var i = 0; i < txToRollback.inc.length; i++) {
                            newUpdate.$inc[txToRollback.inc[i].key] = txToRollback.inc[i].value;
                        }
                    }
                    var update = {$collection: collection, $update: [newUpdate]};
                    var log = undefined;
                    if (db.logger) {
                        log = db.logger.populateInitialLog("Transaction Module onRollback from data stored in record", update, db, false);
                    }
                    return  db.mongoUpdate([update]).then(function () {
                        if (log) {
                            db.logger.populateFinalLog(db, log, false);
                        }
                    });
                }
            }
        }
    });
}

function handleBeforeRollback(array) {
    for (var i = 0; i < array.length; i++) {
        var firstKey = array[i].key;
        var firstValue = array[i].value;
        for (var j = 0; j < i; j++) {
            var nextKey = array[j].key;
            if (firstKey.indexOf(nextKey + ".") == 0) {
                array.splice(i, 1);
                i = i - 1;
            }
        }
        for (var j = i + 1; j < array.length; j++) {
            var nextKey = array[j].key;
            var nextValue = array[j].value;
            if (firstKey.indexOf(nextKey + ".") == 0) {
                if (Utils.isJSONObject(firstValue)) {
                    for (var k in firstValue) {
                        if (nextValue[k] === undefined) {
                            nextValue[k] = firstValue[k];
                        }
                    }
                } else {
                    var key = firstKey.substr(firstKey.lastIndexOf(".") + 1);
                    nextValue[key] = firstValue;
                }
                array.splice(i, 1);
                i = i - 1;
            }
        }
    }
}

function updateDocument(document, collection, db) {
    var fieldInfos = collection.getValue("fieldInfos") || {};
    var tx = {};
    tx._id = document.get("_id");
    var previousTransaction = document.getDocuments("__txs__");
    if (previousTransaction !== undefined) {
        var pTx = previousTransaction.get(db.txid);
        if (pTx !== undefined) {
            pTx = pTx.tx;
            updateTransaction(document, fieldInfos, pTx);
            var pTxs = {};
            pTxs[db.txid] = {tx: pTx};
            document.set("__txs__", pTxs);
        } else {
            tx = {};
            tx._id = document.get("_id");
            tx.array = [];
            updateTransaction(document, fieldInfos, tx);
            var txs = {};
            var newTx = {};
            newTx[db.txid] = {"tx": tx};
            txs["$set"] = newTx;
            document.set("__txs__", txs);
        }
    } else {
        tx.array = [];
        updateTransaction(document, fieldInfos, tx);
        var txs = {};
        txs[db.txid] = {tx: tx};
        document.set("__txs__", txs);
    }
}

function updateTransaction(document, fieldInfos, tx, pExpression) {
    /*
     * get Updated Fields from the document and iterate them . If the getDocuments result in object or array then handle them
     * otherwise value corresponding to the field is simple and handle it accordingly
     * */
    var updatedFields = document.getUpdatedFields() || [];
    for (var i = 0; i < updatedFields.length; i++) {
        var field = updatedFields[i];
        if (field !== "__txs__") {
            if (document.isInUnset(field)) {
                var newParentExp = pExpression ? pExpression + "." + field : field;
                handleSet(tx, newParentExp, document, field);
            } else {
                var documents = document.getDocuments(field);
                if (documents !== undefined) {
                    var newParentExp = pExpression ? pExpression + "." + field : field;
                    if (Array.isArray(documents)) {
                        var updates = document && document.updates && document.updates.$set && document.updates.$set[field];
                        if (updates && (updates.$insert || updates.$delete || updates.$update)) {
                            handleArray(documents, fieldInfos[newParentExp], field, tx.array, newParentExp);
                        } else {
                            handleSet(tx, newParentExp, document, field);
                        }
                    } else {
                        var newParentExp = pExpression ? pExpression + "." + field : field;
                        if (documents && documents.updates && documents.updates.$set === undefined && documents.updates.$unset === undefined && documents.updates.$inc === undefined) {
                            handleSet(tx, newParentExp, document, field);
                        } else {
                            updateTransaction(documents, fieldInfos, tx, newParentExp);
                        }
                    }
                } else {
                    var newKey = pExpression ? pExpression + "." + field : field;
                    if (document.updates && document.updates.$inc && document.updates.$inc[field] !== undefined) {
                        handleInc(tx, newKey, document, field);
                    } else if ((document.updates && document.updates.$unset && document.updates.$unset[field] !== undefined) || (document.updates && document.updates.$set && document.updates.$set[field] !== undefined)) {
                        handleSet(tx, newKey, document, field);
                    } else if (document.updates && document.updates[field] && document.updates[field].$query) {
                        throw new Error("updates for field[" + field + "] cannot contain $query >>> updates found are " + JSON.stringify(document.updates));
                    } else if (document.updates && document.updates[field] !== undefined) {
                        handleSet(tx, newKey, document, field);
                    }
                }
            }
        }
    }
    return tx;
}


function sendMail(db, err) {
    if (Config.MailCredentials && Config.MailCredentials.SEND_ERROR_MAIL) {
        return getTransaction(db, {txid: db.txid}).then(function (transactions) {
            var options = {to: ["rohit.bansal@daffodilsw.com", "sourbh.gupta@daffodilsw.com"], from: "developer@daffodilsw.com", subject: "Error While Rollback Transactions  on " + new Date()};
            var html = '';
            html += "<b>Transactions</b>" + JSON.stringify(transactions) + "<br>";
            html += "<b>ERROR:  </b>" + JSON.stringify(err) + "<br>";
            html += "<b>SERVER NAME  :  </b>" + Config.SERVER_NAME + "<br>";
            html += "<b>DATE :  </b>" + new Date() + "<br>";
            html += "<b>DB:  </b>" + db.db.databaseName + "<br>";
            options.html = html;
            return require("../MailService.js").sendFromAdmin(options);
        });
    } else {
        var D = Q.defer();
        D.resolve();
        return D.promise;
    }
}
