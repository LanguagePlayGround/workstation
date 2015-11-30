/**
 * mocha --recursive --timeout 150000 -g "UDTtestcase" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert currency type field" --reporter spec
 * mocha --recursive --timeout 150000 -g "update currency type field" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert duration type field" --reporter spec
 *
 *
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");
describe("UDTtestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    it("insert duration type field", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "estimatedefforts", type: "duration", fields: [
                            {field: "time", type: "decimal"},
                            {field: "unit", type: "string"},
                            {field: "convertedvalue", type: "number"}
                        ]}
                    ]}, $insert: [
                        {"task": "Implement UDT Module", "estimatedefforts": {"time": "5", "unit": "Hrs"}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "tasks", $fields: {task: 1, estimatedefforts: 1}, $sort: {country: 1}});
            }).then(
            function (tasks) {
//                console.log("tasks data>>>>>>>>>>." + JSON.stringify(tasks));
                expect(tasks.result).to.have.length(1);
                expect(tasks.result[0].estimatedefforts.time).to.eql(5);
                expect(tasks.result[0].estimatedefforts.unit).to.eql("Hrs");
                expect(tasks.result[0].estimatedefforts.convertedvalue).to.eql(300);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("insert duration type field inside object", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "estimatedefforts", type: "duration", fields: [
                            {field: "time", type: "decimal"},
                            {field: "unit", type: "string"},
                            {field: "convertedvalue", type: "number"}
                        ]},
                        {field: "progress", type: "object", fields: [
                            {field: "progress", type: "string"},
                            {field: "progresshrs", type: "duration", fields: [
                                {field: "time", type: "decimal"},
                                {field: "unit", type: "string"},
                                {field: "convertedvalue", type: "number"}
                            ]}
                        ]}
                    ]}, $insert: [
                        {"task": "Implement UDT Module", "estimatedefforts": {"time": "5", "unit": "Hrs"}, progress: {"progress": "completed", "progresshrs": {"time": "5", "unit": "Hrs"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "tasks", $sort: {country: 1}});
            }).then(
            function (tasks) {
                expect(tasks.result).to.have.length(1);
                expect(tasks.result[0].estimatedefforts.time).to.eql(5);
                expect(tasks.result[0].estimatedefforts.unit).to.eql("Hrs");
                expect(tasks.result[0].estimatedefforts.convertedvalue).to.eql(300);

                expect(tasks.result[0].progress.progresshrs.time).to.eql(5);
                expect(tasks.result[0].progress.progresshrs.unit).to.eql("Hrs");
                expect(tasks.result[0].progress.progresshrs.convertedvalue).to.eql(300);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("insert duration type field inside array", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "estimatedefforts", type: "duration", fields: [
                            {field: "time", type: "decimal"},
                            {field: "unit", type: "string"},
                            {field: "convertedvalue", type: "number"}
                        ]},
                        {field: "progress", type: "object", multiple: true, fields: [
                            {field: "progress", type: "string"},
                            {field: "progresshrs", type: "duration", fields: [
                                {field: "time", type: "decimal"},
                                {field: "unit", type: "string"},
                                {field: "convertedvalue", type: "number"}
                            ]}
                        ]}
                    ]}, $insert: [
                        {"task": "Implement UDT Module", "estimatedefforts": {"time": "5", "unit": "Hrs"}, progress: [
                            {"progress": "completed", "progresshrs": {"time": "1", "unit": "Hrs"}},
                            {progress: "pending", progresshrs: {"time": "4", "unit": "Days"}}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "tasks", $sort: {country: 1}});
            }).then(
            function (tasks) {
                expect(tasks.result).to.have.length(1);
                expect(tasks.result[0].estimatedefforts.time).to.eql(5);
                expect(tasks.result[0].estimatedefforts.unit).to.eql("Hrs");
                expect(tasks.result[0].estimatedefforts.convertedvalue).to.eql(300);

                expect(tasks.result[0].progress[0].progresshrs.time).to.eql(1);
                expect(tasks.result[0].progress[0].progresshrs.unit).to.eql("Hrs");
                expect(tasks.result[0].progress[0].progresshrs.convertedvalue).to.eql(60);

                expect(tasks.result[0].progress[1].progresshrs.time).to.eql(4);
                expect(tasks.result[0].progress[1].progresshrs.unit).to.eql("Days");
                expect(tasks.result[0].progress[1].progresshrs.convertedvalue).to.eql(1920);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    // currency test cases

    it("insert currency type field", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "products", fields: [
                        {field: "name", type: "string"},
                        {field: "cost", type: "currency", fields: [
                            {field: "amount", type: "decimal"},
                            {field: "type", type: "fk", collection: "pl.currencies", set: ["currency"], upsert: true}
                        ]}
                    ]}, $insert: [
                        {"product": "personal computer", "cost": {"amount": "50000", "type": {$query: {"currency": "INR"}}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "products", $sort: {country: 1}});
            }).then(
            function (products) {
                expect(products.result).to.have.length(1);
                expect(products.result[0].cost.amount).to.eql(50000);
                expect(products.result[0].cost.type.currency).to.eql("INR");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("insert currency type field inside object", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "products", fields: [
                        {field: "name", type: "string"},
                        {field: "cost", type: "currency", fields: [
                            {field: "amount", type: "decimal"},
                            {field: "type", type: "fk", collection: "pl.currencies", set: ["currency"], upsert: true}
                        ]},
                        {field: "dealers", type: "object", fields: [
                            {field: "location", type: "string"},
                            {field: "dealprice", type: "currency", fields: [
                                {field: "amount", type: "decimal"},
                                {field: "type", type: "fk", collection: "pl.currencies", set: ["currency"], upsert: true}
                            ]}
                        ]}
                    ]}, $insert: [
                        {"product": "personal computer", "cost": {"amount": "50000", "type": {$query: {"currency": "INR"}}}, dealers: {"location": "delhi", dealprice: {"amount": "51000", type: {$query: {"currency": "INR"}}}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: {"collection": "products", fields: [
                    {field: "name", type: "string"},
                    {field: "cost", type: "currency"},
                    {field: "dealers", type: "object", fields: [
                        {field: "location", type: "string"},
                        {field: "dealprice", type: "currency"}
                    ]}
                ]}, $sort: {country: 1}});
            }).then(
            function (products) {
                expect(products.result).to.have.length(1);
                expect(products.result[0].cost.amount).to.eql(50000);
                expect(products.result[0].cost.type.currency).to.eql("INR");
                expect(products.result[0].dealers.dealprice.amount).to.eql(51000);
                expect(products.result[0].dealers.dealprice.type.currency).to.eql("INR");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("insert currency type field inside nested array", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "products", fields: [
                        {field: "name", type: "string"},
                        {field: "cost", type: "currency", fields: [
                            {field: "amount", type: "decimal"},
                            {field: "type", type: "fk", collection: "pl.currencies", set: ["currency"], upsert: true}
                        ]},
                        {field: "dealers", type: "object", multiple: true, fields: [
                            {field: "location", type: "string"},
                            {field: "dealprice", type: "currency", fields: [
                                {field: "amount", type: "decimal"},
                                {field: "type", type: "fk", collection: "pl.currencies", set: ["currency"], upsert: true}
                            ]},
                            {field: "coupons", type: "object", multiple: true, fields: [
                                {field: "code", type: "string"},
                                {field: "price", type: "currency", fields: [
                                    {field: "amount", type: "decimal"},
                                    {field: "type", type: "fk", collection: "pl.currencies", set: ["currency"], upsert: true}
                                ]}
                            ]}
                        ]}
                    ]}, $insert: [
                        {"product": "personal computer", "cost": {"amount": "50000", "type": {$query: {"currency": "INR"}}}, dealers: [
                            {"location": "delhi", dealprice: {"amount": "51000", type: {$query: {"currency": "INR"}}}, "coupons": [
                                {"code": "12DFt21", "price": {"amount": "200", "type": {"$query": {"currency": "DOLLAR"}}}},
                                {"code": "324RTSE", "price": {"amount": "100", "type": {"$query": {"currency": "YEN"}}}}
                            ]},
                            {"location": "chandigarh", dealprice: {"amount": "49000", type: {$query: {"currency": "INR"}}}, "coupons": [
                                {"code": "9045jkret", "price": {"amount": "50", "type": {"$query": {"currency": "DOLLAR"}}}},
                                {"code": "45qh45r4", "price": {"amount": "20", "type": {"$query": {"currency": "YEN"}}}}
                            ]}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: {"collection": "products", fields: [
                    {field: "name", type: "string"},
                    {field: "cost", type: "currency"},
                    {field: "dealers", type: "object", multiple: true, fields: [
                        {field: "location", type: "string"},
                        {field: "dealprice", type: "currency"},
                        {field: "coupons", type: "object", multiple: true, fields: [
                            {field: "code", type: "string"},
                            {field: "price", type: "currency"}
                        ]}
                    ]}
                ]}, $sort: {country: 1}});
            }).then(
            function (products) {
                expect(products.result).to.have.length(1);
                expect(products.result[0].cost.amount).to.eql(50000);
                expect(products.result[0].cost.type.currency).to.eql("INR");

                expect(products.result[0].dealers[0].location).to.eql("delhi");
                expect(products.result[0].dealers[0].dealprice.amount).to.eql(51000);
                expect(products.result[0].dealers[0].dealprice.type.currency).to.eql("INR");
                expect(products.result[0].dealers[0].coupons[0].code).to.eql("12DFt21");
                expect(products.result[0].dealers[0].coupons[0].price.amount).to.eql(200);
                expect(products.result[0].dealers[0].coupons[0].price.type.currency).to.eql("DOLLAR");
                expect(products.result[0].dealers[0].coupons[1].code).to.eql("324RTSE");
                expect(products.result[0].dealers[0].coupons[1].price.amount).to.eql(100);
                expect(products.result[0].dealers[0].coupons[1].price.type.currency).to.eql("YEN");

                expect(products.result[0].dealers[1].location).to.eql("chandigarh");
                expect(products.result[0].dealers[1].dealprice.amount).to.eql(49000);
                expect(products.result[0].dealers[1].dealprice.type.currency).to.eql("INR");
                expect(products.result[0].dealers[1].coupons[0].code).to.eql("9045jkret");
                expect(products.result[0].dealers[1].coupons[0].price.amount).to.eql(50);
                expect(products.result[0].dealers[1].coupons[0].price.type.currency).to.eql("DOLLAR");
                expect(products.result[0].dealers[1].coupons[1].code).to.eql("45qh45r4");
                expect(products.result[0].dealers[1].coupons[1].price.amount).to.eql(20);
                expect(products.result[0].dealers[1].coupons[1].price.type.currency).to.eql("YEN");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("update currency type field", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "products", fields: [
                        {field: "name", type: "string"},
                        {field: "cost", type: "currency", fields: [
                            {field: "amount", type: "decimal"},
                            {field: "type", type: "fk", collection: "pl.currencies", set: ["currency"], upsert: true}
                        ]}
                    ]}, $insert: [
                        {_id: 1, "product": "personal computer", "cost": {"amount": "50000", "type": {$query: {"currency": "INR"}}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "products"});
            }).then(
            function (products) {
                expect(products.result).to.have.length(1);
                expect(products.result[0].cost.amount).to.eql(50000);
                expect(products.result[0].cost.type.currency).to.eql("INR");
                var newUpdates = [
                    {$collection: {"collection": "products", fields: [
                        {field: "name", type: "string"},
                        {field: "cost", type: "currency", fields: [
                            {field: "amount", type: "decimal"},
                            {field: "type", type: "fk", collection: "pl.currencies", set: ["currency"], upsert: true}
                        ]}
                    ]}, $update: [
                        /*{_id: 1, $set: {"cost": { $set: {"amount": "250000"}}}}*/
                        {_id: 1, $set: {"cost": {"amount": "250000", type: {$query: {currency: "INR"}}}}}
                    ]}
                ]
                return db.update(newUpdates);
            }).then(function () {
                return db.query({$collection: "products"});
            }).then(function (products) {

                expect(products.result).to.have.length(1);
                expect(products.result[0].cost.amount).to.eql(250000);
                expect(products.result[0].cost.type.currency).to.eql("INR");
                done();
            }).fail(function (err) {
                done(err);
            });
    })
    it("update currency type field in array", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "products", fields: [
                        {field: "name", type: "string"},
                        {field: "bill", type: "object", multiple: true, fields: [
                            {field: "cost", type: "currency", fields: [
                                {field: "amount", type: "decimal"},
                                {field: "type", type: "fk", collection: "pl.currencies", set: ["currency"], upsert: true}
                            ]}
                        ]}
                    ]}, $insert: [
                        {_id: 1, "product": "personal computer", bill: [
                            {"cost": {"amount": "50000", "type": {$query: {"currency": "INR"}}}}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "products"});
            }).then(
            function (products) {
                expect(products.result).to.have.length(1);
                expect(products.result[0].bill[0].cost.amount).to.eql(50000);
                expect(products.result[0].bill[0].cost.type.currency).to.eql("INR");
                var newUpdates = [
                    {$collection: {"collection": "products", fields: [
                        {field: "name", type: "string"},
                        {field: "bill", type: "object", multiple: true, fields: [
                            {field: "cost", type: "currency", fields: [
                                {field: "amount", type: "decimal"},
                                {field: "type", type: "fk", collection: "pl.currencies", set: ["currency"], upsert: true}
                            ]}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: {bill: {$update: [
                            {_id: products.result[0].bill[0]._id, $set: {"cost": {"amount": "2550000", type: {$query: {currency: "INR"}}}}}
                        ]}}}
                    ]}
                ]
                return db.update(newUpdates);
            }).then(function () {
                return db.query({$collection: "products"});
            }).then(function (products) {

                expect(products.result).to.have.length(1);
                expect(products.result[0].bill[0].cost.amount).to.eql(2550000);
                expect(products.result[0].bill[0].cost.type.currency).to.eql("INR");
                done();
            }).fail(function (err) {
                done(err);
            });
    })

    it("update duration type field", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "estimatedefforts", type: "duration", fields: [
                            {field: "time", type: "decimal"},
                            {field: "unit", type: "string"},
                            {field: "convertedvalue", type: "number"}
                        ]}
                    ]}, $insert: [
                        {_id: 1, "task": "Implement UDT Module", "estimatedefforts": {"time": "5", "unit": "Hrs"}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "tasks"});
            }).then(
            function (tasks) {
                expect(tasks.result).to.have.length(1);
                expect(tasks.result[0].estimatedefforts.time).to.eql(5);
                expect(tasks.result[0].estimatedefforts.unit).to.eql("Hrs");
                expect(tasks.result[0].estimatedefforts.convertedvalue).to.eql(300);
                var newUpdates = [
                    {$collection: {"collection": "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "estimatedefforts", type: "duration", fields: [
                            {field: "time", type: "decimal"},
                            {field: "unit", type: "string"},
                            {field: "convertedvalue", type: "number"}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: { "estimatedefforts": {$set: {"time": "10"}}}}
                    ]}
                ]
                return   db.update(newUpdates);
            }).then(function () {
                return db.query({$collection: "tasks"});
            }).then(function (tasks) {
//                console.log("tasks after updation>>>" + JSON.stringify(tasks));
                expect(tasks.result).to.have.length(1);
                expect(tasks.result[0].estimatedefforts.time).to.eql(10);
                expect(tasks.result[0].estimatedefforts.unit).to.eql("Hrs");
                expect(tasks.result[0].estimatedefforts.convertedvalue).to.eql(600);
                done();
            }).fail(function (err) {
                done(err);
            });
    })


    it("update duration type field override object", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "estimatedefforts", type: "duration", fields: [
                            {field: "time", type: "decimal"},
                            {field: "unit", type: "string"},
                            {field: "convertedvalue", type: "number"}
                        ]}
                    ]}, $insert: [
                        {_id: 1, "task": "Implement UDT Module", "estimatedefforts": {"time": "5", "unit": "Hrs"}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "tasks"});
            }).then(
            function (tasks) {
                expect(tasks.result).to.have.length(1);
                expect(tasks.result[0].estimatedefforts.time).to.eql(5);
                expect(tasks.result[0].estimatedefforts.unit).to.eql("Hrs");
                expect(tasks.result[0].estimatedefforts.convertedvalue).to.eql(300);
                var newUpdates = [
                    {$collection: {"collection": "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "estimatedefforts", type: "duration", fields: [
                            {field: "time", type: "decimal"},
                            {field: "unit", type: "string"},
                            {field: "convertedvalue", type: "number"}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: {"task": "testing", "estimatedefforts": {"time": "10", unit: "Hrs"}}}
                    ]}
                ]
                return db.update(newUpdates);
            }).then(function () {
                return db.query({$collection: "tasks"});
            }).then(function (tasks) {
//                console.log("tasks after updation>>>" + JSON.stringify(tasks));
                expect(tasks.result).to.have.length(1);
                expect(tasks.result[0].estimatedefforts.time).to.eql(10);
                expect(tasks.result[0].estimatedefforts.unit).to.eql("Hrs");
                expect(tasks.result[0].estimatedefforts.convertedvalue).to.eql(600);
                done();
            }).fail(function (err) {
                done(err);
            });
    })

    it("insert file type field", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "products", fields: [
                        {field: "name", type: "string"},
                        {field: "file", type: "file", fields: [
                            {field: "key", type: "string"},
                            {field: "name", type: "string"},
                            {field: "url", type: "string"}
                        ]}
                    ]}, $insert: [
                        {"product": "personal computer", "file": {"key": "111222", "name": "abc"}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "products"});
            }).then(
            function (products) {
                expect(products.result).to.have.length(1);
                expect(products.result[0].file.key).to.eql("111222");
                expect(products.result[0].file.name).to.eql("abc");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("insert file type field inside object", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "products", fields: [
                        {field: "name", type: "string"},
                        {field: "file", type: "file", fields: [
                            {field: "key", type: "string"},
                            {field: "name", type: "string"},
                            {field: "url", type: "string"}
                        ]},
                        {field: "dealers", type: "object", fields: [
                            {field: "location", type: "string"},
                            {field: "file", type: "file", fields: [
                                {field: "key", type: "string"},
                                {field: "name", type: "string"},
                                {field: "url", type: "string"}
                            ]}
                        ]}
                    ]}, $insert: [
                        {"product": "personal computer", "file": {"key": "1111", "name": "abc"}, dealers: {"location": "delhi", "file": {"key": "2222", "name": "xyz"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: {"collection": "products", fields: [
                    {field: "name", type: "string"},
                    {field: "file", type: "file"},
                    {field: "dealers", type: "object", fields: [
                        {field: "location", type: "string"},
                        {field: "file", type: "file"}
                    ]}
                ]}, $sort: {country: 1}});
            }).then(
            function (products) {
                expect(products.result).to.have.length(1);
                expect(products.result[0].file.key).to.eql("1111");
                expect(products.result[0].file.name).to.eql("abc");
                expect(products.result[0].dealers.file.key).to.eql("2222");
                expect(products.result[0].dealers.file.name).to.eql("xyz");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("insert file type field inside nested array", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "products", fields: [
                        {field: "name", type: "string"},
                        {field: "file", type: "file", fields: [
                            {field: "key", type: "string"},
                            {field: "name", type: "string"},
                            {field: "url", type: "string"}
                        ]},
                        {field: "dealers", type: "object", multiple: true, fields: [
                            {field: "location", type: "string"},
                            {field: "file", type: "file", fields: [
                                {field: "key", type: "string"},
                                {field: "name", type: "string"},
                                {field: "url", type: "string"}
                            ]},
                            {field: "coupons", type: "object", multiple: true, fields: [
                                {field: "code", type: "string"},
                                {field: "file", type: "file", fields: [
                                    {field: "key", type: "string"},
                                    {field: "name", type: "string"},
                                    {field: "url", type: "string"}
                                ]}
                            ]}
                        ]}
                    ]}, $insert: [
                        {"product": "personal computer", "file": {"key": "1111", "name": "crocodile"}, dealers: [
                            {"location": "delhi", "file": {"key": "2211", "name": "gorilla"}, "coupons": [
                                {"code": "12DFt21", "file": {"key": "3111", "name": "pug"}},
                                {"code": "324RTSE", "file": {"key": "3122", "name": "dalmatian"}}
                            ]},
                            {"location": "chandigarh", "file": {"key": "2222", "name": "monkey"}, "coupons": [
                                {"code": "9045jkret", "file": {"key": "3211", "name": "pitbull"}},
                                {"code": "45qh45r4", "file": {"key": "3222", "name": "husky"}}
                            ]}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: {"collection": "products", fields: [
                    {field: "name", type: "string"},
                    {field: "file1", type: "file"},
                    {field: "dealers", type: "object", multiple: true, fields: [
                        {field: "location", type: "string"},
                        {field: "file2", type: "file"},
                        {field: "coupons", type: "object", multiple: true, fields: [
                            {field: "code", type: "string"},
                            {field: "file3", type: "file"}
                        ]}
                    ]}
                ]}, $sort: {country: 1}});
            }).then(
            function (products) {
                expect(products.result).to.have.length(1);
                expect(products.result[0].file.key).to.eql("1111");
                expect(products.result[0].file.name).to.eql("crocodile");

                expect(products.result[0].dealers[0].location).to.eql("delhi");
                expect(products.result[0].dealers[0].file.key).to.eql("2211");
                expect(products.result[0].dealers[0].file.name).to.eql("gorilla");
                expect(products.result[0].dealers[0].coupons[0].code).to.eql("12DFt21");
                expect(products.result[0].dealers[0].coupons[0].file.key).to.eql("3111");
                expect(products.result[0].dealers[0].coupons[0].file.name).to.eql("pug");
                expect(products.result[0].dealers[0].coupons[1].code).to.eql("324RTSE");
                expect(products.result[0].dealers[0].coupons[1].file.key).to.eql("3122");
                expect(products.result[0].dealers[0].coupons[1].file.name).to.eql("dalmatian");

                expect(products.result[0].dealers[1].location).to.eql("chandigarh");
                expect(products.result[0].dealers[1].file.key).to.eql("2222");
                expect(products.result[0].dealers[1].file.name).to.eql("monkey");
                expect(products.result[0].dealers[1].coupons[0].code).to.eql("9045jkret");
                expect(products.result[0].dealers[1].coupons[0].file.key).to.eql("3211");
                expect(products.result[0].dealers[1].coupons[0].file.name).to.eql("pitbull");
                expect(products.result[0].dealers[1].coupons[1].code).to.eql("45qh45r4");
                expect(products.result[0].dealers[1].coupons[1].file.key).to.eql("3222");
                expect(products.result[0].dealers[1].coupons[1].file.name).to.eql("husky");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("update file type field", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "products", fields: [
                        {field: "name", type: "string"},
                        {field: "file", type: "file", fields: [
                            {field: "key", type: "string"},
                            {field: "name", type: "string"},
                            {field: "url", type: "string"}
                        ]}
                    ]}, $insert: [
                        {_id: 1, "product": "personal computer", "file": {"key": "1111", "name": "Gorillaz"}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "products"});
            }).then(
            function (products) {
                expect(products.result).to.have.length(1);
                expect(products.result[0].file.key).to.eql("1111");
                expect(products.result[0].file.name).to.eql("Gorillaz");
                var newUpdates = [
                    {$collection: {"collection": "products", fields: [
                        {field: "name", type: "string"},
                        {field: "file", type: "file", fields: [
                            {field: "key", type: "string"},
                            {field: "name", type: "string"},
                            {field: "url", type: "string"}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: {"file": { $set: {"name": "GnR", key: "2222"}}}}
                    ]}
                ]
                return  db.update(newUpdates);
            }).then(function () {
                return db.query({$collection: "products"});
            }).then(function (products) {
                expect(products.result).to.have.length(1);
                expect(products.result[0].file.key).to.eql("2222");
                expect(products.result[0].file.name).to.eql("GnR");
                done();
            }).fail(function (err) {
                done(err);
            });
    })

    it("update case of duration nochange error", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {collection: "employees", fields: [
                        {field: "cost", type: "currency", fields: [
                            {field: "amount", type: "decimal"},
                            {field: "type", type: "fk", collection: "pl.currencies", set: ["currency"], upsert: true}
                        ]}
                    ]}, $insert: [
                        { _id: 1, "cost": {amount: "5", type: {$query: {currency: "INR"}}}}
                    ]
                    }
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "employees"});
            }).then(
            function (data) {
//                console.log("data after insert>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].cost.amount).to.eql(5);
                expect(data.result[0].cost.type.currency).to.eql("INR");
                var updates = [
                    {"$update": [
                        {"$set": {"cost": {"$set": {"amount": 1}}}, "_id": 1}
                    ], "$collection": {collection: "employees", fields: [
                        {field: "cost", type: "currency", fields: [
                            {field: "amount", type: "decimal"},
                            {field: "type", type: "fk", collection: "pl.currencies", set: ["currency"], upsert: true}
                        ]}
                    ]}}
                ];
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "employees"});
            }).then(function (data) {
//                console.log("data after update" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].cost.amount).to.eql(1);
                expect(data.result[0].cost.type.currency).to.eql("INR");
                done();
            }).fail(function (err) {
                done(err);
            });

    })

    it("delete record with  duration type field", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "estimatedefforts", type: "duration", fields: [
                            {field: "time", type: "decimal"},
                            {field: "unit", type: "string"},
                            {field: "convertedvalue", type: "number"}
                        ]}
                    ]}, $insert: [
                        {"task": "Implement UDT Module", "estimatedefforts": {"time": "5", "unit": "Hrs"}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "tasks", $fields: {task: 1, estimatedefforts: 1}, $sort: {country: 1}});
            }).then(
            function (tasks) {
//                console.log("tasks data>>>>>>>>>>." + JSON.stringify(tasks));
                expect(tasks.result).to.have.length(1);
                expect(tasks.result[0].estimatedefforts.time).to.eql(5);
                expect(tasks.result[0].estimatedefforts.unit).to.eql("Hrs");
                expect(tasks.result[0].estimatedefforts.convertedvalue).to.eql(300);
                var updates = [
                    {$collection: {"collection": "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "estimatedefforts", type: "duration", fields: [
                            {field: "time", type: "decimal"},
                            {field: "unit", type: "string"},
                            {field: "convertedvalue", type: "number"}
                        ]}
                    ]}, $delete: [
                        {_id: tasks.result[0]._id}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "tasks", $fields: {task: 1, estimatedefforts: 1}, $sort: {country: 1}});
            }).then(function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });

});



