// ═══════════════════════════════════════════════════════════
// NODE DEFINITIONS
// ═══════════════════════════════════════════════════════════
var NODE_DEFS = {
  trigger: {
    event_lead:  { label: 'New Lead',     icon: '⚡', badge: 'TRIGGER', color: '#3b82f6' },
    event_deal:  { label: 'Deal Stage',   icon: '💼', badge: 'TRIGGER', color: '#3b82f6' },
    event_form:  { label: 'Form Submit',  icon: '📋', badge: 'TRIGGER', color: '#3b82f6' },
    schedule:    { label: 'Schedule',     icon: '🕐', badge: 'TRIGGER', color: '#3b82f6' },
    webhook:     { label: 'Webhook',      icon: '🔗', badge: 'TRIGGER', color: '#3b82f6' },
  },
  action: {
    send_email:   { label: 'Send Email',    icon: '📧', badge: 'ACTION',  color: '#7c6aff' },
    send_sms:     { label: 'Send SMS',      icon: '💬', badge: 'ACTION',  color: '#7c6aff' },
    create_task:  { label: 'Create Task',   icon: '✅', badge: 'ACTION',  color: '#7c6aff' },
    update_field: { label: 'Update Field',  icon: '✏️', badge: 'ACTION',  color: '#7c6aff' },
    add_tag:      { label: 'Add Tag',       icon: '🏷️', badge: 'ACTION',  color: '#7c6aff' },
    notify:       { label: 'Notify User',   icon: '🔔', badge: 'ACTION',  color: '#7c6aff' },
    move_stage:   { label: 'Move Stage',    icon: '🚀', badge: 'ACTION',  color: '#7c6aff' },
    webhook_call: { label: 'HTTP Request',  icon: '⚙️', badge: 'ACTION',  color: '#7c6aff' },
  },
  condition: {
    if_else: { label: 'Condition', icon: '🔀', badge: 'LOGIC', color: '#f59e0b' },
  },
  wait: {
    wait_time: { label: 'Wait / Delay', icon: '⏳', badge: 'WAIT', color: '#ec4899' },
  },
  end: {
    end: { label: 'End', icon: '🏁', badge: 'END', color: '#22c55e' },
  }
};

var BADGE_COLORS = {
  TRIGGER: '#3b82f6', ACTION: '#7c6aff', LOGIC: '#f59e0b', WAIT: '#ec4899', END: '#22c55e'
};

// ═══════════════════════════════════════════════════════════
// DRAG FROM PANEL
// ═══════════════════════════════════════════════════════════
function onDragStart(e) {
  draggedType = e.currentTarget.dataset.type;
  draggedSubtype = e.currentTarget.dataset.subtype;
  e.dataTransfer.effectAllowed = 'copy';
}

function onDrop(e) {
  e.preventDefault();
  if (!draggedType) return;
  var rect = document.getElementById('canvasWrap').getBoundingClientRect();
  var x = (e.clientX - rect.left - panX) / scale - 90;
  var y = (e.clientY - rect.top - panY) / scale - 40;
  createNode(draggedType, draggedSubtype, x, y);
  draggedType = null;
  draggedSubtype = null;
  document.getElementById('canvasHint').classList.add('hidden');
}

// ═══════════════════════════════════════════════════════════
// CREATE / RENDER NODE
// ═══════════════════════════════════════════════════════════
function createNode(type, subtype, x, y, config) {
  config = config || {};
  var id = 'node_' + (++nodeCounter);
  var def = NODE_DEFS[type][subtype];
  var node = { id: id, type: type, subtype: subtype, x: x, y: y, config: Object.assign({ label: def.label }, config) };
  nodes[id] = node;
  renderNode(node);
  return id;
}

function renderNode(node) {
  var def = NODE_DEFS[node.type][node.subtype];
  var el = document.createElement('div');
  el.className = 'flow-node type-' + node.type;
  el.id = node.id;
  el.style.left = node.x + 'px';
  el.style.top = node.y + 'px';

  var badgeColor = BADGE_COLORS[def.badge] || '#7c6aff';
  var isCondition = node.type === 'condition';
  var isEnd = node.type === 'end';
  var isTrigger = node.type === 'trigger';

  var portsHtml = '';
  if (!isTrigger) {
    portsHtml += '<div class="port port-in" data-node="' + node.id + '" data-port="in"></div>';
  }
  if (isCondition) {
    portsHtml += '<div class="port port-out-yes" data-node="' + node.id + '" data-port="out_yes"></div>';
    portsHtml += '<div class="port port-out-no" data-node="' + node.id + '" data-port="out_no"></div>';
  } else if (!isEnd) {
    portsHtml += '<div class="port port-out" data-node="' + node.id + '" data-port="out"></div>';
  }

  el.innerHTML =
    '<div class="node-card">' +
      '<div class="node-header">' +
        '<span style="font-size:18px">' + def.icon + '</span>' +
        '<div style="flex:1">' +
          '<div class="node-label">' + (node.config.label || def.label) + '</div>' +
          '<div class="node-sublabel">' + getNodeSublabel(node) + '</div>' +
        '</div>' +
        '<span class="node-badge" style="background:' + badgeColor + '22;color:' + badgeColor + ';border:1px solid ' + badgeColor + '44">' + def.badge + '</span>' +
      '</div>' +
      getNodeBody(node) +
    '</div>' +
    portsHtml;

  canvas.appendChild(el);

  el.querySelector('.node-card').addEventListener('mousedown', function(e) {
    if (e.target.classList.contains('port')) return;
    if (currentTool === 'select') {
      e.stopPropagation();
      startDragNode(e, node.id);
      selectNode(node.id);
    }
  });

  el.querySelectorAll('.port').forEach(function(port) {
    port.addEventListener('mousedown', function(e) {
      e.stopPropagation();
      if (port.dataset.port.startsWith('out') || port.dataset.port === 'out') {
        startConnecting(e, node.id, port.dataset.port);
      }
    });
    port.addEventListener('mouseup', function(e) {
      e.stopPropagation();
      if (connectingFrom && port.dataset.port === 'in' && port.dataset.node !== connectingFrom.nodeId) {
        finishConnection(port.dataset.node);
      }
    });
  });

  updateCanvas();
}

function getNodeSublabel(node) {
  if (node.type === 'trigger') {
    if (node.subtype === 'schedule') return node.config.cron || 'Not configured';
    if (node.subtype === 'webhook') return node.config.url ? 'URL set' : 'No URL';
    return node.config.filter || 'Any';
  }
  if (node.subtype === 'send_email') return node.config.template || 'No template';
  if (node.subtype === 'create_task') return node.config.assignee || 'Unassigned';
  if (node.subtype === 'wait_time') return node.config.duration || 'Set duration';
  if (node.subtype === 'if_else') return node.config.condition || 'Set condition';
  if (node.subtype === 'move_stage') return node.config.stage || 'Select stage';
  return '';
}

function getNodeBody(node) {
  if (node.type === 'condition') {
    return '<div class="node-body" style="padding-bottom:18px;font-size:11px;color:#94a3b8;">' + (node.config.condition || 'Click to configure condition') + '</div>';
  }
  if (node.type === 'wait') {
    return '<div class="node-body" style="font-size:11px;color:#94a3b8;">⏳ ' + (node.config.duration || '1 hour') + '</div>';
  }
  return '';
}

function deleteNode(nodeId) {
  var el = document.getElementById(nodeId);
  if (el) el.remove();
  delete nodes[nodeId];
  connections = connections.filter(function(c) { return c.from !== nodeId && c.to !== nodeId; });
  renderConnections();
  selectNode(null);
  if (Object.keys(nodes).length === 0) {
    document.getElementById('canvasHint').classList.remove('hidden');
  }
}
