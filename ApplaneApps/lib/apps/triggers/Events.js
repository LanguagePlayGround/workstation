/**
 * Created by rajit on 11/4/15.
 */

var Q = require("q");

//ensuring function is existing and loading
exports.onPreSave = function (document, db) {
    var functionName = document.get("function");
    if(functionName){
        var functionDef =  db.loadFunction(functionName);
        if (Q.isPromise(functionDef)) {
            return functionDef.then(function () {
                //do not return anything
            })
        } else {
            //do not return anything
        }
    }
};
