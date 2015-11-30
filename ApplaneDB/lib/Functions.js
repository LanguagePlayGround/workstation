/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 27/6/14
 * Time: 11:10 AM
 * To change this template use File | Settings | File Templates.
 *
 *  Current Filter :
 *      User can pass their client timezone.If it was not passed ,default client timezone will be zero.
 *      We will move the date According to their currentTimeZone Offset.
 *      For exm:
 *          21-05-2015T03:00:00 in India   Current time zone offset is -330
 *          date will be move to 20-05-2015T21:30:00
 *          Current Date Filter will be {$gte:20-05-2015T00:00:00,$lt:21-05-2015T00:00:00}
 *
 *          if clientTimeZone is passed then filter will be
 *          {$gte:21-05-2015T00:00:00,$lt:22-05-2015T00:00:00}
 *
 *          Span means that move the date to that particular span after move date.For span in weeek -1 ,move date to one week before that the current date.
 *          GMT : true will be used in case where time does not matter.,For Example in dob,Person born in india on 21-01-2015T2:00:00 will celebrate their bday on 21 everywhere not on 20.
 *
 *          User can also pass in date filter paraeterised with timeZone
 *          like {{$gte:20-05-2015T00:00:00+05:30,$lt:21-05-2015T00:00:00+05:30}}
 *          it means filter on mongo will be {{$gte:19-05-2015T18:30:00+05:30,$lt:20-05-2015T18:30:00+05:30}}
 *
 *
 */

var Utils = require("ApplaneCore/apputil/util.js");
var Moment = require("moment");
var Role = require("./modules/Role.js");
var Constants = require("../lib/Constants.js");
var Q = require("q");

function populateRecursively(result, resultToReturn) {
    if (result) {
        for (var i = 0; i < result.length; i++) {
            resultToReturn.push(result[i]._id)
            if (result[i].children) {
                populateRecursively(result[i].children, resultToReturn);
            }
        }
    }

}
exports.getRecursive = function (params, db) {
    var value = params.key;
    var recursiveField = params.recursiveField;
    var recursiveCollection = params.recursiveCollection;
    var query = {$collection: recursiveCollection, $fields: {_id: 1}, $recursion: {}, $filter: {}}
    query.$recursion[recursiveField] = "_id";
    query.$filter[recursiveField] = value;
    var resultToReturn = [value]
    return db.query(query).then(function (result) {
        if (result && result.result) {
            populateRecursively(result.result, resultToReturn);
        }
        return resultToReturn;
    })


}

exports.CurrentDate = function (param, db) {
    return getCurrentFilter(param, "day", db, {asDate: true});
}

exports.nextDate = function (param, db) {
    param = param || {};
    param.span = (param.span || 0) + 1;
    return getCurrentFilter(param, "day", db, {asDate: true});
}

exports.CurrentDateFilter = function (param, db) {
    return getCurrentFilter(param, "day", db);
}

exports.CurrentMonthFilter = function (param, db) {
    return getCurrentFilter(param, "month", db);
}

exports.CurrentYearFilter = function (param, db) {
    return getCurrentFilter(param, "year", db);
}

exports.CurrentWeekFilter = function (param, db) {
    return getCurrentFilter(param, "week", db);
}

exports.CurrentQuarterFilter = function (param, db) {
    return getCurrentFilter(param, "quarter", db);
}

function getCurrentFilter(param, type, db, options) {
    param = param || {};
    options = options || {};
    var date = param.date;
    var span = param.span;
    if (!param && param.whenDefined) {
        return Constants.Query.$$REMOVED;
    }
    var clientOffSet = param.timezoneOffset || (db ? db.getUserTimezoneOffset() : 0);
    clientOffSet = clientOffSet || 0;
    if (type === "day" && date && Utils.isJSONObject(date)) {
        if (span === undefined) {
            return date;
        } else if (span === -1) {
            return require("./Functions.js").previousSpan({key: date});
        } else {
            throw new Error("date[" + JSON.stringify(date) + "] passed in parameters in CurrentDateFilter with span [" + span + "] is not supported");
        }
    } else {
        var currentDate = date ? new Date(date) : new Date();
        currentDate.setMinutes(currentDate.getMinutes() + currentDate.getTimezoneOffset() - clientOffSet);
        if (type === "week") {
            currentDate.setDate(currentDate.getDate() - currentDate.getDay());
        } else if (type === "month") {
            if (options.monthForecast) {
                //do nothing.Current date required.
            } else {
                currentDate.setDate(1);
            }
        } else if (type === "quarter") {
            currentDate.setDate(1);
            var month = currentDate.getMonth();
            var quarterMonth = month - (month % 3);
            currentDate.setMonth(quarterMonth);
        } else if (type === "year") {
            currentDate.setDate(1);
            currentDate.setMonth(0);
        }
        if (span) {
            addSpan(currentDate, span, type);
        }
        var zone = param.GMT === true ? 0 : clientOffSet;
        var startDateAsClient = new Date(Utils.getDateString(currentDate, zone));
        if (options.asDate) {
            if (param.format !== undefined) {
                startDateAsClient = Moment(startDateAsClient).format(param.format);
            }
            return startDateAsClient;
        } else {
            var nextDate = new Date(currentDate);
            if (options.monthForecast) {
                nextDate.setDate(1);
            }
            addSpan(nextDate, 1, type);
            var nextDateAsClient = new Date(Utils.getDateString(nextDate, zone));
            return {$gte: startDateAsClient, $lt: nextDateAsClient};
        }
    }
}

function addSpan(date, span, type) {
    if (type == "day") {
        date.setDate(date.getDate() + span);
    } else if (type === "week") {
        date.setDate(date.getDate() + (span * 7));
    } else if (type === "month") {
        date.setMonth(date.getMonth() + span);
    } else if (type === "quarter") {
        date.setMonth(date.getMonth() + span * 3);
    } else if (type === "year") {
        date.setFullYear(date.getFullYear() + span);
    }
}

exports.CurrentMonthForecastFilter = function (param, db) {
    return getCurrentFilter(param, "month", db, {monthForecast: true});
}

exports.CurrentUserAdmin = function (params, db) {
    //Used for case of role in user collection.And filter defined in user role on basis of CurrentUserAdmin.
    var user = db.user;
    if (!user) {
        throw new Error("User does not exists in db for resolving CurrentUserAdmin function" + JSON.stringify(params));
    }
    return db.query({
        $collection: Constants.Admin.USERS,
        $filter: {_id: user._id},
        $fields: {admin: 1},
        $modules: {"Role": 0}
    }).then(function (result) {
        if (result.result.length === 0) {
            throw new Error("User does not exist having info [" + JSON.stringify(user) + "]");
        }
        if (result.result[0].admin) {
            return Constants.Query.$$REMOVED;
        } else {
            return new Date().getTime();
        }
    })
}

exports.CurrentUser = function (params, db, options) {
    var user = db.user;
    if (!user) {
        throw new Error("User does not exists in db for resolving CurrentUser function" + JSON.stringify(params));
    }
    var operator = options && options.filterInfo ? options.filterInfo.operator : undefined;
    var paramKey = params ? (Object.keys(params)[0] || "_id") : "_id";
    if (paramKey === "referredFK") {
        var referredFk = params[paramKey];

        var referredCollection = referredFk.collection;
        var referredField = referredFk.referredField;
        var fieldToGet = referredFk.field || "_id";
        if (!referredCollection || !referredField) {
            throw new Error("Either collection or referredField not defined for function : Functions.CurrentUser which is Mandatory");
        }
        var fields = {};
        fields[fieldToGet] = 1;
        var filter = {};
        filter[referredField + "._id"] = user._id;
        var query = {
            $collection: referredCollection,
            $filter: filter,
            $fields: fields,
            $limit: 2,
            $modules: {Role: 0}
        };
        return db.query(query, {cache: true}).then(function (data) {
            //commented due to Amit Sir requirement as user can be employee or not.
//            if (data.result.length === 0) {
//                throw new Error("Current user [" + user.username + "] does not exists in [" + referredCollection + "]");
//            }
            if (data.result.length > 1) {
                throw new Error("More than one user [" + user.username + "] exists in [" + referredCollection + "]");
            }
            var finalValue = Utils.resolveValue(data.result[0], fieldToGet);
            if (!finalValue && operator && operator === "$in") {
                finalValue = [];
            }
            return finalValue;
        });
    } else {
        return user[paramKey];
    }

}

exports.whenDefined = function (param) {
    if (param.key === null || param.key === undefined) {
        return Constants.Query.$$REMOVED;
    } else {
        return param.key;
    }
}
exports.previousSpan = function (params) {
    var key = params.key;
    if (key === null || key === undefined) {
        if (params.whenDefined) {
            return Constants.Query.$$REMOVED;
        }
    } else {
        var gte = Moment.utc(key.$gte);
        var lt = Moment.utc(key.$lt);
        if (gte.year() !== lt.year() && gte.date() == lt.date() && gte.month() === lt.month()) {
            var diff = Math.abs(gte.diff(lt, 'year', true));
            return {
                "$gte": gte.subtract("year", diff).toDate(),
                "$lt": lt.subtract("year", diff).toDate()
            };
        }
        else if (gte.month() !== lt.month() && gte.date() === lt.date()) {
            var diff = Math.abs(gte.diff(lt, 'month', true));
            return {
                "$gte": gte.subtract("month", diff).toDate(),
                "$lt": lt.subtract("month", diff).toDate()
            };
        } else {
            var diff = Math.abs(gte.diff(lt, 'days', true));
            return {
                "$gte": gte.subtract("days", diff).toDate(),
                "$lt": lt.subtract("days", diff).toDate()
            };
        }
    }
}

exports.Query = function (params, db, options) {
    var query = params ? params.query : undefined;
    if (!query) {
        throw new Error("Query is mandatory for Query Function in Filter.");
    }
    if (options && options.$parameters) {
        query.$parameters = query.$parameters || {};
        for (var k in options.$parameters) {
            if (query.$parameters[k] === undefined) {
                query.$parameters[k] = options.$parameters[k];
            }
        }
    }
    var newResult = [];
    return db.query(query).then(
        function (result) {
            var filterField = params.filterField || "_id";
            populateResult(result.result, newResult, filterField, params.nestedField);
            var defaultOptions = params.defaultOptions;
            if (!defaultOptions || defaultOptions.length === 0) {
                return newResult;
            }
            return Utils.iterateArrayWithPromise(defaultOptions,
                function (index, defaultOption) {
                    var p = require("../lib/modules/Function.js").populateFilter(defaultOption, options.$parameters, db, options);
                    if (Q.isPromise(p)) {
                        return p.then(function () {
                            if (defaultOption[filterField]) {
                                newResult.push(defaultOption[filterField]);
                            }
                        })
                    } else {
                        if (defaultOption[filterField]) {
                            newResult.push(defaultOption[filterField]);
                        }
                    }
                }).then(function () {
                    return newResult;
                })
        })
}

function populateResult(result, newResult, filterField, nestedField) {
    for (var i = 0; i < result.length; i++) {
        var row = result[i];
        var resolvedValue = Utils.resolveDottedValue(row, filterField);
        if (resolvedValue !== undefined) {
            newResult.push(resolvedValue);
        }
        if (nestedField && row[nestedField] && Array.isArray(row[nestedField]) && row[nestedField].length > 0) {
            populateResult(row[nestedField], newResult, filterField, nestedField);
        }
    }
}

exports.UserRoles = function (params, db, options) {
    var collection = options.collection;
    var filterInfo = options.filterInfo;
    if (!collection || !filterInfo) {
        throw new Error("Please provide value of mandatory parameters in userRoles in options [collection/filterInfo]");
    }
//    console.log("USer role called...params.." + JSON.stringify(params));
//    console.log("USer role called...options.." + JSON.stringify(options));
    var filterKey = filterInfo.key;
    if (filterKey.lastIndexOf("._id") > 0) {
        filterKey = filterKey.substring(0, filterKey.lastIndexOf("._id"));
    }
    return db.collection(collection).then(
        function (collectionObj) {
            var fkFields = collectionObj.getValue("fkFields");
            var referredCollection = undefined;
            if (fkFields && fkFields[filterKey]) {
                referredCollection = fkFields[filterKey].collection;
            }
            if (!referredCollection) {
                throw new Error("Referred Collection Not found in userRole Function.Filter Defined on field [" + filterKey + "] in collection [" + collection + "]");
            }
            if (collection === referredCollection) {
                throw new Error("Collection and Referred Collection can not be same in UserRole Function.Filter Defined on field [" + filterKey + "] in collection [" + collection + "]");
            }
            var parameters = options.$parameters;
            var fieldValue = parameters ? parameters[filterKey] : undefined;
            var roleApplied = Role.getRoleToResolve(fieldValue, db);
//            console.log("Role applied..."+roleApplied)
            if (!roleApplied) {
                roleApplied = parameters ? parameters["__role__" + filterKey] : undefined;
            }
            if (params.isVisible) {
                //Work done for show/hide actions on basis of role.
                var roles = params.roles;
                if (!roles) {
                    throw new Error("Roles is mandatory in user Role if isVisible is defined.");
                }
                var roleInfo = Role.getPrivilege(db.userRoles, referredCollection, roleApplied);
                var roleName = roleInfo ? roleInfo.roleId : undefined;
                if (!roleName) {
                    return;
                }
                var isInclude = Utils.isInclude(roles);
                if ((isInclude && roles[roleName] !== undefined) || (!isInclude && roles[roleName] === undefined)) {
                    return true;
                } else {
                    return Constants.Query.$$RESOLVED;
                }
            }
//            console.log("db.userRoles...."+JSON.stringify(db.userRoles))
//            console.log("referredCollection...."+referredCollection)
//            console.log("roleApplied...."+roleApplied)
            var fullRights = Role.isFullRights(db.userRoles, referredCollection, roleApplied);
//            console.log("fullRights...."+fullRights)
            if (fullRights) {
                return Constants.Query.$$RESOLVED;
            } else {
                var query = {
                    $collection: referredCollection,
                    $fields: {_id: 1}
                };
                if (roleApplied) {
                    query.$parameters = query.$parameters || {};
                    query.$parameters[Constants.Query.Parameters.ROLE] = roleApplied;
                }
                return populateIds(query, db);
            }
        })
}


function populateIds(query, db) {
    return db.query(query, {cache: true}).then(function (result) {
        result = result.result;
        var ids = [];
        for (var i = 0; i < result.length; i++) {
            ids.push(result[i]._id);
        }
        return ids;
    })
}


exports.CurrentFilterSpace = function (params, db) {
    var user = db.user;
    if (!user) {
        return;
    }
    var paramKey = params ? (Object.keys(params)[0]) : "_id";
    if (paramKey === "filterSpace") {
        var space = params[paramKey];
        var query = {
            $collection: Constants.Admin.USERS,
            $filter: {"_id": user._id},
            $fields: {"filterspace": 1},
            $limit: 1,
            $modules: false
        };
        return db.query(query/*, {cache: true}*/).then(function (data) {
            if (data.result.length === 0) {
                return Constants.Query.$$REMOVED;
            }
            var filterSpace = data.result[0].filterspace;
            if (filterSpace && filterSpace[space]) {
                var filter = JSON.parse(filterSpace[space].filter.filterInfo);
                if (filter && Object.keys(filter.filter).length > 0) {
                    var filterKey = Object.keys(filter.filter)[0];
                    return filter[filterKey] ? filter[filterKey]._id : undefined;
                } else {
                    return Constants.Query.$$REMOVED;
                }
            } else {
                return Constants.Query.$$REMOVED;
            }
        });
    }
}