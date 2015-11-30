var Utility = require("ApplaneCore/apputil/util.js");
var Q = require('q');
function doCopy(collection, newCollection, query, skip, limit) {
    var resultFound = undefined;
    return getData(collection, query, skip, limit, {_id:1}).then(
        function (result) {
            if (result && result.length >= limit) {
                resultFound = true;
            }
            if (result && result.length > 0) {
                return newCollection.mongoInsert(result);
            }
        }).then(function () {
            if (resultFound) {
                return doCopy(collection, newCollection, query, skip, limit);
            }
        })
}


function getData(collectionObj, query, skip, limit, fields) {
    var d = Q.defer();
    var options = {limit:limit, skip:skip};
    if (fields) {
        options.fields = fields;
    }
    collectionObj.mongoCollection.find(query, options).toArray(function (err, result) {
        if (err) {
            d.reject(err);
        } else {
            d.resolve(result);
        }
    })
    return d.promise;
}

exports.iterate = function (collectionName, query, functionName, db, options) {
    var SELF = require("./DataIterator.js");
    var Utility = require("ApplaneCore/apputil/util.js");
    options = options || {};
    var skip = options.$skip !== undefined ? options.$skip : 0
    var limit = options.$limit !== undefined ? options.$limit : 200;
    var collection = undefined;
    var newCollection = undefined;
    return db.collection(collectionName).then(
        function (collectionObj) {
            collection = collectionObj;
            options.mongoCollection = collection.mongoCollection;
        }).then(
        function () {
            var newCollectionName = collectionName + Utility.getUnique();
            return db.collection(newCollectionName);
        }).then(
        function (newCollection1) {
            newCollection = newCollection1;
            return SELF.copyData(query, collection, newCollection, db, options);
        }).then(
        function () {
            if (typeof  functionName !== "function") {
                return db.loadFunction(functionName);
            } else {
                return functionName;
            }
        }).then(
        function (loadedFunction) {
            if (!loadedFunction) {
                throw new Error("Function not found for functionName>>>>" + functionName);
            }
            return doIterate(collection, newCollection, loadedFunction, skip, limit, db, options);
        }).then(function () {
            var d = Q.defer();
            newCollection.mongoCollection.count(function (err, count) {
                if (err) {
                    d.reject(err);
                } else {
                    if (count > 0) {
                        newCollection.mongoCollection.drop(function (err, reply) {
                            if (err) {
                                d.reject(err);
                            } else {
                                d.resolve(reply);
                            }
                        });
                    } else {
                        d.resolve();
                    }
                }
            });
            return d.promise;
        });

}

exports.copyData = function (query, collection, newCollection, db, options) {
    options = options || {};
    var Utility = require("ApplaneCore/apputil/util.js");
    var that = this;
    var skip = options.$skip !== undefined ? options.$skip : 0;
    var limit = options.$limit !== undefined ? options.$limit : 200;
    return doCopy(collection, newCollection, query, skip, limit);
}


function doIterate(originalCollection, newCollection, loadedFunction, skip, limit, db, options) {
    var resultFound = undefined;
    return getData(newCollection, {}, skip, limit, {_id:1}).then(
        function (result) {
            if (result && result.length >= limit) {
                resultFound = true;
            }
            var ids = [];
            result = result || [];
            for (var i = 0; i < result.length; i++) {
                ids.push(result[i]._id);
            }
            return getData(originalCollection, {_id:{$in:ids}}, 0, ids.length)
        }).then(
        function (data) {
            return Utility.iterateArrayWithPromise(data, function (index, document) {
                return db.executeLoadedFunction(loadedFunction, [document], db, options)
            });
        }).then(function () {
            if (resultFound) {
                return doIterate(originalCollection, newCollection, loadedFunction, skip, limit, db, options);
            }
        })
}
