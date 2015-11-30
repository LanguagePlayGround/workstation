var requirejs = require("requirejs");
requirejs.config({
    baseUrl:"D:\\Applane\\node_modules",
    nodeRequire:require,
    paths:{
        app:'ApplaneApps/lib/apps/newapps'
    }

})

console.log("dirname>>>" + __dirname)
requirejs(["ApplaneApps/lib/apps/newapps/test2"], function (test1) {
    var test1Number = test1.mytest();
    console.log(test1Number);
})
console.log("I am running")