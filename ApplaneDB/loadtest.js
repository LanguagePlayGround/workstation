var express = require('express');
var http = require('http');
var app = express();
var Utils = require("ApplaneCore/apputil/httputil.js");
var interval = 5000;
var users = 5;
var intervalObject = undefined;
var operations = [];

function getDB(url) {
    var d = require('q').defer();
    var MongoClient = require("mongodb").MongoClient;
    MongoClient.connect(url, function (err, db) {
        if (err) {
            console.log("Err in connect>>>" + err);
            d.reject(err);
        }
        d.resolve(db);
    })
    return d.promise;
}

function start() {
    url = "mongodb://192.168.100.11:27024/samples_sb/";
    var loadedCollection = undefined;
    var operationCollection = undefined;
    var loadedCollectionName = "loaddata"
    var operationsCollectionName = "loadoperations";

    return getDB(url).then(function(db){
        loadedCollection = db.collection(loadedCollectionName)
        operationCollection =  db.collection(operationsCollectionName);
        operationCollection.find({},{fields:{name:1, operations:1}}).toArray( function (err, operationData) {
            if (err) {
                console.log("err in find>>>>>>>>>>>>>>>>>" + err);
            }
            intervalObject = setInterval(function () {
                loadCheck(loadedCollection, operationData)
            }, interval);
        });
    });
}

function executeLoadService(collection, load, operationData) {
    //generate random no. for operations
    var operationNumber = Math.floor((Math.random() * operationData.length));
    var operationToExecute = operationData[operationNumber].operations;
    var service = {hostname: "127.0.0.1", port: 5100, path: "/rest/" + operationToExecute.type, method: "POST"};
    var params = operationToExecute;
    var startTime = new Date();
    Utils.executeService(service, params, function (err, res) {
        var success = "success";
        if (err) {
            console.log("err in execute service>>>>>>>" + err);
            success = "fail";
        }
        var endTime = new Date();
        var totalTime = endTime.getTime() - startTime.getTime();
        collection.insert({"operationName":operationData[operationNumber].name, "interval": interval, "load": load, "type": operationToExecute.type, "success": success, "op": operationNumber, time: totalTime}, function (err, data) {
            if (err) {
                console.log("err in insert>>>>>>>>>>>>>>>>>" + err);
            }
        });
    });
}
function loadCheck(collection, operationData) {
    if(!operationData || !operationData.length>0){
        return;
    }
        //generate random no. for load/users
        var load = Math.floor((Math.random() * users) + 1)
        for (var i = 0; i < load; i++) {
            executeLoadService(collection, load, operationData);
        }
}



app.all("/rest/start", function (req, res) {
    if (intervalObject) {
        writeJSONResponse(res, "Load tracking already started")
        return;
    }
    start();
    writeJSONResponse(res, "Load tracking started")
});

app.all("/rest/stop", function (req, res) {
    if (!intervalObject) {
        writeJSONResponse(res, "Load tracking already stopped")
        return;
    }
    clearInterval(intervalObject);
    intervalObject = undefined;
    writeJSONResponse(res, "Load tracking stopped")


});


function writeJSONResponse(res, result) {
    var jsonResponseType = {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS"};
    res.writeHead(200, jsonResponseType);
    res.write(result);
    res.end();


}


http.createServer(app).listen(5000);
console.log("started.....")

//start();
