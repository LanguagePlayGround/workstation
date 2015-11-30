var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");

exports.onPreSave = function (event, document, collection, db, option) {
    if (document.type === "insert" || document.type === "update") {
        var fields = collection.getValue(Constants.Admin.Collections.FIELDS);
        var noOfFields = fields ? fields.length : 0;
        for (var i = 0; i < noOfFields; i++) {
            var field = fields[i];
            var fieldType = field[Constants.Admin.Fields.TYPE];
            if ((fieldType === Constants.Admin.Fields.Type.STRING || fieldType === Constants.Admin.Fields.Type.SEQUENCE) && field[Constants.Admin.Fields.TO_LOWER_CASE]) {
                var value = document.get(field[Constants.Admin.Fields.FIELD]);
                var lowerField = field[Constants.Admin.Fields.FIELD] + "_lower";
                if (value) {
                    document.set(lowerField, value.toString().toLowerCase());
                } else if (document.isInUnset(field[Constants.Admin.Fields.FIELD])) {
                    document.unset(lowerField, "");
                }
            }
        }
    }
}
