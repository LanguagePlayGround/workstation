/***** move to app-helper.js to generate minified version for before commit*******/
(function (definition) {

    if (typeof exports === "object") {
        module.exports = definition();
    } else {
        ModuleManager = definition();
    }

})(function () {
    "use strict";
    function ModuleManager() {
    }

    ModuleManager.triggerModules = function (event, document, collection, db, options) {
        var EventManager = require("ApplaneDB/lib/EventManager.js");
        return EventManager.triggerEvents(event, document, collection.events, collection, db, options)

    }
    return ModuleManager;

});
