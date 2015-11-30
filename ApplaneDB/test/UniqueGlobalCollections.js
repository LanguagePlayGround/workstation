/**
 *
 * mocha --recursive --timeout 150000 -g "admin_local query testcase" --reporter spec
 * mocha --recursive --timeout 150000 -g "admin_local saving testcase" --reporter spec
 * mocha --recursive --timeout 150000 -g "Fields with hasNext" --reporter spec
 *
 * Fields with hasNext
 *
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Constants = require("../lib/Constants.js");
var Testcases = require("./TestCases.js");

describe("admin_local query testcase", function () {

    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    afterEach(function (done) {
        Testcases.afterEach(done);
    })

    it("collections post event", function (done) {
        var db = undefined;
        var admindb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"students", collection:"students", db:"studentdb"} ,
                            {_id:"employees", collection:"employees", db:"employeedb"}
                        ]
                    }
                ]
                return db.update(insert);
            })
            .then(function () {
                return db.getGlobalDB();
            })
            .then(function (adminDB) {
                admindb = adminDB;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"teachers", collection:"teachers", db:"teachersdb"}
                        ]
                    }
                ];
                return adminDB.update(insert);
            })
            .then(function () {
                var query = {
                    $collection:Constants.Admin.COLLECTIONS,
                    $filter:{collection:{$in:["teachers", "students", "employees"]}}
                }
                return db.query(query);
            })
            .then(function (data) {
                expect(data.result).to.have.length(3);
            })
            .then(function () {
                var query = {
                    $collection:Constants.Admin.COLLECTIONS,
                    $filter:{collection:{$in:["teachers", "students", "employees"]}}
                }
                return admindb.query(query);
            })
            .then(function (data) {
                expect(data.result).to.have.length(1);
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    })

    it("functions post event", function (done) {
        var db = undefined;
        var admindb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                var insert = [
                    {
                        $collection:Constants.Admin.FUNCTIONS,
                        $insert:[
                            {_id:"bunny", name:"bunny"},
                            {_id:"sunny", name:"sunny"}
                        ]
                    }
                ]
                return db.update(insert);
            })
            .then(function () {
                return db.getGlobalDB();
            })
            .then(function (adminDB) {
                admindb = adminDB;
                var insert = [
                    {
                        $collection:Constants.Admin.FUNCTIONS,
                        $insert:[
                            {_id:"bunny", name:"bunny"},
                            {_id:"honey", name:"honey"}
                        ]
                    }
                ];
                return adminDB.update(insert);
            })
            .then(function () {
                return db.query({$collection:"pl.functions", $sort:{label:1}});
            })
            .then(function (data) {
                expect(data.result).to.have.length(3);
            })
            .then(function () {
                return admindb.query({$collection:"pl.functions", $sort:{label:1}});
            })
            .then(function (data) {
                expect(data.result).to.have.length(2);
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    })

    it("applications post event", function (done) {
        var db = undefined;
        var admindb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                var insert = [
                    {
                        $collection:Constants.Admin.FUNCTIONS,
                        $insert:[
                            {_id:"bunny", name:"bunny"},
                            {_id:"sunny", name:"sunny"}
                        ]
                    }
                ]
                return db.update(insert);
            })
            .then(function () {
                return db.getGlobalDB();
            })
            .then(function (adminDB) {
                admindb = adminDB;
                var insert = [
                    {
                        $collection:Constants.Admin.FUNCTIONS,
                        $insert:[
                            {_id:"bunny", name:"bunny"},
                            {_id:"honey", name:"honey"}
                        ]
                    }
                ];
                return adminDB.update(insert);
            })
            .then(function () {
                return db.query({$collection:"pl.functions", $sort:{label:1}});
            })
            .then(function (data) {
                expect(data.result).to.have.length(3);
            })
            .then(function () {
                return admindb.query({$collection:"pl.functions", $sort:{label:1}});
            })
            .then(function (data) {
                expect(data.result).to.have.length(2);
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    })

    it("roles post event", function (done) {
        var db = undefined;
        var admindb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                var insert = [
                    {
                        $collection:Constants.Admin.ROLES,
                        $insert:[
                            {_id:"developer", role:"Developer"},
                            {_id:"admin", role:"Admin"}
                        ]
                    }
                ]
                return db.update(insert);
            })
            .then(function () {
                return db.getGlobalDB();
            })
            .then(function (adminDB) {
                admindb = adminDB;
                var insert = [
                    {
                        $collection:Constants.Admin.ROLES,
                        $insert:[
                            {_id:"developer", role:"Developer"},
                            {_id:"Administrator", role:"Administrator"}
                        ]
                    }
                ];
                return adminDB.update(insert);
            })
            .then(function () {
                return db.query({$collection:Constants.Admin.ROLES, $sort:{role:1}});
            })
            .then(function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].role).to.eql("Admin");
                expect(data.result[1].role).to.eql("Administrator");
                expect(data.result[2].role).to.eql("Developer");

            })
            .then(function () {
                return admindb.query({$collection:Constants.Admin.ROLES, $sort:{role:1}});
            })
            .then(function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].role).to.eql("Administrator");
                expect(data.result[1].role).to.eql("Developer");
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    })

    it("menus pre event", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                var insert = [
                    {
                        $collection:Constants.Admin.APPLICATIONS,
                        $insert:[
                            {_id:"edu", label:"edu"},
                            {_id:"org", label:"org"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.MENUS,
                        $insert:[
                            {_id:"students", application:{_id:"edu", label:"edu"}, label:"studentdb"} ,
                            {_id:"employees", application:{_id:"org", label:"org"}, label:"employeedb"}
                        ]
                    }
                ]
                return db.update(insert);
            })
            .then(function () {
                var query = {
                    $collection:Constants.Admin.MENUS,
                    $filter:{label:"studentdb"}
                }
                return db.query(query);
            })
            .then(function () {
                done("Not OK");
            })
            .fail(function (err) {
                var invalidFilterError = err.toString().indexOf("Atleast one of them ") != -1;
                if (invalidFilterError) {
                    done();
                }
                else {
                    done(err);
                }
            })
    })

    it("menus post event", function (done) {
        var db = undefined;
        var admindb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                return db.getGlobalDB();
            })
            .then(
            function (adminDB) {
                admindb = adminDB;
                var insert = [
                    {
                        $collection:Constants.Admin.APPLICATIONS,
                        $insert:[
                            {_id:"crm", label:"CRM"},
                            {_id:"hr", label:"HR"}

                        ]
                    },
                    {
                        $collection:Constants.Admin.MENUS,
                        $insert:[
                            {_id:"relationship", application:{_id:"crm"}, label:"relationship", type:"invoke"} ,
                            {_id:"campaign", application:{_id:"crm"}, label:"campaign", type:"invoke"} ,
                            {_id:"attendance", application:{_id:"hr"}, label:"attendance", type:"invoke"},
                            {_id:"salary", application:{_id:"hr"}, label:"salary", type:"invoke"}
                        ]
                    }
                ]
                return admindb.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.menus", $filter:{"application._id":"crm"}, $sort:{label:1}})
            }).then(function (menus) {
                expect(menus.result).to.have.length(2);
                expect(menus.result[0].label).to.eql("campaign");
                expect(menus.result[1].label).to.eql("relationship");
            })
            .then(function () {
                var insert = [
                    {
                        $collection:Constants.Admin.APPLICATIONS,
                        $insert:[
                            {_id:"crm", label:"CRM"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.MENUS,
                        $insert:[
                            {_id:"relationship", application:{_id:"crm"}, label:"Pipeline"} ,
                            {_id:"campaign", application:{_id:"crm"}, label:"Campaign"}
                        ]
                    }
                ];
                return db.mongoUpdate(insert);
            })
            .then(
            function () {
                return db.query({$collection:"pl.menus", $filter:{"application._id":"crm"}, $sort:{label:1}})
            }).then(
            function (menus) {
                expect(menus.result).to.have.length(2);
                expect(menus.result[0].label).to.eql("Campaign");
                expect(menus.result[1].label).to.eql("Pipeline");
            }).then(
            function () {
                return db.query({$collection:"pl.menus", $filter:{"application._id":"crm", label:"relationship"}, $sort:{label:1}})
            }).then(function (menus) {
                expect(menus.result).to.have.length(0);
            })
            .then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Fields with hasNext", function (done) {
        var db = undefined;
        var admindb = undefined;
        var collectionId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                return db.getGlobalDB();
            })
            .then(
            function (adminDB) {
                admindb = adminDB;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {collection:"testing"}
                        ]
                    } ,
                    {
                        $collection:Constants.Admin.FIELDS,
                        $insert:[
                            {field:"A",type:"string", collectionid:{$query:{collection:"testing"}}},
                            {field:"B",type:"string", collectionid:{$query:{collection:"testing"}}},
                            {field:"C",type:"string", collectionid:{$query:{collection:"testing"}}},
                            {field:"D",type:"string", collectionid:{$query:{collection:"testing"}}}
                        ]
                    }
                ]
                return admindb.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.collections", $limit:1, $filter:{"collection":"testing"}})
            }).then(
            function (collections) {
                collectionId = collections.result[0]._id;
                return db.query({$collection:"pl.fields", $limit:2, $filter:{"collectionid":collectionId}});
            }).then(
            function (fields) {
                expect(fields.result).to.have.length(2);
                expect(fields.dataInfo.hasNext).to.equal(true);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $limit:2, $skip:2, $filter:{"collectionid":collectionId}})
            }).then(
            function (fields) {
                expect(fields.result).to.have.length(2);
                expect(fields.dataInfo.hasNext).to.equal(false);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("fields pre event", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"},
                            {_id:"hr", collection:"HR"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FIELDS,
                        $insert:[
                            {_id:"relationship",type:"string", collectionid:{_id:"crm"}, field:"relationship"} ,
                            {_id:"campaign",type:"string", collectionid:{_id:"crm"}, field:"campaign"} ,
                            {_id:"attendance",type:"string", collectionid:{_id:"hr"}, field:"attendance"},
                            {_id:"salary",type:"string", collectionid:{_id:"hr"}, field:"salary"}
                        ]
                    }
                ]
                return db.update(insert);
            })
            .then(function () {
                var query = {
                    $collection:Constants.Admin.FIELDS,
                    $filter:{field:"salary"}
                }
                return db.query(query);
            })
            .then(function () {
                done("Not OK");
            })
            .fail(function (err) {
                var invalidFilterError = err.toString().indexOf("Atleast one of them ") != -1;
                if (invalidFilterError) {
                    done();
                }
                else {
                    done(err);
                }
            })
    })

    it("fields pre event collectionid.collection filter allowed", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"},
                            {_id:"hr", collection:"HR"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FIELDS,
                        $insert:[
                            {_id:"relationship",type:"string", collectionid:{_id:"crm"}, field:"relationship"} ,
                            {_id:"campaign",type:"string", collectionid:{_id:"crm"}, field:"campaign"} ,
                            {_id:"attendance",type:"string", collectionid:{_id:"hr"}, field:"attendance"},
                            {_id:"salary",type:"string", collectionid:{_id:"hr"}, field:"salary"}
                        ]
                    }
                ]
                return db.update(insert);
            })
            .then(function () {
                var query = {
                    $collection:Constants.Admin.FIELDS,
                    $filter:{"collectionid.collection":"crm"}
                }
                return db.query(query);
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    })

    it("fields post event", function (done) {
        var db = undefined;
        var admindb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                return db.getGlobalDB();
            })
            .then(function (adminDB) {
                admindb = adminDB;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"},
                            {_id:"hr", collection:"HR"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FIELDS,
                        $insert:[
                            {_id:"relationship",type:"string", collectionid:{_id:"crm"}, field:"relationship"} ,
                            {_id:"campaign",type:"string", collectionid:{_id:"crm"}, field:"campaign"} ,
                            {_id:"attendance",type:"string", collectionid:{_id:"hr"}, field:"attendance"},
                            {_id:"salary",type:"string", collectionid:{_id:"hr"}, field:"salary"}
                        ]
                    }
                ]
                return admindb.update(insert);
            })
            .then(function () {
                return db.query({$collection:Constants.Admin.FIELDS, $filter:{"collectionid._id":"crm"}, $sort:{field:1}})
            })
            .then(function (fields) {
                expect(fields.result).to.have.length(2);
                expect(fields.result[0].field).to.eql("campaign");
                expect(fields.result[1].field).to.eql("relationship");
            })
            .then(function () {
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FIELDS,
                        $insert:[
                            {_id:"relationship", collectionid:{_id:"crm"}, field:"Pipeline"} ,
                            {_id:"campaign", collectionid:{_id:"crm"}, field:"Campaign"}
                        ]
                    }
                ];
                return db.mongoUpdate(insert);
            })
            .then(
            function () {
                return db.query({$collection:Constants.Admin.FIELDS, $filter:{"collectionid._id":"crm"}, $sort:{field:1}})
            }).then(
            function (fields) {
                expect(fields.result).to.have.length(2);
                expect(fields.result[0].field).to.eql("Campaign");
                expect(fields.result[1].field).to.eql("Pipeline");
            }).then(
            function () {
                return db.query({$collection:Constants.Admin.FIELDS, $filter:{"collectionid._id":"crm", label:"relationship"}, $sort:{field:1}})
            }).then(function (fields) {
                expect(fields.result).to.have.length(0);
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    })

    it("formgroups pre event", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"},
                            {_id:"hr", collection:"HR"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FORM_GROUPS,
                        $insert:[
                            {_id:"relationship", collectionid:{_id:"crm"}, title:"relationship"} ,
                            {_id:"campaign", collectionid:{_id:"crm"}, title:"campaign"} ,
                            {_id:"attendance", collectionid:{_id:"hr"}, title:"attendance"},
                            {_id:"salary", collectionid:{_id:"hr"}, title:"salary"}
                        ]
                    }
                ]
                return db.update(insert);
            })
            .then(function () {
                var query = {
                    $collection:Constants.Admin.FORM_GROUPS,
                    $filter:{title:"salary"}
                }
                return db.query(query);
            })
            .then(function () {
                done("Not OK");
            })
            .fail(function (err) {
                var invalidFilterError = err.toString().indexOf("Atleast one of them ") != -1;
                if (invalidFilterError) {
                    done();
                }
                else {
                    done(err);
                }
            })
    })

    it("formgroups post event", function (done) {
        var db = undefined;
        var admindb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                return db.getGlobalDB();
            })
            .then(function (adminDB) {
                admindb = adminDB;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"},
                            {_id:"hr", collection:"HR"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FORM_GROUPS,
                        $insert:[
                            {_id:"relationship", collectionid:{_id:"crm"}, title:"relationship"} ,
                            {_id:"campaign", collectionid:{_id:"crm"}, title:"campaign"} ,
                            {_id:"attendance", collectionid:{_id:"hr"}, title:"attendance"},
                            {_id:"salary", collectionid:{_id:"hr"}, title:"salary"}
                        ]
                    }
                ]
                return admindb.update(insert);
            })
            .then(function () {
                return db.query({$collection:Constants.Admin.FORM_GROUPS, $filter:{"collectionid._id":"crm"}, $sort:{title:1}})
            })
            .then(function (fields) {
                expect(fields.result).to.have.length(2);
                expect(fields.result[0].title).to.eql("campaign");
                expect(fields.result[1].title).to.eql("relationship");
            })
            .then(function () {
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FORM_GROUPS,
                        $insert:[
                            {_id:"relationship", collectionid:{_id:"crm"}, title:"Pipeline"} ,
                            {_id:"campaign", collectionid:{_id:"crm"}, title:"Campaign"}
                        ]
                    }
                ];
                return db.mongoUpdate(insert);
            })
            .then(
            function () {
                return db.query({$collection:Constants.Admin.FORM_GROUPS, $filter:{"collectionid._id":"crm"}, $sort:{title:1}})
            }).then(
            function (fields) {
                expect(fields.result).to.have.length(2);
                expect(fields.result[0].title).to.eql("Campaign");
                expect(fields.result[1].title).to.eql("Pipeline");
            }).then(
            function () {
                return db.query({$collection:Constants.Admin.FORM_GROUPS, $filter:{"collectionid._id":"crm", label:"relationship"}, $sort:{title:1}})
            }).then(function (fields) {
                expect(fields.result).to.have.length(0);
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    })

    it("actions pre event", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"},
                            {_id:"hr", collection:"HR"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.ACTIONS,
                        $insert:[
                            {label:"relationship", id:"relationship", _id:"relationship", collectionid:{_id:"crm"}, type:"invoke"} ,
                            {label:"campaign", id:"campaign", _id:"campaign", collectionid:{_id:"crm"}, type:"invoke"} ,
                            {label:"attendance", id:"attendance", _id:"attendance", collectionid:{_id:"hr"}, type:"invoke"},
                            {label:"salary", _id:"salary", id:"salary", collectionid:{_id:"hr"}, type:"invoke"}
                        ]
                    }
                ]
                return db.update(insert);
            })
            .then(function () {
                var query = {
                    $collection:Constants.Admin.ACTIONS,
                    $filter:{label:"salary"}
                }
                return db.query(query);
            })
            .then(function () {
                done("Not OK");
            })
            .fail(function (err) {
                var invalidFilterError = err.toString().indexOf("Atleast one of them ") != -1;
                if (invalidFilterError) {
                    done();
                }
                else {
                    done(err);
                }
            })
    })

    it("actions post event", function (done) {
        var db = undefined;
        var admindb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                return db.getGlobalDB();
            })
            .then(function (adminDB) {
                admindb = adminDB;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"},
                            {_id:"hr", collection:"HR"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.ACTIONS,
                        $insert:[
                            {id:"relationship", _id:"relationship", collectionid:{_id:"crm"}, label:"relationship", type:"invoke"} ,
                            {id:"campaign", _id:"campaign", collectionid:{_id:"crm"}, label:"campaign", type:"invoke"} ,
                            {id:"attendance", _id:"attendance", collectionid:{_id:"hr"}, label:"attendance", type:"invoke"},
                            {id:"salary", _id:"salary", collectionid:{_id:"hr"}, label:"salary", type:"invoke"}
                        ]
                    }
                ]
                return admindb.update(insert);
            })
            .then(function () {
                return db.query({$collection:Constants.Admin.ACTIONS, $filter:{"collectionid._id":"crm"}, $sort:{label:1}})
            })
            .then(function (fields) {
                expect(fields.result).to.have.length(2);
                expect(fields.result[0].label).to.eql("campaign");
                expect(fields.result[1].label).to.eql("relationship");
            })
            .then(function () {
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.ACTIONS,
                        $insert:[
                            { _id:"relationship", collectionid:{_id:"crm"}, label:"Pipeline", type:"invoke", id:"pipeline"} ,
                            {_id:"campaign", collectionid:{_id:"crm"}, label:"Campaign", type:"invoke", id:"campaign"}
                        ]
                    }
                ];
                return db.mongoUpdate(insert);
            })
            .then(
            function () {
                return db.query({$collection:Constants.Admin.ACTIONS, $filter:{"collectionid._id":"crm"}, $sort:{label:1}})
            }).then(
            function (fields) {
                expect(fields.result).to.have.length(2);
                expect(fields.result[0].label).to.eql("Campaign");
                expect(fields.result[1].label).to.eql("Pipeline");
            }).then(
            function () {
                return db.query({$collection:Constants.Admin.ACTIONS, $filter:{"collectionid._id":"crm", label:"relationship"}, $sort:{label:1}})
            }).then(function (fields) {
                expect(fields.result).to.have.length(0);
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    })

    it("qviews pre event", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"},
                            {_id:"hr", collection:"HR"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.QVIEWS,
                        $insert:[
                            {label:"relationship", _id:"relationship", id:"relationship", collection:{_id:"crm"}, mainCollection:{_id:"crm"}, field:"relationship"} ,
                            {label:"campaign", _id:"campaign", id:"campaign", collection:{_id:"crm"}, mainCollection:{_id:"crm"}, field:"campaign"} ,
                            {label:"attendance", _id:"attendance", id:"attendance", collection:{_id:"hr"}, mainCollection:{_id:"hr"}, field:"attendance"},
                            {label:"salary", _id:"salary", id:"salary", collection:{_id:"hr"}, mainCollection:{_id:"hr"}, field:"salary"}
                        ]
                    }
                ]
                return db.update(insert);
            })
            .then(function () {
                var query = {
                    $collection:Constants.Admin.QVIEWS,
                    $filter:{field:"salary"}
                }
                return db.query(query);
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    })

    it("qviews post event", function (done) {
        var db = undefined;
        var admindb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                return db.getGlobalDB();
            })
            .then(function (adminDB) {
                admindb = adminDB;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"},
                            {_id:"hr", collection:"HR"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.QVIEWS,
                        $insert:[
                            {_id:"relationships", id:"relationships", collection:{_id:"crm"}, mainCollection:{_id:"crm"}, label:"relationship"} ,
                            {_id:"campaign", id:"campaign", collection:{_id:"crm"}, mainCollection:{_id:"crm"}, label:"campaign"} ,
                            {_id:"attendance", id:"attendance", collection:{_id:"hr"}, mainCollection:{_id:"hr"}, label:"attendance"},
                            {_id:"salary", id:"salary", collection:{_id:"hr"}, mainCollection:{_id:"hr"}, label:"salary"}
                        ]
                    }
                ]
                return admindb.update(insert);
            })
            .then(function (res) {
                return db.query({$collection:Constants.Admin.QVIEWS, $filter:{"collection._id":"crm"}, $sort:{label:1}})
            })
            .then(function (fields) {
                expect(fields.result).to.have.length(2);
                expect(fields.result[0].label).to.eql("campaign");
                expect(fields.result[1].label).to.eql("relationship");
            })
            .then(function () {
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.QVIEWS,
                        $insert:[
                            { _id:"relationships", id:"relationship", collection:{_id:"crm"}, mainCollection:{_id:"crm"}, label:"Pipeline"} ,
                            {_id:"campaign", id:"campaign", collection:{_id:"crm"}, mainCollection:{_id:"crm"}, label:"Campaign"}
                        ]
                    }
                ];
                return db.mongoUpdate(insert);
            })
            .then(
            function () {
                return db.query({$collection:Constants.Admin.QVIEWS, $filter:{"collection._id":"crm"}, $sort:{label:1}})
            }).then(
            function (fields) {
                expect(fields.result).to.have.length(2);
                expect(fields.result[0].label).to.eql("Campaign");
                expect(fields.result[1].label).to.eql("Pipeline");
            }).then(
            function () {
                return db.query({$collection:Constants.Admin.QVIEWS, $filter:{"collection._id":"crm", label:"relationships"}, $sort:{label:1}})
            }).then(function (fields) {
                expect(fields.result).to.have.length(0);
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    })

    it("indexes pre event", function (done) {
        var db = undefined;
        var admindb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"},
                            {_id:"hr", collection:"HR"}
                        ]
                    },
                    {
                        $collection:Constants.Index.INDEXES,
                        $insert:[
                            { _id:"relationship", collectionid:{_id:"crm"}, name:"relationship", indexes:JSON.stringify({name:1})} ,
                            { _id:"campaign", collectionid:{_id:"crm"}, name:"campaign", indexes:JSON.stringify({name:1})} ,
                            { _id:"attendance", collectionid:{_id:"hr"}, name:"attendance", indexes:JSON.stringify({name:1})},
                            {_id:"salary", collectionid:{_id:"hr"}, name:"salary", indexes:JSON.stringify({name:1})}
                        ]
                    }
                ]
                return db.update(insert);
            })
            .then(function (data) {
                var query = {
                    $collection:Constants.Index.INDEXES,
                    $filter:{name:"salary"}
                }
                return db.query(query);
            })
            .then(function (data) {
            })
            .then(function () {
                done("Not OK");
            })
            .fail(function (err) {
                var invalidFilterError = err.toString().indexOf("Atleast one of them ") != -1;
                if (invalidFilterError) {
                    done();
                }
                else {
                    done(err);
                }
            })
    })

    it("indexes post event", function (done) {
        var db = undefined;
        var admindb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                return db.getGlobalDB();
            })
            .then(function (adminDB) {
                admindb = adminDB;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"},
                            {_id:"hr", collection:"HR"}
                        ]
                    },
                    {
                        $collection:Constants.Index.INDEXES,
                        $insert:[
                            {_id:"relationship", collectionid:{_id:"crm"}, name:"relationship", indexes:JSON.stringify({name:1})} ,
                            {_id:"campaign", collectionid:{_id:"crm"}, name:"campaign", indexes:JSON.stringify({name:1})} ,
                            {_id:"attendance", collectionid:{_id:"hr"}, name:"attendance", indexes:JSON.stringify({name:1})},
                            {_id:"salary", collectionid:{_id:"hr"}, name:"salary", indexes:JSON.stringify({name:1})}
                        ]
                    }
                ]
                return admindb.update(insert);
            })
            .then(function () {
                return db.query({$collection:Constants.Index.INDEXES, $filter:{"collectionid._id":"crm"}, $sort:{name:1}})
            })
            .then(function (fields) {
                expect(fields.result).to.have.length(2);
                expect(fields.result[0].name).to.eql("campaign");
                expect(fields.result[1].name).to.eql("relationship");
            })
            .then(function () {
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"crm", collection:"CRM"}
                        ]
                    },
                    {
                        $collection:Constants.Index.INDEXES,
                        $insert:[
                            { _id:"relationship", collectionid:{_id:"crm"}, name:"Pipeline", indexes:JSON.stringify({name:1})} ,
                            {_id:"campaign", collectionid:{_id:"crm"}, name:"Campaign", indexes:JSON.stringify({name:1})}
                        ]
                    }
                ];
                return db.mongoUpdate(insert);
            })
            .then(
            function () {
                return db.query({$collection:Constants.Index.INDEXES, $filter:{"collectionid._id":"crm"}, $sort:{name:1}})
            }).then(
            function (fields) {
                expect(fields.result).to.have.length(2);
                expect(fields.result[0].name).to.eql("Campaign");
                expect(fields.result[1].name).to.eql("Pipeline");
            }).then(
            function () {
                return db.query({$collection:Constants.Index.INDEXES, $filter:{"collectionid._id":"crm", label:"relationship"}, $sort:{name:1}})
            }).then(function (fields) {
                expect(fields.result).to.have.length(0);
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    })

})

describe("admin_local saving testcase", function () {

    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    afterEach(function (done) {
        Testcases.afterEach(done);
    })

    it("menus saving", function (done) {
        var db = undefined;
        var adminDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                return db.getGlobalDB();
            })
            .then(
            function (adm) {
                adminDb = adm;
                var insert = [
                    {
                        $collection:Constants.Admin.APPLICATIONS,
                        $insert:[
                            {_id:"hrm", label:"HRM", db:"hrmdb"} ,
                            {_id:"bdm", label:"BDM", db:"bdmdb"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.MENUS,
                        $insert:[
                            {_id:"employee", application:{_id:"hrm"}, label:"Employees"},
                            {_id:"management1", application:{_id:"hrm"}, label:"Management"},
                            {_id:"management", application:{_id:"bdm"}, label:"Management"}
                        ]
                    }
                ]
                return adminDb.update(insert);
            }).then(
            function () {
                return adminDb.invokeFunction("Commit.commitProcess", [
                    {data:{commit:true}}
                ]);
            })
            .then(function () {
                var update = {
                    $collection:Constants.Admin.MENUS, $update:[
                        {_id:"employee", $set:{label:"Staff"}}
                    ]
                }
                return db.update(update);
            })
            .then(function () {
                return db.query({$collection:Constants.Admin.APPLICATIONS, $sort:{label:1}});
            })
            .then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].label).to.eql("BDM");
                expect(data.result[1].label).to.eql("HRM");
                return db.query({$collection:Constants.Admin.MENUS, $filter:{"application._id":"hrm"}, $sort:{label:1}});
            }).then(function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].label).to.eql("Management");
                expect(data.result[1].label).to.eql("Staff");
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    });

    it("menus saving with parent", function (done) {
        var db = undefined;
        var adminDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                return db.getGlobalDB();
            })
            .then(function (adm) {
                adminDb = adm;
                var insert = [
                    {
                        $collection:Constants.Admin.APPLICATIONS,
                        $insert:[
                            {_id:"hrm", label:"HRM", db:"hrmdb"} ,
                            {_id:"bdm", label:"BDM", db:"bdmdb"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.MENUS,
                        $insert:[
                            {_id:"employee", application:{_id:"bdm"}, label:"Employees"},
                            {_id:"management", application:{_id:"bdm"}, label:"Management"},
                            {_id:"marketing", application:{_id:"bdm"}, label:"Marketing", parentmenu:{_id:"management"} },
                            {_id:"sales", application:{_id:"bdm"}, label:"Sales", parentmenu:{_id:"management"} }
                        ]
                    }
                ]
                return adminDb.update(insert);
            })
            .then(
            function () {
                return adminDb.query({$collection:Constants.Admin.MENUS, $filter:{"application":"bdm", parentmenu:null}, $sort:{label:1}, $recursion:{
                    parentmenu:"_id",
                    $alias:"menus"
                }});
            }).then(function (adminMenus) {
                expect(adminMenus.result).to.have.length(2);
                expect(adminMenus.result[1].menus).to.have.length(2);
                return db.query({$collection:Constants.Admin.MENUS, $filter:{"application":"bdm", parentmenu:null}, $sort:{label:1}, $recursion:{
                    parentmenu:"_id",
                    $alias:"menus"
                }});
            })
            .then(function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[1].menus).to.not.eql(undefined);
                expect(data.result[1].menus).to.have.length(2);
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    });

    it("fields saving", function (done) {
        var db = undefined;
        var adminDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                return db.getGlobalDB();
            })
            .then(
            function (adm) {
                adminDb = adm;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"hrm", department:"HRM", collection:"testing"} ,
                            {_id:"bdm", department:"BDM", collection:"testing1"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FIELDS,
                        $insert:[
                            {_id:"employee",type:"string", collectionid:{_id:"hrm"}, field:"Employees"},
                            {_id:"students",type:"string", collectionid:{_id:"hrm"}, field:"Students"},
                            {_id:"management",type:"string", collectionid:{_id:"bdm"}, field:"Management"}
                        ]
                    }
                ]
                return adminDb.update(insert);
            }).then(
            function () {
                return adminDb.invokeFunction("Commit.commitProcess", [
                    {data:{commit:true}}
                ]);
            })
            .then(function () {
                var update = {
                    $collection:Constants.Admin.FIELDS, $update:[
                        {_id:"employee", $set:{field:"Executives"}}
                    ]
                }
                return db.update(update);
            })
            .then(function () {
                return db.query({$collection:Constants.Admin.COLLECTIONS, $filter:{collection:{$in:["testing", "testing1"]}}, $sort:{department:1}});
            })
            .then(function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].department).to.eql("BDM");
                expect(data.result[1].department).to.eql("HRM");
            })
            .then(function () {
                return db.query({$collection:Constants.Admin.FIELDS, $filter:{"collectionid._id":"hrm"}, $sort:{field:1}});
            })
            .then(function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].field).to.eql("Executives");
                expect(data.result[1].field).to.eql("Students");
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    });

    it("collection update", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                var update = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"stateid", collection:"states"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $update:[
                            {_id:"stateid", $set:{collection:"countries"}}
                        ]
                    }
                ]
                return db.update(update);
            })
            .then(function (data) {
                done("Not Ok");
            })
            .fail(function (err) {
                var duplicateError = err.toString().indexOf("Update is not allowed in ") != -1;
                if (duplicateError) {
                    done();
                } else {
                    done(err);
                }
            })
    });

    it("applications insert db", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(
            function (db1) {
                db = db1;
                var insert = [
                    {_id:1, "label":"CRM"}
                ]
                return db.update({$collection:"pl.applications", $insert:insert});
            }).then(function () {
                return db.query({$collection:"pl.applications"});
            })
            .then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].db).to.eql(db.db.databaseName);
            }).then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    });

    it("Collection Delete", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(
            function (db1) {
                db = db1;
                var insert = [
                    {_id:1, "collection":"CRM"}
                ]
                return db.update({$collection:"pl.collections", $insert:insert});
            }).then(function () {
                return db.update({$collection:"pl.collections", $delete:[
                    {_id:1}
                ]});
            })
            .then(function (data) {
                done("Not Ok.");
            })
            .fail(function (err) {
                var error = err.toString().indexOf("Delete is not allowed in collection") != -1;
                if (error) {
                    done();
                } else {
                    done(err);
                }
            })
    });

    it("Applications Delete", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(
            function (db1) {
                db = db1;
                var insert = [
                    {_id:1, "label":"CRM"}
                ]
                return db.update({$collection:"pl.applications", $insert:insert});
            }).then(function () {
                return db.update({$collection:"pl.applications", $delete:[
                    {_id:1}
                ]});
            })
            .then(function (data) {
                done("Not Ok.");
            })
            .fail(function (err) {
                var error = err.toString().indexOf("Delete is not allowed in application") != -1;
                if (error) {
                    done();
                } else {
                    done(err);
                }
            })
    });

    it("Function Delete", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(
            function (db1) {
                db = db1;
                var insert = [
                    {_id:1, "name":"CRM"}
                ]
                return db.update({$collection:"pl.functions", $insert:insert});
            }).then(function () {
                return db.update({$collection:"pl.functions", $delete:[
                    {_id:1}
                ]});
            })
            .then(function (data) {
                done("Not Ok.");
            })
            .fail(function (err) {
                var error = err.toString().indexOf("Delete is not allowed in function") != -1;
                if (error) {
                    done();
                } else {
                    done(err);
                }
            })
    });

    it("Role Delete", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(
            function (db1) {
                db = db1;
                var insert = [
                    {_id:1, "role":"CRM"}
                ]
                return db.update({$collection:"pl.roles", $insert:insert});
            }).then(function () {
                return db.update({$collection:"pl.roles", $delete:[
                    {_id:1}
                ]});
            })
            .then(function (data) {
                done("Not Ok.");
            })
            .fail(function (err) {
                var error = err.toString().indexOf("Delete is not allowed in role") != -1;
                if (error) {
                    done();
                } else {
                    done(err);
                }
            })
    });

    it("Collection Insert Events and check parse error", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(
            function (db1) {
                db = db1;
                var insert = [
                    {_id:1, "collection":"CRM", events:[
                        {event:'onValue:[{test:{test1}]', function:"test"}
                    ]}
                ]
                return db.update({$collection:"pl.collections", $insert:insert});
            }).then(function () {
                done();
            })
            .fail(function (err) {
                var error = err.toString().indexOf("Event is not parsable") != -1;
                if (error) {
                    done();
                } else {
                    done(err);
                }
            })
    });

    it("Collection Insert Events and check parse done", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(
            function (db1) {
                db = db1;
                var insert = [
                    {_id:1, "collection":"CRM", events:[
                        {event:'onValue:[{"test":["test1"]}]', function:"test"}
                    ]}
                ];
                return db.update({$collection:"pl.collections", $insert:insert});
            }).then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    });

    it("Collection Update Events and check parse done", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(
            function (db1) {
                db = db1;
                var insert = [
                    {_id:1, "collection":"CRM", events:[
                        {event:'onValue:[{"test":["test1"]}]', function:"test"}
                    ]}
                ];
                return db.update({$collection:"pl.collections", $insert:insert});
            }).then(
            function () {
                return db.update({$collection:"pl.collections", $update:[
                    {_id:1, $set:{events:[
                        {event:'onValue:[{"test":["test1"]]', function:"test"}
                    ]}}
                ]});
            }).then(function () {
                done();
            })
            .fail(function (err) {
                var error = err.toString().indexOf("Event is not parsable") != -1;
                if (error) {
                    done();
                } else {
                    done(err);
                }
            })
    });

    it("fields delete with parent", function (done) {
        var db = undefined;
        var adminDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                return db.getGlobalDB();
            })
            .then(
            function (adm) {
                adminDb = adm;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"daffodilCollection", department:"Daffodil", collection:"Daffodil"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FIELDS,
                        $insert:[
                            {_id:"daffodil",type:"object", collectionid:{_id:"daffodilCollection"}, field:"Daffodil"},
                            {_id:"branch",type:"string", collectionid:{_id:"daffodilCollection"}, field:"Branches", parentfieldid:{_id:"daffodil"}},
                            {_id:"location",type:"string", collectionid:{_id:"daffodilCollection"}, field:"Locations", parentfieldid:{_id:"daffodil"}},
                            {_id:"hisar",type:"string", collectionid:{_id:"daffodilCollection"}, field:"Hisar", parentfieldid:{_id:"branch"}},
                            {_id:"gurgaon",type:"string", collectionid:{_id:"daffodilCollection"}, field:"Gurgaon", parentfieldid:{_id:"branch"}},
                            {_id:"hsr",type:"string", collectionid:{_id:"daffodilCollection"}, field:"HSRGSM", parentfieldid:{_id:"location"}},
                            {_id:"gur",type:"string", collectionid:{_id:"daffodilCollection"}, field:"GurgaonSEZ", parentfieldid:{_id:"location"}},
                            {_id:"hsrchild",type:"string", collectionid:{_id:"daffodilCollection"}, field:"HisarSEZ", parentfieldid:{_id:"hisar"}}
                        ]
                    }
                ]
                return adminDb.update(insert);
            }).then(
            function () {
                return adminDb.invokeFunction("Commit.commitProcess", [
                    {data:{commit:true}}
                ]);
            })
            .then(function () {
                return db.query({$collection:Constants.Admin.FIELDS, $filter:{"collectionid._id":"daffodilCollection"}, $sort:{field:1}});
            })
            .then(function (data) {
                expect(data.result).to.have.length(8);
            })
            .then(function () {
                return db.update({$collection:Constants.Admin.FIELDS, $delete:[
                    {_id:"branch"}
                ] });
            })
            .then(function () {
                return db.query({$collection:Constants.Admin.FIELDS, $filter:{"collectionid._id":"daffodilCollection"}, $sort:{field:1}});
            })
            .then(function (data) {
                expect(data.result).to.have.length(4);
                expect(data.result[0].field).to.eql("Daffodil");
                expect(data.result[1].field).to.eql("GurgaonSEZ");
                expect(data.result[2].field).to.eql("HSRGSM");
                expect(data.result[3].field).to.eql("Locations");
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    });

    it("menus delete with parent", function (done) {
        var db = undefined;
        var adminDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                return db.getGlobalDB();
            })
            .then(
            function (adm) {
                adminDb = adm;
                var insert = [
                    {
                        $collection:Constants.Admin.APPLICATIONS,
                        $insert:[
                            {_id:"daffodilCollection", department:"Daffodil", application:"Daffodil", label:"Daffodil"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.MENUS,
                        $insert:[
                            {_id:"daffodil", application:{_id:"daffodilCollection"}, label:"Daffodil"},
                            {_id:"branch", application:{_id:"daffodilCollection"}, label:"Branches", parentmenu:{_id:"daffodil"}},
                            {_id:"location", application:{_id:"daffodilCollection"}, label:"Locations", parentmenu:{_id:"daffodil"}},
                            {_id:"hisar", application:{_id:"daffodilCollection"}, label:"Hisar", parentmenu:{_id:"branch"}},
                            {_id:"gurgaon", application:{_id:"daffodilCollection"}, label:"Gurgaon", parentmenu:{_id:"branch"}},
                            {_id:"hsr", application:{_id:"daffodilCollection"}, label:"HSRGSM", parentmenu:{_id:"location"}},
                            {_id:"gur", application:{_id:"daffodilCollection"}, label:"GurgaonSEZ", parentmenu:{_id:"location"}}
                        ]
                    }
                ]
                return adminDb.update(insert);
            }).then(
            function () {
                return adminDb.invokeFunction("Commit.commitProcess", [
                    {data:{commit:true}}
                ]);
            })
            .then(function () {
                return db.query({$collection:Constants.Admin.MENUS, $filter:{"application._id":"daffodilCollection"}, $sort:{label:1}});
            })
            .then(function (data) {
                expect(data.result).to.have.length(7);
            })
            .then(function () {
                return db.update({$collection:Constants.Admin.MENUS, $delete:[
                    {_id:"branch"}
                ] });
            })
            .then(function () {
                return db.query({$collection:Constants.Admin.MENUS, $filter:{"application._id":"daffodilCollection"}, $sort:{label:1}});
            })
            .then(function (data) {
                expect(data.result).to.have.length(4);
                expect(data.result[0].label).to.eql("Daffodil");
                expect(data.result[1].label).to.eql("GurgaonSEZ");
                expect(data.result[2].label).to.eql("HSRGSM");
                expect(data.result[3].label).to.eql("Locations");
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    });

    it("referredfks deleted if parent delete", function (done) {
        var db = undefined;
        var adminDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            .then(function (db1) {
                db = db1;
                return db.getGlobalDB();
            })
            .then(function (adm) {
                adminDb = adm;
                var insert = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            {_id:"account", department:"Account", collection:"Account"},
                            {_id:"accountgroups", department:"Account", collection:"AccountGroups"},
                            {_id:"invoices", department:"Invoices", collection:"Invoices"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FIELDS,
                        $insert:[
                            {_id:"accountname",type:"string", collectionid:{_id:"account"}, field:"accountname"},
                            {_id:"invoicenumber",type:"string", collectionid:{_id:"invoices"}, field:"InvoiceNumber"},
                            {_id:"invoicelineitem", collectionid:{_id:"invoices"}, field:"InvoiceLineItem", type:"object", multiple:true},
                            {_id:"accountid", collectionid:{_id:"invoices"}, type:"fk", field:"AccountId", parentfieldid:{_id:"invoicelineitem"}, collection:"Account", set:["accountname"]},
                            {_id:"lineitemno",type:"string", collectionid:{_id:"invoices"}, field:"LineItem", parentfieldid:{_id:"invoicelineitem"}}
                        ]
                    }
                ]
                return adminDb.update(insert);
            })
            .then(function () {
                var query1 = {$collection:Constants.Admin.REFERRED_FKS, $filter:{"referredcollectionid._id":"account"}};
                return adminDb.query(query1);
            })
            .then(function (data) {
                expect(data.result).to.have.length(1);
            })
            .then(function () {
                return adminDb.update({$collection:Constants.Admin.FIELDS, $update:[
                    {_id:"accountid", $set:{collection:"AccountGroups"}}
                ] });
            })
            .then(function () {
                return adminDb.query({$collection:Constants.Admin.REFERRED_FKS, $filter:{"referredcollectionid._id":"accountgroups"}, $events:false, $modules:false});
            })
            .then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].referredcollectionid._id).to.eql("accountgroups");
                expect(data.result[0].referredfieldid._id).to.eql("accountid");
            })
            .then(function () {
                return adminDb.update({$collection:Constants.Admin.FIELDS, $delete:[
                    {_id:"invoicelineitem"}
                ] });
            })
            .then(function () {
                return adminDb.query({$collection:Constants.Admin.FIELDS, $filter:{ "collectionid._id":"account"}});
            })
            .then(function (data) {
                expect(data.result).to.have.length(1);
            })
            .then(function () {
                return adminDb.query({$collection:Constants.Admin.FIELDS, $filter:{ "collectionid._id":"invoices"}});
            })
            .then(function (data) {
                expect(data.result).to.have.length(1);
            })
            .then(function () {
                done();
            })
            .fail(function (err) {
                done(err);
            })
    })
})