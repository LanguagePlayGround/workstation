exports.getTags = function (parameters, db, options) {
    var Constants = require("./Constants.js");
    var value = parameters.q;
    if (value && (typeof value) == "string") {
        value = value.toLowerCase();
    }
    var fields = {};
    fields[Constants.Collections.Tags.TAG] = 1;
    var filter = {};
    filter[Constants.Collections.Tags.TAG_LOWER] = {$regex:"^" + value};
    var query = {$collection:Constants.Collections.Tags.COLLECTION, $fields:fields, $filter:filter};
    return db.query(query);
}

exports.onSave = function (document, db, options) {
    var Constants = require("./Constants.js");
    if (document.type === "insert") {
        document.set(Constants.Collections.Tags.CREATED_ON, new Date());
        var creator = {};
        creator._id = db.user._id;
        creator[Constants.Collections.Users.FULL_NAME] = db.user[Constants.Collections.Users.FULL_NAME];
        document.set(Constants.Collections.Tags.CREATOR, creator);
    }
}