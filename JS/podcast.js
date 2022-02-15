var selected_system = "qabest";
var interaction_qas = [];
var is_study = true;

function start_podcast() {
    var eids = []; $(".story_selector input:checked").map(function(i,d) { eids.push($(d).attr("eid"));});
    podcast_playing = true;
    podcast = [];
    for(var eid of eids) {
        var event = get_event_data(eid);
        podcast.push({"story_name": event.story_name, "eid": eid, "passage": event.passage, "rec_questions": event.rec_questions, "type": "event", "system": selected_system});
    }
    
    $("body").addClass("podcast_playing");
    build_intro();
    build_podcast_frame();
    podcast_next_step();
}
function compute_section_lengths() {
    for(var section of podcast) {
        section.char_length = 0;
        for(var para of section.passage) {
            for(var sent of para.paragraph) {
                section.char_length += sent.length;
            }
        }
    }
}
function build_podcast_frame() {
    // Let's build the progress bar
    build_progress_bar();
}
function section_move_study(direction) {
    if(active_session != -1 && podcast_playing) {
        if(direction == 1) {
            podcast[active_session].read = true;
            podcast[active_session+1].read = false;
        }
        else if(direction == -1) {
            podcast[active_session-1].read = false;
            podcast[active_session-1].introduced = false;
            for(var paragraph of podcast[active_session-1].passage) {
                paragraph.read = false;
            }
        }
        podcast_queue = [];
        cancelled = true;
        audio_player.pause();
        setTimeout(podcast_next_step, 50);
    }
}
function end_podcast() {
    $("body").removeClass("podcast_playing");
    podcast_playing = false;
    if(playing) {pause_play();}
}
function check_selected_stories() {
    var num_selected = $(".story_selector input:checked").length;
    var target_num = 4;

    $(".starter_button").prop("disabled", true);
    if(num_selected == target_num) {
        $("#starter_menu .warning_message").hide();
        $(".starter_button").prop("disabled", false);
    }
    else if(num_selected > target_num) {
        $("#starter_menu .warning_message").html(`Select ${num_selected-target_num} less stories.`).show();
    }
    else {
        $("#starter_menu .warning_message").html(`Select ${target_num-num_selected} more stories.`).show();
    }
}
var assignmentId='', turkSubmitTo = '';
function init() {
    // Get the events relevant to the task
    var story_selection_HTML = "";
    for(var event of podcast_data) {
        story_selection_HTML +=  `<div class='story_selector'><input type='checkbox' eid='${event.eid}' id='cb_${event.eid}' name='cb_${event.eid}' onchange='check_selected_stories();' /> <label for='cb_${event.eid}'>${event.story_name}</label></div>`;
    }
    $("#story_selection").html(story_selection_HTML);
    check_selected_stories();

    $("#start_button").prop("disabled", false);
}