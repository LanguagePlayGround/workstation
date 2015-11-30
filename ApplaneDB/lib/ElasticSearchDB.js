/**
 * Created with IntelliJ IDEA.
 * User: rajit
 * Date: 13/9/14
 * Time: 11:12 AM
 * To change this template use File | Settings | File Templates.
 */
//this.client =  esClient                 //I have replace  this.client with  esClient , because we have required autoincrement _id   Rajit garg


var elasticsearch = require('elasticsearch');

var CLIENTS = {};
var esClient = undefined;
var edb = undefined;

var ElasticSearchDB = function (url) {
    esClient = getClient(url);
}
//search= {"index":"","type":"","id":"", "body":""}
ElasticSearchDB.prototype.index = function (index) {
    return esClient.index(index);
}
//search= {"index":"","type":"","body":""}
ElasticSearchDB.prototype.search = function (search) {
    return esClient.search(search);
}

ElasticSearchDB.prototype.update = function (update) {
    return esClient.update(update);
}

//search= {"index":"","type":"","body":""}
ElasticSearchDB.prototype.deleteByQuery = function (search) {
    return esClient.deleteByQuery(search);
}

//search= {"index":"","type":"","id":""}
ElasticSearchDB.prototype.delete = function (search) {
    return esClient.delete(search);
}


/*  count = {"index":"","type":""} */
ElasticSearchDB.prototype.count = function (count) {
    return esClient.count(count);
}

ElasticSearchDB.prototype.createIndices = function (index) {
    return esClient.indices.create(index);
}

ElasticSearchDB.prototype.deleteIndices = function (index) {
    return esClient.indices.delete(index);
}


//e.g.for putMapping-->mapping={ "index": "test", "type": "persons", "body": { "persons": { "properties": { "sname": { "type": "string" }}}}}
ElasticSearchDB.prototype.putMapping = function (mapping) {
    return esClient.indices.putMapping(mapping);
}

/*  mapping = {"index":"","type":""} */

ElasticSearchDB.prototype.getMapping = function (mapping) {
    return esClient.indices.getMapping(mapping);
}

function getClient(url) {
    if (CLIENTS[url]) {
        return CLIENTS[url];
    }
    CLIENTS[url] = new elasticsearch.Client({
        host:url
    });
    return CLIENTS[url];

}

exports.getEDB = function(url){
    if(!edb){
        edb = new ElasticSearchDB(url);
    }
    return edb;
}