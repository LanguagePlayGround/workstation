/**
 * Created by ashu on 12/6/15.
 */

var ApplaneDB = require("ApplaneDB");
var MailService = require("ApplaneDB/lib/MailService.js");
var gps = require("gps-tracking");
var config = {};
require("ApplaneDB/lib/CommandLineArguments.js").setConfig(config);
var debugEnabled = !!(config.GpsDebug === true || config.GpsDebug === "true");
var GpsAppDB = config.GpsAppDB;

console.error("debugEnabled : " + debugEnabled);
myLogger("config", config, true);

var serverOptions = {
    'debug': debugEnabled,
    'port': config.PORT,
    'device_adapter': "TK103"
};

function myLogger(keyString, val, isJSON) {
    if (debugEnabled) {
        if (isJSON) {
            console.log(keyString + " : " + JSON.stringify(val));
        } else if (val) {
            console.log(keyString + " : " + val);
        } else {
            console.log(keyString);
        }
    }
}

function runGpsServer() {
    var server = gps.server(serverOptions, function (device, connection) {
        device.on("login_request", function (device_id, msg_parts) {
            myLogger("login_request from device", device_id);
            var that = this;
            return ApplaneDB.getAdminDB().then(function (adminDB) {
                return adminDB.connectUnauthorized(GpsAppDB);
            }).then(function (db) {
                return db.invokeFunction("Vehicle.isDeviceRegistered", [
                    {device_id: device_id}
                ]);
            }).then(function (result) {
                myLogger("login_request result for device " + device_id, result);
                that.login_authorized(result);
            }).fail(function (e) {
                myLogger("Error in login_request ", e);
                throw e;
            });
        });

        device.on("ping", function (data, device_id) {
            myLogger("device ping for device " + device_id, data, true);
            if (device_id) {
                var db = undefined;
                return ApplaneDB.getAdminDB().then(function (adminDB) {
                    return adminDB.connectUnauthorized(GpsAppDB);
                }).then(function (db1) {
                    db = db1;
                    return db.invokeFunction("Vehicle.isDeviceRegistered", [
                        {device_id: device_id}
                    ]);
                }).then(function (result) {
                    if (!result) {
                        myLogger("Not a valid device!");
                        return;
                    }
                    console.log("gps : calling insertVehicleLocation . . .");
                    return db.invokeFunction("Vehicle.insertVehicleLocation", [
                        {latitude: data.latitude, longitude: data.longitude, speed: data.speed, date: data.inserted, device_id: device_id}
                    ]);
                }).fail(function (e) {
                    console.log("error in ping : " + e);
                    throw e;
                });
            }
        });

        device.on("alarm", function (alarm_code, alarm_data, msg_data) {
            myLogger("Alarm event with code " + alarm_code, alarm_data.msg);
        });

        device.on("login_rejected", function () {
            myLogger("login_rejected event occurred!");
        });

        device.on("other", function () {
            myLogger("Other event occurred in gps server!");
            var options = {to: "ashu.vashishat@daffodilsw.com", from: "developer@daffodilsw.com", subject: "GPS Other Event Occurred !"};
            var html = '';
            html += "<b>DATE</b>" + new Date() + "<br>";
            html += "<b>close event in gps server</b>";
            options.html = html;
            MailService.sendFromAdmin(options).fail(function (e) {
                console.error("error : " + e);
            });
        });

        device.on('error', function (err) {
            myLogger("error detail", err);
            var options = {to: "ashu.vashishat@daffodilsw.com", from: "developer@daffodilsw.com", subject: "GPS Error"};
            var html = '';
            html += "<b>DATE</b>" + new Date() + "<br>";
            html += "<b>Error in gps server</b>";
            options.html = html;
            MailService.sendFromAdmin(options).fail(function (e) {
                console.error("error : " + e);
            });
        });
    });
}

ApplaneDB.configure(config).then(function () {
    runGpsServer();
}).fail(function (e) {
    var options = {to: "ashu.vashishat@daffodilsw.com", from: "developer@daffodilsw.com", subject: "GPS Server : Applane Error"};
    var html = '';
    html += "<b>DATE</b>" + new Date() + "<br>";
    html += "<b>Error in gps server.</b>";
    options.html = html;
    MailService.sendFromAdmin(options).fail(function (e) {
        console.error("error : " + e);
    });
});

if (debugEnabled) {
    setInterval(function () {
        myLogger("gps server alive", new Date());
    }, 120000);
}



