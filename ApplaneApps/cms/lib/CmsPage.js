var Q = require("q");
var Constants = require("./Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var ApplaneDB = require("ApplaneDB/lib/DB.js");

exports.getData = function (param) {
    var db = undefined;
    var adminDB = undefined;
    return ApplaneDB.getAdminDB().then(
        function (adb) {
            adminDB = adb;
            var filter = {};
            filter[Constants.Admin.DomainMappings.DOMAIN] = param.domain;
            return adminDB.query({$collection: Constants.Admin.DOMAIN_MAPPINGS, $filter: filter});
        }).then(function (result) {
            if (result && result.result && result.result.length > 0) {
                result = result.result[0];
                return adminDB.connectUnauthorized(result.db);
            } else {
                throw new Error("Domain mapping not found for domain [" + param.domain + "]");
            }
        }).then(function (db1) {
            db = db1;
            var filter = {};
            filter[Constants.Admin.Domains.DOMAIN] = param.domain;
            return db.query({$collection: Constants.Admin.DOMAINS, $filter: filter});
        }).then(function (domainInfo) {
            if (domainInfo && domainInfo.result && domainInfo.result.length > 0) {
                var newParams = {param: param, domainInfo: domainInfo};
                return  getPageInfo(newParams, db);
            } else {
                throw new Error("domain not found [" + param.domain + "]");
            }
        });
}

function getPageInfo(newParams, db) {
    var param = newParams.param;
    var domainInfo = newParams.domainInfo;
    var filter = {};
    filter[Constants.Admin.Pages.URI] = param.uri;
    return db.query({$collection: Constants.Admin.PAGES, $filter: filter}).then(function (pageInfo) {
        if (pageInfo && pageInfo.result && pageInfo.result.length > 0) {
            pageInfo = pageInfo.result[0];
            newParams.pageInfo = pageInfo;
            if (pageInfo[Constants.Admin.Pages.TYPE] == Constants.Admin.Pages.Type.PAGE) {
                var templateId = pageInfo[Constants.Admin.Pages.TEMPLATEID];
                if (templateId) {
                    return getTemplate(newParams, db);
                } else {
                    //todo if the contents of the page are specified
                }
            } else if (pageInfo[Constants.Admin.Pages.TYPE] == Constants.Admin.Pages.Type.RESOURCE) {
                return loadResource(newParams, db);
            } else {
                throw new Error("Page Type is not supported in page..[" + pageInfo.uri + "]");
            }
        } else {
            throw new Error("Page not found corresponding to uri [" + param.uri + "]");
        }
    });
}

function getTemplate(newParams, db) {
    var param = newParams.param;
    var domainInfo = newParams.domainInfo;
    var pageInfo = newParams.pageInfo;
    populatePageParameters(param, pageInfo);
    var templateId = pageInfo[Constants.Admin.Pages.TEMPLATEID];
    return db.query({$collection: Constants.Admin.TEMPLATES, $filter: {_id: templateId._id}}).then(function (templateInfo) {
        if (templateInfo && templateInfo.result && templateInfo.result.length > 0) {
            templateInfo = templateInfo.result[0];
            newParams.templateInfo = templateInfo;
            return resolveTemplate(newParams, db);
        } else {
            throw new Error("Template Not Found corresponding to template [" + templateId.name + "]");
        }
    }).then(function (templateHtml) {
            param.templateHtml = templateHtml;
            return getPageResources(newParams, db)
        }).then(function (pageResources) {
            param.pageResources = pageResources;
            return getHTMLWithPageResources(param, pageInfo);
        });
}


function populatePageParameters(param, pageInfo) {
    var pageParameters;
    var queryParam = param.queryParam;
    if (pageInfo && pageInfo.parameters) {
        pageParameters = pageInfo.parameters;
    } else {
        pageParameters = {};
    }
    if (queryParam) {
        for (var key in queryParam) {
            pageParameters[key] = queryParam[key];
        }
    }
    if (param.cookies) {
        pageInfo.cookies = param.cookies;
        var cookies = param.cookies;
        for (var key in cookies) {
            pageParameters[key] = cookies[key];
        }
    }
    pageInfo.parameters = pageParameters;
}

function executeQuery(templateInfo, db) {
    var queryType = templateInfo[Constants.Admin.Templates.QUERYTYPE];
    var query = templateInfo[Constants.Admin.Templates.QUERY];
    if (typeof query === "string") {
        query = JSON.parse(query);
    }
    if (queryType == Constants.Admin.Templates.QueryType.QUERY) {
        return db.query(query);
    } else if (queryType == Constants.Admin.Templates.QueryType.BATCHQUERY) {
        return db.batchQuery(query);
    } else if (queryType == Constants.Admin.Templates.QueryType.DATA) {
        var d = Q.defer();
        d.resolve(data);
        return d.promise;
    } else {
        throw new Error("Query Type is mandatory");
    }
}

function resolveTemplate(newParams, db) {
    var param = newParams.param;
    var templateInfo = newParams.templateInfo;
    if (templateInfo.query) {
        return executeQuery(templateInfo, db).then(function (data) {
            newParams.data = data;
            return resolveInternal(templateInfo, newParams);
        });
    } else {
        return resolveInternal(templateInfo, newParams);
    }
}

function resolveInternal(templateInfo, params) {
    var type = templateInfo[Constants.Admin.Templates.TYPE];
    if (type == "ejs") {
        var templateHtml = require('ejs').render(templateInfo[Constants.Admin.Templates.TEMPLATE], params);
        return templateHtml;
    } else {
        throw new Error(" Not supported for template type [" + templateInfo.type + "]");
    }
}


function loadResource(newParams, db) {
    var param = newParams.param;
    var uri = param.uri;
    var pageInfo = newParams.pageInfo;
    var req = newParams.req;
    var res = newParams.res;
    var resourceType = pageInfo[Constants.Admin.Pages.RESOURCETYPE];
    var defaultType = undefined;
    if (resourceType == Constants.Admin.Pages.ResourceType.IMAGES) {
        defaultType = "image/jpeg";
    } else if (resourceType == Constants.Admin.Pages.ResourceType.JS) {
        defaultType = "application/javascript";
    } else if (resourceType == Constants.Admin.Pages.ResourceType.CSS) {
        defaultType = "text/css";
    } else if (resourceType == Constants.Admin.Pages.ResourceType.FONTS) {
        defaultType = "application/x-font-truetype";
    } else if (resourceType == Constants.Admin.Pages.ResourceType.PDF) {
        defaultType = "application/pdf";
    } else if (resourceType == Constants.Admin.Pages.ResourceType.XML) {
        defaultType = "text/xml";
    }
    var extension = uri.split('.').pop();
    var extensionTypes = {
        'html': 'text/html',
        'css': 'text/css',
        'gif': 'image/gif',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'js': 'application/javascript',
        'png': 'image/png',
        'svg': 'image/svg+xml',
        'ttf': 'application/x-font-truetype',
        'otf': 'application/x-font-opentype',
        'woff': 'application/font-woff',
        'eot': 'application/vnd.ms-fontobject',
        'pdf': 'application/pdf',
        'xml': 'text/xml'
    };
    var extentionType = extensionTypes[extension];
    if (!extentionType) {
        extentionType = defaultType;
    }
    if (pageInfo[Constants.Admin.Pages.FILE]) {
        var file = pageInfo[Constants.Admin.Pages.FILE];
        return db.downloadFile(file.key).then(function (fileInfo) {
            var headers = {};
            headers["Content-Type"] = extentionType;
            return {headers: headers, binary: fileInfo.data};
        });
    }
}


function getHTMLWithPageResources(param, pageInfo) {
    var templateHtml = param.templateHtml;
    var pageResources = param.pageResources;
    var cssFiles = [];
    var jsFiles = [];
    var footerJSFiles = [];
    if (pageResources && pageResources.length > 0) {
        var resourcesCount = pageResources.length;
        for (var i = 0; i < resourcesCount; i++) {
            var resource = pageResources[i];
            var resourceType = resource[Constants.Admin.Pages.RESOURCETYPE];
            var resourceContent = resource[Constants.Admin.Pages.CONTENTS];
            var jsInFooter = resource[Constants.Admin.Pages.FOOTER];
            var resourceId = resource[Constants.Admin.Pages.URI];
            var file = resource;
            if (resourceContent && resourceContent.length > 0) {
                if (resourceType == Constants.Admin.Pages.ResourceType.JS) {
                    if (!jsInFooter) {
                        jsFiles.push(resourceContent);
                    } else {
                        footerJSFiles.push(resourceContent);
                    }
                } else if (resourceType == Constants.Admin.Pages.ResourceType.CSS) {
                    cssFiles.push(resourceContent);
                }
            }
        }
    }
    if (pageInfo[Constants.Admin.Pages.PAGETYPE] && pageInfo[Constants.Admin.Pages.PAGETYPE] == "text") {
        /*support of text type page*/
        return templateHtml;
    } else {
        var html = '<!DOCTYPE HTML>';
        html += '<html>';
        html += '<head>';

        if (cssFiles.length > 0) {
            for (var i = 0; i < cssFiles.length; i++) {
                html += cssFiles[i];
            }
        }
        if (jsFiles.length > 0) {
            for (var i = 0; i < jsFiles.length; i++) {
                html += jsFiles[i];
            }
        }
        html += '<title>' + pageInfo[Constants.Admin.Pages.TITLE] + '</title>';
        /*html += '<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />';
         html += '<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">';
         html += '<link type="image/ico" href="/favicon.ico" rel="SHORTCUT ICON">';*/
        html += '</head>';
        html += '<body>';
        html += templateHtml;
        if (footerJSFiles.length > 0) {
            for (var i = 0; i < footerJSFiles.length; i++) {
                html += footerJSFiles[i];
            }
        }
        html += '</body>';
        html += '</html>';
        return html;
    }
}

function getPageResources(newParams, db) {
    var templateInfo = newParams.templateInfo;
    var resources = templateInfo[Constants.Admin.Templates.RESOURCES];
    var ids = [];
    var length = resources ? resources.length : 0;
    for (var i = 0; i < length; i++) {
        var resource = resources[i];
        var resourceid = resource[Constants.Admin.Templates.Resources.RESOURCEID];
        if (resourceid) {
            ids.push(resourceid[Constants.Admin.Pages.URI]);
        }
    }
    if (ids.length > 0) {
        var filter = {};
        filter[Constants.Admin.Pages.URI] = {"$in": ids};
        return db.query({$collection: Constants.Admin.PAGES, $filter: filter}).then(function (resourcesInfo) {
            if (resourcesInfo && resourcesInfo.result && resourcesInfo.result.length > 0) {
                return resourcesInfo.result;
            }
        });
    }
}