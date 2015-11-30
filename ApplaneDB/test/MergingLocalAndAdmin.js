/**
 *
 *  mocha --recursive --timeout 150000 -g "MergingLocalAndAdminDbtestcase" --reporter spec
 *  Array case add trigger in collections
 *  mocha --recursive --timeout 150000 -g "MergingLocalAndAdminQueryCase" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Q = require("q");
var Document = require("../public/js/Document.js");
var Config = require("./config.js").config;
var configureOptions = {URL: Config.URL, Admin: {DB: "northwindadmindb", USER_NAME: "northiwndadmin", PASSWORD: "1234"}};
var localDB1 = "northwindb1";
var localDB2 = "northwinddb2";
var Testcases = require("./TestCases.js");
var collectionsToRegister = [
    {
        collection: "status",
        global: true
    } ,
    {
        collection: "persons",
        global: true
    }
];     //one testcase without pass _id
//unwind or group case for override in query and update unwind fields in collection.

describe("MergingLocalAndAdminDbtestcase", function () {

    describe("MergingLocalAndAdminUpdateCase", function () {
        before(function (done) {
            ApplaneDB.configure(configureOptions).then(
                function () {
                    return ApplaneDB.registerCollection(collectionsToRegister);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })
        beforeEach(function (done) {
            Testcases.beforeEach().then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.ADMIN_DB, Config.ADMIN_OPTIONS);
                }).then(
                function (adminDb) {
                    return  adminDb.update({$collection: "pl.dbs", $insert: [
                        {db: localDB1, globalDb: Config.GLOBAL_DB, globalUserName: Config.OPTIONS.username, globalPassword: Config.OPTIONS.password, globalUserAdmin: true, guestUserName: Config.OPTIONS.username},
                        {db: localDB2, globalDb: localDB1, globalUserName: Config.OPTIONS.username, globalPassword: Config.OPTIONS.password, globalUserAdmin: true, guestUserName: Config.OPTIONS.username}
                    ]});
                }).then(
                function () {
                    done();
                }).fail(function (err) {
                    done(err)
                });
        })
        afterEach(function (done) {
            return ApplaneDB.connect(Config.URL, localDB1, Config.OPTIONS).then(
                function (localDb1) {
                    return localDb1.dropDatabase();
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, localDB2, Config.OPTIONS);
                }).then(
                function (localDb2) {
                    return localDb2.dropDatabase();
                }).then(
                function () {
                    return Testcases.afterEach();
                }).then(
                function () {
                    done();
                }).fail(function (err) {
                    done(err)
                });
        })

        it("status override", function (done) {
            var adminDb = undefined;
            var localDb1 = undefined;
            ApplaneDB.connect(Config.URL, Config.GLOBAL_DB, Config.OPTIONS).then(
                function (adb) {
                    adminDb = adb;
                    return ApplaneDB.connect(Config.URL, localDB1, Config.OPTIONS);
                }).then(
                function (ldb1) {
                    localDb1 = ldb1;
                    var adminStatus = [
                        {
                            $collection: "status",
                            $insert: [
                                {_id: "new", status: "New"},
                                {_id: "inprogress", status: "In progress"} ,
                                {_id: "completed", status: "Completed"}
                            ]
                        }
                    ];
                    return adminDb.update(adminStatus);
                }).then(function () {
                    return localDb1.startTransaction();
                }).then(
                function () {
                    var localStatus = [
                        {
                            $collection: "status",
                            $insert: [
                                {_id: "fresh", status: "Fresh"},
                                {_id: "planned", status: "Planned"}
                            ],
                            $update: [
                                {_id: "new", $set: {status: "Latest"}}
                            ],
                            $delete: [
                                {_id: "inprogress"}
                            ]
                        }
                    ];
                    return localDb1.update(localStatus);
                }).then(function () {
                    return localDb1.commitTransaction();
                }).then(
                function () {
                    var d = Q.defer();
                    localDb1.db.collection("status").find({}, {sort: {_id: 1}}).toArray(function (err, localStatus) {
                        if (err) {
                            d.reject(err);
                            return;
                        }

                        expect(localStatus).to.have.length(4);

                        expect(localStatus[0]._id).to.eql("completed");
                        expect(localStatus[0].status).to.eql("Completed");
                        expect(localStatus[0].__type__).to.eql(undefined);
                        expect(localStatus[1]._id).to.eql("fresh");
                        expect(localStatus[1].status).to.eql("Fresh");
                        expect(localStatus[1].__type__).to.eql(undefined);
                        expect(localStatus[2]._id).to.eql("new");
                        expect(localStatus[2].status).to.eql("Latest");
                        expect(localStatus[2].__type__).to.eql(undefined);
                        expect(localStatus[3]._id).to.eql("planned");
                        expect(localStatus[3].status).to.eql("Planned");
                        expect(localStatus[3].__type__).to.eql(undefined);
                        var expectedResult = [
                            {_id: "completed", status: "Completed"},
                            {_id: "fresh", status: "Fresh"},
                            {_id: "new", status: "Latest"},
                            {_id: "planned", status: "Planned"}
                        ]
                        localDb1.query({$collection: "status", $sort: {_id: 1}}).then(
                            function (result) {
                                d.resolve(result);
                            }).fail(function (e) {
                                d.reject(err);
                            });
                    });
                    return d.promise;
                }).then(
                function (statusResult) {
                    if (statusResult) {
                        expect(statusResult.result).to.have.length(4);

                        expect(statusResult.result[0]._id).to.eql("completed");
                        expect(statusResult.result[0].status).to.eql("Completed");
                        expect(statusResult.result[0].__type__).to.eql(undefined);
                        expect(statusResult.result[1]._id).to.eql("fresh");
                        expect(statusResult.result[1].status).to.eql("Fresh");
                        expect(statusResult.result[1].__type__).to.eql(undefined);
                        expect(statusResult.result[2]._id).to.eql("new");
                        expect(statusResult.result[2].status).to.eql("Latest");
                        expect(statusResult.result[2].__type__).to.eql(undefined);
                        expect(statusResult.result[3]._id).to.eql("planned");
                        expect(statusResult.result[3].status).to.eql("Planned");
                        expect(statusResult.result[3].__type__).to.eql(undefined);
                        var expectedResult = [
                            {_id: "completed", status: "Completed"},
                            {_id: "fresh", status: "Fresh"},
                            {_id: "new", status: "Latest"},
                            {_id: "planned", status: "Planned"}
                        ]
                        done();
                    }
                }).fail(function (e) {
                    done(e)
                });
        })

        it("status override Two level", function (done) {
            var adminDb = undefined;
            var localDb1 = undefined;
            var localDb2 = undefined;
            ApplaneDB.connect(Config.URL, Config.GLOBAL_DB, Config.OPTIONS).then(
                function (adb) {
                    adminDb = adb;
                    return ApplaneDB.connect(Config.URL, localDB1, Config.OPTIONS);
                }).then(
                function (ldb1) {
                    localDb1 = ldb1;
                    return ApplaneDB.connect(Config.URL, localDB2, Config.OPTIONS);
                }).then(
                function (ldb2) {
                    localDb2 = ldb2;
                    var adminStatus = [
                        {
                            $collection: "status",
                            $insert: [
                                {_id: "new", status: "New"},
                                {_id: "inprogress", status: "In progress"} ,
                                {_id: "completed", status: "Completed"}
                            ]
                        }
                    ];
                    return adminDb.update(adminStatus);
                }).then(
                function () {
                    var localStatus = [
                        {
                            $collection: "status",
                            $insert: [
                                {_id: "fresh", status: "Fresh"},
                                {_id: "planned", status: "Planned"}
                            ],
                            $update: [
                                {_id: "new", $set: {status: "Latest"}}
                            ],
                            $delete: [
                                {_id: "inprogress"}
                            ]
                        }
                    ];
                    return localDb1.update(localStatus);
                }).then(
                function () {
                    var d = Q.defer();
                    localDb1.db.collection("status").find({}, {sort: {_id: 1}}).toArray(function (err, localStatus) {
                        if (err) {
                            d.reject(err);
                            return;
                        }

                        expect(localStatus).to.have.length(4);
                        expect(localStatus[0]._id).to.eql("completed");
                        expect(localStatus[0].status).to.eql("Completed");
                        expect(localStatus[1]._id).to.eql("fresh");
                        expect(localStatus[1].status).to.eql("Fresh");
                        expect(localStatus[2]._id).to.eql("new");
                        expect(localStatus[2].status).to.eql("Latest");
                        expect(localStatus[3]._id).to.eql("planned");
                        expect(localStatus[3].status).to.eql("Planned");
                        d.resolve();
                    });
                    return d.promise;
                }).then(
                function () {
                    var localDb2Status = [
                        {
                            $collection: "status",
                            $update: [
                                {_id: "completed", $set: {status: "Completed1"}}
                            ]
                        }
                    ];
                    return localDb2.update(localDb2Status);
                }).then(
                function () {
                    var d = Q.defer();
                    localDb2.db.collection("status").find({}, {sort: {_id: 1}}).toArray(function (err, localStatus) {
                        if (err) {
                            d.reject(err);
                            return;
                        }

                        expect(localStatus).to.have.length(4);
                        expect(localStatus[0]._id).to.eql("completed");
                        expect(localStatus[0].status).to.eql("Completed1");
                        expect(localStatus[1]._id).to.eql("fresh");
                        expect(localStatus[1].status).to.eql("Fresh");
                        expect(localStatus[2]._id).to.eql("new");
                        expect(localStatus[2].status).to.eql("Latest");
                        expect(localStatus[3]._id).to.eql("planned");
                        expect(localStatus[3].status).to.eql("Planned");
                        d.resolve();
                    });
                    return d.promise;
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e)
                });
        })

        it("persons override with unwind person on localdb", function (done) {

            var adminDb = undefined;
            var localDb1 = undefined;
            ApplaneDB.connect(Config.URL, Config.GLOBAL_DB, Config.OPTIONS).then(
                function (adb) {
                    adminDb = adb;
                    return ApplaneDB.connect(Config.URL, localDB1, Config.OPTIONS);
                }).then(
                function (ldb1) {
                    localDb1 = ldb1;
                    var adminPersons = [
                        {
                            $collection: "persons",
                            $insert: [
                                {_id: "sachin", name: "sachin", languages: [
                                    {language: "Hindi", read: true, speak: true}
                                ]},
                                {_id: "manjeet", name: "manjeet", status: "Completed", languages: [
                                    {language: "Hindi", read: true, write: true},
                                    {language: "English", read: true, speak: true}
                                ]}
                            ]
                        }
                    ];
                    return adminDb.update(adminPersons);
                }).then(
                function () {
                    var localPersons = [
                        {
                            $collection: "persons",
                            $insert: [
                                {_id: "Ashish", name: "Ashish", languages: [
                                    {language: "Hindi", read: true, speak: true}
                                ]},
                                {_id: "Rohit", name: "Rohit", status: "Completed", languages: [
                                    {language: "Hindi", read: true, write: true},
                                    {language: "English", read: true, speak: true}
                                ]}
                            ],
                            $update: [
                                {_id: "sachin", $set: {name: "sachin1"}}
                            ],
                            $delete: [
                                {_id: "manjeet"}
                            ]
                        }
                    ];
                    return localDb1.update(localPersons);
                }).then(
                function () {
                    return localDb1.query({$collection: "persons", $unwind: ["languages"], $sort: {_id: 1}});
                }).then(
                function (personResult) {
                    expect(personResult.result).to.have.length(4);

                    expect(personResult.result[0]._id).to.eql("Ashish");
                    expect(personResult.result[0].name).to.eql("Ashish");
                    expect(personResult.result[0].languages.language).to.eql("Hindi");
                    expect(personResult.result[0].languages.read).to.eql(true);
                    expect(personResult.result[0].languages.speak).to.eql(true);
                    expect(personResult.result[1]._id).to.eql("Rohit");
                    expect(personResult.result[1].name).to.eql("Rohit");
                    expect(personResult.result[1].languages.language).to.eql("Hindi");
                    expect(personResult.result[1].languages.read).to.eql(true);
                    expect(personResult.result[1].languages.write).to.eql(true);
                    expect(personResult.result[2]._id).to.eql("Rohit");
                    expect(personResult.result[2].name).to.eql("Rohit");
                    expect(personResult.result[2].languages.language).to.eql("English");
                    expect(personResult.result[2].languages.read).to.eql(true);
                    expect(personResult.result[2].languages.speak).to.eql(true);
                    expect(personResult.result[3]._id).to.eql("sachin");
                    expect(personResult.result[3].name).to.eql("sachin1");
                    expect(personResult.result[3].languages.language).to.eql("Hindi");
                    expect(personResult.result[3].languages.read).to.eql(true);
                    expect(personResult.result[3].languages.speak).to.eql(true);
                    var expectedResult = {"result": [
                        {"_id": "Ashish", "name": "Ashish", "languages": {"language": "Hindi", "read": true, "speak": true}},
                        {"_id": "Rohit", "name": "Rohit", "status": "Completed", "languages": {"language": "Hindi", "read": true, "write": true}},
                        {"_id": "Rohit", "name": "Rohit", "status": "Completed", "languages": {"language": "English", "read": true, "speak": true}} ,
                        {"_id": "sachin", "languages": {"language": "Hindi", "read": true, "speak": true}, "name": "sachin1"}
                    ]}
                    done();
                }).fail(function (e) {
                    done(e)
                });
        })

    })

    describe("MergingLocalAndAdminQueryCase", function () {
        beforeEach(function (done) {
            Testcases.beforeEach().then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.ADMIN_DB, Config.ADMIN_OPTIONS);
                }).then(
                function (adminDb) {
                    return  adminDb.update({$collection: "pl.dbs", $insert: [
                        {db: localDB1, globalDb: Config.GLOBAL_DB, globalUserName: Config.OPTIONS.username, globalPassword: Config.OPTIONS.password, globalUserAdmin: true, guestUserName: Config.OPTIONS.username},
                        {db: localDB2, globalDb: localDB1, globalUserName: Config.OPTIONS.username, globalPassword: Config.OPTIONS.password, globalUserAdmin: true, guestUserName: Config.OPTIONS.username}
                    ]});
                }).then(
                function () {
                    done();
                }).fail(function (err) {
                    done(err)
                });
        })

        afterEach(function (done) {
            return ApplaneDB.connect(Config.URL, localDB1, Config.OPTIONS).then(
                function (localDb1) {
                    return localDb1.dropDatabase();
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, localDB2, Config.OPTIONS);
                }).then(
                function (localDb2) {
                    return localDb2.dropDatabase();
                }).then(
                function () {
                    return Testcases.afterEach();
                }).then(
                function () {
                    done();
                }).fail(function (err) {
                    done(err)
                });
        })

        it("status override with status on localdb", function (done) {
            var adminDb = undefined;
            var localDb1 = undefined;
            ApplaneDB.connect(Config.URL, Config.GLOBAL_DB, Config.OPTIONS).then(
                function (adb) {
                    adminDb = adb;
                    return ApplaneDB.connect(Config.URL, localDB1, Config.OPTIONS);
                }).then(
                function (ldb1) {
                    localDb1 = ldb1;
                    var adminStatus = [
                        {
                            $collection: "status",
                            $insert: [
                                {_id: "new", status: "New"},
                                {_id: "inprogress", status: "In progress"},
                                {_id: "completed", status: "Completed"}
                            ]
                        }
                    ];
                    return adminDb.update(adminStatus);
                }).then(
                function () {
                    var localStatus = [
                        {
                            $collection: "status",
                            $insert: [
                                {_id: "completed", status: "Completed"},
                                {_id: "fresh", status: "Fresh"},
                                {_id: "new", status: "Latest"},
                                {_id: "planned", status: "Planned"}
                            ],
                            $modules: {MergeLocalAdminDB: 0}
                        }
                    ];
                    return localDb1.update(localStatus);
                }).then(
                function () {
                    var d = Q.defer();
                    localDb1.db.collection("status").find({}, {sort: {_id: 1}}).toArray(function (err, localStatus) {
                        if (err) {
                            d.reject(err);
                            return;
                        }
                        expect(localStatus).to.have.length(4);

                        expect(localStatus[0]._id).to.eql("completed");
                        expect(localStatus[0].status).to.eql("Completed");
                        expect(localStatus[1]._id).to.eql("fresh");
                        expect(localStatus[1].status).to.eql("Fresh");
                        expect(localStatus[2]._id).to.eql("new");
                        expect(localStatus[2].status).to.eql("Latest");
                        expect(localStatus[3]._id).to.eql("planned");
                        expect(localStatus[3].status).to.eql("Planned");
                        var expectedResult = [
                            {_id: "completed", status: "Completed"},
                            {_id: "fresh", status: "Fresh"},
                            {_id: "new", status: "Latest"},
                            {_id: "planned", status: "Planned"}
                        ]
                        localDb1.query({$collection: "status", $sort: {_id: 1}}).then(
                            function (result) {
                                d.resolve(result);
                            }).fail(function (e) {
                                d.reject(err);
                            });
                    })
                    return d.promise;
                }).then(
                function (statusResult) {
                    expect(statusResult.result).to.have.length(4);

                    expect(statusResult.result[0]._id).to.eql("completed");
                    expect(statusResult.result[0].status).to.eql("Completed");
                    expect(statusResult.result[1]._id).to.eql("fresh");
                    expect(statusResult.result[1].status).to.eql("Fresh");
                    expect(statusResult.result[2]._id).to.eql("new");
                    expect(statusResult.result[2].status).to.eql("Latest");
                    expect(statusResult.result[3]._id).to.eql("planned");
                    expect(statusResult.result[3].status).to.eql("Planned");
                    var expectedResult = [
                        {_id: "completed", status: "Completed"},
                        {_id: "fresh", status: "Fresh"},
                        {_id: "new", status: "Latest"},
                        {_id: "planned", status: "Planned"}
                    ]

                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e)
                });

        })

        it("status override with no status on localdb", function (done) {
            var adminDb = undefined;
            var localDb1 = undefined;
            ApplaneDB.connect(Config.URL, Config.GLOBAL_DB, Config.OPTIONS).then(
                function (adb) {
                    adminDb = adb;
                    return ApplaneDB.connect(Config.URL, localDB1, Config.OPTIONS);
                }).then(
                function (ldb1) {
                    localDb1 = ldb1;
                    var adminStatus = [
                        {
                            $collection: "status",
                            $insert: [
                                {_id: "new", status: "New"},
                                {_id: "inprogress", status: "In progress"},
                                {_id: "completed", status: "Completed"}
                            ]
                        }
                    ];
                    return adminDb.update(adminStatus);
                }).then(
                function () {
                    return localDb1.query({$collection: "status", $sort: {_id: 1}});
                }).then(
                function (statusResult) {

                    expect(statusResult.result).to.have.length(3);

                    expect(statusResult.result[0]._id).to.eql("completed");
                    expect(statusResult.result[0].status).to.eql("Completed");
                    expect(statusResult.result[1]._id).to.eql("inprogress");
                    expect(statusResult.result[1].status).to.eql("In progress");
                    expect(statusResult.result[2]._id).to.eql("new");
                    expect(statusResult.result[2].status).to.eql("New");
                    var expectedResult = [
                        {_id: "new", status: "New"},
                        {_id: "inprogress", status: "In progress"},
                        {_id: "completed", status: "Completed"}
                    ];
                    done();
                }).fail(function (e) {
                    done(e)
                });
        })

        it("status override with status on localdb two level", function (done) {
            var adminDb = undefined;
            var localDb2 = undefined;
            ApplaneDB.connect(Config.URL, Config.GLOBAL_DB, Config.OPTIONS).then(
                function (adb) {
                    adminDb = adb;
                    return ApplaneDB.connect(Config.URL, localDB2, Config.OPTIONS);
                }).then(
                function (ldb2) {
                    localDb2 = ldb2;
                    var adminStatus = [
                        {
                            $collection: "status",
                            $insert: [
                                {_id: "new", status: "New"},
                                {_id: "inprogress", status: "In progress"},
                                {_id: "completed", status: "Completed"}
                            ]
                        }
                    ];
                    return adminDb.update(adminStatus);
                }).then(
                function () {
                    var localStatus = [
                        {
                            $collection: "status",
                            $insert: [
                                {_id: "completed", status: "Completed"},
                                {_id: "fresh", status: "Fresh"},
                                {_id: "new", status: "Latest"},
                                {_id: "planned", status: "Planned"}
                            ],
                            $modules: {MergeLocalAdminDB: 0}
                        }
                    ];
                    return localDb2.update(localStatus);
                }).then(
                function () {
                    var d = Q.defer();
                    localDb2.db.collection("status").find({}, {sort: {_id: 1}}).toArray(function (err, localStatus) {
                        if (err) {
                            d.reject(err);
                            return;
                        }
                        expect(localStatus).to.have.length(4);

                        expect(localStatus[0]._id).to.eql("completed");
                        expect(localStatus[0].status).to.eql("Completed");
                        expect(localStatus[1]._id).to.eql("fresh");
                        expect(localStatus[1].status).to.eql("Fresh");
                        expect(localStatus[2]._id).to.eql("new");
                        expect(localStatus[2].status).to.eql("Latest");
                        expect(localStatus[3]._id).to.eql("planned");
                        expect(localStatus[3].status).to.eql("Planned");
                        var expectedResult = [
                            {_id: "completed", status: "Completed"},
                            {_id: "fresh", status: "Fresh"},
                            {_id: "new", status: "Latest"},
                            {_id: "planned", status: "Planned"}
                        ]
                        localDb2.query({$collection: "status", $sort: {_id: 1}}).then(
                            function (result) {
                                d.resolve(result);
                            }).fail(function (e) {
                                d.reject(err);
                            });
                    })
                    return d.promise;
                }).then(
                function (statusResult) {
                    expect(statusResult.result).to.have.length(4);

                    expect(statusResult.result[0]._id).to.eql("completed");
                    expect(statusResult.result[0].status).to.eql("Completed");
                    expect(statusResult.result[1]._id).to.eql("fresh");
                    expect(statusResult.result[1].status).to.eql("Fresh");
                    expect(statusResult.result[2]._id).to.eql("new");
                    expect(statusResult.result[2].status).to.eql("Latest");
                    expect(statusResult.result[3]._id).to.eql("planned");
                    expect(statusResult.result[3].status).to.eql("Planned");
                    var expectedResult = [
                        {_id: "completed", status: "Completed"},
                        {_id: "fresh", status: "Fresh"},
                        {_id: "new", status: "Latest"},
                        {_id: "planned", status: "Planned"}
                    ]

                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e)
                });

        })

        it("status override with no status on localdb two level", function (done) {
            var adminDb = undefined;
            var localDb2 = undefined;
            ApplaneDB.connect(Config.URL, Config.GLOBAL_DB, Config.OPTIONS).then(
                function (adb) {
                    adminDb = adb;
                    return ApplaneDB.connect(Config.URL, localDB2, Config.OPTIONS);
                }).then(
                function (ldb2) {
                    localDb2 = ldb2;
                    var adminStatus = [
                        {
                            $collection: "status",
                            $insert: [
                                {_id: "new", status: "New"},
                                {_id: "inprogress", status: "In progress"},
                                {_id: "completed", status: "Completed"}
                            ]
                        }
                    ];
                    return adminDb.update(adminStatus);
                }).then(
                function () {
                    return localDb2.query({$collection: "status", $sort: {_id: 1}});
                }).then(
                function (statusResult) {

                    expect(statusResult.result).to.have.length(3);

                    expect(statusResult.result[0]._id).to.eql("completed");
                    expect(statusResult.result[0].status).to.eql("Completed");
                    expect(statusResult.result[1]._id).to.eql("inprogress");
                    expect(statusResult.result[1].status).to.eql("In progress");
                    expect(statusResult.result[2]._id).to.eql("new");
                    expect(statusResult.result[2].status).to.eql("New");
                    var expectedResult = [
                        {_id: "new", status: "New"},
                        {_id: "inprogress", status: "In progress"},
                        {_id: "completed", status: "Completed"}
                    ];
                    done();
                }).fail(function (e) {
                    done(e)
                });
        })

        it("persons override with person on localdb", function (done) {

            var adminDb = undefined;
            var localDb1 = undefined;
            ApplaneDB.connect(Config.URL, Config.GLOBAL_DB, Config.OPTIONS).then(
                function (adb) {
                    adminDb = adb;
                    return ApplaneDB.connect(Config.URL, localDB1, Config.OPTIONS);
                }).then(
                function (ldb1) {
                    localDb1 = ldb1;
                    var adminPersons = [
                        {
                            $collection: "persons",
                            $insert: [
                                {_id: "sachin", name: "sachin", languages: [
                                    {language: "Hindi", read: true, speak: true}
                                ]},
                                {_id: "manjeet", name: "manjeet", status: "Completed", languages: [
                                    {language: "Hindi", read: true, write: true},
                                    {language: "English", read: true, speak: true}
                                ]}
                            ]
                        }
                    ];
                    return adminDb.update(adminPersons);
                }).then(
                function () {
                    var localPersons = [
                        {
                            $collection: "persons",
                            $insert: [
                                {_id: "Ashish", name: "Ashish", languages: [
                                    {language: "Hindi", read: true, speak: true}
                                ]},
                                {_id: "Rohit", name: "Rohit", status: "Completed", languages: [
                                    {language: "Hindi", read: true, write: true},
                                    {language: "English", read: true, speak: true}
                                ]}
                            ],
                            $modules: {MergeLocalAdminDB: 0}
                        }
                    ];
                    return localDb1.update(localPersons);
                }).then(
                function () {
                    return localDb1.query({$collection: "persons", $sort: {_id: 1}});
                }).then(
                function (personResult) {
                    expect(personResult.result).to.have.length(2);

                    expect(personResult.result[0]._id).to.eql("Ashish");
                    expect(personResult.result[0].name).to.eql("Ashish");
                    expect(personResult.result[0].languages).to.have.length(1);
                    expect(personResult.result[0].languages[0].language).to.eql("Hindi");
                    expect(personResult.result[0].languages[0].read).to.eql(true);
                    expect(personResult.result[0].languages[0].speak).to.eql(true);
                    expect(personResult.result[1]._id).to.eql("Rohit");
                    expect(personResult.result[1].name).to.eql("Rohit");
                    expect(personResult.result[1].languages).to.have.length(2);
                    expect(personResult.result[1].languages[0].language).to.eql("Hindi");
                    expect(personResult.result[1].languages[0].read).to.eql(true);
                    expect(personResult.result[1].languages[0].write).to.eql(true);
                    expect(personResult.result[1].languages[1].language).to.eql("English");
                    expect(personResult.result[1].languages[1].read).to.eql(true);
                    expect(personResult.result[1].languages[1].speak).to.eql(true);
                    var expectedResult = {result: [
                        {_id: "Ashish", name: "Ashish", languages: [
                            {language: "Hindi", read: true, speak: true}
                        ]},
                        {_id: "Rohit", name: "Rohit", status: "Completed", languages: [
                            {language: "Hindi", read: true, write: true},
                            {language: "English", read: true, speak: true}
                        ]}
                    ]}
                    done();
                }).fail(function (e) {
                    done(e)
                });


        })

        it("persons override with no person on localdb", function (done) {

            var adminDb = undefined;
            var localDb1 = undefined;
            ApplaneDB.connect(Config.URL, Config.GLOBAL_DB, Config.OPTIONS).then(
                function (adb) {
                    adminDb = adb;
                    return ApplaneDB.connect(Config.URL, localDB1, Config.OPTIONS);
                }).then(
                function (ldb1) {
                    localDb1 = ldb1;
                    var adminPersons = [
                        {
                            $collection: "persons",
                            $insert: [
                                {_id: "sachin", name: "sachin", languages: [
                                    {language: "Hindi", read: true, speak: true}
                                ]},
                                {_id: "manjeet", name: "manjeet", status: "Completed", languages: [
                                    {language: "Hindi", read: true, write: true},
                                    {language: "English", read: true, speak: true}
                                ]}
                            ]
                        }
                    ];
                    return adminDb.update(adminPersons);
                }).then(
                function () {
                    return localDb1.query({$collection: "persons", $sort: {_id: -1}});
                }).then(
                function (personResult) {
                    expect(personResult.result).to.have.length(2);

                    expect(personResult.result[0]._id).to.eql("sachin");
                    expect(personResult.result[0].name).to.eql("sachin");
                    expect(personResult.result[0].languages).to.have.length(1);
                    expect(personResult.result[0].languages[0].language).to.eql("Hindi");
                    expect(personResult.result[0].languages[0].read).to.eql(true);
                    expect(personResult.result[0].languages[0].speak).to.eql(true);
                    expect(personResult.result[1]._id).to.eql("manjeet");
                    expect(personResult.result[1].name).to.eql("manjeet");
                    expect(personResult.result[1].languages).to.have.length(2);
                    expect(personResult.result[1].languages[0].language).to.eql("Hindi");
                    expect(personResult.result[1].languages[0].read).to.eql(true);
                    expect(personResult.result[1].languages[0].write).to.eql(true);
                    expect(personResult.result[1].languages[1].language).to.eql("English");
                    expect(personResult.result[1].languages[1].read).to.eql(true);
                    expect(personResult.result[1].languages[1].speak).to.eql(true);
                    var expectedResult = {result: [
                        {_id: "sachin", name: "sachin", languages: [
                            {language: "Hindi", read: true, speak: true}
                        ]},
                        {_id: "manjeet", name: "manjeet", status: "Completed", languages: [
                            {language: "Hindi", read: true, write: true},
                            {language: "English", read: true, speak: true}
                        ]}
                    ]}
                    done();
                }).fail(function (e) {
                    done(e)
                });


        })

        it("persons override with unwind person on localdb", function (done) {

            var adminDb = undefined;
            var localDb1 = undefined;
            ApplaneDB.connect(Config.URL, Config.GLOBAL_DB, Config.OPTIONS).then(
                function (adb) {
                    adminDb = adb;
                    return ApplaneDB.connect(Config.URL, localDB1, Config.OPTIONS);
                }).then(
                function (ldb1) {
                    localDb1 = ldb1;
                    var adminPersons = [
                        {
                            $collection: "persons",
                            $insert: [
                                {_id: "sachin", name: "sachin", languages: [
                                    {language: "Hindi", read: true, speak: true}
                                ]},
                                {_id: "manjeet", name: "manjeet", status: "Completed", languages: [
                                    {language: "Hindi", read: true, write: true},
                                    {language: "English", read: true, speak: true}
                                ]}
                            ]
                        }
                    ];
                    return adminDb.update(adminPersons);
                }).then(
                function () {
                    var localPersons = [
                        {
                            $collection: "persons",
                            $insert: [
                                {_id: "Ashish", name: "Ashish", languages: [
                                    {language: "Hindi", read: true, speak: true}
                                ]},
                                {_id: "Rohit", name: "Rohit", status: "Completed", languages: [
                                    {language: "Hindi", read: true, write: true},
                                    {language: "English", read: true, speak: true}
                                ]}
                            ],
                            $modules: {MergeLocalAdminDB: 0}
                        }
                    ];
                    return localDb1.update(localPersons);
                }).then(
                function () {
                    return localDb1.query({$collection: "persons", $unwind: ["languages"], $sort: {_id: 1}});
                }).then(
                function (personResult) {
                    expect(personResult.result).to.have.length(3);

                    expect(personResult.result[0]._id).to.eql("Ashish");
                    expect(personResult.result[0].name).to.eql("Ashish");
                    expect(personResult.result[0].languages.language).to.eql("Hindi");
                    expect(personResult.result[0].languages.read).to.eql(true);
                    expect(personResult.result[0].languages.speak).to.eql(true);
                    expect(personResult.result[1]._id).to.eql("Rohit");
                    expect(personResult.result[1].name).to.eql("Rohit");
                    expect(personResult.result[1].languages.language).to.eql("Hindi");
                    expect(personResult.result[1].languages.read).to.eql(true);
                    expect(personResult.result[1].languages.write).to.eql(true);
                    expect(personResult.result[2]._id).to.eql("Rohit");
                    expect(personResult.result[2].name).to.eql("Rohit");
                    expect(personResult.result[2].languages.language).to.eql("English");
                    expect(personResult.result[2].languages.read).to.eql(true);
                    expect(personResult.result[2].languages.speak).to.eql(true);
                    var expectedResult = {"result": [
                        {"_id": "Ashish", "name": "Ashish", "languages": {"language": "Hindi", "read": true, "speak": true}},
                        {"_id": "Rohit", "name": "Rohit", "status": "Completed", "languages": {"language": "Hindi", "read": true, "write": true}},
                        {"_id": "Rohit", "name": "Rohit", "status": "Completed", "languages": {"language": "English", "read": true, "speak": true}}
                    ]}
                    done();
                }).fail(function (e) {
                    done(e)
                });


        })

        it("persons override with unwind no person on localdb", function (done) {

            var adminDb = undefined;
            var localDb1 = undefined;
            ApplaneDB.connect(Config.URL, Config.GLOBAL_DB, Config.OPTIONS).then(
                function (adb) {
                    adminDb = adb;
                    return ApplaneDB.connect(Config.URL, localDB1, Config.OPTIONS);
                }).then(
                function (ldb1) {
                    localDb1 = ldb1;
                    var adminPersons = [
                        {
                            $collection: "persons",
                            $insert: [
                                {_id: "sachin", name: "sachin", languages: [
                                    {language: "Hindi", read: true, speak: true}
                                ]},
                                {_id: "manjeet", name: "manjeet", status: "Completed", languages: [
                                    {language: "Hindi", read: true, write: true},
                                    {language: "English", read: true, speak: true}
                                ]}
                            ]
                        }
                    ];
                    return adminDb.update(adminPersons);
                }).then(
                function () {
                    return localDb1.query({$collection: "persons", $unwind: ["languages"], $sort: {_id: -1}});
                }).then(
                function (personResult) {
                    expect(personResult.result).to.have.length(3);

                    expect(personResult.result[0]._id).to.eql("sachin");
                    expect(personResult.result[0].name).to.eql("sachin");
                    expect(personResult.result[0].languages.language).to.eql("Hindi");
                    expect(personResult.result[0].languages.read).to.eql(true);
                    expect(personResult.result[0].languages.speak).to.eql(true);
                    expect(personResult.result[1]._id).to.eql("manjeet");
                    expect(personResult.result[1].name).to.eql("manjeet");
                    expect(personResult.result[1].languages.language).to.eql("Hindi");
                    expect(personResult.result[1].languages.read).to.eql(true);
                    expect(personResult.result[1].languages.write).to.eql(true);
                    expect(personResult.result[2]._id).to.eql("manjeet");
                    expect(personResult.result[2].name).to.eql("manjeet");
                    expect(personResult.result[2].languages.language).to.eql("English");
                    expect(personResult.result[2].languages.read).to.eql(true);
                    expect(personResult.result[2].languages.speak).to.eql(true);
                    var expectedResult = {"result": [
                        {"_id": "sachin", "name": "sachin", "languages": {"language": "Hindi", "read": true, "speak": true}},
                        {"_id": "manjeet", "name": "manjeet", "status": "Completed", "languages": {"language": "Hindi", "read": true, "write": true}},
                        {"_id": "manjeet", "name": "manjeet", "status": "Completed", "languages": {"language": "English", "read": true, "speak": true}}
                    ]}
                    done();
                }).fail(function (e) {
                    done(e)
                });

        })
    })

})