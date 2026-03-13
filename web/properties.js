import * as editor from "./editor.js";
import * as graphstuff from "./graph.js";


export function initPropertiesPanel() {
    document.getElementById("node-name").oninput = onNodeNameChanged;
    document.getElementById("node-accept").oninput = onNodeAcceptChanged;
    document.getElementById("node-start").onclick = onNodeStartClicked;

    document.getElementById("link-text").oninput = onLinkTextChanged;
    document.getElementById("link-epsilon").oninput = onLinkEpsilonChanged;
}

export function updateProperties() {
    let nodePanel = document.getElementById("node");
    let linkPanel = document.getElementById("link");
    nodePanel.hidden = true;
    linkPanel.hidden = true;

    if(editor.selected.type == 0) {
        nodePanel.hidden = false;
        let nodeName = document.getElementById("node-name");
        nodeName.value = graphstuff.graph.states[editor.selected.index].name;
        let nodeAccept = document.getElementById("node-accept");
        nodeAccept.checked = graphstuff.graph.states[editor.selected.index].accept;
    } else if(editor.selected.type == 1) {
        linkPanel.hidden = false;
        let linkText = document.getElementById("link-text");
        linkText.value = graphstuff.getLinkTextNoEpsilon(editor.selected.index).replaceAll(" ", "");
        document.getElementById("symbols-error").hidden = true;
        let linkEpsilon = document.getElementById("link-epsilon");
        linkEpsilon.checked = graphstuff.graph.transitions[editor.selected.index].epsilon;
    }
}

function onNodeNameChanged() {
    if(editor.selected.type != 0) {
        return;
    }

    let nodeName = document.getElementById("node-name");
    graphstuff.getState(editor.selected.index).state.name = nodeName.value;
    editor.refreshEditor();
}

function onNodeAcceptChanged() {
    if(editor.selected.type != 0) {
        return;
    }

    let nodeAccept = document.getElementById("node-accept");
    graphstuff.getState(editor.selected.index).state.accept = nodeAccept.checked;
    editor.refreshEditor();
}

function onNodeStartClicked() {
    if(editor.selected.type != 0) {
        return;
    }

    graphstuff.setStart(editor.selected.index);
    editor.refreshEditor();
}

function onLinkTextChanged() {
    if(editor.selected.type != 1) {
        return;
    }

    document.getElementById("symbols-error").hidden = true;
    let linkText = document.getElementById("link-text");
    let text = linkText.value;
    let symbols = text.split(",");
    let validSymbols = [];
    if(text != "") {
        for(let c of symbols) {
            if(c.length != 1) {
                document.getElementById("symbols-error").hidden = false;
                return;
            }
            
            if(validSymbols.indexOf(c) != -1) {
                document.getElementById("symbols-error").hidden = false;
                return;
            }
    
            validSymbols.push(c);
        }
    }
    graphstuff.getTransition(editor.selected.index).transition.symbols = validSymbols;
    editor.refreshEditor();
}

function onLinkEpsilonChanged() {
    if(editor.selected.type != 1) {
        return;
    }

    let epsilon = document.getElementById("link-epsilon");
    graphstuff.getTransition(editor.selected.index).transition.epsilon = epsilon.checked;
    editor.refreshEditor();
}