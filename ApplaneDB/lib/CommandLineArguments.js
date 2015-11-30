var Constants = require("./Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");

exports.setConfig = function (config) {
    populateConfigFromCommandLineArgs(config);
    config.CPUS = config.CPUS || 1;
    validateBoolean(config, "SERVER_START_UP");
    validateBoolean(config, "SERVICE_LOGS_ENABLED");
    validateBoolean(config, "SERVER_PROFILING");
    validateBoolean(config, "USER_CACHE");
    if (config.MailCredentials) {
        validateBoolean(config.MailCredentials, "SEND_ERROR_MAIL");
    }
    if (config.ProcessCache) {
        validateBoolean(config.ProcessCache, "CACHE");
        validateNumber(config.ProcessCache, "USER");
        validateNumber(config.ProcessCache, "COLLECTION");
        validateNumber(config.ProcessCache, "FUNCTION");
    }
    validateNumber(config, "QUERY_LIMIT");
    validateBoolean(config, "ENSURE_DB");
    var publicPath = config.BASE_URL;
    if (publicPath) {
        publicPath = publicPath.trim();
        if (publicPath.length > 0) {
            var path = require.resolve(publicPath);
            var indexOfIndexJS = path.indexOf("index.js");
            path = path.substring(0, indexOfIndexJS) + "/node_modules";
            config.BASE_URL = path;
        }
    }
}

function validateNumber(config, key) {
    if (config[key] !== undefined && config[key] !== null) {
        var value = config[key];
        try {
            value = parseInt(value.toString());
            config[key] = value;
        } catch (e) {
        }
    }
}

function validateBoolean(config, key) {
    if (config[key] !== undefined) {
        var value = config[key];
        config[key] = (value === true || value === "true") ? true : false;
    }
}

function populateConfigFromCommandLineArgs(config) {
    if (process && process.argv) {
        for (var i = 0; i < process.argv.length; i++) {
            var obj = process.argv [i];
            var indexOf = obj.indexOf("=");
            if (indexOf === -1) {
                continue;
            }
            var key = obj.substring(0, indexOf);
            var value = obj.substring(indexOf + 1);
            if (value) {
                Utils.putDottedValue(config, key, value);
            }
        }
    }
}
