var http = require('http');
var cluster = require('cluster');
var express = require('express');
var app = express();
var ApplaneAppsHttp = require("ApplaneApps/Http.js");
var Config = require("./Config.js");
var sTime = new Date();
var pingHistory = {};

if (cluster.isMaster) {
    ApplaneAppsHttp.configure(app).then(
        function () {
            if (Config.SERVER_START_UP) {
                return ApplaneAppsHttp.onMasterServerStartUp();
            }
        }).then(
        function () {
            console.log("  Time Taken :  " + (new Date() - sTime) + " ms");
            ApplaneAppsHttp.handleFaultyWorkers(cluster, pingHistory);
            for (var i = 0; i < Config.CPUS; i++) {
                cluster.fork();
            }
            cluster.on('fork', function (worker) {
                console.log('worker ' + worker.workerID + ' forked : ' + worker.process.pid);
                ApplaneAppsHttp.handleServerMessages(cluster, pingHistory);
            });
            cluster.on('exit', function (worker) {
                var pid = worker.process.pid;
                console.log('worker ' + worker.workerID + ' died : ' + pid);
                return ApplaneAppsHttp.onMasterServerStartUp(pid).then(function () {
                    cluster.fork();
                })
            });
        }).fail(function (err) {
            console.error("Error : " + err + " \n Stack : " + err.stack);
        });
} else {
    ApplaneAppsHttp.handleServerMessages(cluster, pingHistory);
    ApplaneAppsHttp.configure(app).then(
        function () {
            var port = Config.PORT;
            http.createServer(app).listen(port);
        }).fail(function (err) {
            console.error("Error : " + err + " \n Stack : " + err.stack);
        })
}
