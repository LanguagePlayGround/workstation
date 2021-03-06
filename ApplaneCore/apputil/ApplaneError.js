var util = require('util')
var vm = require('vm');

var ApplaneError = function (code, params) {
    Error.captureStackTrace(this, this);
    var msg = params ? vm.runInNewContext(code.message, {params: params}) : code.message;
    this.message = msg || 'Error';
    this.code = code.code;
    this.baaserror = true;
    if (code.stack) {
        this.stack = code.stack;
    }
}
util.inherits(ApplaneError, Error)
ApplaneError.prototype.name = 'Applane Error'


module.exports = ApplaneError
