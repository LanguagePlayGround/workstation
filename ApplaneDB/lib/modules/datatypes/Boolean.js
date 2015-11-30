exports.cast = function (value, expression, options) {
    if (value === undefined || value === null) {
        return
    }
    if (value == true || value == "true" || value == "TRUE" || value == 1) {
        return true;
    } else {
        return false;
    }
}