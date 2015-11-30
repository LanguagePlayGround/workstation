/**
 *
 * mocha --recursive --timeout 150000 -g "DB testcase" --reporter spec
 *
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 3/12/14
 * Time: 6:50 PM
 * To change this template use File | Settings | File Templates.
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");
var util = require("ApplaneCore/apputil/util.js");

describe("DB testcase", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("connect from mobile number in number", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, {"username": 1234567890, "password": "123456", ensureUser: true}).then(
            function (db1) {
                db = db1;
                var user = db.user;
                expect(user._id).to.not.eql(undefined);
                expect(user.username).to.eql("1234567890");
                expect(user.password).to.eql(undefined);
                expect(user.fullname).to.eql("1234567890");
                return db.query({$collection: "pl.users", $filter: {"username": "1234567890"}, $modules: {Role: 0}});
            }).then(
            function (result) {
                expect(result.result[0]._id).to.not.eql(undefined);
                expect(result.result[0].username).to.eql("1234567890");
                expect(result.result[0].enc_password).to.eql(util.getEncriptedPassword("123456"));
                expect(result.result[0].fullname).to.eql("1234567890");
                expect(result.result[0].mobile_no).to.eql("1234567890");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("connect from mobile number in string", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, {"username": 1234567890, "password": "123456", ensureUser: true}).then(
            function (db1) {
                db = db1;
                var user = db.user;
                expect(user._id).to.not.eql(undefined);
                expect(user.username).to.eql("1234567890");
                expect(user.password).to.eql(undefined);
                expect(user.fullname).to.eql("1234567890");
                return db.query({$collection: "pl.users", $filter: {"username": "1234567890"}, $modules: {Role: 0}});
            }).then(
            function (result) {
                expect(result.result[0]._id).to.not.eql(undefined);
                expect(result.result[0].username).to.eql("1234567890");
                expect(result.result[0].enc_password).to.eql(util.getEncriptedPassword("123456"));
                expect(result.result[0].fullname).to.eql("1234567890");
                expect(result.result[0].mobile_no).to.eql("1234567890");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("connect from mobile number with fields", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, {"username": 1234567890, "password": "123456", fields: {"mobile_no": 1}, ensureUser: true}).then(
            function (db1) {
                db = db1;
                var user = db.user;
                expect(user._id).to.not.eql(undefined);
                expect(user.username).to.eql("1234567890");
                expect(user.password).to.eql(undefined);
                expect(user.fullname).to.eql("1234567890");
                expect(user.mobile_no).to.eql("1234567890");
                return db.query({$collection: "pl.users", $filter: {"username": "1234567890"}, $modules: {Role: 0}});
            }).then(
            function (result) {
                expect(result.result[0]._id).to.not.eql(undefined);
                expect(result.result[0].username).to.eql("1234567890");
                expect(result.result[0].enc_password).to.eql(util.getEncriptedPassword("123456"));
                expect(result.result[0].fullname).to.eql("1234567890");
                expect(result.result[0].mobile_no).to.eql("1234567890");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("connect from mobile number with upsert fields", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, {"username": "d1", "password": "123456", ensureUser: true, fields: {"mobile_no": 1, reg_no: 1}, upsertFields: {reg_no: "1234", driver_no: "11"}}).then(
            function (db1) {
                db = db1;
                var user = db.user;
                expect(user._id).to.not.eql(undefined);
                expect(user.username).to.eql("d1");
                expect(user.password).to.eql(undefined);
                expect(user.fullname).to.eql("d1");
                expect(user.mobile_no).to.eql(undefined);
                expect(user.reg_no).to.eql("1234");
                expect(user.driver_no).to.eql(undefined);
                return db.query({$collection: "pl.users", $filter: {"username": "d1"}, $modules: {Role: 0}});
            }).then(
            function (result) {
                expect(result.result[0]._id).to.not.eql(undefined);
                expect(result.result[0].username).to.eql("d1");
                expect(result.result[0].enc_password).to.eql(util.getEncriptedPassword("123456"));
                expect(result.result[0].fullname).to.eql("d1");
                expect(result.result[0].mobile_no).to.eql(undefined);
                expect(result.result[0].reg_no).to.eql("1234");
                expect(result.result[0].driver_no).to.eql("11");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("call query and function through service--did for sixc", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection: "pl.collections", $insert: [
                    {collection: "tasks"}
                ]});
            }).then(function () {
                return db.update({$collection: "pl.fields", $insert: [
                    {field: "task", type: "string", collectionid: {$query: {collection: "tasks"}}},
                    {field: "assignTo", type: "string", collectionid: {$query: {collection: "tasks"}}}

                ]});
            }).then(function () {
                return db.update({$collection: "tasks", $insert: [
                    {task: "Task1", assignTo: "Sachin"},
                    {task: "Task3", assignTo: "Sachin"},
                    {task: "Task9", assignTo: "Sachin"},
                    {task: "Task2", assignTo: "Ritesh"},
                    {task: "Task4", assignTo: "Naveen"},
                    {task: "Task5", assignTo: "Rajit"},
                    {task: "Task6", assignTo: "Rajit"},
                    {task: "Task7", assignTo: "Naveen"},
                    {task: "Task8", assignTo: "Ritesh"},
                    {task: "Task10", assignTo: "Naveen"}
                ]});
            }).then(function () {
                return db.update({$collection: "pl.services", $insert: [
                    {id: "first", type: "query", query: JSON.stringify({$collection: "tasks"})},
                    {id: "second", type: "function", function: {name: "checkService", source: "NorthwindTestCase/lib/ServiceTest", type: "js"}}
                ]});
            }).then(
            function () {
                return db.executeService({"0": "first", filter: {assignTo: "Sachin"}});
            }).then(function (data) {
                data = data.result;
                expect(data).to.have.length(3);
                expect(data[0].task).to.eql("Task1");
                expect(data[1].task).to.eql("Task3");
                expect(data[2].task).to.eql("Task9");
            }).then(function () {
                return db.executeService({"0": "first", $filter: {assignTo: "Sachin"}, skip: 1})
            }).then(function (data) {
                data = data.result;
                expect(data).to.have.length(2);
                expect(data[0].task).to.eql("Task3");
                expect(data[1].task).to.eql("Task9");
            }).then(function () {
                return db.executeService({"0": "first", filter: {assignTo: "Sachin"}, $skip: 1, limit: 1, $sort: {task: 1}});
            }).then(function (data) {
                data = data.result;
                expect(data).to.have.length(1);
                expect(data[0].task).to.eql("Task3");
            }).then(function () {
                return db.executeService({"0": "second"});
            }).then(function (data) {
                data = data.result;
                expect(data).to.have.length(3);
                expect(data[0].task).to.eql("Task1");
                expect(data[1].task).to.eql("Task3");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("call update and batchquery through service--did for sixc", function (done) {
        var db = undefined;
        var id = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection: "pl.collections", $insert: [
                    {collection: "tasks"},
                    {collection: "employee"},
                    {collection: "departments"}
                ]});
            }).then(function () {
                return db.update({$collection: "pl.fields", $insert: [
                    {field: "task", type: "string", collectionid: {$query: {collection: "tasks"}}},
                    {field: "department", type: "string", collectionid: {$query: {collection: "departments"}}},
                    {field: "name", type: "string", collectionid: {$query: {collection: "employee"}}},
                    {field: "assignTo", type: "string", collectionid: {$query: {collection: "tasks"}}}

                ]});
            }).then(function () {
                return db.update({$collection: "tasks", $insert: [
                    {task: "Task1", assignTo: "Sachin"},
                    {task: "Task3", assignTo: "Sachin"},
                    {task: "Task2", assignTo: "Sachin Bansal"}
                ]});
            }).then(function () {
                var updates = {$collection: "employee", $insert: {name: "Ritesh"}};
                var batchQuery = {employee: {$collection: "employee"}, task: {$collection: "tasks"}};
                return db.update({$collection: "pl.services", $insert: [
                    {id: "update", type: "update", update: JSON.stringify(updates)},
                    {id: "batch", type: "batchquery", batchquery: JSON.stringify(batchQuery)}
                ]});
            }).then(
            function () {
                return db.executeService({"0": "update"});
            }).then(function (data) {
                expect(data.employee.$insert).to.have.length(1);
                id = data.employee.$insert[0]._id;
            }).then(function () {
                return db.executeService({"0": "update", $update: {_id: id, $set: {name: "Ritesh bansal"}}});
            }).then(function (data) {
                expect(data.employee.$insert).to.have.length(1);
                expect(data.employee.$update).to.eql([1]);
            }).then(function () {
                return db.executeService({"0": "update", $delete: {_id: id}});
            }).then(function (data) {
                expect(data.employee.$delete).to.eql([1]);
            }).then(function () {
                return db.executeService({"0": "batch", $filter: {name: "Ritesh"}});
            }).then(function (data) {
                //filter applied in both queries of batchquery
                expect(data.employee.result).to.have.length(2);
                expect(data.task.result).to.have.length(0);
            }).then(function () {
                //limit applied to employee query , sort and skip applied to task query
                return db.executeService({"0": "batch", employee: {$limit: 1}, task: {$sort: {task: 1}, $skip: 1}});
            }).then(function (data) {
                expect(data.employee.result).to.have.length(1);
                expect(data.task.result).to.have.length(2);
                expect(data.task.result[0].task).to.eql("Task2");
                expect(data.task.result[1].task).to.eql("Task3");
            }).then(function () {
                return db.update({$collection: "departments", $insert: {department: "D1"}})
            }).then(function () {
                // if service does not exist then query is executed by taking serviceid as collection
                return db.executeService({"0": "departments"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].department).to.eql("D1");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

})
