/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 7/8/14
 * Time: 3:42 PM
 * To change this template use File | Settings | File Templates.
 */

var Utils = require("ApplaneCore/apputil/util.js");
var Moment = require('moment');
var Constants = require("../Constants.js");
var SELF = require("./Schedule.js");
var DEFAULT_TIME_ZONE = -19800000 / (60 * 1000);
var Weeks = {"Sun":0, "Mon":1, "Tue":2, "Wed":3, "Thu":4, "Fri":5, "Sat":6};
var Days = {"1":1, "2":2, "3":3, "4":4, "5":5, "6":6, "7":7, "8":8, "9":9, "10":10, "11":11, "12":12, "13":13, "14":14, "15":15, "16":16, "17":17, "18":18, "19":19, "20":20, "21":21, "22":22, "23":23, "24":24, "25":25, "26":26, "27":27, "28":28, "29":29, "30":30, "31":31};
var Months = {"Jan":0, "Feb":1, "Mar":2, "Apr":3, "May":4, "Jun":5, "Jul":6, "Aug":7, "Sep":8, "Oct":9, "Nov":10, "Dec":11};


exports.onValue = function (event, document, collection, db, options) {
    var updatedFieldInfo = options.updatedFieldInfo;
    if (!updatedFieldInfo) {
        throw new Error("updatedFieldInfo must be available in Schedule Module.");
    }
    var scheduleDoc = document.getDocuments(updatedFieldInfo.field);
    if (scheduleDoc) {
        var value = document.get(updatedFieldInfo.field);
        if (value.nextDueOn && typeof value.nextDueOn === "string") {
            value.nextDueOn = new Date(value.nextDueOn);
        }
        if (value.startsOn && typeof value.startsOn === "string") {
            value.startsOn = new Date(value.startsOn);
        }
        var updatedFields = scheduleDoc.getUpdatedFields();
        if (updatedFields && updatedFields.length > 0) {
            var now = new Date();
            if (updatedFields.indexOf(Constants.Modules.Udt.Schedule.NEXT_DUE_ON) >= 0 && value[Constants.Modules.Udt.Schedule.NEXT_DUE_ON]) {
                var nextDueOnDate = value[Constants.Modules.Udt.Schedule.NEXT_DUE_ON];
                if (nextDueOnDate < now) {
                    throw new Error("NextDueOn Date must be greater than CurrentDate.");
                }
            } else {
                value[Constants.Modules.Udt.Schedule.NEXT_DUE_ON] = SELF.getNextDueDate(value, now);
            }
        }
    }
}

exports.getNextDueDate = function (when, now) {
    var repeats = when[Constants.Modules.Udt.Schedule.REPEATS];
    if (!repeats || repeats.trim().length === 0 || repeats === Constants.Modules.Udt.Schedule.Repeats.NONE) {
        return;
    }
    var startsOn = when[Constants.Modules.Udt.Schedule.STARTS_ON] || undefined;
    if (startsOn && startsOn > now) {
        if (repeats === Constants.Modules.Udt.Schedule.Repeats.MINUTELY || repeats === Constants.Modules.Udt.Schedule.Repeats.HOURLY || repeats === Constants.Modules.Udt.Schedule.Repeats.DAILY) {
            return startsOn;
        } else {
            now = startsOn;
        }
    }
    var nextDueOnDate = when[Constants.Modules.Udt.Schedule.NEXT_DUE_ON] || undefined;
    var timeInMinutes = nextDueOnDate ? getTimeInMinutes(nextDueOnDate) : (startsOn ? getTimeInMinutes(startsOn) : getTimeInMinutes(now));

    var repeatEvery = when[Constants.Modules.Udt.Schedule.REPEAT_EVERY] ? parseInt(when[Constants.Modules.Udt.Schedule.REPEAT_EVERY]) : 1;
    var repeatOn = when[Constants.Modules.Udt.Schedule.REPEAT_ON] || [];
    sortRepeatedOn(repeatOn, repeats);
    var currentDate = Moment(now).toDate();
    if (repeats === Constants.Modules.Udt.Schedule.Repeats.MINUTELY || repeats === Constants.Modules.Udt.Schedule.Repeats.HOURLY) {
        if (nextDueOnDate) {
            timeInMinutes = getTimeInMinutes(nextDueOnDate);
        }
        var repeatEveryInMinutes = repeats === Constants.Modules.Udt.Schedule.Repeats.MINUTELY ? repeatEvery : repeatEvery * 60;
        var currentTimeInMinutes = getTimeInMinutes(now);
        if (timeInMinutes > currentTimeInMinutes) {
            nextDueOnDate = Moment(now).subtract("days", 1).startOf("day").add("minutes", timeInMinutes).toDate();
        } else {
            nextDueOnDate = Moment(now).startOf("day").add("minutes", timeInMinutes).toDate();
        }
        return get(nextDueOnDate, repeatEveryInMinutes, currentDate);
    } else if (repeats === Constants.Modules.Udt.Schedule.Repeats.DAILY) {
        nextDueOnDate = Moment(now).startOf("day").add("minutes", timeInMinutes).toDate();
        if (nextDueOnDate >= currentDate) {
            return nextDueOnDate;
        }
        return Moment(nextDueOnDate).add("days", repeatEvery).toDate();
    } else if (repeats === Constants.Modules.Udt.Schedule.Repeats.WEEKLY) {
        repeatOn = repeatOn.length === 0 ? [6] : repeatOn;
        var repeatedOnLength = repeatOn.length;
        for (var i = 0; i < repeatedOnLength; i++) {
            nextDueOnDate = Moment(now).day(repeatOn[i]).startOf("day").add("minutes", timeInMinutes).toDate();
            if (nextDueOnDate >= currentDate) {
                return nextDueOnDate;
            }
        }
        return Moment(now).add("days", (7 * repeatEvery)).day(repeatOn[0]).startOf("day").add("minutes", timeInMinutes).toDate();
    } else if (repeats === Constants.Modules.Udt.Schedule.Repeats.MONTHLY) {
        repeatOn = repeatOn.length == 0 ? [31] : repeatOn;
        var repeatedOnLength = repeatOn.length;
        for (var i = 0; i < repeatedOnLength; i++) {
            nextDueOnDate = Moment(now).startOf("day").add("minutes", timeInMinutes).toDate();
            var maxDays = getMaximumNoOfDays(nextDueOnDate.getMonth(), nextDueOnDate.getYear());
            nextDueOnDate = Moment(nextDueOnDate).set("date", repeatOn[i] > maxDays ? maxDays : repeatOn[i]);
            if (nextDueOnDate >= currentDate) {
                return nextDueOnDate;
            }
        }
        nextDueOnDate = Moment(now).add("months", repeatEvery).startOf("day").add("minutes", timeInMinutes).toDate();
        var maxDays = getMaximumNoOfDays(nextDueOnDate.getMonth(), nextDueOnDate.getYear());
        return Moment(nextDueOnDate).set("date", repeatOn[0] > maxDays ? maxDays : repeatOn[0]);
    } else if (repeats === Constants.Modules.Udt.Schedule.Repeats.YEARLY) {
        repeatOn = repeatOn.length == 0 ? [11] : repeatOn;
        var repeatedOnLength = repeatOn.length;
        for (var i = 0; i < repeatedOnLength; i++) {
            nextDueOnDate = Moment(now).set("month", repeatOn[i]).endOf("month").startOf("day").add("minutes", timeInMinutes).toDate();
            if (nextDueOnDate >= currentDate) {
                return nextDueOnDate;
            }
        }
        return Moment(now).add("year", repeatEvery).set("month", repeatOn[0]).endOf("month").startOf("day").add("minutes", timeInMinutes).toDate();
    }

}

function get(date, minutes, currentDate) {
    if (date > currentDate) {
        return date;
    }
    date = Moment(date).add("minutes", minutes).toDate();
    return get(date, minutes, currentDate);
}

function getMaximumNoOfDays(month, year) {
    return [31, (isLeapYear(year) ? 29 : 28), 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month];
}

function isLeapYear(year) {
    return (((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0));
}

function sortRepeatedOn(repeatOn, repeat) {
    if (repeatOn.length == 0) {
        return repeatOn;
    }
    var sortedRepeatOn = [];
    if (repeat == Constants.Modules.Udt.Schedule.Repeats.WEEKLY) {
        for (var weekDay in Weeks) {
            if (repeatOn.indexOf(weekDay) != -1) {
                sortedRepeatOn.push(Weeks[weekDay]);
            }
        }
    }
    else if (repeat == Constants.Modules.Udt.Schedule.Repeats.MONTHLY) {
        for (var day in Days) {
            if (repeatOn.indexOf(day) != -1) {
                sortedRepeatOn.push(Days[day]);
            }
        }
    } else if (repeat == Constants.Modules.Udt.Schedule.Repeats.YEARLY) {
        for (var month in Months) {
            if (repeatOn.indexOf(month) != -1) {
                sortedRepeatOn.push(Months[month]);
            }
        }
    }
    return sortedRepeatOn;
}

function getTimeInMinutes(date) {
    return date ? ((date.getHours() * 60) + date.getMinutes()) : 0;
}


