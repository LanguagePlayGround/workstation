exports.onPreSave = function (event, document, collection, db, options) {
//    console.log("on Pre Save of IncludeExcludeModule1+++++++++++++++++>>>>>>>>>>>>>" + JSON.stringify(document));
    if (document.type === "insert") {
        var country = document.get("country");
        document.set("code", 100);
    } else if (document.type === "delete") {
        document.setCancelUpdates();
        db.update({$collection:"countries", $insert:[
            {"country":"USA1", _id:"USA1"}
        ]});
    }
}


