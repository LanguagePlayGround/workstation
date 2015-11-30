/**
 * Created with IntelliJ IDEA.
 * User: Ritesh Bansal
 * Date: 2/12/14
 * Time: 4:43 PM
 * To change this template use File | Settings | File Templates.
 */

function BusinessLogicError(message) {
    if (!(this instanceof Error)) {
        var be = new BusinessLogicError(message);
        return be;
    }
    Error.call(this, message);
    this.name = "BusinessLogicError";
    this.message = message;
}

BusinessLogicError.prototype.__proto__ = Error.prototype;

