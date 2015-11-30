/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 5/9/14
 * Time: 2:24 PM
 * To change this template use File | Settings | File Templates.
 */
var Utility = require("ApplaneCore/apputil/util.js");
var SELF = require("./QueryUtility.js");

exports.getReference = function (value) {
    if (!value) {
        return;
    }
    var newValue = {}
    for (var k in value) {
        newValue[k] = value[k];
    }
    return newValue;
}

exports.getQueryClone = function (query) {
    if (!query) {
        return;
    }
    if (Array.isArray(query)) {
        var newArray = [];
        for (var i = 0; i < query.length; i++) {
            newArray.push(SELF.getQueryClone(query[i]));
        }
        return newArray;
    } else {
        var queryClone = {};
        for (var k in query) {
            if (k === "$collection") {
                queryClone[k] = query[k];
            } else {
                queryClone[k] = require("./Utility.js").deepClone(query[k]);
            }
        }
        return queryClone;
    }

}
