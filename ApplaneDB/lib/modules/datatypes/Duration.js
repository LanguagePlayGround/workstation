/**
 * Created by Administrator on 6/4/14.
 */

var Constants = require("../../Constants.js");
exports.cast = function (doc, expression, options) {
    if (doc) {
        var time = doc.get([Constants.Modules.Udt.Duration.TIME]);
        var unit = doc.get([Constants.Modules.Udt.Duration.UNIT]);
        var convertedValue = 0;
        if (unit == Constants.Modules.Udt.Duration.Unit.DAYS) {
            convertedValue = time * 8 * 60;
        } else if (unit == Constants.Modules.Udt.Duration.Unit.HRS) {
            convertedValue = time * 60;
        } else if (unit == Constants.Modules.Udt.Duration.Unit.MINUTES) {
            convertedValue = time;
        }
        doc.set("convertedvalue", convertedValue);
    }
}