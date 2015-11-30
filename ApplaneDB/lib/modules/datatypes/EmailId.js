var Utils = require("ApplaneCore/apputil/util.js");
exports.cast = function (value, expression, options) {
    if (value == null || value === undefined) {
        return;
    }
    try {
        if (Utils.isEmailId(value)) {
            return value;
        } else {
            throw new Error(Utils.getDataTypeErrorMessage(value, expression, options));
        }
    } catch (e) {
        throw new Error(Utils.getDataTypeErrorMessage(value, expression, options));
    }
}

