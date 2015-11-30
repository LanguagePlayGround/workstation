exports.resolveTemplate = function (parameters, db, options) {
    var data = undefined;
    var Constants = require("ApplaneDB/lib/Constants.js");
    if (parameters && parameters[Constants.Admin.Templates.TEMPLATE] && parameters[Constants.Admin.Templates.TEMPLATE]["_id"]) {
        return db.query({$collection: Constants.Admin.TEMPLATES, $filter: {"_id": parameters[Constants.Admin.Templates.TEMPLATE]["_id"]}}).then(function (templateData) {
                if (templateData && templateData.result && templateData.result.length === 1) {
                    templateData = templateData.result[0];
                    return db.getDBCode().then(function (code) {
                        options.dbcode = code;
                        options.token = db.token;
                        return getData(templateData, parameters, db)
                    }).then(function (data) {
                        var type = templateData[Constants.Admin.Templates.TYPE];
                        if (type === Constants.Admin.Templates.Type.SEND_MAIL) {
                            return sendMail(parameters, templateData, data, db, options);
                        } else if (type === Constants.Admin.Templates.Type.PRINT) {
                            var template = templateData[Constants.Admin.Templates.TEMPLATE];
                            var templateType = templateData[Constants.Admin.Templates.TEMPLATE_TYPE];
                            return resolveHtml(parameters, template, data, options, templateType, db);
                        }
                    });
                } else {
                    throw new Error("None or more than one result found for collection [" + Constants.Admin.TEMPLATES + "] for _id [" + parameters[Constants.Admin.Templates.TEMPLATE]["_id"] + "]");
                }
            }
        )
    } else {
        throw new Error("Template is mandatory to render data, for send mail or print data");
    }
}

function resolveHtml(parameters, template, data, options, templateType, db){
    return  getHtml(template, data, options, templateType, db).then(function (html){
        var result = {};
        if (parameters.preview) {
            result.useAsPreview = true;
        } else {
            result.useAsPrint = true;
        }
        result.data = html;
        return result;
    })

}


function sendMail(parameters, templateData, data, db, invokeOptions) {
    if (parameters.preview) {
        return getSendMailPreview(templateData, data, invokeOptions, db);
    } else {
        var Constants = require("ApplaneDB/lib/Constants.js");
        var template = templateData[Constants.Admin.Templates.TEMPLATE];
        var templateType = templateData[Constants.Admin.Templates.TEMPLATE_TYPE];
        var asyncDB = db.asyncDB();
        invokeOptions.templateData = templateData;
        invokeOptions.template = template;
        invokeOptions.templateType = templateType;
        return asyncDB.createProcess(invokeOptions).then(function (result) {
            setTimeout(function () {
                return asyncDB.startProcess(data, "ResolveTemplate.handleProcess", invokeOptions);
            }, 100);
            return result;
        });
    }
}

function getData(templateData, parameters, db) {
    var Constants = require("ApplaneDB/lib/Constants.js");
    var ids = parameters._id ? parameters._id : [];
    var filter = {};
    if (Array.isArray(ids)) {
        filter._id = { $in: ids };
    } else {
        filter._id = ids;
    }
    if (templateData[Constants.Admin.Templates.FUNCTION]) {
        return db.invokeFunction(templateData[Constants.Admin.Templates.FUNCTION], [parameters]).then(function (data) {
            if (data && data.result) {
                return data.result;
            } else {
                throw new Error("Data not Found through given function [ " + templateData[Constants.Admin.Templates.FUNCTION] + " ]");
            }
        })
    }
    else if (templateData[Constants.Admin.Templates.QUERY]) {
        var query = JSON.parse(templateData[Constants.Admin.Templates.QUERY]);
        query[Constants.Query.FILTER] = filter;
        return db.query(query).then(function (result) {
            if (result && result.result) {
                return result.result;
            } else {
                throw new Error("Data not Found through given query [ " + templateData.query + " ]");
            }
        })
    } else {
        var viewid = parameters.viewid;
        return db.invokeFunction("view.getView", [
            {id: viewid, $filter: filter}
        ]).then(function (result) {
            if (result && result.data && result.data.result) {
                return result.data.result;
            } else {
                throw new Error("Data not Found through given view [ " + templateData.view + " ]");
            }
        });
    }
}

function getSendMailPreview(templateData, data, options, db) {
    var Constants = require("ApplaneDB/lib/Constants.js");
    var template = templateData[Constants.Admin.Templates.TEMPLATE];
    var templateType = templateData[Constants.Admin.Templates.TEMPLATE_TYPE];
    var html = undefined;
    return getHtml(template, data[0], options, templateType, db).then(function (html1){
         html = html1;
        if (templateData[Constants.Admin.Templates.SUBJECT]) {
            return  getHtml(templateData[Constants.Admin.Templates.SUBJECT], data[0], options, undefined, db);
        }
    }).then(function (subject){
        html = "<div>" +
            "   <h3>Subject: </h3> " +
            "   <br>" +
            subject +
            "</div>" +
            "<div>" +
            "   <h3>Body: </h3>" +
            html +
            "</div>";
        var result = {};
        result.useAsPreview = true;
        result.data = html;
        return result;
    });
}

//this method will give html, based on the  templateType is ejs or xslt
function getHtml(template, data, options, templateType, db) {
    var domain = options ? options.domain : undefined;
    var code = options ? options.dbcode : undefined;
    var token = options ? options.token : undefined;
    var resolvedData =  {data: data, domain: domain, code: code, token: token};
    if (!templateType || templateType === "ejs") {
        var html =  require("ejs").render(template, resolvedData);
        var d = require('q').defer();
        d.resolve(html);
        return d.promise;
    } else if (templateType && templateType === "xslt") {
        if (template.indexOf("xsl:stylesheet") >= 0) {
            return db.resolveXslt(template, resolvedData).then(function (html){
                if(html && html.result){
                   return  html["result"];
               }
            })
        }else{
            var d = require('q').defer();
            d.resolve(template);
            return d.promise;
        }
    }
}


function getAttachment(templateData, row, asyncDB) {
    var Constants = require("ApplaneDB/lib/Constants.js");
    var templateDataAttachment = templateData[Constants.Admin.Templates.ATTACHMENTS];
    var attachments = templateDataAttachment ? row[templateDataAttachment] : undefined;
    if (!templateDataAttachment || !attachments) {
        var d = require('q').defer();
        d.resolve();
        return d.promise;
    }
    var Utils = require("ApplaneCore/apputil/util.js");

    var result = [];
    //if attachments is not an Array, then I am converting this to array, so that I can process this in one way.
    if (!Array.isArray(attachments)) {
        attachments = [attachments];
    }
    return  Utils.iterateArrayWithPromise(attachments, function (index, attachment) {
        return asyncDB.downloadFile(attachment.key).then(function (fileInfo) {
            result.push({
                filename: fileInfo.metadata.filename,
                contentType: fileInfo.metadata.contentType,
                content: new Buffer(fileInfo.data, "utf-8")
            });
        })
    }).then(function () {
        return result;
    })


}


exports.handleProcess = function (parameters, db, options) {
    // here i am calling resolveAttachment function, from which i get attachments content/files.
    var Constants = require("ApplaneDB/lib/Constants.js");
    var templateData = options.templateData;
    var template = options.template;
    var templateType = options.templateType;
    var row = parameters.data;
    var index = parameters.index;
    var process = parameters.process;
    var attachments = undefined;
    var subject = undefined;
    var mailOptions = undefined;
    var to = undefined;
    var from = undefined;
    return getAttachment(templateData, row, db).then(function (attachments1) {
        attachments = attachments1;
        //in case of subject , templateTYpe should be undefined(or ejs, by default), because this should be render using ejs in all cases --Rajit garg
        if (templateData[Constants.Admin.Templates.SUBJECT]) {
            return getHtml(templateData[Constants.Admin.Templates.SUBJECT], row, options, undefined, db);
        }

    }).then(function (subject1){
        subject = subject1;
        if (templateData[Constants.Admin.Templates.TO]) {
            to = templateData[Constants.Admin.Templates.TO];
            from = templateData[Constants.Admin.Templates.FROM];
            to = row[to];
            from = row[from];
           return getHtml(template, row, options, templateType, db);
        }
    }).then(function (html){
        mailOptions = {};
        mailOptions.subject = subject;
        mailOptions.to = to;
        mailOptions.html = html;
        mailOptions.from = from;
        mailOptions.files = attachments;
        process.message = to;
        return require("ApplaneDB/lib/MailService.js").sendAsSendGrid(mailOptions, db);
    })
}