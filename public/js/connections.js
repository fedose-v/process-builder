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
  svgLayer.querySelectorAll('.connection-line:not(.preview)').forEach(function(e) { e.remove(); });
  connections.forEach(function(conn, i) {
    var fromPort = conn.fromPort || 'out';
    var from = getPortCenter(conn.from, fromPort);
    var to = getPortCenter(conn.to, 'in');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    var isYes = fromPort === 'out_yes';
    var isNo = fromPort === 'out_no';
    path.classList.add('connection-line');
    if (isYes) { path.classList.add('yes'); path.setAttribute('marker-end', 'url(#arrow-yes)'); }
    else if (isNo) { path.classList.add('no'); path.setAttribute('marker-end', 'url(#arrow-no)'); }
    else { path.setAttribute('marker-end', 'url(#arrow)'); }
    path.setAttribute('d', cubicPath(from.x, from.y, to.x, to.y));
    path.dataset.connIndex = i;
    path.addEventListener('click', (function(idx) {
      return function() {
        if (confirm('Remove this connection?')) {
          connections.splice(idx, 1);
          renderConnections();
        }
      };
    })(i));
    svgLayer.appendChild(path);
  });
}
