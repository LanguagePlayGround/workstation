exports.search = function (parameters, db, options) {
    var item = parameters.item;
    var CREF_DEFAULT_VALUE = "http://applanecrmhrd.appspot.com/upload?download={%22key%22:%22AMIfv95gudy0tqTPcS0qjpjiNptpPYGtj3IaX2sp-8sMHW5FX3rodmrP_SJHB8_8t34m4Q7yX3Y93UA0H-pTWyRC58PuonP7nDV0K-27InL80V9eH-IqeXcx4YS_5jNCIWTfpBCGPPoUIz2SUhpsMc05MwK98Mdu6Jvl4cgtVdvPjhg5_EFAbwU%22}";
    var KEY_VALUE = "AIzaSyCwfBe3U-vYWhGfM1CpjEnVOwZh-PpU8Ps";
    var service = {};
    service.hostname = "www.googleapis.com";
    var QueryString = require("querystring");
    var params = {};
    params.key = KEY_VALUE;
    params.cref = CREF_DEFAULT_VALUE;
    params.q = item;
    params.alt = "json";
    params.searchType = "image";
    params.imgSize = "medium";
    var queryString = "";
    queryString = QueryString.stringify(params);
    service.path = "/customsearch/v1?" + queryString;
    service.method = "GET";
    var q = require("q");
    var d = q.defer();
    executeService(service, {}, function (err, response) {
        if (err) {
            console.log("err" + err);
        } else {
            if (typeof  response === "string") {
                response = JSON.parse(response);
            }
            var selectedItem = undefined;
            if (response && response.items) {
                var items = response.items;
                for (var i = 0; i < items.length; i++) {
                    var item = items[i];
                    var image = item.image;
                    if (image !== undefined && image.thumbnailLink !== undefined) {
                        selectedItem = item;
                        break;
                    }
                }
            }
            d.resolve({result:[
                selectedItem
            ], item:parameters.item});
        }
    })
    return d.promise;
}

function executeService(service, params, callback) {
    try {
        var QueryString = require("querystring");
        var https = require("https");
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
        var req = https.request(serverOptions, function (res) {
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