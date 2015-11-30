/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 9/9/14
 * Time: 5:34 PM
 * To change this template use File | Settings | File Templates.
 *
 *
 */

var Utility = require("./Utility.js");
var ObjConstrunctor = {}.constructor;

exports.deepClone = function (value) {
    var typeOfValue = typeof value;
    var cloneValue = value;
    if ((!value) || (typeOfValue == "boolean") || (typeOfValue == "string") || (typeOfValue == "function") || (typeOfValue == "number")) {
        //do nothing
    } else if (value instanceof Date) {
        cloneValue = new Date(value);
    } else if (value instanceof Array) {
        cloneValue = [];
        for (var i = 0; i < value.length; i++) {
            cloneValue.push(Utility.deepClone(value[i]));
        }
    } else if (Utility.isJSONObject(value)) {
        cloneValue = {};
        for (var key in value) {
            cloneValue[key] = Utility.deepClone(value[key]);
        }
    }
    return cloneValue;
}

exports.isJSONObject = function (obj) {
    if (obj === undefined || obj === null || obj === true || obj === false || Array.isArray(obj)) {
        return false;
    } else if (obj.constructor === ObjConstrunctor) {
        return true;
    } else {
        return false;
    }
};

exports.populateEvents = function (events) {
    for (var i = 0; i < events.length; i++) {
        var event = events[i];
        if (event.eventName) {
            continue;
        }
        var eventDef = event.event;
        var indexOf = eventDef.indexOf(":");
        if (indexOf < 0) {
            event.eventName = eventDef;
        } else {
            event.eventName = eventDef.substring(0, indexOf);
            event.fields = JSON.parse(eventDef.substring(indexOf + 1));
        }
    }
}