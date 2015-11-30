/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 26/8/14
 * Time: 4:46 PM
 * To change this template use File | Settings | File Templates.
 */


var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Cron = require("ApplaneDB/lib/Cron.js");
var Notifications = require("ApplaneDB/lib/Notifications.js");
var CommandLineArg = require("ApplaneDB/lib/CommandLineArguments.js");
var http = require('http');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var config = {};
CommandLineArg.setConfig(config);
ApplaneDB.configure(config).then(
    function () {
        configure(app);
    }).then(
    function () {
        var port = config.PORT;
        console.log("port>>>>" + port);
        http.createServer(app).listen(port);
    }).then(
    function () {
        return updateProcessing("pl.crons", {name:1});
    }).then(
    function () {
        return updateProcessing("pl.notifications", {id:1});
    }).then(
    function () {
        return removeAppLocks();
    }).then(
    function () {
        Cron.runCron();
    }).then(
    function () {
        Cron.runAdminCron();
    }).then(
    function () {
        Notifications.executeNotifications();
    }).then(
    function () {
        console.log("cron server restarted.." + new Date());
    }).then(
    function () {
    }).fail(function (err) {
        console.log("errr>>>>>" + err.stack);
        console.log("errr>>>>>" + err.message);
        var options = {to:"sachin.bansal@daffodilsw.com", from:"developer@daffodilsw.com", subject:"Error in CronServer"};
        var html = '';
        html += "<b>ERROR</b>" + err.message + "<br>";
        html += "<b>STACK</b>" + err.stack + "<br>";
        html += "<b>DATE</b>" + new Date() + "<br>";
        options.html = html;
        require("ApplaneDB/lib/MailService.js").sendFromAdmin(options);
    })

function removeAppLocks() {
    return ApplaneDB.getAdminDB().then(
        function (adminDB) {
            return adminDB.mongoUpdate({$collection:"pl.applocks", $delete:{"lock.type":{$in:["Notification", "Cron"]}, db:adminDB.db.databaseName}}, {multi:true});
        })
}

function updateProcessing(collectionName, fields) {
    var html = '';
    var adminDB = undefined;
    var processingData = undefined;
    return ApplaneDB.getAdminDB().then(
        function (adb) {
            adminDB = adb;
            return adminDB.query({$collection:collectionName, $filter:{processing:true}, $fields:fields, $modules:false, $events:false});
        }).then(
        function (result) {
            processingData = result.result;
            if (processingData.length > 0) {
                return adminDB.mongoUpdate({$collection:collectionName, $update:{$query:{processing:true}, $unset:{processing:""}}}, {multi:true});
            }
        }).then(
        function () {
            if (processingData.length > 0) {
                html += "<b>Processing Data for collection " + collectionName + " : <b>" + JSON.stringify(processingData);
                html += "<b>DATE</b>" + new Date() + "<br>";
            }
        }).fail(
        function (err) {
            html += "<b>ERROR</b>" + err.message + "<br>";
            html += "<b>STACK</b>" + err.stack + "<br>";
        }).then(function () {
            if (html) {
                var options = {to:["sachin.bansal@daffodilsw.com", "rohit.bansal@daffodilsw.com"], from:"developer@daffodilsw.com", subject:"Processing Data on restart Cronserver."};
                options.html = html;
                require("ApplaneDB/lib/MailService.js").sendFromAdmin(options);
            }
        })
}

function configure(app) {
    app.use(function (req, res, next) {
        var urlParser = require('url');
        var url = urlParser.parse(req.url, true);
        var contentType = req.header("content-type");
        if (contentType && contentType.indexOf("application/json") != -1) {
            bodyParser.json({limit:1024 * 1024 * 10})(req, res, next);
        } else {
            bodyParser.urlencoded({ extended:true, limit:1024 * 1024 * 10})(req, res, next);
        }
    });

    app.all('/rest/runningStatus', function (req, res) {
        return Cron.runningStatus(req, res)
    });


}
