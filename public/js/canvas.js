// ═══════════════════════════════════════════════════════════
// DRAG NODES
// ═══════════════════════════════════════════════════════════
function startDragNode(e, nodeId) {
  isDraggingNode = true;
  dragNodeId = nodeId;
  var node = nodes[nodeId];
  dragOffsetX = (e.clientX - panX) / scale - node.x;
  dragOffsetY = (e.clientY - panY) / scale - node.y;
}

// ═══════════════════════════════════════════════════════════
// CANVAS MOUSE EVENTS
// ═══════════════════════════════════════════════════════════
function onCanvasMouseDown(e) {
  if (e.target === document.getElementById('canvasWrap') ||
      e.target.classList.contains('canvas-bg') ||
      e.target === document.getElementById('canvas')) {
    if (currentTool === 'select') {
      isPanning = true;
      panStartX = e.clientX - panX;
      panStartY = e.clientY - panY;
      document.getElementById('canvas').classList.add('panning');
    }
    selectNode(null);
  }
}

function onCanvasMouseMove(e) {
  if (isDraggingNode && dragNodeId) {
    var node = nodes[dragNodeId];
    node.x = (e.clientX - panX) / scale - dragOffsetX;
    node.y = (e.clientY - panY) / scale - dragOffsetY;
    var el = document.getElementById(dragNodeId);
    if (el) { el.style.left = node.x + 'px'; el.style.top = node.y + 'px'; }
    renderConnections();
  }
  if (isPanning) {
    panX = e.clientX - panStartX;
    panY = e.clientY - panStartY;
    updateCanvas();
    renderConnections();
  }
  if (connectingFrom && previewLine) {
    var wrapRect = document.getElementById('canvasWrap').getBoundingClientRect();
    var mx = e.clientX - wrapRect.left;
    var my = e.clientY - wrapRect.top;
    var from = getPortCenter(connectingFrom.nodeId, connectingFrom.portType);
    previewLine.setAttribute('d', cubicPath(from.x, from.y, mx, my));
  }
}

function onCanvasMouseUp(e) {
  isDraggingNode = false;
  dragNodeId = null;
  isPanning = false;
  document.getElementById('canvas').classList.remove('panning');
  if (connectingFrom) cancelConnecting();
}

function updateCanvas() {
  canvas.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + scale + ')';
  canvas.style.transformOrigin = '0 0';
}

// ═══════════════════════════════════════════════════════════
// TOOLS & ZOOM
// ═══════════════════════════════════════════════════════════
function setTool(tool) {
  currentTool = tool;
  document.querySelectorAll('.tool-btn').forEach(function(b) { b.classList.remove('active'); });
  var btn = document.getElementById('tool-' + tool);
  if (btn) btn.classList.add('active');
}

function zoom(delta) {
  scale = Math.min(2, Math.max(0.3, scale + delta));
  document.getElementById('zoomLabel').textContent = Math.round(scale * 100) + '%';
  updateCanvas();
  renderConnections();
}

function resetView() {
  scale = 1; panX = 0; panY = 0;
  document.getElementById('zoomLabel').textContent = '100%';
  updateCanvas();
  renderConnections();
}

// ═══════════════════════════════════════════════════════════
// AUTO LAYOUT
// ═══════════════════════════════════════════════════════════
function autoLayout() {
  var nodeIds = Object.keys(nodes);
  if (nodeIds.length === 0) return;

  var children = {};
  var parents = {};
  nodeIds.forEach(function(id) { children[id] = []; parents[id] = []; });
  connections.forEach(function(c) {
    children[c.from].push(c.to);
    parents[c.to].push(c.from);
  });

  var roots = nodeIds.filter(function(id) { return parents[id].length === 0; });
  if (roots.length === 0) return;

  var levels = {};
  var queue = roots.slice();
  roots.forEach(function(r) { levels[r] = 0; });
  while (queue.length) {
    var curr = queue.shift();
    children[curr].forEach(function(child) {
      if (levels[child] === undefined || levels[child] < levels[curr] + 1) {
        levels[child] = levels[curr] + 1;
        queue.push(child);
      }
    });
  }

  var byLevel = {};
  nodeIds.forEach(function(id) {
    var lv = levels[id] !== undefined ? levels[id] : 0;
    if (!byLevel[lv]) byLevel[lv] = [];
    byLevel[lv].push(id);
  });

  var nodeW = 200, nodeH = 100, hGap = 40, vGap = 80;
  Object.entries(byLevel).forEach(function(entry) {
    var lv = entry[0];
    var ids = entry[1];
    var totalW = ids.length * nodeW + (ids.length - 1) * hGap;
    var startX = -totalW / 2 + 400;
    ids.forEach(function(id, i) {
      nodes[id].x = startX + i * (nodeW + hGap);
      nodes[id].y = 60 + parseInt(lv) * (nodeH + vGap);
      var el = document.getElementById(id);
      if (el) { el.style.left = nodes[id].x + 'px'; el.style.top = nodes[id].y + 'px'; }
    });
  });
  renderConnections();
  showToast('Layout applied');
}
