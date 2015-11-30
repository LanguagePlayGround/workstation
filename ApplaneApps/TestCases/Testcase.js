/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 5/3/14
 * Time: 5:40 PM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("ApplaneBaas/lib/shared/Constants.js");
var ApplaneCallback = require("ApplaneCore/apputil/ApplaneCallback.js");
var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
var MongodbManager = require("ApplaneBaas/lib/database/mongodb/MongoDBManager.js");
var ReferenceDataPorting = require("ApplaneBaas/lib/customcode/baas/ReferenceDataPorting.js");
var OPTIONS = {ask:"baas", autocommit:true, disablelogs:true};
var ejs = require('ejs');

//var template = ejs.render("Username : <%=username%>", {username:"sachin"});
//console.log(template);

//var exp = "a.b.__createdo";
//
//
//console.log(/^((?!__createdon).)*$/.test(exp));


//var organizations = [
//    {"_id":"a6ba761adef87f999944c8af9ebc4786", "id":"demoui", "osk":"52fc944e8150a83f25c2a3ed"},
//    {"id":"global", "osk":"52301c08dda05ef40700001f", "_id":"9c70933aff6b2a6d08c687a6cbb6b765"},
//    {"_id":"f771ac9bb3698b0374ec8af2c83562cf", "id":"daffodil", "osk":"daffodil"}
//];
//
//Utils.iterateArrayAsync(organizations, function (err) {
//    console.log("final called..");
//}, function (organization, callback) {
//    console.log("organization >>>>>>>>>>" + JSON.stringify(organization));
//    callback();
//})

//var string = "businessfunction._id";
//console.log(string.replace(/\./g, "_"));
//
//console.log(parseInt(0 % 6));

var result = [
    {"_id":"Income", "accountgroup":"Income","grouptotal":{"_id":"Income", "vliamount":-500, "vlis_accountgroupid__id":"Income"}}
];
var subQueryResult = [
    {"_id":"Services", "account":"Services", "accountgroupid._id":"Income"}
];
var fieldKey = "accounts";
var fieldvalue = {"$query":{"$collection":"accounts", "$fields":{"account":1}, "$fk":{"accountgroupid":"accountgroups"}, "$filter":{"accountgroupid._id":"Income"}}, "$fk":"accountgroupid._id", "$parent":"_id"};
var type = "scalar";
mergeResult(result, subQueryResult, fieldKey, fieldvalue, type);
function mergeResult(result, subQueryResult, fieldKey, fieldValue, type) {
    console.log("mergeResultCalled...");
    for (var i = 0; i < result.length; i++) {
        var row = result[i];
        if (fieldKey.indexOf(".") != -1) {
            var fieldKeyResult = Utils.resolveValue(row, fieldKey.substring(0, fieldKey.indexOf(".")));
            if (!(Array.isArray(fieldKeyResult))) {
                fieldKeyResult = [fieldKeyResult];
            }
            mergeResult(fieldKeyResult, subQueryResult, fieldKey.substring(fieldKey.indexOf(".") + 1), fieldValue, type);
        } else {
            var parentColumnValue = Utils.resolveValue(row, fieldValue.$parent);
            console.log(">>>>>>>>>>parentColumnValue>>>>>>>>>>>>" + JSON.stringify(parentColumnValue));
            if (parentColumnValue) {
                if (!(Array.isArray(parentColumnValue))) {
                    parentColumnValue = [parentColumnValue];
                }
                var fkColumnAlias = fieldValue.$query.$group ? fieldValue.$fk.replace(/\./g, "_") : fieldValue.$fk;
                console.log(">>>>>>>>>>fkColumnAlias>>>>>>>>>>>>" + JSON.stringify(fkColumnAlias));
                var dataArray = [];
                for (var j = 0; j < parentColumnValue.length; j++) {
                    for (var k = 0; k < subQueryResult.length; k++) {
                        var subQueryRow = subQueryResult[k];
                        var fkColumnValue = Utils.resolveValue(subQueryRow, fkColumnAlias);
                        if (fkColumnValue && (fkColumnValue === parentColumnValue[j] || (Array.isArray(fkColumnValue) && fkColumnValue.indexOf(parentColumnValue[j]) != -1))) {
//                            populateIdColumnValue(subQueryRow, fkColumnAlias);
                            //Doubt need to delete alias result or not
//                    delete  subQueryRow[fkColumnAlias];
//                            console.log("matched........." + JSON.stringify(subQueryRow));
                            dataArray.push(subQueryRow);
                        }
                    }
                }
                row[fieldKey] = (type == "scalar") ? (dataArray.length > 0 ? dataArray[0] : {}) : dataArray;
            }
        }
    }
}

console.log("result >>>>>>>>>>>>>" + JSON.stringify(result));