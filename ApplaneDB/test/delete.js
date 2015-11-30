/**
 * Created by sourabh on 27/3/15.
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var NorthwindDb = require("./NorthwindDb.js");
var OPTIONS = {};
var Testcases = require("./TestCases.js");



// mocha --recursive --timeout 150000 -g "delete and multidelete and multi update" --reporter spec
describe("delete and multidelete and multi update", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done)
    })


    it("single delete by db update", function (done) {
        var db = undefined;

        var employeeSchema = {collection: "employees", fields: [
            {field: "ename", type: "string"},
            {field: "ecode", type: "string"},
            {field: "econtact", type: "object", multiple: true, fields: [
                {field: "contactno", type: "number"}
            ]}
        ]};

        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                var update = [
                    {$collection: employeeSchema, $insert: [
                        {"_id": 1, "ename": "sourabh", ecode: "e01",
                            econtact: [
                                {contactno: 9034663490},
                                {contactno: 9876543210}
                            ]},
                        {"_id": 2, "ename": "shubham", ecode: "e02",
                            econtact: [
                                {contactno: 8778855845}
                            ]},

                        {"_id": 3, "ename": "sourabh", ecode: "e03",
                            econtact: [
                                {contactno: 7845784565},
                                {contactno: 5522552255}
                            ]},

                        {"_id": 4, "ename": "rahul", ecode: "e04",
                            econtact: [
                                {contactno: 90346143141}
                            ]},

                        {"_id": 5, "ename": "manjeet", ecode: "e05",
                            econtact: [
                                {contactno: 9896100000},
                                {contactno: 9876545655}
                            ]},
                        {"_id": 6, "ename": "sourabh", ecode: "e06",
                            econtact: [
                                {contactno: 9034663445},
                                {contactno: 9874455454}
                            ]},
                        {"_id": 7, "ename": "naveen", ecode: "e07",
                            econtact: [
                                {contactno: 8778855840},
                                {contactno: 8774831570}
                            ]},

                        {"_id": 8, "ename": "ashu", ecode: "e08",
                            econtact: [
                                {contactno: 7845482755},
                                {contactno: 5522000040}
                            ]},

                        {"_id": 9, "ename": "sachin", ecode: "e09",
                            econtact: [
                                {contactno: 9036666350}
                            ]},

                        {"_id": 10, "ename": "manjeet", ecode: "e10",
                            econtact: [
                                {contactno: 9896100555},
                                {contactno: 9876546666}
                            ]}
                    ]}
                ]

                return db.update(update);
            }).then(function () {
                return db.query({$collection: employeeSchema});
            }).then(function (data) {
//                console.log("data>>>>>" + JSON.stringify(data.result));

                expect(data.result).to.have.length(10);
                expect(data.result[0].ename).to.eql("sourabh");
                expect(data.result[0].ecode).to.eql("e01");
                expect(data.result[0].econtact[1].contactno).to.eql(9876543210);
                expect(data.result[1].ename).to.eql("shubham");
                expect(data.result[1].econtact[0].contactno).to.eql(8778855845);
                expect(data.result[2].econtact[1].contactno).to.eql(5522552255);
                expect(data.result[3].econtact).to.have.length(1);

                return db.query({$collection: employeeSchema});
            }).then(function (data)
            {
//                console.log(">>>>>"+data.result[0].econtact[1]._id+">>>>>>>");
                var deletedata = [
                    {$collection:employeeSchema,$update:[
                        {_id:data.result[0]._id,$set:{econtact:{
                            $delete:[{_id:data.result[0].econtact[1]._id}]}}},

                        {_id:data.result[7]._id,$set:{econtact:{
                            $delete:[{_id:data.result[7].econtact[0]._id}]}}},

                        {_id:data.result[9]._id, $set:{econtact:{
                            $delete:[{_id:data.result[9].econtact[0]._id},{_id:data.result[9].econtact[1]._id}]
                        }}}
                    ],$delete:[{_id:data.result[6]._id},{_id:data.result[8]._id},{_id:data.result[3]._id}]}


                ]

                return db.update(deletedata);
            }).then(function () {
                return db.query({$collection: employeeSchema});
            }).then(function (data) {
//                console.log("data>>>>>" + JSON.stringify(data.result));

                expect(data.result).to.have.length(7);
                expect(data.result[0].econtact[1]).to.be.undefined;
                expect(data.result[5].econtact[0].contactno).to.be.eql(5522000040);    //second becomes first after delete
                expect(data.result[6].econtact).to.be.empty;

            }).then(function () {
                done();
            }).fail(function (err) {
                done(err);
            })

    })

    it("multi delete by mongodb update", function (done) {
        var db = undefined;

        var employeeSchema = {collection: "employees", fields: [
            {field: "ename", type: "string"},
            {field: "ecode", type: "string"},
            {field: "econtact", type: "object", multiple: true, fields: [
                {field: "contactno", type: "number"}
            ]}
        ]};

        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                var update = [
                    {$collection: employeeSchema, $insert: [
                        {"_id": 1, "ename": "sourabh", ecode: "e01",
                            econtact: [
                                {contactno: 9034663490},
                                {contactno: 9876543210}
                            ]},
                        {"_id": 2, "ename": "shubham", ecode: "e02",
                            econtact: [
                                {contactno: 8778855845}
                            ]},

                        {"_id": 3, "ename": "sourabh", ecode: "e03",
                            econtact: [
                                {contactno: 7845784565},
                                {contactno: 5522552255}
                            ]},

                        {"_id": 4, "ename": "naveen", ecode: "e04",
                            econtact: [
                                {contactno: 9876543210}
                            ]},

                        {"_id": 5, "ename": "manjeet", ecode: "e05",
                            econtact: [
                                {contactno: 9896100000},
                                {contactno: 9876545655}
                            ]},
                        {"_id": 6, "ename": "sourabh", ecode: "e06",
                            econtact: [
                                {contactno: 9034663445},
                                {contactno: 9874455454}
                            ]},
                        {"_id": 7, "ename": "naveen", ecode: "e07",
                            econtact: [
                                {contactno: 9876543210},
                                {contactno: 8774831570}
                            ]},

                        {"_id": 8, "ename": "ashu", ecode: "e08",
                            econtact: [
                                {contactno: 7845482755},
                                {contactno: 5522000040}
                            ]},

                        {"_id": 9, "ename": "naveen", ecode: "e09",
                            econtact: [
                                {contactno: 9036666350},
                                {contactno: 9876543210}
                            ]},

                        {"_id": 10, "ename": "manjeet", ecode: "e10",
                            econtact: [
                                {contactno: 9896100555},
                                {contactno: 9876546666}
                            ]}
                    ]}
                ]

                return db.update(update);
            }).then(function () {
                return db.query({$collection: employeeSchema});
            }).then(function (data) {
//                console.log("data>>>>>" + JSON.stringify(data.result));

                expect(data.result).to.have.length(10);
                expect(data.result[0].ename).to.eql("sourabh");
                expect(data.result[0].ecode).to.eql("e01");
                expect(data.result[0].econtact[1].contactno).to.eql(9876543210);
                expect(data.result[1].ename).to.eql("shubham");
                expect(data.result[1].econtact[0].contactno).to.eql(8778855845);
                expect(data.result[2].econtact[1].contactno).to.eql(5522552255);
                expect(data.result[3].econtact).to.have.length(1);

                return db.query({$collection: employeeSchema});
            }).then(function (data)
            {
//                console.log(">>>>>"+data.result[0].econtact[1]._id+">>>>>>>");
                var deletedata = [
                    {$collection:employeeSchema,
                        "$delete": [
                            {"ename":"sourabh"},
                            {"ename":"manjeet"}
                        ],$update:[
                        {$query:{ename:"naveen"},$pull:{econtact :{contactno :9876543210}}}
                    ]}

                ]

                return db.mongoUpdate(deletedata,{multi:true});
            }).then(function () {
                return db.query({$collection: employeeSchema});
            }).then(function (data) {
//                console.log("data>>>>>" + JSON.stringify(data.result));

                expect(data.result).to.have.length(5);
                expect(data.result[0].ecode).to.eql("e02");
                expect(data.result[1].econtact).to.be.empty;
                expect(data.result[2].econtact).to.have.length(1);
                expect(data.result[3].ecode).to.eql("e08");
                expect(data.result[4].econtact).to.have.length(1);

            }).then(function () {
                done();
            }).fail(function (err) {
                done(err);
            })

    })

    it("multi update by mongodb update", function (done) {
        var db = undefined;

        var employeeSchema = {collection: "employees", fields: [
            {field: "ename", type: "string"},
            {field: "ecode", type: "string"},
            {field: "econtact", type: "object", multiple: true, fields: [
                {field: "contactno", type: "number"}
            ]}
        ]};

        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                var update = [
                    {$collection: employeeSchema, $insert: [
                        {"_id": 1, "ename": "sourabh", ecode: "e01",
                            econtact: [
                                {contactno: 9034663490},
                                {contactno: 9876543210}
                            ]},
                        {"_id": 2, "ename": "shubham", ecode: "e02",
                            econtact: [
                                {contactno: 8778855845}
                            ]},

                        {"_id": 3, "ename": "sourabh", ecode: "e03",
                            econtact: [
                                {contactno: 7845784565},
                                {contactno: 5522552255}
                            ]},

                        {"_id": 4, "ename": "naveen", ecode: "e04",
                            econtact: [
                                {contactno: 9876543210}
                            ]},

                        {"_id": 5, "ename": "manjeet", ecode: "e05",
                            econtact: [
                                {contactno: 9896100000},
                                {contactno: 9876545655}
                            ]},
                        {"_id": 6, "ename": "sourabh", ecode: "e06",
                            econtact: [
                                {contactno: 9034663445},
                                {contactno: 9874455454}
                            ]},
                        {"_id": 7, "ename": "naveen", ecode: "e07",
                            econtact: [
                                {contactno: 9876543210},
                                {contactno: 8774831570}
                            ]},

                        {"_id": 8, "ename": "ashu", ecode: "e08",
                            econtact: [
                                {contactno: 7845482755},
                                {contactno: 5522000040}
                            ]},

                        {"_id": 9, "ename": "naveen", ecode: "e09",
                            econtact: [
                                {contactno: 9036666350},
                            ]},

                        {"_id": 10, "ename": "manjeet", ecode: "e10",
                            econtact: [
                                {contactno: 9896100555}
                            ]}
                    ]}
                ]

                return db.update(update);
            }).then(function () {
                return db.query({$collection: employeeSchema});
            }).then(function (data) {
//                console.log("data>>>>>" + JSON.stringify(data.result));

                expect(data.result).to.have.length(10);
                expect(data.result[0].ename).to.eql("sourabh");
                expect(data.result[0].ecode).to.eql("e01");
                expect(data.result[0].econtact[1].contactno).to.eql(9876543210);
                expect(data.result[1].ename).to.eql("shubham");
                expect(data.result[1].econtact[0].contactno).to.eql(8778855845);
                expect(data.result[2].econtact[1].contactno).to.eql(5522552255);
                expect(data.result[3].econtact).to.have.length(1);

                return db.query({$collection: employeeSchema});
            }).then(function (data)
            {
//                console.log(">>>>>"+data.result[0].econtact[1]._id+">>>>>>>");
                var deletedata = [
                    {$collection:employeeSchema,
                        "$update": [
                            {$query: {ename:"sourabh"},$set:{ename:"sg"}},

                            {$query: {ename:"shubham"},$set:{ecode:"e11"}},

                            {$query: {ename:"naveen"},$unset:{ecode:1}, $set:{ename:"naveen UI",
                                'econtact.0.contactno':9998887777}},

                            {$query:{ename:"manjeet"},$push:{econtact:{_id:'9896141013',contactno:9896141013}}},

                            {$query:{ename:"ashu"},$pull:{econtact:{'contactno':5522000040}}}
                        ]}
                ]

                return db.mongoUpdate(deletedata,{multi:true});
            }).then(function () {
                return db.query({$collection: employeeSchema});
            }).then(function (data) {
//                console.log("data>>>>>" + JSON.stringify(data.result));

                expect(data.result).to.have.length(10);
                expect(data.result[0].ename).to.eql('sg');
                expect(data.result[2].ename).to.eql('sg');
                expect(data.result[5].ename).to.eql('sg');
                expect(data.result[1].ecode).to.eql('e11');
                expect(data.result[3].ename).to.eql('naveen UI');
                expect(data.result[3].ecode).to.be.undefined;
                expect(data.result[3].econtact[0].contactno).to.eql(9998887777);
                expect(data.result[6].ename).to.eql('naveen UI');
                expect(data.result[6].ecode).to.be.undefined;
                expect(data.result[6].econtact[0].contactno).to.eql(9998887777);
                expect(data.result[8].ename).to.eql('naveen UI');
                expect(data.result[8].ecode).to.be.undefined;
                expect(data.result[8].econtact[0].contactno).to.eql(9998887777);
                expect(data.result[4].econtact[2].contactno).to.eql(9896141013);
                expect(data.result[9].econtact).to.have.length(2);
                expect(data.result[9].econtact).to.include.key('1');
                expect(data.result[7].econtact).to.have.length(1);

            }).then(function () {
                done();
            }).fail(function (err) {
                done(err);
            })

    })
})
