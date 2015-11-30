exports.forgotPassword = function (email, database, domain) {
    var Constants = require("./Constants.js");
    var DB = require("ApplaneDB/lib/DB.js");
    var db = undefined;
    return DB.getAdminDB().then(
        function (admindb) {
            if (!admindb) {
                throw new Error("unable to connect");
            }
            return admindb.connectUnauthorized(database);
        }).then(
        function (db1) {
            db = db1;
            return db.query({$collection: Constants.Collections.Users.COLLECTION, $fields: {_id: 1}, $filter: {"emailid": email}})
        }).then(
        function (data) {
            if (data && data.result && data.result.length == 1) {
                var userId = data.result[0]._id
                return db.createUserConnection(userId, {function: "FimbreUser.changePassword"});
            } else {
                throw new Error("Email is not registered.");
            }
        }).then(function (userAccessToken) {
            var href = "http://" + domain + "/fimbreresetpassword.html?user_access_token=" + userAccessToken;
            var name = "Fimbre";
            var bottom = '&copy;2014 Fimbre. All Rights Reserved.'
            var logohref = "";
            var options = {};
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
                '<a href=' + logohref + ' target="_blank"> ' +
                '<img height="150" alt="Fimbre" src=http://' + domain + '/images/fimbre/fimbre_logo.png ' +
                '</a></td></tr></tbody></table>' +
                '<table cellpadding="25" cellspacing="0" height="100"                               style="border:0;background:#fcfcfc;font:14px/22px helvetica;border-bottom:1px solid #ddd;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom-left-radius:6px;border-bottom-right-radius:6px"                               width="620">                            <tbody>                            <tr>                                <td><h3>Hi!</h3>                                    <p> To access your account and set a new password, <a href=' + '"' + href + '"' + '                                        style="color:#ff761b;font-weight:bold;text-decoration:none" target="_blank">just                                        click here</a>                                    </p>                                    <p> We sent you this email because you clicked on the "Forgot your password?" link.                                        <br> If you do remember your password now, please ignore this email. </p></td>                            </tr>                            </tbody>                        </table>                        <table cellpadding="15" cellspacing="0" height="100" width="580">                            <tbody>                            <tr>                                <td style="font:10px/16px helvetica;text-align:center;color:#aaa;padding:0px"><p> This                                    email was sent to <a href="" style="color:#999;text-decoration:none"                                                         target="_blank">' + email + '</a> because a <a href="" style="color:#999;text-decoration:none"                                                         target="_blank">' + name + '</a> account was                                    created and subscribed to our mailings using this email. </p></td>                            </tr>                            <tr>                                <td style="font:10px/16px helvetica;text-align:center;color:#aaa;padding:10px 0px 0px 0px">                                    ' +
                '<p>' + bottom + '</p>' +
                '</td>                            </tr>                            </tbody>                        </table>                    ' +
                '</center>                </td>            </tr>            </tbody>        </table>    </div></div></body></html>'
            options.subject = "Reset password instructions";
            options.to = email;
            options.html = html;
            return db.sendMail(options);
        })

}

exports.changePassword = function (parameters, db, options) {
    var Constants = require("./Constants.js");
    var DBConstants = require("ApplaneDB/lib/Constants.js");
    if (parameters && parameters.password) {
        if (db && db.user && db.user._id) {
            var update = [
                {$collection: Constants.Collections.Users.COLLECTION, $update: [
                    {"_id": db.user._id, $set: {password: parameters.password}}
                ]}
            ]
            return db.update(update).then(function () {
                return DBConstants.ErrorCode.PASSWORD_RESET;
            })
        } else {
            throw new Error("User not found.");
        }
    } else {
        throw new Error("Password not found.");
    }
}

exports.signup = function (params, db, options) {
    var Constants = require("./Constants.js");
    var email = params[Constants.Collections.Users.EMAIL_ID];
    var name = params[Constants.Collections.Users.NAME];
    var verificationcode = Math.floor((Math.random() * 1000000) + 1).toString();
    var password = params[Constants.Collections.Users.PASSWORD];
    var confirmpassword = params[Constants.Collections.Users.CONFIRM_PASSWORD];
    if (password == null || password.trim().length < 6) {
        throw new Error("Password Should be atleast of 6 Character>>>");
    }
    if (password !== confirmpassword) {
        throw new Error("Password and Confirm Password doesn't match");
    }
    var filter = {};
    filter[Constants.Collections.Users.EMAIL_ID] = email;
    return db.query({$collection: Constants.Collections.Users.COLLECTION, $fields: {"_id": 1}, $filter: filter, $modules: false}).then(
        function (user) {
            if (user.result.length > 0) {
                throw new Error("This EmailID is Already Exist");
            }
            var insert = {};
            insert[Constants.Collections.Users.USER_NAME] = email;
            insert[Constants.Collections.Users.EMAIL_ID] = email;
            insert[Constants.Collections.Users.FULL_NAME] = name;
            insert[Constants.Collections.Users.PASSWORD] = password;
            insert[Constants.Collections.Users.NOTIFICATION] = true;
            insert[Constants.Collections.Users.FIMBRE_STATUS] = Constants.Collections.Users.FimbreStatus.PENDING;
            insert[Constants.Collections.Users.VERIFICATION_CODE] = verificationcode;
            var updates = {$collection: Constants.Collections.Users.COLLECTION, $insert: insert};
            return db.update(updates)
        }).then(
        function (result) {
            var id = result[Constants.Collections.Users.COLLECTION].$insert[0]._id;
            var databaseName = db.db.databaseName;
            return sendMailtoUsers(options.domain, verificationcode, id, email, name, databaseName);                            //options>>>>>>>{"domain":"127.0.0.1:5100"}
        }).then(function () {
            return {username: email, emailid: email};
        })

}

function sendMailtoUsers(domain, verificationcode, id, email, name, databaseName) {
    var index = domain.lastIndexOf("/");
    if (index >= 0) {
        domain = domain.substring(0, index);
    }
    var href = "http://" + domain + "/FimbreVerifyEmail.html?vc=" + verificationcode + "&user=" + id + "&dbName=" + databaseName;
    var options = {};
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
        '<a href="" target="_blank"> ' +
        '<img height="150" alt="Fimbre" src=http://' + domain + '/images/fimbre/fimbre_logo.png>' +
        '</a></td></tr></tbody></table>' +
        '<table cellpadding="25" cellspacing="0" height="100"                               style="border:0;background:#fcfcfc;font:14px/22px helvetica;border-bottom:1px solid #ddd;border-left:1px solid #ddd;border-right:1px solid #ddd;border-bottom-left-radius:6px;border-bottom-right-radius:6px"                               width="620">                            <tbody>                            <tr>                                <td><h3>Hi <a href="" style="text-decoration:none"                                                         target="_blank">' + name + "," + '</a></h3><p>Welcome to Fimbre! Click the Link below to verify your email address:</p>                                    <p>  <a href=' + '"' + href + '"' + '                                     style="color:#ff761b;font-weight:bold;text-decoration:none" target="_blank">Verify your Email</a>                                    </p>    <p>Thanks! <br> Fimbre Team</p>                                </td>                            </tr>                            </tbody>                        </table>                        <table cellpadding="15" cellspacing="0" height="100" width="580">                            <tbody>                            <tr>                                <td style="font:10px/16px helvetica;text-align:center;color:#aaa;padding:0px"><p> This                                    email was sent to <a href="" style="color:#999;text-decoration:none"                                                         target="_blank">' + email + '</a> because a Fimbre account was                                    created and subscribed to our mailings using this email. </p></td>                            </tr>                            <tr>                                <td style="font:10px/16px helvetica;text-align:center;color:#aaa;padding:10px 0px 0px 0px">                                    ' +
        '<p>&copy;2014 Fimbre. All Rights Reserved.</p>' +
        '</td>                            </tr>                            </tbody>                        </table>                    ' +
        '</center>                </td>            </tr>            </tbody>        </table>    </div></div></body></html>'
    options.subject = "Verification mail";
    options.to = email;
    options.from = "developer@daffodilsw.com";
    return require("ApplaneDB/lib/MailService.js").sendFromAdmin(options)
}

exports.getGoogleContacts = function (params, db) {
    return [
        {name: "Rohit Bansa", emailid: "rohit.bansal@daffodilsw.com"},
        {name: "Rohit Bansal1", emailid: "rohit.bansal1@daffodilsw.com"},
        {name: "Rohit Bansal2", emailid: "rohit.bansal2@daffodilsw.com"},
        {name: "Rohit Bansal3", emailid: "rohit.bansal3@daffodilsw.com"},
        {name: "Rohit Bansal4", emailid: "rohit.bansal4@daffodilsw.com"},
        {name: "Rohit Bansal5", emailid: "rohit.bansal5@daffodilsw.com"},
        {name: "Rohit Bansal6", emailid: "rohit.bansal6@daffodilsw.com"},
        {name: "Rohit Bansal7", emailid: "rohit.bansal7@daffodilsw.com"},
        {name: "Rohit Bansal8", emailid: "rohit.bansal8@daffodilsw.com"},
        {name: "Rohit Bansal9", emailid: "rohit.bansal9@daffodilsw.com"},
        {name: "Rohit Bansal10", emailid: "rohit.bansal10@daffodilsw.com"}
    ]
}


exports.getUserData = function (params, db, options) {
    var Constants = require("./Constants.js");
    var query = {$collection: Constants.Collections.Users.COLLECTION, $fields: {}, $filter: {_id: db.user._id}};
    query.$fields[Constants.Collections.Users.FULL_NAME] = 1;
    query.$fields[Constants.Collections.Users.IMAGE] = 1;
    query.$fields[Constants.Collections.Users.NOTIFICATION] = 1;
    return db.query(query).then(function (userInfo) {
        console.log(JSON.stringify(userInfo));
        return userInfo;
    })
}


exports.updateUserData = function (params, db, options) {
    var Constants = require("./Constants.js");
    var name = params[Constants.Collections.Users.FULL_NAME];
    var notification = params[Constants.Collections.Users.NOTIFICATION];

    var updates = {$collection: Constants.Collections.Users.COLLECTION, $update: {_id: db.user._id, $set: {}}};
    if (name !== undefined) {
        updates.$update.$set[Constants.Collections.Users.FULL_NAME] = name;
    }

    if (notification !== undefined) {
        updates.$update.$set[Constants.Collections.Users.NOTIFICATION] = notification;
    }
    return db.update(updates).then(function (userInfo) {
        console.log(JSON.stringify(userInfo));
        return userInfo;
    })
}


exports.disconnect = function (params, db) {
    return db.update({$collection: "devices", $delete: {$query: {userid: db.user._id}}}).fail(function (err) {
        console.log("err>>>>" + err.stack);
    })
};