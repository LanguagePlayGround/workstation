/**
 * Created by ashu on 17/6/15.
 */

var forever = require("forever-monitor");
var nodemailer = require("nodemailer");
var otherParams = [];

for (var i = 2; i < process.argv.length; i++) {
    otherParams[i - 2] = process.argv[i];
}

var child = new (forever.Monitor)('./gpsServer.js', {
        silent: false,
        max: 999999999,
        'killTree': true,
        options: otherParams,
        'outFile': '../../out.log',
        'errFile': '../../err.log'
    }
)

child.on('exit', function () {
    console.log('Server has exited after restarts');
});

child.on('restart', function (forever) {
    var options = {};
    options.to = "rohit.bansal@daffodilsw.com";
    options.subject = "Server Restarted";
    options.text = "Uncaught exception on server restarted [" + JSON.stringify(forever.times) + " ] times  with arguments [" + JSON.stringify(forever.args) + "]";
    var transport = nodemailer.createTransport({auth: {user: "developer@daffodilsw.com", pass: "dak2applane"}, service: "gmail"});
    transport.sendMail(options, function () {
    });
});

child.on('error', function (err) {
    console.log('err>>>' + err.stack);
});

child.start();