var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");
var SELF = require("./aggregateview.js");
var Moment = require("moment");
exports.getAggregateView = function (v, view, requiredView, db, options) {
    var viewOptions = requiredView.viewOptions;
    var aggregateSpan = view.aggregateSpan || {
        "month": true,
        "fy": true,
        comparison: true,
        quarter: true
    };
    var comparison = aggregateSpan.comparison;
    var aggregateType = view.aggregateType || viewOptions.aggregateType;
    viewOptions.aggregateType = aggregateType;
    viewOptions.aggregateSpan = aggregateSpan;
    viewOptions.indicator = view.indicator || "increasing";
    if (aggregateType === "expression") {
        var aggregateExpression = view.aggregateExpression || viewOptions.aggregateExpression;
        viewOptions.aggregateExpression = aggregateExpression;
        if (aggregateExpression) {
            return populateExpressionTypeQuery(v, view, requiredView, aggregateExpression, options);
        }
    } else {
        var value = view.value || viewOptions.value;
        if (value) {
            var fieldInfo = Utils.getField(value, viewOptions.fields);
            viewOptions.valueui = fieldInfo ? fieldInfo.ui : undefined;
        } else {
            viewOptions.valueui = "number";
        }
        var dateColumn = view.date || viewOptions.date;
        viewOptions.date = dateColumn;
        var runOnES = options && options.es ? true : false;
        var query = {$collection: viewOptions.collection, runOnES: runOnES};
        var viewid = view.alias || view.id;
        if (query.runOnES) {
            query.$similarqueries = {"date": dateColumn, queries: [
                {"alias": viewid + "__fy"},
                {"alias": viewid + "__past__fy"},
                {"alias": viewid + "__month"},
                {"alias": viewid + "__past__month"},
                {"alias": viewid + "__quarter"},
                {"alias": viewid + "__past__quarter"}
            ]};

        }
        var group = {};
        if (view.groupColumns) {
            if (Array.isArray(view.groupColumns)) {
                group._id = {};
                for (var i = 0; i < view.groupColumns.length; i++) {
                    var groupColumn = view.groupColumns[i];
                    var groupColumnLabel = Utils.replaceDotToUnderscore(groupColumn);
                    group._id[groupColumnLabel] = "$" + groupColumn;
                    group[groupColumnLabel] = {$first: "$" + groupColumn};
                }
                group.$fields = false;
            }
        } else {
            group = {_id: null, $fields: false};
        }
        if (value) {
            populateGroup(group, value);
        } else {
            group["count"] = {"$sum": 1};
            group.$sort = {"count": -1};
        }
        query.$group = group;
        if (value) {
            var dotIndex = value.indexOf(".");
            if (dotIndex >= 0) {
                value = value.substring(0, dotIndex) + "_" + value.substring(dotIndex + 1);
            }
            viewOptions.value = value;
        } else {
            viewOptions.value = "count";
        }

        if (view.unwind) {
            query.$unwind = view.unwind;
        }
        var batchQueries = {};
        viewOptions.aggregateSpan = aggregateSpan;
        query.$parameters = v.$parameters || {};
        viewOptions.parameters = {};
        for (var key in query.$parameters) {
            viewOptions.parameters[key] = query.$parameters[key];
        }
        var monthFilter = undefined;
        var quarterFilter = undefined;
        var Function = require("ApplaneDB/lib/Functions.js");
        var selectedDateParameter = view["selectedDateParameter"];
        var dateParameters = query.$parameters[selectedDateParameter];
        if (dateParameters) {
            monthFilter = Function.CurrentMonthFilter({"date": dateParameters.$gte});
            quarterFilter = Function.CurrentQuarterFilter({"date": dateParameters.$gte});
        } else {
            monthFilter = Function.CurrentMonthFilter({"date": new Date()});
            quarterFilter = Function.CurrentQuarterFilter({"date": new Date()});
        }
        var currentDate = dateParameters ? dateParameters.$gte : new Date();
        return getFY(currentDate, db).then(
            function (yearFilter) {
                var QueryGrid = viewOptions.queryGrid;
                query.$filter = QueryGrid.$filter;
                var viewid = view.alias || view.id;
                if (view.filter) {
                    query.filter = view.filter;
                }
                if (viewOptions.queryGrid.$filter) {
                    var filter = viewOptions.queryGrid.$filter;
                    if (!Utils.isJSONObject(filter)) {
                        filter = JSON.parse(filter);
                    }
                    query.$filter = query.$filter || {}
                    for (var key in filter) {
                        query.$filter[key] = filter[key];
                    }
                }
                query.$filter = query.$filter || {};
                if (aggregateType === "range" || aggregateType === "as_on" || aggregateType === "forecast") {
                    query.$filter[dateColumn] = "$" + dateColumn;
                } else if (aggregateType === "due") {
                    var dueDate = view.dueDate || viewOptions.dueDate;
                    viewOptions.dueDate = dueDate;
                    var receiveDate = view.receiveDate || viewOptions.receiveDate;
                    viewOptions.receiveDate = receiveDate;
                    query.$filter[dueDate] = "$" + dueDate;
                }
                if (aggregateSpan.fy && yearFilter && yearFilter.filter) {
                    populateQuery({
                        query: query,
                        batchQueries: batchQueries,
                        comparison: comparison,
                        filter: yearFilter.filter,
                        expression: "fy",
                        viewid: viewid,
                        aggregateType: aggregateType,
                        viewOptions: viewOptions,
                        session: yearFilter.session,
                        selectedDateParameter: selectedDateParameter
                    });
                }
                if (aggregateSpan.month) {
                    if ((aggregateType === "due") && batchQueries[viewid + "__fy"]) {
                        batchQueries[viewid + "__month"] = {
                            $expression: viewid + "__fy",
                            $operator: "="
                        };
                    }
                    populateQuery({
                        query: query,
                        batchQueries: batchQueries,
                        comparison: comparison,
                        filter: monthFilter,
                        expression: "month",
                        viewid: viewid,
                        aggregateType: aggregateType,
                        viewOptions: viewOptions,
                        selectedDateParameter: selectedDateParameter
                    });
                }
                if (aggregateSpan.quarter) {
                    if ((aggregateType === "due") && batchQueries[viewid + "__month"]) {
                        batchQueries[viewid + "__quarter"] = {
                            $expression: viewid + "__month",
                            $operator: "="
                        };
                    }
                    populateQuery({
                        query: query,
                        batchQueries: batchQueries,
                        comparison: comparison,
                        filter: quarterFilter,
                        expression: "quarter",
                        viewid: viewid,
                        aggregateType: aggregateType,
                        viewOptions: viewOptions,
                        selectedDateParameter: selectedDateParameter
                    });
                }
            }).then(
            function () {
                if (view.queryEvent) {
                    for (var key in batchQueries) {
                        var batchQuery = batchQueries[key];
                        batchQuery.$events = view.queryEvent;
                    }
                }
                if (view.runAsBatchQuery) {// run all the dashboard queries in batch
                    requiredView.batchQueries = batchQueries;
                    return;
                }
                return db.batchQuery(batchQueries);
            }).then(function (result) {
                if (result) {
                    var ViewUtility = require("ApplaneDB/public/js/ViewUtility.js");
                    ViewUtility.populateDataInViewOptionsForAggregateView(result, requiredView, true);
                }
            });
    }
}

function populateQuery(params) {
    var query = params.query;
    var batchQueries = params.batchQueries;
    var comparison = params.comparison;
    var filter = params.filter;
    var expression = params.expression;
    var viewid = params.viewid;
    var aggregateType = params.aggregateType;
    var viewOptions = params.viewOptions;
    var queryClone = Utils.deepClone(query);
    populateParameters({
        query: queryClone,
        filter: filter,
        expression: expression,
        aggregateType: aggregateType,
        viewOptions: viewOptions,
        session: params.session,
        selectedDateParameter: params.selectedDateParameter
    });
    if (batchQueries[viewid + "__" + expression] === undefined) {
        batchQueries[viewid + "__" + expression] = queryClone;
    }
    if (comparison) {
        var Function = require("ApplaneDB/lib/Functions.js");
        var previousMonthFilter = Function.previousSpan({key: filter});
        var clone = Utils.deepClone(query);
        populateParameters({
            query: clone,
            filter: filter,
            previousSpanFilter: previousMonthFilter,
            expression: expression,
            aggregateType: aggregateType,
            viewOptions: viewOptions,
            previous: true,
            session: params.session,
            selectedDateParameter: params.selectedDateParameter
        });
        batchQueries[viewid + "__" + "past__" + expression] = clone;
    }
}


function getQuarter(currentDate, quarterOffset) {
    var currentQuarter = (Math.ceil((currentDate.getMonth() + 1) / 3)) + quarterOffset;
    var quarterFirstDay = new Date(currentDate.getFullYear(), (currentQuarter * 3) - 3, 1);
    var nextQuarterFirstDate = new Date(currentDate.getFullYear(), (currentQuarter * 3), 1);
    return {
        '$gte': quarterFirstDay,
        '$lt': nextQuarterFirstDate
    }
}


function getNextQuarter(filter) {
    var nextQuarterFirstDate = Moment(filter.$gte).add("months", 3).toDate();
    var nextQuarterLastDate = Moment(filter.$lt).add("months", 3).toDate();
    return {
        $gte: nextQuarterFirstDate,
        $lt: nextQuarterLastDate
    };
}

function getFY(currentDate, db) {
    return db.query({
        $collection: "financeYear",
        $filter: {
            "from_date": {$lte: currentDate},
            "to_date": {"$gte": currentDate}
        }
    }).then(function (sessions) {
            if (sessions && sessions.result && sessions.result.length > 0) {
                var toDate = sessions.result[0].to_date;
                var Moment = require("moment");
                toDate = Moment.utc(toDate).add("days", 1).startOf("day").toDate();
                return {
                    filter: {
                        $gte: sessions.result[0].from_date,
                        $lt: toDate
                    },
                    session: sessions.result[0].session
                };
            }
        });
}


function populateExpressionTypeQuery(v, view, requiredView, aggregateExpression, options) {
    var d = Q.defer();
    var tokens = undefined;
    var seperator = undefined;
    tokens = aggregateExpression.split("-");
    seperator = "-";
    if (tokens && tokens.length === 1) {
        seperator = "+";
        tokens = aggregateExpression.split("+");
    }
    if (tokens && tokens.length === 1) {
        d.reject(new Error("Allowed operators are + and - in Expression [" + aggregateExpression + "]"));
    }
    var parentViewInfo = options.parentViewInfo;
    var childViews = parentViewInfo.views;
    var childAggregates = parentViewInfo.aggregates;
    requiredView.viewOptions.value = "netTotal";
    requiredView.batchQueries = {};
    var viewid = view.alias || view.id;
    var aggregateSpan = requiredView.viewOptions.aggregateSpan;
    if (aggregateSpan.fy) {
        populateQueryInner("__fy");
    }
    if (aggregateSpan.month) {
        populateQueryInner("__month");
    }
    if (aggregateSpan.quarter) {
        populateQueryInner("__quarter");
    }
    d.resolve();
    return d.promise;

    function populateQueryInner(alias) {
        if (aggregateSpan.fy) {
            var parent = populateParent(alias);
            requiredView.batchQueries[viewid + alias] = {
                $expression: aggregateExpression,
                $parent: parent,
                $operator: seperator,
                $value: "netTotal"
            };
            if (aggregateSpan.comparison) {
                alias = "__past" + alias;
                var parent = populateParent(alias);
                requiredView.batchQueries[viewid + alias] = {
                    $expression: aggregateExpression,
                    $parent: parent,
                    $operator: seperator,
                    $value: "netTotal"
                };
            }
        }
    }

    function populateParent(alias) {
        var parent = {};
        for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i].trim();
            var index = Utils.isExists(childViews, {alias: token}, "alias");
            var existsInAggregates = undefined;
            if (index === undefined) {
                existsInAggregates = true;
                index = Utils.isExists(childAggregates, {alias: token}, "alias");
            }
            if (index !== undefined) {
                var targetViewOptions = undefined;
                if (existsInAggregates) {
                    targetViewOptions = childAggregates[index].view && childAggregates[index].view.viewOptions ? childAggregates[index].view.viewOptions : {};
                } else {
                    targetViewOptions = childViews[index].view && childViews[index].view.viewOptions ? childViews[index].view.viewOptions : {};
                }
                parent[token] = {
                    alias: token + alias,
                    value: targetViewOptions.value,
                    type: targetViewOptions.valueui
                };
                requiredView.viewOptions.valueui = targetViewOptions.valueui;
                requiredView.viewOptions.aggregateSpan = targetViewOptions.aggregateSpan;
                requiredView.viewOptions.parameters = targetViewOptions.parameters;
            }
        }
        return parent;
    }
}


function populateParameters(params) {
    var Moment = require("moment");
    var aggregateType = params.aggregateType;
    var filter = params.filter;
    var viewOptions = params.viewOptions;
    var query = params.query;
    var parameters = query.$parameters;
    var expression = params.expression;
    var previous = params.previous;
    var previousSpanFilter = params.previousSpanFilter;
    var selectedDateParameter = params.selectedDateParameter;
    var dateParameters = query.$parameters[selectedDateParameter];
    var currentDate = undefined;
    if (dateParameters) {
        currentDate = Utils.setDateWithZeroTimezone(new Date(dateParameters.$gte));
    } else {
        currentDate = Utils.setDateWithZeroTimezone(new Date());
    }
    viewOptions.parameters = viewOptions.parameters || {};
    if (aggregateType === "range") {
        var dateColumn = viewOptions.date;
        if (previous) {
            parameters[dateColumn] = previousSpanFilter;
        } else {
            parameters[dateColumn] = filter;
            viewOptions.parameters[expression] = filter;// the date filters are passed in the viewoptions.parameters for type range
        }
    } else if (aggregateType === "as_on") {
        if (previous) {
            var previousDate = undefined;
            if (expression == "month") {
                previousDate = Moment.utc(currentDate).subtract("month", 1).toDate();
            } else if (expression == "fy") {
                previousDate = Moment.utc(filter.$gte).subtract("year", 1).toDate();
            } else if (expression == "quarter") {
                previousDate = Moment.utc(filter.$gte).subtract("months", 3).toDate();
            }
        } else {
            if (expression == "month") {
                previousDate = currentDate;
                var label = previousDate.getDate() + '/' + (previousDate.getMonth() + 1) + '/' + previousDate.getFullYear();
                viewOptions.aggregateSpan["monthLabel"] = label;
            } else if (expression == "fy") {
                previousDate = Moment.utc(filter.$gte).toDate();
                viewOptions.parameters[expression]
                var label = previousDate.getDate() + '/' + (previousDate.getMonth() + 1) + '/' + previousDate.getFullYear();
                viewOptions.aggregateSpan["fyLabel"] = label;
            } else if (expression == "quarter") {
                previousDate = Moment.utc(filter.$gte).toDate();
                var label = previousDate.getDate() + '/' + (previousDate.getMonth() + 1) + '/' + previousDate.getFullYear();
                viewOptions.aggregateSpan["quarterLabel"] = label;
            }
            viewOptions.parameters[expression] = previousDate; // the date filters are passed in the viewoptions.parameters for type as_on
        }
        var date = viewOptions.date;
        parameters[date] = {$lte: previousDate};
    } else if (aggregateType === "due") {
        if (previous) {
            var previousDate = undefined;
            if (expression == "month") {
                previousDate = Moment.utc(currentDate).subtract("month", 1).toDate();
            } else if (expression == "fy") {
                previousDate = Moment.utc(currentDate).subtract("year", 1).toDate();
            } else if (expression == "quarter") {
                previousDate = Moment.utc(currentDate).subtract("months", 3).toDate();
            }
        } else {
            previousDate = currentDate;
            viewOptions.parameters[expression] = currentDate; // the date filters are passed in the viewoptions.parameters for type due
        }
        var dueDate = viewOptions.dueDate;
        var receiveDate = viewOptions.receiveDate;
        parameters[dueDate] = {$lte: previousDate};
        var orFilter = [];
        var newFilter = {};
        newFilter[receiveDate] = null;
        orFilter.push(newFilter);
        var newFilter1 = {};
        newFilter1[receiveDate] = {$gt: previousDate};
        orFilter.push(newFilter1);
        query.$filter["$or"] = orFilter;

        var label = currentDate.getDate() + '/' + (currentDate.getMonth() + 1) + '/' + currentDate.getFullYear()
        viewOptions.aggregateSpan["monthLabel"] = label;
        viewOptions.aggregateSpan["fyLabel"] = label;
        viewOptions.aggregateSpan["quarterLabel"] = label;
    } else if (aggregateType === "forecast") {
        var date = viewOptions.date;
        if (previous) {
            if (expression === "month") {
                parameters[date] = {
                    $gte: getFirstDateOfNextMonth(new Date()),
                    $lt: getLastDateOfNextMonth(new Date())
                };
            } else if (expression === "fy") {
                parameters[date] = getNextFy(filter);
            } else if (expression === "quarter") {
                var nextQuarter = getNextQuarter(filter);
                parameters[date] = {
                    $gte: nextQuarter.$gte,
                    $lt: nextQuarter.$lt
                };
            }
        } else {
            if (expression === "month") {
                var forecastFilter = {
                    $gte: currentDate,
                    $lt: getLastDateOfMonth(currentDate)
                }
                parameters[date] = forecastFilter
                viewOptions.parameters[expression] = forecastFilter;
            } else if (expression === "fy") {
                var forecastFilter = {
                    $gte: currentDate,
                    $lt: filter.$lt
                }
                parameters[date] = forecastFilter;
                viewOptions.parameters[expression] = forecastFilter;
            } else if (expression === "quarter") {
                var forecastFilter = {
                    $gte: currentDate,
                    $lt: filter.$lt
                };
                parameters[date] = forecastFilter;
                viewOptions.parameters[expression] = forecastFilter;
            }
        }
    }
    if (aggregateType === "range" || aggregateType === "forecast") {
        if (expression == "fy") {
            viewOptions.aggregateSpan["fyLabel"] = params.session;
        } else if (expression == "month") {
            viewOptions.aggregateSpan["monthLabel"] = Moment(currentDate).format("MMM-YYYY");
        } else if (expression == "quarter") {
            viewOptions.aggregateSpan["quarterLabel"] = Moment(filter.$gte).format("MMM") + "-" + Moment(filter.$lt).subtract("days", 1).format("MMM") + " " + Moment(filter.$lt).subtract("days", 1).format("YYYY");
        }
    }
}


function getFirstDateOfMonth(date) {
    var y = date.getFullYear();
    var m = date.getMonth();
    var firstDate = new Date(y, m, 1);
    firstDate.setHours(00, 00, 00, 0);
    return Utils.setDateWithZeroTimezone(firstDate);
}

function getLastDateOfMonth(date) {
    return Moment.utc(date).endOf("month").add('days', 1).startOf('day').toDate();
}


function getFirstDateOfNextMonth(date) {
    return Moment.utc(date).add("months", 1).startOf("month").startOf('day').toDate();
}

function getLastDateOfNextMonth(date) {
    return Moment.utc(date).add("months", 1).endOf("month").add('days', 1).startOf('day').toDate();
}

function getNextFy(filter) {
    return {
        $gte: Moment(filter.$gte).add("year", 1).toDate(),
        $lt: Moment(filter.$lt).add("year", 1).toDate()
    };
}


function populateGroup(group, expression, label, pField) {
    if (expression) {
        var dotIndex = expression.indexOf(".");
        if (dotIndex >= 0) {
            var firstPart = expression.substring(0, dotIndex);
            var restPart = expression.substring(dotIndex + 1);
            populateGroup(group, restPart, firstPart, firstPart);
        } else {
            var plabel = label ? label + "_" + expression : expression;
            var gField = pField ? pField + "." + expression : expression;
            group[plabel] = {"$sum": "$" + gField};
        }
    }
}
