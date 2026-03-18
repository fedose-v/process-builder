// ═══════════════════════════════════════════════════════════
// VALIDATE / ACTIVATE
// ═══════════════════════════════════════════════════════════
function clearValidationErrors(): void {
  Object.keys(nodes).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('invalid');
  });
}

function validateFlow(): boolean {
  var nodeIds = Object.keys(nodes);
  clearValidationErrors();

  if (nodeIds.length === 0) {
    showToast('Add at least one trigger to start');
    return false;
  }

  var invalidIds: string[] = [];

  var triggers = nodeIds.filter(function(id) { return nodes[id].type === 'trigger'; });
  if (triggers.length === 0) {
    // No trigger at all — mark every node
    nodeIds.forEach(function(id) { invalidIds.push(id); });
    applyInvalid(invalidIds);
    showToast('⚠ No trigger found. Add a trigger node.');
    return false;
  }

  nodeIds.forEach(function(id) {
    var node = nodes[id];
    var hasIn     = connections.some(function(c) { return c.to === id; });
    var hasOut    = connections.some(function(c) { return c.from === id; });
    var hasOutYes = connections.some(function(c) { return c.from === id && c.fromPort === 'out_yes'; });
    var hasOutNo  = connections.some(function(c) { return c.from === id && c.fromPort === 'out_no'; });

    var bad = false;
    if (node.type === 'trigger') {
      // Trigger must have at least one outgoing connection
      bad = !hasOut;
    } else if (node.type === 'end') {
      // End must have at least one incoming connection
      bad = !hasIn;
    } else if (node.type === 'condition') {
      // Condition needs incoming + both Yes and No outputs
      bad = !hasIn || !hasOutYes || !hasOutNo;
    } else {
      // All other nodes need both incoming and outgoing
      bad = !hasIn || !hasOut;
    }

    if (bad) invalidIds.push(id);
  });

  applyInvalid(invalidIds);

  if (invalidIds.length > 0) {
    showToast('⚠ ' + invalidIds.length + ' node(s) have connection issues');
    return false;
  }

  showToast('✓ Flow is valid and ready to activate!');
  return true;
}

function applyInvalid(ids: string[]): void {
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.classList.add('invalid');
  });
}

function plural(n: number, one: string, two: string, five: string): string {
  var mod10 = n % 10, mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return five;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return two;
  return five;
}

function activateFlow(): void {
  if (validateFlow()) showToast('🚀 Process activated successfully!');
}

function clearCanvas(): void {
  if (Object.keys(nodes).length === 0) return;
  if (!confirm('Clear the entire canvas?')) return;
  Object.keys(nodes).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  });
  nodes = {};
  connections = [];
  nodeCounter = 0;
  svgLayer.querySelectorAll('.connection-line').forEach(function(e) { e.remove(); });
  selectNode(null);
  document.getElementById('canvasHint')!.classList.remove('hidden');
}

// ═══════════════════════════════════════════════════════════
// EXAMPLE FLOW
// ═══════════════════════════════════════════════════════════
function loadExample(): void {
  clearCanvas();
  document.getElementById('canvasHint')!.classList.add('hidden');

  var t1 = createNode('trigger',   'event_lead',  300,  40,  { label: 'New Lead Arrives' });
  var a1 = createNode('action',    'send_email',  300,  180, { label: 'Send Welcome Email', template: 'Welcome Email' });
  var a2 = createNode('action',    'create_task', 300,  320, { label: 'Create Follow-up Task', taskTitle: 'Call the new lead', assignee: 'Account owner' });
  var c1 = createNode('condition', 'if_else',     300,  460, { label: 'Lead Score ≥ 80?', condField: 'Lead Score', operator: 'greater than', condValue: '80' });
  var a3 = createNode('action',    'move_stage',  120,  620, { label: 'Move to Negotiation', stage: 'Negotiation' });
  var a4 = createNode('action',    'notify',      490,  620, { label: 'Notify Sales Manager', message: 'Low score lead: {{contact.name}}' });
  var w1 = createNode('wait',      'wait_time',   120,  760, { label: 'Wait 2 Days', durValue: '2', durUnit: 'days' });
  var e1 = createNode('end',       'end',         120,  900, { label: 'End' });
  var e2 = createNode('end',       'end',         490,  760, { label: 'End' });

  setTimeout(function() {
    connections = [
      { from: t1, fromPort: 'out',     to: a1 },
      { from: a1, fromPort: 'out',     to: a2 },
      { from: a2, fromPort: 'out',     to: c1 },
      { from: c1, fromPort: 'out_yes', to: a3 },
      { from: c1, fromPort: 'out_no',  to: a4 },
      { from: a3, fromPort: 'out',     to: w1 },
      { from: w1, fromPort: 'out',     to: e1 },
      { from: a4, fromPort: 'out',     to: e2 },
    ];
    renderConnections();
  }, 100);
}

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════
function showToast(msg: string): void {
  var t = document.getElementById('toast')!;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(function() { t.classList.remove('show'); }, 2800);
}

// ═══════════════════════════════════════════════════════════
// KEYBOARD
// ═══════════════════════════════════════════════════════════
document.addEventListener('keydown', function(e: KeyboardEvent) {
  if (e.key === 'Delete' || e.key === 'Backspace') {
    if (selectedNode && (document.activeElement as HTMLElement).tagName !== 'INPUT' && (document.activeElement as HTMLElement).tagName !== 'TEXTAREA') {
      deleteNode(selectedNode);
    }
  }
  if (e.key === 'Escape') cancelConnecting();
});

// ═══════════════════════════════════════════════════════════
// CTRL + WHEEL ZOOM
// ═══════════════════════════════════════════════════════════
function onCanvasWheel(e: WheelEvent): void {
  if (!e.ctrlKey) return;
  e.preventDefault();

  var wrap = document.getElementById('canvasWrap')!;
  var rect = wrap.getBoundingClientRect();

  // Cursor position relative to canvasWrap
  var cursorX = e.clientX - rect.left;
  var cursorY = e.clientY - rect.top;

  var delta = e.deltaY < 0 ? 0.1 : -0.1;
  var newScale = Math.min(2, Math.max(0.3, scale + delta));
  if (newScale === scale) return;

  // Adjust pan so the point under the cursor stays fixed:
  // worldX = (cursorX - panX) / scale  →  keep worldX constant after scale change
  panX = cursorX - (cursorX - panX) * newScale / scale;
  panY = cursorY - (cursorY - panY) * newScale / scale;
  scale = newScale;

  document.getElementById('zoomLabel')!.textContent = Math.round(scale * 100) + '%';
  updateCanvas();
  renderConnections();
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
  canvas = document.getElementById('canvas') as HTMLDivElement;
  svgLayer = document.getElementById('svg-layer') as unknown as SVGSVGElement;

  document.getElementById('canvasWrap')!.addEventListener('wheel', onCanvasWheel, { passive: false });

  initPanel();
  loadExample();
});
