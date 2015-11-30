/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 29/11/13
 * Time: 3:08 PM
 * To change this template use File | Settings | File Templates.
 */
var fs = require("fs");
var util = require('util'), uglifycss = require('uglifycss'), uglies = [], filename, content, params, nFiles, result;
function parseArguments(argv) {
    var index, len = argv.length;
    for (index = 2; index < len; index += 1) {
        if (index === len - 1) {
            var fileName = [];
            fileName.push(argv[index]);
            var result = uglifycss.processFiles(fileName, uglifycss.defaultOptions);
            var newFilename = argv[index].substring(0, argv[index].lastIndexOf("."));
            newFilename = newFilename + "-min" + argv[index].substr(argv[index].lastIndexOf("."));
            fs.writeFile(newFilename, result, function (err, result) {
                if (err) {
                    console.log(err.stack);
                }
                console.log("successFull");
            });
        }
    }
}
parseArguments(process.argv);