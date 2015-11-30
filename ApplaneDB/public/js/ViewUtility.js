(function (definition) {

    // Montage Require
    if (typeof bootstrap === "function") {
        bootstrap("promise", definition);

        // CommonJS
    } else if (typeof exports === "object") {
        module.exports = definition();

        // RequireJS
    } else if (typeof define === "function" && define.amd) {
        define(definition);

        // SES (Secure EcmaScript)
    } else if (typeof ses !== "undefined") {
        if (!ses.ok()) {
            return;
        } else {
            ses.makeQ = definition;
        }

        // <script>
    } else {
        ViewUtility = definition();
    }

})(function () {
    "use strict";
    var Q = require("q");
    var Utils = require("ApplaneCore/apputil/util.js");

    function ViewUtility(value) {

    }

    ViewUtility.populateSortInGroup = function (queryGroupInfo, aggregateColumn) {
        if (queryGroupInfo.$sort === undefined && aggregateColumn.sortable) {
            var type = aggregateColumn.ui || aggregateColumn.type;
            if (type === "number") {
                queryGroupInfo.$sort = {};
                queryGroupInfo.$sort[aggregateColumn.field] = -1;
            } else if (type === "currency") {
                queryGroupInfo.$sort = {};
                queryGroupInfo.$sort[aggregateColumn.field + ".amount"] = -1;
            } else if (type === "duration") {
                queryGroupInfo.$sort = {};
                queryGroupInfo.$sort[aggregateColumn.field + ".time"] = -1;
            }
        }
    }

    ViewUtility.processDataForView = function (data, query, metadata) {
        if (!data || data.length === 0 || !metadata) {
            return;
        }
        var alias = query && query.$recursion && query.$recursion.$alias ? query.$recursion.$alias : "children";
        if (query && query.$group && query.$group.$recursion && query.$group.$recursion.$childrenAsRow) {
            var groupLength = 1;
            if (Array.isArray(query.$group._id)) {
                groupLength = query.$group._id.length;
            }
            iterateGroupData(metadata, data, query.$group, "children", 0, groupLength);
        } else if (query && query.$recursion && query.$recursion.$childrenAsRow) {
            populatePrimaryColumnDisplayField(query.$recursion, metadata);
            resolveRecursiveData(metadata, data, query.$recursion, alias, true);
        }
        var transform = metadata.transform;   //for sales report
        if (transform && typeof transform === "string") {
            transform = JSON.parse(transform);
        }
        if (transform && Object.keys(transform).length > 0) {
            transformData(data, transform, alias);
        }
    }

    function iterateGroupData(metadata, data, groupInfo, groupAlias, groupLevel, groupLength) {
        if (!data || data.length == 0) {
            return;
        }
        for (var i = 0; i < data.length; i++) {
            var dataRecord = data[i];
            dataRecord.__groupLevel = groupLevel;
            dataRecord.__depth = groupLevel;
            if (groupLength > 1) {
                if (dataRecord[groupAlias]) {
                    iterateGroupData(metadata, dataRecord[groupAlias], groupInfo, groupAlias, groupLevel + 1, groupLength - 1)
                }
            } else {
                populatePrimaryColumnDisplayField(groupInfo.$recursion, metadata);
                resolveRecursiveData(metadata, data, groupInfo.$recursion, groupInfo.$recursion.$alias, true);
                var fieldsToMatch = [];
                if (groupInfo.$recursion.$rollup && groupInfo.$recursion.$rollup.length > 0) {
                    for (var j = 0; j < groupInfo.$recursion.$rollup.length; j++) {
                        var rollUpValue = groupInfo.$recursion.$rollup[i];
                        if (typeof rollUpValue === "string") {
                            fieldsToMatch.push(rollUpValue);
                        } else if (Utils.isJSONObject(rollUpValue)) {
                            fieldsToMatch.push(Object.keys(rollUpValue)[0]);
                        }
                    }
                } else {
                    fieldsToMatch.push(groupAlias);
                }
                convertRecursiveAliasToGroupAlias(data, groupInfo.$recursion, fieldsToMatch, groupAlias, groupLevel, groupLevel);
            }
        }
    }

    function isValueExists(data, fields) {
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            if (Utils.resolveValue(data, field)) {
                return true;
            }
        }
    }

    function convertRecursiveAliasToGroupAlias(data, recursion, fieldsToMatch, groupAlias, groupLevel, depth) {
        if (data && data.length > 0) {
            var recursionAlias = recursion.$alias;
            for (var i = (data.length - 1); i >= 0; i--) {
                if (data[i].__recursiveParent && !isValueExists(data[i], fieldsToMatch)) {
                    data.splice(i, 1);
                }
                if (data[i][recursionAlias]) {
                    var recursionAliasData = data[i][recursionAlias];
                    data[i][recursionAlias] = undefined;
                    if (recursionAliasData.length > 0) {
                        data[i][groupAlias] = recursionAliasData;
                        convertRecursiveAliasToGroupAlias(data[i][groupAlias], recursion, fieldsToMatch, groupAlias, groupLevel, depth + 1)
                    }
                }
                if (data[i][groupAlias]) {
                    data[i].__groupLevel = groupLevel;
                    data[i].__depth = depth;
                }
            }
        }
    }

    function resolveRecursiveData(metadata, data, queryRecursion, alias, isRoot) {
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            if (row[alias] && row[alias].length > 0 && !row.processed) {
                resolveRecursiveData(metadata, row[alias], queryRecursion, alias, false);
                var childRow = Utils.deepClone(row);
                childRow.__children = true;
                childRow.__self_id = childRow._id;
                childRow._id = childRow._id + "_children";
                childRow.processed = true;
                handleRollupData(childRow, queryRecursion, false);

                row[alias] = undefined;
                if (queryRecursion.$primaryColumn && queryRecursion.$childrenAlias) {
                    var separator = " ";
                    if (queryRecursion.$selfAsChildren) {
                        separator = " & ";
                    }
                    var primaryColumn = queryRecursion.$primaryColumn + ( metadata.recursionPrimaryColumnDisplayField ? "." + metadata.recursionPrimaryColumnDisplayField : "");
                    var resolvedValue = Utils.resolveDottedValue(childRow, primaryColumn) + separator + queryRecursion.$childrenAlias;
                    Utils.putDottedValue(childRow, primaryColumn, resolvedValue);
                }
                if (queryRecursion.$selfAsChildren) {
                    var toPut = Utils.deepClone(row);
                    toPut.__recursiveParent = true;
                    childRow[alias].splice(0, 0, toPut);
                    data[i] = childRow;
                } else {
                    data.splice(i + 1, 0, childRow);
                }
            }
        }
        if (isRoot && queryRecursion) {
            if ((queryRecursion.$expandChildren == 1) && data && (data.length == 1) && data[0][alias] && data[0][alias].length > 0) {
                for (var i = 0; i < data[0][alias].length; i++) {
                    data.push(data[0][alias][i]);
                }
                data.splice(0, 1);
            }
            if (queryRecursion.$rollup && queryRecursion.$rollup.length > 0) {
                manageRollUpData(data, alias, queryRecursion);
            }
        }
    }

    function populatePrimaryColumnDisplayField(queryRecursion, metadata) {
        if (!queryRecursion.$primaryColumn) {
            return;
        }
        var fieldDef = Utils.getField(queryRecursion.$primaryColumn, metadata.fields);
        if (fieldDef && fieldDef.type === "fk" && fieldDef.displayField) {
            metadata.recursionPrimaryColumnDisplayField = fieldDef.displayField;
        }
    }

    function manageRollUpData(data, alias, queryRecursion) {
        if (!data || data.length === 0) {
            return;
        }
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            manageRollUpData(row[alias], alias, queryRecursion);
            if (queryRecursion.$removeRollupHierarchy) {
                handleRollupData(row, queryRecursion, true);
            }
        }
    }

    function handleRollupData(row, queryRecursion, removeHierarchy) {
        var rollUp = queryRecursion.$rollup;
        if (rollUp && rollUp.length > 0) {
            for (var j = 0; j < rollUp.length; j++) {
                var rollUpField = rollUp[j];
                if (Utils.isJSONObject(rollUpField)) {
                    rollUpField = Object.keys(rollUpField)[0];
                }
                resolveRollUpData(row, rollUpField, queryRecursion, removeHierarchy);
            }
        }
    }

    function resolveRollUpData(childRow, rollUpField, queryRecursion, removeHierarchy) {
        var indexOf = rollUpField.indexOf(".");
        if (indexOf !== -1) {
            var firstPart = rollUpField.substring(0, indexOf);
            var nextPart = rollUpField.substring(indexOf + 1);
            var fieldValue = childRow[firstPart];
            if (fieldValue) {
                if (Array.isArray(fieldValue)) {
                    for (var i = 0; i < fieldValue.length; i++) {
                        resolveRollUpData(fieldValue[i], nextPart, queryRecursion, removeHierarchy);
                    }
                } else if (Utils.isJSONObject(fieldValue)) {
                    resolveRollUpData(fieldValue, nextPart, queryRecursion, removeHierarchy);
                }
            }
        } else {
            if (removeHierarchy) {
                var rollupHierarchyField = queryRecursion.$rollupHierarchyField || "self";
                Utils.putDottedValue(childRow, rollUpField, Utils.resolveDottedValue(childRow, rollUpField + "." + rollupHierarchyField));
            } else {
                var rollUpSelf = rollUpField + ".self";
                var rollUpChildren = rollUpField + (queryRecursion.$selfAsChildren ? ".total" : ".children");
                Utils.putDottedValue(childRow, rollUpSelf, Utils.resolveDottedValue(childRow, rollUpChildren));
            }
        }
    }

    function transformData(data, transform, alias) {
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            for (var key in transform) {
                var transformValue = transform[key];
                var transformProperty = Object.keys(transformValue)[0];
                var fieldToPut = transformValue[transformProperty];
                fieldToPut = fieldToPut.substring(1);
                if (transformProperty === "row-column") {
                    transformDataRowToColumnWise(row, key, fieldToPut);
                }

            }
            if (row[alias] && row[alias].length > 0) {
                transformData(row[alias], transform, alias);
            }
        }
    }

    function transformDataRowToColumnWise(row, field, fieldToPut) {
        var indexOf = field.indexOf(".");
        if (indexOf !== -1) {
            var firstPart = field.substring(indexOf);
            var nextPart = field.substring(indexOf + 1);
            var fieldValue = row[firstPart];
            if (fieldValue) {
                if (Array.isArray(fieldValue)) {
                    for (var i = 0; i < fieldValue.length; i++) {
                        transformDataRowToColumnWise(fieldValue[i], nextPart, fieldToPut);
                    }
                } else if (Utils.isJSONObject(fieldValue)) {
                    transformDataRowToColumnWise(fieldValue, nextPart, fieldToPut);
                }
            }
        } else {
            var transformFieldData = row[field];
            if (transformFieldData && Array.isArray(transformFieldData)) {
                row[field] = {};
                for (var k = 0; k < transformFieldData.length; k++) {
                    var fieldToPutValue = transformFieldData[k][fieldToPut];
                    if (fieldToPutValue) {
                        fieldToPutValue = fieldToPutValue.toString();
                        fieldToPutValue = Utils.removeSpecialChar(fieldToPutValue);
                        row[field][fieldToPutValue] = transformFieldData[k];
                    }
                }
            }
        }
    }

    ViewUtility.populateDataInViewOptionsForAggregateView = function (result, requiredView, server) {
        requiredView.viewOptions.data = "data.result";
        requiredView.viewOptions.dataInfo = "data.dataInfo";
        var viewOptions = requiredView.viewOptions;
        var valueColumn = viewOptions.value;
        var valueui = viewOptions.valueui;
        var comparison = viewOptions.aggregateSpan.comparison;
        var viewId = viewOptions.requestView.alias || viewOptions.requestView.id;
        var newResult = [];
        if (viewOptions.groupColumns && viewOptions.groupColumns.length > 0) {
            // if groupColumns are defined then there can be multiple rows based on the groupby result.
            // we merge the data in different quries on the basis of _id in group by query and then handle it one by one like a non group by aggregate view.
            newResult = handleGroupInAggregates(result, viewOptions);
        } else {
            var properties = ["fy", "past__fy", "month", "past__month", "quarter", "past__quarter"];
            var newRow = {};
            for (var i = 0; i < properties.length; i++) {
                var property = properties[i];
                if (result && result[viewId + "__" + property] && result[viewId + "__" + property ].result && result[viewId + "__" + property ].result.length > 0) {
                    newRow[viewId + "__" + property ] = result[viewId + "__" + property ].result[0];
                }
            }
            newResult.push(newRow);
        }
        var finalData = [];
        for (var i = 0; i < newResult.length; i++) {
            var row = newResult[i];
            finalData.push(populateAggregateResult(viewOptions, row));
        }
        if (requiredView.data && requiredView.data.result) {
            if (server) {
                requiredView.data = {result: finalData, dataInfo: {hasNext: false}};
            } else {
                requiredView.data.result.splice(0, (requiredView.data.result.length));
                for (var i = 0; i < finalData.length; i++) {
                    requiredView.data.result.push(finalData[i]);
                }
                requiredView.data.dataInfo = {hasNext: false};
            }
        }
    }

    ViewUtility.populateDataInViewOptions = function (result, requiredView, server) {
        requiredView.viewOptions.data = "data.result";
        requiredView.viewOptions.dataInfo = "data.dataInfo";
        if (requiredView.data && requiredView.data.result && result && result.data && result.data.result && (Array.isArray(result.data.result)) && !server) {
            //at server no need to keep same reference

            requiredView.data.result.splice(0, (requiredView.data.result.length));
            if (result && result.data && result.data.result) {
                for (var i = 0; i < result.data.result.length; i++) {
                    requiredView.data.result.push(result.data.result[i]);
                }
            }
            if (result && result.data && result.data.dataInfo) {
                requiredView.data["dataInfo"] = result.data.dataInfo;
            }

        } else {
            requiredView.data = result.data;
        }
        if (result.aggregateData) {
            if (result.aggregateData.result && result.aggregateData.result.length > 0) {
                requiredView.data.aggregateResult = result.aggregateData.result[0];
                requiredView.viewOptions.aggregateData = "data.aggregateResult";
            } else {
                requiredView.aggregateResult = {__count: 0};
                requiredView.viewOptions.aggregateData = "data.aggregateResult";
            }
        }
        if (requiredView.spanMonths) {
            for (var i = 0; i < requiredView.spanMonths.length; i++) {
                var spanMonth = requiredView.spanMonths[i];
                var spanMonthExp = spanMonth.month + "" + spanMonth.year;
                requiredView[spanMonthExp] = result[spanMonthExp];
                if (result[spanMonthExp + "Aggregate"]) {
                    if (result[spanMonthExp + "Aggregate"].result && result[spanMonthExp + "Aggregate"].result.length > 0) {
                        requiredView[spanMonthExp].aggregateResult = result[spanMonthExp + "Aggregate"].result[0];
                    }
                }
            }
        }
        if (requiredView.spanreport && requiredView.spanreport.ytd) {
            requiredView.ytdData = result.ytdData;
            if (result.ytdAggregate) {
                if (result.ytdAggregate.result && result.ytdAggregate.result.length > 0) {
                    requiredView.ytdData.aggregateResult = result.ytdAggregate.result[0];
                }
            }
        }

    }

    function populateAggregateResult(viewOptions, row) {
        var valueColumn = viewOptions.value;
        var valueui = viewOptions.valueui;
        var comparison = viewOptions.aggregateSpan.comparison;
        var viewId = viewOptions.requestView.alias || viewOptions.requestView.id;
        var data = {};
        if (row[viewId + "__fy"]) {
            data.fy = {};
            populateData({
                data: data.fy,
                result: row,
                valueColumn: valueColumn,
                alias: "__fy",
                valueui: valueui,
                comparison: comparison,
                viewid: viewId
            });
        }
        if (row[viewId + "__past__fy"]) {
            data.pastfy = {};
            populateData({
                data: data.pastfy,
                result: row,
                valueColumn: valueColumn,
                alias: "__past__fy",
                valueui: valueui,
                comparison: comparison,
                viewid: viewId
            });
        }
        if (row[viewId + "__month"]) {
            data.month = {};
            populateData({
                data: data.month,
                result: row,
                valueColumn: valueColumn,
                alias: "__month",
                valueui: valueui,
                comparison: comparison,
                viewid: viewId
            });
        }
        if (row[viewId + "__past__month"]) {
            data.pastmonth = {};
            populateData({
                data: data.pastmonth,
                result: row,
                valueColumn: valueColumn,
                alias: "__past__month",
                valueui: valueui,
                comparison: comparison,
                viewid: viewId
            });
        }
        if (row[viewId + "__quarter"]) {
            data.quarter = {};
            populateData({
                data: data.quarter,
                result: row,
                valueColumn: valueColumn,
                alias: "__quarter",
                valueui: valueui,
                comparison: comparison,
                viewid: viewId
            });
        }
        if (row[viewId + "__past__quarter"]) {
            data.pastquarter = {};
            populateData({
                data: data.pastquarter,
                result: row,
                valueColumn: valueColumn,
                alias: "__past__quarter",
                valueui: valueui,
                comparison: comparison,
                viewid: viewId
            });
        }
        if (row.aggregateLabel) {
            data.aggregateLabel = row.aggregateLabel;
        }
        return data;
    }

    function handleGroupInAggregates(result, viewOptions) {
        // we merge the data of fy,past__fy,month,past__month,quarter,past__quarter on the basis of the id field in group by query

        var valueColumn = viewOptions.value;
        var valueui = viewOptions.valueui;
        var comparison = viewOptions.aggregateSpan.comparison;
        var viewId = viewOptions.requestView.alias || viewOptions.requestView.id;
        var properties = ["fy", "past__fy", "month", "past__month", "quarter", "past__quarter"];
        var finalResult = [];
        for (var i = 0; i < properties.length; i++) {
            var iproperty = properties[i];
            if (result[viewId + "__" + iproperty] && result[viewId + "__" + iproperty].result && result[viewId + "__" + iproperty].result.length > 0) {
                for (var j = 0; j < result[viewId + "__" + iproperty].result.length; j++) {
                    var row = result[viewId + "__" + iproperty].result[j];
                    var newrow = {};
                    if (!row.matched) {
                        newrow[viewId + "__" + iproperty] = row;
                        for (var k = i + 1; k < properties.length; k++) {
                            var kproperty = properties[k];
                            if (result[viewId + "__" + kproperty] && result[viewId + "__" + kproperty].result && result[viewId + "__" + kproperty].result.length > 0) {
                                var index = Utils.isExists(result[viewId + "__" + kproperty].result, row, "_id");
                                if (index !== undefined && !(result[viewId + "__" + kproperty].result[index].matched)) {
                                    newrow[viewId + "__" + kproperty] = result[viewId + "__" + kproperty].result[index];
                                    result[viewId + "__" + kproperty].result[index].matched = true;
                                }
                            }
                        }
                    }
                    if (Object.keys(newrow).length > 0) {
                        finalResult.push(newrow);
                    }
                }
            }
        }
        // after merging we populate the aggregateLabel field to show on dashboard.
        var groupColumns = viewOptions.groupColumns;
        var fields = viewOptions.fields;
        var valueColumn = viewOptions.value;
        var valueui = viewOptions.valueui;
        for (var i = 0; i < finalResult.length; i++) {
            var row = finalResult[i];
            for (var j = 0; j < properties.length; j++) {
                var property = properties[j];
                if (row[viewId + "__" + property]) {
                    populateLabel(row, viewId + "__" + property);
                }
            }
        }

        function populateLabel(row, exp) {
            if (row[exp] && row.aggregateLabel == undefined) {
                var expValue = row[exp]
                var label = undefined;
                for (var j = 0; j < groupColumns.length; j++) {
                    var column = groupColumns[j];
                    var columnLabel = Utils.replaceDotToUnderscore(column);
                    var columnInfo = Utils.getField(column, fields);
                    if (columnInfo && columnInfo.displayField) {
                        var value = expValue[columnLabel];
                        if (value) {
                            label = label ? label + "-" + value[columnInfo.displayField] : value[columnInfo.displayField];
                        }
                    } else {
                        label = label ? label + "-" + expValue[columnLabel] : expValue[columnLabel];
                    }
                }
                row.aggregateLabel = label;
            }
        }

        return    finalResult;
    }

    function populateData(params) {
        var Utility = require("ApplaneCore/apputil/util.js");
        var data = params.data;
        var result = params.result;
        var valueColumn = params.valueColumn;
        var alias = params.alias;
        var valueui = params.valueui;
        var viewId = params.viewid;
        var comparison = params.comparison;
        var value = undefined;
        if (result[viewId + alias]) {
            var model = result[viewId + alias];
            value = Utility.resolveDottedValue(model, valueColumn);
            Utility.putDottedValue(data, valueColumn, value);
        }
        if (comparison) {
            if (result[viewId + "__past" + alias]) {
                var previousValue = Utility.resolveDottedValue(result[viewId + "__past" + alias], valueColumn);
                if (previousValue) {
                    calculatePercentage(value, previousValue, data, valueColumn, valueui);
                }
            }
        }
    }

    function calculatePercentage(value, previousValue, data, expression, ui) {
        var Utility = require("ApplaneCore/apputil/util.js");
        var percentage = undefined;
        if (ui === "currency") {
            var currentAmount = value ? value.amount : 0;
            var pastAmount = previousValue ? previousValue.amount : 0;
            percentage = calculate(currentAmount, pastAmount);
        } else if (ui === "duration") {
            var currentDuration = value ? value.time : 0;
            var pastDuration = previousValue ? previousValue.time : 0;
            percentage = calculate(currentDuration, pastDuration);
        } else if (ui === "number") {
            percentage = calculate(value, previousValue);
        }
        if (percentage) {
            Utility.putDottedValue(data, expression + "__percentage", percentage);
        }
        function calculate(current, past) {
            if (past === 0) {
                return;
            }
            return (((current - past ) / Math.abs(past)) * 100);
        }

    }

    return ViewUtility;

});




