/*
 *
 * Date behaviour
 * Mongo will always store date in GMT(Zero time zone) format. It server is in India and we want to save 27-11-2014 11.00 AM then in mongo it will be save as 27-11-2014 05.30 AM and if we want to save 27-11-2014 02.00 AM --> then it will be save as 26-11-2014 08.30 PM and data returned from server is also in GMT format.
 * We will have issue in $CurrentDateFilter if server is not in zero tome zone, if it is in india then if current time is 27-11-2014 02:00 AM then filter will be applied of 26-11-2014T00:00:00 to 27-11-2014T00:00:00 and if current time is 27-11-2014T07:00:00AM then filter will be applied of 27-11-2014T00:00:00 to 28-11-2014T00:00:00 but actual it should be 26-11-2014T18:30:00 to 27-11-2014T18:30:00 because server is in IST and any time saved on 27-114-2014 before5:30AM will be saved in 26-11-2014 in mongo
 * We will expect date from client in zero time zone same for filter
 *
 * */

var Utils = require("ApplaneCore/apputil/util.js");
exports.cast = function (value, expression, options) {
    if (value === undefined || value === null) {
        return
    }
    if (Array.isArray(value)) {
        return value;
        // commented due to elastic search
//        throw new Error("Date multiple is not supported");
    }
    try {
        if (!(value instanceof Date)) {
            if ("Invalid Date" == new Date(value)) {
                var errMessage = Utils.getDataTypeErrorMessage(value, expression, options);
                errMessage += "Provide value in format yyyy/mm/dd";
                throw new Error(errMessage);
            }
            return new Date(value);
        } else {
            return value;
        }
    } catch (e) {
        var errMessage = Utils.getDataTypeErrorMessage(value, expression, options);
        errMessage += "Provide value in format yyyy/mm/dd";
        throw new Error(errMessage);
    }
}

