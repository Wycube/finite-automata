//TODO: Add stuff for setting font size, line width, etc.
class Renderer {
    constructor(backends) {
        this.backends = backends
        this.selectedBackend = 0
    }

    setColor(color) {
        this.backends[this.selectedBackend].setColor(color);
    }

    getColor() {
        return this.backends[this.selectedBackend].getColor();
    }
    
    clear() {
        this.backends[this.selectedBackend].clear();
    }

    drawLine(start, end) {
        this.backends[this.selectedBackend].drawLine(start, end);
    }

    drawArrow(pos, dir) {
        this.backends[this.selectedBackend].drawArrow(pos, dir);
    }

    drawCircle(center, radius) {
        this.backends[this.selectedBackend].drawCircle(center, radius);
    }

    fillCircle(center, radius) {
        this.backends[this.selectedBackend].fillCircle(center, radius);
    }

    drawArc(center, radius, a1, a2) {
        this.backends[this.selectedBackend].drawArc(center, radius, a1, a2);
    }

    fillText(pos, text) {
        this.backends[this.selectedBackend].fillText(pos, text);
    }
}

class CanvasBackend {
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d");
    }

    setColor(color) {
        this.context.strokeStyle = color;
        this.context.fillStyle = color;
    }

    getColor() {
        return this.context.fillStyle;
    }

    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    drawLine(start, end) {
        this.context.beginPath();
        this.context.moveTo(start[0], start[1]);
        this.context.lineTo(end[0], end[1]);
        this.context.stroke();
    }

    drawArrow(pos, dir) {
        this.context.beginPath();
        this.context.moveTo(pos[0], pos[1]);
        this.context.lineTo(pos[0] - dir[0] * 7 + dir[1] * 5, pos[1] - dir[1] * 7 - dir[0] * 5);
        this.context.lineTo(pos[0] - dir[0] * 7 - dir[1] * 5, pos[1] - dir[1] * 7 + dir[0] * 5);
        this.context.lineTo(pos[0], pos[1]);
        this.context.fill();
    }

    drawCircle(center, radius) {
        this.context.beginPath();
        this.context.arc(center[0], center[1], radius, 0, 2 * Math.PI);
        this.context.stroke();
    }
    
    fillCircle(center, radius) {
        this.context.beginPath();
        this.context.arc(center[0], center[1], radius, 0, 2 * Math.PI);
        this.context.fill();
    }

    drawArc(center, radius, a1, a2) {
        this.context.beginPath();
        this.context.arc(center[0], center[1], radius, a1, a2);
        this.context.stroke();
    }

    fillText(pos, text) {
        this.context.fillText(text, pos[0], pos[1]);
    }
}

class SvgBackend {
    constructor(svg) {
        this.svg = svg;
        this.color = "black";
    }

    setColor(color) {
        this.color = color;
    }

    getColor() {
        return this.color;
    }

    clear() {
        this.svg.innerHTML = "";
    }

    drawLine(start, end) {
        let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let pathStr = "M " + start[0] + " " + start[1];
        pathStr += " L " + end[0] + " " + end[1];
        path.setAttribute("d", pathStr);
        path.setAttribute("style", "fill:transparent;stroke:" + this.color + ";stroke-width:1px");
        this.svg.appendChild(path);
    }

    drawArrow(pos, dir) {
        var pos2 = [pos[0] - dir[0] * 7 + dir[1] * 5, pos[1] - dir[1] * 7 - dir[0] * 5];
        var pos3 = [pos[0] - dir[0] * 7 - dir[1] * 5, pos[1] - dir[1] * 7 + dir[0] * 5];
        var poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        poly.setAttribute("points", pos[0] + "," + pos[1] + " " + pos2[0] + "," + pos2[1] + " " + pos3[0] + "," + pos3[1]);
        poly.setAttribute("style", "fill:" + this.color);
        this.svg.appendChild(poly);
    }

    drawCircle(center, radius) {
        let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", radius);
        circle.setAttribute("cx", center[0]);
        circle.setAttribute("cy", center[1]);
        circle.setAttribute("style", "fill:transparent;stroke:" + this.color + ";stroke-width:1px");
        this.svg.appendChild(circle);
    }
    
    fillCircle(center, radius) {
        let circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("r", radius);
        circle.setAttribute("cx", center[0]);
        circle.setAttribute("cy", center[1]);
        circle.setAttribute("style", "fill:" + this.color);
        this.svg.appendChild(circle);
    }

    drawArc(center, radius, a1, a2) {
        let start = [center[0] + Math.cos(a1) * radius, center[1] + Math.sin(a1) * radius];
        let end = [center[0] + Math.cos(a2) * radius, center[1] + Math.sin(a2) * radius];
        let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let pathStr = "M " + start[0] + " " + start[1];
        let large_flag = Math.abs(a2 - a1) >= Math.PI ? 1 : 0;
        if(a2 < a1) {
            large_flag = large_flag ? 0 : 1;
        }
        pathStr += " A " + radius + " " + radius + " 0 " + large_flag + " 1 " + end[0] + " " + end[1];
        path.setAttribute("d", pathStr);
        path.setAttribute("style", "fill:transparent;stroke:" + this.color + ";stroke-width:1px");
        this.svg.appendChild(path);
    }

    fillText(pos, text) {
        var txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.textContent = text;
        txt.setAttribute("x", pos[0]);
        txt.setAttribute("y", pos[1]);
        txt.setAttribute("fill", this.color);
        txt.setAttribute("font-size", "12px");
        txt.style.userSelect = "none";
        this.svg.appendChild(txt);
    }
}

export {Renderer, CanvasBackend, SvgBackend}