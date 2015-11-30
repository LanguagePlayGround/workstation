var express = require('express');
var app = express();
var cache = {}

app.all("/rest/getcache",function(req,res){
    res.send(empCollection)

})
app.all("/rest/setcache",function(req,res){
    res.json(empCollection)
})

var http =require("http");
http.createServer(app).listen(6000);