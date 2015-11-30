var Utils = require("ApplaneCore/apputil/util.js");
exports.cast = function (value, expression, options) {
    if (value == null || value === undefined) {
        return;
    }
    try {
        if (!(typeof value === 'number')) {
            if (isNaN(Number(value))) {
                throw new Error(Utils.getDataTypeErrorMessage(value, expression, options));
            } else {
                return Number(value);
            }
        } else {
            return value;
        }
    } catch (e) {
        throw new Error(Utils.getDataTypeErrorMessage(value, expression, options));
    }
}