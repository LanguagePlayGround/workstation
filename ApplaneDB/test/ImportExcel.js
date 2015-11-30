var expect = require('chai').expect;
var Testcases = require("./TestCases.js");
var ImportExcelService = require('../lib/ImportExcelService.js');
var ApplaneDB = require("../lib/DB.js");
var config = require("./config.js").config;
var NorthwindDb = require("./NorthwindDb.js");
var OPTIONS = {};

//mocha --recursive --timeout 150000 -g portingExcelData --reporter spec
describe("Porting", function () {


    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("simpleTestCaseWithoutUpload", function (done) {
        var sheetData = [
            {"country":"India", "countryCode":91, "countryDetails":{"state":"hayana", "stateCode":1, "cities":{"city":"hisar", "cityNo":1}}, "date":new Date("2014-12-11"), "schools":{"teachers":{"teacherCode":1, "firstName":"seeta"}, "city":"Hisar"}},
            {"countryCode":91, "countryDetails":{"stateCode":1, "cities":{"city":"jind", "cityNo":2}}, "schools":{"teachers":{"teacherCode":1, "lastName":"geeta"}, "state":"Haryana"}},
            {"countryCode":91, "countryDetails":{"stateCode":1, "cities":{"city":"sirsa", "cityNo":3}}},
            {"countryCode":91, "countryDetails":{"state":"punjab", "stateCode":2, "cities":{"city":"patiala", "cityNo":4}}, "schools":{"teachers":{"teacherCode":2, "firstName":"ram"}}},
            {"countryCode":91, "countryDetails":{"stateCode":2, "cities":{"city":"ludhiana", "cityNo":5}}},
            {"countryCode":91, "countryDetails":{"stateCode":2, "cities":{"city":"chandigarh", "cityNo":6}}},
            {"country":"america", "countryCode":11, "countryDetails":{"state":"new york", "stateCode":3, "cities":{"city":"new york first", "cityNo":7}}, "date":41955, "schools":{"teachers":{"teacherCode":2, "firstName":"geeta"}}},
            {"countryCode":11, "countryDetails":{"stateCode":3, "cities":{"city":"new york second", "cityNo":8}}},
            {"countryCode":11, "countryDetails":{"stateCode":3, "cities":{"city":"new york third", "cityNo":9}}, "schools":{"teachers":{"teacherCode":2, "lastName":"seeta"}}},
            {"countryCode":11, "countryDetails":{"state":"new jersey", "stateCode":4, "cities":{"city":"new jersey3", "cityNo":10}}},
            {"countryCode":11, "countryDetails":{"stateCode":4, "cities":{"city":"new jersey2", "cityNo":11}}},
            {"countryCode":11, "countryDetails":{"stateCode":4, "cities":{"city":"new jersey3", "cityNo":12}}}
        ];
        var primaryColumns = {"$self":"countryCode", "countryDetails":{"$self":"stateCode", "cities":{"$self":"cityNo"}}, "schools":{"teachers":{"$self":"teacherCode"}}};

        var fieldInfos = {"country":{"$type":"string"}, "countryCode":{"$type":"string"}, "date":{"$type":"date"}, "countryDetails":{"$multiple":true, "cities":{"$multiple":true}}, "schools":{"teachers":{"$multiple":true}}};
        var data = [];

        try {
            ImportExcelService.populateSheetData(sheetData, data, fieldInfos, primaryColumns);
        } catch (err) {
            done(err);
            return;
        }
        expect(data).to.have.length(2);
        expect(data[0].country).to.eql("India");
        expect(data[0].countryCode).to.eql(91);
        expect(JSON.stringify(data[0].date)).to.eql(JSON.stringify("2014-12-11T00:00:00.000Z"));

        expect(data[0].countryDetails).to.have.length(2);

        expect(data[0].countryDetails[0].state).to.eql("hayana");
        expect(data[0].countryDetails[0].stateCode).to.eql(1);
        expect(data[0].countryDetails[0].cities).to.have.length(3);
        expect(data[0].countryDetails[0].cities[0].city).to.eql("hisar");
        expect(data[0].countryDetails[0].cities[0].cityNo).to.eql(1);
        expect(data[0].countryDetails[0].cities[1].city).to.eql("jind");
        expect(data[0].countryDetails[0].cities[1].cityNo).to.eql(2);
        expect(data[0].countryDetails[0].cities[2].city).to.eql("sirsa");
        expect(data[0].countryDetails[0].cities[2].cityNo).to.eql(3);
        expect(data[0].countryDetails[1].state).to.eql("punjab");
        expect(data[0].countryDetails[1].stateCode).to.eql(2);
        expect(data[0].countryDetails[1].cities).to.have.length(3);
        expect(data[0].countryDetails[1].cities[0].city).to.eql("patiala");
        expect(data[0].countryDetails[1].cities[0].cityNo).to.eql(4);
        expect(data[0].countryDetails[1].cities[1].city).to.eql("ludhiana");
        expect(data[0].countryDetails[1].cities[1].cityNo).to.eql(5);
        expect(data[0].countryDetails[1].cities[2].city).to.eql("chandigarh");
        expect(data[0].countryDetails[1].cities[2].cityNo).to.eql(6);
        expect(data[0].schools.teachers[0].teacherCode).to.eql(1);
        expect(data[0].schools.teachers[0].firstName).to.eql("seeta");
        expect(data[0].schools.teachers[0].lastName).to.eql("geeta");
        expect(data[0].schools.city).to.eql("Hisar");
        expect(data[0].schools.state).to.eql("Haryana");
        expect(data[0].schools.teachers[1].teacherCode).to.eql(2);
        expect(data[0].schools.teachers[1].firstName).to.eql("ram");

        expect(data[1].country).to.eql("america");
        expect(data[1].countryCode).to.eql(11);
        expect(JSON.stringify(data[1].date)).to.eql(JSON.stringify("2014-11-12T00:00:00.000Z"));

        expect(data[1].countryDetails).to.have.length(2);

        expect(data[1].countryDetails[0].state).to.eql("new york");
        expect(data[1].countryDetails[0].stateCode).to.eql(3);
        expect(data[1].countryDetails[0].cities).to.have.length(3);
        expect(data[1].countryDetails[0].cities[0].city).to.eql("new york first");
        expect(data[1].countryDetails[0].cities[0].cityNo).to.eql(7);
        expect(data[1].countryDetails[0].cities[1].city).to.eql("new york second");
        expect(data[1].countryDetails[0].cities[1].cityNo).to.eql(8);
        expect(data[1].countryDetails[0].cities[2].city).to.eql("new york third");
        expect(data[1].countryDetails[0].cities[2].cityNo).to.eql(9);
        expect(data[1].countryDetails[1].state).to.eql("new jersey");
        expect(data[1].countryDetails[1].stateCode).to.eql(4);
        expect(data[1].countryDetails[1].cities).to.have.length(3);
        expect(data[1].countryDetails[1].cities[0].city).to.eql("new jersey3");
        expect(data[1].countryDetails[1].cities[0].cityNo).to.eql(10);
        expect(data[1].countryDetails[1].cities[1].city).to.eql("new jersey2");
        expect(data[1].countryDetails[1].cities[1].cityNo).to.eql(11);
        expect(data[1].countryDetails[1].cities[2].city).to.eql("new jersey3");
        expect(data[1].countryDetails[1].cities[2].cityNo).to.eql(12);
        expect(data[1].schools.teachers[0].teacherCode).to.eql(2);
        expect(data[1].schools.teachers[0].firstName).to.eql("geeta");
        expect(data[1].schools.teachers[0].lastName).to.eql("seeta");
        done();
    })

    it("simpleTestCase", function (done) {
        var db = undefined;
        ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
            function (db1) {
                db = db1;
                var xlsx = require('../../node-xlsx');

                var buffer = xlsx.build({worksheets:[
                    {"name":"mySheetName", "data":[
                        ["Name", "Age"],
                        ["Sachin", 25],
                        ["Ritesh", 21]
                    ]}
                ]});
                return db.uploadFile("mySheetName", [buffer]);
            }).then(
            function (fileKey) {
                var mapping = {"A":"Name", "B":"Age"};
                var parameters = {};
                parameters.collection = "excelTesting";
                parameters.fileKey = fileKey;
                parameters.mapping = mapping;
                return ImportExcelService.portNewExcelData(parameters, db)

            }).then(
            function (data) {
                expect(data).to.have.length(2);
                expect(data[0].Name).to.eql("Sachin");
                expect(data[0].Age).to.eql(25);
                expect(data[1].Name).to.eql("Ritesh");
                expect(data[1].Age).to.eql(21);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("simpleTestCaseWithUpload", function (done) {
        var db = undefined;
        ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
            function (db1) {
                db = db1;
                var xlsx = require('../../node-xlsx');

                var buffer = xlsx.build({worksheets:[
                    {"name":"mySheetName", "data":[
                        ["country", "countryCode", "state", "stateCode", "city", "cityNo", "date", "teacherCode", "firstName", "lastName", "city", "state"],
                        ["India", 91, "haryana", 1, "hisar", 1, new Date("2014-12-11"), 1, "seeta", {"value":null}, "Hisar", {"value":null}],
                        [{"value":null}, 91, {"value":null}, 1, "jind", 2, {"value":null}, 1, {"value":null}, "geeta", {"value":null}, "Haryana"],
                        [{"value":null}, 91, {"value":null}, 1, "sirsa", 3, {"value":null}, {"value":null}, {"value":null}, {"value":null}, {"value":null}, {"value":null}],
                        [{"value":null}, 91, "punjab", 2, "patiala", 4, {"value":null}, 2, "ram", {"value":null}, {"value":null}, {"value":null}],
                        [{"value":null}, 91, {"value":null}, 2, "ludhiana", 5, {"value":null}, {"value":null}, {"value":null}, {"value":null}, {"value":null}, {"value":null}],
                        [{"value":null}, 91, {"value":null}, 2, "chandigarh", 6, {"value":null}, {"value":null}, {"value":null}, {"value":null}, {"value":null}, {"value":null}],
                        ["america", 11, "new york", 3, "new york first", 7, 41955, 2, "geeta", {"value":null}, {"value":null}, {"value":null}],
                        [{"value":null}, 11, {"value":null}, 3, "new york second", 8, {"value":null}, {"value":null}, {"value":null}, {"value":null}, {"value":null}, {"value":null}],
                        [{"value":null}, 11, {"value":null}, 3, "new york third", 9, {"value":null}, 2, {"value":null}, "seeta", {"value":null}, {"value":null}],
                        [{"value":null}, 11, "new jersey", 4, "new jersey3", 10, {"value":null}, {"value":null}, {"value":null}, {"value":null}, {"value":null}, {"value":null}],
                        [{"value":null}, 11, {"value":null}, 4, "new jersey2", 11, {"value":null}, {"value":null}, {"value":null}, {"value":null}, {"value":null}, {"value":null}],
                        [{"value":null}, 11, {"value":null}, 4, "new jersey3", 12, {"value":null}, {"value":null}, {"value":null}, {"value":null}, {"value":null}, {"value":null}],
                    ]}
                ]});
                return db.uploadFile("mySheetName", [buffer]);
            }).then(
            function (fileKey) {
                var mapping = {"A":"country", "B":"countryCode", "C":"countryDetails.state", "D":"countryDetails.stateCode", "E":"countryDetails.cities.city", "F":"countryDetails.cities.cityNo", "G":"date", "H":"schools.teachers.teacherCode", "I":"schools.teachers.firstName", "J":"schools.teachers.lastName", "K":"schools.city", "L":"schools.state"};
                var fields = [
                    {"field":"date", "type":"date"},
                    {"field":"countryCode", "primary":true},
                    {"field":"countryDetails", "multiple":true, "fields":[
                        {"field":"stateCode", "primary":true},
                        {"field":"cities", "multiple":true, "fields":[
                            {"field":"cityNo", "primary":true}
                        ]}
                    ]},
                    {"field":"schools", "fields":[
                        {"field":"teachers", "multiple":true, "fields":[
                            {"field":"teacherCode", "primary":true}
                        ]}
                    ]}
                ];
                var parameters = {};
                parameters.collection = "excelTesting";
                parameters.fileKey = fileKey;
                parameters.mapping = mapping;
                parameters.fields = fields;
                return ImportExcelService.portNewExcelData(parameters, db)


            }).then(
            function (data) {
                expect(data).to.have.length(2);
                expect(data[0].country).to.eql("India");
                expect(data[0].countryCode).to.eql(91);
                expect(JSON.stringify(data[0].date)).to.eql(JSON.stringify("2014-12-11T00:00:00.000Z"));

                expect(data[0].countryDetails).to.have.length(2);

                expect(data[0].countryDetails[0].state).to.eql("haryana");
                expect(data[0].countryDetails[0].stateCode).to.eql(1);
                expect(data[0].countryDetails[0].cities).to.have.length(3);
                expect(data[0].countryDetails[0].cities[0].city).to.eql("hisar");
                expect(data[0].countryDetails[0].cities[0].cityNo).to.eql(1);
                expect(data[0].countryDetails[0].cities[1].city).to.eql("jind");
                expect(data[0].countryDetails[0].cities[1].cityNo).to.eql(2);
                expect(data[0].countryDetails[0].cities[2].city).to.eql("sirsa");
                expect(data[0].countryDetails[0].cities[2].cityNo).to.eql(3);
                expect(data[0].countryDetails[1].state).to.eql("punjab");
                expect(data[0].countryDetails[1].stateCode).to.eql(2);
                expect(data[0].countryDetails[1].cities).to.have.length(3);
                expect(data[0].countryDetails[1].cities[0].city).to.eql("patiala");
                expect(data[0].countryDetails[1].cities[0].cityNo).to.eql(4);
                expect(data[0].countryDetails[1].cities[1].city).to.eql("ludhiana");
                expect(data[0].countryDetails[1].cities[1].cityNo).to.eql(5);
                expect(data[0].countryDetails[1].cities[2].city).to.eql("chandigarh");
                expect(data[0].countryDetails[1].cities[2].cityNo).to.eql(6);
                expect(data[0].schools.teachers[0].teacherCode).to.eql(1);
                expect(data[0].schools.teachers[0].firstName).to.eql("seeta");
                expect(data[0].schools.teachers[0].lastName).to.eql("geeta");
                expect(data[0].schools.city).to.eql("Hisar");
                expect(data[0].schools.state).to.eql("Haryana");
                expect(data[0].schools.teachers[1].teacherCode).to.eql(2);
                expect(data[0].schools.teachers[1].firstName).to.eql("ram");

                expect(data[1].country).to.eql("america");
                expect(data[1].countryCode).to.eql(11);
                expect(JSON.stringify(data[1].date)).to.eql(JSON.stringify("2014-11-12T00:00:00.000Z"));

                expect(data[1].countryDetails).to.have.length(2);

                expect(data[1].countryDetails[0].state).to.eql("new york");
                expect(data[1].countryDetails[0].stateCode).to.eql(3);
                expect(data[1].countryDetails[0].cities).to.have.length(3);
                expect(data[1].countryDetails[0].cities[0].city).to.eql("new york first");
                expect(data[1].countryDetails[0].cities[0].cityNo).to.eql(7);
                expect(data[1].countryDetails[0].cities[1].city).to.eql("new york second");
                expect(data[1].countryDetails[0].cities[1].cityNo).to.eql(8);
                expect(data[1].countryDetails[0].cities[2].city).to.eql("new york third");
                expect(data[1].countryDetails[0].cities[2].cityNo).to.eql(9);
                expect(data[1].countryDetails[1].state).to.eql("new jersey");
                expect(data[1].countryDetails[1].stateCode).to.eql(4);
                expect(data[1].countryDetails[1].cities).to.have.length(3);
                expect(data[1].countryDetails[1].cities[0].city).to.eql("new jersey3");
                expect(data[1].countryDetails[1].cities[0].cityNo).to.eql(10);
                expect(data[1].countryDetails[1].cities[1].city).to.eql("new jersey2");
                expect(data[1].countryDetails[1].cities[1].cityNo).to.eql(11);
                expect(data[1].countryDetails[1].cities[2].city).to.eql("new jersey3");
                expect(data[1].countryDetails[1].cities[2].cityNo).to.eql(12);
                expect(data[1].schools.teachers[0].teacherCode).to.eql(2);
                expect(data[1].schools.teachers[0].firstName).to.eql("geeta");
                expect(data[1].schools.teachers[0].lastName).to.eql("seeta");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })


    it("test case with labelbased mappingtype", function (done) {
        var db = undefined;
        ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
            function (db1) {
                db = db1;
                var xlsx = require('../../node-xlsx');

                var buffer = xlsx.build({worksheets:[
                    {"name":"mySheetName", "data":[
                        ["EmpCode", "EmpName", "Document_Class", "Document_Year", "Work_ex", "WorkEx_company", "Document_Class", "Document_Year", "Emp_Age", "Work_ex", "WorkEx_company", "Gender","Fname","Mname","Document_Class", "Document_Year"],
                        [101, "Rohit", "x", 2010, 13, "Rohit 1", "xi", 2011, 25, 3,"Rohit 2","Male","A","B",{"value":null},  {"value":null}],
                        [102, "Ritesh", "x", {"value":null}, 14, "Ritesh 1", "xi", 2013, 22, 13,"Ritesh 2","Male","C","D",{"value":null},  {"value":null}],
                        [103, "Sachin", "x", 2014, {"value":null}, {"value":null}, {"value":null}, {"value":null}, 25, {"value":null},{"value":null},"Male","E","F","xii", 2020],
                        [104, "Ashu", {"value":null}, {"value":null}, 6, "Ashu 1", {"value":null}, {"value":null}, 28, 5,"Ashu 2","Male","G","H",{"value":null},  {"value":null}],
                    ]}
                ]});
                return db.uploadFile("mySheetName", [buffer]);
            })  .then(
            function (fileKey) {
                var mapping = {"EmpCode":"emp_code","EmpName":"ename","Document_Class":"document_details.class_name","Document_Year":"document_details.year","Work_ex":"workExperience.year","WorkEx_company":"workExperience.company","Emp_Age":"empAge","Gender":"gender","Fname":"Pdetails.fname","Mname":"Pdetails.mname"};
                var fields =[{"field":"emp_code","primary":true},{"field":"document_details","multiple":true,"fields":[{"field":"class_name","primary":true}]},{"field":"workExperience","multiple":true,"fields":[{"field":"year","primary":true}]}];
                var parameters = {};
                parameters.collection = "excelTesting";
                parameters.fileKey = fileKey;
                parameters.mapping = mapping;
                parameters.fields = fields;
                parameters.mappingType="labelBased";
                return ImportExcelService.portNewExcelData(parameters, db)


            }).then(
            function (data) {
                expect(data).to.have.length(4);
                expect(data[0].emp_code).to.eql(101);
                expect(data[0].ename).to.eql("Rohit");
                expect(data[0].document_details).to.have.length(2);
                expect(data[0].document_details[0].class_name).to.eql("x");
                expect(data[0].document_details[0].year).to.eql(2010);
                expect(data[0].document_details[1].class_name).to.eql("xi");
                expect(data[0].document_details[1].year).to.eql(2011);

                expect(data[0].workExperience).to.have.length(2);
                expect(data[0].workExperience[0].company).to.eql("Rohit 1");
                expect(data[0].workExperience[0].year).to.eql(13);
                expect(data[0].workExperience[1].company).to.eql("Rohit 2");
                expect(data[0].workExperience[1].year).to.eql(3);
                expect(data[0].gender).to.eql("Male");
                expect(data[0].empAge).to.eql(25);
                expect(data[0].Pdetails.fname).to.eql("A");
                expect(data[0].Pdetails.mname).to.eql("B");

                expect(data[1].emp_code).to.eql(102);
                expect(data[1].ename).to.eql("Ritesh");
                expect(data[1].document_details).to.have.length(2);
                expect(data[1].document_details[0].class_name).to.eql("x");
                expect(data[1].document_details[1].class_name).to.eql("xi");
                expect(data[1].document_details[1].year).to.eql(2013);

                expect(data[1].workExperience).to.have.length(2);
                expect(data[1].workExperience[0].company).to.eql("Ritesh 1");
                expect(data[1].workExperience[0].year).to.eql(14);
                expect(data[1].workExperience[1].company).to.eql("Ritesh 2");
                expect(data[1].workExperience[1].year).to.eql(13);
                expect(data[1].gender).to.eql("Male");
                expect(data[1].empAge).to.eql(22);
                expect(data[1].Pdetails.fname).to.eql("C");
                expect(data[1].Pdetails.mname).to.eql("D");


                expect(data[2].emp_code).to.eql(103);
                expect(data[2].ename).to.eql("Sachin");
                expect(data[2].document_details).to.have.length(2);
                expect(data[2].document_details[0].class_name).to.eql("x");
                expect(data[2].document_details[0].year).to.eql(2014);
                expect(data[2].document_details[1].class_name).to.eql("xii");
                expect(data[2].document_details[1].year).to.eql(2020);

                expect(data[2].gender).to.eql("Male");
                expect(data[2].Pdetails.fname).to.eql("E");
                expect(data[2].Pdetails.mname).to.eql("F");

                expect(data[3].emp_code).to.eql(104);
                expect(data[3].ename).to.eql("Ashu");
                expect(data[3].workExperience).to.have.length(2);
                expect(data[3].workExperience[0].company).to.eql("Ashu 1");
                expect(data[3].workExperience[0].year).to.eql(6);
                expect(data[3].workExperience[1].company).to.eql("Ashu 2");
                expect(data[3].workExperience[1].year).to.eql(5);
                expect(data[3].gender).to.eql("Male");
                expect(data[3].empAge).to.eql(28);
                expect(data[3].Pdetails.fname).to.eql("G");
                expect(data[3].Pdetails.mname).to.eql("H");

            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("simple test case with labelbased mappingtype", function (done) {
        var db = undefined;
        ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
            function (db1) {
                db = db1;
                var xlsx = require('../../node-xlsx');

                var buffer = xlsx.build({worksheets:[
                    {"name":"mySheetName", "data":[
                        ["EmpCode", "EmpName", "Emp_Age","Fname","Mname"],
                        [101, "Rohit", 25,"A","B"],
                        [102, "Ritesh",{"value":null}, "C"],
                        [103, {"value":null}, 27,"E","F"],
                        [104, "Ashu", 25]
                    ]}
                ]});
                return db.uploadFile("mySheetName", [buffer]);
            })  .then(
            function (fileKey) {
                var mapping = {"EmpCode":"emp_code","EmpName":"ename","Emp_Age":"empAge","Fname":"Pdetails.fname","Mname":"Pdetails.mname"};
                var parameters = {};
                parameters.collection = "excelTesting";
                parameters.fileKey = fileKey;
                parameters.mapping = mapping;
                parameters.mappingType="labelBased";
                return ImportExcelService.portNewExcelData(parameters, db)


            }).then(
            function (data) {
                expect(data).to.have.length(4);
                expect(data[0].emp_code).to.eql(101);
                expect(data[0].ename).to.eql("Rohit");

                expect(data[0].empAge).to.eql(25);
                expect(data[0].Pdetails.fname).to.eql("A");
                expect(data[0].Pdetails.mname).to.eql("B");

                expect(data[1].emp_code).to.eql(102);
                expect(data[1].ename).to.eql("Ritesh");
                expect(data[1].Pdetails.fname).to.eql("C");


                expect(data[2].emp_code).to.eql(103);
                expect(data[2].Pdetails.fname).to.eql("E");
                expect(data[2].Pdetails.mname).to.eql("F");
                expect(data[2].empAge).to.eql(27);

                expect(data[3].emp_code).to.eql(104);
                expect(data[3].ename).to.eql("Ashu");

                expect(data[3].empAge).to.eql(25);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })


    it("school example test case with labelbased mappingtype", function (done) {
        var db = undefined;
        ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
            function (db1) {
                db = db1;
                var xlsx = require('../../node-xlsx');

                var buffer = xlsx.build({worksheets:[
                    {"name":"mySheetName", "data":[
                        ["RollNo", "Name", "Class", "Parentname", "City", "State", "Country","Parentname", "City", "State", "Country",  "Previous School", "From Date", "To Date", "Previous School", "From Date", "To Date", "DOB", "Sibling","Sibling","Nationality"],
                        [101, "Rohit", {"value":null}, "A", "Hisar", "Haryana", "India","B", "Mumbai", "Maharashtra", "India", "NYPS", new Date("2014-12-11"), {"value":null},"SKPPS", new Date("2014-12-11"), new Date("2014-12-19"),new Date("2014-12-04"),{"value":null},{"value":null},"Indian"],
                        [102, "Ritesh", "xi", "B", "Sirsa", "AP", "India","G", {"value":null}, "Punjab", "India", "SKPPS", new Date("2014-12-12"), new Date("2014-12-11"),"DPS", new Date("2014-12-22"), new Date("2014-12-21"),{"value":null},101,104,"Japanese"],
                        [103, "Sachin", {"value":null}, "C", {"value":null}, {"value":null}, "India","F", "Patiala", {"value":null}, {"value":null}, "YPS", {"value":null}, new Date("2014-12-11"),"VDJS", new Date("2014-12-19"), {"value":null},{"value":null},104,101,"Chinese"],
                        [104, {"value":null}, "ix", "R", "Jind", {"value":null}, "India","E", "lahoreCity", "Lahore", {"value":null}, {"value":null}, {"value":null}, {"value":null},"NYPS", new Date("2014-12-15"), {"value":null},new Date("2014-12-11"),101,105,"French"],
                        [105, "Rajit", "viii", "T", "Delhi", {"value":null}, "India","E", "Kanpur", "Kanpur", {"value":null}, {"value":null}, {"value":null}, {"value":null},"NYPS", new Date("2014-12-06"), {"value":null},new Date("2014-12-03"),104,105,"Canadian"]
                    ]}
                ]});
                return db.uploadFile("mySheetName", [buffer]);
            }).then(
            function (fileKey) {
                var mapping = {"RollNo":"rollNo","Name":"name","Class":"classid.class","Parentname":"parent_details.parentid.name","City":"parent_details.address.city","State":"parent_details.address.state","Country":"parent_details.address.country","Previous School":"previous_school_details.schoolid.name","From Date":"previous_school_details.fromDate","To Date":"previous_school_details.toDate","DOB":"dob","Sibling":"siblings.studentid.rollno","Nationality":"nationality"};
                var fields =[{"fromDate":"fromDate",type:"date"},{"fromDate":"toDate",type:"date"},{"fromDate":"dob",type:"date"},{"field":"rollNo","primary":true},{"field":"parent_details","multiple":true,"fields":[{"field":"parentid.name","primary":true}]},{"field":"siblings","multiple":true,"fields":[{"field":"studentid.rollno","primary":true}]},{"field":"previous_school_details","multiple":true,"fields":[{"field":"schoolid.name","primary":true}]}];
                var parameters = {};

                parameters.collection = "excelTesting";
                parameters.fileKey = fileKey;
                parameters.mapping = mapping;
                parameters.fields = fields;
                parameters.mappingType="labelBased";
                return ImportExcelService.portNewExcelData(parameters, db)


            }).then(
            function (data) {
                expect(data).to.have.length(5);
                expect(data[0].rollNo).to.eql(101);
                expect(data[0].name).to.eql("Rohit");
                expect(data[0].parent_details).to.have.length(2);
                expect(data[0].parent_details[0].parentid.name).to.eql("A");
                expect(data[0].parent_details[0].address.city).to.eql("Hisar");
                expect(data[0].parent_details[0].address.state).to.eql("Haryana");
                expect(data[0].parent_details[0].address.country).to.eql("India");

                expect(data[0].parent_details[1].parentid.name).to.eql("B");
                expect(data[0].parent_details[1].address.city).to.eql("Mumbai");
                expect(data[0].parent_details[1].address.state).to.eql("Maharashtra");
                expect(data[0].parent_details[1].address.country).to.eql("India");


                expect(data[0].previous_school_details).to.have.length(2);
                expect(data[0].previous_school_details[0].schoolid.name).to.eql("NYPS");
                expect(JSON.stringify(data[0].previous_school_details[0].fromDate)).to.eql(JSON.stringify("2014-12-11T00:00:00.000Z"));

                expect(data[0].previous_school_details[1].schoolid.name).to.eql("SKPPS");
                expect(JSON.stringify(data[0].previous_school_details[1].fromDate)).to.eql(JSON.stringify("2014-12-11T00:00:00.000Z"));
                expect(JSON.stringify(data[0].previous_school_details[1].toDate)).to.eql(JSON.stringify("2014-12-19T00:00:00.000Z"));
                expect(JSON.stringify(data[0].dob)).to.eql(JSON.stringify("2014-12-04T00:00:00.000Z"));

                expect(data[0].nationality).to.eql("Indian");

                expect(data[1].rollNo).to.eql(102);
                expect(data[1].name).to.eql("Ritesh");
                expect(data[1].classid.class).to.eql("xi");
                expect(data[1].parent_details).to.have.length(2);
                expect(data[1].parent_details[0].parentid.name).to.eql("B");
                expect(data[1].parent_details[0].address.city).to.eql("Sirsa");
                expect(data[1].parent_details[0].address.state).to.eql("AP");
                expect(data[1].parent_details[0].address.country).to.eql("India");

                expect(data[1].parent_details[1].parentid.name).to.eql("G");
                expect(data[1].parent_details[1].address.state).to.eql("Punjab");
                expect(data[1].parent_details[1].address.country).to.eql("India");


                expect(data[1].previous_school_details).to.have.length(2);
                expect(data[1].previous_school_details[0].schoolid.name).to.eql("SKPPS");
                expect(JSON.stringify(data[1].previous_school_details[0].fromDate)).to.eql(JSON.stringify("2014-12-12T00:00:00.000Z"));
                expect(JSON.stringify(data[1].previous_school_details[0].toDate)).to.eql(JSON.stringify("2014-12-11T00:00:00.000Z"));

                expect(data[1].previous_school_details[1].schoolid.name).to.eql("DPS");
                expect(JSON.stringify(data[1].previous_school_details[1].fromDate)).to.eql(JSON.stringify("2014-12-22T00:00:00.000Z"));
                expect(JSON.stringify(data[1].previous_school_details[1].toDate)).to.eql(JSON.stringify("2014-12-21T00:00:00.000Z"));

                expect(data[1].nationality).to.eql("Japanese");
                expect(data[1].siblings[0].studentid.rollno).to.eql(101);
                expect(data[1].siblings[1].studentid.rollno).to.eql(104);


                expect(data[2].rollNo).to.eql(103);
                expect(data[2].name).to.eql("Sachin");
                expect(data[2].parent_details).to.have.length(2);
                expect(data[2].parent_details[0].parentid.name).to.eql("C");
                expect(data[2].parent_details[0].address.country).to.eql("India");

                expect(data[2].parent_details[1].parentid.name).to.eql("F");
                expect(data[2].parent_details[1].address.city).to.eql("Patiala");


                expect(data[2].previous_school_details).to.have.length(2);
                expect(data[2].previous_school_details[0].schoolid.name).to.eql("YPS");
                expect(JSON.stringify(data[2].previous_school_details[0].toDate)).to.eql(JSON.stringify("2014-12-11T00:00:00.000Z"));

                expect(data[2].previous_school_details[1].schoolid.name).to.eql("VDJS");
                expect(JSON.stringify(data[2].previous_school_details[1].fromDate)).to.eql(JSON.stringify("2014-12-19T00:00:00.000Z"));

                expect(data[2].nationality).to.eql("Chinese");
                expect(data[2].siblings[0].studentid.rollno).to.eql(104);
                expect(data[2].siblings[1].studentid.rollno).to.eql(101);


                expect(data[3].rollNo).to.eql(104);
                expect(data[3].classid.class).to.eql("ix");
                expect(data[3].parent_details).to.have.length(2);
                expect(data[3].parent_details[0].parentid.name).to.eql("R");
                expect(data[3].parent_details[0].address.country).to.eql("India");

                expect(data[3].parent_details[1].parentid.name).to.eql("E");
                expect(data[3].parent_details[1].address.city).to.eql("lahoreCity");
                expect(data[3].parent_details[1].address.state).to.eql("Lahore");


                expect(data[3].previous_school_details).to.have.length(1);
                expect(data[3].previous_school_details[0].schoolid.name).to.eql("NYPS");
                expect(JSON.stringify(data[3].previous_school_details[0].fromDate)).to.eql(JSON.stringify("2014-12-15T00:00:00.000Z"));


                expect(data[3].nationality).to.eql("French");
                expect(data[3].siblings[0].studentid.rollno).to.eql(101);
                expect(data[3].siblings[1].studentid.rollno).to.eql(105);

                expect(JSON.stringify(data[3].dob)).to.eql(JSON.stringify("2014-12-11T00:00:00.000Z"));

                expect(data[4].rollNo).to.eql(105);
                expect(data[4].name).to.eql("Rajit");
                expect(data[4].classid.class).to.eql("viii");
                expect(data[4].parent_details).to.have.length(2);
                expect(data[4].parent_details[0].parentid.name).to.eql("T");
                expect(data[4].parent_details[0].address.city).to.eql("Delhi");
                expect(data[4].parent_details[0].address.country).to.eql("India");

                expect(data[4].parent_details[1].parentid.name).to.eql("E");
                expect(data[4].parent_details[1].address.city).to.eql("Kanpur");
                expect(data[4].parent_details[1].address.state).to.eql("Kanpur");


                expect(data[4].previous_school_details).to.have.length(1);
                expect(data[4].previous_school_details[0].schoolid.name).to.eql("NYPS");
                expect(JSON.stringify(data[4].previous_school_details[0].fromDate)).to.eql(JSON.stringify("2014-12-06T00:00:00.000Z"));


                expect(data[4].nationality).to.eql("Canadian");
                expect(data[4].siblings[0].studentid.rollno).to.eql(104);
                expect(data[4].siblings[1].studentid.rollno).to.eql(105);

                expect(JSON.stringify(data[4].dob)).to.eql(JSON.stringify("2014-12-03T00:00:00.000Z"));

            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })


})
