/**
 * Created by ashu on 24/6/14.
 */


var Q = require('q');
var Utils = require("ApplaneCore/apputil/util.js");

var fieldNameMapping = {0: "A", 1: "B", 2: "C", 3: "D", 4: "E", 5: "F", 6: "G", 7: "H", 8: "I", 9: "J", 10: "K", 11: "L", 12: "M", 13: "N", 14: "O", 15: "P", 16: "Q", 17: "R", 18: "S", 19: "T", 20: "U", 21: "V", 22: "W", 23: "X", 24: "Y", 25: "Z",
    26: "AA", 27: "AB", 28: "AC", 29: "AD", 30: "AE", 31: "AF", 32: "AG", 33: "AH", 34: "AI", 35: "AJ", 36: "AK", 37: "AL", 38: "AM", 39: "AN", 40: "AO", 41: "AP", 42: "AQ", 43: "AR", 44: "AS", 45: "AT", 46: "AU", 47: "AV", 48: "AW", 49: "AX", 50: "AY", 51: "AZ",
    52: "BA", 53: "BB", 54: "BC", 55: "BD", 56: "BE", 57: "BF", 58: "BG", 59: "BH", 60: "BI", 61: "BJ", 62: "BK", 63: "BL", 64: "BM", 65: "BN", 66: "BO", 67: "BP", 68: "BQ", 69: "BR", 70: "BS", 71: "BT", 72: "BU", 73: "BV", 74: "BW", 75: "BX", 76: "BY", 77: "BZ",
    78: "CA", 79: "CB", 80: "CC", 81: "CD", 82: "CE", 83: "CF", 84: "CG", 85: "CH", 86: "CI", 87: "CJ", 88: "CK", 89: "CL", 90: "CM", 91: "CN", 92: "CO", 93: "CP", 94: "CQ", 95: "CR", 96: "CS", 97: "CT", 98: "CU", 99: "CV", 100: "CW", 101: "CX", 102: "CY", 103: "CZ",
    104: "DA", 105: "DB", 106: "DC", 107: "DD", 108: "DE", 109: "DF", 110: "DG", 111: "DH", 112: "DI", 113: "DJ", 114: "DK", 115: "DL", 116: "DM", 117: "DN", 118: "DO", 119: "DP", 120: "DQ", 121: "DR", 122: "DS", 123: "DT", 124: "DU", 125: "DV", 126: "DW", 127: "DX", 128: "DY", 129: "DZ",
    130: "EA", 131: "EB", 132: "EC", 133: "ED", 134: "EE", 135: "EF", 136: "EG", 137: "EH", 138: "EI", 139: "EJ", 140: "EK", 141: "EL", 142: "EM", 143: "EN", 144: "EO", 145: "EP", 146: "EQ", 147: "ER", 148: "ES", 149: "ET", 150: "EU", 151: "EV", 152: "EW", 153: "EX", 154: "EY", 155: "EZ",
    156: "FA", 157: "FB", 158: "FC", 159: "FD", 160: "FE", 161: "FF", 162: "FG", 163: "FH", 164: "FI", 165: "FJ", 166: "FK", 167: "FL", 168: "FM", 169: "FN", 170: "FO", 171: "FP", 172: "FQ", 173: "FR", 174: "FS", 175: "FT", 176: "FU", 177: "FV", 178: "FW", 179: "FX", 180: "FY", 181: "FZ",
    182: "GA", 183: "GB", 184: "GC", 185: "GD", 186: "GE", 187: "GF", 189: "GG", 190: "GH", 191: "GI", 192: "GJ", 193: "GK", 194: "GL", 195: "GM", 196: "GN", 197: "GO", 198: "GP", 199: "GQ"
};

exports.importExcelData = function (req, db) {
    var mapping = JSON.parse(req.param("mapping"));
    var fileKey = req.param("fileKey");
    var moduleName = req.param("moduleName");
    return require("./ImportExcelService").portExcelData({fileKey: fileKey, mapping: mapping, moduleName: moduleName}, db);
}

exports.portExcelData = function (params, db) {
    var fileKey = params.fileKey;
    var mapping = params.mapping;
    var moduleName = params.moduleName;
    return db.downloadFile(fileKey).then(function (file) {
        if (moduleName && moduleName === "xlsx") {
            return processConversion(file, mapping);
        } else {
            return processConversion1(file, mapping);
        }
    })
}

exports.portNewExcelData = function (params, db) {
    var fileKey = params.fileKey;
    var mapping = params.mapping;
    var collection = params.collection;
    var fields = params.fields;
    var mappingType = params.mappingType;
    var primaryColumns = {};
    var fieldInfos = {};
    return db.collection(params.collection).then(
        function (collectionObj) {
            var collectionFields= collectionObj.getValue("fields");
            populatePrimaryColumnsAndFieldInfos(collectionFields, fieldInfos, primaryColumns);
            populatePrimaryColumnsAndFieldInfos(fields, fieldInfos, primaryColumns);
        }).then(
        function () {
            return db.downloadFile(fileKey);
        }).then(function (file) {
            var parsedData = require("node-xlsx").parse(file.data);
            if ((!parsedData) || (!parsedData.worksheets) || parsedData.worksheets.length == 0) {
                return [];
            }
            var sheetData = undefined;
            if (mappingType === "labelBased") {
                sheetData = readNewExcelDataXLSX(parsedData.worksheets[0], mapping, primaryColumns);
            } else {
                sheetData = readExcelDataXLSX(parsedData.worksheets[0], mapping, true);
            }

            var newRecords = [];
            require("./ImportExcelService.js").populateSheetData(sheetData, newRecords, fieldInfos, primaryColumns);
            return newRecords;
        })
}

function populatePrimaryColumnsAndFieldInfos(fields, fieldInfos, primaryColumns) {
    if (!fields || fields.length === 0) {
        return;
    }
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var fieldName = field.field;

        if (field.type !== undefined) {
            fieldInfos[fieldName] = fieldInfos[fieldName] || {};
            fieldInfos[fieldName].$type = field.type;
        }
        if (field.multiple !== undefined) {
            fieldInfos[fieldName] = fieldInfos[fieldName] || {};
            fieldInfos[fieldName].$multiple = field.multiple;
        }
        if (field.primary) {
            primaryColumns.$self = fieldName;
        }
        if (field.fields && field.fields.length > 0) {
            primaryColumns[fieldName] = primaryColumns[fieldName] || {};
            fieldInfos[fieldName] = fieldInfos[fieldName] || {};
            populatePrimaryColumnsAndFieldInfos(field.fields, fieldInfos[fieldName], primaryColumns[fieldName]);
        }
    }

}

function processConversion1(file, mapping) {
    var nodeXLSX = require("node-xlsx");
    var parsedData = nodeXLSX.parse(file.data);
    if ((!parsedData) || (!parsedData.worksheets) || parsedData.worksheets.length == 0) {
        return [];
    }
    var sheetData = readExcelDataXLSX(parsedData.worksheets[0], mapping, false);
    var newRecords = [];
    resolveSheetData(sheetData, newRecords);
    return newRecords;
}

function processConversion(file, mapping) {
    var XLSXModule = require('xlsx');
    var xlsx = XLSXModule.read(file.data, {type: "binary"});
    var sheet = xlsx.Sheets[xlsx.SheetNames[0]];
    var sheetData = readExcelData(sheet, mapping);
    var newRecords = [];
    resolveSheetData(sheetData, newRecords);
    return newRecords;
}

function readExcelDataXLSX(sheet, mapping, jsonFormat) {

    var sheetData = [];
    if ((!sheet) || (!sheet.data) || (sheet.data.length < 2)) {
        return sheetData;
    }
//    var fieldNames = {};
//    var header = sheet.data[0];
//    for (var i = 0; i < header.length; i++) {
//        fieldNames[i] = header[i].value;
//
//    }
    for (var i = 1; i < sheet.data.length; i++) {
        var row = sheet.data[i];
        if ((!row) || row === null || row === undefined) {
            continue;
        }
        var record = {};
        for (var j = 0; j < row.length; j++) {
            var cell = row[j];
            if (!cell || cell.value === undefined || cell.value === null || cell.value.toString() === "NaN" || cell.value.toString() === "Invalid Date") {
                continue;
            }
            var key = fieldNameMapping[j];
            if (mapping[key]) {
                if (jsonFormat) {
                    Utils.putDottedValue(record, mapping[key], cell.value);
                } else {
                    record[mapping[key]] = cell.value;
                }
            }
        }
        if (Object.keys(record).length > 0) {
            sheetData.push(record);
        }
    }
    return sheetData;
}

/*
 * For new excel file, top Primary column must occur before any multiple type column.
 * Records in the multiple type must come in batch.
 * In multiple batches, there must be a primary column in all batches and that must be first column for multiple each batch
 *
 * */


function readNewExcelDataXLSX(sheet, mapping, primaryColumns) {
    var topSeperatorColumn = undefined;
    var topSeperatorValue = undefined;
    if (primaryColumns && primaryColumns.$self) {
        topSeperatorColumn = primaryColumns.$self;
    }
    var sheetData = [];
    if ((!sheet) || (!sheet.data) || (sheet.data.length < 2)) {
        return sheetData;
    }

    var fieldNames = {};
    var header = sheet.data[0];
    for (var i = 0; i < header.length; i++) {
        fieldNames[i] = header[i].value;
    }
    for (var i = 1; i < sheet.data.length; i++) {
        var row = sheet.data[i];
        if ((!row) || row === null || row === undefined) {
            continue;
        }
        var record = {};
        for (var j = 0; j < row.length; j++) {
            var cell = row[j];
            if (!cell || cell.value === undefined || cell.value === null || cell.value.toString() === "NaN" || cell.value.toString() === "Invalid Date") {
                continue;
            }
            var key = fieldNames[j];
            if (mapping[key]) {
                var index = mapping[key].indexOf(".");
                if (index > 0) {
                    var firstPart = mapping[key].substring(0, index);
                    var secondPart = mapping[key].substring(index + 1);
                    if (primaryColumns[firstPart] && primaryColumns[firstPart].$self) {
                        var seperatorColumn = primaryColumns[firstPart].$self;
                        handleMultipleData(topSeperatorColumn, topSeperatorValue, seperatorColumn, secondPart, sheetData, mapping[key], cell.value);
                    } else {
                        //case for top level fk fields
                        Utils.putDottedValue(record, mapping[key], cell.value);
                    }
                } else {
                    if (mapping[key] === topSeperatorColumn) {
                        topSeperatorValue = cell.value;
                    }
                    record[mapping[key]] = cell.value;
                }
            }
        }
        if (Object.keys(record).length > 0) {
            sheetData.push(record);
        }
    }
    return sheetData;
}

function handleMultipleData(topSeperatorColumn, topSeperatorValue, seperatorColumn, secondPart, sheetData, key, value) {
    if (seperatorColumn && (seperatorColumn === secondPart)) {
        var newRecord = {};
        newRecord[topSeperatorColumn] = topSeperatorValue;
        sheetData.push(newRecord);
    }
    if (sheetData && sheetData.length > 0) {
        var lastRecord = sheetData[sheetData.length - 1];
        Utils.putDottedValue(lastRecord, key, value);
    }
}

function readExcelData(sheet, mapping) {
    var sheetData = [];
    var lastIndex = -1;
    var record = undefined;
    for (var z in sheet) {
        if (z.indexOf('!') >= 0) {
            continue;
        }
        var index = z.replace(/\D/g, '');
        var key = z.replace(/\d+/g, '');
        index = parseInt(index);
        if (index == 1) {
            continue;
        }
        if (lastIndex != index) {
            record = {};
            sheetData.push(record);
            lastIndex = index;
        }
        if (mapping[key]) {
            record[mapping[key]] = sheet[z].w;
        }
    }
    return sheetData;
}

exports.populateSheetData = function (sheetData, newRecords, fieldInfos, primaryColumns) {
    for (var i = 0; i < sheetData.length; i++) {
        resolveData(sheetData[i], newRecords, fieldInfos, primaryColumns);
    }

}

function resolveData(recordToPort, portedData, fieldInfo, primaryColumns) {
    var portedRecord = getPrimaryRecord(portedData, recordToPort, primaryColumns);
    if (!portedRecord) {
        portedRecord = {};
        portedData.push(portedRecord);
    }
    mergeRecord(recordToPort, portedRecord, fieldInfo, primaryColumns);
}

function getPrimaryRecord(data, record, primaryColumns) {
    if (!primaryColumns || !primaryColumns.$self) {
        return;
    }
    var primaryColumnValue = record[primaryColumns.$self];
    if (primaryColumnValue === undefined) {
        return;
    }
    for (var j = 0; j < data.length; j++) {
        var dataRecord = data[j];
        if (dataRecord[ primaryColumns.$self] === primaryColumnValue) {
            return dataRecord;
        }
    }
}

function mergeRecord(recordToMerge, recordInMerge, fieldInfo, primaryColumns) {
    for (var key in recordToMerge) {
        var value = recordToMerge[key];
        var keyFieldInfo = fieldInfo ? fieldInfo[key] : undefined;
        var keyPrimaryColumns = primaryColumns ? primaryColumns[key] : undefined;
        var isMultiple = keyFieldInfo ? keyFieldInfo.$multiple : false;
        if (isMultiple) {
            recordInMerge[key] = recordInMerge[key] || [];
            resolveData(value, recordInMerge[key], keyFieldInfo, keyPrimaryColumns);
        } else if (Utils.isJSONObject(value)) {
            recordInMerge[key] = recordInMerge[key] || {};
            mergeRecord(value, recordInMerge[key], keyFieldInfo, keyPrimaryColumns);
        } else {
            if (keyFieldInfo && keyFieldInfo.$type === "date") {
                if (typeof value === "number") {
                    recordInMerge[key] = excelDateToJSDate(value);
                } else if (typeof value === "object" && value.getDate) {
                    recordInMerge[key] = setDateWithZeroTimezone(value);
                } else {
                    recordInMerge[key] = value;
                }
            } else {
                recordInMerge[key] = value;
            }
        }
    }
}

function setDateWithZeroTimezone(dateToSet) {
    var utcDate = new Date("2014-01-10"); //to sove utc and curent time zone issue on end date like 1 sep, ...
    utcDate.setUTCFullYear(dateToSet.getFullYear());
    utcDate.setUTCMonth(dateToSet.getMonth());
    utcDate.setUTCDate(dateToSet.getDate());
    utcDate.setUTCHours(0);
    utcDate.setUTCMinutes(0);
    utcDate.setUTCSeconds(0);
    utcDate.setUTCMilliseconds(0);
    return utcDate;
}

function excelDateToJSDate(date) {
    return new Date(Math.round((date - 25569) * 86400 * 1000));
}

function resolveSheetData(records, newRecords) {
    for (var i = 0; i < records.length; i++) {
        var record = records[i];
        var keys = Object.keys(record);
        var isNewRecord = true;
        for (var j = 0; j < keys.length; j++) {
            if (keys[j].indexOf(".$.") !== -1) {
                isNewRecord = false;
                break;
            }
        }
        if (isNewRecord) {
            newRecords.push({});
        }
        resolve(newRecords[newRecords.length - 1], record);
    }
}

function resolve(newRecord, record) {
    var fields = Object.keys(record);
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        populate(newRecord, field, record[field], false, undefined, (i == 0 ? true : false));
    }
}

function populate(record, field, fieldValue, multiple, pField, isNew) {
    var indexOf = field.indexOf(".");
    if (indexOf > 0) {
        var firstPart = field.substring(0, indexOf);
        var secondPart = field.substring(indexOf + 1);
        if (secondPart.indexOf("$.") === 0) {
            multiple = true;
            secondPart = secondPart.substring(2);
        } else {
            multiple = false;
        }
        var innerRecord = record;
        if (secondPart.indexOf(".") !== -1) {
            record[firstPart] = record[firstPart] || [
                {}
            ];
            innerRecord = record[firstPart];
            if (Array.isArray(innerRecord)) {
                innerRecord = innerRecord[innerRecord.length - 1];
            }
        }
        populate(innerRecord, secondPart, fieldValue, multiple, firstPart, isNew);
    } else {
        if (pField) {
            if (multiple) {
                record[pField] = record[pField] || [];
                if (isNew) {
                    record[pField].push({});
                }
                record[pField][record[pField].length - 1][field] = fieldValue;
            } else {
                record[pField] = record[pField] || {};
                record[pField][field] = fieldValue;
            }
        } else {
            record[field] = fieldValue;
        }
    }
}
