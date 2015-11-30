var Constants = require("../Constants.js");

exports.onPreSave = function (document, db) {
    var pageType = document.get(Constants.Admin.Pages.TYPE);
    var file = document.get(Constants.Admin.Pages.FILE);
    if (pageType === Constants.Admin.Pages.Type.RESOURCE && file !== undefined) {
        var resourceType = document.get(Constants.Admin.Pages.RESOURCETYPE);
        var uri = document.get(Constants.Admin.Pages.URI);
        if (resourceType == Constants.Admin.Pages.ResourceType.CSS) {
            var contents = '<link href="' + uri + '" rel="stylesheet" />';
            document.set("contents", contents);
        } else if (resourceType == Constants.Admin.Pages.ResourceType.JS) {
            var contents = '<script src="' + uri + '" type="text/javascript" ></script>';
            document.set("contents", contents);
        }
    }
}