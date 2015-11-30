/**
 * Created by root on 3/3/15.
 */


var argv = process.argv;
var params = argv[2];

var child = require('child_process').exec(params, {detached: true, stdio: 'ignore'});
child.unref();