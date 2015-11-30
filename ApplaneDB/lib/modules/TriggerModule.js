var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");
var EventManager = require("../../public/js/EventManager.js");

exports.onInsert = function (event, document, collection, db, options) {
    var events = collection.getValue("events");
    return EventManager.triggerEvents(event, document, events, collection, db, options);
}

exports.onPreSave = function (event, document, collection, db, options) {
    return this.onInsert(event, document, collection, db, options);
}

exports.onPostSave = function (event, document, collection, db, options) {
    return this.onInsert(event, document, collection, db, options);
}

exports.onValue = function (event, document, collection, db, options) {
    var d = Q.defer();
    //client side value should not be processed again
    setImmediate(function () {
        var events = collection.getValue("events");
        try {
            var p = EventManager.triggerEvents(event, document, events, collection, db, options);
            if (Q.isPromise(p)) {
                p.then(
                    function () {
                        d.resolve();
                    }).fail(function (err) {
                        d.reject(err);
                    })
            } else {
                d.resolve();
            }
        } catch (e) {
            d.reject(e);
        }
    })
    return d.promise;
}

exports.doBatchQuery = function (queries, db, options) {
    var events = queries.$events
    if (Utils.isJSONObject(events)) {
        events = [events];
    }
    return Utils.iterateArrayWithPromise(events, function (index, event) {
        if (event.event === "onBatchQuery") {
            return db.invokeFunction(event.function, [queries], options);
        }
    });
}

exports.doBatchResult = function (queries, result, db, options) {
    var events = queries.$events || [];
    if (Utils.isJSONObject(events)) {
        events = [events];
    }
    return Utils.iterateArrayWithPromise(events, function (index, event) {
        if (event.event === "onBatchResult") {
            return db.invokeFunction(event.function, [queries, result], options);
        }
    });
}

