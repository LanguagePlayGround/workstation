/**
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 29/11/13
 * Time: 3:07 PM
 * To change this template use File | Settings | File Templates.
 */
var UglifyJS = require("uglify-js");
var fs = require("fs");
function parseArguments(argv) {
    var index, len = argv.length;
    for (index = 2; index < len; index += 1) {
        if (index === len - 1) {
            var result = UglifyJS.minify(argv[index]);
            var newFilename = argv[index].substring(0, argv[index].lastIndexOf("."));
            newFilename = newFilename + "-min" + argv[index].substr(argv[index].lastIndexOf("."));
            fs.writeFile(newFilename, result.code, function (err, result) {
                if (err) {
                    console.log(err.stack);
                }
                console.log("successFull");
            });
        }
    }
}
parseArguments(process.argv);