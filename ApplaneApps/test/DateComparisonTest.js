var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Config = require("ApplaneDB/test/config.js").config;
var Testcases = require("ApplaneDB/test/TestCases.js");


describe("DateComparison testcase", function () {
    beforeEach(function (done) {
        return Testcases.beforeEach(done);
    });
    afterEach(function (done) {
        return Testcases.afterEach(done);
    });
    it("DateComparison TestCase", function (done) {
        var db = undefined;
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"expense"},
                        {collection:"eemployees"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var functionsToRegister = [
                    {name:"InvoiceJob", source:"NorthwindTestCase/lib", type:"js"}
                ]
                return ApplaneDB.registerFunction(functionsToRegister);
            }).then(
            function () {
                var updates = [
                    {$collection:"pl.fields", $insert:[
                        {"visibility":true, field:"name", type:"string", collectionid:{$query:{collection:"eemployees"}}},
                        {field:"sales", type:"currency", collectionid:{$query:{collection:"expense"}}},
                        {field:"date", type:"date", collectionid:{$query:{collection:"expense"}}},
                        {field:"employeeid", type:"fk", "collection":"eemployees", "displayField":"name", "set":["name"], collectionid:{$query:{collection:"expense"}}},
                        {"aggregate":"sum", "visibility":true, visibilityGrid:true, field:"totalsales", collectionid:{$query:{collection:"eemployees"}}, "type":"object", "ui":"currency", query:JSON.stringify({"$query":{"$collection":"expense", "$group":{"_id":null, "sales":{"$sum":"$sales"}}, "$filter":{"date":"$date"}}, "$fk":"employeeid", "$type":{"scalar":"sales"}})}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.update({$collection:"eemployees", $insert:[
                    {name:"Manjeet"},
                    {name:"Sachin"},
                    {name:"Rohit"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.currencies", $insert:{currency:"INR"}});
            }).then(
            function () {
                return db.update({$collection:"expense", $insert:[
                    {sales:{"amount":"150", type:{$query:{"currency":"INR"}}}, "date":new Date("2013-12-31"), "employeeid":{"$query":{"name":"Rohit"}}},
                    {sales:{"amount":"250", type:{$query:{"currency":"INR"}}}, "date":new Date("2013-12-31"), "employeeid":{"$query":{"name":"Manjeet"}}},
                    {sales:{"amount":"350", type:{$query:{"currency":"INR"}}}, "date":new Date("2013-12-31"), "employeeid":{"$query":{"name":"Sachin"}}},
                    {sales:{"amount":"150", type:{$query:{"currency":"INR"}}}, "date":new Date("2014-01-31"), "employeeid":{"$query":{"name":"Rohit"}}},
                    {sales:{"amount":"250", type:{$query:{"currency":"INR"}}}, "date":new Date("2014-02-28"), "employeeid":{"$query":{"name":"Rohit"}}},
                    {sales:{"amount":"100", type:{$query:{"currency":"INR"}}}, "date":new Date("2014-01-01"), "employeeid":{"$query":{"name":"Manjeet"}}},
                    {sales:{"amount":"200", type:{$query:{"currency":"INR"}}}, "date":new Date("2014-02-01"), "employeeid":{"$query":{"name":"Sachin"}}},
                    {sales:{"amount":"300", type:{$query:{"currency":"INR"}}}, "date":new Date("2014-01-15"), "employeeid":{"$query":{"name":"Sachin"}}},
                    {sales:{"amount":"400", type:{$query:{"currency":"INR"}}}, "date":new Date("2014-02-15"), "employeeid":{"$query":{"name":"Manjeet"}}},
                    {sales:{"amount":"500", type:{$query:{"currency":"INR"}}}, "date":new Date("2014-03-01"), "employeeid":{"$query":{"name":"Rohit"}}},
                    {sales:{"amount":"500", type:{$query:{"currency":"INR"}}}, "date":new Date("2014-03-01"), "employeeid":{"$query":{"name":"Manjeet"}}},
                    {sales:{"amount":"500", type:{$query:{"currency":"INR"}}}, "date":new Date("2014-03-01"), "employeeid":{"$query":{"name":"Sachin"}}}
                ]});
            }).then(
            function () {
                var updates = [
                    {$collection:{collection:"pl.qviews", fields:[
                        {field:"id", type:"string"},
                        {"field":"collection", type:"fk", collection:"pl.collections", displayField:"collection", set:["collection"]},
                        {"field":"mainCollection", type:"fk", collection:"pl.collections", displayField:"collection", set:["collection"]}
                    ]}, $insert:[
                        {id:"expense_report", collection:{$query:{collection:"eemployees"}}, mainCollection:{$query:{collection:"expense"}}, "spanreport":JSON.stringify({"span":"month", "value":[
                            {"field":"totalsales"}
                        ], "date":"date"}), "queryEvent":JSON.stringify([
                            {"event":"onBatchResult", "function":"InvoiceJob.onBatchResult"}
                        ])}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.update({$collection:"pl.actions", $insert:{"index":1000, "id":"date", "label":"date", "type":"filter", "filterType":"date", "ui":"date", "asParameter":true, "field":"date", "collectionid":{"$query":{"collection":"eemployees"}}}})
            }).then(
            function () {
                var v = {};
                v.id = "expense_report";
                v.$parameters = {"date":{"$gte":"2013-12-01T00:00:00.000Z", "$lt":"2014-03-02T00:00:00.000Z"}};
                return db.invokeFunction("view.getView", [v]);
            }).then(
            function (result) {
                console.log("result>>>>>>>>>>" + JSON.stringify(result.data.result));
                expect(result.data.result).to.have.length(3);
                expect(result.data.result[0].name).to.eql("Rohit");
                expect(result.data.result[0].jobcalled).to.eql(true);
                expect(result.data.result[0].december2013.totalsales.amount).to.eql(150);
                expect(result.data.result[0].january2014.totalsales.amount).to.eql(150);
                expect(result.data.result[0].february2014.totalsales.amount).to.eql(250);

                expect(result.data.result[1].december2013.totalsales.amount).to.eql(350);
                expect(result.data.result[1].january2014.totalsales.amount).to.eql(300);
                expect(result.data.result[1].february2014.totalsales.amount).to.eql(200);

                expect(result.data.result[2].december2013.totalsales.amount).to.eql(250);
                expect(result.data.result[2].january2014.totalsales.amount).to.eql(100);
                expect(result.data.result[2].february2014.totalsales.amount).to.eql(400);

                expect(result.data.result[0].january2014.totalsales__percentage).to.eql(0);
                expect(result.data.result[1].january2014.totalsales__percentage).to.eql(-14.285714285714285);
                expect(result.data.result[2].january2014.totalsales__percentage).to.eql(-60);

                expect(result.data.result[0].february2014.totalsales__percentage).to.eql(66.66666666666666);
                expect(result.data.result[1].february2014.totalsales__percentage).to.eql(-33.33333333333333);
                expect(result.data.result[2].february2014.totalsales__percentage).to.eql(300);

                expect(result.data.aggregateResult.january2014_totalsales.amount).to.eql(550)
                expect(result.data.aggregateResult.february2014_totalsales.amount).to.eql(850);
                expect(result.data.aggregateResult.december2013_totalsales.amount).to.eql(750);

                expect(result.data.aggregateResult.january2014_totalsales__percentage).to.eql(-26.666666666666668);
                expect(result.data.aggregateResult.february2014_totalsales__percentage).to.eql(54.54545454545454);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
})