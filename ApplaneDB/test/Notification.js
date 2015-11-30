/**
 *
 * mocha --recursive --timeout 150000 -g "Notificationtestcase" --reporter spec
 *
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 17/10/14
 * Time: 10:05 AM
 * To change this template use File | Settings | File Templates.
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var NorthwindDb = require('./NorthwindDb.js');
var Testcases = require("./TestCases.js");
var Notifications = require("../lib/Notifications.js");

describe("Notificationtestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    });
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    });

    it("Notification With On Status With Top Role without data", function (done) {
        var db = undefined;
        var adminDB = undefined;
        var notification = {
            id:"Testing",
            viewid:"tasks_view",
            subject:JSON.stringify({"template":"Testing Report"}),
            roles:["Admin"],
//            filter:JSON.stringify({}),
//            parameters:JSON.stringify({}),
            when:{"repeats":"Daily", "repeatEvery":"1", "startsOn":"2014-09-05T05:30:00.000Z", "nextDueOn":"2014-10-02T05:30:00.000Z"},
            status:"On",
            serverName:Config.SERVER_NAME
//            dbs:[]
        };
        var infos = {mail:false, updateWhen:false};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Basic User"},
                    {role:"Admin", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.update({$collection:"pl.users", $insert:[
                    {username:"sachin", emailid:"sachin@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"rohit", emailid:"rohit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"amit", emailid:"amit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Admin"}}}
                    ]}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks"}
                ]});
            }).then(
            function () {
                var qviewsUpdate = {$collection:"pl.qviews", $insert:[
                    {label:"Tasks", id:"tasks_view", collection:{$query:{collection:"tasks"}}, mainCollection:{$query:{collection:"tasks"}}}
                ]}
                return db.update(qviewsUpdate);
            }).then(
            function () {
                return db.getAdminDB();
            }).then(
            function (adb) {
                adminDB = adb;
            }).then(
            function () {
                notification.skipMail = true;
                notification.skipUpdateWhen = true;
                return Notifications.executeNotification(notification, [db.db.databaseName], adminDB);
            }).then(
            function (logId) {
                return adminDB.query({$collection:"pl.logs", $filter:{_id:logId}, $events:false, $modules:false});
            }).then(
            function (logInfo) {
                logInfo = logInfo.result;
                expect(logInfo).to.have.length(1);
                expect(logInfo[0].status).to.eql("Success");
                var innerLog = JSON.parse(logInfo[0].logs[0].log);
                expect(innerLog.db).to.eql(db.db.databaseName);
                expect(logInfo[0].logs[0].status).to.eql("Success");
                expect(innerLog.userCount).to.eql(1);
                expect(innerLog.errorUserCount).to.eql(0);
                expect(innerLog.mailSentUserCount).to.eql(0);
                expect(innerLog.mailSkipUserCount).to.eql(1);
                expect(innerLog.mailSentTo).to.have.length(0);
                expect(innerLog.mailSkipTo).to.have.length(1);
                expect(innerLog.mailSkipTo.indexOf("sachin")).to.eql(-1);
                expect(innerLog.mailSkipTo.indexOf("rohit")).to.eql(-1);
                expect(innerLog.mailSkipTo.indexOf("amit")).to.not.eql(-1);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Notification With On Status With Parent Role without data", function (done) {
        var db = undefined;
        var adminDB = undefined;
        var notification = {
            id:"Testing",
            viewid:"tasks_view",
            subject:JSON.stringify({"template":"Testing Report"}),
            roles:["Basic User"],
//            filter:JSON.stringify({}),
//            parameters:JSON.stringify({}),
            when:{"repeats":"Daily", "repeatEvery":"1", "startsOn":"2014-09-05T05:30:00.000Z", "nextDueOn":"2014-10-02T05:30:00.000Z"},
            status:"On",
            serverName:Config.SERVER_NAME
//            dbs:[]
        };
        var infos = {mail:false, updateWhen:false};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Basic User"},
                    {role:"Admin", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.update({$collection:"pl.users", $insert:[
                    {username:"sachin", emailid:"sachin@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"rohit", emailid:"rohit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"amit", emailid:"amit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Admin"}}}
                    ]}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks"}
                ]});
            }).then(
            function () {
                var qviewsUpdate = {$collection:"pl.qviews", $insert:[
                    {label:"Tasks", id:"tasks_view", collection:{$query:{collection:"tasks"}}, mainCollection:{$query:{collection:"tasks"}}}
                ]}
                return db.update(qviewsUpdate);
            }).then(
            function () {
                return db.getAdminDB();
            }).then(
            function (adb) {
                adminDB = adb;
            }).then(
            function () {
                notification.skipMail = true;
                notification.skipUpdateWhen = true;
                return Notifications.executeNotification(notification, [db.db.databaseName], adminDB);
            }).then(
            function (logId) {
                return adminDB.query({$collection:"pl.logs", $filter:{_id:logId}, $events:false, $modules:false});
            }).then(
            function (logInfo) {
                logInfo = logInfo.result;
                expect(logInfo).to.have.length(1);
                expect(logInfo[0].status).to.eql("Success");
                var innerLog = JSON.parse(logInfo[0].logs[0].log);
                expect(innerLog.db).to.eql(db.db.databaseName);
                expect(logInfo[0].logs[0].status).to.eql("Success");
                expect(innerLog.userCount).to.eql(3);
                expect(innerLog.errorUserCount).to.eql(0);
                expect(innerLog.mailSentUserCount).to.eql(0);
                expect(innerLog.mailSkipUserCount).to.eql(3);
                expect(innerLog.mailSentTo).to.have.length(0);
                expect(innerLog.mailSkipTo).to.have.length(3);
                expect(innerLog.mailSkipTo.indexOf("sachin")).to.not.eql(-1);
                expect(innerLog.mailSkipTo.indexOf("rohit")).to.not.eql(-1);
                expect(innerLog.mailSkipTo.indexOf("amit")).to.not.eql(-1);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Notification With On Status with data without filter and parameters", function (done) {
        var db = undefined;
        var adminDB = undefined;
        var notification = {
            id:"Testing",
            viewid:"tasks_view",
            subject:JSON.stringify({"template":"Testing Report"}),
            roles:["Basic User"],
//            filter:JSON.stringify({}),
//            parameters:JSON.stringify({}),
            when:{"repeats":"Daily", "repeatEvery":"1", "startsOn":"2014-09-05T05:30:00.000Z", "nextDueOn":"2014-10-02T05:30:00.000Z"},
            status:"On",
            serverName:Config.SERVER_NAME
//            dbs:[]
        };
        var infos = {mail:false, updateWhen:false};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Basic User"},
                    {role:"Admin", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.update({$collection:"pl.users", $insert:[
                    {username:"sachin", emailid:"sachin@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"rohit", emailid:"rohit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"amit", emailid:"amit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Admin"}}}
                    ]}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                    {field:"date", type:"date", collectionid:{$query:{collection:"tasks"}}}
                ]});
            }).then(
            function () {
                var qviewsUpdate = {$collection:"pl.qviews", $insert:[
                    {label:"Tasks", id:"tasks_view", collection:{$query:{collection:"tasks"}}, mainCollection:{$query:{collection:"tasks"}}}
                ]}
                return db.update(qviewsUpdate);
            }).then(
            function () {
                return db.update({$collection:"tasks", $insert:[
                    {task:"Task1"}
                ]});
            }).then(
            function () {
                return db.getAdminDB();
            }).then(
            function (adb) {
                adminDB = adb;
            }).then(
            function () {
                notification.skipMail = true;
                notification.skipUpdateWhen = true;
                return Notifications.executeNotification(notification, [db.db.databaseName], adminDB);
            }).then(
            function (logId) {
                return adminDB.query({$collection:"pl.logs", $filter:{_id:logId}, $events:false, $modules:false});
            }).then(
            function (logInfo) {
                logInfo = logInfo.result;
                expect(logInfo).to.have.length(1);
                expect(logInfo[0].status).to.eql("Success");
                var innerLog = JSON.parse(logInfo[0].logs[0].log);
                expect(innerLog.db).to.eql(db.db.databaseName);
                expect(logInfo[0].logs[0].status).to.eql("Success");
                expect(innerLog.userCount).to.eql(3);
                expect(innerLog.errorUserCount).to.eql(0);
                expect(innerLog.mailSentUserCount).to.eql(3);
                expect(innerLog.mailSkipUserCount).to.eql(0);
                expect(innerLog.mailSentTo).to.have.length(3);
                expect(innerLog.mailSkipTo).to.have.length(0);
                expect(innerLog.mailSentTo.indexOf("sachin")).to.not.eql(-1);
                expect(innerLog.mailSentTo.indexOf("rohit")).to.not.eql(-1);
                expect(innerLog.mailSentTo.indexOf("amit")).to.not.eql(-1);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Notification With On Status with data without filter and parameters override by user", function (done) {
        var db = undefined;
        var adminDB = undefined;
        var notification = {
            id:"Testing",
            viewid:"tasks_view",
            subject:JSON.stringify({"template":"Testing Report"}),
            roles:["Basic User"],
//            filter:JSON.stringify({}),
//            parameters:JSON.stringify({}),
            when:{"repeats":"Daily", "repeatEvery":"1", "startsOn":"2014-09-05T05:30:00.000Z", "nextDueOn":"2014-10-02T05:30:00.000Z"},
            status:"On",
            serverName:Config.SERVER_NAME
//            dbs:[]
        };
        var infos = {mail:false, updateWhen:false};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Basic User"},
                    {role:"Admin", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.update({$collection:"pl.users", $insert:[
                    {username:"sachin", emailid:"sachin@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"rohit", emailid:"rohit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"amit", emailid:"amit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Admin"}}}
                    ]}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks"},
                    {collection:"pl.userNotifications"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                    {field:"date", type:"date", collectionid:{$query:{collection:"tasks"}}},
                    {field:"userid", type:"fk", collectionid:{$query:{collection:"tasks"}}, set:["username"], collection:"pl.users"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.userNotifications", $insert:[
                    {notificationid:"Testing", status:"Off", userid:{$query:{username:"sachin"}}} ,
                    {notificationid:"Testing", status:"On", userid:{$query:{username:"rohit"}}}
                ]});
            }).then(
            function () {
                var qviewsUpdate = {$collection:"pl.qviews", $insert:[
                    {label:"Tasks", id:"tasks_view", collection:{$query:{collection:"tasks"}}, mainCollection:{$query:{collection:"tasks"}}}
                ]}
                return db.update(qviewsUpdate);
            }).then(
            function () {
                return db.update({$collection:"tasks", $insert:[
                    {task:"Task1"}
                ]});
            }).then(
            function () {
                return db.getAdminDB();
            }).then(
            function (adb) {
                adminDB = adb;
            }).then(
            function () {
                notification.skipMail = true;
                notification.skipUpdateWhen = true;
                return Notifications.executeNotification(notification, [db.db.databaseName], adminDB);
            }).then(
            function (logId) {
                return adminDB.query({$collection:"pl.logs", $filter:{_id:logId}, $events:false, $modules:false});
            }).then(
            function (logInfo) {
                logInfo = logInfo.result;
                expect(logInfo).to.have.length(1);
                expect(logInfo[0].status).to.eql("Success");
                var innerLog = JSON.parse(logInfo[0].logs[0].log);
                expect(innerLog.db).to.eql(db.db.databaseName);
                expect(logInfo[0].logs[0].status).to.eql("Success");
                expect(innerLog.userCount).to.eql(2);
                expect(innerLog.errorUserCount).to.eql(0);
                expect(innerLog.mailSentUserCount).to.eql(2);
                expect(innerLog.mailSkipUserCount).to.eql(0);
                expect(innerLog.mailSentTo).to.have.length(2);
                expect(innerLog.mailSkipTo).to.have.length(0);
                expect(innerLog.mailSentTo.indexOf("sachin")).to.eql(-1);
                expect(innerLog.mailSentTo.indexOf("rohit")).to.not.eql(-1);
                expect(innerLog.mailSentTo.indexOf("amit")).to.not.eql(-1);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Notification With Off Status with data without filter and parameters override by user", function (done) {
        var db = undefined;
        var adminDB = undefined;
        var notification = {
            id:"Testing",
            viewid:"tasks_view",
            subject:JSON.stringify({"template":"Testing Report"}),
            roles:["Basic User"],
//            filter:JSON.stringify({}),
//            parameters:JSON.stringify({}),
            when:{"repeats":"Daily", "repeatEvery":"1", "startsOn":"2014-09-05T05:30:00.000Z", "nextDueOn":"2014-10-02T05:30:00.000Z"},
            status:"Off",
            serverName:Config.SERVER_NAME
//            dbs:[]
        };
        var infos = {mail:false, updateWhen:false};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Basic User"},
                    {role:"Admin", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.update({$collection:"pl.users", $insert:[
                    {username:"sachin", emailid:"sachin@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"rohit", emailid:"rohit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"amit", emailid:"amit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Admin"}}}
                    ]}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks"},
                    {collection:"pl.userNotifications"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                    {field:"date", type:"date", collectionid:{$query:{collection:"tasks"}}},
                    {field:"userid", type:"fk", collectionid:{$query:{collection:"tasks"}}, set:["username"], collection:"pl.users"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.userNotifications", $insert:[
                    {notificationid:"Testing", status:"Off", userid:{$query:{username:"sachin"}}} ,
                    {notificationid:"Testing", status:"On", userid:{$query:{username:"rohit"}}}
                ]});
            }).then(
            function () {
                var qviewsUpdate = {$collection:"pl.qviews", $insert:[
                    {label:"Tasks", id:"tasks_view", collection:{$query:{collection:"tasks"}}, mainCollection:{$query:{collection:"tasks"}}}
                ]}
                return db.update(qviewsUpdate);
            }).then(
            function () {
                return db.update({$collection:"tasks", $insert:[
                    {task:"Task1"}
                ]});
            }).then(
            function () {
                return db.getAdminDB();
            }).then(
            function (adb) {
                adminDB = adb;
            }).then(
            function () {
                notification.skipMail = true;
                notification.skipUpdateWhen = true;
                return Notifications.executeNotification(notification, [db.db.databaseName], adminDB);
            }).then(
            function (logId) {
                return adminDB.query({$collection:"pl.logs", $filter:{_id:logId}, $events:false, $modules:false});
            }).then(
            function (logInfo) {
                logInfo = logInfo.result;
                expect(logInfo).to.have.length(1);
                expect(logInfo[0].status).to.eql("Success");
                var innerLog = JSON.parse(logInfo[0].logs[0].log);
                expect(innerLog.db).to.eql(db.db.databaseName);
                expect(logInfo[0].logs[0].status).to.eql("Success");
                expect(innerLog.userCount).to.eql(1);
                expect(innerLog.errorUserCount).to.eql(0);
                expect(innerLog.mailSentUserCount).to.eql(1);
                expect(innerLog.mailSkipUserCount).to.eql(0);
                expect(innerLog.mailSentTo).to.have.length(1);
                expect(innerLog.mailSkipTo).to.have.length(0);
                expect(innerLog.mailSentTo.indexOf("sachin")).to.eql(-1);
                expect(innerLog.mailSentTo.indexOf("rohit")).to.not.eql(-1);
                expect(innerLog.mailSentTo.indexOf("amit")).to.eql(-1);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Notification With Off Status and override status with data without filter and parameters override by user", function (done) {
        var db = undefined;
        var adminDB = undefined;
        var notification = {
            id:"Testing",
            viewid:"tasks_view",
            subject:JSON.stringify({"template":"Testing Report"}),
            roles:["Basic User"],
//            filter:JSON.stringify({}),
//            parameters:JSON.stringify({}),
            when:{"repeats":"Daily", "repeatEvery":"1", "startsOn":"2014-09-05T05:30:00.000Z", "nextDueOn":"2014-10-02T05:30:00.000Z"},
            status:"Off",
            dbs:[],
            serverName:Config.SERVER_NAME
        };
        var infos = {mail:false, updateWhen:false};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Basic User"},
                    {role:"Admin", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.update({$collection:"pl.users", $insert:[
                    {username:"sachin", emailid:"sachin@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"rohit", emailid:"rohit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"amit", emailid:"amit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Admin"}}}
                    ]}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks"},
                    {collection:"pl.userNotifications"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                    {field:"date", type:"date", collectionid:{$query:{collection:"tasks"}}},
                    {field:"userid", type:"fk", collectionid:{$query:{collection:"tasks"}}, set:["username"], collection:"pl.users"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.userNotifications", $insert:[
                    {notificationid:"Testing", status:"Off", userid:{$query:{username:"sachin"}}} ,
                    {notificationid:"Testing", status:"On", userid:{$query:{username:"rohit"}}} ,
                    {notificationid:"Testing", status:"Off", userid:{$query:{username:"amit"}}}
                ]});
            }).then(
            function () {
                var qviewsUpdate = {$collection:"pl.qviews", $insert:[
                    {label:"Tasks", id:"tasks_view", collection:{$query:{collection:"tasks"}}, mainCollection:{$query:{collection:"tasks"}}}
                ]}
                return db.update(qviewsUpdate);
            }).then(
            function () {
                return db.update({$collection:"tasks", $insert:[
                    {task:"Task1"}
                ]});
            }).then(
            function () {
                return db.getAdminDB();
            }).then(
            function (adb) {
                adminDB = adb;
            }).then(
            function () {
                notification.dbs.push({db:db.db.databaseName, status:"Off"});
                notification.skipMail = true;
                notification.skipUpdateWhen = true;
                return Notifications.executeNotification(notification, [db.db.databaseName], adminDB);
            }).then(
            function (logId) {
                return adminDB.query({$collection:"pl.logs", $filter:{_id:logId}, $events:false, $modules:false});
            }).then(
            function (logInfo) {
                logInfo = logInfo.result;
                expect(logInfo).to.have.length(1);
                expect(logInfo[0].status).to.eql("Success");
                var innerLog = JSON.parse(logInfo[0].logs[0].log);
                expect(innerLog.db).to.eql(db.db.databaseName);
                expect(logInfo[0].logs[0].status).to.eql("Success");
                expect(innerLog.userCount).to.eql(1);
                expect(innerLog.errorUserCount).to.eql(0);
                expect(innerLog.mailSentUserCount).to.eql(1);
                expect(innerLog.mailSkipUserCount).to.eql(0);
                expect(innerLog.mailSentTo).to.have.length(1);
                expect(innerLog.mailSkipTo).to.have.length(0);
                expect(innerLog.mailSentTo.indexOf("sachin")).to.eql(-1);
                expect(innerLog.mailSentTo.indexOf("rohit")).to.not.eql(-1);
                expect(innerLog.mailSentTo.indexOf("amit")).to.eql(-1);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Notification With On Status and override status without data with filter and override by user", function (done) {
        var db = undefined;
        var adminDB = undefined;
        var notification = {
            id:"Testing",
            viewid:"tasks_view",
            subject:JSON.stringify({"template":"Testing Report"}),
            roles:["Basic User"],
            filter:JSON.stringify({task:"Task2"}),
//            parameters:JSON.stringify({}),
            when:{"repeats":"Daily", "repeatEvery":"1", "startsOn":"2014-09-05T05:30:00.000Z", "nextDueOn":"2014-10-02T05:30:00.000Z"},
            status:"Off",
            dbs:[],
            serverName:Config.SERVER_NAME
        };
        var infos = {mail:false, updateWhen:false};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Basic User"},
                    {role:"Admin", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.update({$collection:"pl.users", $insert:[
                    {username:"sachin", emailid:"sachin@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"rohit", emailid:"rohit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"amit", emailid:"amit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Admin"}}}
                    ]}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks"},
                    {collection:"pl.userNotifications"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                    {field:"date", type:"date", collectionid:{$query:{collection:"tasks"}}},
                    {field:"userid", type:"fk", collectionid:{$query:{collection:"tasks"}}, set:["username"], collection:"pl.users"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.userNotifications", $insert:[
                    {notificationid:"Testing", status:"Off", userid:{$query:{username:"sachin"}}} ,
                    {notificationid:"Testing", status:"On", userid:{$query:{username:"rohit"}}} ,
                    {notificationid:"Testing", status:"Off", userid:{$query:{username:"amit"}}}
                ]});
            }).then(
            function () {
                var qviewsUpdate = {$collection:"pl.qviews", $insert:[
                    {label:"Tasks", id:"tasks_view", collection:{$query:{collection:"tasks"}}, mainCollection:{$query:{collection:"tasks"}}}
                ]}
                return db.update(qviewsUpdate);
            }).then(
            function () {
                return db.update({$collection:"tasks", $insert:[
                    {task:"Task1"}
                ]});
            }).then(
            function () {
                return db.getAdminDB();
            }).then(
            function (adb) {
                adminDB = adb;
            }).then(
            function () {
                notification.dbs.push({db:db.db.databaseName, status:"On"});
                notification.skipMail = true;
                notification.skipUpdateWhen = true;
                return Notifications.executeNotification(notification, [db.db.databaseName], adminDB);
            }).then(
            function (logId) {
                return adminDB.query({$collection:"pl.logs", $filter:{_id:logId}, $events:false, $modules:false});
            }).then(
            function (logInfo) {
                logInfo = logInfo.result;
                expect(logInfo).to.have.length(1);
                expect(logInfo[0].status).to.eql("Success");
                var innerLog = JSON.parse(logInfo[0].logs[0].log);
                expect(innerLog.db).to.eql(db.db.databaseName);
                expect(logInfo[0].logs[0].status).to.eql("Success");
                expect(innerLog.userCount).to.eql(1);
                expect(innerLog.errorUserCount).to.eql(0);
                expect(innerLog.mailSentUserCount).to.eql(0);
                expect(innerLog.mailSkipUserCount).to.eql(1);
                expect(innerLog.mailSentTo).to.have.length(0);
                expect(innerLog.mailSkipTo).to.have.length(1);
                expect(innerLog.mailSkipTo.indexOf("sachin")).to.eql(-1);
                expect(innerLog.mailSkipTo.indexOf("rohit")).to.not.eql(-1);
                expect(innerLog.mailSkipTo.indexOf("amit")).to.eql(-1);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Notification With On Status and override status with data with filter and override by user", function (done) {
        var db = undefined;
        var adminDB = undefined;
        var notification = {
            id:"Testing",
            viewid:"tasks_view",
            subject:JSON.stringify({"template":"Testing Report"}),
            roles:["Basic User"],
            filter:JSON.stringify({task:"Task2"}),
//            parameters:JSON.stringify({}),
            when:{"repeats":"Daily", "repeatEvery":"1", "startsOn":"2014-09-05T05:30:00.000Z", "nextDueOn":"2014-10-02T05:30:00.000Z"},
            status:"Off",
            dbs:[],
            serverName:Config.SERVER_NAME
        };
        var infos = {mail:false, updateWhen:false};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Basic User"},
                    {role:"Admin", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.update({$collection:"pl.users", $insert:[
                    {username:"sachin", emailid:"sachin@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"rohit", emailid:"rohit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"amit", emailid:"amit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Admin"}}}
                    ]}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks"},
                    {collection:"pl.userNotifications"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                    {field:"date", type:"date", collectionid:{$query:{collection:"tasks"}}},
                    {field:"userid", type:"fk", collectionid:{$query:{collection:"tasks"}}, set:["username"], collection:"pl.users"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.userNotifications", $insert:[
                    {notificationid:"Testing", status:"Off", userid:{$query:{username:"sachin"}}} ,
                    {notificationid:"Testing", status:"On", userid:{$query:{username:"rohit"}}} ,
                    {notificationid:"Testing", status:"Off", userid:{$query:{username:"amit"}}}
                ]});
            }).then(
            function () {
                var qviewsUpdate = {$collection:"pl.qviews", $insert:[
                    {label:"Tasks", id:"tasks_view", collection:{$query:{collection:"tasks"}}, mainCollection:{$query:{collection:"tasks"}}}
                ]}
                return db.update(qviewsUpdate);
            }).then(
            function () {
                return db.update({$collection:"tasks", $insert:[
                    {task:"Task1"},
                    {task:"Task2"}
                ]});
            }).then(
            function () {
                return db.getAdminDB();
            }).then(
            function (adb) {
                adminDB = adb;
            }).then(
            function () {
                notification.dbs.push({db:db.db.databaseName, status:"On"});
                notification.skipMail = true;
                notification.skipUpdateWhen = true;
                return Notifications.executeNotification(notification, [db.db.databaseName], adminDB);
            }).then(
            function (logId) {
                return adminDB.query({$collection:"pl.logs", $filter:{_id:logId}, $events:false, $modules:false});
            }).then(
            function (logInfo) {
                logInfo = logInfo.result;
                expect(logInfo).to.have.length(1);
                expect(logInfo[0].status).to.eql("Success");
                var innerLog = JSON.parse(logInfo[0].logs[0].log);
                expect(innerLog.db).to.eql(db.db.databaseName);
                expect(logInfo[0].logs[0].status).to.eql("Success");
                expect(innerLog.userCount).to.eql(1);
                expect(innerLog.errorUserCount).to.eql(0);
                expect(innerLog.mailSentUserCount).to.eql(1);
                expect(innerLog.mailSkipUserCount).to.eql(0);
                expect(innerLog.mailSentTo).to.have.length(1);
                expect(innerLog.mailSkipTo).to.have.length(0);
                expect(innerLog.mailSentTo.indexOf("sachin")).to.eql(-1);
                expect(innerLog.mailSentTo.indexOf("rohit")).to.not.eql(-1);
                expect(innerLog.mailSentTo.indexOf("amit")).to.eql(-1);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Notification With subject having template and parameters", function (done) {
        var db = undefined;
        var adminDB = undefined;
        var notification = {
            id:"Testing",
            viewid:"tasks_view",
            subject:JSON.stringify({"template":"Testing Report for <%=parameters.date%>", parameters:{date:{"$$CurrentDate":{span:-1, format:"DD/MM/YYYY"}}}}),
            roles:["Basic User"],
            filter:JSON.stringify({task:"$task"}),
            parameters:JSON.stringify({task:"Task2"}),
            when:{"repeats":"Daily", "repeatEvery":"1", "startsOn":"2014-09-05T05:30:00.000Z", "nextDueOn":"2014-10-02T05:30:00.000Z"},
//            status:"Off",
            dbs:[],
            serverName:Config.SERVER_NAME
        };
        var infos = {mail:true, updateWhen:false};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Basic User"},
                    {role:"Admin", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                return db.update({$collection:"pl.users", $insert:[
                    {username:"sachin", emailid:"sachin@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"rohit", emailid:"rohit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Basic User"}}}
                    ]},
                    {username:"amit", emailid:"amit@daffodilsw.com", roles:[
                        {role:{$query:{role:"Admin"}}}
                    ]}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks"},
                    {collection:"pl.userNotifications"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                    {field:"date", type:"date", collectionid:{$query:{collection:"tasks"}}},
                    {field:"userid", type:"fk", collectionid:{$query:{collection:"tasks"}}, set:["username"], collection:"pl.users"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.userNotifications", $insert:[
                    {notificationid:"Testing", status:"Off", userid:{$query:{username:"sachin"}}} ,
                    {notificationid:"Testing", status:"On", userid:{$query:{username:"rohit"}}} ,
                    {notificationid:"Testing", status:"Off", userid:{$query:{username:"amit"}}}
                ]});
            }).then(
            function () {
                var qviewsUpdate = {$collection:"pl.qviews", $insert:[
                    {label:"Tasks", id:"tasks_view", collection:{$query:{collection:"tasks"}}, mainCollection:{$query:{collection:"tasks"}}}
                ]}
                return db.update(qviewsUpdate);
            }).then(
            function () {
                return db.update({$collection:"tasks", $insert:[
                    {task:"Task1"},
                    {task:"Task2"}
                ]});
            }).then(
            function () {
                return db.getAdminDB();
            }).then(
            function (adb) {
                adminDB = adb;
            }).then(
            function () {
                notification.dbs.push({db:db.db.databaseName, status:"On"});
                notification.skipMail = false;
                notification.skipUpdateWhen = true;
                return Notifications.executeNotification(notification, [db.db.databaseName], adminDB);
            }).then(
            function (logId) {
                return adminDB.query({$collection:"pl.logs", $filter:{_id:logId}, $events:false, $modules:false});
            }).then(
            function (logInfo) {
                logInfo = logInfo.result;
                expect(logInfo).to.have.length(1);
                expect(logInfo[0].status).to.eql("Failed");
                var innerLog = JSON.parse(logInfo[0].logs[0].log);
                expect(innerLog.db).to.eql(db.db.databaseName);
                expect(logInfo[0].logs[0].status).to.eql("Failed");
                expect(innerLog.userCount).to.eql(1);
                expect(innerLog.errorUserCount).to.eql(1);
                expect(innerLog.mailSentUserCount).to.eql(0);
                expect(innerLog.mailSkipUserCount).to.eql(0);
                expect(innerLog.mailSentTo).to.have.length(0);
                expect(innerLog.mailSkipTo).to.have.length(0);
                var innerError = logInfo[0].logs[0].error;
                if (innerError) {
                    innerError = JSON.parse(innerError);
                }
                expect(innerError).to.have.length(1);
                expect(innerError[0].user).to.eql("rohit");
                expect(innerError[0].error).to.not.eql(undefined);
                console.log("Error>>>>>" + innerError[0].error);
//                expect(innerError[0].error.indexOf("Username and password must be provided to send mail")).to.not.eql(-1);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
});
