exports.register = function (params, db) {
    return db.update({$collection: "devices", $delete: {$query: {id: params.id}}}).then(function () {
        return db.update({$collection: "devices", $upsert: {$query: {userid: db.user._id}, $set: {userid: {_id: db.user._id}, id: params.id, type: params.type}}})
    }).fail(function (err) {
        //TODO send mail
        console.log("err in device" + err.stack);
    });
};