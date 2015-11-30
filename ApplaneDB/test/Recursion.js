/**
 *  mocha --recursive --timeout 150000 -g "SubQuery testcase recursion" --reporter spec
 *  mocha --recursive --timeout 150000 -g "Recursion with sort and rollup" --reporter spec
 *  mocha --recursive --timeout 150000 -g "Recursive With single columns" --reporter spec
 *  mocha --recursive --timeout 150000 -g "P&L" --reporter spec
 *  mocha --recursive --timeout 150000 -g "Recursive With single columns without _id" --reporter spec
 *
 */
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var NorthwindDb = require("./NorthwindDb.js");
var expect = require('chai').expect;
var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../lib/Constants.js");
var OPTIONS = {username: "Yogesh", password: "yogesh", ensureDB: true};
var Testcases = require("./TestCases.js");
var collectionsToRegister = [
    {collection: NorthwindDb.EMP_RECURSIVE_WITHOUT_ID_TABLE, fields: [
        {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSIVE_WITHOUT_ID_TABLE}
    ]},
    {collection: "employeess", fields: [
        {field: "emailid", type: "string"},
        {field: "reporting_to_id", type: "fk", collection: "employeess", set: ["emailid"]},
        {field: "userid", type: "fk", collection: "pl.users", set: ["emailid"]}
    ]},
    {collection: "taskss", fields: [
        {field: "task", type: "string"},
        {field: "status", type: "string"},
        {field: "duedate", type: "date"},
        {field: "assigntoid", type: "fk", collection: "employeess", set: ["emailid"]},
        {field: "estefforts", type: "duration", fields: [
            {"field": "time", "type": "decimal"},
            {"field": "unit", "type": "string"},
            {"field": "convertedvalue", "type": "number"}
        ]},
        {field: "expectedCost", type: "currency", fields: [
            {field: "amount", type: "decimal"},
            {field: "type", type: "fk", collection: "pl.currencies", set: ["currency"], upsert: true}
        ]}
    ]}
];

describe("SubQuery testcase recursion", function () {

    describe("recursion testcase", function () {

        before(function (done) {
            ApplaneDB.registerCollection(collectionsToRegister).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })

        after(function (done) {
            ApplaneDB.removeCollections(["employeess", "taskss", NorthwindDb.EMP_RECURSIVE_WITHOUT_ID_TABLE]);
            done();
        })

        afterEach(function (done) {
            Testcases.afterEach(done);
        })

        beforeEach(function (done) {
            Testcases.beforeEach(done);
        })

        it("Recursive With multiple column", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection: NorthwindDb.EMP_RECURSION_TABLE, $insert: NorthwindDb.Emps}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection: {collection: NorthwindDb.EMP_RECURSION_TABLE, fields: [
                            {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                        ]},
                        $fields: {
                            employee: 1,
                            code: 1
//                        reporting_to:1
                        },
                        $filter: {
                            status: "active",
                            "reporting_to": null
                        },
                        $recursion: {
                            reporting_to: "_id",
                            $level: 4,
                            $ensure: 1
                        },
                        $sort: {"employee": 1}
                    };

                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("Data------  " + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0]._id).to.eql("Yogesh");
                    expect(data.result[0].employee).to.eql("Yogesh");
                    expect(data.result[0].code).to.eql("DFG-1011");

                    expect(data.result[0].children).to.have.length(3);
                    expect(data.result[0].children[0]._id).to.eql("Nitin");
                    expect(data.result[0].children[0].employee).to.eql("Nitin");
                    expect(data.result[0].children[0].code).to.eql("DFG-1018");
                    expect(data.result[0].children[1].children).to.have.length(2);
                    expect(data.result[0].children[0].children[0]._id).to.eql("Pawan");
                    expect(data.result[0].children[0].children[1]._id).to.eql("Rohit");

                    expect(data.result[0].children[1]._id).to.eql("Pawan");
                    expect(data.result[0].children[1].employee).to.eql("Pawan");
                    expect(data.result[0].children[1].children).to.have.length(2);
                    expect(data.result[0].children[1].children[0]._id).to.eql("Ashu");
                    expect(data.result[0].children[1].children[1]._id).to.eql("Sachin");
                    expect(data.result[0].children[1].children[1].children).to.have.length(1);
                    expect(data.result[0].children[1].children[1].children[0]._id).to.eql("Ashu");

                    expect(data.result[0].children[2]._id).to.eql("Rohit");
                    expect(data.result[0].children[2].employee).to.eql("Rohit");
                    expect(data.result[0].children[2].children).to.have.length(0);

                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            //step1, get all employees where reporting_to : null
            //throw error if not $root filter
            //recursion module --> doQuery-> it will add $root filter

            var query1 = {
                $collection: {collection: NorthwindDb.EMP_RECURSION_TABLE, fields: [
                    {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                ]},
                $fields: {
                    employee: 1,
                    code: 1,
                    reporting_to: 1,
                    children: {
                        $query: {
                            $type: "n-rows",
                            $collection: {collection: NorthwindDb.EMP_RECURSION_TABLE, fields: [
                                {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                            ]},
                            $fields: {employee: 1, code: 1, reporting_to: 1},
                            $filter: {
                                status: "active"
                            },
                            $recursion: {
                                reporting_to: "_id",
                                $level: 3
                            },
                            $sort: {"employee": 1}
                        },
                        $fk: "reporting_to",
                        $parent: "_id"
                    }
                },
                $filter: {"status": "active", reporting_to: null},
                $sort: {"employee": 1}
            };

            //setp 2 --> doQuery of subquery --> will remove children as it is of subquery column

            var query1 = {
                $collection: "employees",
                $fields: {
                    employee: 1,
                    code: 1

                },
                $filter: {"status": "active", reporting_to: null},
                $fk: {"reporting_to": "employee"}


            };

            var expectedResult = {"result": [
                {"_id": "Yogesh", "employee": "Yogesh", "code": "DFG-1011", "children": [
                    {"_id": "Nitin", "employee": "Nitin", "code": "DFG-1018", "reporting_to": [
                        {"_id": "Yogesh"}
                    ], "children": [
                        {"_id": "Pawan", "employee": "Pawan", "code": "DFG-1012", "reporting_to": [
                            {"_id": "Yogesh"},
                            {"_id": "Nitin"}
                        ], "children": [
                            {"_id": "Sachin", "employee": "Sachin", "code": "DFG-1013", "reporting_to": [
                                {"_id": "Pawan"}
                            ], "children": [
                                {"_id": "Ashu", "employee": "Ashu", "code": "DFG-1019", "reporting_to": [
                                    {"_id": "Pawan"},
                                    {"_id": "Sachin"}
                                ]}
                            ]},
                            {"_id": "Ashu", "employee": "Ashu", "code": "DFG-1019", "reporting_to": [
                                {"_id": "Pawan"},
                                {"_id": "Sachin" }
                            ], "children": []}
                        ]},
                        {"_id": "Rohit", "employee": "Rohit", "code": "DFG-1015", "reporting_to": [
                            {"_id": "Yogesh"},
                            {"_id": "Nitin"}
                        ], "children": []}
                    ]},
                    {"_id": "Pawan", "employee": "Pawan", "code": "DFG-1012", "reporting_to": [
                        {"_id": "Yogesh"},
                        {"_id": "Nitin"}
                    ], "children": [
                        {"_id": "Sachin", "employee": "Sachin", "code": "DFG -1013", "reporting_to": [
                            {"_id": "Pawan"}
                        ], "children": [
                            {"_id": "Ashu", "employee": "Ashu", "code": "DFG-1019", "reporting_to": [
                                {"_id": "Pawan"},
                                {"_id": "Sachin"}
                            ], "children": []}
                        ]},
                        {"_id": "Ashu", "employee": "Ashu", "code": "DFG-1019", "reporting_to": [
                            {"_id": "Pawan"},
                            {"_id": "Sachin"}
                        ], "children": []}
                    ]},
                    {"_id": "Rohit", "employee": "Rohit", "code": "DFG-1015", "reporting_to": [
                        {"_id": "Yogesh"},
                        {"_id": "Nitin"}
                    ], "children": []}
                ]}
            ]};
        })

        it("Recursive With multiple column and rootFilter", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection: NorthwindDb.EMP_RECURSION_TABLE, $insert: NorthwindDb.Emps}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection: {collection: NorthwindDb.EMP_RECURSION_TABLE, fields: [
                            {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                        ]},
                        $fields: {
                            employee: 1,
                            code: 1
//                        reporting_to:1
                        },
                        $filter: {
                            status: "active"
                        },
                        $recursion: {
                            reporting_to: "_id",
                            $level: 4,
                            $ensure: 1,
                            $rootFilter: {reporting_to: null}
                        },
                        $sort: {"employee": 1}
                    };

                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("Data------  " + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0]._id).to.eql("Yogesh");
                    expect(data.result[0].employee).to.eql("Yogesh");
                    expect(data.result[0].code).to.eql("DFG-1011");

                    expect(data.result[0].children).to.have.length(3);
                    expect(data.result[0].children[0]._id).to.eql("Nitin");
                    expect(data.result[0].children[0].employee).to.eql("Nitin");
                    expect(data.result[0].children[0].code).to.eql("DFG-1018");
                    expect(data.result[0].children[1].children).to.have.length(2);
                    expect(data.result[0].children[0].children[0]._id).to.eql("Pawan");
                    expect(data.result[0].children[0].children[1]._id).to.eql("Rohit");

                    expect(data.result[0].children[1]._id).to.eql("Pawan");
                    expect(data.result[0].children[1].employee).to.eql("Pawan");
                    expect(data.result[0].children[1].children).to.have.length(2);
                    expect(data.result[0].children[1].children[0]._id).to.eql("Ashu");
                    expect(data.result[0].children[1].children[1]._id).to.eql("Sachin");
                    expect(data.result[0].children[1].children[1].children).to.have.length(1);
                    expect(data.result[0].children[1].children[1].children[0]._id).to.eql("Ashu");

                    expect(data.result[0].children[2]._id).to.eql("Rohit");
                    expect(data.result[0].children[2].employee).to.eql("Rohit");
                    expect(data.result[0].children[2].children).to.have.length(0);

                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            //step1, get all employees where reporting_to : null
            //throw error if not $root filter
            //recursion module --> doQuery-> it will add $root filter

            var query1 = {
                $collection: {collection: NorthwindDb.EMP_RECURSION_TABLE, fields: [
                    {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                ]},
                $fields: {
                    employee: 1,
                    code: 1,
                    reporting_to: 1,
                    children: {
                        $query: {
                            $type: "n-rows",
                            $collection: {collection: NorthwindDb.EMP_RECURSION_TABLE, fields: [
                                {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                            ]},
                            $fields: {employee: 1, code: 1, reporting_to: 1},
                            $filter: {
                                status: "active"
                            },
                            $recursion: {
                                reporting_to: "_id",
                                $level: 3
                            },
                            $sort: {"employee": 1}
                        },
                        $fk: "reporting_to",
                        $parent: "_id"
                    }
                },
                $filter: {"status": "active", reporting_to: null},
                $sort: {"employee": 1}
            };

            //setp 2 --> doQuery of subquery --> will remove children as it is of subquery column

            var query1 = {
                $collection: "employees",
                $fields: {
                    employee: 1,
                    code: 1

                },
                $filter: {"status": "active", reporting_to: null},
                $fk: {"reporting_to": "employee"}


            };

            var expectedResult = {"result": [
                {"_id": "Yogesh", "employee": "Yogesh", "code": "DFG-1011", "children": [
                    {"_id": "Nitin", "employee": "Nitin", "code": "DFG-1018", "reporting_to": [
                        {"_id": "Yogesh"}
                    ], "children": [
                        {"_id": "Pawan", "employee": "Pawan", "code": "DFG-1012", "reporting_to": [
                            {"_id": "Yogesh"},
                            {"_id": "Nitin"}
                        ], "children": [
                            {"_id": "Sachin", "employee": "Sachin", "code": "DFG-1013", "reporting_to": [
                                {"_id": "Pawan"}
                            ], "children": [
                                {"_id": "Ashu", "employee": "Ashu", "code": "DFG-1019", "reporting_to": [
                                    {"_id": "Pawan"},
                                    {"_id": "Sachin"}
                                ]}
                            ]},
                            {"_id": "Ashu", "employee": "Ashu", "code": "DFG-1019", "reporting_to": [
                                {"_id": "Pawan"},
                                {"_id": "Sachin" }
                            ], "children": []}
                        ]},
                        {"_id": "Rohit", "employee": "Rohit", "code": "DFG-1015", "reporting_to": [
                            {"_id": "Yogesh"},
                            {"_id": "Nitin"}
                        ], "children": []}
                    ]},
                    {"_id": "Pawan", "employee": "Pawan", "code": "DFG-1012", "reporting_to": [
                        {"_id": "Yogesh"},
                        {"_id": "Nitin"}
                    ], "children": [
                        {"_id": "Sachin", "employee": "Sachin", "code": "DFG -1013", "reporting_to": [
                            {"_id": "Pawan"}
                        ], "children": [
                            {"_id": "Ashu", "employee": "Ashu", "code": "DFG-1019", "reporting_to": [
                                {"_id": "Pawan"},
                                {"_id": "Sachin"}
                            ], "children": []}
                        ]},
                        {"_id": "Ashu", "employee": "Ashu", "code": "DFG-1019", "reporting_to": [
                            {"_id": "Pawan"},
                            {"_id": "Sachin"}
                        ], "children": []}
                    ]},
                    {"_id": "Rohit", "employee": "Rohit", "code": "DFG-1015", "reporting_to": [
                        {"_id": "Yogesh"},
                        {"_id": "Nitin"}
                    ], "children": []}
                ]}
            ]};
        })

        it("Recursive With multiple column and rootFilter and filter in $and", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection: NorthwindDb.EMP_RECURSION_TABLE, $insert: NorthwindDb.Emps}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection: {collection: NorthwindDb.EMP_RECURSION_TABLE, fields: [
                            {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                        ]},
                        $fields: {
                            employee: 1,
                            code: 1
//                        reporting_to:1
                        },
                        $filter: {
                            status: "active",
                            $and: [
                                {code: {$ne: null}}
                            ]
                        },
                        $recursion: {
                            reporting_to: "_id",
                            $level: 4,
                            $ensure: 1,
                            $rootFilter: {reporting_to: null}
                        },
                        $sort: {"employee": 1}
                    };

                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("Data------  " + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0]._id).to.eql("Yogesh");
                    expect(data.result[0].employee).to.eql("Yogesh");
                    expect(data.result[0].code).to.eql("DFG-1011");

                    expect(data.result[0].children).to.have.length(3);
                    expect(data.result[0].children[0]._id).to.eql("Nitin");
                    expect(data.result[0].children[0].employee).to.eql("Nitin");
                    expect(data.result[0].children[0].code).to.eql("DFG-1018");
                    expect(data.result[0].children[1].children).to.have.length(2);
                    expect(data.result[0].children[0].children[0]._id).to.eql("Pawan");
                    expect(data.result[0].children[0].children[1]._id).to.eql("Rohit");

                    expect(data.result[0].children[1]._id).to.eql("Pawan");
                    expect(data.result[0].children[1].employee).to.eql("Pawan");
                    expect(data.result[0].children[1].children).to.have.length(2);
                    expect(data.result[0].children[1].children[0]._id).to.eql("Ashu");
                    expect(data.result[0].children[1].children[1]._id).to.eql("Sachin");
                    expect(data.result[0].children[1].children[1].children).to.have.length(1);
                    expect(data.result[0].children[1].children[1].children[0]._id).to.eql("Ashu");

                    expect(data.result[0].children[2]._id).to.eql("Rohit");
                    expect(data.result[0].children[2].employee).to.eql("Rohit");
                    expect(data.result[0].children[2].children).to.have.length(0);

                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            //step1, get all employees where reporting_to : null
            //throw error if not $root filter
            //recursion module --> doQuery-> it will add $root filter

            var query1 = {
                $collection: {collection: NorthwindDb.EMP_RECURSION_TABLE, fields: [
                    {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                ]},
                $fields: {
                    employee: 1,
                    code: 1,
                    reporting_to: 1,
                    children: {
                        $query: {
                            $type: "n-rows",
                            $collection: {collection: NorthwindDb.EMP_RECURSION_TABLE, fields: [
                                {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                            ]},
                            $fields: {employee: 1, code: 1, reporting_to: 1},
                            $filter: {
                                status: "active"
                            },
                            $recursion: {
                                reporting_to: "_id",
                                $level: 3
                            },
                            $sort: {"employee": 1}
                        },
                        $fk: "reporting_to",
                        $parent: "_id"
                    }
                },
                $filter: {"status": "active", reporting_to: null},
                $sort: {"employee": 1}
            };

            //setp 2 --> doQuery of subquery --> will remove children as it is of subquery column

            var query1 = {
                $collection: "employees",
                $fields: {
                    employee: 1,
                    code: 1

                },
                $filter: {"status": "active", reporting_to: null},
                $fk: {"reporting_to": "employee"}


            };

            var expectedResult = {"result": [
                {"_id": "Yogesh", "employee": "Yogesh", "code": "DFG-1011", "children": [
                    {"_id": "Nitin", "employee": "Nitin", "code": "DFG-1018", "reporting_to": [
                        {"_id": "Yogesh"}
                    ], "children": [
                        {"_id": "Pawan", "employee": "Pawan", "code": "DFG-1012", "reporting_to": [
                            {"_id": "Yogesh"},
                            {"_id": "Nitin"}
                        ], "children": [
                            {"_id": "Sachin", "employee": "Sachin", "code": "DFG-1013", "reporting_to": [
                                {"_id": "Pawan"}
                            ], "children": [
                                {"_id": "Ashu", "employee": "Ashu", "code": "DFG-1019", "reporting_to": [
                                    {"_id": "Pawan"},
                                    {"_id": "Sachin"}
                                ]}
                            ]},
                            {"_id": "Ashu", "employee": "Ashu", "code": "DFG-1019", "reporting_to": [
                                {"_id": "Pawan"},
                                {"_id": "Sachin" }
                            ], "children": []}
                        ]},
                        {"_id": "Rohit", "employee": "Rohit", "code": "DFG-1015", "reporting_to": [
                            {"_id": "Yogesh"},
                            {"_id": "Nitin"}
                        ], "children": []}
                    ]},
                    {"_id": "Pawan", "employee": "Pawan", "code": "DFG-1012", "reporting_to": [
                        {"_id": "Yogesh"},
                        {"_id": "Nitin"}
                    ], "children": [
                        {"_id": "Sachin", "employee": "Sachin", "code": "DFG -1013", "reporting_to": [
                            {"_id": "Pawan"}
                        ], "children": [
                            {"_id": "Ashu", "employee": "Ashu", "code": "DFG-1019", "reporting_to": [
                                {"_id": "Pawan"},
                                {"_id": "Sachin"}
                            ], "children": []}
                        ]},
                        {"_id": "Ashu", "employee": "Ashu", "code": "DFG-1019", "reporting_to": [
                            {"_id": "Pawan"},
                            {"_id": "Sachin"}
                        ], "children": []}
                    ]},
                    {"_id": "Rohit", "employee": "Rohit", "code": "DFG-1015", "reporting_to": [
                        {"_id": "Yogesh"},
                        {"_id": "Nitin"}
                    ], "children": []}
                ]}
            ]};
        })

        it("Recursive With single columns", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection: NorthwindDb.EMP_RECURSIVE_TABLE, $insert: NorthwindDb.EmpRecursive}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection: {collection: NorthwindDb.EMP_RECURSIVE_TABLE, fields: [
                            {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                        ]},
                        $fields: {
                            employee: 1,
                            code: 1,
                            reporting_to: 1
                        },
                        $filter: {
                            status: "active",
                            "reporting_to": null
                        },
                        $recursion: {
                            reporting_to: "_id",
                            $level: 3,
                            $ensure: 1
                        }

                    };

                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data >>>>>>>>>" + JSON.stringify(data))
                    expect(data.result).to.have.length(1);
                    expect(data.result[0]._id).to.eql("Nitin");
                    expect(data.result[0].employee).to.eql("Nitin");
                    expect(data.result[0].code).to.eql("DFG-1011");
                    expect(data.result[0].children).to.have.length(2);
                    expect(data.result[0].children[0]._id).to.eql("Pawan");
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[0].children[0]._id).to.eql("Sachin");
                    expect(data.result[0].children[1].employee).to.eql("Rohit");
                    expect(data.result[0].children[1].children).to.have.length(0);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
            //step1, get all employees where reporting_to : null
            //throw error if not $root filter
            //recursion module --> doQuery-> it will add $root filter

            var query1 = {
                $collection: {collection: NorthwindDb.EMP_RECURSIVE_TABLE, fields: [
                    {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                ]},
                $fields: {
                    employee: 1,
                    code: 1,
                    reporting_to: 1,
                    children: {
                        $query: {
                            $type: "n-rows",
                            $collection: {collection: NorthwindDb.EMP_RECURSIVE_TABLE, fields: [
                                {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                            ]},
                            $fields: {employee: 1, code: 1, reporting_to: 1},
                            $filter: {
                                status: "active"
                            },
                            $recursion: {
                                reporting_to: "_id",
                                $level: 2
                            }
                        },
                        $fk: "reporting_to",
                        $parent: "_id"
                    }
                },
                $filter: {"status": "active", reporting_to: null}
            };

            //setp 2 --> doQuery of subquery --> will remove children as it is of subquery column

            var query1 = {
                $collection: "employees",
                $fields: {
                    employee: 1,
                    code: 1,
                    reporting_to: 1

                },
                $filter: {"status": "active", reporting_to: null},
                $fk: {"reporting_to": "employee"}


            };

            var expectedResult = {"result": [
                {"_id": "Nitin", "employee": "Nitin", "code": "DFG-1011", "children": [
                    {"_id": "Pawan", "employee": "Pawa n", "code": "DFG-1012", "reporting_to": {"_id": "Nitin"}, "children": [
                        {"_id": "Sachin", "employee": "Sachin", "code": "DFG-1013", "reporting_to": {"_id": "Pawan"}}
                    ]},
                    {"_id": "Rohit", "employee": "Rohit", "code": "DFG-1015", "reporting_to": {"_id": "Nitin"}, "chil dren": []}
                ]}
            ]};

        })

        it("Recursive With single columns without _id", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.update([
                        {$collection: NorthwindDb.EMP_RECURSIVE_WITHOUT_ID_TABLE, $insert: NorthwindDb.EmpRecursiveWithout_id}
                    ])
                }).then(
                function () {
//                    console.log("after update ....");
                    var query = {
                        $collection: {collection: NorthwindDb.EMP_RECURSIVE_WITHOUT_ID_TABLE, fields: [
                            {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSIVE_WITHOUT_ID_TABLE}
                        ]},
                        $fields: {
                            employee: 1,
                            code: 1,
                            reporting_to: 1
                        },
                        $filter: {
                            status: "active",
                            "reporting_to": null
                        },
                        $recursion: {
                            reporting_to: "_id",
                            $level: 3,
                            $ensure: 1
                        }

                    };

                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data >>>>>>>>>" + JSON.stringify(data))
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].employee).to.eql("Nitin");
                    expect(data.result[0].code).to.eql("DFG-1011");
                    expect(data.result[0].children).to.have.length(2);
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[1].employee).to.eql("Rohit");
                    expect(data.result[0].children[1].children).to.have.length(0);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
            var res = {"result": [
                {"employee": "Nitin", "code": "DFG-1011", "_id": "536a227165941ae80e33e463", "children": [
                    {"employee": "Pawan", "code": "DFG-1012", "reporting_to": {"_id": "536a227165941ae80e33e463"}, "_id": "536a227165941ae80e33e466", "children": [
                        {"employee": "Sachin", "code": "DFG-1013", "reporting_to": {"_id ": "536a227165941ae80e33e466"}, "_id": "536a227165941ae80e33e469"}
                    ]},
                    {"employee": "Rohit", "code": "DFG-1015", "reporting_to": {"_id": "536a227165941ae80e33e463"}, "_id": "536a227165941ae80e33e46f", "children": []}
                ]}
            ]};

        })

        it("Recursive case of Two Employees referes to one another", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection: NorthwindDb.EMP_RELATION_TABLE, $insert: NorthwindDb.EmpRelation}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection: {collection: NorthwindDb.EMP_RELATION_TABLE, fields: [
                            {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                        ]},
                        $fields: {
                            employee: 1,
                            code: 1
//                        reporting_to:1
                        },
                        $filter: {
                            status: "active",
                            "reporting_to": null
                        },
                        $recursion: {
                            reporting_to: "_id"
                        }

                    };

                    return db.query(query);
                }).then(
                function (data) {
                    done("Not Ok")
                }).then(
                function () {
                    done();
                }).fail(function (err) {
                    var recursionError = err.toString().indexOf("Too Many Recursion levels found.") != -1;
                    if (recursionError) {
                        done();
                    } else {
                        done(err);
                    }
                })
        })

        it("Recursive With single column with n level", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection: NorthwindDb.EMP_RECURSIVE_TABLE, $insert: NorthwindDb.EmpRecursive}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection: {collection: NorthwindDb.EMP_RECURSIVE_TABLE, fields: [
                            {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                        ]},
                        $fields: {
                            employee: 1,
                            code: 1
//                        reporting_to:1
                        },
                        $filter: {
                            status: "active",
                            "reporting_to": null
                        },
                        $recursion: {
                            reporting_to: "_id",
                            $level: 10
                        }

                    };

                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data >>>>>>>>>" + JSON.stringify(data))
                    expect(data.result).to.have.length(1);
                    expect(data.result[0]._id).to.eql("Nitin");
                    expect(data.result[0].employee).to.eql("Nitin");
                    expect(data.result[0].code).to.eql("DFG-1011");
                    expect(data.result[0].children).to.have.length(2);
                    expect(data.result[0].children[0]._id).to.eql("Pawan");
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[0].children[0]._id).to.eql("Sachin");
                    expect(data.result[0].children[1].employee).to.eql("Rohit");
//                    expect(data.result[0].children[1].children).to.have.length(0);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            //step1, get all employees where reporting_to : null
            //throw error if not $root filter
            //recursion module --> doQuery-> it will add $root filter

            var query1 = {
                $collection: {collection: NorthwindDb.EMP_RECURSIVE_TABLE, fields: [
                    {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                ]},
                $fields: {
                    employee: 1,
                    code: 1,
                    reporting_to: 1,
                    children: {
                        $query: {
                            $type: "n-rows",
                            $collection: {collection: NorthwindDb.EMP_RECURSIVE_TABLE, fields: [
                                {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                            ]},
                            $fields: {employee: 1, code: 1, reporting_to: 1},
                            $filter: {
                                status: "active"
                            },
                            $recursion: {
                                reporting_to: "_id",
                                $level: 2
                            }
                        },
                        $fk: "reporting_to",
                        $parent: "_id"
                    }
                },
                $filter: {"status": "active", reporting_to: null}
            };

            //setp 2 --> doQuery of subquery --> will remove children as it is of subquery column

            var query1 = {
                $collection: "employees",
                $fields: {
                    employee: 1,
                    code: 1,
                    reporting_to: 1

                },
                $filter: {"status": "active", reporting_to: null},
                $fk: {"reporting_to": "employee"}


            };

            var expectedResult = {"result": [
                {"_id": "Nitin", "employee": "Nitin", "code": "DFG-1011", "children": [
                    {"_id": "Pawan", "employee": "Pawa n", "code": "DFG-1012", "reporting_to": {"_id": "Nitin"}, "children": [
                        {"_id": "Sachin", "employee": "Sachin", "code": "DFG-1013", "reporting_to": {"_id": "Pawan"}}
                    ]},
                    {"_id": "Rohit", "employee": "Rohit", "code": "DFG-1015", "reporting_to": {"_id": "Nitin"}, "chil dren": []}
                ]}
            ]};

        })

        it("Recursive With single column and alias in recusrion", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection: NorthwindDb.EMP_RECURSIVE_TABLE, $insert: NorthwindDb.EmpRecursive}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection: {collection: NorthwindDb.EMP_RECURSIVE_TABLE, fields: [
                            {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                        ]},
                        $fields: {
                            employee: 1,
                            code: 1
//                        reporting_to:1
                        },
                        $filter: {
                            status: "active",
                            "reporting_to": null
                        },
                        $recursion: {
                            reporting_to: "_id",
                            $level: 3,
                            $alias: "childs"
                        }

                    };

                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data >>>>>>>>>" + JSON.stringify(data))
                    expect(data.result).to.have.length(1);
                    expect(data.result[0]._id).to.eql("Nitin");
                    expect(data.result[0].employee).to.eql("Nitin");
                    expect(data.result[0].code).to.eql("DFG-1011");
                    expect(data.result[0].childs).to.have.length(2);
                    expect(data.result[0].childs[0]._id).to.eql("Pawan");
                    expect(data.result[0].childs[0].childs).to.have.length(1);
                    expect(data.result[0].childs[0].childs[0]._id).to.eql("Sachin");
                    expect(data.result[0].childs[1].employee).to.eql("Rohit");
//                    expect(data.result[0].childs[1].childs).to.have.length(0);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            //step1, get all employees where reporting_to : null
            //throw error if not $root filter
            //recursion module --> doQuery-> it will add $root filter

            var query1 = {
                $collection: {collection: NorthwindDb.EMP_RECURSIVE_TABLE, fields: [
                    {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                ]},
                $fields: {
                    employee: 1,
                    code: 1,
                    reporting_to: 1,
                    childs: {
                        $query: {
                            $type: "n-rows",
                            $collection: {collection: NorthwindDb.EMP_RECURSIVE_TABLE, fields: [
                                {field: "reporting_to", type: "fk", collection: NorthwindDb.EMP_RECURSION_TABLE}
                            ]},
                            $fields: {employee: 1, code: 1, reporting_to: 1},
                            $filter: {
                                status: "active"
                            },
                            $recursion: {
                                reporting_to: "_id",
                                $level: 2,
                                $alias: "childs"
                            }
                        },
                        $fk: "reporting_to",
                        $parent: "_id"
                    }
                },
                $filter: {"status": "active", reporting_to: null}
            };

            //setp 2 --> doQuery of subquery --> will remove children as it is of subquery column

            var query1 = {
                $collection: "employees",
                $fields: {
                    employee: 1,
                    code: 1,
                    reporting_to: 1

                },
                $filter: {"status": "active", reporting_to: null},
                $fk: {"reporting_to": "employee"}


            };

            var expectedResult = {"result": [
                {"_id": "Nitin", "employee": "Nitin", "code": "DFG-1011", "childs": [
                    {"_id": "Pawan", "employee": "Pawa n", "code": "DFG-1012", "reporting_to": {"_id": "Nitin"}, "childs": [
                        {"_id": "Sachin", "employee": "Sachin", "code": "DFG-1013", "reporting_to": {"_id": "Pawan"}}
                    ]},
                    {"_id": "Rohit", "employee": "Rohit", "code": "DFG-1015", "reporting_to": {"_id": "Nitin"}, "childs": []}
                ]}
            ]};

        })

        it("Recursive Data with current user", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
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
                    return ApplaneDB.connect(Config.URL, Config.DB, OPTIONS);
                }).then(
                function (db1) {
                    db = db1;
                    return db.update([
                        {$collection: "employeess", $insert: [
                            {emailid: "yogesh@daffodilsw.com", userid: {$query: {emailid: "yogesh@daffodilsw.com"}}},
                            {emailid: "amit.singh@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}, userid: {$query: {emailid: "amit.singh@daffodilsw.com"}}},
                            {emailid: "rohit.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}, userid: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}},
                            {emailid: "sachin.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                            {emailid: "kapil.dalal@daffodilsw.com", reporting_to_id: {$query: {emailid: "amit.singh@daffodilsw.com"}}, userid: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}},
                            {emailid: "preeti.gulia@daffodilsw.com", reporting_to_id: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, userid: {$query: {emailid: "preeti.gulia@daffodilsw.com"}}},
                            {emailid: "sushil.kumar@daffodilsw.com", reporting_to_id: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, userid: {$query: {emailid: "sushil.kumar@daffodilsw.com"}}},
                            {emailid: "naveen.singh@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "naveen.singh@daffodilsw.com"}}},
                            {emailid: "manjeet.sanghwan@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}},
                            {emailid: "rajit.kumar@daffodilsw.com", reporting_to_id: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}, userid: {$query: {emailid: "rajit.kumar@daffodilsw.com"}}},
                            {emailid: "ashu@daffodilsw.com", reporting_to_id: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "ashu@daffodilsw.com"}}},
                            {emailid: "sunil@daffodilsw.com", reporting_to_id: {$query: {emailid: "sushil.kumar@daffodilsw.com"}}, userid: {$query: {emailid: "sunil@daffodilsw.com"}}}
                        ]},
                        {$collection: "taskss", $insert: [
                            {task: "Task1", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task2", status: "Completed", assigntoid: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, estefforts: {time: 4, unit: "Hrs"}, expectedCost: {amount: 400, type: {$query: {currency: "INR"}}}},
                            {task: "Task3", status: "New", assigntoid: {$query: {emailid: "amit.singh@daffodilsw.com"}}},
                            {task: "Task4", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 5, unit: "Hrs"}, expectedCost: {amount: 1000, type: {$query: {currency: "INR"}}}},
                            {task: "Task5", status: "New", assigntoid: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}},
                            {task: "Task6", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 3, unit: "Hrs"}, expectedCost: {amount: 800, type: {$query: {currency: "INR"}}}},
                            {task: "Task7", status: "Completed", assigntoid: {$query: {emailid: "preeti.gulia@daffodilsw.com"}}, expectedCost: {amount: 700, type: {$query: {currency: "INR"}}}},
                            {task: "Task8", status: "New", assigntoid: {$query: {emailid: "sunil@daffodilsw.com"}}, estefforts: {time: 5, unit: "Hrs"}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task9", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task10", status: "New", assigntoid: {$query: {emailid: "naveen.singh@daffodilsw.com"}}, estefforts: {time: 7, unit: "Hrs"}},
                            {task: "Task11", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 3, unit: "Hrs"}, expectedCost: {amount: 300, type: {$query: {currency: "INR"}}}},
                            {task: "Task12", status: "Completed", assigntoid: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task13", status: "New", assigntoid: {$query: {emailid: "ashu@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}},
                            {task: "Task14", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task15", status: "New", assigntoid: {$query: {emailid: "rajit.kumar@daffodilsw.com"}}}
                        ]}
                    ]);
                }).then(
                function (result) {
                    var query = {
                        $collection: "employeess",
                        $fields: {
                            emailid: 1,
                            backlogs: {
                                $type: {scalar: "count"},
                                $query: {
                                    $collection: "taskss",
                                    $group: {
                                        _id: null,
                                        count: {$sum: 1}
                                    }
                                },
                                $fk: "assigntoid", $parent: "_id"
                            },
                            plantask: {
                                $type: {scalar: "estefforts"},
                                $query: {
                                    $collection: "taskss",
                                    $group: {
                                        _id: null,
                                        estefforts: {$sum: "$estefforts"}
                                    }
                                },
                                $fk: "assigntoid", $parent: "_id"
                            },
                            expectedCost: {
                                $type: {scalar: "expectedCost"},
                                $query: {
                                    $collection: "taskss",
                                    $group: {
                                        _id: null,
                                        expectedCost: {$sum: "$expectedCost"}
                                    }
                                },
                                $fk: "assigntoid", $parent: "_id"
                            }
                        },
                        $filter: {
                            "reporting_to_id.userid": {$function: {"Functions.CurrentUser": {"_id": 1}}}
                        },
                        $recursion: {
                            "reporting_to_id": "_id",
                            $ensure: 1,
                            $rollup: ["backlogs", {"plantask": {time: {$sum: "$time"}, unit: {$first: "$unit"}}}, {"expectedCost": {amount: {$sum: "$amount"}, type: {$first: "$type"}}}]
                        },
                        $sort: {"emailid": 1}
                    };

                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("Data------  " + JSON.stringify(data));
                    expect(data.result).to.have.length(2);

                    expect(data.result[0].emailid).to.eql("amit.singh@daffodilsw.com");
                    expect(data.result[0].backlogs.self).to.eql(1);
                    expect(data.result[0].backlogs.children).to.eql(3);
                    expect(data.result[0].plantask.self.time).to.eql(0);
                    expect(data.result[0].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[0].plantask.children.time).to.eql(7);
                    expect(data.result[0].plantask.children.unit).to.eql("Hrs");
                    expect(data.result[0].expectedCost.self.amount).to.eql(0);
                    expect(data.result[0].expectedCost.children.amount).to.eql(900);
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0].emailid).to.eql("kapil.dalal@daffodilsw.com");
                    expect(data.result[0].children[0].backlogs.self).to.eql(1);
                    expect(data.result[0].children[0].backlogs.children).to.eql(2);
                    expect(data.result[0].children[0].plantask.self.time).to.eql(2);
                    expect(data.result[0].children[0].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].plantask.children.time).to.eql(5);
                    expect(data.result[0].children[0].plantask.children.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].expectedCost.self.amount).to.eql(0);
                    expect(data.result[0].children[0].expectedCost.children.amount).to.eql(900);
                    expect(data.result[0].children[0].children).to.have.length(2);
                    expect(data.result[0].children[0].children[0].emailid).to.eql("preeti.gulia@daffodilsw.com");
                    expect(data.result[0].children[0].children[0].backlogs.self).to.eql(1);
                    expect(data.result[0].children[0].children[0].backlogs.children).to.eql(undefined);
                    expect(data.result[0].children[0].children[0].plantask.self.time).to.eql(0);
                    expect(data.result[0].children[0].children[0].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].children[0].plantask.children).to.eql(undefined);
                    expect(data.result[0].children[0].children[0].expectedCost.self.amount).to.eql(700);
                    expect(data.result[0].children[0].children[0].expectedCost.children).to.eql(undefined);
                    expect(data.result[0].children[0].children[0].children).to.have.length(0);
                    expect(data.result[0].children[0].children[1].emailid).to.eql("sushil.kumar@daffodilsw.com");
                    expect(data.result[0].children[0].children[1].backlogs.self).to.eql(undefined);
                    expect(data.result[0].children[0].children[1].backlogs.children).to.eql(1);
                    expect(data.result[0].children[0].children[1].plantask.self).to.eql(undefined);
                    expect(data.result[0].children[0].children[1].plantask.children.time).to.eql(5);
                    expect(data.result[0].children[0].children[1].plantask.children.unit).to.eql("Hrs");
//                    expect(data.result[0].children[0].children[1].expectedCost.self).to.eql(undefined);
                    expect(data.result[0].children[0].children[1].expectedCost.children.amount).to.eql(200);
                    expect(data.result[0].children[0].children[1].children).to.have.length(1);
//
                    expect(data.result[1].emailid).to.eql("rohit.bansal@daffodilsw.com");
                    expect(data.result[1].backlogs.self).to.eql(1);
                    expect(data.result[1].backlogs.children).to.eql(10);
                    expect(data.result[1].plantask.self.time).to.eql(4);
                    expect(data.result[1].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[1].plantask.children.time).to.eql(26);
                    expect(data.result[1].plantask.children.unit).to.eql("Hrs");
                    expect(data.result[1].expectedCost.self.amount).to.eql(400);
                    expect(data.result[1].expectedCost.children.amount).to.eql(2900);
                    expect(data.result[1].children).to.have.length(3);
                    expect(data.result[1].children[0].emailid).to.eql("manjeet.sanghwan@daffodilsw.com");
                    expect(data.result[1].children[0].backlogs.self).to.eql(1);
                    expect(data.result[1].children[0].backlogs.children).to.eql(1);
                    expect(data.result[1].children[0].plantask.self.time).to.eql(2);
                    expect(data.result[1].children[0].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[1].children[0].expectedCost.self.amount).to.eql(200);
                    expect(data.result[1].children[0].children).to.have.length(1);
                    expect(data.result[1].children[1].emailid).to.eql("naveen.singh@daffodilsw.com");
                    expect(data.result[1].children[1].backlogs.self).to.eql(1);
                    expect(data.result[1].children[1].plantask.self.time).to.eql(7);
                    expect(data.result[1].children[1].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[1].children[1].expectedCost.self.amount).to.eql(0);
                    expect(data.result[1].children[1].children).to.have.length(0);
                    expect(data.result[1].children[2].emailid).to.eql("sachin.bansal@daffodilsw.com");
                    expect(data.result[1].children[2].backlogs.self).to.eql(6);
                    expect(data.result[1].children[2].backlogs.children).to.eql(1);
                    expect(data.result[1].children[2].plantask.self.time).to.eql(15);
                    expect(data.result[1].children[2].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[1].children[2].plantask.children.time).to.eql(2);
                    expect(data.result[1].children[2].plantask.children.unit).to.eql("Hrs");
                    expect(data.result[1].children[2].expectedCost.self.amount).to.eql(2700);
                    expect(data.result[1].children[2].children).to.have.length(1);

                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })

        it("Recursive Fields with aggregate sum", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
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
                    return ApplaneDB.connect(Config.URL, Config.DB, OPTIONS);
                }).then(
                function (db1) {
                    db = db1;
                    return db.update([
                        {$collection: "employeess", $insert: [
                            {emailid: "yogesh@daffodilsw.com", userid: {$query: {emailid: "yogesh@daffodilsw.com"}}},
                            {emailid: "amit.singh@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}, userid: {$query: {emailid: "amit.singh@daffodilsw.com"}}},
                            {emailid: "rohit.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}, userid: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}},
                            {emailid: "sachin.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                            {emailid: "kapil.dalal@daffodilsw.com", reporting_to_id: {$query: {emailid: "amit.singh@daffodilsw.com"}}, userid: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}},
                            {emailid: "preeti.gulia@daffodilsw.com", reporting_to_id: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, userid: {$query: {emailid: "preeti.gulia@daffodilsw.com"}}},
                            {emailid: "sushil.kumar@daffodilsw.com", reporting_to_id: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, userid: {$query: {emailid: "sushil.kumar@daffodilsw.com"}}},
                            {emailid: "naveen.singh@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "naveen.singh@daffodilsw.com"}}},
                            {emailid: "manjeet.sanghwan@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}},
                            {emailid: "rajit.kumar@daffodilsw.com", reporting_to_id: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}, userid: {$query: {emailid: "rajit.kumar@daffodilsw.com"}}},
                            {emailid: "ashu@daffodilsw.com", reporting_to_id: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "ashu@daffodilsw.com"}}},
                            {emailid: "sunil@daffodilsw.com", reporting_to_id: {$query: {emailid: "sushil.kumar@daffodilsw.com"}}, userid: {$query: {emailid: "sunil@daffodilsw.com"}}}
                        ]},
                        {$collection: "taskss", $insert: [
                            {task: "Task1", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task2", status: "Completed", assigntoid: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, estefforts: {time: 4, unit: "Hrs"}, expectedCost: {amount: 400, type: {$query: {currency: "INR"}}}},
                            {task: "Task3", status: "New", assigntoid: {$query: {emailid: "amit.singh@daffodilsw.com"}}},
                            {task: "Task4", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 5, unit: "Hrs"}, expectedCost: {amount: 1000, type: {$query: {currency: "INR"}}}},
                            {task: "Task5", status: "New", assigntoid: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}},
                            {task: "Task6", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 3, unit: "Hrs"}, expectedCost: {amount: 800, type: {$query: {currency: "INR"}}}},
                            {task: "Task7", status: "Completed", assigntoid: {$query: {emailid: "preeti.gulia@daffodilsw.com"}}, expectedCost: {amount: 700, type: {$query: {currency: "INR"}}}},
                            {task: "Task8", status: "New", assigntoid: {$query: {emailid: "sunil@daffodilsw.com"}}, estefforts: {time: 5, unit: "Hrs"}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task9", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task10", status: "New", assigntoid: {$query: {emailid: "naveen.singh@daffodilsw.com"}}, estefforts: {time: 7, unit: "Hrs"}},
                            {task: "Task11", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 3, unit: "Hrs"}, expectedCost: {amount: 300, type: {$query: {currency: "INR"}}}},
                            {task: "Task12", status: "Completed", assigntoid: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task13", status: "New", assigntoid: {$query: {emailid: "ashu@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}},
                            {task: "Task14", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task15", status: "New", assigntoid: {$query: {emailid: "rajit.kumar@daffodilsw.com"}}}
                        ]}
                    ]);
                }).then(
                function (result) {
                    var query = {
                        $collection: "employeess",
                        $fields: {
                            emailid: 1,
                            backlogs: {
                                $type: {scalar: "count"},
                                $query: {
                                    $collection: "taskss",
                                    $group: {
                                        _id: null,
                                        count: {$sum: 1}
                                    }
                                },
                                $fk: "assigntoid", $parent: "_id"
                            },
                            plantask: {
                                $type: {scalar: "estefforts"},
                                $query: {
                                    $collection: "taskss",
                                    $group: {
                                        _id: null,
                                        estefforts: {$sum: "$estefforts"}
                                    }
                                },
                                $fk: "assigntoid", $parent: "_id"
                            },
                            expectedCost: {
                                $type: {scalar: "expectedCost"},
                                $query: {
                                    $collection: "taskss",
                                    $group: {
                                        _id: null,
                                        expectedCost: {$sum: "$expectedCost"}
                                    }
                                },
                                $fk: "assigntoid", $parent: "_id"
                            }
                        },
                        $filter: {
                            "reporting_to_id.userid": {$function: {"Functions.CurrentUser": {"_id": 1}}}
                        },
                        $recursion: {
                            "reporting_to_id": "_id",
                            $ensure: 1,
                            $rollup: ["backlogs", {"plantask": {time: {$sum: "$time"}, unit: {$first: "$unit"}}}, {"expectedCost": {amount: {$sum: "$amount"}, type: {$first: "$type"}}}, "team", "teamEstHrs"],
                            team: {$sum: 1},
                            teamEstHrs: {$sum: "$plantask.total.time"}
                        },
                        $sort: {"emailid": 1}
                    };

                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("Data------  " + JSON.stringify(data));
                    expect(data.result).to.have.length(2);

                    expect(data.result[0].emailid).to.eql("amit.singh@daffodilsw.com");
                    expect(data.result[0].backlogs.self).to.eql(1);
                    expect(data.result[0].backlogs.children).to.eql(3);
                    expect(data.result[0].plantask.self.time).to.eql(0);
                    expect(data.result[0].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[0].plantask.children.time).to.eql(7);
                    expect(data.result[0].plantask.children.unit).to.eql("Hrs");
                    expect(data.result[0].expectedCost.self.amount).to.eql(0);
                    expect(data.result[0].expectedCost.children.amount).to.eql(900);
                    expect(data.result[0].team.self).to.eql(1);
                    expect(data.result[0].team.children).to.eql(3);
                    expect(data.result[0].team.total).to.eql(4);
                    expect(data.result[0].teamEstHrs.self).to.eql(7);
                    expect(data.result[0].teamEstHrs.children).to.eql(10);
                    expect(data.result[0].teamEstHrs.total).to.eql(17);
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0].emailid).to.eql("kapil.dalal@daffodilsw.com");
                    expect(data.result[0].children[0].backlogs.self).to.eql(1);
                    expect(data.result[0].children[0].backlogs.children).to.eql(2);
                    expect(data.result[0].children[0].plantask.self.time).to.eql(2);
                    expect(data.result[0].children[0].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].plantask.children.time).to.eql(5);
                    expect(data.result[0].children[0].plantask.children.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].expectedCost.self.amount).to.eql(0);
                    expect(data.result[0].children[0].expectedCost.children.amount).to.eql(900);
                    expect(data.result[0].children[0].team.self).to.eql(2);
                    expect(data.result[0].children[0].team.children).to.eql(1);
                    expect(data.result[0].children[0].team.total).to.eql(3);
                    expect(data.result[0].children[0].teamEstHrs.self).to.eql(5);
                    expect(data.result[0].children[0].teamEstHrs.children).to.eql(5);
                    expect(data.result[0].children[0].teamEstHrs.total).to.eql(10);
                    expect(data.result[0].children[0].children).to.have.length(2);
                    expect(data.result[0].children[0].children[0].emailid).to.eql("preeti.gulia@daffodilsw.com");
                    expect(data.result[0].children[0].children[0].backlogs.self).to.eql(1);
                    expect(data.result[0].children[0].children[0].backlogs.children).to.eql(undefined);
                    expect(data.result[0].children[0].children[0].plantask.self.time).to.eql(0);
                    expect(data.result[0].children[0].children[0].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].children[0].expectedCost.self.amount).to.eql(700);
                    expect(data.result[0].children[0].children[0].children).to.have.length(0);
                    expect(data.result[0].children[0].children[1].emailid).to.eql("sushil.kumar@daffodilsw.com");
                    expect(data.result[0].children[0].children[1].backlogs.self).to.eql(undefined);
                    expect(data.result[0].children[0].children[1].backlogs.children).to.eql(1);
                    expect(data.result[0].children[0].children[1].plantask.children.time).to.eql(5);
                    expect(data.result[0].children[0].children[1].plantask.children.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].children[1].expectedCost.children.amount).to.eql(200);
                    expect(data.result[0].children[0].children[1].team.self).to.eql(1);
                    expect(data.result[0].children[0].children[1].team.total).to.eql(1);
                    expect(data.result[0].children[0].children[1].teamEstHrs.self).to.eql(5);
                    expect(data.result[0].children[0].children[1].teamEstHrs.total).to.eql(5);
                    expect(data.result[0].children[0].children[1].children).to.have.length(1);

                    expect(data.result[1].emailid).to.eql("rohit.bansal@daffodilsw.com");
                    expect(data.result[1].backlogs.self).to.eql(1);
                    expect(data.result[1].backlogs.children).to.eql(10);
                    expect(data.result[1].plantask.self.time).to.eql(4);
                    expect(data.result[1].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[1].plantask.children.time).to.eql(26);
                    expect(data.result[1].plantask.children.unit).to.eql("Hrs");
                    expect(data.result[1].expectedCost.self.amount).to.eql(400);
                    expect(data.result[1].expectedCost.children.amount).to.eql(2900);
                    expect(data.result[1].team.self).to.eql(3);
                    expect(data.result[1].team.children).to.eql(2);
                    expect(data.result[1].team.total).to.eql(5);
                    expect(data.result[1].teamEstHrs.self).to.eql(26);
                    expect(data.result[1].teamEstHrs.children).to.eql(2);
                    expect(data.result[1].teamEstHrs.total).to.eql(28);
                    expect(data.result[1].children).to.have.length(3);
                    expect(data.result[1].children[0].emailid).to.eql("manjeet.sanghwan@daffodilsw.com");
                    expect(data.result[1].children[0].backlogs.self).to.eql(1);
                    expect(data.result[1].children[0].backlogs.children).to.eql(1);
                    expect(data.result[1].children[0].plantask.self.time).to.eql(2);
                    expect(data.result[1].children[0].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[1].children[0].expectedCost.self.amount).to.eql(200);
                    expect(data.result[1].children[0].team.self).to.eql(1);
                    expect(data.result[1].children[0].team.total).to.eql(1);
                    expect(data.result[1].children[0].children).to.have.length(1);
                    expect(data.result[1].children[1].emailid).to.eql("naveen.singh@daffodilsw.com");
                    expect(data.result[1].children[1].backlogs.self).to.eql(1);
                    expect(data.result[1].children[1].plantask.self.time).to.eql(7);
                    expect(data.result[1].children[1].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[1].children[1].expectedCost.self.amount).to.eql(0);
                    expect(data.result[1].children[1].children).to.have.length(0);
                    expect(data.result[1].children[2].emailid).to.eql("sachin.bansal@daffodilsw.com");
                    expect(data.result[1].children[2].backlogs.self).to.eql(6);
                    expect(data.result[1].children[2].backlogs.children).to.eql(1);
                    expect(data.result[1].children[2].plantask.self.time).to.eql(15);
                    expect(data.result[1].children[2].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[1].children[2].plantask.children.time).to.eql(2);
                    expect(data.result[1].children[2].plantask.children.unit).to.eql("Hrs");
                    expect(data.result[1].children[2].expectedCost.self.amount).to.eql(2700);
                    expect(data.result[1].children[2].team.self).to.eql(1);
                    expect(data.result[1].children[2].team.total).to.eql(1);
                    expect(data.result[1].children[2].teamEstHrs.self).to.eql(2);
                    expect(data.result[1].children[2].teamEstHrs.total).to.eql(2);
                    expect(data.result[1].children[2].children).to.have.length(1);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })

        it("Recursive Fields with aggregate sum and memory filter", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
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
                    return ApplaneDB.connect(Config.URL, Config.DB, OPTIONS);
                }).then(
                function (db1) {
                    db = db1;
                    return db.update([
                        {$collection: "employeess", $insert: [
                            {emailid: "yogesh@daffodilsw.com", userid: {$query: {emailid: "yogesh@daffodilsw.com"}}},
                            {emailid: "amit.singh@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}, userid: {$query: {emailid: "amit.singh@daffodilsw.com"}}},
                            {emailid: "rohit.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}, userid: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}},
                            {emailid: "sachin.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                            {emailid: "kapil.dalal@daffodilsw.com", reporting_to_id: {$query: {emailid: "amit.singh@daffodilsw.com"}}, userid: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}},
                            {emailid: "preeti.gulia@daffodilsw.com", reporting_to_id: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, userid: {$query: {emailid: "preeti.gulia@daffodilsw.com"}}},
                            {emailid: "sushil.kumar@daffodilsw.com", reporting_to_id: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, userid: {$query: {emailid: "sushil.kumar@daffodilsw.com"}}},
                            {emailid: "naveen.singh@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "naveen.singh@daffodilsw.com"}}},
                            {emailid: "manjeet.sanghwan@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}},
                            {emailid: "rajit.kumar@daffodilsw.com", reporting_to_id: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}, userid: {$query: {emailid: "rajit.kumar@daffodilsw.com"}}},
                            {emailid: "ashu@daffodilsw.com", reporting_to_id: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "ashu@daffodilsw.com"}}},
                            {emailid: "sunil@daffodilsw.com", reporting_to_id: {$query: {emailid: "sushil.kumar@daffodilsw.com"}}, userid: {$query: {emailid: "sunil@daffodilsw.com"}}}
                        ]},
                        {$collection: "taskss", $insert: [
                            {task: "Task1", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task2", status: "Completed", assigntoid: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, estefforts: {time: 4, unit: "Hrs"}, expectedCost: {amount: 400, type: {$query: {currency: "INR"}}}},
                            {task: "Task3", status: "New", assigntoid: {$query: {emailid: "amit.singh@daffodilsw.com"}}},
                            {task: "Task4", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 5, unit: "Hrs"}, expectedCost: {amount: 1000, type: {$query: {currency: "INR"}}}},
                            {task: "Task5", status: "New", assigntoid: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}},
                            {task: "Task6", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 3, unit: "Hrs"}, expectedCost: {amount: 800, type: {$query: {currency: "INR"}}}},
                            {task: "Task7", status: "Completed", assigntoid: {$query: {emailid: "preeti.gulia@daffodilsw.com"}}, expectedCost: {amount: 700, type: {$query: {currency: "INR"}}}},
                            {task: "Task8", status: "New", assigntoid: {$query: {emailid: "sunil@daffodilsw.com"}}, estefforts: {time: 5, unit: "Hrs"}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task9", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task10", status: "New", assigntoid: {$query: {emailid: "naveen.singh@daffodilsw.com"}}, estefforts: {time: 7, unit: "Hrs"}},
                            {task: "Task11", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 3, unit: "Hrs"}, expectedCost: {amount: 300, type: {$query: {currency: "INR"}}}},
                            {task: "Task12", status: "Completed", assigntoid: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task13", status: "New", assigntoid: {$query: {emailid: "ashu@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}},
                            {task: "Task14", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task15", status: "New", assigntoid: {$query: {emailid: "rajit.kumar@daffodilsw.com"}}}
                        ]}
                    ]);
                }).then(
                function (result) {
                    var query = {
                        $collection: "employeess",
                        $fields: {
                            emailid: 1,
                            backlogs: {
                                $type: {scalar: "count"},
                                $query: {
                                    $collection: "taskss",
                                    $group: {
                                        _id: null,
                                        count: {$sum: 1}
                                    }
                                },
                                $fk: "assigntoid", $parent: "_id"
                            },
                            plantask: {
                                $type: {scalar: "estefforts"},
                                $query: {
                                    $collection: "taskss",
                                    $group: {
                                        _id: null,
                                        estefforts: {$sum: "$estefforts"}
                                    }
                                },
                                $fk: "assigntoid", $parent: "_id"
                            },
                            expectedCost: {
                                $type: {scalar: "expectedCost"},
                                $query: {
                                    $collection: "taskss",
                                    $group: {
                                        _id: null,
                                        expectedCost: {$sum: "$expectedCost"}
                                    }
                                },
                                $fk: "assigntoid", $parent: "_id"
                            }
                        },
                        $filter: {
                            "reporting_to_id.userid": {$function: {"Functions.CurrentUser": {"_id": 1}}}
                        },
                        $recursion: {
                            "reporting_to_id": "_id",
                            $ensure: 1,
                            $rollup: ["backlogs", {"plantask": {time: {$sum: "$time"}, unit: {$first: "$unit"}}}, {"expectedCost": {amount: {$sum: "$amount"}, type: {$first: "$type"}}}, "team", "teamEstHrs"],
                            team: {$sum: 1},
                            teamEstHrs: {$sum: "$plantask.total.time"},
                            $filter: {$or: [
                                {"expectedCost.total.amount": {$gt: 0}},
                                {"expectedCost.total.amount": {$lt: 0}}
                            ]}
                        },
                        $sort: {"emailid": 1}
                    };

                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("Data------  " + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].emailid).to.eql("amit.singh@daffodilsw.com");
                    expect(data.result[0].backlogs.self).to.eql(1);
                    expect(data.result[0].backlogs.children).to.eql(3);
                    expect(data.result[0].backlogs.total).to.eql(4);
                    expect(data.result[0].plantask.self.time).to.eql(0);
                    expect(data.result[0].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[0].plantask.children.time).to.eql(7);
                    expect(data.result[0].plantask.children.unit).to.eql("Hrs");
                    expect(data.result[0].plantask.total.time).to.eql(7);
                    expect(data.result[0].plantask.total.unit).to.eql("Hrs");
                    expect(data.result[0].expectedCost.self.amount).to.eql(0);
                    expect(data.result[0].expectedCost.children.amount).to.eql(900);
                    expect(data.result[0].expectedCost.total.amount).to.eql(900);
                    expect(data.result[0].team.self).to.eql(1);
                    expect(data.result[0].team.children).to.eql(3);
                    expect(data.result[0].team.total).to.eql(4);
                    expect(data.result[0].teamEstHrs.self).to.eql(7);
                    expect(data.result[0].teamEstHrs.children).to.eql(10);
                    expect(data.result[0].teamEstHrs.total).to.eql(17);
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0].emailid).to.eql("kapil.dalal@daffodilsw.com");
                    expect(data.result[0].children[0].backlogs.self).to.eql(1);
                    expect(data.result[0].children[0].backlogs.children).to.eql(2);
                    expect(data.result[0].children[0].plantask.self.time).to.eql(2);
                    expect(data.result[0].children[0].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].plantask.children.time).to.eql(5);
                    expect(data.result[0].children[0].plantask.children.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].expectedCost.self.amount).to.eql(0);
                    expect(data.result[0].children[0].expectedCost.children.amount).to.eql(900);
                    expect(data.result[0].children[0].team.self).to.eql(2);
                    expect(data.result[0].children[0].team.children).to.eql(1);
                    expect(data.result[0].children[0].team.total).to.eql(3);
                    expect(data.result[0].children[0].teamEstHrs.self).to.eql(5);
                    expect(data.result[0].children[0].teamEstHrs.children).to.eql(5);
                    expect(data.result[0].children[0].teamEstHrs.total).to.eql(10);
                    expect(data.result[0].children[0].children).to.have.length(2);
                    expect(data.result[0].children[0].children[0].emailid).to.eql("preeti.gulia@daffodilsw.com");
                    expect(data.result[0].children[0].children[0].backlogs.self).to.eql(1);
                    expect(data.result[0].children[0].children[0].backlogs.children).to.eql(undefined);
                    expect(data.result[0].children[0].children[0].plantask.self.time).to.eql(0);
                    expect(data.result[0].children[0].children[0].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].children[0].expectedCost.self.amount).to.eql(700);
                    expect(data.result[0].children[0].children[0].children).to.have.length(0);
                    expect(data.result[0].children[0].children[1].emailid).to.eql("sushil.kumar@daffodilsw.com");
                    expect(data.result[0].children[0].children[1].backlogs.self).to.eql(undefined);
                    expect(data.result[0].children[0].children[1].backlogs.children).to.eql(1);
                    expect(data.result[0].children[0].children[1].plantask.children.time).to.eql(5);
                    expect(data.result[0].children[0].children[1].plantask.children.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].children[1].expectedCost.children.amount).to.eql(200);
                    expect(data.result[0].children[0].children[1].team.self).to.eql(1);
                    expect(data.result[0].children[0].children[1].team.total).to.eql(1);
                    expect(data.result[0].children[0].children[1].teamEstHrs.self).to.eql(5);
                    expect(data.result[0].children[0].children[1].teamEstHrs.total).to.eql(5);
                    expect(data.result[0].children[0].children[1].children).to.have.length(1);
                    expect(data.result[1].emailid).to.eql("rohit.bansal@daffodilsw.com");
                    expect(data.result[1].backlogs.self).to.eql(1);
                    expect(data.result[1].backlogs.children).to.eql(7);
                    expect(data.result[1].plantask.self.time).to.eql(4);
                    expect(data.result[1].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[1].plantask.children.time).to.eql(17);
                    expect(data.result[1].plantask.children.unit).to.eql("Hrs");
                    expect(data.result[1].expectedCost.self.amount).to.eql(400);
                    expect(data.result[1].expectedCost.children.amount).to.eql(2900);
                    expect(data.result[1].team.self).to.eql(2);
                    expect(data.result[1].team.total).to.eql(2);
                    expect(data.result[1].teamEstHrs.self).to.eql(17);
                    expect(data.result[1].teamEstHrs.total).to.eql(17);
                    expect(data.result[1].children).to.have.length(2);
                    expect(data.result[1].children[0].emailid).to.eql("manjeet.sanghwan@daffodilsw.com");
                    expect(data.result[1].children[0].backlogs.self).to.eql(1);
                    expect(data.result[1].children[0].backlogs.children).to.eql(undefined);
                    expect(data.result[1].children[0].plantask.self.time).to.eql(2);
                    expect(data.result[1].children[0].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[1].children[0].expectedCost.self.amount).to.eql(200);
                    expect(data.result[1].children[0].team).to.eql(undefined);
                    expect(data.result[1].children[0].children).to.have.length(0);
                    expect(data.result[1].children[1].emailid).to.eql("sachin.bansal@daffodilsw.com");
                    expect(data.result[1].children[1].backlogs.self).to.eql(6);
                    expect(data.result[1].children[1].backlogs.children).to.eql(undefined);
                    expect(data.result[1].children[1].plantask.self.time).to.eql(15);
                    expect(data.result[1].children[1].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[1].children[1].expectedCost.self.amount).to.eql(2700);
                    expect(data.result[1].children[1].team).to.eql(undefined);
                    expect(data.result[1].children[1].children).to.have.length(0);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })

        it("Recursive Fields with aggregate sum and memory filter and ensure Filter", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.update([
                        {$collection: "pl.users", $insert: [
                            {username: "Yogesh", password: "yogesh", emailid: "yogesh@daffodilsw.com"},
                            {username: "Amit Singh", password: "amit", emailid: "amit.singh@daffodilsw.com"},
                            {username: "Rohit", password: "rohit", emailid: "rohit.bansal@daffodilsw.com"},
                            {username: "Sachin", password: "sachin", emailid: "sachin.bansal@daffodilsw.com"},
                            {username: "Kapil", password: "kapil", emailid: "kapil.dalal@daffodilsw.com"}
                        ]}
                    ]);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, OPTIONS);
                }).then(
                function (db1) {
                    db = db1;
                    return db.update([
                        {$collection: "employeess", $insert: [
                            {emailid: "yogesh@daffodilsw.com", userid: {$query: {emailid: "yogesh@daffodilsw.com"}}},
                            {emailid: "amit.singh@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}, userid: {$query: {emailid: "amit.singh@daffodilsw.com"}}},
                            {emailid: "rohit.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}, userid: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}},
                            {emailid: "sachin.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                            {emailid: "kapil.dalal@daffodilsw.com", reporting_to_id: {$query: {emailid: "amit.singh@daffodilsw.com"}}, userid: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}}
                        ]},
                        {$collection: "taskss", $insert: [
                            {task: "Task1", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}, expectedCost: {amount: 200, type: {$query: {currency: "INR"}}}},
                            {task: "Task2", status: "Completed", assigntoid: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, estefforts: {time: 4, unit: "Hrs"}, expectedCost: {amount: 400, type: {$query: {currency: "INR"}}}},
                            {task: "Task3", status: "New", assigntoid: {$query: {emailid: "amit.singh@daffodilsw.com"}}},
                            {task: "Task4", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 5, unit: "Hrs"}, expectedCost: {amount: 1000, type: {$query: {currency: "INR"}}}},
                            {task: "Task5", status: "New", assigntoid: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, expectedCost: {amount: 100, type: {$query: {currency: "INR"}}}},
                            {task: "Task6", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 3, unit: "Hrs"}, expectedCost: {amount: 800, type: {$query: {currency: "INR"}}}}
                        ]}
                    ]);
                }).then(
                function (result) {
                    var query = {
                        $collection: "employeess",
                        $fields: {
                            emailid: 1,
                            backlogs: {
                                $type: {scalar: "count"},
                                $query: {
                                    $collection: "taskss",
                                    $group: {
                                        _id: null,
                                        count: {$sum: 1}
                                    }
                                },
                                $fk: "assigntoid", $parent: "_id"
                            },
                            plantask: {
                                $type: {scalar: "estefforts"},
                                $query: {
                                    $collection: "taskss",
                                    $group: {
                                        _id: null,
                                        estefforts: {$sum: "$estefforts"}
                                    }
                                },
                                $fk: "assigntoid", $parent: "_id"
                            },
                            expectedCost: {
                                $type: {scalar: "expectedCost"},
                                $query: {
                                    $collection: "taskss",
                                    $group: {
                                        _id: null,
                                        expectedCost: {$sum: "$expectedCost"}
                                    }
                                },
                                $fk: "assigntoid", $parent: "_id"
                            }
                        },
                        $filter: {
                            "reporting_to_id.userid": {$function: {"Functions.CurrentUser": {"_id": 1}}}
                        },
                        $recursion: {
                            "reporting_to_id": "_id",
                            $ensure: 1,
                            $rollup: ["backlogs", {"plantask": {time: {$sum: "$time"}, unit: {$first: "$unit"}}}, {"expectedCost": {amount: {$sum: "$amount"}, type: {$first: "$type"}}}, "team", "teamEstHrs"],
                            team: {$sum: 1},
                            teamEstHrs: {$sum: "$plantask.total.time"},
                            $filter: {$or: [
                                {"expectedCost.self.amount": {$gt: 0}},
                                {"expectedCost.self.amount": {$lt: 0}}
                            ]},
                            $ensureFilter: true
                        },
                        $sort: {"emailid": 1}
                    };

                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].emailid).to.eql("rohit.bansal@daffodilsw.com");
                    expect(data.result[0].backlogs.self).to.eql(1);
                    expect(data.result[0].backlogs.children).to.eql(3);
                    expect(data.result[0].backlogs.total).to.eql(4);
                    expect(data.result[0].plantask.self.time).to.eql(4);
                    expect(data.result[0].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[0].plantask.children.time).to.eql(10);
                    expect(data.result[0].plantask.children.unit).to.eql("Hrs");
                    expect(data.result[0].plantask.total.time).to.eql(14);
                    expect(data.result[0].plantask.total.unit).to.eql("Hrs");
                    expect(data.result[0].expectedCost.self.amount).to.eql(400);
                    expect(data.result[0].expectedCost.children.amount).to.eql(2000);
                    expect(data.result[0].expectedCost.total.amount).to.eql(2400);
                    expect(data.result[0].team.self).to.eql(1);
                    expect(data.result[0].team.total).to.eql(1);
                    expect(data.result[0].teamEstHrs.self).to.eql(10);
                    expect(data.result[0].teamEstHrs.total).to.eql(10);
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0].emailid).to.eql("sachin.bansal@daffodilsw.com");
                    expect(data.result[0].children[0].backlogs.self).to.eql(3);
                    expect(data.result[0].children[0].backlogs.children).to.eql(undefined);
                    expect(data.result[0].children[0].backlogs.total).to.eql(3);
                    expect(data.result[0].children[0].plantask.self.time).to.eql(10);
                    expect(data.result[0].children[0].plantask.self.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].plantask.total.time).to.eql(10);
                    expect(data.result[0].children[0].plantask.total.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].expectedCost.self.amount).to.eql(2000);
                    expect(data.result[0].children[0].expectedCost.total.amount).to.eql(2000);
                    expect(data.result[0].children[0].team).to.eql(undefined);
                    expect(data.result[0].children[0].children).to.eql(undefined);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })

        it("Recursion with sort and rollup", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
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
                    return ApplaneDB.connect(Config.URL, Config.DB, OPTIONS);
                }).then(
                function (db1) {
                    db = db1;
                    return db.update([
                        {$collection: "employeess", $insert: [
                            {emailid: "yogesh@daffodilsw.com", userid: {$query: {emailid: "yogesh@daffodilsw.com"}}},
                            {emailid: "amit.singh@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}, userid: {$query: {emailid: "amit.singh@daffodilsw.com"}}},
                            {emailid: "rohit.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}, userid: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}},
                            {emailid: "sachin.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                            {emailid: "kapil.dalal@daffodilsw.com", reporting_to_id: {$query: {emailid: "amit.singh@daffodilsw.com"}}, userid: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}},
                            {emailid: "preeti.gulia@daffodilsw.com", reporting_to_id: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, userid: {$query: {emailid: "preeti.gulia@daffodilsw.com"}}},
                            {emailid: "sushil.kumar@daffodilsw.com", reporting_to_id: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, userid: {$query: {emailid: "sushil.kumar@daffodilsw.com"}}},
                            {emailid: "naveen.singh@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "naveen.singh@daffodilsw.com"}}},
                            {emailid: "manjeet.sanghwan@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}},
                            {emailid: "rajit.kumar@daffodilsw.com", reporting_to_id: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}, userid: {$query: {emailid: "rajit.kumar@daffodilsw.com"}}},
                            {emailid: "ashu@daffodilsw.com", reporting_to_id: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "ashu@daffodilsw.com"}}},
                            {emailid: "sunil@daffodilsw.com", reporting_to_id: {$query: {emailid: "sushil.kumar@daffodilsw.com"}}, userid: {$query: {emailid: "sunil@daffodilsw.com"}}}
                        ]},
                        {$collection: "taskss", $insert: [
                            {task: "Task1", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}, expectedCost: {amount: 2000, type: {$query: {currency: "INR"}}}},
                            {task: "Task2", status: "Completed", assigntoid: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, estefforts: {time: 4, unit: "Hrs"}, expectedCost: {amount: 4000, type: {$query: {currency: "INR"}}}},
                            {task: "Task3", status: "New", assigntoid: {$query: {emailid: "amit.singh@daffodilsw.com"}}},
                            {task: "Task4", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 5, unit: "Hrs"}, expectedCost: {amount: 2000, type: {$query: {currency: "INR"}}}},
                            {task: "Task5", status: "New", assigntoid: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}},
                            {task: "Task6", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 3, unit: "Hrs"}, expectedCost: {amount: 2000, type: {$query: {currency: "INR"}}}},
                            {task: "Task7", status: "Completed", assigntoid: {$query: {emailid: "preeti.gulia@daffodilsw.com"}}, expectedCost: {amount: 700, type: {$query: {currency: "INR"}}}},
                            {task: "Task8", status: "New", assigntoid: {$query: {emailid: "sunil@daffodilsw.com"}}, estefforts: {time: 5, unit: "Hrs"}, expectedCost: {amount: 500, type: {$query: {currency: "INR"}}}},
                            {task: "Task9", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}, expectedCost: {amount: 2000, type: {$query: {currency: "INR"}}}},
                            {task: "Task10", status: "New", assigntoid: {$query: {emailid: "naveen.singh@daffodilsw.com"}}, estefforts: {time: 7, unit: "Hrs"}},
                            {task: "Task11", status: "New", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, estefforts: {time: 3, unit: "Hrs"}, expectedCost: {amount: 2000, type: {$query: {currency: "INR"}}}},
                            {task: "Task12", status: "Completed", assigntoid: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}, expectedCost: {amount: 1500, type: {$query: {currency: "INR"}}}},
                            {task: "Task13", status: "New", assigntoid: {$query: {emailid: "ashu@daffodilsw.com"}}, estefforts: {time: 2, unit: "Hrs"}},
                            {task: "Task14", status: "Completed", assigntoid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, expectedCost: {amount: 2000, type: {$query: {currency: "INR"}}}},
                            {task: "Task15", status: "New", assigntoid: {$query: {emailid: "rajit.kumar@daffodilsw.com"}}}
                        ]}
                    ]);
                }).then(
                function (result) {
                    var query = {
                        $collection: "employeess",
                        $fields: {
                            emailid: 1,
                            expectedCost: {
                                $type: {scalar: "expectedCost"},
                                $query: {
                                    $collection: "taskss",
                                    $group: {
                                        _id: null,
                                        expectedCost: {$sum: "$expectedCost"}
                                    }
                                },
                                $fk: "assigntoid", $parent: "_id"
                            }
                        },
                        $filter: {
                            "reporting_to_id.userid": {$function: {"Functions.CurrentUser": {"_id": 1}}}
                        },
                        $recursion: {
                            "reporting_to_id": "_id",
                            $ensure: 1,
                            $rollup: [
                                {"expectedCost": {amount: {$sum: "$amount"}, type: {$first: "$type"}}}
                            ],
                            $sort: {"expectedCost.total.amount": -1}
                        },
                        $sort: {"emailid": 1}
                    };

                    return db.query(query);
                }).then(
                function (data) {
                    console.log("Data------  " + JSON.stringify(data));
                    expect(data.result).to.have.length(2);

                    expect(data.result[0].emailid).to.eql("rohit.bansal@daffodilsw.com");
                    expect(data.result[0].expectedCost.total.amount).to.eql(17500);
                    expect(data.result[0].children).to.have.length(3);
                    expect(data.result[0].children[0].emailid).to.eql("sachin.bansal@daffodilsw.com");
                    expect(data.result[0].children[0].expectedCost.total.amount).to.eql(12000);
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[0].children[0].emailid).to.eql("ashu@daffodilsw.com");
                    expect(data.result[0].children[0].children[0].expectedCost.total.amount).to.eql(0);
                    expect(data.result[0].children[0].children[0].children).to.have.length(0);
                    expect(data.result[0].children[1].emailid).to.eql("manjeet.sanghwan@daffodilsw.com");
                    expect(data.result[0].children[1].expectedCost.total.amount).to.eql(1500);
                    expect(data.result[0].children[1].children).to.have.length(1);
                    expect(data.result[0].children[1].children[0].emailid).to.eql("rajit.kumar@daffodilsw.com");
                    expect(data.result[0].children[1].children[0].expectedCost.total.amount).to.eql(0);
                    expect(data.result[0].children[1].children[0].children).to.have.length(0);
                    expect(data.result[0].children[2].emailid).to.eql("naveen.singh@daffodilsw.com");
                    expect(data.result[0].children[2].expectedCost.total.amount).to.eql(0);
                    expect(data.result[0].children[2].children).to.have.length(0);

                    expect(data.result[1].emailid).to.eql("amit.singh@daffodilsw.com");
                    expect(data.result[1].expectedCost.total.amount).to.eql(1200);
                    expect(data.result[1].children).to.have.length(1);
                    expect(data.result[1].children[0].emailid).to.eql("kapil.dalal@daffodilsw.com");
                    expect(data.result[1].children[0].expectedCost.total.amount).to.eql(1200);
                    expect(data.result[1].children[0].children).to.have.length(2);


                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })

        it("Recursion with GroupBy and subQuery and rollup", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.update([
                        {$collection: "pl.collections", $insert: [
                            {collection: "projects"},
                            {collection: "tasks"},
                            {collection: "employees"},
                            {collection: "businessfunctions"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", "collectionid": {$query: {collection: "projects"}}},
                            {field: "name", type: "string", "collectionid": {$query: {collection: "businessfunctions"}}},
                            {field: "name", type: "string", "collectionid": {$query: {collection: "employees"}}},
                            {field: "parent_goals", type: "fk", collection: "projects", set: ["name"], "collectionid": {$query: {collection: "projects"}}},
                            {field: "projectowner", type: "fk", collection: "employees", set: ["name"], "collectionid": {$query: {collection: "projects"}}},
                            {field: "plan_tasks", type: "duration", "collectionid": {$query: {collection: "projects"}}},
                            {field: "businessfunctionid", type: "fk", collection: "businessfunctions", set: ["name"], "collectionid": {$query: {collection: "projects"}}},
                            {field: "goal", type: "fk", collection: "projects", set: ["name"], "collectionid": {$query: {collection: "tasks"}}},
                            {field: "task_owner", type: "object", multiple: true, "collectionid": {$query: {collection: "tasks"}}},
                            {field: "estimatedhrs", type: "duration", "collectionid": {$query: {collection: "tasks"}}, parentfieldid: {$query: {field: "task_owner", collectionid: {$query: {collection: "tasks"}}}}}
                        ]}
                    ]);
                }).then(
                function () {
                    return db.update([
                        {$collection: "businessfunctions", $insert: [
                            {name: "Delivery"},
                            {name: "Accounts"}
                        ]},
                        {$collection: "employees", $insert: [
                            {name: "Amit Singh"},
                            {name: "Sachin"},
                            {name: "Rohit"}
                        ]},
                        {$collection: "projects", $insert: [
                            {_id: 1, name: "DARCL HR", "businessfunctionid": {$query: {name: "Delivery"}}, projectowner: {$query: {name: "Amit Singh"}}},
                            {_id: 2, name: "College ERP", "businessfunctionid": {$query: {name: "Delivery"}}, projectowner: {$query: {name: "Sachin"}}},
                            {_id: 3, name: "Delivery", "businessfunctionid": {$query: {name: "Delivery"}}, projectowner: {$query: {name: "Sachin"}}},
                            {_id: 4, name: "Tax Deposit", "businessfunctionid": {$query: {name: "Accounts"}}, projectowner: {$query: {name: "Amit Singh"}}},
                            {_id: 5, name: "LWF Deposit", "businessfunctionid": {$query: {name: "Accounts"}}, projectowner: {$query: {name: "Rohit"}}, parent_goals: {$query: {name: "Tax Deposit"}}},
                            {_id: 6, name: "ESI Deposit", "businessfunctionid": {$query: {name: "Accounts"}}, projectowner: {$query: {name: "Sachin"}}, parent_goals: {$query: {name: "Tax Deposit"}}}
                        ]},
                        {$collection: "tasks", $insert: [
                            {task: "Task1", goal: {$query: {name: "Delivery"}}, status: "New"},
                            {task: "Task2", goal: {$query: {name: "Delivery"}}, status: "Work In Progress", task_owner: [
                                {estimatedhrs: {time: 2, unit: "Hrs"}},
                                {estimatedhrs: {time: 5, unit: "Hrs"}}
                            ]},
                            {task: "Task3", goal: {$query: {name: "Delivery"}}, status: "New", task_owner: [
                                {estimatedhrs: {time: 4, unit: "Hrs"}},
                                {estimatedhrs: {time: 6, unit: "Hrs"}}
                            ]},
                            {task: "Task4", goal: {$query: {name: "Tax Deposit"}}, status: "New"},
                            {task: "Task5", goal: {$query: {name: "LWF Deposit"}}, status: "Work In Progress", task_owner: [
                                {estimatedhrs: {time: 4, unit: "Hrs"}},
                                {estimatedhrs: {time: 2, unit: "Hrs"}}
                            ]},
                            {task: "Task6", goal: {$query: {name: "ESI Deposit"}}, status: "New"},
                            {task: "Task7", goal: {$query: {name: "ESI Deposit"}}, status: "New"},
                            {task: "Task8", goal: {$query: {name: "DARCL HR"}}, status: "Work In Progress", task_owner: [
                                {estimatedhrs: {time: 3, unit: "Hrs"}},
                                {estimatedhrs: {time: 7, unit: "Hrs"}}
                            ]}

                        ]}
                    ]);
                }).then(
                function (result) {
                    var query = {
                        $collection: "projects",
                        "$group": {
                            "_id": [
                                {"businessfunctionid": "$businessfunctionid"}
                            ], "businessfunctionid": {"$first": "$businessfunctionid.name"},
                            "count": {"$sum": 1}
                        },
                        $fields: {
                            "plan_tasks": {
                                "$query": {
                                    "$collection": "tasks",
                                    "$group": {
                                        "_id": null,
                                        "count": {"$sum": "$task_owner.estimatedhrs"}
                                    },
                                    "$filter": {
                                        "status": {"$in": ["New", "Work In Progress"]}
                                    }, "$unwind": ["task_owner"]
                                },
                                "$fk": "goal",
                                "$type": {"scalar": "count"}
                            },
                            "name": 1,
                            "backlog": {
                                "$query": {
                                    "$collection": "tasks",
                                    "$filter": {
                                        "status": {"$in": ["New", "Work In Progress"]}
                                    },
                                    "$group": {
                                        "_id": null,
                                        "count": {"$sum": 1}
                                    }
                                }, "$fk": "goal",
                                "$type": {"scalar": "count"}
                            },
                            "projectowner": 1,
                            "businessfunctionid": 1
                        },
                        $filter: {"parent_goals": null},
                        $recursion: {
                            "parent_goals": "_id",
                            "$primaryColumn": "name",
                            "$rollup": [
                                "backlog",
                                {"plan_tasks": {"time": {"$sum": "$time"}, "unit": {"$first": "unit"}}}
                            ]
                        },
                        $sort: {"name": 1}
                    };

                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].businessfunctionid).to.eql("Accounts");
                    expect(data.result[0].backlog).to.eql(4);
                    expect(data.result[0].plan_tasks.time).to.eql(6);
                    expect(data.result[0].plan_tasks.unit).to.eql("Hrs");
                    expect(data.result[0].count).to.eql(1);
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0].name).to.eql("Tax Deposit");
                    expect(data.result[0].children[0].projectowner.name).to.eql("Amit Singh");
                    expect(data.result[0].children[0].children).to.have.length(2);
                    expect(data.result[0].children[0].children[0].name).to.eql("ESI Deposit");
                    expect(data.result[0].children[0].children[0].projectowner.name).to.eql("Sachin");
                    expect(data.result[0].children[0].children[0].backlog.self).to.eql(2);
                    expect(data.result[0].children[0].children[0].backlog.total).to.eql(2);
                    expect(data.result[0].children[0].children[1].name).to.eql("LWF Deposit");
                    expect(data.result[0].children[0].children[1].projectowner.name).to.eql("Rohit");
                    expect(data.result[0].children[0].children[1].backlog.self).to.eql(1);
                    expect(data.result[0].children[0].children[1].backlog.total).to.eql(1);
                    expect(data.result[0].children[0].children[1].plan_tasks.self.time).to.eql(6);
                    expect(data.result[0].children[0].children[1].plan_tasks.self.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].children[1].plan_tasks.total.time).to.eql(6);
                    expect(data.result[0].children[0].children[1].plan_tasks.total.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].backlog.self).to.eql(1);
                    expect(data.result[0].children[0].backlog.total).to.eql(4);
                    expect(data.result[0].children[0].backlog.children).to.eql(3);
                    expect(data.result[0].children[0].plan_tasks.children.time).to.eql(6);
                    expect(data.result[0].children[0].plan_tasks.children.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].plan_tasks.total.time).to.eql(6);
                    expect(data.result[0].children[0].plan_tasks.total.unit).to.eql("Hrs");


                    expect(data.result[1].businessfunctionid).to.eql("Delivery");
                    expect(data.result[1].backlog).to.eql(4);
                    expect(data.result[1].plan_tasks.time).to.eql(27);
                    expect(data.result[1].plan_tasks.unit).to.eql("Hrs");
                    expect(data.result[1].count).to.eql(3);
                    expect(data.result[1].children).to.have.length(3);
                    expect(data.result[1].children[0].name).to.eql("College ERP");
                    expect(data.result[1].children[0].projectowner.name).to.eql("Sachin");
                    expect(data.result[1].children[1].name).to.eql("DARCL HR");
                    expect(data.result[1].children[1].projectowner.name).to.eql("Amit Singh");
                    expect(data.result[1].children[1].backlog.self).to.eql(1);
                    expect(data.result[1].children[1].backlog.total).to.eql(1);
                    expect(data.result[1].children[1].plan_tasks.self.time).to.eql(10);
                    expect(data.result[1].children[1].plan_tasks.self.unit).to.eql("Hrs");
                    expect(data.result[1].children[1].plan_tasks.total.time).to.eql(10);
                    expect(data.result[1].children[1].plan_tasks.total.unit).to.eql("Hrs");
                    expect(data.result[1].children[2].name).to.eql("Delivery");
                    expect(data.result[1].children[2].projectowner.name).to.eql("Sachin");
                    expect(data.result[1].children[2].backlog.self).to.eql(3);
                    expect(data.result[1].children[2].backlog.total).to.eql(3);
                    expect(data.result[1].children[2].plan_tasks.self.time).to.eql(17);
                    expect(data.result[1].children[2].plan_tasks.self.unit).to.eql("Hrs");
                    expect(data.result[1].children[2].plan_tasks.total.time).to.eql(17);
                    expect(data.result[1].children[2].plan_tasks.total.unit).to.eql("Hrs");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })

        it("Recursion with Two level GroupBy and subQuery and rollup", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.update([
                        {$collection: "pl.collections", $insert: [
                            {collection: "projects"},
                            {collection: "tasks"},
                            {collection: "employees"},
                            {collection: "businessfunctions"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", "collectionid": {$query: {collection: "projects"}}},
                            {field: "name", type: "string", "collectionid": {$query: {collection: "businessfunctions"}}},
                            {field: "name", type: "string", "collectionid": {$query: {collection: "employees"}}},
                            {field: "parent_goals", type: "fk", collection: "projects", set: ["name"], "collectionid": {$query: {collection: "projects"}}},
                            {field: "projectowner", type: "fk", collection: "employees", set: ["name"], "collectionid": {$query: {collection: "projects"}}},
                            {field: "plan_tasks", type: "duration", "collectionid": {$query: {collection: "projects"}}},
                            {field: "businessfunctionid", type: "fk", collection: "businessfunctions", set: ["name"], "collectionid": {$query: {collection: "projects"}}},
                            {field: "goal", type: "fk", collection: "projects", set: ["name"], "collectionid": {$query: {collection: "tasks"}}},
                            {field: "task_owner", type: "object", multiple: true, "collectionid": {$query: {collection: "tasks"}}},
                            {field: "estimatedhrs", type: "duration", "collectionid": {$query: {collection: "tasks"}}, parentfieldid: {$query: {field: "task_owner", collectionid: {$query: {collection: "tasks"}}}}}
                        ]}
                    ]);
                }).then(
                function () {
                    return db.update([
                        {$collection: "businessfunctions", $insert: [
                            {name: "Delivery"},
                            {name: "Accounts"}
                        ]},
                        {$collection: "employees", $insert: [
                            {name: "Amit Singh"},
                            {name: "Sachin"},
                            {name: "Rohit"}
                        ]},
                        {$collection: "projects", $insert: [
                            {_id: 1, name: "DARCL HR", "businessfunctionid": {$query: {name: "Delivery"}}, projectowner: {$query: {name: "Amit Singh"}}, status: "New"},
                            {_id: 2, name: "College ERP", "businessfunctionid": {$query: {name: "Delivery"}}, projectowner: {$query: {name: "Sachin"}}, status: "New"},
                            {_id: 3, name: "Delivery", "businessfunctionid": {$query: {name: "Delivery"}}, projectowner: {$query: {name: "Sachin"}}, status: "Latest"},
                            {_id: 4, name: "Tax Deposit", "businessfunctionid": {$query: {name: "Accounts"}}, projectowner: {$query: {name: "Amit Singh"}}, status: "New"},
                            {_id: 5, name: "LWF Deposit", "businessfunctionid": {$query: {name: "Accounts"}}, projectowner: {$query: {name: "Rohit"}}, parent_goals: {$query: {name: "Tax Deposit"}}, status: "Latest"},
                            {_id: 6, name: "ESI Deposit", "businessfunctionid": {$query: {name: "Accounts"}}, projectowner: {$query: {name: "Sachin"}}, parent_goals: {$query: {name: "Tax Deposit"}}, status: "Done"}
                        ]},
                        {$collection: "tasks", $insert: [
                            {task: "Task1", goal: {$query: {name: "Delivery"}}, status: "New"},
                            {task: "Task2", goal: {$query: {name: "Delivery"}}, status: "Work In Progress", task_owner: [
                                {estimatedhrs: {time: 2, unit: "Hrs"}},
                                {estimatedhrs: {time: 5, unit: "Hrs"}}
                            ]},
                            {task: "Task3", goal: {$query: {name: "Delivery"}}, status: "New", task_owner: [
                                {estimatedhrs: {time: 4, unit: "Hrs"}},
                                {estimatedhrs: {time: 6, unit: "Hrs"}}
                            ]},
                            {task: "Task4", goal: {$query: {name: "Tax Deposit"}}, status: "New"},
                            {task: "Task5", goal: {$query: {name: "LWF Deposit"}}, status: "Work In Progress", task_owner: [
                                {estimatedhrs: {time: 4, unit: "Hrs"}},
                                {estimatedhrs: {time: 2, unit: "Hrs"}}
                            ]},
                            {task: "Task6", goal: {$query: {name: "ESI Deposit"}}, status: "New"},
                            {task: "Task7", goal: {$query: {name: "ESI Deposit"}}, status: "New"},
                            {task: "Task8", goal: {$query: {name: "DARCL HR"}}, status: "Work In Progress", task_owner: [
                                {estimatedhrs: {time: 3, unit: "Hrs"}},
                                {estimatedhrs: {time: 7, unit: "Hrs"}}
                            ]}

                        ]}
                    ]);
                }).then(
                function (result) {
                    var query = {
                        $collection: "projects",
                        "$group": {
                            "_id": [
                                {"businessfunctionid": "$businessfunctionid"},
                                {"status": "$status"}
                            ],
                            "businessfunctionid": {"$first": "$businessfunctionid.name"},
                            "status": {"$first": "$status"},
                            "count": {"$sum": 1},
                            $sort: {"businessfunctionid": 1, status: 1}
                        },
                        $fields: {
                            "plan_tasks": {
                                "$query": {
                                    "$collection": "tasks",
                                    "$group": {
                                        "_id": null,
                                        "count": {"$sum": "$task_owner.estimatedhrs"}
                                    },
                                    "$filter": {
                                        "status": {"$in": ["New", "Work In Progress"]}
                                    }, "$unwind": ["task_owner"]
                                },
                                "$fk": "goal",
                                "$type": {"scalar": "count"}
                            },
                            "name": 1,
                            "backlog": {
                                "$query": {
                                    "$collection": "tasks",
                                    "$filter": {
                                        "status": {"$in": ["New", "Work In Progress"]}
                                    },
                                    "$group": {
                                        "_id": null,
                                        "count": {"$sum": 1}
                                    }
                                }, "$fk": "goal",
                                "$type": {"scalar": "count"}
                            },
                            "projectowner": 1,
                            "businessfunctionid": 1
                        },
                        $filter: {"parent_goals": null},
                        $recursion: {
                            "parent_goals": "_id",
                            "$primaryColumn": "name",
                            "$rollup": [
                                "backlog",
                                {"plan_tasks": {"time": {"$sum": "$time"}, "unit": {"$first": "unit"}}}
                            ],
                            $sort: {name: 1}
                        },
                        $sort: {"businessfunctionid": 1, status: 1, name: 1}
                    };

                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].businessfunctionid).to.eql("Accounts");
                    expect(data.result[0].backlog).to.eql(4);
                    expect(data.result[0].plan_tasks.time).to.eql(6);
                    expect(data.result[0].plan_tasks.unit).to.eql("Hrs");
                    expect(data.result[0].count).to.eql(1);
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0].status).to.eql("New");
                    expect(data.result[0].children[0].backlog).to.eql(4);
                    expect(data.result[0].children[0].plan_tasks.time).to.eql(6);
                    expect(data.result[0].children[0].plan_tasks.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].count).to.eql(1);
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[0].children[0].name).to.eql("Tax Deposit");
                    expect(data.result[0].children[0].children[0].projectowner.name).to.eql("Amit Singh");
                    expect(data.result[0].children[0].children[0].children).to.have.length(2);
                    expect(data.result[0].children[0].children[0].children[0].name).to.eql("ESI Deposit");
                    expect(data.result[0].children[0].children[0].children[0].projectowner.name).to.eql("Sachin");
                    expect(data.result[0].children[0].children[0].children[0].backlog.self).to.eql(2);
                    expect(data.result[0].children[0].children[0].children[0].backlog.total).to.eql(2);
                    expect(data.result[0].children[0].children[0].children[1].name).to.eql("LWF Deposit");
                    expect(data.result[0].children[0].children[0].children[1].projectowner.name).to.eql("Rohit");
                    expect(data.result[0].children[0].children[0].children[1].backlog.self).to.eql(1);
                    expect(data.result[0].children[0].children[0].children[1].backlog.total).to.eql(1);
                    expect(data.result[0].children[0].children[0].children[1].plan_tasks.self.time).to.eql(6);
                    expect(data.result[0].children[0].children[0].children[1].plan_tasks.self.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].children[0].children[1].plan_tasks.total.time).to.eql(6);
                    expect(data.result[0].children[0].children[0].children[1].plan_tasks.total.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].children[0].backlog.self).to.eql(1);
                    expect(data.result[0].children[0].children[0].backlog.total).to.eql(4);
                    expect(data.result[0].children[0].children[0].backlog.children).to.eql(3);
                    expect(data.result[0].children[0].children[0].plan_tasks.children.time).to.eql(6);
                    expect(data.result[0].children[0].children[0].plan_tasks.children.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].children[0].plan_tasks.total.time).to.eql(6);
                    expect(data.result[0].children[0].children[0].plan_tasks.total.unit).to.eql("Hrs");

                    expect(data.result[1].businessfunctionid).to.eql("Delivery");
                    expect(data.result[1].backlog).to.eql(4);
                    expect(data.result[1].plan_tasks.time).to.eql(27);
                    expect(data.result[1].plan_tasks.unit).to.eql("Hrs");
                    expect(data.result[1].count).to.eql(3);
                    expect(data.result[1].children).to.have.length(2);

                    expect(data.result[1].children[0].status).to.eql("Latest");
                    expect(data.result[1].children[0].backlog).to.eql(3);
                    expect(data.result[1].children[0].plan_tasks.time).to.eql(17);
                    expect(data.result[1].children[0].plan_tasks.unit).to.eql("Hrs");
                    expect(data.result[1].children[0].count).to.eql(1);
                    expect(data.result[1].children[0].children).to.have.length(1);
                    expect(data.result[1].children[0].children[0].name).to.eql("Delivery");
                    expect(data.result[1].children[0].children[0].projectowner.name).to.eql("Sachin");
                    expect(data.result[1].children[0].children[0].backlog.self).to.eql(3);
                    expect(data.result[1].children[0].children[0].backlog.total).to.eql(3);
                    expect(data.result[1].children[0].children[0].plan_tasks.self.time).to.eql(17);
                    expect(data.result[1].children[0].children[0].plan_tasks.self.unit).to.eql("Hrs");
                    expect(data.result[1].children[0].children[0].plan_tasks.total.time).to.eql(17);
                    expect(data.result[1].children[0].children[0].plan_tasks.total.unit).to.eql("Hrs");

                    expect(data.result[1].children[1].status).to.eql("New");
                    expect(data.result[1].children[1].backlog).to.eql(1);
                    expect(data.result[1].children[1].plan_tasks.time).to.eql(10);
                    expect(data.result[1].children[1].plan_tasks.unit).to.eql("Hrs");
                    expect(data.result[1].children[1].count).to.eql(2);
                    expect(data.result[1].children[1].children).to.have.length(2);
                    expect(data.result[1].children[1].children[0].name).to.eql("College ERP");
                    expect(data.result[1].children[1].children[0].projectowner.name).to.eql("Sachin");
                    expect(data.result[1].children[1].children[1].name).to.eql("DARCL HR");
                    expect(data.result[1].children[1].children[1].projectowner.name).to.eql("Amit Singh");
                    expect(data.result[1].children[1].children[1].backlog.self).to.eql(1);
                    expect(data.result[1].children[1].children[1].backlog.total).to.eql(1);
                    expect(data.result[1].children[1].children[1].plan_tasks.self.time).to.eql(10);
                    expect(data.result[1].children[1].children[1].plan_tasks.self.unit).to.eql("Hrs");
                    expect(data.result[1].children[1].children[1].plan_tasks.total.time).to.eql(10);
                    expect(data.result[1].children[1].children[1].plan_tasks.total.unit).to.eql("Hrs");

                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })

        it("Self Recursive data test for SelfRecursion Module", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.update([
                        {$collection: "pl.users", $insert: [
                            {username: "Yogesh", password: "yogesh", emailid: "yogesh@daffodilsw.com"},
                            {username: "Rohit", password: "rohit", emailid: "rohit.bansal@daffodilsw.com"},
                            {username: "Sachin", password: "sachin", emailid: "sachin.bansal@daffodilsw.com"},
                            {username: "Ashu", password: "amit", emailid: "ashu@daffodilsw.com"}
                        ]}
                    ]);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, OPTIONS);
                }).then(
                function (db1) {
                    db = db1;
                    return db.update([
                        {$collection: "employeess", $insert: [
                            {emailid: "yogesh@daffodilsw.com", userid: {$query: {emailid: "yogesh@daffodilsw.com"}}},
                            {emailid: "rohit.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}, userid: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}},
                            {emailid: "sachin.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                            {emailid: "ashu@daffodilsw.com", reporting_to_id: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "ashu@daffodilsw.com"}}}
                        ]}
                    ]);
                }).then(
                function () {
                    return db.query({$collection: "employeess", $filter: {emailid: "sachin.bansal@daffodilsw.com"}});
                }).then(
                function (result) {
                    return db.update({$collection: "employeess", $update: {_id: result.result[0]._id, $unset: {reporting_to_id: ""}}});
                }).then(
                function () {
                    return db.query({$collection: "employeess", $filter: {emailid: "sachin.bansal@daffodilsw.com"}});
                }).then(
                function (result) {
                    return db.update({$collection: "employeess", $update: {_id: result.result[0]._id, $set: {reporting_to_id: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}}}}).fail(function (err) {
                        if (err.toString().indexOf("Self reference can not be defined in field") > 0) {
                            return;
                        } else {
                            throw err;
                        }
                    })
                }).then(
                function () {
                    return db.query({$collection: "employeess", $filter: {emailid: "sachin.bansal@daffodilsw.com"}});
                }).then(
                function (result) {
                    return db.update({$collection: "employeess", $update: {_id: result.result[0]._id, $set: {reporting_to_id: {$query: {emailid: "ashu@daffodilsw.com"}}}}}).fail(function (err) {
                        if (err.toString().indexOf("Recursion found in saving data") > 0) {
                            return;
                        } else {
                            throw err;
                        }
                    })
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })

        it("Recursive With rootFilter false", function (done) {
            var db = undefined;
            var amitDB = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    return db.update([
                        {$collection: "pl.collections", $insert: [
                            {collection: "projects"},
                            {collection: "tasks"}
                        ]} ,
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "parent", type: "fk", collectionid: {$query: {collection: "projects"}}, set: ["name"], collection: "projects"},
                            {field: "ownerid", type: "fk", collectionid: {$query: {collection: "projects"}}, set: ["username", "emailid"], collection: "pl.users"},
                            {field: "task", type: "string", collectionid: {$query: {collection: "tasks"}}},
                            {field: "projectid", type: "fk", collectionid: {$query: {collection: "tasks"}}, set: ["name"], collection: "projects"}
                        ]}
                    ]);
                }).then(
                function () {
                    return db.update([
                        {$collection: "pl.users", $insert: [
                            {username: "Amit.Singh", password: "amit", emailid: "amit.singh@daffodilsw.com"},
                            {username: "Rohit", password: "rohit", emailid: "rohit.bansal@daffodilsw.com"}
                        ]},
                        {$collection: "projects", $insert: [
                            {name: "node_services", status: "Inactive", ownerid: {"$query": {username: "Rohit"}}},
                            {name: "AFE", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "node_services"}}},
                            {name: "Meteor", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}},
                            {name: "girnar", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "AFE"}}},
                            {name: "finance", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "girnar"}}},
                            {name: "AFB", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}},
                            {name: "TruckApp", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "Meteor"}}},
                            {name: "hr", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "girnar"}}}
                        ]},
                        {$collection: "tasks", $insert: [
                            {task: "t1", projectid: {$query: {name: "girnar"}}},
                            {task: "t2", projectid: {$query: {name: "girnar"}}},
                            {task: "t3", projectid: {$query: {name: "girnar"}}},
                            {task: "t4", projectid: {$query: {name: "girnar"}}},
                            {task: "t5", projectid: {$query: {name: "girnar"}}},
                            {task: "t6", projectid: {$query: {name: "girnar"}}},
                            {task: "t7", projectid: {$query: {name: "hr"}}},
                            {task: "t8", projectid: {$query: {name: "hr"}}},
                            {task: "t9", projectid: {$query: {name: "hr"}}},
                            {task: "t11", projectid: {$query: {name: "finance"}}},
                            {task: "t12", projectid: {$query: {name: "finance"}}},
                            {task: "t13", projectid: {$query: {name: "AFB"}}},
                            {task: "t14", projectid: {$query: {name: "AFB"}}},
                            {task: "t15", projectid: {$query: {name: "Meteor"}}},
                            {task: "t16", projectid: {$query: {name: "hr"}}},
                            {task: "t17", projectid: {$query: {name: "TruckApp"}}},
                            {task: "t18", projectid: {$query: {name: "TruckApp"}}},
                            {task: "t19", projectid: {$query: {name: "TruckApp"}}},
                            {task: "t111", projectid: {$query: {name: "girnar"}}}
                        ]}
                    ]);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Amit.Singh", password: "amit"});
                }).then(
                function (db1) {
                    amitDB = db1;
                }).then(
                function () {
                    var query = {
                        $collection: "projects",
                        $fields: {
                            name: 1,
//                        parent:1,
                            count: {
                                $type: {scalar: "count"},
                                $query: {$collection: "tasks", $group: {_id: null, count: {$sum: 1}}},
                                $fk: "projectid"
                            }
                        },
                        $filter: {
                            ownerid: "$$CurrentUser"
                        },
                        $recursion: {
                            parent: "_id",
                            $rootFilter: false
                        },
                        $sort: {"name": 1}
                    };
                    return amitDB.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(3);
                    expect(data.result[0].name).to.eql("AFB");
                    expect(data.result[0].count).to.eql(2);

                    expect(data.result[1].name).to.eql("AFE");
                    expect(data.result[1].count).to.eql(undefined);
                    expect(data.result[1].children).to.have.length(1);
                    expect(data.result[1].children[0].name).to.eql("girnar");
                    expect(data.result[1].children[0].count).to.eql(7);
                    expect(data.result[1].children[0].children).to.have.length(2);
                    expect(data.result[1].children[0].children[0].name).to.eql("finance");
                    expect(data.result[1].children[0].children[0].count).to.eql(2);
                    expect(data.result[1].children[0].children[1].name).to.eql("hr");
                    expect(data.result[1].children[0].children[1].count).to.eql(4);

                    expect(data.result[2].name).to.eql("Meteor");
                    expect(data.result[2].count).to.eql(1);
                    expect(data.result[2].children).to.have.length(1);
                    expect(data.result[2].children[0].name).to.eql("TruckApp");
                    expect(data.result[2].children[0].count).to.eql(3);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })

        it("Recursive With rootFilter false and recursion on multiple field", function (done) {
            var db = undefined;
            var amitDB = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    return db.update([
                        {$collection: "pl.collections", $insert: [
                            {collection: "projects"},
                            {collection: "tasks"}
                        ]} ,
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "parent", type: "fk", collectionid: {$query: {collection: "projects"}}, set: ["name"], collection: "projects", multiple: true},
                            {field: "ownerid", type: "fk", collectionid: {$query: {collection: "projects"}}, set: ["username", "emailid"], collection: "pl.users"},
                            {field: "task", type: "string", collectionid: {$query: {collection: "tasks"}}},
                            {field: "projectid", type: "fk", collectionid: {$query: {collection: "tasks"}}, set: ["name"], collection: "projects"}
                        ]}
                    ]);
                }).then(
                function () {
                    return db.update([
                        {$collection: "pl.users", $insert: [
                            {username: "Amit.Singh", password: "amit", emailid: "amit.singh@daffodilsw.com"},
                            {username: "Rohit", password: "rohit", emailid: "rohit.bansal@daffodilsw.com"}
                        ]},
                        {$collection: "projects", $insert: [
                            {name: "node_services", status: "Inactive", ownerid: {"$query": {username: "Rohit"}}},
                            {name: "AFE", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: [
                                {$query: {name: "node_services"}}
                            ]},
                            {name: "Meteor", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}},
                            {name: "girnar", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: [
                                {$query: {name: "AFE"}}
                            ]},
                            {name: "finance", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: [
                                {$query: {name: "girnar"}}
                            ]},
                            {name: "AFB", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}},
                            {name: "TruckApp", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: [{$query: {name: "Meteor"}},{$query: {name: "AFE"}}]},
                            {name: "hr", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: [{$query: {name: "girnar"}}]}
                            ]},
                        {$collection: "tasks", $insert: [
                            {task: "t1", projectid: {$query: {name: "girnar"}}},
                            {task: "t2", projectid: {$query: {name: "girnar"}}},
                            {task: "t3", projectid: {$query: {name: "girnar"}}},
                            {task: "t4", projectid: {$query: {name: "girnar"}}},
                            {task: "t5", projectid: {$query: {name: "girnar"}}},
                            {task: "t6", projectid: {$query: {name: "girnar"}}},
                            {task: "t7", projectid: {$query: {name: "hr"}}},
                            {task: "t8", projectid: {$query: {name: "hr"}}},
                            {task: "t9", projectid: {$query: {name: "hr"}}},
                            {task: "t11", projectid: {$query: {name: "finance"}}},
                            {task: "t12", projectid: {$query: {name: "finance"}}},
                            {task: "t13", projectid: {$query: {name: "AFB"}}},
                            {task: "t14", projectid: {$query: {name: "AFB"}}},
                            {task: "t15", projectid: {$query: {name: "Meteor"}}},
                            {task: "t16", projectid: {$query: {name: "hr"}}},
                            {task: "t17", projectid: {$query: {name: "TruckApp"}}},
                            {task: "t18", projectid: {$query: {name: "TruckApp"}}},
                            {task: "t19", projectid: {$query: {name: "TruckApp"}}},
                            {task: "t111", projectid: {$query: {name: "girnar"}}}
                        ]}
                    ]);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Amit.Singh", password: "amit"});
                }).then(
                function (db1) {
                    amitDB = db1;
                }).then(
                function () {
                    var query = {
                        $collection: "projects",
                        $fields: {
                            name: 1,
//                        parent:1,
                            count: {
                                $type: {scalar: "count"},
                                $query: {$collection: "tasks", $group: {_id: null, count: {$sum: 1}}},
                                $fk: "projectid"
                            }
                        },
                        $filter: {
                            ownerid: "$$CurrentUser"
                        },
                        $recursion: {
                            parent: "_id",
                            $rootFilter: false
                        },
                        $sort: {"name": 1}
                    };
                    return amitDB.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(3);
                    expect(data.result[0].name).to.eql("AFB");
                    expect(data.result[0].count).to.eql(2);

                    expect(data.result[1].name).to.eql("AFE");
                    expect(data.result[1].count).to.eql(undefined);
                    expect(data.result[1].children).to.have.length(2);
                    expect(data.result[1].children[0].name).to.eql("TruckApp");
                    expect(data.result[1].children[0].count).to.eql(3);
                    expect(data.result[1].children[1].name).to.eql("girnar");
                    expect(data.result[1].children[1].count).to.eql(7);
                    expect(data.result[1].children[1].children).to.have.length(2);
                    expect(data.result[1].children[1].children[0].name).to.eql("finance");
                    expect(data.result[1].children[1].children[0].count).to.eql(2);
                    expect(data.result[1].children[1].children[1].name).to.eql("hr");
                    expect(data.result[1].children[1].children[1].count).to.eql(4);

                    expect(data.result[2].name).to.eql("Meteor");
                    expect(data.result[2].count).to.eql(1);
                    expect(data.result[2].children).to.have.length(1);
                    expect(data.result[2].children[0].name).to.eql("TruckApp");
                    expect(data.result[2].children[0].count).to.eql(3);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })

        it("Recursive With rootFilter false and rollup", function (done) {
            var db = undefined;
            var amitDB = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    return db.update([
                        {$collection: "pl.collections", $insert: [
                            {collection: "projects"},
                            {collection: "tasks"}
                        ]} ,
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "parent", type: "fk", collectionid: {$query: {collection: "projects"}}, set: ["name"], collection: "projects"},
                            {field: "ownerid", type: "fk", collectionid: {$query: {collection: "projects"}}, set: ["username", "emailid"], collection: "pl.users"},
                            {field: "task", type: "string", collectionid: {$query: {collection: "tasks"}}},
                            {field: "projectid", type: "fk", collectionid: {$query: {collection: "tasks"}}, set: ["name"], collection: "projects"}
                        ]}
                    ]);
                }).then(
                function () {
                    return db.update([
                        {$collection: "pl.users", $insert: [
                            {username: "Amit.Singh", password: "amit", emailid: "amit.singh@daffodilsw.com"},
                            {username: "Rohit", password: "rohit", emailid: "rohit.bansal@daffodilsw.com"}
                        ]},
                        {$collection: "projects", $insert: [
                            {name: "node_services", status: "Inactive", ownerid: {"$query": {username: "Rohit"}}},
                            {name: "AFE", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "node_services"}}},
                            {name: "Meteor", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}},
                            {name: "girnar", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "AFE"}}},
                            {name: "finance", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "girnar"}}},
                            {name: "AFB", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}},
                            {name: "TruckApp", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "Meteor"}}},
                            {name: "hr", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "girnar"}}}
                        ]},
                        {$collection: "tasks", $insert: [
                            {task: "t1", projectid: {$query: {name: "girnar"}}},
                            {task: "t2", projectid: {$query: {name: "girnar"}}},
                            {task: "t3", projectid: {$query: {name: "girnar"}}},
                            {task: "t4", projectid: {$query: {name: "girnar"}}},
                            {task: "t5", projectid: {$query: {name: "girnar"}}},
                            {task: "t6", projectid: {$query: {name: "girnar"}}},
                            {task: "t7", projectid: {$query: {name: "hr"}}},
                            {task: "t8", projectid: {$query: {name: "hr"}}},
                            {task: "t9", projectid: {$query: {name: "hr"}}},
                            {task: "t11", projectid: {$query: {name: "finance"}}},
                            {task: "t12", projectid: {$query: {name: "finance"}}},
                            {task: "t13", projectid: {$query: {name: "AFB"}}},
                            {task: "t14", projectid: {$query: {name: "AFB"}}},
                            {task: "t15", projectid: {$query: {name: "Meteor"}}},
                            {task: "t16", projectid: {$query: {name: "hr"}}},
                            {task: "t17", projectid: {$query: {name: "TruckApp"}}},
                            {task: "t18", projectid: {$query: {name: "TruckApp"}}},
                            {task: "t19", projectid: {$query: {name: "TruckApp"}}},
                            {task: "t111", projectid: {$query: {name: "girnar"}}}
                        ]}
                    ]);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Amit.Singh", password: "amit"});
                }).then(
                function (db1) {
                    amitDB = db1;
                }).then(
                function () {
                    var query = {
                        $collection: "projects",
                        $fields: {
                            name: 1,
//                        parent:1,
                            count: {
                                $type: {scalar: "count"},
                                $query: {$collection: "tasks", $group: {_id: null, count: {$sum: 1}}},
                                $fk: "projectid"
                            }
                        },
                        $filter: {
                            ownerid: "$$CurrentUser"
                        },
                        $recursion: {
                            parent: "_id",
                            $rootFilter: false,
                            $rollup: ["count"]

                        },
                        $sort: {"name": 1}
                    };
                    return amitDB.query(query);
                }).then(
                function (data) {
                    console.log("data>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(3);
                    expect(data.result[0].name).to.eql("AFB");
                    expect(data.result[0].count.self).to.eql(2);
                    expect(data.result[0].count.total).to.eql(2);

                    expect(data.result[1].name).to.eql("AFE");
                    expect(data.result[1].count.self).to.eql(undefined);
                    expect(data.result[1].count.total).to.eql(13);
                    expect(data.result[1].count.children).to.eql(13);
                    expect(data.result[1].children).to.have.length(1);
                    expect(data.result[1].children[0].name).to.eql("girnar");
                    expect(data.result[1].children[0].count.self).to.eql(7);
                    expect(data.result[1].children[0].count.total).to.eql(13);
                    expect(data.result[1].children[0].count.children).to.eql(6);
                    expect(data.result[1].children[0].children).to.have.length(2);
                    expect(data.result[1].children[0].children[0].name).to.eql("finance");
                    expect(data.result[1].children[0].children[0].count.self).to.eql(2);
                    expect(data.result[1].children[0].children[0].count.total).to.eql(2);
                    expect(data.result[1].children[0].children[1].name).to.eql("hr");
                    expect(data.result[1].children[0].children[1].count.self).to.eql(4);
                    expect(data.result[1].children[0].children[1].count.total).to.eql(4);

                    expect(data.result[2].name).to.eql("Meteor");
                    expect(data.result[2].count.self).to.eql(1);
                    expect(data.result[2].count.total).to.eql(4);
                    expect(data.result[2].count.children).to.eql(3);
                    expect(data.result[2].children).to.have.length(1);
                    expect(data.result[2].children[0].name).to.eql("TruckApp");
                    expect(data.result[2].children[0].count.self).to.eql(3);
                    expect(data.result[2].children[0].count.total).to.eql(3);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })

        it("Recursive With rootFilter and parameterized memory filter on single field", function (done) {
            var db = undefined;
            var amitDB = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    return db.update([
                        {$collection: "pl.collections", $insert: [
                            {collection: "projects"},
                            {collection: "employees"}
                        ]} ,
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "parent", type: "fk", collectionid: {$query: {collection: "projects"}}, set: ["name"], collection: "projects"},
                            {field: "ownerid", type: "fk", collectionid: {$query: {collection: "projects"}}, set: ["username", "emailid"], collection: "pl.users"},
                            {field: "name", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "reporting_to", type: "fk", collection: "employees", collectionid: {$query: {collection: "employees"}}, set: ["name"]},
                            {field: "projectid", type: "fk", collectionid: {$query: {collection: "employees"}}, set: ["name"], collection: "projects"}
                        ]}
                    ]);
                }).then(
                function () {
                    return db.update([
                        {$collection: "pl.users", $insert: [
                            {username: "Amit.Singh", password: "amit", emailid: "amit.singh@daffodilsw.com"},
                            {username: "Rohit", password: "rohit", emailid: "rohit.bansal@daffodilsw.com"}
                        ]},
                        {$collection: "projects", $insert: [
                            {name: "node_services", status: "Inactive", ownerid: {"$query": {username: "Rohit"}}},
                            {name: "AFE", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "node_services"}}},
                            {name: "Meteor", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}},
                            {name: "girnar", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "AFE"}}},
                            {name: "finance", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "girnar"}}},
                            {name: "AFB", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}},
                            {name: "TruckApp", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "Meteor"}}},
                            {name: "hr", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "girnar"}}}
                        ]},
                        {$collection: "employees", $insert: [
                            {name: "Rohit", projectid: {$query: {name: "girnar"}}},
                            {name: "Sachin", projectid: {$query: {name: "AFB"}}, reporting_to: {$query: {name: "Rohit"}}},
                            {name: "Ashu", projectid: {$query: {name: "Meteor"}}, reporting_to: {$query: {name: "Sachin"}}},
                            {name: "Ritesh", projectid: {$query: {name: "finance"}}, reporting_to: {$query: {name: "Sachin"}}},
                            {name: "Rajit", projectid: {$query: {name: "Meteor"}}, reporting_to: {$query: {name: "Rohit"}}},
                            {name: "Naveen", projectid: {$query: {name: "hr"}}, reporting_to: {$query: {name: "Rohit"}}}

                        ]}
                    ]);
                }).then(
                function () {
                    var query = {
                        $collection: "employees",
                        $fields: {
                            name: 1,
                            projectid: 1
                        },
                        $recursion: {
                            reporting_to: "_id",
                            $rootFilter: {reporting_to: null},
                            $filter: {projectid: {"$$whenDefined": {"key": "$projectid._id"}}}

                        },
                        $sort: {"name": 1}
                    };
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].name).to.eql("Rohit");
                    expect(data.result[0].children).to.have.length(3);
                    expect(data.result[0].children[0].name).to.eql("Naveen");
                    expect(data.result[0].children[0].children).to.eql(undefined);
                    expect(data.result[0].children[1].name).to.eql("Rajit");
                    expect(data.result[0].children[1].children).to.eql(undefined);
                    expect(data.result[0].children[2].name).to.eql("Sachin");
                    expect(data.result[0].children[2].children).to.have.length(2);
                    expect(data.result[0].children[2].children[0].name).to.eql("Ashu");
                    expect(data.result[0].children[2].children[1].name).to.eql("Ritesh");
                }).then(
                function () {
                    return db.query({$collection: "projects", $filter: {name: "Meteor"}});
                }).then(
                function (result) {
                    var query = {
                        $collection: "employees",
                        $fields: {
                            name: 1,
                            projectid: 1
                        },
                        $recursion: {
                            reporting_to: "_id",
                            $rootFilter: {reporting_to: null},
                            $filter: {projectid: {"$$whenDefined": {"key": "$projectid._id"}}}

                        },
                        $sort: {"name": 1},
                        $parameters: {projectid: result.result[0]}
                    };
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].name).to.eql("Rohit");
                    expect(data.result[0].__validFilter).to.eql(false);
                    expect(data.result[0].children).to.have.length(2);
                    expect(data.result[0].children[0].name).to.eql("Rajit");
                    expect(data.result[0].children[0].__validFilter).to.eql(true);
                    expect(data.result[0].children[0].children).to.eql(undefined);
                    expect(data.result[0].children[1].name).to.eql("Sachin");
                    expect(data.result[0].children[1].__validFilter).to.eql(false);
                    expect(data.result[0].children[1].children).to.have.length(1);
                    expect(data.result[0].children[1].children[0].name).to.eql("Ashu");
                    expect(data.result[0].children[1].children[0].__validFilter).to.eql(true);
                }).then(
                function () {
                    return db.query({$collection: "projects", $filter: {name: "finance"}});
                }).then(
                function (result) {
                    var query = {
                        $collection: "employees",
                        $fields: {
                            name: 1,
                            projectid: 1
                        },
                        $recursion: {
                            reporting_to: "_id",
                            $rootFilter: {reporting_to: null},
                            $filter: {projectid: {"$$whenDefined": {"key": "$projectid._id"}}}
                        },
                        $sort: {"name": 1},
                        $parameters: {projectid: result.result[0]}
                    };
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].name).to.eql("Rohit");
                    expect(data.result[0].__validFilter).to.eql(false);
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0].name).to.eql("Sachin");
                    expect(data.result[0].children[0].__validFilter).to.eql(false);
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[0].children[0].name).to.eql("Ritesh");
                    expect(data.result[0].children[0].children[0].__validFilter).to.eql(true);
                }).then(
                function () {
                    return db.query({$collection: "projects", $filter: {name: "AFB"}});
                }).then(
                function (result) {
                    var query = {
                        $collection: "employees",
                        $fields: {
                            name: 1,
                            projectid: 1
                        },
                        $recursion: {
                            reporting_to: "_id",
                            $rootFilter: {reporting_to: null},
                            $filter: {projectid: {"$$whenDefined": {"key": "$projectid._id"}}},
                            $resolvedFilterParameter: "__valid"
                        },
                        $sort: {"name": 1},
                        $parameters: {projectid: result.result[0]}
                    };
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].name).to.eql("Rohit");
                    expect(data.result[0].__valid).to.eql(false);
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0].name).to.eql("Sachin");
                    expect(data.result[0].children[0].__valid).to.eql(true);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })
        it("Recursive With rootFilter and parameterized memory filter on single field and resolvedFilterParameters", function (done) {
            var db = undefined;
            var amitDB = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    return db.update([
                        {$collection: "pl.collections", $insert: [
                            {collection: "projects"},
                            {collection: "employees"}
                        ]} ,
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "parent", type: "fk", collectionid: {$query: {collection: "projects"}}, set: ["name"], collection: "projects"},
                            {field: "ownerid", type: "fk", collectionid: {$query: {collection: "projects"}}, set: ["username", "emailid"], collection: "pl.users"},
                            {field: "name", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "reporting_to", type: "fk", collection: "employees", collectionid: {$query: {collection: "employees"}}, set: ["name"]},
                            {field: "projectid", type: "fk", collectionid: {$query: {collection: "employees"}}, set: ["name"], collection: "projects", multiple: true}
                        ]}
                    ]);
                }).then(
                function () {
                    return db.update([
                        {$collection: "pl.users", $insert: [
                            {username: "Amit.Singh", password: "amit", emailid: "amit.singh@daffodilsw.com"},
                            {username: "Rohit", password: "rohit", emailid: "rohit.bansal@daffodilsw.com"}
                        ]},
                        {$collection: "projects", $insert: [
                            {name: "node_services", status: "Inactive", ownerid: {"$query": {username: "Rohit"}}},
                            {name: "AFE", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "node_services"}}},
                            {name: "Meteor", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}},
                            {name: "girnar", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "AFE"}}},
                            {name: "finance", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "girnar"}}},
                            {name: "AFB", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}},
                            {name: "TruckApp", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "Meteor"}}},
                            {name: "hr", status: "active", ownerid: {"$query": {username: "Amit.Singh"}}, parent: {$query: {name: "girnar"}}}
                        ]},
                        {$collection: "employees", $insert: [
                            {name: "Rohit", projectid: [
                                {$query: {name: "girnar"}},
                                {$query: {name: "Meteor"}},
                                {$query: {name: "AFB"}}
                            ]},
                            {name: "Sachin", projectid: [
                                {$query: {name: "AFB"}},
                                {$query: {name: "finance"}}
                            ], reporting_to: {$query: {name: "Rohit"}}},
                            {name: "Ashu", projectid: [
                                {$query: {name: "Meteor"}}
                            ], reporting_to: {$query: {name: "Sachin"}}},
                            {name: "Ritesh", projectid: [
                                {$query: {name: "finance"}}
                            ], reporting_to: {$query: {name: "Sachin"}}},
                            {name: "Rajit", projectid: [
                                {$query: {name: "Meteor"}}
                            ], reporting_to: {$query: {name: "Rohit"}}},
                            {name: "Naveen", projectid: [
                                {$query: {name: "hr"}}
                            ], reporting_to: {$query: {name: "Rohit"}}}

                        ]}
                    ]);
                }).then(
                function () {
                    var query = {
                        $collection: "employees",
                        $fields: {
                            name: 1,
                            projectid: 1
                        },
                        $recursion: {
                            reporting_to: "_id",
                            $rootFilter: {reporting_to: null},
                            $filter: {projectid: {"$$whenDefined": {"key": "$projectid._id"}}}

                        },
                        $sort: {"name": 1}
                    };
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].name).to.eql("Rohit");
                    expect(data.result[0].children).to.have.length(3);
                    expect(data.result[0].children[0].name).to.eql("Naveen");
                    expect(data.result[0].children[0].children).to.eql(undefined);
                    expect(data.result[0].children[1].name).to.eql("Rajit");
                    expect(data.result[0].children[1].children).to.eql(undefined);
                    expect(data.result[0].children[2].name).to.eql("Sachin");
                    expect(data.result[0].children[2].children).to.have.length(2);
                    expect(data.result[0].children[2].children[0].name).to.eql("Ashu");
                    expect(data.result[0].children[2].children[1].name).to.eql("Ritesh");
                }).then(
                function () {
                    return db.query({$collection: "projects", $filter: {name: "Meteor"}});
                }).then(
                function (result) {
                    var query = {
                        $collection: "employees",
                        $fields: {
                            name: 1,
                            projectid: 1
                        },
                        $recursion: {
                            reporting_to: "_id",
                            $rootFilter: {reporting_to: null},
                            $filter: {projectid: {"$$whenDefined": {"key": "$projectid._id"}}}

                        },
                        $sort: {"name": 1},
                        $parameters: {projectid: result.result[0]}
                    };
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].name).to.eql("Rohit");
                    expect(data.result[0].__validFilter).to.eql(true);
                    expect(data.result[0].children).to.have.length(2);
                    expect(data.result[0].children[0].name).to.eql("Rajit");
                    expect(data.result[0].children[0].__validFilter).to.eql(true);
                    expect(data.result[0].children[0].children).to.eql(undefined);
                    expect(data.result[0].children[1].name).to.eql("Sachin");
                    expect(data.result[0].children[1].__validFilter).to.eql(false);
                    expect(data.result[0].children[1].children).to.have.length(1);
                    expect(data.result[0].children[1].children[0].name).to.eql("Ashu");
                    expect(data.result[0].children[1].children[0].__validFilter).to.eql(true);
                }).then(
                function () {
                    return db.query({$collection: "projects", $filter: {name: "finance"}});
                }).then(
                function (result) {
                    var query = {
                        $collection: "employees",
                        $fields: {
                            name: 1,
                            projectid: 1
                        },
                        $recursion: {
                            reporting_to: "_id",
                            $rootFilter: {reporting_to: null},
                            $filter: {projectid: {"$$whenDefined": {"key": "$projectid._id"}}}
                        },
                        $sort: {"name": 1},
                        $parameters: {projectid: result.result[0]}
                    };
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].name).to.eql("Rohit");
                    expect(data.result[0].__validFilter).to.eql(false);
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0].name).to.eql("Sachin");
                    expect(data.result[0].children[0].__validFilter).to.eql(true);
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[0].children[0].name).to.eql("Ritesh");
                    expect(data.result[0].children[0].children[0].__validFilter).to.eql(true);
                }).then(
                function () {
                    return db.query({$collection: "projects", $filter: {name: "AFB"}});
                }).then(
                function (result) {
                    var query = {
                        $collection: "employees",
                        $fields: {
                            name: 1,
                            projectid: 1
                        },
                        $recursion: {
                            reporting_to: "_id",
                            $rootFilter: {reporting_to: null},
                            $filter: {projectid: {"$$whenDefined": {"key": "$projectid._id"}}},
                            $resolvedFilterParameter: "__valid"
                        },
                        $sort: {"name": 1},
                        $parameters: {projectid: result.result[0]}
                    };
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].name).to.eql("Rohit");
                    expect(data.result[0].__valid).to.eql(true);
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0].name).to.eql("Sachin");
                    expect(data.result[0].children[0].__valid).to.eql(true);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })

        it("Recursion with rootFilter false with finding count of children", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
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
                    return ApplaneDB.connect(Config.URL, Config.DB, OPTIONS);
                }).then(
                function (db1) {
                    db = db1;
                    return db.update([
                        {$collection: "employeess", $insert: [
                            {emailid: "yogesh@daffodilsw.com", userid: {$query: {emailid: "yogesh@daffodilsw.com"}}},
                            {emailid: "amit.singh@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}, userid: {$query: {emailid: "amit.singh@daffodilsw.com"}}},
                            {emailid: "rohit.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "yogesh@daffodilsw.com"}}, userid: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}},
                            {emailid: "sachin.bansal@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}},
                            {emailid: "kapil.dalal@daffodilsw.com", reporting_to_id: {$query: {emailid: "amit.singh@daffodilsw.com"}}, userid: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}},
                            {emailid: "preeti.gulia@daffodilsw.com", reporting_to_id: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, userid: {$query: {emailid: "preeti.gulia@daffodilsw.com"}}},
                            {emailid: "sushil.kumar@daffodilsw.com", reporting_to_id: {$query: {emailid: "kapil.dalal@daffodilsw.com"}}, userid: {$query: {emailid: "sushil.kumar@daffodilsw.com"}}},
                            {emailid: "naveen.singh@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "naveen.singh@daffodilsw.com"}}},
                            {emailid: "manjeet.sanghwan@daffodilsw.com", reporting_to_id: {$query: {emailid: "rohit.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}},
                            {emailid: "rajit.kumar@daffodilsw.com", reporting_to_id: {$query: {emailid: "manjeet.sanghwan@daffodilsw.com"}}, userid: {$query: {emailid: "rajit.kumar@daffodilsw.com"}}},
                            {emailid: "ashu@daffodilsw.com", reporting_to_id: {$query: {emailid: "sachin.bansal@daffodilsw.com"}}, userid: {$query: {emailid: "ashu@daffodilsw.com"}}}
                        ]}
                    ]);
                }).then(
                function () {
                    var query = {
                        $collection: "employeess",
                        $recursion: {
                            "reporting_to_id": "_id",
                            "$rootFilter": false,
                            "count": {"$sum": 1}
                        }, $sort: {emailid: 1}
                    };

                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].emailid).to.eql("yogesh@daffodilsw.com");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].children[0].emailid).to.eql("amit.singh@daffodilsw.com");
                    expect(data.result[0].children[0].count).to.eql(1);
                    expect(data.result[0].children[0].children[0].emailid).to.eql("kapil.dalal@daffodilsw.com");
                    expect(data.result[0].children[0].children[0].count).to.eql(2);
                    expect(data.result[0].children[1].emailid).to.eql("rohit.bansal@daffodilsw.com");
                    expect(data.result[0].children[1].count).to.eql(3);
                    expect(data.result[0].children[1].children[0].emailid).to.eql("manjeet.sanghwan@daffodilsw.com");
                    expect(data.result[0].children[1].children[0].count).to.eql(1);
                    expect(data.result[0].children[1].children[0].children[0].emailid).to.eql("rajit.kumar@daffodilsw.com");
                    expect(data.result[0].children[1].children[1].emailid).to.eql("naveen.singh@daffodilsw.com");
                    expect(data.result[0].children[1].children[2].emailid).to.eql("sachin.bansal@daffodilsw.com");
                    expect(data.result[0].children[1].children[2].count).to.eql(1);
                }).then(function () {
                    var query = {
                        $collection: "employeess",
                        $recursion: {
                            "reporting_to_id": "_id",
                            "$rootFilter": false,
                            "count": {"$sum": 1},
                            "$rollup": ["count"]
                        },
                        $sort: {emailid: 1}
                    };

                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].emailid).to.eql("yogesh@daffodilsw.com");
                    expect(data.result[0].count.self).to.eql(2);

                    expect(data.result[0].children[0].emailid).to.eql("amit.singh@daffodilsw.com");
                    expect(data.result[0].children[0].count.self).to.eql(1);
                    expect(data.result[0].children[0].count.total).to.eql(3);
                    expect(data.result[0].children[0].count.children).to.eql(2);
                    expect(data.result[0].children[0].children[0].emailid).to.eql("kapil.dalal@daffodilsw.com");
                    expect(data.result[0].children[0].children[0].count.self).to.eql(2);
                    expect(data.result[0].children[0].children[0].count.total).to.eql(2);
                    expect(data.result[0].children[1].emailid).to.eql("rohit.bansal@daffodilsw.com");
                    expect(data.result[0].children[1].count.self).to.eql(3);
                    expect(data.result[0].children[1].count.total).to.eql(5);
                    expect(data.result[0].children[1].count.children).to.eql(2);
                    expect(data.result[0].children[1].children[0].emailid).to.eql("manjeet.sanghwan@daffodilsw.com");
                    expect(data.result[0].children[1].children[0].count.self).to.eql(1);
                    expect(data.result[0].children[1].children[0].count.total).to.eql(1);
                    expect(data.result[0].children[1].children[1].emailid).to.eql("naveen.singh@daffodilsw.com");
                    expect(data.result[0].children[1].children[2].emailid).to.eql("sachin.bansal@daffodilsw.com");
                    expect(data.result[0].children[1].children[2].count.self).to.eql(1);
                    expect(data.result[0].children[1].children[2].count.total).to.eql(1);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })
    })

    describe("P&L", function () {
        afterEach(function (done) {
            Testcases.afterEach(done);
        })
        beforeEach(function (done) {
            Testcases.beforeEach(done);
        })

        it("P&L query", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection: NorthwindDb.VOUCHERS_TABLE, $insert: NorthwindDb.Vouchers},
                        {$collection: NorthwindDb.ACCOUNT_GROUPS_TABLE, $insert: NorthwindDb.AccountGroups},
                        {$collection: NorthwindDb.ACCOUNTS_TABLE, $insert: NorthwindDb.Accounts}
                    ])
                }).then(
                function () {
//                    console.log("after update....");
                    var query = {
                        $collection: {collection: NorthwindDb.ACCOUNT_GROUPS_TABLE, fields: [
                            {field: "parent_account_group", type: "fk", collection: NorthwindDb.ACCOUNT_GROUPS_TABLE}
                        ]},
                        $fields: {
//                        accountgroup:1,
                            grouptotal: {
                                $query: {
                                    $collection: {collection: "vouchers", fields: [
                                        {field: "vlis", type: "object", multiple: true, fields: [
                                            {field: "accountgroupid", type: "fk", collection: NorthwindDb.ACCOUNT_GROUPS_TABLE}
                                        ]}
                                    ]},
                                    $unwind: ["vlis"],
                                    $group: {
                                        _id: null,
                                        vliamount: {$sum: "$vlis.amount"}
                                    }
                                },
                                $fk: "vlis.accountgroupid",
                                $parent: "_id"
                            },
                            accounts: {
                                $query: {
                                    $collection: {collection: "accounts", fields: [
                                        {field: "accountgroupid", type: "fk", collection: NorthwindDb.ACCOUNT_GROUPS_TABLE}
                                    ]},
                                    $fields: {account: 1,
                                        "accountgroupid._id": 1,
                                        accounttotal: {
                                            $query: {
                                                $collection: {collection: "vouchers", fields: [
                                                    {field: "vlis", type: "object", multiple: true, fields: [
                                                        {field: "accountid", type: "fk", collection: NorthwindDb.ACCOUNTS_TABLE}
                                                    ]}
                                                ]},
                                                $unwind: ["vlis"],
                                                $group: {_id: null, accounttotal: {$sum: "$vlis.amount"}}
                                            },
                                            $fk: "vlis.accountid",
                                            $parent: "_id"
                                        }
                                    }
                                },
                                $fk: "accountgroupid",
                                $parent: "_id"
                            }
                        },
                        $filter: {
                            "parent_account_group": null
                        },
                        $recursion: {
                            parent_account_group: "_id",
                            $level: 2
                        },
                        $sort: {"accountgroup": 1}
                    };

                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data >>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0]._id).to.eql("Income");
                    expect(data.result[0].accountgroup).to.eql("Income");
                    expect(data.result[0].grouptotal._id).to.eql("Income");
                    expect(data.result[0].grouptotal.vliamount).to.eql(-500);
                    expect(data.result[0].accounts._id).to.eql("Services");
                    expect(data.result[0].accounts.accounttotal.accounttotal).to.eql(-500);
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0].accountgroup).to.eql("Expense");
                    expect(data.result[0].children[0]._id).to.eql("Expense");
                    expect(data.result[0].children[0].grouptotal.vliamount).to.eql(600);
                    expect(data.result[0].children[0].parent_account_group._id).to.eql("Income");
                    expect(data.result[0].children[0].accounts.accounttotal.accounttotal).to.eql(600);
                    expect(data.result[0].children[0].children[0]._id).to.eql("Asset");
                    expect(data.result[0].children[0].children[0].accountgroup).to.eql("Asset");
                    expect(data.result[0].children[0].children[0].parent_account_group._id).to.eql("Expense");
                    expect(data.result[0].children[0].children[0].grouptotal.vliamount).to.eql(-100);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            var expectedResult = {"result": [
                {"_id": "Income", "accountgroup": "Income", "grouptotal": {"_id": "Income", "vliamount": -500, "vlis_accountgroupid__id": "Income"}, "accounts": {"_id": "Services", "account": "Services", "accountgroupid": {"_id": "Income"}, "accounttotal": {"_id": "Services", "accounttotal": -500, "vlis_accountid__ id": "Services"}}, "children": [
                    {"_id": "Expense", "accountgroup": "Expense", "parent_account_group": {"_id": "Income"}, "grouptotal": {"_id": "Expense", "vliamount": 600, "vlis_accountgroupid__id": "Expense"}, "accounts": {"_id": "salary", "account": "salary", "accountgroupid": {"_id": "Expense"}, "accounttotal": {"_id": "sa lary", "accounttotal": 600, "vlis_accountid__id": "salary"}}, "children": [
                        {"_id": "Asset", "accountgroup": "Asset", "parent_account_group": {"_id": "Expense"}, "grouptotal": {"_id": "Asset", "vliamount": -100, "vlis_accountgroupid__id": "Asset"}}
                    ]}
                ]}
            ]};

        })

        //TODO, we do not required to add filter for 0 amount as we are starting from vouchers, it may requird when we starts from accountgroup
        //TODO vli filter --> will be applied two time or single time
        //TODO this report is without hierarchy

        it.skip("group by with unwindarray column with having and sort and aggregates", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    var query = {$collection: {collection: "vouchers", fields: [
                        {field: "vlis", type: "object", multiple: true, fields: [
                            {field: "accountgroupid", type: "fk", collection: NorthwindDb.ACCOUNT_GROUPS_TABLE, fields: [
                                {field: "parent_account_group", type: "fk", "collection": NorthwindDb.ACCOUNT_GROUPS_TABLE}
                            ]}
                        ]}
                    ]},
                        $fields: {"voucherno": 1, "vlis.accountid._id": 1, "vlis.accountid.account": 1},
                        $filter: {
                            "vlis.accountgroupid": {$in: ["Income", "Expense"]},
                            "vlis.accountgroupid.parent_account_group": null
                        },
                        $recursion: {"vlis.accountgroupid.parent_account_group": "vlis.accountgroupid._id", $level: 4},
                        $unwind: ["vlis"],
                        $group: {
                            _id: [
                                {accountgroupid: "$vlis.accountgroupid"},
                                {accountid: "$vlis.accountid"}
                            ],
                            amount: {$sum: "$vlis.amount"}
                        }
                    };
                    return   db.query(query);
                }).then(
                function (data) {
//                    console.log("data >>>>>>>>" + JSON.stringify(data));
                    expect(data.result[0].voucherno).to.eql(1);
                    expect(data.result[0].vlis.accountid._id).to.eql("Services");
                    expect(data.result[0].vlis.accountgroupid._id).to.eql("Income");
                    expect(data.result[0].children).to.have.length(2);
                    expect(data.result[0].children[0].voucherno).to.eql(1);
                    expect(data.result[0].children[0].vlis.accountid._id).to.eql("salary");
                    expect(data.result[0].children[0].vlis.accountgroupid._id).to.eql("Expense");
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[0].children[0].voucherno).to.eql(2);
                    expect(data.result[0].children[0].children[0].vlis.accountid._id).to.eql("cash");
                    expect(data.result[0].children[0].children[0].vlis.accountgroupid._id).to.eql("Asset");
                    expect(data.result[0].children[1].voucherno).to.eql(2);
                    expect(data.result[0].children[1].vlis.accountid._id).to.eql("salary");
                    expect(data.result[0].children[1].vlis.accountgroupid._id).to.eql("Expense");
                    expect(data.result[0].children[1].children).to.have.length(1);
                    expect(data.result[0].children[1].children[0].voucherno).to.eql(2);
                    expect(data.result[0].children[1].children[0].vlis.accountid._id).to.eql("cash");
                    expect(data.result[0].children[1].children[0].vlis.accountgroupid._id).to.eql("Asset");
                    done();
                }).fail(function (e) {
                    done(e);
                })
            var mongoPipelines =
                [
                    {$match: {"vlis.accountgroupid._id": {$in: ["Income", "Expense"]}}},
                    {$unwind: "vlis"},
                    {$match: {"vlis.accountgroupid._id": {$in: ["Income", "Expense"]}}},
                    {$group: {
                        _id: {accountgroupid: "$vlis.accountgroupid._id", accountid: "$vlis.accountid._id"},
                        amount: {$sum: "$vlis.amount"},
                        accountgroupid: {$first: "$vlis.accountgroupid"},
                        accountid: {$first: "$vlis.accountid"}
                    }},
                    {$group: {
                        _id: "$_id.accoountgroupid",
                        amount: {$sum: "$amount"},
                        accountgroupid: {$first: "$accountgroupid"},
                        children: {$push: {_id: "$_id.accountid", accountid: "$accountid", amount: "$amount"}}
                    }}

                ]
            var result = {"result": [
                {"voucherno": 1, "vlis": {"accountid": {"_id": "Services", "account": "Services"}, "accountgroupid": {"_id": "Income"}}, "_id": "533ea4a49a1d98f008000001", "children": [
                    {"voucherno": 1, "vlis": {"accountid": {"_id": "salary", "account": "salary"}, "accountgroupid": {"_id": "Expense", "parent_account_group": {"_id": "Income"}}}, "_id": "533ea4a49a1d98f008000001", "children": [
                        {"voucherno": 2, "vlis": {"accountid": {"_id": "cash", "account": "cash"}, "accountgroupid": {"_id": "Asset", "parent_account_group": {"_id": "Expense"}}}, "_id": "533ea4a49a1d98f008000002"}
                    ]},
                    {"voucherno ": 2, "vlis": {"accountid": {"_id": "salary", "account": "salary"}, "accountgroupid": {"_id": "Expense", "parent_account_group": {"_id": "Income"}}}, "_id ": "533ea4a49a1d98f008000002", "children": [
                        {"voucherno": 2, "vlis": {"accountid": {"_id": "cash", "account": "cash"}, "accountgroupid": {"_id": "Asset", "parent_account_group": {"_id": "Expense"}}}, "_id": "533ea4a49a1d98f008000002"}
                    ]}
                ]}
            ]}
        })

    })
})
