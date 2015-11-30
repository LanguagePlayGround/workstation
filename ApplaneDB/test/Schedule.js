/**
 *
 *  mocha --recursive --timeout 1500 -g ScheduleNextDate --reporter spec
 *  mocha --recursive --timeout 150000 -g Scheduletestcase --reporter spec
 *
 */


var expect = require('chai').expect
var Moment = require('moment');
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var OPTIONS = {};
var Testcases = require("./TestCases.js");
var DEFAULT_TIME_ZONE = -19800000 / (60 * 1000);
var Schedule = require("../lib/modules/Schedule.js");

describe("Scheduletestcase", function () {

    describe("ScheduleNextDate", function () {

        it("Minutely Schedule without startsOn", function (done) {
            var currentDate = Moment().startOf("day").add("minutes", 30).toDate();
            var when = {repeats:"Minutely", repeatEvery:30};
            var newDueDate = Schedule.getNextDueDate(when, currentDate);
            console.log(newDueDate);
            currentDate = Moment(currentDate).add("minutes", 30).toDate();
            expect(newDueDate.toString()).to.equal(currentDate.toString());
            done();
        })

        it("Minutely Schedule with startsOn", function (done) {
            var currentDate = Moment().startOf("day").add("minutes", 30).toDate();
            var startsOn = Moment(currentDate).add("days", 5).startOf("day").add("minutes", 300).toDate();
            var when = {repeats:"Minutely", repeatEvery:30, startsOn:startsOn};
            var newDueDate = Schedule.getNextDueDate(when, currentDate);
            console.log(newDueDate);
            expect(newDueDate.toString()).to.equal(startsOn.toString());
            done();
        })

        it("Minutely Schedule with startsOn nad nextDueOn", function (done) {
            var currentDate = Moment().add("days", 3).startOf("day").add("minutes", 20).toDate();
            var startsOn = Moment().subtract("days", 1).startOf("day").add("minutes", 300).toDate();
            var nextDueOn = Moment().add("days", 1).startOf("day").add("minutes", 450).toDate();
            var when = {repeats:"Minutely", repeatEvery:30, startsOn:startsOn, nextDueOn:nextDueOn};
            var newDueDate = Schedule.getNextDueDate(when, currentDate);
            console.log(newDueDate);
            currentDate= Moment(currentDate).add("minutes", 10).toDate();
            expect(newDueDate.toString()).to.equal(currentDate.toString());
            done();
        })

        it("Hourly Schedule without startsOn", function (done) {
            var currentDate = Moment().startOf("day").add("minutes", 30).toDate();
            var when = {repeats:"Hourly", repeatEvery:3};
            var newDueDate = Schedule.getNextDueDate(when, currentDate);
            console.log(newDueDate);
            currentDate = Moment(currentDate).add("minutes", 180).toDate();
            expect(newDueDate.toString()).to.equal(currentDate.toString());
            done();
        })

        it("Hourly Schedule with startsOn", function (done) {
            var currentDate = Moment().startOf("day").add("minutes", 30).toDate();
            var startsOn = Moment(currentDate).add("days", 5).startOf("day").add("minutes", 300).toDate();
            var when = {repeats:"Hourly", repeatEvery:6, startsOn:startsOn};
            var newDueDate = Schedule.getNextDueDate(when, currentDate);
            console.log(newDueDate);
            expect(newDueDate.toString()).to.equal(startsOn.toString());
            done();
        })

    })

});
