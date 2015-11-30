/**
 *
 * mocha --recursive --timeout 150000 -g "view testcase" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Config = require("ApplaneDB/test/config.js").config;
var Testcases = require("ApplaneDB/test/TestCases.js");
var Util = require("ApplaneCore/apputil/util.js")


describe("view testcase", function () {
    beforeEach(function (done) {
        return Testcases.beforeEach(done);
    });
    afterEach(function (done) {
        return Testcases.afterEach(done);
    });
    it("fields passed on the fly in viewInfo", function (done) {
        var db = undefined;
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection: "pl.collections", $insert: [
                        {collection: "persons"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "name", type: "string", collectionid: {$query: {collection: "persons"}}, index: 0, visibility: true},
                        {field: "firstname", type: "string", collectionid: {$query: {collection: "persons"}}, index: 1, visibility: true},
                        {field: "lastname", type: "string", collectionid: {$query: {collection: "persons"}}, index: 2, visibility: true},
                        {field: "fullname", type: "string", collectionid: {$query: {collection: "persons"}}, index: 3, visibility: true},
                        {field: "fathername", type: "string", collectionid: {$query: {collection: "persons"}}, index: 4, visibility: true},
                        {field: "languages", type: "object", collectionid: {$query: {collection: "persons"}}, multiple: true, index: 5, visibility: true},
                        {field: "language", type: "string", collectionid: {$query: {collection: "persons"}}, index: 6, visibility: true, parentfieldid: {$query: {field: "languages", collectionid: {$query: {collection: "persons"}}}}},
                        {field: "read", type: "boolean", collectionid: {$query: {collection: "persons"}}, index: 7, visibility: true, parentfieldid: {$query: {field: "languages", collectionid: {$query: {collection: "persons"}}}}},
                        {field: "speak", type: "boolean", collectionid: {$query: {collection: "persons"}}, index: 8, visibility: true, parentfieldid: {$query: {field: "languages", collectionid: {$query: {collection: "persons"}}}}}
                    ]},
                    {$collection: "pl.qviews", $insert: [
                        {label: "Persons", id: "persons", collection: {$query: {collection: "persons"}}, mainCollection: {$query: {collection: "persons"}}}
                    ]}
                ]);
            }).then(
            function (data) {
                return db.invokeFunction("view.getView", [
                    {id: "persons"}
                ]);
            }).then(
            function (viewResult) {
                var fields = viewResult.viewOptions.fields;
                Util.sort(fields, "asc", "field");
                expect(fields).to.not.equal(undefined);
                expect(fields).to.have.length(6);
                expect(fields[0].field).to.eql("fathername");
                expect(fields[1].field).to.eql("firstname");
                expect(fields[2].field).to.eql("fullname");
                expect(fields[3].field).to.eql("languages");
                expect(fields[3].fields).to.have.length(3);
                expect(fields[4].field).to.eql("lastname");
                expect(fields[5].field).to.eql("name");
            }).then(
            function (data) {
                return db.invokeFunction("view.getView", [
                    {id: "persons", fieldAvailability: "hidden", qFields: [
                        {field: "firstname"},
                        {field: "fullname"},
                        {field: "lname"},
                        {field: "languages"}
                    ]}
                ]);
            }).then(
            function (viewResult) {
                var fields = viewResult.viewOptions.fields;
                Util.sort(fields, "asc", "field");
                expect(fields).to.not.equal(undefined);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("fathername");
                expect(fields[1].field).to.eql("lastname");
                expect(fields[2].field).to.eql("name");
            }).then(
            function (data) {
                return db.invokeFunction("view.getView", [
                    {id: "persons", fieldAvailability: "hidden", qFields: [
                        {field: "firstname"},
                        {field: "fullname"},
                        {field: "languages", fields: [
                            {field: "read"}
                        ]}
                    ]}
                ]);
            }).then(
            function (viewResult) {
                var fields = viewResult.viewOptions.fields;
                Util.sort(fields, "asc", "field");
                expect(fields).to.not.equal(undefined);
                expect(fields).to.have.length(4);
                expect(fields[0].field).to.eql("fathername");
                expect(fields[1].field).to.eql("languages");
                expect(fields[1].fields).to.have.length(2);
                expect(fields[2].field).to.eql("lastname");
                expect(fields[3].field).to.eql("name");
            }).then(
            function (data) {
                return db.invokeFunction("view.getView", [
                    {id: "persons", fieldAvailability: "available", qFields: [
                        {field: "firstname"},
                        {field: "fullname", editableWhen: "false"},
                        {field: "languages", fields: [
                            {field: "read"},
                            {field: "write"}
                        ]},
                        {field: "age", type: "number", index: 10}
                    ]}
                ]);
            }).then(
            function (viewResult) {
                var fields = viewResult.viewOptions.fields;
                Util.sort(fields, "asc", "field");
                expect(fields).to.not.equal(undefined);
                expect(fields).to.have.length(4);
                expect(fields[0].field).to.eql("age");
                expect(fields[1].field).to.eql("firstname");
                expect(fields[2].field).to.eql("fullname");
                expect(fields[2].editableWhen).to.eql("false");
                expect(fields[3].field).to.eql("languages");
                expect(fields[3].fields).to.have.length(2);
                expect(fields[3].fields[0].field).to.eql("read");
                expect(fields[3].fields[1].field).to.eql("write");
            }).then(
            function (data) {
                return db.invokeFunction("view.getView", [
                    {id: "persons", fieldAvailability: "available", qFields: [
                        {field: "firstname"},
                        {field: "fullname", editableWhen: "false"},
                        {field: "languages"},
                        {field: "age", type: "number", index: 10}
                    ]}
                ]);
            }).then(
            function (viewResult) {
                var fields = viewResult.viewOptions.fields;
                Util.sort(fields, "asc", "field");
                expect(fields).to.not.equal(undefined);
                expect(fields).to.have.length(4);
                expect(fields[0].field).to.eql("age");
                expect(fields[1].field).to.eql("firstname");
                expect(fields[2].field).to.eql("fullname");
                expect(fields[2].editableWhen).to.eql("false");
                expect(fields[3].field).to.eql("languages");
                expect(fields[3].fields).to.have.length(3);
                expect(fields[3].fields[0].field).to.eql("language");
                expect(fields[3].fields[1].field).to.eql("read");
                expect(fields[3].fields[2].field).to.eql("speak");
            }).then(
            function (data) {
                return db.invokeFunction("view.getView", [
                    {id: "persons", fieldAvailability: "override", qFields: [
                        {field: "firstname"},
                        {field: "fullname", editableWhen: "false"},
                        {field: "languages", fields: [
                            {field: "read", editableWhen: "true"},
                            {field: "write"}
                        ]},
                        {field: "age", type: "number", index: 10}
                    ]}
                ]);
            }).then(
            function (viewResult) {
                var fields = viewResult.viewOptions.fields;
                Util.sort(fields, "asc", "field");
                expect(fields).to.not.equal(undefined);
                expect(fields).to.have.length(7);
                expect(fields[0].field).to.eql("age");
                expect(fields[1].field).to.eql("fathername");
                expect(fields[2].field).to.eql("firstname");
                expect(fields[3].field).to.eql("fullname");
                expect(fields[3].editableWhen).to.eql("false");
                expect(fields[4].field).to.eql("languages");
                expect(fields[4].fields).to.have.length(4);
                expect(fields[4].fields[0].field).to.eql("language");
                expect(fields[4].fields[1].field).to.eql("read");
                expect(fields[4].fields[1].editableWhen).to.eql("true");
                expect(fields[4].fields[2].field).to.eql("speak");
                expect(fields[4].fields[3].field).to.eql("write");
                expect(fields[5].field).to.eql("lastname");
                expect(fields[6].field).to.eql("name");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("dollor limit passed on the fly", function (done) {
        var COUNTRIES = "tasks";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "tasks"}
                    ]},
                    {$collection: "pl.qviews", $insert: [
                        {"id": "task", label: "Tasks", collection: {$query: {collection: "tasks"}}, "mainCollection": {$query: {"collection": "tasks"}}}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                var v = {};
                v.id = "task";
                v.$limit = 0;
                return db.invokeFunction("view.getView", [v]);
            }).then(
            function (viewdata) {
                expect(viewdata.viewOptions.queryGrid.$limit).to.eql(0);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("collection data navigation", function (done) {
        var db = undefined;
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection: "pl.collections", $insert: [
                        {collection: "pl.collections"},
                        {collection: "students"},
                        {collection: "employees"}
                    ]}
                ]);
            }).then(function () {
                return db.getGlobalDB();
            }).then(function (globalDb) {
                return globalDb.update([
                    {$collection: "pl.collections", $insert: [
                        {collection: "tasks"},
                        {collection: "schools"},
                        {collection: "teachers"},
                        {collection: "sales"}
                    ]}
                ]);
            }).then(
            function () {
                return db.update({$collection: "pl.qviews", $insert: [
                    {"id": "collections", label: "Collections", collection: {$query: {collection: "pl.collections"}}, "mainCollection": {$query: {"collection": "pl.collections"}}, queryEvent: JSON.stringify([
                        {event: "onQuery", function: "MainCollectionEvents.executeResultForNavigation", post: true},
                        {event: "onQuery", function: "MainCollectionEvents.onResult", post: false}
                    ]), sort: JSON.stringify({collection: -1})}
                ]})
            }).then(
            function () {
                return db.query({$collection: "pl.collections", $filter: {collection: {$in: ["pl.collections", "students", "employees", "tasks", "schools", "teachers", "sales"]}}, $sort: {collection: -1}, $limit: 2, $events: [
                    {event: "onQuery", function: "MainCollectionEvents.executeResultForNavigation", post: true},
                    {event: "onQuery", function: "MainCollectionEvents.onResult", post: false}
                ]});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].collection).to.eql("teachers");
                expect(data.result[1].collection).to.eql("tasks");
                expect(data.dataInfo.hasNext).to.eql(true);
            }).then(
            function () {
                return db.query({$collection: "pl.collections", $filter: {collection: {$in: ["pl.collections", "students", "employees", "tasks", "schools", "teachers", "sales"]}}, $sort: {collection: -1}, $limit: 2, $skip: 2, $events: [
                    {event: "onQuery", function: "MainCollectionEvents.executeResultForNavigation", post: true},
                    {event: "onQuery", function: "MainCollectionEvents.onResult", post: false}
                ]});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].collection).to.eql("students");
                expect(data.result[1].collection).to.eql("schools");
                expect(data.dataInfo.hasNext).to.eql(true);
            }).then(
            function () {
                return db.query({$collection: "pl.collections", $filter: {collection: {$in: ["pl.collections", "students", "employees", "tasks", "schools", "teachers", "sales"]}}, $sort: {collection: -1}, $limit: 2, $skip: 4, $events: [
                    {event: "onQuery", function: "MainCollectionEvents.executeResultForNavigation", post: true},
                    {event: "onQuery", function: "MainCollectionEvents.onResult", post: false}
                ]});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].collection).to.eql("sales");
                expect(data.result[1].collection).to.eql("pl.collections");
                expect(data.dataInfo.hasNext).to.eql(true);
            }).then(
            function () {
                return db.query({$collection: "pl.collections", $filter: {collection: {$in: ["pl.collections", "students", "employees", "tasks", "schools", "teachers", "sales"]}}, $sort: {collection: -1}, $limit: 2, $skip: 6, $events: [
                    {event: "onQuery", function: "MainCollectionEvents.executeResultForNavigation", post: true},
                    {event: "onQuery", function: "MainCollectionEvents.onResult", post: false}
                ]});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].collection).to.eql("employees");
                expect(data.dataInfo.hasNext).to.eql(false);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("row count and aggregates in async", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection: "pl.collections", $insert: [
                        {collection: "invoices"}
                    ]},
                    {"$collection": "pl.fields", $insert: [
                        {aggregate: "sum", visibility: true, field: "invoice_amount_base_currency", type: "number", collectionid: {$query: {collection: "invoices"}}},
                        {field: "invoiceno", visibility: true, type: "string", collectionid: {$query: {collection: "invoices"}}}
                    ]}
                ]);
            }).then(function () {
                return db.update({"$collection": "invoices", $insert: [
                    {invoice_amount_base_currency: 100, "invoiceno": "1"},
                    {invoice_amount_base_currency: 200, "invoiceno": "2"},
                    {invoice_amount_base_currency: 300, "invoiceno": "3"},
                    {invoice_amount_base_currency: 400, "invoiceno": "4"},
                    {invoice_amount_base_currency: 500, "invoiceno": "5"},
                    {invoice_amount_base_currency: 600, "invoiceno": "6"},
                    {invoice_amount_base_currency: 700, "invoiceno": "7"},
                    {invoice_amount_base_currency: 100, "invoiceno": "8"},
                    {invoice_amount_base_currency: 300, "invoiceno": "9"},
                    {invoice_amount_base_currency: 400, "invoiceno": "10"},
                    {invoice_amount_base_currency: 500, "invoiceno": "11"},
                    {invoice_amount_base_currency: 600, "invoiceno": "12"},
                    {invoice_amount_base_currency: 700, "invoiceno": "13"},
                    {invoice_amount_base_currency: 200, "invoiceno": "14"},
                    {invoice_amount_base_currency: 200, "invoiceno": "15"}
                ]});
            }).then(function () {
                return db.update({$collection: {collection: "pl.qviews", fields: [
                    {field: "id", type: "string"},
                    {"field": "collection", type: "fk", collection: "pl.collections", displayField: "collection", set: ["collection"]},
                    {"field": "mainCollection", type: "fk", collection: "pl.collections", displayField: "collection", set: ["collection"]}
                ]}, "$insert": [
                    {"id": "invoices", "collection": {$query: {collection: "invoices"}}, mainCollection: {$query: {collection: "invoices"}}}
                ]});
            }).then(function () {
                return db.invokeFunction("view.getView", [
                    {"id": "invoices", "$limit": 5, "fetchCount": true, aggregateAsync: true}
                ])
            }).then(function (result) {
                expect(result.data.aggregateResult.$async).to.eql(true);
            }).then(function () {
                return db.invokeFunction("view.getView", [
                    {"id": "invoices", "fetchCount": true, aggregateAsync: true}
                ])
            }).then(function (result) {
                expect(result.data.aggregateResult.invoice_amount_base_currency).to.eql(5800);
            }).then(function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it.skip("filter merging of user run time and default", function (done) {
        var db = undefined;
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection: "pl.collections", $insert: [
                        {collection: "employees"},
                        {collection: "employeesFilter"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "name", type: "string", collectionid: {$query: {collection: "employees"}}, index: 0, visibility: true},
                        {field: "task", type: "string", collectionid: {$query: {collection: "employeesFilter"}}, index: 0, visibility: true},
                        {field: "employee", type: "fk", collectionid: {$query: {collection: "employeesFilter"}}, index: 1, visibility: true, collection: "employees", displayField: "name", set: ["name"], filterable: true}
                    ]},
                    {$collection: "pl.qviews", $insert: [
                        {label: "employeesFilter", id: "employeesFilter", collection: {$query: {collection: "employeesFilter"}}, mainCollection: {$query: {collection: "employeesFilter"}}}
                    ]}
                ]);
            }).then(
            function (data) {
                return db.invokeFunction("view.getView", [
                    {id: "employeesFilter"}
                ]);
            }).then(
            function (viewResult) {
                var fields = viewResult.viewOptions.fields;
                Util.sort(fields, "asc", "field");
                expect(fields).to.not.equal(undefined);
                expect(fields).to.have.length(2);
                expect(fields[0].field).to.eql("employee");
                expect(fields[1].field).to.eql("task");
            }).then(
            function () {
                var updates = [
                    {$collection: "employees", $insert: [
                        {name: "sourabh", _id: "sourabh"},
                        {name: "manjeet", _id: "manjeet"},
                        {name: "rajit", _id: "rajit"}
                    ]},
                    {$collection: "employeesFilter", $insert: [
                        {task: "filtering", employee: {$query: {"name": "sourabh"}}},
                        {task: "KT", employee: {$query: {"name": "manjeet"}}},
                        {task: "autoload", employee: {$query: {"name": "rajit"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "pl.qviews", $filter: {id: "employeesFilter"}});
            }).then(function (data) {
                var _id = data.result[0]._id;
                var updates = {$collection: "pl.qviews", $update: [
                    {_id: _id, $set: {"filter": "{\"employee\":\"sourabh\"}"}}
                ]};
                return db.update(updates);
            }).then(function () {
                var v = {};
                v.id = "employeesFilter";
                return db.invokeFunction("view.getView", [v]);
            }).then(function (data) {
//                console.log(" view of employeesFilter >>>" + JSON.stringify(data));
                expect(data.data.result.length).to.eql(1);
                expect(data.data.result[0].task).to.eql("filtering");
                expect(data.data.result[0].employee.name).to.eql("sourabh");
                expect(data.viewOptions.queryGrid.$filter).not.have.property("employee");
                //copy from the brower when a filter is defined by user
                var params = [
                    {"viewid": "employeesFilter", "state": {"lastSelectedInfo": "Filter", "filterInfo": [
                        {"employee": {"name": "rajit"}, "field": "employee", "ui": "autocomplete", "__selected__": true, "filter": {"employee": "rajit"}, "filterOperators": {"label": "=="}}
                    ]}, "sourceid": "employees"}
                ];
                return db.invokeFunction("SaveUserState.saveUserState", params);
            }).then(function () {
                var v = {};
                v.id = "employeesFilter";
                v.sourceid = "employees";
                return db.invokeFunction("view.getView", [v]);
            }).then(function (data) {
//                console.log(" view of employeesFilter after filter 2>>>" + JSON.stringify(data));
                expect(data.data.result.length).to.eql(0);
                expect(data.viewOptions.queryGrid.$filter).have.property("employee");
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("combine the universal parameters filter", function (done) {
        var db = undefined;
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var daffodilOrganizationId = undefined;
                return db.update([
                    {$collection: "pl.collections", $insert: [
                        {collection: "sessions"},
                        {collection: "organisation"},
                        {collection: "hiring"}

                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "name", type: "string", collectionid: {$query: {collection: "organisation"}}, index: 0, visibility: true},
                        {field: "name", type: "string", collectionid: {$query: {collection: "sessions"}}, index: 0, visibility: true},
                        {field: "current", type: "boolean", collectionid: {$query: {collection: "sessions"}}, index: 1, visibility: true},
                        {field: "org_id", type: "fk", collectionid: {$query: {collection: "sessions"}}, index: 1, visibility: true, collection: "organisation", displayField: "name", set: ["name"], filterable: true},
                        {field: "sessionid", type: "fk", collectionid: {$query: {collection: "hiring"}}, index: 1, visibility: true, collection: "sessions", displayField: "name", set: ["name"], filterable: true},
                        {field: "name", type: "string", collectionid: {$query: {collection: "hiring"}}, index: 0, visibility: true}
                    ]},
                    {$collection: "pl.qviews", $insert: [
                        {label: "hiring", id: "hiring", collection: {$query: {collection: "hiring"}}, mainCollection: {$query: {collection: "hiring"}}}
                    ]},
                    {
                        "$collection": "pl.actions",
                        "$insert": [
                            {
                                "index": 1000,
                                "id": "filterId",
                                "label": "filterLabel",
                                "type": "filter",
                                "filterType": "fk",
                                "field": "sessionid",
                                collection : "sessions",
                                displayField : "name",
                                "collectionid": {"$query": {
                                    "collection": "hiring"
                                }},
                                "defaultFilter": JSON.stringify({"$filter":{"current":true,"org_id._id":"$organization_universal_filter"}}),
                                "visibilityFilter": "Always",
                                "visibility" : true

                            }
                        ]
                    }
                ]);
            }).then(
            function () {
                var updates = [
                    {$collection: "organisation", $insert: [
                        {name: "daffodil"},
                        {name: "applane"}
                    ]},
                    {$collection: "sessions", $insert: [
                        {_id :"1", name: "2014-15", current: true, org_id: {$query: {"name": "daffodil"}}},
                        {_id :"2",name: "2014-15", current: true, org_id: {$query: {"name": "applane"}}},
                        {_id :"3",name: "2013-14", current: false, org_id: {$query: {"name": "daffodil"}}},
                        {_id :"4",name: "2013-14", current: false, org_id: {$query: {"name": "applane"}}}
                    ]},
                    {$collection: "hiring", $insert: [
                        {name: "sg", sessionid :{$query:{_id :"1"}}},
                        {name: "ms", sessionid :{$query:{_id :"2"}}},
                        {name: "sa", sessionid :{$query:{_id :"1"}}},
                        {name: "av", sessionid :{$query:{_id :"3"}}},
                        {name: "rg", sessionid :{$query:{_id :"4"}}},
                        {name: "rr", sessionid :{$query:{_id :"1"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(function(){
                return db.query({$collection: "organisation", $filter: {name: "daffodil"}});
            }).then(function (result) {
                result = result.result;
                if(result && result.length >0){
                    daffodilOrganizationId = result[0]._id;
                }
                return db.mongoUpdate({$collection:"pl.users",$update:{$query:{_id:db.user._id},$set:{"filterspace.organization_universal_filter.filter.filterInfo":JSON.stringify({"field":"organization_universal_filter","ui":"autocomplete","filterspace":"organization_universal_filter","__selected__":true,"filter":{"organization_universal_filter":daffodilOrganizationId},"filterOperators":{"label":"=="},"organization_universal_filter":{"_id":daffodilOrganizationId}})}}});
            }).then(function (data) {
                var v = {};
                v.id = "hiring";
                return db.invokeFunction("view.getView", [v]);
            }).then(function (data) {
//                console.log(" view of employeesFilter after filter 2>>>" + JSON.stringify(data));
                expect(data.data.result.length).to.eql(3);
                expect(data.data.result[0].name).to.eql("rr");
                expect(data.data.result[1].name).to.eql("sa");
                expect(data.data.result[1].sessionid.name).to.eql("2014-15");
                expect(data.viewOptions.queryGrid.$filter.sessionid).to.eql("1");

                done();
            }).fail(function (err) {
                done(err);
            })
    })
});