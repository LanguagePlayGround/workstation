/**
 * mocha --recursive --timeout 150000 -g "TemplateValidation testcase" --reporter spec
 * Created with IntelliJ IDEA.
 * User: Rajit
 * Date: 30/7/14
 * Time: 10:58 AM
 * To change this template use File | Settings | File Templates.
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");
var Constants = require("../lib/Constants.js");

describe("TemplateValidation testcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    it("Templates Verification error check", function (done) {
        var db = undefined;
        var templateJob = {   name:"onPreSave", source:"ApplaneApps/lib/apps/triggers/TemplateJob"};
        var plTemplateDef = {collection:Constants.Admin.TEMPLATES, fields:[
            {field:Constants.Admin.Templates.TEMPLATE, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.TEMPLATES}}} ,
            {field:Constants.Admin.Templates.TYPE, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.TEMPLATES}}},
            {field:Constants.Admin.Templates.QUERY, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.TEMPLATES}}},
            {field:Constants.Admin.Templates.FUNCTION, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.TEMPLATES}}},
            {field:Constants.Admin.Templates.VIEW, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.TEMPLATES}}},
            {field:Constants.Admin.Templates.ID, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.TEMPLATES}}},
            {field:Constants.Admin.Templates.SUBJECT, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.TEMPLATES}}},
            {field:Constants.Admin.Templates.FROM, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.TEMPLATES}}},
            {field:Constants.Admin.Templates.TO, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.TEMPLATES}}},
            {field:Constants.Admin.Templates.COLLECTION_ID, type:Constants.Admin.Fields.Type.FK, "collection":Constants.Admin.COLLECTIONS, set:[Constants.Admin.Collections.COLLECTION]}
        ], events:[
            {
                function:templateJob,
                event:"onSave",
                pre:true
            }
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return ApplaneDB.registerCollection(plTemplateDef).then(
                    function () {
                        return ApplaneDB.registerFunction(templateJob);
                    }).then(
                    function () {
                        var insert = [
                            {$collection:Constants.Admin.TEMPLATES, $insert:[
                                {template:"<%=%>", subject:"<%=title>"}
                            ]}
                        ]
                        return db.update(insert);
                    }).then(
                    function (data) {
                        expect(data).not.to.be.ok;
                        done();
                    }).fail(function (err) {
                        if (err.message.indexOf("[ StartCount = 1---- EndCount = 0>>>>> Template is = <%=title>]") !== -1) {
                            done();
                        } else {
                            done(err);
                        }
                    })
            })
    })

})

