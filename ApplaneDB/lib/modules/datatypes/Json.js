var Utils = require("ApplaneCore/apputil/util.js");
exports.cast = function (value, expression, options) {
    if (value === null || value === undefined) {
        return;
    }
//    console.log("value>>>>>>>>>>>>>>>" + JSON.stringify(value))
    if (value instanceof require("../../../public/js/Document.js")) {
        value = value.updates;
        if (value === null || value === undefined) {
            return;
        }
    }

    if (Array.isArray(value)) {
        return value;
    } else if (require("ApplaneCore/apputil/util.js").isJSONObject(value)) {
        return (value);
    } else if (typeof value === 'string') {
        return JSON.parse(value);
    } else {
        throw new Error(Utils.getDataTypeErrorMessage(value, expression, options));
    }
}
