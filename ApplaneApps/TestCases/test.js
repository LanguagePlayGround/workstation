/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 26/12/13
 * Time: 5:58 PM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("ApplaneBaas/lib/shared/Constants.js");
var ApplaneCallback = require("ApplaneCore/apputil/ApplaneCallback.js");
var APIConstants = require("ApplaneCore/nodejsapi/Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
//
//var columnExpression = "countryid";
//var tableColumns = [];
//var columnValue = {"_id":"52e202bd5b6d75c4226ff111", "countryid":{"_id":"8a7d7ba288ca0f0ea1ecf975b026e8e1", "code":"2312", "name":"CHINA"}, "state":"CHINA"};
//var oldValue = {"code":"2312", "name":"CHINA", "_id":"8a7d7ba288ca0f0ea1ecf975b026e8e1"};
////var operation = {_id:"1001", "statename":"New Delhi"};
//var operation = {"code":"2312", "name":"CHINA1", "_id":"e270b41ef85fcf0c37a64a76df911063", "__type__":"update", "__updatedby":"5204c7600964c7dc09000001", "__updatedon":"2014-01-25T06:12:51.535Z"};
//var multiple = false;
//var persist = false;
//var displaycolumns = ["name", "code"];

var columnExpression = "stateid";
var tableColumns = [
    {"expression":"cityname", "type":"string"},
    {"expression":"stateid", "type":"lookup", "table":"states__northwind"}
];
var columnValue = {"_id":"100001", "cityname":"Hisar", "stateid":[
    {"_id":"1001", statename:"Delhi"},
    {"_id":"2001", "statename":"Haryana"}
]}
var oldValue = {_id:"1001", "statename":"Delhi"};
//var operation = {_id:"1001", "statename":"New Delhi"};
var operation = {_id:"3001", "statename":"New Delhi"};
var multiple = true;
var persist = false;
var displaycolumns = ["statename"];

//var columnExpression = "languages.stateid";
//var tableColumns = [
//    {"expression":"name", "type":"string"},
//    {"expression":"languages", "type":"object", columns:[
//        {"expression":"stateid", "type":"lookup", "table":"states__northwind"}
//    ]},
//    {"expression":"languages.stateid", "type":"lookup", "table":"states__northwind"}
//];
//var columnValue = {"_id":"100001", "name":"Sachin", "languages":[
//    {"_id":"5001", "name":"Hindi", "stateid":{"_id":"1001", statename:"Delhi"}},
//    {"_id":"5002", "name":"English", "stateid":{"_id":"1002", statename:"Haryana"}}
//]};
//var oldValue = {_id:"1001", "statename":"Delhi"};
////var operation = {_id:"1001", "statename":"New Delhi"};
//var operation = {_id:"3001", "statename":"New Delhi"};
//var multiple = false;
//var persist = false;
//var displaycolumns = ["statename"];


//var columnExpression = "languages.stateid";
//var tableColumns = [
//    {"expression":"name", "type":"string"},
//    {"expression":"languages", "type":"object", columns:[
//        {"expression":"stateid", "type":"lookup", "table":"states__northwind"}
//    ]},
//    {"expression":"languages.stateid", "type":"lookup", "table":"states__northwind"}
//];
//var columnValue = {"_id":"100001", "name":"Sachin", "languages":[
//    {"_id":"5001", "name":"Hindi", "stateid":[
//        {"_id":"1001", statename:"Delhi"},
//        {"_id":"2001", statename:"Haryana"}
//    ]} ,
//    {"_id":"5002", "name":"English", "stateid":[
//        {"_id":"1002", statename:"Gujrat"},
//        {"_id":"2002", statename:"Panjab"}
//    ]}
//]};
//var oldValue = {_id:"1001", "statename":"Delhi"};
////var operation = {_id:"1001", "statename":"New Delhi"};
//var operation = {_id:"3001", "statename":"New Delhi"};
//var multiple = true;
//var persist = false;
//var displaycolumns = ["statename"];

var columnExpression = "languages.cities.stateid";
var tableColumns = [
    {"expression":"name", "type":"string"},
    {"expression":"languages", "type":"object", columns:[
        {"expression":"cities", "type":"object", "columns":[
            {"expression":"stateid", "type":"lookup", "table":"states__northwind"}
        ]}
    ]},
    {"expression":"languages.cities.stateid", "type":"lookup", "table":"states__northwind"}
];
var columnValue = {"_id":"100001", "name":"Sachin", "languages":[
    {"_id":"5001", "name":"Hindi", cities:[
        {"_id":"10000001", "cityname":"Rohini", "stateid":{"_id":"1001", statename:"Delhi"}},
        {"_id":"10000002", "cityname":"Hisar", "stateid":{"_id":"1004", statename:"Haryana"}}
    ]},
    {"_id":"5002", "name":"English", cities:[
        {"_id":"10000001", "cityname":"Rohtak", "stateid":{"_id":"1004", statename:"Haryana"}},
        {"_id":"10000002", "cityname":"Pitampura", "stateid":{"_id":"1005", statename:"Gujrat"}}
    ]}
]};
var oldValue = {_id:"1001", "statename":"Delhi"};
//var operation = {_id:"1001", "statename":"New Delhi"};
var operation = {_id:"3001", "statename":"New Delhi"};
var multiple = false;
var persist = false;
var displaycolumns = ["statename"];


var result = handleDottedColumns(columnExpression, tableColumns, columnValue, oldValue, operation, multiple, persist, displaycolumns);
console.log("result >>>>>>>>>>" + JSON.stringify(result));

function populateDisplayValueToUpdate(row, operation, oldValue, displayColumns) {
    row[APIConstants.Query._ID] = operation[APIConstants.Query._ID];
    for (var i = 0; i < displayColumns.length; i++) {
        var displayColumn = displayColumns[i];
        row[displayColumn] = operation[displayColumn];
    }
    row.$noquery = 1;
}

function handleDottedColumns(columnExpression, tableColumns, result, oldValue, operation, multiple, persist, displayColumns) {
    var indexOf = columnExpression.indexOf(".");
    if (indexOf != -1) {
        var firstPart = columnExpression.substr(0, indexOf);
        var secondPart = columnExpression.substr(indexOf + 1);
        var columnValue = result[firstPart];
        if (columnValue) {
            for (var i = 0; i < tableColumns.length; i++) {
                var tableColumn = tableColumns[i];
                var columnType = tableColumn[Constants.Baas.Tables.Columns.TYPE];
                var expression = tableColumn[Constants.Baas.Tables.Columns.EXPRESSION];
                if (expression == firstPart && (columnType == Constants.Baas.Tables.Columns.Type.OBJECT || (columnType == Constants.Baas.Tables.Columns.Type.LOOKUP && persist))) {
                    var innerColumns = tableColumn[Constants.Baas.Tables.COLUMNS];
                    var updates = null;
                    if (Utils.isJSONObject(columnValue)) {
                        updates = handleDottedColumns(secondPart, innerColumns, columnValue, oldValue, operation, multiple, persist, displayColumns);
                        if (updates) {
                            updates[APIConstants.Query._ID] = columnValue[APIConstants.Query._ID];
                        }
                    } else {
                        for (var j = 0; j < columnValue.length; j++) {
                            var row = columnValue[j];
                            var populatedData = handleDottedColumns(secondPart, innerColumns, row, oldValue, operation, multiple, persist, displayColumns);
                            if (populatedData) {
                                populatedData[APIConstants.Query._ID] = row[APIConstants.Query._ID];
                                updates = updates || [];
                                updates.push(populatedData);
                            }
                        }
                    }
                        if (updates) {
                            var updateToReturn = {};
                            updateToReturn[firstPart] = updates;
                            return updateToReturn;
                        }
                }
            }
        }
    } else {
        return handleSimpleColumns(columnExpression, multiple, displayColumns, result, oldValue, operation);
    }
}

function handleSimpleColumns(columnExpression, multiple, displayColumns, result, oldValue, operation) {
    var columnValue = result[columnExpression];
    if (columnValue) {
        var update = false;
        if (multiple) {
            for (var i = 0; i < columnValue.length; i++) {
                var row = columnValue[i];
                if (row[APIConstants.Query._ID] == oldValue[APIConstants.Query._ID]) {
                    update = true;
                    populateDisplayValueToUpdate(row, operation, oldValue, displayColumns);
                }
            }
        } else {
            if (columnValue[APIConstants.Query._ID] == oldValue[APIConstants.Query._ID]) {
                update = true;
                populateDisplayValueToUpdate(columnValue, operation, oldValue, displayColumns);

            }
        }
        if (update) {
            var updateOperation = {};
            updateOperation[columnExpression] = {data:columnValue, override:true};
            return updateOperation;
        }
    }
}

//function handleSimpleColumns(columnExpression, multiple, displayColumns, result, oldValue, operation) {
//    var columnValue = result[columnExpression];
//    if (columnValue) {
//        if (multiple) {
//            for (var i = 0; i < columnValue.length; i++) {
//                var row = columnValue[i];
//                if (row[APIConstants.Query._ID] == oldValue[APIConstants.Query._ID]) {
//                    populateDisplayValueToUpdate(row, operation, oldValue, displayColumns);
//                    var newValues = [];
//                    newValues.push({_id:oldValue[APIConstants.Query._ID], __type__:"delete"});
//                    newValues.push(row);
//                    var updateOperation = {};
//                    updateOperation[columnExpression] = newValues;
//                    return updateOperation;
//                }
//            }
//        } else {
//            if (columnValue[APIConstants.Query._ID] == oldValue[APIConstants.Query._ID]) {
//                populateDisplayValueToUpdate(columnValue, operation, oldValue, displayColumns);
//                var updateOperation = {};
//                updateOperation[columnExpression] = {data:columnValue, override:true};
//                return updateOperation;
//            }
//        }
//    }
//}

//{"languages":[{"stateid":[{"_id":"3001","statename":"New Delhi","$noquery":1},{"_id":"3001","statename":"New Delhi","$noquery":1}],"_id":"5001"}]}