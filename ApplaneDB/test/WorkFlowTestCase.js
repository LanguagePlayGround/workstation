var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

describe("WorkFlowtestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    });
    beforeEach(function (done) {
        Testcases.beforeEach().then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS);
            }).then(
            function (db1) {
                db = db1;
                // creating users
                var users = [
                    {
                        $collection: "pl.users",
                        $insert: [
                            {
                                username: "Shalini",
                                password: "daffodil",
                                emailid:"shalini@daffodilsw.com"
                            },
                            {
                                username: "Amit.Singh",
                                password: "daffodil",
                                emailid: "amit.singh@daffodilsw.com"
                            },
                            {
                                username: "Rohit.Bansal",
                                password: "daffodil",
                                emailid: "rohit.bansal@daffodilsw.com"
                            },
                            {
                                username: "Sachin.Bansal",
                                password: "daffodil",
                                emailid: "sachin.bansal@daffodilsw.com"
                            }
                        ]
                    }
                ]
                return db.update(users);
            }).then(
            function (result) {
                var users = result["pl.users"]["$insert"];
                // creating employees
                var employees = [
                    {
                        $collection: "employees",
                        $insert: [
                            {
                                name: "Shalini",
                                designation: "HR Manager",
                                user_id: {_id: users[0]._id}
                            },
                            {
                                name: "Amit Singh",
                                designation: "Branch Manager",
                                user_id: {_id: users[1]._id}
                            },
                            {
                                name: "Rohit Bansal",
                                designation: "Team Lead",
                                user_id: {_id: users[2]._id}
                            },
                            {
                                name: "Sachin Bansal",
                                designation: "Associate",
                                user_id: {_id: users[3]._id}
                            }
                        ]
                    }
                ]
                return db.update(employees);
            }).then(
            function () {
                //registering function to invoke onApprove and on reject
                var functionsToRegister = [
                    {
                        name: "WorkFlowFunctions",
                        source: "NorthwindTestCase/lib",
                        type: "js"
                    }
                ]
                return ApplaneDB.registerFunction(functionsToRegister);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    })
    it("holiday calender insert and reject at step1  testcase", function (done) {
        var db = undefined;
        var userDB = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {
                        $collection: "pl.collections",
                        $insert: [
                            {
                                collection: "holidaycalender"
                            }
                        ]
                    },
                    {$collection: "pl.workflowevents", $insert: [
                        {
                            event: "HolidayCalenderRequested",
                            action: "WorkFlowFunctions.onHolidayCalenderRequest",
                            triggerEvent: ["onInsert", "onUpdate"],
                            collectionid: {$query: {collection: "holidaycalender"}}
                        },
                        {
                            event: "HolidayCalenderRequested.Approve",
                            action: "WorkFlowFunctions.onHolidayCalenderRequestApprove",
                            collectionid: {$query: {collection: "holidaycalender"}}
                        },
                        {
                            event: "HolidayCalenderRequested.Reject",
                            action: "WorkFlowFunctions.onHolidayCalenderRequestReject",
                            collectionid: {$query: {collection: "holidaycalender"}}
                        }
                    ]}
                ];
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {
                        $collection: "holidaycalender",
                        $insert: [
                            {
                                name: "Development Team",
                                holidays: [
                                    {
                                        name: "Diwali",
                                        date: "2014-10-25"
                                    },
                                    {
                                        name: "Dusshera",
                                        date: "2014-10-03"
                                    }
                                ],
                                valid_from: "2014-04-01",
                                valid_to: "2014-03-31"
                            }
                        ]
                    }
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "pl.workflow"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].subject).to.eql("Holiday Calender Created");
                expect(result.result[0].owner.username).to.eql("Shalini");
                expect(result.result[0].initiator).to.eql("HolidayCalenderRequested");
                expect(result.result[0].collection).to.eql("holidaycalender");
                expect(result.result[0].status).to.eql("pending");
                expect(result.result[0].event).to.eql("HolidayCalenderRequested");
            }).then(
            function () {
                var updates = [
                    {
                        $collection: "pl.collections",
                        $insert: [
                            {collection: "pl.workflow"}
                        ]
                    },
                    {
                        $collection: {
                            collection: "pl.qviews",
                            fields: [
                                {
                                    field: "id",
                                    type: "string"
                                },
                                {
                                    "field": "collection",
                                    type: "fk",
                                    collection: "pl.collections",
                                    displayField: "collection",
                                    set: ["collection"]
                                },
                                {
                                    "field": "mainCollection",
                                    type: "fk",
                                    collection: "pl.collections",
                                    displayField: "collection",
                                    set: ["collection"]
                                }
                            ]
                        },
                        $insert: [
                            {
                                id: "workflow",
                                collection: {$query: {collection: "pl.workflow"}},
                                mainCollection: {$query: {collection: "pl.workflow"}}
                            }
                        ]
                    }
                ]
                return db.update(updates);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {
                    username: "Shalini",
                    password: "daffodil",
                    ensureDB: true
                });
            }).then(
            function (userDb) {
                userDB = userDb;
                return userDB.invokeFunction("view.getView", [
                    {id: "workflow"}
                ]);
            }).then(
            function (result) {
                expect(result.data.result).to.have.length(1);
                return userDB.invokeFunction("WorkFlow.onApprovalAction", [
                    {
                        _id: result.data.result[0]._id,
                        action: "Reject",
                        "comment": "Holiday Calender is not upto the mark and hence rejected"
                    }
                ]);
            }).then(
            function () {
                return userDB.invokeFunction("view.getView", [
                    {id: "workflow"}
                ]);
            }).then(
            function (result) {
                expect(result.data.result[0].status).to.eql("completed");
                expect(result.data.result[0].approverAction).to.eql("Reject");
                return db.query({"$collection": "holidaycalender"});
            }).then(
            function (data) {

                expect(data.result).to.have.length(1);
                expect(data.result[0].status).to.eql("rejected");
                expect(data.result[0].__approver.username).to.eql("Shalini");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("Leave Request accepted by hrmanager and branch manager", function (done) {
        var db = undefined;
        var userDB = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {
                        $collection: "pl.collections",
                        $insert: [
                            {
                                collection: "leaverequests"
                            },
                            {
                                collection: "pl.workflow"
                            },
                            {
                                collection: "employees"
                            }
                        ]
                    } ,
                    {$collection: "pl.workflowevents", $insert: [
                        {
                            event: "LeaveRequested",
                            action: "WorkFlowFunctions.onLeaveRequest",
                            condition: JSON.stringify({"leavetype": "leave"}),
                            triggerEvent: ["onInsert", "onUpdate"],
                            collectionid: {$query: {collection: "leaverequests"}}
                        },
                        {
                            event: "LeaveRequested.Approve",
                            action: "WorkFlowFunctions.notifyBranchManager",
                            collectionid: {$query: {collection: "leaverequests"}}
                        },
                        {
                            event: "LeaveRequested.Reject",
                            action: "WorkFlowFunctions.onLeaveRequestReject",
                            collectionid: {$query: {collection: "leaverequests"}}
                        },
                        {
                            event: "LeaveRequested.Approve.Approve",
                            action: "WorkFlowFunctions.onLeaveRequestApprove",
                            collectionid: {$query: {collection: "leaverequests"}}
                        },
                        {
                            event: "LeaveRequested.Reject.Reject",
                            action: "WorkFlowFunctions.onLeaveRequestReject",
                            collectionid: {$query: {collection: "leaverequests"}}
                        }
                    ]}
                ];
                return db.update(insert);
            }).then(
            function () {
                var insert = {$collection: "pl.fields", $insert: [
                    {field: "name", type: "string", collectionid: {$query: {"collection": "employees"}}},
                    {field: "leavetype", type: "string", collectionid: {$query: {"collection": "leaverequests"}}},
                    {field: "date", type: "string", collectionid: {$query: {"collection": "leaverequests"}}},
                    {field: "employeeid", type: "fk", collectionid: {$query: {"collection": "leaverequests"}}, collection: "employees", "set": ["name"]}
                ]}
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {
                        $collection: "leaverequests",
                        $insert: [
                            {
                                leavetype: "leave", employeeid: {$query: {name: "Sachin Bansal"}}, reason: "work at home", "date": "2014-12-16"
                            }
                        ]
                    }
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "pl.workflow"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].subject).to.eql("Leave Requested");
                expect(result.result[0].owner.username).to.eql("Shalini");
                expect(result.result[0].initiator).to.eql("LeaveRequested");
                expect(result.result[0].collection).to.eql("leaverequests");
                expect(result.result[0].status).to.eql("pending");
                expect(result.result[0].event).to.eql("LeaveRequested");
            }).then(
            function () {
                var updates = [
                    {
                        $collection: {
                            collection: "pl.qviews",
                            fields: [
                                {
                                    field: "id",
                                    type: "string"
                                },
                                {
                                    "field": "collection",
                                    type: "fk",
                                    collection: "pl.collections",
                                    displayField: "collection",
                                    set: ["collection"]
                                },
                                {
                                    "field": "mainCollection",
                                    type: "fk",
                                    collection: "pl.collections",
                                    displayField: "collection",
                                    set: ["collection"]
                                }
                            ]
                        },
                        $insert: [
                            {
                                id: "workflow",
                                collection: {$query: {collection: "pl.workflow"}},
                                mainCollection: {$query: {collection: "pl.workflow"}}
                            }
                        ]
                    }
                ]
                return db.update(updates);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {
                    username: "Shalini",
                    password: "daffodil",
                    ensureDB: true
                });
            }).then(
            function (userDb) {
                userDB = userDb;
                return userDB.invokeFunction("view.getView", [
                    {id: "workflow"}
                ]);
            }).then(
            function (result) {
                expect(result.data.result).to.have.length(1);
                return userDB.invokeFunction("WorkFlow.onApprovalAction", [   //user accepted or rejected the leave request
                    {
                        _id: result.data.result[0]._id,
                        action: "Approve",
                        "comment": "Leave Approved"
                    }
                ]);
            }).then(
            function () {
                return userDB.invokeFunction("view.getView", [
                    {id: "workflow"}
                ]);
            }).then(
            function (result) {
                expect(result.data.result).to.have.length(2);
                expect(result.data.result[1].status).to.eql("completed");
                expect(result.data.result[1].approverAction).to.eql("Approve");
                expect(result.data.result[1].owner.username).to.eql("Shalini");
                expect(result.data.result[0].status).to.eql("pending");
                expect(result.data.result[0].owner.username).to.eql("Amit.Singh");

            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {
                    username: "Amit.Singh",
                    password: "daffodil",
                    ensureDB: true
                });
            }).then(
            function (userDb) {
                userDB = userDb;
                return userDB.invokeFunction("view.getView", [
                    {id: "workflow"}
                ]);
            }).then(
            function (result) {
                return userDB.invokeFunction("WorkFlow.onApprovalAction", [
                    {
                        _id: result.data.result[0]._id,
                        action: "Approve",
                        "comment": "Leave Approved By branch manager"
                    }
                ]);
            }).then(
            function () {
                return userDB.invokeFunction("view.getView", [
                    {id: "workflow"}
                ]);
            }).then(
            function (result) {
                expect(result.data.result).to.have.length(2);
                expect(result.data.result[1].status).to.eql("completed");
                expect(result.data.result[1].approverAction).to.eql("Approve");
                expect(result.data.result[1].owner.username).to.eql("Shalini");
                expect(result.data.result[0].status).to.eql("completed");
                expect(result.data.result[0].owner.username).to.eql("Amit.Singh");
                expect(result.data.result[0].approverAction).to.eql("Approve");
            }).then(
            function () {
                return db.query({$collection: "leaverequests"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].status).to.eql("Approved");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("Reimbursement Request and approved through mail", function (done) {
        var db = undefined;
        var userAccessToken = undefined;
        var userAccessTokenDB = undefined;
        var userDB = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                db.sendMail = function (mailOptions) {
                    var d = require("q").defer();
                    var html = mailOptions.html;
                    var index = html.indexOf("user_access_token=");
                    html = html.substring(index);
                    index = html.indexOf(">");
                    userAccessToken = html.substring(18, index);
                    d.resolve();
                    return d.promise;
                }

                var insert = [
                    {
                        $collection: "pl.collections",
                        $insert: [
                            {
                                collection: "reimbursements"
                            },
                            {
                                collection: "pl.workflow"
                            },
                            {
                                collection: "employees"
                            }
                        ]
                    } ,
                    {
                        $collection: "pl.workflowevents", $insert: [
                        {
                            event: "ReimbursementRequest",
                            action: "WorkFlowFunctions.onReimbursementRequest",
                            triggerEvent: ["onInsert", "onUpdate"],
                            collectionid: {$query: {collection: "reimbursements"}}
                        },
                        {
                            event: "ReimbursementRequest.Approve",
                            action: "WorkFlowFunctions.sendNotification",
                            collectionid: {$query: {collection: "reimbursements"}}
                        },
                        {
                            event: "ReimbursementRequest.Reject",
                            action: "WorkFlowFunctions.onReimbursementRequestReject",
                            collectionid: {$query: {collection: "reimbursements"}}
                        },
                        {
                            event: "ReimbursementRequest.Approve.Approve",
                            action: "WorkFlowFunctions.onReimbursementRequestApprove",
                            collectionid: {$query: {collection: "reimbursements"}}
                        },
                        {
                            event: "ReimbursementRequest.Reject.Reject",
                            action: "WorkFlowFunctions.onReimbursementRequestReject",
                            collectionid: {$query: {collection: "reimbursements"}}
                        }
                    ]
                    }
                ];
                return db.update(insert);
            }).then(
            function () {
                var insert = {$collection: "pl.fields", $insert: [
                    {field: "name", type: "string", collectionid: {$query: {"collection": "employees"}}},
                    {field: "date", type: "string", collectionid: {$query: {"collection": "reimbursements"}}},
                    {field: "amount", type: "number", collectionid: {$query: {"collection": "reimbursements"}}},
                    {field: "employeeid", type: "fk", collectionid: {$query: {"collection": "reimbursements"}}, collection: "employees", "set": ["name"]}
                ]}
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {
                        $collection: "reimbursements",
                        $insert: [
                            {
                                employeeid: {$query: {name: "Sachin Bansal"}}, reason: "tour to gurgaon", "date": "2014-12-17", "amount": 100
                            }
                        ]
                    }
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "pl.workflow"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].subject).to.eql("Reimbursement Request");
                expect(result.result[0].owner.username).to.eql("Shalini");
                expect(result.result[0].initiator).to.eql("ReimbursementRequest");
                expect(result.result[0].collection).to.eql("reimbursements");
                expect(result.result[0].status).to.eql("pending");
                expect(result.result[0].event).to.eql("ReimbursementRequest");
            }).then(
            function () {
                var updates = [
                    {
                        $collection: {
                            collection: "pl.qviews",
                            fields: [
                                {
                                    field: "id",
                                    type: "string"
                                },
                                {
                                    "field": "collection",
                                    type: "fk",
                                    collection: "pl.collections",
                                    displayField: "collection",
                                    set: ["collection"]
                                },
                                {
                                    "field": "mainCollection",
                                    type: "fk",
                                    collection: "pl.collections",
                                    displayField: "collection",
                                    set: ["collection"]
                                }
                            ]
                        },
                        $insert: [
                            {
                                id: "workflow",
                                collection: {$query: {collection: "pl.workflow"}},
                                mainCollection: {$query: {collection: "pl.workflow"}}
                            }
                        ]
                    }
                ]
                return db.update(updates);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {
                    username: "Shalini",
                    password: "daffodil",
                    ensureDB: true
                });
            }).then(
            function (userDb) {
                userDB = userDb;
                var HTTP = require("../lib/Http.js");
                return HTTP.getDBFromUserAccessToken(userAccessToken, "WorkFlow.onApprovalAction", {});
            }).then(
            function (userAccessTokenDb) {
                userAccessTokenDB = userAccessTokenDb;
                userAccessTokenDB.sendMail = function (mailOptions) {
                    var d = require("q").defer();
                    var html = mailOptions.html;
                    var index = html.indexOf("user_access_token=");
                    html = html.substring(index);
                    index = html.indexOf(">");
                    userAccessToken = html.substring(18, index);
                    d.resolve();
                    return d.promise;
                }
                return userDB.invokeFunction("view.getView", [
                    {id: "workflow"}
                ]);
            }).then(
            function (result) {
                return userAccessTokenDB.invokeFunction("WorkFlow.onApprovalAction", [
                    {"action": "Approve", "_id": result.data.result[0]._id}
                ], {});
            }).then(
            function () {
                return userDB.invokeFunction("view.getView", [
                    {id: "workflow"}
                ]);
            }).then(
            function (result) {
                expect(result.data.result).to.have.length(2);
                expect(result.data.result[1].status).to.eql("completed");
                expect(result.data.result[1].approverAction).to.eql("Approve");
                expect(result.data.result[1].owner.username).to.eql("Shalini");
                expect(result.data.result[0].status).to.eql("pending");
                expect(result.data.result[0].owner.username).to.eql("Amit.Singh");
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {
                    username: "Amit.Singh",
                    password: "daffodil",
                    ensureDB: true
                });
            }).then(
            function (userDb) {
                userDB = userDb;
                return userDB.invokeFunction("view.getView", [
                    {id: "workflow"}
                ]);
            }).then(
            function (result) {
                var HTTP = require("../lib/Http.js");
                return HTTP.getDBFromUserAccessToken(userAccessToken, "WorkFlow.onApprovalAction", {});
            }).then(
            function (userAccessTokenDb) {
                userAccessTokenDB = userAccessTokenDb;

                return userDB.invokeFunction("view.getView", [
                    {id: "workflow"}
                ]);
            }).then(
            function (result) {
                return userAccessTokenDB.invokeFunction("WorkFlow.onApprovalAction", [
                    {"action": "Approve", "_id": result.data.result[0]._id}
                ], {});
            }).then(
            function () {
                return userDB.invokeFunction("view.getView", [
                    {id: "workflow"}
                ]);
            }).then(
            function (result) {
                expect(result.data.result).to.have.length(2);
                expect(result.data.result[1].status).to.eql("completed");
                expect(result.data.result[1].approverAction).to.eql("Approve");
                expect(result.data.result[1].owner.username).to.eql("Shalini");
                expect(result.data.result[0].status).to.eql("completed");
                expect(result.data.result[0].owner.username).to.eql("Amit.Singh");
                expect(result.data.result[0].approverAction).to.eql("Approve");
            }).then(
            function () {
                return db.query({$collection: "reimbursements"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].status).to.eql("approved");
                expect(result.result[0].__events).to.have.length(2);
                expect(result.result[0].__events[0].owner.username).to.eql("Shalini");
                expect(result.result[0].__events[1].owner.username).to.eql("Amit.Singh");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);

            })
    });
    it("trip plan approved", function (done) {
        var db = undefined;
        var userDB = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {
                        $collection: "pl.collections",
                        $insert: [
                            {
                                collection: "triprequest"
                            },
                            {
                                collection: "pl.workflow"
                            },
                            {
                                collection :"employees"
                            }
                        ]
                    } ,
                    {$collection: "pl.workflowevents", $insert: [
                        {
                            event: "triprequest",
                            action: "WorkFlowFunctions.onTripRequest",
                            triggerEvent: ["onInsert"],
                            collectionid: {$query: {collection: "triprequest"}}
                        },
                        {
                            event: "triprequest.Approve",
                            action: "WorkFlowFunctions.onTripRequestAccept",
                            collectionid: {$query: {collection: "triprequest"}}
                        },
                        {
                            event: "triprequest.Reject",
                            action: "WorkFlowFunctions.onTripRequestReject",
                            collectionid: {$query: {collection: "triprequest"}}
                        }
                    ]}
                ];
                return db.update(insert);
            }).then(
            function () {
                var insert = {$collection: "pl.fields", $insert: [
                    {field: "name", type: "string", collectionid: {$query: {"collection": "employees"}}},
                    {field: "employeeid", type: "fk", collectionid: {$query: {"collection": "triprequest"}}, collection: "employees", "set": ["name"]}
                ]}
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {
                        $collection: "triprequest",
                        $insert: [
                            {
                                employeeid: {$query: {name: "Sachin Bansal"}}
                            }
                        ]
                    }
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "pl.workflow"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].subject).to.eql("Trip Requested");
                expect(result.result[0].owner.username).to.eql("Shalini");
                expect(result.result[0].initiator).to.eql("triprequest");
                expect(result.result[0].collection).to.eql("triprequest");
                expect(result.result[0].status).to.eql("pending");
                expect(result.result[0].event).to.eql("triprequest");
            }).then(
            function () {
                var updates = [
                    {
                        $collection: {
                            collection: "pl.qviews",
                            fields: [
                                {
                                    field: "id",
                                    type: "string"
                                },
                                {
                                    "field": "collection",
                                    type: "fk",
                                    collection: "pl.collections",
                                    displayField: "collection",
                                    set: ["collection"]
                                },
                                {
                                    "field": "mainCollection",
                                    type: "fk",
                                    collection: "pl.collections",
                                    displayField: "collection",
                                    set: ["collection"]
                                }
                            ]
                        },
                        $insert: [
                            {
                                id: "workflow",
                                collection: {$query: {collection: "pl.workflow"}},
                                mainCollection: {$query: {collection: "pl.workflow"}}
                            }
                        ]
                    }
                ]
                return db.update(updates);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {
                    username: "Shalini",
                    password: "daffodil",
                    ensureDB: true
                });
            }).then(
            function (userDb) {
                userDB = userDb;
                return userDB.invokeFunction("view.getView", [
                    {id: "workflow"}
                ]);
            }).then(
            function (result) {
                expect(result.data.result).to.have.length(1);
                return userDB.invokeFunction("WorkFlow.onApprovalAction", [   //user accepted or rejected the leave request
                    {
                        _id: result.data.result[0]._id,
                        action: "Approve",
                        "comment": "trip Approved"
                    }
                ]);
            }).then(
            function () {
                return userDB.invokeFunction("view.getView", [
                    {id: "workflow"}
                ]);
            }).then(
            function (result) {
//                console.log("result after aprove the trip>>>>"+JSON.stringify(result));
                expect(result.data.result).to.have.length(1);
                expect(result.data.result[0].status).to.eql("completed");
                expect(result.data.result[0].approverAction).to.eql("Approve");
                expect(result.data.result[0].owner.username).to.eql("Shalini");
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("trip plan Rejected", function (done) {
        var db = undefined;
        var userDB = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {
                        $collection: "pl.collections",
                        $insert: [
                            {
                                collection: "triprequest"
                            },
                            {
                                collection: "pl.workflow"
                            },
                            {
                                collection :"employees"
                            }
                        ]
                    } ,
                    {$collection: "pl.workflowevents", $insert: [
                        {
                            event: "triprequest",
                            action: "WorkFlowFunctions.onTripRequest",
                            triggerEvent: ["onInsert"],
                            collectionid: {$query: {collection: "triprequest"}}
                        },
                        {
                            event: "triprequest.Approve",
                            action: "WorkFlowFunctions.onTripRequestAccept",
                            collectionid: {$query: {collection: "triprequest"}}
                        },
                        {
                            event: "triprequest.Reject",
                            action: "WorkFlowFunctions.onTripRequestReject",
                            collectionid: {$query: {collection: "triprequest"}}
                        }
                    ]}
                ];
                return db.update(insert);
            }).then(function () {
                var insert = {$collection: "pl.fields", $insert: [
                    {field: "name", type: "string", collectionid: {$query: {"collection": "employees"}}},
                    {field: "employeeid", type: "fk", collectionid: {$query: {"collection": "triprequest"}}, collection: "employees", "set": ["name"]}
                ]}
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {
                        $collection: "triprequest",
                        $insert: [
                            {
                                employeeid: {$query: {name: "Sachin Bansal"}}
                            }
                        ]
                    }
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "pl.workflow"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].subject).to.eql("Trip Requested");
                expect(result.result[0].owner.username).to.eql("Shalini");
                expect(result.result[0].initiator).to.eql("triprequest");
                expect(result.result[0].collection).to.eql("triprequest");
                expect(result.result[0].status).to.eql("pending");
                expect(result.result[0].event).to.eql("triprequest");
            }).then(
            function () {
                var updates = [
                    {
                        $collection: {
                            collection: "pl.qviews",
                            fields: [
                                {
                                    field: "id",
                                    type: "string"
                                },
                                {
                                    "field": "collection",
                                    type: "fk",
                                    collection: "pl.collections",
                                    displayField: "collection",
                                    set: ["collection"]
                                },
                                {
                                    "field": "mainCollection",
                                    type: "fk",
                                    collection: "pl.collections",
                                    displayField: "collection",
                                    set: ["collection"]
                                }
                            ]
                        },
                        $insert: [
                            {
                                id: "workflow",
                                collection: {$query: {collection: "pl.workflow"}},
                                mainCollection: {$query: {collection: "pl.workflow"}}
                            }
                        ]
                    }
                ]
                return db.update(updates);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {
                    username: "Shalini",
                    password: "daffodil",
                    ensureDB: true
                });
            }).then(
            function (userDb) {
                userDB = userDb;
                return userDB.invokeFunction("view.getView", [
                    {id: "workflow"}
                ]);
            }).then(
            function (result) {
                expect(result.data.result).to.have.length(1);
                return userDB.invokeFunction("WorkFlow.onApprovalAction", [   //user accepted or rejected the leave request
                    {
                        _id: result.data.result[0]._id,
                        action: "Rejected",
                        "comment": "trip Approved"
                    }
                ]);
            }).then(
            function () {
                return userDB.invokeFunction("view.getView", [
                    {id: "workflow"}
                ]);
            }).then(
            function (result) {
                console.log("result after Rejected the trip>>>>"+JSON.stringify(result.data.result[0].fk._id));
                expect(result.data.result).to.have.length(1);
                expect(result.data.result[0].status).to.eql("completed");
                expect(result.data.result[0].approverAction).to.eql("Rejected");
                expect(result.data.result[0].owner.username).to.eql("Shalini");
                done();
            }).fail(function (err) {
                done(err);
            })
    });
})
