exports.onApprovalAction = function (parameters, db, options) {
    var Utils = require("ApplaneCore/apputil/util.js");
    var Constants = require("ApplaneDB/lib/Constants.js");
    var _ids = parameters._id;
    if (!Array.isArray(_ids)) {
        _ids = [_ids];
    }
    var workflow = undefined;
    return Utils.iterateArrayWithPromise(_ids, function (index, _id) {
        return db.query({$collection: Constants.WorkFlow.WORKFLOW, $filter: {_id: _id}}).then(function (result) {
            if (result && result.result && result.result.length > 0) {
                workflow = result.result[0];
                // update the owner status and comment
                var set = {};
                set[Constants.WorkFlow.WorkFlow.APPROVER_ACTION] = parameters.action;
                set[Constants.WorkFlow.WorkFlow.COMMENT] = parameters.comment;
                set[Constants.WorkFlow.WorkFlow.STATUS] = "completed";
                return db.update({$collection: Constants.WorkFlow.WORKFLOW, $update: {_id: workflow._id, $set: set}});
            } else {
                throw new Error("Workflow record not found.May the process is started again");
            }
        }).then(function () {
                if (workflow) {
                    return db.update({$collection: workflow[Constants.WorkFlow.WorkFlow.COLLECTION], $update: {_id: workflow.fk._id, $set: {"__events": {$insert: [
                        {event: workflow[Constants.WorkFlow.WorkFlow.EVENT], when: new Date(), owner: {_id: db.user._id, username: db.user.username}, action: parameters.action}
                    ]}}}, $events: false});
                }
            }).then(function () {
                if (workflow) {
                    return db.query({$collection: workflow[Constants.WorkFlow.WorkFlow.COLLECTION], $filter: {_id: workflow.fk._id}});
                }
            }).then(function (result) {
                if (result && result.result && result.result.length > 0) {
                    var data = result.result[0];
                    var event = workflow[Constants.WorkFlow.WorkFlow.INITIATOR] + "." + parameters.action;
                    data.__approver = {_id: db.user._id, username: db.user.username};
                    return db.fireWorkflowEvent(event, data, workflow[Constants.WorkFlow.WorkFlow.COLLECTION], db, options);
                }
            });
    })
}

exports.startWorkflow = function (parameters, db, options) {
    var Utils = require("ApplaneCore/apputil/util.js");
    var Constants = require("ApplaneDB/lib/Constants.js");
    var workflows = parameters.workflow;
    if (Utils.isJSONObject(workflows)) {
        workflows = [workflows];
    }
    var mailOptions = undefined;
    var workflowid = undefined;
    return Utils.iterateArrayWithPromise(workflows, function (index, workflow) {
        if (workflow.owner === undefined) {
            throw new Error("Owner is mandatory to start Work Flow [" + JSON.stringify(workflow) + "]");
        }
        var insert = {};
        insert[Constants.WorkFlow.WorkFlow.SUBJECT] = workflow.subject;
        insert[Constants.WorkFlow.WorkFlow.DETAIL] = workflow.detail;
        insert[Constants.WorkFlow.WorkFlow.OWNER] = workflow.owner;
        insert[Constants.WorkFlow.WorkFlow.ACTION] = workflow.action;
        insert[Constants.WorkFlow.WorkFlow.INITIATOR] = workflow.initiator;
        insert[Constants.WorkFlow.WorkFlow.FK] = workflow.fk;
        insert[Constants.WorkFlow.WorkFlow.COLLECTION] = workflow.collection;
        insert[Constants.WorkFlow.WorkFlow.EVENT] = workflow.event;
        insert[Constants.WorkFlow.WorkFlow.STATUS] = "pending";
        return db.update({$collection: Constants.WorkFlow.WORKFLOW, $insert: insert}).then(function (result) {
            if (result && result[Constants.WorkFlow.WORKFLOW] && result[Constants.WorkFlow.WORKFLOW]["$insert"] && result[Constants.WorkFlow.WORKFLOW]["$insert"].length > 0) {
                workflowid = result[Constants.WorkFlow.WORKFLOW]["$insert"][0]._id;
                mailOptions = workflow[Constants.WorkFlow.WorkFlow.MAILOPTIONS];
                if (mailOptions) {
                    return db.createUserConnection(workflow.owner._id, {function: "WorkFlow.onApprovalAction"});
                }
            }
        }).then(function (token) {
                if (token) {
                    var sendMailoptions = {};
                    sendMailoptions.to = mailOptions[Constants.WorkFlow.WorkFlow.MailOptions.TO];
                    sendMailoptions.cc = mailOptions[Constants.WorkFlow.WorkFlow.MailOptions.CC];
                    sendMailoptions.subject = mailOptions[Constants.WorkFlow.WorkFlow.MailOptions.SUBJECT];
                    sendMailoptions.from = mailOptions[Constants.WorkFlow.WorkFlow.MailOptions.FROM];
                    var html = mailOptions[Constants.WorkFlow.WorkFlow.MailOptions.BODY];
                    html = populateActionLinks(html, workflowid, workflow.action, options.domain, token);
                    sendMailoptions.html = html;
                    return db.sendMail(sendMailoptions);
                }
            });
    });
}

function populateActionLinks(html, _id, action, domain, token) {
    html += "<table border=0 width='20%'><tr>";
    for (var i = 0; i < action.length; i++) {
        html += "<td width='20%' align='left'>";
        html += "<a href=";
        html += "http://" + domain + "/rest/invoke" + "?function=WorkFlow.onApprovalAction&parameters=[{%22action%22:%22" + action[i] + "%22,%22_id%22:%22" + _id + "%22}]&user_access_token=" + token + ">";
        html += action[i];
        html += "</a></td>";
    }
    html += "</tr></table>";
    return html;
}

function getHtml(template, data, options) {
    var domain = options ? options.domain : undefined;
    var code = options ? options.dbcode : undefined;
    var token = options ? options.token : undefined;
    return require("ejs").render(template, {data: data, domain: domain, code: code, token: token});
}


