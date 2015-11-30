/**
 * Created by ashu on 29/4/15.
 *  set/update Access token in DB :
 *  http://127.0.0.1:5100/rest/invoke?function=LinkedInServices.getAccessCode&token=dc6be74635ab166bb2495b89b0ffe46adc529c51&parameters=[{}]
 *  Access Company profile :
 *  127.0.0.1:5100/rest/invoke?function=LinkedInServices.getCompanyProfile&token=24c659e3c4b21ce7ee51aadb092307b452dea08b&parameters=[{"emailDomain":"daffodilsw.com"}]
 */

var Q = require("q");
var clientID = "75ilgzhjxatn7m";
var clientSecret = "amTqFROjNdzDyRk5";

exports.getAccessCode = function (params, db, options) {

    var host = options.domain;
    var redirectUrl = "http://" + host + "/rest/invoke?customService=state";
    var state = JSON.stringify({redirectURL: redirectUrl, token: db.token, function: "LinkedInServices.updateAccessCode"});
    var codeURL = "https://www.linkedin.com/uas/oauth2/authorization?response_type=code&client_id=" + clientID + "&state=" + state + "&redirect_uri=" + redirectUrl;
    return {redirectUrl: codeURL, respRedirect: true};
};

exports.updateAccessCode = function (params, db) {
    return getAccessToken(params).then(function (result) {
        var accessToken = result.accessToken;
        if (accessToken && accessToken.expires_in) {
            accessToken.validTill = new Date(Date.now() + ((accessToken.expires_in - 86400) * 1000));  // expire day decreased by 1 day
        }
        return db.update({$collection: "crm_adminTokens", $upsert: {$query: {id: "linkedin"}, $set: {accessToken: accessToken}}, $options: {upsert: true, new: true}});
    }).then(function () {
        return {redirectUrl: "/", respRedirect: true};
    });
};

exports.getCompanyProfile = function (params, db) {
    var emailDomain = params.emailDomain;
    var accessToken = undefined;
    return db.query({$collection: "crm_adminTokens", $filter: {id: "linkedin"}, $fields: {accessToken: 1}, $limit: 1, $modules: {"$Role": 0}}).then(function (data) {
        data = data.result;
        if (!data[0]) {
            throw new Error("Can't get company profile from linkedIn : No Access Token");
        }
        var accessToken = (data[0] && data[0].accessToken) ? data[0].accessToken : undefined;
        if (!emailDomain) {
            throw new Error(" emailDomain is a mandatory parameter.");
        }
        if (!accessToken || !accessToken.access_token) {
            throw new Error(" accessToken is a mandatory parameter.");
        }
        if (!accessToken.validTill || (accessToken.validTill < new Date())) {
            throw new Error(" accessToken has expired. Please ask admin to update fresh authorized accessToken");
        }
        return getCompanyInfo(emailDomain, accessToken.access_token);
    });
};

function getAccessToken(params) {
    var error = params.error;
    var description = params.error_description;
    if (error || description) {
        if (error == "access_denied" && description == "the user denied your request") {
            throw new Error("User denied permissions to access LinkedIn.");
        } else {
            throw new Error("error : " + error + "\n Description : " + description);
        }
    }
    var code = params.code;
    var state = params.state;
    if (typeof state === "string") {
        state = JSON.parse(state);
    }
    var redirectURL = state.redirectURL;
    var accessTokenObj;
    var request = require('request');
    var d = Q.defer();
    var tokenURL = "https://www.linkedin.com/uas/oauth2/accessToken?grant_type=authorization_code&code=" + code + "&client_id=" + clientID + "&client_secret=" + clientSecret + "&redirect_uri=" + redirectURL + "&format=json";
    request({url: tokenURL}, function (err, response) {
        if (err) {
            d.reject(err);
        }
        accessTokenObj = response.body;
        accessTokenObj = JSON.parse(accessTokenObj);
        if (!accessTokenObj || (accessTokenObj && !accessTokenObj.access_token)) {
            d.reject(new Error("AccessToken Not Found for given code (LinkedIn) OAuth."));
        } else {
            d.resolve({accessToken: accessTokenObj});
        }
    });
    return d.promise;
}

function getCompanyInfo(emailDomain, access_token) {
    var d = Q.defer();
    var url = "https://api.linkedin.com/v1/companies:(id,name,universal-name,email-domains,website-url,locations,industries,company-type,employee-count-range,specialties,founded-year,num-followers,description)?email-domain=" + emailDomain + "&oauth2_access_token=" + access_token + "&format=json";
    var request = require('request');
    request({url: url}, function (err, response) {
        if (err) {
            d.reject(err);
            return;
        }
        // errorCode == 0 if no company found.
        if (response.errorCode && response.errorCode == 0) {
            d.resolve({message: response.message});
            return;
        }
        if (response && response.body) {
            response = response.body;
            if (response && typeof response == "string") {
                response = JSON.parse(response);
            }
        }
        d.resolve(response);
    });
    return d.promise;
}

