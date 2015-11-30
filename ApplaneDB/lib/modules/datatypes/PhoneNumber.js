var Utils = require("ApplaneCore/apputil/util.js");
exports.cast = function (value, expression, options) {
    if (value == null || value === undefined) {
        return;
    }
    var updatedFieldInfo = options.updatedFieldInfo;
    try {
        if ((updatedFieldInfo.mobile && Utils.isMobileNumber(value)) || (!updatedFieldInfo.mobile && Utils.isPhoneNumber(value))) {
            return value;
        }  else {
            var msg = Utils.getDataTypeErrorMessage(value, expression, options);
            if(updatedFieldInfo.mobile){
                msg += "Mobile is true";
            }
            throw new Error(msg);
        }
    } catch (e) {
        var msg = Utils.getDataTypeErrorMessage(value, expression, options);
        if(updatedFieldInfo.mobile){
            msg += "Mobile is true";
        }
        throw new Error(msg);
    }
}