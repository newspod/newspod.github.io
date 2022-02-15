const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

var recognition = null;

function activate_microphone() {
    if(!recognition) {
        if(playing) {
            pause_play();
        }
        $("#microphone_container").addClass("active_microphone");
        recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.onresult = function(event) {return listen_result(event);};
        recognition.start();
    }
    else {
        // Equivalent to canceling?
        recognition.stop();
        recognition = null;
        $("#microphone_container").removeClass("active_microphone"); 
    }
}
function listen_result(event) {
    var transcript = event.results[0][0].transcript;
    var is_final = event.results[0].isFinal;
    $("#in_progress_input").html(transcript);
    if(is_final) {
        recognition.stop();
        recognition = null;
        setTimeout(function() {
            listen_final_result(transcript);
        }, 200);
    }
}
function listen_final_result(transcript) {
    var transcript = transcript.toLowerCase();
    var normalized_transcript = normalize_speech_input(transcript);
    $("#in_progress_input").html(""); // Remove the 
    $("#microphone_container").removeClass("active_microphone");

    console.log(`Processing user input ${transcript}. Normalized form: ${normalized_transcript}`);

    if(normalized_transcript == "pause") {
        if(playing) {pause_play();}
    }
    else if(normalized_transcript == "play") {
        if(!playing) {pause_play();}
    }
    else if(normalized_transcript == "stop") {
        if(podcast_playing) {end_podcast();}
    }
    else if(normalized_transcript == "next") {
        section_move(1);
    }
    else if(normalized_transcript == "previous") {
        section_move(-1);
    }
    else if(normalized_transcript == "mute") {
        if(!muted) {
            mute_unmute();
        }
    }
    else {
        event_qa(transcript);
    }
}
function question_prettifier(question) {
    if(question[question.length-1] != "?") {question += "?";}
    return question[0].toUpperCase() + question.substring(1);
}
function event_qa(question) {
    var active_passage = podcast[active_session];
    if(active_passage.type == "event") {
        var eid = active_passage.eid;
        var question_pretty = question_prettifier(question);
        $('.active_paragraph').append(`<span class='sentence active_sentence sentence_question'>${question_pretty}</span>`);
        $("#question_input").val("").blur();
        cancel_speech_and_do(function() {
            read_paragraph({"paragraph": [`I'll look into that, give me a moment.`], "invisible": true, "type": "invi"}, true);
            // var api_url = `/api/podcast/question/${eid}/${question}`;
            var api_url = `/api/podcast/question/${eid}/${question}/progress/${section_progress}`;
            full_json(api_url, function(answer) {
                cancel_speech_and_do(function() {
                    if(answer.answer == "no answer") {
                        read_paragraph({"paragraph": [`Sorry. I couldn't find the answer. If you rephrase I will try again. Otherwise I'll keep walking you through the story.`], "invisible": true, "type": "invi"});
                    }
                    else {
                        read_paragraph({"paragraph": [`I think the answer is ${answer.answer}, I got it from the following paragraph.`, answer.paragraph], "type": "paragraph"});    
                    }
                });

            });
        });       
    }
    else {
        read_paragraph({"paragraph": [`Sorry I can't answers questions now. I'm only able to answer questions within a story for now.`], "invisible": true, "type": "invi"});
    }
}
