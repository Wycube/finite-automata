import {GraphRef} from "./pkg/automata.js";


export let graph = {states: [], transitions: [], start: 0};
export let positions = [];
export let links = [];

export function addState(name, isAccept, pos) {
    graph.states.push({name: name, accept: isAccept});
    positions.push([pos[0], pos[1]]);
}

export function removeState(index) {
    //Delete node
    graph.states.splice(index, 1);
    positions.splice(index, 1);
                
    //Update links
    for(let i = links.length - 1; i >= 0; i--) {
        let transition = graph.transitions[i];
        if(transition.start == index || transition.end == index) {
            graph.transitions.splice(i, 1);
            links.splice(i, 1);
        }

        if(transition.start > index) {
            transition.start -= 1;
        }
        if(transition.end > index) {
            transition.end -= 1;
        }
    }
}

export function getState(index) {
    return {state: graph.states[index], position: positions[index]};
}

export function setPosition(index, pos) {
    positions[index] = [pos[0], pos[1]];
}

export function setStart(index) {
    graph.start = index;
}

export function addTransition(start, end, isEpsilon, pos, curve, flip) {
    graph.transitions.push({start: start, end: end, symbols: ["0"], epsilon: isEpsilon});
    links.push({end: [pos[0], pos[1]], curve: curve, flip: flip});
}

export function removeTransition(index) {
    graph.transitions.splice(index, 1);
    links.splice(index, 1);
}

export function getTransition(index) {
    return {transition: graph.transitions[index], link: links[index]};
}

export function getLinkPositions(index) {
    let start = positions[graph.transitions[index].start];
    let end = graph.transitions[index].end >= 0 ? positions[graph.transitions[index].end] : links[index].end;
    return [start, end];
}

export function getLinkTextNoEpsilon(index) {
    let str = graph.transitions[index].symbols.join(", ");
    return str;
}

export function getLinkText(index) {
    let str = getLinkTextNoEpsilon(index);
    if(graph.transitions[index].epsilon) {
        str += str.length > 0 ? ", ε" : "ε";
    }

    return str;
}

export function saveGraph() {
    localStorage.setItem("graph", JSON.stringify(graph));
    localStorage.setItem("positions", JSON.stringify(positions));
    localStorage.setItem("links", JSON.stringify(links));
}

export function loadGraph() {
    if(localStorage.getItem("graph") != null && localStorage.getItem("positions") != null && localStorage.getItem("links") != null) {
        graph = JSON.parse(localStorage.getItem("graph"));
        positions = JSON.parse(localStorage.getItem("positions"));
        links = JSON.parse(localStorage.getItem("links"));
    }
}

export function clearGraph() {
    graph = {states: [], transitions: [], start: 0};
    positions = [];
    links = [];

    localStorage.removeItem("graph");
    localStorage.removeItem("positions");
    localStorage.removeItem("links");
}

function getValidGraph() {
    let copy = JSON.parse(JSON.stringify(graph));
    for(let i = copy.transitions.length - 1; i >= 0; i--) {
        if(copy.transitions[i].end < 0 || (copy.transitions[i].symbols.length == 0 && !copy.transitions[i].epsilon)) {
            copy.transitions.splice(i, 1);
        }
    }

    return copy;
}

export function printGraph() {
    let copy = getValidGraph();
    let ref = new GraphRef(JSON.stringify(copy));
    ref.print();
    ref.free();
}

export function testDFA() {
    let copy = getValidGraph();
    let testText = document.getElementById("test-text");
    let ref = new GraphRef(JSON.stringify(copy));
    console.log("Result for " + testText.value + ": " + ref.decide_dfa(testText.value));
    ref.free();
}

export function testNFA() {
    let copy = getValidGraph();
    let testText = document.getElementById("test-text");
    let ref = new GraphRef(JSON.stringify(copy));
    console.log("Result for " + testText.value + ": " + ref.decide_nfa(testText.value));
    ref.free();
}