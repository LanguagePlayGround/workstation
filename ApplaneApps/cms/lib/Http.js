var ApplaneCmsConfig = require("../Config.js");
var Q = require("q");
var compression = require('compression');

exports.configure = function (app, config) {
    var d = Q.defer();
    config = config || {};
    require("ApplaneDB/lib/CommandLineArguments.js").setConfig(config);
    if (config.PORT) {
        ApplaneCmsConfig.PORT = config.PORT;
    }
    if (config.CPUS !== undefined) {
        ApplaneCmsConfig.CPUS = config.CPUS;
    }

    var cookieParser = require('cookie-parser');
    var express = require("express");
    app.use(compression());
    app.use(cookieParser());

    var path = require.resolve("ApplaneDB");
    var indexOfIndexJS = path.indexOf("index.js");
    path = path.substring(0, indexOfIndexJS) + "/public";
    app.use(express.static(path));
    if (config.BASE_URL) {
        app.use(express.static(config.BASE_URL));
    }
    var ApplaneDB = require("ApplaneDB");
    ApplaneDB.configure(config).then(
        function () {
            var ApplaneDBHttp = require("ApplaneDB").HTTP;
            ApplaneDBHttp.configure(app);
        }).then(
        function () {
            d.resolve();
        }).catch(function (e) {
            d.reject(e);
        });
    return d.promise;
};