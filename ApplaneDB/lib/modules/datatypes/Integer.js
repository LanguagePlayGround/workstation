/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 3/31/14
 * Time: 10:21 AM
 * To change this template use File | Settings | File Templates.
 */
var Utils = require("ApplaneCore/apputil/util.js");
exports.cast = function (value, expression, options) {
    if (value == null || value == undefined) {
        return
    }
    try {
        if (!(typeof value === 'number' && value % 1 == 0)) {
            if (isNaN(parseInt(value))) {
                throw new Error(Utils.getDataTypeErrorMessage(value, expression, options));
            } else {
                return parseInt(value);
            }
        } else {
            return value;
        }
    } catch (e) {
        throw new Error(Utils.getDataTypeErrorMessage(value, expression, options));
    }
}

function isInt(data) {
    return typeof data === 'number' && data % 1 == 0;
}

function isFloat(data) {
    return typeof data === 'number' && !isNaN(data);
}
