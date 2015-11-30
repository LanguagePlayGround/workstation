var Config = require("../Config.js").config;
var ApplaneDBError = require("./ApplaneDBError.js");
var domain = require("domain");
var express = require('express');
var Formidable = require("formidable");
var SELF = require("./Http.js");
var bodyParser = require('body-parser');
var Q = require("q");
var ApplaneDB = require("./DB.js");
var Utility = require("ApplaneCore/apputil/util.js");
var Constants = require("./Constants.js");
var MailService = require("./MailService.js");
var CacheService = require("ApplaneDB/lib/CacheService.js");
var BusinessLogicError = require("ApplaneError/lib/BusinessLogicError.js");
var ProcessCache = require("./cache/ProcessCache.js");

process.on('uncaughtException', function (err) {
    console.log("err>>>>>>" + err);
    var options = {to:"rohit.bansal@daffodilsw.com", from:"developer@daffodilsw.com", subject:"Uncaught Exception"};
    var html = '';
    html += "<b>ERROR</b>" + err.message + "<br>";
    html += "<b>STACK</b>" + err.stack + "<br>";
    html += "<b>DATE</b>" + new Date() + "<br>";
    html += "<b>PARAMETERS</b> ServerName : " + Config.SERVER_NAME + " Port : " + Config.PORT + "<br>";
    options.html = html;
    MailService.sendFromAdmin(options).fail(function (err1) {
        console.error("err1>>>>" + err1);
    })
    ApplaneDB.getAdminDB().then(
        function (admindb) {
            if (admindb) {
                return admindb.update({$collection:"pl.logs", $insert:{"error":err.message, "stack":err.stack, "endTime":new Date(), "type":"uncaughtException" }});
            }
        }).fail(function (err1) {
            console.error("err1>>>>" + err1);
        })
});

function logUserLoginInfo(dbName, startTime, username, serviceType) {
    return ApplaneDB.getLogDB().then(function (logDB) {
        return logDB.update({"$collection":"pl.userLoginHistory", "$insert":{"date":startTime, "username":username, "serviceType":serviceType, "db":dbName}
        });
    });
}

function logUserViewInfo(dbName, startTime, username, viewId) {
    return ApplaneDB.getLogDB().then(function (logDB) {
        return logDB.update({"$collection":"pl.userViewHistory", "$insert":{"date":startTime, "username":username, "viewId":viewId, "db":dbName}
        });
    });
}

function getErrorObejct(err) {
    if (err && !(err  instanceof Error)) {
        if (typeof err !== "string") {
            err = JSON.stringify(err);
        }
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

exports.saveConnection = function (connectionToken, dbName, oauthCode, options) {
    return ApplaneDB.getAdminDB().then(
        function (admindb) {
            if (options) {
                delete options.password;
            }
            var insert = {};
            insert.token = connectionToken;
            insert.db = dbName;
            insert.options = options;
            insert.oauthcode = oauthCode;
            insert.lastUpdatedOn = new Date();
            return admindb.update({$collection:Constants.Admin.CONNECTIONS, $insert:insert, $events:false, $modules:false});
        })
}

function disconnect(token) {
    return ApplaneDB.getAdminDB().then(
        function (admindb) {
            return admindb.mongoUpdate([
                {$collection:Constants.Admin.CONNECTIONS, $delete:[
                    {token:token}
                ]}
            ]);
        })
}

function getDBFromCode(code, options) {
    return ApplaneDB.getAdminDB().then(
        function (admindb) {
            return admindb.query(
                {$collection:"pl.dbs", $filter:{code:code}, $fields:{db:1, guestUserName:1, allowedServices:1}, $events:false, $modules:false}
            );
        }).then(
        function (result) {
            result = result.result[0];
            if (!result) {
                throw (new Error("No db registered with code >>>" + code));
            }
            if (!result.guestUserName) {
                throw new Error("guestUserName is mandatory in db [" + result.db + "]");
            }
            options = options || {};
            var serviceName = options.serviceName;
            if (serviceName) {
                var allowedServices = result.allowedServices;
                var isValidService = false;
                if (allowedServices) {
                    for (var i = 0; i < allowedServices.length; i++) {
                        if (allowedServices[i].service === serviceName) {
                            isValidService = true;
                            break;
                        }
                    }
                }
                if (!isValidService) {
                    throw new Error("Code can not be allowed in db [" + result.db + "] for service [" + serviceName + "]");
                }
            }
            options.username = result.guestUserName;
            return ApplaneDB.connectWithCode(Config.URL, result.db, code, options);
        })
}

function removeUserConnection(userAccessToken) {
    if (!userAccessToken) {
        return;
    }
    return ApplaneDB.getAdminDB().then(
        function (adminDb) {
            return adminDb.update({$collection:"pl.userConnections", $delete:{$query:{token:userAccessToken}}});
        })
}

exports.getDBFromUserAccessToken = function (userAccessToken, functionName, options) {
    var userConnection = undefined;
    var adminDb = undefined;
    var username = undefined;
    return ApplaneDB.getAdminDB().then(
        function (adb) {
            adminDb = adb;
            return adminDb.query(
                {$collection:"pl.userConnections", $filter:{token:userAccessToken}, $limit:1}
            );
        }).then(
        function (result) {
            userConnection = result.result[0];
            if (!userConnection) {
                throw new Error("User Access Token [" + userAccessToken + "] is invalid.");
            }
            if (userConnection.function && functionName && userConnection.function !== functionName) {
                throw new Error("User Access token only valiad for function [" + userConnection.function + "].But found [" + functionName + "]");
            }
            return adminDb.connectUnauthorized(userConnection.db);
        }).then(
        function (dbToConnect) {
            return dbToConnect.query({$collection:"pl.users", $filter:{_id:userConnection.user}, $fields:{username:1}, $events:false, $modules:{Role:0}});
        }).then(
        function (result) {
            result = result.result[0];
            if (!result) {
                throw new Error("User does not exists for [" + JSON.stringify(userConnection.user) + "] in db [" + userConnection.db + "]");
            }
            username = result.username;
            return getCode(userConnection.db, adminDb);
        }).then(
        function (code) {
            var newOptions = {};
            options = options || {};
            for (var k in options) {
                newOptions[k] = options[k];
            }
            newOptions.username = username;
            return ApplaneDB.connectWithCode(Config.URL, userConnection.db, code, newOptions);
        }).then(function (db) {
            db.token = userAccessToken;
            userConnection = undefined;
            adminDb = undefined;
            return db;
        })
}

function getCode(dbName, adminDb) {
    return adminDb.query({$collection:"pl.dbs", $filter:{db:dbName}, $fields:{code:1}}).then(function (result) {
        var code = result.result[0].code;
        if (!code) {
            throw new Error("Code is not defined in db [" + dbName + "]");
        }
        return code;
    })
}

exports.handleMessage = function (message) {
    console.log("Handle message called >>>>" + JSON.stringify(message));
};

exports.connectWithToken = function (token, options) {
    return SELF.getConnection(token).then(
        function (db) {
            var result = {};
            result.user = db.user;
            result.token = token;
            return result;
        })
};

exports.connectOauthDB = function (dbName, oauthCode, options) {
    return ApplaneDB.connectWithOAuth(Config.URL, dbName, oauthCode, options);
};

exports.connectWithOAuth = function (dbName, oauthCode, options) {
    var result = {};
    return ApplaneDB.connectWithOAuth(Config.URL, dbName, oauthCode, options).then(
        function (db) {
            result.user = db.user;
            var connectionToken = Utility.getHashedToken();
            result.token = connectionToken;
            return SELF.saveConnection(connectionToken, dbName, oauthCode, options)
        }).then(
        function () {
            return result;
        })
};

exports.connectWithCode = function (code, options) {
    var result = {};
    return getDBFromCode(code, options).then(
        function (db) {
            result.user = db.user;
            var connectionToken = Utility.getHashedToken();
            result.token = connectionToken;
            return SELF.saveConnection(connectionToken, db.db.databaseName, undefined, options);
        }).then(
        function () {
            return result;
        })
};

exports.connectDB = function (dbName, options) {
    return ApplaneDB.connect(Config.URL, dbName, options);
};

exports.connect = function (dbName, options) {
    var result = {};
    var db = undefined;
    return ApplaneDB.connect(Config.URL, dbName, options).then(
        function (db1) {
            db = db1;
            result.user = db.user;
            var connectionToken = Utility.getHashedToken();
            result.token = connectionToken;
            return SELF.saveConnection(connectionToken, dbName, undefined, options);
        }).then(
        function () {
            return cacheUserConnection(result.token, db);
        }).then(
        function () {
            return result;
        })
};

exports.handleGoogleLogin = function (req, res) {
    var googleapis = require("googleapis");
    var host = req.headers.host;
    var db = req.param("__org__");
    var scopeReceived = req.param("scope");
    var approvalPrompt = req.param("approval_prompt");
    var redirectURL = req.param("redirectURL");
    var skipRedirection = req.param("skipRedirection");
    var userCollection = req.param("userCollection");
    var userFields = req.param("userFields");
    if (typeof userFields === "string") {
        userFields = JSON.parse(userFields);
    }
    if (!redirectURL) {
        redirectURL = "/";
    }
    var state = {db:db, redirectURL:redirectURL, skipRedirection:skipRedirection};
    if (skipRedirection) {
        state.userFields = userFields;
        state.userCollection = userCollection;
    }
    state = JSON.stringify(state);
    var scope = [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
    ];
    if (scopeReceived && scopeReceived.indexOf("gmail.readonly") >= 0) {
        scope.push('https://www.googleapis.com/auth/gmail.readonly')
    }
    if (scopeReceived && scopeReceived.indexOf("calendar") >= 0) {
        scope.push('https://www.googleapis.com/auth/calendar');
    }
    var OAuth2 = googleapis.auth.OAuth2;
    var oauth2Client = new OAuth2(Config.GOOGLE_CLIENT_ID, Config.GOOGLE_CLIENT_SECRET, "http://" + host + Config.GOOGLE_CALLBACK_URL);
    if (skipRedirection) {
        console.log("calling for app ...");
        oauth2Client = new OAuth2("694619031432-7gdse6tj5r14ok8j6kkoc1o9a0t1gd0i.apps.googleusercontent.com", "bjpmD2ZRM3MuKMfvKXlerg0R", "http://" + host + Config.GOOGLE_CALLBACK_URL);
    }
    var options = {
        access_type:"offline",
        scope:scope,
        state:state
    };
    if (approvalPrompt) {
        options.approval_prompt = approvalPrompt;
    }
    var url = oauth2Client.generateAuthUrl(options);
    res.redirect(url);
};

exports.handleFacebookLogin = function (req, res) {
    var passport = require('passport');
    var host = req.headers.host;
    var db = req.param("db");
    var redirectURL = req.param("redirectURL");
    if (!db) {
        throw new Error(" db is undefined in OAuth Login ");
    }
    if (!redirectURL) {
        throw new Error(" redirectURL is undefined in OAuth Login ");
    }
    passport.authenticate('facebook', { callbackURL:"http://" + host + Config.FACEBOOK_CALLBACK_URL, scope:[ 'public_profile', 'email', 'user_friends' ], state:JSON.stringify({db:db, redirectURL:redirectURL})})(req, res);

};

exports.handleGoogleLoginCallback = function (req, res) {
    var googleapis = require("googleapis");
    var d = Q.defer();
    var host = req.headers.host;
    var OAuth2 = googleapis.auth.OAuth2;
    var state = req.query.state;
    if (typeof state === "string") {
        state = JSON.parse(state);
    }
    var dbName = state.db;
    var skipRedirection = state.skipRedirection;
    var userCollection = state.userCollection;
    var userFields = state.userFields;
    var oauth2Client = new OAuth2(Config.GOOGLE_CLIENT_ID, Config.GOOGLE_CLIENT_SECRET, "http://" + host + Config.GOOGLE_CALLBACK_URL);
    if (skipRedirection) {
        oauth2Client = new OAuth2("694619031432-7gdse6tj5r14ok8j6kkoc1o9a0t1gd0i.apps.googleusercontent.com", "bjpmD2ZRM3MuKMfvKXlerg0R", "http://" + host + Config.GOOGLE_CALLBACK_URL);
    }
    var redirectURL = state.redirectURL;
    if (!redirectURL) {
        throw new Error(" redirectURL is undefined in OAuth Login ");
    }
    var code = req.query.code;
    oauth2Client.getToken(code, function (err, tokens) {
        if (err) {
            d.reject(err);
            return;
        }
        oauth2Client.setCredentials(tokens);
        googleapis.oauth2('v2').userinfo.get({userId:'me', auth:oauth2Client}, function (err, profile) {
            if (err) {
                d.reject(err);
                return;
            }
            var id = profile.id;
            var email = profile.email;
            var name = profile.name;
            var returnVal = {emailid:email, name:name, code:code, db:dbName, authType:"google", authid:id, redirectURL:redirectURL, googleTokens:tokens};
            if (skipRedirection) {
                returnVal.skipRedirection = skipRedirection;
                returnVal.userFields = userFields;
                returnVal.userCollection = userCollection;
            }
            d.resolve(returnVal);
        });
    });
    return d.promise;
};

exports.handleFacebookLoginCallback = function (req, res) {
    var passport = require('passport');
    var host = req.headers.host;
    var code = req.query.code;
    var state = req.query.state;
    if (typeof state === "string") {
        state = JSON.parse(state);
    }
    var db = state.db;
    var redirectURL = state.redirectURL;
    if (!db) {
        throw new Error(" db is undefined in OAuth Login ");
    }
    if (!redirectURL) {
        throw new Error(" redirectURL is undefined in OAuth Login ");
    }
    var d = Q.defer();
    passport.authenticate('facebook', { callbackURL:"http://" + host + Config.FACEBOOK_CALLBACK_URL, failureRedirect:'/login' }, function (err, user, info) {
        if (err) {
            d.reject(err);
            return;
        }
        var id = user.id;
        var email = user.emails[0].value;
        var name = "";
        if (user.name) {
            name = user.name.givenName ? user.name.givenName : "";
            name += user.name.familyName ? user.name.familyName : "";
        }
        if (name.length === 0) {
            name = undefined;
        }
        d.resolve({emailid:email, name:name, code:code, db:db, authType:"facebook", authid:id, redirectURL:redirectURL});
    })(req, res);
    return d.promise;
};

exports.handleLinkedInLogin = function (req, res) {
    var db = req.param("db");
    var host = req.headers.host;
    var redirectURL = "/";
    var state = JSON.stringify({db:db, redirectURL:redirectURL});
    var codeURL = "https://www.linkedin.com/uas/oauth2/authorization?response_type=code&client_id=" + Config.LINKEDIN_CLIENT_ID + "&state=" + state + "&redirect_uri=http://" + host + Config.LINKEDIN_CALLBACK_URL;
    res.redirect(codeURL);
};

exports.handleLinkedInCallback = function (req, res) {
    var d = Q.defer();
    var code = req.query.code;
    var host = req.headers.host;
    var state = req.query.state;
    if (typeof state === "string") {
        state = JSON.parse(state);
    }
    var dbName = state.db;
    var redirectURL = state.redirectURL;
    var accessTokenObj;
    var emailid;
    var request = require('request');
    var tokenURL = "https://www.linkedin.com/uas/oauth2/accessToken?grant_type=authorization_code&code=" + code + "&client_id=" + Config.LINKEDIN_CLIENT_ID + "&client_secret=" + Config.LINKEDIN_CLIENT_SECRET + "&redirect_uri=http://" + host + Config.LINKEDIN_CALLBACK_URL + "&format=json";
    request({url:tokenURL}, function (err, response) {
        if (err) {
            d.reject(err);
        }
        accessTokenObj = response.body;
        accessTokenObj = JSON.parse(accessTokenObj);
        if (!accessTokenObj || (accessTokenObj && !accessTokenObj.access_token)) {
            d.reject(new Error("AccessToken Not Found for given code (LinkedIn) OAuth."));
        } else {
            var emailURL = "https://api.linkedin.com/v1/people/~:(email-address)?oauth2_access_token=" + accessTokenObj.access_token + "&format=json";
            request({url:emailURL}, function (err, response) {
                if (err) {
                    d.reject(err);
                }
                emailid = JSON.parse(response.body).emailAddress;
                d.resolve({emailid:emailid, code:code, authType:"linkedin", redirectURL:redirectURL, db:dbName, linkedinToken:accessTokenObj});
            });
        }
    });
    return d.promise;
};

exports.configure = function (app) {
    app.use(function (req, res, next) {
        var urlParser = require('url');
        var url = urlParser.parse(req.url, true);
        if (url.pathname == "/rest/file/upload") {
            next();
        } else {
            var contentType = req.header("content-type");
            if (contentType && contentType.indexOf("application/json") != -1) {
                bodyParser.json({limit:1024 * 1024 * 10})(req, res, next);
            } else {
                bodyParser.urlencoded({ extended:true, limit:1024 * 1024 * 10})(req, res, next);
            }
//            if (contentType && contentType.indexOf("application/x-www-form-urlencoded") != -1) {
//                bodyParser.urlencoded({ extended: true, limit: 1024 * 1024 * 10})(req, res, next);
//            }
        }
    });

    if (Config.FACEBOOK_APP_ID && Config.FACEBOOK_APP_SECRET) {
        var passport = require('passport');
        var FacebookStrategy = require('passport-facebook').Strategy;
        passport.serializeUser(function (user, done) {
            done(null, user);
        });

        passport.deserializeUser(function (obj, done) {
            done(null, obj);
        });

        passport.use(new FacebookStrategy({
                clientID:Config.FACEBOOK_APP_ID,
                clientSecret:Config.FACEBOOK_APP_SECRET
            },
            function (accessToken, refreshToken, profile, done) {
                process.nextTick(function () {
                    return done(null, profile);
                })
            }
        ));
        app.use(passport.initialize());
    }

    app.all('/rest/cronStatus', function (req, res) {
        res.writeHead(200);
        res.write(JSON.stringify({result:{check:{status:"ApplaneDB/Config.js", cron:"config", key:"CRON_STATUS"}}}));
        res.end();
    });

    app.all('/rest/clearProcessCache', function (req, res) {
        var bucket = req.param("bucket");
        var mainKey = req.param("mainKey");
        var subKey = req.param("subKey");
        return runInDomain(req, res).then(
            function () {
                process.send({clearProcessCache:true, bucket:bucket, mainKey:mainKey, subKey:subKey});
                res.writeHead(200);
                res.write("Clear cache successfully..");
                res.end();
            }).fail(function (err) {
                err = getErrorObejct(err);
                writeJSONResponse(req, res, err, undefined);
            });
    });

    app.all('/rest/oauth/google', function (req, res) {
        return runInDomain(req, res).then(
            function () {
                return SELF.handleGoogleLogin(req, res);
            }).fail(function (err) {
                err = getErrorObejct(err);
                writeJSONResponse(req, res, err, undefined);
            })
    });

    app.all('/rest/oauth/google/callback', function (req, res) {
        var oAuthData = undefined;
        var options = {};
        return runInDomain(req, res).then(
            function () {
                return SELF.handleGoogleLoginCallback(req, res);
            }).then(
            function (params) {
                oAuthData = params;
                oAuthData.host = req.headers.host;
                if (oAuthData.userFields) {
                    options.fields = oAuthData.userFields;
                    delete oAuthData.userFields;
                }
                if (oAuthData.userCollection) {
                    options.userCollection = oAuthData.userCollection;
                    delete oAuthData.userCollection;
                }
                return SELF.handleMarketPlaceData(oAuthData, options);
            }).then(
            function () {
                return handleOAuthCallback(req, res, oAuthData, options);
            }).fail(function (err) {
                if (oAuthData.skipRedirection) {
                    writeJSONResponse(req, res, err);
                } else {
                    res.redirect("/login.html?err_msg=" + err.message);
                }
            })
    });
//
//    app.all('/rest/oauth/facebook', function (req, res) {
//        return runInDomain(req, res).then(
//            function () {
//                SELF.handleFacebookLogin(req, res);
//            }).fail(function (err) {
//                err = getErrorObejct(err);
//                writeJSONResponse(req, res, err, undefined);
//            })
//    });
//
//    app.all('/rest/oauth/facebook/callback', function (req, res, next) {
//        return runInDomain(req, res).then(
//            function () {
//                SELF.handleFacebookLoginCallback(req, res);
//            }).fail(function (err) {
//                err = getErrorObejct(err);
//                writeJSONResponse(req, res, err, undefined);
//            })
//    });

    app.all("/rest/disconnect", function (req, res) {
        var db = undefined;
        var userName = undefined;
        var dbName = undefined;
        var startTime = new Date();
        var token = undefined;
        var options = req.param("options");
        options = options ? (typeof options == "object" ? options : JSON.parse(options)) : {};
        options.serviceName = "/rest/disconnect";
        var serviceLogParams = {startTime:startTime};
        return runInDomain(req, res).then(
            function () {
                return getConnectedDB(req.param("token"), req.param("code"), options);
            }).then(
            function (connectedDB) {
                db = connectedDB;
                userName = db.user ? db.user.username : undefined;
                dbName = db.db.databaseName;
                token = req.param("token");
                var logId = Utility.getUniqueObjectId();
                var insertLog = {startTime:startTime, username:userName, token:token, serviceType:"disconnect", db:dbName, callType:"rest"};
                serviceLogParams.logId = logId;
                var p = SELF.addServiceLog(logId, insertLog);
                serviceLogParams.insertPromise = p;
                if (req.param("function")) {
                    var functionName = req.param("function");
                    var parameters = req.param("parameters");
                    parameters = parameters ? (typeof parameters == "object" ? parameters : JSON.parse(parameters)) : [];
                    return db.invokeFunction(functionName, parameters, options);
                }
            }).then(
            function () {
                return disconnect(token);
            }).then(
            function () {
                res.clearCookie("token");
                res.clearCookie("oauthProvider");
            }).then(
            function () {
                return CacheService.removeUserConnection(req.param("token"));
            }).then(
            function () {
                writeJSONResponse(req, res, {logout:true}, undefined, serviceLogParams);
            }).then(
            function () {
                logUserLoginInfo(dbName, startTime, userName, 'disconnect');
            }).fail(
            function (err) {
                err = getErrorObejct(err);
                writeJSONResponse(req, res, err, undefined, serviceLogParams);
            })
    });

    app.all("/rest/connect", function (req, res) {
        var startTime = new Date();
        var serviceLogParams = {startTime:startTime};
        var dbName = req.param("db");
        var options = req.param("options");
        var userName = undefined;
        return runInDomain(req, res).then(
            function () {
                if (req.param("sandbox")) {
                    dbName = dbName + "_sb";
                }
                options = options ? (typeof options == "object" ? options : JSON.parse(options) ) : {};
                var code = req.param("code");
                var token = req.param("token") || options.token;
                if (dbName === undefined && code === undefined && token === undefined) {
                    var domain = req.headers.host;
                    dbName = getDbFromDomain(domain);
                }
                userName = options.username;
                var logId = Utility.getUniqueObjectId();
                var insertLog = {startTime:startTime, username:userName, serviceType:"connect", db:dbName, callType:"rest"};
                serviceLogParams.logId = logId;
                var p = SELF.addServiceLog(logId, insertLog);
                serviceLogParams.insertPromise = p;
                if (token) {
                    return SELF.connectWithToken(token, options);
                } else if (code) {
                    throw new Error("code not supported in /rest/connect");
//                    return SELF.connectWithCode(code, options);
                } else if (options && options.googleTokens && options.authType === "google_client") { // incase of login with google button from client side
                    var oauthData = options;
                    oauthData.db = dbName;
                    oauthData.name = options.fullname;
                    oauthData.code = Utility.getUniqueObjectId();
                    return handleOAuthCallback(req, res, oauthData, options);
                } else {
                    return SELF.connect(dbName, options);
                }
            }).then(
            function (result) {
                // storing token in browser cookie, for re-open the opened page if user try to go to login page again, if already login --Rajit garg 31/mar/2016
                if (result && result.token) {
                    res.cookie("token", result.token);
                }
                writeJSONResponse(req, res, result, undefined, serviceLogParams);
            }).then(
            function () {
                logUserLoginInfo(dbName, startTime, userName, 'connect');
            }).fail(
            function (err) {
                err = getErrorObejct(err);
                writeJSONResponse(req, res, err, undefined, serviceLogParams);
            })
    });

    app.all("/rest/service/*", function (req, res) { //this service is provided for six-continent
        var requestParams = getRequestParams(req);
        for (var key in requestParams) { //values of JSON and array was coming string so we have to parse them
            try {
                var value = requestParams[key];
                if (value && typeof value === "string") {
                    requestParams[key] = JSON.parse(value);
                }
            } catch (e) {
            }
        }
        var options = requestParams.options || {};
        options.serviceName = "/rest/service/*";
        delete requestParams.options;
        var db = undefined;
        var connectionStime = undefined;
        var startTime = new Date();
        var serviceLogParams = {startTime:startTime};
        return runInDomain(req, res).then(
            function () {
                connectionStime = new Date();
                return getConnectedDB(requestParams.token, requestParams.code, options);
            }).then(
            function (db1) {
                var connectionTime = new Date() - connectionStime;
                serviceLogParams.connectionTime = connectionTime;
                db = db1;
                setInitialLogger(requestParams.token, requestParams, "service", startTime, req, db);
                var userName = db.user ? db.user.username : undefined;
                var insertLog = {info:requestParams, key:requestParams["0"], connectionTime:connectionTime, startTime:startTime, username:userName, token:requestParams.token, serviceType:" / rest / service/*", db:db.db.databaseName, callType:"rest"};
                var logId = Utility.getUniqueObjectId();
                serviceLogParams.logId = logId;
                serviceLogParams.insertPromise = SELF.addServiceLog(logId, insertLog);
                return db.executeService(requestParams, options);
            }).then(
            function (result) {
                serviceLogParams.mongoTime = db.mongoTime;
                if (db.logger) {
                    serviceLogParams.logCount = db.logger.logCount;
                }
                writeJSONResponse(req, res, result, db, serviceLogParams);
            }).fail(function (err) {
                if (db) {
                    serviceLogParams.mongoTime = db.mongoTime;
                    if (db.logger) {
                        serviceLogParams.logCount = db.logger.logCount;
                    }
                }
                err = getErrorObejct(err);
                writeJSONResponse(req, res, err, db, serviceLogParams);
            })
    });

    app.all("/rest/query", function (req, res) {
        var db = undefined;
        var query = undefined;
        var startTime = new Date();
        var connectionTime = undefined;
        var connectionStime = undefined;
        var options = req.param("options");
        options = options ? (typeof options == "object" ? options : JSON.parse(options)) : {};
        options.serviceName = "/rest/query";
        var serviceLogParams = {startTime:startTime};
        return runInDomain(req, res).then(
            function () {
                connectionStime = new Date();
                return getConnectedDB(req.param("token"), req.param("code"), options);
            }).then(
            function (db1) {
                connectionTime = new Date() - connectionStime;
                serviceLogParams.connectionTime = connectionTime;
                db = db1;
                var userName = db.user ? db.user.username : undefined;
                var queryStr = req.param("query");
                if (!queryStr) {
                    throw new Error("Please provide value of mandatory parameters [query]");
                }
                if (typeof queryStr === "string") {
                    query = JSON.parse(queryStr);
                } else {
                    query = queryStr;
                    queryStr = JSON.stringify(queryStr);
                }
                if (query.$modules !== undefined) {
                    throw new Error("Modules can not be excluded in Query from rest Service.Query is [" + JSON.stringify(query) + "]");
                }
                var token = req.param("token");
                setInitialLogger(token, queryStr, "query", startTime, req, db);
                var insertLog = {connectionTime:connectionTime, startTime:startTime, username:userName, token:token, serviceType:"query", db:db.db.databaseName, info:{query:queryStr}, key:query.$collection, subkeyL1:(query.$filter ? JSON.stringify(Object.keys(query.$filter)) : undefined), callType:"rest"};
                //here inserting viewId into service logs to get view name
                if (req.param("viewId")) {
                    insertLog.viewId = req.param("viewId");
                }
                var logId = Utility.getUniqueObjectId();
                serviceLogParams.logId = logId;
                var p = SELF.addServiceLog(logId, insertLog);
                serviceLogParams.insertPromise = p;
                return db.query(query);
            }).then(
            function (result) {
                serviceLogParams.mongoTime = db.mongoTime;
                if (db.logger) {
                    serviceLogParams.logCount = db.logger.logCount;
                }
                writeJSONResponse(req, res, result, db, serviceLogParams);
            }).fail(
            function (err) {
                if (db) {
                    serviceLogParams.mongoTime = db.mongoTime;
                    if (db.logger) {
                        serviceLogParams.logCount = db.logger.logCount;
                    }
                }
                err = getErrorObejct(err);
                writeJSONResponse(req, res, err, db, serviceLogParams);
            })
    });

    app.all("/rest/service", function (req, res) {
        var startTime = new Date();
        var db = undefined;
        var options = req.param("options");
        options = options ? (typeof options == "object" ? options : JSON.parse(options)) : {};
        options.serviceName = "/rest/service";
        var serviceLogParams = {startTime:startTime};
        return runInDomain(req, res).then(
            function () {
                return getConnectedDB(req.param("token"), req.param("code"), options);
            }).then(
            function (db1) {
                db = db1;
                var service = req.param("service");
                var token = req.param("token");
                service = typeof service == "object" ? service : JSON.parse(service);
                var parameters = req.param("parameters") || {};
                parameters = typeof parameters == "object" ? parameters : JSON.parse(parameters);
                setInitialLogger(token, JSON.stringify(service), "service", startTime, req, db);
                var logId = Utility.getUniqueObjectId();
                var insertLog = {startTime:startTime, username:db.user ? db.user.username : undefined, token:token, serviceType:"service", db:db.db.databaseName, callType:"rest"};
                serviceLogParams.logId = logId;
                var p = SELF.addServiceLog(logId, insertLog);
                serviceLogParams.insertPromise = p;
                return db.invokeService(service, parameters);
            }).then(
            function (result) {
                writeJSONResponse(req, res, result, db, serviceLogParams);
            }).fail(
            function (err) {
                err = getErrorObejct(err);
                writeJSONResponse(req, res, err, db, serviceLogParams);
            })
    });

    app.all("/rest/batchquery", function (req, res) {
        var startTime = new Date();
        var db = undefined;
        var query = undefined;
        var connectionTime = undefined;
        var connectionStime = undefined;
        var options = req.param("options");
        options = options ? (typeof options == "object" ? options : JSON.parse(options)) : {};
        options.serviceName = "/rest/batchquery";
        var serviceLogParams = {startTime:startTime};
        return runInDomain(req, res).then(
            function () {
                connectionStime = new Date();
                return getConnectedDB(req.param("token"), req.param("code"), options);
            }).then(
            function (db1) {
                db = db1;
                connectionTime = new Date() - connectionStime;
                serviceLogParams.connectionTime = connectionTime;
                var userName = db.user ? db.user.username : undefined;
                var queryStr = req.param("query");
                if (!queryStr) {
                    throw new Error("Please provide value of mandatory parameters [query]");
                }
                if (typeof queryStr === "string") {
                    query = JSON.parse(queryStr);
                } else {
                    query = queryStr;
                    queryStr = JSON.stringify(queryStr);
                }
                for (var k in query) {
                    if (query[k].$modules !== undefined) {
                        throw new Error("Modules can not be excluded in Batch Query from rest Service.Query is [" + JSON.stringify(query[k]) + "]");
                    }
                }
                var token = req.param("token");
                var collectionName = (query.data && query.data.$collection) ? query.data.$collection : undefined;
                var filterKeys = (query.data && query.data.$filter) ? JSON.stringify(Object.keys(query.data.$filter)) : undefined;
                setInitialLogger(token, queryStr, "batchquery", startTime, req, db);
                var insertLog = {connectionTime:connectionTime, startTime:startTime, username:userName, token:token, serviceType:"batchquery", db:db.db.databaseName, info:{query:queryStr}, key:(collectionName ? collectionName : undefined), subkeyL1:(filterKeys ? filterKeys : undefined), callType:"rest"};
                if (!query.data) {
                    insertLog.key = JSON.stringify(Object.keys(query));
                }
                if (req.param("viewId")) {
                    insertLog.viewId = req.param("viewId");
                }
                var logId = Utility.getUniqueObjectId();
                serviceLogParams.logId = logId;
                var p = SELF.addServiceLog(logId, insertLog);
                serviceLogParams.insertPromise = p;
                return db.batchQuery(query);
            }).then(
            function (result) {
                serviceLogParams.mongoTime = db.mongoTime;
                serviceLogParams.query = query;
                if (db.logger) {
                    serviceLogParams.logCount = db.logger.logCount;
                }
                writeJSONResponse(req, res, result, db, serviceLogParams);
            }).fail(
            function (err) {
                if (db) {
                    serviceLogParams.mongoTime = db.mongoTime;
                    if (db.logger) {
                        serviceLogParams.logCount = db.logger.logCount;
                    }
                }
                err = getErrorObejct(err);
                writeJSONResponse(req, res, err, db, serviceLogParams);
            })
    });

    app.all("/rest/update", function (req, res) {
        var db = undefined;
        var result = undefined;
        var startTime = new Date();
        var batchUpdate = undefined;
        var connectionTime = undefined;
        var connectionStime = undefined;
        var options = req.param("options");
        options = options ? (typeof options == "object" ? options : JSON.parse(options)) : {};
        options.serviceName = "/rest/update";
        var serviceLogParams = {startTime:startTime};
        return runInDomain(req, res).then(
            function () {
                connectionStime = new Date();
                return getConnectedDB(req.param("token"), req.param("code"), options);
            }).then(
            function (connectedDB) {
                db = connectedDB;
                connectionTime = new Date() - connectionStime;
                serviceLogParams.connectionTime = connectionTime;
                var userName = db.user ? db.user.username : undefined;

                var updateStr = req.param("update");
                if (!updateStr) {
                    throw new Error("Please provide value of mandatory parameters [update]");
                }
                if (typeof updateStr === "string") {
                    batchUpdate = JSON.parse(updateStr);
                } else {
                    batchUpdate = updateStr;
                    updateStr = JSON.stringify(updateStr);
                }
                if (batchUpdate.$modules !== undefined) {
                    throw new Error("Modules can not be excluded in Update from rest Service.Query is [" + JSON.stringify(batchUpdate) + "]");
                }
                var token = req.param("token");
                var collectionName = (Array.isArray(batchUpdate) && (batchUpdate.length > 0) && batchUpdate[0].$collection ) ? batchUpdate[0].$collection : undefined;
                if (Utility.isJSONObject(batchUpdate)) {
                    collectionName = batchUpdate.$collection ? batchUpdate.$collection : undefined;
                }
                setInitialLogger(token, updateStr, "update", startTime, req, db);
                var insertLog = {connectionTime:connectionTime, startTime:startTime, username:userName, token:token, serviceType:"update", db:db.db.databaseName, info:{update:updateStr}, key:(collectionName ? collectionName : undefined), callType:"rest"};
                if (req.param("viewId")) {
                    insertLog.viewId = req.param("viewId");
                }
                var logId = Utility.getUniqueObjectId();
                serviceLogParams.logId = logId;
                var p = SELF.addServiceLog(logId, insertLog);
                serviceLogParams.insertPromise = p;
                return db.startTransaction();
            }).then(
            function () {
                if (options.__allrowselected__ && options.requestQuery) {
                    //in case of selecting all rows from ui, we have require all ids to get updated. -- rajit garg
                    return getIdsFromQuery(options.requestQuery, db);
                }
            }).then(
            function (ids) {
                if (ids && ids.length > 0) {
                    //by using this function we get updated batchUpdate, including all ids -- Rajit garg
                    return generateUpdatesForAllSelectedRows(ids, batchUpdate);
                }
            }).then(
            function () {
                options.domain = req.headers.host;
                return db.update(batchUpdate, options);
            }).then(
            function (updateResult) {
                result = updateResult;
                return db.commitTransaction();
            }).then(
            function () {
                serviceLogParams.mongoTime = db.mongoTime;
                if (db.logger) {
                    serviceLogParams.logCount = db.logger.logCount;
                }
                writeJSONResponse(req, res, result, db, serviceLogParams);
            }).fail(
            function (err) {
                err = getErrorObejct(err);
                if (!db) {
                    writeJSONResponse(req, res, err, undefined, serviceLogParams);
                    return;
                }
                return db.rollbackTransaction()
                    .fail(
                    function () {
                        //do nothing.
                    }).then(
                    function () {
                        if (db) {
                            serviceLogParams.mongoTime = db.mongoTime;
                            if (db.logger) {
                                serviceLogParams.logCount = db.logger.logCount;
                            }
                        }
                        writeJSONResponse(req, res, err, db, serviceLogParams);
                    })
            })

    });

    app.all("/rest/invoke", function (req, res) {
        var db = undefined;
        var dbName = undefined;
        var result = undefined;
        var userName = undefined;
        var startTime = new Date();
        var functionName = req.param("function");
        var parameters = req.param("parameters");
        var processDetail = undefined;
        var connectionStime = undefined;
        var options = req.param("options");
        options = options ? (typeof options == "object" ? options : JSON.parse(options)) : {};
        options.serviceName = "/rest/invoke";
        var serviceLogParams = {startTime:startTime};
        var reqToken = req.param("token");
        var reqCode = req.param("code");
        if (req.param("customService")) {
            var customService = req.param("customService");
            try {    // For LinkedIn Service : function & token is in state
                customService = customService ? (typeof customService == "object" ? customService : JSON.parse(customService)) : {};
            } catch (e) {
                if (typeof  customService === "string") {
                    customService = req.param(customService);   //it is used as variable.
                    customService = customService ? (typeof customService == "object" ? customService : JSON.parse(customService)) : {};
                }
            }
            if (customService.token) {
                reqToken = customService.token;
            } else if (customService.code) {
                reqCode = customService.code;
            }
            functionName = customService.function;
            var allParams = getRequestParams(req);
            parameters = [allParams];
        }
        return runInDomain(req, res).then(
            function () {
                connectionStime = new Date();
                parameters = parameters ? (typeof parameters == "object" ? parameters : JSON.parse(parameters)) : [];
                options.userAccessToken = req.param("user_access_token");
                options.functionName = functionName;
                return getConnectedDB(reqToken, reqCode, options);
            }).then(
            function (connectedDB) {
                serviceLogParams.connectionTime = new Date() - connectionStime;
                db = connectedDB;
                dbName = db.db.databaseName;
                userName = db.user ? db.user.username : undefined;
                var token = reqToken;
                var userAccessToken = req.param("user_access_token");
                var funcInfoStr = JSON.stringify({function:functionName, parameters:parameters, options:options});
                setInitialLogger(token, funcInfoStr, "invoke", startTime, req, db);
                var insertLog = {startTime:startTime, username:userName, token:token, user_access_token:userAccessToken, serviceType:"invoke", db:dbName, info:{functionInfo:funcInfoStr}, key:functionName, callType:"rest"};
                var isParamsValidArray = undefined;
                if (Array.isArray(parameters) && (parameters.length > 0)) {
                    isParamsValidArray = true;
                }
                if (functionName === "view.getView") {
                    insertLog.subkeyL1 = (isParamsValidArray && parameters[0].id) ? parameters[0].id : undefined;
                    insertLog.view = true;
                } else if (functionName === "getMenuState") {
                    var collectionName = (isParamsValidArray && parameters[0].collection) ? parameters[0].collection : undefined;
                    insertLog.application = (isParamsValidArray && parameters[0].application && parameters[0].application.label) ? parameters[0].application.label : undefined;
                    insertLog.view = true;
                } else if (functionName === "getUserState") {
                    insertLog.view = true;
                }
                if (req.param("viewId")) {
                    insertLog.viewId = req.param("viewId");
                }
                var logId = Utility.getUniqueObjectId();
                serviceLogParams.logId = logId;
                serviceLogParams.functionName = functionName;
                options.serviceLogId = logId;
                if (options.enablelogs === false) {
                    serviceLogParams.enablelogs = options.enablelogs;
                    insertLog.enablelogs = options.enablelogs;
                }
                var p = SELF.addServiceLog(logId, insertLog);
                serviceLogParams.insertPromise = p;
                if (req.param("autocommit") == "true") {
                    return;
                }
                return db.startTransaction();
            }).then(
            function () {
                if (options.$modules !== undefined) {
                    throw new Error("Modules can not be excluded in Invoke Function.Options are [" + JSON.stringify(options) + "]");
                }
                if (options.async) {
                    return db.createProcess(options);
                }
            }).then(
            function (pprocessDetail) {
                processDetail = pprocessDetail;
                if (parameters && Array.isArray(parameters) && parameters.length > 0 && parameters[0] && parameters[0].__allrowselected__ && parameters[0].requestQuery) {
                    return getIdsFromQuery(parameters[0].requestQuery, db).then(function (ids) {
                        if (ids.length === 0) {
                            throw new Error("No Row found for selection.");
                        }
                        parameters[0]._id = ids;

                    })
                }
            }).then(
            function (result) {
                options.domain = req.headers.host;
                if (options.async) {
                    var processId = processDetail ? processDetail.processid : undefined;
                    var asyncDB = db.asyncDB();
                    var invokeError = undefined;
                    asyncDB.invokeFunction(functionName, parameters, options).fail(
                        function (err) {
                            invokeError = Utility.getErrorInfo(err);
                        }).then(function () {
                            if (processId) {
                                var update = {};
                                update.$query = {_id:processId};
                                update.$set = {status:"success"};
                                if (invokeError) {
                                    update.$set.status = "error";
                                    update.$push = {detail:{$each:[
                                        {_id:Utility.getUniqueObjectId(), status:"Error", error:JSON.stringify(invokeError)}
                                    ]}};
                                    var userName = asyncDB && asyncDB.user ? asyncDB.user.username : undefined;
                                    var options = {to:["rohit.bansal@daffodilsw.com", "sachin.bansal@daffodilsw.com"], from:"developer@daffodilsw.com", subject:"Error in /rest/invoke" };
                                    var html = "functionname: " + functionName + ">>>parameters>>>" + JSON.stringify(parameters) + ">>>>username>>>>" + userName + ">>>>err>>>>" + JSON.stringify(invokeError);
                                    options.html = html;
                                    MailService.sendFromAdmin(options);
                                }
                                asyncDB.mongoUpdate([
                                    {$collection:"pl.processes", $update:update}
                                ])
                            }
                        });
                    return result;
                } else {
                    return db.invokeFunction(functionName, parameters, options);
                }
            }).then(
            function (updateResult) {
                result = updateResult;
                if (functionName === "getMenuState" && result.views && result.views.length > 0) {
                    if (result.views[0].viewOptions && result.views[0].viewOptions.dataError) {
                        serviceLogParams.error = {"message":result.views[0].viewOptions.dataError.message, "stack":result.views[0].viewOptions.dataError.stack};
                    }
                    if (result.views[0].viewOptions && result.views[0].viewOptions.id) {
                        serviceLogParams.subkeyL1 = result.views[0].viewOptions.id;
                        serviceLogParams.viewId = result.views[0].viewOptions.id;
                    }
                } else if (functionName === "getUserState" && result.views && result.views.length > 0) {
                    if (result.views[0].viewOptions && result.views[0].viewOptions.dataError) {
                        serviceLogParams.error = {"message":result.views[0].viewOptions.dataError.message, "stack":result.views[0].viewOptions.dataError.stack};
                    }
                    if (result.views[0].viewOptions && result.views[0].viewOptions.id) {
                        serviceLogParams.subkeyL1 = result.views[0].viewOptions.id;
                        serviceLogParams.viewId = result.views[0].viewOptions.id;
                    }
                } else if (functionName === "view.getView" && result.viewOptions && result.viewOptions.id) {
                    if (result.viewOptions.dataError) {
                        serviceLogParams.error = {"message":result.viewOptions.dataError.message, "stack":result.viewOptions.dataError.stack};
                    }
                    serviceLogParams.viewId = result.viewOptions.id;
                }
                if (req.param("autocommit") == "true") {
                    return;
                }
                return db.commitTransaction();
            }).then(
            function () {
                return removeUserConnection(req.param("user_access_token"));
            }).then(
            function () {
                serviceLogParams.mongoTime = db.mongoTime;
                serviceLogParams.processId = processDetail && processDetail.processid ? processDetail.processid : undefined;
                var responseOptions = {};
                if (result && result.redirectUrl && result.respRedirect) {
                    responseOptions["respRedirect"] = result.respRedirect;
                    responseOptions["doNotGzip"] = true;
                    writeJSONResponse(req, res, result.redirectUrl, db, serviceLogParams, responseOptions);
                } else if (result && Utility.isJSONObject(result) && result.useAsFile) {
                    //writing json response for binary result on the basis of binary true in responseOptions -- Rajit garg 08/04/2015
                    var head = {};
                    head["Access-Control-Allow-Credentials"] = true;
                    head["Content-Type"] = result["Content-Type"];
                    head["Content-Disposition"] = result["Content-Disposition"];
                    responseOptions["head"] = head;
                    responseOptions["doNotGzip"] = true;
                    writeJSONResponse(req, res, result.binary, db, serviceLogParams, responseOptions);
                } else {
                    if (db.logger) {
                        serviceLogParams.logCount = db.logger.logCount;
                    }
                    if (result && result["html"] && result["Content-Type"] && result["Content-Type"] == "html") {
                        var head = {};
                        head["Content-Type"] = result["Content-Type"];
                        responseOptions["head"] = head;
                        responseOptions["doNotGzip"] = true;
                        result = result.html;
                    } else if (options.success_url) {
                        responseOptions["respRedirect"] = true;
                        responseOptions["doNotGzip"] = true;
                        result = options.success_url;
                    }
                    writeJSONResponse(req, res, result, db, serviceLogParams, responseOptions);
                }
            }).then(
            function () {
                var pendingTime = req.param("pendingTime");
                if (pendingTime) {
                    return insertClientTimeInServiceLogs(pendingTime);
                }
            }).fail(
            function (err) {
                err = getErrorObejct(err);
                if (serviceLogParams) {
                    serviceLogParams.error = err;
                }
                if (options.failed_url) {
                    options["respRedirect"] = true;
                    options["doNotGzip"] = true;
                    var errorStr = err.message || err.stack;
                    err = options.failed_url + "?error=" + errorStr;
                }
                if (!db) {
                    writeJSONResponse(req, res, err, undefined, serviceLogParams, options);
                    return;
                }
                return db.rollbackTransaction().fail(
                    function () {
                        //do Nothing
                    }).then(
                    function () {
                        if (db) {
                            serviceLogParams.mongoTime = db.mongoTime;
                            if (db.logger) {
                                serviceLogParams.logCount = db.logger.logCount;
                            }
                        }
                        writeJSONResponse(req, res, err, db, serviceLogParams, options);
                    });
            }).then(function () {
                if (serviceLogParams.viewId) {
                    logUserViewInfo(dbName, startTime, userName, serviceLogParams.viewId);
                }
                processDetail = undefined;
                serviceLogParams = undefined;
            })
    });

    app.all("/rest/file/render", renderFile);

    app.all("/rest/file/download", fileDownload);

    app.all("/rest/file/upload", fileUpload);

    app.all("/rest/forgotPassword", function (req, res) {
        var email = req.param("email");
        var username = req.param("username");
        var mailTemplate = req.param("mailTemplate");
        var database = req.param("database");
        var sendOTP = req.param("sendOTP");
        var domain = req.headers.host;
        var User = require("ApplaneApps/lib/apps/User.js");
        var options = {"username":username, sendOTP:sendOTP};
        if (mailTemplate) {
            options.mailTemplate = mailTemplate
        }
        return User.forgotPassword(email, database, domain, options).then(
            function (result) {
                writeJSONResponse(req, res, result, undefined);
            }).fail(function (err) {
                err = getErrorObejct(err);
                writeJSONResponse(req, res, err, undefined);
            });
    })
    app.all("/rest/xslt", function (req, res) {
        try {
            var template = req.param("template");
            var queryResult = req.param("result");
            if (queryResult) {
                queryResult = JSON.parse(queryResult)
            }

            var xml = require("js2xmlparser")("root", queryResult);    //gives xml    , while the data object can contain arrays, it cannot itself be an array (object or JSON string, mandatory)
            var xslt = require('node_xslt');                             // for installing this, first of all install this   sudo apt-get install libxml2-dev libxslt-dev
            var document = xslt.readXmlString(xml);
            var stylesheet = xslt.readXsltString(template);   // template = xslt
            var resolvedTemplate = xslt.transform(stylesheet, document, []);
            writeJSONResponse(req, res, resolvedTemplate)
        } catch (e) {
            writeJSONResponse(req, res, e)
        }


    })
};


function getConnectedDB(token, code, options) {
    return getDBToConnect(token, code, options).then(function (db) {
        if (options) {
            if (options.userTimezoneOffset) {
                db.setUserTimezoneOffset(options.userTimezoneOffset);
            }
            if (options.$context) {
                //use for tole to pass role in context in rest call
                db.setContext(options.$context);
            }
        }
        return db;
    })
}

function getDBToConnect(token, code, options) {
    if (token) {
        return SELF.getConnection(token);
    } else if (code) {
        return getDBFromCode(code, options);
    } else if (options && options.serviceName === "/rest/invoke" && options.userAccessToken) {
        return SELF.getDBFromUserAccessToken(options.userAccessToken, options.functionName, options);
    } else {
        throw new Error("Neither token nor code provided to connect");
    }
}

//this function is used to update service logs with client render and response time -- rajit garg
function insertClientTimeInServiceLogs(pendingTime) {
    pendingTime = typeof pendingTime === "string" ? JSON.parse(pendingTime) : pendingTime;
    var servicelogIds = Object.keys(pendingTime);
    if (servicelogIds.length > 0) {
        ApplaneDB.getLogDB().then(
            function (logDb) {
                return Utility.iterateArrayWithPromise(servicelogIds, function (index, servicelogId) {
                    servicelogId = Utility.getObjectId(servicelogId);
                    return logDb.mongoUpdate({$collection:"pl.servicelogs", $update:{$query:{_id:servicelogId}, $set:pendingTime[servicelogId]}});
                });
            });
    }
}

function getIdsFromQuery(query, db) {
    query.$fields = {_id:1};
    delete query.$limit;
    delete query.$skip;
    return db.query(query).then(function (result) {
        var ids = [];
        for (var i = 0; i < result.result.length; i++) {
            ids.push(result.result[i]._id);
        }
        return ids;
    })
}

//this function is used to update $update by setting setField to all _id's, require in case of selecting All rows(including rows that are not showing on that page or are part of other page) from UI -- Rajit garg.
function generateUpdatesForAllSelectedRows(ids, batchUpdate) {
    if (Utility.isJSONObject(batchUpdate)) {
        batchUpdate = [batchUpdate];
    }

    if (batchUpdate && batchUpdate.length > 0) {
        var setInfo = undefined;
        var updates = batchUpdate[0]["$update"];
        if (updates && updates.length > 0) {
            setInfo = Utility.deepClone(updates[0]["$set"]);
        }
        if (setInfo) {
            batchUpdate[0]["$update"] = [];
            for (var i = 0; i < ids.length; i++) {
                batchUpdate[0]["$update"].push({"$set":setInfo, "_id":ids[i]});
            }
        }
    }
}

exports.handleFaultyWorkers = function (cluster, pingHistory) {
    setInterval(function () {
        restartDeadWorkers(pingHistory);
    }, 10000);
    if (Config.SERVER_PROFILING) {
        setInterval(function () {
            require("./ServerProfiling").addSystemLogs(pingHistory);
        }, 30000);
    }
};

exports.handleClusterServerMessages = function (cluster, pingHistory, worker) {
    if (cluster.isMaster && worker) {
        worker.on('message', function (msg) {
            // update ping history for workers
            if (msg.status && msg.status === "ok") {
                var pid = worker.process.pid;
                pingHistory[pid] = new Date();
            }
            // clear process cache
            if (msg.clearProcessCache && msg.clearProcessCache === true) {
                Object.keys(cluster.workers).forEach(function (id) {
                    cluster.workers[id].send(msg);
                });
            }
        });
    } else {
        // ping master
        process.send({status:"ok"});
        setInterval(function () {
            process.send({status:"ok"});
        }, 10000);
        // clear process cache
        process.on("message", function (msg) {
            if (msg.clearProcessCache && msg.clearProcessCache === true) {
                ProcessCache.clearCache(msg.bucket, msg.mainKey, msg.subKey);
            }
        });
    }
};

function restartDeadWorkers(pingHistory) {
    // checks if any worker is unresponsive ; if so, kill ( send mail ) and respawn.
    var currentTime = new Date();
    for (var pid in pingHistory) {
        var updatedSince = currentTime - pingHistory[pid];
        if (updatedSince > 30000) {
            process.kill(pid);
            delete pingHistory[pid];
            var options = {to:["ashu.vashishat@daffodilsw.com", "rohit.bansal@daffodilsw.com"], from:"developer@daffodilsw.com"};
            options.text = "Worker Pid : " + pid + " for Server : " + Config.SERVER_NAME;
            options.subject = Config.SERVER_NAME + " : worker restarted.";
            MailService.sendFromAdmin(options);
        }
    }
}

exports.handleMarketPlaceData = function (oauthData, options) {
    if (oauthData.db) {
        return;
    }
    var host = oauthData.host;
    var emailid = oauthData.emailid;
    var domainName = emailid.substring((emailid.indexOf('@') + 1));
    var adminDB = undefined;
    var mappingDetails = undefined;
    return ApplaneDB.getAdminDB().then(
        function (admindb1) {
            adminDB = admindb1;
            return adminDB.query({$collection:"pl.domainmappings", $filter:{domain:domainName}, $fields:{db:1}, $events:false, $modules:false});
        }).then(
        function (data) {
            if (data.result.length > 0) {
                oauthData.db = data.result[0].db;
                return;
            }
            return adminDB.query({$collection:"pl.urlmappings", $filter:{url:host}, $events:false, $modules:false});
        }).then(function (data) {
            if (oauthData.db) {
                return;
            }
            if (data.result.length === 0) {
                throw new Error(" Url [" + host + "] is not defined in UrlMappings.");
            }
            mappingDetails = data.result[0];
            var restrictedDomains = mappingDetails.restrictedDomains || [];
            for (var i = 0; i < restrictedDomains.length; i++) {
                var restrictedDomain = restrictedDomains[i].domain;
                if (restrictedDomain === domainName) {
                    throw new Error("Login through domain [" + domainName + "] is not valid.");
                }
            }
            options.defaultFields = {};
            var roles = mappingDetails.roles;
            if (roles && roles.length > 0) {
                options.defaultFields.roles = [];
                for (var i = 0; i < roles.length; i++) {
                    options.defaultFields.roles.push({role:{$query:{id:roles[i].role}}});
                }
            }
            return manageDomainAndCreateDB(domainName, mappingDetails, oauthData, adminDB, options);
        })
};

function manageDomainAndCreateDB(domainName, mappingDetails, oauthData, adminDb, options) {
    var db = undefined;
    var emailid = oauthData.emailid;
    var dbName = domainName.substring(0, domainName.indexOf("."));
    return adminDb.update({$collection:"pl.dbs", $insert:{db:dbName, globalDb:mappingDetails.globalDb, globalUserName:emailid, globalUserEmailid:emailid, globalUserAdmin:true}}).then(function () {
        return adminDb.update({$collection:"pl.domainmappings", $insert:{domain:domainName, db:dbName}}).then(
            function () {
                return adminDb.connectUnauthorized(dbName);
            }).then(
            function (dbToConnect) {
                db = dbToConnect;
                var userInfo = {username:emailid, fullname:oauthData.name || emailid};
                return createUser(oauthData, userInfo, adminDb, db, options);
            }).then(function () {
                oauthData.db = dbName;
                var dbSetUp = mappingDetails.dbSetUp;
                if (dbSetUp) {
                    return db.invokeFunction(dbSetUp, [
                        {}
                    ]);
                }
            })
    });
}

function createUser(params, userInfo, adminDB, db, options) {
    if (options && options.defaultFields) {
        for (var k in options.defaultFields) {
            userInfo[k] = options.defaultFields[k];
        }
    }
    return updateUser(userInfo, db, options).then(
        function () {
            return adminDB.query({$collection:"pl.urlmappings", $filter:{url:params.host, userSetUp:{$exists:true}}, $fields:{userSetUp:1}});
        }).then(
        function (result) {
            if (result.result.length > 0 && result.result[0].userSetUp) {
                return db.invokeFunction(result.result[0].userSetUp, [
                    {}
                ]);
            }
        });
}

function updateUser(userInfo, db, options) {
    var userCollection = options.userCollection || "pl.users";
    return db.query({$collection:userCollection, $filter:{username:userInfo.username}, $limit:1, $events:false, $modules:{"Role":0}}).then(function (result) {
        if (result.result.length > 0) {
            return db.update({$collection:userCollection, $update:{_id:result.result[0]._id, $set:userInfo}, $modules:{"Role":0}});
        } else {
            return db.update({$collection:userCollection, $insert:userInfo, $modules:{"Role":0}});
        }
    })
}

function handleOAuthCallback(req, res, oauthData, options) {
    var result = {};
    var oauthCode = undefined;
    var userDB = undefined;
    var userOptions = undefined;
    options = options || {};
    return SELF.oAuthLogin(oauthData, options).then(
        function (oauthCode1) {
            oauthCode = oauthCode1;
            var dbName = oauthData.db;
            userOptions = {username:oauthData.username, fields:options.fields};
            return SELF.connectOauthDB(dbName, oauthCode, userOptions);
        }).then(
        function (userDB1) {
            userDB = userDB1;
            result.user = userDB.user;
            var connectionToken = Utility.getHashedToken();
            result.token = connectionToken;
            return SELF.saveConnection(connectionToken, oauthData.db, oauthCode, userOptions);
        }).then(
        function () {
            if (oauthData.authType !== "google_client") {
                SELF.redirectOAuthURL(req, res, result.token, oauthData);
            } else {
                return result;
            }
        });
}


function authenticateGoogleAccessToken(options) {
    if (options.authType === "google_client") {
        var httputil = require("ApplaneCore/apputil/httputil");
        var googleTokens = options.googleTokens || {};
        var service = {hostname:"https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=" + googleTokens.access_token};
        return httputil.executeServiceAsPromise(service, undefined, {requestModule:true}).then(function (result) {
            if (result && typeof result === "string") {
                result = JSON.parse(result);
                if (result && result.user_id !== options.google_user_id) {
                    throw new Error("google authentication failed");
                }
            }
        });
    } else {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
}

exports.oAuthLogin = function (params, options) {
    var dbName = params.db;
    if (!dbName) {
        throw new Error(" db is undefined in OAuth Login ");
    }
    // this code  is commented because redirect_url is undefined when login using google from client side.
    /*if (!redirectURL) {
     throw new Error(" redirectURL is undefined in OAuth Login ");
     }*/
    var code = params.code;
    var authType = params.authType;
    var emailid = params.emailid;
    if (!emailid) {
        throw new Error(" EmailID not found for " + authType + " OAuth login");
    }
    var adminDB = undefined;
    var db = undefined;
    // authenticateGoogleAccessToken is called then trying to login with goolge from client side.
    var userCollection = options.userCollection || "pl.users";
    return authenticateGoogleAccessToken(params).then(
        function () {
            return ApplaneDB.getAdminDB();
        }).then(
        function (adminDB1) {
            adminDB = adminDB1;
            return adminDB.connectUnauthorized(dbName);
        }).then(
        function (db1) {
            db = db1;
            return db.query({$collection:userCollection, $fields:{_id:1, google_user_id:1, facebook_user_id:1, googleRefreshToken:1, username:1}, $filter:{emailid:emailid}, $limit:2, $events:false, $modules:{Role:0}});
        }).then(
        function (data) {
            data = data.result;
            if (data.length > 1) {
                throw new Error(" Multiple users found with same EmailID : " + emailid);
            } else if (data.length === 0) {
                params.username = emailid;
                var userInfo = {username:params.username, emailid:emailid, fullname:params.name || emailid};
                if (authType === "google") {
                    if (params.googleTokens && params.googleTokens.refresh_token) {
                        userInfo.googleRefreshToken = params.googleTokens.refresh_token;
                    } else {
                        throw new Error("OAuth Login doesn't have sufficient priviliges. Please revoke access and try again.");
                    }
                } else if (authType === "linkedin") {
                    if (params.linkedinToken && params.linkedinToken.access_token) {
                        userInfo.linkedinAccessToken = params.linkedinToken.access_token;
                    } else {
                        throw new Error("OAuth Login doesn't have sufficient priviliges. Please revoke access and try again.");
                    }
                } else if (authType === "google_client") { // login using google button from client side
                    userInfo.google_user_id = params.google_user_id;
                } else if (authType !== "google" || authType !== "linkedin") {
                    throw new Error("OAuth Login type : " + authType + " is not supported at present.");
                }
                return createUser(params, userInfo, adminDB, db, options);
            } else {
                params.username = data[0].username;
                if (params.googleTokens && authType === "google") {
                    var loginGoogleToken = params.googleTokens.refresh_token;
                    if (loginGoogleToken) {
                        return db.update({$collection:userCollection, $update:{_id:data[0]._id, $set:{googleRefreshToken:loginGoogleToken}}, $events:false, $modules:{Role:0}});
                    } else if (!data[0].googleRefreshToken) {
                        params.redirectURL = "/rest/oauth/google?approval_prompt=force&__org__=" + dbName;
                        params.forcedLogin = true;
                    }
                } else if (params.linkedinToken && authType === "linkedin") {
                    if (params.linkedinToken) {
                        var linkedInToken = params.linkedinToken.access_token;
                        if (linkedInToken) {
                            return db.update({$collection:userCollection, $update:{_id:data[0]._id, $set:{linkedinAccessToken:params.linkedinToken.access_token}}, $events:false, $modules:{Role:0}});
                        }
                    }
                } else if (authType === "google_client") { // login using google button from client side and updating the google user id if the user exists
                    return db.update({$collection:userCollection, $update:{_id:data[0]._id, $set:{google_user_id:params.google_user_id}}, $events:false, $modules:{Role:0}});
                } else if (authType !== "google" || authType !== "linkedin") {
                    throw new Error("OAuth Login type : " + authType + " is not supported at present.");
                }
            }
        }).then(
        function () {
            return adminDB.update({$collection:"pl.oauthconnections", $insert:{token:code, username:params.username}});
        }).then(
        function () {
            return code;
        });
};

exports.redirectOAuthURL = function (req, res, token, params) {
    var redirectURL = params.redirectURL;
    var authType = params.authType;
    if (!params.forcedLogin) {
        res.cookie("token", token);
        res.cookie("oauthProvider", authType);
    }
    if (params.skipRedirection) {
        writeJSONResponse(req, res, {token:token});
    } else {
        res.redirect(redirectURL);      // to avoid #_=_ in case of fb login
    }
};

function setInitialLogger(token, info, type, startTime, req, db) {
    var logInfo = {};
    logInfo.url = req.url;
    logInfo.info = JSON.stringify(info);
    logInfo.startTime = startTime;
    logInfo.token = token;
    logInfo.username = db.user.username;
    logInfo.type = type;
    logInfo.status = "In Progress";
    logInfo.db = db.db.databaseName;
    var Logger = require('./Logger.js');
    var logger = new Logger(logInfo);
    var logInCreateConnection = {"log":"Connection"};
    logInCreateConnection.type = type + " In Connection";
    logInCreateConnection.startTime = startTime;
    logInCreateConnection.endTime = new Date();
    logInCreateConnection.totalTime = logInCreateConnection.endTime.getTime() - logInCreateConnection.startTime.getTime();
    logger.writeLog(logInCreateConnection);
    var enableLogs = req.param("enablelogs");
    if (enableLogs === 'true' || enableLogs === true) {
        logger.enable = true;
    }
    db.setLogger(logger);
}

function getConnectionFromCache(token) {
    // handling for : cache service returns promise whereas process cache does not// for cache server
    var userInfo = CacheService.getUserConnection(token);
    if (!userInfo) {
        return;
    }
    if (Q.isPromise(userInfo)) {
        // for cache server
        return userInfo.then(function (userInfoCache) {
            if (!userInfoCache) {
                return;
            }
            return getDBInstance(userInfoCache, token);
        })
    } else {
        // for process cache
        return getDBInstance(userInfo, token);
    }
}

function getDBInstance(userInfo, token) {
    return ApplaneDB.connectUnauthorizedFromCache(userInfo).then(function (db) {
        db.token = token;
        return db;
    });
}

function getConnectionFromDB(token) {
    var connection = undefined;
    var adminDB = undefined;
    var db = undefined;
    return ApplaneDB.getAdminDB().then(
        function (adb) {
            adminDB = adb;
            return adminDB.query(
                {$collection:Constants.Admin.CONNECTIONS, $filter:{token:token}, $events:false, $modules:false }
            );
        }).then(
        function (result) {
            connection = result && result.result && result.result.length == 1 ? result.result[0] : undefined;
            if (!connection) {
                throw new ApplaneDBError(Constants.ErrorCode.NOT_CONNECTED.MESSAGE, Constants.ErrorCode.NOT_CONNECTED.CODE);
            }
            return adminDB.update(
                {$collection:Constants.Admin.CONNECTIONS, $update:{_id:connection._id, $set:{lastUpdatedOn:new Date()}}, $events:false, $modules:false}
            );
        }).then(
        function () {
            var oauthCode = connection[Constants.Admin.Conncetions.OAUTH_CODE];
            if (oauthCode) {
                return ApplaneDB.connectWithOAuth(Config.URL, connection[Constants.Admin.Conncetions.DB], oauthCode, connection[Constants.Admin.Conncetions.OPTIONS]);
            } else {
                return getCode(connection[Constants.Admin.Conncetions.DB], adminDB).then(function (code) {
                    return ApplaneDB.connectWithCode(Config.URL, connection[Constants.Admin.Conncetions.DB], code, connection[Constants.Admin.Conncetions.OPTIONS]);
                })

            }
        }).then(
        function (db1) {
            db = db1;
            db.token = token;
            return cacheUserConnection(db.token, db);
        }).then(function () {
            return db;
        })
}

function cacheUserConnection(key, db) {
    var value = db.getCacheUserObject(db);
    return CacheService.setUserConnection(key, value);
}


exports.getConnection = function (token) {
    if (!token) {
        throw new ApplaneDBError(Constants.ErrorCode.MANDATORY_FIELDS.MESSAGE + "[token]", Constants.ErrorCode.MANDATORY_FIELDS.CODE);
    }
    var connectedDB = getConnectionFromCache(token);
    if (!connectedDB) {
        return getConnectionFromDB(token);
    } else {
        if (Q.isPromise(connectedDB)) {
            return connectedDB.then(function (db) {
                if (db) {
                    return db;
                } else {
                    return getConnectionFromDB(token);
                }
            })
        } else {
            var d = Q.defer();
            d.resolve(connectedDB);
            return d.promise;
        }
    }
};

function checkIEBrowser(req) {
    var userAgent = req.headers["user-agent"];
    // trident is the keyword which exists only in the internet explorer browser
    if (userAgent && userAgent.indexOf("Trident") > -1) {
        return true;
    } else {
        return false;
    }

}


function writeJSONResponse(req, res, result, db, serviceLogParams, options) {
    if (db && db.logger) {
        db.logger.populateInitialLog("writeJSONResponse initialized", {"type":"writeJSONResponse"}, db);
    }
    var jsonResponseType = {"Content-Type":"application/json", "Access-Control-Allow-Origin":"*", "Access-Control-Allow-Methods":"GET, POST, OPTIONS"};
    if (checkIEBrowser(req)) {
        jsonResponseType["Content-Type"] = "text/plain";
    }
    var warnings = db && db.getWarnings() ? db.getWarnings() : undefined;
    //Business logic error is used to show error to client -- Rajit garg
    if (result instanceof BusinessLogicError) {
        if (serviceLogParams) {
            serviceLogParams.error = result;
        }
        res.writeHead(417, jsonResponseType);
        var responseToWrite = {response:result.message, status:"error", code:result.code, promptUserWarning:result.promptUserWarning, warnings:warnings, message:result.message, businessLogicError:true}
        if (db && db.user && db.user.developer) {       //sending stack if developer is true in user properties -- Rajit garg 06/04/2015
            responseToWrite["stack"] = result.stack;
        }
        res.write(JSON.stringify(responseToWrite));
        res.end();
        setFinalLogInfo(db, serviceLogParams);
    }
    //Error is used to create a Task and Assigned to Employee -- Rajit garg
    else if (result instanceof Error) {
        if (serviceLogParams) {
            serviceLogParams.error = result;
        }
        return getRequestDetail(req).then(
            function (detail) {
                return;                    //will do later as user report an issue -- Rajit garg
                if (!db) {
                    return;
                }
                detail.stack = result.stack;
                var insert = {};
                insert[Constants.ContactSupports.SUBJECT] = result.message;
                insert[Constants.ContactSupports.DESCRIPTION] = JSON.stringify(detail);
                insert[Constants.ContactSupports.TYPE] = "Bug";
                return db.update({$collection:Constants.ContactSupports.TABLE, $insert:[insert]})
            }).fail(
            function (e) {
                // do nothing.
            }).then(
            function () {
                res.writeHead(417, jsonResponseType);
                var responseToWrite = {response:result.message, status:"error", code:result.code, warnings:warnings, message:result.message};
                if (db && db.user && db.user.developer) {
                    responseToWrite["stack"] = result.stack;
                }
                res.write(JSON.stringify(responseToWrite));
                res.end();
                setFinalLogInfo(db, serviceLogParams);
            })
    } else {
        var serverTime = 0;
        if (serviceLogParams) {
            serverTime = new Date() - serviceLogParams.startTime;
        }
        var query = undefined;
        if (serviceLogParams) {
            query = serviceLogParams.query;
        }
        var serviceLogId = undefined;
        if (serviceLogParams && serviceLogParams.logId) {
            serviceLogId = serviceLogParams.logId;
        }
        var processid = undefined;
        if (serviceLogParams && serviceLogParams.processId) {
            processid = serviceLogParams.processId;
        }
        var gzipProperty = false;
        var jsonResponse = undefined;
        if (req.headers && req.headers["accept-encoding"] && req.headers["accept-encoding"].indexOf("gzip") >= 0) {
            gzipProperty = true;
        }
        if (options && options["head"]) {
            var head = options["head"];
            for (var key in head) {
                jsonResponseType[key] = head[key];
            }
        }
        if (options && options["doNotGzip"]) {
            gzipProperty = false;
            jsonResponse = result;
        } else {
            jsonResponse = JSON.stringify({response:result, status:"ok", code:200, warnings:warnings, serverTime:serverTime, query:query, serviceLogId:serviceLogId, processid:processid });
            if (serviceLogParams) {
                serviceLogParams.responseLength = jsonResponse.length;
            }
        }
        if (gzipProperty) {
            require("zlib").gzip(jsonResponse, function (err, buffer) {
                if (serviceLogParams) {
                    if (err) {
                        serviceLogParams.error = err;
                    }
                    if (buffer) {
                        serviceLogParams.gzipSize = buffer.length;
                    }
                }
                jsonResponseType["Content-Encoding"] = "gzip";
                res.writeHead(200, jsonResponseType);
                res.write(buffer);
                res.end();
                setFinalLogInfo(db, serviceLogParams);
            })
        } else if (options && options.respRedirect) {
            res.redirect(result);
            setFinalLogInfo(db, serviceLogParams);
        } else {
            res.writeHead(200, jsonResponseType);
            res.write(jsonResponse);
            res.end();
            setFinalLogInfo(db, serviceLogParams);
        }
    }
}

function setFinalLogInfo(db, serviceLogParams) {
    if (db) {
        var logger = db.getLogger();
        if (logger) {
            logger.setInfo("endTime", new Date());
            var totalTime = logger.get("endTime").getTime() - logger.get("startTime").getTime();
            logger.setInfo("totalTime", totalTime);
            var persistLog = logger.enable; //we will not maintain logs of error as these are directly assigned as tasks to concerned person
            var error = serviceLogParams ? serviceLogParams.error : undefined;
            if (error) {
                var errStr = JSON.stringify({stack:error.stack, code:error.code, message:error.message});
                logger.setInfo("status", "Failed");
                logger.setInfo("error", errStr);
            } else {
                logger.setInfo("status", "Done");
            }
            var info = logger.info;
            var logPromise = persistLogInDB(info, totalTime, persistLog);
            serviceLogParams.logPromise = logPromise;
            logger.clean();
            info = undefined;
        }
    }
    if (serviceLogParams) {
        SELF.updateServiceLog(serviceLogParams);
    }
    cleanDB(db);
}

function persistLogInDB(info, totalTime, persistLog) {
    if (!info || !info.logs || info.logs.length == 0) {
        return;
    }
    if (totalTime > 5000) {
        persistLog = true;
    }
    if (persistLog) {
        return ApplaneDB.getLogDB().then(
            function (logDB) {
                manageInfoLogs(info);
                return logDB.mongoUpdate({$collection:"pl.logs", $insert:info});
            }).then(
            function (insert) {
                return (insert && insert["pl.logs"] && insert["pl.logs"].$insert && insert["pl.logs"].$insert.length > 0 && insert["pl.logs"].$insert[0]) ? insert["pl.logs"].$insert[0]._id : undefined;
            }).fail(
            function (e) {
                console.error("error in persist log..." + e.stack);
            })
    }
}

function manageInfoLogs(info) {
    var logs = info ? info.logs : undefined;
    var length = logs ? logs.length : 0;
    if (length === 0) {
        return;
    }
    for (var i = length - 1; i >= 0; i--) {
        var log = logs[i];
        var prevLog = i > 0 ? logs[i - 1] : undefined;
        if (log.log && typeof log.log !== "string") {
            log.log = JSON.stringify(log.log);
        }
        manageInfoLogs(log);
        var diff = 0;
        var key = undefined;
        if (prevLog) {
            prevLog.endTime = prevLog.endTime || log.startTime;
            prevLog.totalTime = prevLog.totalTime || (prevLog.endTime - prevLog.startTime);
        }
        if (i === logs.length - 1) {
            log.endTime = log.endTime || info.endTime;
            log.totalTime = log.totalTime || (log.endTime - log.startTime);
            diff = info.endTime - log.endTime;
            key = "end";
        } else {
            diff = log.startTime - (prevLog ? prevLog.endTime : info.startTime);
            key = prevLog ? i : "start";
        }
        if (diff > 0) {
            info.missingTime = info.missingTime || 0;
            info.missingTime += diff;
            info.missingDetails = info.missingDetails || {};
            info.missingDetails[key] = diff;
        }
        if (diff === 0 && log.totalTime === 0) {
//            logs.splice(i, 1);
        }
    }
}

function cleanDB(db) {
    if (!db) {
        return;
    }
    db.clean();
}

function renderFile(req, res) {
    var startTime = new Date();
    var options = req.param("options");
    options = options ? (typeof options == "object" ? options : JSON.parse(options)) : {};
    options.serviceName = "/rest/file/render";
    var serviceLogParams = {startTime:startTime};
    return runInDomain(req, res).then(
        function () {
            return getConnectedDB(req.param("token"), req.param("code"), options);
        }).then(
        function (db) {
            var logId = Utility.getUniqueObjectId();
            var insertLog = {startTime:startTime, username:db.user ? db.user.username : undefined, token:req.param("token"), serviceType:"file/render", db:db.db.databaseName, callType:"rest"};
            serviceLogParams.logId = logId;
            var p = SELF.addServiceLog(logId, insertLog);
            serviceLogParams.insertPromise = p;
            return db.downloadFile(req.param("filekey"));
        }).then(
        function (file) {
            var fileName = file.metadata.filename;
            var extension = fileName.split('.').pop(), extensionTypes = {
                'css':'text/css',
                'gif':'image/gif',
                'jpg':'image/jpeg',
                'jpeg':'image/jpeg',
                'js':'application/javascript',
                'png':'image/png',
                'mp4':'video/mp4',
                'mp3':'audio/mpeg',
                'txt':'text/plain',
                'pdf':'application/pdf'
            };
            var contentType = extensionTypes[extension];
            if (!contentType) {
                contentType = file.metadata.contentType;
            }
            var head = {"Access-Control-Allow-Origin":"*",
                "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
                "Access-Control-Allow-Credentials":true, "Cache-Control":"public, max-age=3600"};
            if (contentType !== "binary/octet-stream") {
                head["Content-Type"] = contentType;
            }
            var options = {};
            options["head"] = head;
            options["doNotGzip"] = true;
            var result = file.data;
            writeJSONResponse(req, res, result, undefined, serviceLogParams, options);
        }).fail(
        function (err) {
            err = getErrorObejct(err);
            writeJSONResponse(req, res, err, undefined, serviceLogParams);
        })
}

function fileDownload(req, res) {
    var startTime = new Date();
    var options = req.param("options");
    options = options ? (typeof options == "object" ? options : JSON.parse(options)) : {};
    options.serviceName = "/rest/file/download";
    var serviceLogParams = {startTime:startTime};
    return runInDomain(req, res).then(
        function () {
            return getConnectedDB(req.param("token"), req.param("code"), options);
        }).then(
        function (db) {
            var logId = Utility.getUniqueObjectId();
            var insertLog = {startTime:startTime, username:db.user ? db.user.username : undefined, token:req.param("token"), serviceType:"file/download", db:db.db.databaseName, callType:"rest"};
            serviceLogParams.logId = logId;
            var p = SELF.addServiceLog(logId, insertLog);
            serviceLogParams.insertPromise = p;
            return db.downloadFile(req.param("filekey"));
        }).then(
        function (file) {
            var head = {
                "Content-Disposition":"attachment; Filename=\"" + file.metadata.filename + "\"",
                "Access-Control-Allow-Origin":"*",
                "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
                "Access-Control-Allow-Credentials":true, "Cache-Control":"public, max-age=3600"
            }
            if (file.metadata.contentType !== "binary/octet-stream") {
                head["Content-Type"] = file.metadata.contentType;
            }
            var options = {};
            options["head"] = head;
            options["doNotGzip"] = true;
            var result = file.data;
            writeJSONResponse(req, res, result, undefined, serviceLogParams, options);
        }).fail(
        function (err) {
            err = getErrorObejct(err);
            writeJSONResponse(req, res, err, undefined, serviceLogParams);
        })
}

function fileUpload(req, res) {
    var startTime = new Date();
    var serviceLogParams = {startTime:startTime};
    return runInDomain(req, res).then(
        function () {
            var logId = Utility.getUniqueObjectId();
            var insertLog = {startTime:startTime, token:req.param("token"), serviceType:"file/upload", callType:"rest"};
            serviceLogParams.logId = logId;
            var p = SELF.addServiceLog(logId, insertLog);
            serviceLogParams.insertPromise = p;
            return uploadFiles(req);
        }).then(
        function (fileKeys) {
            writeJSONResponse(req, res, fileKeys, undefined, serviceLogParams);
        }).fail(
        function (err) {
            err = getErrorObejct(err);
            writeJSONResponse(req, res, err, undefined, serviceLogParams);
        })
}

function uploadFiles(req) {
    var limit = 7;                        // limit in MB
    var kbLimit = limit * (1024 * 1024);    // size in bytes
    var contentLength = req.headers["content-length"];
    if (!contentLength) {
        throw new Error(" Content-Length is undefined in File Upload request. ");
    }
    if (contentLength > kbLimit) {
        throw new Error(" File Size exceeds current upload limit of : 5 MB");
    }
    var d = Q.defer();
    var files = [];
    var fields = {};
    var form = new Formidable.IncomingForm();
    form.on('error', function (err) {
        d.reject(err);
        return;
    });
    form.on('field', function (name, val) {
        fields[name] = val;
    });
    form.onPart = function (part) {
        if (!part.filename) {
            form.handlePart(part);
            return;
        }
        var data = [];
        var fileName = part.filename;
        part.on('data', function (buffer) {
            data.push(buffer);
        });

        part.on('end', function () {
            files.push({filename:fileName, data:data});
        });
    };

    form.on('end', function () {
        if (fields.contents) {
            var contents = fields.contents.split(',').pop();
            var fileBuffer = new Buffer(contents, "base64");
            var fileName = fields.name;
            files.push({filename:fileName, data:[fileBuffer]});
        }
        var token = fields.token;
        var fileKeys = [];
        var options = req.param("options");
        options = options ? (typeof options == "object" ? options : JSON.parse(options)) : {};
        options.serviceName = "/rest/file/upload";
        getConnectedDB(token, fields.code, options).then(
            function (db) {
                return Utility.iterateArrayWithPromise(files, function (index, file) {
                    return db.uploadFile(file.filename, file.data).then(function (fileKey) {
                        fileKeys.push({key:fileKey, name:file.filename});
                    })
                })
            }).then(
            function () {
                d.resolve(fileKeys);
            }).fail(function (err) {
                d.reject(err);
            })
    });
    form.parse(req);
    return d.promise;
}

function getDbFromDomain(domain) {
//    if (domain.indexOf("beta.") === 0) {
//        domain = domain.substring(5);
//    }
    var index = domain.indexOf(".");
    var firstPart = domain.substring(0, index);
    if (firstPart === "sandbox") {
        var restpart = domain.substring(index + 1);
        var secondPart = restpart.substring(0, restpart.indexOf("."));
        return  secondPart + "_sb";
    } else {
        return firstPart;
    }
}

exports.onMasterServerStartUp = function (pid) {
    return ApplaneDB.getAdminDB().then(function (admindb) {
        return ApplaneDB.onMasterServerStartUp(admindb, pid);
    })
};

exports.addServiceLog = function (logId, insertLog) {
    insertLog = insertLog || {};
    if (!Config[Constants.EnvironmentVariables.SERVICE_LOGS_ENABLED] || insertLog.enablelogs === false) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    insertLog.status = "In Progress";
    insertLog.pid = process.pid;
    insertLog.serverName = Config.SERVER_NAME;
    insertLog.stringDate = new Date().toISOString().substring(0, 10);
    return ApplaneDB.getLogDB().then(
        function (logDb) {
            return logDb.mongoUpdate({$collection:"pl.servicelogs", $upsert:{$query:{_id:logId}, $update:{$set:insertLog}, $options:{upsert:true, new:true}}});
        });
};

exports.updateServiceLog = function (params) {
    if (!Config[Constants.EnvironmentVariables.SERVICE_LOGS_ENABLED] || !params || params.enablelogs === false) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var errorType;
    if (params.error) {
        if (params.error instanceof BusinessLogicError) {
            errorType = "BusinessLogicError";
        } else {
            errorType = "Error";
        }
    }
    var mongoTime = params.mongoTime;
    var error = params.error;
    var connectionTime = params.connectionTime;
    var valueToSet = {};
    var endTime = new Date();
    if (errorType) {
        valueToSet.errorType = errorType;
    }
    valueToSet.endTime = endTime;
    valueToSet.totalTime = endTime - params.startTime;
    valueToSet.totalCPUTime = valueToSet.totalTime;
    if (params.subkeyL1) {
        valueToSet.subkeyL1 = params.subkeyL1;
    }
    if (params.viewId) {
        valueToSet.viewId = params.viewId;
    }
    if (params.logCount) {
        valueToSet.logCount = params.logCount;
    }
    if (params.responseLength) {
        valueToSet.responseLength = params.responseLength;
    }
    if (params.gzipSize) {
        valueToSet.gzipSize = params.gzipSize;
    }
    if (mongoTime) {
        valueToSet.mongoTime = mongoTime;
        if (mongoTime.totalTime) {
            valueToSet.totalCPUTime = valueToSet.totalCPUTime - mongoTime.totalTime;
        }
        if (mongoTime.collectionLoad) {
            valueToSet.totalCPUTime = valueToSet.totalCPUTime - mongoTime.collectionLoad;
        }
        if (mongoTime.invokeService) {
            valueToSet.totalCPUTime = valueToSet.totalCPUTime - mongoTime.invokeService;
        }
    }
    if (connectionTime) {
        valueToSet.connectionTime = connectionTime;
        valueToSet.totalCPUTime = valueToSet.totalCPUTime - connectionTime;
    }
    if (error) {
        valueToSet.status = "Failed";
        valueToSet.error = Utility.getErrorInfo(error);
        valueToSet.errorMessage = error.message;
    } else if (params.functionName && params.functionName === "Porting.insertClientErrorInServiceLogs") {    //require in case of client error
        valueToSet.status = "Failed";
    } else {
        valueToSet.status = "Completed";
    }
    var logDB = undefined;
    return ApplaneDB.getLogDB().then(
        function (logDb) {
            logDB = logDb;
            var logPromise = params.logPromise;
            if (logPromise && Q.isPromise(logPromise)) {
                return logPromise.then(function (logId) {
                    if (logId) {
                        valueToSet.logId = {_id:logId, value:"check log"}
                    }
                })
            }
        }).then(
        function () {
            var insertPromise = params.insertPromise;
            if (insertPromise && Q.isPromise(insertPromise)) {
                return insertPromise;
            }
        }).then(function () {
            return logDB.mongoUpdate({$collection:"pl.servicelogs", $update:{$query:{_id:params.logId}, $set:valueToSet}});
        })
};

/*
 * use of gridfs-stream module to download and render a file but we have to pass a db to the constructor of gridfs-stream
 * so we are not using this one now
 * */

//function getFile(req, res, db, type) {
//    var ObjectID = require("mongodb").ObjectID;
//    var fileKey = new ObjectID(req.param("filekey").toString());
//    var mongo = require('mongodb');
//    var Grid = require('gridfs-stream');
//    var gfs = Grid(db.db, mongo);
//    gfs.files.find({ _id: fileKey }).toArray(function (err, files) {
//        if (err) {
//            console.log(err);
//        }
//        if (files && files.length > 0) {
//            var fileName = files[0].filename;
//            var contentType = undefined;
//            if (type === "render") {
//                var extension = fileName.split('.').pop(), extensionTypes = {
//                    'css': 'text/css',
//                    'gif': 'image/gif',
//                    'jpg': 'image/jpeg',
//                    'jpeg': 'image/jpeg',
//                    'js': 'application/javascript',
//                    'png': 'image/png',
//                    'mp4': 'video/mp4',
//                    'mp3': 'audio/mpeg',
//                    'txt': 'text/plain',
//                    'pdf': 'application/pdf'
//                };
//                contentType = extensionTypes[extension];
//            }
//            if (!contentType) {
//                contentType = files[0].contentType;
//            }
//            var head = {
//                "Content-Type": contentType,
//                "Access-Control-Allow-Origin": "*",
//                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
//                "Access-Control-Allow-Credentials": true
//            };
//
//            if (type === "download") {
//                head["Content-Disposition"] = "attachment; Filename=\"" + fileName + "\"";
//            }
//            res.writeHead(200, head);
//            var readstream = gfs.createReadStream({_id: fileKey});
//            readstream.pipe(res);
//        } else {
//            err = new Error("file not found");
//            writeJSONResponse(req, res, err, undefined);
//        }
//    })
//}

//Here we are retriving provided Data to describe task
function getRequestDetail(req) {
    var D = Q.defer();
    var url = req.url
    var reqDetail = {"url":url}
    if (url === "/rest/query") {
        if (req.param("token")) {
            reqDetail["token"] = req.param("token")
        }
        if (req.param("code")) {
            reqDetail["code"] = req.param("code")
        }
        if (req.param("query")) {
            reqDetail["query"] = req.param("query")
        }
    } else if (url === "/rest/invoke") {
        if (req.param("function")) {
            reqDetail["function"] = req.param("function")
        }
        if (req.param("parameters")) {
            reqDetail["parameters"] = req.param("parameters")
        }
        if (req.param("options")) {
            reqDetail["options"] = req.param("options")
        }
        if (req.param("token")) {
            reqDetail["token"] = req.param("token")
        }
        if (req.param("code")) {
            reqDetail["code"] = req.param("code")
        }
        if (req.param("user_access_token")) {
            reqDetail["user_access_token"] = req.param("user_access_token")
        }
        if (req.param("autocommit")) {
            reqDetail["autocommit"] = req.param("autocommit")
        }
    } else if (url === "/rest/update") {
        if (req.param("token")) {
            reqDetail["token"] = req.param("token")
        }
        if (req.param("code")) {
            reqDetail["code"] = req.param("code")
        }
        if (req.param("update")) {
            reqDetail["update"] = req.param("update")
        }
        if (req.param("options")) {
            reqDetail["options"] = req.param("options")
        }
    } else if (url === "/rest/batchquery") {
        if (req.param("token")) {
            reqDetail["token"] = req.param("token")
        }
        if (req.param("code")) {
            reqDetail["code"] = req.param("code")
        }
        if (req.param("query")) {
            reqDetail["query"] = req.param("query")
        }
    } else if (url === "/rest/service") {
        if (req.param("token")) {
            reqDetail["token"] = req.param("token")
        }
        if (req.param("code")) {
            reqDetail["code"] = req.param("code")
        }
        if (req.param("service")) {
            reqDetail["service"] = req.param("service")
        }
        if (req.param("parameters")) {
            reqDetail["parameters"] = req.param("parameters")
        }
    } else if (url === "/rest/forgotPassword") {
        if (req.param("email")) {
            reqDetail["email"] = req.param("email")
        }
        if (req.param("database")) {
            reqDetail["database"] = req.param("database")
        }
    } else if (url === "/rest/disconnect") {
        if (req.param("token")) {
            reqDetail["token"] = req.param("token")
        }
        if (req.param("code")) {
            reqDetail["code"] = req.param("code")
        }
        if (req.param("function")) {
            reqDetail["function"] = req.param("function")
        }
        if (req.param("parameters")) {
            reqDetail["parameters"] = req.param("parameters")
        }
        if (req.param("options")) {
            reqDetail["options"] = req.param("options")
        }
    } else if (url === "/rest/connect") {
        if (req.param("db")) {
            reqDetail["db"] = req.param("db")
        }
        if (req.param("sandbox")) {
            reqDetail["sandbox"] = req.param("sandbox")
        }
        if (req.param("options")) {
            reqDetail["options"] = req.param("options")
        }
        if (req.param("code")) {
            reqDetail["code"] = req.param("code")
        }
        if (req.param("token")) {
            reqDetail["token"] = req.param("token")
        }
    }
    D.resolve(reqDetail);
    return D.promise;
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
