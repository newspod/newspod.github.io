var section_progress = 0;
var audio_player = null;

function speak_func(text, voice_idx) {
    $("#pause_play").attr("src", "images/icons/pause.svg");
    console.log(`[READING IN VOICE ${voice_idx}] ${text}`);
    cancelled = false;

    // var api_url = `https://newslens.berkeley.edu/api/podcast/ogg/${voice_idx}`;

    playing = true;
    // $.post(api_url, {"text": text}, function(data) {
    var hash = text2hash(text);
    // audio_player = new Audio(`https://newslens.berkeley.edu/audio/${data.filename}?${new Date().getTime()}`);
    audio_player = new Audio(`audio/np_${hash}.ogg?${new Date().getTime()}`);
    audio_player.play();
    if(!playing) { // In case the podcast was paused during the api request
        audio_player.pause();
    }
    audio_player.onplaying=function() {
        play_wave(voice_idx);
    }
    audio_player.onended=function(e) {
        playing = false;
        $(".active_sentence").removeClass("active_sentence");
        if(!cancelled) {
            podcast[active_session].current_read_count += text.length;
            check_queue();
        }
        pause_wave();
    }
    audio_player.onpause=function(e) {
        playing = false;
        pause_wave();
    }
    audio_player.ontimeupdate=function(e) {
        var section = podcast[active_session];
        var total_length = section.char_length;
        var played_fraction = (audio_player.currentTime / audio_player.duration);

        var prefilled_length = 100 * (section.current_read_count / total_length);
        var to_fill_length = 100 * (text.length / total_length) * played_fraction;
        var target_width = prefilled_length + to_fill_length;
        target_width = Math.min(100, target_width);
        section_progress = target_width;

        $(`.pb_section_${active_session} .line`).width(`${target_width}%`)   
    }
}
function text2hash(text) {
 
    var hash = 0;
    for (var i = 0; i < text.length; i++) {
        hash += text.charCodeAt(i) * (1 + (i % 40));
        
        // ord(text[i])*(1+(i%40))
    }
    return hash.toString();
}