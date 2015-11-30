var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

describe("UEModuletestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("Add a column of html type", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerFunction({   name: "Employees", source: "NorthwindTestCase/lib", "type": "js"});
        }).then(function () {
                var insert = [
                    {$collection: {"collection": "myemployees", fields: [
                        {field: "firstname", type: "string"},
                        {field: "lastname", type: "string"},
                        {field: "fullname", type: "object", query: JSON.stringify({"$function": "Employees.fullName", "$fields": {}, "$type": "ue"})}
                    ]}, $insert: [
                        {_id: 11, "firstname": "Manjeet", "lastname": "Sangwan"}
                    ]}
                ]
                return db.update(insert);
            }).then(function () {
                return db.query({$collection: {"collection": "myemployees", fields: [
                    {field: "firstname", type: "string"},
                    {field: "lastname", type: "string"},
                    {field: "fullname", type: "object", query: JSON.stringify({"$function": "Employees.fullName", "$fields": {}, "$type": "ue"})}
                ]}, $fields: {fullname: 1}});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].firstname).to.eql("Manjeet");
                expect(data.result[0].lastname).to.eql("Sangwan");
                expect(data.result[0].fullname).to.eql("Manjeet - Sangwan");
                done();
            }).fail(function (err) {
                done(err);
            })
    });
});