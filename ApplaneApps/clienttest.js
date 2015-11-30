var ApplaneDB = require("ApplaneDB");
var Utility = require("ApplaneCore/apputil/util.js");


var OPTIONS = {};

var Config = {};
Config.URL = "mongodb://127.0.0.1:27017";
Config.DB = "northwindtestcases";
Config.ADMIN_DB = "applaneadmin";


var requiredJS = require("requirejs");
requiredJS.config({baseUrl:process.cwd() + "/node_modules"});
var ModuleManager = require("ApplaneDB/lib/ModuleManager.js");
ModuleManager.$client = true;


var countriess = {"__type__":"insert", "_id":"5382d3ddd6db21a80e000377", "collection":"Countries", "events":[
    {"event":"onInsert", "function":"countriess.onCountryInsert", "_id":"538736d37668fbb0160001d1"},
    {"event":"onSave", "function":"countriess.onCountryPreSave", "pre":true, "_id":"5387420c636fba701d000029"},
    {"event":"onInsert:[{\"country_states\":[]}]", "function":"countriess.onStateInsert", "_id":"53874440636fba701d0000b6"},
    {"event":"onValue:[{\"country_states\":[\"state_name\"]}]", "function":"countriess.onStateName", "_id":"538748c81e0999f01e000031"},
    {"event":"onValue:[{\"country_states\":[\"state_population\"]}]", "function":"countriess.onStatePopulationChange", "_id":"538748c81e0999f01e000031"},
    {"event":"onValue:[{\"country_states\":[{\"state_city\":[\"city_population\"]}]}]", "function":"countriess.onCityPopulationChange", "_id":"538748c81e0999f01e000031"}
], "fields":[

    {"field":"country_code", "index":20, "indexGrid":10.625, "label":"Code", "type":"string", "ui":"text", "visibility":true},
    {"field":"country_states", "index":30, "label":"States", "multiple":true, "type":"object", "ui":"grid", "visibility":false, "visibilityForm":true, "when":"", "fields":[
        {"field":"state_code", "index":50, "indexForm":null, "indexGrid":null, "label":"State Code", "parentfieldid":{"_id":"5382d4a5d6db21a80e0003c9", "field":"country_states"}, "type":"string", "ui":"text", "uiGrid":"", "visibility":false, "visibilityForm":true, "when":"", "whenForm":"", "whenGrid":""},
        {"field":"state_city", "label":"City", "type":"object", "ui":"grid", "parentfieldid":{"_id":"5382d4a5d6db21a80e0003c9", "field":"country_states"}, "when":"", "multiple":true, "visibilityForm":true, "whenGrid":"", "uiGrid":"", "collectionid":{"collection":"Countries", "_id":"5382d3ddd6db21a80e000377"}, "__type__":"insert", "_id":"5382d72ed6db21a80e0005a9", "fields":[
            {"field":"city_name", "label":"Name", "type":"string", "ui":"text", "parentfieldid":{"field":"state_city", "_id":"5382d72ed6db21a80e0005a9"}, "when":"", "visibilityForm":true, "whenGrid":"", "uiGrid":"", "collectionid":{"collection":"Countries", "_id":"5382d3ddd6db21a80e000377"}, "__type__":"insert", "_id":"5382d74fd6db21a80e0005bc"},
            {"field":"city_code", "label":"Code", "type":"string", "ui":"text", "parentfieldid":{"field":"state_city", "_id":"5382d72ed6db21a80e0005a9"}, "when":"", "visibilityForm":true, "whenGrid":"", "whenForm":"", "uiGrid":"", "collectionid":{"collection":"Countries", "_id":"5382d3ddd6db21a80e000377"}, "__type__":"insert", "_id":"5382d76cd6db21a80e0005c9"},
            {"field":"city_population", "label":"City population", "type":"number", "ui":"number", "parentfieldid":{"field":"state_city", "_id":"5382d72ed6db21a80e0005a9"}, "visibilityForm":true, "collectionid":{"collection":"Countries", "_id":"5382d3ddd6db21a80e000377"}, "_id":"538735d17668fbb01600017f"}
        ]},
        {"field":"state_name", "type":"string"},
        {"field":"state_population", "label":"State population", "type":"number", "ui":"number", "parentfieldid":{"_id":"5382d4a5d6db21a80e0003c9", "field":"country_states"}, "visibilityForm":true, "collectionid":{"collection":"Countries", "_id":"5382d3ddd6db21a80e000377"}, "_id":"538735f57668fbb016000194"},
        {"field":"state_date", "label":"state_date", "type":"date", "ui":"date", "parentfieldid":{"_id":"5382d4a5d6db21a80e0003c9", "field":"country_states"}, "visibilityForm":true, "collectionid":{"_id":"5382d3ddd6db21a80e000377", "collection":"Countries"}, "_id":"538743df636fba701d0000a5"},
        {"field":"state_counter", "label":"state_counter", "type":"number", "ui":"number", "parentfieldid":{"_id":"5382d4a5d6db21a80e0003c9", "field":"country_states"}, "visibilityForm":true, "collectionid":{"_id":"5382d3ddd6db21a80e000377", "collection":"Countries"}, "_id":"538745680d9cb82017000089"},
        {"field":"state_name_counter", "index":null, "label":"state_name_counter", "parentfieldid":{"_id":"5382d4a5d6db21a80e0003c9", "field":"country_states"}, "type":"number", "ui":"number", "visibilityForm":true}
    ]},
    {"field":"country_name", "index":10, "indexGrid":0, "label":"Name", "type":"string", "ui":"text", "visibility":true, "when":""},
    {"field":"population", "index":2, "indexGrid":15, "label":"Population", "type":"number", "ui":"number", "visibility":true},
    {"field":"country_date", "index":46, "label":"country_date", "type":"date", "ui":"date", "visibility":true},
    {"field":"country_pre_save_counter", "index":null, "indexGrid":12.5, "label":"country_pre_save_counter", "type":"number", "ui":"number", "visibility":true},
    {"field":"country_counter", "index":null, "indexGrid":11.25, "label":"country_counter", "type":"number", "ui":"number", "visibility":true}
]}

var functionsToRegister = [

    {name:"countriess", source:"NorthwindTestCase/lib", type:"js"}

]


ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(function (db) {


    ApplaneDB.registerFunction(functionsToRegister).then(function () {
        try {


            var type = "client default module";
            if (type == "client default module") {
                var DataModel = require("./public/js/DataModel.js");
                var query = {$collection:countriess};
                var data = [];
                var metadata = countriess;
                var dataModel = new DataModel(query, data, metadata, db)

                dataModel.insert().then(
                    function (result) {
                        console.log("data>>>>" + JSON.stringify(data));
                        console.log("clone data>>>>" + JSON.stringify(dataModel.dataClone))
                        var clone = Utility.deepClone(data);
                        data[0].country_name = "india";
                        return dataModel.handleValueChange(data, clone);

                    }).then(
                    function () {
                        console.log("Now>>>>" + JSON.stringify(data));
                        var clone = Utility.deepClone(data);
                        data[0].country_states = [
                            {_id:"s1"}
                        ];
                        return dataModel.handleValueChange(data, clone);

                    }).then(
                    function () {
                        console.log("Now After State insert>>>>" + JSON.stringify(data));

                        var clone = Utility.deepClone(data);
                        data[0].country_states[0].state_name = "Haryana"
                        return dataModel.handleValueChange(data, clone);


                    }).then(
                    function () {
                        console.log("Now After State Name changed>>>>" + JSON.stringify(data));

                    }).then(
                    function () {
                        console.log("Now After State insert>>>>" + JSON.stringify(data));

//                        var clone = Utility.deepClone(data);
//                        data[0].country_states[0].state_population = 500
//                        return dataModel.handleValueChange(data, clone);


                    }).then(
                    function () {
                        console.log("Now After State insert>>>>" + JSON.stringify(data));

                        var clone = Utility.deepClone(data);
                        data[0].country_states[0].state_city = [
                            {_id:"c1"}
                        ]
                        return dataModel.handleValueChange(data, clone);


                    }).then(
                    function () {
                        console.log("Now After State Name changed>>>>" + JSON.stringify(data));

                    }).then(
                    function () {
                        console.log("Now After State insert>>>>" + JSON.stringify(data));

                        var clone = Utility.deepClone(data);
                        data[0].country_states[0].state_city[0].city_population = 500;
                        return dataModel.handleValueChange(data, clone);


                    }).then(
                    function () {
                        console.log("Now After State Name changed>>>>" + JSON.stringify(data));

                    }).fail(function (err) {
                        console.log("error>>>" + err.stack);
                    })

            }

        } catch (e) {
            console.log("error received>>>" + e.stack)
        }
    })


})
