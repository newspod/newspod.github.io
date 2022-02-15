var pulse_int = null;

// Decorative wave functions
function play_wave(voice_idx) {
    if(pulse_int) {clearInterval(pulse_int);}
    console.log("Here!!", voice_idx)
    $("#wave").removeClass("voice1 voice2 voice3").removeClass("paused").addClass(`voice${voice_idx}`);

    pulse_int = setInterval(function() {
        var prop_up = 200 * (0.5 + 0.5 * (Math.random()-0.5));
        var prop_down = 200 - prop_up;
        var height_center = Math.floor(50.0 + 20.0*Math.random())
        var height_side = Math.floor(30.0 + 8.0*Math.random())

        $("#col2, #col4").animate({"height": height_side+"%"}, prop_up);
        $("#col3").animate({"height": height_center+"%"}, prop_up, function() {
            $("#col2, #col4").animate({"height": "20%"}, prop_down);
            $("#col3").animate({"height": "25%"}, prop_down);
        });
    }, 250);
}
function pause_wave() {
    if(pulse_int) {clearInterval(pulse_int);}
    $(".col").stop();

}
function stop_wave() {
    $("#wave").removeClass("voice1 voice2 voice3").addClass("paused");
    setTimeout(function() {
        $(".col").animate({"height": "15%"}, 400);
    }, 50)
}