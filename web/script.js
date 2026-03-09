//import init, { greet } from "./pkg/automata.js";


//init();
let canvas = document.getElementById("canvas");
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

let graph = {nodes: [], connections: [], start: 0};
let positions = [];
let links = [];
let selected = {type: -1, index: -1, held: false};

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

function drawArrow(context, pos, dir) {
    context.beginPath();
    context.moveTo(pos[0], pos[1]);
    context.lineTo(pos[0] - dir[0] * 7 + dir[1] * 5, pos[1] - dir[1] * 7 - dir[0] * 5);
    context.lineTo(pos[0] - dir[0] * 7 - dir[1] * 5, pos[1] - dir[1] * 7 + dir[0] * 5);
    context.lineTo(pos[0], pos[1]);
    context.fill();
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
        return 0;
    }

    //a1t – a2s = b2 – b1
    //c1t – c2s = d2 – d1

    //t - a2/a1 s = (b2 - b1) / a1
    //t - c2/c1 s = (d2 - d1) / c1

    //t - a2/a1 s = (b2 - b1) / a1
    //0 - (c2/c1 - a2/a1) s = (d2 - d1) / c1 - (b2 - b1) / a1

    //t = (b2 - b1) / a1 + a2/a1 s
    //s = [(b2 - b1) / a1 - (d2 - d1) / c1] / (c2/c1 - a2/a1)

    //t = (b2 - b1) / a1 + a2/a1 * [(b2 - b1) / a1 - (d2 - d1) / c1] / (c2/c1 - a2/a1)

    //s = (c1 t - d2 + d1) / c2

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

function drawGraph(context) {
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "black";

    //Draw nodes
    for(let i in positions) {
        if(selected.type == 0 && selected.index == i) {
            context.fillStyle = "blue";
            context.strokeStyle = "blue";
        }
        
        let pos = positions[i];
        let node = graph.nodes[i];
        context.beginPath();
        context.arc(pos[0], pos[1], 20, 0, 2 * Math.PI);
        context.stroke();

        if(node[1]) {
            context.beginPath();
            context.arc(pos[0], pos[1], 16, 0, 2 * Math.PI);
            context.stroke();
        }
        
        let nameSize = context.measureText(node[0]);
        context.fillText(node[0], pos[0] - nameSize.width / 2, pos[1] + nameSize.fontBoundingBoxDescent);

        //Draw start arrow
        if(i == graph.start) {
            context.beginPath();
            context.moveTo(pos[0] - 40, pos[1]);
            context.lineTo(pos[0] - 20, pos[1]);
            context.stroke();
            let tip = [pos[0] - 20, pos[1]];
            let dir = [1, 0];
            drawArrow(context, tip, dir);
        }
        
        if(selected.type == 0 && selected.index == i) {
            context.fillStyle = "black";
            context.strokeStyle = "black";
        }
    }

    //Draw connections
    for(let i in links) {
        if(selected.type == 1 && selected.index == i) {
            context.fillStyle = "blue";
            context.strokeStyle = "blue";
        }

        if(links[i][0] == links[i][1]) {
            let pos = positions[links[i][0]];
            let pos2 = [pos[0] + 30 * Math.cos(links[i][2]), pos[1] + 30 * Math.sin(links[i][2])];
            let intersect = getIntersection(pos, pos2, 20, 15);
            let a1 = Math.atan2(intersect[0][1] - pos2[1], intersect[0][0] - pos2[0]);
            let a2 = Math.atan2(intersect[1][1] - pos2[1], intersect[1][0] - pos2[0]);
            context.beginPath();
            context.arc(pos2[0], pos2[1], 15, a1, a2);
            context.stroke();


            let end_edge = [pos[0] + 30 * Math.cos(links[i][2]) + Math.cos(a2) * 15, pos[1] + 30 * Math.sin(links[i][2]) + Math.sin(a2) * 15];
            let norm = Math.sqrt(Math.pow(end_edge[0] - pos[0], 2) + Math.pow(end_edge[1] - pos[1], 2));
            let diff = [-(end_edge[0] - pos[0]) / norm, -(end_edge[1] - pos[1]) / norm];
            drawArrow(context, end_edge, diff);

            //Text position
            //Find closest corner and move middle of AABB along normal from the center of the line so that the bounding box is
            //a little bit away from the line at all times while the middle is minimal distance from the middle of the line.
            //Not so great for large lines of text but great for small ones, which is what we're working with.
            let box = context.measureText(graph.connections[i]);
            let middle = [pos[0] + 45 * Math.cos(links[i][2]), pos[1] + 45 * Math.sin(links[i][2])];
            let normal = [Math.cos(links[i][2]), Math.sin(links[i][2])];

            //Get corner of the box in direction opposite of the normal
            let height = box.actualBoundingBoxDescent + box.actualBoundingBoxAscent;
            let corner = [-normal[0] >= 0 ? box.width / 2 : -box.width / 2, -normal[1] >= 0 ? height / 2 : -height / 2];

            //Project vector from center of box to corner onto the normal
            let projected = Math.abs(normal[0] * corner[0] + normal[1] * corner[1]);

            //Position middle so it is minimal distance away from the line while also keeping the closet corner a specific distance away
            let space = 4;
            let finalPos = [middle[0] + normal[0] * (projected + space) - box.width / 2, middle[1] + normal[1] * (projected + space) + height / 2];

            context.fillText(graph.connections[i], finalPos[0], finalPos[1]);
        } else {
            let link = links[i];
            let start = positions[link[0]];
            let end = link[1] instanceof Array ? link[1] : positions[link[1]];
            let norm = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
            let diff = [(end[0] - start[0]) / norm, (end[1] - start[1]) / norm];
            let start_edge = [start[0] + diff[0] * 20, start[1] + diff[1] * 20];
            let end_edge = link[1] instanceof Array ? end : [end[0] - diff[0] * 20, end[1] - diff[1] * 20];
            let middle = [(start_edge[0] + end_edge[0]) / 2, (start_edge[1] + end_edge[1]) / 2];
            let normal = [diff[1], -diff[0]];

            let curveDist = link[1] instanceof Array ? 0 : Math.abs(link[2]);

            if(link[2] < 0) {
                normal = [-normal[0], -normal[1]];
            }
    
            if(curveDist != 0) {
                let r = calcArcRadius(start, [middle[0] + normal[0] * curveDist, middle[1] + normal[1] * curveDist], end);
                let center = r[1]; //[middle[0] + normal[0] * (curveDist - r), middle[1] + normal[1] * (curveDist - r)];
                let a1 = Math.atan2(start[1] - center[1], start[0] - center[0]);
                let a2 = Math.atan2(end[1] - center[1], end[0] - center[0]);
                let extra = 20 / r[0];

                if(link[2] < 0) {
                    extra *= -1;
                }

                context.beginPath();
                context.arc(center[0], center[1], r[0], a1 + extra, a2 - extra, link[2] < 0);
                context.stroke();

                context.strokeStyle = "green";
                context.beginPath();
                context.moveTo(start[0], start[1]);
                context.lineTo(middle[0] + normal[0] * curveDist, middle[1] + normal[1] * curveDist)
                context.lineTo(end[0], end[1]);
                context.stroke();
                context.beginPath();
                context.arc(center[0], center[1], 5, 0, 2 * Math.PI);
                context.fill();
                context.strokeStyle = "black";

                let new_end_edge = [center[0] + Math.cos(a2 - extra) * r[0], center[1] + Math.sin(a2 - extra) * r[0]];
                let new_diff_norm = Math.sqrt(Math.pow(end[0] - new_end_edge[0], 2) + Math.pow(end[1] - new_end_edge[1], 2));
                let new_diff = [(end[0] - new_end_edge[0]) / new_diff_norm, (end[1] - new_end_edge[1]) / new_diff_norm];
                drawArrow(context, new_end_edge, new_diff);
            } else {
                context.beginPath();
                context.moveTo(start_edge[0], start_edge[1]);
                context.lineTo(end_edge[0], end_edge[1]);
                context.stroke();
                drawArrow(context, end_edge, diff);
            }


            //Text position
            //Find closest corner and move middle of AABB along normal from the center of the line so that the bounding box is
            //a little bit away from the line at all times while the middle is minimal distance from the middle of the line.
            //Not so great for large lines of text but great for small ones, which is what we're working with.
            let box = context.measureText(graph.connections[i]);

            //Get corner of the box in direction opposite of the normal
            let height = box.actualBoundingBoxDescent + box.actualBoundingBoxAscent;
            let corner = [-normal[0] >= 0 ? box.width / 2 : -box.width / 2, -normal[1] >= 0 ? height / 2 : -height / 2];

            //Project vector from center of box to corner onto the normal
            let projected = Math.abs(normal[0] * corner[0] + normal[1] * corner[1]);

            //Position middle so it is minimal distance away from the line while also keeping the closet corner a specific distance away
            let space = 4;
            let finalPos = [middle[0] + normal[0] * (projected + space + curveDist) - box.width / 2, middle[1] + normal[1] * (projected + space + curveDist) + height / 2];

            context.fillText(graph.connections[i], finalPos[0], finalPos[1]);
        }

        if(selected.type == 1 && selected.index == i) {
            context.fillStyle = "black";
            context.strokeStyle = "black";
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
        nodeName.value = graph.nodes[selected.index][0];
        let nodeAccept = document.getElementById("node-accept");
        nodeAccept.checked = graph.nodes[selected.index][1];
    } else if(selected.type == 1) {
        linkPanel.hidden = false;
        let linkText = document.getElementById("link-text");
        linkText.value = graph.connections[selected.index];
    }
}

function onNodeNameChanged() {
    if(selected.type != 0) {
        return;
    }

    let nodeName = document.getElementById("node-name");
    graph.nodes[selected.index][0] = nodeName.value;
    let context = canvas.getContext("2d");
    drawGraph(context);
}

function onNodeAcceptChanged() {
    if(selected.type != 0) {
        return;
    }

    let nodeAccept = document.getElementById("node-accept");
    graph.nodes[selected.index][1] = nodeAccept.checked;
    let context = canvas.getContext("2d");
    drawGraph(context);
}

function onNodeStartClicked() {
    if(selected.type != 0) {
        return;
    }

    let nodeStart = document.getElementById("node-start");
    graph.start = selected.index;
    let context = canvas.getContext("2d");
    drawGraph(context);
}

function onLinkTextChanged() {
    if(selected.type != 1) {
        return;
    }

    let linkText = document.getElementById("link-text");
    graph.connections[selected.index] = linkText.value;
    let context = canvas.getContext("2d");
    drawGraph(context);
}

canvas.addEventListener("dblclick", function(event) {
    if(selected.type != -1) {
        return;
    }

    positions.push([event.offsetX, event.offsetY]);
    selected.type = 0;
    selected.index = positions.length - 1;
    selected.held = false;
    graph.nodes.push(["name", false]);
    let context = canvas.getContext("2d");
    drawGraph(context);
    updateProperties();
})

let curveHeld = false;

canvas.addEventListener("mousedown", function(event) {
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
        for(let link of links) {
            if(link[0] == link[1]) {
                let pos = [positions[link[0]][0], positions[link[0]][1]];
                pos[0] += 30 * Math.cos(link[2]);
                pos[1] += 30 * Math.sin(link[2]);
                let dist = Math.sqrt(Math.pow(event.offsetX - pos[0], 2) + Math.pow(event.offsetY - pos[1], 2)) - 15;
                if(Math.abs(dist) < 10) {
                    selected.type = 1;
                    selected.index = links.indexOf(link);
                    selected.held = true;
                    curveHeld = event.shiftKey;
                    break;
                }
            } else {
                let dist_sq = Infinity;
                let a = positions[link[0]];
                let b = link[1] instanceof Array ? link[1] : positions[link[1]];
                let c = [event.offsetX, event.offsetY];

                if(link[2] == 0) {
                    dist_sq = distanceToLine(c, a, b);
                } else {
                    let middle = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
                    let norm = Math.sqrt(Math.pow(b[0] - a[0], 2) + Math.pow(b[1] - a[1], 2));
                    let diff = [(b[0] - a[0]) / norm, (b[1] - a[1]) / norm];
                    let normal = [diff[1], -diff[0]];
                    let r = calcArcRadius(a, [middle[0] + normal[0] * link[2], middle[1] + normal[1] * link[2]], b);
                    let center = r[1]; //[middle[0] + normal[0] * (link[2] - r), middle[1] + normal[1] * (link[2] - r)];
                    let a1 = Math.atan2(a[1] - center[1], a[0] - center[0]);
                    let a2 = Math.atan2(b[1] - center[1], b[0] - center[0]);
                    let angle = Math.atan2(event.offsetY - center[1], event.offsetX - center[0]);
                    
                    if(link[2] < 0) {
                        let temp = a1;
                        a1 = a2;
                        a2 = temp;
                    }

                    //Only get distance if the angle is within the arc
                    //TODO: Handle arcs with negative radius
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
                    selected.index = links.indexOf(link);
                    selected.held = true;
                    curveHeld = event.shiftKey && !(link[1] instanceof Array);
                    break;
                }
            }
        }
    }

    if(event.shiftKey && selected.type == 0) {
        links.push([selected.index, selected.index, 0]);
        graph.connections.push("link");
        selected.type = 1;
        selected.index = links.length - 1;
        selected.held = true;
    }

    let context = canvas.getContext("2d");
    drawGraph(context);
    updateProperties();
})

canvas.addEventListener("mouseup", function(event) {
    selected.held = false;
    curveHeld = false;
})

canvas.addEventListener("mouseleave", function(event) {
    selected.held = false;
    curveHeld = false;
})

canvas.addEventListener("mousemove", function(event) {
    if(selected.type == 0 && selected.held) {
        positions[selected.index] = [Math.floor(event.offsetX / 5) * 5, Math.floor(event.offsetY / 5) * 5];
    }
    if(selected.type == 1 && selected.held) {
        if(curveHeld && !(links[selected.index][0] == links[selected.index][1])) {
            let a = positions[links[selected.index][0]];
            let b = links[selected.index][1] instanceof Array ? links[selected.index][1] : positions[links[selected.index][1]];
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
            console.log(new_diff);
            diff = new_diff;

            if(Math.abs(diff) < 10) {
                diff = 0;
            }

            links[selected.index][2] = diff * Math.sign(dot);
        } else if(curveHeld) {
            //Repurpose curve offset as angle for circular link
            let center = positions[links[selected.index][0]];
            links[selected.index][2] = Math.atan2(event.offsetY - center[1], event.offsetX - center[0]);
        } else {
            links[selected.index][1] = [Math.floor(event.offsetX / 5) * 5, Math.floor(event.offsetY / 5) * 5];
            links[selected.index][2] = 0;
            for(let i in positions) {
                let pos = positions[i];
                if(Math.pow(event.offsetX - pos[0], 2) + Math.pow(event.offsetY - pos[1], 2) < 400) {
                    links[selected.index][1] = i;
                    break;
                }
            }
        }
    }

    let context = canvas.getContext("2d");
    drawGraph(context);
})