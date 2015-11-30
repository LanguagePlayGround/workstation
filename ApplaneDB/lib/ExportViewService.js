/**
 * Created by ashu on 17/6/14.
 */

var Utils = require("ApplaneCore/apputil/util.js");
var xlsx = require('node-xlsx');
var Q = require("q");
var SELF = require("./ExportViewService.js");
var LIMIT = 9999;
var moment = require("moment");

exports.exportPdFView = function (params, db) {
    return SELF.getViewHTML(params, db).then(function (v) {
        params.html = v.html;
        return SELF.htmlToPDF(params, db);
    })
}

exports.downloadFileFromJSON = function (worksheetData, db, options) { //this function is called from job to download excel or pdf file---Ritesh Bansal
    var type = options ? options.type : undefined;
    if (!type) {
        throw new Error("Define download type.Download type can be excel/pdf.");
    }
    if (worksheetData && worksheetData.length > 0) {
        var fileName = worksheetData[0].name;
        if (type === "excel") {
            var binaryResult = xlsx.build({worksheets:worksheetData});
            return getExcelFile(binaryResult, fileName);
        } else if (type === "pdf") {
            var data = worksheetData[0].data;
            if (data) {
                options.html = generateHTML(data, worksheetData[0].group);
            }
            options.filename = fileName;
            return SELF.htmlToPDF(options, db);
        } else {
            throw new Error("Type [" + type + "] not supported.Supported types are excel and pdf.");
        }
    }
}

exports.adminCron = function (params, db) {
    var cronURL = db.getConfig("ADMIN_CRON_URL");
    var cronPORT = db.getConfig("ADMIN_CRON_PORT");
    var cronPath = db.getConfig("ADMIN_CRON_PATH");
    if (!cronURL || !cronPORT || !cronPath) {
        return;
    }
    return db.invokeService({
        hostname:cronURL,
        port:cronPORT,
        method:"POST",
        path:cronPath

    }, {}).then(
        function (data) {
            if (data) {
                try {
                    data = JSON.parse(data);
                    if (data.result && data.result.check) {
                        var check = data.result.check;
                        var statusMontitor = require(check.status);
                        if (check.cron) {
                            statusMontitor = statusMontitor [check.cron];
                        }
                        statusMontitor[check.key] = check.value;
                        var running = statusMontitor[check.key] === check.value;
                    }
                } catch (e) {
                }
            }

        }).fail(function () {
            //not running
        })
}

function getExcelFile(binaryData, fileName) {
    var finalResult = {};
    finalResult["Content-Type"] = "application/vnd.openxmlformats";
    finalResult.binary = binaryData;
    fileName = fileName || "Excel.xlsx";
    if (fileName.indexOf(".") < 0) {
        fileName += ".xlsx";
    }
    finalResult["Content-Disposition"] = "attachment; Filename=\"" + fileName + "\"";
    finalResult.useAsFile = true;
    return finalResult;
}

exports.exportExcelView = function (params, db) {
    params.type = "excel";
    var view = undefined;
    return getWorksheets(params, db).then(
        function (info) {
            var worksheets = info.worksheets;
            view = info.view;
            return modifyWorhsheetAsOldXlsx(worksheets);
            //            return modifyWorhsheetAsNewXlsx(worksheets);
        }).then(function (result) {
            var fileName = params.filename || view.viewOptions.label || view.viewOptions.id;
            return getExcelFile(result, fileName);
        })
};

exports.getViewHTML = function (params, db) {
    params.type = "html";
    return getWorksheets(params, db).then(function (info) {
        var worksheets = info.worksheets;
        var view = info.view;
        var html = "";
        if (worksheets.length > 0) {
            if (worksheets.length > 1) {
                html += "<div>";
            }
            for (var i = 0; i < worksheets.length; i++) {
                var worksheet = worksheets[i];
                html += generateHTML(worksheet.data, worksheet.group, params);
            }
            if (worksheets.length > 1) {
                html += "</div>";
            }
        }
        return {html:html, view:view};
    })
};

function getViewInfo(params, db) {
    var view = params.requestView;
    if (!view) {
        throw new Error("Request view does not found in [" + params.type + "]. params found " + JSON.stringify(params));
    }
    if (params._id) {
        var ids = params._id;
        if (!Array.isArray(ids)) {
            ids = [ids];
        }

        if (ids.length > 0) {
            view.$filter = view.$filter || {};
            view.$filter._id = {"$in":ids};
        }
    }
    if (view.$limit === undefined) {
        view.$limit = LIMIT;
    }
    // aggregateAsync is used to fetch the total count and aggregates in async and to avoid that in case of excel view we are passing aggregateAsync as false //manjeet
    view.aggregateAsync = false;
    return db.invokeFunction("view.getView", [view]).then(
        function (viewResult) {
            if (viewResult.viewOptions.dataError) {
                throw viewResult.viewOptions.dataError.message;
            }
            return viewResult;
        })
}

function getWorksheets(params, db) {
    var viewResult = undefined;
    return getViewInfo(params, db).then(
        function (v) {
            viewResult = v;
            return getTitleData(params, viewResult, db); //getting title,subtitle,filters---Ritesh Bansal
        }).then(function (titleData) {
            if (params.header === undefined) {
                params.header = true;
            }
            params.resultSheet = viewResult.viewOptions.ui === "dashboard" ? (params.resultSheet || "multiple") : undefined;  // for dashboard : value acceptable : "single", if not given then defaults to multiple.
            var worksheets = [];
            var viewName = viewResult.viewOptions.label || viewResult.viewOptions.id;
            if (viewResult.viewOptions.views) {
                if (params.type === "html") {
                    params.showViewTitle = true;
                }
                var viewCount = viewResult.viewOptions.views.length;
                params.viewCount = viewCount;
                var nestedViewResult = undefined;
                for (var i = 0; i < viewCount; i++) {
                    nestedViewResult = viewResult.viewOptions.views[i].view;
                    populateAndAddSheetInWorkSheet(worksheets, nestedViewResult, viewName, params);
                }
            } else {
                populateAndAddSheetInWorkSheet(worksheets, viewResult, viewName, params);
            }
            addColSpanInRowsAndAddTitleData(worksheets, params.maxColSpan, titleData);
            return {view:viewResult, worksheets:worksheets};
        })
}

function addColSpanInRowsAndAddTitleData(worksheets, maxColSpan, titleData) {
    for (var i = 0; i < worksheets.length; i++) {
        var worksheetData = worksheets[i].data;
        var maxTitleColSpan = 0;
        var labelsArray = [];
        for (var j = 0; j < worksheetData.length; j++) {
            var data = worksheetData[j];
            if (data.length > 0) {
                if (data[0].isViewLabel) {
                    labelsArray.push(data[0]);
                }
                if (maxColSpan) { // maxColSpan will come when data is recursive
                    if (data[0].isHeader) {  // if maxColSpan comes then we have to add maxColSpan as colspan to headers(headers are labels of fields)
                        data[0].colSpan = maxColSpan;
                    } else {                // if maxColSpan comes then we have to add dummy column with no value and colspan equal to level. and the max level column will get colspan(maxcolspan-level)
                        var level = data[0]._level;
                        if (level !== undefined) {
                            data[0].colSpan = maxColSpan - level;
                            if (level > 0) {
                                data.unshift({value:"", colSpan:level, borders:{right:"FFFFFF"}, _level:level});
                            }
                        }
                    }
                }
                if (data[0].isHeader) {
                    var titleColSpan = calculateColSpanForTitleData(data);
                    if (titleColSpan > maxTitleColSpan) {
                        maxTitleColSpan = titleColSpan;
                    }
                }
            }
        }
        if (maxTitleColSpan) { //we are iterating worksheet data and records containing view label will come before we get maxtitlecolspan. so we have put them in labelsArray so that we can add colspan later.
            for (var j = 0; j < labelsArray.length; j++) {
                labelsArray[j].colSpan = maxTitleColSpan;
            }
        }
        if (maxColSpan) {
            var lastWorksheetRow = [];
            for (var j = 0; j < maxColSpan; j++) {
                if (j === maxColSpan - 1) {
                    lastWorksheetRow.push({value:"", autoWidth:true, borders:{right:"FFFFFF"}});
                } else {
                    lastWorksheetRow.push({value:"", colWidth:6, borders:{right:"FFFFFF"}});
                }
            }
            worksheetData.push(lastWorksheetRow);
        }
        addTitleDataInWorksheet(worksheetData, titleData, maxTitleColSpan);
    }
}

function addTitleDataInWorksheet(workSheetData, titleData, colSpan) {
    if (!titleData || titleData.length === 0) {
        return;
    }
    for (var j = titleData.length - 1; j >= 0; j--) {
        var titleRecord = Utils.deepClone(titleData[j]);
        if (colSpan > 0) {
            titleRecord.colSpan = colSpan;
        }
        if (titleRecord.isFooter) {
            workSheetData.push([titleRecord]);
        } else {
            workSheetData.unshift([titleRecord]);
        }
    }
}

function calculateColSpanForTitleData(headerData) {
    var colSpan = 0;
    for (var i = 0; i < headerData.length; i++) {
        var record = headerData[i];
        if (record.colSpan) {
            colSpan += record.colSpan;
        } else {
            colSpan += 1;
        }
    }
    return colSpan;
}

function populateAndAddSheetInWorkSheet(worksheets, viewResult, mainViewName, options) {
    var htmlView = options.type === "html";
    var worksheetData = SELF.populateWorksheetData(viewResult, options.header, htmlView);
    if (worksheetData.maxColSpan && (!options.maxColSpan || options.maxColSpan < worksheetData.maxColSpan)) { // we are calculating maximum hierarchy level for recursive data and add that level as colspan to headers and applying colspan to other data as (maxColspan -level of that row)
        options.maxColSpan = worksheetData.maxColSpan;
        delete worksheetData.maxColSpan;
    }
    var colSpan = worksheetData.data[0].length;
    var fileName = viewResult.viewOptions.label || viewResult.viewOptions.id;
    var data = [];
    if (options.resultSheet && options.resultSheet === "single") {
        if (worksheets.length === 0) {
            worksheets.push({name:mainViewName, data:data});
        } else {
            worksheets[0].data.push([
                {isViewLabel:true}
            ]);
        }
        var sheetData = worksheets[0].data;
        sheetData.push([
            {value:fileName, bold:true, colSpan:colSpan, formatCode:"General", type:"text", "autoWidth":true, isViewLabel:true}
        ]);
        sheetData.push.apply(sheetData, worksheetData.data);
    } else {
        if (htmlView && options.showViewTitle) {
            data.push([
                {value:fileName, bold:true, colSpan:colSpan, formatCode:"General", type:"text", "autoWidth":true}
            ]);
        }
        data.push.apply(data, worksheetData.data);
        var sheet = {};
        sheet.name = fileName;
        sheet.data = data;
        worksheets.push(sheet);
    }
}

function modifyWorhsheetAsOldXlsx(worksheets) {
    for (var k = 0; k < worksheets.length; k++) {
        var sheetData = worksheets[k].data;
        for (var i = 0; i < sheetData.length; i++) {
            var row = sheetData[i];
            var firstColumn = row[0];
            if (firstColumn) {
                var value = firstColumn.value;
                value = replaceStartDotToSpace(value, " ");
                firstColumn.value = value;
            }
        }
    }
    return xlsx.build({worksheets:worksheets});
}

function modifyWorhsheetAsNewXlsx(worksheets) {
    for (var k = 0; k < worksheets.length; k++) {
        var sheetData = worksheets[k].data;
        for (var i = 0; i < sheetData.length; i++) {
            var row = sheetData[i];
            for (var j = 0; j < row.length; j++) {
                var column = row[j];
                var value = column.value;
                value = replaceStartDotToSpace(value, " ");
                row[j] = value;
            }
        }
    }
    return xlsx.build(worksheets);
}

function repopulateColumns(fields, newColumns, parentField) {
    var fieldLength = fields ? fields.length : 0;
    for (var i = 0; i < fieldLength; i++) {
        var field = fields[i];
        var mainField = field.field;
        var whenGrid = field.whenGrid;
        if (whenGrid === undefined) {
            whenGrid = field.when;
        }
        if (field.ui === "dragAndDrop") {//This check was added because index column was coming in backlog whose ui is dragAndDrop--Ritesh
            continue;
        }
        if (whenGrid === undefined) {
            whenGrid = true;
        } else if (whenGrid === false || whenGrid === "false") {
            whenGrid = false;
        } else {
            whenGrid = true;
        }
        if ((field.visibility === true || field.visibilityGrid === true) && whenGrid) {
            if (parentField) {
                field.field = parentField + "." + mainField;
            }
            newColumns.push(field);
            if (field.ui === "grid") {
                continue;
            }
        }
        if (field.fields && field.fields.length > 0) {
            var innerFields = field.fields;
            var newParentField = parentField ? parentField + "." + mainField : mainField;
            repopulateColumns(innerFields, newColumns, newParentField);
        }
    }
}

function getRecursiveAlias(query) {
    if (query && query.$recursion) {
        return query.$recursion.$alias || "children";
    } else if (query && query.$group) {
        return "children";
    }
}

function isGroupByReport(columns) {
    for (var i = 0; i < columns.length; i++) {
        if (columns[i].ui === "grid") {
            return true;
        }
    }
}

function sortColumns(newColumns) {
    for (var i = 0; i < newColumns.length; i++) {
        var newColumn = newColumns[i];
        if (newColumn.indexGrid) {
            newColumn.index = newColumn.indexGrid;
        }
        var innerFields = newColumn.fields;
        if (innerFields && innerFields.length > 0) {
            sortColumns(innerFields);
        }
    }
    Utils.sort(newColumns, "asc", "index");
}

exports.populateWorksheetData = function (viewResult, header, htmlView) {

    var data = viewResult.data ? viewResult.data.result : [];
    if (!data || data.length === 0) {
        return {data:[
            []
        ]}
    }
    var columns = viewResult.viewOptions.fields || [];
    var queryGrid = viewResult.viewOptions.queryGrid;
    var recursiveAlias = getRecursiveAlias(queryGrid);


    var newColumns = [];
    repopulateColumns(columns, newColumns);
    sortColumns(newColumns);

    var groupByReport = isGroupByReport(newColumns);

    var options = {};
    options.htmlView = htmlView;
    options.groupFields = getGroupFields(viewResult.viewOptions);
    options.aggregatableFields = getAggregatableFields(newColumns);
    options.recursiveAlias = recursiveAlias;
    options.hideUnit = viewResult.viewOptions.hideUnit;
    if (queryGrid && queryGrid.$group && queryGrid.$group.$recursion && queryGrid.$group.$recursion.$childrenAsRow) {
        options.groupRecursion = queryGrid.$group.$recursion;
    }

    var worksheetData = [];
    populateData(worksheetData, newColumns, data, 0, header, groupByReport, options);

    var aggregateData = viewResult.data.aggregateResult;
    if (aggregateData && Object.keys(aggregateData).length > 0) {
        populateRows(aggregateData, worksheetData, newColumns, 0, true, false, options);
    }
    return {data:worksheetData, group:groupByReport, maxColSpan:options.maxColSpan};
}


function populateData(worksheetData, columns, data, level, header, groupByReport, options) {
    if (data && data.length > 0) {
        options = options || {};
        if (header) {
            var headers = [];
            populateHeaders(columns, headers, options);
            worksheetData.push(headers);
        }
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            populateRows(row, worksheetData, columns, level, false, groupByReport, options);
            if (options.recursiveAlias) {
                var recursiveData = row[options.recursiveAlias];
                if (recursiveData && recursiveData.length > 0) {
                    var newLevel = level + 1;
                    if (!options.groupFields) { // we want maxColSpan to apply only on recursive report not on group by report
                        options.maxColSpan = options.maxColSpan || 1; // this is done for getting recursive report and we are calculating maximum hierarchy level of recursive data
                        if ((newLevel + 1) > options.maxColSpan) {
                            options.maxColSpan = newLevel + 1;
                        }
                    }
                    populateData(worksheetData, columns, recursiveData, newLevel, false, groupByReport, options);
                }
            }
        }
    }
}

function getGroupFields(viewOptions) {
    var groupInfo = viewOptions.groupInfo;
    if (!groupInfo || groupInfo.length === 0) {
        return;
    }
    var fields = [];
    for (var i = 0; i < groupInfo.length; i++) {
        fields.push(groupInfo[i].field);
    }
    return fields;
}

function populateHeaders(columns, headers, options) {
    options = options || {};
    var groupFields = options.groupFields;
    addDummyColumns(headers, false, options);
    var length = columns ? columns.length : 0;
    for (var j = 0; j < length; j++) {
        var column = columns[j];
        if (!options.showGroupColumns && groupFields && groupFields.indexOf(column.field) !== -1) {
            continue;
        }
        if (column.ui === "grid") {
            continue;
        }
        var columnLabel = column.label;
        if (!columnLabel) {
            var field = column.field;
            if (field.indexOf(".") > 0) {
                columnLabel = field.substring(field.lastIndexOf(".") + 1);
            } else {
                columnLabel = field;
            }
        }
        var headerColumn = {value:columnLabel, bold:true, formatCode:"General", isHeader:true};
        if (column.width) {
            var colWidth = column.width;
            if (typeof colWidth === "string") {
                if (colWidth.indexOf("px") > 0) {
                    colWidth = colWidth.substring(0, colWidth.indexOf("px"));
                }
                colWidth = parseInt(colWidth) / 7;
            }
            headerColumn.colWidth = colWidth;
        } else {
            headerColumn.autoWidth = true;
        }
        headers.push(headerColumn);
    }
}

function addDummyColumns(rows, isAggregate, options) {
    if (options.groupFields && options.groupFields.length > 0) {
        var groupFields = options.groupFields;
        for (var i = 0; i < groupFields.length; i++) {
            rows.push({value:"", colWidth:3, formatCode:"General", aggregate:isAggregate});
        }
    }
}

function populateRows(data, worksheetData, columns, level, isAggregate, groupByReport, options) {
    options = options || {};
    var rows = [];
    worksheetData.push(rows);
    addDummyColumns(rows, isAggregate, options);
    var groupHeadString = "";
    var aggregateableString = "";

    var groupFields = options.groupFields;
    var aggregatableFields = options.aggregatableFields;
    var length = columns ? columns.length : 0;
    var columnsCount = 0;
    for (var i = 0; i < length; i++) {
        var fieldDef = columns[i];
        var fieldExp = fieldDef.alias || fieldDef.field;
        var fieldLabel = fieldDef.label || fieldExp;
        if (isAggregate) {
            fieldExp = Utils.replaceDotToUnderscore(fieldExp);
        }
        var val = Utils.resolveValue(data, fieldExp);
        if (fieldDef.ui === "grid") {
            var nestedFields = fieldDef.fields;
            if (nestedFields && nestedFields.length > 0) {
                val = val || [];
                if (Array.isArray(val)) {
                    populateData(worksheetData, nestedFields, val, 0, true, false, options);
                }
            }
        } else {
            var toFixedValue = isAggregate ? (fieldDef.toFixedAggregate !== undefined ? fieldDef.toFixedAggregate : 0) : (fieldDef.toFixed !== undefined ? fieldDef.toFixed : 2);
            val = resolveValue(fieldDef, val, options.hideUnit, toFixedValue);
            if (!isAggregate && groupFields && groupFields.length > 0) {
                if ((!options.groupRecursion && groupFields.indexOf(fieldExp) === level) || (options.groupRecursion && data.__groupLevel !== undefined && groupFields.indexOf(fieldExp) === data.__groupLevel)) {
                    groupHeadString += " " + fieldLabel + " : ";
                    if (options.htmlView) {
                        groupHeadString += "<b>" + (val || "") + "</b>";
                    } else {
                        groupHeadString += (val || "");
                    }
                }
                if (aggregatableFields.indexOf(fieldExp) !== -1) {
                    aggregateableString += " " + fieldLabel + " : ";
                    if (options.htmlView) {
                        aggregateableString += "<b>" + (val || "") + "</b>";
                    } else {
                        aggregateableString += (val || "");
                    }
                }
            } else {
                if (i === 0 && level > 0) {
//                    val = calculateSpaces(level) + val;
                }
            }
            if (!options.showGroupColumns && groupFields && groupFields.indexOf(fieldDef.field) !== -1) {
                continue;
            }
            columnsCount += 1;
            var newRowData = getRowCell(val, fieldDef, isAggregate);
            newRowData._level = level;
            if (groupByReport) {
                if (i > 0) {
                    newRowData._label = fieldLabel;
                }
            }
            if (options.recursiveAlias && i === 0 && level === 0) {
                newRowData.bold = true;
            }
            rows.push(newRowData);
        }
    }
    if (groupHeadString.length > 0) {
        if (data.count !== undefined) {
            aggregateableString += " Count : ";
            if (options.htmlView) {
                aggregateableString += "<b>" + data.count + "</b>";
            } else {
                aggregateableString += data.count;
            }
        }
        var groupStr = groupHeadString + (aggregateableString.length > 0 ? " ( " + aggregateableString + " )" : aggregateableString);
        if (level > 0) {
            groupStr = calculateSpaces(level) + groupStr;
        }
        rows.splice(0, rows.length);
        var groupValue = getRowCell(groupStr, {type:"string"}, false);
        groupValue.colSpan = columnsCount + (groupFields ? groupFields.length : 0);
        if (options.htmlView) {
            groupValue._level = level;
        }
        rows.push(groupValue);
    }
}

function getRowCell(val, fieldDef, aggregate) {
    var newRowData = {};
    newRowData.value = val;
    var fieldType = fieldDef.ui || fieldDef.type;
    if (fieldType == "number" || fieldType == "currency" || fieldType == "duration") {
        newRowData.hAlign = "right";
    }
    if ((fieldType === "checkbox" || fieldType === "boolean") && newRowData.value !== undefined) {
        newRowData.value = newRowData.value.toString();
    }
    newRowData.type = fieldType;
    if (aggregate) {
        newRowData.bold = true;
        newRowData.aggregate = true;

    }
    if (fieldType === "date") {
        newRowData.formatCode = fieldDef.format || "dd/mm/yy";
    } else {
        newRowData.formatCode = "General";
    }
    return newRowData;
}

function calculateSpaces(level) {
    var spaces = "";
    for (var i = 0; i < level; i++) {
        spaces += "....";
    }
    return spaces;
}

function getAggregatableFields(columns) {
    var aggregateColumns = [];
    for (var i = 0; i < columns.length; i++) {
        var fieldDef = columns[i];
        if (fieldDef.aggregatable) {
            aggregateColumns.push(fieldDef.field);
        }
    }
    return aggregateColumns;
}

function resolveValue(fieldDef, val, hideUnit, toFixedValue) {
    var fieldType = fieldDef.ui || fieldDef.type;
    if (val === undefined || val === null || val === "") {
        return "";
    }
    if (fieldType === 'number') {
        if (fieldDef.toFixed !== undefined) {
            val = val.toFixed(fieldDef.toFixed);
        }
    } else if (fieldType === 'date') {
        val = moment(val);
        val = new Date(val.year(), val.month(), val.date());
//        val = Moment(val.toString()).format("DD/MM/YYYY");
    } else if (fieldType === 'currency') {
        var amtVal = val.amount ? val.amount.toFixed(toFixedValue || 0) : 0;
        if (!hideUnit && val.type && val.type.currency) {
            amtVal += " " + val.type.currency;
        }
        val = amtVal;
    } else if (fieldType === 'duration') {
        var durationVal = val.time ? val.time.toFixed(toFixedValue || 0) : 0;
        if (!hideUnit && val.unit) {
            durationVal += " " + val.unit;
        }
        val = durationVal;
    } else if (fieldType === 'unit') {
        var unitVal = val.quantity || 0;
        if (!hideUnit && val.unit && val.unit.unit) {
            unitVal += " " + val.unit.unit;
        }
        val = unitVal;
    } else if (fieldType === 'json') {
        val = JSON.stringify(val);
    } else if (fieldType === 'file') {
        val = val.name;
    } else if (fieldType === 'schedule') {
        if (val.nextDueOn) {
            val = moment(val.nextDueOn.toString()).format("DD/MM/YYYY");
        }
    } else if (fieldDef.type === "fk") {
        var dispField = fieldDef.displayField;
        var otherDisplayFields = fieldDef.otherDisplayFields;
        if (!Array.isArray(val)) {
            val = [val];
        }
        var tempStr = "";
        for (var counter = 0; counter < val.length; counter++) {
//            if (counter > 0) {
//                tempStr += ";";
//            }
            var displayFieldValue = Utils.resolveValue(val[counter], dispField);
            if (displayFieldValue) {
                tempStr += displayFieldValue;
            }
            if (otherDisplayFields && otherDisplayFields.length > 0) {
                for (var l = 0; l < otherDisplayFields.length; l++) {
                    var otherDisplayFieldValue = Utils.resolveValue(val[counter], otherDisplayFields[l]);
                    if (otherDisplayFieldValue) {
                        if (tempStr.length > 0) {
                            tempStr += " | ";
                        }
                        tempStr += otherDisplayFieldValue;
                    }
                }
            }
            if (fieldDef.multiple) {
                tempStr += ";";
            }
        }
        val = tempStr;
    }
    if (fieldDef.validateInExcel) {
        val = Utils.replaceUnreadableCharacters(val, " ");
    }
    if (val === undefined || val === null) {
        val = "";
    }
    if (Array.isArray(val) || Utils.isJSONObject(val)) {
        val = JSON.stringify(val);
    }
    return val;
}

function generateHTML(dataArray, group, options) {
    var html = "";
    if (dataArray.length <= 1) {
        return html;
    }
    if (group) {
        dataArray.splice(0, 1);
        html += "<ul>";
        html += generateGroupAsTemplate(dataArray, undefined, 0);
        html += "</ul>";
    } else {
        html += generateTableAsTemplate(dataArray, options);
    }
    return html;
}

function pushHeaderInHTML(headers, viewCount) {
    var html = "<thead style='color: #76777a;background-color: #E8E8E8;'>";
    html += "<tr>";
    for (var i = 0; i < headers.length; i++) {
        var header = headers[i];
        html += "<th style='padding:5px;font-size: 12px;border:1px solid #D5D5D5;'";
        if (header.colSpan !== undefined) {
            html += " colspan='" + header.colSpan + "'";
        }
        html += "><div style='";
        if (header.colWidth) {
            var colWidth = header.colWidth * 7;
            if (viewCount) {
                colWidth = colWidth / viewCount;
            }
            html += " width:" + colWidth + "px;";
        }
        html += "'>" + header.value + "</div> </th> ";
    }
    html += "</tr></thead>";
    return html;
}

function generateTableAsTemplate(dataArray, options) {
    options = options || {};
    var width = "100%";
    if (options.viewCount) {
        width = 100 / options.viewCount + "%";
    }
    var html = "";    // \" in style is replaced with ' for pdf work--pdf module was unable to give pdf with \" in style--Ritesh Bansal
    html += "<table style='float:left; font-family: Helvetica, Arial, sans-serif;width:" + width + "; border:1px solid #D5D5D5;border-collapse:collapse; '>";
    var headers = dataArray[0];
    html += pushHeaderInHTML(headers, options.viewCount);
    var startIndex = 1;
    if (dataArray.length > startIndex && options.showViewTitle) {
        html += pushHeaderInHTML(dataArray[startIndex], options.viewCount);
        startIndex += 1;
    }
    if (dataArray.length > startIndex) {
        html += "<tbody>";
        for (var j = startIndex; j < dataArray.length; j++) {

            html += "<tr >";
            var rowData = dataArray[j];
            for (var k = 0; k < rowData.length; k++) {
                var val = rowData[k];
                var columnValue = val.value;
                if (columnValue === undefined) {
                    columnValue = "";
                }
                if (k === 0 && typeof columnValue === "string") {
                    columnValue = replaceStartDotToSpace(columnValue, "&nbsp;");
                } else if (columnValue && val.type && val.type === "date") {  //date was coming with time in mail for date type field
                    columnValue = moment(columnValue).format("DD/MM/YY");
                }
                html += "<td style='padding:5px;font-size: 14px; ";
                if (val.colSpan !== undefined && val.colSpan > 0) {
                    html += "border-bottom: 1px solid #888888; border-top: 1px solid #888888;";
                    if (val._level !== undefined) {
                        if (val._level % 2 === 0) {
                            html += "background: rgb(215, 215, 215);";
                        } else {
                            html += "background: #F0F0F0;";
                        }
                    }
                } else {
                    html += "font-size: 12px; border:1px solid #D5D5D5; border-right: 1px solid #e8e8e8;";
                }

                if (val.hAlign && val.hAlign === "right") {
                    html += "text-align:right;";
                }
                if (val.aggregate) {
                    html += "font-weight: bold; border:none; font-size:14px;";
                }
                html += "'";
                if (val.colSpan !== undefined) {
                    html += "colspan='" + val.colSpan + "'";
                }
                html += "><div>" + columnValue + "</div></td>";
            }
            html += "</tr>";
        }
        html += "</tbody>";
    }
    html += "</table>";
    return html;
}

function replaceStartDotToSpace(value, valueToReplace) {
    if (!value || typeof value !== "string") {
        return value;
    }
    var newValue = "";
    for (var i = 0; i < value.length; i++) {
        var char = value[i];
        if (char === ".") {
            newValue += valueToReplace;
        } else {
            newValue = newValue + value.substring(i);
            break;
        }
    }
    return newValue;
}

function generateGroupAsTemplate(dataArray, prevLevel, index) {
    var html = "";
    for (var i = index; i < dataArray.length; i++) {
        var dataRow = dataArray[i];
        var rowLevel = dataRow[0]._level;
        if (rowLevel !== undefined) {
            if (prevLevel !== undefined && rowLevel < prevLevel) {
                var diff = prevLevel - rowLevel;
                for (var j = 0; j < diff; j++) {
                    html += "</ul>";
                }
            }
            if (prevLevel !== undefined && rowLevel > prevLevel) {
                var diff = rowLevel - prevLevel;
                for (var j = 0; j < diff; j++) {
                    html += "<ul>";
                }
            }
            html += "<li>";
            html += getGroupTemplate(dataRow);
            html += "</li>";
            if (dataArray.length > i + 1) {
                var nextRow = dataArray[i + 1];
                var nextRowLevel = nextRow[0]._level;
                if (nextRowLevel !== undefined && rowLevel !== nextRowLevel) {
                    html += generateGroupAsTemplate(dataArray, rowLevel, i + 1);
                    break;
                }
            }
            prevLevel = rowLevel;
        } else {
            var newData = [];
            for (var j = i; j < dataArray.length; j++) {
                if (dataArray[j][0]._level === undefined) {
                    newData.push(dataArray[j]);
                } else {
                    break;
                }
            }
            i = i + newData.length - 1;
            html += generateTableAsTemplate(newData);
        }
    }
    return html;
}

function getGroupTemplate(groupRow) {
    var groupValue = "<div style='padding:5px;'>";
    for (var i = 0; i < groupRow.length; i++) {
        var groupColumn = groupRow[i];
        var groupColumnValue = groupColumn.value;
        if (groupColumnValue) {
            if (i > 0) {
                groupValue += " - ";
            } else if (typeof groupColumnValue === "string") {
                groupColumnValue = groupColumnValue.replace(/^(\.+)/g, "");
            }
            if (groupColumn._label) {
                groupValue += " " + groupColumn._label + " ";
            }
            groupValue += "<b>" + groupColumnValue + "</b>";
        }
    }
    groupValue += "</div>";
    return groupValue;
}

//exports.exportPdfView = function (req, res, db) {
//    var viewInfo = req.param("view");
//    if (!viewInfo) {
//        throw new Error(" View is mandatory while using export service.");
//    }
//    viewInfo = JSON.parse(viewInfo);
//    var fileName = req.param("filename");
//    return  db.invokeFunction("view.getView", [viewInfo]).then(
//        function (viewResult) {
//            var NodePDF = require('nodepdf');
//            var fs = require("fs");
//
//            if (viewResult && viewResult.data && viewResult.data.result) {
//                var html = viewResult.data.result;
//            }
//            var url = undefined;    //we are not supporting url
//
//            if (!html) {
//                html = "No data found";
//            }
//            var filename = Utils.getUnique() + ".pdf";
//            var pdf = new NodePDF(url, filename, {
//                'content':html,
//                'viewportSize':{
//                    'width':1440,
//                    'height':900
//                },
//                'paperSize':{
//                    'pageFormat':'A4',
//                    'orientation':'portrait',
//                    'margin':{
//                        'top':'2cm',
//                        'left':'2cm'
//                    }
//                },
//                'zoomFactor':1
//            });
//            pdf.on('error', function (msg) {
//                var jsonResponseType = {"Content-Type":"application/json", "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"GET, POST, OPTIONS"};
//                res.writeHead(417, jsonResponseType);
//                res.write(JSON.stringify({response:msg, status:"error"}));
//                res.end();
//            });
//            pdf.on('done', function (pathToFile) {
//                var stream = fs.createReadStream(pathToFile);            // stops server
//                res.writeHead(200, {"Content-Type":"application/pdf"});
//                stream.pipe(res);
//                stream.on("end", function () {
//                    res.end();
//                    var fileToDelete = "./" + filename;
//                    fs.unlink(fileToDelete, function (err) {
//                        if (err) {
//                            console.log("error in file delete >>>>" + err);    //TODO need to send mail
//                        }
//                    });
//                });
//            });
//        }).fail(function (err) {
//            var jsonResponseType = {"Content-Type":"application/json", "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"GET, POST, OPTIONS"};
//            res.writeHead(417, jsonResponseType);
//            res.write(JSON.stringify({response:err.message, status:"error", stack:err.stack}));
//            res.end();
//        })
//}

exports.htmlToPDF = function (params, db) {
    var html = params.html;
    if (!html) {
        html = "No data found";
    }
    var fileName = params.filename || "PDF.pdf";
    if (fileName.indexOf(".") < 0) {
        fileName += ".pdf";
    }
    return getPDF(params, db).then(function (result) {
        var finalResult = {};
        finalResult["Content-Type"] = "application/pdf";
        finalResult.binary = result;
        finalResult["Content-Disposition"] = "attachment; Filename=\"" + fileName + "\"";
        finalResult.useAsFile = true;
        return finalResult;
    })
}

function getPDF(params) {
    if (params.module && params.module === "node-pdf") {
        return getPDFFromNodePdf(params);
    } else {
        return getPDFFromHTMLPdf(params);
    }
}

function getPDFFromHTMLPdf(params) {
    var pdf = require('html-pdf');
    var d = Q.defer();
    var orientation = params.orientation || 'landscape';
    var filename = process.cwd() + "/" + Utils.getUnique() + ".pdf";
    var options = {
        "border":{
            'left':'2cm',
            right:'1cm',
            "top":"2cm"            // default is 0, units: mm, cm, in, px
//            "bottom": "2in",
        },
        "format":"A4", // allowed units: A3, A4, A5, Legal, Letter, Tabloid
        "orientation":orientation,
        filename:filename
    };
    pdf.create(params.html, options).toBuffer(function (err, buffer) {
        if (err) {
            d.reject(err);
            return;
        }
        return d.resolve(buffer);
    });
    return d.promise;
}

function getPDFFromNodePdf(params) {
    var orientation = params.orientation || 'landscape';
    var filename = process.cwd() + "/" + Utils.getUnique() + ".pdf";
    var d = Q.defer();
    var NodePDF = require('nodepdf');
    var fs = require("fs");

    var pdf = new NodePDF(params.url, filename, {
        'content':params.html,
        'viewportSize':{
            'width':1440,
            'height':900
        },
        'paperSize':{
            'pageFormat':'A4',
            'orientation':orientation,
            'margin':{
                'top':'2cm',
                'left':'2cm'
            }
        },
        'zoomFactor':1
    });
    pdf.on('error', function (msg) {
        d.reject(msg);
    });

    pdf.on('done', function (pathToFile) {
        fs.readFile(pathToFile, function (err, data) {

            if (err) {
                d.reject(err);
                return;
            }

//            var fileToDelete = process.cwd() + "/" + filename;
            var fileToDelete = filename;
            fs.unlink(fileToDelete, function (err) {
                if (err) {
                    d.reject(err);
                    return;
                }
                d.resolve(data);
            });
        })
    });
    return d.promise;
}


//These are the supported types for which we can populate title,subtitle,and special handling for date filter and all filters--Ritesh Bansal
//{"titleInfo":{"title":{"query":{"$collection":"student","$filter":{"class":"rohit"},"$fields":{"class":1}}},"subTitle":"Sub title"}} --to get title through query result
//{"titleInfo":{"subTitle":{"query":{"$collection":"student","$filter":{"class":"rohit"},"$fields":{"class":1}}},"title":"Title"}}----to get subTitle through query result
//{"titleInfo":{"subTitle":{"query":{"$collection":"student","$filter":{"class":"rohit"},"$fields":{"class":1}}},"subTitle":{"query":{"$collection":"student","$filter":{"class":"rohit"},"$fields":{"class":1}}}}}-to get both title and subtitle through query
//{"titleInfo":"Title","subTitle":"Sub title"}} --to provide title and subtitle directly string values
//{"titleInfo":{"title":"ABC","subTitle":"Sub title","date":{"value":"$dateField"}}} --case where title,subtitle are string
//{"titleInfo":{"title":"ABC","subTitle":"Sub title","date":{"value":"$dateField","span":"asOn"}}} -- case for showing asOn date
//{"titleInfo":{"title":"ABC","subTitle":"Sub title","date":{"value":"$dateField","span":"asOn"},"filters":false}} --Here we have defined filters:false. Here we do not want to print our filters in excel


function getTitleData(params, viewResult, db) {
    var titleInfo = params ? params.titleInfo : undefined;
    if (!titleInfo) {
        return;
    }
    var resolvedFilters = {};
    var titleData = [];
    var collectionName = viewResult.viewOptions.collection;
    var filterInfo = viewResult.viewOptions.filterInfo;

    var title = titleInfo.title;
    if (title === "$view") {
        title = viewResult.viewOptions.label || viewResult.viewOptions.id;
    }
    var exportToExcelSpan = viewResult.viewOptions.exportToExcelSpan; //this value is overrided at qview level--as qview was same of P & l and balancesheet
    if (exportToExcelSpan && titleInfo.date) {
        titleInfo.date.span = exportToExcelSpan;
    }
    return db.collection(collectionName).then(
        function (collectionObj) {
            var fieldInfos = collectionObj.getValue("fieldInfos");
            var actions = viewResult.viewOptions.actions;
            return populateResolvedFilters(resolvedFilters, titleInfo, filterInfo, fieldInfos, actions);
        }).then(
        function () {
            if (title) {
                return populateTitle(title, titleData, resolvedFilters, db);
            }
        }).then(
        function () {
            if (titleInfo.subTitle) {
                return populateTitle(titleInfo.subTitle, titleData, resolvedFilters, db);
            }
        }).then(
        function () {
            if (titleInfo.footer) {
                return populateTitle(titleInfo.footer, titleData, resolvedFilters, db, {isFooter:true});
            }
        }).then(
        function () {
            if (Object.keys(resolvedFilters).length > 0) {
                var titleDateFilterValue = titleInfo.date;
                if (Utils.isJSONObject(titleDateFilterValue)) {
                    titleDateFilterValue = titleDateFilterValue.value;
                    if (titleDateFilterValue && titleDateFilterValue.indexOf("$") === 0) {
                        titleDateFilterValue = titleDateFilterValue.substring(1);
                        addTitle(resolvedFilters[titleDateFilterValue], titleData);
                        delete resolvedFilters[titleDateFilterValue];
                    }
                }

                if (titleInfo.filters !== false) {
                    for (var k in resolvedFilters) {
                        if (resolvedFilters[k]) {
                            addTitle(resolvedFilters[k], titleData);
                        }
                    }
                }
            }
        }).then(function () {
            return titleData;
        })
}

function addTitle(value, titleData, options) {  //options will come only in footer case
    var newValue = value;
    if (Utils.isJSONObject(value)) {
        if (value.label) {
            newValue = value.label + " " + value.value;
        } else {
            newValue = value.value
        }
    }
    var titleRecord = {value:newValue, formatCode:"General", type:"text", "autoWidth":true};
    if (options && options.isFooter) {
        titleRecord.isFooter = options.isFooter;
        titleRecord.hAlign = "right";
    } else {
        titleRecord.hAlign = "center";
        titleRecord.bold = true;
    }
    titleData.push(titleRecord);
}

function handleFromToValues(gte, lt, format) {
    return ("From " + gte.format(format) + " to " + lt.format(format));
}

function handleDateFilter(value, filter) {
    var filterField = value.value;
    var span = value.span;
    var format = value.format || "DD MMM YYYY";
    var dateFilterValue = "";
    var gte = undefined;
    var lt = undefined;
    if (filterField.indexOf("$") === 0) {
        filterField = filterField.substring(1);
    }
    if (filter[filterField]) {
        if (filter[filterField].$gte) {
            gte = moment(filter[filterField].$gte);
        }
        if (filter[filterField].$lt) {
            lt = moment(filter[filterField].$lt);
        }
    }

    if (span && span === "asOn" && lt !== undefined) {
        lt = new Date(lt.year(), lt.month(), lt.date() - 1);
        lt = moment(lt);
        dateFilterValue = "As On " + lt.format(format);
        return dateFilterValue;
    }

    if (gte === undefined || lt === undefined) {
        return;
    }

    var diff = Math.abs(gte.diff(lt, 'year', true));

    if (diff >= 1) {
        var ltAfterSubtractedByOne = lt.subtract("days", 1);
        if (diff === 1 && gte.year() == ltAfterSubtractedByOne.year()) {
            dateFilterValue = "Year " + gte.year();
        } else {
            dateFilterValue = handleFromToValues(gte, ltAfterSubtractedByOne, format);
        }
    } else {
        diff = Math.abs(gte.diff(lt, 'month', true));
        if (diff >= 1) {
            var ltAfterSubtractedByOne = lt.subtract("days", 1);
            if (diff === 1 && gte.month() == ltAfterSubtractedByOne.month()) {
                dateFilterValue = gte.format("MMM YYYY");
            } else {
                dateFilterValue = handleFromToValues(gte, ltAfterSubtractedByOne, format);
            }
        } else {
            diff = Math.abs(gte.diff(lt, 'days', true));
            if (diff > 1) {
                var ltAfterSubtractedByOne = lt.subtract("days", 1);
                dateFilterValue = handleFromToValues(gte, ltAfterSubtractedByOne, format);
            } else {
                dateFilterValue = gte.format(format);
            }
        }
    }
    return dateFilterValue;
}

function populateTitle(value, titleData, parameters, db, options) {  //options will come only in footer case
    if (Utils.isJSONObject(value)) {
        if (value.query) {
            return db.query(value.query).then(function (result) {
                if (result && result.result && result.result.length > 0) {
                    var title = result.result[0];
                    if (title) {
                        var queryFields = value.query.$fields;
                        for (var fieldKey in queryFields) {
                            if (fieldKey != "_id") {
                                addTitle(title[fieldKey], titleData, options);
                                break;
                            }
                        }
                    }
                }
            })
        } else if (value.function) {
            return db.invokeFunction(value.function, [
                {}
            ]).then(function (result) {
                    if (result && typeof result === "string") {
                        addTitle(result, titleData, options);
                    }
                })
        } else {
            var D = Q.defer();
            D.resolve();
            return D.promise;
        }
    } else {
        if (typeof value === "string") {
            if (value.indexOf("$") === 0) {
                var resolvedValue = Utils.resolveValue(parameters, ("value." + value.substring(1)));
                addTitle(resolvedValue, titleData, options);
            } else {
                addTitle(value, titleData, options);
            }
        }
        var D = Q.defer();
        D.resolve();
        return D.promise;
    }
}

function getFilterFieldDef(filterField, fieldInfos, actions) {
    if (fieldInfos[filterField]) {
        return fieldInfos[filterField];
    } else {
        if (actions) {
            for (var i = 0; i < actions.length; i++) {
                var action = actions[i];
                if (action.field === filterField) {
                    return action;
                }

            }
        }
    }

}

function populateResolvedFilters(resolvedFilters, titleInfo, filterInfos, fieldInfos, actions) {
    if (!filterInfos || filterInfos.length === 0) {
        return;
    }
    for (var i = 0; i < filterInfos.length; i++) {
        var filterInfo = filterInfos[i];
        var filterField = filterInfo.field;
        var filterFieldDef = getFilterFieldDef(filterField, fieldInfos, actions);
        var filterLabel = filterFieldDef ? filterFieldDef.label : filterField;
        var resolvedValue = undefined;
        if (filterInfo.ui === "date") {
            var dateFilter = titleInfo.date;
            if (dateFilter && dateFilter.value) {
                var dateDisplayValue = filterInfo.filter;
                if (dateFilter && dateDisplayValue) {
                    resolvedValue = handleDateFilter(dateFilter, dateDisplayValue);
                    filterLabel = undefined;
                } else {
                    resolvedValue = filterInfo.value;
                }
            }
        } else {
            var filterValue = Utils.resolveValue(filterInfo, filterField);
            if (!filterFieldDef || typeof filterValue !== "object") {
                resolvedValue = filterValue;
            } else {
                var displayField = filterFieldDef.displayField;
                var resolvedDisplayValue = Utils.resolveValue(filterValue, displayField);
                resolvedValue = typeof resolvedDisplayValue === "string" ? resolvedDisplayValue : JSON.stringify(resolvedDisplayValue);
            }
        }
        if (resolvedValue) {
            resolvedFilters[filterField] = {value:resolvedValue, label:filterLabel};
        }
    }
}