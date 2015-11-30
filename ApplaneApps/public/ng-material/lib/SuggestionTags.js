exports.onSave = function (document, db, options) {
    var Constants = require("./Constants.js");
    if (document.type === "insert") {
        document.set(Constants.Collections.SuggestionTags.CREATED_ON, new Date());
        var creator = {};
        creator._id = db.user._id;
        creator[Constants.Collections.Users.FULL_NAME] = db.user[Constants.Collections.Users.FULL_NAME];
        document.set(Constants.Collections.SuggestionTags.CREATOR, creator);
    }
}