var util = require('util')
var vm = require('vm');

var ApplaneDBError = function (message, code, detailMessage) {
    Error.captureStackTrace(this, this);

    this.message = message || 'Error';
    this.code = code;
    this.applanedberror = true;
    this.detailMessage = detailMessage;

}
util.inherits(ApplaneDBError, Error)
ApplaneDBError.prototype.name = 'ApplaneDB Error'


module.exports = ApplaneDBError
