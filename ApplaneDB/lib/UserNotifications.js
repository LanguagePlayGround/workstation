/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 16/10/14
 * Time: 12:50 AM
 * To change this template use File | Settings | File Templates.
 */

exports.onResult = function (query, result, db) {
    var notificationResult = result.result;
    return db.invokeFunction("Porting.getUserNotifications", [
        {}
    ]).then(function (userNotifications) {
            if (userNotifications && userNotifications.length > 0) {
                notificationResult.push.apply(notificationResult, userNotifications);
            }
        })
}

exports.onPreSave = function (document, db) {
    var updateId = document.get("_id");
    var status = document.get("status");
    var userId = db.user._id;
    return db.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection:"pl.notifications", $filter:{_id:updateId}, $fields:{id:1}});
        }).then(
        function (notificationResult) {
            if (notificationResult.result.length === 0) {
                throw new Error("Notification with _id[" + updateId.toString() + "] does not exists.");
            }
            var notificationId = notificationResult.result[0].id;
            if (!status) {
                throw new Error("Status can not be null for notification [" + notificationId + "]");
            }
            return db.update({$collection:"pl.userNotifications", $upsert:{$query:{notificationid:notificationId, "userid":userId}, $set:{status:status, userid:{_id:userId}}}});
        }).then(function () {
            document.setCancelUpdates();
        })
}
