require('newrelic');

var express = require('express');
var http = require('http');
var app = express();
var cluster = require('cluster');
var numCPUs = require('os').cpus().length;
var isMaster = cluster.isMaster;
var ApplaneAppsHttp = require("ApplaneApps/Http.js");
var Config = require("./Config.js");
var sTime = new Date();
if (isMaster) {
    ApplaneAppsHttp.configure(app).then(
        function () {
            return ApplaneAppsHttp.onMasterServerStartUp();
        }).then(
        function () {
            var timeTaken = new Date() - sTime;
            console.log("  Time Taken :  " + timeTaken + " ms");
            for (var i = 0; i < numCPUs; i++) {
                console.log(".......Worker forked  :  " + (i + 1));
                cluster.fork();
            }
            ApplaneAppsHttp.handleServerMessages(cluster);

            cluster.on('exit', function (worker, code, signal) {
                console.log('worker ' + worker.process.pid + ' died');
                cluster.fork();
            });
        }).fail(function (err) {
            console.log("error in starting server >>>>" + err + " >>>>>>>>>stack>>>>>> " + err.stack);
        });
} else {
    ApplaneAppsHttp.handleServerMessages(cluster);
    ApplaneAppsHttp.configure(app).then(
        function () {
            var port = Config.PORT;
            http.createServer(app).listen(port);
        }).fail(function (err) {
            console.log("errr>>>>>>>>>>>>>" + err + ">>>>>>stack>>>>>>" + err.stack);
        })
}
