/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 3/31/14
 * Time: 10:21 AM
 * To change this template use File | Settings | File Templates.
 */
var Utils = require("ApplaneCore/apputil/util.js");
exports.cast = function (value, expression, options) {
    if (value === undefined || value === null) {
        return
    }
    try {
        if (!(typeof value === 'number' && !isNaN(value))) {
            if (isNaN(parseFloat(value))) {
                throw new Error(Utils.getDataTypeErrorMessage(value, expression, options));
            } else {
                return parseFloat(value);
            }
        } else {
            return value;
        }
    } catch (e) {
        throw new Error(Utils.getDataTypeErrorMessage(value, expression, options));
    }
}