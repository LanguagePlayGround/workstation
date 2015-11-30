/***** move to app-models.js to generate minified version for before commit*******/
var ApplaneDB = {};

(function () {
    var DB = function (token, url, db, user) {
        this.token = token;
        this.url = url;
        this.db = db;
        this.user = user;
        this.userTimezoneOffset = new Date().getTimezoneOffset();
    };
    DB.prototype.getCache = function (key) {
        var cache = getCacheObject();
        return cache.get(key);
    };
    DB.prototype.setContext = function (context) {
        this.$context = context;
    };
    DB.prototype.removeCache = function (key) {
        var cache = getCacheObject();
        if (key !== undefined) {
            return cache.del(key);
        } else {
            return cache.reset();
        }
    }

    DB.prototype.setCache = function (key, value) {
        var cache = getCacheObject();
        return cache.set(key, value);
    };


    function getCacheObject() {
        if (this.cache) {
            return this.cache;
        } else {
            var options = { max:100, maxAge:1000 * 60 * 60 };
            var cache = LRUCache(options);
            this.cache = cache;
            return cache;
        }
    }


    function getDataUsingCache(query, options) {
        var that = this;
        var key = options.key ? options.key : "Query-" + JSON.stringify(query);
        var result = that.getCache(key);
        if (result) {
            var d = Q.defer();
            d.resolve(result);
            return d.promise;
        } else {
            return that.query(query).then(function (result) {
                if (result && result.response && result.response.result && result.response.result.length > 0 && !result.response.dataInfo.hasNext) {
                    that.setCache(key, result);
                }
                return result;
            });
        }
    }


    function getBatchDataUsingCache(batchQuery, options) {
        var that = this;
        var key = options.key ? options.key : "BatchQuery-" + JSON.stringify(batchQuery);
        var result = that.getCache(key);
        if (result) {
            var d = Q.defer();
            d.resolve(result);
            return d.promise;
        } else {
            return that.batchQuery(batchQuery).then(function (result) {
                if (result && result.response) {
                    var keys = Object.keys(batchQuery);
                    var setInCache = true;
                    for (var i = 0; i < keys.length; i++) {
                        var batchQuerykey = keys[i];
                        if ((batchQuery[batchQuerykey].$skip === undefined || batchQuery[batchQuerykey].$skip === 0) && result.response[batchQuerykey] && result.response[batchQuerykey].dataInfo && !result.response[batchQuerykey].dataInfo.hasNext) {
                            //do nothing as default is true
                        } else {
                            setInCache = false;
                            break;
                        }
                    }
                    if (setInCache) {
                        that.setCache(key, result);
                    }
                }
                return result;
            });
        }
    }

    DB.prototype.disconnect = function () {
        var Q = require("q");
        var D = Q.defer();
        var dbToken = this.token;
        var userTimezoneOffset = this.userTimezoneOffset;
        var p = {token:dbToken, userTimezoneOffset:userTimezoneOffset};
        var url = this.url;
        ApplaneDB.callRemoveService(url + "/rest/disconnect", p, "POST", "JSON").then(
            function () {
                var token = localStorage["token"];
                var roadMapToken = localStorage["roadMapToken"];
                var tokenToDelete = undefined;
                if (Util.deepEqual(token, dbToken)) {
                    tokenToDelete = roadMapToken;
                } else {
                    tokenToDelete = token;
                }
                if (tokenToDelete) {
                    return ApplaneDB.callRemoveService(url + "/rest/disconnect", {token:tokenToDelete, userTimezoneOffset:userTimezoneOffset}, "POST", "JSON");
                } else {
                    return;
                }
            }).then(
            function () {
                for (var k in localStorage) {
                    delete localStorage[k];
                }
                D.resolve();
            }).fail(function (err) {
                D.reject(err)
            });
        return D.promise;
    }
    DB.prototype.query = function (query, options) {
        var that = this;
        var tokenToPass = options && options.token ? options.token : this.token;
        if (options && options.cache) {
            return getDataUsingCache.call(that, query, options);
        }
        else {
            var params = {query:JSON.stringify(query), token:tokenToPass, userTimezoneOffset:this.userTimezoneOffset, enablelogs:this.enableLogs};
            if (options && options.viewId) {
                params.viewId = options.viewId
            }
            params.options = JSON.stringify({$context:this.$context});
            return ApplaneDB.callRemoveService(this.url + "/rest/query", params, "POST", "JSON")
        }
    }

    DB.prototype.batchQuery = function (batchQuery, options) {
        var that = this;
        var tokenToPass = options && options.token ? options.token : this.token;
        if (options && options.cache) {
            return getBatchDataUsingCache.call(that, batchQuery, options);
        } else {
            var params = {query:JSON.stringify(batchQuery), token:tokenToPass, userTimezoneOffset:this.userTimezoneOffset, enablelogs:this.enableLogs};
            if (options && options.viewId) {
                params.viewId = options.viewId
            }
            params.options = JSON.stringify({$context:this.$context});
            return ApplaneDB.callRemoveService(this.url + "/rest/batchquery", params, "POST", "JSON")
        }
    }

    DB.prototype.update = function (update, options) {
        options = options || {};
        options.$context = this.$context;
        var tokenToPass = options && options.token ? options.token : this.token;
        var params = {update:JSON.stringify(update), token:tokenToPass, userTimezoneOffset:this.userTimezoneOffset, options:JSON.stringify(options), enablelogs:this.enableLogs};
        if (options && options.viewId) {
            params.viewId = options.viewId
        }
        return ApplaneDB.callRemoveService(this.url + "/rest/update", params, "POST", "JSON")
    }
    //here we are providing  acrossDBCode in params, if available - Rajit garg
    DB.prototype.uploadFile = function (name, type, contents, options) {
        var tokenToPass = options && options.token ? options.token : this.token;
        var params = {name:name, type:type, contents:contents, userTimezoneOffset:this.userTimezoneOffset, enablelogs:this.enableLogs, token:tokenToPass};
        if (options && options.viewId) {
            params.viewId = options.viewId
        }
        return ApplaneDB.callRemoveService(this.url + "/rest/file/upload", params, "POST", "JSON");
    }
    DB.prototype.invokeFunction = function (functionName, parameters, options) {
//        if(functionName=="getUserState"){
//            var Q = require("q");
//            var d = Q.defer();
//            d.resolve(AppViews.userState)
//            return d.promise;
//        }
        options = options || {};
        options.es = this.es;
        options.$context = this.$context;
        var tokenToPass = options && options.token ? options.token : this.token;

        if (typeof functionName == "string") {
            var p = {"function":functionName, token:tokenToPass, userTimezoneOffset:this.userTimezoneOffset };
            if (options) {
                p.options = JSON.stringify(options);
            }
            if (parameters) {
                p.parameters = JSON.stringify(parameters);
            }
            if (this.enableLogs) {
                p.enablelogs = this.enableLogs;
            }
            if (options && options.viewId) {
                p.viewId = options.viewId
            }
            //this.pendingTime contain info about client render time and transfer time, and this info is updating/inserting into pl.servicelogs -- Rajit gar
            if (this.pendingTime) {
                p.pendingTime = JSON.stringify(this.pendingTime);
            }
            delete this.pendingTime;
            return ApplaneDB.callRemoveService(this.url + "/rest/invoke", p, "POST", "JSON");
        }


        var Q = require("q");
        var that = this;
        var d = Q.defer();
        var functionToCall = undefined;
        var dotIndex = -1;
        if (typeof functionName == "string") {
            dotIndex = functionName.indexOf(".");
        }
        if (dotIndex >= 0) {
            functionToCall = functionName.substring(dotIndex + 1);
            functionName = functionName.substring(0, dotIndex);
        }
        loadFunctionAsPromise(functionName).then(
            function (loadedFunction) {
                return executeLoadedFunction(loadedFunction, parameters, that, options);
            }).then(
            function () {
                d.resolve();
            }).fail(function (err) {
                d.reject(err);
            });

        return d.promise;
    }
    DB.prototype.invokeService = function (service, params, options) {
        var tokenToPass = options && options.token ? options.token : this.token;
        var serviceParams = {service:JSON.stringify(service), token:tokenToPass, userTimezoneOffset:this.userTimezoneOffset, enablelogs:this.enableLogs};
        if (params) {
            serviceParams.parameters = JSON.stringify(params);
        }
        if (options && options.viewId) {
            serviceParams.viewId = options.viewId
        }
        return ApplaneDB.callRemoveService(this.url + "/rest/service", serviceParams, "POST", "JSON").then(function (result) {
            return result.response;
        })
    }

    function executeLoadedFunction(loadedFunction, parameters, db, options) {
        var d = Q.defer();
        var funParmeters = [];
        if (parameters) {
            parameters.forEach(function (parameter) {
                funParmeters.push(parameter);
            });
        }
        funParmeters.push(db);
        if (options) {
            funParmeters.push(options);
        }
        var funcitonPromise = loadedFunction.apply(null, funParmeters);
        if (funcitonPromise) {
            funcitonPromise.then(
                function () {
                    d.resolve();
                }).fail(function (err) {
                    d.reject(err);
                })
        } else {
            d.resolve();
        }
        return d.promise;
    }

    function loadFunctionAsPromise(functionDef) {
        var d = Q.defer();
        if (!Util.isJSONObject(functionDef)) {
            d.reject(new Error("Function name can only be object but found>>>>>" + JSON.stringify(functionDef)));
            return;
        }
        ApplaneDB.loadJs(functionDef.source).then(function (loadedFunction) {
            var loadedFunctionValue = loadedFunction[functionDef.name];
            if (loadedFunctionValue) {
                d.resolve(loadedFunctionValue);
            } else {
                d.reject(new Error("Function not found for[" + JSON.stringify(functionDef) + "]"));
            }
        })
        return d.promise;
    }

    //is used to reconnect user with different token require in case of session timeout -- rajit 09/may/2015
    DB.prototype.reconnect = function (password, options) {
        that = this;
        var Q = require("q");
        var D = Q.defer();
        options = options || {};
        options.userTimezoneOffset = new Date().getTimezoneOffset();
        var params = {db: that.db, options: JSON.stringify({username: that.user.username, password: password, cachekey: "userdb"})};
        if (options && options.viewId) {
            params.viewId = options.viewId
        }
        ApplaneDB.callRemoveService(that.url + "/rest/connect", params, "POST", "JSON").then(
            function (result) {
                var token = result.response.token;
                var user = result.response.user;
                localStorage.token = token;
                that.token = token;
                that.user = user;
                localStorage["userdb"] = JSON.stringify({db: that.db, token: token, url: that.url, user: user});
                D.resolve();
            }).fail(function (err) {
                D.reject(err);
            })
        return D.promise;
    };

    ApplaneDB.connect = function (url, db, options) {
        var Q = require("q");
        var D = Q.defer();
        options = options || {};
        options.userTimezoneOffset = new Date().getTimezoneOffset();
        var params = {db:db, options:JSON.stringify(options)};
        if (options && options.viewId) {
            params.viewId = options.viewId
        }
        ApplaneDB.callRemoveService(url + "/rest/connect", params, "POST", "JSON").then(
            function (result) {
                var token = result.response.token;
                var user = result.response.user;
                if (options.cachekey) {
                    localStorage[options.cachekey] = JSON.stringify({db:db, token:token, url:url, user:user});
                }
                D.resolve(new DB(token, url, db, user));
            }).fail(function (err) {
                D.reject(err);
            })
        return D.promise;

    }
    ApplaneDB.connection = function (key, connection) {
        ApplaneDB.cache = ApplaneDB.cache || {};
        if (connection) {
            ApplaneDB.cache[key] = new DB(connection.token, connection.url, connection.db, connection.user);
            return ApplaneDB.cache[key];
        } else {
            if (ApplaneDB.cache[key]) {
                return ApplaneDB.cache[key];
            }
            var connection = localStorage[key];
            if (connection) {
                var keyConnection = JSON.parse(localStorage[key]);
                ApplaneDB.cache[key] = new DB(keyConnection.token, keyConnection.url, keyConnection.db, keyConnection.user);
                return ApplaneDB.cache[key];
            } else {
                return;
            }
        }
    };
    ApplaneDB.callRemoveService = function (url, requestBody, callType, dataType) {
        var Q = require("q");
        var D = Q.defer();
        $.ajax({
            type:callType,
            url:url,
            data:requestBody,
            success:function (returnData, status, xhr) {
                D.resolve(returnData);
            },
            error:function (jqXHR, exception) {
                var message = jqXHR.responseText;
                var parsedMessage = undefined;
                if (jqXHR.status == 0) {
                    parsedMessage = {businessLogicError:true};
                    message = Util.NOT_CONNECTED_MESSAGE;
                } else {
                    try {
                        parsedMessage = JSON.parse(jqXHR.responseText);
                        message = parsedMessage.response;
                    } catch (e) {

                    }
                }
                if (parsedMessage && parsedMessage.businessLogicError) {
                    //in case of saving confirm using businesslogic error we get promptUser, we are setting this here to show proceed to save in warning options -- Rajit garg 27-mar-15
                    var err = new BusinessLogicError(message);
                    if (parsedMessage.promptUserWarning) {
                        err.promptUserWarning = parsedMessage.promptUserWarning;
                    }
                    err.stack = parsedMessage.stack;
                    D.reject(err);
                } else {
                    // adding stack into error object for getting stack info   --Rajit garg 06/04/2015
                    var err = new Error(message);
                    err.stack = parsedMessage.stack;
                    D.reject(err);
                }
            },
            timeout:1200000,
            dataType:dataType,
            async:true
        });
        return D.promise;
    };

    ApplaneDB.loadJs = function (source) {
        var d = Q.defer();
        requirejs.config({
            waitSeconds:120
        });
        requirejs([source], function (loadedFunction) {
            if (loadedFunction) {
                d.resolve(loadedFunction);
            } else {
                d.reject(new Error("Function could not load for[" + source + "]"));
            }
        })
        requirejs.onError = function (err) {
            d.reject(err);
        };
        return d.promise;
    }


    ApplaneDB.loadFeedbackResources = function (source) {
        var d = Q.defer();

        var cssId = 'feedbackCss';  // you could encode the css path itself to generate id..
        if (!document.getElementById(cssId)) {
            var head = document.getElementsByTagName('head')[0];
            var link = document.createElement('link');
            link.id = cssId;
            link.rel = 'stylesheet';
            link.type = 'text/css';
            link.href = 'css/feedback.css';
            link.media = 'all';
            head.appendChild(link);
        }

        requirejs.config({
            waitSeconds:120
        });
        requirejs([source], function () {
            d.resolve();
        })
        requirejs.onError = function (err) {
            d.reject(err);
        };
        return d.promise;
    }


    ApplaneDB.getRoadMapConnection = function () {
        if (localStorage && localStorage.roadMapDB) {
            var D = Q.defer();
            D.resolve(JSON.parse(localStorage.roadMapDB));
            return D.promise;
        } else {
            var userDb = ApplaneDB.connection("userdb");
            if (!userDb) {
                var D = Q.defer();
                D.reject("userdb not found while getRoadMapConnection");
                return D.promise;

            }

            return userDb.invokeFunction("RoadMap.getConnection", [
                {}
            ]).then(function (result) {
                    if (result && result.response) {
                        result.response.url = "";
                        //localStorage is used to reuse token     -- Rajit
                        localStorage["roadMapDB"] = JSON.stringify(result);
                        localStorage["roadMapToken"] = result.response.token;
                        return result;
                    }
                })
        }
    }
})();
