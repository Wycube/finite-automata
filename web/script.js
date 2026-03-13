import init from "./pkg/automata.js";
import * as graphstuff from "./graph.js";
import * as editor from "./editor.js";
import * as props from "./properties.js";


function onClear() {
    graphstuff.clearGraph();
    editor.clearSelection();
    props.updateProperties();
    editor.refreshEditor();
}

function testDFA() {
    let testText = document.getElementById("test-text");
    graphstuff.testDFA(testText);
}

function testNFA() {
    let testText = document.getElementById("test-text");
    graphstuff.testNFA(testText);
}


//Load wasm module then initialize everything
init().then(function() {
    let canvas = document.getElementById("canvas");
    let svg = document.getElementById("svg");
    graphstuff.loadGraph();
    props.initPropertiesPanel();
    editor.initRenderer();
    editor.addEventListeners(canvas);
    editor.addEventListeners(svg);
    editor.refreshEditor();
    
    window.onbeforeunload = graphstuff.saveGraph;
    document.getElementById("backend-button").onclick = editor.switchBackend;
    document.getElementById("clear-button").onclick = onClear;
    document.getElementById("print-button").onclick = graphstuff.printGraph;
    document.getElementById("test-dfa").onclick = testDFA;
    document.getElementById("test-nfa").onclick = testNFA;
});