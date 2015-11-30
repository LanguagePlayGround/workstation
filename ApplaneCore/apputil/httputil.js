var QueryString = require("querystring");
var http = require("http");

exports.executeService = function (service, params, callback) {
    try {
        if (!callback || (typeof callback != 'function')) {
            throw new Error("Callback not defined");
        }
        var path = service.path;
        var queryString = "";
        if (Object.keys(params).length > 0) {
            queryString = QueryString.stringify(params);
        }
        var serverOptions = {
            hostname:service.hostname,
            port:service.port,
            path:path,
            method:service.method,
            headers:{
                'Content-Type':'application/x-www-form-urlencoded',
                'Content-Length':queryString.length
            }
        };
        var req = http.request(serverOptions, function (res) {
            try {
                if (params.response) {
                    res.setEncoding('binary');
                } else {
                    res.setEncoding('utf8');
                }
                var body = '';
                res.on('data', function (chunk) {
                    body += chunk;
                });
                res.on('end', function () {
                    try {
                        callback(null, body);
                    } catch (e) {
                        callback(e);
                    }
                });

            } catch (e) {
                callback(e);
            }

        });
        req.on('error', function (err) {
            callback(err);
        });
        req.write(queryString);
        req.end();
    } catch (e) {
        callback(e);
    }
}

exports.executeServiceAsPromise = function (service, params, options) {
    var Q = require("q");
    var d = Q.defer();
    if (options && options.requestModule) {
        if (service && service.hostname) {
            var requestOptions = {
                headers:{'user-agent':'node.js'},
                rejectUnauthorized:false
            };
            service.hostname = service.hostname.indexOf("http") === 0 ? service.hostname : "http://" + service.hostname;
            var request = require('request');
            request(service.hostname, requestOptions, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    d.resolve(body);
                } else {
                    d.reject(error);
                }
            })
        } else {
            d.reject(new Error("hostname not found..in service>>>>>>" + JSON.stringify(service)));
        }
    } else {
        var path = service.path;
        var queryString = "";
        if (params && Object.keys(params).length > 0) {
            queryString = QueryString.stringify(params);
        }
        var serverOptions = {
            hostname:service.hostname,
            port:service.port,
            path:path,
            method:service.method,
            headers:{
                'Content-Type':'application/x-www-form-urlencoded',
                'Content-Length':queryString.length
            }
        };
        var req = http.request(serverOptions, function (res) {

            if (params && params.response) {
                res.setEncoding('binary');
            } else {
                res.setEncoding('utf8');
            }
            var body = '';
            res.on('data', function (chunk) {
                body += chunk;
            });
            res.on('end', function () {
                d.resolve(body);

            });


        });
        req.on('error', function (err) {
            d.reject(err);
        });
        req.write(queryString);
        req.end();
    }
    return d.promise;
};