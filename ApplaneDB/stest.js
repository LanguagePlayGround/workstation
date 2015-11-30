
//var updates = {};
//var vouchersArray = ["A"];
//if (!updates.not_create_voucher_for_invoice && vouchersArray && vouchersArray.length > 0) {
//    console.log("if....")
////    return;
//}else{
//    console.log("not if")
////    return;
//}
//
//
var ObjectId = require("mongodb").ObjectID;
var a = ObjectId("5527d783bdde866e7fef9f93");
var date = a.getTimestamp();
console.log(date);
//
//
////return;
//var expect = require('chai').expect;
//var ApplaneDB = require("ApplaneDB");
//var NorthwindDb = require("./test/NorthwindDb.js");
//var Utils = require("ApplaneCore/apputil/util.js");
//var Constants = require("./lib/Constants.js");
//var OPTIONS = {username:"northwind", password:"northwind"};
//var Document = require("./public/js/Document.js");
//var ApplaneConfig = require("./Config.js");
//ApplaneConfig.MongoAdmin.DB = "admin";
//ApplaneConfig.MongoAdmin.USER_NAME = "admin"
//ApplaneConfig.MongoAdmin.PASSWORD = "damin"
//
//ApplaneConfig.Admin.DB = "business";
//ApplaneConfig.Admin.USER_NAME = "admin"
//ApplaneConfig.Admin.PASSWORD = "damin"
//ApplaneConfig.URL = "mongodb://192.168.100.11:27018";
//
//
////cash account allready esists
//
//var requiredJS = require("requirejs");
//console.log(process.cwd())
//requiredJS.config({baseUrl:process.cwd() + "/node_modules/AFBSourceClient/node_modules"});
//
//var invoices1 = {
//    collection:"invoices", fields:[
//        {field:"invoice_no", type:"string"},
//        {field:"invoice_date", type:"date"},
//        {field:"totalamt", type:"number"} ,
//        {field:"totalstax", type:"number"} ,
//        {field:"totalnet", type:"number"},
//        {field:"damt", type:"number"},
//        {field:"invoicelineitems", type:"object", multiple:true, fields:[
//            {field:"line_no", type:"string"},
//            {field:"amt", type:"number"},
//            {field:"stax", type:"number"},
//            {field:"net", type:"number"},
//            {field:"damt", type:"number"},
//            {field:"deductions", multiple:true, type:"object", fields:[
//                {field:"deduction_no", type:"string"},
//                {field:"damt", type:"number"}
//            ]}
//        ]},
//        {field:"invoicelineitems", type:"object", multiple:true, fields:[
//            {field:"line_no", type:"string"},
//            {field:"amt", type:"number"},
//            {field:"stax", type:"number"},
//            {field:"net", type:"number"},
//            {field:"damt", type:"number"},
//            {field:"deductions", multiple:true, type:"object", fields:[
//                {field:"deduction_no", type:"string"},
//                {field:"damt", type:"number"}
//            ]}
//        ]}
////        {field:"invoicelineitems1", type:"object", multiple:true, fields:[
////            {field:"invoice_no", type:"string"},
////            {field:"amt", type:"number"},
////            {field:"stax", type:"number"},
////            {field:"net", type:"number"}
////        ]}
//    ], events:[
//        {event:'onInsert', function:"Invoicess.onInsertInvoice"},
//        {event:'onInsert:[{"invoicelineitems":[]},{"invoicelineitems1":[]}]', function:"Invoicess.onInsertLineItems"},
//        {event:'onInsert:[{"invoicelineitems":[{"deductions":[]}]}]', function:"Invoicess.onInsertDeductions"},
//        {event:'onValue:[{"invoicelineitems":[{"deductions":["damt"]}]}]', function:"Invoicess.deductionVat"},
//        {event:'onValue:[{"invoicelineitems":[{"deductions":["damt"]}]}]', function:"Invoicess.lineItemDamt"},
//        {event:'onValue:[{"invoicelineitems":["damt"]}]', function:"Invoicess.lineItemDamt"},
//        {event:'onValue:[{"invoicelineitems":[{"deductions":["vat"]}]}]', function:"Invoicess.deductionnetamt"},
//        {event:'onValue:["totalstax"]', function:"Invoicess.invoiceNetAmt"},
//        {event:'onValue:[{"invoicelineitems":["amt"]},{"invoicelineitems1":["amt"]}]', function:"Invoicess.lineItemStax"},
//        {event:'onValue:[{"invoicelineitems":["stax"]},{"invoicelineitems1":["stax"]}]', function:"Invoicess.lineItemNet"},
//        {event:'onValue:[{"invoicelineitems":["amt"]},{"invoicelineitems1":["amt"]}]', function:"Invoicess.invoiceAmt"},
//        {event:'onValue:[{"invoicelineitems":["stax"]},{"invoicelineitems1":["stax"]}]', function:"Invoicess.invoiceStaxAmt"},
//        {event:'onValue:[{"invoicelineitems":["net"]},{"invoicelineitems1":["net"]}]', function:"Invoicess.LineItemNetWord"},
//        {event:'onValue:["totalnet"]', function:"Invoicess.NetWord"},
//        {event:"onSave", pre:true, function:"Invoicess.onPreSave"},
//        {event:"onSave", post:true, function:"Invoicess.onPostSave"}
//
//
//    ]
//}
//
//var bills = {
//    collection:"bills", fields:[
//        {field:"qty", type:"number"},
//        {field:"rate", type:"decimal"},
//
//        {field:"detail", type:"object", fields:[
//            {field:"qty1", type:"number"},
//            {field:"rate1", type:"decimal"},
//            {field:"amount1", type:"number"}
//        ]}
//
////        {field:"invoicelineitems1", type:"object", multiple:true, fields:[
////            {field:"invoice_no", type:"string"},
////            {field:"amt", type:"number"},
////            {field:"stax", type:"number"},
////            {field:"net", type:"number"}
////        ]}
//    ], events:[
//        {event:'onValue:["rate","qty"]', function:"Bills1.calculateAmt"},
//        {event:'onValue:[{"detail":["rate1","qty1"]}]', function:"Bills1.calculateAmt1"},
//        {event:'onValue:[{"detail":["amount1"]}]', function:"Bills1.calculateDetailAmt"}
//    ]
//}
//
//var countriess = {"__type__":"insert", "_id":"5382d3ddd6db21a80e000377", "collection":"Countries", "events":[
//    {"event":"onInsert", "function":"countriess.onCountryInsert", "_id":"538736d37668fbb0160001d1"},
//    {"event":"onSave", "function":"countriess.onCountryPreSave", "pre":true, "_id":"5387420c636fba701d000029"},
//    {"event":"onInsert:[{\"country_states\":[]}]", "function":"countriess.onStateInsert", "_id":"53874440636fba701d0000b6"},
//    {"event":"onValue:[{\"country_states\":[\"state_name\"]}]", "function":"countriess.onStateName", "_id":"538748c81e0999f01e000031"}
//], "fields":[
//
//    {"field":"country_code", "index":20, "indexGrid":10.625, "label":"Code", "type":"string", "ui":"text", "visibility":true},
//    {"field":"country_states", "index":30, "label":"States", "multiple":true, "type":"object", "ui":"grid", "visibility":false, "visibilityForm":true, "when":"", "fields":[
//        {"field":"state_code", "index":50, "indexForm":null, "indexGrid":null, "label":"State Code", "parentfieldid":{"_id":"5382d4a5d6db21a80e0003c9", "field":"country_states"}, "type":"string", "ui":"text", "uiGrid":"", "visibility":false, "visibilityForm":true, "when":"", "whenForm":"", "whenGrid":""},
//        {"field":"state_city", "label":"City", "type":"object", "ui":"grid", "parentfieldid":{"_id":"5382d4a5d6db21a80e0003c9", "field":"country_states"}, "when":"", "multiple":true, "visibilityForm":true, "whenGrid":"", "uiGrid":"", "collectionid":{"collection":"Countries", "_id":"5382d3ddd6db21a80e000377"}, "__type__":"insert", "_id":"5382d72ed6db21a80e0005a9", "fields":[
//            {"field":"city_name", "label":"Name", "type":"string", "ui":"text", "parentfieldid":{"field":"state_city", "_id":"5382d72ed6db21a80e0005a9"}, "when":"", "visibilityForm":true, "whenGrid":"", "uiGrid":"", "collectionid":{"collection":"Countries", "_id":"5382d3ddd6db21a80e000377"}, "__type__":"insert", "_id":"5382d74fd6db21a80e0005bc"},
//            {"field":"city_code", "label":"Code", "type":"string", "ui":"text", "parentfieldid":{"field":"state_city", "_id":"5382d72ed6db21a80e0005a9"}, "when":"", "visibilityForm":true, "whenGrid":"", "whenForm":"", "uiGrid":"", "collectionid":{"collection":"Countries", "_id":"5382d3ddd6db21a80e000377"}, "__type__":"insert", "_id":"5382d76cd6db21a80e0005c9"},
//            {"field":"city_population", "label":"City population", "type":"number", "ui":"number", "parentfieldid":{"field":"state_city", "_id":"5382d72ed6db21a80e0005a9"}, "visibilityForm":true, "collectionid":{"collection":"Countries", "_id":"5382d3ddd6db21a80e000377"}, "_id":"538735d17668fbb01600017f"}
//        ]},
//        {"field":"state_name", "type":"string"},
//        {"field":"state_population", "label":"State population", "type":"number", "ui":"number", "parentfieldid":{"_id":"5382d4a5d6db21a80e0003c9", "field":"country_states"}, "visibilityForm":true, "collectionid":{"collection":"Countries", "_id":"5382d3ddd6db21a80e000377"}, "_id":"538735f57668fbb016000194"},
//        {"field":"state_date", "label":"state_date", "type":"date", "ui":"date", "parentfieldid":{"_id":"5382d4a5d6db21a80e0003c9", "field":"country_states"}, "visibilityForm":true, "collectionid":{"_id":"5382d3ddd6db21a80e000377", "collection":"Countries"}, "_id":"538743df636fba701d0000a5"},
//        {"field":"state_counter", "label":"state_counter", "type":"number", "ui":"number", "parentfieldid":{"_id":"5382d4a5d6db21a80e0003c9", "field":"country_states"}, "visibilityForm":true, "collectionid":{"_id":"5382d3ddd6db21a80e000377", "collection":"Countries"}, "_id":"538745680d9cb82017000089"},
//        {"field":"state_name_counter", "index":null, "label":"state_name_counter", "parentfieldid":{"_id":"5382d4a5d6db21a80e0003c9", "field":"country_states"}, "type":"number", "ui":"number", "visibilityForm":true}
//    ]},
//    {"field":"country_name", "index":10, "indexGrid":0, "label":"Name", "type":"string", "ui":"text", "visibility":true, "when":""},
//    {"field":"population", "index":2, "indexGrid":15, "label":"Population", "type":"number", "ui":"number", "visibility":true},
//    {"field":"country_date", "index":46, "label":"country_date", "type":"date", "ui":"date", "visibility":true},
//    {"field":"country_pre_save_counter", "index":null, "indexGrid":12.5, "label":"country_pre_save_counter", "type":"number", "ui":"number", "visibility":true},
//    {"field":"country_counter", "index":null, "indexGrid":11.25, "label":"country_counter", "type":"number", "ui":"number", "visibility":true}
//]}
//
//var functionsToRegister = [
//    {name:"Bills", source:"NorthwindTestCase/lib", type:"js"},
//    {name:"Invoicess", source:"NorthwindTestCase/lib", type:"js"},
//    {name:"Bills1", source:"NorthwindTestCase/lib", type:"js"},
//    {name:"countriess", source:"NorthwindTestCase/lib", type:"js"}
//
//]
//
//ApplaneDB.connect(ApplaneConfig.URL, "northwindclient", OPTIONS).then(
//    function (db) {
//
//        ApplaneDB.registerFunction(functionsToRegister).then(function () {
//
//            var type = "upsertwith_id";
//            console.log(type)
//
//            if (type == "upsertwith_id") {
//                var updates = [
//                    {$collection:"productds", $upsert:{$query:{name:"Applane"}}},
//                    {$collection:"productds", $upsert:{$query:{name:"Applane"}}},
//                    {$collection:"productds", $upsert:{$query:{name:"Applane"}}},
//                    {$collection:"productds", $upsert:{$query:{name:"Applane"}}}
//                ]
//                for (var i = 0; i < updates.length; i++) {
//                    db.update(updates[i]).then(
//                        function (result) {
//                            console.log("result>>>>>" + JSON.stringify(result));
//                        }).fail(function (err) {
//                            console.log("error>>>>" + err.stack)
//                        })
//                }
//
//            } else
//            if (type == "insert") {
//                var invoice = {invoice_no:1111, invoicelineitems:{$insert:[
//                    {amt:1000},
//                    {amt:5000},
//                    {amt:10000}
//                ]}, invoicelineitems1:{$insert:[
//                    {amt:1000},
//                    {amt:5000}
//                ]}};
//
//                var invoice = {invoice_no:1111, invoicelineitems:{$insert:[
//                    {amt:1000},
//                    {amt:5000},
//                    {amt:10000}
//                ]}};
//
//
//                var invoice = {invoice_no:1111, invoicelineitems:{$insert:[
//                    {amt:1000, deductions:{$insert:[
//                        {damt:50},
//                        {damt:200}
//                    ]}} ,
//                    {amt:2000, deductions:{$insert:[
//                        {damt:10},
//                        {damt:10}
//                    ]}}
//
//                ]}};
//
////                var invoice = {invoice_no:1111};
//                db.update({$collection:invoices1, $insert:invoice}).then(
//                    function () {
//                        var query = {$collection:"invoices", $sort:{_id:-1}, $limit:1};
//                        console.log("query called....." + JSON.stringify(query))
//                        return   db.query({$collection:"invoices", $sort:{_id:-1}, $limit:1})
//                    }).then(
//                    function (result) {
//                        console.log("result >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(result));
//                    }).fail(function (e) {
//                        console.log("errr >>>>>>>>>>>>>>>>>>>>" + e.stack);
//                    })
//            } else if (type == "update") {
//                var invoice = {_id:"537e149c8224fad01cf8e8e9", $set:{invoicelineitems:{$update:[
//                    {_id:"537e149c8224fad01cf8e8e7", $set:{amt:3000, deductions:{$update:[
//                        {_id:"537e149c8224fad01cf8e8e8", damt:100}
//                    ], $insert:[
//                        {damt:200}
//                    ]}}}
//                ], $insert:[
//                    {amt:20000, deductions:{$insert:[
//                        {damt:2000}
//                    ]}}
//                ]}}};
//
//
//                db.update({$collection:invoices1, $update:invoice}).then(
//                    function () {
//                        return  db.query({$collection:"invoices", $filter:{_id:"537e149c8224fad01cf8e8e9"}, $sort:{_id:-1}, $limit:1})
//                    }).then(
//                    function (result) {
//                        console.log("result >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(result));
//                    }).fail(function (e) {
//                        console.log("errr >>>>>>>>>>>>>>>>>>>>" + e.stack);
//                    })
//            } else if (type == "delete") {
//                var invoice = {_id:"5391779f07ba60e807000008", $set:{invoicelineitems:{$delete:[
//                    {_id:"5391779e07ba60e807000002"}
//                ], $update:[
//                    {_id:"5391779e07ba60e807000005", $set:{deductions:{$delete:[
//                        {_id:"5391779e07ba60e807000007"}
//                    ]}}}
//                ] }}};
//                console.log("value to delete called...");
//                db.update({$collection:invoices1, $update:invoice}).then(
//                    function () {
//                        console.log("after delete...");
//                        return  db.query({$collection:"invoices", $filter:{_id:"53916277b72ab2ec09000004"}, $sort:{_id:-1}, $limit:1})
//                    }).then(
//                    function (result) {
//                        console.log("result >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(result));
//                    }).fail(function (e) {
//                        console.log("errr >>>>>>>>>>>>>>>>>>>>" + e.stack);
//                    })
//            } else if (type == "doc") {
//                var updates = {_id:"rohit", $set:{countryid:{_id:"india"}}}
//                var updates = {_id:"rohit", $set:{countryid:{$query:{_id:"india"}, $set:{country:"India"}}}}
//                var old = {_id:"rohit", countryid:{_id:"china", country:"china"}};
//                var document = new Document(updates, old, "update");
//                var json = document.convertToJSON();
//                console.log("json>>" + JSON.stringify(json));
//            } else if (type == "moduleinsert") {
////            var bill = {bill_time:{time:"5.4", unit:"Hrs"}, qty:"100", rate:"50.5", bill_date:"2014-12-09", "desc":1000, int:"-3.6", json:JSON.stringify({name:"sachin"}), refundable:"manjeet"}
//                var bill = {qty:"100", rate:"50.5", detail:{qty1:"100", rate1:"50.5"}}
//
//
//                db.update({$collection:bills, $insert:bill}).then(
//                    function () {
//                        console.log("querying>>>>")
//                        db.db.collection("bills").find({}, {sort:{_id:-1}, limit:1}).toArray(function (err, result) {
//                            if (err) {
//                                console.log("error cnoutnred" + err.stack);
//                                return;
//                            }
//                            console.log("result >>>>>>>>>>>>>>>>>>>>" + JSON.stringify(result));
//                            ApplaneDB.getMethodToInvoke();
//                        })
//                    }).fail(function (e) {
//                        console.log("errr >>>>>>>>>>>>>>>>>>>>" + e.stack);
//                    })
//            } else if (type == "inc") {
//                console.log("it is inc")
//                db.update({$collection:{collection:"statess", fields:[
//                    {field:"cid", type:"fk", upsert:true, set:["country"], collection:"countriess"}
//                ]}, $update:{_id:"haryana", $set:{cid:{$set:{code:100}}}}}).then(
//                    function (res) {
//                        console.log("Res>>>" + JSON.stringify(res));
//                    }).fail(function (e) {
//                        console.log("error in bil generation")
//                    })
//            } else if (type == "client default") {
//                var inserts = {$collection:countriess, $insert:{
//                    country_name:"India", country_states:[
//                        {state_name:"haryana"}
//                    ]
//                }}
//
//                db.update(inserts).then(
//                    function (result) {
//                        console.log("Resut>>>" + JSON.stringify(result));
//
//                    }).fail(function (err) {
//                        console.log("err>>" + err)
//
//                    })
//
//            } else if (type == "client default module") {
//                var inserts = {$collection:countriess, $insert:{
//                    country_name:"India", country_states:[
//                        {state_name:"haryana"}
//                    ]
//                }}
//
//                db.update(inserts).then(
//                    function (result) {
//                        console.log("Resut>>>" + JSON.stringify(result));
//
//                    }).fail(function (err) {
//                        console.log("err>>" + err)
//
//                    })
//
//            } else if (type == "document for $query") {
//
//                var updates = {_id:"1", $set:{states:{$update:[
//                    {$query:{state:"haryana"}, $set:{code:100}}
//                ]}}};
//
//                var updates = {_id:"1", $set:{states:{$update:[
//                    {$query:{state:"haryana"}, $set:{code:100}}
//                ]}}};
//                var document = new Document(updates, null, "update");
//                console.log(JSON.stringify(updates));
//            }
//
//
//        })
//
//
//    }).fail(function (err) {
//        console.log("errr>>" + err)
//    })
