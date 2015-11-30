var Leaker = function () {
};

Leaker.prototype = {
    init:function () {
        this._interval = null;
        this.count = 0;
        this.start();
    },

    start:function () {
        var subLeaker = new SubLeaker();
        subLeaker.init();
        var self = this;
        setTimeout(function () {
            console.log("Time out run after 10 seconds");
            subLeaker.init();

        }, 10000)
    },


};

var SubLeaker = function () {

}
SubLeaker.prototype = {
    init:function () {
        console.log("Sub leaker created");
    }
}
