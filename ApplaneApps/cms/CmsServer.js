var express = require('express');
var app = express();
var ApplaneCmsConfig = require("./Config.js");
var Http = require("./lib/Http.js");
var CmsPage = require("./lib/CmsPage.js");

var onRequest = function (req, res) {
    try {
        var url = require('url').parse(req.url, true);
        var uri = url.pathname;
        var domain = req.headers.host;
        var wwwIndex = domain.indexOf("www.");
        if (wwwIndex >= 0) {
            domain = domain.substring(wwwIndex + 4);
        }
        var parameters = getRequestParams(req);// not used
        var responseType = {"Content-Type": "text/html", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS"};
        var param = {};
        param.domain = domain;
        param.uri = uri;
        param.queryparam = url.query;
        if (req.cookies) {
            param.cookies = req.cookies;
        }
        CmsPage.getData(param).then(function (result) {
            if (result && result.binary) {
                res.writeHead(200, result.headers);
                res.write(result.binary);
                res.end();
            } else {
                res.writeHead(200, responseType);
                res.write(result);
                res.end();
            }
        }).fail(function (err) {
                res.writeHead(417, responseType);
                var error = {code: err.code, message: err.message, stack: err.stack};
                res.write(JSON.stringify(error));
                res.end();
            });

    } catch (err) {
        res.writeHead(404, responseType);
        res.write("Error[" + err.stack + "]");
        res.end();
    }
}

function getRequestParams(req) {
    var allParams = {};
    var params = req.params || {};
    var body = req.body || {};
    var query = req.query || {};
    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            allParams[key] = params[key];
        }
    }
    for (var key in body) {
        if (allParams[key] === undefined) {
            allParams[key] = body[key];
        }
    }
    for (var key in query) {
        if (allParams[key] === undefined) {
            allParams[key] = query[key];
        }
    }
    return allParams;
}

app.all("/rest/runningStatus", function (req, res) {
    res.writeHead(200);
    res.write("Server Running");
    res.end();
});
app.all("*", onRequest);

return Http.configure(app).then(function () {
    require('http').createServer(app).listen(ApplaneCmsConfig.PORT);
});
