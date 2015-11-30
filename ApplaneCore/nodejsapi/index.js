/*no use*/
var Query = require('./lib/database/Query.js');
var Update = require('./lib/database/update.js');

exports.asQuery = function (query, options) {
    return new Query(query, options);
}

exports.asUpdate = function (table, options) {
    return new Update(table, options);
}

