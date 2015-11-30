var monthNames = [ "january", "february", "march", "april", "may", "june",
    "july", "august", "september", "october", "november", "december" ];
var monthNameLabels = [ "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
    "JUL", "AUG", "SEP", "OCT", "NOV", "DEC" ];
var Utils = require("ApplaneCore/apputil/util.js");

exports.populateSpanWiseQuery = function (spanreport, batchQueries, requiredView, runOnES) {
    if (typeof spanreport === "string") {
        spanreport = JSON.parse(spanreport);
    }
    if (spanreport.span !== "month") {
        throw new Error("span must be equal to month");
    }
    var dateField = spanreport.date;
    if (batchQueries && batchQueries.data) {
        var parameters = batchQueries.data.$parameters;
        if (parameters && parameters[dateField]) {
            var pValue = parameters[dateField] || {};
            var fromDate = new Date(pValue.$gte);
            var toDate = new Date(pValue.$lt);
            var include = false;
            if (toDate > new Date()) {
                toDate = new Date();
                include = true;
            }
            if (fromDate && toDate) {
                var months = getSpanMonths(fromDate, toDate, include);
                requiredView.spanMonths = months;
                requiredView.spanreport = spanreport;
                var dateFilters = createDatefilter(months);
                populateSpanColumns(months, requiredView, spanreport, dateFilters);
                requiredView.viewOptions.reloadViewOnFilterChange = true;
                return populateBatchQueries(batchQueries, spanreport, dateFilters, months, runOnES);
            }
        }
    }
}


function populateSpanColumns(months, requiredView, spanreport, dateFilters) {
    var fields = requiredView.viewOptions && requiredView.viewOptions.fields ? requiredView.viewOptions.fields : [];
    var spanFields = spanreport.value || [];
    if (Utils.isJSONObject(spanFields)) {
        spanFields = [spanFields];
    }
    for (var i = 0; i < months.length; i++) {
        var fieldExp = months[i].month + "" + months[i].year;
        var labelExp = months[i].label + "-" + months[i].year;
        for (var j = 0; j < spanFields.length; j++) {
            var monthField = {field: fieldExp, label: fieldExp.toUpperCase(), type: "object"};
            var innerFields = [];
            var index = 10000 + (i * 5);
            var fieldInfo = Utils.getField(spanFields[j].field, fields);
            if (fieldInfo) {
                var label = spanFields.length === 1 ? labelExp.toUpperCase() : labelExp.toUpperCase() + "(" + spanFields[j].label + ")";
                var cloneField = Utils.deepClone(fieldInfo);
                delete cloneField.indexGrid;
                cloneField.label = label;
                cloneField.index = index + 1;
                cloneField.visibility = true;
                cloneField.visibilityGrid = true;
                if (cloneField.referredView) {
                    if (!Utils.isJSONObject(cloneField.referredView)) {
                        cloneField.referredView = JSON.parse(cloneField.referredView);
                    }
                    var referredViewParameters = cloneField.referredView.parameters || {};
                    for (var key in referredViewParameters) {
                        if (referredViewParameters[key] === "$__selectedSpanFilter") {
                            referredViewParameters[key] = dateFilters[i];
                            cloneField.referredView.parameters = referredViewParameters;
                            cloneField.referredView = JSON.stringify(cloneField.referredView);
                            break;
                        }
                    }
                }
                innerFields.push(cloneField);
                if (i !== 0) {
                    var percentageField = {field: fieldInfo.field + "__percentage", label: "%", index: index + 2, visibilityGrid: true, type: "number", ui: "number", width: "35px", toFixed: 0};
                    if (cloneField.aggregate) {
                        percentageField.aggregate = cloneField.aggregate;
                    }
                    if (cloneField.parentfieldid) {
                        percentageField.parentfieldid = cloneField.parentfieldid;
                    }
                    innerFields.push(percentageField);
                }
                fieldInfo.visibility = false;
                fieldInfo.visibilityGrid = false;
                var dotIndex = spanFields[j].field.indexOf(".");
                if (dotIndex >= 0) {
                    var firstPart = spanFields[j].field.substring(0, dotIndex);
                    var parentFieldInfo = Utils.getField(firstPart, fields);
                    var parentFieldInfoClone = Utils.deepClone(parentFieldInfo);
                    parentFieldInfoClone.fields = innerFields;
                    monthField.fields = [parentFieldInfoClone];
                    fields.push(monthField);
                } else {
                    monthField.fields = innerFields;
                    fields.push(monthField);
                }
            }
        }
    }
    if (spanreport.ytd) {
        for (var j = 0; j < spanFields.length; j++) {
            var fieldInfo = Utils.getField(spanFields[j].field, fields);
            var ytdField = {field: "ytdData", type: "object"};
            if (fieldInfo) {
                var cloneField = Utils.deepClone(fieldInfo);
                cloneField.label = "Total";
                cloneField.index = 1000000;
                cloneField.indexGrid = 1000000;
                cloneField.visibility = true;
                cloneField.visibilityGrid = true;
                var dotIndex = spanFields[j].field.indexOf(".");
                if (dotIndex >= 0) {
                    var firstPart = spanFields[j].field.substring(0, dotIndex);
                    var parentFieldInfo = Utils.deepClone(Utils.getField(firstPart, fields));
                    parentFieldInfo.fields = [cloneField];
                    ytdField.fields = [parentFieldInfo];
                    fields.push(ytdField);
                } else {
                    ytdField.fields = [cloneField];
                    fields.push(ytdField);
                }
            }
        }
    }

}


function populateBatchQueries(batchQueries, spanreport, dateFilters, months, runOnES) {
    var queryAliases = [];
    queryAliases.push({alias: "data"});
    for (var i = 0; i < months.length; i++) {
        queryAliases.push({alias: months[i].month + "" + months[i].year});
    }
    var dateField = spanreport.date;
    if (runOnES) {
        batchQueries.data.$similarqueries = {"date": dateField, queries: queryAliases};
    }

    var newBatchQueries = {};
    var clone = Utils.deepClone(batchQueries);
    newBatchQueries.data = clone.data;
    if (clone.aggregateData && clone.aggregateData.$query) {
        newBatchQueries.aggregateData = clone.aggregateData;
        newBatchQueries.aggregateData.$parent = "data";
    }
    for (var i = 0; i < dateFilters.length; i++) {
        var monthExp = months[i].month + "" + months[i].year;
        populateQuery(batchQueries, monthExp, dateFilters[i], dateField, newBatchQueries);
    }
    if (spanreport.ytd) {
        newBatchQueries.ytdData = {$expression: "data", $operator: "="};
        if (batchQueries.aggregateData && batchQueries.aggregateData.$query) {
            newBatchQueries.ytdAggregate = {$expression: "aggregateData", $operator: "="};
        }
    }
    return newBatchQueries;
}

function populateQuery(batchQueries, alias, dateFilter, dateField, newBatchQueries) {
    var queryClone = Utils.deepClone(batchQueries);
    queryClone.data.$parameters[dateField] = dateFilter;
    newBatchQueries[alias] = queryClone.data;
    if (queryClone.aggregateData && queryClone.aggregateData.$query) {
        queryClone.aggregateData.$query.$parameters[dateField] = dateFilter;
        queryClone.aggregateData.$parent = alias;
        newBatchQueries[alias + "Aggregate"] = queryClone.aggregateData;
    }
}


function createDatefilter(months) {
    var Moment = require("moment");
    var dateFilters = [];
    for (var i = 0; i < months.length; i++) {
        var date = new Date("2014-01-10");
        date.setMonth(monthNames.indexOf(months[i].month));
        date.setYear(months[i].year);
        var Functions = require("ApplaneDB/lib/Functions.js");
        var dateFilter = Functions.CurrentMonthFilter({date: date});
        dateFilters.push(dateFilter);
    }
    return dateFilters;
}


function getSpanMonths(fromDate, toDate, include) {
    var years = [];
    var months = [];
    var fromYear = fromDate.getFullYear();
    var toYear = toDate.getFullYear();
    if ((toYear - fromYear) > 1) {
        for (i = fromYear + 1; i < toYear; i++) {
            years.push(i);
        }
        getMonths(fromDate, getLastDayOfYear(fromDate), months, fromDate.getFullYear(), include);
        if (years.length > 0) {
            for (var i = 0; i < years.length; i++) {
                populateMonthsofYear(months, years[i]);
            }
        }
        getMonths(getFirstDayOfYear(toDate), toDate, months, toDate.getFullYear(), include);
    } else if ((toYear - fromYear) == 1) {
        getMonths(fromDate, getLastDayOfYear(fromDate), months, fromDate.getFullYear(), include);
        getMonths(getFirstDayOfYear(toDate), toDate, months, toDate.getFullYear(), include);
    } else {
        getMonths(fromDate, toDate, months, fromDate.getFullYear(), include);
    }

    return months;

    function populateMonthsofYear(months, year) {
        for (var i = 0; i < 12; i++) {
            months.push({month: monthNames[i], year: year, label: monthNameLabels[i]});
        }
    }

    function getMonths(fromDate, toDate, months, year, include) {
        var fromMonth = fromDate.getMonth();
        var toMonth = toDate.getMonth();
        if ((toMonth - fromMonth) >= 1) {
            var lastDay = getLastDayOfMonth(toDate);
            if (fromDate.getDate() == 1 && toDate.getDate() == lastDay) {
                for (i = fromMonth; i <= toMonth; i++) {
                    months.push({month: monthNames[i], year: year, label: monthNameLabels[i]});
                }
            } else if (fromDate.getDate() == 1 && toDate.getDate() != lastDay) {
                for (i = fromMonth; i < toMonth; i++) {
                    months.push({month: monthNames[i], year: year, label: monthNameLabels[i]});
                }
                if (include) {
                    months.push({month: monthNames[toMonth], year: year, label: monthNameLabels[toMonth]});
                }
            } else if (fromDate.getDate() != 1 && toDate.getDate() == lastDay) {
                for (i = fromMonth + 1; i <= toMonth; i++) {
                    months.push({month: monthNames[i], year: year, label: monthNameLabels[i]});
                }
            } else {
                for (i = fromMonth + 1; i < toMonth; i++) {
                    months.push({month: monthNames[i], year: year, label: monthNameLabels[i]});
                }
            }
        } else if ((toDate.getTime() - fromDate.getTime()) > 1) {
            months.push({month: monthNames[toMonth], year: year, label: monthNameLabels[toMonth]});
        }
    }

    function getLastDayOfYear(date) {
        var y = date.getFullYear();
        var lastDay = new Date(y, 11 + 1, 0);
        lastDay.setHours(00, 00, 00, 0);
        return Utils.setDateWithZeroTimezone(lastDay);
    }

    function getFirstDayOfYear(date) {
        var y = date.getFullYear();
        var firstDay = new Date(y, 0, 1);
        firstDay.setHours(00, 00, 00, 0);
        return Utils.setDateWithZeroTimezone(firstDay);
    }


    function getFirstDayOfMonth(date) {
        var y = date.getFullYear();
        var m = date.getMonth();
        var firstDate = new Date(y, m, 1);
        return firstDate.getDate();
    }

    function getLastDayOfMonth(date) {
        var y = date.getFullYear();
        var m = date.getMonth();
        var lastDate = new Date(y, m + 1, 0);
        return lastDate.getDate();
    }
}


function getRequiredFields(fields) {
    var requiredFields = [];
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.type === "string" || field.type === "fk") {
            requiredFields.push(field);
        }
    }
    return requiredFields;
}

function mergeComparisonAggregateData(currentAggregateData, previousAggregateData, fieldName, span) {
    for (var key in previousAggregateData) {
        currentAggregateData[fieldName + "_" + key] = previousAggregateData[key];
    }
}

exports.mergeComparisonResult = function (requiredView) {
    var viewOptions = requiredView.viewOptions;
    var requiredFields = getRequiredFields(viewOptions.fields || []);
    var fields = viewOptions.fields || [];
    var spanreport = requiredView.spanreport || {};
    var spanFields = spanreport.value || [];
    if (Utils.isJSONObject(spanFields)) {
        spanFields = [spanFields];
    }
    if (requiredView.spanMonths && requiredView.spanMonths.length > 0) {
        var view = require("./view.js");
        for (var i = 0; i < requiredView.spanMonths.length; i++) {
            var spanMonth = requiredView.spanMonths[i];
            var spanMonthExp = spanMonth.month + "" + spanMonth.year;
            view.processDataForView(requiredView[spanMonthExp].result, requiredView.viewOptions);
            mergeComparisonData(requiredView.data && requiredView.data.result ? requiredView.data.result : [], requiredView[spanMonthExp] && requiredView[spanMonthExp].result ? requiredView[spanMonthExp].result : [], requiredFields, spanMonthExp, spanFields);
            mergeComparisonAggregateData(requiredView.data ? requiredView.data.aggregateResult : {}, requiredView[spanMonthExp] ? requiredView[spanMonthExp].aggregateResult : {}, spanMonthExp);
        }
        if (requiredView.ytdData) {
            mergeComparisonData(requiredView.data && requiredView.data.result ? requiredView.data.result : [], requiredView.ytdData && requiredView.ytdData.result ? requiredView.ytdData.result : [], requiredFields, "ytdData", spanFields);
            mergeComparisonAggregateData(requiredView.data ? requiredView.data.aggregateResult : {}, requiredView.ytdData ? requiredView.ytdData.aggregateResult : {}, "ytdData");
        }
        // populate percentage
        var spanreport = requiredView.spanreport || {};
        var spanFields = spanreport.value;
        if (Utils.isJSONObject(spanFields)) {
            spanFields = [spanFields];
        }
        for (var k = 0; k < spanFields.length; k++) {
            var fieldInfo = Utils.getField(spanFields[k].field, fields);
            if (fieldInfo) {
                for (var i = 0; i < requiredView.spanMonths.length - 1; i++) {
                    var spanMonth = requiredView.spanMonths[i + 1];
                    var spanMonthExp = spanMonth.month + "" + spanMonth.year;
                    var previousSpanMonth = requiredView.spanMonths[i];
                    var previousSpanMonthExp = previousSpanMonth.month + "" + previousSpanMonth.year;
                    var data = requiredView.data || {};
                    populatePercentageComparison(data, fieldInfo, spanFields[k].field, spanMonthExp, previousSpanMonthExp);
                }
            }
        }
        removeExtraData(requiredView);
    }
}

function removeExtraData(requiredView) {
    if (requiredView.spanreport && requiredView.spanreport.ytd) {
        delete requiredView.ytdData;
    }
    if (requiredView.spanMonths) {
        for (var i = 0; i < requiredView.spanMonths.length; i++) {
            var spanMonth = requiredView.spanMonths[i];
            var spanMonthExp = spanMonth.month + "" + spanMonth.year;
            delete requiredView[spanMonthExp];
        }
        delete requiredView.spanreport
        delete requiredView.spanMonths;
    }
}

function populatePercentageComparison(data, field, spanField, currentSpanExp, previousSpanExp) {
    var expression = spanField;
    populatePercentageData(data && data.result ? data.result : [], expression, field.ui, currentSpanExp, previousSpanExp);
    if (spanField.indexOf(".") >= 0) {
        expression = spanField.replace(".", "_");
    }
    populatePercentateAggregateData(data, expression, field.ui, currentSpanExp, previousSpanExp);

    function populatePercentageData(dataResult, expression, ui, currentFieldName, previousFieldName) {
        for (var j = 0; j < dataResult.length; j++) {
            populatePercentage(dataResult[j], expression, ui, currentFieldName, previousFieldName);
            if (dataResult[j].children) {
                populatePercentageData(dataResult[j].children, expression, ui, currentFieldName, previousFieldName);
            }
        }
    }

    function populatePercentateAggregateData(data, expression, ui, currentFieldName, previousFieldName) {
        var aggregateResult = data.aggregateResult || {};
        populateAggregatePercentage(aggregateResult, expression, ui, currentFieldName, previousFieldName);
    }

    function populateAggregatePercentage(aggregateResult, expression, ui, currentFieldName, previousFieldName) {
        var value = aggregateResult[currentFieldName + "_" + expression];
        var pastValue = aggregateResult[previousFieldName + "_" + expression];
        var percentage = getPercentage(value, pastValue, ui);
        if (percentage !== undefined) {
            aggregateResult[currentFieldName + "_" + expression + "__percentage"] = percentage;
        }
    }

    function populatePercentage(result, expression, ui, currentSpanExp, previousSpanExp) {
        var value = result[currentSpanExp] ? Utils.resolveDottedValue(result[currentSpanExp], expression) : undefined;
        var pastValue = result[previousSpanExp] ? Utils.resolveDottedValue(result[previousSpanExp], expression) : undefined;
        var percentage = getPercentage(value, pastValue, ui);
        if (percentage !== undefined) {
            result[currentSpanExp] = result[currentSpanExp] || {}
            Utils.putDottedValue(result[currentSpanExp], expression + "__percentage", percentage);
        }
    }

    function getPercentage(value, pastValue, ui) {
        var percentage = undefined;
        if (ui === "currency") {
            var currentAmount = value ? value.amount : 0;
            if (pastValue) {
                var pastAmount = pastValue ? pastValue.amount : 0;
                percentage = calculatePercentage(currentAmount, pastAmount);
            }
        } else if (ui === "number") {
            var currentNumber = value || 0;
            if (pastValue) {
                var pastNumber = pastValue || 0;
                percentage = calculatePercentage(currentNumber, pastNumber);
            }
        } else if (ui === "duration") {
            var currentTime = value ? value.time : 0;
            if (pastValue) {
                var pastTime = pastValue ? pastValue.time : 0;
                percentage = calculatePercentage(currentTime, pastTime);
            }
        }
        return percentage;
    }

    function calculatePercentage(current, past) {
        if (past === 0) {
            return;
        }
        return (((current - past ) / Math.abs(past)) * 100);
    }
}


function mergeComparisonData(currentdata, previousData, requiredFields, fieldName, spanFields) {
    for (var i = 0; i < previousData.length; i++) {
        var previousRow = previousData[i];
        if (!previousRow._id) {
            throw new Error("_id must be provided to merge result");
        }
        var index = Utils.isExists(currentdata, previousRow, "_id");
        if (index >= 0) {
            currentdata[index][fieldName] = {};
            for (var j = 0; j < spanFields.length; j++) {
                var spanField = spanFields[j].field;
                var dotIndex = spanField.indexOf(".");
                if (dotIndex !== -1) {
                    spanField = spanField.substring(0, dotIndex);
                }
                currentdata[index][fieldName][spanField] = previousRow[spanField];
            }
            if (previousRow.children) {
                mergeComparisonData(currentdata[index].children, previousRow.children, requiredFields, fieldName, spanFields);
            }
        } else {
            currentdata = currentdata || [];
            var newRow = {};
            for (var j = 0; j < requiredFields.length; j++) {
                var field = requiredFields[j];
                newRow[field.field] = previousRow[field.field];
                newRow["_id"] = previousRow[field.field]._id;
            }
            newRow[fieldName] = previousRow;
            currentdata.push(newRow);
        }
    }
}

