/**
 * send mail through amazon testcase is available at  ApplaneDB/test/MailSendingService.js  TestCase Name = "sending mail through Amazon"
 *
 * AMAZON docs is available at http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html#sendRawEmail-property
 */
var Q = require("q");

exports.sendFromAdmin = function (options) {
    var Config = require("../Config.js").config;
    if (!Config.MailCredentials.ERROR_USERNAME || !Config.MailCredentials.ERROR_PASSWORD) {
        var D = Q.defer();
        D.reject(new Error("Mail Credentials not set."))
        return D.promise;
    }
    return sendMailFromSendGrid({user: Config.MailCredentials.ERROR_USERNAME, pass: Config.MailCredentials.ERROR_PASSWORD}, options);
}

exports.sendAsSendGrid = function (options, db) {
    return getMailCredentials(db, options).then(
        function (credentials) {
            return sendMailFromSendGrid({user: credentials.auth.user, pass: credentials.auth.pass}, options);
        })
}

exports.sendMail = function (options, db) {
    return getMailCredentials(db, options).then(
        function (credentials) {
            if (credentials.type === "amazon") {
                return sendAmazonMail({accessKey: credentials.accessKey, secretKey: credentials.secretKey, region: credentials.region}, options);
            }
            else if (credentials.type === "sendgrid") {
                return sendMailFromSendGrid({user: credentials.auth.user, pass: credentials.auth.pass}, options);
            } else if (credentials.type === "nodemailer") {
                return sendMailFromNodeMailer(credentials, options);
            }
        })
}

exports.sendAsNodeMailer = function (options, db) {
    return getMailCredentials(db, options).then(
        function (credentials) {
//            var smtpTransport = require("nodemailer").createTransport("SMTP", credentials);
            // due to issue in mail sending
            return sendMailFromNodeMailer(credentials, options);
        })
}

function sendMailFromSendGrid(credentials, options) {
    var D = Q.defer();
    var sendgrid = require('sendgrid')(credentials.user, credentials.pass);
    if (options && options.async) {
        D.resolve();//we will resovle immediately
    }
    sendgrid.send(options, function (err) {
        if (options && options.mailLogs) {
            updateMailStatus(options, err);
        }
        if (!options || !options.async) {
            if (err) {
                D.reject(err);
            } else {
                D.resolve();
            }
        }
    });
    return D.promise;
}

function sendMailFromNodeMailer(credentials, options) {
    var D = Q.defer();
    var smtpTransport = require("nodemailer").createTransport(credentials);
    if (options && options.async) {
        D.resolve();//we will resovle immediately
    }
    smtpTransport.sendMail(options, function (err) {
        if (options && options.mailLogs) {
            updateMailStatus(options, err);
        }
        if (!options || !options.async) {
            if (err) {
                D.reject(err);
            } else {
                D.resolve();
            }
        }
    });
    return D.promise;
}

function updateMailStatus(options, error) {
    var mailLogs = options.mailLogs;
    if ((!mailLogs.success && !error) || (!mailLogs.error && error)) {
        return;
    }
    var errorMsg = error ? (error.stack || error.message || error.toString()) : undefined;
    return require("./DB.js").getLogDB().then(
        function (logDb) {
            return logDb.mongoUpdate({$collection: "pl.mailstatus", $insert: {date: new Date(), error: errorMsg, status: error ? "Failed" : "Success", subject: options.subject, to: options.to, type: options.mailLogType}});
        })
}

function getMailCredentials(db, options) {
    var Constants = require("./Constants.js");
    var Config = require("../Config.js").config;
    var d = Q.defer();
    if (options[Constants.MailService.Credential.AMAZON_SECRET_KEY]) {
        var secretKey = options[Constants.MailService.Credential.AMAZON_SECRET_KEY];
        var accessKey = options[Constants.MailService.Credential.AMAZON_ACCESS_KEY];
        var region = options[Constants.MailService.Credential.AMAZON_REGION];
        if (!accessKey || !region) {
            d.reject(new Error("Provide access key and region for using amazon send mail service"));
            return d.promise;
        }
        d.resolve({secretKey: secretKey, accessKey: accessKey, region: region, type: "amazon"});
        return d.promise;
    } else if (options[Constants.MailService.Credential.SENDGRID_USERNAME]) {
        var username = options[Constants.MailService.Credential.SENDGRID_USERNAME];
        var password = options[Constants.MailService.Credential.SENDGRID_PASSWORD];
        if (!password) {
            d.reject(new Error("Provide password for using sendgrid send mail service"));
            return d.promise;
        }
        d.resolve({auth: {user: username, pass: password}, type: "sendgrid", service: "Gmail"});
        return d.promise;

    } else if (options[Constants.MailService.Credential.USER_NAME]) {
        username = options[Constants.MailService.Credential.USER_NAME];
        password = options[Constants.MailService.Credential.PASSWORD];
        if (!password) {
            d.reject(new Error("Provide password for using nodemailer send mail service"));
            return d.promise;
        }
        d.resolve({auth: {user: username, pass: password}, type: "nodemailer", service: "Gmail"});
        return d.promise;
    }
    var query = {$collection: Constants.MailService.MAILCREDENTIALS, $limit: 1};
    db.query(query).then(
        function (data) {
            if (data && data.result && data.result.length > 0) {
                if (!options[Constants.MailService.Credential.FROM]) {
                    options[Constants.MailService.Credential.FROM] = data.result[0][Constants.MailService.Credential.FROM] || Config.MailCredentials.FROM;
                }
                if (!options[Constants.MailService.Credential.FROMNAME]) {
                    options[Constants.MailService.Credential.FROMNAME] = data.result[0][Constants.MailService.Credential.FROMNAME] || Config.MailCredentials.FROMNAME;
                }
                if (data.result[0][Constants.MailService.Credential.AMAZON_SECRET_KEY]) {
                    var secretKey = data.result[0][Constants.MailService.Credential.AMAZON_SECRET_KEY];
                    var accessKey = data.result[0][Constants.MailService.Credential.AMAZON_ACCESS_KEY];
                    var region = data.result[0][Constants.MailService.Credential.AMAZON_REGION];
                    if (!accessKey || !region) {
                        d.reject(new Error("Provide access key and region for using amazon send mail service"));
                        return d.promise;
                    }
                    d.resolve({secretKey: secretKey, accessKey: accessKey, region: region, type: "amazon"});
                    return d.promise;
                } else if (data.result[0][Constants.MailService.Credential.USER_NAME]) {
                    var username = data.result[0][Constants.MailService.Credential.USER_NAME];
                    var password = data.result[0][Constants.MailService.Credential.PASSWORD];
                    var type = data.result[0][Constants.MailService.Credential.TYPE];
                    if (!password) {
                        d.reject(new Error("Provide password for using  [" + type + "] send mail service"));
                        return d.promise;
                    }
                    if (!type) {
                        d.reject(new Error("Provide type for mail service in mail credentials db"));
                        return d.promise;
                    }
                    d.resolve({auth: {user: username, pass: password}, type: type, service: "Gmail"});
                    return d.promise;
                }
            }
            if (!options[Constants.MailService.Credential.FROM]) {
                options[Constants.MailService.Credential.FROM] = Config.MailCredentials.FROM;
            }
            if (!options[Constants.MailService.Credential.FROMNAME]) {
                options[Constants.MailService.Credential.FROMNAME] = Config.MailCredentials.FROMNAME;
            }
            var type = options[Constants.MailService.Credential.TYPE];
            if (type === undefined) {
                type = "sendgrid";
            }
            if ((type === "amazon")) {
                var secretKey = Config.MailCredentials.AMAZON_SECRET_KEY;
                var accessKey = Config.MailCredentials.AMAZON_ACCESS_KEY;
                var region = Config.MailCredentials.AMAZON_REGION;
                if (!secretKey && !accessKey && !region) {
                    d.reject(new Error("Provide secret key , access key and region for using amazon send mail service"));
                    return d.promise;
                }
                d.resolve({secretKey: secretKey, accessKey: accessKey, region: region, type: "amazon"});
                return d.promise;
            } else if (type === "sendgrid") {
                var username = Config.MailCredentials.SENDGRID_USERNAME;
                var password = Config.MailCredentials.SENDGRID_PASSWORD;

                if (!username && !password) {
                    d.reject(new Error("Provide username and password for using  sendgrid send mail service"));
                    return d.promise;
                }

                d.resolve({auth: {user: username, pass: password}, type: "sendgrid", service: "Gmail"});
                return d.promise;
            } else if (type === "nodemailer") {
                var username = Config.MailCredentials.USERNAME;
                var password = Config.MailCredentials.PASSWORD;
                if (!username && !password) {
                    d.reject(new Error("Provide username and password for using nodemailer send mail service"));
                    return d.promise;
                }
                d.resolve({auth: {user: username, pass: password}, type: "nodemailer", service: "Gmail"});
                return d.promise;
            } else {
                d.reject(new Error("Provide Necessary Credentials to Send Mail"));
                return d.promise;
            }
        })
    return d.promise;
}

exports.sendAsAmazon = function (options, db) {
    return getMailCredentials(db, options).then(function (credentials) {
        return   sendAmazonMail(credentials, options);
    })
}

function sendAmazonMail(credentials, options) {
    var Constants = require("./Constants.js");
    var AWS = require('aws-sdk');
    AWS.config.update({region: credentials.region});
    AWS.config.update({accessKeyId: credentials.accessKey, secretAccessKey: credentials.secretKey});
    var ses = new AWS.SES();
    return validateEmail(ses, options[Constants.MailService.Options.FROM]).then(function () {
        if (options && options[Constants.MailService.Options.FILES] && options[Constants.MailService.Options.FILES].length > 0) {
            return sendMailAsAmazon(ses, options);
        } else {
            return sendMailAsAmazonWithoutAttachment(ses, options);
        }
    })
}

function validateEmail(ses, from) {
    var ProcessCache = require("./cache/ProcessCache.js");
    var cacheValue = ProcessCache.getCache("AMAZON", "amazonVerifiedEmails");
    if (cacheValue) {
        if (cacheValue.indexOf(from) < 0) {
            throw new Error("From Address is not Verified");
        } else {
            var d = Q.defer();
            d.resolve();
            return d.promise;
        }
    } else {
        return getAllVerifiedEmails(ses).then(function (verifiedEmails) {
            ProcessCache.setCache("AMAZON", verifiedEmails, "amazonVerifiedEmails");
            if (verifiedEmails.indexOf(from) < 0) {
                throw new Error("From Address is not Verified");
            }
        });
    }
}

function sendMailAsAmazon(ses, options) {
    var Constants = require("./Constants.js");
    if (options[Constants.MailService.Options.BCC]) {
        throw new Error("BCC is not supported in Amazon with Attachment File.")
    }

    var MailComposer = require("mailcomposer").MailComposer;
    var mailcomposer = new MailComposer();
    if (options[Constants.MailService.Options.FROMNAME]) {
        options[Constants.MailService.Options.FROM] = options[Constants.MailService.Options.FROMNAME] + " " + options[Constants.MailService.Options.FROM]
    }
    mailcomposer.setMessageOption({
        from: options[Constants.MailService.Options.FROM],
        to: options[Constants.MailService.Options.TO],
        cc: options[Constants.MailService.Options.CC],
//        bcc: options[Constants.MailService.Options.BCC],     //bcc not working
        subject: options[Constants.MailService.Options.SUBJECT],
        html: options[Constants.MailService.Options.HTML],        //if html is available then body is not consider
        body: options[Constants.MailService.Options.BODY]
    });
    if (options && options[Constants.MailService.Options.FILES] && options[Constants.MailService.Options.FILES].length > 0) {
        for (var i = 0; i < options[Constants.MailService.Options.FILES].length; i++) {
            var file = options[Constants.MailService.Options.FILES][i]
            if (file[Constants.MailService.Options.Files.FILE_NAME] && file[Constants.MailService.Options.Files.CONTENT] && file[Constants.MailService.Options.Files.CONTENT_TYPE]) {
                mailcomposer.addAttachment({
                    fileName: file[Constants.MailService.Options.Files.FILE_NAME],
                    contents: file[Constants.MailService.Options.Files.CONTENT],
                    contentType: file[Constants.MailService.Options.Files.CONTENT_TYPE]
                });
            }
        }
    }
    var d = Q.defer();
    mailcomposer.buildMessage(function (err, messageSource) {
        var params = {
            RawMessage: {
                Data: messageSource
            }/*,
             Destinations: options[Constants.MailService.Options.BCC]*/           //if we use  Destinations, to and cc assign above not work,  Destinations send mail in bcc
        }
        ses.sendRawEmail(params, function (err, data) {
            if (err) {
                d.reject(err);
            }
            else {
                d.resolve();
            }
        });
    });
    return d.promise;

}


exports.sendErrorMail = function (errorParams, errorClass) {

    return errorClass[errorParams.type](errorParams.name, errorParams.isBusinessLogicError).then(function (errorMaster) {
        return errorMaster[errorParams.errType](errorParams.code,errorParams.subject,errorParams.msg)
    }).fail(function (err) {
            err.code = errorParams.code;
            throw err;
        })
}

exports.sendBusinessErrorMail = function (errorParams, errorClass) {
    return errorClass[errorParams.type](errorParams.code, errorParams.msg);
}

function sendMailAsAmazonWithoutAttachment(ses, options) {
    var Constants = require("./Constants.js");
    var destination = {};
    if (options[Constants.MailService.Options.BCC]) {
        if (typeof options[Constants.MailService.Options.BCC] === "string") {
            var array = [];
            getArrayOfString(options[Constants.MailService.Options.BCC], array);
            options[Constants.MailService.Options.BCC] = array;
        }
        destination["BccAddresses"] = options[Constants.MailService.Options.BCC];
    }
    if (options[Constants.MailService.Options.CC]) {
        if (typeof options[Constants.MailService.Options.CC] === "string") {
            var array = [];
            getArrayOfString(options[Constants.MailService.Options.CC], array);
            options[Constants.MailService.Options.CC] = array;
        }
        destination["CcAddresses"] = options[Constants.MailService.Options.CC];
    }
    if (options[Constants.MailService.Options.TO]) {
        if (typeof options[Constants.MailService.Options.TO] === "string") {
            var array = [];
            getArrayOfString(options[Constants.MailService.Options.TO], array);
            options[Constants.MailService.Options.TO] = array;
        }
        destination["ToAddresses"] = options[Constants.MailService.Options.TO];
    }
    var body = {};
    if (options[Constants.MailService.Options.HTML]) {
        body.Html = {};
        body.Html.Data = options[Constants.MailService.Options.HTML];
    } else if (options[Constants.MailService.Options.BODY]) {
        body.Text = {};
        body.Text.Data = options[Constants.MailService.Options.BODY];
    }

    var params = {
        Destination: destination,
        Message: {
            Body: body,
            Subject: {
                Data: options[Constants.MailService.Options.SUBJECT] || ""

            }
        },
        Source: options[Constants.MailService.Options.FROM]
    };
    var d = Q.defer();
    ses.sendEmail(params, function (err, data) {
        if (err) {
            d.reject(err);
        }
        else {
            d.resolve();
        }
    });
    return d.promise;
}

function getArrayOfString(stringValue, array) {
    var indexof = stringValue.indexOf(",");
    if (indexof < 0) {
        array.push(stringValue)
    } else {
        array.push(stringValue.substring(0, indexof));
        getArrayOfString(stringValue.substring(indexof + 1), array);
    }

}

function getAllVerifiedEmails(ses) {
    var d = Q.defer();
    var verifiedEmails = [];
    ses.listIdentities({IdentityType: 'EmailAddress'}, function (err, data) {
        if (err) {
            d.reject(err);
        } else {
            if (data && data.Identities && data.Identities.length > 0) {
                ses.getIdentityVerificationAttributes({Identities: data.Identities}, function (err, result) {
                    if (err) {
                        d.reject(err);
                    } else {

                        if (result && result.VerificationAttributes) {
                            for (var i = 0; i < data.Identities.length; i++) {
                                if (result.VerificationAttributes[data.Identities[i]].VerificationStatus === "Success") {
                                    verifiedEmails.push(data.Identities[i]);
                                }
                            }
                            d.resolve(verifiedEmails);
                        } else {
                            d.resolve(verifiedEmails)
                        }
                    }
                });
            } else {
                d.resolve(verifiedEmails);
            }
        }
    });
    return d.promise;
}

//127.0.0.1:5100/rest/invoke?function=MailService.verifyEmailIdentity&parameters=[{"emailid":"rajit.garg@daffodilsw.com"}]&token=545cb99ac047c8fa14dcd72e
exports.verifyEmailIdentity = function (options) {
    var Constants = require("./Constants.js");
    var d = Q.defer();
    if (!options[Constants.Admin.Users.EMAIL_ID]) {
        d.reject(new Error("Provide Emailid Address to Verify."));
        return d.promise;
    }
    var Config = require("../Config.js").config;
    var AWS = require('aws-sdk');
    var secretKey = Config.MailCredentials.AMAZON_SECRET_KEY || options[Constants.MailService.Credential.AMAZON_SECRET_KEY]
    var accessKey = Config.MailCredentials.AMAZON_ACCESS_KEY || options[Constants.MailService.Credential.AMAZON_ACCESS_KEY]
    var region = Config.MailCredentials.AMAZON_REGION || options[Constants.MailService.Credential.AMAZON_REGION];
    if (!secretKey && !accessKey && !region) {
        d.reject(new Error("Provide secret key , access key and region to verify Email Address."));
        return d.promise;
    }
    AWS.config.update({region: region});
    AWS.config.update({accessKeyId: accessKey, secretAccessKey: secretKey});
    var ses = new AWS.SES();
    var params = {
        EmailAddress: options[Constants.Admin.Users.EMAIL_ID]
    };
    ses.verifyEmailIdentity(params, function (err, data) {
        if (err) {
            d.reject(err)
        }
        else {
            d.resolve(data)
        }
    });
    return d.promise;
}