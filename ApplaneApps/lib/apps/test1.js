
console.log("LOADED")
define("test1", function () {
    console.log("ME 2")
    return {
        mytest:function () {
            console.log("OK")
            return 10;
        }
    }
})

//exports.mytest = function () {
//    return 10;
//}