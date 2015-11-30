/**
 * Created by ashu on 6/1/15.
 */

var Q = require("q");
var AppConstants = require("./Constants.js");
var BusinessLogicError = require("ApplaneError/lib/BusinessLogicError.js");
var Utility = require("ApplaneCore/apputil/util.js");
var SELF = require("./VersionControl.js");
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var ChildProcess = require('child_process');
var MongoClient = require("mongodb").MongoClient;
var MailService = require("ApplaneDB/lib/MailService.js");

exports.getDevelopmentServerType = function (params, admindb) {
    var authDevTypes;
    var configVal = admindb.getConfig("DEVELOPMENT_SERVER_TYPE");

    if (configVal && (typeof configVal === "string")) {
        authDevTypes = configVal.split(",");
    }
    return authDevTypes;
};

exports.publishServer = function (params, admindb) {
    if (!params.publishserver) {
        return;
    }
    var serverDetails;
    var error = undefined;
    return getServerDef(admindb, params, true).then(
        function (details) {
            serverDetails = details.serverdetails;
            return setUserLock(serverDetails, admindb);
        }).then(
        function () {
            var info = {port: serverDetails.port, url: '/rest/connect?db=pladmin&options={"username":"admin","password":"damin"}', checkForCode: true};
            return confirmRunningServer(info);
        }).then(
        function (result) {
            if (!result) {
                throw new Error(" Publish Failed : URL does not work.");
            }
            return checkForPendingTxs(serverDetails, admindb);
        }).then(
        function () {
            return checkLogsForInProgress(serverDetails);
        }).then(
        function () {
            return saveLog(serverDetails.servername, "Publish", admindb);
        }).then(
        function () {
            if (serverDetails.published) {
                throw new BusinessLogicError(" Current Server is already published. ");
            }
            return updatePublished(serverDetails.serverType, serverDetails._id, admindb);
        }).then(
        function () {
            return updateInHttpProxy(serverDetails.serverType, serverDetails.port, admindb);
        }).then(function () {
            var currentUser = admindb.user ? admindb.user.username : undefined;
            return admindb.update({
                $collection: AppConstants.VersionControl.SERVERS,
                $update: {_id: serverDetails._id, $set: {lastPublishedBy: currentUser, lastPublishedAt: new Date()}}
            });
        }).fail(function (err) {
            error = err;
        }).then(
        function () {
            return unsetUserLock(serverDetails, admindb);
        }).then(function () {
            if (error) {
                throw error;
            }
        })
};

exports.updateBranch = function (params, admindb) {
    if (!params.updateBranch) {
        return;
    }
    params.restartserver = true;
    var serverDetails;
    var moduleDetails;
    var logId;
    var error = undefined;
    return getServerDef(admindb, params).then(
        function (def) {
            moduleDetails = def.moduledetails;
            serverDetails = def.serverdetails;
            if (serverDetails.published) {
                throw new BusinessLogicError("updateBranch is not allowed on published servers.");
            }
            return setUserLock(serverDetails, admindb);
        }).then(
        function () {
            return checkForPendingTxs(serverDetails, admindb);
        }).then(
        function () {
            return checkLogsForInProgress(serverDetails);
        }).then(
        function () {
            return saveLog(serverDetails.servername, "UpdateBranch", admindb);
        }).then(
        function (logid) {
            logId = logid;
            return processModules(serverDetails.path, moduleDetails, serverDetails.branch, AppConstants.VersionControl.Commands.BRANCH, true, false, true);
        }).then(
        function (moduleOut) {
            return updateLog(logId, {gitOutput: moduleOut});
        }).then(function () {
            return SELF.restartServer(params, admindb);
        }).fail(function (err) {
            error = err;
        }).then(
        function () {
            return unsetUserLock(serverDetails, admindb);
        }).then(function () {
            if (error) {
                throw error;
            }
        });
};

exports.restartServer = function (params, admindb) {
    if (!params.restartserver) {
        return;
    }
    var cmd;
    var serverDetails;
    return getServerDef(admindb, params, true).then(
        function (details) {
            serverDetails = details.serverdetails;
            return saveLog(serverDetails.servername, "Restart", admindb);
        }).then(
        function () {
            var currentPort = admindb.getConfig("PORT");
            if (serverDetails.port == currentPort) {
                throw new BusinessLogicError(" You can't restart server on same PORT");
            }
        }).then(
        function () {
            cmd = "ps aux | grep 'SERVER_NAME=" + serverDetails.servername + "' | awk '{print $2}' | xargs kill";
            return runCommandInTerminal("/", cmd);
        }).then(
        function () {
            cmd = "fuser -vk " + serverDetails.port + "/tcp";
            return runCommandInTerminal("/", cmd);
        }).then(function () {
            serverDetails.path = serverDetails.path + "/" + serverDetails.name + "/node_modules/";
            return getClaAndRunServer(serverDetails, admindb);
        });
};

exports.stopServer = function (params, admindb) {
    if (!params.stopserver) {
        return;
    }
    var cmd;
    var serverDetails;
    return getServerDef(admindb, params, true).then(
        function (details) {
            serverDetails = details.serverdetails;
            return saveLog(serverDetails.servername, "Stop", admindb);
        }).then(
        function () {
            cmd = "ps aux | grep 'SERVER_NAME=" + serverDetails.servername + "' | awk '{print $2}' | xargs kill";
            return runCommandInTerminal("/", cmd);
        }).then(
        function () {
            cmd = "fuser -vk " + serverDetails.port + "/tcp";
            return runCommandInTerminal("/", cmd);
        }).then(function () {
            return admindb.update({
                $collection: AppConstants.VersionControl.SERVERS,
                $update: {_id: serverDetails._id, $set: {serverStatus: "Down"}}
            });
        });
};

exports.updateServer = function (params, admindb, options) {
    if (!options.processid) {
        throw new Error("Async must be true in updateServer.");
    }
    if (!params.update) {
        return;
    }
    var serverIds = params._id;
    if (!serverIds) {
        throw new Error("_id not found in parameters.Parameters found [" + JSON.stringify(params) + "]");
    }
    if (!Array.isArray(serverIds)) {
        serverIds = [serverIds];
    }
    var newParams = [];
    for (var i = 0; i < serverIds.length; i++) {
        var newParam = {};
        newParam._id = serverIds[i];
        newParam.restartserver = true;
        newParam.update = true;
        newParam.updateType = "update";
        newParams.push(newParam);
    }
    return admindb.startProcess(newParams, "VersionControl.updateInternal", options);
};

exports.updateNpm = function (params, admindb, options) {
    if (!params.npm) {
        return;
    }
    params.restartserver = true;
    params.persistLock = true;
    params.updateType = "update npm";
    return admindb.invokeFunction("VersionControl.updateInternal", [
        {data: params}
    ], options);
};

exports.updateInternal = function (result, admindb) {
    var params = result.data;
    var logId;
    var serverDetails;
    var moduleDetails;
    var updateType = params.updateType;
    var error = undefined;
    return getServerDef(admindb, params).then(
        function (def) {
            moduleDetails = def.moduledetails;
            serverDetails = def.serverdetails;
            if (serverDetails.published) {
                throw new BusinessLogicError("Update is not allowed on published servers.");
            }
            return setUserLock(serverDetails, admindb);
        }).then(
        function () {
            return checkForPendingTxs(serverDetails, admindb);
        }).then(
        function () {
            return checkLogsForInProgress(serverDetails);
        }).then(
        function () {
            return saveLog(serverDetails.servername, updateType, admindb);
        }).then(
        function (logid) {
            logId = logid;
            if (params.update) {
                return processModules(serverDetails.path, moduleDetails, serverDetails.branch, AppConstants.VersionControl.Commands.UPDATE, false, false, true, serverDetails.serverType);
            } else if (params.npm) {
                return processModules(serverDetails.path, moduleDetails, serverDetails.branch, AppConstants.VersionControl.Commands.UPDATE, true, true, false);
            }
        }).then(
        function (moduleOut) {
            return updateLog(logId, {gitOutput: moduleOut});
        }).then(
        function () {
            return SELF.restartServer(params, admindb);
        }).then(
        function () {
            return waitTillServerIsUp(serverDetails);
        }).then(function () {
            var currentUser = admindb.user ? admindb.user.username : undefined;
            return admindb.update({
                $collection: AppConstants.VersionControl.SERVERS,
                $update: {_id: serverDetails._id, $set: {lastUpdatedBy: currentUser, lastUpdatedAt: new Date()}}
            });
        }).fail(function (err) {
            error = err;
        }).then(
        function () {
            if (!params.persistLock) {
                return unsetUserLock(serverDetails, admindb);
            }
        }).then(function () {
            if (error) {
                throw error;
            }
        })
};

function waitTillServerIsUp(serverDetails) {
    var d = Q.defer();
    var sTime = new Date();
    var info = {port: serverDetails.port, url: '/rest/connect?db=pladmin&options={"username":"admin","password":"damin"}', checkForCode: true};
    var checkForServerInterval = setInterval(function () {
        var timeDiff = new Date() - sTime;
        if (timeDiff > 300000) {
            clearInterval(checkForServerInterval);
            d.reject(new Error("Code Update complete but server verification failed. Please check URL before publish."));
            return;
        }
        return confirmRunningServer(info).then(function (status) {
            if (status) {
                clearInterval(checkForServerInterval);
                d.resolve();
            }
        });
    }, 1000);
    return d.promise;
}

exports.deleteServerSetup = function (params, admindb) {
    if (!params.deletesetup) {
        return;
    }
    var serverDetails;
    var cmd;
    return getServerDef(admindb, params, true).then(
        function (details) {
            serverDetails = details.serverdetails;
            if (serverDetails.published) {
                throw new BusinessLogicError("Delete Setup is not allowed on published servers.");
            }
            return saveLog(serverDetails.servername, "Delete", admindb);
        }).then(
        function () {
            cmd = "ps aux | grep 'SERVER_NAME=" + serverDetails.servername + "' | awk '{print $2}' | xargs kill";
            return runCommandInTerminal("/", cmd);
        }).then(
        function () {
            cmd = "rm -rf " + (serverDetails.name);
            return runCommandInTerminal(serverDetails.path, cmd);
        }).then(function () {
            if (params.deletesetup && params.removefromlist) {
                return admindb.update({$collection: AppConstants.VersionControl.SERVERS, $delete: {_id: params._id}});
            }
        });
};

exports.createServerSetup = function (params, admindb) {
    if (!params.newprojectsetup) {
        return;
    }
    var serverDetails;
    var moduleDetails;
    return getServerDef(admindb, params, true).then(
        function (details) {
            serverDetails = details.serverdetails;
            if (serverDetails.published) {
                throw new BusinessLogicError("createServerSetup is not allowed on published servers.");
            }
            return saveLog(serverDetails.servername, "New Setup", admindb);
        }).then(
        function () {
            return createFolderSetup(serverDetails);
        }).then(
        function () {
            return getModuleDef(serverDetails, admindb);
        }).then(
        function (moduleDetailsResult) {
            moduleDetails = moduleDetailsResult.result;
            if (serverDetails.branch) {
                return processModules(serverDetails.path, moduleDetails, serverDetails.branch, "moduleinstall", undefined, undefined, undefined, serverDetails.serverType);
            } else {
                return processModules(serverDetails.path, moduleDetails, undefined, "moduleinstall", undefined, undefined, undefined, serverDetails.serverType);
            }
        }).then(function () {
            return getClaAndRunServer(serverDetails, admindb);
        });
};

exports.getErrorOutFile = function (params, admindb) {
    if (!params.fileType) {
        throw new BusinessLogicError(" No File Selected !");
    }
    var result = {};
    var filename;
    return getServerDef(admindb, params, true).then(
        function (details) {
            var serverDetails = details.serverdetails;
            var path = serverDetails.path + "/" + serverDetails.name;
            filename = params.fileType === "Error" ? "err.log" : "out.log";
            path = path + "/" + filename;
            return readFile(path);
        }).then(function (fileContent) {
            result["Content-Type"] = "text/plain";
            result["Content-Disposition"] = "attachment; Filename=\"" + filename + "\"";
            result.binary = fileContent;
            result.useAsFile = true;
            return result;
        });
};

exports.handleMongod = function (params, admindb) {
    if (!params.operation) {
        return;
    }
    var operation = params.operation;
    var validOperations = ["start", "stop", "restart"];
    if (validOperations.indexOf(operation) < 0) {
        throw new Error(" Operation : " + operation + " not supported.");
    }
    return killmongod(params, operation, admindb).then(function () {
        return startmongod(params, operation, admindb);
    });
};

exports.removeServerLockAdmin = function (params, admindb) {
    if (!params.removelock) {
        return;
    }
    return getServerDef(admindb, params, true).then(function (details) {
        var serverDetails = details.serverdetails;
        return unsetUserLock(serverDetails, admindb);
    })
};

function killmongod(params, operation, admindb) {
    if (operation === "start") {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    return getMongodef(params, admindb).then(function (mongodef) {
        var command = "fuser -vk " + mongodef.port + "/tcp";
        return runCommandInTerminal("/", command);
    });
}

function startmongod(params, operation, admindb) {
    if (operation === "stop") {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    return runMongod(params, admindb);
}

function setUserLock(serverDetails, admindb) {
    var currentUser = admindb.user ? admindb.user.username : undefined;
    if (!currentUser) {
        throw new Error(" User not found !");
    }
    return admindb.update({$collection: AppConstants.VersionControl.LOCKS, $insert: {servername: serverDetails.servername, username: currentUser, lastLockedAt: new Date()}}).fail(function (err) {
        if (err.code === 11000) {
            return admindb.query({$collection: AppConstants.VersionControl.LOCKS, $filter: {servername: serverDetails.servername}}).then(function (result) {
                if (result.result.length > 0) {
                    var user = result.result[0].username;
                    throw new Error(" Server is already locked by user : " + user);
                }
            })
        } else {
            throw err;
        }
    })
}

function unsetUserLock(serverDetails, admindb) {
    var currentUser = admindb.user ? admindb.user.username : undefined;
    if (!currentUser) {
        throw new Error(" User not found !");
    }
    return admindb.update({$collection: AppConstants.VersionControl.LOCKS, $delete: {$query: {servername: serverDetails.servername}}});
}

function checkForPendingTxs(serverDetails, admindb) {
    return admindb.invokeFunction("Porting.manageTxs", [
        {"get": true, "status": {"$in": ["rollback", "commit", "pending"]}, "asGroup": true, servername: serverDetails.servername}
    ]).then(function (txns) {
        if (txns.length > 0) {
            throw new BusinessLogicError(" Error : Pending Transactions exist on this server . Please try after some time. ");
        }
    });
}

function checkLogsForInProgress(serverDetails) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    return ApplaneDB.getLogDB().then(
        function (logDB) {
            return logDB.query({$collection: AppConstants.VersionControl.SERVICELOGS, $filter: {serverName: serverDetails.servername, status: "In Progress", startTime: {$gte: today}}, $limit: 1});
        }).then(function (data) {
            data = data.result;
            if (data.length > 0) {
                throw new BusinessLogicError(" Error : Some process has status : In Progress on this server. Please try after some time. ");
            }
        });
}

function saveLog(servername, action, db) {
    var createdBy = db.user ? db.user.username : undefined;
    return ApplaneDB.getLogDB().then(function (logDB) {
        return logDB.mongoUpdate({
            $collection: AppConstants.VersionControl.LOGS,
            $insert: {servername: servername, username: createdBy, invokefunction: action, starttime: new Date()}
        }).then(function (insert) {
            return insert[AppConstants.VersionControl.LOGS].$insert[0]._id;
        });
    });
}

function updateLog(logId, valToset) {
    var updateLog = {$query: {_id: logId}, $set: valToset};
    return ApplaneDB.getLogDB().then(function (logDB) {
        return logDB.mongoUpdate({$collection: AppConstants.VersionControl.LOGS, $update: updateLog});
    });
}

function runNodeServer(serverPath, fileName, cla) {
    var cwd = process.cwd() + "/lib/apps";
    var child = ChildProcess.spawn(process.execPath, ["runNodeServer.js", serverPath, fileName, cla], {
        detached: true,
        cwd: cwd,
        stdio: 'ignore'
    });
    child.unref();
}

function runCommandInScript(args, scriptPath) {
    var d = Q.defer();
    var out = {};
    var cwd = process.cwd() + "/lib/apps";
    var execFile = ChildProcess.execFile;
    execFile(scriptPath, args, {cwd: cwd}, function (error, stdout, stderr) {
        out.error = error;
        out.stdout = stdout;
        out.stderr = stderr;
        d.resolve(out);
    });
    return d.promise;
}

function runCommandInTerminal(path, command) {
    var d = Q.defer();
    var args = command;
    var out = {};
    var exec = ChildProcess.exec;
    exec(args, {cwd: path}, function (error, stdout, stderr) {
        out.error = error;
        out.stdout = stdout;
        out.stderr = stderr;
        d.resolve(out);
    });
    return d.promise;
}

function getServerDef(adminDB, params, skipModuleDetails) {
    var query = {$collection: AppConstants.VersionControl.SERVERS, $filter: {_id: params._id}};
    return adminDB.query(query).then(function (data) {
        var serverDetails = data.result[0];
        if (!serverDetails.servername) {
            throw new Error(" servername is mandatory for server : " + JSON.stringify(serverDetails));
        }
        if (!serverDetails.appPath) {
            throw new Error(" appPath is mandatory for server : " + JSON.stringify(serverDetails));
        }
        if (!serverDetails.path) {
            throw new Error(" path is mandatory for server : " + JSON.stringify(serverDetails));
        }
        if (!serverDetails.name) {
            throw new Error(" name is mandatory for server : " + JSON.stringify(serverDetails));
        }
        if (!serverDetails.port) {
            throw new Error(" port is mandatory for server : " + JSON.stringify(serverDetails));
        }
        if (!serverDetails.serverType) {
            throw new Error(" serverType is mandatory for server : " + JSON.stringify(serverDetails));
        }
        var valueToReturn = {serverdetails: serverDetails};
        if (skipModuleDetails) {
            return valueToReturn;
        } else {
            serverDetails.path = serverDetails.path + "/" + serverDetails.name + "/node_modules/";
            return getModuleDef(serverDetails, adminDB).then(function (moduleDetails) {
                valueToReturn.moduledetails = moduleDetails.result;
                return valueToReturn;
            });
        }
    });
}

function getModuleDef(serverDetails, adminDB) {
    return adminDB.query({
        $collection: AppConstants.VersionControl.MODULES,
        $filter: {"types.serverType": {$in: [serverDetails.serverType, "ALL"]}},
        $sort: {priority: -1}
    });
}

function updateInHttpProxy(servertype, port, adminDB) {
    return adminDB.query({
        $collection: AppConstants.VersionControl.Proxy.PROXY,
        $filter: {published: true, serverType: servertype},
        $fields: {_id: 1}
    }).then(
        function (result) {
            result = result.result;
            var updates = [];
            var toSet = "http://127.0.0.1:" + port;
            for (var i = 0; i < result.length; i++) {
                updates.push({_id: result[i]._id, $set: {target: toSet}});
            }
            return adminDB.update({$collection: AppConstants.VersionControl.Proxy.PROXY, $update: updates});
        }).then(function (result) {
            var service = {};
            var params = {};
            service.hostname = AppConstants.VersionControl.Proxy.HOSTNAME;
            service.port = AppConstants.VersionControl.Proxy.PORT;
            service.path = "/httpproxyclearcachedb";
            service.method = "post";
            return require("ApplaneCore/apputil/httputil.js").executeServiceAsPromise(service, params);
        });
}

function updatePublished(servertype, newid, adminDB) {
    var oldServer;
    return adminDB.query({
        $collection: AppConstants.VersionControl.SERVERS,
        $filter: {published: true, serverType: servertype}
    }).then(
        function (data) {
            oldServer = data.result[0];
            if (oldServer) {
                return adminDB.update({
                    $collection: AppConstants.VersionControl.SERVERS,
                    $update: {_id: oldServer._id, $unset: {published: 1, autostart: 1}}
                });
            }
        }).then(function () {
            return adminDB.update({
                $collection: AppConstants.VersionControl.SERVERS,
                $update: {_id: newid, $set: {published: 1, autostart: 1}}
            });
        });
}

function getClaAndRunServer(serverDetails, adminDB) {
    var cla = "";
    var apppath;
    var appFile;
    return adminDB.query({
        $collection: AppConstants.VersionControl.CLA,
        $filter: {"types.serverType": {$in: [serverDetails.serverType, "ALL"]}}
    }).then(
        function (data) {
            data = data.result;
            var params = {};
            if (data.length > 0) {
                extractCLA(params, data);
            }
            if (serverDetails.cla) {
                extractCLA(params, serverDetails.cla);
            }
            cla = createCLAString(params);
            cla = "SERVER_NAME=" + serverDetails.servername + " PORT=" + serverDetails.port + " " + cla;
            apppath = serverDetails.path + serverDetails.appPath;
            appFile = apppath.substring(apppath.lastIndexOf("/") + 1);
            apppath = apppath.substring(0, apppath.indexOf(appFile));
        }).then(function () {
            runNodeServer(apppath, appFile, cla);
        });
}

function extractCLA(params, raw) {
    for (var i = 0; i < raw.length; i++) {
        var module = raw[i];
        if (module.key && module.value) {
            params[module.key] = module.value;
        }
    }
}

function createCLAString(arguments) {
    var str = "";
    for (var key in arguments) {
        str += key + "=" + arguments[key] + " ";
    }
    return str;
}

function processModules(path, modulesToInstall, branch, cmdValue, skipsource, skipframework, skipnpm, serverType) {
    var moduleOut = [];
    return Utility.iterateArrayWithPromise(modulesToInstall,
        function (index, module) {
            if (module.name) {
                var command;
                var args;
                var scriptPath = "./serverset";
                if (module.moduleType === "npm" && !skipnpm) {
                    command = module.name;
                    if (module.version) {
                        command = command + "@" + module.version;
                    }
                    args = [cmdValue, path, "npm", command];
                    return runCommandInScript(args, scriptPath).then(function (out) {
                        out.moduleName = module.name;
                        moduleOut.push(out);
                    });
                } else if (module.moduleType === "framework" && !skipframework) {
                    command = module.name;
                    if (branch && command !== "AFBSource") {
                        args = [cmdValue, path, "framework", command, branch];
                    } else {
                        args = [cmdValue, path, "framework", command];
                    }
                    return runCommandInScript(args, scriptPath).then(function (out) {
                        out.moduleName = module.name;
                        moduleOut.push(out);
                    });
                } else if (module.moduleType === "source" && !skipsource) {
                    command = module.name;
                    var moduleVersion = serverType ? getModuleProperty(module, "moduleVersion", serverType) : undefined;
                    if (moduleVersion) {
                        args = [cmdValue, path, "source", command, moduleVersion];
                    } else {
                        args = [cmdValue, path, "source", command];
                    }
                    return runCommandInScript(args, scriptPath).then(function (out) {
                        out.moduleName = module.name;
                        moduleOut.push(out);
                    });
                }
            }
        }).then(function () {
            return moduleOut;
        });
}

function getModuleProperty(module, property, serverType) {
    if (module.types && Array.isArray(module.types)) {
        for (var i = 0; i < module.types.length; i++) {
            var type = module.types[i];
            if (type.serverType === serverType && type[property]) {
                return type[property];
            }
        }
    }
}

function createFolderSetup(serverDetails) {
    var command = "mkdir " + serverDetails.name;
    var path = serverDetails.path;
    return runCommandInTerminal(path, command).then(
        function () {
            path = path + "/" + serverDetails.name;
            command = "cd " + path;
            return runCommandInTerminal(path, command);
        }).then(
        function () {
            command = "mkdir node_modules";
            return runCommandInTerminal(path, command);
        }).then(function () {
            path = path + "/node_modules/";
            serverDetails.path = path;
        })
}

function runMongod(params, admindb) {
    var mongoDef;
    return getMongodef(params, admindb).then(
        function (mongodef) {
            mongoDef = mongodef;
            if (!mongoDef.mongopath) {
                throw new Error(" Mongo Path should be valid path or default. ");
            } else {
                if (mongoDef.mongopath === "default") {
                    mongoDef.mongopath = "/usr/bin";
                }
                return checkIfExist(mongoDef.mongopath, "mongod").then(function (resp) {
                    if (!resp) {
                        throw new Error(" Mongo Path is not valid. ");
                    }
                });
            }
        }).then(
        function () {
            return checkIfExist(mongoDef.dbpath);
        }).then(
        function (resp) {
            if (!resp) {
                throw new Error(" DB Path is not valid. ");
            }
            return checkIfExist(mongoDef.logpath);
        }).then(
        function (resp) {
            if (!resp) {
                throw new Error(" Log Path is not valid. ");
            }
            return checkIfExist(mongoDef.logpath, "mongod.log");
        }).then(
        function (resp) {
            if (!resp) {
                var createfilecmd = " echo ' ' | cat > mongod.log ";
                return runCommandInTerminal(mongoDef.logpath, createfilecmd);
            }
        }).then(function () {
            var mongocmd = mongoDef.mongopath + "/mongod --fork --dbpath='" + mongoDef.dbpath + "/' --logpath='" + mongoDef.logpath + "/mongod.log' --port=" + mongoDef.port;
            if (mongoDef.mongoAuth) {
                mongocmd += " --auth";
            }
            if (mongoDef.mongoMaxConns) {
                mongocmd += " --maxConns " + mongoDef.mongoMaxConns;
            }
            return runMongodInstance(mongocmd);
        });
}

function getMongodef(params, adminDB) {
    return adminDB.query({
        $collection: AppConstants.VersionControl.SERVERS,
        $filter: {_id: params._id}
    }).then(
        function (mongodef) {
            mongodef = mongodef.result[0];
            return mongodef;
        }).then(function (mongodef) {
            if (!mongodef.port) {
                throw new Error(" Port is mandatory. ");
            }
            if (!mongodef.dbpath) {
                throw new Error(" DB Path is mandatory. ");
            }
            if (!mongodef.logpath) {
                throw new Error(" Log Path is mandatory. ");
            }
            return mongodef;
        });
}

function checkIfExist(path, filename) {
    var scriptPath = "./serverset";
    var args;
    if (filename) {
        args = ["checkfileinpath", path, filename];
    } else {
        args = ["checkfileinpath", path];
    }
    return runCommandInScript(args, scriptPath).then(function (out) {
        var stdout = out.stdout.substring(0, 4);
        if (stdout && stdout === "true") {
            return true;
        }
    });
}

function runMongodInstance(command) {
    var cwd = process.cwd() + "/lib/apps";
    var child = ChildProcess.spawn(process.execPath, ["runMongod.js", command], {
        detached: true,
        cwd: cwd,
        stdio: 'ignore'
    });
    child.unref();
}

function readFile(fullFilePath) {
    var d = Q.defer();
    var fs = require('fs');
    fs.readFile(fullFilePath, 'binary', function (err, data) {
        if (err) {
            d.reject(err);
            return;
        }
        d.resolve(data);
    });
    return d.promise;
}

exports.updateServerStatus = function (params, db) {
    var adminDB = undefined;
    return ApplaneDB.getAdminDB().then(
        function (admindb) {
            adminDB = admindb;
            return updateServerStatusInternal({serverGroup: "applane"}, adminDB);
        }).then(
        function () {
            return updateServerStatusInternal({serverGroup: "mongo"}, adminDB);
        }).then(
        function () {
            return updateServerStatusInternal({serverGroup: "applane admin"}, adminDB);
        }).then(
        function () {
            return updateServerStatusInternal({serverGroup: "websites"}, adminDB);
        }).then(function () {
            return updateServerStatusInternal({serverGroup: "other"}, adminDB);
        });
};

function updateServerStatusInternal(params, admindb) {
    var serverGroup = params.serverGroup;
    var query = {$collection: AppConstants.VersionControl.SERVERS, $filter: {serverGroup: serverGroup}, $fields: {port: 1, servername: 1}};
    if (serverGroup == "other") {
        query.$fields.statusUrl = 1;
    }
    return admindb.query(query).then(function (data) {
        data = data.result;
        return Utility.iterateArrayWithPromise(data, function (index, serverDef) {
            if (!serverDef.port) {
                throw new Error("Port not defined for server : " + serverDef.servername ? serverDef.servername : undefined);
            }
            return getRunningStatus(serverDef, serverGroup).then(function (status) {
                return updateStatus(serverDef, status, admindb);
            });
        });
    });
}

function getRunningStatus(serverDef, serverGroup) {
    var info = undefined;
    if (serverGroup == "applane") {
        info = {port: serverDef.port, url: '/rest/connect?db=pladmin&options={"username":"admin","password":"damin"}', checkForCode: true};
        return confirmRunningServer(info);
    } else if (serverGroup == "mongo") {
        var url = "mongodb://127.0.0.1:" + serverDef.port + "/test";
        return confirmRunningMongod(url);
    } else if (serverGroup == "websites") {
        info = {port: serverDef.port, url: '/rest/login'};
        return confirmRunningServer(info);
    } else if (serverGroup == "applane admin") {
        info = {port: serverDef.port, url: '/rest/runningStatus', checkForCode: true};
        return confirmRunningServer(info);
    } else if (serverGroup == "other") {
        if (serverDef.statusUrl) {
            info = {port: serverDef.port, url: serverDef.statusUrl, checkForCode: true};
            return confirmRunningServer(info);
        } else {
            var d = Q.defer();
            d.resolve("NA");
            return d.promise;
        }
    } else {
        throw new Error("Error : serverGroup is undefined while checking for server running status.");
    }
}

function updateStatus(serverDef, status, adminDB) {
    var statusStr = typeof status == "string" ? status : (status ? "Up" : "Down");
    if (statusStr === "Down") {
        var servername = serverDef.servername ? serverDef.servername : undefined;
        var port = serverDef.port ? serverDef.port : undefined;
        var options = {to: ["rohit.bansal@daffodilsw.com", "ashu.vashishat@daffodilsw.com"], from: "developer@daffodilsw.com", subject: "Server Down"};
        var html = '';
        html += "Server : " + servername + " on port " + port + " has status <b>DOWN</b> since " + new Date();
        options.html = html;
        MailService.sendFromAdmin(options);
    }
    return adminDB.update({
        $collection: AppConstants.VersionControl.SERVERS,
        $update: {_id: serverDef._id, $set: {serverStatus: statusStr, statusUpdatedAt: new Date()}}
    });
}

function confirmRunningServer(options) {
    var port = options.port;
    var url = options.url;
    var checkForCode = options.checkForCode;
    var d = Q.defer();
    var callUrl = 'http://127.0.0.1:' + port + url;
    require('request')({url: callUrl}, function (err, resp) {
        if (err) {
            d.resolve(false);
            return;
        }
        if (resp && resp.statusCode) {
            if (!checkForCode || resp.statusCode === 200) {
                d.resolve(true);
                return;
            }
        }
        d.resolve(false);
    });
    return d.promise;
}

function confirmRunningMongod(url) {
    var d = Q.defer();
    MongoClient.connect(url, function (err) {
        if (err) {
            d.resolve(false);
        } else {
            d.resolve(true);
        }
    });
    return d.promise;
}

exports.serverTypeUpdate = function (params, admindb, options) {
    if (!params.collectionName) {
        throw new BusinessLogicError("No collection found!");
    }
    if (!params.serverType) {
        throw new BusinessLogicError("No server type selected!");
    }
    if (params.delete && params.insert) {
        throw new BusinessLogicError("Select either insert or delete, not both.");
    }
    if (!params.delete && !params.insert) {
        throw new BusinessLogicError("You can select either insert or delete.");
    }
    var ids = params._id;
    if (!ids) {
        throw new Error("_id not found in parameters.Parameters found [" + JSON.stringify(params) + "]");
    }
    if (!Array.isArray(ids)) {
        ids = [ids];
    }
    var query = {$collection: params.collectionName, $filter: {_id: {$in: ids}}, $fields: {types: 1}};
    return admindb.query(query).then(function (data) {
        data = data.result;
        return Utility.iterateArrayWithPromise(data, function (index, row) {
            var existingTypes = row.types;
            var typeIndex = Utility.isExists(existingTypes, {serverType: params.serverType}, "serverType");
            if (params.delete && typeIndex !== undefined) {
                return admindb.update({$collection: params.collectionName, $update: [
                    {_id: row._id, $set: {"types": {$delete: [
                        {_id: existingTypes[typeIndex]._id}
                    ]}}}
                ]});
            } else if (params.insert && typeIndex === undefined) {
                return admindb.update({$collection: params.collectionName, $update: [
                    {_id: row._id, $set: {"types": {$insert: [
                        {serverType: params.serverType}
                    ]}}}
                ]})
            }
        })
    });
};