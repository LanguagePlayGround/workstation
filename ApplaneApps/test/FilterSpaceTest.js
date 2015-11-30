/**
 * Created by Manjeet on 7/28/14.
 */
var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Config = require("ApplaneDB/test/config.js").config;
var Testcases = require("ApplaneDB/test/TestCases.js");


describe("FitlerSpace testcase", function () {
    beforeEach(function (done) {
        return Testcases.beforeEach(done);
    });
    afterEach(function (done) {
        return Testcases.afterEach(done);
    });
    it.skip("FilterSpace Test Case", function (done) {
        var db = undefined;
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "vendors"},
                        {collection: "products"},
                        {collection: "profitcenters"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection: "pl.filterspace", $insert: [
                        {space: "pcenter"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function (data) {
                return db.query({$collection: "pl.filterspace"});
            }).then(
            function (data) {
                if (data && data.result && data.result.length > 0) {
                    data = data.result[0];
                }
                var updates = [
                    {$collection: "pl.fields", $insert: [
                        {field: "name", type: "string", collectionid: {$query: {collection: "profitcenters"}}},
                        {field: "vendorname", type: "string", collectionid: {$query: {collection: "vendors"}}},
                        {field: "profitcenter", type: "fk", collectionid: {$query: {collection: "vendors"}}, collection: "profitcenters", displayField: "name", filterable: true, filterspace: data.space},
                        {field: "productname", type: "string", collectionid: {$query: {collection: "products"}}},
                        {field: "profitcenter_id", type: "fk", collectionid: {$query: {collection: "products"}}, collection: "profitcenters", displayField: "name", filterspace: data.space, filterable: true}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function (data) {
                var updates = [
                    {$collection: "profitcenters", $insert: [
                        {name: "applane"},
                        {name: "daffodil"}
                    ]},
                    {$collection: "vendors", $insert: [
                        {name: "v1", profitcenter: {$query: {name: "applane"}}},
                        {name: "v2", profitcenter: {$query: {name: "daffodil"}}},
                        {name: "v3", profitcenter: {$query: {name: "applane"}}}
                    ]},
                    {$collection: "products", $insert: [
                        {name: "p1", profitcenter_id: {$query: {name: "daffodil"}}},
                        {name: "p2", profitcenter_id: {$query: {name: "applane"}}},
                        {name: "p3", profitcenter_id: {$query: {name: "daffodil"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection: {collection: "pl.qviews", fields: [
                        {field: "id", type: "string"},
                        {"field": "collection", type: "fk", collection: "pl.collections", displayField: "collection", set: ["collection"]}
                    ]}, $insert: [
                        {id: "vendorview", collection: {$query: {collection: "vendors"}}},
                        {id: "productview", collection: {$query: {collection: "products"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "pl.qviews", $filter: {"id": "vendorview"}});
            }).then(
            function (data) {
                return db.query({$collection: "vendors"});
            }).then(
            function (data) {
                return db.query({$collection: "products"});
            }).then(
            function () {
                return db.query({$collection: "profitcenters"});
            }).then(
            function (data) {
                if (data && data.result && data.result.length > 0) {
                    data = data.result[0];
                    var update = {};
                    update.field = "profitcenter";
                    update.ui = "autocomplete";
                    update["profitcenter"] = {_id: data._id, name: data.name};
                    update.filterspace = "pcenter";
                    var filter = {};
                    filter["profitcenter"] = data._id;
                    filter.filterOperators = {"label": "$eq"};
                    update.filter = filter;
                    var userState = {};
                    var updates = {};
                    updates.filterSpaceInfo = [update];
                    userState.viewid = "vendorview";
                    userState.state = updates;
                    return db.invokeFunction("SaveUserState.saveUserState", [userState]);
                }
            }).then(
            function (data) {
                var v = {};
                v.id = "vendorview";
                return db.invokeFunction("view.getView", [v]);
            }).then(
            function (data) {
                expect(data.data.result).to.have.length(2);
                expect(data.data.result[0].name).to.eql("v3");
                expect(data.data.result[1].name).to.eql("v1");
                var v = {};
                v.id = "productview";
                return db.invokeFunction("view.getView", [v]);
            }).then(
            function (data) {
                expect(data.data.result).to.have.length(1);
                expect(data.data.result[0].name).to.eql("p2");
            }).then(
            function (data) {
                done();
            }).fail(function (err) {
                done(err);
            });
    });


    it.skip("FilterSpace Test Case using Function CurrentFilterSpace", function (done) {
        var db = undefined;
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "students"},
                        {collection: "classes"},
                        {collection: "profitcenters"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection: "pl.filterspace", $insert: [
                        {space: "afe_profit_center"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function (data) {
                return db.query({$collection: "pl.filterspace"});
            }).then(
            function (data) {
                if (data && data.result && data.result.length > 0) {
                    data = data.result[0];
                    var updates = [
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "profitcenters"}}},
                            {field: "name", type: "string", collectionid: {$query: {collection: "students"}}},
                            {field: "rollno", type: "number", collectionid: {$query: {collection: "students"}}},
                            {field: "profitcenterid", type: "fk", collectionid: {$query: {collection: "students"}}, collection: "profitcenters", displayField: "name", filterable: true, filterspace: data.space},
                            {field: "class", type: "string", collectionid: {$query: {collection: "classes"}}},
                            {field: "profitcenter_id", type: "fk", collectionid: {$query: {collection: "classes"}}, collection: "profitcenters", displayField: "name", filterspace: data.space, filterable: true}
                        ]}
                    ];
                    return db.update(updates);
                }
            }).then(
            function (data) {
                var updates = [
                    {$collection: "profitcenters", $insert: [
                        {name: "DPS Hisar"},
                        {name: "DPS Delhi"},
                        {name: "DPS Chandigarh"}
                    ]},
                    {$collection: "students", $insert: [
                        {name: "ashu vashishat", profitcenterid: {$query: {name: "DPS Chandigarh"}}},
                        {name: "naveen singh", profitcenterid: {$query: {name: "DPS Delhi"}}},
                        {name: "sachin bansal", profitcenterid: {$query: {name: "DPS Hisar"}}}
                    ]},
                    {$collection: "classes", $insert: [
                        {class: "X1", profitcenter_id: {$query: {name: "DPS Chandigarh"}}},
                        {class: "X2", profitcenter_id: {$query: {name: "DPS Delhi"}}},
                        {class: "X3", profitcenter_id: {$query: {name: "DPS Hisar"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection: {collection: "pl.qviews", fields: [
                        {field: "id", type: "string"},
                        {"field": "collection", type: "fk", collection: "pl.collections", displayField: "collection", set: ["collection"]}
                    ]}, $insert: [
                        {id: "studentview", collection: {$query: {collection: "students"}}},
                        {id: "classesview", collection: {$query: {collection: "classes"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "classes", $filter: {"profitcenter_id": {"$function": {"Functions.CurrentFilterSpace": {"filterSpace": "afe_profit_center"}}}}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].class).to.eql("X1");
                expect(data.result[1].class).to.eql("X2");
                expect(data.result[2].class).to.eql("X3");
            }).then(
            function () {
                return db.query({$collection: "profitcenters"});
            }).then(
            function (data) {
                if (data && data.result && data.result.length > 0) {
                    data = data.result[0];
                    var update = {};
                    update.field = "profitcenterid";
                    update.ui = "autocomplete";
                    update["profitcenterid"] = {_id: data._id, name: data.name};
                    update.filterspace = "afe_profit_center";
                    var filter = {};
                    filter["profitcenterid"] = data._id;
                    filter.filterOperators = {"label": "$eq"};
                    update.filter = filter;
                    var userState = {};
                    var updates = {};
                    updates.filterSpaceInfo = [update];
                    userState.viewid = "studentview";
                    userState.state = updates;
                    return db.invokeFunction("SaveUserState.saveUserState", [userState]);
                }
            }).then(
            function (data) {
                var v = {};
                v.id = "studentview";
                return db.invokeFunction("view.getView", [v]);
            }).then(
            function (data) {
                expect(data.data.result).to.have.length(1);
                expect(data.data.result[0].name).to.eql("sachin bansal");
                var v = {};
                v.id = "classesview";
                return db.invokeFunction("view.getView", [v]);
            }).then(
            function (data) {
                expect(data.data.result).to.have.length(1);
                expect(data.data.result[0].class).to.eql("X3");
            }).then(
            function () {
                return db.query({$collection: "classes", $filter: {"profitcenter_id": {"$function": {"Functions.CurrentFilterSpace": {"filterSpace": "afe_profit_center"}}}}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].class).to.eql("X3");
            }).then(
            function () {
                return db.mongoUpdate({$collection: "pl.users", $update: [
                    {$query: {_id: db.user._id}, $unset: {"filterspace": ""}}
                ], $modules: {"Role": 0}});
            }).then(
            function (result) {
                return db.query({$collection: "classes", $filter: {"profitcenter_id": {"$function": {"Functions.CurrentFilterSpace": {"filterSpace": "afe_profit_center"}}}}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
            }).then(
            function (data) {
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("attached filter space testcase", function (done) {
        var db = undefined;
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection: "pl.collections", $insert: {"collection": "organizations"}},
                    {$collection: "pl.filterspace", $insert: [
                        {space: "organization_universal_filter"}
                    ]},
                    {$collection: "pl.fields", $insert: {field: "name", type: "string", collectionid: {$query: {"collection": "organizations"}}}}
                ]);
            }).then(function () {
                return db.update({$collection: "pl.attachedfilterspace", $insert: {
                    defaultFilter: JSON.stringify({org_id: null}),
                    recursiveFilter: true,
                    index: 10,
                    recursiveFilterField: "org_id",
                    collection: "organizations",
                    field: "name",
                    filterSpaceId: "organization_universal_filter",
                    label: "Organization"
                }});
            }).then(function () {
                var updates = [
                    {$collection: {collection: "pl.qviews", fields: [
                        {field: "id", type: "string"},
                        {"field": "collection", type: "fk", collection: "pl.collections", displayField: "collection", set: ["collection"]},
                        {"field": "mainCollection", type: "fk", collection: "pl.collections", displayField: "collection", set: ["collection"]}
                    ]}, $insert: [
                        {id: "organizationview", collection: {$query: {collection: "organizations"}}, mainCollection: {$query: {collection: "organizations"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                return db.update({$collection: "organizations", $insert: [
                    {name: "Daffodils Software Ltd."},
                    {name: "Six Continents"}
                ]})
            }).then(function () {
                return db.query({$collection: "organizations"});
            }).then(function (result) {
                var data = result.result && result.result.length > 0 ? result.result[0] : {};
                var update = {};
                update.field = "organization_universal_filter";
                update.ui = "autocomplete";
                update["organization_universal_filter"] = {_id: data._id, name: data.name};
                update.filterspace = "organization_universal_filter";
                var filter = {};
                filter["organization_universal_filter"] = data._id;
                update.filterOperators = {"label": "$eq"};
                update.filter = filter;
                var userState = {};
                var updates = {};
                updates.filterSpaceInfo = [update];
                userState.viewid = "organizationview";
                userState.state = updates;
                return db.invokeFunction("SaveUserState.saveUserState", [userState]);
            }).then(function () {
                var v = {};
                v.id = "organizationview";
                return db.invokeFunction("view.getView", [v]);
            }).then(function (result) {
                expect(result.viewOptions.queryGrid.$parameters).to.have.property('organization_universal_filter');
            }).then(function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
});