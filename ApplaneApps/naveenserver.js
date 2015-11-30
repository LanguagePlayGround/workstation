var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var staticPath = __dirname + '/public';
app.use(express.static(staticPath));

app.use(function (req, res, next) {
    try {
        var contentType = req.header("content-type");
        if (contentType && contentType.indexOf("application/json") != -1) {
            bodyParser.json({limit: 1024 * 1024 * 10})(req, res, next);
        } else {
            bodyParser.urlencoded({ extended: true, limit: 1024 * 1024 * 10})(req, res, next);
        }
    } catch (err) {
        res.status(500).send(err);
    }
});

app.all("/rest/getdata", function (req, res) {
    try {
        var cursor = req.param("page");
        var row_count = req.param("row_count");
        var col_name = req.param("col_name");
        var direction = req.param("direction");
        var items = [
            {
                "Num": 13,
                "Picture": "http:\/\/stats.nba.com\/media\/players\/230x185\/202327.png",
                "Name": "Ekpe Udoh",
                "Pos": "PF",
                "Height": "6-10",
                "Weight": 240,
                "Birthday": "05\/20\/1987",
                "Years": "4"
            },
            {
                "Num": 0,
                "Picture": "http:\/\/stats.nba.com\/media\/players\/230x185\/201175.png",
                "Name": "Glen Davis",
                "Pos": "PF",
                "Height": "6-9",
                "Weight": 289,
                "Birthday": "01\/01\/1986",
                "Years": "7"
            },
            {
                "Num": 15,
                "Picture": "http:\/\/stats.nba.com\/media\/players\/230x185\/2045.png",
                "Name": "Hedo Turkoglu",
                "Pos": "SF",
                "Height": "6-10",
                "Weight": 220,
                "Birthday": "03\/19\/1979",
                "Years": "14"
            },
            {
                "Num": 4,
                "Picture": "http:\/\/stats.nba.com\/media\/players\/230x185\/200755.png",
                "Name": "J.J. Redick",
                "Pos": "SG",
                "Height": "6-4",
                "Weight": 190,
                "Birthday": "06\/24\/1984",
                "Years": "8"
            },
            {
                "Num": 11,
                "Picture": "http:\/\/stats.nba.com\/media\/players\/230x185\/2037.png",
                "Name": "Jamal Crawford",
                "Pos": "G",
                "Height": "6-5",
                "Weight": 200,
                "Birthday": "03\/20\/1980",
                "Years": "14"
            },
            {
                "Num": 4,
                "Picture": "http:\/\/stats.nba.com\/media\/players\/230x185\/200755.png",
                "Name": "J.J. Redick",
                "Pos": "SG",
                "Height": "6-4",
                "Weight": 190,
                "Birthday": "06\/24\/1984",
                "Years": "8"
            }
        ];
        if(row_count >= 10){
            for (var i = 0; i < row_count; i++) {
                items.push({
                    "Num": 13,
                    "Picture": "http:\/\/stats.nba.com\/media\/players\/230x185\/202327.png",
                    "Name": "Ekpe Udoh",
                    "Pos": "PF",
                    "Height": "6-10",
                    "Weight": 240,
                    "Birthday": "05\/20\/1987",
                    "Years": i+cursor
                })
            }
        }
        console.log('cursor -->>> '+cursor+", row_count --> "+row_count+", col_name --> "+col_name+", direction --> "+direction);
        var response = {
            "viewType":'grid',
            "columns": [
                {
                    "key": "Num",
                    "label": "Number",
                    "type": "Number"
                },
                {
                    "key": "Picture",
                    "label": "Picture",
                    "type": "Image"
                },
                {
                    "key": "Name",
                    "label": "Name",
                    "type": "Link"
                },
                {
                    "key": "Pos",
                    "label": "Position",
                    "type": "String"
                },
                {
                    "key": "Height",
                    "label": "Height",
                    "type": "String"
                },
                {
                    "key": "Weight",
                    "label": "Weight",
                    "type": "Number"
                },
                {
                    "key": "Birthday",
                    "label": "Birthday",
                    "type": "String"
                },
                {
                    "key": "Years",
                    "label": "Years",
                    "type": "Number"
                }
            ],
            "items": items,
            "paginate": {
                "page": 2,
                "pages": 3,
                "offset": 5,
                "row_count": 50,
                "total": 15,
                "col_name": "Name",
                "direction": "asc"
            }
        }

        res.send(response);

    } catch (err) {
        res.status(500).send(err);
    }
});

app.all("/rest/getdetail", function (req, res) {
    try {
        var cursor = req.param("page");
        var row_count = req.param("row_count");
        var col_name = req.param("col_name");
        var direction = req.param("direction");
        var items = [
            {
                "Num": 13,
                "Picture": "http:\/\/stats.nba.com\/media\/players\/230x185\/202327.png",
                "Name": "Ekpe Udoh",
                "Pos": "PF",
                "Height": "6-10",
                "Weight": 240,
                "Birthday": "05\/20\/1987",
                "Years": "4"
            }
        ];

        var response = {
            "columns": [
                {
                    "key": "Num",
                    "label": "Number",
                    "type": "Number"
                }
            ],
            "items": items,
            "paginate": {
                "page": 2,
                "pages": 3,
                "offset": 5,
                "row_count": 5,
                "total": 15,
                "col_name": "Name",
                "direction": "asc"
            }
        }

        res.send(response);

    } catch (err) {
        res.status(500).send(err);
    }
});


var http = require("http");
var port = 5500;
http.createServer(app).listen(port);
console.log("server started at "+port);