/**
 *  mocha --recursive --timeout 150000 -g "Function testcase" --reporter spec
 *

 >> To get employeeid of current user
 >>>>   $function :{"Functions.CurrentUser":{"referredFK":{collection:"employeess", "referredField":"user_id", field:"_id"}}}

 >> To get official_email_id of employees
 >>>> $filter:{"official_email_id" :{  $function :{"Functions.CurrentUser":{"referredFK":{collection:"employeess", "referredField":"user_id", field:"official_email_id"}}}}}

 >> To get profit centers of current user
 >>>>  $filter:{"_id" : {$in:{$function:{"Functions.CurrentUser":{"referredFK":{collection:"employees","referredField":"user_id","field":"access_unit._id"}}}}}}




 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var NorthwindDb = require('./NorthwindDb.js');
var OPTIONS = {username: "Sachin", password: "1234", ensureDB: true};
var Q = require("q");

describe("Function testcase", function () {

    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db) {
                return db.dropDatabase();
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.ADMIN_DB, Config.ADMIN_OPTIONS);
            }).then(
            function (db) {
                return db.dropDatabase();
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            });
    })
    beforeEach(function (done) {
        var configure = {URL: Config.URL, Admin: Config.Admin, MongoAdmin: Config.MongoAdmin, ENSURE_DB: false};
        ApplaneDB.configure(configure).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.ADMIN_DB, Config.ADMIN_OPTIONS);
            }).then(
            function (adminDb) {
                return  adminDb.update({$collection: "pl.dbs", $insert: [
                    {db: Config.ADMIN_DB, globalUserName: Config.OPTIONS.username, guestUserName: Config.OPTIONS.username, mobileLoginEnabled: true, ensureUser: true, globalPassword: Config.OPTIONS.password, globalUserAdmin: true}
                ]});
            }).then(
            function () {
                done()
            }).fail(function (err) {
                done(err);
            })
    })

    it("resolve simple filter with parameters", function (done) {
        //cash account allready esists
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: "persons",
                        $insert: [
                            {name: "Pawan", age: 24, dob: "10-10-1985"},
                            {name: "Sachin", age: 24, dob: "02-04-1989"}
                        ]
                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: "persons",
                    $filter: {name: "$name"},
                    $parameters: {name: "Sachin"},
                    $sort: {name: 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("Sachin");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("resolve simple filter with function", function (done) {
        //cash account allready esists

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: "pl.functions",
                        $insert: [
                            {name: "tests", source: "ApplaneDB/test/Function.js"}
                        ]

                    },
                    {
                        $collection: "persons",
                        $insert: [
                            {name: "Pawan", age: 24, dob: "10-10-1985"},
                            {name: "Sachin", age: 24, dob: "02-04-1989"}
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: "persons",
                    $filter: {name: {$function: "tests"}},
//                    $parameters:{name:"Sachin"},
                    $sort: {name: 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("Pawan");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("resolve simple filter with Object", function (done) {
        //cash account allready esists

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: "pl.functions",
                        $insert: [
                            {name: "testarg", source: "ApplaneDB/test/Function.js"}
                        ]

                    },
                    {
                        $collection: "persons",
                        $insert: [
                            {name: "Pawan", age: 24, dob: "10-10-1985"},
                            {name: "Sachin", age: 24, dob: "02-04-1989"}
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: "persons",
                    $filter: {name: {$function: {"testarg": {name: "$name"}}}},
                    $parameters: {name: "Sachin"},
                    $sort: {name: 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("Sachin");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

        var expectedResult = {"result": [
            {"name": "Sachin", "age": 24, "dob": "02-04-1989", "_id": "534fe7e73aec32dc18e971a6"}
        ]};
    })

    it("resolve simple filter with Object As parameters", function (done) {
        //cash account allready esists

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: "pl.functions",
                        $insert: [
                            {name: "testarg", source: "ApplaneDB/test/Function.js"}
                        ]

                    },
                    {
                        $collection: "persons",
                        $insert: [
                            {name: "Pawan", age: 24, dob: "10-10-1985"},
                            {name: "Sachin", age: 24, dob: "02-04-1989"}
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: "persons",
                    $filter: {name: "$name1"},
                    $parameters: {name: "Sachin", name1: {$function: {"testarg": {name: "$name"}}}},
                    $sort: {name: 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("Sachin");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

        var expectedResult = {"result": [
            {"name": "Sachin", "age": 24, "dob": "02-04-1989", "_id": "534fe7e73aec32dc18e971a6"}
        ]};
    })

    it("resolves simple filter with date", function (done) {
        //cash account allready esists

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: "pl.functions",
                        $insert: [
                            {name: "CurrentDate", source: "ApplaneDB/test/Function.js"}
                        ]

                    },
                    {
                        $collection: {collection: "persons", fields: [
                            {"field": "dob", type: "date"}
                        ]},
                        $insert: [
                            {name: "Pawan", age: 24, dob: "10-10-1985"},
                            {name: "Sachin", age: 24, dob: "02-04-1989"},
                            {name: "Manjeet", age: 24, dob: "02-04-1980"} ,
                            {name: "Rohit", age: 24, dob: "02-04-1978"}
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: {collection: "persons", fields: [
                        {"field": "dob", type: "date"}
                    ]},
                    $filter: {dob: {$lt: {$function: "CurrentDate"}, $gt: "01-01-1980"}, name: {$in: ["Sachin", "Rohit", "Manjeet"]}},
                    $parameters: {name: "Sachin"},
                    $sort: {name: 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].name).to.eql("Manjeet");
                expect(data.result[1].name).to.eql("Sachin");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("resolve simple filter with CurrentDate system functions", function (done) {
        //cash account allready esists

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: {collection: "persons", fields: [
                            {"field": "dob", type: "date"}
                        ]},
                        $insert: [
                            {name: "Pawan", age: 24, dob: "10-10-1985"},
                            {name: "Sachin", age: 24, dob: "02-04-1989"},
                            {name: "Manjeet", age: 24, dob: "02-04-1980"} ,
                            {name: "Rohit", age: 24, dob: "02-04-1978"}
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: {collection: "persons", fields: [
                        {"field": "dob", type: "date"}
                    ]},
                    $filter: {dob: {$lt: {$function: "Functions.CurrentDate"}, $gt: "01-01-1980"}, name: {$in: ["Sachin", "Rohit", "Manjeet"]}},
                    $parameters: {name: "Sachin"},
                    $sort: {name: 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].name).to.eql("Manjeet");
                expect(data.result[1].name).to.eql("Sachin");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("resolve simple filter with CurrentDate system functions As Parameters", function (done) {
        //cash account allready esists

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: {collection: "persons", fields: [
                            {"field": "dob", type: "date"}
                        ]},
                        $insert: [
                            {name: "Pawan", age: 24, dob: "10-10-1985"},
                            {name: "Sachin", age: 24, dob: "02-04-1989"},
                            {name: "Manjeet", age: 24, dob: "02-04-1980"} ,
                            {name: "Rohit", age: 24, dob: "02-04-1978"}
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: {collection: "persons", fields: [
                        {"field": "dob", type: "date"}
                    ]},
                    $filter: {dob: {$lt: "$lt", $gt: "01-01-1980"}, name: {$in: ["Sachin", "Rohit", "Manjeet"]}},
                    $parameters: {name: "Sachin", lt: "$$CurrentDate"},
                    $sort: {name: 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].name).to.eql("Manjeet");
                expect(data.result[1].name).to.eql("Sachin");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("resolve simple filter with whenDefined system functions", function (done) {
        //cash account allready esists

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: "persons",
                        $insert: [
                            {name: "Pawan", age: 24},
                            {name: "Sachin", age: 24}
                        ]
                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: "persons",
                    $filter: {"name": {$function: {"Functions.whenDefined": {name: "$name"}}}},
                    $parameters: {},
                    $sort: {name: 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].name).to.eql("Pawan");
                expect(data.result[1].name).to.eql("Sachin");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("get previous day data  with previousSpan system functions", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: {collection: "tasks", fields: [
                            {field: "task", type: "string"},
                            {field: "plan_on", type: "date"}
                        ]},
                        $insert: [
                            {task: "task11", plan_on: "2014-07-20"},
                            {task: "task22", plan_on: "2014-07-05"},
                            {task: "task33", plan_on: "2014-07-24"}
                        ]
                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: "tasks",
                    $filter: {"plan_on": {$function: {"Functions.previousSpan": {key: "$selected_date"}}}},
                    $parameters: {"selected_date": {"$gte": "2014-07-25", "$lt": "2014-07-26"}},
                    $sort: {"task": 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].task).to.eql("task33");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })
    it("get previous day data  with previousSpanWhenDefined system functions", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: {collection: "tasks", fields: [
                            {field: "task", type: "string"},
                            {field: "plan_on", type: "date"}
                        ]},
                        $insert: [
                            {task: "task11", plan_on: "2014-07-20"},
                            {task: "task22", plan_on: "2014-07-05"},
                            {task: "task33", plan_on: "2014-07-24"}
                        ]
                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: "tasks",
                    $filter: {"plan_on": {$function: {"Functions.previousSpan": {key: "$selected_date", whenDefined: true}}}},
                    $parameters: {},
                    $sort: {"task": 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(3);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })
    it("get previous days data  with previousSpan system functions", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: {collection: "tasks", fields: [
                            {field: "task", type: "string"},
                            {field: "plan_on", type: "date"}
                        ]},
                        $insert: [
                            {task: "task11", plan_on: "2014-07-20"},
                            {task: "task22", plan_on: "2014-07-05"},
                            {task: "task33", plan_on: "2014-07-24"}
                        ]
                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: "tasks",
                    $filter: {"plan_on": {$function: {"Functions.previousSpan": {key: "$selected_date"}}}},
                    $parameters: {"selected_date": {"$gte": "2014-07-25", "$lt": "2014-08-05"}},
                    $sort: {"task": 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].task).to.eql("task11");
                expect(data.result[1].task).to.eql("task33");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })
    it("get previous year data  with previousSpan system functions", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: {collection: "tasks", fields: [
                            {field: "task", type: "string"},
                            {field: "plan_on", type: "date"}
                        ]},
                        $insert: [
                            {task: "task11", plan_on: "2014-07-04"},
                            {task: "task22", plan_on: "2013-06-04"},
                            {task: "task33", plan_on: "2013-05-04"}
                        ]
                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: "tasks",
                    $filter: {"plan_on": {$function: {"Functions.previousSpan": {key: "$selected_date"}}}},
                    $parameters: {"selected_date": {"$gte": "2014-01-01", "$lt": "2015-01-01"}},
                    $sort: {"task": 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].task).to.eql("task22");
                expect(data.result[1].task).to.eql("task33");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })


    it("get previous month data  with previousSpan system functions", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: {collection: "tasks", fields: [
                            {field: "task", type: "string"},
                            {field: "plan_on", type: "date"}
                        ]},
                        $insert: [
                            {task: "task11", plan_on: "2014-07-04"},
                            {task: "task22", plan_on: "2014-06-04"},
                            {task: "task33", plan_on: "2014-06-25"}
                        ]
                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: "tasks",
                    $filter: {"plan_on": {$function: {"Functions.previousSpan": {key: "$selected_date"}}}},
                    $parameters: {"selected_date": {"$gte": "2014-07-01", "$lt": "2014-08-01"}},
                    $sort: {"task": 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].task).to.eql("task22");
                expect(data.result[1].task).to.eql("task33");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("resolve simple filter with whenDefined system functions", function (done) {
        //cash account allready esists

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: "persons",
                        $insert: [
                            {name: "Pawan", age: 24},
                            {name: "Sachin", age: 24}
                        ]
                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: "persons",
                    $filter: {"name": {$function: {"Functions.whenDefined": {name: "$name"}}}},
                    $parameters: {},
                    $sort: {name: 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].name).to.eql("Pawan");
                expect(data.result[1].name).to.eql("Sachin");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("resolve simple filter with CurrentUser system functions", function (done) {
        //cash account allready esists

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: {collection: "persons", fields: [
                            {"field": "dob", type: "date"}
                        ]},
                        $insert: [
                            {name: "Pawan", age: 24, dob: "10-10-1985"},
                            {name: "Sachin", age: 24, dob: "02-04-1989"},
                            {name: "Manjeet", age: 24, dob: "02-04-1980"} ,
                            {name: "Rohit", age: 24, dob: "02-04-1978"}
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: {collection: "persons", fields: [
                        {"field": "dob", type: "date"}
                    ]},
                    $filter: {name: {$function: {"Functions.CurrentUser": {"username": 1}}}},
                    $sort: {name: 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("Sachin");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("resolve filter with CurrentUser system functions in parameters", function (done) {
        //cash account allready esists

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: {collection: "persons", fields: [
                            {"field": "dob", type: "date"}
                        ]},
                        $insert: [
                            {name: "Pawan", age: 24, dob: "10-10-1985"},
                            {name: "Sachin", age: 24, dob: "02-04-1989"},
                            {name: "Manjeet", age: 24, dob: "02-04-1980"} ,
                            {name: "Rohit", age: 24, dob: "02-04-1978"}
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: {collection: "persons", fields: [
                        {"field": "dob", type: "date"}
                    ]},
                    $filter: {name: "$name"},
                    $parameters: {name: {$function: {"Functions.CurrentUser": {"username": 1}}}},
                    $sort: {name: 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("Sachin");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("resolve filter with CurrentUser system functions in parameters with dollar syntax", function (done) {
        //cash account allready esists

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: {collection: "persons", fields: [
                            {"field": "dob", type: "date"}
                        ]},
                        $insert: [
                            {name: "Pawan", age: 24, dob: "10-10-1985"},
                            {name: "Sachin", age: 24, dob: "02-04-1989"},
                            {name: "Manjeet", age: 24, dob: "02-04-1980"} ,
                            {name: "Rohit", age: 24, dob: "02-04-1978"}
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: {collection: "persons", fields: [
                        {"field": "dob", type: "date"}
                    ]},
                    $filter: {name: "$name"},
                    $parameters: {name: {"$$CurrentUser": {"username": 1}}},
                    $sort: {name: 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("Sachin");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("resolve simple filter with CurrentUsername system functions  with dollar syntax", function (done) {
        //cash account allready esists

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: {collection: "persons", fields: [
                            {"field": "dob", type: "date"}
                        ]},
                        $insert: [
                            {name: "Pawan", age: 24, dob: "10-10-1985"},
                            {name: "Sachin", age: 24, dob: "02-04-1989"},
                            {name: "Manjeet", age: 24, dob: "02-04-1980"} ,
                            {name: "Rohit", age: 24, dob: "02-04-1978"}
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: {collection: "persons", fields: [
                        {"field": "dob", type: "date"}
                    ]},
                    $filter: {name: {"$$CurrentUser": {"username": 1}}},
                    $sort: {name: 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("Sachin");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("resolve simple filter with CurrentUser system functions  with dollar syntax", function (done) {
        //cash account allready esists

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: {collection: "persons", fields: [
                            {"field": "dob", type: "date"}
                        ]},
                        $insert: [
                            {name: db.user._id, age: 24, dob: "10-10-1985"},
                            {name: "Sachin", age: 24, dob: "02-04-1989"},
                            {name: "Manjeet", age: 24, dob: "02-04-1980"} ,
                            {name: "Rohit", age: 24, dob: "02-04-1978"}
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: {collection: "persons", fields: [
                        {"field": "dob", type: "date"}
                    ]},
                    $filter: {name: "$$CurrentUser"},
                    $sort: {name: 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].name.toString()).to.eql(db.user._id.toString());
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("resolve simple filter with date function and parameters", function (done) {
        //cash account allready esists

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection: "pl.functions",
                        $insert: [
                            {name: "CurrentDate", source: "ApplaneDB/test/Function.js"}
                        ]

                    },
                    {
                        $collection: {collection: "persons", fields: [
                            {"field": "dob", type: "date"}
                        ]},
                        $insert: [
                            {name: "Pawan", age: 24, dob: "10-10-1985"},
                            {name: "Sachin", age: 24, dob: "02-04-1989"},
                            {name: "Manjeet", age: 24, dob: "02-04-1980"} ,
                            {name: "Rohit", age: 24, dob: "02-04-1978"}
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var queryToGetData = {
                    $collection: {collection: "persons", fields: [
                        {"field": "dob", type: "date"}
                    ]},
                    $filter: {dob: {$lt: {$function: "CurrentDate"}, $gt: "$gt"}, name: {$in: ["Sachin", "Rohit", "Manjeet"]}},
                    $parameters: {name: "Sachin", gt: "01-01-1980"},
                    $sort: {name: 1}
                };
                return db.query(queryToGetData);
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].name).to.eql("Manjeet");
                expect(data.result[1].name).to.eql("Sachin");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("sub query with fitler on current span and previous span", function (done) {
        var db = undefined;
        var taskDef = {collection: "tasks", fields: [
            {field: "task", "type": "string"},
            {field: "ownerid", "type": "fk", collection: "employees", displayField: "emailid"},
            {field: "plan_on", type: "date"},
            {field: "completed_on", type: "date"},
            {field: "est_efforts", type: "duration"}
        ]};
        var employeeDef = {collection: "employees", fields: [
            {field: "emailid", type: "string"}
        ]}
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                return ApplaneDB.registerCollection(taskDef);
            }).then(
            function () {
                return ApplaneDB.registerCollection(employeeDef);
            }).then(
            function () {
                var updates = [
                    {$collection: employeeDef, $insert: [
                        {emailid: "manjeet.sanghwan@daffodilsw.com"},
                        {emailid: "sachin.bansal@daffodilsw.com"},
                        {emailid: "ashu.vashiast@daffodilsw.com"},
                        {emailid: "naveen.singh@daffodilsw.com"}
                    ]},
                    {$collection: taskDef, $insert: [
                        {task: "t1", ownerid: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}, plan_on: "2014-07-04", "completed_on": "2014-05-17", est_efforts: {time: "10", unit: "Hrs"}},
                        {task: "t2", ownerid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, plan_on: "2014-07-06", "completed_on": "2014-06-13", est_efforts: {time: "10", unit: "Hrs"}},
                        {task: "t3", ownerid: {$query: {emailid: "ashu.vashiast@daffodilsw.com"}}, plan_on: "2014-07-07", "completed_on": "2014-05-30", est_efforts: {time: "10", unit: "Hrs"}},
                        {task: "t4", ownerid: {$query: {emailid: "naveen.singh@daffodilsw.com"}}, plan_on: "2014-07-08", "completed_on": "2014-06-22", est_efforts: {time: "10", unit: "Hrs"}},
                        {task: "t5", ownerid: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}, plan_on: "2014-08-02", "completed_on": "2014-06-11", est_efforts: {time: "10", unit: "Hrs"}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "tasks"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(5);
                var query = {$collection: "employees",
                    $fields: {
                        emailid: 1,
                        planned_hrs: {$query: {$collection: "tasks", $filter: {plan_on: "$selected_date"}, $group: {_id: null, est_efforts: {$sum: "$est_efforts"}}}, $fk: "ownerid"},
                        completed_hrs: {$query: {$collection: "tasks", $filter: {completed_on: {$function: {"Functions.previousSpan": {key: "$selected_date"}}}}, $group: {_id: null, est_efforts: {$sum: "$est_efforts"}}}, $fk: "ownerid"}
                    },
                    $parameters: {
                        "selected_date": {
                            $gte: "2014-07-01", "$lt": "2014-08-01"
                        }
                    }
                }
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(4);
                expect(data.result[0].emailid).to.eql("manjeet.sanghwan@daffodilsw.com");
                expect(data.result[0].planned_hrs.est_efforts.time).to.eql(10);
                expect(data.result[0].completed_hrs.est_efforts.time).to.eql(10);
                expect(data.result[1].emailid).to.eql("sachin.bansal@daffodilsw.com");
                expect(data.result[1].planned_hrs.est_efforts.time).to.eql(10);
                expect(data.result[1].completed_hrs.est_efforts.time).to.eql(10);
                expect(data.result[2].emailid).to.eql("ashu.vashiast@daffodilsw.com");
                expect(data.result[2].planned_hrs.est_efforts.time).to.eql(10);
                expect(data.result[2].completed_hrs).to.eql(undefined);
                expect(data.result[3].emailid).to.eql("naveen.singh@daffodilsw.com");
                expect(data.result[3].planned_hrs.est_efforts.time).to.eql(10);
                expect(data.result[3].completed_hrs.est_efforts.time).to.eql(10);

            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    })

    it("Query Function in filter", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection: {collection: "employeess", fields: [
                        {field: "emailid", type: "string"},
                        {field: "reporting_to_id", type: "fk", collection: "employeess", set: ["emailid"]},
                        {field: "userid", type: "fk", collection: "pl.users", set: ["emailid"]}
                    ]}, $insert: [
                        {emailid: "yogesh@daffodilsw.com"},
                        {emailid: "amit.singh@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}},
                        {emailid: "rohit.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}},
                        {emailid: "sachin.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}},
                        {emailid: "kapil.dalal@daffodilsw.com", reporting_to_id: {$query: {emailid: "amit.singh@daffodilsw.com"}}},
                        {emailid: "preeti.gulia@daffodilsw.com", reporting_to_id: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}},
                        {emailid: "sushil.kumar@daffodilsw.com", reporting_to_id: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}},
                        {emailid: "naveen.singh@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}},
                        {emailid: "manjeet.sanghwan@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}},
                        {emailid: "rajit.kumar@daffodilsw.com", reporting_to_id: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}},
                        {emailid: "ashu@daffodilsw.com", reporting_to_id: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                        {emailid: "sunil@daffodilsw.com", reporting_to_id: {$query: {emailid: "sushil.kumar@daffodilsw.com"}}}
                    ]},
                    {$collection: {collection: "taskss", fields: [
                        {field: "assigntoid", type: "fk", collection: "employeess", set: ["emailid"]}
                    ]}, $insert: [
                        {task: "Task1", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                        {task: "Task2", status: "Completed", assigntoid: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}},
                        {task: "Task3", status: "New", assigntoid: {$query: {emailid: "amit.singh@daffodilsw.com"}}},
                        {task: "Task4", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                        {task: "Task5", status: "New", assigntoid: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}},
                        {task: "Task6", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                        {task: "Task7", status: "Completed", assigntoid: {$query: {emailid: "preeti.gulia@daffodilsw.com"}}},
                        {task: "Task8", status: "New", assigntoid: {$query: {emailid: "sunil@daffodilsw.com"}}},
                        {task: "Task9", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                        {task: "Task10", status: "New", assigntoid: {$query: {emailid: "naveen.singh@daffodilsw.com"}}},
                        {task: "Task11", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                        {task: "Task12", status: "Completed", assigntoid: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}},
                        {task: "Task13", status: "New", assigntoid: {$query: {emailid: "ashu@daffodilsw.com"}}},
                        {task: "Task14", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                        {task: "Task15", status: "New", assigntoid: {$query: {emailid: "rajit.kumar@daffodilsw.com"}}}
                    ]}
                ]);
            }).then(
            function (result) {
                return db.query({$collection: "taskss", $sort: {task: 1}, $filter: {"assigntoid.emailid": {$in: {$function: {"Functions.Query": {query: {$collection: "employeess", $fields: {emailid: 1}, $filter: {"reporting_to_id.emailid": "rohit.bansal@daffodilsw.com"}, $recursion: {reporting_to_id: "_id"}}, filterField: "emailid", nestedField: "children"}}}}}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(8);
                expect(data.result[0].task).to.eql("Task1");
                expect(data.result[1].task).to.eql("Task10");
                expect(data.result[2].task).to.eql("Task11");
                expect(data.result[3].task).to.eql("Task12");
                expect(data.result[4].task).to.eql("Task14");
                expect(data.result[5].task).to.eql("Task4");
                expect(data.result[6].task).to.eql("Task6");
                expect(data.result[7].task).to.eql("Task9");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("ReferredFk in Current User", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection: "pl.users", $insert: [
                        {username: "Yogesh", password: "yogesh", emailid: "yogesh@daffodilsw.com"},
                        {username: "Amit Singh", password: "amit", emailid: "amit.singh@daffodilsw.com"},
                        {username: "Rohit", password: "rohit", emailid: "rohit.bansal@daffodilsw.com"},
                        {username: "Sachin", password: "sachin", emailid: "sachin.bansal@daffodilsw.com"},
                        {username: "Kapil", password: "kapil", emailid: "kapil.dalal@daffodilsw.com"},
                        {username: "Preeti", password: "amit", emailid: "preeti.gulia@daffodilsw.com"},
                        {username: "Manjeet", password: "rohit", emailid: "manjeet.sanghwan@daffodilsw.com"},
                        {username: "Rajit", password: "sachin", emailid: "rajit.kumar@daffodilsw.com"},
                        {username: "Naveen", password: "kapil", emailid: "naveen.singh@daffodilsw.com"},
                        {username: "Ashu", password: "amit", emailid: "ashu@daffodilsw.com"},
                        {username: "Sushil", password: "rohit", emailid: "sushil.kumar@daffodilsw.com"},
                        {username: "Sunil", password: "sachin", emailid: "sunil@daffodilsw.com"}
                    ]}
                ]);
            }).then(
            function () {
                return db.update([
                    {$collection: {collection: "employeess", fields: [
                        {field: "emailid", type: "string"},
                        {field: "reporting_to_id", type: "fk", collection: "employeess", set: ["emailid"]},
                        {field: "user_id", type: "fk", collection: "pl.users", set: ["emailid"]}
                    ]}, $insert: [
                        {emailid: "yogesh@daffodilsw.com"},
                        {emailid: "amit.singh@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}, user_id: {$query: {emailid: "amit.singh@daffodilsw.com"}}},
                        {emailid: "rohit.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}, user_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}},
                        {emailid: "sachin.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, user_id: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                        {emailid: "kapil.dalal@daffodilsw.com", reporting_to_id: {$query: {emailid: "amit.singh@daffodilsw.com"}}, user_id: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}},
                        {emailid: "preeti.gulia@daffodilsw.com", reporting_to_id: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, user_id: {$query: {emailid: "preeti.gulia@daffodilsw.com"}}},
                        {emailid: "sushil.kumar@daffodilsw.com", reporting_to_id: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, user_id: {$query: {emailid: "sushil.kumar@daffodilsw.com"}}},
                        {emailid: "naveen.singh@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, user_id: {$query: {emailid: "naveen.singh@daffodilsw.com"}}},
                        {emailid: "manjeet.sanghwan@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, user_id: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}},
                        {emailid: "rajit.kumar@daffodilsw.com", reporting_to_id: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}, user_id: {$query: {emailid: "rajit.kumar@daffodilsw.com"}}},
                        {emailid: "ashu@daffodilsw.com", reporting_to_id: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, user_id: {$query: {emailid: "ashu@daffodilsw.com"}}},
                        {emailid: "sunil@daffodilsw.com", reporting_to_id: {$query: {emailid: "sushil.kumar@daffodilsw.com"}}, user_id: {$query: {emailid: "sunil@daffodilsw.com"}}}
                    ]},
                    {$collection: {collection: "taskss", fields: [
                        {field: "assigntoid", type: "fk", collection: "employeess", set: ["emailid"]}
                    ]}, $insert: [
                        {task: "Task1", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                        {task: "Task2", status: "Completed", assigntoid: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}},
                        {task: "Task3", status: "New", assigntoid: {$query: {emailid: "amit.singh@daffodilsw.com"}}},
                        {task: "Task4", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                        {task: "Task5", status: "New", assigntoid: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}},
                        {task: "Task6", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                        {task: "Task7", status: "Completed", assigntoid: {$query: {emailid: "preeti.gulia@daffodilsw.com"}}},
                        {task: "Task8", status: "New", assigntoid: {$query: {emailid: "sunil@daffodilsw.com"}}},
                        {task: "Task9", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                        {task: "Task10", status: "New", assigntoid: {$query: {emailid: "naveen.singh@daffodilsw.com"}}},
                        {task: "Task11", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                        {task: "Task12", status: "Completed", assigntoid: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}},
                        {task: "Task13", status: "New", assigntoid: {$query: {emailid: "ashu@daffodilsw.com"}}},
                        {task: "Task14", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                        {task: "Task15", status: "New", assigntoid: {$query: {emailid: "rajit.kumar@daffodilsw.com"}}}
                    ]}
                ]);
            }).then(
            function (result) {
                return ApplaneDB.connect(Config.URL, Config.DB, {username: "Sachin", password: "sachin"});
            }).then(
            function (dbToGet) {
                return dbToGet.query({$collection: "taskss", $sort: {task: 1}, $filter: {"assigntoid.emailid": {$function: {"Functions.CurrentUser": {"referredFK": {collection: "employeess", "referredField": "user_id", field: "emailid"}}}}}})
            }).then(
            function (data) {
//                console.log("data>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(6);
                expect(data.result[0].task).to.eql("Task1");
                expect(data.result[1].task).to.eql("Task11");
                expect(data.result[2].task).to.eql("Task14");
                expect(data.result[3].task).to.eql("Task4");
                expect(data.result[4].task).to.eql("Task6");
                expect(data.result[5].task).to.eql("Task9");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("Return Resolved in OR filter", function (done) {
        var db = undefined;
        var filter = {$or: [
            {"assigntoid._id": "$$UserRoles"},
            {status: "New"}
        ], status: "Latest"};
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection: "pl.users", $insert: [
                        {username: "Yogesh", password: "yogesh", emailid: "yogesh@daffodilsw.com"},
                        {username: "Amit Singh", password: "amit", emailid: "amit.singh@daffodilsw.com"},
                        {username: "Rohit", password: "rohit", emailid: "rohit.bansal@daffodilsw.com"},
                        {username: "Sachin", password: "sachin", emailid: "sachin.bansal@daffodilsw.com"},
                        {username: "Kapil", password: "kapil", emailid: "kapil.dalal@daffodilsw.com"},
                        {username: "Preeti", password: "amit", emailid: "preeti.gulia@daffodilsw.com"},
                        {username: "Manjeet", password: "rohit", emailid: "manjeet.sanghwan@daffodilsw.com"},
                        {username: "Rajit", password: "sachin", emailid: "rajit.kumar@daffodilsw.com"},
                        {username: "Naveen", password: "kapil", emailid: "naveen.singh@daffodilsw.com"},
                        {username: "Ashu", password: "amit", emailid: "ashu@daffodilsw.com"},
                        {username: "Sushil", password: "rohit", emailid: "sushil.kumar@daffodilsw.com"},
                        {username: "Sunil", password: "sachin", emailid: "sunil@daffodilsw.com"}
                    ]}
                ]);
            }).then(
            function () {
                return db.update([
                    {$collection: "pl.collections", $insert: [
                        {collection: "taskss"},
                        {collection: "employeess"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "name", type: "string", collectionid: {$query: {collection: "employeess"}}},
                        {field: "assigntoid", type: "fk", collectionid: {$query: {collection: "taskss"}}, collection: "employeess", set: ["name"]}
                    ]}
                ]);
            }).then(
            function () {
                return require("../lib/modules/Function.js").populateFilter(filter, undefined, db, {collection: "taskss"});
            }).then(
            function (result) {
                expect(result).to.not.eql(undefined);
                expect(result).to.eql("$$resolved");
                expect(filter.$or).to.eql(undefined);
                expect(filter.status).to.eql("Latest");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("date test with timezoneOffset passed in parameters", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                return db.update({$collection: "pl.collections", $insert: {collection: "datetest"}})
            }).then(
            function () {
                return db.update({$collection: "pl.fields", $insert: {field: "date", type: "date", collectionid: {$query: {collection: "datetest"}}}})
            }).then(
            function () {
                return db.update({$collection: "datetest", $insert: [
                    {dateIs: "15 july 2015 10 pm UTC", date: "2015-07-16T03:30:00.000+05:30"},
                    {dateIs: "15 july 2015 8 pm UTC", date: "2015-07-16T01:30:00.000+05:30"},
                    {dateIs: "16 july 2015 6 am UTC", date: "2015-07-16T11:30:00.000+05:30"},
                    {dateIs: "16 july 2015 6 pm UTC", date: "2015-07-16T23:30:00.000+05:30"},
                    {dateIs: "16 july 2015 10 pm UTC", date: "2015-07-17T03:30:00.000+05:30"},
                    {dateIs: "16 july 2015 8 pm UTC", date: "2015-07-17T01:30:00.000+05:30"}
                ]});
            }).then(function () {
                var filter = {date: {"$$CurrentDateFilter": {date: "2015-07-17T01:00:00", span: -1}}};
                return db.query({$collection: "datetest", $filter: filter});
            }).then(function (result) {
                result = result.result;
                expect(result).to.have.length(4);
                expect(result[0].dateIs).to.eql("16 july 2015 6 am UTC");
                expect(result[1].dateIs).to.eql("16 july 2015 6 pm UTC");
                expect(result[2].dateIs).to.eql("16 july 2015 10 pm UTC");
                expect(result[3].dateIs).to.eql("16 july 2015 8 pm UTC");
            }).then(function () {
                var filter = {date: {"$$CurrentDateFilter": {date: "2015-07-17T01:00:00", span: -1, timezoneOffset: -330}}};
                return db.query({$collection: "datetest", $filter: filter});
            }).then(function (result) {
                result = result.result;
                expect(result).to.have.length(4);
                expect(result[0].dateIs).to.eql("15 july 2015 10 pm UTC");
                expect(result[1].dateIs).to.eql("15 july 2015 8 pm UTC");
                expect(result[2].dateIs).to.eql("16 july 2015 6 am UTC");
                expect(result[3].dateIs).to.eql("16 july 2015 6 pm UTC");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("$$CurrentDate filter test case with span and without span", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                return db.update({$collection: "pl.collections", $insert: {collection: "datetest"}})
            }).then(
            function () {
                return db.update({$collection: "pl.fields", $insert: {field: "date", type: "date", collectionid: {$query: {collection: "datetest"}}}})
            }).then(
            function () {
                return db.update({$collection: "datetest", $insert: [
                    {dateIs: "04 aug 2015 10 pm UTC", date: "2015-08-04T22:00:00.000"},
                    {dateIs: "05 aug 2015 02 am UTC", date: "2015-08-05T02:00:00.000"},
                    {dateIs: "05 aug 2015 12 am UTC", date: "2015-08-05T00:00:00.000"},
                    {dateIs: "05 aug 2015 04 pm UTC", date: "2015-08-05T16:00:00.000"},
                    {dateIs: "05 aug 2015 10 pm UTC", date: "2015-08-05T22:00:00.000"},
                    {dateIs: "06 aug 2015 10 am UTC", date: "2015-08-06T10:00:00.000"}
                ]});
            }).then(function () {
                var filter = {date: {"$gte": {"$$CurrentDate": {date: "2015-08-05T10:00:00.000"}}}};
                return db.query({$collection: "datetest", $filter: filter});
            }).then(function (finalResult) {
                finalResult = finalResult.result;
                expect(finalResult).to.have.length(5);
                expect(finalResult[0].dateIs).to.eql("05 aug 2015 02 am UTC");
                expect(finalResult[1].dateIs).to.eql("05 aug 2015 12 am UTC");
                expect(finalResult[2].dateIs).to.eql("05 aug 2015 04 pm UTC");
                expect(finalResult[3].dateIs).to.eql("05 aug 2015 10 pm UTC");
                expect(finalResult[4].dateIs).to.eql("06 aug 2015 10 am UTC");
            }).then(function () {
                var filter = {date: {"$gte": {"$$CurrentDate": {date: "2015-08-05T10:00:00.000", span: -1}}}};
                return db.query({$collection: "datetest", $filter: filter});
            }).then(function (finalResult) {
                finalResult = finalResult.result;
                expect(finalResult).to.have.length(6);
                expect(finalResult[0].dateIs).to.eql("04 aug 2015 10 pm UTC");
                expect(finalResult[1].dateIs).to.eql("05 aug 2015 02 am UTC");
                expect(finalResult[2].dateIs).to.eql("05 aug 2015 12 am UTC");
                expect(finalResult[3].dateIs).to.eql("05 aug 2015 04 pm UTC");
                expect(finalResult[4].dateIs).to.eql("05 aug 2015 10 pm UTC");
                expect(finalResult[5].dateIs).to.eql("06 aug 2015 10 am UTC");
            }).then(function () {
                var filter = {date: {"$gte": {"$$CurrentDate": {date: "2015-08-05T10:00:00.000", span: 1}}}};
                return db.query({$collection: "datetest", $filter: filter});
            }).then(function (finalResult) {
                finalResult = finalResult.result;
                expect(finalResult).to.have.length(1);
                expect(finalResult[0].dateIs).to.eql("06 aug 2015 10 am UTC");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })
})

exports.tests = function (db) {
    var d = Q.defer();
    d.resolve("Pawan");
    return d.promise;
}

exports.testarg = function (parameters, db) {
    var d = Q.defer();
    d.resolve(parameters.name);
    return d.promise;
}

exports.CurrentDate = function (db) {
    var d = Q.defer();
    d.resolve(new Date());
    return d.promise;
}