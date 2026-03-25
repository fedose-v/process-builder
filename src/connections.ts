// ═══════════════════════════════════════════════════════════
// CONNECTIONS
// ═══════════════════════════════════════════════════════════
function startConnecting(e: MouseEvent, nodeId: string, portType: string): void {
    connectingFrom = {nodeId: nodeId, portType: portType};
    previewLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    previewLine.classList.add('connection-line', 'preview');
    previewLine.setAttribute('marker-end', 'url(#arrow)');
    svgLayer.appendChild(previewLine);
}

function finishConnection(toNodeId: string): void {
    if (!connectingFrom) return;
    var existing = connections.find(function (c) {
        return c.from === connectingFrom!.nodeId && c.fromPort === connectingFrom!.portType && c.to === toNodeId;
    });
    if (!existing && connectingFrom.nodeId !== toNodeId) {
        connections.push({from: connectingFrom.nodeId, fromPort: connectingFrom.portType, to: toNodeId});
        renderConnections();
    }
    cancelConnecting();
}

function cancelConnecting(): void {
    if (previewLine) {
        previewLine.remove();
        previewLine = null;
    }
    connectingFrom = null;
}

function getPortCenter(nodeId: string, portType: string): Point {
    var el = document.getElementById(nodeId);
    if (!el) return {x: 0, y: 0};
    var port = el.querySelector('[data-port="' + portType + '"]');
    var wrapRect = document.getElementById('canvasWrap')!.getBoundingClientRect();
    if (port) {
        var r = port.getBoundingClientRect();
        return {
            x: r.left + r.width / 2 - wrapRect.left,
            y: r.top + r.height / 2 - wrapRect.top
        };
    }
    var r = el.getBoundingClientRect();
    var cx = r.left + r.width / 2 - wrapRect.left;
    if (portType === 'in') return {x: cx, y: r.top - wrapRect.top};
    return {x: cx, y: r.bottom - wrapRect.top};
}

function cubicPath(x1: number, y1: number, x2: number, y2: number): string {
    var dy = Math.abs(y2 - y1);
    var cp = Math.max(60, dy * 0.5);
    return 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + (y1 + cp) + ', ' + x2 + ' ' + (y2 - cp) + ', ' + x2 + ' ' + y2;
}

// Sample 24 points along the cubic bezier in canvasWrap-space
function sampleBezier(x1: number, y1: number, x2: number, y2: number): Point[] {
    var dy = Math.abs(y2 - y1);
    var cp = Math.max(60, dy * 0.5);
    var pts: Point[] = [];
    for (var i = 0; i <= 24; i++) {
        var t = i / 24;
        var u = 1 - t;
        pts.push({
            x: u * u * u * x1 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x2,
            y: u * u * u * y1 + 3 * u * u * t * (y1 + cp) + 3 * u * t * t * (y2 - cp) + t * t * t * y2
        });
    }
    return pts;
}

// Per-connection hit data for proximity hover detection
var connHitData: ConnHitEntry[] = [];
var connHoverListenerAdded: boolean = false;

function onConnHover(e: MouseEvent): void {
    var wrap = document.getElementById('canvasWrap')!;
    var rect = wrap.getBoundingClientRect();
    var mx = e.clientX - rect.left;
    var my = e.clientY - rect.top;
    var THRESHOLD = 12; // px in screen/canvasWrap space

    connHitData.forEach(function (h) {
        var near = h.points.some(function (p) {
            var dx = p.x - mx, dy = p.y - my;
            return dx * dx + dy * dy <= THRESHOLD * THRESHOLD;
        });
        h.btn.style.opacity = near ? '1' : '0';
        if (near) h.line.classList.add('conn-highlight');
        else h.line.classList.remove('conn-highlight');
    });
}

function renderConnections(): void {
    // Clear old SVG paths and HTML delete buttons
    svgLayer.querySelectorAll('.conn-group, .connection-line:not(.preview)').forEach(function (e) {
        e.remove();
    });
    canvas.querySelectorAll('.conn-del-btn').forEach(function (e) {
        e.remove();
    });
    connHitData = [];

    // Attach proximity hover listener once
    if (!connHoverListenerAdded) {
        document.getElementById('canvasWrap')!.addEventListener('mousemove', onConnHover);
        connHoverListenerAdded = true;
    }

    connections.forEach(function (conn, i) {
        var fromPort = conn.fromPort || 'out';
        var from = getPortCenter(conn.from, fromPort);
        var to = getPortCenter(conn.to, 'in');
        var d = cubicPath(from.x, from.y, to.x, to.y);

        var isYes = fromPort === 'out_yes';
        var isNo = fromPort === 'out_no';
        var color = isYes ? '#22c55e' : (isNo ? '#ef4444' : '#7c6aff');
        var arrow = isYes ? 'arrow-yes' : (isNo ? 'arrow-no' : 'arrow');

        // ── SVG path (visual only, no pointer events) ──────────
        var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        g.classList.add('conn-group');

        var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        line.classList.add('connection-line');
        if (isYes) line.classList.add('yes');
        else if (isNo) line.classList.add('no');
        line.setAttribute('marker-end', 'url(#' + arrow + ')');
        line.setAttribute('d', d);

        g.appendChild(line);
        svgLayer.appendChild(g);

        // ── HTML delete button inside #canvas ──────────────────
        // Midpoint in canvasWrap-space → convert to canvas-local space
        var midX = (from.x + to.x) / 2;
        var midY = (from.y + to.y) / 2;
        var btnX = (midX - panX) / scale;
        var btnY = (midY - panY) / scale;

        var btn = document.createElement('div') as HTMLDivElement;
        btn.className = 'conn-del-btn';
        btn.style.left = btnX + 'px';
        btn.style.top = btnY + 'px';
        btn.style.borderColor = color;
        btn.style.color = color;
        btn.title = 'Remove connection';
        btn.textContent = '×';

        btn.addEventListener('mouseenter', function () {
            line.classList.add('conn-highlight');
        });
        btn.addEventListener('mouseleave', function () {
            // keep highlight while cursor is near the line
        });

        btn.addEventListener('click', function (e: MouseEvent) {
            e.stopPropagation();
            connections.splice(i, 1);
            renderConnections();
        });

        canvas.appendChild(btn);

        // Register for proximity detection
        connHitData.push({
            btn: btn,
            line: line,
            points: sampleBezier(from.x, from.y, to.x, to.y)
        });
    });
}
