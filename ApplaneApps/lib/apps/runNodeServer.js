/**
 * Created by ashu on 24/12/14.
 */

var argv = process.argv;
var filePath = argv[2];
var fileName = argv[3];
var cla = argv[4];

var child = require('child_process').spawn(process.execPath, [fileName].concat(cla.split(" ")), {detached: true, cwd: filePath, stdio: 'ignore'});
child.unref();

