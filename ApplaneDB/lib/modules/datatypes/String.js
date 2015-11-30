var Utils = require("ApplaneCore/apputil/util.js");
exports.cast = function (value, expression, options) {
    var updatedFieldInfo = options.updatedFieldInfo;
    if (updatedFieldInfo && updatedFieldInfo.type === "string" && updatedFieldInfo.json && value && (typeof value === "string")) {
        try {
            var afterParsing = JSON.parse(value);
            // done for value like 20 // manjeet
            if ((!Array.isArray(afterParsing)) && (!Utils.isJSONObject(afterParsing))) {
                throw new Error(Utils.getDataTypeErrorMessage(value, expression, options));
            }
        } catch (e) {
            throw new Error(Utils.getDataTypeErrorMessage(value, expression, options));
        }
    }
    if (value === null || value === undefined) {
        return;
    }
    if (Array.isArray(value) || require("ApplaneCore/apputil/util.js").isJSONObject(value)) {
        return JSON.stringify(value);
    } else if (typeof value !== 'string') {
        return value.toString();
    } else {
        return value;
    }
}