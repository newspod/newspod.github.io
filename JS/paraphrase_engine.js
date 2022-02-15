// One optional parameter: formality, from 1 (most informal) to 5 (most formal)

var podcast_formality = 3; // Up to us to change this around

var question_pattern = [
    // {"pattern": "Interesting, $TXT", "formality": 5},
    // {"pattern": "Mmmm... $TXT", "formality": 4},
    // {"pattern": "Hmmm... $TXT", "formality": 4},
    {"pattern": "$TXT", "formality": 3},
    // {"pattern": "Alright. $TXT", "formality": 2},
    // {"pattern": "Cool. $TXT", "formality": 1},
];

function select_pattern(patterns, formality) {
    var all_distances = [];
    for(var pattern of patterns) {
        pattern["formality_dist"] = Math.abs(pattern.formality - formality);
        all_distances.push(-pattern["formality_dist"]);
    }
    var exps = all_distances.map(function(d) {return Math.exp(d);});
    var exp_sum = exps.reduce((a, b) => a + b, 0);
    var probs = exps.map(function(e) {return e / exp_sum;});
    var r = Math.random();
    var selected_idx = probs.findIndex((p,i) => ((r -= p) < 0));
    return patterns[selected_idx].pattern;
}
function fill_pattern(pattern, sentence) {
    return pattern.replace("$TXT", sentence);
}