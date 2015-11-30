var Q = require("q");
var Constants = require("ApplaneDB/lib/Constants.js");
var compression = require('compression');
var fs = require('fs');
var ApplaneAppsConfig = require("./Config.js");

exports.configure = function (app, config) {
    var d = Q.defer();
    config = config || {};
    require("ApplaneDB/lib/CommandLineArguments.js").setConfig(config);
    if (config.PORT) {
        ApplaneAppsConfig.PORT = config.PORT;
    }
    if (config.CPUS !== undefined) {
        ApplaneAppsConfig.CPUS = config.CPUS;
    }
    if (config.SERVER_START_UP !== undefined) {
        ApplaneAppsConfig.SERVER_START_UP = config.SERVER_START_UP;
    }
    var cookieParser = require('cookie-parser');
    var express = require("express");
//    var cacheTime = 86400000 * 1;     // 7 days
    var cacheTime = 60000 * 60;     // 1 minute
    app.use(compression());
    app.use(cookieParser());

    var staticPath = __dirname + '/public';

    app.use(function (req, res, next) {
        // if user try to go to login page again, if already login , this will redirect him to the opened page--Rajit garg 31/mar/2016
        if (req.path === "/login" || req.path === "/login.html") {
            var token = req.cookies && req.cookies.token ? req.cookies.token : undefined;
            if (token) {
                validateToken(token).then(function (valid) {
                    if (valid) {
                        res.redirect('/');
                    } else {
                        res.clearCookie("token");
                        modifyURL(req, next);
                    }
                }).fail(function (err) {
                    writeJSONResponse(res, err);
                })
            } else {
                //token not available
                modifyURL(req, next);
            }
        } else if (req.path === "/" || req.path === "/index.html") {
            var token = req.cookies && req.cookies.token ? req.cookies.token : undefined;
            if (token) {
                validateToken(token).then(function (valid) {
                    if (!valid) {
                        res.clearCookie("token");
                        res.redirect('/login');
                    }
                    next();
                }).fail(function (err) {
                    writeJSONResponse(res, err);
                })
            } else {
                res.redirect('/login');
            }
        } else if (req.path == "/images/applanelogo.png" && req.headers.host === "singhania.applane.com") {           // set hardcode check for singhania login page logo as it required to change the login logo only singhania Case.
            req.url = '/images/singhania-logo.png';
            next();
        } else if (req.path == "/images/applanelogo.png" && (req.headers.host === "arihantchhindwara.applane.com" || req.headers.host === "dpsaurangabad.applane.com")) {           // set hardcode check for arihantchhindwara  and dpsaurangabad login page logo as it is required to change the login logo in arihantchhindwara and dpsaurangabad Case.
            req.url = '/images/dps-arihanto.png';
            next();
        } else if (req.path == "/images/applanelogo.png" && req.headers.host === "citycrown.applane.com") {           // set hardcode check for crownCity login page logo as it required to change the login logo only crownCity Case.
            req.url = '/images/city-crown-logo.jpg';
            next();
        } else if (req.path == "/images/applanelogo.png" && req.headers.host === "mcgm.applane.com") {           // set hardcode check for crownCity login page logo as it required to change the login logo only crownCity Case.
            req.url = '/images/mcgm.png';
            next();
        } else if (req.path == "/images/applanelogo.png" && req.headers.host === "beta.mcgm.applane.com") {           // set hardcode check for crownCity login page logo as it required to change the login logo only crownCity Case.
            req.url = '/images/mcgm.png';
            next();
        } else {
            next();
        }
    });
    app.use(express.static(staticPath, { maxAge: cacheTime }));


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

exports.onMasterServerStartUp = function (pid) {
    return require("ApplaneDB").HTTP.onMasterServerStartUp(pid);
};

exports.handleServerMessages = function (cluster, pingHistory, worker) {
    require("ApplaneDB").HTTP.handleClusterServerMessages(cluster, pingHistory, worker);
};

exports.handleFaultyWorkers = function (cluster, pingHistory) {
    require("ApplaneDB").HTTP.handleFaultyWorkers(cluster, pingHistory);
};

function validateToken(token) {
    return require("ApplaneDB").getAdminDB().then(function (adminDB) {
        return adminDB.query({$collection: "pl.connections", $filter: {token: token}});
    }).then(function (data) {
        if (data && data.result && data.result.length > 0) {
            return true;
        } else {
            return false;
        }
    })
}

function modifyURL(req, next) {
    if (req.headers.host === "beta.mcgm.applane.com") {          //// set hardcode check for crownCity login page logo as it required to change the login logo only crownCity Case.
        req.url = '/mcgm.html';
    } else {
        req.url = '/login.html';
    }
    next();
}


function writeJSONResponse(res, result) {
    if (result instanceof Error) {
        var jsonResponseType = {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS"};
        res.writeHead(417, jsonResponseType);
        res.write(JSON.stringify({response: result.message, stack: result.stack}));
        res.end();
    }
}