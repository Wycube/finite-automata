import init, {GraphRef} from "./pkg/automata.js";
import {Renderer, CanvasBackend, SvgBackend} from "./renderer.js";


init();
let canvas = document.getElementById("canvas");
if(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    
    if(canvas.getContext) {
        let context = canvas.getContext('2d');
        context.scale(dpr, dpr);
        context.font = "12px serif";
    }
}

let svg = document.getElementById("svg");
let renderer = new Renderer([new CanvasBackend(canvas), new SvgBackend(svg)]);

svg.style.display = "none";
let workarea = canvas;

let graph = {states: [], transitions: [], start: 0};
let positions = [];
let links = [];
let selected = {type: -1, index: -1, held: false};

if(localStorage.getItem("graph") != null && localStorage.getItem("positions") != null && localStorage.getItem("links") != null) {
    graph = JSON.parse(localStorage.getItem("graph"));
    positions = JSON.parse(localStorage.getItem("positions"));
    links = JSON.parse(localStorage.getItem("links"));
    drawGraph(renderer);
}

function saveGraph() {
    localStorage.setItem("graph", JSON.stringify(graph));
    localStorage.setItem("positions", JSON.stringify(positions));
    localStorage.setItem("links", JSON.stringify(links));
}

function onBackendSwitch() {
    renderer.selectedBackend = renderer.selectedBackend == 0 ? 1 : 0;
    if(renderer.selectedBackend == 0) {
        canvas.style.display = "";
        svg.style.display = "none";
        document.getElementById("renderer-text").innerText = "Canvas Renderer";
    } else {
        canvas.style.display = "none";
        svg.style.display = "";
        document.getElementById("renderer-text").innerText = "SVG Renderer";
    }

    drawGraph(renderer);
}
document.getElementById("backend-button").onclick = onBackendSwitch;

function onClear() {
    graph = {states: [], transitions: [], start: 0};
    positions = [];
    links = [];
    selected = {type: -1, index: -1, held: false};

    localStorage.removeItem("graph");
    localStorage.removeItem("positions");
    localStorage.removeItem("links");

    drawGraph(renderer);
}
document.getElementById("clear-button").onclick = onClear;

function getLinkPositions(index) {
    let start = positions[graph.transitions[links[index].index].start];
    let end = graph.transitions[links[index].index].end >= 0 ? positions[graph.transitions[links[index].index].end] : links[index].end;
    return [start, end];
}

function getLinkTextNoEpsilon(index) {
    let str = graph.transitions[index].symbols.join(", ");
    return str;
}

function getLinkText(index) {
    let str = getLinkTextNoEpsilon(index);
    if(graph.transitions[index].epsilon) {
        str += str.length > 0 ? ", ε" : "ε";
    }

    return str;
}

function printGraph() {
    let copy = JSON.parse(JSON.stringify(graph));
    for(let i = copy.transitions.length - 1; i >= 0; i--) {
        if(copy.transitions[i].end < 0) {
            copy.transitions.splice(i, 1);
        }
    }

    console.log(JSON.stringify(copy));
    let ref = new GraphRef(JSON.stringify(copy));
    ref.print();
    ref.free();
}
document.getElementById("print-button").onclick = printGraph;

function testDFA() {
    let copy = JSON.parse(JSON.stringify(graph));
    for(let i = copy.transitions.length - 1; i >= 0; i--) {
        if(copy.transitions[i].end < 0) {
            copy.transitions.splice(i, 1);
        }
    }

    let testText = document.getElementById("test-text");
    let ref = new GraphRef(JSON.stringify(copy));
    console.log("Result for " + testText.value + ": " + ref.decide_dfa(testText.value));
    ref.free();
}
document.getElementById("test-dfa").onclick = testDFA;

function testNFA() {
    let copy = JSON.parse(JSON.stringify(graph));
    for(let i = copy.transitions.length - 1; i >= 0; i--) {
        if(copy.transitions[i].end < 0) {
            copy.transitions.splice(i, 1);
        }
    }

    let testText = document.getElementById("test-text");
    let ref = new GraphRef(JSON.stringify(copy));
    console.log("Result for " + testText.value + ": " + ref.decide_nfa(testText.value));
    ref.free();
}
document.getElementById("test-nfa").onclick = testNFA;

function distanceToLine(pos, a, b) {
    let c = pos;
    let ac = [a[0] - c[0], a[1] - c[1]];
    let ab = [a[0] - b[0], a[1] - b[1]];
    let ab_norm = Math.sqrt(ab[0] * ab[0] + ab[1] * ab[1]);
    let ab_normal = [ab[0] / ab_norm, ab[1] / ab_norm];
    let ac_on_ab = ab_normal[0] * ac[0] + ab_normal[1] * ac[1];
    let d = [a[0] - ab_normal[0] * ac_on_ab, a[1] - ab_normal[1] * ac_on_ab];
    d[0] = Math.min(Math.max(Math.min(a[0], b[0]), d[0]), Math.max(a[0], b[0]));
    d[1] = Math.min(Math.max(Math.min(a[1], b[1]), d[1]), Math.max(a[1], b[1]));
    let dist_sq = Math.pow(d[0] - c[0], 2) + Math.pow(d[1] - c[1], 2);

    return dist_sq;
}

function calcArcRadius(a, b, c) {
    let ab_norm = Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
    let ab_dir = [(b[0] - a[0]) / ab_norm, (b[1] - a[1]) / ab_norm];
    let ab_normal = [-ab_dir[1], ab_dir[0]];
    let ab_mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    
    let bc_norm = Math.sqrt(Math.pow(c[0] - b[0], 2) + Math.pow(c[1] - b[1], 2));
    let bc_dir = [(c[0] - b[0]) / bc_norm, (c[1] - b[1]) / bc_norm];
    let bc_normal = [-bc_dir[1], bc_dir[0]];
    let bc_mid = [(b[0] + c[0]) / 2, (b[1] + c[1]) / 2];

    //Check determinant
    let det = bc_normal[0] * ab_normal[1] - ab_normal[0] * bc_normal[1];
    if(det == 0) {
        return [0, [0, 0]];
    }

    //Find intersection of lines normal to AB and BC, use that to determine radius
    let a1 = ab_normal[0];
    let b1 = ab_mid[0];
    let c1 = ab_normal[1];
    let d1 = ab_mid[1];
    let a2 = bc_normal[0];
    let b2 = bc_mid[0];
    let c2 = bc_normal[1];
    let d2 = bc_mid[1];

    let t1 = (b2 - b1) / a1 + a2 / a1 * ((b2 - b1) / a1 - (d2 - d1) / c1) / (c2 / c1 - a2 / a1);
    let center = [b1 + a1 * t1, d1 + c1 * t1];
    let radius = Math.sqrt(Math.pow(b[0] - center[0], 2) + Math.pow(b[1] - center[1], 2));
    
    return [radius, center];
}

function getIntersection(a, b, r1, r2) {
    let d = Math.sqrt(Math.pow(a[0] - b[0], 2) + Math.pow(a[1] - b[1], 2));
    let l = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    let h = Math.sqrt(r1 * r1 - l * l);
    let x1 = l / d * (b[0] - a[0]) + h / d * (b[1] - a[1]) + a[0];
    let y1 = l / d * (b[1] - a[1]) - h / d * (b[0] - a[0]) + a[1];
    
    let x2 = l / d * (b[0] - a[0]) - h / d * (b[1] - a[1]) + a[0];
    let y2 = l / d * (b[1] - a[1]) + h / d * (b[0] - a[0]) + a[1];

    return [[x1, y1], [x2, y2]];
}

function drawNode(renderer, pos, name, isAccept, isStart) {
    let lastColor = renderer.getColor();
    renderer.setColor("white");
    renderer.fillCircle(pos, 20);
    renderer.setColor(lastColor);
    renderer.drawCircle(pos, 20);

    if(isAccept) {
        renderer.drawCircle(pos, 16);
    }

    let context = canvas.getContext("2d");
    let nameSize = context.measureText(name);
    renderer.fillText([pos[0] - nameSize.width / 2, pos[1] + nameSize.fontBoundingBoxDescent], name);

    //Draw start arrow
    if(isStart) {
        renderer.drawLine([pos[0] - 40, pos[1]], [pos[0] - 20, pos[1]]);
        let tip = [pos[0] - 20, pos[1]];
        let dir = [1, 0];
        renderer.drawArrow(tip, dir);
    }
}

function drawTextOffLine(renderer, text, pos, normal, padding) {
    //Find closest corner and move middle of AABB along normal from the center of the line so that the bounding box is
    //a little bit away from the line at all times while the middle is minimal distance from the middle of the line.
    //Not so great for large lines of text but great for small ones, which is what we're working with.
    //TODO: Get text metrics without canvas
    let context = canvas.getContext("2d");
    let box = context.measureText(text);

    //Get corner of the box in direction opposite of the normal
    let height = box.actualBoundingBoxDescent + box.actualBoundingBoxAscent;
    let corner = [-normal[0] >= 0 ? box.width / 2 : -box.width / 2, -normal[1] >= 0 ? height / 2 : -height / 2];

    //Project vector from center of box to corner onto the normal
    let projected = Math.abs(normal[0] * corner[0] + normal[1] * corner[1]);

    //Position middle so it is minimal distance away from the line while also keeping the closet corner a specific distance away
    let finalPos = [pos[0] + normal[0] * (projected + padding) - box.width / 2, pos[1] + normal[1] * (projected + padding) + height / 2];

    renderer.fillText(finalPos, text);
}

function drawLink(renderer, start, end, curve, text, isCycle, isConnected, flip) {
    if(isCycle) {
        let pos = start;
        let pos2 = [pos[0] + 30 * Math.cos(curve), pos[1] + 30 * Math.sin(curve)];
        let intersect = getIntersection(pos, pos2, 20, 15);
        let a1 = Math.atan2(intersect[0][1] - pos2[1], intersect[0][0] - pos2[0]);
        let a2 = Math.atan2(intersect[1][1] - pos2[1], intersect[1][0] - pos2[0]);
        renderer.drawArc(pos2, 15, a1, a2);

        let end_edge = [pos[0] + 30 * Math.cos(curve) + Math.cos(a2) * 15, pos[1] + 30 * Math.sin(curve) + Math.sin(a2) * 15];
        let norm = Math.sqrt(Math.pow(end_edge[0] - pos[0], 2) + Math.pow(end_edge[1] - pos[1], 2));
        let diff = [-(end_edge[0] - pos[0]) / norm, -(end_edge[1] - pos[1]) / norm];
        renderer.drawArrow(end_edge, diff);

        let middle = [pos[0] + 45 * Math.cos(curve), pos[1] + 45 * Math.sin(curve)];
        let normal = [Math.cos(curve), Math.sin(curve)];
        drawTextOffLine(renderer, text, middle, normal, 4);
    } else {
        let norm = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
        let diff = [(end[0] - start[0]) / norm, (end[1] - start[1]) / norm];
        let start_edge = [start[0] + diff[0] * 20, start[1] + diff[1] * 20];
        let end_edge = isConnected ? [end[0] - diff[0] * 20, end[1] - diff[1] * 20] : end;
        let middle = [(start_edge[0] + end_edge[0]) / 2, (start_edge[1] + end_edge[1]) / 2];
        let normal = [diff[1], -diff[0]];

        let curveDist = Math.abs(curve);

        if(curve < 0) {
            normal = [-normal[0], -normal[1]];
        }

        if(curveDist != 0) {
            let r = calcArcRadius(start, [middle[0] + normal[0] * curveDist, middle[1] + normal[1] * curveDist], end);
            let center = r[1];
            let a1 = Math.atan2(start[1] - center[1], start[0] - center[0]);
            let a2 = Math.atan2(end[1] - center[1], end[0] - center[0]);
            let extra = 20 / r[0];

            if(curve < 0) {
                extra *= -1;
            }

            if(curve < 0) {
                renderer.drawArc(center, r[0], a2 - extra, a1 + extra)
            } else {
                renderer.drawArc(center, r[0], a1 + extra, a2 - extra)
            }

            // context.strokeStyle = "green";
            // context.beginPath();
            // context.moveTo(start[0], start[1]);
            // context.lineTo(middle[0] + normal[0] * curveDist, middle[1] + normal[1] * curveDist)
            // context.lineTo(end[0], end[1]);
            // context.stroke();
            // context.beginPath();
            // context.arc(center[0], center[1], 5, 0, 2 * Math.PI);
            // context.fill();
            // context.strokeStyle = "black";

            let new_end_edge = [center[0] + Math.cos(a2 - extra) * r[0], center[1] + Math.sin(a2 - extra) * r[0]];
            let new_diff_norm = Math.sqrt(Math.pow(end[0] - new_end_edge[0], 2) + Math.pow(end[1] - new_end_edge[1], 2));
            let new_diff = [(end[0] - new_end_edge[0]) / new_diff_norm, (end[1] - new_end_edge[1]) / new_diff_norm];
            renderer.drawArrow(new_end_edge, new_diff);
        } else {
            renderer.drawLine(start_edge, end_edge);
            renderer.drawArrow(end_edge, diff);

            if(flip) {
                normal = [-normal[0], -normal[1]];
            }
        }

        drawTextOffLine(renderer, text, middle, normal, 4 + curveDist)
    }
}

function drawGraph(renderer) {
    renderer.setColor("white");
    renderer.clear();
    renderer.setColor("black");

    //Draw connections
    for(let i in links) {
        if(selected.type == 1 && selected.index == i) {
            renderer.setColor("blue");
        }

        let link_pos = getLinkPositions(i);
        let transition = graph.transitions[links[i].index];
        let text = getLinkText(i);
        drawLink(renderer, link_pos[0], link_pos[1], links[i].curve, text, transition.start == transition.end, transition.end >= 0, links[i].flip);

        if(selected.type == 1 && selected.index == i) {
            renderer.setColor("black");
        }
    }

    //Draw nodes
    for(let i in positions) {
        if(selected.type == 0 && selected.index == i) {
            renderer.setColor("blue");
        }
        
        let pos = positions[i];
        let node = graph.states[i];
        drawNode(renderer, pos, node.name, node.accept, graph.start == i);

        if(selected.type == 0 && selected.index == i) {
            renderer.setColor("black");
        }
    }
}

function updateProperties() {
    let nodePanel = document.getElementById("node");
    let linkPanel = document.getElementById("link");
    nodePanel.hidden = true;
    linkPanel.hidden = true;

    if(selected.type == 0) {
        nodePanel.hidden = false;
        let nodeName = document.getElementById("node-name");
        nodeName.value = graph.states[selected.index].name;
        let nodeAccept = document.getElementById("node-accept");
        nodeAccept.checked = graph.states[selected.index].accept;
    } else if(selected.type == 1) {
        linkPanel.hidden = false;
        let linkText = document.getElementById("link-text");
        linkText.value = getLinkTextNoEpsilon(selected.index).replaceAll(" ", "");
        document.getElementById("symbols-error").hidden = true;
        let linkEpsilon = document.getElementById("link-epsilon");
        linkEpsilon.checked = graph.transitions[selected.index].epsilon;
    }
}

function onNodeNameChanged() {
    if(selected.type != 0) {
        return;
    }

    let nodeName = document.getElementById("node-name");
    graph.states[selected.index].name = nodeName.value;
    drawGraph(renderer);
}
document.getElementById("node-name").oninput = onNodeNameChanged;

function onNodeAcceptChanged() {
    if(selected.type != 0) {
        return;
    }

    let nodeAccept = document.getElementById("node-accept");
    graph.states[selected.index].accept = nodeAccept.checked;
    drawGraph(renderer);
}
document.getElementById("node-accept").oninput = onNodeAcceptChanged;

function onNodeStartClicked() {
    if(selected.type != 0) {
        return;
    }

    graph.start = selected.index;
    drawGraph(renderer);
}
document.getElementById("node-start").onclick = onNodeStartClicked;

function onLinkTextChanged() {
    if(selected.type != 1) {
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
    graph.transitions[selected.index].symbols = validSymbols;
    drawGraph(renderer);
}
document.getElementById("link-text").oninput = onLinkTextChanged;

function onLinkEpsilonChanged() {
    if(selected.type != 1) {
        return;
    }

    let epsilon = document.getElementById("link-epsilon");
    graph.transitions[selected.index].epsilon = epsilon.checked;
    drawGraph(renderer);
}
document.getElementById("link-epsilon").oninput = onLinkEpsilonChanged;

workarea.addEventListener("keydown", function(event) {
    if(selected.type == -1) {
        return;
    }
    
    if(event.key == "Delete" || event.key == "Backspace") {
        if(selected.type == 0) {
            //Delete node
            graph.states.splice(selected.index, 1);
            positions.splice(selected.index, 1);
            
            //Update links
            for(let i = links.length - 1; i >= 0; i--) {
                let transition = graph.transitions[links[i].index];
                if(transition.start == selected.index || transition.end == selected.index) {
                    let index = links[i].index;
                    graph.transitions.splice(index, 1);
                    links.splice(i, 1);

                    for(let link of links) {
                        if(link.index > index) {
                            link.index -= 1;
                        }
                    }
                }

                if(transition.start > selected.index) {
                    transition.start -= 1;
                }
                if(transition.end > selected.index) {
                    transition.end -= 1;
                }
            }
        } else {
            //Delete link
            let index = links[selected.index].index;
            graph.transitions.splice(index, 1);
            links.splice(selected.index, 1);

            for(let link of links) {
                if(link.index > index) {
                    link.index -= 1;
                }
            }
        }

        drawGraph(renderer);
        saveGraph();
    }
});

workarea.addEventListener("dblclick", function(event) {
    if(selected.type != -1) {
        return;
    }

    positions.push([event.offsetX, event.offsetY]);
    selected.type = 0;
    selected.index = positions.length - 1;
    selected.held = false;
    graph.states.push({name: "name", accept: false});
    drawGraph(renderer);
    saveGraph();
    updateProperties();
});

let curveHeld = false;

workarea.addEventListener("mousedown", function(event) {
    selected.type = -1;
    selected.index = -1;
    selected.held = false;

    for(let pos of positions) {
        if(Math.pow(event.offsetX - pos[0], 2) + Math.pow(event.offsetY - pos[1], 2) < 400) {
            selected.type = 0;
            selected.index = positions.indexOf(pos);
            selected.held = true;
            break;
        }
    }

    if(selected.type == -1) {
        for(let i in links) {
            let link_pos = getLinkPositions(i);
            let transition = graph.transitions[links[i].index];
            if(transition.start == transition.end) {
                let pos = [link_pos[0][0], link_pos[0][1]];
                pos[0] += 30 * Math.cos(links[i].curve);
                pos[1] += 30 * Math.sin(links[i].curve);
                let dist = Math.sqrt(Math.pow(event.offsetX - pos[0], 2) + Math.pow(event.offsetY - pos[1], 2)) - 15;
                if(Math.abs(dist) < 10) {
                    selected.type = 1;
                    selected.index = i;
                    selected.held = true;
                    curveHeld = event.shiftKey;
                    break;
                }
            } else {
                let dist_sq = Infinity;
                let a = link_pos[0];
                let b = link_pos[1];
                let c = [event.offsetX, event.offsetY];

                if(links[i].curve == 0) {
                    dist_sq = distanceToLine(c, a, b);
                } else {
                    let middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
                    let norm = Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
                    let diff = [(b[0] - a[0]) / norm, (b[1] - a[1]) / norm];
                    let normal = [diff[1], -diff[0]];
                    let r = calcArcRadius(a, [middle[0] + normal[0] * links[i].curve, middle[1] + normal[1] * links[i].curve], b);
                    let center = r[1];
                    let a1 = Math.atan2(a[1] - center[1], a[0] - center[0]);
                    let a2 = Math.atan2(b[1] - center[1], b[0] - center[0]);
                    let angle = Math.atan2(event.offsetY - center[1], event.offsetX - center[0]);
                    
                    if(links[i].curve < 0) {
                        let temp = a1;
                        a1 = a2;
                        a2 = temp;
                    }

                    //Only get distance if the angle is within the arc
                    let a1_n = a1 + Math.PI;
                    let a2_n = a2 + Math.PI;
                    let angle_n = angle + Math.PI;
                    if((a2_n > a1_n && a2_n >= angle_n && angle_n >= a1_n) || (a2_n < a1_n && !(a1_n >= angle_n && angle_n >= a2_n))) {
                        dist_sq = Math.sqrt(Math.pow(event.offsetX - center[0], 2) + Math.pow(event.offsetY - center[1], 2)) - r[0];
                        dist_sq = dist_sq * dist_sq;
                    }
                }
    
                if(dist_sq < 100) {
                    selected.type = 1;
                    selected.index = i;
                    selected.held = true;
                    curveHeld = event.shiftKey && graph.transitions[links[i].index].end >= 0;
                    break;
                }
            }
        }
    }

    if(event.shiftKey && selected.type == 0) {
        graph.transitions.push({start: selected.index, end: selected.index, symbols: ["0"], epsilon: false});
        links.push({index: graph.transitions.length - 1, end: [event.offsetX, event.offsetY], curve: 0, flip: false});
        selected.type = 1;
        selected.index = links.length - 1;
        selected.held = true;
        saveGraph();
    }

    drawGraph(renderer);
    updateProperties();
});

workarea.addEventListener("mouseup", function(event) {
    if(selected.held) {
        saveGraph();
    }

    selected.held = false;
    curveHeld = false;
});

workarea.addEventListener("mouseleave", function(event) {
    if(selected.held) {
        saveGraph();
    }

    selected.held = false;
    curveHeld = false;
});

workarea.addEventListener("mousemove", function(event) {
    if(selected.type == 0 && selected.held) {
        positions[selected.index] = [Math.floor(event.offsetX / 5) * 5, Math.floor(event.offsetY / 5) * 5];
    }
    if(selected.type == 1 && selected.held) {
        let link_pos = getLinkPositions(selected.index);
        let transition = graph.transitions[links[selected.index].index];
        if(curveHeld && transition.start != transition.end) {
            let a = link_pos[0];
            let b = link_pos[1];
            let middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
            let diff = Math.sqrt(Math.pow(middle[0] - event.offsetX, 2) + Math.pow(middle[1] - event.offsetY, 2));
            let ab = [b[0] - a[0], b[1] - a[1]];
            let mmouse = [event.offsetX - middle[0], event.offsetY - middle[1]];
            let dot = ab[1] * mmouse[0] + -ab[0] * mmouse[1];

            let r = calcArcRadius(a, [event.offsetX, event.offsetY], b);
            let center = r[1];
            let cm = [center[0] - middle[0], center[1] - middle[1]];
            let cm_dot = ab[1] * cm[0] + -ab[0] * cm[1];
            let new_diff = r[0] + Math.sign(cm_dot) * Math.sign(dot) * Math.sqrt(Math.pow(center[0] - middle[0], 2) + Math.pow(center[1] - middle[1], 2));
            diff = new_diff;

            if(diff < 10) {
                links[selected.index].flip = dot < 0;
                diff = 0;
            }

            links[selected.index].curve = diff * Math.sign(dot);
        } else if(curveHeld) {
            //Repurpose curve offset as angle for circular link
            let center = link_pos[0];
            links[selected.index].curve = Math.atan2(event.offsetY - center[1], event.offsetX - center[0]);
        } else {
            links[selected.index].end = [Math.floor(event.offsetX / 5) * 5, Math.floor(event.offsetY / 5) * 5];
            links[selected.index].curve = 0;
            graph.transitions[links[selected.index].index].end = -1;
            for(let i in positions) {
                let pos = positions[i];
                if(Math.pow(event.offsetX - pos[0], 2) + Math.pow(event.offsetY - pos[1], 2) < 400) {
                    graph.transitions[links[selected.index].index].end = Number(i);
                    break;
                }
            }
        }
    }

    //Only redraw if something could have moved
    if(selected.held) {
        drawGraph(renderer);
    }
});