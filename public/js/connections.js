// ═══════════════════════════════════════════════════════════
// CONNECTIONS
// ═══════════════════════════════════════════════════════════
function startConnecting(e, nodeId, portType) {
  connectingFrom = { nodeId: nodeId, portType: portType };
  previewLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  previewLine.classList.add('connection-line', 'preview');
  previewLine.setAttribute('marker-end', 'url(#arrow)');
  svgLayer.appendChild(previewLine);
}

function finishConnection(toNodeId) {
  if (!connectingFrom) return;
  var existing = connections.find(function(c) {
    return c.from === connectingFrom.nodeId && c.fromPort === connectingFrom.portType && c.to === toNodeId;
  });
  if (!existing && connectingFrom.nodeId !== toNodeId) {
    connections.push({ from: connectingFrom.nodeId, fromPort: connectingFrom.portType, to: toNodeId });
    renderConnections();
  }
  cancelConnecting();
}

function cancelConnecting() {
  if (previewLine) { previewLine.remove(); previewLine = null; }
  connectingFrom = null;
}

function getPortCenter(nodeId, portType) {
  var el = document.getElementById(nodeId);
  if (!el) return { x: 0, y: 0 };
  var port = el.querySelector('[data-port="' + portType + '"]');
  var wrapRect = document.getElementById('canvasWrap').getBoundingClientRect();
  if (port) {
    var r = port.getBoundingClientRect();
    return {
      x: r.left + r.width / 2 - wrapRect.left,
      y: r.top + r.height / 2 - wrapRect.top
    };
  }
  var r = el.getBoundingClientRect();
  var cx = r.left + r.width / 2 - wrapRect.left;
  if (portType === 'in') return { x: cx, y: r.top - wrapRect.top };
  return { x: cx, y: r.bottom - wrapRect.top };
}

function cubicPath(x1, y1, x2, y2) {
  var dy = Math.abs(y2 - y1);
  var cp = Math.max(60, dy * 0.5);
  return 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + (y1 + cp) + ', ' + x2 + ' ' + (y2 - cp) + ', ' + x2 + ' ' + y2;
}

function renderConnections() {
  // Clear old SVG paths and HTML delete buttons
  svgLayer.querySelectorAll('.conn-group, .connection-line:not(.preview)').forEach(function(e) { e.remove(); });
  canvas.querySelectorAll('.conn-del-btn').forEach(function(e) { e.remove(); });

  connections.forEach(function(conn, i) {
    var fromPort = conn.fromPort || 'out';
    var from = getPortCenter(conn.from, fromPort);
    var to   = getPortCenter(conn.to, 'in');
    var d    = cubicPath(from.x, from.y, to.x, to.y);

    var isYes = fromPort === 'out_yes';
    var isNo  = fromPort === 'out_no';
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

    var btn = document.createElement('div');
    btn.className = 'conn-del-btn';
    btn.style.left  = btnX + 'px';
    btn.style.top   = btnY + 'px';
    btn.style.borderColor = color;
    btn.style.color = color;
    btn.title = 'Remove connection';
    btn.textContent = '×';

    // Highlight SVG line on button hover
    btn.addEventListener('mouseenter', function() {
      line.classList.add('conn-highlight');
    });
    btn.addEventListener('mouseleave', function() {
      line.classList.remove('conn-highlight');
    });

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      connections.splice(i, 1);
      renderConnections();
    });

    canvas.appendChild(btn);
  });
}
