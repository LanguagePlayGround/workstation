$("#start_button").click(function () {
    leak1 = new Leaker();
    leak1.init();

});

$("#destroy_button").click(function () {
    leak1 = null;
});

var leak1 = undefined;

