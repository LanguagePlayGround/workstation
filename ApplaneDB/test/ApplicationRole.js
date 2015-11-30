/**
 * mocha --recursive --timeout 150000 -g "roles testcases Below applications" --reporter spec
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var NorthwindDb = require('./NorthwindDb.js');
var Util = require("ApplaneCore/apputil/util.js");
var Testcases = require("./TestCases.js");
var moment = require("moment");

describe("roles testcases Below applications", function () {

    describe("saving and fetching in role", function (done) {
        afterEach(function (done) {
            Testcases.afterEach(done);
        });
        beforeEach(function (done) {
            Testcases.beforeEach(done);
        });

        it('role to check applications and menu in user state', function (done) {
            var db = undefined;
            var admin = undefined;
            var salesUserTaskAdmin = undefined;
            var salesAdminTaskUser = undefined;
            var user = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    var createRoles = {$collection: "pl.roles", $insert: [
                        {id: "SalesAdmin", role: "Sales Admin", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}}
                        ]},
                        {id: "SalesUser", role: "Sales User", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0, primaryFields: true}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "taskowner"},
                                {field: "hrs"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({salesowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "update", sequence: 1, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}) }
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "My Project"}
                            ]}}
                        ]},
                        {id: "TaskAdmin", role: "Task Admin", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "salesowner"},
                                {field: "cost"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({status: "Active"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "remove", sequence: 0, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"})},
                                {type: "update", sequence: 0, fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                    {field: "salesowner"},
                                    {field: "cost"}
                                ]}}
                            ]}, viewsAvailability: "Exclude", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "All Project"}
                            ]}}
                        ]},
                        {id: "TaskUser", role: "Task User", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0, primaryFields: true}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"},
                                {field: "description"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                            ]}}
                        ]}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    return db.query({"$collection": "pl.roles"});
                }).then(
                function (rolesData) {
//                console.log("roles>>>>>>>" + JSON.stringify(rolesData));
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Amit Singh", password: "amitsingh", emailid: "amit@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesAdmin"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskAdmin"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Rohit", password: "rohit", emailid: "rohit@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesUser"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskAdmin"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Sachin", password: "sachin", emailid: "sachin@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesAdmin"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Ritesh", password: "ritesh", emailid: "ritesh@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesUser"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function () {
                    return db.query({"$collection": "pl.users", $modules: {"Role": 0}});
                }).then(
                function (users) {
//                console.log("users>>>>>>" + JSON.stringify(users));
                    var collectionDefination = [
                        {$collection: "pl.applications", $insert: [
                            {id: "SalesManagement", label: "Sales Management"},
                            {id: "TaskManagement", label: "Task Management"},
                            {id: "RevenueManagement", label: "Revenue Management"}
                        ]},
                        {$collection: "pl.collections", $insert: [
                            {collection: "deliveries"},
                            {collection: "projects"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "deliveries"}}},
                            {field: "delivery_no", type: "string", collectionid: {$query: {collection: "deliveries"}}, primary: true} ,
                            {field: "name", type: "string", collectionid: {$query: {collection: "projects"}}, primary: true},
                            {field: "description", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "cost", type: "currency", collectionid: {$query: {collection: "projects"}}},
                            {field: "hrs", type: "duration", collectionid: {$query: {collection: "projects"}}},
                            {field: "salesowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]},
                            {field: "taskowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]}
                        ]},
                        {$collection: "pl.menus", $insert: [
                            {collection: "deliveries", application: {$query: {id: "SalesManagement"}}, label: "Sales Deliveries"},
                            {collection: "projects", application: {$query: {id: "SalesManagement"}}, label: "Sales Projects"},
                            {collection: "deliveries", application: {$query: {id: "TaskManagement"}}, label: "Task Deliveries"},
                            {collection: "projects", application: {$query: {id: "TaskManagement"}}, label: "Task Projects"}
                        ]}
                    ];
                    return db.update(collectionDefination);
                }).then(
                function (collectionData) {
                    var update = [
                        {$collection: "pl.currencies", $insert: {currency: "INR"}},
                        {$collection: "deliveries", $insert: [
                            {name: "d1", delivery_no: "d11"},
                            {name: "d2", delivery_no: "d22"},
                            {name: "d3", delivery_no: "d33"}
                        ]},
                        {$collection: "projects", $insert: [
                            {name: "p1", description: "p1", cost: {amount: 200, type: {$query: {currency: "INR"}}}, hrs: {time: 2, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Amit Singh"}}}
                        ]}
                    ];
                    return db.update(update);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Amit Singh", password: "amitsingh"});
                }).then(
                function (db1) {
                    admin = db1;
                }).then(
                function () {
                    return admin.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
//                console.log("admin UserState>>>>>>>>>>" + JSON.stringify(userState));
                    var applications = userState.applications;
                    expect(applications).to.have.length(2);
                    expect(applications[0].menus).to.have.length(2);
                    expect(applications[0].menus[0].label).to.eql("Sales Deliveries");
                    expect(applications[0].menus[1].label).to.eql("Sales Projects");
                    expect(applications[1].menus).to.have.length(2);
                    expect(applications[1].menus[0].label).to.eql("Task Deliveries");
                    expect(applications[1].menus[1].label).to.eql("Task Projects");
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Rohit", password: "rohit"});
                }).then(
                function (db1) {
                    salesUserTaskAdmin = db1;
                }).then(
                function () {
                    return salesUserTaskAdmin.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
//                console.log("SalesUserTaskAdmin UserState>>>>>>>>>>" + JSON.stringify(userState));
                    var applications = userState.applications;
                    expect(applications).to.have.length(2);
                    expect(applications[0].menus).to.have.length(1);
                    expect(applications[0].menus[0].label).to.eql("Sales Projects");
                    expect(applications[1].menus).to.have.length(2);
                    expect(applications[1].menus[0].label).to.eql("Task Deliveries");
                    expect(applications[1].menus[1].label).to.eql("Task Projects");
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Sachin", password: "sachin"});
                }).then(
                function (db1) {
                    salesAdminTaskUser = db1;
                }).then(
                function () {
                    return salesAdminTaskUser.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
//                console.log("SalesAdminTaskUser UserState>>>>>>>>>>" + JSON.stringify(userState));
                    var applications = userState.applications;
                    expect(applications).to.have.length(2);
                    expect(applications[0].menus).to.have.length(2);
                    expect(applications[0].menus[0].label).to.eql("Sales Deliveries");
                    expect(applications[0].menus[1].label).to.eql("Sales Projects");
                    expect(applications[1].menus).to.have.length(0);
                    //menu length 0 due to taskUser have view:{},does not have rights to see view.
//                expect(applications[1].menus[0].label).to.eql("Task Projects");
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Ritesh", password: "ritesh"});
                }).then(
                function (db1) {
                    user = db1;
                }).then(
                function () {
                    return user.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
//                console.log("user UserState>>>>>>>>>>" + JSON.stringify(userState));
                    var applications = userState.applications;
                    expect(applications).to.have.length(2);
                    expect(applications[0].menus).to.have.length(1);
                    expect(applications[0].menus[0].label).to.eql("Sales Projects");
                    expect(applications[1].menus).to.have.length(0);
//                expect(applications[1].menus[0].label).to.eql("Task Projects");
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });

        it('override menu as role function', function (done) {
            var db = undefined;
            var admin = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    var createApplication = [
                        {"$collection": "pl.applications", "$insert": [
                            {"id": "salary_management", "label": "Salary Management"}
                        ]},
                        {"$collection": "pl.collections", "$insert": [
                            {"collection": "employee_salary"},
                            {"collection": "employee_tasks"},
                            {"collection": "employee_attandance"},
                            {"collection": "employee_address"}
                        ]},
                        {"$collection": "pl.fields", "$insert": [
                            {"field": "name", "type": "string", "collectionid": {"$query": {"collection": "employee_salary"}}},
                            {"field": "salary", "type": "number", "collectionid": {"$query": {"collection": "employee_salary"}}},
                            {"field": "name", "type": "string", "collectionid": {"$query": {"collection": "employee_tasks"}}},
                            {"field": "tasklist", "type": "string", "collectionid": {"$query": {"collection": "employee_tasks"}}},
                            {"field": "name", "type": "string", "collectionid": {"$query": {"collection": "employee_attandance"}}},
                            {"field": "attandance", "type": "number", "collectionid": {"$query": {"collection": "employee_attandance"}}},
                            {"field": "name", "type": "string", "collectionid": {"$query": {"collection": "employee_address"}}},
                            {"field": "address", "type": "string", "collectionid": {"$query": {"collection": "employee_address"}}}
                        ]},
                        {"$collection": "pl.menus", "$insert": [
                            {collection: "employee_salary", application: {$query: {id: "salary_management"}}, label: "Salary Detail"},
                            {collection: "employee_tasks", application: {$query: {id: "salary_management"}}, label: "Task Detail"},
                            {collection: "employee_attandance", application: {$query: {id: "salary_management"}}, label: "Attandance Detail"},
                            {collection: "employee_address", application: {$query: {id: "salary_management"}}, label: "Address Detail"},
                            {application: {$query: {id: "salary_management"}}, label: "Setup"},
                            {collection: "setup_detail1", application: {$query: {id: "salary_management"}}, label: "Setup Detail1", parentmenu: {$query: {label: "Setup", application: {$query: {id: "salary_management"}}}}},
                            {collection: "setup_detail2", application: {$query: {id: "salary_management"}}, label: "Setup Detail2", parentmenu: {$query: {label: "Setup", application: {$query: {id: "salary_management"}}}}},
                        ]
                        }
                    ];
                    return db.update(createApplication);
                }).then(
                function (result) {
                    var createRoles = [
                        {"$collection": "pl.roles", "$insert": [
                            {"id": "HR", "role": "HR"},
                            {"id": "Employee", "role": "Employee", "menusAvailability": "Exclude", "menuInfos": {"$insert": [
                                {menu: {$query: {"label": "Attandance Detail", application: {$query: {id: "salary_management"}}}}},
                                {menu: {$query: {"label": "Address Detail", application: {$query: {id: "salary_management"}}}}}

                            ]}},
                            {"id": "teamleader", "role": "Team Leader", "menusAvailability": "Include", "menuInfos": {"$insert": [
                                {menu: {$query: {"label": "Task Detail", application: {$query: {id: "salary_management"}}}}}
                            ]}},
                            {"id": "teamleader_admin", "role": "Team Leader Admin", "menusAvailability": "Exclude"},
                            {"id": "teamleader_adminuser", "role": "Team Leader User", "menusAvailability": "Include"},
                            {"id": "teamleader_adminuser1", "role": "Team Leader User1", "menusAvailability": "Exclude", "menuInfos": {"$insert": [
                                {menu: {$query: {"label": "Setup", application: {$query: {id: "salary_management"}}}}},
                                {menu: {$query: {"label": "Address Detail", application: {$query: {id: "salary_management"}}}}}

                            ]}},
                            {"id": "teamleader_adminuser2", "role": "Team Leader User2", "menusAvailability": "Exclude", "menuInfos": {"$insert": [
                                {menu: {$query: {"label": "Setup Detail1", application: {$query: {id: "salary_management"}}}}},
                                {menu: {$query: {"label": "Address Detail", application: {$query: {id: "salary_management"}}}}}

                            ]}},
                            {"id": "teamleader_adminuser3", "role": "Team Leader User3", "menusAvailability": "Include", "menuInfos": {"$insert": [
                                {menu: {$query: {"label": "Setup", application: {$query: {id: "salary_management"}}}}},
                                {menu: {$query: {"label": "Setup Detail1", application: {$query: {id: "salary_management"}}}}},
                                {menu: {$query: {"label": "Address Detail", application: {$query: {id: "salary_management"}}}}}

                            ]}},
                            {"id": "teamleader_adminuser4", "role": "Team Leader User4", "menusAvailability": "Include", "menuInfos": {"$insert": [
                                {menu: {$query: {"label": "Setup", application: {$query: {id: "salary_management"}}}}},
                                {menu: {$query: {"label": "Address Detail", application: {$query: {id: "salary_management"}}}}}

                            ]}}
                        ]}
                    ];
                    return db.update(createRoles);
                }).then(
                function (result) {
                    var createUsers = [
                        {"$collection": "pl.users", "$insert": {"username": "mohit", "password": "jain", "emailid": "mohit.jain@daffodilsw.com", "roles": [
                            {role: {$query: {id: "Employee"}}, appid: "salary_management"}
                        ]}},
                        {"$collection": "pl.users", "$insert": {"username": "amit", "password": "bansal", "emailid": "amit.bansal@daffodilsw.com", "roles": [
                            {role: {$query: {id: "HR"}}, appid: "salary_management"}
                        ]}},
                        {"$collection": "pl.users", "$insert": {"username": "sachin", "password": "bansal", "emailid": "sachin.bansal@daffodilsw.com", "roles": [
                            {role: {$query: {id: "teamleader"}}, appid: "salary_management"}
                        ]}},
                        {"$collection": "pl.users", "$insert": {"username": "sachin1", "password": "bansal", "emailid": "sachin.bansal1@daffodilsw.com", "roles": [
                            {role: {$query: {id: "teamleader_admin"}}, appid: "salary_management"}
                        ]}},
                        {"$collection": "pl.users", "$insert": {"username": "sachin2", "password": "bansal", "emailid": "sachin.bansal2@daffodilsw.com", "roles": [
                            {role: {$query: {id: "teamleader_adminuser"}}, appid: "salary_management"}
                        ]}},
                        {"$collection": "pl.users", "$insert": {"username": "sachin3", "password": "bansal", "emailid": "sachin.bansal3@daffodilsw.com", "roles": [
                            {role: {$query: {id: "teamleader_adminuser1"}}, appid: "salary_management"}
                        ]}},
                        {"$collection": "pl.users", "$insert": {"username": "sachin4", "password": "bansal", "emailid": "sachin.bansal4@daffodilsw.com", "roles": [
                            {role: {$query: {id: "teamleader_adminuser2"}}, appid: "salary_management"}
                        ]}},
                        {"$collection": "pl.users", "$insert": {"username": "sachin5", "password": "bansal", "emailid": "sachin.bansal5@daffodilsw.com", "roles": [
                            {role: {$query: {id: "teamleader_adminuser3"}}, appid: "salary_management"}
                        ]}},
                        {"$collection": "pl.users", "$insert": {"username": "sachin6", "password": "bansal", "emailid": "sachin.bansal6@daffodilsw.com", "roles": [
                            {role: {$query: {id: "teamleader_adminuser4"}}, appid: "salary_management"}
                        ]}}
                    ];
                    return db.update(createUsers);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "amit", password: "bansal"});
                }).then(
                function (db1) {
                    return db1.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var applications = userState.applications;
                    expect(applications).to.have.length(1);
                    expect(applications[0].menus).to.have.length(5);
                    var menus = applications[0].menus;
                    Util.sort(menus, "asc", "label");
                    expect(menus[0].label).to.eql("Address Detail");
                    expect(menus[1].label).to.eql("Attandance Detail");
                    expect(menus[2].label).to.eql("Salary Detail");
                    expect(menus[3].label).to.eql("Setup");
                    expect(menus[3].menus).to.have.length(2);
                    expect(menus[3].menus[0].label).to.eql("Setup Detail1");
                    expect(menus[3].menus[1].label).to.eql("Setup Detail2");
                    expect(menus[4].label).to.eql("Task Detail");
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "sachin1", password: "bansal"});
                }).then(
                function (db1) {
                    return db1.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var applications = userState.applications;
                    expect(applications).to.have.length(1);
                    expect(applications[0].menus).to.have.length(5);
                    var menus = applications[0].menus;
                    Util.sort(menus, "asc", "label");
                    expect(menus[0].label).to.eql("Address Detail");
                    expect(menus[1].label).to.eql("Attandance Detail");
                    expect(menus[2].label).to.eql("Salary Detail");
                    expect(menus[3].label).to.eql("Setup");
                    expect(menus[3].menus).to.have.length(2);
                    expect(menus[3].menus[0].label).to.eql("Setup Detail1");
                    expect(menus[3].menus[1].label).to.eql("Setup Detail2");
                    expect(menus[4].label).to.eql("Task Detail");
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "sachin2", password: "bansal"});
                }).then(
                function (db1) {
                    return db1.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var applications = userState.applications;
                    expect(applications).to.have.length(1);
                    expect(applications[0].menus).to.have.length(0);
                }).then(
                function (result) {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "mohit", password: "jain"});
                }).then(
                function (db1) {
                    return db1.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var applications = userState.applications;
                    expect(applications).to.have.length(1);
                    expect(applications[0].menus).to.have.length(3);
                    var menus = applications[0].menus;
                    Util.sort(menus, "asc", "label");
                    expect(menus[0].label).to.eql("Salary Detail");
                    expect(menus[1].label).to.eql("Setup");
                    expect(menus[1].menus).to.have.length(2);
                    expect(menus[1].menus[0].label).to.eql("Setup Detail1");
                    expect(menus[1].menus[1].label).to.eql("Setup Detail2");
                    expect(menus[2].label).to.eql("Task Detail");
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "sachin", password: "bansal"});
                }).then(
                function (db1) {
                    return db1.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var applications = userState.applications;
                    expect(applications).to.have.length(1);
                    expect(applications[0].menus).to.have.length(1);
                    expect(applications[0].menus[0].label).to.eql("Task Detail");
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "sachin3", password: "bansal"});
                }).then(
                function (db1) {
                    return db1.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var applications = userState.applications;
                    expect(applications).to.have.length(1);
                    expect(applications[0].menus).to.have.length(3);
                    var menus = applications[0].menus;
                    Util.sort(menus, "asc", "label");
                    expect(menus[0].label).to.eql("Attandance Detail");
                    expect(menus[1].label).to.eql("Salary Detail");
                    expect(menus[2].label).to.eql("Task Detail");
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "sachin4", password: "bansal"});
                }).then(
                function (db1) {
                    return db1.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var applications = userState.applications;
                    expect(applications).to.have.length(1);
                    expect(applications[0].menus).to.have.length(4);
                    var menus = applications[0].menus;
                    Util.sort(menus, "asc", "label");
                    expect(menus[0].label).to.eql("Attandance Detail");
                    expect(menus[1].label).to.eql("Salary Detail");
                    expect(menus[2].label).to.eql("Setup");
                    expect(menus[2].menus).to.have.length(1);
                    expect(menus[2].menus[0].label).to.eql("Setup Detail2");
                    expect(menus[3].label).to.eql("Task Detail");
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "sachin5", password: "bansal"});
                }).then(
                function (db1) {
                    return db1.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var applications = userState.applications;
                    expect(applications).to.have.length(1);
                    expect(applications[0].menus).to.have.length(2);
                    var menus = applications[0].menus;
                    Util.sort(menus, "asc", "label");
                    expect(menus[0].label).to.eql("Address Detail");
                    expect(menus[1].label).to.eql("Setup");
                    expect(menus[1].menus).to.have.length(1);
                    expect(menus[1].menus[0].label).to.eql("Setup Detail1");
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "sachin6", password: "bansal"});
                }).then(
                function (db1) {
                    return db1.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var applications = userState.applications;
                    expect(applications).to.have.length(1);
                    expect(applications[0].menus).to.have.length(1);
                    var menus = applications[0].menus;
                    Util.sort(menus, "asc", "label");
                    expect(menus[0].label).to.eql("Address Detail");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                });
        });


        it('child menus hide with collection privilege', function (done) {
            var db = undefined;
            var admin = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    var createApplication = [
                        {"$collection": "pl.applications", "$insert": [
                            {"id": "salary_management", "label": "Salary Management"}
                        ]},
                        {"$collection": "pl.collections", "$insert": [
                            {"collection": "employee_salary"},
                            {"collection": "employee_tasks"},
                            {"collection": "employee_attandance"},
                            {"collection": "employee_address"},
                            {"collection": "setup_detail1"},
                            {"collection": "setup_detail2"}
                        ]},
                        {"$collection": "pl.fields", "$insert": [
                            {"field": "name", "type": "string", "collectionid": {"$query": {"collection": "employee_salary"}}},
                            {"field": "salary", "type": "number", "collectionid": {"$query": {"collection": "employee_salary"}}},
                            {"field": "name", "type": "string", "collectionid": {"$query": {"collection": "employee_tasks"}}},
                            {"field": "tasklist", "type": "string", "collectionid": {"$query": {"collection": "employee_tasks"}}},
                            {"field": "name", "type": "string", "collectionid": {"$query": {"collection": "employee_attandance"}}},
                            {"field": "attandance", "type": "number", "collectionid": {"$query": {"collection": "employee_attandance"}}},
                            {"field": "name", "type": "string", "collectionid": {"$query": {"collection": "employee_address"}}},
                            {"field": "address", "type": "string", "collectionid": {"$query": {"collection": "employee_address"}}},
                            {"field": "name", "type": "string", "collectionid": {"$query": {"collection": "setup_detail1"}},primary:true},
                            {"field": "age", "type": "string", "collectionid": {"$query": {"collection": "setup_detail1"}}},
                            {"field": "name", "type": "string", "collectionid": {"$query": {"collection": "setup_detail2"}},primary:true},
                            {"field": "age", "type": "string", "collectionid": {"$query": {"collection": "setup_detail2"}}},
                        ]},
                        {"$collection": "pl.menus", "$insert": [
                            {collection: "employee_salary", application: {$query: {id: "salary_management"}}, label: "Salary Detail"},
                            {collection: "employee_tasks", application: {$query: {id: "salary_management"}}, label: "Task Detail"},
                            {collection: "employee_attandance", application: {$query: {id: "salary_management"}}, label: "Attandance Detail"},
                            {collection: "employee_address", application: {$query: {id: "salary_management"}}, label: "Address Detail"},
                            {collection:"",application: {$query: {id: "salary_management"}}, label: "Setup"},
                            {collection: "setup_detail1", application: {$query: {id: "salary_management"}}, label: "Setup Detail1", parentmenu: {$query: {label: "Setup", application: {$query: {id: "salary_management"}}}}},
                            {collection: "setup_detail2", application: {$query: {id: "salary_management"}}, label: "Setup Detail2", parentmenu: {$query: {label: "Setup", application: {$query: {id: "salary_management"}}}}},
                        ]
                        }
                    ];
                    return db.update(createApplication);
                }).then(
                function (result) {
                    var createRoles = [
                        {"$collection": "pl.roles", "$insert": [
                            {"id": "HR", "role": "HR", privileges: [
                                {type: "Collection", collection: "setup_detail1", operationInfos: {$insert: [
                                    {type: "find", sequence: 0, primaryFields: true}
                                ]}},
                                {type: "Collection", collection: "employee_salary", operationInfos: {$insert: [
                                    {type: "find", sequence: 0},
                                    {type: "insert", sequence: 0},
                                    {type: "update", sequence: 0},
                                    {type: "remove", sequence: 0}
                                ]}},
                                {type: "Collection", collection: "employee_tasks", operationInfos: {$insert: [
                                    {type: "find", sequence: 0},
                                    {type: "insert", sequence: 0},
                                    {type: "update", sequence: 0},
                                    {type: "remove", sequence: 0}
                                ]}},
                                {type: "Collection", collection: "employee_attandance", operationInfos: {$insert: [
                                    {type: "find", sequence: 0},
                                    {type: "insert", sequence: 0},
                                    {type: "update", sequence: 0},
                                    {type: "remove", sequence: 0}
                                ]}},   {type: "Collection", collection: "employee_address", operationInfos: {$insert: [
                                    {type: "find", sequence: 0},
                                    {type: "insert", sequence: 0},
                                    {type: "update", sequence: 0},
                                    {type: "remove", sequence: 0}
                                ]}},
                                {type: "Collection", collection: "setup_detail2", operationInfos: {$insert: [
                                    {type: "find", sequence: 0},
                                    {type: "insert", sequence: 0},
                                    {type: "update", sequence: 0},
                                    {type: "remove", sequence: 0}
                                ]}},
                                {type: "collection", collection:"",operationInfos: {$insert: [
                                    {type: "find", primaryFields: true}
                                ]}}

                            ]}
                        ]}
                    ];
                    return db.update(createRoles);
                }).then(
                function (result) {
                    var createUsers = [
                        {"$collection": "pl.users", "$insert": {"username": "sachin", "password": "bansal", "emailid": "sachin.bansal@daffodilsw.com", "roles": [
                            {role: {$query: {id: "HR"}}, appid: "salary_management"}
                        ]}}
                    ];
                    return db.update(createUsers);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "sachin", password: "bansal"});
                }).then(
                function (db1) {
                    return db1.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var applications = userState.applications;
                    expect(applications).to.have.length(1);
                    expect(applications[0].menus).to.have.length(5);
                    var menus = applications[0].menus;
                    Util.sort(menus, "asc", "label");
                    expect(menus[0].label).to.eql("Address Detail");
                    expect(menus[1].label).to.eql("Attandance Detail");
                    expect(menus[2].label).to.eql("Salary Detail");
                    expect(menus[3].label).to.eql("Setup");
                    expect(menus[3].menus).to.have.length(1);
                    expect(menus[3].menus[0].label).to.eql("Setup Detail2");
                    expect(menus[4].label).to.eql("Task Detail");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e.stack);
                });
        });

        it('role to check qview in menu in user state', function (done) {
            var db = undefined;
            var admin = undefined;
            var salesUserTaskAdmin = undefined;
            var salesAdminTaskUser = undefined;
            var user = undefined;
            var taskManagementId = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    var createRoles = {$collection: "pl.roles", $insert: [
                        {id: "SalesAdmin", role: "Sales Admin", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}}
                        ]},
                        {id: "SalesUser", role: "Sales User", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0, primaryFields: true}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "taskowner"},
                                {field: "hrs"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({salesowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "update", sequence: 1, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}) }
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "My Project"}
                            ]}}
                        ]},
                        {id: "TaskAdmin", role: "Task Admin", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "salesowner"},
                                {field: "cost"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({status: "Active"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "remove", sequence: 0, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"})},
                                {type: "update", sequence: 0, fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                    {field: "salesowner"},
                                    {field: "cost"},
                                    {field: "hrs"}
                                ]}}
                            ]}, viewsAvailability: "Exclude", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "All Project"}
                            ]}}
                        ]},
                        {id: "TaskUser", role: "Task User", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0, primaryFields: true}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"},
                                {field: "description"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                            ]}}
                        ]}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    return db.query({"$collection": "pl.roles"});
                }).then(
                function (rolesData) {
//                console.log("roles>>>>>>>" + JSON.stringify(rolesData));
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Amit Singh", password: "amitsingh", emailid: "amit@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesAdmin"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskAdmin"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Rohit", password: "rohit", emailid: "rohit@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesUser"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskAdmin"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Sachin", password: "sachin", emailid: "sachin@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesAdmin"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Ritesh", password: "ritesh", emailid: "ritesh@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesUser"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function () {
                    return db.query({"$collection": "pl.users", $modules: {"Role": 0}});
                }).then(
                function (users) {
//                console.log("users>>>>>>" + JSON.stringify(users));
                    var collectionDefination = [
                        {$collection: "pl.applications", $insert: [
                            {id: "SalesManagement", label: "Sales Management"},
                            {id: "TaskManagement", label: "Task Management"},
                            {id: "RevenueManagement", label: "Revenue Management"}
                        ]},
                        {$collection: "pl.collections", $insert: [
                            {collection: "deliveries"},
                            {collection: "projects"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "deliveries"}}},
                            {field: "delivery_no", type: "string", collectionid: {$query: {collection: "deliveries"}}, primary: true} ,
                            {field: "name", type: "string", collectionid: {$query: {collection: "projects"}}, primary: true},
                            {field: "description", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "cost", type: "currency", collectionid: {$query: {collection: "projects"}}},
                            {field: "hrs", type: "duration", collectionid: {$query: {collection: "projects"}}},
                            {field: "salesowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]},
                            {field: "taskowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]}
                        ]},
                        {$collection: "pl.qviews", $insert: [
                            {id: "Sales Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "Sales Project"},
                            {id: "My Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "My Project"},
                            {id: "All Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "All Project"},
                            {id: "Task Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "Task Project"}
                        ]},
                        {$collection: "pl.menus", $insert: [
//                        {collection:"deliveries", application:{$query:{id:"SalesManagement"}}, label:"Sales Deliveries"},
                            {collection: "projects", application: {$query: {id: "SalesManagement"}}, label: "Sales Projects", qviews: {$insert: [
                                {id: "Sales Project", collection: "projects", label: "Sales Project"},
                                {id: "My Project", collection: "projects", label: "My Project"},
                                {id: "Task Project", collection: "projects", label: "Task Project"},
                                {id: "All Project", collection: "projects", label: "All Project"}
                            ]}},
//                        {collection:"deliveries", application:{$query:{id:"TaskManagement"}}, label:"Task Deliveries"},
                            {collection: "projects", application: {$query: {id: "TaskManagement"}}, label: "Task Projects", qviews: {$insert: [
                                {id: "Sales Project", collection: "projects", label: "Sales Project"},
                                {id: "My Project", collection: "projects", label: "My Project"},
                                {id: "Task Project", collection: "projects", label: "Task Project"},
                                {id: "All Project", collection: "projects", label: "All Project"}
                            ]}}
                        ]}
                    ];
                    return db.update(collectionDefination);
                }).then(
                function (collectionData) {
                    var update = [
                        {$collection: "pl.currencies", $insert: {currency: "INR"}},
                        {$collection: "deliveries", $insert: [
                            {name: "d1", delivery_no: "d11"},
                            {name: "d2", delivery_no: "d22"},
                            {name: "d3", delivery_no: "d33"}
                        ]},
                        {$collection: "projects", $insert: [
                            {name: "p1", description: "p1", cost: {amount: 200, type: {$query: {currency: "INR"}}}, hrs: {time: 2, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Amit Singh"}}}
                        ]}
                    ];
                    return db.update(update);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Amit Singh", password: "amitsingh"});
                }).then(
                function (db1) {
                    admin = db1;
                }).then(
                function () {
                    return admin.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
//                console.log("admin UserState>>>>>>>>>>" + JSON.stringify(userState));
                    var qviews = userState.qviews;
                    expect(qviews).to.have.length(4);
                    expect(qviews[0].id).to.eql("Sales Project");
                    expect(qviews[1].id).to.eql("My Project");
                    expect(qviews[2].id).to.eql("Task Project");
                    expect(qviews[3].id).to.eql("All Project");
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Rohit", password: "rohit"});
                }).then(
                function (db1) {
                    salesUserTaskAdmin = db1;
                }).then(
                function () {
                    return salesUserTaskAdmin.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
//                console.log("SalesUserTaskAdmin UserState>>>>>>>>>>" + JSON.stringify(userState));
                    var qviews = userState.qviews;
                    expect(qviews).to.have.length(2);
                    expect(qviews[0].id).to.eql("Sales Project");
                    expect(qviews[1].id).to.eql("My Project");
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Sachin", password: "sachin"});
                }).then(
                function (db1) {
                    salesAdminTaskUser = db1;
                }).then(
                function () {
                    return salesAdminTaskUser.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
//                console.log("SalesAdminTaskUser UserState>>>>>>>>>>" + JSON.stringify(userState));
                    var qviews = userState.qviews;
                    expect(qviews).to.have.length(4);
                    expect(qviews[0].id).to.eql("Sales Project");
                    expect(qviews[1].id).to.eql("My Project");
                    expect(qviews[2].id).to.eql("Task Project");
                    expect(qviews[3].id).to.eql("All Project");
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Ritesh", password: "ritesh"});
                }).then(
                function (db1) {
                    user = db1;
                }).then(
                function () {
                    return user.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
//                console.log("user UserState>>>>>>>>>>" + JSON.stringify(userState));
                    var qviews = userState.qviews;
                    expect(qviews).to.have.length(2);
                    expect(qviews[0].id).to.eql("Sales Project");
                    expect(qviews[1].id).to.eql("My Project");
                })
                .then(
                function () {
                    return db.query({$collection: "pl.applications", $filter: {id: "TaskManagement"}});
                }).then(
                function (result) {
                    taskManagementId = result.result[0]._id;
                }).then(
                function () {
                    return db.update({$collection: "pl.users", $update: {_id: admin.user._id, $set: {state: {$set: {selectedapplication: taskManagementId.toString()}}}}})
                }).then(
                function (result) {
                    return db.update({$collection: "pl.users", $update: {_id: salesUserTaskAdmin.user._id, $set: {state: {$set: {selectedapplication: taskManagementId.toString()}}}}})
                }).then(
                function () {
                    return db.update({$collection: "pl.users", $update: {_id: salesAdminTaskUser.user._id, $set: {state: {$set: {selectedapplication: taskManagementId.toString()}}}}})
                }).then(
                function () {
                    return db.update({$collection: "pl.users", $update: {_id: user.user._id, $set: {state: {$set: {selectedapplication: taskManagementId.toString()}}}}})
                }).then(
                function () {
                    return admin.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
//                console.log("admin UserState>>>>>>>>>>" + JSON.stringify(userState));
                    var qviews = userState.qviews;
                    expect(qviews).to.have.length(2);
                    expect(qviews[0].id).to.eql("My Project");
                    expect(qviews[1].id).to.eql("Task Project");
                }).then(
                function () {
                    return salesUserTaskAdmin.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var qviews = userState.qviews;
                    expect(qviews).to.have.length(2);
                    expect(qviews[0].id).to.eql("My Project");
                    expect(qviews[1].id).to.eql("Task Project");
                }).then(
                function () {
                    return salesAdminTaskUser.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var qviews = userState.qviews;
                    expect(qviews).to.eql(undefined);
                }).then(
                function () {
                    return user.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var qviews = userState.qviews;
                    expect(qviews).to.eql(undefined);
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });

        it('role to check field,actions in view', function (done) {
            var db = undefined;
            var admin = undefined;
            var salesUserTaskAdmin = undefined;
            var salesAdminTaskUser = undefined;
            var user = undefined;
            var taskManagementId = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    var createRoles = {$collection: "pl.roles", $insert: [
                        {id: "SalesAdmin", role: "Sales Admin", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}}
                        ]},
                        {id: "SalesUser", role: "Sales User", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0, primaryFields: true}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "taskowner"},
                                {field: "hrs"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({salesowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "update", sequence: 1, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}) }
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "My Project"}
                            ]}}
                        ]},
                        {id: "TaskAdmin", role: "Task Admin", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "salesowner"},
                                {field: "cost"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({status: "Active"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "remove", sequence: 0, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"})},
                                {type: "update", sequence: 0, fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                    {field: "salesowner"},
                                    {field: "cost"},
                                    {field: "hrs"}
                                ]}}
                            ]}, viewsAvailability: "Exclude", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "All Project"}
                            ]}}
                        ]},
                        {id: "TaskUser", role: "Task User", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0, primaryFields: true}
                            ]}},
                            {type: "Collection", collection: "projects", actionsAvailability: "Exclude", actionInfos: {$insert: [
                                {action: "addTask"}
                            ]}, fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"},
                                {field: "description"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                            ]}}
                        ]}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    return db.query({"$collection": "pl.roles"});
                }).then(
                function (rolesData) {
//                console.log("roles>>>>>>>" + JSON.stringify(rolesData));
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Amit Singh", password: "amitsingh", emailid: "amit@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesAdmin"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskAdmin"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Rohit", password: "rohit", emailid: "rohit@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesUser"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskAdmin"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Sachin", password: "sachin", emailid: "sachin@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesAdmin"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Ritesh", password: "ritesh", emailid: "ritesh@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesUser"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function () {
                    return db.query({"$collection": "pl.users", $modules: {"Role": 0}});
                }).then(
                function (users) {
//                console.log("users>>>>>>" + JSON.stringify(users));
                    var collectionDefination = [
                        {$collection: "pl.applications", $insert: [
                            {id: "SalesManagement", label: "Sales Management"},
                            {id: "TaskManagement", label: "Task Management"},
                            {id: "RevenueManagement", label: "Revenue Management"}
                        ]},
                        {$collection: "pl.collections", $insert: [
                            {collection: "deliveries"},
                            {collection: "projects"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "deliveries"}}},
                            {field: "delivery_no", type: "string", collectionid: {$query: {collection: "deliveries"}}, primary: true} ,
                            {field: "name", type: "string", collectionid: {$query: {collection: "projects"}}, primary: true},
                            {field: "description", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "cost", type: "currency", collectionid: {$query: {collection: "projects"}}},
                            {field: "hrs", type: "duration", collectionid: {$query: {collection: "projects"}}},
                            {field: "salesowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]},
                            {field: "taskowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]}
                        ]},
                        {$collection: "pl.qviews", $insert: [
                            {id: "Sales Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "Sales Project"},
                            {id: "My Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "My Project"},
                            {id: "All Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "All Project"},
                            {id: "Task Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "Task Project"}
                        ]},
                        {$collection: "pl.actions", $insert: [
                            {id: "addTask", type: "invoke", collectionid: {$query: {collection: "projects"}}, label: "addTask", visibility: true},
                            {id: "addProgres", type: "invoke", collectionid: {$query: {collection: "projects"}}, label: "addProgres", visibility: true}
                        ]},
                        {$collection: "pl.menus", $insert: [
//                        {collection:"deliveries", application:{$query:{id:"SalesManagement"}}, label:"Sales Deliveries"},
                            {collection: "projects", application: {$query: {id: "SalesManagement"}}, label: "Sales Projects", qviews: {$insert: [
                                {id: "Sales Project", collection: "projects", label: "Sales Project"},
                                {id: "My Project", collection: "projects", label: "My Project"},
                                {id: "Task Project", collection: "projects", label: "Task Project"},
                                {id: "All Project", collection: "projects", label: "All Project"}
                            ]}},
//                        {collection:"deliveries", application:{$query:{id:"TaskManagement"}}, label:"Task Deliveries"},
                            {collection: "projects", application: {$query: {id: "TaskManagement"}}, label: "Task Projects", qviews: {$insert: [
                                {id: "Sales Project", collection: "projects", label: "Sales Project"},
                                {id: "My Project", collection: "projects", label: "My Project"},
                                {id: "Task Project", collection: "projects", label: "Task Project"},
                                {id: "All Project", collection: "projects", label: "All Project"}
                            ]}}
                        ]}
                    ];
                    return db.update(collectionDefination);
                }).then(
                function (collectionData) {
                    var update = [
                        {$collection: "pl.currencies", $insert: {currency: "INR"}},
                        {$collection: "deliveries", $insert: [
                            {name: "d1", delivery_no: "d11"},
                            {name: "d2", delivery_no: "d22"},
                            {name: "d3", delivery_no: "d33"}
                        ]},
                        {$collection: "projects", $insert: [
                            {name: "p1", description: "p1", cost: {amount: 200, type: {$query: {currency: "INR"}}}, hrs: {time: 2, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Amit Singh"}}}
                        ]}
                    ];
                    return db.update(update);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Amit Singh", password: "amitsingh"});
                }).then(
                function (db1) {
                    admin = db1;
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Rohit", password: "rohit"});
                }).then(
                function (db1) {
                    salesUserTaskAdmin = db1;
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Sachin", password: "sachin"});
                }).then(
                function (db1) {
                    salesAdminTaskUser = db1;
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Ritesh", password: "ritesh"});
                }).then(
                function (db1) {
                    user = db1;
                }).then(
                function () {
                    return db.query({$collection: "pl.applications", $filter: {id: "TaskManagement"}});
                }).then(
                function (result) {
                    taskManagementId = result.result[0]._id;
                }).then(
                function () {
                    return db.update({$collection: "pl.users", $update: {_id: admin.user._id, $set: {state: {$set: {selectedapplication: taskManagementId.toString()}}}}})
                }).then(
                function (result) {
                    return db.update({$collection: "pl.users", $update: {_id: salesUserTaskAdmin.user._id, $set: {state: {$set: {selectedapplication: taskManagementId.toString()}}}}})
                }).then(
                function () {
                    return db.update({$collection: "pl.users", $update: {_id: salesAdminTaskUser.user._id, $set: {state: {$set: {selectedapplication: taskManagementId.toString()}}}}})
                }).then(
                function () {
                    return db.update({$collection: "pl.users", $update: {_id: user.user._id, $set: {state: {$set: {selectedapplication: taskManagementId.toString()}}}}})
                }).then(
                function () {
                    return admin.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
//                console.log("admin UserState>>>>>>>>>>" + JSON.stringify(userState));
                    var viewOptions = userState.views[0].viewOptions;
                    var fields = viewOptions.fields;
                    //two field salesowner,cost will be removed due to find
                    // one field hrs have editable false due to false in update
                    expect(fields).to.have.length(5);
                    expect(fields[1].field).to.eql("hrs");
                    expect(fields[1].editableWhen).to.eql("false");
                }).then(
                function () {
                    salesUserTaskAdmin.setContext({__role__: "TaskAdmin"})
                    return salesUserTaskAdmin.invokeFunction("view.getView", [
                        {id: "Task Project"}
                    ]);
                }).then(
                function (view) {
                    var viewOptions = view.viewOptions;
                    var fields = viewOptions.fields;
                    //two field salesowner,cost will be removed due to find
                    // one field hrs have editable false due to false in update
                    expect(fields).to.have.length(5);
                    expect(fields[1].field).to.eql("hrs");
                    expect(fields[1].editableWhen).to.eql("false");
                }).then(
                function () {
                    return salesAdminTaskUser.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function () {
                    user.setContext({__role__: "TaskUser"})
                    return user.invokeFunction("view.getView", [
                        {id: "Task Project"}
                    ]);
                }).then(
                function (view) {
//                console.log("admin UserState>>>>>>>>>>" + JSON.stringify(view));
                    var viewOptions = view.viewOptions;
                    var fields = viewOptions.fields;
                    //two field salesowner,cost will be removed due to find
                    // one field hrs have editable false due to false in update
                    expect(fields).to.have.length(2);
                    expect(fields[0].field).to.eql("description");
                    expect(fields[1].field).to.eql("name");
                    expect(viewOptions.insert).to.eql(false);
                    expect(viewOptions.edit).to.eql(false);
                    expect(viewOptions.delete).to.eql(false);
                    expect(viewOptions.actions).to.have.length(1);
                    expect(viewOptions.actions[0].id).to.eql("addProgres");    //addTask action removed due to role.
//                    expect(viewOptions.actions[1].id).to.eql("Role");
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });

        it('role to check find', function (done) {
            var db = undefined;
            var admin = undefined;
            var salesUserTaskAdmin = undefined;
            var salesAdminTaskUser = undefined;
            var user = undefined;
            var taskManagementId = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    var createRoles = {$collection: "pl.roles", $insert: [
                        {id: "SalesAdmin", role: "Sales Admin", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}}
                        ]},
                        {id: "SalesUser", role: "Sales User", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0, primaryFields: true}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "taskowner"},
                                {field: "hrs"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({salesowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "update", sequence: 1, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}) }
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "My Project"}
                            ]}}
                        ]},
                        {id: "TaskAdmin", role: "Task Admin", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "salesowner"},
                                {field: "cost"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({status: "Active"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "remove", sequence: 0, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"})},
                                {type: "update", sequence: 0, fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                    {field: "salesowner"},
                                    {field: "cost"},
                                    {field: "hrs"}
                                ]}}
                            ]}, viewsAvailability: "Exclude", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "All Project"}
                            ]}}
                        ]},
                        {id: "TaskUser", role: "Task User", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0, primaryFields: true}
                            ]}},
                            {type: "Collection", collection: "projects", actionsAvailability: "Exclude", actionInfos: {$insert: [
                                {action: "addTask"}
                            ]}, fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"},
                                {field: "description"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                            ]}}
                        ]}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    return db.query({"$collection": "pl.roles"});
                }).then(
                function (rolesData) {
//                console.log("roles>>>>>>>" + JSON.stringify(rolesData));
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Amit Singh", password: "amitsingh", emailid: "amit@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesAdmin"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskAdmin"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Rohit", password: "rohit", emailid: "rohit@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesUser"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskAdmin"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Sachin", password: "sachin", emailid: "sachin@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesAdmin"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Ritesh", password: "ritesh", emailid: "ritesh@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesUser"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function () {
                    return db.query({"$collection": "pl.users", $modules: {"Role": 0}});
                }).then(
                function (users) {
//                console.log("users>>>>>>" + JSON.stringify(users));
                    var collectionDefination = [
                        {$collection: "pl.applications", $insert: [
                            {id: "SalesManagement", label: "Sales Management"},
                            {id: "TaskManagement", label: "Task Management"},
                            {id: "RevenueManagement", label: "Revenue Management"}
                        ]},
                        {$collection: "pl.collections", $insert: [
                            {collection: "deliveries"},
                            {collection: "projects"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "deliveries"}}},
                            {field: "delivery_no", type: "string", collectionid: {$query: {collection: "deliveries"}}, primary: true} ,
                            {field: "name", type: "string", collectionid: {$query: {collection: "projects"}}, primary: true},
                            {field: "description", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "cost", type: "currency", collectionid: {$query: {collection: "projects"}}},
                            {field: "hrs", type: "duration", collectionid: {$query: {collection: "projects"}}},
                            {field: "salesowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]},
                            {field: "taskowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]}
                        ]},
                        {$collection: "pl.qviews", $insert: [
                            {id: "Sales Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "Sales Project"},
                            {id: "My Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "My Project"},
                            {id: "All Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "All Project"},
                            {id: "Task Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "Task Project"}
                        ]},
                        {$collection: "pl.actions", $insert: [
                            {id: "addTask", type: "invoke", collectionid: {$query: {collection: "projects"}}, label: "addTask", visibility: true},
                            {id: "addProgres", type: "invoke", collectionid: {$query: {collection: "projects"}}, label: "addProgres", visibility: true}
                        ]},
                        {$collection: "pl.menus", $insert: [
//                        {collection:"deliveries", application:{$query:{id:"SalesManagement"}}, label:"Sales Deliveries"},
                            {collection: "projects", application: {$query: {id: "SalesManagement"}}, label: "Sales Projects", qviews: {$insert: [
                                {id: "Sales Project", collection: "projects", label: "Sales Project"},
                                {id: "My Project", collection: "projects", label: "My Project"},
                                {id: "Task Project", collection: "projects", label: "Task Project"},
                                {id: "All Project", collection: "projects", label: "All Project"}
                            ]}},
//                        {collection:"deliveries", application:{$query:{id:"TaskManagement"}}, label:"Task Deliveries"},
                            {collection: "projects", application: {$query: {id: "TaskManagement"}}, label: "Task Projects", qviews: {$insert: [
                                {id: "Sales Project", collection: "projects", label: "Sales Project"},
                                {id: "My Project", collection: "projects", label: "My Project"},
                                {id: "Task Project", collection: "projects", label: "Task Project"},
                                {id: "All Project", collection: "projects", label: "All Project"}
                            ]}}
                        ]}
                    ];
                    return db.update(collectionDefination);
                }).then(
                function (collectionData) {
                    var update = [
                        {$collection: "pl.currencies", $insert: {currency: "INR"}},
                        {$collection: "deliveries", $insert: [
                            {name: "d1", delivery_no: "d11"},
                            {name: "d2", delivery_no: "d22"},
                            {name: "d3", delivery_no: "d33"}
                        ]},
                        {$collection: "projects", $insert: [
                            {name: "p1", description: "p1", status: "Active", cost: {amount: 200, type: {$query: {currency: "INR"}}}, hrs: {time: 2, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Amit Singh"}}},
                            {name: "p2", description: "p2", status: "Active", cost: {amount: 500, type: {$query: {currency: "INR"}}}, hrs: {time: 4, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Rohit"}}},
                            {name: "p3", description: "p3", status: "Inactive", cost: {amount: 200, type: {$query: {currency: "INR"}}}, hrs: {time: 5, unit: "Hrs"}, salesowner: {$query: {username: "Sachin"}}, taskowner: {$query: {username: "Rohit"}}},
                            {name: "p4", description: "p4", status: "Active", cost: {amount: 100, type: {$query: {currency: "INR"}}}, hrs: {time: 1, unit: "Hrs"}, salesowner: {$query: {username: "Sachin"}}, taskowner: {$query: {username: "Sachin"}}},
                            {name: "p5", description: "p5", status: "Inactive", cost: {amount: 50, type: {$query: {currency: "INR"}}}, hrs: {time: 0.5, unit: "Hrs"}, salesowner: {$query: {username: "Rohit"}}, taskowner: {$query: {username: "Rohit"}}},
                            {name: "p6", description: "p6", status: "Inactive", cost: {amount: 1000, type: {$query: {currency: "INR"}}}, hrs: {time: 2, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Ritesh"}}},
                            {name: "p7", description: "p7", status: "Active", cost: {amount: 250, type: {$query: {currency: "INR"}}}, hrs: {time: 4, unit: "Hrs"}, salesowner: {$query: {username: "Sachin"}}, taskowner: {$query: {username: "Ritesh"}}},
                            {name: "p8", description: "p8", status: "Active", cost: {amount: 400, type: {$query: {currency: "INR"}}}, hrs: {time: 6, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Amit Singh"}}},
                            {name: "p9", description: "p9", status: "Active", cost: {amount: 300, type: {$query: {currency: "INR"}}}, hrs: {time: 7, unit: "Hrs"}, salesowner: {$query: {username: "Rohit"}}, taskowner: {$query: {username: "Amit Singh"}}},
                            {name: "p91", description: "p91", status: "Inactive", cost: {amount: 100, type: {$query: {currency: "INR"}}}, hrs: {time: 0, unit: "Hrs"}, salesowner: {$query: {username: "Rohit"}}, taskowner: {$query: {username: "Sachin"}}},
                            {name: "p92", description: "p92", status: "Inactive", cost: {amount: 500, type: {$query: {currency: "INR"}}}, hrs: {time: 1, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Amit Singh"}}},
                            {name: "p93", description: "p93", status: "Active", cost: {amount: 200, type: {$query: {currency: "INR"}}}, hrs: {time: 6, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Sachin"}}}
                        ]}
                    ];
                    return db.update(update);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Amit Singh", password: "amitsingh"});
                }).then(
                function (db1) {
                    admin = db1;
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Rohit", password: "rohit"});
                }).then(
                function (db1) {
                    salesUserTaskAdmin = db1;
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Sachin", password: "sachin"});
                }).then(
                function (db1) {
                    salesAdminTaskUser = db1;
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Ritesh", password: "ritesh"});
                }).then(
                function (db1) {
                    user = db1;
                }).then(
                function () {
                    admin.setContext({__role__: "SalesAdmin"});
                    return admin.query({$collection: "projects"});
                }).then(
                function (result) {
                    result = result.result;
                    expect(result).to.have.length(12);
                }).then(
                function () {
                    admin.setContext({__role__: "TaskAdmin"});
                    return admin.query({$collection: "projects"});
                }).then(
                function (result) {
                    result = result.result;
                    expect(result).to.have.length(7);
                    expect(result[0].status).to.eql("Active");
                    expect(result[1].status).to.eql("Active");
                    expect(result[2].status).to.eql("Active");
                    expect(result[3].status).to.eql("Active");
                    expect(result[4].status).to.eql("Active");
                    expect(result[5].status).to.eql("Active");
                    expect(result[6].status).to.eql("Active");
                }).then(
                function () {
                    salesUserTaskAdmin.setContext({__role__: "SalesUser"});
                    return salesUserTaskAdmin.query({$collection: "projects"});
                }).then(
                function (result) {
                    result = result.result;
                    expect(result).to.have.length(3);
                    expect(result[0].salesowner.username).to.eql("Rohit");
                    expect(result[1].salesowner.username).to.eql("Rohit");
                    expect(result[2].salesowner.username).to.eql("Rohit");
                }).then(
                function () {
                    salesUserTaskAdmin.setContext({__role__: "TaskAdmin"});
                    return salesUserTaskAdmin.query({$collection: "projects"});
                }).then(
                function (result) {
                    result = result.result;
                    expect(result).to.have.length(7);
                    expect(result[0].status).to.eql("Active");
                    expect(result[1].status).to.eql("Active");
                    expect(result[2].status).to.eql("Active");
                    expect(result[3].status).to.eql("Active");
                    expect(result[4].status).to.eql("Active");
                    expect(result[5].status).to.eql("Active");
                    expect(result[6].status).to.eql("Active");
                }).then(
                function () {
                    user.setContext({__role__: "SalesUser"});
                    return user.query({$collection: "projects"});
                }).then(
                function (result) {
                    result = result.result;
                    expect(result).to.have.length(0);
                }).then(
                function () {
                    user.setContext({__role__: "TaskUser"});
                    return user.query({$collection: "projects"});
                }).then(
                function (result) {
                    result = result.result;
                    expect(result).to.have.length(2);
                    expect(result[0].name).to.eql("p6");
                    expect(result[0].taskowner).to.eql(undefined);
                    expect(result[1].name).to.eql("p7");
                    expect(result[1].taskowner).to.eql(undefined);
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });

        it('role to check insert/update/remove', function (done) {
            var db = undefined;
            var admin = undefined;
            var salesUserTaskAdmin = undefined;
            var salesAdminTaskUser = undefined;
            var user = undefined;
            var taskManagementId = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    var createRoles = {$collection: "pl.roles", $insert: [
                        {id: "SalesAdmin", role: "Sales Admin", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}}
                        ]},
                        {id: "SalesUser", role: "Sales User", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0, primaryFields: true}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "taskowner"},
                                {field: "hrs"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({salesowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "update", sequence: 1, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}) }
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "My Project"}
                            ]}}
                        ]},
                        {id: "TaskAdmin", role: "Task Admin", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "salesowner"},
                                {field: "cost"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({status: "Active"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "remove", sequence: 0, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"})},
                                {type: "update", sequence: 0, fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                    {field: "salesowner"},
                                    {field: "cost"},
                                    {field: "hrs"}
                                ]}}
                            ]}, viewsAvailability: "Exclude", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "All Project"}
                            ]}}
                        ]},
                        {id: "TaskUser", role: "Task User", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0, primaryFields: true}
                            ]}},
                            {type: "Collection", collection: "projects", actionsAvailability: "Exclude", actionInfos: {$insert: [
                                {action: "addTask"}
                            ]}, fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"},
                                {field: "description"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                            ]}}
                        ]}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    return db.query({"$collection": "pl.roles"});
                }).then(
                function (rolesData) {
//                console.log("roles>>>>>>>" + JSON.stringify(rolesData));
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Amit Singh", password: "amitsingh", emailid: "amit@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesAdmin"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskAdmin"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Rohit", password: "rohit", emailid: "rohit@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesUser"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskAdmin"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Sachin", password: "sachin", emailid: "sachin@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesAdmin"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Ritesh", password: "ritesh", emailid: "ritesh@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesUser"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function () {
                    return db.query({"$collection": "pl.users", $modules: {"Role": 0}});
                }).then(
                function (users) {
//                console.log("users>>>>>>" + JSON.stringify(users));
                    var collectionDefination = [
                        {$collection: "pl.applications", $insert: [
                            {id: "SalesManagement", label: "Sales Management"},
                            {id: "TaskManagement", label: "Task Management"},
                            {id: "RevenueManagement", label: "Revenue Management"}
                        ]},
                        {$collection: "pl.collections", $insert: [
                            {collection: "deliveries"},
                            {collection: "projects"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "deliveries"}}},
                            {field: "delivery_no", type: "string", collectionid: {$query: {collection: "deliveries"}}, primary: true} ,
                            {field: "name", type: "string", collectionid: {$query: {collection: "projects"}}, primary: true},
                            {field: "description", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "cost", type: "currency", collectionid: {$query: {collection: "projects"}}},
                            {field: "hrs", type: "duration", collectionid: {$query: {collection: "projects"}}},
                            {field: "salesowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]},
                            {field: "taskowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]}
                        ]},
                        {$collection: "pl.qviews", $insert: [
                            {id: "Sales Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "Sales Project"},
                            {id: "My Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "My Project"},
                            {id: "All Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "All Project"},
                            {id: "Task Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "Task Project"}
                        ]},
                        {$collection: "pl.actions", $insert: [
                            {id: "addTask", type: "invoke", collectionid: {$query: {collection: "projects"}}, label: "addTask", visibility: true},
                            {id: "addProgres", type: "invoke", collectionid: {$query: {collection: "projects"}}, label: "addProgres", visibility: true}
                        ]},
                        {$collection: "pl.menus", $insert: [
//                        {collection:"deliveries", application:{$query:{id:"SalesManagement"}}, label:"Sales Deliveries"},
                            {collection: "projects", application: {$query: {id: "SalesManagement"}}, label: "Sales Projects", qviews: {$insert: [
                                {id: "Sales Project", collection: "projects", label: "Sales Project"},
                                {id: "My Project", collection: "projects", label: "My Project"},
                                {id: "Task Project", collection: "projects", label: "Task Project"},
                                {id: "All Project", collection: "projects", label: "All Project"}
                            ]}},
//                        {collection:"deliveries", application:{$query:{id:"TaskManagement"}}, label:"Task Deliveries"},
                            {collection: "projects", application: {$query: {id: "TaskManagement"}}, label: "Task Projects", qviews: {$insert: [
                                {id: "Sales Project", collection: "projects", label: "Sales Project"},
                                {id: "My Project", collection: "projects", label: "My Project"},
                                {id: "Task Project", collection: "projects", label: "Task Project"},
                                {id: "All Project", collection: "projects", label: "All Project"}
                            ]}}
                        ]}
                    ];
                    return db.update(collectionDefination);
                }).then(
                function (collectionData) {
                    var update = [
                        {$collection: "pl.currencies", $insert: {currency: "INR"}},
                        {$collection: "deliveries", $insert: [
                            {name: "d1", delivery_no: "d11"},
                            {name: "d2", delivery_no: "d22"},
                            {name: "d3", delivery_no: "d33"}
                        ]},
                        {$collection: "projects", $insert: [
                            {name: "p1", description: "p1", status: "Active", cost: {amount: 200, type: {$query: {currency: "INR"}}}, hrs: {time: 2, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Amit Singh"}}},
                            {_id: "p2", name: "p2", description: "p2", status: "Active", cost: {amount: 500, type: {$query: {currency: "INR"}}}, hrs: {time: 4, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Rohit"}}},
                            {name: "p3", description: "p3", status: "Inactive", cost: {amount: 200, type: {$query: {currency: "INR"}}}, hrs: {time: 5, unit: "Hrs"}, salesowner: {$query: {username: "Sachin"}}, taskowner: {$query: {username: "Rohit"}}},
                            {name: "p4", description: "p4", status: "Active", cost: {amount: 100, type: {$query: {currency: "INR"}}}, hrs: {time: 1, unit: "Hrs"}, salesowner: {$query: {username: "Sachin"}}, taskowner: {$query: {username: "Sachin"}}},
                            {_id: "p5", name: "p5", description: "p5", status: "Inactive", cost: {amount: 50, type: {$query: {currency: "INR"}}}, hrs: {time: 0.5, unit: "Hrs"}, salesowner: {$query: {username: "Rohit"}}, taskowner: {$query: {username: "Rohit"}}},
                            {name: "p6", description: "p6", status: "Inactive", cost: {amount: 1000, type: {$query: {currency: "INR"}}}, hrs: {time: 2, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Ritesh"}}},
                            {_id: "p7", name: "p7", description: "p7", status: "Active", cost: {amount: 250, type: {$query: {currency: "INR"}}}, hrs: {time: 4, unit: "Hrs"}, salesowner: {$query: {username: "Sachin"}}, taskowner: {$query: {username: "Ritesh"}}},
                            {name: "p8", description: "p8", status: "Active", cost: {amount: 400, type: {$query: {currency: "INR"}}}, hrs: {time: 6, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Amit Singh"}}},
                            {name: "p9", description: "p9", status: "Active", cost: {amount: 300, type: {$query: {currency: "INR"}}}, hrs: {time: 7, unit: "Hrs"}, salesowner: {$query: {username: "Rohit"}}, taskowner: {$query: {username: "Amit Singh"}}},
                            {name: "p91", description: "p91", status: "Inactive", cost: {amount: 100, type: {$query: {currency: "INR"}}}, hrs: {time: 0, unit: "Hrs"}, salesowner: {$query: {username: "Rohit"}}, taskowner: {$query: {username: "Sachin"}}},
                            {name: "p92", description: "p92", status: "Inactive", cost: {amount: 500, type: {$query: {currency: "INR"}}}, hrs: {time: 1, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Amit Singh"}}},
                            {name: "p93", description: "p93", status: "Active", cost: {amount: 200, type: {$query: {currency: "INR"}}}, hrs: {time: 6, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Sachin"}}}
                        ]}
                    ];
                    return db.update(update);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Amit Singh", password: "amitsingh"});
                }).then(
                function (db1) {
                    admin = db1;
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Rohit", password: "rohit"});
                }).then(
                function (db1) {
                    salesUserTaskAdmin = db1;
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Sachin", password: "sachin"});
                }).then(
                function (db1) {
                    salesAdminTaskUser = db1;
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Ritesh", password: "ritesh"});
                }).then(
                function (db1) {
                    user = db1;
                }).then(
                function () {
                    admin.setContext({__role__: "SalesAdmin"});
                    return admin.update({$collection: "projects", $insert: [
                        {name: "p93", description: "p94", status: "Active", cost: {amount: 200, type: {$query: {currency: "INR"}}}, hrs: {time: 6, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Sachin"}}}
                    ], $update: [
                        {_id: "p7", $set: {description: "p77"}}
                    ], $delete: [
                        {$query: {name: "p9"}}
                    ]});
                }).then(
                function () {
                    admin.setContext({__role__: "TaskAdmin"});
                    return admin.update({$collection: "projects", $insert: [
                        {name: "p93", description: "p5", status: "Active", cost: {amount: 200, type: {$query: {currency: "INR"}}}, hrs: {time: 6, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Sachin"}}}
                    ], $update: [
                        {_id: "p7", $set: {description: "p77"}}
                    ], $delete: [
                        {$query: {name: "p8"}}
                    ]});
                }).then(
                function () {
                    return admin.update({$collection: "projects", $update: [
                        {_id: "p7", $set: {cost: {amount: "5000", type: {$query: {currency: "INR"}}}}}
                    ]}).then(
                        function () {
                            throw new Error("Not Ok.");
                        }).fail(function (err) {
                            if (err.toString().indexOf("Does not have sufficient privileges to update record in collection [projects] with fields [\"cost\"]") === -1) {
                                throw err;
                            }
                        })
                }).then(
                function () {
                    salesUserTaskAdmin.setContext({__role__: "SalesUser"});
                    return salesUserTaskAdmin.update({$collection: "projects", $insert: [
                        {name: "p93", description: "p94", status: "Active", cost: {amount: 200, type: {$query: {currency: "INR"}}}, hrs: {time: 6, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Sachin"}}}
                    ]}).then(
                        function () {
                            throw new Error("Not Ok.");
                        }).fail(function (err) {
                            if (err.toString().indexOf("Does not have sufficient privileges to insert record in collection [projects]") === -1) {
                                throw err;
                            }
                        })
                }).then(
                function () {
                    return salesUserTaskAdmin.update({$collection: "projects", $delete: [
                        {$query: {name: "p5"}}
                    ]}).then(
                        function () {
                            throw new Error("Not Ok.");
                        }).fail(function (err) {
                            if (err.toString().indexOf("Does not have sufficient privileges to delete record in collection [projects]") === -1) {
                                throw err;
                            }
                        });
                }).then(
                function () {
                    return salesUserTaskAdmin.update({$collection: "projects", $update: [
                        {_id: "p2", $set: {description: "p22"}}
                    ]}).then(
                        function () {
                            throw new Error("Not Ok.");
                        }).fail(function (err) {
                            if (err.toString().indexOf("Result not found for collection [projects]") === -1) {
                                throw err;
                            }
                        });
                }).then(
                function () {
                    return salesUserTaskAdmin.update({$collection: "projects", $update: [
                        {_id: "p5", $set: {description: "p55"}}
                    ]})
                }).then(
                function () {
                    salesUserTaskAdmin.setContext({__role__: "TaskAdmin"});
                    return salesUserTaskAdmin.update({$collection: "projects", $insert: [
                        {name: "p96", description: "p96", status: "Active", cost: {amount: 200, type: {$query: {currency: "INR"}}}, hrs: {time: 6, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Sachin"}}}
                    ]})
                }).then(
                function () {
                    return salesUserTaskAdmin.update({$collection: "projects", $delete: [
                        {$query: {name: "p1"}}
                    ]}).then(
                        function () {
                            throw new Error("Not Ok.");
                        }).fail(function (err) {
                            if (err.toString().indexOf("Does not have sufficient privileges to delete record in collection [projects]") === -1) {
                                throw err;
                            }
                        });
                }).then(
                function () {
                    //Record not deleted and no error occurs bcz record not found for delete.
                    return salesUserTaskAdmin.update({$collection: "projects", $delete: [
                        {$query: {name: "p6"}}
                    ]})
                }).then(
                function () {
                    return salesUserTaskAdmin.update({$collection: "projects", $update: [
                        {_id: "p2", $set: {description: "p22"}}
                    ]})
                }).then(
                function () {
                    return salesUserTaskAdmin.update({$collection: "projects", $update: [
                        {_id: "p5", $set: {description: "p55"}}
                    ]}).then(
                        function () {
                            throw new Error("Not Ok.");
                        }).fail(function (err) {
                            if (err.toString().indexOf("Result not found for collection [projects]") === -1) {
                                throw err;
                            }
                        });
                }).then(
                function () {
                    user.setContext({__role__: "TaskUser"});
                    return user.update({$collection: "projects", $insert: [
                        {name: "p93", description: "p94", status: "Active", cost: {amount: 200, type: {$query: {currency: "INR"}}}, hrs: {time: 6, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Sachin"}}}
                    ]}).fail(function (err) {
                        if (err.toString().indexOf("Does not have sufficient privileges to insert record in collection [projects]") === -1) {
                            throw err;
                        }
                    })
                }).then(
                function () {
                    return user.update({$collection: "projects", $delete: [
                        {$query: {name: "p5"}}
                    ]}).fail(function (err) {
                        if (err.toString().indexOf("Does not have sufficient privileges to delete record in collection [projects]") === -1) {
                            throw err;
                        }
                    });
                }).then(
                function () {
                    return user.update({$collection: "projects", $update: [
                        {_id: "p5", $set: {description: "p55"}}
                    ]}).fail(function (err) {
                        if (err.toString().indexOf("Result not found for collection [projects]") === -1) {
                            throw err;
                        }
                    });
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });

        it('role to check Default application creation', function (done) {
            var db = undefined;
            var admin = undefined;
            var salesUserTaskAdmin = undefined;
            var salesAdminTaskUser = undefined;
            var user = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    return addRolePrivileges(db);
                }).then(
                function () {
                    var collectionDefination = [
                        {$collection: "pl.applications", $insert: [
                            {id: "SalesManagement", label: "Sales Management", newRole: true},
                            {id: "TaskManagement", label: "Task Management", newRole: true},
                            {id: "RevenueManagement", label: "Revenue Management", newRole: true}
                        ]},
                        {$collection: "pl.collections", $insert: [
                            {collection: "deliveries"},
                            {collection: "projects"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "deliveries"}}},
                            {field: "delivery_no", type: "string", collectionid: {$query: {collection: "deliveries"}}, primary: true} ,
                            {field: "name", type: "string", collectionid: {$query: {collection: "projects"}}, primary: true},
                            {field: "description", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "cost", type: "currency", collectionid: {$query: {collection: "projects"}}},
                            {field: "hrs", type: "duration", collectionid: {$query: {collection: "projects"}}},
                            {field: "salesowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]},
                            {field: "taskowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]}
                        ]},
                        {$collection: "pl.menus", $insert: [
                            {collection: "deliveries", application: {$query: {id: "SalesManagement"}}, label: "Sales Deliveries"},
                            {collection: "projects", application: {$query: {id: "SalesManagement"}}, label: "Sales Projects"},
                            {collection: "deliveries", application: {$query: {id: "TaskManagement"}}, label: "Task Deliveries"},
                            {collection: "projects", application: {$query: {id: "TaskManagement"}}, label: "Task Projects"}
                        ]}
                    ];
                    return db.update(collectionDefination);
                }).then(
                function (rolesData) {
//                console.log("roles>>>>>>>" + JSON.stringify(rolesData));
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Amit Singh", password: "amitsingh", emailid: "amit@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesManagement"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskManagement"}}, appid: "TaskManagement"}
                        ]}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function (collectionData) {
                    var update = [
                        {$collection: "pl.currencies", $insert: {currency: "INR"}},
                        {$collection: "deliveries", $insert: [
                            {name: "d1", delivery_no: "d11"},
                            {name: "d2", delivery_no: "d22"},
                            {name: "d3", delivery_no: "d33"}
                        ]},
                        {$collection: "projects", $insert: [
                            {name: "p1", description: "p1", cost: {amount: 200, type: {$query: {currency: "INR"}}}, hrs: {time: 2, unit: "Hrs"}, salesowner: {$query: {username: "Amit Singh"}}, taskowner: {$query: {username: "Amit Singh"}}}
                        ]}
                    ];
                    return db.update(update);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Amit Singh", password: "amitsingh"});
                }).then(
                function (db1) {
                    admin = db1;
                }).then(
                function () {
                    admin.setContext({__role__: "SalesManagement"});
                    return admin.query({$collection: "deliveries", $fields: {name: 1, delivery_no: 1}});
                }).then(
                function (result) {
                    expect(result.result).to.have.length(3);
                    expect(result.result[0].name).to.eql(undefined);
                    expect(result.result[0].delivery_no).to.eql("d11");
                    expect(result.result[1].name).to.eql(undefined);
                    expect(result.result[1].delivery_no).to.eql("d22");
                    expect(result.result[2].name).to.eql(undefined);
                    expect(result.result[2].delivery_no).to.eql("d33");
                }).then(
                function () {
                    return db.query({$collection: "pl.roles", $filter: {id: "TaskManagement"}});
                }).then(
                function (result) {
                    return db.update({$collection: "pl.roles", $update: {_id: result.result[0]._id, $set: {privileges: {$insert: [
                        {type: "Collection", collection: "deliveries", operationInfos: [
                            {type: "find"}
                        ]}
                    ]}}}})
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Amit Singh", password: "amitsingh"});
                }).then(
                function (db1) {
                    admin = db1;
                }).then(
                function () {
                    admin.setContext({__role__: "TaskManagement"});
                    return admin.query({$collection: "deliveries", $fields: {name: 1, delivery_no: 1}});
                }).then(
                function (result) {
                    expect(result.result).to.have.length(3);
                    expect(result.result[0].name).to.eql("d1");
                    expect(result.result[0].delivery_no).to.eql("d11");
                    expect(result.result[1].name).to.eql("d2");
                    expect(result.result[1].delivery_no).to.eql("d22");
                    expect(result.result[2].name).to.eql("d3");
                    expect(result.result[2].delivery_no).to.eql("d33");
                }).then(
                function () {
                    return db.query({$collection: "pl.roles", $filter: {id: "SalesManagement"}});
                }).then(
                function (result) {
                    result = result.result;
                    var role = result[0];
                    expect(role.id).to.eql("SalesManagement");
                    expect(role.applicationid).to.eql("SalesManagement");
                    expect(role.role).to.eql("Sales Management");
                    expect(role.default).to.eql(true);
                    expect(role.privileges).to.have.length(3);
                    expect(role.privileges[0].type).to.eql("Privilege");
                    expect(role.privileges[0].collection).to.eql("^pl\\.");
                    expect(role.privileges[0].operationInfos).to.have.length(4);
                    expect(role.privileges[1].type).to.eql("Privilege");
                    expect(role.privileges[1].collection).to.eql("pl.users");
                    expect(role.privileges[2].type).to.eql("Privilege");
                    expect(role.privileges[2].collection).to.eql("");
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });

        it('role to check extend role privileges', function (done) {
            var db = undefined;
            var admin = undefined;
            var salesUserTaskAdmin = undefined;
            var salesAdminTaskUser = undefined;
            var user = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    var rolePrivileges = [
                        {id: "HR Employee", type: "Collection", collection: "employees", operationInfos: {$insert: [
                            {type: "find", sequence: 0},
                            {type: "insert", sequence: 0},
                            {type: "update", sequence: 0},
                            {type: "remove", sequence: 0}
                        ]}},
                        {id: "Normal Employee", type: "Collection", collection: "employees", filterUI: "json", "filterJSON": JSON.stringify({user_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find", sequence: 0},
                            {type: "update", sequence: 0, fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"}
                            ]}}
                        ]}}
                    ]
                    return db.update({$collection: "pl.rolePrivileges", $insert: rolePrivileges})
                }).then(
                function () {
                    var createRoles = {$collection: "pl.roles", $insert: [
                        {id: "HR", role: "HR", privileges: [
                            {type: "Privilege", privilegeid: {$query: {id: "HR Employee"}}}
                        ]},
                        {id: "SalesAdmin", role: "Sales Admin", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}},
                            {type: "Privilege", privilegeid: {$query: {id: "Normal Employee"}}}
                        ]},
                        {id: "SalesUser", role: "Sales User", parentroleid: {$query: {id: "SalesAdmin"}}, privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0, primaryFields: true}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "taskowner"},
                                {field: "hrs"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({salesowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "update", sequence: 1, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}) }
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "My Project"}
                            ]}}
                        ]},
                        {id: "TaskAdmin", role: "Task Admin", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "salesowner"},
                                {field: "cost"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({status: "Active"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "remove", sequence: 0, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"})},
                                {type: "update", sequence: 0, fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                    {field: "salesowner"},
                                    {field: "cost"},
                                    {field: "hrs"}
                                ]}}
                            ]}, viewsAvailability: "Exclude", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "All Project"}
                            ]}},
                            {type: "Privilege", privilegeid: {$query: {id: "Normal Employee"}}}
                        ]},
                        {id: "TaskUser", role: "Task User", parentroleid: {$query: {id: "SalesUser"}}, privileges: [
                            {type: "Collection", collection: "projects", actionsAvailability: "Exclude", actionInfos: {$insert: [
                                {action: "addTask"}
                            ]}, fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"},
                                {field: "description"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                            ]}}
                        ]}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    return db.query({"$collection": "pl.roles"});
                }).then(
                function (rolesData) {
//                console.log("roles>>>>>>>" + JSON.stringify(rolesData));
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Amit Singh", password: "amitsingh", emailid: "amit@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesAdmin"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskAdmin"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Rohit", password: "rohit", emailid: "rohit@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesUser"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskAdmin"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Sachin", password: "sachin", emailid: "sachin@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesAdmin"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Ritesh", password: "ritesh", emailid: "ritesh@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesUser"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function () {
                    return db.query({"$collection": "pl.users", $modules: {"Role": 0}});
                }).then(
                function (users) {
//                console.log("users>>>>>>" + JSON.stringify(users));
                    var collectionDefination = [
                        {$collection: "pl.applications", $insert: [
                            {id: "SalesManagement", label: "Sales Management"},
                            {id: "TaskManagement", label: "Task Management"},
                            {id: "RevenueManagement", label: "Revenue Management"}
                        ]},
                        {$collection: "pl.collections", $insert: [
                            {collection: "deliveries"},
                            {collection: "projects"},
                            {collection: "employees"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "deliveries"}}},
                            {field: "delivery_no", type: "string", collectionid: {$query: {collection: "deliveries"}}, primary: true} ,
                            {field: "name", type: "string", collectionid: {$query: {collection: "projects"}}, primary: true},
                            {field: "description", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "cost", type: "currency", collectionid: {$query: {collection: "projects"}}},
                            {field: "hrs", type: "duration", collectionid: {$query: {collection: "projects"}}},
                            {field: "salesowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]},
                            {field: "taskowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]},
                            {field: "name", type: "string", collectionid: {$query: {collection: "employees"}}, primary: true},
                            {field: "code", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "user_id", type: "fk", collectionid: {$query: {collection: "employees"}}, collection: "pl.users", set: ["emailid", "username"]}
                        ]},
                        {$collection: "pl.qviews", $insert: [
                            {id: "Sales Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "Sales Project"},
                            {id: "My Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "My Project"},
                            {id: "All Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "All Project"},
                            {id: "Task Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "Task Project"}
                        ]},
                        {$collection: "pl.actions", $insert: [
                            {id: "addTask", type: "invoke", collectionid: {$query: {collection: "projects"}}, label: "addTask", visibility: true},
                            {id: "addProgres", type: "invoke", collectionid: {$query: {collection: "projects"}}, label: "addProgres", visibility: true}
                        ]},
                        {$collection: "pl.menus", $insert: [
//                        {collection:"deliveries", application:{$query:{id:"SalesManagement"}}, label:"Sales Deliveries"},
                            {collection: "projects", application: {$query: {id: "SalesManagement"}}, label: "Sales Projects", qviews: {$insert: [
                                {id: "Sales Project", collection: "projects", label: "Sales Project"},
                                {id: "My Project", collection: "projects", label: "My Project"},
                                {id: "Task Project", collection: "projects", label: "Task Project"},
                                {id: "All Project", collection: "projects", label: "All Project"}
                            ]}},
//                        {collection:"deliveries", application:{$query:{id:"TaskManagement"}}, label:"Task Deliveries"},
                            {collection: "projects", application: {$query: {id: "TaskManagement"}}, label: "Task Projects", qviews: {$insert: [
                                {id: "Sales Project", collection: "projects", label: "Sales Project"},
                                {id: "My Project", collection: "projects", label: "My Project"},
                                {id: "Task Project", collection: "projects", label: "Task Project"},
                                {id: "All Project", collection: "projects", label: "All Project"}
                            ]}}
                        ]}
                    ];
                    return db.update(collectionDefination);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Amit Singh", password: "amitsingh"});
                }).then(
                function (db1) {
                    admin = db1;
                    var adminUserRoles = admin.userRoles;
                    expect(Object.keys(adminUserRoles.roles)).to.have.length(2);
                    var privileges = adminUserRoles.privileges;
                    var privilegeCollections = Object.keys(privileges);
                    expect(privilegeCollections).to.have.length(3);
                    expect(privilegeCollections[0]).to.eql("deliveries");
                    expect(privilegeCollections[1]).to.eql("projects");
                    expect(privilegeCollections[2]).to.eql("employees");
                    expect(privileges[privilegeCollections[0]]).to.have.length(2);
                    expect(privileges[privilegeCollections[1]]).to.have.length(2);
                    expect(privileges[privilegeCollections[2]]).to.have.length(2);

                    expect(privileges[privilegeCollections[0]][0].actions).to.have.length(4);
                    expect(privileges[privilegeCollections[0]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[0]][0].actions[1]).to.eql("insert");
                    expect(privileges[privilegeCollections[0]][0].actions[2]).to.eql("update");
                    expect(privileges[privilegeCollections[0]][0].actions[3]).to.eql("remove");
                    expect(privileges[privilegeCollections[0]][1].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[0]][1].actions[0]).to.eql("find");

                    expect(privileges[privilegeCollections[1]][0].actions).to.have.length(4);
                    expect(privileges[privilegeCollections[1]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[1]][0].actions[1]).to.eql("insert");
                    expect(privileges[privilegeCollections[1]][0].actions[2]).to.eql("update");
                    expect(privileges[privilegeCollections[1]][0].actions[3]).to.eql("remove");
                    expect(privileges[privilegeCollections[1]][1].actions).to.have.length(4);
                    expect(privileges[privilegeCollections[1]][1].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[1]][1].actions[1]).to.eql("insert");
                    expect(privileges[privilegeCollections[1]][1].actions[2]).to.eql({remove: {filter: {taskowner: "$$CurrentUser"}}});
                    expect(privileges[privilegeCollections[1]][1].actions[3]).to.eql({update: {fields: {salesowner: 0, cost: 0, hrs: 0}}});

                    expect(privileges[privilegeCollections[2]][0].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][0].actions[1]).to.eql({update: {fields: {name: 1}}});
                    expect(privileges[privilegeCollections[2]][1].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][1].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][1].actions[1]).to.eql({update: {fields: {name: 1}}});
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Rohit", password: "rohit"});
                }).then(
                function (db1) {
                    salesUserTaskAdmin = db1;
                    var salesUserTaskAdminUserRoles = salesUserTaskAdmin.userRoles;
                    expect(Object.keys(salesUserTaskAdminUserRoles.roles)).to.have.length(2);
                    var privileges = salesUserTaskAdminUserRoles.privileges;
                    var privilegeCollections = Object.keys(privileges);
                    expect(privilegeCollections).to.have.length(3);
                    expect(privilegeCollections[0]).to.eql("deliveries");
                    expect(privilegeCollections[1]).to.eql("projects");
                    expect(privilegeCollections[2]).to.eql("employees");
                    expect(privileges[privilegeCollections[0]]).to.have.length(2);
                    expect(privileges[privilegeCollections[1]]).to.have.length(2);
                    expect(privileges[privilegeCollections[2]]).to.have.length(2);

                    expect(privileges[privilegeCollections[0]][0].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[0]][0].actions[0]).to.eql({find: {primaryFields: 1}});
                    expect(privileges[privilegeCollections[0]][1].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[0]][1].actions[0]).to.eql("find");

                    expect(privileges[privilegeCollections[1]][0].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[1]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[1]][0].actions[1]).to.eql({update: {filter: {taskowner: "$$CurrentUser"}}});
                    expect(privileges[privilegeCollections[1]][1].actions).to.have.length(4);
                    expect(privileges[privilegeCollections[1]][1].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[1]][1].actions[1]).to.eql("insert");
                    expect(privileges[privilegeCollections[1]][1].actions[2]).to.eql({remove: {filter: {taskowner: "$$CurrentUser"}}});
                    expect(privileges[privilegeCollections[1]][1].actions[3]).to.eql({update: {fields: {salesowner: 0, cost: 0, hrs: 0}}});

                    expect(privileges[privilegeCollections[2]][0].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][0].actions[1]).to.eql({update: {fields: {name: 1}}});
                    expect(privileges[privilegeCollections[2]][1].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][1].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][1].actions[1]).to.eql({update: {fields: {name: 1}}});

                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Sachin", password: "sachin"});
                }).then(
                function (db1) {
                    salesAdminTaskUser = db1;
                    var salesAdminTaskUserUserRoles = salesAdminTaskUser.userRoles;
                    expect(Object.keys(salesAdminTaskUserUserRoles.roles)).to.have.length(2);
                    var privileges = salesAdminTaskUserUserRoles.privileges;
                    var privilegeCollections = Object.keys(privileges);
                    expect(privilegeCollections).to.have.length(3);
                    expect(privilegeCollections[0]).to.eql("deliveries");
                    expect(privilegeCollections[1]).to.eql("projects");
                    expect(privilegeCollections[2]).to.eql("employees");
                    expect(privileges[privilegeCollections[0]]).to.have.length(2);
                    expect(privileges[privilegeCollections[1]]).to.have.length(2);
                    expect(privileges[privilegeCollections[2]]).to.have.length(2);

                    expect(privileges[privilegeCollections[0]][0].actions).to.have.length(4);
                    expect(privileges[privilegeCollections[0]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[0]][0].actions[1]).to.eql("insert");
                    expect(privileges[privilegeCollections[0]][0].actions[2]).to.eql("update");
                    expect(privileges[privilegeCollections[0]][0].actions[3]).to.eql("remove");
                    expect(privileges[privilegeCollections[0]][1].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[0]][1].actions[0]).to.eql({find: {primaryFields: 1}});

                    expect(privileges[privilegeCollections[1]][0].actions).to.have.length(4);
                    expect(privileges[privilegeCollections[1]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[1]][0].actions[1]).to.eql("insert");
                    expect(privileges[privilegeCollections[1]][0].actions[2]).to.eql("update");
                    expect(privileges[privilegeCollections[1]][0].actions[3]).to.eql("remove");
                    expect(privileges[privilegeCollections[1]][1].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[1]][1].actions[0]).to.eql("find");

                    expect(privileges[privilegeCollections[2]][0].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][0].actions[1]).to.eql({update: {fields: {name: 1}}});
                    expect(privileges[privilegeCollections[2]][1].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][1].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][1].actions[1]).to.eql({update: {fields: {name: 1}}});
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Ritesh", password: "ritesh"});
                }).then(
                function (db1) {
                    user = db1;
                    var userUserRoles = user.userRoles;
                    expect(Object.keys(userUserRoles.roles)).to.have.length(2);
                    var privileges = userUserRoles.privileges;
                    var privilegeCollections = Object.keys(privileges);
                    expect(privilegeCollections).to.have.length(3);
                    expect(privilegeCollections[0]).to.eql("deliveries");
                    expect(privilegeCollections[1]).to.eql("projects");
                    expect(privilegeCollections[2]).to.eql("employees");
                    expect(privileges[privilegeCollections[0]]).to.have.length(2);
                    expect(privileges[privilegeCollections[1]]).to.have.length(2);
                    expect(privileges[privilegeCollections[2]]).to.have.length(2);

                    expect(privileges[privilegeCollections[0]][0].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[0]][0].actions[0]).to.eql({find: {primaryFields: 1}});
                    expect(privileges[privilegeCollections[0]][1].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[0]][1].actions[0]).to.eql({find: {primaryFields: 1}});

                    expect(privileges[privilegeCollections[1]][0].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[1]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[1]][0].actions[1]).to.eql({update: {filter: {taskowner: "$$CurrentUser"}}});
                    expect(privileges[privilegeCollections[1]][1].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[1]][1].actions[0]).to.eql("find");

                    expect(privileges[privilegeCollections[2]][0].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][0].actions[1]).to.eql({update: {fields: {name: 1}}});
                    expect(privileges[privilegeCollections[2]][1].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][1].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][1].actions[1]).to.eql({update: {fields: {name: 1}}});
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });

        it('role to check child roles and child applications of group type', function (done) {
            var db = undefined;
            var admin = undefined;
            var salesUserTaskAdmin = undefined;
            var salesAdminTaskUser = undefined;
            var user = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    var rolePrivileges = [
                        {id: "HR Employee", type: "Collection", collection: "employees", operationInfos: {$insert: [
                            {type: "find", sequence: 0},
                            {type: "insert", sequence: 0},
                            {type: "update", sequence: 0},
                            {type: "remove", sequence: 0}
                        ]}},
                        {id: "Normal Employee", type: "Collection", collection: "employees", filterUI: "json", "filterJSON": JSON.stringify({user_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find", sequence: 0},
                            {type: "update", sequence: 0, fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"}
                            ]}}
                        ]}}
                    ]
                    return db.update({$collection: "pl.rolePrivileges", $insert: rolePrivileges})
                }).then(
                function () {
                    var createRoles = {$collection: "pl.roles", $insert: [
                        {id: "HR", role: "HR", privileges: [
                            {type: "Privilege", privilegeid: {$query: {id: "HR Employee"}}}
                        ]},
                        {id: "SalesAdmin", role: "Sales Admin", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}},
                            {type: "Privilege", privilegeid: {$query: {id: "Normal Employee"}}}
                        ]},
                        {id: "SalesUser", role: "Sales User", parentroleid: {$query: {id: "SalesAdmin"}}, privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0, primaryFields: true}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "taskowner"},
                                {field: "hrs"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({salesowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "update", sequence: 1, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}) }
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "My Project"}
                            ]}}
                        ]},
                        {id: "TaskAdmin", role: "Task Admin", privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "salesowner"},
                                {field: "cost"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({status: "Active"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "remove", sequence: 0, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"})},
                                {type: "update", sequence: 0, fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                    {field: "salesowner"},
                                    {field: "cost"},
                                    {field: "hrs"}
                                ]}}
                            ]}, viewsAvailability: "Exclude", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "All Project"}
                            ]}},
                            {type: "Privilege", privilegeid: {$query: {id: "Normal Employee"}}}
                        ]},
                        {id: "TaskUser", role: "Task User", parentroleid: {$query: {id: "SalesUser"}}, privileges: [
                            {type: "Collection", collection: "projects", actionsAvailability: "Exclude", actionInfos: {$insert: [
                                {action: "addTask"}
                            ]}, fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"},
                                {field: "description"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                            ]}}
                        ]},
                        {id: "SalesUserTaskAdmin", role: "SalesUserTaskAdmin", group: true, childRoles: {$insert: [
                            {appid: "SalesManagement", role: {$query: {id: "SalesUser"}}},
                            {appid: "TaskManagement", role: {$query: {id: "TaskAdmin"}}}
                        ]}},
                        {id: "SalesAdminTaskUser", role: "SalesAdminTaskUser", group: true, childRoles: {$insert: [
                            {appid: "SalesManagement", role: {$query: {id: "SalesAdmin"}}},
                            {appid: "TaskManagement", role: {$query: {id: "TaskUser"}}}
                        ]}},
                        {id: "User", role: "User", group: true, childRoles: {$insert: [
                            {appid: "SalesManagement", role: {$query: {id: "SalesUser"}}},
                            {appid: "TaskManagement", role: {$query: {id: "TaskUser"}}}
                        ]}}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    return db.query({"$collection": "pl.roles"});
                }).then(
                function (rolesData) {
//                console.log("roles>>>>>>>" + JSON.stringify(rolesData));
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Amit Singh", password: "amitsingh", emailid: "amit@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesAdmin"}}, appid: "SalesManagement"},
                            {role: {$query: {id: "TaskAdmin"}}, appid: "TaskManagement"}
                        ]},
                        {username: "Rohit", password: "rohit", emailid: "rohit@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesUserTaskAdmin"}}, appid: "AFB"}
                        ]},
                        {username: "Sachin", password: "sachin", emailid: "sachin@daffodilsw.com", roles: [
                            {role: {$query: {id: "SalesAdminTaskUser"}}, appid: "AFB"}
                        ]},
                        {username: "Ritesh", password: "ritesh", emailid: "ritesh@daffodilsw.com", roles: [
                            {role: {$query: {id: "User"}}, appid: "AFB"}
                        ]}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function () {
                    return db.query({"$collection": "pl.users", $modules: {"Role": 0}});
                }).then(
                function (users) {
//                console.log("users>>>>>>" + JSON.stringify(users));
                    var collectionDefination = [
                        {$collection: "pl.applications", $insert: [
                            {id: "SalesManagement", label: "Sales Management", addRoleToUser: true},
                            {id: "TaskManagement", label: "Task Management", addRoleToUser: true},
                            {id: "AFB", label: "AFB", group: true, addRoleToUser: true, childApplications: [
                                {application: {$query: {id: "SalesManagement"}}},
                                {application: {$query: {id: "TaskManagement"}}}
                            ]}
                        ]},
                        {$collection: "pl.collections", $insert: [
                            {collection: "deliveries"},
                            {collection: "projects"},
                            {collection: "employees"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "deliveries"}}},
                            {field: "delivery_no", type: "string", collectionid: {$query: {collection: "deliveries"}}, primary: true} ,
                            {field: "name", type: "string", collectionid: {$query: {collection: "projects"}}, primary: true},
                            {field: "description", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "projects"}}},
                            {field: "cost", type: "currency", collectionid: {$query: {collection: "projects"}}},
                            {field: "hrs", type: "duration", collectionid: {$query: {collection: "projects"}}},
                            {field: "salesowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]},
                            {field: "taskowner", type: "fk", collectionid: {$query: {collection: "projects"}}, collection: "pl.users", set: ["emailid", "username"]},
                            {field: "name", type: "string", collectionid: {$query: {collection: "employees"}}, primary: true},
                            {field: "code", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "user_id", type: "fk", collectionid: {$query: {collection: "employees"}}, collection: "pl.users", set: ["emailid", "username"]}
                        ]},
                        {$collection: "pl.qviews", $insert: [
                            {id: "Sales Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "Sales Project"},
                            {id: "My Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "My Project"},
                            {id: "All Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "All Project"},
                            {id: "Task Project", collection: {$query: {collection: "projects"}}, mainCollection: {$query: {collection: "projects"}}, label: "Task Project"}
                        ]},
                        {$collection: "pl.actions", $insert: [
                            {id: "addTask", type: "invoke", collectionid: {$query: {collection: "projects"}}, label: "addTask", visibility: true},
                            {id: "addProgres", type: "invoke", collectionid: {$query: {collection: "projects"}}, label: "addProgres", visibility: true}
                        ]},
                        {$collection: "pl.menus", $insert: [
//                        {collection:"deliveries", application:{$query:{id:"SalesManagement"}}, label:"Sales Deliveries"},
                            {collection: "projects", application: {$query: {id: "SalesManagement"}}, label: "Sales Projects", qviews: {$insert: [
                                {id: "Sales Project", collection: "projects", label: "Sales Project"},
                                {id: "My Project", collection: "projects", label: "My Project"},
                                {id: "Task Project", collection: "projects", label: "Task Project"},
                                {id: "All Project", collection: "projects", label: "All Project"}
                            ]}},
//                        {collection:"deliveries", application:{$query:{id:"TaskManagement"}}, label:"Task Deliveries"},
                            {collection: "projects", application: {$query: {id: "TaskManagement"}}, label: "Task Projects", qviews: {$insert: [
                                {id: "Sales Project", collection: "projects", label: "Sales Project"},
                                {id: "My Project", collection: "projects", label: "My Project"},
                                {id: "Task Project", collection: "projects", label: "Task Project"},
                                {id: "All Project", collection: "projects", label: "All Project"}
                            ]}}
                        ]}
                    ];
                    return db.update(collectionDefination);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Amit Singh", password: "amitsingh"});
                }).then(
                function (db1) {
                    admin = db1;
                    var adminUserRoles = admin.userRoles;
                    expect(Object.keys(adminUserRoles.roles)).to.have.length(2);
                    var privileges = adminUserRoles.privileges;
                    var privilegeCollections = Object.keys(privileges);
                    expect(privilegeCollections).to.have.length(3);
                    expect(privilegeCollections[0]).to.eql("deliveries");
                    expect(privilegeCollections[1]).to.eql("projects");
                    expect(privilegeCollections[2]).to.eql("employees");
                    expect(privileges[privilegeCollections[0]]).to.have.length(2);
                    expect(privileges[privilegeCollections[1]]).to.have.length(2);
                    expect(privileges[privilegeCollections[2]]).to.have.length(2);

                    expect(privileges[privilegeCollections[0]][0].actions).to.have.length(4);
                    expect(privileges[privilegeCollections[0]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[0]][0].actions[1]).to.eql("insert");
                    expect(privileges[privilegeCollections[0]][0].actions[2]).to.eql("update");
                    expect(privileges[privilegeCollections[0]][0].actions[3]).to.eql("remove");
                    expect(privileges[privilegeCollections[0]][1].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[0]][1].actions[0]).to.eql("find");

                    expect(privileges[privilegeCollections[1]][0].actions).to.have.length(4);
                    expect(privileges[privilegeCollections[1]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[1]][0].actions[1]).to.eql("insert");
                    expect(privileges[privilegeCollections[1]][0].actions[2]).to.eql("update");
                    expect(privileges[privilegeCollections[1]][0].actions[3]).to.eql("remove");
                    expect(privileges[privilegeCollections[1]][1].actions).to.have.length(4);
                    expect(privileges[privilegeCollections[1]][1].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[1]][1].actions[1]).to.eql("insert");
                    expect(privileges[privilegeCollections[1]][1].actions[2]).to.eql({remove: {filter: {taskowner: "$$CurrentUser"}}});
                    expect(privileges[privilegeCollections[1]][1].actions[3]).to.eql({update: {fields: {salesowner: 0, cost: 0, hrs: 0}}});

                    expect(privileges[privilegeCollections[2]][0].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][0].actions[1]).to.eql({update: {fields: {name: 1}}});
                    expect(privileges[privilegeCollections[2]][1].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][1].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][1].actions[1]).to.eql({update: {fields: {name: 1}}});
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Rohit", password: "rohit"});
                }).then(
                function (db1) {
                    salesUserTaskAdmin = db1;
                    var salesUserTaskAdminUserRoles = salesUserTaskAdmin.userRoles;
                    expect(Object.keys(salesUserTaskAdminUserRoles.roles)).to.have.length(2);
                    var privileges = salesUserTaskAdminUserRoles.privileges;
                    var privilegeCollections = Object.keys(privileges);
                    expect(privilegeCollections).to.have.length(3);
                    expect(privilegeCollections[0]).to.eql("deliveries");
                    expect(privilegeCollections[1]).to.eql("projects");
                    expect(privilegeCollections[2]).to.eql("employees");
                    expect(privileges[privilegeCollections[0]]).to.have.length(2);
                    expect(privileges[privilegeCollections[1]]).to.have.length(2);
                    expect(privileges[privilegeCollections[2]]).to.have.length(2);

                    expect(privileges[privilegeCollections[0]][0].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[0]][0].actions[0]).to.eql({find: {primaryFields: 1}});
                    expect(privileges[privilegeCollections[0]][1].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[0]][1].actions[0]).to.eql("find");

                    expect(privileges[privilegeCollections[1]][0].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[1]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[1]][0].actions[1]).to.eql({update: {filter: {taskowner: "$$CurrentUser"}}});
                    expect(privileges[privilegeCollections[1]][1].actions).to.have.length(4);
                    expect(privileges[privilegeCollections[1]][1].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[1]][1].actions[1]).to.eql("insert");
                    expect(privileges[privilegeCollections[1]][1].actions[2]).to.eql({remove: {filter: {taskowner: "$$CurrentUser"}}});
                    expect(privileges[privilegeCollections[1]][1].actions[3]).to.eql({update: {fields: {salesowner: 0, cost: 0, hrs: 0}}});

                    expect(privileges[privilegeCollections[2]][0].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][0].actions[1]).to.eql({update: {fields: {name: 1}}});
                    expect(privileges[privilegeCollections[2]][1].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][1].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][1].actions[1]).to.eql({update: {fields: {name: 1}}});

                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Sachin", password: "sachin"});
                }).then(
                function (db1) {
                    salesAdminTaskUser = db1;
                    var salesAdminTaskUserUserRoles = salesAdminTaskUser.userRoles;
                    expect(Object.keys(salesAdminTaskUserUserRoles.roles)).to.have.length(2);
                    var privileges = salesAdminTaskUserUserRoles.privileges;
                    var privilegeCollections = Object.keys(privileges);
                    expect(privilegeCollections).to.have.length(3);
                    expect(privilegeCollections[0]).to.eql("deliveries");
                    expect(privilegeCollections[1]).to.eql("projects");
                    expect(privilegeCollections[2]).to.eql("employees");
                    expect(privileges[privilegeCollections[0]]).to.have.length(2);
                    expect(privileges[privilegeCollections[1]]).to.have.length(2);
                    expect(privileges[privilegeCollections[2]]).to.have.length(2);

                    expect(privileges[privilegeCollections[0]][0].actions).to.have.length(4);
                    expect(privileges[privilegeCollections[0]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[0]][0].actions[1]).to.eql("insert");
                    expect(privileges[privilegeCollections[0]][0].actions[2]).to.eql("update");
                    expect(privileges[privilegeCollections[0]][0].actions[3]).to.eql("remove");
                    expect(privileges[privilegeCollections[0]][1].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[0]][1].actions[0]).to.eql({find: {primaryFields: 1}});

                    expect(privileges[privilegeCollections[1]][0].actions).to.have.length(4);
                    expect(privileges[privilegeCollections[1]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[1]][0].actions[1]).to.eql("insert");
                    expect(privileges[privilegeCollections[1]][0].actions[2]).to.eql("update");
                    expect(privileges[privilegeCollections[1]][0].actions[3]).to.eql("remove");
                    expect(privileges[privilegeCollections[1]][1].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[1]][1].actions[0]).to.eql("find");

                    expect(privileges[privilegeCollections[2]][0].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][0].actions[1]).to.eql({update: {fields: {name: 1}}});
                    expect(privileges[privilegeCollections[2]][1].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][1].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][1].actions[1]).to.eql({update: {fields: {name: 1}}});
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Ritesh", password: "ritesh"});
                }).then(
                function (db1) {
                    user = db1;
                    var userUserRoles = user.userRoles;
                    expect(Object.keys(userUserRoles.roles)).to.have.length(2);
                    var privileges = userUserRoles.privileges;
                    var privilegeCollections = Object.keys(privileges);
                    expect(privilegeCollections).to.have.length(3);
                    expect(privilegeCollections[0]).to.eql("deliveries");
                    expect(privilegeCollections[1]).to.eql("projects");
                    expect(privilegeCollections[2]).to.eql("employees");
                    expect(privileges[privilegeCollections[0]]).to.have.length(2);
                    expect(privileges[privilegeCollections[1]]).to.have.length(2);
                    expect(privileges[privilegeCollections[2]]).to.have.length(2);

                    expect(privileges[privilegeCollections[0]][0].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[0]][0].actions[0]).to.eql({find: {primaryFields: 1}});
                    expect(privileges[privilegeCollections[0]][1].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[0]][1].actions[0]).to.eql({find: {primaryFields: 1}});

                    expect(privileges[privilegeCollections[1]][0].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[1]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[1]][0].actions[1]).to.eql({update: {filter: {taskowner: "$$CurrentUser"}}});
                    expect(privileges[privilegeCollections[1]][1].actions).to.have.length(1);
                    expect(privileges[privilegeCollections[1]][1].actions[0]).to.eql("find");

                    expect(privileges[privilegeCollections[2]][0].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][0].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][0].actions[1]).to.eql({update: {fields: {name: 1}}});
                    expect(privileges[privilegeCollections[2]][1].actions).to.have.length(2);
                    expect(privileges[privilegeCollections[2]][1].actions[0]).to.eql("find");
                    expect(privileges[privilegeCollections[2]][1].actions[1]).to.eql({update: {fields: {name: 1}}});
                }).then(
                function () {
                    return admin.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var applications = userState.applications;
                    expect(applications).to.have.length(2);
                    expect(applications[0].label).to.eql("Sales Management");
                    expect(applications[1].label).to.eql("Task Management");
                }).then(
                function () {
                    return salesUserTaskAdmin.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var applications = userState.applications;
                    expect(applications).to.have.length(2);
                    expect(applications[0].label).to.eql("Sales Management");
                    expect(applications[1].label).to.eql("Task Management");
                }).then(
                function () {
                    return salesAdminTaskUser.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var applications = userState.applications;
                    expect(applications).to.have.length(2);
                    expect(applications[0].label).to.eql("Sales Management");
                    expect(applications[1].label).to.eql("Task Management");
                }).then(
                function () {
                    return user.invokeFunction("getUserState", [
                        {}
                    ]);
                }).then(
                function (userState) {
                    var applications = userState.applications;
                    expect(applications).to.have.length(2);
                    expect(applications[0].label).to.eql("Sales Management");
                    expect(applications[1].label).to.eql("Task Management");
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });

        it('extend Role of group type', function (done) {
            var db = undefined;
            var CEO = undefined;
            var Manager = undefined;
            var HRManager = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    return addRolePrivileges(db);
                }).then(
                function () {
                    var rolePrivileges = [
                        {id: "HR Employee", type: "Collection", collection: "employees", operationInfos: {$insert: [
                            {type: "find", sequence: 0},
                            {type: "insert", sequence: 0},
                            {type: "update", sequence: 0},
                            {type: "remove", sequence: 0}
                        ]}},
                        {id: "Normal Employee", type: "Collection", collection: "employees", filterUI: "json", "filterJSON": JSON.stringify({user_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find", sequence: 0},
                            {type: "update", sequence: 0, fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"}
                            ]}}
                        ]}}
                    ]
                    return db.update({$collection: "pl.rolePrivileges", $insert: rolePrivileges})
                }).then(
                function () {
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Amit Singh", password: "amitsingh", emailid: "amit@daffodilsw.com"}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function () {
                    return db.update({$collection: "pl.applications", $insert: [
                        {id: "SalesManagement", label: "Sales Management", newRole: true, addRoleToUser: true},
                        {id: "TaskManagement", label: "Task Management", newRole: true, addRoleToUser: true},
                        {id: "HRManagement", label: "HR Management", newRole: true, addRoleToUser: true}
                    ]})
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Amit Singh", password: "amitsingh"});
                }).then(
                function (db1) {
                    CEO = db1;
                    return CEO.update({$collection: "pl.applications", $insert: [
                        {id: "AFB", label: "AFB", newRole: true, group: true, addRoleToUser: true, childApplications: [
                            {application: {$query: {id: "SalesManagement"}}},
                            {application: {$query: {id: "TaskManagement"}}},
                            {application: {$query: {id: "HRManagement"}}}
                        ]}
                    ]})
                }).then(
                function () {
                    var createRoles = {$collection: "pl.roles", $insert: [
                        {id: "HR", role: "HR", newRole: true, parentroleid: {$query: {id: "HRManagement"}}, privileges: [
                            {type: "Privilege", privilegeid: {$query: {id: "HR Employee"}}}
                        ]},
                        {id: "SalesAdmin", role: "Sales Admin", newRole: true, parentroleid: {$query: {id: "SalesManagement"}}, privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "update", sequence: 0},
                                {type: "remove", sequence: 0}
                            ]}},
                            {type: "Privilege", privilegeid: {$query: {id: "Normal Employee"}}}
                        ]},
                        {id: "SalesUser", role: "Sales User", newRole: true, parentroleid: {$query: {id: "SalesAdmin"}}, privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0, primaryFields: true}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "taskowner"},
                                {field: "hrs"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({salesowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "update", sequence: 1, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}) }
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "My Project"}
                            ]}}
                        ]},
                        {id: "TaskAdmin", role: "Task Admin", newRole: true, parentroleid: {$query: {id: "TaskManagement"}}, privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}},
                            {type: "Collection", collection: "projects", fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                {field: "salesowner"},
                                {field: "cost"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({status: "Active"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0},
                                {type: "insert", sequence: 0},
                                {type: "remove", sequence: 0, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"})},
                                {type: "update", sequence: 0, fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                                    {field: "salesowner"},
                                    {field: "cost"},
                                    {field: "hrs"}
                                ]}}
                            ]}, viewsAvailability: "Exclude", viewInfos: {$insert: [
                                {view: "Sales Project"},
                                {view: "All Project"}
                            ]}},
                            {type: "Privilege", privilegeid: {$query: {id: "Normal Employee"}}}
                        ]},
                        {id: "TaskUser", role: "Task User", newRole: true, parentroleid: {$query: {id: "TaskManagement"}}, privileges: [
                            {type: "Collection", collection: "deliveries", operationInfos: {$insert: [
                                {type: "find", sequence: 0, primaryFields: true}
                            ]}},
                            {type: "Collection", collection: "projects", actionsAvailability: "Exclude", actionInfos: {$insert: [
                                {action: "addTask"}
                            ]}, fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"},
                                {field: "description"}
                            ]}, filterUI: "json", filterJSON: JSON.stringify({taskowner: "$$CurrentUser"}), operationInfos: {$insert: [
                                {type: "find", sequence: 0}
                            ]}, viewsAvailability: "Include", viewInfos: {$insert: [
                            ]}}
                        ]}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    return db.query({"$collection": "pl.roles", $filter: {id: "AFB"}});
                }).then(
                function (result) {
                    return db.update({$collection: "pl.roles", $update: {_id: result.result[0]._id, $set: {childRoles: {$insert: [
                        {appid: "SalesManagement", role: {$query: {id: "SalesAdmin"}}},
                        {appid: "TaskManagement", role: {$query: {id: "TaskAdmin"}}},
                        {appid: "HRManagement", role: {$query: {id: "HR"}}}
                    ]}}}})
                }).then(
                function () {
                    return db.update({$collection: "pl.roles", $insert: [
                        {role: "AFB_CEO", id: "AFB_CEO", newRole: true, parentroleid: {$query: {id: "AFB"}}},
                        {role: "AFB_Manager", id: "AFB_Manager", newRole: true, parentroleid: {$query: {id: "AFB"}}, childRoles: {$insert: [
                            {appid: "HRManagement"}
                        ]}},
                        {role: "AFB_HR_Manager", id: "AFB_HR_Manager", newRole: true, parentroleid: {$query: {id: "AFB"}}, childRoles: {$insert: [
                            {appid: "SalesManagement", role: {$query: {id: "SalesUser"}}}
                        ]}}
                    ]});
                }).then(
                function (rolesData) {
//                console.log("roles>>>>>>>" + JSON.stringify(rolesData));
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Rohit", password: "rohit", emailid: "rohit@daffodilsw.com", roles: {$insert: [
                            {appid: "AFB", role: {$query: {id: "AFB_Manager"}}}
                        ]}},
                        {username: "Sachin", password: "sachin", emailid: "sachin@daffodilsw.com", roles: {$insert: [
                            {appid: "AFB", role: {$query: {id: "AFB_HR_Manager"}}}
                        ]}}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function () {
                    return db.query({"$collection": "pl.users", $modules: {"Role": 0}});
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Amit Singh", password: "amitsingh"});
                }).then(
                function (db1) {
                    CEO = db1;
                    var CEOUserRoles = CEO.userRoles;
                    expect(Object.keys(CEOUserRoles.roles)).to.have.length(3);
                    expect(CEOUserRoles.roles["HR"]).to.not.eql(undefined);
                    expect(CEOUserRoles.roles["SalesAdmin"]).to.not.eql(undefined);
                    expect(CEOUserRoles.roles["TaskAdmin"]).to.not.eql(undefined);

                    expect(CEOUserRoles.privileges["employees"]).to.have.length(3);
                    expect(CEOUserRoles.privileges["employees"][0]["roleId"]).to.eql("HR");
                    expect(CEOUserRoles.privileges["employees"][1]["roleId"]).to.eql("SalesAdmin");
                    expect(CEOUserRoles.privileges["employees"][2]["roleId"]).to.eql("TaskAdmin");
                    expect(CEOUserRoles.privileges["deliveries"]).to.have.length(2);
                    expect(CEOUserRoles.privileges["deliveries"][0]["roleId"]).to.eql("SalesAdmin");
                    expect(CEOUserRoles.privileges["deliveries"][0].actions).to.have.length(4);
                    expect(CEOUserRoles.privileges["deliveries"][1]["roleId"]).to.eql("TaskAdmin");
                    expect(CEOUserRoles.privileges["projects"]).to.have.length(2);
                    expect(CEOUserRoles.privileges["projects"][0]["roleId"]).to.eql("SalesAdmin");
                    expect(CEOUserRoles.privileges["projects"][1]["roleId"]).to.eql("TaskAdmin");
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Rohit", password: "rohit"});
                }).then(
                function (db1) {
                    Manager = db1;
                    var ManagerUserRoles = Manager.userRoles;
                    expect(Object.keys(ManagerUserRoles.roles)).to.have.length(2);
                    expect(ManagerUserRoles.roles["HR"]).to.eql(undefined);
                    expect(ManagerUserRoles.roles["SalesAdmin"]).to.not.eql(undefined);
                    expect(ManagerUserRoles.roles["TaskAdmin"]).to.not.eql(undefined);
                    expect(ManagerUserRoles.privileges["employees"][0]["roleId"]).to.eql("SalesAdmin");
                    expect(ManagerUserRoles.privileges["employees"][1]["roleId"]).to.eql("TaskAdmin");
                    expect(ManagerUserRoles.privileges["deliveries"]).to.have.length(2);
                    expect(ManagerUserRoles.privileges["deliveries"][0]["roleId"]).to.eql("SalesAdmin");
                    expect(ManagerUserRoles.privileges["deliveries"][0].actions).to.have.length(4);
                    expect(ManagerUserRoles.privileges["deliveries"][1]["roleId"]).to.eql("TaskAdmin");
                    expect(ManagerUserRoles.privileges["projects"]).to.have.length(2);
                    expect(ManagerUserRoles.privileges["projects"][0]["roleId"]).to.eql("SalesAdmin");
                    expect(ManagerUserRoles.privileges["projects"][1]["roleId"]).to.eql("TaskAdmin");
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Sachin", password: "sachin"});
                }).then(
                function (db1) {
                    HRManager = db1;
                    var HRManagerUserRoles = HRManager.userRoles;
                    expect(Object.keys(HRManagerUserRoles.roles)).to.have.length(3);
                    expect(HRManagerUserRoles.roles["HR"]).to.not.eql(undefined);
                    expect(HRManagerUserRoles.roles["SalesAdmin"]).to.eql(undefined);
                    expect(HRManagerUserRoles.roles["SalesUser"]).to.not.eql(undefined);
                    expect(HRManagerUserRoles.roles["TaskAdmin"]).to.not.eql(undefined);
                    expect(HRManagerUserRoles.privileges["employees"][0]["roleId"]).to.eql("HR");
                    expect(HRManagerUserRoles.privileges["employees"][1]["roleId"]).to.eql("SalesUser");
                    expect(HRManagerUserRoles.privileges["employees"][2]["roleId"]).to.eql("TaskAdmin");
                    expect(HRManagerUserRoles.privileges["deliveries"]).to.have.length(2);
                    expect(HRManagerUserRoles.privileges["deliveries"][0]["roleId"]).to.eql("SalesUser");
                    expect(HRManagerUserRoles.privileges["deliveries"][0].actions).to.have.length(1);
                    expect(HRManagerUserRoles.privileges["deliveries"][1]["roleId"]).to.eql("TaskAdmin");
                    expect(HRManagerUserRoles.privileges["projects"]).to.have.length(2);
                    expect(HRManagerUserRoles.privileges["projects"][0]["roleId"]).to.eql("SalesUser");
                    expect(HRManagerUserRoles.privileges["projects"][1]["roleId"]).to.eql("TaskAdmin");
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });
    })

    describe("fk Fields in role", function (done) {
        afterEach(function (done) {
            Testcases.afterEach(done);
        });
        beforeEach(function (done) {
            Testcases.beforeEach(done);
        });

        it('save and check fk privilige and update in saved privilege', function (done) {
            var db = undefined;
            var user = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    return addRolePrivileges(db);
                }).then(
                function () {
                    return db.update({$collection: "pl.applications", $insert: [
                        {id: "SalesManagement", label: "Sales Management", newRole: true},
                        {id: "TaskManagement", label: "Task Management", newRole: true},
                        {id: "RevenueManagement", label: "Revenue Management", newRole: true}
                    ]})
                }).then(
                function () {
                    return db.update({$collection: "pl.rolePrivileges", $insert: [
                        {id: "Normal Employee", type: "Collection", collection: "employees", operationInfos: {$insert: [
                            {type: "find", fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"},
                                {field: "code"}
                            ]}}
                        ]}},
                        {id: "Self Employee", type: "Collection", collection: "employees", filterUI: "json", filterJSON: JSON.stringify({user_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find"}
                        ]}},
                        {id: "Team Employee", type: "Collection", collection: "employees", filterUI: "json", filterJSON: JSON.stringify({reporting_to_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find"}
                        ]}}
                    ]})
                }).then(
                function () {
                    var createRoles = {$collection: "pl.roles", $insert: [
                        {id: "TaskUser", role: "Task User", parentroleid: {$query: {id: "TaskManagement"}}, privileges: [
                            {type: "Privilege", privilegeid: {$query: {id: "Self Employee"}}},
                            {type: "Collection", collection: "tasks", operationInfos: {$insert: [
                                {type: "find"},
                                {type: "insert"},
                                {type: "remove"},
                                {type: "update"},
                                {type: "fk", fkInfos: {$insert: [
                                    {field: "ownerid", privilegeid: {$query: {id: "Normal Employee"}}},
                                    {field: "assigntoid", privilegeid: {$query: {id: "Team Employee"}}}
                                ]}}
                            ]}}
                        ]}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Amit Singh", password: "amitsingh", emailid: "amit@daffodilsw.com"},
                        {username: "Rohit", password: "rohit", emailid: "rohit@daffodilsw.com"},
                        {username: "Sachin", password: "sachin", emailid: "sachin@daffodilsw.com"},
                        {username: "Ritesh", password: "ritesh", emailid: "ritesh@daffodilsw.com", roles: [
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function (users) {
                    var collectionDefination = [
                        {$collection: "pl.collections", $insert: [
                            {collection: "employees"},
                            {collection: "tasks"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "employees"}}, primary: true},
                            {field: "code", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "fullname", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "reporting_to_id", type: "fk", collectionid: {$query: {collection: "employees"}}, collection: "employees", set: ["name"]},
                            {field: "user_id", type: "fk", collectionid: {$query: {collection: "employees"}}, collection: "pl.users", set: ["username", "emailid"]},

                            {field: "name", type: "string", collectionid: {$query: {collection: "tasks"}}, primary: true},
                            {field: "description", type: "string", collectionid: {$query: {collection: "tasks"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "tasks"}}},
                            {field: "ownerid", type: "fk", collectionid: {$query: {collection: "tasks"}}, collection: "employees", set: ["name"]},
                            {field: "assigntoid", type: "fk", collectionid: {$query: {collection: "tasks"}}, collection: "employees", set: ["name"]}
                        ]}
                    ];
                    return db.update(collectionDefination);
                }).then(
                function (collectionData) {
                    var update = [
                        {$collection: "employees", $insert: [
                            {name: "Amit", code: 1, fullname: "Amit Singh", user_id: {$query: {username: "Amit Singh"}}},
                            {name: "Rohit", code: 2, fullname: "Rohit Bansal", reporting_to_id: {$query: {name: "Amit"}}, user_id: {$query: {username: "Rohit"}}},
                            {name: "Sachin", code: 3, fullname: "Sachin Bansal", reporting_to_id: {$query: {name: "Rohit"}}, user_id: {$query: {username: "Sachin"}}},
                            {name: "Ritesh", code: 4, fullname: "Ritesh Bansal", reporting_to_id: {$query: {name: "Sachin"}}, user_id: {$query: {username: "Ritesh"}}}
                        ]},
                        {$collection: "tasks", $insert: [
                            {name: "Task1", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Amit"}}},
                            {name: "Task2", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Rohit"}}},
                            {name: "Task4", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Sachin"}}},
                            {name: "Task3", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Sachin"}}},
                            {name: "Task5", ownerid: {$query: {name: "Rohit"}}, assigntoid: {$query: {name: "Rohit"}}},
                            {name: "Task6", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Ritesh"}}},
                            {name: "Task7", ownerid: {$query: {name: "Sachin"}}, assigntoid: {$query: {name: "Ritesh"}}},
                            {name: "Task8", ownerid: {$query: {name: "Sachin"}}, assigntoid: {$query: {name: "Rohit"}}},
                            {name: "Task9", ownerid: {$query: {name: "Sachin"}}, assigntoid: {$query: {name: "Amit"}}}
                        ]}

                    ];
                    return db.update(update);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Ritesh", password: "ritesh"});
                }).then(
                function (db1) {
                    user = db1;
                }).then(
                function () {
                    user.setContext({__role__: "TaskUser"});
                }).then(
                function () {
                    return user.query({$collection: "employees"});
                }).then(
                function (data) {
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].name).to.eql("Ritesh");
                    expect(data.result[0].code).to.eql("4");
                    expect(data.result[0].fullname).to.eql("Ritesh Bansal");
                    expect(data.result[0].user_id.username).to.eql("Ritesh");
                    expect(data.result[0].user_id.emailid).to.eql("ritesh@daffodilsw.com");
                }).then(
                function () {
                    return user.query({$collection: "employees", $context: {referredField: "ownerid", referredCollection: "tasks"}});
                }).then(
                function (data) {
                    expect(data.result).to.have.length(4);
                    expect(data.result[0].name).to.eql("Amit");
                    expect(data.result[0].code).to.eql("1");
                    expect(data.result[0].fullname).to.eql(undefined);
                    expect(data.result[0].user_id).to.eql(undefined);
                    expect(data.result[1].name).to.eql("Rohit");
                    expect(data.result[1].code).to.eql("2");
                    expect(data.result[1].fullname).to.eql(undefined);
                    expect(data.result[1].user_id).to.eql(undefined);
                    expect(data.result[2].name).to.eql("Sachin");
                    expect(data.result[2].code).to.eql("3");
                    expect(data.result[2].fullname).to.eql(undefined);
                    expect(data.result[2].user_id).to.eql(undefined);
                    expect(data.result[3].name).to.eql("Ritesh");
                    expect(data.result[3].code).to.eql("4");
                    expect(data.result[3].fullname).to.eql(undefined);
                    expect(data.result[3].user_id).to.eql(undefined);
                }).then(
                function () {
                    return user.query({$collection: "employees", $context: {referredField: "assigntoid", referredCollection: "tasks"}});
                }).then(
                function (data) {
                    expect(data.result).to.have.length(0);
                }).then(
                function () {
                    return db.query({$collection: "pl.rolePrivileges", $filter: {id: "Normal Employee"}});
                }).then(
                function (result) {
                    var data = result.result[0];
                    return db.update({$collection: "pl.rolePrivileges", $update: {_id: data._id, $set: {operationInfos: {$update: [
                        {_id: data.operationInfos[0]._id, $set: {fieldInfos: {$insert: [
                            {field: "fullname"}
                        ]}}}
                    ]}}}})
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Ritesh", password: "ritesh"});
                }).then(
                function (db1) {
                    user = db1;
                }).then(
                function () {
                    user.setContext({__role__: "TaskUser"});
                }).then(
                function () {
                    return user.query({$collection: "employees", $context: {referredField: "ownerid", referredCollection: "tasks"}});
                }).then(
                function (data) {
                    expect(data.result).to.have.length(4);
                    expect(data.result[0].name).to.eql("Amit");
                    expect(data.result[0].code).to.eql("1");
                    expect(data.result[0].fullname).to.eql("Amit Singh");
                    expect(data.result[0].user_id).to.eql(undefined);
                    expect(data.result[1].name).to.eql("Rohit");
                    expect(data.result[1].code).to.eql("2");
                    expect(data.result[1].fullname).to.eql("Rohit Bansal");
                    expect(data.result[1].user_id).to.eql(undefined);
                    expect(data.result[2].name).to.eql("Sachin");
                    expect(data.result[2].code).to.eql("3");
                    expect(data.result[2].fullname).to.eql("Sachin Bansal");
                    expect(data.result[2].user_id).to.eql(undefined);
                    expect(data.result[3].name).to.eql("Ritesh");
                    expect(data.result[3].code).to.eql("4");
                    expect(data.result[3].fullname).to.eql("Ritesh Bansal");
                    expect(data.result[3].user_id).to.eql(undefined);
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });

        it('define dotted fk field in fields', function (done) {
            var db = undefined;
            var user = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    return addRolePrivileges(db);
                }).then(
                function () {
                    return db.update({$collection: "pl.applications", $insert: [
                        {id: "SalesManagement", label: "Sales Management", newRole: true},
                        {id: "TaskManagement", label: "Task Management", newRole: true},
                        {id: "RevenueManagement", label: "Revenue Management", newRole: true}
                    ]})
                }).then(
                function () {
                    return db.update({$collection: "pl.rolePrivileges", $insert: [
                        {id: "Normal Employee", type: "Collection", collection: "employees", operationInfos: {$insert: [
                            {type: "find", fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"},
                                {field: "code"}
                            ]}}
                        ]}},
                        {id: "Self Employee", type: "Collection", collection: "employees", filterUI: "json", filterJSON: JSON.stringify({user_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find"}
                        ]}},
                        {id: "Team Employee", type: "Collection", collection: "employees", filterUI: "json", filterJSON: JSON.stringify({reporting_to_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find"}
                        ]}}
                    ]})
                }).then(
                function () {
                    var createRoles = {$collection: "pl.roles", $insert: [
                        {id: "TaskUser", role: "Task User", parentroleid: {$query: {id: "TaskManagement"}}, privileges: [
                            {type: "Privilege", privilegeid: {$query: {id: "Self Employee"}}},
                            {type: "Collection", collection: "tasks", operationInfos: {$insert: [
                                {type: "find"},
                                {type: "insert"},
                                {type: "remove"},
                                {type: "update"},
                                {type: "fk", fkInfos: {$insert: [
                                    {field: "ownerid", privilegeid: {$query: {id: "Normal Employee"}}}
//                                    {field:"assigntoid", privilegeid:{$query:{id:"Team Employee"}}}
                                ]}}
                            ]}}
                        ]}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Amit Singh", password: "amitsingh", emailid: "amit@daffodilsw.com"},
                        {username: "Rohit", password: "rohit", emailid: "rohit@daffodilsw.com"},
                        {username: "Sachin", password: "sachin", emailid: "sachin@daffodilsw.com"},
                        {username: "Ritesh", password: "ritesh", emailid: "ritesh@daffodilsw.com", roles: [
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function (users) {
                    var collectionDefination = [
                        {$collection: "pl.collections", $insert: [
                            {collection: "employees"},
                            {collection: "tasks"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "employees"}}, primary: true},
                            {field: "code", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "fullname", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "reporting_to_id", type: "fk", collectionid: {$query: {collection: "employees"}}, collection: "employees", set: ["name"]},
                            {field: "user_id", type: "fk", collectionid: {$query: {collection: "employees"}}, collection: "pl.users", set: ["username", "emailid"]},

                            {field: "task", type: "string", collectionid: {$query: {collection: "tasks"}}, primary: true},
                            {field: "description", type: "string", collectionid: {$query: {collection: "tasks"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "tasks"}}},
                            {field: "ownerid", type: "fk", collectionid: {$query: {collection: "tasks"}}, collection: "employees", set: ["name"]},
                            {field: "assigntoid", type: "fk", collectionid: {$query: {collection: "tasks"}}, collection: "employees", set: ["name"]}
                        ]}
                    ];
                    return db.update(collectionDefination);
                }).then(
                function (collectionData) {
                    var update = [
                        {$collection: "employees", $insert: [
                            {name: "Amit", code: 1, fullname: "Amit Singh", user_id: {$query: {username: "Amit Singh"}}},
                            {name: "Rohit", code: 2, fullname: "Rohit Bansal", reporting_to_id: {$query: {name: "Amit"}}, user_id: {$query: {username: "Rohit"}}},
                            {name: "Sachin", code: 3, fullname: "Sachin Bansal", reporting_to_id: {$query: {name: "Rohit"}}, user_id: {$query: {username: "Sachin"}}},
                            {name: "Ritesh", code: 4, fullname: "Ritesh Bansal", reporting_to_id: {$query: {name: "Sachin"}}, user_id: {$query: {username: "Ritesh"}}}
                        ]},
                        {$collection: "tasks", $insert: [
                            {task: "Task1", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Amit"}}},
                            {task: "Task2", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Rohit"}}},
                            {task: "Task4", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Sachin"}}},
                            {task: "Task3", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Sachin"}}},
                            {task: "Task5", ownerid: {$query: {name: "Rohit"}}, assigntoid: {$query: {name: "Rohit"}}},
                            {task: "Task6", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Ritesh"}}},
                            {task: "Task8", ownerid: {$query: {name: "Sachin"}}, assigntoid: {$query: {name: "Rohit"}}},
                            {task: "Task7", ownerid: {$query: {name: "Sachin"}}, assigntoid: {$query: {name: "Ritesh"}}},
                            {task: "Task9", ownerid: {$query: {name: "Sachin"}}, assigntoid: {$query: {name: "Amit"}}}
                        ]}

                    ];
                    return db.update(update);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Ritesh", password: "ritesh"});
                }).then(
                function (db1) {
                    user = db1;
                }).then(
                function () {
                    user.setContext({__role__: "TaskUser"});
                }).then(
                function () {
                    return user.query({$collection: "tasks", $fields: {task: 1, "ownerid.name": 1, "ownerid.code": 1, "ownerid.fullname": 1, "assigntoid.name": 1, "assigntoid.code": 1, "assigntoid.fullname": 1}, $filter: {task: "Task6"}});
                }).then(
                function (result) {
                    expect(result.result[0].ownerid.name).to.eql("Amit");
                    expect(result.result[0].ownerid.code).to.eql("1");
                    expect(result.result[0].ownerid.fullname).to.eql(undefined);
                    expect(result.result[0].assigntoid.name).to.eql("Ritesh");
                    expect(result.result[0].assigntoid.code).to.eql("4");
                    expect(result.result[0].assigntoid.fullname).to.eql("Ritesh Bansal");
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });

        it('define dotted multiple fk field in fields', function (done) {
            var db = undefined;
            var user = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    return addRolePrivileges(db);
                }).then(
                function () {
                    return db.update({$collection: "pl.applications", $insert: [
                        {id: "SalesManagement", label: "Sales Management", newRole: true},
                        {id: "TaskManagement", label: "Task Management", newRole: true},
                        {id: "RevenueManagement", label: "Revenue Management", newRole: true}
                    ]})
                }).then(
                function () {
                    return db.update({$collection: "pl.rolePrivileges", $insert: [
                        {id: "Normal Employee", type: "Collection", collection: "employees", operationInfos: {$insert: [
                            {type: "find", fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"},
                                {field: "code"}
                            ]}}
                        ]}},
                        {id: "Self Employee", type: "Collection", collection: "employees", filterUI: "json", filterJSON: JSON.stringify({user_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find"}
                        ]}},
                        {id: "Team Employee", type: "Collection", collection: "employees", filterUI: "json", filterJSON: JSON.stringify({reporting_to_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find"}
                        ]}}
                    ]})
                }).then(
                function () {
                    var createRoles = {$collection: "pl.roles", $insert: [
                        {id: "TaskUser", role: "Task User", parentroleid: {$query: {id: "TaskManagement"}}, privileges: [
                            {type: "Privilege", privilegeid: {$query: {id: "Self Employee"}}},
                            {type: "Collection", collection: "tasks", operationInfos: {$insert: [
                                {type: "find"},
                                {type: "insert"},
                                {type: "remove"},
                                {type: "update"},
                                {type: "fk", fkInfos: {$insert: [
                                    {field: "progressDetails.ownerid", privilegeid: {$query: {id: "Normal Employee"}}}
                                ]}}
                            ]}}
                        ]}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Amit Singh", password: "amitsingh", emailid: "amit@daffodilsw.com"},
                        {username: "Rohit", password: "rohit", emailid: "rohit@daffodilsw.com"},
                        {username: "Sachin", password: "sachin", emailid: "sachin@daffodilsw.com"},
                        {username: "Ritesh", password: "ritesh", emailid: "ritesh@daffodilsw.com", roles: [
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function (users) {
                    var collectionDefination = [
                        {$collection: "pl.collections", $insert: [
                            {collection: "employees"},
                            {collection: "tasks"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "employees"}}, primary: true},
                            {field: "code", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "fullname", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "reporting_to_id", type: "fk", collectionid: {$query: {collection: "employees"}}, collection: "employees", set: ["name"]},
                            {field: "user_id", type: "fk", collectionid: {$query: {collection: "employees"}}, collection: "pl.users", set: ["username", "emailid"]},

                            {field: "task", type: "string", collectionid: {$query: {collection: "tasks"}}, primary: true},
                            {field: "description", type: "string", collectionid: {$query: {collection: "tasks"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "tasks"}}},
                            {field: "assigntoid", type: "fk", collectionid: {$query: {collection: "tasks"}}, collection: "employees", set: ["name"]},
                            {field: "progressDetails", type: "object", collectionid: {$query: {collection: "tasks"}}, multiple: true},
                            {field: "ownerid", type: "fk", collectionid: {$query: {collection: "tasks"}}, collection: "employees", set: ["name"], parentfieldid: {$query: {collectionid: {$query: {collection: "tasks"}}, field: "progressDetails"}}}
                        ]}
                    ];
                    return db.update(collectionDefination);
                }).then(
                function (collectionData) {
                    var update = [
                        {$collection: "employees", $insert: [
                            {name: "Amit", code: 1, fullname: "Amit Singh", user_id: {$query: {username: "Amit Singh"}}},
                            {name: "Rohit", code: 2, fullname: "Rohit Bansal", reporting_to_id: {$query: {name: "Amit"}}, user_id: {$query: {username: "Rohit"}}},
                            {name: "Sachin", code: 3, fullname: "Sachin Bansal", reporting_to_id: {$query: {name: "Rohit"}}, user_id: {$query: {username: "Sachin"}}},
                            {name: "Ritesh", code: 4, fullname: "Ritesh Bansal", reporting_to_id: {$query: {name: "Sachin"}}, user_id: {$query: {username: "Ritesh"}}}
                        ]},
                        {$collection: "tasks", $insert: [
                            {task: "Task1", progressDetails: [
                                {ownerid: {$query: {name: "Amit"}}}
                            ], assigntoid: {$query: {name: "Amit"}}},
                            {task: "Task2", progressDetails: [
                                {ownerid: {$query: {name: "Amit"}}}
                            ], assigntoid: {$query: {name: "Rohit"}}},
                            {task: "Task4", progressDetails: [
                                {ownerid: {$query: {name: "Amit"}}}
                            ], assigntoid: {$query: {name: "Sachin"}}},
                            {task: "Task3", progressDetails: [
                                {ownerid: {$query: {name: "Amit"}}}
                            ], assigntoid: {$query: {name: "Sachin"}}},
                            {task: "Task5", progressDetails: [
                                {ownerid: {$query: {name: "Rohit"}}}
                            ], assigntoid: {$query: {name: "Rohit"}}},
                            {task: "Task6", progressDetails: [
                                {ownerid: {$query: {name: "Amit"}}}
                            ], assigntoid: {$query: {name: "Ritesh"}}},
                            {task: "Task8", progressDetails: [
                                {ownerid: {$query: {name: "Sachin"}}}
                            ], assigntoid: {$query: {name: "Rohit"}}},
                            {task: "Task7", progressDetails: [
                                {ownerid: {$query: {name: "Sachin"}}}
                            ], assigntoid: {$query: {name: "Ritesh"}}},
                            {task: "Task9", progressDetails: [
                                {ownerid: {$query: {name: "Sachin"}}}
                            ], assigntoid: {$query: {name: "Amit"}}}
                        ]}
                    ];
                    return db.update(update);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Ritesh", password: "ritesh"});
                }).then(
                function (db1) {
                    user = db1;
                }).then(
                function () {
                    user.setContext({__role__: "TaskUser"});
                }).then(
                function () {
                    return user.query({$collection: "tasks", $fields: {task: 1, "progressDetails.ownerid.name": 1, "progressDetails.ownerid.code": 1, "progressDetails.ownerid.fullname": 1, "assigntoid.name": 1, "assigntoid.code": 1, "assigntoid.fullname": 1}, $filter: {task: "Task6"}});
                }).then(
                function (result) {
                    expect(result.result[0].progressDetails[0].ownerid.name).to.eql("Amit");
                    expect(result.result[0].progressDetails[0].ownerid.code).to.eql("1");
                    expect(result.result[0].progressDetails[0].ownerid.fullname).to.eql(undefined);
                    expect(result.result[0].assigntoid.name).to.eql("Ritesh");
                    expect(result.result[0].assigntoid.code).to.eql("4");
                    expect(result.result[0].assigntoid.fullname).to.eql("Ritesh Bansal");
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });

        it('Saving in fk field with upsert false', function (done) {
            var db = undefined;
            var user = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    return addRolePrivileges(db);
                }).then(
                function () {
                    return db.update({$collection: "pl.applications", $insert: [
                        {id: "SalesManagement", label: "Sales Management", newRole: true},
                        {id: "TaskManagement", label: "Task Management", newRole: true},
                        {id: "RevenueManagement", label: "Revenue Management", newRole: true}
                    ]})
                }).then(
                function () {
                    return db.update({$collection: "pl.rolePrivileges", $insert: [
                        {id: "Normal Employee", type: "Collection", collection: "employees", operationInfos: {$insert: [
                            {type: "find", fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"},
                                {field: "code"}
                            ]}}
                        ]}},
                        {id: "Self Employee", type: "Collection", collection: "employees", filterUI: "json", filterJSON: JSON.stringify({user_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find"}
                        ]}},
                        {id: "Team Employee", type: "Collection", collection: "employees", filterUI: "json", filterJSON: JSON.stringify({reporting_to_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find"}
                        ]}}
                    ]})
                }).then(
                function () {
                    var createRoles = {$collection: "pl.roles", $insert: [
                        {id: "TaskUser", role: "Task User", parentroleid: {$query: {id: "TaskManagement"}}, privileges: [
                            {type: "Privilege", privilegeid: {$query: {id: "Self Employee"}}},
                            {type: "Collection", collection: "tasks", operationInfos: {$insert: [
                                {type: "find"},
                                {type: "insert"},
                                {type: "remove"},
                                {type: "update"},
                                {type: "fk", fkInfos: {$insert: [
                                    {field: "ownerid", privilegeid: {$query: {id: "Normal Employee"}}}
                                ]}}
                            ]}}
                        ]}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Amit Singh", password: "amitsingh", emailid: "amit@daffodilsw.com"},
                        {username: "Rohit", password: "rohit", emailid: "rohit@daffodilsw.com"},
                        {username: "Sachin", password: "sachin", emailid: "sachin@daffodilsw.com"},
                        {username: "Ritesh", password: "ritesh", emailid: "ritesh@daffodilsw.com", roles: [
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function (users) {
                    var collectionDefination = [
                        {$collection: "pl.collections", $insert: [
                            {collection: "employees"},
                            {collection: "tasks"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "employees"}}, primary: true},
                            {field: "code", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "fullname", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "reporting_to_id", type: "fk", collectionid: {$query: {collection: "employees"}}, collection: "employees", set: ["name"]},
                            {field: "user_id", type: "fk", collectionid: {$query: {collection: "employees"}}, collection: "pl.users", set: ["username", "emailid"]},

                            {field: "task", type: "string", collectionid: {$query: {collection: "tasks"}}, primary: true},
                            {field: "description", type: "string", collectionid: {$query: {collection: "tasks"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "tasks"}}},
                            {field: "ownerid", type: "fk", collectionid: {$query: {collection: "tasks"}}, collection: "employees", set: ["name"]},
                            {field: "assigntoid", type: "fk", collectionid: {$query: {collection: "tasks"}}, collection: "employees", set: ["name"]}
                        ]}
                    ];
                    return db.update(collectionDefination);
                }).then(
                function (collectionData) {
                    var update = [
                        {$collection: "employees", $insert: [
                            {name: "Amit", code: 1, fullname: "Amit Singh", user_id: {$query: {username: "Amit Singh"}}},
                            {name: "Rohit", code: 2, fullname: "Rohit Bansal", reporting_to_id: {$query: {name: "Amit"}}, user_id: {$query: {username: "Rohit"}}},
                            {name: "Sachin", code: 3, fullname: "Sachin Bansal", reporting_to_id: {$query: {name: "Rohit"}}, user_id: {$query: {username: "Sachin"}}},
                            {name: "Ritesh", code: 4, fullname: "Ritesh Bansal", reporting_to_id: {$query: {name: "Sachin"}}, user_id: {$query: {username: "Ritesh"}}}
                        ]},
                        {$collection: "tasks", $insert: [
                            {task: "Task1", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Amit"}}}
                        ]}
                    ];
                    return db.update(update);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Ritesh", password: "ritesh"});
                }).then(
                function (db1) {
                    user = db1;
                }).then(
                function () {
                    user.setContext({__role__: "TaskUser"});
                }).then(
                function () {
                    return user.update({$collection: "tasks", $insert: [
                        {task: "newTask", ownerid: {$query: {name: "Rohit"}}, assigntoid: {$query: {name: "Ritesh"}}}
                    ]})
                }).then(
                function () {
                    return user.query({$collection: "tasks", $filter: {task: "newTask"}});
                }).then(
                function (result) {
                    expect(result.result).to.have.length(1);
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });
        it('Saving in fk fields in multiple field with upsert false', function (done) {
            var db = undefined;
            var user = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    return addRolePrivileges(db);
                }).then(
                function () {
                    return db.update({$collection: "pl.applications", $insert: [
                        {id: "SalesManagement", label: "Sales Management", newRole: true},
                        {id: "TaskManagement", label: "Task Management", newRole: true},
                        {id: "RevenueManagement", label: "Revenue Management", newRole: true}
                    ]})
                }).then(
                function () {
                    return db.update({$collection: "pl.rolePrivileges", $insert: [
                        {id: "Normal Employee", type: "Collection", collection: "employees", operationInfos: {$insert: [
                            {type: "find", fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"},
                                {field: "code"}
                            ]}}
                        ]}},
                        {id: "Self Employee", type: "Collection", collection: "employees", filterUI: "json", filterJSON: JSON.stringify({user_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find"}
                        ]}},
                        {id: "Team Employee", type: "Collection", collection: "employees", filterUI: "json", filterJSON: JSON.stringify({reporting_to_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find"}
                        ]}}
                    ]})
                }).then(
                function () {
                    var createRoles = {$collection: "pl.roles", $insert: [
                        {id: "TaskUser", role: "Task User", parentroleid: {$query: {id: "TaskManagement"}}, privileges: [
                            {type: "Privilege", privilegeid: {$query: {id: "Self Employee"}}},
                            {type: "Collection", collection: "tasks", operationInfos: {$insert: [
                                {type: "find"},
                                {type: "insert"},
                                {type: "remove"},
                                {type: "update"},
                                {type: "fk", fkInfos: {$insert: [
                                    {field: "progressDetails.ownerid", privilegeid: {$query: {id: "Normal Employee"}}}
                                ]}}
                            ]}}
                        ]}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Amit Singh", password: "amitsingh", emailid: "amit@daffodilsw.com"},
                        {username: "Rohit", password: "rohit", emailid: "rohit@daffodilsw.com"},
                        {username: "Sachin", password: "sachin", emailid: "sachin@daffodilsw.com"},
                        {username: "Ritesh", password: "ritesh", emailid: "ritesh@daffodilsw.com", roles: [
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function (users) {
                    var collectionDefination = [
                        {$collection: "pl.collections", $insert: [
                            {collection: "employees"},
                            {collection: "tasks"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "employees"}}, primary: true},
                            {field: "code", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "fullname", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "reporting_to_id", type: "fk", collectionid: {$query: {collection: "employees"}}, collection: "employees", set: ["name"]},
                            {field: "user_id", type: "fk", collectionid: {$query: {collection: "employees"}}, collection: "pl.users", set: ["username", "emailid"]},

                            {field: "task", type: "string", collectionid: {$query: {collection: "tasks"}}, primary: true},
                            {field: "description", type: "string", collectionid: {$query: {collection: "tasks"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "tasks"}}},
                            {field: "assigntoid", type: "fk", collectionid: {$query: {collection: "tasks"}}, collection: "employees", set: ["name"]},
                            {field: "progressDetails", type: "object", collectionid: {$query: {collection: "tasks"}}, multiple: true},
                            {field: "ownerid", type: "fk", collectionid: {$query: {collection: "tasks"}}, collection: "employees", set: ["name"], parentfieldid: {$query: {collectionid: {$query: {collection: "tasks"}}, field: "progressDetails"}}}
                        ]}
                    ];
                    return db.update(collectionDefination);
                }).then(
                function (collectionData) {
                    var update = [
                        {$collection: "employees", $insert: [
                            {name: "Amit", code: 1, fullname: "Amit Singh", user_id: {$query: {username: "Amit Singh"}}},
                            {name: "Rohit", code: 2, fullname: "Rohit Bansal", reporting_to_id: {$query: {name: "Amit"}}, user_id: {$query: {username: "Rohit"}}},
                            {name: "Sachin", code: 3, fullname: "Sachin Bansal", reporting_to_id: {$query: {name: "Rohit"}}, user_id: {$query: {username: "Sachin"}}},
                            {name: "Ritesh", code: 4, fullname: "Ritesh Bansal", reporting_to_id: {$query: {name: "Sachin"}}, user_id: {$query: {username: "Ritesh"}}}
                        ]},
                        {$collection: "tasks", $insert: [
                            {task: "Task1", progressDetails: [
                                {ownerid: {$query: {name: "Amit"}}}
                            ], assigntoid: {$query: {name: "Amit"}}}
                        ]}
                    ];
                    return db.update(update);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Ritesh", password: "ritesh"});
                }).then(
                function (db1) {
                    user = db1;
                }).then(
                function () {
                    user.setContext({__role__: "TaskUser"});
                }).then(
                function () {
                    return user.update({$collection: "tasks", $insert: [
                        {task: "newTask", progressDetails: {$insert: [
                            {ownerid: {$query: {name: "Rohit"}}}
                        ]}, assigntoid: {$query: {name: "Ritesh"}}}
                    ]})
                }).then(
                function () {
                    return user.query({$collection: "tasks", $filter: {task: "newTask"}});
                }).then(
                function (result) {
                    expect(result.result).to.have.length(1);
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });
        it('Saving in fk field with upsert true', function (done) {
            var db = undefined;
            var user = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    return addRolePrivileges(db);
                }).then(
                function () {
                    return db.update({$collection: "pl.applications", $insert: [
                        {id: "SalesManagement", label: "Sales Management", newRole: true},
                        {id: "TaskManagement", label: "Task Management", newRole: true},
                        {id: "RevenueManagement", label: "Revenue Management", newRole: true}
                    ]})
                }).then(
                function () {
                    return db.update({$collection: "pl.rolePrivileges", $insert: [
                        {id: "Normal Employee", type: "Collection", collection: "employees", operationInfos: {$insert: [
                            {type: "find", fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"},
                                {field: "code"}
                            ]}}
                        ]}},
                        {id: "Self Employee", type: "Collection", collection: "employees", filterUI: "json", filterJSON: JSON.stringify({user_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find"}
                        ]}},
                        {id: "Team Employee", type: "Collection", collection: "employees", filterUI: "json", filterJSON: JSON.stringify({reporting_to_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find"}
                        ]}}
                    ]})
                }).then(
                function () {
                    var createRoles = {$collection: "pl.roles", $insert: [
                        {id: "TaskUser", role: "Task User", parentroleid: {$query: {id: "TaskManagement"}}, privileges: [
                            {type: "Privilege", privilegeid: {$query: {id: "Self Employee"}}},
                            {type: "Collection", collection: "tasks", operationInfos: {$insert: [
                                {type: "find"},
                                {type: "insert"},
                                {type: "remove"},
                                {type: "update"},
                                {type: "fk", fkInfos: {$insert: [
                                    {field: "ownerid", privilegeid: {$query: {id: "Normal Employee"}}}
//                                    {field:"assigntoid", privilegeid:{$query:{id:"Team Employee"}}}
                                ]}}
                            ]}}
                        ]}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    var createUsers = {$collection: "pl.users", $insert: [
                        {username: "Amit Singh", password: "amitsingh", emailid: "amit@daffodilsw.com"},
                        {username: "Rohit", password: "rohit", emailid: "rohit@daffodilsw.com"},
                        {username: "Sachin", password: "sachin", emailid: "sachin@daffodilsw.com"},
                        {username: "Ritesh", password: "ritesh", emailid: "ritesh@daffodilsw.com", roles: [
                            {role: {$query: {id: "TaskUser"}}, appid: "TaskManagement"}
                        ]}
                    ], $modules: {"Role": 0}};
                    return db.update(createUsers);
                }).then(
                function (users) {
                    var collectionDefination = [
                        {$collection: "pl.collections", $insert: [
                            {collection: "employees"},
                            {collection: "tasks"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "employees"}}, primary: true},
                            {field: "code", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "fullname", type: "string", collectionid: {$query: {collection: "employees"}}},
                            {field: "reporting_to_id", type: "fk", collectionid: {$query: {collection: "employees"}}, collection: "employees", set: ["name"]},
                            {field: "user_id", type: "fk", collectionid: {$query: {collection: "employees"}}, collection: "pl.users", set: ["username", "emailid"]},

                            {field: "task", type: "string", collectionid: {$query: {collection: "tasks"}}, primary: true},
                            {field: "description", type: "string", collectionid: {$query: {collection: "tasks"}}},
                            {field: "status", type: "string", collectionid: {$query: {collection: "tasks"}}},
                            {field: "ownerid", type: "fk", collectionid: {$query: {collection: "tasks"}}, collection: "employees", set: ["name"], upsert: true},
                            {field: "assigntoid", type: "fk", collectionid: {$query: {collection: "tasks"}}, collection: "employees", set: ["name"]}
                        ]}
                    ];
                    return db.update(collectionDefination);
                }).then(
                function (collectionData) {
                    var update = [
                        {$collection: "employees", $insert: [
                            {name: "Amit", code: 1, fullname: "Amit Singh", user_id: {$query: {username: "Amit Singh"}}},
                            {name: "Rohit", code: 2, fullname: "Rohit Bansal", reporting_to_id: {$query: {name: "Amit"}}, user_id: {$query: {username: "Rohit"}}},
                            {name: "Sachin", code: 3, fullname: "Sachin Bansal", reporting_to_id: {$query: {name: "Rohit"}}, user_id: {$query: {username: "Sachin"}}},
                            {name: "Ritesh", code: 4, fullname: "Ritesh Bansal", reporting_to_id: {$query: {name: "Sachin"}}, user_id: {$query: {username: "Ritesh"}}}
                        ]},
                        {$collection: "tasks", $insert: [
                            {task: "Task1", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Amit"}}},
                            {task: "Task2", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Rohit"}}},
                            {task: "Task4", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Sachin"}}},
                            {task: "Task3", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Sachin"}}},
                            {task: "Task5", ownerid: {$query: {name: "Rohit"}}, assigntoid: {$query: {name: "Rohit"}}},
                            {task: "Task6", ownerid: {$query: {name: "Amit"}}, assigntoid: {$query: {name: "Ritesh"}}},
                            {task: "Task8", ownerid: {$query: {name: "Sachin"}}, assigntoid: {$query: {name: "Rohit"}}},
                            {task: "Task7", ownerid: {$query: {name: "Sachin"}}, assigntoid: {$query: {name: "Ritesh"}}},
                            {task: "Task9", ownerid: {$query: {name: "Sachin"}}, assigntoid: {$query: {name: "Amit"}}}
                        ]}

                    ];
                    return db.update(update);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username: "Ritesh", password: "ritesh"});
                }).then(
                function (db1) {
                    user = db1;
                }).then(
                function () {
                    user.setContext({__role__: "TaskUser"});
                }).then(
                function () {
                    return user.update({$collection: "tasks", $insert: [
                        {task: "newTask", ownerid: {$query: {name: "Rohit"}}, assigntoid: {$query: {name: "Ritesh"}}}
                    ]})
                }).then(
                function () {
                    return user.query({$collection: "tasks", $filter: {task: "newTask"}});
                }).then(
                function (result) {
                    expect(result.result).to.have.length(1);
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });
    })

    describe("Synch privileges Update", function () {

        beforeEach(function (done) {
            Testcases.beforeEach().then(
                function () {
                    return ApplaneDB.getAdminDB();
                }).then(
                function (adminDB) {
                    var adminDb = adminDB;
                    var insertDbs = {$collection: "pl.dbs", $insert: [
                        {"db": "afb", "sandboxDb": "afb_sb", "globalDb": "", "ensureDefaultCollections": true, "guestUserName": "afb", "globalUserName": "afb", "globalPassword": "afb", "globalUserAdmin": true, autoSynch: false},
                        {"db": "daffodil", "sandboxDb": "daffodil_sb", "globalDb": "afb", "ensureDefaultCollections": false, "guestUserName": "daffodil", "globalUserName": "daffodil", "globalPassword": "daffodil", "globalUserAdmin": true, autoSynch: true}
                    ]};
                    return adminDb.update(insertDbs);
                }).then(
                function () {
                    done();
                }).fail(function (err) {
                    done(err)
                });
        })

        afterEach(function (done) {

            return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"}).then(
                function (daffodil_sbDb) {
                    return daffodil_sbDb.dropDatabase();
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
                }).then(
                function (daffodilDb) {
                    return daffodilDb.dropDatabase();
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
                }).then(
                function (afb_sbDb) {
                    return afb_sbDb.dropDatabase();
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, "afb", {username: "afb", "password": "afb"})
                }).then(
                function (afb) {
                    return afb.dropDatabase();
                }).then(
                function () {
                    return Testcases.afterEach();
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })

        it('savedPrivileges in role', function (done) {
            var afbDb = undefined;
            var afb_SbDb = undefined;
            var daffodilDb = undefined;
            var daffodil_SbDb = undefined;

            return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
                .then(
                function (dbName) {
                    afb_SbDb = dbName;
                }).then(
                function () {
                    var rolePrivileges = [
                        {id: "HR Employee", type: "Collection", collection: "employees", operationInfos: {$insert: [
                            {type: "find", sequence: 0},
                            {type: "insert", sequence: 0},
                            {type: "update", sequence: 0},
                            {type: "remove", sequence: 0}
                        ]}},
                        {id: "Normal Employee", type: "Collection", collection: "employees", filterUI: "json", "filterJSON": JSON.stringify({user_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find", sequence: 0},
                            {type: "update", sequence: 0, fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"}
                            ]}}
                        ]}}
                    ]
                    return afb_SbDb.update({$collection: "pl.rolePrivileges", $insert: rolePrivileges})
                }).then(
                function () {
                    return afb_SbDb.invokeFunction("Commit.commitProcess", [
                        {data: {commit: true}}
                    ]);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
                }).then(
                function (dbName) {
                    daffodilDb = dbName;
                    return daffodilDb.query({$collection: "pl.rolePrivileges"});
                }).then(
                function (result) {
                    expect(result.result).to.have.length(2);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
                }).then(
                function (dbName) {
                    daffodil_SbDb = dbName;
                    return daffodil_SbDb.query({$collection: "pl.rolePrivileges", $filter: {id: "Normal Employee"}});
                }).then(
                function (rolePrivileges) {
                    var rolePrivilege = rolePrivileges.result[0];
                    return daffodil_SbDb.update({$collection: "pl.rolePrivileges", $update: {_id: rolePrivilege._id, $set: {label: "N E"}}})
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
                }).then(
                function (dbName) {
                    afb_SbDb = dbName;
                    return afb_SbDb.query({$collection: "pl.rolePrivileges", $filter: {"id": "Normal Employee"}});
                }).then(
                function (menuData) {
                    var privilege = menuData.result[0];
                    return afb_SbDb.update({$collection: "pl.rolePrivileges", $update: {_id: privilege._id, $set: {operationInfos: {$insert: [
                        {type: "insert"}
                    ]}}}});
                }).then(
                function () {
                    return afb_SbDb.query({$collection: "pl.rolePrivileges", $filter: {"id": "Normal Employee"}});
                }).then(
                function (menuData) {
                    var privilege = menuData.result[0];
                    return afb_SbDb.update({$collection: "pl.rolePrivileges", $update: {_id: privilege._id, $set: {operationInfos: {$insert: [
                        {type: "remove"}
                    ]}}}});
                }).then(
                function () {
                    return afb_SbDb.invokeFunction("Commit.commitProcess", [
                        {data: {commit: true}}
                    ]);
                }).then(
                function () {
                    return afb_SbDb.query({$collection: "pl.rolePrivileges", $filter: {"id": "Normal Employee"}});
                }).then(
                function (menuData) {
                    expect(menuData.result[0].operationInfos).to.have.length(4);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
                }).then(
                function (dbName) {
                    daffodilDb = dbName;
                    return daffodilDb.query({$collection: "pl.rolePrivileges", $filter: {"id": "Normal Employee"}});
                }).then(
                function (menuData) {
                    expect(menuData.result[0].operationInfos).to.have.length(4);
                    return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"});
                }).then(
                function (dbName) {
                    daffodil_SbDb = dbName;
                    return daffodil_SbDb.query({$collection: "pl.rolePrivileges", $filter: {"id": "Normal Employee"}});
                }).then(
                function (menuData) {
                    expect(menuData.result[0].operationInfos).to.have.length(4);
                }).then(
                function () {
                    done();
                }).fail(function (err) {
                    done(err)
                });

        });

        it('Synch role in update having role privileges in single or in fk action', function (done) {
            var afbDb = undefined;
            var afb_SbDb = undefined;
            var daffodilDb = undefined;
            var daffodil_SbDb = undefined;

            return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
                .then(
                function (dbName) {
                    afb_SbDb = dbName;
                }).then(
                function () {
                    return addRolePrivileges(afb_SbDb);
                }).then(
                function () {
                    return afb_SbDb.update({$collection: "pl.applications", $insert: [
                        {id: "SalesManagement", label: "Sales Management", newRole: true},
                        {id: "TaskManagement", label: "Task Management", newRole: true},
                        {id: "RevenueManagement", label: "Revenue Management", newRole: true}
                    ]})
                }).then(
                function () {
                    return afb_SbDb.update({$collection: "pl.rolePrivileges", $insert: [
                        {id: "Normal Employee", type: "Collection", collection: "employees", operationInfos: {$insert: [
                            {type: "find", fieldsAvailability: "Include", fieldInfos: {$insert: [
                                {field: "name"},
                                {field: "code"}
                            ]}}
                        ]}},
                        {id: "Self Employee", type: "Collection", collection: "employees", filterUI: "json", filterJSON: JSON.stringify({user_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find"}
                        ]}},
                        {id: "Team Employee", type: "Collection", collection: "employees", filterUI: "json", filterJSON: JSON.stringify({reporting_to_id: "$$CurrentUser"}), operationInfos: {$insert: [
                            {type: "find"}
                        ]}}
                    ]})
                }).then(
                function () {
                    var createRoles = {$collection: "pl.roles", $insert: [
                        {id: "TaskUser", role: "Task User", parentroleid: {$query: {id: "TaskManagement"}}, privileges: [
                            {type: "Privilege", privilegeid: {$query: {id: "Self Employee"}}},
                            {type: "Collection", collection: "tasks", operationInfos: {$insert: [
                                {type: "find"},
                                {type: "insert"},
                                {type: "remove"},
                                {type: "update"},
                                {type: "fk", fkInfos: {$insert: [
                                    {field: "ownerid", privilegeid: {$query: {id: "Normal Employee"}}},
                                    {field: "assigntoid", privilegeid: {$query: {id: "Team Employee"}}}
                                ]}}
                            ]}}
                        ]}
                    ]};
                    return afb_SbDb.update(createRoles);
                }).then(
                function () {
                    return afb_SbDb.invokeFunction("Commit.commitProcess", [
                        {data: {commit: true}}
                    ]);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
                }).then(
                function (dbName) {
                    daffodilDb = dbName;
                    return daffodilDb.query({$collection: "pl.rolePrivileges"});
                }).then(
                function (result) {
                    expect(result.result).to.have.length(6);
                }).then(
                function () {
                    return daffodilDb.query({$collection: "pl.roles"});
                }).then(
                function (result) {
                    expect(result.result).to.have.length(4);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
                }).then(
                function (dbName) {
                    daffodil_SbDb = dbName;
                    return daffodil_SbDb.query({$collection: "pl.roles", $filter: {id: "TaskUser"}});
                }).then(
                function (rolePrivileges) {
                    var rolePrivilege = rolePrivileges.result[0];
                    return daffodil_SbDb.update({$collection: "pl.roles", $update: {_id: rolePrivilege._id, $set: {role: "Task User Daffodil"}}})
                }).then(
                function () {
                    return daffodil_SbDb.invokeFunction("Commit.commitProcess", [
                        {data: {commit: true}}
                    ]);
                }).then(
                function (dbName) {
                    return daffodil_SbDb.query({$collection: "pl.roles", $filter: {id: "TaskUser"}});
                }).then(
                function (rolePrivileges) {
                    var rolePrivilege = rolePrivileges.result[0];
                    return daffodil_SbDb.update({$collection: "pl.roles", $update: {_id: rolePrivilege._id, $set: {privileges: {$insert: [
                        {type: "Collection", collection: "test", operationInfos: {$insert: [
                            {type: "find"}
                        ]}}
                    ]}}}})
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
                }).then(
                function (dbName) {
                    afb_SbDb = dbName;
                    return afb_SbDb.query({$collection: "pl.rolePrivileges", $filter: {"id": "Normal Employee"}});
                }).then(
                function (menuData) {
                    var privilege = menuData.result[0];
                    return afb_SbDb.update({$collection: "pl.rolePrivileges", $update: {_id: privilege._id, $set: {operationInfos: {$insert: [
                        {type: "insert"}
                    ]}}}});
                }).then(
                function () {
                    return afb_SbDb.query({$collection: "pl.rolePrivileges", $filter: {"id": "Normal Employee"}});
                }).then(
                function (menuData) {
                    var privilege = menuData.result[0];
                    return afb_SbDb.update({$collection: "pl.rolePrivileges", $update: {_id: privilege._id, $set: {operationInfos: {$insert: [
                        {type: "remove"}
                    ]}}}});
                }).then(
                function () {
                    return afb_SbDb.query({$collection: "pl.rolePrivileges", $filter: {"id": "Self Employee"}});
                }).then(
                function (menuData) {
                    var privilege = menuData.result[0];
                    return afb_SbDb.update({$collection: "pl.rolePrivileges", $update: {_id: privilege._id, $set: {operationInfos: {$insert: [
                        {type: "remove"}
                    ]}}}});
                }).then(
                function () {
                    return afb_SbDb.query({$collection: "pl.rolePrivileges", $filter: {"id": "Normal Employee"}});
                }).then(
                function (privilege) {
                    expect(privilege.result[0].operationInfos).to.have.length(3);
                }).then(
                function () {
                    return afb_SbDb.query({$collection: "pl.rolePrivileges", $filter: {"id": "Self Employee"}});
                }).then(
                function (privilege) {
                    expect(privilege.result[0].operationInfos).to.have.length(2);
                }).then(
                function () {
                    return afb_SbDb.query({$collection: "pl.roles", $filter: {"id": "TaskUser"}});
                }).then(
                function (privilege) {
                    var privileges = privilege.result[0].privileges;
                    expect(privileges).to.have.length(2);
                    expect(privileges[0].operationInfos).to.have.length(2);
                    expect(JSON.parse(privileges[0].actions)).to.have.length(2);
                    expect(privileges[1].operationInfos).to.have.length(5);
                    var actions = JSON.parse(privileges[1].actions);
                    expect(actions).to.have.length(5);
                    expect(actions[0]).to.eql("find");
                    expect(actions[1]).to.eql("insert");
                    expect(actions[2]).to.eql("remove");
                    expect(actions[3]).to.eql("update");
                    var fkFields = actions[4].fk.fkFields;
                    var ownerPrivileges = fkFields.ownerid;
                    var assigntoPrivileges = fkFields.assigntoid;
                    expect(ownerPrivileges.id).to.eql("Normal Employee");
                    expect(ownerPrivileges.actions).to.have.length(3);
                    expect(assigntoPrivileges.id).to.eql("Team Employee");
                    expect(assigntoPrivileges.actions).to.have.length(1);
                }).then(
                function () {
                    return afb_SbDb.invokeFunction("Commit.commitProcess", [
                        {data: {commit: true}}
                    ]);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
                }).then(
                function (dbName) {
                    daffodilDb = dbName;
                }).then(
                function () {
                    return daffodilDb.query({$collection: "pl.rolePrivileges", $filter: {"id": "Normal Employee"}});
                }).then(
                function (privilege) {
                    expect(privilege.result[0].operationInfos).to.have.length(3);
                }).then(
                function () {
                    return daffodilDb.query({$collection: "pl.rolePrivileges", $filter: {"id": "Self Employee"}});
                }).then(
                function (privilege) {
                    expect(privilege.result[0].operationInfos).to.have.length(2);
                }).then(
                function () {
                    return daffodilDb.query({$collection: "pl.roles", $filter: {"id": "TaskUser"}});
                }).then(
                function (privilege) {
                    var privileges = privilege.result[0].privileges;
                    expect(privileges).to.have.length(2);
                    expect(privileges[0].operationInfos).to.have.length(2);
                    expect(JSON.parse(privileges[0].actions)).to.have.length(2);
                    expect(privileges[1].operationInfos).to.have.length(5);
                    var actions = JSON.parse(privileges[1].actions);
                    expect(actions).to.have.length(5);
                    expect(actions[0]).to.eql("find");
                    expect(actions[1]).to.eql("insert");
                    expect(actions[2]).to.eql("remove");
                    expect(actions[3]).to.eql("update");
                    var fkFields = actions[4].fk.fkFields;
                    var ownerPrivileges = fkFields.ownerid;
                    var assigntoPrivileges = fkFields.assigntoid;
                    expect(ownerPrivileges.id).to.eql("Normal Employee");
                    expect(ownerPrivileges.actions).to.have.length(3);
                    expect(assigntoPrivileges.id).to.eql("Team Employee");
                    expect(assigntoPrivileges.actions).to.have.length(1);
                }).then(
                function (menuData) {
                    return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"});
                }).then(
                function (dbName) {
                    daffodil_SbDb = dbName;
                }).then(
                function () {
                    return daffodil_SbDb.query({$collection: "pl.rolePrivileges", $filter: {"id": "Normal Employee"}});
                }).then(
                function (privilege) {
                    expect(privilege.result[0].operationInfos).to.have.length(3);
                }).then(
                function () {
                    return daffodil_SbDb.query({$collection: "pl.roles", $filter: {"id": "TaskUser"}});
                }).then(
                function (privilege) {
                    var privileges = privilege.result[0].privileges;
                    expect(privileges).to.have.length(3);
                    expect(privileges[0].operationInfos).to.have.length(2);
                    expect(JSON.parse(privileges[0].actions)).to.have.length(2);
                    expect(privileges[1].operationInfos).to.have.length(5);
                    var actions = JSON.parse(privileges[1].actions);
                    expect(actions).to.have.length(5);
                    expect(actions[0]).to.eql("find");
                    expect(actions[1]).to.eql("insert");
                    expect(actions[2]).to.eql("remove");
                    expect(actions[3]).to.eql("update");
                    var fkFields = actions[4].fk.fkFields;
                    var ownerPrivileges = fkFields.ownerid;
                    var assigntoPrivileges = fkFields.assigntoid;
                    expect(ownerPrivileges.id).to.eql("Normal Employee");
                    expect(ownerPrivileges.actions).to.have.length(3);
                    expect(assigntoPrivileges.id).to.eql("Team Employee");
                    expect(assigntoPrivileges.actions).to.have.length(1);
                }).then(
                function () {
                    done();
                }).fail(function (err) {
                    done(err)
                });

        });

    })

})

function addRolePrivileges(db) {
    return db.update({$collection: "pl.rolePrivileges", $insert: [
        {id: "Metadata", type: "Regex", collection: "^pl\\.", operationInfos: {$insert: [
            {type: "find"},
            {type: "insert"},
            {type: "update"},
            {type: "remove"}
        ]}},
        {id: "User", type: "Collection", collection: "pl.users", operationInfos: {$insert: [
            {type: "find", sequence: 1, fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                {field: "password"}
            ]}},
            {type: "insert", sequence: 2, filterUI: "grid", filterInfos: {$insert: [
                {field: "_id", value: "$$CurrentUserAdmin"}
            ]}},
            {type: "update", sequence: 3, fieldsAvailability: "Exclude", fieldInfos: {$insert: [
                {field: "username"},
                {field: "password"},
                {field: "status"},
                {field: "emailid"},
                {field: "roles"}
            ]}},
            {type: "update", sequence: 4, fieldsAvailability: "Include", fieldInfos: {$insert: [
                {field: "username"},
                {field: "password"},
                {field: "status"},
                {field: "emailid"},
                {field: "roles"}
            ]}, filterUI: "grid", filterInfos: {$insert: [
                {field: "_id", value: "$$CurrentUserAdmin"}
            ]}},
            {type: "remove", sequence: 5, filterUI: "grid", filterInfos: {$insert: [
                {field: "_id", value: "$$CurrentUserAdmin"}
            ]}}
        ]}},
        {id: "Default", type: "Default", operationInfos: {$insert: [
            {type: "find", primaryFields: true}
        ]}}
    ]})
}