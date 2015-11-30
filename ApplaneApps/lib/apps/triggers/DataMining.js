/**
 * Created by rajit on 23/5/15.
 */

var Q = require("q");
var Utility = require("ApplaneCore/apputil/util.js");
var Utils = require("ApplaneCore/apputil/httputil.js");
var Self = require("./DataMining.js");

//This function is used to send response to user, which will shows his result from the specified xpath/nextPageXpath
exports.resolveXpath = function (params, db) {
    var d = Q.defer();
    if (!params) {
        d.reject(new Error("params not available."));
        return d.promise;
    }
    var xpath = params.xpath;
    var url = params.url;
    var attr = params.attr;               //this attribute is used to get nextpath url info only
    if (!xpath || !url) {
        d.reject(new Error("Either xpath or url not defined."));
        return d.promise;
    }
    return getXpathResult(url, xpath, attr).then(function (xpathResult) {
        d.resolve(xpathResult);
        return d.promise;
    });
};

//This function is used to send response to user, which will shows his result from the specified xpath/nextPageXpath
function getXpathResult(url, xpath, attr) {                             //xpath mostly found is like this  //*[@id='navlink']    for nextpageXpath
    var d = Q.defer();
    var service = {"hostname": url, "method": "GET"};
    return Utils.executeServiceAsPromise(service, {}, {"requestModule": true}).then(function (html) {
        var xpathWithoutTbody = xpath.replace("/tbody", "");
        if (xpath !== xpathWithoutTbody) {
            xpath = xpath + " | " + xpathWithoutTbody;
        }
        var xpathHtml = getXpathHtml(xpath, html);                   // html found is like this for nextpageXpath, <a href=""></a>, <a href=""></a>,<a href=""></a>,<a href=""></a>,<a href=""></a>
        var cheerio = require('cheerio');
        if (xpathHtml && typeof xpathHtml !== "string") {
            xpathHtml = xpathHtml.toString();
        }
        //for getting nextpath exact link, assuming next xpath found from the last
        if (xpathHtml && attr) {                  //todo logic require to review
            var array = xpathHtml.split(",");
            if (array && array.length > 0) {
                xpathHtml = array[array.length - 1];
            }
        }
        if (xpathHtml) {
            $ = cheerio.load(xpathHtml);
            var selector = getFinalSelector(xpath);
            if (attr) {
                var domain = extractDomain(url);
                var uri = $(selector).attr(attr);
                var nextUrl = domain + uri;           //todo assuming we get right uri
                d.resolve(nextUrl);
            } else {
                d.resolve($(selector).text());
            }
        } else {
            d.resolve("Value Provided is not accurate.");
        }
        return d.promise;
    }).fail(function (err) {
        d.reject(err);
        return d.promise;
    });

}

function getXpathHtml(selector, html) {
    var libxmljs = require("libxmljs");
    var xmlDoc = libxmljs.parseHtmlString(html);
    if (xmlDoc && xmlDoc.errors) {
        if (xmlDoc.errors.length > 0) {
            if (xmlDoc.errors[0] && xmlDoc.errors[0].code && xmlDoc.errors[0].code === 4) {
                // error comes in this case    Error: Document has no root element
                return "";
            } else {
                return xmlDoc.find(selector);
            }
        } else {
            return xmlDoc.find(selector);
        }
    } else {
        return "";
    }

};


function getFinalSelector(xpath) {
    var selector = xpath.substring(xpath.lastIndexOf("/") + 1);
    selector = removeArrayBracket([selector]);
    return selector;
}


function removeArrayBracket(repeaters) {
    var repeater = "";
    for (var i = 0; i < repeaters.length; i++) {
        var index = repeaters[i].indexOf("[");
        if (index >= 0) {
            repeater += repeaters[i].substring(0, index);
        } else {
            repeater += repeaters[i];
        }
        if (i < repeaters.length - 1 && repeater.length > 0) {
            repeater += " ";
        }
    }
    return repeater;
}

exports.getDataMiningDetails = function (params, db, options) {
    var asyncDB = db.asyncDB();
    options = options || {};
    options.processName = "Data Mining";
    return db.query({$collection: "dataminingdetails", $filter: {_id: params._id}}).then(function (miningInfo) {
        if (miningInfo && miningInfo.result && miningInfo.result.length > 0) {
            return asyncDB.createProcess(options).then(function (result) {
                setTimeout(function () {
//                    console.log("start process.....");
                    return asyncDB.startProcess(miningInfo.result, "DataMining.populateDataMiningDetails", options);
                }, 100);
                return result;
            });
        }
    })
};

//http://127.0.0.1:5100/rest/invoke?function=DataMining.populateDataMiningDetails&parameters=[{"_id":"1001", "url":"http://www.infotaxi.org/india_taxi/ahmedabad_taxi.htm", "collection":"dataMining", "db":"samples_sb", "nextPageXpath":"//*[@id='navlink']", "fieldDetails":[{"field":"Taxi Services", "xpath1":"//*[@id='centertxt']/div/table[2]/tbody/tr[2]/td[2]/div/a", "xpath2":"//*[@id='centertxt']/div/table[2]/tbody/tr[3]/td[2]/div/a"}, {"field":"Phone", "xpath1":"//*[@id='centertxt']/div/table[2]/tbody/tr[2]/td[3]/div", "xpath2":"//*[@id='centertxt']/div/table[2]/tbody/tr[3]/td[3]/div"}] }]&token=23469fe86b9d8123189235562def47f1858a6d06
exports.populateDataMiningDetails = function (parameters, db, options) {
    var params = parameters.data;
    var url = params.url;
    options = options || {};
    options["miningUrls"] = options["miningUrls"] || [];
    options["miningUrls"].push(url);
    var fieldDetails = params.fieldDetails;
    var finalResult = undefined;
    var dataMiningDetailsId = params._id;
    options["page_no"] = options["page_no"] || 1;
    var dbName = params.db;
    var collection = params.collection;
    if (!dbName || !collection) {
        throw new Error("Either DB or Collection not Available.")
    }
    var service = {"hostname": url, "method": "GET"};
    return Utils.executeServiceAsPromise(service, {}, {"requestModule": true}).then(function (html) {
        return getInfoUsingTwoXpath(fieldDetails, html);
    }).then(function (result) {
        finalResult = result;
    }).then(function () {
        if (finalResult && finalResult.length > 0) {
            return  db.connectUnauthorized(dbName);
        }
    }).then(function (dbToPort) {
        if (dbToPort) {
            var dataMiningInfo = finalResult;
            for (var i = 0; i < dataMiningInfo.length; i++) {
                dataMiningInfo[i]["__dataMiningDetailsId"] = dataMiningDetailsId;
                dataMiningInfo[i]["__url"] = url;
                dataMiningInfo[i]["__page"] = options["page_no"];
            }
            return dbToPort.update({$collection: collection, $insert: dataMiningInfo});
        }
    }).then(function () {
        if (finalResult && finalResult.length > 0) {
            return getNextPageUrl(params);
        }
    }).then(function (nextPageUrl) {
        if (nextPageUrl && nextPageUrl !== "Value Provided is not accurate.") {
            var index = Utility.isExists(options["miningUrls"], nextPageUrl);
            if (!index || index < 0) {           //means url not already mined. and required to mined...
                params.url = nextPageUrl;
                options["page_no"] = options["page_no"] ? options["page_no"] + 1 : 1;
                return Self.populateDataMiningDetails({data: params}, db, options);
            }
        }
    })
};

function getNextPageUrl(params) {
    var nextPageXpath = params.nextPageXpath;
    var nextpageurl = params.nextpageurl;
    if (nextPageXpath) {
        var url = params.url;
        var attr = params.attr;
        return getXpathResult(url, nextPageXpath, attr);
    } else if (nextpageurl) {
        var nextpagekey = params.nextpagekey;
        var nextpagevalue = params.nextpagevalue;
        var nextPageIncValue = params.nextPageIncValue;              //10 next time     //20
        if (!nextPageIncValue) {
            params.nextPageIncValue = 0;
            nextPageIncValue = 0;
        }
        if (nextpagekey && nextpagevalue) {
            params.nextPageIncValue += nextpagevalue;             //10          //use next time     //20        //30
            nextpagevalue = nextpagevalue + nextPageIncValue;           //10        //20               //30
            nextpageurl += "&" + nextpagekey + "=" + nextpagevalue;
        }
        return nextpageurl;
    } else {
        return "Value Provided is not accurate.";
    }
}


function getInfoUsingTwoXpath(infos, html) {
    var d = Q.defer();
    var finalResult = {};
    for (var i = 0; i < infos.length; i++) {
        var info = infos[i];
        var xpath1 = info.xpath1;
        var xpath2 = info.xpath2;
        var attr = info.attr;
        var requireInfo = getRequiredInfo(xpath1, xpath2);
        var parentHtml = html;
        if (requireInfo.xpath && requireInfo.xpath.length > 0) {
            parentHtml = getXpathHtml(requireInfo.xpath, html);
        }
        if (typeof parentHtml !== "string") {
            parentHtml = parentHtml.toString();
        }
        if (parentHtml && parentHtml.length > 0) {
            var cheerio = require('cheerio');
            $ = cheerio.load(parentHtml);
            $(requireInfo.repeater).each(function (i, elem) {
                var elemHtml = $(this).html();
                if (typeof elemHtml !== "string") {
                    elemHtml = elemHtml.toString();
                }
                var myXpath1 = undefined;
                var tdResult = "";
                if (requireInfo.selector && requireInfo.selector.length > 0) {
                    myXpath1 = '//*/' + requireInfo.selector;
                    if (elemHtml && elemHtml.length > 0) {
                        tdResult = getXpathHtml(myXpath1, elemHtml);
                    }
                } else {
                    if (elemHtml && elemHtml.length > 0) {
                        tdResult = elemHtml;
                    }
                }
                if (tdResult && typeof tdResult !== "string") {
                    tdResult = tdResult.toString();
                }
                $$ = cheerio.load(tdResult);
                var result = undefined;
                if (attr) {
                    result = $$(requireInfo.finalSelector).attr(attr);
                } else {
                    result = $$(requireInfo.finalSelector).text();
                }
                finalResult[info.field] = finalResult[info.field] || [];
                finalResult[info.field].push(result);
            });
        }
    }
    var records = [];
    var keys = Object.keys(finalResult);
    var key = keys[0];
    var value = finalResult[key];
    var length = value ? value.length : 0;
    for (var i = 0; i < length; i++) {
        var row = {};
        for (var j = 0; j < keys.length; j++) {
            var key = keys[j];
            var value = finalResult[key];
            if (value[i] !== undefined && value[i] !== null && value[i].length > 0) {
                row[key] = value[i];
            }
        }
        if (Object.keys(row).length > 0) {
            records.push(row);
        }
    }
//    console.log("records>>>>>>" + JSON.stringify(records));
    d.resolve(records);
    return d.promise;
}

function getRequiredInfo(myXpath1, myXpath2) {
    var array1 = myXpath1.split("/");
    var array2 = myXpath2.split("/");
    var found = false;
    var index = undefined;
    for (var i = 0; i < array1.length; i++) {
        for (var j = i; j < array2.length; j++) {
            if (array1[i] !== array2[j]) {
                found = true;
                index = i;
            } else {
                break;
            }
        }
        if (found) {
            break;
        }
    }
    var requiredXpath = "";
    if ((array1[index].indexOf("*") !== 0) && (array1[index].indexOf("[") !== 0)) {
        for (var k = 0; k < index; k++) {
            requiredXpath += array1[k];
            if (k < index - 1) {
                requiredXpath += "/";
            }

        }
    } else {
        index += 1;
    }


    var xpathWithoutTbody = requiredXpath.replace("/tbody", "");

    if (requiredXpath !== xpathWithoutTbody) {
        requiredXpath = requiredXpath + " | " + xpathWithoutTbody;
    }

    var requireInfo = {};
    requireInfo["xpath"] = requiredXpath;
    requireInfo["repeater"] = getRepeater(xpathWithoutTbody, array1, index);
    requireInfo["selector"] = getSelector(array1, index);
    requireInfo["finalSelector"] = getFinalSelector(myXpath1);
    return requireInfo;
}

function getSelector(array1, index) {
    var selector = "";
    for (var k = index + 1; k < array1.length; k++) {
        selector += array1[k];
        if (k < array1.length - 1) {
            selector += "/";
        }
    }
    return selector;
}

function getRepeater(parentXpath, array1, index) {
    var repeater1stPart = parentXpath.substring(parentXpath.lastIndexOf("/") + 1);
    var repeater2ndPart = array1[index];
    return removeArrayBracket([repeater1stPart, repeater2ndPart]);
}

function extractDomain(url) {
    var domain;
    //find & remove protocol (http, ftp, etc.) and get domain
    if (url.indexOf("://") > -1) {
        domain = url.split('/')[2];
    }
    else {
        domain = url.split('/')[0];
    }

    //find & remove port number
    domain = domain.split(':')[0];

    return domain;
}
