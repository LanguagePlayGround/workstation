var Q = require("q");

var Logger = function (info) {
    this.info = info || {};
    this.info.logs = this.info.logs || [];
    this.container = this.info.logs;
    this.stack = undefined;
    this.logCount = 0;
}

Logger.prototype.setPoint = function () {
    if ((!this.info) || (!this.info.logs)) {
        return;
    }
    if ((!this.stack) || this.stack.length == 0) {
        var length = this.info.logs.length;
        if (length > 0) {
            var lastLog = this.info.logs[length - 1];
            lastLog.logs = lastLog.logs || [];
            this.stack = this.stack || [];
            this.stack.push(lastLog);
            this.container = lastLog.logs;
        }
    } else {
        var length = this.stack.length;
        var source = this.stack[length - 1].logs;
        length = source.length;
        var lastLog = source[length - 1];

        lastLog.logs = lastLog.logs || [];
        this.stack = this.stack || [];
        this.stack.push(lastLog);
        this.container = lastLog.logs;

    }
}

Logger.prototype.endPoint = function () {
    var length = this.stack ? this.stack.length : 0;
    if (length == 0) {
        return;
    }

    this.stack.splice(length - 1, 1);
    length = this.stack.length;
    if (length > 0) {
        this.container = this.stack[length - 1].logs;
    } else {
        this.container = this.info.logs;
        this.stack = undefined;
    }

}

Logger.prototype.setInfo = function (key, value) {
    if (this.info) {
        this.info[key] = value;
    }
}
Logger.prototype.writeLog = function (log) {
    if (this.info && this.info.logs && this.container) {
        this.logCount += 1;
        this.container.push(log);
    }
}

Logger.prototype.get = function (key) {
    if (this.info) {
        return this.info[key];
    }
}

Logger.prototype.getAll = function () {
    return this.info;
}


Logger.prototype.populateInitialLog = function (type, info, that, setPoint) {
    var log = {};
    log["type"] = type;
    log["startTime"] = new Date();
    log["log"] = info;
    if (that.getLogger()) {
        that.getLogger().writeLog(log);
    }
    if (that.logger && setPoint) {
        that.logger.setPoint();
    }
    log.point = setPoint;
    return log;
}

Logger.prototype.populateFinalLog = function (that, log, endPoint) {
    if (log) {
        log["endTime"] = new Date();
        var totalTime = log["endTime"].getTime() - log["startTime"].getTime();
//        delete log.startTime;
//        delete log.endTime;
        log["totalTime"] = totalTime;
        if (that.logger && log.point) {
            that.logger.endPoint();
        }
        delete log.point;
    }
}

Logger.prototype.clean = function () {
    delete this.info;
    delete this.container;
    delete this.stack;
}

module.exports = Logger;

