var show_intro = true;

var podcast = null;
var podcast_queue = [];

var podcast_playing = false, playing = false;

var muted = true;
var active_session = -1;
var active_eid = "";
var cancelled = false;

function join_lists_with_and(word_list) {
    var ret_string = "";
    for(var i = 0; i < word_list.length; i++) {
        if(i > 0 && i < word_list.length-1) {ret_string += ", ";}
        else if(i == word_list.length-1) {ret_string += " and ";}
        ret_string += word_list[i];
    }
    return ret_string;
}

function build_intro() {
    var full_podcast = [];
    if(show_intro) {
        var story_names = join_lists_with_and(podcast.map(function(e) {return e.story_name;}));
        var paragraph = ["Welcome to the NewsPod podcast!", `Today, we'll cover ${podcast.length} stories.`];
        for(var i = 0; i < podcast.length; i++) {
            var e = podcast[i];
            if(i == podcast.length - 1) {
                paragraph.push("and");
            }
            paragraph.push(e.story_name);
        }
        paragraph.push("Let's get started!");
        var intro_obj = {"type": "intro", "passage_idx": 0, "passage": [{"paragraph": paragraph}], "story_name": "Intro"};
        full_podcast.push(intro_obj)
    }

    var i = full_podcast.length;
    for(var event of podcast) {
        event.passage_idx = i;
        full_podcast.push(event);
        i += 1;
    }
    // Add an outro
    full_podcast.push({"invisible": true, "type": "invi", "passage_idx": full_podcast.length, "passage": [{"paragraph": ["That's it for today, thanks for tuning in!"], "invisible": true}], "story_name": "End"});
    podcast = full_podcast;
}
function podcast_next_step() {
    for(var passage of podcast) {
        if(passage.read === true) {continue;}
        // if(is_study && active_eid && active_eid.length > 0 && active_session != passage.passage_idx) {
            // There's an active event that we haven't done post completion quizz for
            
        //     do_pause();
        //     return;
        // }
        active_session = passage.passage_idx;
        
        if(passage.type == "event" && !passage.introduced) {
            $(`.pb_section_${active_session} .line`).width(0);
            $("#question_input_container").fadeIn(300);
            $("#question_input").val("");
            passage.introduced = true;
            read_paragraph({"paragraph": [`Next up, ${passage.story_name}`], "invisible": true, "type": "header"});
            $("#main_section_name").fadeOut(300, function() {
                $(this).html(passage.story_name).fadeIn(300);
            });
        }
        else if(passage.type != "event") {
            $("#question_input_container").hide();
        }
        for(var paragraph of passage.passage) {
            if(paragraph.read === true) {continue;}
            paragraph.read = true;
            active_eid = passage.eid;
            
            $(".active_section").removeClass("active_section");
            $(`.pb_section_${passage.passage_idx}`).addClass("active_section");

            read_paragraph(paragraph);
            return;
        }
        passage.read = true;
    }
    end_podcast();
}
function add_new_active_paragraph() {
    $(".active_paragraph").removeClass("active_paragraph");
    $(`#transcript_content`).append("<div class='paragraph active_paragraph'></div>");
}
function read_paragraph(paragraph, wait_after) {
    add_new_active_paragraph();
    for(var sentence of paragraph.paragraph) {
        var voice_idx = 1;
        if(paragraph.type == "question")   {voice_idx = 2;}
        else if(paragraph.type == "quote") {voice_idx = 3;}

        if(paragraph.type == "question") {
            var pattern = select_pattern(question_pattern, podcast_formality);
            sentence = fill_pattern(pattern, sentence);
        }
        var invisible = paragraph.invisible===true;
        podcast_queue.push({"action": "read_sentence", "invisible": invisible, "sentence": sentence, "type": paragraph.type, "voice_idx": voice_idx});
    }
    if(wait_after === true) {
        podcast_queue.push({"action": "wait"})
    }
    check_queue();
}
function check_queue() {
    // console.log("here!!", podcast_queue.length)
    // if(podcast_queue.length > 0) {
    //     console.log("Podcast queue length",podcast_queue.length, podcast_queue.map(function(q) {return q.action;}));
    // }
    if(playing) {return;}
    if(podcast_queue.length == 0) {
        podcast_next_step();
        return;
    }
    var current_step = podcast_queue.shift();
    if(current_step.action == "read_sentence") {
        $('.active_paragraph').append(`<span class='sentence active_sentence sentence_${current_step.type}'>${current_step.sentence}</span>`);
        $("#transcript_content").animate({scrollTop: $("#transcript_content")[0].scrollHeight}, 300);
        
        speak_func(current_step.sentence, current_step.voice_idx);
    }
    else if(current_step.action == "wait") {
        // We're not doing anything... just waiting! Probably for an API to answer back
    }
}
function build_progress_bar() {
    compute_section_lengths();
    var tot_char_length = podcast.map(function(s) {return s.char_length;}).reduce((a, b) => a + b, 0);
    var progress_bar_HTML = "";
    for(var section of podcast) {
        var section_width = 100.0 * section.char_length/tot_char_length;
        var section_name = "Intro";
        if(section.story_name) {section_name = section.story_name;}

        var clickable_HTML = `onclick='section_move(${section.passage_idx});'`;
        if(is_study) {clickable_HTML = "";}
        progress_bar_HTML += `<div class='pb_section pb_section_${section.passage_idx}' style='width: ${section_width}%;' ${clickable_HTML}><div class='line'></div><div class='bullet_left'></div><div class='bullet'></div><div class='section_name'>${section_name}</div></div>`;
    }
    $("#pb_content").html(progress_bar_HTML);
}

// Pausing / playing
function pause_play() {
    if(podcast_playing) {
        if(playing) {
            do_pause();
        }
        else {
            playing = true;
            if(audio_player) {audio_player.play();}
            $("#pause_play").attr("src", "images/icons/pause.svg");
        }
    }
}
function do_pause() {
    if(audio_player) {audio_player.pause();}
    playing = false;
    $("#pause_play").attr("src", "images/icons/play.svg");
    pause_wave();
    stop_wave();
}
function cancel_speech_and_do(func) {
    cancelled = true;
    audio_player.pause();
    playing = false;
    podcast_queue = [];
    setTimeout(function() {
        func();
    }, 50);
}
$(document).keyup(function(evt) {
    if(evt.keyCode == 32 && !$("#question_input").is(':focus')) {
        console.log("Space pressed");
        pause_play();
    }
});

// Moving between sections
function compute_section_lengths() {
    for(var section of podcast) {
        section.char_length = 0;
        section.current_read_count = 0;
        for(var para of section.passage) {
            for(var sent of para.paragraph) {
                section.char_length += sent.length;
            }
        }
    }
}
function section_move(section_to) {
    if(active_session != -1 && podcast_playing && section_to != active_session) {
        if(section_to > active_session) {
            mark_read_up_to(section_to);
        }
        else {
            mark_unread_after(section_to);
        }
        podcast_queue = [];
        cancelled = true;
        audio_player.pause();
        playing = false;
        podcast_next_step();
    }
}
function mark_read_up_to(section_idx) {
    for(var sec_idx=0; sec_idx < section_idx; sec_idx++) {
        var section = podcast[sec_idx];
        section.read = true;
        section.introduced = false;
        for(var paragraph of section.passage) {
            paragraph.read = true;
        }
        section.current_read_count = section.char_length;
        $(`.pb_section_${sec_idx} .line`).width("100%");
    }
    for(var sec_idx = section_idx; sec_idx < podcast.length; sec_idx++) {
        podcast[sec_idx].current_read_count = 0;
        $(`.pb_section_${sec_idx} .line`).width(0);
    }
}
function mark_unread_after(section_from) {
    for(var sec_idx=0; sec_idx < section_from; sec_idx++) {
        $(`.pb_section_${sec_idx} .line`).width("100%");
        podcast[sec_idx].current_read_count = podcast[sec_idx].char_length;
    }
    for(var sec_idx=section_from; sec_idx < podcast.length; sec_idx++) {
        var section = podcast[sec_idx];
        section.read = false;
        section.introduced = false;
        for(var paragraph of section.passage) {
            paragraph.read = false;
        }
        section.current_read_count = 0;
        $(`.pb_section_${sec_idx} .line`).width(0);
    }
}