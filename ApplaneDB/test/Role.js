/**
 * mocha --recursive --timeout 150000 -g "roles testcases" --reporter spec
 * mocha --recursive --timeout 150000 -g "roles testcases query" --reporter spec
 * mocha --recursive --timeout 150000 -g "Roles Below applications" --reporter spec
 * >>To check user role privielge
 beta.business.applane.com/rest/invoke?function=Porting.getUserPrivileges&token=548e87d56a265d9823d50f31&parameters=[{"username":"Amit.Singh"}]
 it will give all privileges of collections.Also can define collectionname as collection:[] or collection:"" to get Privilege for particular collections , all:true will get all role on that collection


 to define primary fields privelege
 resource : {collection:"business_unit"}, actions : [{find:{primaryFields:1}} ]
 --> user can access only primaryFields defined in collection business_unit
 --> user can not view, insert, update business_unit

 to define role in actions
 {"collection": "employee_daily_attendance",
 "filter": {"employee_id": {"$in": {"$function": "Functions.UserRoles"}}},
 "actions":{
 "update_status":{
 "$filter":{
 "employee_id":{
 "$function":{"Functions.UserRoles":{"roles":{"Employee Self":0,"Team+Self":0,"Employee Self + All Team":0},
 "isVisible":true}}}}}}}
 ---> update_status is an action that will be visible only when role is not in (Employee Self or Team+Self or Employee Self + All Team)








 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var NorthwindDb = require('./NorthwindDb.js');
var Testcases = require("./TestCases.js");
var moment = require("moment");

describe(" roles testcases - query", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    });
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    });

    it.skip('query - role with multiple collections', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0, primaryFields:1}
                        ]}},
                        {type:"Collection", collection:"emps", operationInfos:{$insert:[
                            {type:"find", sequence:0, primaryFields:1}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"},
                        {collection:"emps"},
                        {collection:"students"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}, primary:true} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"name", type:"string", collectionid:{$query:{collection:"emps"}}, primary:true} ,
                        {field:"code", type:"string", collectionid:{$query:{collection:"emps"}}} ,
                        {field:"name", type:"string", collectionid:{$query:{collection:"students"}}, primary:true} ,
                        {field:"rollno", type:"string", collectionid:{$query:{collection:"students"}}}

                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function (collectionData) {
                var update = [
                    {$collection:"tasks", $insert:[
                        {task:"task1", "duedate":"2014-09-08"},
                        {task:"task2", "duedate":"2014-09-08"}
                    ]},
                    {$collection:"emps", $insert:[
                        {name:"Sachin", code:91},
                        {name:"Rohit", code:11}
                    ]},
                    {$collection:"students", $insert:[
                        {name:"Sachin", rollno:91},
                        {name:"Rohit", rollno:11}
                    ]}
                ];
                return db.update(update);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $limit:1});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(1);
                expect(taskData.result[0].duedate).to.eql(undefined);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"emps", $limit:1});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(1);
                expect(taskData.result[0].code).to.eql(undefined);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"students", $limit:1});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(1);
                expect(taskData.result[0].rollno).to.not.eql(undefined);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it.skip('query - role with function to getCollections', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Function", functionName:"Utility.getApplicationCollections", functionParameters:JSON.stringify({appid:"testing"}), operationInfos:{$insert:[
                            {type:"find", sequence:0, primaryFields:1}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"},
                        {collection:"emps"},
                        {collection:"students"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}, primary:true} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"name", type:"string", collectionid:{$query:{collection:"emps"}}, primary:true} ,
                        {field:"code", type:"string", collectionid:{$query:{collection:"emps"}}} ,
                        {field:"name", type:"string", collectionid:{$query:{collection:"students"}}, primary:true} ,
                        {field:"rollno", type:"string", collectionid:{$query:{collection:"students"}}}

                    ]},
                    {$collection:"pl.applications", $insert:[
                        {label:"Testing", id:"testing", collections:{$insert:[
                            {collection:"tasks"},
                            {collection:"emps"}
                        ]}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var update = [
                    {$collection:"tasks", $insert:[
                        {task:"task1", "duedate":"2014-09-08"},
                        {task:"task2", "duedate":"2014-09-08"}
                    ]},
                    {$collection:"emps", $insert:[
                        {name:"Sachin", code:91},
                        {name:"Rohit", code:11}
                    ]},
                    {$collection:"students", $insert:[
                        {name:"Sachin", rollno:91},
                        {name:"Rohit", rollno:11}
                    ]}
                ];
                return db.update(update);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $limit:1});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(1);
                expect(taskData.result[0].duedate).to.eql(undefined);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"emps", $limit:1});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(1);
                expect(taskData.result[0].code).to.eql(undefined);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"students", $limit:1});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(1);
                expect(taskData.result[0].rollno).to.not.eql(undefined);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it.skip('query - role with function to getCollections and appid not passed', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Function", functionName:"Utility.getApplicationCollections", functionParameters:JSON.stringify({}), operationInfos:{$insert:[
                            {type:"find", sequence:0, primaryFields:1}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).fail(
            function (err) {
                if (err.toString().indexOf("appid is mandatory in function parameters in privileges if functionName") === -1) {
                    throw err;
                }
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('query - role with Default collection', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}},
                        {type:"Collection", collection:"emps", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}},
                        {type:"Default", operationInfos:{$insert:[
                            {type:"find", sequence:0, primaryFields:1}
                        ]}}

                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"},
                        {collection:"emps"},
                        {collection:"students"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}, primary:true} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"name", type:"string", collectionid:{$query:{collection:"emps"}}, primary:true} ,
                        {field:"code", type:"string", collectionid:{$query:{collection:"emps"}}} ,
                        {field:"name", type:"string", collectionid:{$query:{collection:"students"}}, primary:true} ,
                        {field:"rollno", type:"string", collectionid:{$query:{collection:"students"}}}

                    ]},
                    {$collection:"pl.applications", $insert:[
                        {label:"Testing", id:"testing", collections:{$insert:[
                            {collection:"tasks"},
                            {collection:"emps"}
                        ]}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var update = [
                    {$collection:"tasks", $insert:[
                        {task:"task1", "duedate":"2014-09-08"},
                        {task:"task2", "duedate":"2014-09-08"}
                    ]},
                    {$collection:"emps", $insert:[
                        {name:"Sachin", code:91},
                        {name:"Rohit", code:11}
                    ]},
                    {$collection:"students", $insert:[
                        {name:"Sachin", rollno:91},
                        {name:"Rohit", rollno:11}
                    ]}
                ];
                return db.update(update);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $limit:1});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(1);
                expect(taskData.result[0].duedate).to.not.eql(undefined);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"emps", $limit:1});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(1);
                expect(taskData.result[0].code).to.not.eql(undefined);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"students", $limit:1});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(1);
                expect(taskData.result[0].rollno).to.eql(undefined);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('query - role with Regex collection', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}},
                        {type:"Collection", collection:"emps", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}},
                        {type:"Default", operationInfos:{$insert:[
                            {type:"find", sequence:0, primaryFields:1}
                        ]}},
                        {type:"Regex", collection:"^pl\\.", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}

                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"},
                        {collection:"emps"},
                        {collection:"students"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}, primary:true} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"name", type:"string", collectionid:{$query:{collection:"emps"}}, primary:true} ,
                        {field:"code", type:"string", collectionid:{$query:{collection:"emps"}}} ,
                        {field:"name", type:"string", collectionid:{$query:{collection:"students"}}, primary:true} ,
                        {field:"rollno", type:"string", collectionid:{$query:{collection:"students"}}}

                    ]},
                    {$collection:"pl.applications", $insert:[
                        {label:"Testing", id:"testing", collections:{$insert:[
                            {collection:"tasks"},
                            {collection:"emps"}
                        ]}}
                    ]},
                    {$collection:"pl.qviews", $insert:[
                        {id:"tasks", "label":"Tasks", collection:{$query:{collection:"tasks"}}, mainCollection:{$query:{collection:"tasks"}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var update = [
                    {$collection:"tasks", $insert:[
                        {task:"task1", "duedate":"2014-09-08"},
                        {task:"task2", "duedate":"2014-09-08"}
                    ]},
                    {$collection:"emps", $insert:[
                        {name:"Sachin", code:91},
                        {name:"Rohit", code:11}
                    ]},
                    {$collection:"students", $insert:[
                        {name:"Sachin", rollno:91},
                        {name:"Rohit", rollno:11}
                    ]}
                ];
                return db.update(update);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $limit:1});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(1);
                expect(taskData.result[0].duedate).to.not.eql(undefined);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"emps", $limit:1});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(1);
                expect(taskData.result[0].code).to.not.eql(undefined);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"students", $limit:1});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(1);
                expect(taskData.result[0].rollno).to.eql(undefined);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"pl.qviews", $limit:1});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(1);
                expect(taskData.result[0].collection).to.not.eql(undefined);
                expect(taskData.result[0].mainCollection).to.not.eql(undefined);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('query - role1', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"insert", sequence:0}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
//                console.log("usersData >>>>>   "+JSON.stringify(usersData));
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function (collectionData) {
//                console.log("collectionData >>>>>   "+JSON.stringify(collectionData));
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]};
                return db.update(tasks);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks"});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[2].task).to.eql("task3");
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
                return developerDb.query({$collection:"tasks"});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by Developer " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(0);
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('query - role with filter on resource', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", filterUI:"grid", filterInfos:{$insert:[
                            {field:"assigned_to", value:"ashu"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
//                console.log("usersData >>>>>   "+JSON.stringify(usersData));
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"assigned_to", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, "assigned_to":"rohit"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"}
                ]};
                return db.update(tasks);
            }).then(
            function (tasks) {
//                console.log("Tasks >>> " + JSON.stringify(tasks));
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by TeamLead " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[2].task).to.eql("task3");
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
                return developerDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by Developer " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(2);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[1].task).to.eql("task3");
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('query - role with recursion', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[

                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"emps", filterUI:"grid", filterInfos:{$insert:[
                            {field:"direct_reporting_to_id", value:"$$UserRoles"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function (rolesData) {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"emps"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"emps"}}} ,
                        {field:"direct_reporting_to_id", type:"fk", collectionid:{$query:{collection:"emps"}}, collection:"emps", set:["name"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var tasks = {$collection:"emps", $insert:[
                    {name:"Sachin"},
                    {task:"ashu", "direct_reporting_to_id":{$query:{name:"Sachin"}}}
                ]};
                return db.update(tasks);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"emps", $sort:{task:1}});
            }).then(
            function () {
                done("Not Ok.");
            }).catch(function (err) {
                if (err.toString().indexOf("Collection and Referred Collection can not be same in UserRole Function") !== -1) {
                    done();
                } else {
                    done(err);
                }
            })
    });

    it('query - role with fields on resource', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                            {field:"self_rating"},
                            {field:"team_lead_rating"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
//                console.log("usersData >>>>>   "+JSON.stringify(usersData));
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, "assigned_to":"rohit"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"}
                ]};
                return db.update(tasks);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by TeamLead " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[2].task).to.eql("task3");
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
                return developerDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by Developer " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].self_rating).to.eql(undefined);
                expect(taskData.result[0].team_lead_rating).to.eql(undefined);
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[1].self_rating).to.eql(undefined);
                expect(taskData.result[1].team_lead_rating).to.eql(undefined);
                expect(taskData.result[2].task).to.eql("task3");
                expect(taskData.result[2].estefforts).to.eql("10 Hrs");
                expect(taskData.result[2].self_rating).to.eql(undefined);
                expect(taskData.result[2].team_lead_rating).to.eql(undefined);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('excluded fields in privelge and subquery field as first field in query', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                            {field:"self_rating"},
                            {field:"team_lead_rating"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]}

                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
//                console.log("usersData >>>>>   "+JSON.stringify(usersData));
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, "assigned_to":"rohit"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"}
                ]};
                return db.update(tasks);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by TeamLead " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[2].task).to.eql("task3");
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
                return developerDb.query({$collection:"tasks", $fields:{employees:{$query:{$collection:"pl.users"}, $fk:"_id", $parent:"ownerid"}, ownerid:1, task:1, estefforts:1, self_rating:1}, $sort:{task:1}});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].employees.username).to.eql("Sachin_Developer");
                expect(taskData.result[0].ownerid.emailid).to.eql("sachin.bansal@daffodilsw.com");
                expect(taskData.result[0].self_rating).to.eql(undefined);
                expect(taskData.result[0].team_lead_rating).to.eql(undefined);
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[1].self_rating).to.eql(undefined);
                expect(taskData.result[1].team_lead_rating).to.eql(undefined);
                expect(taskData.result[2].task).to.eql("task3");
                expect(taskData.result[2].estefforts).to.eql("10 Hrs");
                expect(taskData.result[2].self_rating).to.eql(undefined);
                expect(taskData.result[2].team_lead_rating).to.eql(undefined);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('query - role with filter and fields on resource', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", filterUI:"grid", filterInfos:{$insert:[
                            {field:"assigned_to", value:"ashu"}
                        ]}, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                            {field:"self_rating"},
                            {field:"team_lead_rating"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]}

//                        {role:"Developer", privileges:[
//                            {resource:JSON.stringify({collection:"tasks", "filter":{"assigned_to":"ashu"}, "fields":{self_rating:0, team_lead_rating:0}}), actions:JSON.stringify(["find"])}
//                        ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
//                console.log("usersData >>>>>   "+JSON.stringify(usersData));
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, "assigned_to":"rohit"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"}
                ]};
                return db.update(tasks);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by TeamLead " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].self_rating).to.eql(3);
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[1].team_lead_rating).to.eql(10);
                expect(taskData.result[2].task).to.eql("task3");
                expect(taskData.result[2].team_lead_rating).to.eql(6);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
                return developerDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by Developer " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(2);
                expect(taskData.result[0].self_rating).to.eql(undefined);
                expect(taskData.result[0].team_lead_rating).to.eql(undefined);
                expect(moment(taskData.result[0].duedate).format('YYYY-MM-DD')).to.eql("2014-09-08");
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            });
    });

    it('query - role with filter on action', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[

                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0, filterUI:"grid", filterInfos:{$insert:[
                                {field:"assigned_to", value:"ashu"}
                            ]}}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
//                console.log("usersData >>>>>   "+JSON.stringify(usersData));
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"assigned_to", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, "assigned_to":"rohit"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"}
                ]};
                return db.update(tasks);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by TeamLead " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].self_rating).to.eql(3);
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[1].team_lead_rating).to.eql(10);
                expect(taskData.result[2].task).to.eql("task3");
                expect(taskData.result[2].team_lead_rating).to.eql(6);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
                return developerDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by Developer " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(2);
                expect(taskData.result[0].self_rating).to.eql(3);
                expect(taskData.result[0].team_lead_rating).to.eql(undefined);
                expect(moment(taskData.result[0].duedate).format('YYYY-MM-DD')).to.eql("2014-09-08");
                expect(taskData.result[1].self_rating).to.eql(5);
                expect(taskData.result[1].team_lead_rating).to.eql(6);
                expect(taskData.result[1].task).to.eql("task3");
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('query - role with field on action', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                                {field:"ownerid"},
                                {field:"team_lead_rating"}
                            ]}}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
//                console.log("usersData >>>>>   "+JSON.stringify(usersData));
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"assigned_to", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, "assigned_to":"rohit"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"}
                ]};
                return db.update(tasks);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by TeamLead " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].self_rating).to.eql(3);
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[1].team_lead_rating).to.eql(10);
                expect(taskData.result[2].task).to.eql("task3");
                expect(taskData.result[2].team_lead_rating).to.eql(6);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
                return developerDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by Developer " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].ownerid).to.eql(undefined);
                expect(taskData.result[0].team_lead_rating).to.eql(undefined);
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[1].ownerid).to.eql(undefined);
                expect(taskData.result[1].team_lead_rating).to.eql(undefined);
                expect(taskData.result[2].task).to.eql("task3");
                expect(taskData.result[2].ownerid).to.eql(undefined);
                expect(taskData.result[2].team_lead_rating).to.eql(undefined);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('query - role with field and filter on action', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0, filterUI:"grid", filterInfos:{$insert:[
                                {field:"assigned_to", value:"ashu"}
                            ]}, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                                {field:"ownerid"},
                                {field:"team_lead_rating"}
                            ]}}
                        ]}}
                    ]}

                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
//                console.log("usersData >>>>>   "+JSON.stringify(usersData));
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"assigned_to", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, "assigned_to":"rohit"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"}
                ]};
                return db.update(tasks);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by TeamLead " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].self_rating).to.eql(3);
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[1].team_lead_rating).to.eql(10);
                expect(taskData.result[2].task).to.eql("task3");
                expect(taskData.result[2].team_lead_rating).to.eql(6);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
                return developerDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by Developer " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(2);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].ownerid).to.eql(undefined);
                expect(taskData.result[0].assigned_to).to.eql("ashu");
                expect(taskData.result[0].team_lead_rating).to.eql(undefined);
                expect(taskData.result[1].task).to.eql("task3");
                expect(taskData.result[1].ownerid).to.eql(undefined);
                expect(taskData.result[1].assigned_to).to.eql("ashu");
                expect(taskData.result[1].team_lead_rating).to.eql(undefined);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('query - role with field and filter on action and resource', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[

                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", filterUI:"grid", filterInfos:{$insert:[
                            {field:"assigned_to", value:"rohit"}
                        ]}, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                            {field:"seld_rating"},
                            {field:"team_lead_rating"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:0, filterUI:"grid", filterInfos:{$insert:[
                                {field:"assigned_to", value:"ashu"}
                            ]}, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                                {field:"ownerid"},
                                {field:"team_lead_rating"}
                            ]}}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
//                console.log("usersData >>>>>   "+JSON.stringify(usersData));
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"assigned_to", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, "assigned_to":"rohit"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"}
                ]};
                return db.update(tasks);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by TeamLead " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].self_rating).to.eql(3);
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[1].team_lead_rating).to.eql(10);
                expect(taskData.result[2].task).to.eql("task3");
                expect(taskData.result[2].team_lead_rating).to.eql(6);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
                return developerDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by Developer " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(2);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].ownerid).to.eql(undefined);
                expect(taskData.result[0].assigned_to).to.eql("ashu");
                expect(taskData.result[0].team_lead_rating).to.eql(undefined);
                expect(taskData.result[1].task).to.eql("task3");
                expect(taskData.result[1].ownerid).to.eql(undefined);
                expect(taskData.result[1].assigned_to).to.eql("ashu");
                expect(taskData.result[1].team_lead_rating).to.eql(undefined);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    });

    it('query - role with field excluding on resource and including on actions', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[

                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", filterUI:"grid", filterInfos:{$insert:[
                            {field:"assigned_to", value:"rohit"}
                        ]}, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                            {field:"seld_rating"},
                            {field:"team_lead_rating"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:0, filterUI:"grid", filterInfos:{$insert:[
                                {field:"assigned_to", value:"ashu"}
                            ]}, fieldsAvailability:"Include", fieldInfos:{$insert:[
                                {field:"task"},
                                {field:"ownerid"},
                                {field:"team_lead_rating"}
                            ]}}
                        ]}}
                    ]}

                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
//                console.log("usersData >>>>>   "+JSON.stringify(usersData));
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"assigned_to", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, "assigned_to":"rohit"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"}
                ]};
                return db.update(tasks);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by TeamLead " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].self_rating).to.eql(3);
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[1].team_lead_rating).to.eql(10);
                expect(taskData.result[2].task).to.eql("task3");
                expect(taskData.result[2].team_lead_rating).to.eql(6);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
                return developerDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by Developer " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(2);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].self_rating).to.eql(undefined);
                expect(taskData.result[0].ownerid.emailid).to.eql("sachin.bansal@daffodilsw.com");
                expect(taskData.result[0].team_lead_rating).to.eql(undefined);
                expect(taskData.result[1].task).to.eql("task3");
                expect(taskData.result[1].ownerid.emailid).to.eql("sachin.bansal@daffodilsw.com");
                expect(taskData.result[1].self_rating).to.eql(undefined);
                expect(taskData.result[1].team_lead_rating).to.eql(6);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('query - role with field including on query and including on privilege', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[

                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", filterUI:"grid", filterInfos:{$insert:[
                            {field:"assigned_to", value:"rohit"}
                        ]}, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                            {field:"seld_rating"},
                            {field:"team_lead_rating"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:0, filterUI:"grid", filterInfos:{$insert:[
                                {field:"assigned_to", value:"ashu"}
                            ]}, fieldsAvailability:"Include", fieldInfos:{$insert:[
                                {field:"task"},
                                {field:"ownerid"},
                                {field:"team_lead_rating"}
                            ]}}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
//                console.log("usersData >>>>>   "+JSON.stringify(usersData));
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"assigned_to", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, "assigned_to":"rohit"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"}
                ]};
                return db.update(tasks);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by TeamLead " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].self_rating).to.eql(3);
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[1].team_lead_rating).to.eql(10);
                expect(taskData.result[2].task).to.eql("task3");
                expect(taskData.result[2].team_lead_rating).to.eql(6);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
                return developerDb.query({$collection:"tasks", $sort:{task:1}, $fields:{self_rating:1, team_lead_rating:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by Developer " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(2);
//                expect(taskData.result[0].task).to.eql("task1");
//                expect(taskData.result[0].self_rating).to.eql(undefined);
//                expect(taskData.result[0].ownerid.emailid).to.eql("sachin.bansal@daffodilsw.com");
//                expect(taskData.result[0].team_lead_rating).to.eql(undefined);
//                expect(taskData.result[1].task).to.eql("task3");
//                expect(taskData.result[1].ownerid.emailid).to.eql("sachin.bansal@daffodilsw.com");
//                expect(taskData.result[1].self_rating).to.eql(undefined);
//                expect(taskData.result[1].team_lead_rating).to.eql(6);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('query - role with field excluding on query and excluding on privilege', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[

                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", filterUI:"grid", filterInfos:{$insert:[
                            {field:"assigned_to", value:"rohit"}
                        ]}, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                            {field:"seld_rating"},
                            {field:"team_lead_rating"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:0, filterUI:"grid", filterInfos:{$insert:[
                                {field:"assigned_to", value:"ashu"}
                            ]}, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                                {field:"ownerid"},
                                {field:"team_lead_rating"}
                            ]}}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
//                console.log("usersData >>>>>   "+JSON.stringify(usersData));
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"assigned_to", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, "assigned_to":"rohit"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"}
                ]};
                return db.update(tasks);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by TeamLead " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].self_rating).to.eql(3);
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[1].team_lead_rating).to.eql(10);
                expect(taskData.result[2].task).to.eql("task3");
                expect(taskData.result[2].team_lead_rating).to.eql(6);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
                return developerDb.query({$collection:"tasks", $sort:{task:1}, $fields:{self_rating:0, team_lead_rating:0}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by Developer " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(2);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].self_rating).to.eql(undefined);
                expect(taskData.result[0].ownerid).to.eql(undefined);
                expect(taskData.result[0].team_lead_rating).to.eql(undefined);
                expect(taskData.result[1].task).to.eql("task3");
                expect(taskData.result[1].ownerid).to.eql(undefined);
                expect(taskData.result[1].self_rating).to.eql(undefined);
                expect(taskData.result[1].team_lead_rating).to.eql(undefined);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('query - role with field including on query and excluding on privilege', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[

                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", filterUI:"grid", filterInfos:{$insert:[
                            {field:"assigned_to", value:"rohit"}
                        ]}, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                            {field:"seld_rating"},
                            {field:"team_lead_rating"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:0, filterUI:"grid", filterInfos:{$insert:[
                                {field:"assigned_to", value:"ashu"}
                            ]}, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                                {field:"ownerid"},
                                {field:"team_lead_rating"}
                            ]}}
                        ]}}
                    ]}

                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users"});
            }).then(
            function (usersData) {
//                console.log("usersData >>>>>   "+JSON.stringify(usersData));
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"assigned_to", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, "assigned_to":"rohit"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"}
                ]};
                return db.update(tasks);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by TeamLead " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].self_rating).to.eql(3);
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[1].team_lead_rating).to.eql(10);
                expect(taskData.result[2].task).to.eql("task3");
                expect(taskData.result[2].team_lead_rating).to.eql(6);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
                return developerDb.query({$collection:"tasks", $sort:{task:1}, $fields:{task:1, self_rating:1, team_lead_rating:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by Developer " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(2);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].self_rating).to.eql(3);
                expect(taskData.result[0].ownerid).to.eql(undefined);
                expect(taskData.result[0].team_lead_rating).to.eql(undefined);
                expect(taskData.result[1].task).to.eql("task3");
                expect(taskData.result[1].ownerid).to.eql(undefined);
                expect(taskData.result[1].self_rating).to.eql(5);
                expect(taskData.result[1].team_lead_rating).to.eql(undefined);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('query - role with field excluding on query and including on privilege', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[

                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", filterUI:"grid", filterInfos:{$insert:[
                            {field:"assigned_to", value:"rohit"}
                        ]}, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                            {field:"seld_rating"},
                            {field:"team_lead_rating"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:0, filterUI:"grid", filterInfos:{$insert:[
                                {field:"assigned_to", value:"ashu"}
                            ]}, fieldsAvailability:"Include", fieldInfos:{$insert:[
                                {field:"task"},
                                {field:"ownerid"},
                                {field:"team_lead_rating"}  ,
                                {field:"duedate"}
                            ]}}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ]};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
//                console.log("usersData >>>>>   "+JSON.stringify(usersData));
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"assigned_to", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, "assigned_to":"rohit"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"}
                ]};
                return db.update(tasks);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by TeamLead " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].self_rating).to.eql(3);
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[1].team_lead_rating).to.eql(10);
                expect(taskData.result[2].task).to.eql("task3");
                expect(taskData.result[2].team_lead_rating).to.eql(6);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
                return developerDb.query({$collection:"tasks", $sort:{task:1}, $fields:{"team_lead_rating":0, duedate:0}});
            }).then(
            function (taskData) {
//                console.log("Tasks viewed by Developer " + JSON.stringify(taskData));
                expect(taskData.result).to.have.length(2);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].duedate).to.eql(undefined);
                expect(taskData.result[0].ownerid.emailid).to.eql("sachin.bansal@daffodilsw.com");
                expect(taskData.result[0].team_lead_rating).to.eql(undefined);
                expect(taskData.result[1].task).to.eql("task3");
                expect(taskData.result[1].ownerid.emailid).to.eql("sachin.bansal@daffodilsw.com");
                expect(taskData.result[1].duedate).to.eql(undefined);
                expect(taskData.result[1].team_lead_rating).to.eql(undefined);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('query - role when collection is not provided then insert,update and delete are false', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0} ,
                            {type:"insert", sequence:0},
                            {type:"update", sequence:0} ,
                            {type:"remove", sequence:0}
                        ]}}
                        ,
                        {type:"Default", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]}
                ], "$modules":{"ValidationModule":0}};
                return db.update(createRoles);
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return db.update({$collection:"pl.qviews", $insert:[
                    {"id":"tasks", "label":"Tasks", "collection":{$query:{"collection":"tasks"}}, "mainCollection":{$query:{"collection":"tasks"}}}
                ]});
            }).then(
            function (qviews) {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
                return developerDb.invokeFunction("view.getView", [
                    {"id":"tasks"}
                ]);
            }).then(
            function (viewData) {
                expect(viewData.viewOptions.insert).to.eql(undefined);
                expect(viewData.viewOptions.update).to.eql(undefined);
                expect(viewData.viewOptions.remove).to.eql(undefined);
                done();
            }).catch(function (err) {
                done(err);
            })
    });
})

describe(" roles testcases - insert", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    });
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    });

    it('insert without actions - role ', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[

                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
//
//                    {role:"Developer", privileges:[
//                        {resource:JSON.stringify({collection:"tasks"}), actions:JSON.stringify([])}
//                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function (usersData) {
//                console.log("usersData >>>>>   "+JSON.stringify(usersData));
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function (updateData) {
                done();
            }).catch(function (err) {
                if (err.toString().indexOf("Does not have sufficient privileges to insert record in collection") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    });

    it('insert - role without insert', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function (updateData) {
                done();
            }).catch(function (err) {
                if (err.toString().indexOf("Does not have sufficient privileges to insert record in collection") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    });

    it('insert - role with insert', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(3);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[0].estefforts).to.eql("20 Hrs");
                expect(taskData.result[0].ownerid.emailid).to.eql("sachin.bansal@daffodilsw.com");
                expect(taskData.result[1].task).to.eql("task2");
                expect(taskData.result[1].estefforts).to.eql("8 Hrs");
                expect(taskData.result[1].ownerid.emailid).to.eql("rohit.bansal@daffodilsw.com");
                expect(taskData.result[2].task).to.eql("task3");
                expect(taskData.result[2].estefforts).to.eql("10 Hrs");
                expect(taskData.result[2].ownerid.emailid).to.eql("sachin.bansal@daffodilsw.com");
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('insert - role insert with fields ', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1, fieldsAvailability:"Include", fieldInfos:{$insert:[
                                {field:"task"},
                                {field:"duedate"},
                                {field:"estefforts"}
                            ]}}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({"$collection":"tasks"});
            }).then(
            function (updateData) {
                done();
            }).catch(function (err) {
                if (err.toString().indexOf("Does not have sufficient privileges to insert record in collection") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    });

    it('insert - role insert with include fields nested', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1, fieldsAvailability:"Include", fieldInfos:{$insert:[
                                {field:"task"},
                                {field:"duedate"},
                                {field:"estefforts"}
                            ]}}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"details", type:"object", collectionid:{$query:{collection:"tasks"}}, multiple:true} ,
                        {field:"line1", type:"string", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"details", collectionid:{$query:{collection:"tasks"}}}}} ,
                        {field:"ownerid", type:"fk", collection:"pl.users", set:["emailid"], collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"details", collectionid:{$query:{collection:"tasks"}}}}} ,
                        {field:"amount", type:"currency", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"details", collectionid:{$query:{collection:"tasks"}}}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", details:[
                        {line1:"11", ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, amount:{amount:100, type:{$query:{currency:"INR"}}}}
                    ]},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", details:[
                        {line1:"11", ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, amount:{amount:100, type:{$query:{currency:"INR"}}}}
                    ]},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", details:[
                        {line1:"11", ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, amount:{amount:100, type:{$query:{currency:"INR"}}}}
                    ]}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({"$collection":"tasks"});
            }).then(
            function (updateData) {
                done();
            }).catch(function (err) {
                if (err.toString().indexOf("Does not have sufficient privileges to insert record in collection [tasks] with fields [\"details\"]") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    });

    it('insert - role insert with include fields nested dotted', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1, fieldsAvailability:"Include", fieldInfos:{$insert:[
                                {field:"task"},
                                {field:"duedate"},
                                {field:"estefforts"},
                                {field:"details.ownerid"}
                            ]}}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"details", type:"object", collectionid:{$query:{collection:"tasks"}}, multiple:true} ,
                        {field:"line1", type:"string", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"details", collectionid:{$query:{collection:"tasks"}}}}} ,
                        {field:"ownerid", type:"fk", collection:"pl.users", set:["emailid"], collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"details", collectionid:{$query:{collection:"tasks"}}}}} ,
                        {field:"amount", type:"currency", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"details", collectionid:{$query:{collection:"tasks"}}}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", details:[
                        {line1:"11", ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, amount:{amount:100, type:{$query:{currency:"INR"}}}}
                    ]},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", details:[
                        {line1:"11", ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, amount:{amount:100, type:{$query:{currency:"INR"}}}}
                    ]},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", details:[
                        {line1:"11", ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, amount:{amount:100, type:{$query:{currency:"INR"}}}}
                    ]}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({"$collection":"tasks"});
            }).then(
            function (updateData) {
                done();
            }).catch(function (err) {
                if (err.toString().indexOf("Does not have sufficient privileges to insert record in collection [tasks] with fields [\"details.line1\",\"details.amount\"]") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    });

    it('insert - role insert with exclude fields nested dotted', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                                {field:"details.ownerid"},
                                {field:"details.amount"}
                            ]}}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"details", type:"object", collectionid:{$query:{collection:"tasks"}}, multiple:true} ,
                        {field:"line1", type:"string", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"details", collectionid:{$query:{collection:"tasks"}}}}} ,
                        {field:"ownerid", type:"fk", collection:"pl.users", set:["emailid"], collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"details", collectionid:{$query:{collection:"tasks"}}}}} ,
                        {field:"amount", type:"currency", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"details", collectionid:{$query:{collection:"tasks"}}}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", details:[
                        {line1:"11", ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, amount:{amount:100, type:{$query:{currency:"INR"}}}}
                    ]},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", details:[
                        {line1:"11", ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, amount:{amount:100, type:{$query:{currency:"INR"}}}}
                    ]},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", details:[
                        {line1:"11", ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, amount:{amount:100, type:{$query:{currency:"INR"}}}}
                    ]}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({"$collection":"tasks"});
            }).then(
            function (updateData) {
                done();
            }).catch(function (err) {
                if (err.toString().indexOf("Does not have sufficient privileges to insert record in collection [tasks] with fields [\"details.ownerid\",\"details.amount\"]") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    });

    it('insert - role insert with exclude fields nested', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                                {field:"details"}
                            ]}}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"details", type:"object", collectionid:{$query:{collection:"tasks"}}, multiple:true} ,
                        {field:"line1", type:"string", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"details", collectionid:{$query:{collection:"tasks"}}}}} ,
                        {field:"ownerid", type:"fk", collection:"pl.users", set:["emailid"], collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"details", collectionid:{$query:{collection:"tasks"}}}}} ,
                        {field:"amount", type:"currency", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"details", collectionid:{$query:{collection:"tasks"}}}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", details:[
                        {line1:"11", ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, amount:{amount:100, type:{$query:{currency:"INR"}}}}
                    ]},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", details:[
                        {line1:"11", ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, amount:{amount:100, type:{$query:{currency:"INR"}}}}
                    ]},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", details:[
                        {line1:"11", ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, amount:{amount:100, type:{$query:{currency:"INR"}}}}
                    ]}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({"$collection":"tasks"});
            }).then(
            function (updateData) {
                done();
            }).catch(function (err) {
                if (err.toString().indexOf("Does not have sufficient privileges to insert record in collection [tasks] with fields [\"details\"]") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    });

});

describe(" roles testcases - update", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    });
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    });

    it('update - role without update', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, status:""},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (data) {
                var taskUpdate = {$collection:"tasks", $update:[
                    {_id:data.result[2]._id, $set:{task:"task33"}}
                ]};
                return teamLeadDb.update(taskUpdate);
            }).then(
            function (updateData) {
                done();
            }).catch(function (err) {
                if (err.toString().indexOf("Does not have sufficient privileges to update record in collection") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    });

    it('update - role with update', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1},
                            {type:"update", sequence:2}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, status:""},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (data) {
                var taskUpdate = {$collection:"tasks", $update:[
                    {_id:data.result[2]._id, $set:{task:"task33"}}
                ]};
                return teamLeadDb.update(taskUpdate);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].task).to.eql("task1");
                expect(data.result[1].task).to.eql("task2");
                expect(data.result[2].task).to.eql("task33");
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('update - role update with filter', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[

                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1},
                            {type:"update", sequence:2, filterUI:"grid", filterInfos:{$insert:[
                                {field:"cost", operator:"$gt", value:600}
                            ]}}
                        ]}}
                    ]} ,
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}


                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", cost:1000, self_rating:3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, status:""},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", cost:500, "team_lead_rating":10, "self_rating":7, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", cost:800, "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (data) {
                var taskUpdate = {$collection:"tasks", $update:[
                    {_id:data.result[0]._id, $set:{self_rating:8}},
                    {_id:data.result[2]._id, $set:{self_rating:8}}
                ]};
                return teamLeadDb.update(taskUpdate);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].self_rating).to.eql(8);
                expect(data.result[1].self_rating).to.eql(7);
                expect(data.result[2].self_rating).to.eql(8);
                return data;
            }).then(
            function (data) {
                var taskUpdate = {$collection:"tasks", $update:[
                    {_id:data.result[1]._id, $set:{self_rating:3}}
                ]};
                return teamLeadDb.update(taskUpdate);
            }).then(
            function (updateData) {
                done();
            }).catch(function (err) {
                if (err.toString().indexOf("Does not have sufficient privileges to update record in collection") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    });

    it('update - role update with Array in update action and no field', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1},
                            {type:"update", sequence:2, filterUI:"grid", filterInfos:{$insert:[
                                {field:"cost", operator:"$gt", value:600}
                            ]}}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", cost:1000, self_rating:3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, status:""},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", cost:500, "team_lead_rating":10, "self_rating":7, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", cost:800, "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (data) {
                var taskUpdate = {$collection:"tasks", $update:[
                    {_id:data.result[0]._id, $set:{self_rating:8}},
                    {_id:data.result[2]._id, $set:{self_rating:8}}
                ]};
                return teamLeadDb.update(taskUpdate);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                if (err.toString().indexOf("Fields is mandatory if updates is defined in Array in privilege") != -1) {
                    done();
                } else {
                    done(err);
                }
            })
    });

    it('update - role update with Array in update action filter and field', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[

                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1},
                            {type:"update", sequence:2, filterUI:"grid", fieldsAvailability:"Include", fieldsInfos:{$insert:[
                                {field:"cost"}
                            ]}, filterInfos:{$insert:[
                                {field:"cost", operator:"$gt", value:600}
                            ]}}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}

                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", cost:1000, self_rating:3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, status:"New"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", cost:500, "team_lead_rating":10, "self_rating":7, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, status:"InProgress"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", cost:800, "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, status:"New"}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (data) {
                var taskUpdate = {$collection:"tasks", $update:[
                    {_id:data.result[0]._id, $set:{self_rating:8}},
                    {_id:data.result[2]._id, $set:{self_rating:8}}
                ]};
                return teamLeadDb.update(taskUpdate);
            }).then(
            function (updateData) {
                done();
            }).catch(function (err) {
                if (err.toString().indexOf("Does not have sufficient privileges to update record in collection") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    });

    it('update - role update with Array in update action multiple elements', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1},
                            {type:"update", sequence:2, fieldsAvailability:"Include", fieldInfos:{$insert:[
                                {field:"cost"}
                            ]}},
                            {type:"update", sequence:3, filterUI:"grid", fieldsAvailability:"Include", fieldInfos:{$insert:[
                                {field:"self_rating"}
                            ]}, filterInfos:{$insert:[
                                {field:"cost", operator:"$gt", value:600}
                            ]}}


                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", cost:1000, self_rating:3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, status:"New"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", cost:500, "team_lead_rating":10, "self_rating":7, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, status:"InProgress"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", cost:800, "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, status:"New"}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (data) {
                var taskUpdate = {$collection:"tasks", $update:[
                    {_id:data.result[0]._id, $set:{self_rating:8}},
                    {_id:data.result[2]._id, $set:{self_rating:8}}
                ]};
                return teamLeadDb.update(taskUpdate);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].self_rating).to.eql(8);
                expect(data.result[1].self_rating).to.eql(7);
                expect(data.result[2].self_rating).to.eql(8);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('update/insert Attendance with no rights to update isApproved for basic user in mutilple value in update Array', function (done) {
        var db = undefined;
        var sachinDb = undefined;
        var rohitDb = undefined;
        var sachinAttendanceId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Attendance", privileges:[
                        {type:"Collection", collection:"employeedailyattendance", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:0, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                                {field:"isApproved"}
                            ]}},
                            {type:"insert", sequence:1, filterUI:"grid", filterInfos:{$insert:[
                                {field:"employee_id.reporting_to_id.user_id", value:"$$CurrentUser"}
                            ]}, fieldsAvailability:"Include", fieldInfos:{$insert:[
                                {field:"isApproved"}
                            ]}},
                            {type:"update", sequence:2, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                                {field:"isApproved"}
                            ]}},
                            {type:"update", sequence:3, filterUI:"grid", filterInfos:{$insert:[
                                {field:"employee_id.reporting_to_id.user_id", value:"$$CurrentUser"}
                            ]}, fieldsAvailability:"Include", fieldInfos:{$insert:[
                                {field:"isApproved"}
                            ]}}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Attendance"}}}
                    ]},
                    {username:"Rohit", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Attendance"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"employees"},
                        {collection:"employeedailyattendance"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"employees"}}} ,
                        {field:"emailid", type:"string", collectionid:{$query:{collection:"employees"}}} ,
                        {field:"user_id", type:"fk", collectionid:{$query:{collection:"employees"}}, collection:"pl.users", set:["emailid"]},
                        {field:"reporting_to_id", type:"fk", collectionid:{$query:{collection:"employees"}}, collection:"employees", set:["name"], multiple:true} ,
                        {field:"employee_id", type:"fk", collectionid:{$query:{collection:"employeedailyattendance"}}, collection:"employees", set:["name"]} ,
                        {field:"attendance_date", type:"date", collectionid:{$query:{collection:"employeedailyattendance"}}} ,
                        {field:"attendance_type", type:"string", collectionid:{$query:{collection:"employeedailyattendance"}}},
                        {field:"isApproved", type:"boolean", collectionid:{$query:{collection:"employeedailyattendance"}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return db.update({$collection:"employees", $insert:[
                    {name:"Rohit", emailid:"rohit.bansal@daffodilsw.com", user_id:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {name:"Sachin", emailid:"sachin.bansal@daffodilsw.com", reporting_to_id:[
                        {$query:{emailid:"rohit.bansal@daffodilsw.com"}}
                    ], user_id:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]})
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin", password:"sachin"});
            }).then(
            function (db) {
                sachinDb = db;
                return sachinDb.update({$collection:"employeedailyattendance", $insert:[
                    {employee_id:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, attendance_date:"2014-07-01", attendance_type:"Present"}
                ]})
            }).then(
            function () {
                return sachinDb.update({$collection:"employeedailyattendance", $insert:[
                    {employee_id:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, attendance_date:"2014-07-02", attendance_type:"Present", isApproved:true}
                ]}).fail(function (err) {
                        if (err.toString().indexOf("Does not have sufficient privileges to insert record") === -1) {
                            throw err;
                        }
                    })
            }).then(
            function () {
                return sachinDb.query({$collection:"employeedailyattendance", $filter:{"employee_id.emailid":"sachin.bansal@daffodilsw.com"}});
            }).then(
            function (result) {
                sachinAttendanceId = result.result[0]._id;
                return sachinDb.update({$collection:"employeedailyattendance", $update:[
                    {_id:sachinAttendanceId, $set:{isApproved:true}}
                ]}).fail(function (err) {
                        if (err.toString().indexOf("Does not have sufficient privileges to update record") === -1) {
                            throw err;
                        }
                    })
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit", password:"rohit"});
            }).then(
            function (db) {
                rohitDb = db;
                return rohitDb.update({$collection:"employeedailyattendance", $update:[
                    {_id:sachinAttendanceId, $set:{isApproved:true}}
                ]})
            }).then(
            function () {
                return rohitDb.update({$collection:"employeedailyattendance", $insert:[
                    {employee_id:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, attendance_date:"2014-07-04", attendance_type:"Present"}
                ]})
            }).then(
            function () {
                return rohitDb.update({$collection:"employeedailyattendance", $insert:[
                    {employee_id:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, attendance_date:"2014-07-02", attendance_type:"Present", isApproved:true}
                ]})
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it('update/insert Attendance with no rights to update isApproved for basic user in single value in update Array', function (done) {
        var db = undefined;
        var sachinDb = undefined;
        var rohitDb = undefined;
        var sachinAttendanceId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Attendance", privileges:[
                        {type:"Collection", collection:"employeedailyattendance", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:0, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                                {field:"isApproved"}
                            ]}},
                            {type:"insert", sequence:1, filterUI:"grid", filterInfos:{$insert:[
                                {field:"employee_id.reporting_to_id.user_id", value:"$$CurrentUser"}
                            ]}, fieldsAvailability:"Include", fieldInfos:{$insert:[
                                {field:"isApproved"}
                            ]}},
                            {type:"update", sequence:2, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                                {field:"isApproved"}
                            ]}},
                            {type:"update", sequence:3, filterUI:"grid", filterInfos:{$insert:[
                                {field:"employee_id.reporting_to_id.user_id", value:"$$CurrentUser"}
                            ]}, fieldsAvailability:"Include", fieldInfos:{$insert:[
                                {field:"isApproved"}
                            ]}}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Attendance"}}}
                    ]},
                    {username:"Rohit", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Attendance"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"employees"},
                        {collection:"employeedailyattendance"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"employees"}}} ,
                        {field:"emailid", type:"string", collectionid:{$query:{collection:"employees"}}} ,
                        {field:"user_id", type:"fk", collectionid:{$query:{collection:"employees"}}, collection:"pl.users", set:["emailid"]},
                        {field:"reporting_to_id", type:"fk", collectionid:{$query:{collection:"employees"}}, collection:"employees", set:["name"], multiple:true} ,
                        {field:"employee_id", type:"fk", collectionid:{$query:{collection:"employeedailyattendance"}}, collection:"employees", set:["name"]} ,
                        {field:"attendance_date", type:"date", collectionid:{$query:{collection:"employeedailyattendance"}}} ,
                        {field:"attendance_type", type:"string", collectionid:{$query:{collection:"employeedailyattendance"}}},
                        {field:"isApproved", type:"boolean", collectionid:{$query:{collection:"employeedailyattendance"}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return db.update({$collection:"employees", $insert:[
                    {name:"Rohit", emailid:"rohit.bansal@daffodilsw.com", user_id:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {name:"Sachin", emailid:"sachin.bansal@daffodilsw.com", reporting_to_id:[
                        {$query:{emailid:"rohit.bansal@daffodilsw.com"}}
                    ], user_id:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]})
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin", password:"sachin"});
            }).then(
            function (db) {
                sachinDb = db;
                return sachinDb.update({$collection:"employeedailyattendance", $insert:[
                    {employee_id:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, attendance_date:"2014-07-01", attendance_type:"Present"}
                ]})
            }).then(
            function () {
                return sachinDb.update({$collection:"employeedailyattendance", $insert:[
                    {employee_id:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, attendance_date:"2014-07-02", attendance_type:"Present", isApproved:true}
                ]}).fail(function (err) {
                        if (err.toString().indexOf("Does not have sufficient privileges to insert record") === -1) {
                            throw err;
                        }
                    })
            }).then(
            function () {
                return sachinDb.query({$collection:"employeedailyattendance", $filter:{"employee_id.emailid":"sachin.bansal@daffodilsw.com"}});
            }).then(
            function (result) {
                sachinAttendanceId = result.result[0]._id;
                return sachinDb.update({$collection:"employeedailyattendance", $update:[
                    {_id:sachinAttendanceId, $set:{isApproved:true}}
                ]}).fail(function (err) {
                        if (err.toString().indexOf("Does not have sufficient privileges to update record") === -1) {
                            throw err;
                        }
                    })
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit", password:"rohit"});
            }).then(
            function (db) {
                rohitDb = db;
                return rohitDb.update({$collection:"employeedailyattendance", $update:[
                    {_id:sachinAttendanceId, $set:{isApproved:true}}
                ]})
            }).then(
            function () {
                return rohitDb.update({$collection:"employeedailyattendance", $insert:[
                    {employee_id:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, attendance_date:"2014-07-04", attendance_type:"Present"}
                ]})
            }).then(
            function () {
                return rohitDb.update({$collection:"employeedailyattendance", $insert:[
                    {employee_id:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, attendance_date:"2014-07-02", attendance_type:"Present", isApproved:true}
                ]})
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

});

describe(" roles testcases - delete", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    });
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    });

    it('delete - role without delete', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[

                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("taskData > " + JSON.stringify(taskData));
                var taskToDelete = {$collection:"tasks", $delete:[
                    {_id:taskData.result[1]._id}
                ]};
                return teamLeadDb.update(taskToDelete);
            }).then(
            function (updateData) {
                done();
            }).catch(function (err) {
                if (err.toString().indexOf("Does not have sufficient privileges to delete record in collection") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    });

    it('delete - role with delete', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1},
                            {type:"remove", sequence:2}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("taskData > " + JSON.stringify(taskData));
                var taskToDelete = {$collection:"tasks", $delete:[
                    {_id:taskData.result[1]._id}
                ]};
                return teamLeadDb.update(taskToDelete);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("taskData > " + JSON.stringify(taskData));
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[1].task).to.eql("task3");
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('delete - role delete with filter', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[

                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1},
                            {type:"remove", sequence:2, filterUI:"grid", filterInfos:{$insert:[
                                {field:"task", value:"task1"}
                            ]}}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("taskData > " + JSON.stringify(taskData));
                var taskToDelete = {$collection:"tasks", $delete:[
                    {_id:taskData.result[0]._id}
                ]};
                return teamLeadDb.update(taskToDelete);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("taskData > " + JSON.stringify(taskData));
                expect(taskData.result[0].task).to.eql("task2");
                expect(taskData.result[1].task).to.eql("task3");
                var taskToDelete = {$collection:"tasks", $delete:[
                    {_id:taskData.result[0]._id}
                ]};
                return teamLeadDb.update(taskToDelete);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                if (err.toString().indexOf("Does not have sufficient privileges to delete record in collection") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    });

    it('delete - role delete with filter in resource', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[

                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", filterUI:"json", filterJSON:JSON.stringify({task:{$in:["task1", "task2"]}}), operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1},
                            {type:"remove", sequence:2}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {_id:"task3", task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("taskData > " + JSON.stringify(taskData));
                var taskToDelete = {$collection:"tasks", $delete:[
                    {_id:taskData.result[0]._id}
                ]};
                return teamLeadDb.update(taskToDelete);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
                console.log("taskData > " + JSON.stringify(taskData));
                expect(taskData.result[0].task).to.eql("task2");
                var taskToDelete = {$collection:"tasks", $delete:[
                    {_id:"task3"}
                ]};
                return teamLeadDb.update(taskToDelete);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                if (err.toString().indexOf("Result not found for collection") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    });

    it('delete - role delete new tasks and not incomplete', function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1},
                            {type:"remove", sequence:2, filterUI:"grid", filterInfos:{$insert:[
                                {field:"status", value:"New"}
                            ]}}
                        ]}}
                    ]},
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", "operationInfos":{$insert:[
                            {type:"insert"}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"status", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                var tasks = {$collection:"tasks", $insert:[
                    {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, status:"New"},
                    {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, status:"New"},
                    {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, status:"In Progress"}
                ]};
                return teamLeadDb.update(tasks);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("taskData > " + JSON.stringify(taskData));
                var taskToDelete = {$collection:"tasks", $delete:[
                    {_id:taskData.result[0]._id},
                    {_id:taskData.result[1]._id}
                ]};
                return teamLeadDb.update(taskToDelete);
            }).then(
            function () {
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
                expect(taskData.result[0].task).to.eql("task3");
                return teamLeadDb.query({$collection:"tasks", $sort:{task:1}});
            }).then(
            function (taskData) {
//                console.log("taskData > " + JSON.stringify(taskData));
                var taskToDelete = {$collection:"tasks", $delete:[
                    {_id:taskData.result[0]._id}
                ]};
                return teamLeadDb.update(taskToDelete);
            }).then(
            function (updateData) {
                done();
//                var updatedValue = updateData.tasks.$delete[0];
//                if (updatedValue === 0) {
//                    done();
//                } else {
//                    done("Record can not be deleted.");
//                }
            }).catch(function (err) {
                if (err.toString().indexOf("Does not have sufficient privileges to delete record in collection") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    });

});

describe(" roles testcases - nested groupby unwind ", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    });
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    });

    it('query - nested role with filter on resource', function (done) {
        var db = undefined;
        var developerDb = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Developer", privileges:[

                        {type:"Collection", collection:"tasks", filterUI:"grid", filterInfos:{$insert:[
                            {field:"assigned_to", value:"ashu"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ]},
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"tasks", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ], roles:[
                        { role:{$query:{ role:"Developer"}}}
                    ]},
                    {role:"Manager", privileges:[
                        {type:"Collection", collection:"employee", operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ], roles:[
                        { role:{$query:{ role:"Developer"}}},
                        { role:{$query:{ role:"Team Lead"}}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Manager"}}},
                        {role:{$query:{role:"Developer"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.query({"$collection":"pl.users", $modules:{"Role":0}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"},
                        {collection:"employee"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"age", type:"number", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"city", type:"string", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"state", type:"string", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"assigned_to", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var inserts = [
                    {$collection:"tasks", $insert:[
                        {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"},
                        {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, "assigned_to":"rohit"},
                        {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"}
                    ]},
                    {$collection:"employee", $insert:[
                        {name:"Sachin", age:"25", city:"Hisar", state:"Haryana"},
                        {name:"Rohit", age:"28", city:"Hansi", state:"Haryana"}
                    ]}
                ];
                return db.update(inserts);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"employee", $role:"Manager"});
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (db3) {
                developerDb = db3;
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('groupby on unauthorized field', function (done) {
        var db = undefined;
        var jrdb = undefined;
        var srdb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Sales", privileges:[
                        {type:"Collection", collection:"sales", fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                            {field:"revenue"},
                            {field:"salesperson"},
                            {field:"date"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:0}
                        ]}}
                    ], span:"1"},
                    {role:"HeadSales", privileges:[
                        {type:"Collection", collection:"sales", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1},
                            {type:"update", sequence:2},
                            {type:"remove", sequence:3}
                        ]}}
                    ], span:"1"}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"sales"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"id", type:"string", collectionid:{$query:{collection:"sales"}}} ,
                        {field:"date", "type":"date", collectionid:{$query:{collection:"sales"}}},
                        {field:"ordertype", type:"string", collectionid:{$query:{collection:"sales"}}} ,
                        {field:"quantity", type:"number", collectionid:{$query:{collection:"sales"}}} ,
                        {field:"revenue", type:"number", collectionid:{$query:{collection:"sales"}}},
                        {field:"salesperson", type:"fk", collectionid:{$query:{collection:"sales"}}, collection:"pl.users", set:["emailid"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"SalesJr", password:"sales", emailid:"sales@daffodil.com", roles:[
                        {role:{$query:{role:"Sales"}}}
                    ]},
                    {username:"SalesSr", password:"sales", emailid:"saleshead@daffodil.com", roles:[
                        {role:{$query:{role:"HeadSales"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                var inserts = [
                    {$collection:"sales", $insert:[
                        {id:"AFB", ordertype:"bulk", quantity:50, revenue:5000, salesperson:{$query:{emailid:"sales@daffodil.com"}}},
                        {id:"AFE", ordertype:"bulk", quantity:40, revenue:4000, salesperson:{$query:{emailid:"sales@daffodil.com"}}},
                        {id:"DB", ordertype:"precise", quantity:5, revenue:10000, salesperson:{$query:{emailid:"saleshead@daffodil.com"}}}
                    ]}
                ];
                return db.update(inserts);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"SalesJr", password:"sales"});
            }).then(
            function (dbb) {
                jrdb = dbb;
                return jrdb.query({"$collection":"sales", "$group":{"_id":null, Quantity:{$sum:"$quantity"}}, $fields:{revenue:1, id:1}});
            }).then(
            function (data) {
//                console.log("group Data>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].Quantity).to.eql(95);
                expect(data.result[0].children).to.have.length(3);
                expect(data.result[0].children[0].id).to.eql("AFB");
                expect(data.result[0].children[0].revenue).to.eql(undefined);
                expect(data.result[0].children[1].id).to.eql("AFE");
                expect(data.result[0].children[1].revenue).to.eql(undefined);
                expect(data.result[0].children[2].id).to.eql("DB");
                expect(data.result[0].children[2].revenue).to.eql(undefined);
            }).then(
            function () {
                return jrdb.query({"$collection":"sales", "$group":{"_id":null, Revenue:{$sum:"$revenue"}}});
            }).then(
            function (data) {
//                console.log("group Data>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].Revenue).to.eql(undefined);
                expect(data.result[0].children).to.eql(undefined);
            }).then(
            function () {
                return jrdb.query({"$collection":"sales", "$group":{"_id":null, Quantity:{$sum:"$quantity"}}, $fields:{revenue:1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].Quantity).to.eql(95);
                expect(data.result[0].children).to.eql(undefined);
            }).then(
            function () {
                return jrdb.query({"$collection":"sales", "$group":{"_id":null, Quantity:{$sum:"$quantity"}}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].Quantity).to.eql(95);
                expect(data.result[0].children).to.eql(undefined);
            }).then(
            function () {
                return jrdb.query({"$collection":"sales", "$group":{"_id":null, Revenue:{$sum:"$revenue"}, "Revenue_First":{$first:"$revenue"}}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].Revenue_First).to.eql(undefined);
                expect(data.result[0].Revenue).to.eql(undefined);
            }).then(
            function () {
                return jrdb.query({"$collection":"sales", "$group":{"_id":null, Revenue:{$sum:"$revenue"}, "Revenue_First":{$first:"$revenue"}}, $fields:{revenue:0}});
            }).fail(
            function (err) {
                if (err.toString().indexOf("Fields can not be excluded in group or unwind in Role.") === -1) {
                    done(err);
                }
            }).then(
            function () {
                return jrdb.query({"$collection":"sales", "$group":{"_id":"$salesperson"}});
            }).catch(
            function (err) {
                if (err.toString().indexOf("Group by can not be defined on excluded Field") === -1) {
                    done(err);
                }
            }).then(
            function () {
                return jrdb.query({"$collection":"sales", "$group":{"_id":"$salesperson._id"}});
            }).catch(
            function (err) {
                if (err.toString().indexOf("Group by can not be defined on excluded Field") === -1) {
                    done(err);
                }
            }).then(
            function () {
                return jrdb.query({"$collection":"sales", "$group":{"_id":"$salesperson.emailid"}});
            }).catch(
            function (err) {
                if (err.toString().indexOf("Group by can not be defined on excluded Field") === -1) {
                    done(err);
                }
            }).then(
            function () {
                return jrdb.query({"$collection":"sales", "$group":{"_id":{"SalesPerson":"$salesperson._id"}}});
            }).catch(
            function (err) {
                if (err.toString().indexOf("Group by can not be defined on excluded Field") === -1) {
                    done(err);
                }
            }).then(
            function () {
                return jrdb.query({"$collection":"sales", "$group":{"_id":{"SalesPerson":"$salesperson"}}});
            }).catch(
            function (err) {
                if (err.toString().indexOf("Group by can not be defined on excluded Field") === -1) {
                    done(err);
                }
            }).then(
            function () {
                return jrdb.query({"$collection":"sales", "$group":{"_id":"$ordertype"}});
            }).then(
            function () {
                return jrdb.query({"$collection":"sales", "$group":{"_id":{"OrderType":"$ordertype"}}});
            }).then(
            function () {
                return jrdb.query({"$collection":"sales", "$group":{_id:{date:{"year":{"$year":"$date"}}}}});
            }).catch(
            function (err) {
                if (err.toString().indexOf("Group by can not be defined on excluded Field") === -1) {
                    done(err);
                }
            }).then(
            function () {
                done();
            })
    });

    it('unwind on unauthorized field', function (done) {
        var db = undefined;
        var visitorDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"visitor", privileges:[
                        {type:"Collection", collection:"persons", fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                            {field:"name"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:1}
                        ]}}
                    ], span:"1"},
                    {role:"owner", privileges:[
                        {type:"Collection", collection:"persons", fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                            {field:"languages.lang"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:1}
                        ]}}
                    ], span:"1"},
                    {role:"guest", privileges:[
                        {type:"Collection", collection:"persons", fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                            {field:"languages"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:1}
                        ]}}
                    ], span:"1"}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"persons"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"persons"}}},
                        {field:"city", type:"string", collectionid:{$query:{collection:"persons"}}},
                        {field:"languages", type:"object", collectionid:{$query:{collection:"persons"}}, multiple:true, fields:[
                            {field:"lang", type:"string"},
                            {field:"read", type:"boolean"},
                            {field:"write", type:"boolean"}
                        ]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Visitor", password:"visitor", emailid:"user@daffodil.com", roles:[
                        {role:{$query:{role:"visitor"}}}
                    ]},
                    {username:"Owner", password:"owner", emailid:"user1@daffodil.com", roles:[
                        {role:{$query:{role:"owner"}}}
                    ]},
                    {username:"Guest", password:"guest", emailid:"user2@daffodil.com", roles:[
                        {role:{$query:{role:"guest"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                var inserts = [
                    {$collection:"persons", $insert:[
                        {name:"Ashu", city:"HMR", languages:[
                            {lang:"Hindi", read:true, write:true},
                            {lang:"English", read:false, write:true},
                            {lang:"Pahari", read:true}
                        ]},
                        {name:"Sachin", city:"HMR", languages:[
                            {lang:"Hindi", read:false},
                            {lang:"English", write:true},
                            {lang:"Haryanavi", read:true}
                        ]}
                    ]}
                ];
//                console.log("inserts>>>>>>>>>>" + JSON.stringify(inserts));
                return db.update(inserts);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Visitor", password:"visitor"});
            }).then(
            function (db2) {
                visitorDb = db2;
                return visitorDb.query({$collection:"persons", $unwind:["languages"], $fields:{name:1, "languages.lang":1, "languages.read":1}});
            }).then(
            function (data) {
//                console.log(" data >>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(6);
                expect(data.result[0].name).to.eql(undefined);
                expect(data.result[1].name).to.eql(undefined);
                expect(data.result[2].name).to.eql(undefined);
                expect(data.result[3].name).to.eql(undefined);
                expect(data.result[0].languages.lang).to.eql("Hindi");
                expect(data.result[1].languages.lang).to.eql("English");
                expect(data.result[2].languages.lang).to.eql("Pahari");
                expect(data.result[3].languages.lang).to.eql("Hindi");
                expect(data.result[4].languages.lang).to.eql("English");
                expect(data.result[5].languages.lang).to.eql("Haryanavi");
                expect(data.result[0].languages.read).to.eql(true);
                expect(data.result[1].languages.read).to.eql(false);
                expect(data.result[2].languages.read).to.eql(true);
                expect(data.result[3].languages.read).to.eql(false);
                expect(data.result[4].languages.read).to.eql(undefined);
                expect(data.result[5].languages.read).to.eql(true);
                expect(data.result[0].languages.write).to.eql(undefined);
                expect(data.result[1].languages.write).to.eql(undefined);
                expect(data.result[2].languages.write).to.eql(undefined);
                expect(data.result[3].languages.write).to.eql(undefined);
                expect(data.result[4].languages.write).to.eql(undefined);
                expect(data.result[5].languages.write).to.eql(undefined);
            }).then(
            function () {
                return visitorDb.query({$collection:"persons", $unwind:["languages"]});
            }).then(
            function (data) {
                done("Not Ok.")
            }).catch(function (err) {
                if (err.toString().indexOf("Fields can not be excluded in group or unwind in Role.") !== -1) {
                    done();
                } else {
                    done(err);
                }
            })
    });
});

describe(" roles testcases - view", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    });
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    });

    it('employee view test', function (done) {
        var db = undefined;
        var view = undefined;
        var tldb = undefined;
        var devdb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"employee", filterUI:"grid", filterInfos:{$insert:[
                            {field:"designation", operator:"$in", value:JSON.stringify(["Sr. Associate", "Associate"])}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:1}
                        ]}}
                    ], span:"1"},
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"employee", operationInfos:{$insert:[
                            {type:"find", sequence:1},
                            {type:"insert", sequence:2},
                            {type:"update", sequence:3},
                            {type:"remove", sequence:4}
                        ]}}
                    ], roles:[
                        { role:{$query:{ role:"Developer"}}}
                    ], span:"2"}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"employee"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"age", type:"number", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"city", type:"string", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"state", type:"string", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"emailid", type:"string", collectionid:{$query:{collection:"employee"}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var inserts = [
                    {$collection:"employee", $insert:[
                        {name:"sachin", age:"25", city:"Hisar", state:"Haryana", email:"sachin@daffodilsw.com", designation:"Sr. Associate"},
                        {name:"ashu", age:"25", city:"Hamirpur", state:"Himachal", email:"ashu@daffodilsw.com", designation:"Associate"},
                        {name:"rohit", age:"28", city:"Hansi", state:"Haryana", email:"rohit@daffodilsw.com", designation:"Team Lead"}
                    ]}
                ];
                return db.update(inserts);
            }).then(
            function () {
                var inserts = {$collection:"pl.qviews", $insert:[
                    {label:"Employee View", id:"employeeview", collection:{$query:{collection:"employee"}}, mainCollection:{$query:{collection:"employee"}}}
                ]};
                return db.update(inserts);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit"});
            }).then(
            function (db2) {
                tldb = db2;
                var update = {$collection:"employee", $insert:[
                    {name:"manjeet", age:"26", city:"Hisar", state:"Haryana", email:"manjeet@daffodilsw.com", designation:"Sr. Associate"}
                ]};
                return tldb.update(update);
            }).then(
            function () {
                return db.query({$collection:"pl.qviews", $filter:{id:"employeeview"}});
            }).then(
            function (data) {
//                console.log("qviews >>  " + JSON.stringify(data));
                view = data.result[0];
            }).then(
            function () {
                return tldb.invokeFunction("view.getView", [view]);
            }).then(
            function (data) {
//                console.log("view data  >> "+JSON.stringify(data));
                //check if options has @ [0] role with top span value
                expect(data.viewOptions.actions).to.not.equal(undefined);
                expect(data.viewOptions.actions).to.have.length(1);
                expect(data.viewOptions.actions[0].options).to.have.length(2);
                expect(data.viewOptions.actions[0].options[0]).to.eql("Team Lead");
                expect(data.viewOptions.actions[0].options[1]).to.eql("Developer");
                expect(data.data.result).to.have.length(4);
            }).then(
            function () {
                return tldb.query({$collection:"employee", $parameters:{__role__:"Developer"}, $sort:{name:1}});
            }).then(
            function (data) {
                console.log(" data from second role >> " + JSON.stringify(data));
                expect(data.result).to.have.length(3);
                expect(data.result[0].designation).to.eql("Associate");
                expect(data.result[1].designation).to.eql("Sr. Associate");
                expect(data.result[2].designation).to.eql("Sr. Associate");
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('default role - view test', function (done) {
        var db = undefined;
        var view = undefined;
        var tldb = undefined;
        var devdb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"employee", filterUI:"grid", filterInfos:{$insert:[
                            {field:"designation", operator:"$in", value:JSON.stringify(["Sr. Associate", "Associate"])}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:1}
                        ]}}

//                        {resource:JSON.stringify({collection:"employee", "filter":{"designation":{$in:["Sr. Associate", "Associate"]}}}), actions:JSON.stringify(["find"])}
                    ], span:"1"},
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"employee", operationInfos:{$insert:[
                            {type:"find", sequence:1},
                            {type:"insert", sequence:2},
                            {type:"update", sequence:3},
                            {type:"remove", sequence:4}
                        ]
                        }}
                    ], roles:[
                        { role:{$query:{ role:"Developer"}}}
                    ], span:"2"}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
//                console.log("rolesData >>>>>   "+JSON.stringify(rolesData));
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"employee"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"age", type:"number", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"city", type:"string", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"state", type:"string", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"emailid", type:"string", collectionid:{$query:{collection:"employee"}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var inserts = [
                    {$collection:"employee", $insert:[
                        {name:"sachin", age:"25", city:"Hisar", state:"Haryana", email:"sachin@daffodilsw.com", designation:"Sr. Associate"},
                        {name:"ashu", age:"25", city:"Hamirpur", state:"Himachal", email:"ashu@daffodilsw.com", designation:"Associate"},
                        {name:"rohit", age:"28", city:"Hansi", state:"Haryana", email:"rohit@daffodilsw.com", designation:"Team Lead"}
                    ]}
                ];
                return db.update(inserts);
            }).then(
            function () {
                var inserts = {$collection:"pl.qviews", $insert:[
                    {label:"Employee View", id:"employeeview", collection:{$query:{collection:"employee"}}, mainCollection:{$query:{collection:"employee"}}, roleid:{$query:{role:"Developer"}}}
                ]};
                return db.update(inserts);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit"});
            }).then(
            function (db2) {
                tldb = db2;
                var update = {$collection:"employee", $insert:[
                    {name:"manjeet", age:"26", city:"Hisar", state:"Haryana", email:"manjeet@daffodilsw.com", designation:"Sr. Associate"}
                ]};
                return tldb.update(update);
            }).then(
            function () {
                return tldb.query({$collection:"pl.qviews", $filter:{id:"employeeview"}});
            }).then(
            function (data) {
//                console.log("qviews >>  " + JSON.stringify(data));
                view = data.result[0];
            }).then(
            function () {
                return tldb.invokeFunction("view.getView", [view]);
            }).then(
            function (data) {
//                console.log("view data  >> "+JSON.stringify(data));
                //  check if data is as per default role i.e. not the first role as per span
                expect(data.viewOptions.actions).to.not.equal(undefined);
                expect(data.viewOptions.actions).to.have.length(1);
                expect(data.viewOptions.actions[0].options).to.have.length(2);
                expect(data.viewOptions.actions[0].options[0]).to.eql("Team Lead");
                expect(data.viewOptions.actions[0].options[1]).to.eql("Developer");
                expect(data.data.result).to.have.length(3);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('task view test', function (done) {
        var db = undefined;
        var view = undefined;
        var ashudb = undefined;
        var sachindb = undefined;
        var rohitdb = undefined;
        var yogeshdb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Employee Self", privileges:[
                        {type:"Collection", collection:"employee", filterUI:"grid", filterInfos:{$insert:[
                            {field:"userid", value:"$$CurrentUser"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:1},
                            {type:"update", sequence:2},
                            {type:"remove", sequence:3},
                            {type:"insert", sequence:4}
                        ]}, filterName:"Employee Self"}
                    ], span:"10"},
                    {role:"Employee Team", privileges:[
                        {type:"Collection", collection:"employee", filterUI:"grid", filterInfos:{$insert:[
                            {field:"reporting_to", value:JSON.stringify({$$CurrentUser:{"referredFK":{collection:"employee", referredField:"userid", field:"_id"}}})}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:1},
                            {type:"update", sequence:2},
                            {type:"remove", sequence:3},
                            {type:"insert", sequence:4}
                        ]}, filterName:"Employee Team"}
                    ], span:"2"},
                    {role:"Employee All Team", privileges:[
                        {type:"Collection", collection:"employee", filterUI:"grid", filterInfos:{$insert:[
                            {field:"_id", operator:"$in", value:JSON.stringify({"$$Functions.Query":{"query":{"$collection":"employee", "$modules":{"Role":0}, "$fields":{"_id":1}, "$filter":{"reporting_to.userid":{"$function":"Functions.CurrentUser"}}, "$recursion":{"reporting_to":"_id"}}, "nestedField":"children", "filterField":"_id"}})}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:1},
                            {type:"update", sequence:2},
                            {type:"remove", sequence:3},
                            {type:"insert", sequence:4}
                        ]}, filterName:"Employee All Team"}
                    ], span:"30"},
                    {role:"General employee 1", privileges:[
                        {type:"Collection", collection:"employee", fieldsAvailability:"Include", fieldInfos:{$insert:[
                            {field:"name"}
                        ]}, filterUI:"grid", filterInfos:{$insert:[
                            {field:"age", operator:"$lt", value:27}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:1}
                        ]}, filterName:"General employee"}
                    ], span:"1"},
                    {role:"General employee 2", privileges:[
                        {type:"Collection", collection:"employee", fieldsAvailability:"Include", fieldInfos:{$insert:[
                            {field:"name"}
                        ]}, filterUI:"grid", filterInfos:{$insert:[
                            {field:"age", operator:"$gt", value:27}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:1}
                        ]}, filterName:"General employee"}
                    ], span:"1"},
                    {role:"All Employee", privileges:[
                        {type:"Collection", collection:"employee", operationInfos:{$insert:[
                            {type:"find", sequence:1},
                            {type:"update", sequence:2},
                            {type:"remove", sequence:3},
                            {type:"insert", sequence:4}
                        ]}, filterName:"All Employee"}
                    ], span:"50"},
                    {role:"Task Role", privileges:[
                        {type:"Collection", collection:"tasks", filterUI:"grid", filterInfos:{$insert:[
                            {field:"ownerid", operator:"$in", value:"$$UserRoles"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:1},
                            {type:"update", sequence:2},
                            {type:"remove", sequence:3},
                            {type:"insert", sequence:4}
                        ]}}
                    ], span:"1"}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"},
                        {collection:"employee"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"age", type:"number", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"city", type:"string", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"state", type:"string", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"ecode", type:"string", collectionid:{$query:{collection:"employee"}}} ,
                        {field:"userid", type:"fk", collectionid:{$query:{collection:"employee"}}, collection:"pl.users", set:["emailid"], displayField:"emailid"},
                        {field:"reporting_to", type:"fk", collectionid:{$query:{collection:"employee"}}, collection:"employee", set:["name"], displayField:"name"},
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}},
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"employee", set:["name"], displayField:"name"}
                    ]},
                    {$collection:"pl.qviews", $insert:[
                        {label:"Task View", id:"taskview", collection:{$query:{collection:"tasks"}}, mainCollection:{$query:{collection:"tasks"}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Ashu", password:"ashu", emailid:"ashu.vashishat@gm.com", roles:[
                        {role:{$query:{role:"Employee Self"}}},
                        {role:{$query:{role:"General employee 1"}}},
                        {role:{$query:{role:"Task Role"}}}
                    ]},
                    {username:"Sachin", password:"sachin", emailid:"sachin.bansal@gm.com", roles:[
                        {role:{$query:{role:"Employee Self"}}},
                        {role:{$query:{role:"Employee Team"}}},
                        {role:{$query:{role:"General employee 1"}}},
                        {role:{$query:{role:"Task Role"}}}
                    ]},
                    {username:"Rohit", password:"rohit", emailid:"rohit.bansal@gm.com", roles:[
                        {role:{$query:{role:"Employee Self"}}},
                        {role:{$query:{role:"Employee All Team"}}},
                        {role:{$query:{role:"Employee Team"}}},
                        {role:{$query:{role:"General employee 2"}}},
                        {role:{$query:{role:"Task Role"}}}
                    ]},
                    {username:"Yogesh", password:"yogesh", emailid:"yogesh@gm.com", roles:[
                        {role:{$query:{role:"Employee Self"}}},
                        {role:{$query:{role:"General employee 2"}}},
                        {role:{$query:{role:"All Employee"}}},
                        {role:{$query:{role:"Task Role"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                var inserts = [
                    {$collection:"employee", $insert:[
                        {name:"Yogesh", age:35, city:"Gurgaon", state:"Haryana", ecode:"EMP-1001", userid:{$query:{emailid:"yogesh@gm.com"}}},
                        {name:"Rohit", age:29, city:"Hisar", state:"Haryana", ecode:"EMP-1010", userid:{$query:{emailid:"rohit.bansal@gm.com"}}, reporting_to:{$query:{name:"Yogesh"}}},
                        {name:"Sachin", age:25, city:"Hisar", state:"Haryana", ecode:"EMP-1100", userid:{$query:{emailid:"sachin.bansal@gm.com"}}, reporting_to:{$query:{name:"Rohit"}}},
                        {name:"Ashu", age:25, city:"Hisar", state:"Haryana", ecode:"EMP-1212", userid:{$query:{emailid:"ashu.vashishat@gm.com"}}, reporting_to:{$query:{name:"Sachin"}}}
                    ]},
                    {$collection:"tasks", $insert:[
                        {task:"Manage", "duedate":"2014-09-06", estefforts:"20 Hrs", "self_rating":3, "team_lead_rating":10, ownerid:{$query:{name:"Rohit"}}},
                        {task:"Design", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, "team_lead_rating":10, ownerid:{$query:{name:"Rohit"}}},
                        {task:"Design Role", "duedate":"2014-09-03", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{name:"Sachin"}}},
                        {task:"Implementation", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{name:"Sachin"}}},
                        {task:"Deploy", "duedate":"2014-09-09", estefforts:"10 Hrs", "self_rating":5, ownerid:{$query:{name:"Ashu"}}},
                        {task:"Implement", "duedate":"2014-09-01", estefforts:"10 Hrs", "self_rating":5, ownerid:{$query:{name:"Ashu"}}},
                        {task:"Review", "duedate":"2014-09-02", estefforts:"13 Hrs", "self_rating":7, "team_lead_rating":9, ownerid:{$query:{name:"Yogesh"}}}
                    ]}
                ];
                return db.update(inserts);
            }).then(
            function (data) {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Ashu", password:"ashu"});
            }).then(
            function (adb) {
                ashudb = adb;
                return ashudb.invokeFunction("view.getView", [
                    {id:"taskview"}
                ]);
            }).then(
            function (data) {
//                console.log("Ashu data  >> " + JSON.stringify(data));
                var fields = data.viewOptions.fields;
                for (var i = 0; i < fields.length; i++) {
                    var field = fields[i];
                    if (field.field === "ownerid") {
                        expect(field.defaultOptions).to.have.length(2);
                        expect(field.defaultOptions[0].__role__).to.eql("Employee Self");
                        expect(field.defaultOptions[0].span).to.eql(10);
                        expect(field.defaultOptions[1].__role__).to.eql("General employee 1");
                        expect(field.defaultOptions[1].span).to.eql(1);
//                        expect(field.asParameter).to.eql(true);
                    }
                }
                expect(data.data.result).to.have.length(2);
                expect(data.data.result[0].ownerid.name).to.eql("Ashu");
                expect(data.data.result[1].ownerid.name).to.eql("Ashu");
            }).then(
            function () {
                return ashudb.query({$collection:"tasks", $filter:{}, $parameters:{"ownerid":{__role__:"General employee 1", name:"General employee 1", span:1}}})
            }).then(
            function (data) {
//                console.log("Ashu General employee data >>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(4);
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin", password:"sachin"});
            }).then(
            function (adb) {
                sachindb = adb;
                return sachindb.invokeFunction("view.getView", [
                    {id:"taskview"}
                ]);
            }).then(
            function (data) {
//                console.log("Sachin data  >> " + JSON.stringify(data));
                expect(data.data.result).to.have.length(2);
                expect(data.data.result[0].ownerid.name).to.eql("Sachin");
                expect(data.data.result[1].ownerid.name).to.eql("Sachin");
            }).then(
            function () {
                return sachindb.query({$collection:"tasks", $filter:{}, $parameters:{"ownerid":{__role__:"General employee 1", name:"General employee 1", span:1}}})
            }).then(
            function (data) {
//                console.log("Sachin General employee data >>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(4);
                return sachindb.query({$collection:"tasks", $filter:{}, $parameters:{"ownerid":{__role__:"Employee Team", name:"Employee Team", span:2}}})
            }).then(
            function (data) {
//                console.log("Sachin Team employee data >>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].ownerid.name).to.eql("Ashu");
                expect(data.result[1].ownerid.name).to.eql("Ashu");
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit", password:"rohit"});
            }).then(
            function (adb) {
                rohitdb = adb;
                return rohitdb.invokeFunction("view.getView", [
                    {id:"taskview"}
                ]);
            }).then(
            function (data) {
//                console.log("Rohit data  >> " + JSON.stringify(data));
                expect(data.data.result).to.have.length(4);
                return rohitdb.query({$collection:"tasks", $filter:{}, $parameters:{"ownerid":{__role__:"Employee Self", name:"Employee Self", span:1}}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
            }).then(
            function () {
                return rohitdb.query({$collection:"tasks", $filter:{}, $parameters:{"ownerid":{__role__:"General employee 2", name:"General employee 2", span:1}}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
            }).then(
            function () {
                return rohitdb.query({$collection:"tasks", $filter:{}, $parameters:{"ownerid":{__role__:"Employee Team", name:"Employee Team", span:2}}})
            }).then(
            function (data) {
//                console.log("Rohit Team data  >> " + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].ownerid.name).to.eql("Sachin");
                expect(data.result[1].ownerid.name).to.eql("Sachin");
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Yogesh", password:"yogesh"});
            }).then(
            function (adb) {
                yogeshdb = adb;
                return yogeshdb.invokeFunction("view.getView", [
                    {id:"taskview"}
                ]);
            }).then(
            function (data) {
//                console.log("Yogesh data  >> " + JSON.stringify(data));
                var fields = data.viewOptions.fields;
                for (var i = 0; i < fields.length; i++) {
                    var field = fields[i];
                    if (field.field === "ownerid") {
                        expect(field.defaultOptions).to.have.length(3);
                        expect(field.defaultOptions[0].__role__).to.eql("All Employee");
                        expect(field.defaultOptions[0].span).to.eql(50);
                        expect(field.defaultOptions[1].__role__).to.eql("Employee Self");
                        expect(field.defaultOptions[1].span).to.eql(10);
                        expect(field.defaultOptions[2].__role__).to.eql("General employee 2");
                        expect(field.defaultOptions[2].span).to.eql(1);
//                        expect(field.asParameter).to.eql(true);
                    }
                }
                expect(data.data.result).to.have.length(7);
            }).then(
            function () {
                return yogeshdb.query({$collection:"tasks", $filter:{}, $parameters:{"ownerid":{__role__:"General employee 2", name:"General employee 2", span:1}}})
            }).then(
            function (data) {
//                console.log("Yogesh General employee data >>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(3);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it("UserRoles with dotted in Filter Key", function (done) {
        var db = undefined;
        var teamLeadDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"employeess", filterUI:"grid", filterInfos:{$insert:[
                            {field:"_id", operator:"$eq", value:JSON.stringify({"$$CurrentUser":{"referredFK":{collection:"employeess", referredField:"user_id", field:"_id"}}})}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:1}
                        ]}},
                        {type:"Collection", collection:"taskss", filterUI:"grid", filterInfos:{$insert:[
                            {field:"ownerid", operator:"$in", value:"$$UserRoles", logicalOperator:"OR"},
                            {field:"owners.owner_id", value:"$$UserRoles", logicalOperator:"OR"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:1}
                        ]}}


                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function (rolesData) {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"taskss"} ,
                        {collection:"employeess"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"emailid", type:"string", collectionid:{$query:{collection:"employeess"}}},
                        {field:"user_id", type:"fk", collection:"pl.users", set:["emailid"], collectionid:{$query:{collection:"employeess"}}},
                        {field:"task", type:"string", collectionid:{$query:{collection:"taskss"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"taskss"}}, collection:"employeess", set:["emailid"]},
                        {field:"owners", type:"object", multiple:true, collectionid:{$query:{collection:"taskss"}}},
                        {field:"owner_id", type:"fk", collectionid:{$query:{collection:"taskss"}}, collection:"employeess", set:["emailid"], parentfieldid:{$query:{field:"owners", collectionid:{$query:{collection:"taskss"}}}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var employees = {$collection:"employeess", $insert:[
                    {emailid:"rohit.bansal@daffodilsw.com", user_id:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}},
                    {emailid:"sachin.bansal@daffodilsw.com", user_id:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                ]};
                return db.update(employees);
            }).then(
            function () {
                var tasks = {$collection:"taskss", $insert:[
                    {task:"task1", ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}},
                    {task:"task2", owners:[
                        {owner_id:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}}
                    ]},
                    {task:"task3", owners:[
                        {owner_id:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                    ]},
                    {task:"task4", ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, owners:[
                        {owner_id:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                    ]} ,
                    {task:"task5", ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, owners:[
                        {owner_id:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}}
                    ]},
                    {task:"task6"}
                ]};
                return db.update(tasks);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Team Lead"});
            }).then(
            function (db2) {
                teamLeadDb = db2;
                return teamLeadDb.query({$collection:"taskss", $sort:{task:1}});
            }).then(
            function (taskData) {
                expect(taskData.result).to.have.length(4);
                expect(taskData.result[0].task).to.eql("task1");
                expect(taskData.result[1].task).to.eql("task3");
                expect(taskData.result[2].task).to.eql("task4");
                expect(taskData.result[3].task).to.eql("task5");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it('roles privileges test', function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"tasks", fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                            {field:"assigned_to"},
                            {field:"ownerid"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:0, fieldsAvailability:"Exclude", fieldInfos:{$insert:[
                                {field:"ownerid"},
                                {field:"team_lead_rating"}
                            ]}},
                            {type:"insert", sequence:1, filterUI:"grid", filterInfos:{$insert:[
                                {field:"assigned_to", value:"ashu", logicalOperator:"AND"},
                                {field:"reporting_to", value:"sachin", logicalOperator:"AND"}
                            ]}},
                            {type:"insert", sequence:2, filterUI:"grid", filterInfos:{$insert:[
                                {field:"assigned_to", value:"ashu"}
                            ]}},
                            {type:"update", sequence:3},
                            {type:"remove", sequence:4, filterUI:"grid", filterInfos:{$insert:[
                                {field:"assigned_to", value:"ashu"}
                            ]}}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({$collection:"pl.roles"});
            }).then(
            function (rolesData) {
                expect(rolesData.result).to.have.length(1);

                var roleId = rolesData.result[0]._id;
                var privileges = rolesData.result[0].privileges;
                var privilegeId = privileges[0]._id;

                var operationInfos = privileges[0].operationInfos;
                var operationInfoIdToDelete = operationInfos[0]._id
                var actions = JSON.parse(privileges[0].actions);

                expect(actions).to.have.length(4);
                expect(Object.keys(actions[0])[0]).to.eql("find");
                expect(Object.keys(actions[1])[0]).to.eql("insert");
                expect(actions[2]).to.eql("update");
                expect(Object.keys(actions[3])[0]).to.eql("remove");

                var delQuery = {$collection:"pl.roles", $update:{_id:roleId, $set:{privileges:{$update:[
                    {_id:privilegeId, $set:{operationInfos:{$delete:[
                        {_id:operationInfoIdToDelete}
                    ]}}}
                ]}}}};
                return db.update(delQuery);
            }).then(
            function (result) {
                return db.query({$collection:"pl.roles"});
            }).then(
            function (dataAfterDelete) {
                var roles = dataAfterDelete.result;

                var privileges = roles[0].privileges;
                var privilege = privileges[0];
                var actions = JSON.parse(privilege.actions);

                expect(actions).to.have.length(3);
                expect(Object.keys(actions[0])[0]).to.eql("insert");
                expect(actions[1]).to.eql("update");
                expect(Object.keys(actions[2])[0]).to.eql("remove");

            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('test case for showing actions for specific roles', function (done) {
        var db = undefined;
        var view = undefined;
        var tldb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Developer", privileges:[
                        {type:"Collection", collection:"__employee", filterUI:"grid", operationInfos:{$insert:[
                            {type:"find", sequence:1},
                            {type:"insert", sequence:2}
                        ]}}

                    ], span:"1"},
                    {role:"Team Lead", privileges:[
                        {type:"Collection", collection:"__employee", operationInfos:{$insert:[
                            {type:"find", sequence:1},
                            {type:"insert", sequence:2}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.query({"$collection":"pl.roles"});
            }).then(
            function (rolesData) {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]},
                    {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"__employee"}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var actionInsert = {$collection:"pl.actions", $insert:[
                    {id:"action1", visibility:true, label:"Action1", type:"invoke", collectionid:{$query:{collection:"__employee"}}, roles:[
                        {role:{$query:{role:"Team Lead"}}}
                    ]}
                ]};
                return db.update(actionInsert);
            }).then(
            function () {
                var inserts = {$collection:"pl.qviews", $insert:[
                    {label:"Employee View", id:"employeeview", collection:{$query:{collection:"__employee"}}, mainCollection:{$query:{collection:"__employee"}}}
                ]};
                return db.update(inserts);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit"});
            }).then(
            function (db2) {
                tldb = db2;
                return db.query({$collection:"pl.qviews", $filter:{id:"employeeview"}});
            }).then(
            function (data) {
                view = data.result[0];
            }).then(
            function () {
                return tldb.invokeFunction("view.getView", [view]);
            }).then(
            function (data) {
                expect(data.viewOptions.actions).to.have.length(1);
                expect(data.viewOptions.actions[0].id).to.eql("action1");
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin"});
            }).then(
            function (db2) {
                tldb = db2;
                return db.query({$collection:"pl.qviews", $filter:{id:"employeeview"}});
            }).then(
            function (data) {
                view = data.result[0];
            }).then(
            function () {
                return tldb.invokeFunction("view.getView", [view]);
            }).then(
            function (data) {
                expect(data.viewOptions.actions).to.have.length(0);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it.skip('test case for showing qViews for specific roles',
        function (done) {
            var db = undefined;
            var view = undefined;
            var tldb = undefined;
            var menuInfo = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    var createRoles = {$collection:"pl.roles", $insert:[
                        {role:"Developer", privileges:[
                            {type:"Collection", collection:"__employee", filterUI:"grid", operationInfos:{$insert:[
                                {type:"find", sequence:1},
                                {type:"insert", sequence:2}
                            ]}}

                        ], span:"1"},
                        {role:"Team Lead", privileges:[
                            {type:"Collection", collection:"__employee", operationInfos:{$insert:[
                                {type:"find", sequence:1},
                                {type:"insert", sequence:2}
                            ]}}
                        ]}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    return db.query({"$collection":"pl.roles"});
                }).then(
                function (rolesData) {
                    var createUsers = {$collection:"pl.users", $insert:[
                        {_id:12, username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                            {role:{$query:{role:"Developer"}}}
                        ]},
                        {_id:13, username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                            {role:{$query:{role:"Team Lead"}}}
                        ]}
                    ], $modules:{"Role":0}};
                    return db.update(createUsers);
                }).then(
                function () {
                    var applicationInsert = {$collection:"pl.applications", $insert:[
                        {_id:4, label:"Role Testing"}
                    ]};
                    return db.update(applicationInsert);
                }).then(
                function () {
                    var menuInsert = {$collection:"pl.menus", $insert:[
                        {_id:5, label:"menu1", application:{$query:{label:"Role Testing"}}, collection:"__employee" }
                    ]};
                    return db.update(menuInsert);
                }).then(
                function () {
                    var inserts = {$collection:"pl.qviews", $insert:[
                        {_id:1, label:"Employee View1", id:"employeeview1", collection:{$query:{collection:"__employee"}}, mainCollection:{$query:{collection:"__employee"}}},
                        {_id:2, label:"Employee View2", id:"employeeview2", collection:{$query:{collection:"__employee"}}, mainCollection:{$query:{collection:"__employee"}}},
                        {_id:3, label:"Employee View3", id:"employeeview3", collection:{$query:{collection:"__employee"}}, mainCollection:{$query:{collection:"__employee"}}, roles:[
                            {role:{$query:{role:"Developer"}}}
                        ]}
                    ]};
                    return db.update(inserts);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit"});
                }).then(
                function (db2) {
                    tldb = db2;
                    return db.query({$collection:"pl.menus", $filter:{_id:5}})
                }).then(
                function (menuData) {
                    menuInfo = menuData.result[0];
                    menuInfo.selectedApplication = menuInfo.application._id;
                    return tldb.invokeFunction("getMenuState", [menuInfo]);
                }).then(
                function (data) {
                    expect(data.qviews).to.have.length(3);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin"});
                }).then(
                function (db2) {
                    tldb = db2;
                    return db.query({$collection:"pl.menus", $filter:{_id:5}})
                }).then(
                function (menuData) {
                    menuInfo = menuData.result[0];
                    menuInfo.selectedApplication = menuInfo.application._id;
                    return tldb.invokeFunction("getMenuState", [menuInfo]);
                }).then(
                function (data) {
                    expect(data.qviews).to.have.length(4);
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });

    it.skip('test case for showing qViews from menus for specific roles',
        function (done) {
            var db = undefined;
            var view = undefined;
            var tldb = undefined;
            var menuInfo = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    var createRoles = {$collection:"pl.roles", $insert:[
                        {role:"Developer", privileges:[
                            {type:"Collection", collection:"__employee", filterUI:"grid", operationInfos:{$insert:[
                                {type:"find", sequence:1},
                                {type:"insert", sequence:2}
                            ]}}

                        ], span:"1"},
                        {role:"Team Lead", privileges:[
                            {type:"Collection", collection:"__employee", operationInfos:{$insert:[
                                {type:"find", sequence:1},
                                {type:"insert", sequence:2}
                            ]}}
                        ]}
                    ]};
                    return db.update(createRoles);
                }).then(
                function () {
                    return db.query({"$collection":"pl.roles"});
                }).then(
                function (rolesData) {
                    var createUsers = {$collection:"pl.users", $insert:[
                        {_id:12, username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                            {role:{$query:{role:"Developer"}}}
                        ]},
                        {_id:13, username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com", roles:[
                            {role:{$query:{role:"Team Lead"}}}
                        ]}
                    ], $modules:{"Role":0}};
                    return db.update(createUsers);
                }).then(
                function () {
                    var applicationInsert = {$collection:"pl.applications", $insert:[
                        {_id:4, label:"Role Testing"}
                    ]};
                    return db.update(applicationInsert);
                }).then(
                function () {
                    var menuInsert = {$collection:"pl.menus", $insert:[
                        {_id:5, label:"menu1", application:{$query:{label:"Role Testing"}}, collection:"__employee" }
                    ]};
                    return db.update(menuInsert);
                }).then(
                function () {
                    var inserts = {$collection:"pl.qviews", $insert:[
                        {_id:1, label:"Employee View1", id:"employeeview1", collection:{$query:{collection:"__employee"}}, mainCollection:{$query:{collection:"__employee"}}},
                        {_id:2, label:"Employee View2", id:"employeeview2", collection:{$query:{collection:"__employee"}}, mainCollection:{$query:{collection:"__employee"}}},
                        {_id:3, label:"Employee View3", id:"employeeview3", collection:{$query:{collection:"__employee"}}, mainCollection:{$query:{collection:"__employee"}}, roles:[
                            {role:{$query:{role:"Developer"}}}
                        ]}
                    ]};
                    return db.update(inserts);
                })
                .then(
                function () {
                    var updates = {$collection:"pl.menus", $update:{_id:5, $set:{qviews:{$insert:[
                        {label:"Employee View2", id:"employeeview2", collection:"__employee"},
                        {label:"Employee View3", id:"employeeview3", collection:"__employee"}
                    ]}}}}
                    return db.update(updates)
                })
                .then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit_TeamLead", password:"rohit"});
                }).then(
                function (db2) {
                    tldb = db2;
                    return db.query({$collection:"pl.menus", $filter:{_id:5}})
                }).then(
                function (menuData) {
                    menuInfo = menuData.result[0];
                    menuInfo.selectedApplication = menuInfo.application._id;
                    return tldb.invokeFunction("getMenuState", [menuInfo]);
                }).then(
                function (data) {
                    expect(data.qviews).to.have.length(1);
                }).then(
                function () {
                    return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin"});
                }).then(
                function (db2) {
                    tldb = db2;
                    return db.query({$collection:"pl.menus", $filter:{_id:5}})
                }).then(
                function (menuData) {
                    menuInfo = menuData.result[0];
                    menuInfo.selectedApplication = menuInfo.application._id;
                    return tldb.invokeFunction("getMenuState", [menuInfo]);
                }).then(
                function (data) {
                    expect(data.qviews).to.have.length(2);
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });


});


