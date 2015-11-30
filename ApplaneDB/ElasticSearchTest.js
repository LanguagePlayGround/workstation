/**
 * Created with IntelliJ IDEA.
 * User: rajit
 * Date: 10/9/14
 * Time: 2:45 PM
 * To change this template use File | Settings | File Templates.
 */

var express = require('express');
var http = require('http');
var app = express();
var bodyParser = require('body-parser');
var URL = "127.0.0.1:9200"


var Q = require("q");


function getFieldMapping(index, type, field, callback) {
    client.indices.getFieldMapping({
        index: index,
        type: type,
        field: field
    }, callback)
}

function deleteMapping(mapping, callback) {                       ////Delete a mapping (type definition) along with its data.
    client.indices.deleteMapping(mapping, callback)
}

function isIndicesExist(mapping) {
    var D = Q.defer();
    client.indices.exists(mapping).then(function () {
        D.resolve(result);
    }).fail(function (err) {
            D.reject(err);
        })
    return D.promise;
}

function searchUsingMatch() {
    client.search({
        index: 'tasks',
        type: 'task',
        body: {
            query: {
                match: {
                    progress: 'elastic search'     //it will search for both elastic as well as for search keyword in tasks>task and therefore give all the inserted data.
                }
            }
        }
    }).then(function (body) {
            console.log("body>>>>>>>>>>>>>>>>>>" + JSON.stringify(body))
            var hits = body.hits.hits;
            console.log("hits>>>>>>>>>>>>>>>>>>" + JSON.stringify(hits))
        }, function (err) {
            console.trace(err.message);
        });
}

function searchUsingFilter(index, type, body, callback) {
    client.search({
        index: index,
        type: type,
        body: body
    }, callback)
}

function searchUsingMatchPhrase() {
    client.search({
        index: 'tasks',
        type: 'task',
        body: {
            query: {
                match_phrase: {
                    progress: 'elastic search with nodeJS'
                }
            }
        }
    }).then(function (body) {
            console.log("body>>>>>>>>>>>>>>>>>>" + JSON.stringify(body))
            var hits = body.hits.hits;
            console.log("hits>>>>>>>>>>>>>>>>>>" + JSON.stringify(hits))
        }, function (err) {
            console.trace(err.message);
        });
}

function searchUsingID() {
    client.search({
        index: 'tasks',
        type: 'task',
        body: {
            query: {
                match: {
                    _id: '2'             //note we are using here _id for search but we have require to use id while inserting , if we use id here it will give nothing.
                }
            }
        }
    }).then(function (body) {
            console.log("body>>>>>>>>>>>>>>>>>>" + JSON.stringify(body))
        }, function (err) {
            console.trace(err.message);
        });
}

function updateSimple() {
    client.update({
        index: 'tasks',
        type: 'task',
        id: '1',
        body: {
            // put the partial document under the `doc` key ,a partial document will be merged with the existing one.
            doc: {
                task: "task11"
            }
        }
    }, function (error, response) {
        // ...
    })
}

function updateJSON() {
    client.update({
        index: 'tasks',
        type: 'task',
        id: '1',
        body: {
            // put the partial document under the `doc` key
            doc: {
                //owner:{emailid:"rohit@daffodilsw.com"},       //here only  emailid within owner get change and other records within owner remain as it is
                task_due_date: '2013-12-16', //and one field  task_due_date: '2013-12-16'  added   into it, if not available.
                owner: {name: "rkb", emailid: "rkb@daffodilsw.com", department: "Applane"}
            }
        }
    }, function (error, response) {
        // ...
    })
}

function countTotalDocuments() {
    client.count({
        index: 'tasks',
        type: 'task'
    }, function (error, response) {
        if (error) {
            console.log("error>>>>>>>>>>>>>" + error.message)
        }
        var count = response.count;
        console.log("number of documents available is>>>>>>>>>" + count)
    })
}

function countDocumentsMatchingQuery() {
    client.count({
        index: 'tasks',
        type: 'task',
        body: {
            query: {
                match: {
                    "owner.name": "Rajit"
                }
            }
        }
    }, function (error, response) {
        if (error) {
            console.log("error>>>>>>>>>>>>>" + error.message)
        }
        var count = response.count;
        console.log("number of documents available is>>>>>>>>>" + count)
    })
}

function dropDataBase() {
    client.indices.delete({         //delete database
        index: 'tasks',
        ignore: [404]
    }).then(function (body) {
            // since we told the client to ignore 404 errors, the
            // promise is resolved even if the index does not exist
            console.log('index was deleted or never existed');
        }, function (error) {
            // oh no!
        });
}

function exist() {
    client.exists({
        index: 'tasks',
        type: 'task',
        id: 4
    }, function (error, exists) {
        if (exists === true) {
            console.log("document is available>>>>>>>>>>>")
        } else {
            console.log("document not available>>>>>>>>>>>")
        }
    });
}

function getSource() {                 //only source, data which we are inserting into collection(not include elastic search default data)
    client.getSource({
        index: 'tasks',
        type: 'task',
        id: 1
    }, function (error, response) {
        console.log("response>>>>>>>>>>>" + JSON.stringify(response))
    });
}

function updateUsingScript() {                //error
    client.update({
        index: 'test',
        type: 'type1',
        id: '2',
        body: {
            script: 'ctx._source.tags += tag',
            params: { tag: 'blue' }
        }
    }, function (error, response) {
        if (error) {
            console.log("error>>>>>>>>>>>>>>>>>" + error.message)
        }
        console.log("response>>>>>>>>>>>>>>>>>" + JSON.stringify(response))
    });

}

function dateRangeAggregation() {       //error
    client.search({
        index: 'shopping',
        type: 'items',
        body: {
            "aggs": {
                "range": {
                    "date_range": {
                        "field": "date",
                        "format": "yyyy-MM-dd",
                        "ranges": [
                            { "to": "2009-11-15" },
                            { "from": "2009-11-05" }
                        ]
                    }
                }
            }
        }
    }).then(function (body) {
            console.log("body>>>>>>>>>>>>>>>>>>" + JSON.stringify(body))
        }, function (err) {
            console.trace(err.message);
        });
}

function min() {                     //it gives minimum price from within documents of  shopping> items   , searching price field
    client.search({
        index: 'shopping',
        type: 'items',
        body: {
            "aggs": {"min_price": { "min": { "field": "price" } }    }
        }

    }).then(function (body) {
            console.log("body>>>>>>>>>>>>>>>>>>" + JSON.stringify(body))
        }, function (err) {
            console.trace(err.message);
        });
}

function priceRange() {
    client.search({
        index: 'shopping',
        type: 'items',
        body: {
            "query": {
                "filtered": {
                    "filter": {
                        "range": {
                            "price": {
                                "gte": 1000, //find doc where price>=1000 and price<2500
                                "lt": 2500
                            }
                        }
                    }
                }
            }
        }

    }).then(function (body) {
            console.log("body>>>>>>>>>>>>>>>>>>" + JSON.stringify(body))
        }, function (err) {
            console.trace(err.message);
        });
}

function dateRange() {
    client.search({
        index: 'shopping',
        type: 'items',
        body: {
            "query": {
                "filtered": {
                    "filter": {
                        "range": {
                            "date": {
                                "gt": "2009-11-01", //2009-11-15
                                "lt": "2009-11-10"
                            }
                        }
                    }
                }
            }
        }
    }).then(function (body) {
            console.log("body>>>>>>>>>>>>>>>>>>" + JSON.stringify(body))
        }, function (err) {
            console.trace(err.message);
        });
}

function termFilter() {      //The term filter is used to filter by exact values, be the numbers, dates, booleans, or not_analyzed exact value string fields:
    client.search({
        index: 'shopping',
        type: 'items',
        body: {
            "query": {
                "filtered": {
                    "filter": {
                        "term": {
                            "price": 1000
                        }
                    }
                }
            }
        }
    }).then(function (body) {
            console.log("body>>>>>>>>>>>>>>>>>>" + JSON.stringify(body))
        }, function (err) {
            console.trace(err.message);
        });
}

function termsFilter() {      //The terms filter is the same as the term filter, but allows you to specify multiple values to match. If the field contains any of the specified values, then the document matches:
    client.search({
        index: 'shopping',
        type: 'items',
        body: {
            "query": {
                "filtered": {
                    "filter": {
                        "terms": {
                            "price": [
                                500,
                                2000
                            ]
                        }
                    }
                }
            }
        }
    }).then(function (body) {
            console.log("body>>>>>>>>>>>>>>>>>>" + JSON.stringify(body))
        }, function (err) {
            console.trace(err.message);
        });
}

function existsFilter() {                     //# find document where field : name exist
    client.search({
        index: 'shopping',
        type: 'items',
        body: {
            "query": {
                "filtered": {
                    "filter": {
                        "exists": {
                            "field": "name"
                        }
                    }
                }
            }
        }
    }).then(function (body) {
            console.log("body>>>>>>>>>>>>>>>>>>" + JSON.stringify(body))
        }, function (err) {
            console.trace(err.message);
        });
}

function missingFilter() {                     //# find document where field : name not exist
    client.search({
        index: 'shopping',
        type: 'items',
        body: {
            "query": {
                "filtered": {
                    "filter": {
                        "missing": {
                            "field": "name"
                        }
                    }
                }
            }
        }
    }).then(function (body) {
            console.log("body>>>>>>>>>>>>>>>>>>" + JSON.stringify(body))
        }, function (err) {
            console.trace(err.message);
        });
}

function boolFilter() {                     //The bool filter is used to combine multiple filter clauses using Boolean logic. It accepts three parameters:    must    These clauses must match, like and    must_not    These clauses must not match, like not    should    At least one of these clauses must match, like or    Each of these parameters can accept a single filter clause or an array of filter clauses:
    client.search({
        index: 'test',
        type: 'test',
        body: {
            "query": {
                "filtered": {
                    "filter": {
                        "bool": {
                            "must": {
                                "term": {
                                    "folder": "inbox"
                                }
                            },
                            "must_not": {
                                "term": {
                                    "tag": "spam"
                                }
                            },
                            "should": [
                                {
                                    "term": {
                                        "starred": true
                                    }
                                },
                                {
                                    "term": {
                                        "unread": true
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        }
    }).then(function (body) {
            console.log("body>>>>>>>>>>>>>>>>>>" + JSON.stringify(body))
        }, function (err) {
            console.trace(err.message);
        });
}

function match_all() {
    client.search({
        index: 'shopping',
        type: 'items',
        body: {
            "query": {
                "match_all": {}
            }
        }
    }).then(function (body) {
            console.log("body>>>>>>>>>>>>>>>>>>" + JSON.stringify(body))
        }, function (err) {
            console.trace(err.message);
        });
}

function multiMatch() {
    client.search({
        index: 'test',
        type: 'test',
        body: {
            query: {
                "multi_match": {
                    "query": "talk",
                    "fields": [ "title", "body" ]
                }
            }
        }
    }).then(function (body) {
            console.log("body>>>>>>>>>>>>>>>>>>" + JSON.stringify(body))
        }, function (err) {
            console.trace(err.message);
        });
}

//insert();

//searchAll();

//searchUsingQ();

//searchUsingFilter();

//searchUsingMatch();

//searchUsingMatchPhrase();

//searchUsingID();

//updateSimple();

//updateJSON();

//countTotalDocuments();

//countDocumentsMatchingQuery();

//deleteDocumentByID();

//deleteByQuery();

//dropDataBase();

//exist();

//getSource();

//dateRangeAggregation();

//min();

//priceRange();

//dateRange();

//termFilter();

//termsFilter();

//existsFilter();

//missingFilter();

//boolFilter();

//match_all();

//multiMatch();

//updateUsingScript();

app.use(function (req, res, next) {
    bodyParser()(req, res, next);

});

app.all("/rest/bulk", function (req, res) {

    var bulk = req.param("bulk");
    bulk = JSON.parse(bulk);

    client.bulk(bulk, function (err, result) {
        writeJSONResponse(res, err || result)
    });


});

app.all("/rest/index", function (req, res) {
    var index = req.param("index");
    index = JSON.parse(index);

    var ElasticSerachDB = require("./lib/ElasticSearchDB.js")

    var db = new ElasticSerachDB(URL);
    db.index(index).then(function (response) {
        writeJSONResponse(res, response)
    }).catch(function (err) {
            writeJSONResponse(res, err);
        })


});

app.all("/rest/update", function (req, res) {
    var update = req.param("update");
    update = JSON.parse(update);

    var ElasticSerachDB = require("./lib/ElasticSearchDB.js")

    var db = new ElasticSerachDB(URL);
    db.update(update).then(function (response) {
        writeJSONResponse(res, response)
    }).catch(function (err) {
            writeJSONResponse(res, err);
        })


});

app.all("/rest/searchAll", function (req, res) {
    var index = req.param("index");
    var type = req.param("type");

    searchAll(index, type, function (err, result) {
        writeJSONResponse(res, err || result)
    })
});

app.all("/rest/searchUsingQ", function (req, res) {
    var index = req.param("index");
    var type = req.param("type");
    var q = req.param("q");

    searchUsingQ(index, type, q, function (err, result) {
        writeJSONResponse(res, err || result)
    })
});

app.all("/rest/query", function (req, res) {
    var search = req.param("search");
    search = JSON.parse(search);

    var ElasticSerachDB = require("./lib/ElasticSearchDB.js")

    var db = new ElasticSerachDB(URL);
    db.search(search).then(function (response) {
        writeJSONResponse(res, response)
    }).catch(function (err) {
            writeJSONResponse(res, err);
        })
});

app.all("/rest/count", function (req, res) {
    var count = req.param("count");
    count = JSON.parse(count);

    var ElasticSerachDB = require("./lib/ElasticSearchDB.js")

    var db = new ElasticSerachDB(URL);
    db.count(count).then(function (response) {
        writeJSONResponse(res, response)
    }).catch(function (err) {
            writeJSONResponse(res, err);
        })
});

app.all("/rest/deleteByQuery", function (req, res) {
    var search = req.param("search");
    search = JSON.parse(search);

    var ElasticSerachDB = require("./lib/ElasticSearchDB.js")

    var db = new ElasticSerachDB(URL);
    db.deleteByQuery(search).then(function (response) {
        writeJSONResponse(res, response)
    }).catch(function (err) {
            writeJSONResponse(res, err);
        })
});

app.all("/rest/delete", function (req, res) {
    var search = req.param("search");
    search = JSON.parse(search);

    var ElasticSerachDB = require("./lib/ElasticSearchDB.js")

    var db = new ElasticSerachDB(URL);
    db.delete(search).then(function (response) {
        writeJSONResponse(res, response)
    }).catch(function (err) {
            writeJSONResponse(res, err);
        })
});

app.all("/rest/createIndices", function (req, res) {
    var index = req.param("index");
    index = JSON.parse(index);

    var ElasticSerachDB = require("./lib/ElasticSearchDB.js")

    var db = new ElasticSerachDB(URL);
    db.createIndices(index).then(function (response) {
        writeJSONResponse(res, response)
    }).catch(function (err) {
            writeJSONResponse(res, err);
        })
});

app.all("/rest/deleteIndices", function (req, res) {
    var index = req.param("index");
    index = JSON.parse(index);

    var ElasticSerachDB = require("./lib/ElasticSearchDB.js")

    var db = new ElasticSerachDB(URL);
    db.deleteIndices(index).then(function (response) {
        writeJSONResponse(res, response)
    }).catch(function (err) {
            writeJSONResponse(res, err);
        })
});

app.all("/rest/getMapping", function (req, res) {
    var mapping = req.param("mapping");
    mapping = JSON.parse(mapping);

    var ElasticSerachDB = require("./lib/ElasticSearchDB.js")

    var db = new ElasticSerachDB(URL);
    db.getMapping(mapping).then(function (response) {
        writeJSONResponse(res, response)
    }).catch(function (err) {
            writeJSONResponse(res, err);
        })
});

app.all("/rest/getFieldMapping", function (req, res) {
    var index = req.param("index");
    var type = req.param("type");
    var field = req.param("field");

    getFieldMapping(index, type, field, function (err, result) {
        writeJSONResponse(res, err || result)
    })

});

app.all("/rest/putMapping", function (req, res) {
    var mapping = req.param("mapping");
    mapping = JSON.parse(mapping);

    var ElasticSerachDB = require("./lib/ElasticSearchDB.js")

    var db = new ElasticSerachDB(URL);
    db.putMapping(mapping).then(function (response) {
        writeJSONResponse(res, response)
    }).catch(function (err) {
            writeJSONResponse(res, err);
        })
});

app.all("/rest/deleteMapping", function (req, res) {    //Delete a mapping (type definition) along with its data.
    var mapping = req.param("mapping");
    mapping = JSON.parse(mapping);

    deleteMapping(mapping, function (err, result) {
        writeJSONResponse(res, err || result)
    })

});

app.all("/rest/isIndicesExist", function (req, res) {
    var mapping = req.param("mapping");
    mapping = JSON.parse(mapping);

    return isIndicesExist(mapping).then(
        function (result) {
            writeJSONResponse(res, result);
        }).fail(function (err) {
            writeJSONResponse(res, err);
        })

});


function writeJSONResponse(res, result) {
    if (result instanceof  Error) {
        result = result.message + "\n" + result.stack;
    } else {
        result = JSON.stringify(result);
    }
    var jsonResponseType = {"Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS"};
    res.writeHead(200, jsonResponseType);
    res.write(result);
    res.end();


}


http.createServer(app).listen(5000);
console.log("started.....")