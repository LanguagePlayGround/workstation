var zlib = require("zlib");
var fs = require('fs');
var src = getCommandLineArgument("src");
var sources = src.split(";");
for (var i = 0; i < sources.length; i++) {
    var target = sources[i] + ".gz";
    var gzip = zlib.createGzip();
    if (fs.existsSync(sources[i])) {
        var inp = fs.createReadStream(sources[i]);
        var out = fs.createWriteStream(target);
        inp.pipe(gzip).pipe(out);
        console.log("successfully created [" + sources[i] + "]");
    }
    else {
        console.log("Source doesn't exists [" + sources[i] + "]");
    }
}

function getCommandLineArgument(key) {
    if (process && process.argv) {
        for (var i = 0; i < process.argv.length; i++) {
            var obj = process.argv [i];
            if (obj.indexOf(key + "=") == 0) {
                return obj.substring(obj.indexOf(key + "=") + key.length + 1);
            }

        }
    }
}
