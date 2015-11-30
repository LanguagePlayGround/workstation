/**
 *
 * mocha --recursive --timeout 150000 -g "Porting testcase" --reporter spec
 *
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 1/12/14
 * Time: 12:31 PM
 * To change this template use File | Settings | File Templates.
 */

var expect = require('chai').expect;
var Testcases = require("./TestCases.js");
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;

describe("Porting testcase", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("iterator", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"testing", $insert:[
                    {name:"A", status:"New"},
                    {name:"B", status:"In Progress"},
                    {name:"C", status:"Completed"},
                    {name:"F", status:"New"},
                    {name:"D", status:"New"},
                    {name:"E", status:"New"}
                ]})
            }).then(
            function () {
                var functionsToRegister = [
                    {name:"NorthwindPorting", source:"NorthwindTestCase/lib", "type":"js"}
                ];
                return ApplaneDB.registerFunction(functionsToRegister);
            }).then(
            function () {
                return db.invokeFunction("Porting.iterator", [
                    {query:{$collection:"testing", $filter:{status:"New"}, $limit:1}, function:"NorthwindPorting.iterator"}
                ], {async:true});
            }).then(
            function () {
                return db.query({$collection:"testing", $sort:{name:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(6);
                expect(result.result[0].name).to.eql("A");
                expect(result.result[0].status).to.eql("Completed");
                expect(result.result[1].name).to.eql("B");
                expect(result.result[1].status).to.eql("In Progress");
                expect(result.result[2].name).to.eql("C");
                expect(result.result[2].status).to.eql("Completed");
                expect(result.result[3].name).to.eql("D");
                expect(result.result[3].status).to.eql("Completed");
                expect(result.result[4].name).to.eql("E");
                expect(result.result[4].status).to.eql("Completed");
                expect(result.result[5].name).to.eql("F");
                expect(result.result[5].status).to.eql("Completed");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("iterator with skip", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"testing", $insert:[
                    {_id:"A", name:"A", status:"New"},
                    {_id:"B", name:"B", status:"In Progress"},
                    {_id:"C", name:"C", status:"Completed"},
                    {_id:"F", name:"F", status:"New"},
                    {_id:"D", name:"D", status:"New"},
                    {_id:"E", name:"E", status:"New"}
                ]})
            }).then(
            function () {
                var functionsToRegister = [
                    {name:"NorthwindPorting", source:"NorthwindTestCase/lib", "type":"js"}
                ];
                return ApplaneDB.registerFunction(functionsToRegister);
            }).then(
            function () {
                return db.invokeFunction("Porting.iterator", [
                    {query:{$collection:"testing", $filter:{status:"New"}, $limit:2, $skip:1}, function:"NorthwindPorting.iterator"}
                ], {async:true});
            }).then(
            function () {
                return db.query({$collection:"testing", $sort:{name:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(6);
                expect(result.result[0].name).to.eql("A");
                expect(result.result[0].status).to.eql("New");
                expect(result.result[1].name).to.eql("B");
                expect(result.result[1].status).to.eql("In Progress");
                expect(result.result[2].name).to.eql("C");
                expect(result.result[2].status).to.eql("Completed");
                expect(result.result[3].name).to.eql("D");
                expect(result.result[3].status).to.eql("Completed");
                expect(result.result[4].name).to.eql("E");
                expect(result.result[4].status).to.eql("Completed");
                expect(result.result[5].name).to.eql("F");
                expect(result.result[5].status).to.eql("Completed");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("field change from single to multiple in fk and object for type remove", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                return db.update([
                    {$collection:"pl.collections", $insert:[
                        {collection:"priorities"},
                        {collection:"tasks"}
                    ]} ,
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"priorities"}}},
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}},
                        {field:"priorityid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"priorities", set:["name"]},
                        {field:"comments", type:"object", collectionid:{$query:{collection:"tasks"}}},
                        {field:"comment", type:"string", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{collectionid:{$query:{collection:"tasks"}}, field:"comments"}}}
                    ]}
                ])
            }).then(
            function () {
                return db.update({$collection:"priorities", $insert:[
                    {_id:1, name:"high"},
                    {_id:2, name:"low"},
                    {_id:3, name:"medium"}
                ]})
            }).then(
            function () {
                return db.update({$collection:"tasks", $insert:[
                    {task:"task1"},
                    {task:"task2", priorityid:{_id:1, name:"high"}, comments:{comment:"comment1"}},
                    {task:"task3", priorityid:{_id:1, name:"high"}},
                    {task:"task4", priorityid:{_id:1, name:"high"}, comments:{comment:"comment1"}},
                    {task:"task5", priorityid:{_id:1, name:"high"}},
                    {task:"task6", priorityid:null, comments:{comment:"comment1"}},
                    {task:"task7", comments:{comment:"comment1"}},
                    {task:"task8", comments:null}
                ]})
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"tasks", field:"priorityid"}, $fields:{_id:1}});
            }).then(
            function (result) {
                return db.update({$collection:"pl.fields", $update:{_id:result.result[0]._id, $set:{multiple:true}}});
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"tasks", field:"comments"}, $fields:{_id:1}});
            }).then(
            function (result) {
                return db.update({$collection:"pl.fields", $update:{_id:result.result[0]._id, $set:{multiple:true}}});
            }).then(
            function () {
                return db.update({$collection:"tasks", $insert:[
                    {task:"task9", priorityid:[
                        {_id:1, name:"high"}
                    ], comments:[
                        {comment:"comment1"}
                    ]},
                    {task:"task10", priorityid:[
                        {_id:1, name:"high"}
                    ]},
                    {task:"task11", comments:[
                        {comment:"comment1"}
                    ]},
                    {task:"task12"}
                ]})
            }).then(
            function () {
                return db.invokeFunction("NewPorting.portFieldDataForMultipleChange", [
                    {db:db.db.databaseName, collection:"tasks", field:"comments", type:"Remove"}
                ])
            }).then(
            function () {
                return db.invokeFunction("NewPorting.portFieldDataForMultipleChange", [
                    {db:db.db.databaseName, collection:"tasks", field:"priorityid", type:"Remove"}
                ])
            }).then(function(){
                return require("q").delay(5000);
            }).then(
            function () {
                return db.query({$collection:"tasks", $filter:{"$or":[
                    {comments:{$exists:true}},
                    {priorityid:{$exists:true}}
                ]},$sort:{task:1}})
            }).then(
            function (tasks) {
                expect(tasks.result).to.have.length(3);
                expect(tasks.result[0].task).to.eql("task10");
                expect(tasks.result[1].task).to.eql("task11");
                expect(tasks.result[2].task).to.eql("task9");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("field change from single to multiple in fk and object for type update", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                return db.update([
                    {$collection:"pl.collections", $insert:[
                        {collection:"priorities"},
                        {collection:"tasks"}
                    ]} ,
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"priorities"}}},
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}},
                        {field:"priorityid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"priorities", set:["name"]},
                        {field:"comments", type:"object", collectionid:{$query:{collection:"tasks"}}},
                        {field:"comment", type:"string", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{collectionid:{$query:{collection:"tasks"}}, field:"comments"}}}
                    ]}
                ])
            }).then(
            function () {
                return db.update({$collection:"priorities", $insert:[
                    {_id:1, name:"high"},
                    {_id:2, name:"low"},
                    {_id:3, name:"medium"}
                ]})
            }).then(
            function () {
                return db.update({$collection:"tasks", $insert:[
                    {task:"task1"},
                    {task:"task2", priorityid:{_id:1, name:"high"}, comments:{comment:"comment1"}},
                    {task:"task3", priorityid:{_id:1, name:"high"}},
                    {task:"task4", priorityid:{_id:1, name:"high"}, comments:{comment:"comment1"}},
                    {task:"task5", priorityid:{_id:1, name:"high"}},
                    {task:"task6", priorityid:null, comments:{comment:"comment1"}},
                    {task:"task7", comments:{comment:"comment1"}},
                    {task:"task8", comments:null}
                ]})
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"tasks", field:"priorityid"}, $fields:{_id:1}});
            }).then(
            function (result) {
                return db.update({$collection:"pl.fields", $update:{_id:result.result[0]._id, $set:{multiple:true}}});
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"tasks", field:"comments"}, $fields:{_id:1}});
            }).then(
            function (result) {
                return db.update({$collection:"pl.fields", $update:{_id:result.result[0]._id, $set:{multiple:true}}});
            }).then(
            function () {
                return db.update({$collection:"tasks", $insert:[
                    {task:"task9", priorityid:[
                        {_id:1, name:"high"}
                    ], comments:[
                        {comment:"comment1"}
                    ]},
                    {task:"task10", priorityid:[
                        {_id:1, name:"high"}
                    ]},
                    {task:"task11", comments:[
                        {comment:"comment1"}
                    ]},
                    {task:"task12"}
                ]})
            }).then(
            function () {
                return db.invokeFunction("NewPorting.portFieldDataForMultipleChange", [
                    {db:db.db.databaseName, collection:"tasks", field:"comments", type:"Update"}
                ])
            }).then(
            function () {
                return db.invokeFunction("NewPorting.portFieldDataForMultipleChange", [
                    {db:db.db.databaseName, collection:"tasks", field:"priorityid", type:"Update"}
                ])
            }).then(function(){
                return require("q").delay(5000);
            }).then(
            function () {
                return db.query({$collection:"tasks", $filter:{"$or":[
                    {comments:{$exists:true}},
                    {priorityid:{$exists:true}}
                ]},$sort:{task:1}})
            }).then(
            function (tasks) {
                expect(tasks.result).to.have.length(9);
                expect(tasks.result[0].task).to.eql("task10");
                expect(tasks.result[0].priorityid).to.have.length(1);
                expect(tasks.result[0].comments).to.eql(undefined);
                expect(tasks.result[1].task).to.eql("task11");
                expect(tasks.result[1].comments).to.have.length(1);
                expect(tasks.result[1].priorityid).to.eql(undefined);
                expect(tasks.result[2].task).to.eql("task2");
                expect(tasks.result[2].comments).to.have.length(1);
                expect(tasks.result[2].priorityid).to.have.length(1);
                expect(tasks.result[3].task).to.eql("task3");
                expect(tasks.result[3].priorityid).to.have.length(1);
                expect(tasks.result[3].comments).to.eql(undefined);
                expect(tasks.result[4].task).to.eql("task4");
                expect(tasks.result[4].comments).to.have.length(1);
                expect(tasks.result[4].priorityid).to.have.length(1);
                expect(tasks.result[5].task).to.eql("task5");
                expect(tasks.result[5].priorityid).to.have.length(1);
                expect(tasks.result[5].comments).to.eql(undefined);
                expect(tasks.result[6].task).to.eql("task6");
                expect(tasks.result[6].comments).to.have.length(1);
                expect(tasks.result[6].priorityid).to.eql(undefined);
                expect(tasks.result[7].task).to.eql("task7");
                expect(tasks.result[7].comments).to.have.length(1);
                expect(tasks.result[7].priorityid).to.eql(undefined);
                expect(tasks.result[8].task).to.eql("task9");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("field change from multiple to single in fk and object for update type", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                return db.update([
                    {$collection:"pl.collections", $insert:[
                        {collection:"priorities"},
                        {collection:"tasks"}
                    ]} ,
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"priorities"}}},
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}},
                        {field:"priorityid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"priorities", set:["name"],multiple:true},
                        {field:"comments", type:"object", collectionid:{$query:{collection:"tasks"}},multiple:true},
                        {field:"comment", type:"string", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{collectionid:{$query:{collection:"tasks"}}, field:"comments"}}}
                    ]}
                ])
            }).then(
            function () {
                return db.update({$collection:"priorities", $insert:[
                    {_id:1, name:"high"},
                    {_id:2, name:"low"},
                    {_id:3, name:"medium"}
                ]})
            }).then(
            function () {
                return db.update({$collection:"tasks", $insert:[
                    {task:"task9", priorityid:[
                        {_id:1, name:"high"}
                    ], comments:[
                        {comment:"comment1"}
                    ]},
                    {task:"task10", priorityid:[
                        {_id:1, name:"high"}
                    ]},
                    {task:"task11", comments:[
                        {comment:"comment1"}
                    ]},
                    {task:"task12"}
                ]})
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"tasks", field:"priorityid"}, $fields:{_id:1}});
            }).then(
            function (result) {
                return db.update({$collection:"pl.fields", $update:{_id:result.result[0]._id, $set:{multiple:false}}});
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"tasks", field:"comments"}, $fields:{_id:1}});
            }).then(
            function (result) {
                return db.update({$collection:"pl.fields", $update:{_id:result.result[0]._id, $set:{multiple:false}}});
            }).then(
            function () {
                return db.update({$collection:"tasks", $insert:[
                    {task:"task1"},
                    {task:"task2", priorityid:{_id:1, name:"high"}, comments:{comment:"comment1"}},
                    {task:"task3", priorityid:{_id:1, name:"high"}},
                    {task:"task4", priorityid:{_id:1, name:"high"}, comments:{comment:"comment1"}},
                    {task:"task5", priorityid:{_id:1, name:"high"}},
                    {task:"task6", priorityid:null, comments:{comment:"comment1"}},
                    {task:"task7", comments:{comment:"comment1"}},
                    {task:"task8", comments:null}
                ]})
            }).then(
            function () {
                return db.invokeFunction("NewPorting.portFieldDataForMultipleChange", [
                    {db:db.db.databaseName, collection:"tasks", field:"comments", type:"Update"}
                ])
            }).then(
            function () {
                return db.invokeFunction("NewPorting.portFieldDataForMultipleChange", [
                    {db:db.db.databaseName, collection:"tasks", field:"priorityid", type:"Update"}
                ])
            }).then(function(){
                return require("q").delay(5000);
            }).then(
            function () {
                return db.query({$collection:"tasks", $filter:{"$or":[
                    {comments:{$exists:true}},
                    {priorityid:{$exists:true}}
                ]},$sort:{task:1}})
            }).then(
            function (tasks) {
                expect(tasks.result).to.have.length(10);
                expect(tasks.result[0].task).to.eql("task10");
                expect(tasks.result[0].priorityid).eql({_id:1, name:"high"});
                expect(tasks.result[0].comments).to.eql(undefined);
                expect(tasks.result[1].task).to.eql("task11");
                expect(tasks.result[1].comments).to.eql({comment:"comment1"});
                expect(tasks.result[1].priorityid).to.eql(undefined);
                expect(tasks.result[2].task).to.eql("task2");
                expect(tasks.result[2].comments).to.eql({comment:"comment1"});
                expect(tasks.result[2].priorityid).eql({_id:1, name:"high"});
                expect(tasks.result[3].task).to.eql("task3");
                expect(tasks.result[3].priorityid).eql({_id:1, name:"high"});
                expect(tasks.result[3].comments).to.eql(undefined);
                expect(tasks.result[4].task).to.eql("task4");
                expect(tasks.result[4].comments).to.eql({comment:"comment1"});
                expect(tasks.result[4].priorityid).eql({_id:1, name:"high"});
                expect(tasks.result[5].task).to.eql("task5");
                expect(tasks.result[5].priorityid).eql({_id:1, name:"high"});
                expect(tasks.result[5].comments).to.eql(undefined);
                expect(tasks.result[6].task).to.eql("task6");
                expect(tasks.result[6].comments).to.eql({comment:"comment1"});
                expect(tasks.result[6].priorityid).to.eql(null);
                expect(tasks.result[7].task).to.eql("task7");
                expect(tasks.result[7].comments).to.eql({comment:"comment1"});
                expect(tasks.result[7].priorityid).to.eql(undefined);
                expect(tasks.result[8].task).to.eql("task8");
                expect(tasks.result[8].comments).to.eql(null);
                expect(tasks.result[8].priorityid).eql(undefined);
                expect(tasks.result[9].task).to.eql("task9");
                expect(tasks.result[9].comments).to.eql({comment:"comment1"});
                expect(tasks.result[9].priorityid).eql({_id:1, name:"high"});
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
})
