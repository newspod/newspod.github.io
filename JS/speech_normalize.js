String.prototype.replaceAll = function(str1, str2, ignore) {
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
}

function normalize_speech_input(text) {
    var final = ""+text.toLowerCase().trim();

    // Remove punctuation
    final = final.replaceAll(",", "")
    final = final.replaceAll(":", "")
    final = final.replaceAll(";", "")
    final = final.replaceAll("!", "")

    final = final.replace(/^ok/, "");
    final = final.replace(/^now/, "");
    final = final.replace(/^thank you/, "");
    final = final.replace(/^please/, "");
    final = final.replace(/^again/, "");
    final = final.replace(/^((could|can|could|will|would) you)/, "");
    final = final.replace(/^(you can)/, "");

    if(final != text) {
        return normalize_speech_input(final);
    } // run it again, as there might be further modification
    return synonym_normalize(final); // once we're done with removing politeness fillers, deal with basic synonymy
}
function synonym_normalize(text) {
    var final = ""+text.toLowerCase().trim();
    
    final = final.replace(/(halt|wait|mute)\b/, "pause");
    final = final.replace(/(resume|start|unmute)\b/, "play");
    final = final.replace(/(following|upcoming|after)\b/, "next");
    final = final.replace(/(before|back|go back)/, "previous");
    return final;
}

var tests = ["can you pause", "can you please pause", "ok, can you pause ", "will you pause", "will you please halt", "can you resume", "you can resume"]
for(var S of tests) {
    console.log(`[Normalizing test] "${S}" -> "${normalize_speech_input(S)}"`);

}