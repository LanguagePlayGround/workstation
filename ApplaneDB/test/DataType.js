/**
 * mocha --recursive --timeout 150000 -g "datatype testcase" --reporter spec
 * mocha --recursive --timeout 150000 -g "simple insert with object in batchupdate" --reporter spec
 * mocha --recursive --timeout 150000 -g "Filter DataType testcase" --reporter spec
 * mocha --recursive --timeout 150000 -g "Mandatory Validation testcase" --reporter spec
 *
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

describe("datatype testcase", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    it("simple insert with object in batchupdate", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = {$collection: {"collection": COUNTRIES, fields: [
                {field: "constitutiondate", type: "date"},
                {field: "country", type: "string", mandatory: true},
                {field: "isfree", type: "boolean"}
            ]}, $insert: {country: "India", code: "91", "constitutiondate": "1900-01-26", "isfree": "not"}}

            return    db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
//                console.log("data after update>>>>>>>>>>." + JSON.stringify(data));
            expect(data.result).to.have.length(1);
            expect(data.result[0].constitutiondate instanceof Date).to.eql(true);
            expect(data.result[0].constitutiondate.getDate()).to.eql(26);
            expect(data.result[0].isfree).to.eql(false);
            done();
        }).fail(function (err) {
            done(err);
        });
    })


    it("Email datatype  insertion testing", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = {$collection: {"collection": COUNTRIES, fields: [
                {field: "constitutiondate", type: "date"},
                {field: "country", type: "string", mandatory: true},
                {field: "email", type: "emailid"}
            ]}, $insert: {country: "India", code: "91", "constitutiondate": "1900-01-26", "email": "mohitj531@gmail.com"}}

            return    db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
//                console.log("data after update>>>>>>>>>>." + JSON.stringify(data));
            expect(data.result).to.have.length(1);
            expect(data.result[0].constitutiondate instanceof Date).to.eql(true);
            expect(data.result[0].constitutiondate.getDate()).to.eql(26);
            expect(data.result[0].email).to.eql("mohitj531@gmail.com");
            done();
        }).fail(function (err) {
            done(err);
        });
    })

    it("mobilenumber datatype  insertion testing", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [{$collection: {"collection": COUNTRIES, fields: [
                {field: "constitutiondate", type: "date"},
                {field: "country", type: "string", mandatory: true},
                {field: "mobile", type: "mobilenumber"}
            ]}, $insert: [{country: "India", code: "91", "constitutiondate": "1900-01-26", "mobile": "+919466910233"},
                {country: "India", code: "91", "constitutiondate": "1900-01-26", "mobile": "9466910233"},
                {country: "India", code: "91", "constitutiondate": "1900-01-26", "mobile": "+91 9466910233"},
                {country: "India", code: "91", "constitutiondate": "1900-01-26", "mobile": "09466910233"},
                {country: "India", code: "91", "constitutiondate": "1900-01-26", "mobile": "919466910233"},
                {country: "India", code: "91", "constitutiondate": "1900-01-26", "mobile": "91 9466910233"}]
            }]

            return  db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            expect(data.result).to.have.length(6);
            expect(data.result[0].constitutiondate instanceof Date).to.eql(true);
            expect(data.result[0].constitutiondate.getDate()).to.eql(26);
            expect(data.result[0].mobile).to.eql("+919466910233");
            expect(data.result[1].constitutiondate instanceof Date).to.eql(true);
            expect(data.result[1].constitutiondate.getDate()).to.eql(26);
            expect(data.result[1].mobile).to.eql("9466910233");
            expect(data.result[2].constitutiondate instanceof Date).to.eql(true);
            expect(data.result[2].constitutiondate.getDate()).to.eql(26);
            expect(data.result[2].mobile).to.eql("+91 9466910233");
            expect(data.result[3].constitutiondate instanceof Date).to.eql(true);
            expect(data.result[3].constitutiondate.getDate()).to.eql(26);
            expect(data.result[3].mobile).to.eql("09466910233");
            expect(data.result[4].constitutiondate instanceof Date).to.eql(true);
            expect(data.result[4].constitutiondate.getDate()).to.eql(26);
            expect(data.result[4].mobile).to.eql("919466910233");
            expect(data.result[5].constitutiondate instanceof Date).to.eql(true);
            expect(data.result[5].constitutiondate.getDate()).to.eql(26);
            expect(data.result[5].mobile).to.eql("91 9466910233");
            done();
        }).fail(function (err) {
            done(err);
        });
    })

    it("mobilenumber datatype wrong insertion testing", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = {$collection: {"collection": COUNTRIES, fields: [
                {field: "constitutiondate", type: "date"},
                {field: "country", type: "string", mandatory: true},
                {field: "mobile", type: "phonenumber", mobile:true}
            ]}, $insert: {country: "India", code: "91", "constitutiondate": "1900-01-26", "mobile": "466910233"}}

            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            expect(data.result).not.to.be.ok;
            done();
        }).fail(function (err) {
            if (err.message === "Error while casting for expression [mobile] with value [466910233] for type [phonenumber] in collection [countries].Mobile is true") {
                done();
            } else {
                done(err);
            }
        });
    })

    it("mobilenumber datatype wrong insertion testing2", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = {$collection: {"collection": COUNTRIES, fields: [
                {field: "constitutiondate", type: "date"},
                {field: "country", type: "string", mandatory: true},
                {field: "mobile", type: "phonenumber", mobile:true}
            ]}, $insert: {country: "India", code: "91", "constitutiondate": "1900-01-26", "mobile": "0919466910233"}}

            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            console.log(data.result);
            expect(data.result).not.to.be.ok;
            done();
        }).fail(function (err) {
            if (err.message === "Error while casting for expression [mobile] with value [0919466910233] for type [phonenumber] in collection [countries].Mobile is true") {
                done();
            } else {
                done(err);
            }
        });
    })

    it("Email datatype wrong insertion testing", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = {$collection: {"collection": COUNTRIES, fields: [
                {field: "constitutiondate", type: "date"},
                {field: "country", type: "string", mandatory: true},
                {field: "email", type: "emailid"}
            ]}, $insert: {country: "India", code: "91", "constitutiondate": "1900-01-26", "email": "moj"}}

            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            expect(data.result).not.to.be.ok;
            done();
        }).fail(function (err) {
            if (err.message === "Error while casting for expression [email] with value [moj] for type [emailid] in collection [countries].") {
                done();
            } else {
                done(err);
            }
        });
    })

    it("email datatype updation", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "email", type: "emailid"}
                ]}, $insert: [
                    {country: "India", code: "91", "email": "mohitj531@gmail.com"},
                    {country: "USA", code: "01", "email": "mohitjain@gmail.com"}
                ]}

            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"})
        }).then(function (data) {
            expect(data.result).to.have.length(2);
            expect(data.result[0].email).to.eql("mohitj531@gmail.com");
            expect(data.result[1].email).to.eql("mohitjain@gmail.com");
            var updates1 = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "email", type: "emailid"}
                ]}, $update: [
                    {_id: data.result[0]._id, $set: {code: "+91", "email": "mjain01234@gmail.com"}}
                ]}
            ]
            return db.update(updates1);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            expect(data.result).to.have.length(2)
            expect(data.result[0].email).to.eql("mjain01234@gmail.com");
            expect(data.result[0].code).to.eql("+91");
            done();
        }).fail(function (err) {
            done(err);
        });
    })


    it("email datatype wrong updation", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "email", type: "emailid"}
                ]}, $insert: [
                    {country: "India", code: "91", "email": "mohitj531@gmail.com"},
                    {country: "USA", code: "01", "email": "mohitj531@gmail.com"}
                ]}

            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"})
        }).then(function (data) {
//                console.log("dataafter insert" + JSON.stringify(data));
            expect(data.result).to.have.length(2);
            expect(data.result[0].email).to.eql("mohitj531@gmail.com");
            expect(data.result[1].email).to.eql("mohitj531@gmail.com");
            var updates1 = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "email", type: "emailid"}
                ]}, $update: [
                    {_id: data.result[0]._id, $set: {code: "+91", "email": "mj"}}
                ]}
            ]
            return db.update(updates1);
        }).then(function () {
            expect(data.result).not.to.be.ok;
        }).fail(function (err) {
            try {
                expect(err.message).eql("Error while casting for expression [email] with value [mj] for type [emailid] in collection [countries].");
                done();
            } catch (e) {
                done(e);
            }
        });
    })

    it("simple insert with DataType1", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1900-01-26", "isfree": true},
                    {country: "USA", code: "01", "constitutiondate": "1900-11-26", "isfree": "TRUE"},
                    {country: "pakistan", code: "92", "constitutiondate": "1900-01-30", "isfree": "NAHI"}
                ]
                }
            ];
            return    db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
//                console.log("data>>>" + JSON.stringify(data));
            expect(data.result).to.have.length(3);
            expect(data.result[0].constitutiondate.getDate()).to.eql(26);
            expect(data.result[0].country).to.eql("India");
            expect(data.result[0].isfree).to.eql(true);
            expect(data.result[1].isfree).to.eql(true);
            expect(data.result[1].constitutiondate.getMonth()).to.eql(10);
            expect(data.result[2].isfree).to.eql(false);
            expect(data.result[2].constitutiondate.getDate()).to.eql(30);
            done();
        }).fail(function (err) {
            done(err);
        });
    })

    it.skip("Mandatory Error", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $insert: [
                    { code: "92", "constitutiondate": "1900-01-30", "isfree": "NAHI"}
                ]
                }
            ];
            return  db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            expect(data.result).not.to.be.ok;
            done();
        }).fail(function (err) {
            try {
                expect(err.message).eql("Expression [country] is mandatory");
                done();
            } catch (e) {
                done(e);
            }
        });
    })

    it("casting error while update", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "cdate", type: "date"}
                ]}, $insert: [
                    {country: "India", code: "91", "cdate": "1990-05-01"},
                    {country: "USA", code: "01", "cdate": "1990-05-02"}
                ]}

            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"})
        }).then(function (data) {
//                console.log("dataafter insert" + JSON.stringify(data));
            expect(data.result).to.have.length(2);
            expect(data.result[0].cdate.getDate()).to.eql(1);
            expect(data.result[1].cdate.getDate()).to.eql(2);
            var updates1 = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "cdate", type: "date"}
                ]}, $update: [
                    {_id: data.result[0]._id, $set: {code: "+91", "cdate": "test1"}}
                ]}
            ]
            return db.update(updates1);
        }).then(function (data) {
            expect(data).not.to.be.ok;
        }).fail(function (err) {
//                console.log("err>>>>>>>>>>>>>>>>>>" + err.message);
            var castingError = err.toString().indexOf("Error while casting for expression [cdate] with value [test1] for type [date] in collection [countries].Provide value in format yyyy/mm/dd") != -1;
            if (castingError) {
                done();
            } else {
                done(err);
            }
        });
    })

    it("insert with Object as DataType", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string"},
                    {field: "languages", type: "object", fields: [
                        {field: "name", type: "string"},
                        {field: "date", type: "date"}
                    ]},
                    {field: "constitutiondate", type: "date"},
                    {field: "address", type: "object", fields: [
                        {field: "line", type: "string"},
                        {field: "city", type: "object", fields: [
                            {"field": "city", type: "string"},
                            {"field": "date", type: "date"},
                            {"field": "district", type: "object", fields: [
                                {"field": "district", type: "string", fields: [
                                    {"field": "village", type: "object", fields: [
                                        {field: "goan", type: "string"}
                                    ]}
                                ]}
                            ]}
                        ]},
                        {field: "state", type: "object", fields: [
                            {"field": "state", type: "string"},
                            {"field": "date", type: "date"}
                        ]},
                        {field: "country", type: "object", fields: [
                            {"field": "country", type: "string"},
                            {"field": "date", type: "date"}
                        ]}
                    ]}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1950-01-26", languages: {"name": "hindi", "date": "2014-01-01"}, address: {"line": "22", city: {"city": "Hisar", "date": "2014-01-05", district: {"district": "hansi", "village": {"goan": "mayad"} }}, state: {"state": "haryana", "date": "2014-06-02"}, country: {"country": "India", "date": "2014-04-22"}}},
                    {country: "USA", code: "01", "constitutiondate": "1900-01-26", languages: {"name": "english", "date": "2014-01-01"}, address: {"line": "street-1", city: {"city": "vegas", "date": "2014-01-02"}, state: {"state": "new york", "date": "2014-06-15"}, country: {"country": "USA", "date": "2014-04-30"}}},
                    {country: "Pakistan", code: "92", "constitutiondate": "1900-01-30", languages: {"name": "urdu", "date": "2014-01-01"}}
                ]
                }
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            data = data.result;
            expect(data).to.have.length(3);
            expect(data[0].languages.name).to.eql("hindi");
            expect(data[0].address.line).to.eql("22");
            expect(data[0].address.city.city).to.eql("Hisar");
            expect(data[0].address.city.date.getDate()).to.eql(05);
            expect(data[0].address.city.district.district).to.eql("hansi");
            expect(data[0].address.city.district.village.goan).to.eql("mayad");
            expect(data[0].address.city.date.getDate()).to.eql(05);
            expect(data[0].address.state.state).to.eql("haryana");
            expect(data[0].address.state.date.getDate()).to.eql(02);
            expect(data[0].address.country.country).to.eql("India");
            expect(data[0].address.country.date.getDate()).to.eql(22);
            expect(data[2].languages.name).to.eql("urdu");
            expect(data[2].country).to.eql("Pakistan");
            expect(data[1].languages.name).to.eql("english");
            expect(data[1].address.line).to.eql("street-1");
            expect(data[1].address.city.city).to.eql("vegas");
            expect(data[1].address.city.date.getDate()).to.eql(02);
            expect(data[1].address.state.state).to.eql("new york");
            expect(data[1].address.state.date.getDate()).to.eql(15);
            expect(data[1].address.country.country).to.eql("USA");
            expect(data[1].address.country.date.getDate()).to.eql(30);
            done();
        }).fail(function (err) {
            done(err);
        });
    });

    it("insert with Array as DataType", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "currency", type: "string"},
                    {field: "mycountry", type: "string"},
                    {field: "country", type: "object", fields: [
                        {field: "name", type: "string"},
                        {field: "states", type: "object", fields: [
                            {field: "state", type: "string"},
                            {field: "date", type: "date"},
                            {field: "cities", multiple: true, type: "object", "fields": [
                                {field: "city", type: "string"},
                                {field: "date", type: "date"},
                                {field: "schools", type: "object", multiple: true, fields: [
                                    {field: "school", type: "string"},
                                    {field: "date", type: "date"}
                                ]}
                            ]}
                        ], multiple: true}
                    ]}
                ]}, $insert: [
                    {mycountry: "India", code: "91", "constitutiondate": "1950-01-26", country: { name: "India", states: [
                        {"state": "haryana", "date": "2014-01-01", cities: [
                            {city: "hisar", date: "2012-03-04", schools: [
                                {school: "abc", date: "2014-5-9"},
                                {school: "dps", date: "1988-5-11"}
                            ]},
                            {city: "sirsa", date: "2012-03-22"}
                        ]},
                        {"state": "punjab", "date": "2012-01-09", cities: [
                            {city: "amritsar", date: "2011-09-08", schools: [
                                { school: "model", "date": "1788-3-26"}
                            ]},
                            {city: "ludhiana", date: "2011-09-25", schools: [
                                { school: "nursery", "date": "1788-8-09"}
                            ]}
                        ]}
                    ]}}
                    ,
                    {mycountry: "USA", code: "01", "constitutiondate": "1900-01-26", country: { name: "India", states: [
                        {"state": "toronto", "date": "2014-01-01"},
                        {"state": "new york", "date": "2014-01-01"}
                    ]}},
                    {mycountry: "Pakistan", code: "92", "constitutiondate": "1900-01-30", country: { name: "India", states: [
                        {"state": "lahore", "date": "2014-01-01"},
                        {"state": "multan", "date": "2014-01-01"}
                    ]}}
                ]
                }
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            data = data.result;
            expect(data).to.have.length(3);
            expect(data[0].mycountry).to.eql("India");
            expect(data[0].country.name).to.eql("India");
            expect(data[0].country.states).to.have.length(2);
            expect(data[0].country.states[0].date.getDate()).to.eql(01);

            expect(data[0].country.states[0].state).to.eql("haryana");
            expect(data[0].country.states[0].cities).to.have.length(2);
            expect(data[0].country.states[0].cities[0].city).to.eql("hisar");
            expect(data[0].country.states[0].cities[0].date.getDate()).to.eql(04);
            expect(data[0].country.states[0].cities[0].schools).to.have.length(2);
            expect(data[0].country.states[0].cities[0].schools[0].school).to.eql("abc");
            expect(data[0].country.states[0].cities[0].schools[0].date.getDate()).to.eql(9);
            expect(data[0].country.states[0].cities[0].schools[1].school).to.eql("dps");
            expect(data[0].country.states[0].cities[0].schools[1].date.getDate()).to.eql(11);
            expect(data[0].country.states[0].cities[1].city).to.eql("sirsa");
            expect(data[0].country.states[0].cities[1].date.getDate()).to.eql(22);

            expect(data[0].country.states[1].state).to.eql("punjab");
            expect(data[0].country.states[1].date.getDate()).to.eql(09);
            expect(data[0].country.states[1].cities).to.have.length(2);
            expect(data[0].country.states[1].cities[0].city).eql("amritsar");
            expect(data[0].country.states[1].cities[0].date.getDate()).eql(08);
            expect(data[0].country.states[1].cities[0].schools).to.have.length(1);
            expect(data[0].country.states[1].cities[0].schools[0].school).to.eql("model");
            expect(data[0].country.states[1].cities[0].schools[0].date.getDate()).to.eql(26);

            expect(data[0].country.states[1].cities[1].city).eql("ludhiana");
            expect(data[0].country.states[1].cities[1].date.getDate()).eql(25);
            expect(data[0].country.states[1].cities[1].schools).to.have.length(1);
            expect(data[0].country.states[1].cities[1].schools[0].school).to.eql("nursery");
            expect(data[0].country.states[1].cities[1].schools[0].date.getDate()).to.eql(09);
            done();
        }).fail(function (err) {
            done(err);
        });
    })

    it("insert with Decimal as DataType", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string"},
                    {field: "CurrentTemp", type: "decimal"},
                    {field: "languages", type: "object", fields: [
                        {field: "name", type: "string"},
                        {field: "date", type: "date"}
                    ], multiple: true}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1950-01-26", CurrentTemp: "25.5", languages: {"name": "hindi", "date": "2014-01-01"}},
                    {country: "USA", code: "01", "constitutiondate": "1900-01-26", CurrentTemp: "15", languages: {"name": "english", "date": "2014-01-01"}},
                    {country: "Pakistan", code: "92", "constitutiondate": "1900-01-30", CurrentTemp: "28", languages: {"name": "urdu", "date": "2014-01-01"}}
                ]}
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            data = data.result;
            expect(data).to.have.length(3);
            expect(data[0].languages.name).to.eql("hindi");
            expect(data[0].CurrentTemp).to.eql(25.5);     //PASSING
            expect(data[1].CurrentTemp).to.eql(15);
            expect(data[2].CurrentTemp).to.eql(28);
            done();
        }).fail(function (err) {
            done(err);
        });
    })

    it("insert with Integer as DataType", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string"},
                    {field: "CurrentTemp", type: "integer"},
                    {field: "languages", type: "object", fields: [
                        {field: "name", type: "string"},
                        {field: "date", type: "date"}
                    ], multiple: true}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1950-01-26", CurrentTemp: "25", languages: {"name": "hindi", "date": "2014-01-01"}},
                    {country: "USA", code: "01", "constitutiondate": "1900-01-26", CurrentTemp: "15", languages: {"name": "english", "date": "2014-01-01"}},
                    {country: "Pakistan", code: "92", "constitutiondate": "1900-01-30", CurrentTemp: "28.2", languages: {"name": "urdu", "date": "2014-01-01"}}
                ]
                }
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            data = data.result;
//                console.log("Data>>>>>>>>>." + JSON.stringify(data));
            expect(data).to.have.length(3);
            expect(data).to.have.length(3);
            expect(data[0].languages.name).to.eql("hindi");
            expect(data[2].CurrentTemp).to.eql(28);
            expect(data[1].CurrentTemp).to.eql(15);
            done();
        }).fail(function (err) {
            done(err);
        });
    })

    it("update with Array in datatype module without id and ensure _id is generated", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "states", type: "object", fields: [
                        {field: "state", type: "string"},
                        {field: "date", type: "date"}
                    ], multiple: true}
                ]}, $insert: [
                    { country: "India", code: "91", "states": [
                        {state: "haryana", "date": "2020-02-02"},
                        { state: "punjab", "date": "2020-02-10"}
                    ]},
                    {country: "USA", code: "01", "states": [
                        { state: "newyork", "date": "2020-02-23"},
                        { state: "canada", "date": "2020-02-18"}
                    ]},
                    {country: "pakistan", code: "92", "states": { $insert: [
                        { state: "islamabad", "date": "2020-02-23"},
                        { state: "lahore", "date": "2020-02-18"}
                    ]}}
                ]}
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            data = data.result;
//                console.log("data>>>>after insert" + JSON.stringify(data));
            expect(data).to.have.length(3);
            expect(data[0]._id).exists;
            expect(data[0].states).to.have.length(2);
            expect(data[0].states[0]._id).exists;
            expect(data[0].states[1]._id).exists;
            expect(data[1].states).to.have.length(2)
            var arrayUpdates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "states", type: "object", fields: [
                        {field: "state", type: "string"},
                        {field: "date", type: "date"}
                    ], multiple: true}
                ]}, $update: [
                    {"_id": data[0]._id,
                        $set: {country: "India11", states: {$insert: [
                            {state: "bihar", date: "2021-12-01"}
                        ], $update: [
                            {$query: {state: "haryana"}, $set: {state: "haryana1", date: "2050-02-05"}}
                        ]}}
                    }
                ]}
            ]
            return db.update(arrayUpdates);
        }).then(function () {
            return db.query({$collection: "countries", $sort: {country: 1}});
        }).then(function (data) {
//                console.log("data after update>>>>>>>...." + JSON.stringify(data));
            data = data.result;
            expect(data).to.have.length(3);
            expect(data[0].country).to.eql("India11");
            expect(data[0].states).to.have.length(3);
            expect(data[0].states[0].state).to.eql("haryana1");
            expect(data[0].states[0].date.getMonth()).to.eql(01);
            expect(data[0].states[2].state).to.eql("bihar");
            expect(data[0].states[2].date.getFullYear()).to.eql(2021);
            done();
        }).fail(function (err) {
            done(err);
        });
    })

    it.skip("update with Array and remove mandatory field from array", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "states", type: "object", fields: [
                        {field: "state", type: "string", mandatory: true},
                        {field: "date", type: "date"}
                    ], multiple: true}
                ]}, $insert: [
                    { country: "India", code: "91", "states": [
                        {state: "haryana", "date": "2020-02-02"},
                        { state: "punjab", "date": "2020-02-10"}
                    ]},
                    {country: "USA", code: "01", "states": [
                        { state: "newyork", "date": "2020-02-23"},
                        { state: "canada", "date": "2020-02-18"}
                    ]}
                ]}
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            data = data.result;
//                console.log("data>>>>" + JSON.stringify(data));
            expect(data).to.have.length(2);
            expect(data[0]._id).exists;
            expect(data[0].states).to.have.length(2);
            expect(data[0].states[0]._id).exists;
            expect(data[0].states[1]._id).exists;
            expect(data[1].states).to.have.length(2);
            var arrayUpdates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "states", type: "object", fields: [
                        {field: "state", type: "string", mandatory: true},
                        {field: "date", type: "date"}
                    ], multiple: true}
                ]}, $update: [
                    {"_id": data.result[0]._id,
                        $set: {country: "India11", states: {$insert: [
                            {state: "bihar", date: "2021-12-01"}
                        ], $update: [
                            {$query: {state: "haryana"}, $set: {state: "", date: "2050-02-05"}}
                        ]}}
                    }
                ]}
            ]
            return db.update(arrayUpdates);
        }).then(function (data) {
            expect(data).not.to.be.ok;
        }).fail(function (err) {
            try {
                expect(err.message).to.eql("Expression [states.state] is mandatory");
                done();
            } catch (err) {
                done(err);
            }
        });
    })

    it("update object multiple type field", function (done) {      //wrong
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "normalTemp", type: "number"},
                    {field: "date", type: "date"},
                    {field: "states", type: "object", multiple: true, fields: [
                        {field: "state", type: "string"},
                        {field: "city", type: "object", fields: [
                            {field: "city", type: "string"}
                        ]}
                    ]}
                ]}, $insert: [
                    {country: "India", code: "91", normalTemp: 25, date: "1950-01-30", "states": [
                        {_id: "haryana", state: "haryana", city: {"city": "hisar", "date": "2012-02-04"}},
                        {_id: "punjab", state: "punjab", city: {"city": "amritsar", "date": "2012-02-08"}}
                    ]},
                    {country: "USA", code: "01", normalTemp: 15, date: "1966-05-18", "states": [
                        {_id: "newyork", state: "newyork", city: {"city": "vegas", "date": "2012-02-13"}},
                        {_id: "canada", state: "canada", city: {"city": "toronto", "date": "2012-02-27"}}
                    ]}
                ]}
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            data = data.result;
//                console.log("data after insert>>>" + JSON.stringify(data));
            expect(data).to.have.length(2);
            expect(data[0].states).to.have.length(2);
            expect(data[1].states).to.have.length(2);
            var arrayUpdates = [
                {$collection: {collection: COUNTRIES, fields: [
                    {field: "country", type: "string"},
                    {field: "code", type: "string"},
                    {field: "normalTemp", type: "number"},
                    {field: "date", type: "date"},
                    {field: "states", type: "object", multiple: true, fields: [
                        {field: "state", type: "string"},
                        {field: "city", type: "object", fields: [
                            {field: "city", type: "string"}
                        ]}
                    ]}
                ]}, $update: [
                    {"_id": data[0]._id, $set: {"date": "1950-02-26", states: {
                        $update: [
                            {$query: {state: "haryana"}, $set: {"state": "haryana1", city: {$set: {city: "hisar1"}}}}
                        ]
                    }}},
                    {"_id": data[1]._id, $set: {"date": "1950-07-02", states: {
                        $update: [
                            {$query: {state: "newyork"}, $set: {"state": "newyork1", city: {$set: {city: "lasvegas"}}}}
                        ]
                    }}}

                ]}
            ]
            return db.update(arrayUpdates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            data = data.result;
//                console.log("data after update>>>>>>>...." + JSON.stringify(data));
            expect(data).to.have.length(2);
            expect(data[0].country).to.eql("India");
            expect(data[1].country).to.eql("USA");
            expect(data[0].date.getDate()).to.eql(26);
            expect(data[1].date.getDate()).to.eql(02);
            done();
        }).fail(function (err) {
            done(err);
        });
    });

    it("case from dhirender to set  boolean value ", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $insert: [
                    {_id: "India", country: "India", code: "91", "constitutiondate": "1900-01-26", "isfree": true}
                ]
                }
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            data = data.result;
            expect(data).to.have.length(1);
            expect(data[0].constitutiondate.getDate()).to.eql(26);
            expect(data[0].country).to.eql("India");
            expect(data[0].isfree).to.eql(true);
            var arrayUpdates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $update: [
                    {_id: "India", $set: {isfree: false}}
                ]}
            ]
            return db.update(arrayUpdates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            data = data.result;
            expect(data).to.have.length(1);
            expect(data[0].isfree).to.eql(false);
            done();
        }).fail(function (err) {
            done(err);
        });
    })

    it("case from dhirender to increment score", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "country", type: "string", mandatory: true},
                    {field: "rank", type: "number"}
                ]}, $insert: [
                    {_id: "India", country: "India", "rank": 99}
                ]
                }
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            data = data.result;
            expect(data).to.have.length(1);
            expect(data[0].country).to.eql("India");
            expect(data[0].rank).to.eql(99);
            var arrayUpdates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "country", type: "string", mandatory: true},
                    {field: "rank", type: "number"}
                ]}, $update: [
                    {_id: "India", $inc: {rank: 1}}
                ]}
            ]
            return db.update(arrayUpdates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            data = data.result;
            expect(data).to.have.length(1);
            expect(data[0].rank).to.eql(100);
            done();
        }).fail(function (err) {
            done(err);
        });
    });

    it("insert with json type by passing string", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {collection: "actions", fields: [
                    {field: "filter", type: "json"},
                    {field: "name", type: "string"}
                ]}, $insert: [
                    {name: "testcase", filter: JSON.stringify({"a": "b"})}
                ]}
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "actions"});
        }).then(function (data) {
            data = data.result;
            expect(data).to.have.length(1);
            expect(data[0].name).to.eql("testcase");
            expect(data[0].filter.a).to.eql("b");
            done();
        }).fail(function (err) {
            done(err);
        });
    })
    it("insert with json type by jsonobject", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {collection: "actions", fields: [
                    {field: "filter", type: "json"},
                    {field: "name", type: "string"}
                ]}, $insert: [
                    {name: "testcase", filter: {"a": "b"}}
                ]}
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "actions"});
        }).then(function (data) {
            data = data.result;
            expect(data).to.have.length(1);
            expect(data[0].name).to.eql("testcase");
            expect(data[0].filter.a).to.eql("b");
            done();
        }).fail(function (err) {
            done(err);
        });
    })

    it("insert with objectid type", function (done) {
        var ObjectID = require("mongodb").ObjectID;
        var uniqueObjectid = new ObjectID().toString()
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {collection: "myactions", fields: [
                    {field: "action", type: "string"},
                    {field: "number", type: "objectid"}
                ]}, $insert: [
                    {action: "running testcase", number: uniqueObjectid }
                ]}
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: {collection: "myactions", fields: [
                {field: "action", type: "string"},
                {field: "number", type: "objectid"}
            ]}, $filter: {"number": uniqueObjectid}});
        }).then(function (data) {
            data = data.result;
            expect(data).to.have.length(1);
            expect(data[0].action).to.eql("running testcase");
            var isObjectIdInstance = data[0].number instanceof ObjectID;
            expect(isObjectIdInstance).to.eql(true);
            done();
        }).fail(function (err) {
            done(err);
        });
    })

})
describe("Filter DataType testcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("datetype filter", function (done) {
//        console.log("111111111111111111");
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
//            console.log("2222222222222222222");
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1900-01-26", "isfree": true},
                    {country: "USA", code: "01", "constitutiondate": "1900-01-26", "isfree": "TRUE"},
                    {country: "pakistan", code: "92", "constitutiondate": "1900-01-30", "isfree": "NAHI"}
                ]
                }
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: {"collection": COUNTRIES, fields: [
                {field: "constitutiondate", type: "date"},
                {field: "country", type: "string", mandatory: true},
                {field: "isfree", type: "boolean"}
            ]}, $sort: {country: 1}, $filter: {"constitutiondate": "1900-01-30"}});
        }).then(function (data) {
//                console.log("data from query>>" + JSON.stringify(data));
            data = data.result;
            expect(data).to.have.length(1);
            expect(data[0].constitutiondate.getDate()).to.eql(30);
            expect(data[0].country).to.eql("pakistan");
            expect(data[0].isfree).to.eql(false);
        }).then(function () {
            done();
        }).fail(function (err) {
            done(err);
        });
    });

    it("datetype dollar gt and dollar lt in filter", function (done) {
//        console.log("hello")
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1900-01-26", "isfree": true},
                    {country: "USA", code: "01", "constitutiondate": "1900-01-26", "isfree": "TRUE"},
                    {country: "pakistan", code: "92", "constitutiondate": "1600-01-30", "isfree": "NAHI"}
                ]
                }
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: {"collection": COUNTRIES, fields: [
                {field: "constitutiondate", type: "date"},
                {field: "country", type: "string", mandatory: true},
                {field: "isfree", type: "boolean"}
            ]}, $sort: {country: 1}, $filter: {"constitutiondate": {$gt: "1800-01-30", $lt: "2000-01-30"}}});
        }).then(function (data) {
//                console.log("data from query>>" + JSON.stringify(data));
            data = data.result;
            expect(data).to.have.length(2);
            expect(data[0].country).to.eql("India");
            expect(data[1].country).to.eql("USA");
        }).then(function () {
            done();
        }).fail(function (err) {
            done(err);
        });
    })

    it("datetype dollar or and dollar and in filter", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "isfree", type: "boolean"}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1900-01-26", "isfree": true},
                    {country: "USA", code: "01", "constitutiondate": "1900-05-26", "isfree": "TRUE"},
                    {country: "pakistan", code: "92", "constitutiondate": "1900-01-30", "isfree": "NAHI"}
                ]
                }
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: {"collection": COUNTRIES, fields: [
                {field: "constitutiondate", type: "date"},
                {field: "country", type: "string", mandatory: true},
                {field: "isfree", type: "boolean"}
            ]}, $sort: {country: 1}, $filter: {$or: [
                {"constitutiondate": "1900-01-26"},
                {"constitutiondate": "1900-01-30"}
            ]}});
        }).then(function (data) {
//                console.log("data from query>>" + JSON.stringify(data));
            data = data.result;
            expect(data).to.have.length(2);
            expect(data[0].constitutiondate.getDate()).to.eql(26);
            expect(data[0].country).to.eql("India");
            expect(data[0].isfree).to.eql(true);
            expect(data[1].constitutiondate.getDate()).to.eql(30);
            expect(data[1].country).to.eql("pakistan");
            expect(data[1].isfree).to.eql(false);
            done();
        }).fail(function (err) {
            done(err);
        });
    })


    it("datetype filter on object no cast if fields are not provided", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {"collection": "vouchers", fields: [
                    {field: "vli", type: "object", fields: [
                        {field: "accountgroupid", type: "fk", "collection": "accountgroups", upsert: true, set: ["account"]}
                    ], multiple: true}
                ]}, $insert: [
                    {vli: [
                        {accountgroupid: {$query: {"_id": "1234", account: "abc"}}},
                        {accountgroupid: {$query: {"_id": "5678", account: "def"}}}
                    ], voucherno: "124"}
                ]
                }
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: {"collection": "vouchers", fields: [
                {field: "vli", type: "object", fields: [
                    {field: "accountgroupid", type: "fk", "collection": "accountgroups"}
                ], multiple: true}
            ]}, $filter: {"vli.accountgroupid._id": "1234"}});
        }).then(function (data) {
//                console.log("data from query>>" + JSON.stringify(data));
            data = data.result;
            expect(data).to.have.length(1);
            done();
        }).fail(function (err) {
            done(err);
        });
    });

    it("filter on number type field", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: {"collection": COUNTRIES, fields: [
                    {field: "constitutiondate", type: "date"},
                    {field: "country", type: "string", mandatory: true},
                    {field: "code", type: "number"},
                    {field: "holidays", type: "date", multiple: true}
                ]}, $insert: [
                    {country: "India", code: "91", "constitutiondate": "1948-01-26", "isfree": true},
                    {country: "Pakistan", code: "92", "constitutiondate": "1950-01-02", "isfree": true}
                ]
                }
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: COUNTRIES, $sort: {country: 1}});
        }).then(function (data) {
            data = data.result;
//                console.log("data>>>" + JSON.stringify(data));
            expect(data).to.have.length(2);
            expect(data[0].code).to.eql(91);
            return db.query({$collection: {"collection": COUNTRIES, fields: [
                {field: "constitutiondate", type: "date"},
                {field: "country", type: "string", mandatory: true},
                {field: "code", type: "number"},
                {field: "holidays", type: "date", multiple: true}
            ]}, $sort: {country: 1}, $filter: {"code": "91"}});
        }).then(function (data) {
            data = data.result;
            expect(data).to.have.length(1);
            done();
        }).fail(function (err) {
            done(err);
        });
    });
});
describe("Mandatory Validation testcase", function () {
    afterEach(function (done) {
        Testcases.afterEach().then(function () {
            ApplaneDB.removeCollections(["countries", "accounts", "accountgroups"])
        }).then(function () {
            done();
        });
    });
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    });

    it("string type mandatory column in case of insert", function (done) {
        var db = undefined;
        var countryDef = {"collection": "countries", fields: [
            {field: "constitutiondate", type: "date"},
            {field: "country", type: "string", mandatory: true},
            {field: "isfree", type: "boolean"}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(countryDef);
        }).then(function () {
            var updates = {$collection: countryDef, $insert: {code: "91", "constitutiondate": "1900-01-26", "isfree": "not"}}
            return    db.update(updates);
        }).then(function (result) {
            expect(result).not.to.be.ok;
            done();
        }).fail(function (err) {
            var invalidFilterError = err.toString().indexOf("Mandatory fields can not be left blank [country]") != -1;
            if (invalidFilterError) {
                done();
            }
            else {
                done(err);
            }
        }).fail(function (err) {
            done(err);
        });
    });
    it("string type mandatory column in case of update", function (done) {
        var db = undefined;
        var countryDef = {"collection": "countries", fields: [
            {field: "constitutiondate", type: "date"},
            {field: "country", type: "string", mandatory: true},
            {field: "isfree", type: "boolean"}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(countryDef);
        }).then(function () {
            var updates = {$collection: countryDef, $insert: {code: "91", country: "india", "constitutiondate": "1900-01-26", "isfree": "not"}}
            return    db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
//                console.log("data after insert>>>" + JSON.stringify(data));
            var updates = {$collection: countryDef, $update: {_id: data.result[0]._id, $set: {"country": "", code: "+91"}}};
            return db.update(updates);
        }).then(function (result) {
            expect(result).not.to.be.ok;
            done();
        }).fail(function (err) {
            var invalidFilterError = err.toString().indexOf("Mandatory fields can not be left blank [country]") != -1;
            if (invalidFilterError) {
                done();
            }
            else {
                done(err);
            }
        }).fail(function (err) {
            done(err);
        });
    });
    it("boolean type mandatory column in case of insert", function (done) {
        var db = undefined;
        var countryDef = {"collection": "countries", fields: [
            {field: "constitutiondate", type: "date"},
            {field: "country", type: "string", mandatory: true},
            {field: "isfree", type: "boolean", mandatory: true}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(countryDef);
        }).then(function () {
            var updates = {$collection: countryDef, $insert: {code: "91", "constitutiondate": "1900-01-26", "country": "india"}}
            return    db.update(updates);
        }).then(function (result) {
            done();
        }).fail(function (err) {
            done(err);
        });
    });

    it("number type mandatory column in case of insert", function (done) {
        var db = undefined;
        var countryDef = {"collection": "countries", fields: [
            {field: "constitutiondate", type: "date"},
            {field: "country", type: "string", mandatory: true},
            {field: "isfree", type: "boolean", mandatory: true},
            {field: "code", type: "number", mandatory: true}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(countryDef);
        }).then(function () {
            var updates = {$collection: countryDef, $insert: {code: 0, "constitutiondate": "1900-01-26", "country": "india", isfree: "not" }}
            return    db.update(updates);
        }).then(function () {
            done();
        }).fail(function (err) {
            done(err);
        });
    });


    it("object type mandatory column in case of insert", function (done) {
        var db = undefined;
        var countryDef = {"collection": "countries", fields: [
            {field: "constitutiondate", type: "date"},
            {field: "country", type: "string", mandatory: true},
            {field: "isfree", type: "boolean"},
            {field: "states", type: "object", fields: [
                {field: "state", "type": "string"}
            ], mandatory: true}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(countryDef);
        }).then(function () {
            var updates = {$collection: countryDef, $insert: {country: "india", code: "91", "constitutiondate": "1900-01-26", "isfree": "not"}}
            return    db.update(updates);
        }).then(function (result) {
            expect(result).not.to.be.ok;
            done();
        }).fail(function (err) {
            var invalidFilterError = err.toString().indexOf("Mandatory fields can not be left blank [states]") != -1;
            if (invalidFilterError) {
                done();
            }
            else {
                done(err);
            }
        }).fail(function (err) {
            done(err);
        });
    });
    it("nested object type mandatory column in case of insert", function (done) {
        var db = undefined;
        var countryDef = {"collection": "countries", fields: [
            {field: "constitutiondate", type: "date"},
            {field: "country", type: "string", mandatory: true},
            {field: "isfree", type: "boolean"},
            {field: "states", type: "object", fields: [
                {field: "state", "type": "string"},
                {field: "city", "type": "object", mandatory: true, fields: [
                    {field: "cityname", "type": "string", mandatory: true}
                ]}
            ], mandatory: true}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(countryDef);
        }).then(function () {
            var updates = {$collection: countryDef, $insert: {country: "india", code: "91", "constitutiondate": "1900-01-26", "isfree": "not", states: {state: "haryana", city: {area: "hisar"}}}}
            return    db.update(updates);
        }).then(function (result) {
            expect(result).not.to.be.ok;
            done();
        }).fail(function (err) {
            var invalidFilterError = err.toString().indexOf("Mandatory fields can not be left blank [states.city.cityname]") != -1;
            if (invalidFilterError) {
                done();
            }
            else {
                done(err);
            }
        }).fail(function (err) {
            done(err);
        });
    });

    it("object type mandatory column in case of update", function (done) {
        var db = undefined;
        var countryDef = {"collection": "countries", fields: [
            {field: "constitutiondate", type: "date"},
            {field: "country", type: "string", mandatory: true},
            {field: "isfree", type: "boolean"},
            {field: "states", type: "object", fields: [
                {field: "state", "type": "string"}
            ], mandatory: true}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(countryDef);
        }).then(function () {
            var updates = {$collection: countryDef, $insert: {code: "91", country: "india", "constitutiondate": "1900-01-26", "isfree": "not", states: {"state": "HRY"}}}
            return    db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
//                console.log("data after insert>>>" + JSON.stringify(data));
            var updates = {$collection: countryDef, $update: {_id: data.result[0]._id, $unset: {"states": "", code: "+91"}}};
            return db.update(updates);
        }).then(function (result) {
            expect(result).not.to.be.ok;
            done();
        }).fail(function (err) {
            var invalidFilterError = err.toString().indexOf("Mandatory fields can not be left blank [states]") != -1;
            if (invalidFilterError) {
                done();
            }
            else {
                done(err);
            }
        }).fail(function (err) {
            done(err);
        });
    });
    it("object type mandatory column in case of update case 2", function (done) {
        var db = undefined;
        var countryDef = {"collection": "countries", fields: [
            {field: "constitutiondate", type: "date"},
            {field: "country", type: "string", mandatory: true},
            {field: "isfree", type: "boolean"},
            {field: "states", type: "object", fields: [
                {field: "state", "type": "string", mandatory: true}
            ]}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(countryDef);
        }).then(function () {
            var updates = {$collection: countryDef, $insert: {code: "91", country: "india", "constitutiondate": "1900-01-26", "isfree": "not", states: {"state": "HRY"}}}
            return    db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
//                console.log("data after insert>>>" + JSON.stringify(data));
            var updates = {$collection: countryDef, $update: {_id: data.result[0]._id, $set: {"states": {$unset: {state: ""}}, code: "+91"}}};
            return db.update(updates);
        }).then(function (result) {
            expect(result).not.to.be.ok;
            done();
        }).fail(function (err) {
            var invalidFilterError = err.toString().indexOf("Mandatory fields can not be left blank [states.state]") != -1;
            if (invalidFilterError) {
                done();
            }
            else {
                done(err);
            }
        }).fail(function (err) {
            done(err);
        });
    });

    it("array type mandatory column in case of insert", function (done) {
        var db = undefined;
        var countryDef = {"collection": "countries", fields: [
            {field: "constitutiondate", type: "date"},
            {field: "country", type: "string", mandatory: true},
            {field: "isfree", type: "boolean"},
            {field: "states", type: "object", multiple: true, fields: [
                {field: "state", "type": "string"}
            ], mandatory: true}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(countryDef);
        }).then(function () {
            var updates = {$collection: countryDef, $insert: {country: "india", code: "91", "constitutiondate": "1900-01-26", "isfree": "not"}}
            return    db.update(updates);
        }).then(function (result) {
            expect(result).not.to.be.ok;
            done();
        }).fail(function (err) {
            var invalidFilterError = err.toString().indexOf("Mandatory fields can not be left blank [states]") != -1;
            if (invalidFilterError) {
                done();
            }
            else {
                done(err);
            }
        }).fail(function (err) {
            done(err);
        });
    });

    it("array type mandatory column in case of insert case 2", function (done) {
        var db = undefined;
        var countryDef = {"collection": "countries", fields: [
            {field: "constitutiondate", type: "date"},
            {field: "country", type: "string", mandatory: true},
            {field: "isfree", type: "boolean"},
            {field: "states", type: "object", multiple: true, fields: [
                {field: "state", "type": "string"}
            ], mandatory: true}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(countryDef);
        }).then(function () {
            var updates = {$collection: countryDef, $insert: {country: "india", code: "91", "constitutiondate": "1900-01-26", "isfree": "not", states: []}}
            return    db.update(updates);
        }).then(function (result) {
            expect(result).not.to.be.ok;
            done();
        }).fail(function (err) {
            var invalidFilterError = err.toString().indexOf("Mandatory fields can not be left blank [states]") != -1;
            if (invalidFilterError) {
                done();
            }
            else {
                done(err);
            }
        }).fail(function (err) {
            done(err);
        });
    });
    it("array type mandatory column in case of update", function (done) {
        var db = undefined;
        var countryDef = {"collection": "countries", fields: [
            {field: "constitutiondate", type: "date"},
            {field: "country", type: "string", mandatory: true},
            {field: "isfree", type: "boolean"},
            {field: "states", type: "object", fields: [
                {field: "state", "type": "string", mandatory: true}
            ], mandatory: true, multiple: true}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(countryDef);
        }).then(function () {
            var updates = {$collection: countryDef, $insert: {code: "91", country: "india", "constitutiondate": "1900-01-26", "isfree": "not", states: [
                {"state": "HRY"}
            ]}}
            return    db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            var updates = {$collection: countryDef, $update: {_id: data.result[0]._id, $unset: {"states": "", code: "+91"}}};
            return db.update(updates);
        }).then(function (result) {
            expect(result).not.to.be.ok;
            done();
        }).fail(function (err) {
            var invalidFilterError = err.toString().indexOf("Mandatory fields can not be left blank [states]") != -1;
            if (invalidFilterError) {
                done();
            }
            else {
                done(err);
            }
        }).fail(function (err) {
            done(err);
        });
    });

    it("array type mandatory column in case of update  case 2", function (done) {
        var db = undefined;
        var countryDef = {"collection": "countries", fields: [
            {field: "constitutiondate", type: "date"},
            {field: "country", type: "string", mandatory: true},
            {field: "isfree", type: "boolean"},
            {field: "states", type: "object", fields: [
                {field: "state", "type": "string", mandatory: true}
            ], mandatory: true, multiple: true}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(countryDef);
        }).then(function () {
            var updates = {$collection: countryDef, $insert: {code: "91", country: "india", "constitutiondate": "1900-01-26", "isfree": "not", states: [
                {_id: "hry", "state": "HRY"}
            ]}}
            return    db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            var updates = {$collection: countryDef, $update: {_id: data.result[0]._id, $set: {"states": {$update: [
                {_id: "hry", $unset: {state: ""}}
            ]}}}};
            return db.update(updates);
        }).then(function (result) {
            expect(result).not.to.be.ok;
            done();
        }).fail(function (err) {
            var invalidFilterError = err.toString().indexOf("Mandatory fields can not be left blank [states.state]") != -1;
            if (invalidFilterError) {
                done();
            }
            else {
                done(err);
            }
        }).fail(function (err) {
            done(err);
        });
    });
    it("array type mandatory column in case of update  case 3", function (done) {
        var db = undefined;
        var countryDef = {"collection": "countries", fields: [
            {field: "constitutiondate", type: "date"},
            {field: "country", type: "string", mandatory: true},
            {field: "isfree", type: "boolean"},
            {field: "states", type: "object", fields: [
                {field: "state", "type": "string", mandatory: true}
            ], mandatory: true, multiple: true}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(countryDef);
        }).then(function () {
            var updates = {$collection: countryDef, $insert: {code: "91", country: "india", "constitutiondate": "1900-01-26", "isfree": "not", states: [
                {_id: "hry", "state": "HRY"},
                {_id: "pnb", "state": "PUNJAB"}
            ]}}
            return    db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            var updates = {$collection: countryDef, $update: {_id: data.result[0]._id, $set: {"states": {$delete: [
                {_id: "hry"}
            ]}}}};
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
            var updates = {$collection: countryDef, $update: {_id: data.result[0]._id, $set: {"states": {$delete: [
                {_id: "pnb"}
            ]}}}};
            return db.update(updates);
        }).then(function (result) {
            expect(result).not.to.be.ok;
            done();
        }).fail(function (err) {
            var invalidFilterError = err.toString().indexOf("Mandatory fields can not be left blank [states]") != -1;
            if (invalidFilterError) {
                done();
            }
            else {
                done(err);
            }
        }).fail(function (err) {
            done(err);
        });
    });


    it("string type mandatory column in case of delete", function (done) {
        var db = undefined;
        var countryDef = {"collection": "countries", fields: [
            {field: "constitutiondate", type: "date"},
            {field: "country", type: "string", mandatory: true},
            {field: "isfree", type: "boolean"}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(countryDef);
        }).then(function () {
            var updates = {$collection: countryDef, $insert: {_id: "india", code: "91", country: "india", "constitutiondate": "1900-01-26", "isfree": "not"}}
            return    db.update(updates);
        }).then(function (result) {
            var updates = {$collection: countryDef, $delete: {_id: "india"}}
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "countries"});
        }).then(function (data) {
//                console.log("data>>>>after delete>>>" + JSON.stringify(data));
            expect(data.result).to.have.length(0);
            done();
        }).fail(function (err) {
            done(err);
        });
    });

    it("fk type mandatory column in case of insert", function (done) {
        var db = undefined;
        var accountGroupDef = {"collection": "accountgroups", "fields": [
            {field: "name", type: "string"}
        ]}

        var accountDef = {"collection": "accounts", fields: [
            {field: "name", type: "string"},
            {field: "accountgroupid", type: "fk", mandatory: true, collection: "accountgroups", set: ["name"]}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(accountGroupDef);
        }).then(function () {
            return ApplaneDB.registerCollection(accountDef);
        }).then(function () {
            var updates = [
                {$collection: accountGroupDef, $insert: {_id: "asset", name: "asset"}},
                {$collection: accountDef, $insert: {_id: "salary", name: "salary"}}
            ];
            return    db.update(updates);
        }).then(function (result) {
            expect(result).not.to.be.ok;
            done();
        }).fail(function (err) {
            var invalidFilterError = err.toString().indexOf("Mandatory fields can not be left blank [accountgroupid]") != -1;
            if (invalidFilterError) {
                done();
            }
            else {
                done(err);
            }
        }).fail(function (err) {
            done(err);
        });
    });
    it("fk type mandatory column in case of update", function (done) {
        var db = undefined;
        var accountGroupDef = {"collection": "accountgroups", "fields": [
            {field: "name", type: "string"}
        ]}

        var accountDef = {"collection": "accounts", fields: [
            {field: "name", type: "string"},
            {field: "accountgroupid", type: "fk", mandatory: true, collection: "accountgroups", set: ["name"]}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(accountGroupDef);
        }).then(function () {
            return ApplaneDB.registerCollection(accountDef);
        }).then(function () {
            var updates = [
                {$collection: accountGroupDef, $insert: {_id: "asset", name: "asset"}},
                {$collection: accountDef, $insert: {_id: "salary", name: "salary", accountgroupid: {$query: {name: "asset"}}}}
            ];
            return db.update(updates);
        }).then(function () {
            var updates = {$collection: accountDef, $update: {_id: "salary", $unset: {accountgroupid: ""}}}
            return db.update(updates);
        }).then(function (result) {
            expect(result).not.to.be.ok;
            done();
        }).fail(function (err) {
            var invalidFilterError = err.toString().indexOf("Mandatory fields can not be left blank [accountgroupid]") != -1;
            if (invalidFilterError) {
                done();
            }
            else {
                done(err);
            }
        }).fail(function (err) {
            done(err);
        });
    });

    it("child type mandatory column in case of insert", function (done) {
        var collectionsToRegister = [
            {
                collection: "orderss",
                fields: [
                    {field: "order_no", type: "string"}     ,
                    {field: "deliveries", type: "object", multiple: true, query: JSON.stringify({$type: "child", $query: {$collection: "deliveriess"}, $fk: "orderid"})}
                ]
            },
            {
                collection: "deliveriess",
                fields: [
                    {field: "orderid", collection: "orderss", type: "fk", set: ["order_no"]},
                    {field: "delivery_no", type: "string", mandatory: true},
                    {field: "delivery_code", type: "string"}
                ]
            }
        ];
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(collectionsToRegister);
        }).then(function () {
            var orderUpdates = [
                {$collection: "orderss", $insert: [
                    {_id: 1, order_no: "123",
                        deliveries: [
                            {delivery_code: "xx1"}
                        ]
                    }
                ]
                }
            ];
            return db.update(orderUpdates);
        }).then(function (result) {
            expect(result).not.to.be.ok;
            done();
        }).fail(function (err) {
            var invalidFilterError = err.toString().indexOf("Mandatory fields can not be left blank [delivery_no]") != -1;
            if (invalidFilterError) {
                done();
            }
            else {
                done(err);
            }
        }).fail(function (err) {
            done(err);
        })
    })

    it("child type mandatory column in case of insert case 2", function (done) {
        var collectionsToRegister = [
            {
                collection: "orderss",
                fields: [
                    {field: "order_no", type: "string"},
                    {field: "order_amount", type: "currency", mandatory: true},
                    {field: "deliveries", type: "object", multiple: true, query: JSON.stringify({$type: "child", $query: {$collection: "deliveriess"}, $fk: "orderid"})}
                ]
            },
            {
                collection: "deliveriess",
                fields: [
                    {field: "orderid", collection: "orderss", type: "fk", set: ["order_no"]},
                    {field: "delivery_no", type: "string", mandatory: true},
                    {field: "delivery_code", type: "string"},
                    {field: "delivery_amount", type: "currency", mandatory: true}
                ]
            }
        ];
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(collectionsToRegister);
        }).then(function () {
            var orderUpdates = [
                {$collection: "orderss", $insert: [
                    {_id: 1, order_no: "123", order_amount: {"amount": 100, type: {"currency": "INR"}},
                        deliveries: [
                            {delivery_code: "xx1", delivery_no: "1224"}
                        ]
                    }
                ]
                }
            ];
            return db.update(orderUpdates);
        }).then(function (result) {
            expect(result).not.to.be.ok;
            done();
        }).fail(function (err) {
            var invalidFilterError = err.toString().indexOf("Mandatory fields can not be left blank [delivery_amount]") != -1;
            if (invalidFilterError) {
                done();
            }
            else {
                done(err);
            }
        }).fail(function (err) {
            done(err);
        })
    })
    it("child type mandatory column in case of update", function (done) {
        var collectionsToRegister = [
            {
                collection: "orderss",
                fields: [
                    {field: "order_no", type: "string"}     ,
                    {field: "deliveries", type: "object", multiple: true, query: JSON.stringify({$type: "child", $query: {$collection: "deliveriess"}, $fk: "orderid"})}
                ]
            },
            {
                collection: "deliveriess",
                fields: [
                    {field: "orderid", collection: "orderss", type: "fk", set: ["order_no"]},
                    {field: "delivery_no", type: "string", mandatory: true},
                    {field: "delivery_code", type: "string"}
                ]
            }
        ];
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            return ApplaneDB.registerCollection(collectionsToRegister);
        }).then(function () {
            var orderUpdates = [
                {$collection: "orderss", $insert: [
                    {_id: 1, order_no: "123",
                        deliveries: [
                            {delivery_code: "xx1", delivery_no: "xx111"}
                        ]
                    }
                ]
                }
            ];
            return db.update(orderUpdates);
        }).then(function (result) {
//                console.log("result>>>>>" + JSON.stringify(result));
            var updates = [
                {$collection: "orderss", $update: [
                    {_id: 1, $set: {order_no: "123", deliveries: {$update: [
                        {$query: {delivery_code: "xx1"}, $set: {delivery_code: "xx2"}}
                    ]}}
                    }
                ]
                }
            ]
            return db.update(updates);
        }).then(function () {
            return db.query({$collection: "deliveriess"});
        }).then(function (data) {
            expect(data.result).to.have.length(1);
            expect(data.result[0].delivery_no).to.eql("xx111");
            expect(data.result[0].delivery_code).to.eql("xx2");
            done();
        }).fail(function (err) {
            done(err);
        })
    })


});
