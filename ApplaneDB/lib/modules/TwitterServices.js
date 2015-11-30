/**
 * Created by ashu on 30/4/15.
 * UPDATE TWEETS :
 * http://127.0.0.1:5100/rest/invoke?function=TwitterServices.updateTweets&token=dc6be74635ab166bb2495b89b0ffe46adc529c51&parameters=[{%22q%22:%22java%20developer%22}]
 * AccessToken : Admin should save credentials in db as :
 * {accessToken:{consumer_key: accessToken.consumer_key, consumer_secret: accessToken.consumer_secret, access_token_key: accessToken.access_token_key, access_token_secret: accessToken.access_token_secret}}
 * {$collection: "crm_adminTokens"} , {id: "twitter"}
 *
 * http://127.0.0.1:5100/rest/invoke?function=TwitterServices.updateToken&token=dc6be74635ab166bb2495b89b0ffe46adc529c51&parameters=[{"accessToken":{"consumer_key": "XXXX", "consumer_secret": "XXXX", "access_token_key": "XXXX", "access_token_secret": "XXXX"}}]
 */

var Q = require("q");
var t = require("twitter");
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Utils = require("ApplaneCore/apputil/util.js");

exports.updateToken = function (params, db) {
    var accessToken = params.accessToken;
    if (!accessToken) {
        throw new Error("Can't update token : No accessToken.");
    }
    if (!accessToken.consumer_key || !accessToken.consumer_secret || !accessToken.access_token_key || !accessToken.access_token_secret) {
        throw new Error("AccessToken is incomplete");
    }
    return db.update({$collection: "crm_adminTokens", $upsert: {$query: {id: "twitter"}, $set: {accessToken: accessToken}}, $options: {upsert: true, new: true}});
};

exports.updateTweets = function (params, db) {
    if (!params.q) {
        throw new Error("q (query) is mandatory for tweet update")
    }
    var q = params.q;
    var tweets = [];
    var maxId = 0;
    var query = {q: q, result_type: "mixed", count: 100}; // mixed/popular/recent
    var initialCall = true;
    var twitterClient = undefined;
    return db.query({$collection: "crm_adminTokens", $filter: {id: "twitterSyncInfo"}, $fields: {lastMaxId: 1, limit: 1}, $limit: 1}).then(function (data) {
        data = data.result;
        if (data[0] && data[0].lastMaxId) {
            initialCall = false;
            maxId = data[0].lastMaxId;
            query.since_id = data[0].lastMaxId;
        }
        return getAccessToken(db);
    }).then(function (accessToken) {
        twitterClient = new t({consumer_key: accessToken.consumer_key, consumer_secret: accessToken.consumer_secret, access_token_key: accessToken.access_token_key, access_token_secret: accessToken.access_token_secret});
        return getTweeets(twitterClient, tweets, query, initialCall);
    }).then(function () {
        return insertTweets(tweets, maxId, db);
    })
};

function getAccessToken(db) {
    return db.query({$collection: "crm_adminTokens", $filter: {id: "twitter"}, $fields: {accessToken: 1}, $limit: 1}).then(function (data) {
        data = data.result;
        if (!data[0]) {
            throw new Error("Can't get Tweets : No Access Token");
        }
        var accessToken = (data[0] && data[0].accessToken) ? data[0].accessToken : undefined;
        if (accessToken) {
            if (!accessToken.consumer_key || !accessToken.consumer_secret || !accessToken.access_token_key || !accessToken.access_token_secret) {
                throw new Error("AccessToken is incomplete");
            }
            return accessToken;
        } else {
            throw new Error("Can't get tweets. accessToken is undefined.");
        }
    });
}

function getTweeets(twitterClient, tweets, query, initialCall) {
    return searchTweets(twitterClient, query).then(function (resp) {
        var statuses = resp.statuses;
        if (statuses && statuses.length > 0) {
            tweets.push.apply(tweets, statuses);
            if (initialCall) {
                return;
            }
            var metadata = resp.search_metadata;
            if (metadata.next_results) {
                query.since_id = metadata.max_id;
                return getTweeets(twitterClient, tweets, query)
            }
        }
    });
}

function searchTweets(twitterClient, query) {
    var d = Q.defer();
    twitterClient.get("search/tweets", query, function (err, resp) {
        if (err) {
            d.reject(new Error(JSON.stringify(err)))
        }
        d.resolve(resp)
    });
    return d.promise
}

function insertTweets(tweets, maxId, db) {
    return Utils.iterateArrayWithPromise(tweets, function (index, tweet) {
        maxId = ( tweet.id > maxId ) ? tweet.id : maxId;
        return db.update({$collection: "twittersync", $insert: tweet}).fail(function (err) {
            if (err.code == "11000") {
                // duplicate : do nothing
            } else {
                throw err;
            }
        });
    }).then(function () {
        return db.update({$collection: "crm_adminTokens", $upsert: {$query: {id: "twitterSyncInfo"}, $set: {lastMaxId: maxId}}, $options: {upsert: true, new: true}});
    });
}
