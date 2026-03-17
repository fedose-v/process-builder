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

// Midpoint of a cubic bezier at t=0.5:
// For our symmetric control points the formula simplifies to ((x1+x2)/2, (y1+y2)/2)
function cubicMidpoint(x1, y1, x2, y2) {
  var dy = Math.abs(y2 - y1);
  var cp = Math.max(60, dy * 0.5);
  // B(0.5) for cubic: (P0 + 3P1 + 3P2 + P3) / 8
  var mx = (x1 + 3 * x1 + 3 * x2 + x2) / 8;
  var my = (y1 + 3 * (y1 + cp) + 3 * (y2 - cp) + y2) / 8;
  return { x: mx, y: my };
}

function renderConnections() {
  svgLayer.querySelectorAll('.conn-group, .connection-line:not(.preview)').forEach(function(e) { e.remove(); });

  connections.forEach(function(conn, i) {
    var fromPort = conn.fromPort || 'out';
    var from = getPortCenter(conn.from, fromPort);
    var to   = getPortCenter(conn.to, 'in');
    var d    = cubicPath(from.x, from.y, to.x, to.y);
    var mid  = cubicMidpoint(from.x, from.y, to.x, to.y);

    var isYes  = fromPort === 'out_yes';
    var isNo   = fromPort === 'out_no';
    var color  = isYes ? '#22c55e' : (isNo ? '#ef4444' : '#7c6aff');
    var arrow  = isYes ? 'arrow-yes' : (isNo ? 'arrow-no' : 'arrow');

    // ── Group ──────────────────────────────────────────────
    var g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.classList.add('conn-group');

    // Wide transparent hit zone (easier to click than a 2px line)
    var hit = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    hit.classList.add('conn-hit');
    hit.setAttribute('d', d);

    // Visible line
    var line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    line.classList.add('connection-line');
    if (isYes) line.classList.add('yes');
    else if (isNo) line.classList.add('no');
    line.setAttribute('marker-end', 'url(#' + arrow + ')');
    line.setAttribute('d', d);

    // Delete badge (× button at midpoint)
    var badge = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    badge.classList.add('conn-delete');
    badge.setAttribute('transform', 'translate(' + mid.x + ',' + mid.y + ')');

    var circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('r', '9');
    circle.setAttribute('fill', '#1a1d2e');
    circle.setAttribute('stroke', color);
    circle.setAttribute('stroke-width', '1.5');

    var cross = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    cross.setAttribute('text-anchor', 'middle');
    cross.setAttribute('dominant-baseline', 'central');
    cross.setAttribute('fill', color);
    cross.setAttribute('font-size', '12');
    cross.setAttribute('font-weight', '700');
    cross.textContent = '×';

    badge.appendChild(circle);
    badge.appendChild(cross);

    // ── Delete logic ───────────────────────────────────────
    function removeConn(e) {
      e.stopPropagation();
      connections.splice(i, 1);
      renderConnections();
    }

    // Show / hide badge on hover over hit zone or badge itself
    function showBadge() { badge.style.opacity = '1'; line.style.opacity = '1'; line.style.strokeWidth = '3'; }
    function hideBadge() { badge.style.opacity = '0'; line.style.opacity = '0.7'; line.style.strokeWidth = ''; }

    hit.addEventListener('mouseenter', showBadge);
    hit.addEventListener('mouseleave', hideBadge);
    badge.addEventListener('mouseenter', showBadge);
    badge.addEventListener('mouseleave', hideBadge);
    hit.addEventListener('click', removeConn);
    badge.addEventListener('click', removeConn);

    g.appendChild(hit);
    g.appendChild(line);
    g.appendChild(badge);
    svgLayer.appendChild(g);
  });
}
