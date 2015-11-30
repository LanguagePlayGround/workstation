var Utility = require("ApplaneCore/apputil/util.js")
exports.cast = function (value, expression, options) {
    if ((!Utility.isObjectId(value)) && typeof value == "string") {
        try{
            return Utility.getObjectId(value);
        }catch(e){
            throw new Error(Utility.getDataTypeErrorMessage(value, expression, options)+ e.message);
        }
    } else {
        return value;
    }
}
