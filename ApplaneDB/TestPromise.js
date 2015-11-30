var Q = require("q");

var firstFunction = function () {
    console.log("first function")
    var d1 = Q.defer();
    d1.resolve("from one", "from2");
    return d1.promise;
}

var secondFunction = function (p1, p2) {
    console.log("second funcitn>>> from first>>>" + p1, +">>>p2>>>>" + p2)
    console.log("second function")
    var d1 = Q.defer();
    d1.reject(new Error("from 2"));
    d1.resolve("from 2");
    return d1.promise;
}


var thirdFunction = function () {
    console.log("thirdfunction")
    var d1 = Q.defer();
    d1.resolve("from three");
    return d1.promise;
}

var failFunction = function (err) {
    console.log("error received in fail>>" + err)
    var d1 = Q.defer();
    d1.resolve("Resovle gracefull from error functions");
//    d1.reject(new Error("Error again"));
    return d1.promise;
}

var finalFunction = function (arg1) {
    console.log(">>>>>" + arg1)
    console.log("Final function")
    var d1 = Q.defer();
    d1.resolve("from final");
    return d1.promise;
}

firstFunction()
    .then(secondFunction)
    .then(thirdFunction)
    .fail(failFunction)
    .fail(failFunction)
    .then(finalFunction)
    .fail(function (err) {
        console.log("error received finally>>>>>" + err)
    })
