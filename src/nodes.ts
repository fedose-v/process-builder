// ═══════════════════════════════════════════════════════════
// NODE DEFINITIONS
// ═══════════════════════════════════════════════════════════
var NODE_DEFS: Record<string, Record<string, NodeDef>> = {
    trigger: {
        event_lead: {label: 'New Lead', icon: '⚡', badge: 'TRIGGER', color: '#3b82f6'},
        event_deal: {label: 'Deal Stage', icon: '💼', badge: 'TRIGGER', color: '#3b82f6'},
        event_form: {label: 'Form Submit', icon: '📋', badge: 'TRIGGER', color: '#3b82f6'},
        schedule: {label: 'Schedule', icon: '🕐', badge: 'TRIGGER', color: '#3b82f6'},
        webhook: {label: 'Webhook', icon: '🔗', badge: 'TRIGGER', color: '#3b82f6'},
    },
    action: {
        send_email: {label: 'Send Email', icon: '📧', badge: 'ACTION', color: '#7c6aff'},
        send_sms: {label: 'Send SMS', icon: '💬', badge: 'ACTION', color: '#7c6aff'},
        create_task: {label: 'Create Task', icon: '✅', badge: 'ACTION', color: '#7c6aff'},
        update_field: {label: 'Update Field', icon: '✏️', badge: 'ACTION', color: '#7c6aff'},
        add_tag: {label: 'Add Tag', icon: '🏷️', badge: 'ACTION', color: '#7c6aff'},
        notify: {label: 'Notify User', icon: '🔔', badge: 'ACTION', color: '#7c6aff'},
        move_stage: {label: 'Move Stage', icon: '🚀', badge: 'ACTION', color: '#7c6aff'},
        webhook_call: {label: 'HTTP Request', icon: '⚙️', badge: 'ACTION', color: '#7c6aff'},
    },
    condition: {
        if_else: {label: 'Condition', icon: '🔀', badge: 'LOGIC', color: '#f59e0b'},
    },
    wait: {
        wait_time: {label: 'Wait / Delay', icon: '⏳', badge: 'WAIT', color: '#ec4899'},
    },
    end: {
        end: {label: 'End', icon: '🏁', badge: 'END', color: '#22c55e'},
    }
};

var BADGE_COLORS: Record<string, string> = {
    TRIGGER: '#3b82f6', ACTION: '#7c6aff', LOGIC: '#f59e0b', WAIT: '#ec4899', END: '#22c55e'
};

// ═══════════════════════════════════════════════════════════
// DRAG FROM PANEL
// ═══════════════════════════════════════════════════════════
function onDragStart(e: DragEvent): void {
    draggedType = (e.currentTarget as HTMLElement).dataset.type!;
    draggedSubtype = (e.currentTarget as HTMLElement).dataset.subtype!;
    e.dataTransfer!.effectAllowed = 'copy';
}

function onDrop(e: DragEvent): void {
    e.preventDefault();
    if (!draggedType) return;
    var rect = document.getElementById('canvasWrap')!.getBoundingClientRect();
    var x = (e.clientX - rect.left - panX) / scale - 90;
    var y = (e.clientY - rect.top - panY) / scale - 40;
    createNode(draggedType, draggedSubtype!, x, y);
    draggedType = null;
    draggedSubtype = null;
    document.getElementById('canvasHint')!.classList.add('hidden');
}

// ═══════════════════════════════════════════════════════════
// CREATE / RENDER NODE
// ═══════════════════════════════════════════════════════════
function createNode(type: string, subtype: string, x: number, y: number, config?: Partial<NodeConfig>): string {
    config = config || {};
    var id = 'node_' + (++nodeCounter);
    var def = NODE_DEFS[type][subtype];
    var node: FlowNode = {
        id: id,
        type: type,
        subtype: subtype,
        x: x,
        y: y,
        config: Object.assign({label: def.label}, config)
    };
    nodes[id] = node;
    renderNode(node);
    return id;
}

function renderNode(node: FlowNode): void {
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

    el.querySelector('.node-card')!.addEventListener('mousedown', function (e: Event) {
        var me = e as MouseEvent;
        if ((me.target as Element).classList.contains('port')) return;
        if (currentTool === 'select') {
            me.stopPropagation();
            startDragNode(me, node.id);
            selectNode(node.id);
        }
    });

    el.querySelectorAll('.port').forEach(function (port) {
        port.addEventListener('mousedown', function (e: Event) {
            var me = e as MouseEvent;
            me.stopPropagation();
            var portEl = port as HTMLElement;
            if (portEl.dataset.port!.startsWith('out') || portEl.dataset.port === 'out') {
                startConnecting(me, node.id, portEl.dataset.port!);
            }
        });
        port.addEventListener('mouseup', function (e: Event) {
            var me = e as MouseEvent;
            me.stopPropagation();
            var portEl = port as HTMLElement;
            if (connectingFrom && portEl.dataset.port === 'in' && portEl.dataset.node !== connectingFrom.nodeId) {
                finishConnection(portEl.dataset.node!);
            }
        });
    });

    updateCanvas();
}

function getNodeSublabel(node: FlowNode): string {
    var c = node.config;
    if (node.type === 'trigger') {
        if (node.subtype === 'schedule') return c.cron || 'Not configured';
        if (node.subtype === 'webhook') return 'URL: /hooks/' + node.id;
        if (node.subtype === 'event_deal') {
            var from = c.fromStage || 'Any';
            var to = c.toStage || 'Any';
            return from + ' → ' + to;
        }
        return 'Source: ' + (c.source || 'Any');
    }
    if (node.subtype === 'send_email') return c.template ? '📄 ' + c.template : 'No template';
    if (node.subtype === 'send_sms') return c.message ? c.message.substring(0, 28) + (c.message.length > 28 ? '…' : '') : 'No message';
    if (node.subtype === 'create_task') return c.taskTitle ? '→ ' + c.taskTitle : (c.assignee || 'Unassigned');
    if (node.subtype === 'update_field') return c.field ? c.field + ' = ' + (c.value || '?') : 'Not configured';
    if (node.subtype === 'add_tag') return c.tags && c.tags.length ? c.tags.join(', ') : 'No tags selected';
    if (node.subtype === 'notify') return c.notifyTo || 'Account owner';
    if (node.subtype === 'move_stage') return c.stage ? '→ ' + c.stage : 'Select stage';
    if (node.subtype === 'webhook_call') return (c.method || 'POST') + ' ' + (c.url ? c.url.replace(/^https?:\/\//, '').substring(0, 22) + '…' : 'No URL');
    if (node.subtype === 'wait_time') return (c.durValue || '1') + ' ' + (c.durUnit || 'hours');
    if (node.subtype === 'if_else') return c.condField ? (c.condField + ' ' + (c.operator || '') + ' ' + (c.condValue || '')) : 'Set condition';
    return '';
}

function getNodeBody(node: FlowNode): string {
    var c = node.config;
    if (node.type === 'condition') {
        var condText = c.condField
            ? '<span style="color:#f59e0b">' + c.condField + '</span> ' + (c.operator || '') + ' <span style="color:var(--text)">' + (c.condValue || '?') + '</span>'
            : 'Click to configure condition';
        return '<div class="node-body" style="padding-bottom:18px;font-size:11px;color:var(--text-2);">' + condText + '</div>';
    }
    if (node.type === 'wait') {
        return '<div class="node-body" style="font-size:11px;color:var(--text-2);">⏳ ' + (c.durValue || '1') + ' ' + (c.durUnit || 'hours') + '</div>';
    }
    return '';
}

function deleteNode(nodeId: string): void {
    var el = document.getElementById(nodeId);
    if (el) el.remove();
    delete nodes[nodeId];
    connections = connections.filter(function (c) {
        return c.from !== nodeId && c.to !== nodeId;
    });
    renderConnections();
    selectNode(null);
    if (Object.keys(nodes).length === 0) {
        document.getElementById('canvasHint')!.classList.remove('hidden');
    }
}
