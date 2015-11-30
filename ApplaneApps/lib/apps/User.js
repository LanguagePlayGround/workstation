var DB = require("ApplaneDB/lib/DB.js");
var Constants = require("ApplaneDB/lib/Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var ApplaneDBError = require("ApplaneDB/lib/ApplaneDBError.js");
var Self = require("./User.js");
var Q = require("q");
var BusinessLogicError = require("ApplaneError/lib/BusinessLogicError.js");


exports.forgotPassword = function (email, database, domain, options) {
    var db = undefined;
    var username = options ? options.username : undefined;
    var mailTemplate = options && options.mailTemplate ? options.mailTemplate : undefined;
    var userId = undefined;
    var userAccessToken = undefined;
    return DB.getAdminDB().then(
        function (admindb) {
            if (!admindb) {
                throw new BusinessLogicError("unable to connect");
            }
            return admindb.connectUnauthorized(database);
        }).then(
        function (db1) {
            db = db1;
            var filter = {};
            if (username) {
                filter.username = options.username;
            } else if (email) {
                filter.emailid = email;
            }
            return db.query({$collection: Constants.Admin.USERS, $fields: {_id: 1, status: 1}, $filter: filter, $modules: {"Role": 0}});
        }).then(
        function (data) {
            if (data && data.result && data.result.length == 1) {
                if (data.result[0].status && data.result[0].status === Constants.Admin.Users.Status.DEACTIVE) {
                    throw new ApplaneDBError(Constants.ErrorCode.ACCOUNT_DEACTIVATED.MESSAGE, Constants.ErrorCode.ACCOUNT_DEACTIVATED.CODE);
                }
                userId = data.result[0]._id

                var optionsInConnection = {function: "User.changePassword"};
                if (options && options.sendOTP) {
                    optionsInConnection.usertoken = getOTP();
                }

                return db.createUserConnection(userId, optionsInConnection);
            } else {
                var message = "";
                if (username && Utils.isNumber(username)) {
                    message = "Mobile Number is not Registered";
                } else if (Utils.isEmailId(username)) {
                    message = "Email is not Registered";
                } else {
                    message = "Please provide either mobile no or emailid."
                }
                throw new BusinessLogicError(message);
            }
        }).then(function (userAccessToken1) {
            userAccessToken = userAccessToken1;
            if (username) {
                if (Utils.isNumber(username)) {
                    var params = {};
                    params.mobile_no = username;
                    params.otp = userAccessToken;
                    return sendSms(params, db);
                } else if (Utils.isEmailId(username)) {
                    return sendChangePasswordEmail(domain, userId, userAccessToken, username, mailTemplate, db);
                }
            } else {
                return sendChangePasswordEmail(domain, userId, userAccessToken, email, mailTemplate, db);
            }
        }).then(function () {
            if (options && options.sendOTP) {
                var params = {};
                params._id = userId;
                params.otp = userAccessToken;
                return updateVerificationCode(params, db)
            }


        });
}

exports.changePassword = function (parameters, db, options) {
    if (parameters && parameters.password) {
        if (db && db.user && db.user._id) {
            var update = [
                {$collection: Constants.Admin.USERS, $update: [
                    {"_id": db.user._id, $set: {password: parameters.password}}
                ], $modules: {"Role": 0}}
            ];
            return db.update(update).then(function () {
                return Constants.ErrorCode.PASSWORD_RESET;
            })
        } else {
            throw new BusinessLogicError("User not found.");
        }
    } else {
        throw new BusinessLogicError("Password not found.");
    }
}

exports.onPreSave = function (document, db, options) {
    return validateUserName(document, db).then(function () {
        var userName = document.get("username");
        if (document.type === "update") {
            var updatedFields = document.getUpdatedFields();
            if (updatedFields && updatedFields.indexOf("username") !== -1 && !Utils.deepEqual(userName, document.getOld("username"))) {
                throw new BusinessLogicError("Update is not allowed in username.");
            }
        }
        var pass = document.get("password");
        // save encripted password fornew users
        if (pass) {
            var enc_password = Utils.getEncriptedPassword(pass);
//        document.unset("password");                     //TODO use when new branch is created : > v-1.1.26
            document.set("enc_password", enc_password);
        }
        if (document.type === "insert" && !document.get("fullname")) {
            document.set("fullname", userName);
        }
        validateRoles(document);
        return removeUserCache(document, db);
    })
};

function validateUserName(document, db) {
    if (document.get("username") !== undefined) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    } else {
        return db.getAdminDB().then(
            function (adminDB) {
                return adminDB.query({$collection: "pl.dbs", $filter: {db: db.db.databaseName}, $events: false, $modules: false});
            }).then(function (dbInfo) {
                dbInfo = dbInfo.result[0];
                if (dbInfo) {
                    if (dbInfo[Constants.Admin.Dbs.MOBILE_LOGIN_ENABLED] && document.get("mobile_no") && Utils.isNumber(document.get("mobile_no"))) {
                        document.set("username", document.get("mobile_no"));
                    } else if (dbInfo[Constants.Admin.Dbs.EMAIL_LOGIN_ENABLED] && document.get("emailid") && Utils.isEmailId(document.get("emailid"))) {
                        document.set("username", document.get("emailid"));
                    }
                }
                if (document.get("username") === undefined) {
                    throw new BusinessLogicError("Please provide value of mandatory parameters [username]");
                }
            })
    }
}

function validateRoles(document) {
    var userRoleDocuments = document.getDocuments("roles", ["insert", "update", "nochange"]);
    var userName = document.get("username");
    if (userRoleDocuments && userRoleDocuments.length > 0) {
        var roleIds = [];
        var appIds = [];
        var firstRoleAppId = userRoleDocuments[0].get("appid");
        var firstRole = userRoleDocuments[0].get("role");
        var firstRoleGroup = firstRole && firstRole.group ? true : false;
        for (var i = 0; i < userRoleDocuments.length; i++) {
            var userRoleDocument = userRoleDocuments[i];
            var roleId = userRoleDocument.get("role");
            if (roleId) {
                if (Utils.isExists(roleIds, roleId._id) !== undefined) {
                    throw new BusinessLogicError("Duplicate roles [" + roleId.id + "] can not be define to user [" + userName + "]");
                }
                roleIds.push(roleId._id);
            }
            var appId = userRoleDocument.get("appid");
            if ((firstRoleAppId && !appId) || (!firstRoleAppId && appId)) {
                throw new BusinessLogicError("Please define appid in all role if defined in any role in user [" + userName + "]");
            }
            if (appId) {
                if (appIds.indexOf(appId) !== -1) {
                    throw new BusinessLogicError("Same Application[" + appId + "] can not be defined multiple times in roles in user collection");
                }
                appIds.push(appId);
            }
            var nextRoleGroup = roleId && roleId.group ? true : false;
            if (firstRoleGroup !== nextRoleGroup) {
                throw new BusinessLogicError("User roles can be either of group type or non group type for user [" + userName + "]");
            }
            if (firstRoleGroup && roleIds.length > 1) {
                throw new BusinessLogicError("Only one role can be defined in user role of group type.");
            }
        }
    }
}

function removeUserCache(document, db) {
    if (document.type === "update") {
        return db.invokeFunction("Porting.removeUserCache", [
            {db: db.db.databaseName, username: document.get("username")}
        ]);
    }
}

//To revoke google permission when any change made to mailtrackenabled or calenderenabled, and set new permission with new parameters using scope -- Rajit garg 17/Dec/2014
exports.onPostSave = function (document, db, options) {
    var isCalenderUpdated = false;
    var isMailTrackUpdated = false;
    if (isUpdatedValue(document, "calenderenabled")) {
        isCalenderUpdated = true;
    }
    if (isUpdatedValue(document, "mailtrackenabled")) {
        isMailTrackUpdated = true;
    }
    if (isCalenderUpdated || isMailTrackUpdated) {
        var change = "";
        var scope = "";

        var calenderValue = document.get("calenderenabled");
        var mailTrackValue = document.get("mailtrackenabled");

        if (isCalenderUpdated && isMailTrackUpdated) {
            if (calenderValue && mailTrackValue) {
                change = "To enable calender entry and email tracking ";
            } else if (calenderValue && !mailTrackValue) {
                change = "To enable calender entry and disable email tracking ";
            } else if (mailTrackValue && !calenderValue) {
                change = "To enable email tracking and disable calender entry ";
            } else {
                change = "To disable calender entry and email tracking ";
            }
        } else if (isCalenderUpdated) {
            if (calenderValue) {
                change = "To enable calender entry ";
            } else {
                change = "To disable calender entry ";
            }
        } else {
            if (mailTrackValue) {
                change = "To enable email tracking ";
            } else {
                change = "To disable email tracking ";
            }
        }


        if (calenderValue) {
            scope += "calendar ";
        }
        if (mailTrackValue) {
            scope += " gmail.readonly ";
        }

        var __org__ = db.db.databaseName;
        var msg = {"doNotShowButton": true, "html": "<div >" + change + ", you need to login with google, <span ng-click=\"logOut({'doNotLogoutFromGoogle':true,'redirect_to_url':'/rest/oauth/google?scope=" + scope + "&__org__=" + __org__ + "'})\"><br><br><a>Click here to Login with Google</a></span></div>", "title": "Re-Login From Google Required"};
        return db.invokeFunction("GoogleApiServices.revokeOAuthToken", undefined, options).fail(
            function (err) {
                //no need to throw error in case of revoking access
            }).then(
            function () {
                return db.update({$collection: "pl.users", $events: false, $update: {_id: document.get("_id"), $unset: {"googleRefreshToken": 1}}})
            }).then(function () {
                db.updateResult = db.updateResult || {};
                db.updateResult.postSaveMessage = msg;
            })
    }

};

function isUpdatedValue(document, field) {
    var value = document.get(field) || false;
    var oldValue = document.getOld(field) || false;

    return value != oldValue;
}

exports.resetPassword = function (parameters, db, options) {
    var oldPassword = parameters.oldPassword;
    var newPassword = parameters.newPassword;
    var confirmPassword = parameters.confirmPassword;
    var adminDB = undefined;
    if (newPassword === undefined || confirmPassword === undefined || oldPassword === undefined) {
        throw new BusinessLogicError("Please Fill Old Password ,New Password,and Confirm Password");
    }
    if (newPassword.trim().length <= 0 && confirmPassword.trim().length <= 0) {
        throw new BusinessLogicError("Please Fill Password and Confirm Password");
    }
    if (newPassword === oldPassword) {
        throw new BusinessLogicError("New Password must be different from Old one");
    }
    if (newPassword && newPassword.trim().length < 8) {
        throw new BusinessLogicError("New Password must be greater than or equal to 8 characters");
    }
    if (newPassword !== confirmPassword) {
        throw new BusinessLogicError("New Password and Confirm Password does not match");
    }
    return checkOldPassword(oldPassword, db).then(
        function (data) {
            if (data) {
                return updatePassord(newPassword, db);
            } else {
                throw new BusinessLogicError("Old Password is not Correct");
            }
        })
}


function checkOldPassword(oldPassword, db) {
    return db.query({$collection: "pl.users", $filter: {enc_password: Utils.getEncriptedPassword(oldPassword), _id: db.user._id}, $modules: {"Role": 0}}).then(function (data) {
        if (data && data.result && data.result.length === 1) {
            return data.result[0];
        }
    })
}

function updatePassord(newPassword, db) {
    return db.update({$collection: "pl.users", $update: { _id: db.user._id, $set: {password: newPassword}}, $modules: {"Role": 0}});
}

// user signup invoke function ,it works only for signupEnabled databases.Manjeet(14-may-2015)
exports.signup = function (parameters, db, options) {
    var userCollection = parameters.collection || "pl.users";
    var fullname = parameters[Constants.Admin.Users.FULL_NAME];
    var username = parameters[Constants.Admin.Users.USER_NAME];
    var emailid = parameters[Constants.Admin.Users.EMAIL_ID];
    var mobile_no = parameters[Constants.Admin.Users.MOBILE_NO];
    var password = parameters[Constants.Admin.Users.PASSWORD];
    var applicationid = parameters[Constants.Admin.Users.APPLICATIONID];
    var deviceid = parameters[Constants.Admin.Users.DEVICE_ID];
    var roleid = parameters[Constants.Admin.Users.ROLE_ID];
    var dbInfo = undefined;
    var updates = {};
    var finalResult = {};
    var userInfo = {};
    var otp = getOTP();
    return db.getAdminDB().then(
        function (adminDB) {
            return adminDB.query({$collection: Constants.Admin.DBS, $filter: {db: db.db.databaseName}});
        }).then(
        function (dbInfo1) {
            if (dbInfo1 && dbInfo1.result && dbInfo1.result.length > 0) {
                dbInfo = dbInfo1.result[0];
                parameters[Constants.Admin.Dbs.CODE] = dbInfo[Constants.Admin.Dbs.CODE];
            }
            if (dbInfo && !dbInfo[Constants.Admin.Dbs.SIGNUP_ENABLED]) {
                throw new BusinessLogicError("Signup not allowed");
            }
            if (dbInfo && dbInfo[Constants.Admin.Dbs.MOBILE_LOGIN_ENABLED]) {
                username = username;
                if ((!username) && mobile_no) {
                    username = mobile_no;
                }
                if ((!mobile_no) && Utils.isNumber(username)) {
                    mobile_no = username;
                }
            }
            if (dbInfo && dbInfo[Constants.Admin.Dbs.EMAIL_LOGIN_ENABLED]) {
                if (!username && emailid) {
                    username = emailid;
                }
                if ((!emailid) && Utils.isEmailId(username)) {
                    emailid = username;
                }
            }
            if (!username) {
                throw new BusinessLogicError("Username is mandatory");
            }
            return db.query({$collection: userCollection, $filter: {username: username}});
        }).then(
        function (result) {
            if (result && result.result && result.result.length > 0) {
                throw new BusinessLogicError("User already exits with username :[" + username + "]");
            }
            if (applicationid) {
                return db.query({$collection: Constants.Admin.APPLICATIONS, $filter: {id: applicationid}});
            }
        }).then(
        function (applicationInfo) {
            if (applicationInfo && applicationInfo.result && applicationInfo.result.length > 0) {
                applicationInfo = applicationInfo.result[0];
            }
            var roles = [];
            if (roleid) {
                roles.push({role: roleid});
            } else if (applicationInfo && applicationInfo.defaultRoleId) {
                roles.push({role: applicationInfo.defaultRoleId});
            }
            updates[Constants.Admin.Users.USER_NAME] = username;
            updates[Constants.Admin.Users.FULL_NAME] = fullname;
            if (password) {
                updates[Constants.Admin.Users.PASSWORD] = password;
            }
            if (mobile_no) {
                updates[Constants.Admin.Users.MOBILE_NO] = mobile_no;
            }
            if (deviceid) {
                updates[Constants.Admin.Users.DEVICE_ID] = deviceid;
            }
            if (emailid) {
                updates[Constants.Admin.Users.EMAIL_ID] = emailid;
            }
            updates[Constants.Admin.Users.VERIFICATION_STATUS] = "pending";
            finalResult[Constants.Admin.Users.VERIFICATION_STATUS] = "pending";
            if (roles.length > 0) {
                updates.roles = roles;
            }
            if (applicationInfo && applicationInfo.setupViews) {
                updates[Constants.Admin.Users.SETUPVIEWS] = applicationInfo.setupViews;
                updates[Constants.Admin.Users.SETUPSTATUS] = "pending";
                finalResult.setup = "pending";
            }
            updates.verificationCode = otp;
            return db.update({$collection: userCollection, $insert: updates });
        }).then(function (result) {

            return db.addToQueue({function: "User.resendOTP",otp:otp, parameters: parameters, queueName: "User Signup Verfication", options: options});
        }).then(function (result) {
            return finalResult;
        });
}

exports.registerDevice = function (params, db) {
    var device_id = params[Constants.Admin.Users.DEVICE_ID];
    var mobile_no = params[Constants.Admin.Users.MOBILE_NO];
    var userinfo = undefined;
    return db.query({$collection: "pl.users", $filter: {mobile_no: mobile_no}, $fields: {"verificationStatus": 1, "device_id": 1}}).then(
        function (result) {
            if (result && result.result && result.result.length > 0) {
                userinfo = result.result[0];
                if (!userinfo.device_id) {
                    return db.update({$collection: "pl.users", $update: {_id: userinfo._id, $set: {device_id: device_id}}});
                }
            } else {
                throw new BusinessLogicError("User not registered with this mobile_no [" + mobile_no + "]");
            }
        }).then(
        function () {
            if (userinfo && (!userinfo.verificationStatus || userinfo.verificationStatus == "pending")) {
                return sendSms({mobile_no: mobile_no}, db);
            }
        }).then(function (otp) {
            var updates = {};
            updates[Constants.Admin.Users.VERIFICATION_CODE] = otp;
            updates[Constants.Admin.Users.VERIFICATION_STATUS] = "pending";
            return db.update({$collection: "pl.users", $update: {_id: userinfo._id, $set: updates}});
        });
}

function updateVerificationCode(params, db) {

    var _id = params._id;
    var otp = params.otp;

    return db.update({$collection: "pl.users", $update: {_id: _id, $set: {verificationCode: otp}}});

}

function sendSms(params, db) {

    var mobile_no = params[Constants.Admin.Users.MOBILE_NO];
    var otp = params.otp || getOTP();
    var serviceDetail = {"hostname": "sis.applane.com", path: "/escape/restgatewayei/sms/sendsms", "method": "POST"};
    return db.invokeService(serviceDetail, {"code": "smk873ksj@kjlslkj", "ph": mobile_no, "sms": "Your Track verification code is " + otp + ". Do not share with any one."}).then(function () {
        return otp;
    });                                                                                                                                                                                                                                                                                                                     
}


function getOTP() {
    return "AT" + Number(Math.random() * 999999).toFixed();
}


exports.resendOTP = function (params, db, options) {
    var mobile_no = params[Constants.Admin.Users.MOBILE_NO];
    var username = params[Constants.Admin.Users.USER_NAME];
    var emailid = params[Constants.Admin.Users.EMAIL_ID];
    var filter = {};
    if (username) {
        filter[Constants.Admin.Users.USER_NAME] = username;
    } else if (mobile_no) {
        filter[Constants.Admin.Users.MOBILE_NO] = mobile_no;
    } else if (emailid) {
        filter[Constants.Admin.Users.EMAIL_ID] = emailid;
    }
    var userinfo = undefined;
    return db.getAdminDB().then(
        function (adminDB) {
            return adminDB.query({$collection: Constants.Admin.DBS, $filter: {db: db.db.databaseName}});
        }).then(
        function (dbInfo1) {
            if (dbInfo1 && dbInfo1.result && dbInfo1.result.length > 0) {
                dbInfo = dbInfo1.result[0];
                params[Constants.Admin.Dbs.CODE] = dbInfo[Constants.Admin.Dbs.CODE];
            }
            return db.query({$collection: "pl.users", $filter: filter, $fields: {_id: 1, verificationCode: 1}});
        }).then(function (userinfo1) {
            if (userinfo1 && userinfo1.result && userinfo1.result.length > 0) {
                userinfo = userinfo1.result[0];

                var otp = userinfo.verificationCode || params.otp; /*getOTP();*/

                if(!otp){
                    throw new Error("No otp found in resendOTP");
                }
                params.otp = otp;
                if (username) {
                    if (Utils.isNumber(username)) {
                        params.mobile_no = username;
                        return sendSms(params, db);
                    } else if (Utils.isEmailId(username)) {
                        params.emailid = username;
                        return  sendVerificationEmail(params, db, options);
                    }
                } else if (mobile_no) {

                    return sendSms(params, db, options);
                } else if (emailid) {
                    return sendVerificationEmail(params, db, options);
                } else {
                    return sendSms(params, db, options);
                }

            } else {
                throw new BusinessLogicError("User not found corresponding to filter [" + JSON.stringify(filter) + "]");
            }
        }).then(function (otp) {
            return "Resend OTP successfully";
        });
}

exports.verifyOTP = function (params, db) {
    var otp = params.otp;
    var mobile_no = params[Constants.Admin.Users.MOBILE_NO];
    var emailid = params[Constants.Admin.Users.EMAIL_ID];
    var finalResult = undefined;
    var filter = {};
    if (mobile_no) {
        filter.mobile_no = mobile_no;
    } else if (emailid) {
        filter.emailid = emailid;
    }
    return db.query({$collection: "pl.users", $filter: filter}).then(
        function (userinfo) {
            if (userinfo && userinfo.result && userinfo.result.length > 0) {
                userinfo = userinfo.result[0];
                if (userinfo[Constants.Admin.Users.VERIFICATION_CODE] === otp) {
                    finalResult = "verified";
                    return db.update({$collection: "pl.users", $update: {_id: userinfo._id, $set: {"verificationStatus": "completed"}, $unset: {"verificationCode": ""}}});
                } else {
                    throw new BusinessLogicError("OTP not matching");
                }
            } else {
                var message = "User not registered with";
                if (mobile_no) {
                    message += " mobile_no [ " + mobile_no + "]";
                } else if (emailid) {
                    message += " emailid [ " + emailid + "]";
                }
                throw new BusinessLogicError("User not registered with mobile_no [" + mobile_no + "]");
            }
        }).then(function () {
            return finalResult;
        });
}

exports.loginHistory = function (query, result, db) {
    var filter = query.$filter || {};
    if (filter.startTime === undefined) {
        var date = new Date();
        date.setMinutes(date.getMinutes() - (60 * 24 * 30));
        filter.startTime = {$gt: date, $lt: new Date()}
    }
    filter.db = db.db.databaseName;
    filter.serviceType = {$in: ["connect", "disconnect"]};
    return db.connectUnauthorized("pllogs").then(function (pllogs) {
        return pllogs.query({$collection: "pl.servicelogs", $filter: filter, $fields: {username: 1, serviceType: 1, startTime: 1}});
    }).then(function (result1) {
        result.result = result1.result;
    });
};

function sendVerificationEmail(mailParams, db, options) {
    var otp = mailParams.otp || getOTP();
    var html = undefined;
    var email = mailParams[Constants.Admin.Users.EMAIL_ID];
    if (mailParams && mailParams.mailTemplate && mailParams.mailTemplate === "autoload") {
        var params = {};
        params[Constants.Admin.Users.EMAIL_ID] = email;
        html = getAutoloadHTML(mailParams, otp, options);
    } else {
        var domain = options && options.domain ? options.domain : undefined;
        var code = mailParams[Constants.Admin.Dbs.CODE];
        var href = 'http://' + domain + '/rest/invoke?function=User.verifyOTP&parameters=[{%22otp%22:%22' + otp + '%22,%22emailid%22:%22' + email + '%22}]&code=' + code;
        html = '<!DOCTYPE html><html>' +
            '<style type="text/css">a.hover {color: #ff761b;text-decoration: none;}a.hover:hover {text-decoration: underline;}</style>' +
            '<body>' +
            '<div style="margin:0">' +
            '<div alink="#63A42C" bgcolor="#f6f6f6" link="#63A42C"         style="text-align:left;margin:0px;background:#f2f2f2;border:1px solid #ddd" vlink="#63A42C">       ' +
            ' <table border="0" cellpadding="25" cellspacing="0" width="100%">            ' +
            '<tbody>            <tr>                ' +
            '<td>                    <center>                        ' +
            '<table cellpadding="15" cellspacing="0" height="100"  style="border-top:1px solid #ddd;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #eee;background:#ffffff;border-top-left-radius:6px;border-top-right-radius:6px" width="620">   ' +
            '<tbody>' +
            '<tr>                                ' +
            '<td style="min-height:10px;padding:0px"></td></tr><tr><td style="text-align:center;padding:15px">' +
            '<a href="http://www.applane.com" target="_blank"> ' +
            '<img alt="Applane" src=http://' + domain + '/images/applanelogo.png>' +
            '</a></td></tr></tbody></table>' +
            '<table cellpadding="25" cellspacing="0" height="100" style="border:0;background:#fcfcfc;font:14px/22px helvetica;border-bottom:1px solid #ddd;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom-left-radius:6px;border-bottom-right-radius:6px"                               width="620">                            <tbody>                            <tr>                                <td><h3>Hi!</h3>                                    <p> To verify your account, <a href=' + '"' + href + '"' + '                                        style="color:#ff761b;font-weight:bold;text-decoration:none" target="_blank">just                                        click here</a>    <h2>OR</h2> Your verification code is : ' + otp + '</p>                                   </td>                            </tr>                            </tbody>                        </table>                        <table cellpadding="15" cellspacing="0" height="100" width="580">                            <tbody>                            <tr>                                <td style="font:10px/16px helvetica;text-align:center;color:#aaa;padding:0px"><p> This                                    email was sent to <a href="" style="color:#999;text-decoration:none"                                                         target="_blank">' + email + '</a> because a Applane account was                                    created and subscribed to our mailings using this email. </p></td>                            </tr>                            <tr>                                <td style="font:10px/16px helvetica;text-align:center;color:#aaa;padding:10px 0px 0px 0px">                                    ' +
            '<p>&copy;2013 Applane. All Rights Reserved. <a class="hover" style="color:#ff761b !important;" href="http://www.applane.com/terms-of-use/">Terms                                        of Use</a> <span>|</span> <a class="hover"             style="color:#ff761b !important;"                                                        href="http://www.applane.com/privacy-policy/">Privacy                                        Policy </a></p>' +
            '</td>                            </tr>                            </tbody>                        </table>                    ' +
            '</center>                </td>            </tr>            </tbody>        </table>    </div></div></body></html>'

    }
    var mailOptions = {};
    mailOptions.subject = "Email Verification";
    mailOptions.to = email;
    mailOptions.html = html;
    return db.sendMail(mailOptions).then(function () {
        return otp;
    });
}

function getAutoloadHTML(mailParams, otp) {
    var email = mailParams[Constants.Admin.Users.EMAIL_ID];
    var html = '<!DOCTYPE html><html>' +
        '<style type="text/css">a.hover {color: #ff761b;text-decoration: none;}a.hover:hover {text-decoration: underline;}</style>' +
        '<body>' +
        '<div style="margin:0">' +
        '<div alink="#63A42C" bgcolor="#f6f6f6" link="#63A42C"         style="text-align:left;margin:0px;background:#f2f2f2;border:1px solid #ddd" vlink="#63A42C">       ' +
        ' <table border="0" cellpadding="25" cellspacing="0" width="100%">            ' +
        '<tbody>            <tr>                ' +
        '<td>                    <center>                        ' +
        '<table cellpadding="15" cellspacing="0" height="100"  style="border-top:1px solid #ddd;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #eee;background:#ffffff;border-top-left-radius:6px;border-top-right-radius:6px" width="620">   ' +
        '<tbody>' +
        '<tr>                                ' +
        '<td style="min-height:10px;padding:0px"></td></tr><tr><td style="text-align:center;padding:15px">' +
        '<a href="http://www.autoload.com" target="_blank"> ' +
        '<img alt="autoload" src=http://autoload.com/images/logo.png>' +
        '</a></td></tr></tbody></table>' +
        '<table cellpadding="25" cellspacing="0" height="100" style="border:0;background:#fcfcfc;font:14px/22px helvetica;border-bottom:1px solid #ddd;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom-left-radius:6px;border-bottom-right-radius:6px"                               width="620">                            <tbody>                            <tr>                                <td><h3>Hi!</h3>                                 Your verification code is : ' + otp + '</p>                                   </td>                            </tr>                            </tbody>                        </table>                        <table cellpadding="15" cellspacing="0" height="100" width="580">                            <tbody>                            <tr>                                <td style="font:10px/16px helvetica;text-align:center;color:#aaa;padding:0px"><p> This                                    email was sent to <a href="" style="color:#999;text-decoration:none"                                                         target="_blank">' + email + '</a> because a Applane account was                                    created and subscribed to our mailings using this email. </p></td>                            </tr>                            <tr>                                <td style="font:10px/16px helvetica;text-align:center;color:#aaa;padding:10px 0px 0px 0px">                                    ' +
        '<p>&copy;2013 Applane. All Rights Reserved. <a class="hover" style="color:#ff761b !important;" href="http://www.applane.com/terms-of-use/">Terms                                        of Use</a> <span>|</span> <a class="hover"             style="color:#ff761b !important;"                                                        href="http://www.applane.com/privacy-policy/">Privacy                                        Policy </a></p>' +
        '</td>                            </tr>                            </tbody>                        </table>                    ' +
        '</center>                </td>            </tr>            </tbody>        </table>    </div></div></body></html>'
    return html;
}

function sendChangePasswordEmail(domain, userId, userAccessToken, email, mailTemplate, db) {
    var options = {};
    options.subject = "Reset password instructions";
    options.to = email;
    if (mailTemplate && mailTemplate === "autoload") {
        var mailParams = {};
        mailParams[Constants.Admin.Users.EMAIL_ID] = email;
        options.html = getAutoloadHTML(mailParams, userAccessToken);
        return db.sendMail(options).then(function () {
            return db.update({$collection: "pl.users", $update: {_id: userId, $set: {verificationCode: userAccessToken}}});
        })
    } else {
        var href = "http://" + domain + "/resetpassword.html?user_access_token=" + userAccessToken;
        options.html = '<!DOCTYPE html><html>' +
            '<style type="text/css">a.hover {color: #ff761b;text-decoration: none;}a.hover:hover {text-decoration: underline;}</style>' +
            '<body>' +
            '<div style="margin:0">' +
            '<div alink="#63A42C" bgcolor="#f6f6f6" link="#63A42C"         style="text-align:left;margin:0px;background:#f2f2f2;border:1px solid #ddd" vlink="#63A42C">       ' +
            ' <table border="0" cellpadding="25" cellspacing="0" width="100%">            ' +
            '<tbody>            <tr>                ' +
            '<td>                    <center>                        ' +
            '<table cellpadding="15" cellspacing="0" height="100"  style="border-top:1px solid #ddd;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom:1px solid #eee;background:#ffffff;border-top-left-radius:6px;border-top-right-radius:6px" width="620">   ' +
            '<tbody>' +
            '<tr>                                ' +
            '<td style="min-height:10px;padding:0px"></td></tr><tr><td style="text-align:center;padding:15px">' +
            '<a href="http://www.applane.com" target="_blank"> ' +
            '<img alt="Applane" src=http://' + domain + '/images/applanelogo.png>' +
            '</a></td></tr></tbody></table>' +
            '<table cellpadding="25" cellspacing="0" height="100"                               style="border:0;background:#fcfcfc;font:14px/22px helvetica;border-bottom:1px solid #ddd;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom-left-radius:6px;border-bottom-right-radius:6px"                               width="620">                            <tbody>                            <tr>                                <td><h3>Hi!</h3>                                    <p> To access your account and set a new password, <a href=' + '"' + href + '"' + '                                        style="color:#ff761b;font-weight:bold;text-decoration:none" target="_blank">just                                        click here</a></p>                                    <p> We sent you this email because you clicked on the "Forgot your password?" link.                                        <br> If you do remember your password now, please ignore this email. </p></td>                            </tr>                            </tbody>                        </table>                        <table cellpadding="15" cellspacing="0" height="100" width="580">                            <tbody>                            <tr>                                <td style="font:10px/16px helvetica;text-align:center;color:#aaa;padding:0px"><p> This                                    email was sent to <a href="" style="color:#999;text-decoration:none"                                                         target="_blank">' + email + '</a> because a Applane account was                                    created and subscribed to our mailings using this email. </p></td>                            </tr>                            <tr>                                <td style="font:10px/16px helvetica;text-align:center;color:#aaa;padding:10px 0px 0px 0px">                                    ' +
            '<p>&copy;2013 Applane. All Rights Reserved. <a class="hover" style="color:#ff761b !important;" href="http://www.applane.com/terms-of-use/">Terms                                        of Use</a> <span>|</span> <a class="hover"             style="color:#ff761b !important;"                                                        href="http://www.applane.com/privacy-policy/">Privacy                                        Policy </a></p>' +
            '</td>                            </tr>                            </tbody>                        </table>                    ' +
            '</center>                </td>            </tr>            </tbody>        </table>    </div></div></body></html>'
        return db.sendMail(options);
    }


}