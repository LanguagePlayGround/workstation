function getCommandLineArgument(key) {
    if (process && process.argv) {
        for (var i = 0; i < process.argv.length; i++) {
            var obj = process.argv [i];
            if (obj.indexOf(key + "=") == 0) {
                return obj.substring(obj.indexOf(key + "=") + key.length + 1);
            }

        }
    }
}

if (getCommandLineArgument("NEWRELIC") === "true") {
    require('newrelic');

}

var domain = require("domain");
var express = require('express');
var http = require('http');
var app = express();

var ApplaneAppsHttp = require("ApplaneApps/Http.js");

var Q = require("q");
var sTime = new Date();


function getErrorObejct(err) {
    if (!(err  instanceof Error)) {
        err = new Error(err);
    }

    return err;
}

function runInDomain(req, res) {
    var D = Q.defer();
    var reqd = domain.create();
    reqd.add(req);
    reqd.add(res);
    reqd.on('error', function (err) {
        D.reject(err);
    });
    reqd.run(function () {
        D.resolve(reqd);
    });
    return D.promise;
}

function writeJSONResponse(req, res, result, db) {
    var ApplaneDBError = require("ApplaneDB/lib/ApplaneDBError.js");
    var jsonResponseType = {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS"};
    var warnings = db && db.getWarnings() ? db.getWarnings() : undefined;
    if (result instanceof ApplaneDBError) {

        res.writeHead(417, jsonResponseType);
        res.write(JSON.stringify({response: result.message, status: "error", code: result.code, stack: result.stack, warnings: warnings, message: result.message, detailMessage: result.detailMessage}));
        res.end();
    } else if (result instanceof Error) {
        res.writeHead(417, jsonResponseType);
        res.write(JSON.stringify({response: result.message, status: "error", code: result.code, stack: result.stack, warnings: warnings, message: result.message, detailMessage: result.detailMessage}));
        res.end();
    } else {
        var jsonResponse = JSON.stringify({response: result, status: "ok", code: 200, warnings: warnings});
        if (req.headers && req.headers["accept-encoding"] && req.headers["accept-encoding"].indexOf("gzip") >= 0) {
            require("zlib").gzip(jsonResponse, function (err, buffer) {
                jsonResponseType["Content-Encoding"] = "gzip";
                res.writeHead(200, jsonResponseType);
                res.write(buffer);
                res.end();
            })
        } else {
            res.writeHead(200, jsonResponseType);
            res.write(jsonResponse);
            res.end();
        }
    }
}

function verifyDB(db) {
    if (!(db == "fimbre" || db == "fimbre_sb")) {
        throw new Error("Invalid db");
    }
}

function doFirstLogin(db) {
    return db.invokeFunction("Network.createMemberFromInvitations", [
            {emailid: db.user.emailid}
        ]).then(
        function () {
            return db.invokeFunction("Network.createMemberForOrganizationNetwork", [
                {emailid: db.user.emailid}
            ])
        }).then(function () {
            var updates = {$collection: "pl.users", $update: {_id: db.user._id, $set: {firstLoginProcessed: true}}}
            return db.update(updates)
        })

}

function userLogin(req, res) {
    var ApplaneDBError = require("ApplaneDB/lib/ApplaneDBError.js");
    var Constants = require("./lib/Constants.js");

    var database = req.param("db");
    var emailid = req.param("emailid");
    var password = req.param("password");
    verifyDB(database);
    if (emailid) {
        emailid = emailid.trim();
    }

    if (!emailid) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[emailid]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }
    if (!password) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[password]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }

    var db = undefined;
    var options = {username: emailid, password: password, fields: {fimbreStatus: 1, firstLoginProcessed: 1}};
    return require("ApplaneDB/lib/Http.js").connectDB(database, options).then(
        function (db1) {
            if (!db1 || !db1.user) {
                throw new Error("Not connected");
            }
            if (db1.user.fimbreStatus !== "Verified") {
                throw new Error("Account not verified");
            }
            db = db1;
            var connectionToken = require("ApplaneCore/apputil/util.js").getUnique();
            db.token = connectionToken;
            return require("ApplaneDB/lib/Http.js").saveConnection(connectionToken, database, undefined, options);

        }).then(
        function () {
            if (!db.user.firstLoginProcessed) {
                return doFirstLogin(db);
            }
        }).then(function () {
            var response = {token: db.token, user: db.user};
            db.clean();
            db = undefined;
            return response;
        });


}

function handleOAuthCallback(req, res, oauthData) {
    var result = {};
    var oauthCode = undefined;
    var userDB = undefined;
    var userOptions = undefined;
    var defaultFields = {fimbreStatus: "Verified", "notificationEnabled": true}
    return require("ApplaneDB/lib/Http.js").oAuthLogin(oauthData, {defaultFields: defaultFields}).then(
        function (oauthCode1) {
            oauthCode = oauthCode1;
            var dbName = oauthData.db;
            userOptions = {username: oauthData.emailid, fields: {fimbreStatus: 1, firstLoginProcessed: 1}};
            return require("ApplaneDB/lib/Http.js").connectOauthDB(dbName, oauthCode, userOptions)
        }).then(
        function (userDB1) {
            userDB = userDB1;
            result.user = userDB.user;
            var connectionToken = require("ApplaneCore/apputil/util.js").getUnique();
            result.token = connectionToken;
            return require("ApplaneDB/lib/Http.js").saveConnection(connectionToken, oauthData.db, oauthCode, userOptions)
        }).then(
        function () {
            if (!userDB.user.firstLoginProcessed) {
                return doFirstLogin(userDB);
            }
        }).then(
        function () {
            require("ApplaneDB/lib/Http.js").redirectOAuthURL(req, res, result.token, oauthData);
        })
}
function userSignup(req, res) {
    var emailid = req.param("emailid");
    var name = req.param("name");
    var password = req.param("password");
    var confirmpassword = req.param("confirmpassword");
    var db = req.param("db");
    verifyDB(db);
    var ApplaneDB = require("ApplaneDB");
    var fimbreDB = undefined;
    return ApplaneDB.getAdminDB().then(
        function (admindb) {
            if (!admindb) {
                return;
            }
            return admindb.connectUnauthorized(db)
        }).then(
        function (fimbreDB1) {
            fimbreDB = fimbreDB1;
            var options = {};
            options.domain = req.headers.host;
            return fimbreDB.invokeFunction("FimbreUser.signup", [
                {emailid: emailid, name: name, password: password, confirmpassword: confirmpassword}
            ], options)
        }).then(function (response) {
            fimbreDB.clean();
            return response;
        })
}

function userVerify(req, res) {
    var Constants = require("./lib/Constants.js");
    var DBConstants = require("ApplaneDB/lib/Constants.js");
    var userid = req.param("user");
    var verificationcode = req.param("vc");
    var dbName = req.param("dbName");
    var ApplaneDB = require("ApplaneDB");
    var db = undefined;
    return ApplaneDB.getAdminDB().then(
        function (admindb) {
            if (!admindb) {
                return;
            }
            return admindb.connectUnauthorized(dbName)
        }).then(
        function (db1) {
            db = db1;
            var filter = {};
            filter["_id"] = userid;
            filter[Constants.Collections.Users.VERIFICATION_CODE] = verificationcode;
            return db.query({$collection: Constants.Collections.Users.COLLECTION, $fields: {"_id": 1}, $filter: filter, $modules: false})
        }).then(
        function (user) {
            if (user.result.length === 1) {
                var set = {};
                set[Constants.Collections.Users.FIMBRE_STATUS] = Constants.Collections.Users.FimbreStatus.VERIFIED;
                var update = [
                    {$collection: Constants.Collections.Users.COLLECTION, $update: [
                        {_id: user.result[0]["_id"], $set: set}
                    ]}
                ]
                return db.update(update)
            } else {
                throw  new Error("None or more than One User found with _id = [" + userid + "] and " + [Constants.Collections.Users.VERIFICATION_CODE] + "= [" + verificationcode + "]")
            }
        }).then(function (response) {
            db.clean();
            return DBConstants.ErrorCode.VERIFICATION;
        })

}


ApplaneAppsHttp.configure(app).then(
    function () {
        if (getCommandLineArgument("SERVER_START_UP") === "true") {
            return ApplaneAppsHttp.onMasterServerStartUp();
        }
    }).then(
    function () {
        app.all("/rest/fimbre/signup", function (req, res) {

            return runInDomain(req, res).then(
                function (result) {
                    return userSignup(req, res);


                }).then(
                function (result) {
                    writeJSONResponse(req, res, result, undefined);
                }).fail(function (err) {
                    console.log("error......" + err);
                    err = getErrorObejct(err);
                    writeJSONResponse(req, res, err, undefined);
                })


        })

        app.all("/rest/fimbre/verify", function (req, res) {

            return runInDomain(req, res).then(
                function (result) {
                    return userVerify(req, res);


                }).then(
                function (result) {
                    writeJSONResponse(req, res, result, undefined);
                }).fail(function (err) {
                    console.log("error......" + err);
                    err = getErrorObejct(err);
                    writeJSONResponse(req, res, err, undefined);
                })

        })

        app.all("/rest/fimbre/login", function (req, res) {


            return runInDomain(req, res).then(
                function (result) {
                    return userLogin(req, res);


                }).then(
                function (result) {
                    writeJSONResponse(req, res, result, undefined);
                }).fail(function (err) {
                    console.log("error......" + err);
                    err = getErrorObejct(err);
                    writeJSONResponse(req, res, err, undefined);
                })


        })

        app.all('/rest/fimbre/oauth/google', function (req, res) {
            return runInDomain(req, res).then(
                function (domain) {
                    return require("ApplaneDB/lib/Http.js").handleGoogleLogin(req, res);
                }).fail(function (err) {
                    err = getErrorObejct(err);
                    writeJSONResponse(req, res, err, undefined);
                })
        });

        app.all('/rest/fimbre/oauth/google/callback', function (req, res) {
            return runInDomain(req, res).then(
                function () {
                    return require("ApplaneDB/lib/Http.js").handleGoogleLoginCallback(req, res)
                }).then(function (outhData) {
                    return handleOAuthCallback(req, res, outhData);
                }).fail(function (err) {
                    err = getErrorObejct(err);
                    writeJSONResponse(req, res, err, undefined);
                })
        });

        app.all('/rest/fimbre/oauth/facebook', function (req, res) {
            return runInDomain(req, res).then(
                function () {
                    return require("ApplaneDB/lib/Http.js").handleFacebookLogin(req, res);
                }).fail(function (err) {
                    err = getErrorObejct(err);
                    writeJSONResponse(req, res, err, undefined);
                })
        });

        app.all('/rest/fimbre/oauth/facebook/callback', function (req, res) {
            return runInDomain(req, res).then(
                function () {
                    return require("ApplaneDB/lib/Http.js").handleFacebookLoginCallback(req, res);
                }).then(function (outhData) {
                    return handleOAuthCallback(req, res, outhData);
                }).fail(function (err) {
                    err = getErrorObejct(err);
                    writeJSONResponse(req, res, err, undefined);
                })
        });

        app.all("/rest/fimbre/forgotPassword", function (req, res) {
            var email = req.param("email");
            var database = req.param("database");
            var domain = req.headers.host;
            var FimbreUser = require("Fimbre/lib/FimbreUser.js");
            return FimbreUser.forgotPassword(email, database, domain).then(
                function (result) {
                    writeJSONResponse(req, res, result, undefined);
                }).fail(function (err) {
                    err = getErrorObejct(err);
                    writeJSONResponse(req, res, err, undefined);
                });
        })

    }).then(
    function () {

        var cacheTime = 60000 * 60;     // 1 minute
        var staticPath = __dirname + '/applanepublic';
        app.use(express.static(staticPath, { maxAge: cacheTime }));


        var timeTaken = new Date() - sTime;
        console.log("  Time Taken :  " + timeTaken + " ms");
        var Config = require("ApplaneApps/Config.js");
        var port = Config.PORT;
        http.createServer(app).listen(port);
    }).fail(function (err) {
        console.log("errr>>>>>>>>>>>>>" + err + ">>>>>>stack>>>>>>" + err.stack);
    })




