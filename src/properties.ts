// ═══════════════════════════════════════════════════════════
// SELECT / PROPERTIES
// ═══════════════════════════════════════════════════════════
function selectNode(id: string | null): void {
    if (selectedNode) {
        var prev = document.getElementById(selectedNode);
        if (prev) prev.classList.remove('selected');
    }
    selectedNode = id;
    var panel = document.getElementById('panelRight');
    if (id) {
        var el = document.getElementById(id);
        if (el) el.classList.add('selected');
        if (panel) panel.classList.add('open');
        showProperties(id);
    } else {
        if (panel) panel.classList.remove('open');
        showProperties(null);
    }
}

function showProperties(id: string | null): void {
    var title = document.getElementById('propTitle')!;
    var sub = document.getElementById('propSub')!;
    var body = document.getElementById('propBody')!;
    if (!id) {
        title.textContent = 'Properties';
        sub.textContent = 'Select a node to configure';
        body.innerHTML = '<div class="empty-panel">Click on any node to view and edit its properties here.</div>';
        return;
    }
    var node = nodes[id];
    var def = NODE_DEFS[node.type][node.subtype];
    title.textContent = def.icon + ' ' + def.label;
    sub.textContent = def.badge + ' · ' + node.id;
    body.innerHTML = buildPropsForm(node);
}

// Build a <select> with current value pre-selected
function buildSelect(opts: Array<string | {
    value: string;
    label: string
}>, cur: string, nodeId: string, key: string): string {
    var handler = 'onchange="updateConfig(\'' + nodeId + '\',\'' + key + '\',this.value)"';
    var options = opts.map(function (o) {
        var v = typeof o === 'object' ? o.value : o;
        var l = typeof o === 'object' ? o.label : o;
        return '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + l + '</option>';
    }).join('');
    return '<select class="prop-select" ' + handler + '>' + options + '</select>';
}

// Build a text input that updates in real-time without losing focus
function buildInput(val: string | undefined, placeholder: string, nodeId: string, key: string, extra?: string): string {
    extra = extra || '';
    return '<input class="prop-input" value="' + (val || '').replace(/"/g, '&quot;') + '" placeholder="' + placeholder + '" ' + extra +
        ' oninput="updateConfigSilent(\'' + nodeId + '\',\'' + key + '\',this.value)" />';
}

// Build a textarea that updates in real-time without losing focus
function buildTextarea(val: string | undefined, placeholder: string, nodeId: string, key: string, extra?: string): string {
    extra = extra || '';
    return '<textarea class="prop-textarea" ' + extra + ' placeholder="' + placeholder + '"' +
        ' oninput="updateConfigSilent(\'' + nodeId + '\',\'' + key + '\',this.value)">' + (val || '') + '</textarea>';
}

function buildPropsForm(node: FlowNode): string {
    var id = node.id;
    var c = node.config;
    var html = '';

    // Common: label
    html += '<div class="prop-group"><div class="prop-label">Label</div>' +
        buildInput(c.label, 'Node label', id, 'label') +
        '</div>';

    // ── TRIGGERS ──────────────────────────────────────────
    if (node.type === 'trigger') {
        if (node.subtype === 'schedule') {
            html += '<div class="prop-group"><div class="prop-label">Schedule</div>' +
                buildSelect(['Every hour', 'Every day 9:00', 'Every Monday 8:00', '1st of month', 'Custom cron'], c.cron || 'Every hour', id, 'cron') +
                '</div>';
        }
        if (node.subtype === 'event_deal') {
            html += '<div class="prop-group"><div class="prop-label">From Stage</div>' +
                buildSelect(['Any', 'New', 'Contacted', 'Proposal', 'Negotiation'], c.fromStage || 'Any', id, 'fromStage') +
                '</div>' +
                '<div class="prop-group"><div class="prop-label">To Stage</div>' +
                buildSelect(['Any', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost'], c.toStage || 'Any', id, 'toStage') +
                '</div>';
        }
        if (node.subtype === 'webhook') {
            html += '<div class="prop-group"><div class="prop-label">Webhook URL (readonly)</div>' +
                '<input class="prop-input" readonly value="https://crm.example.com/hooks/' + id + '" style="color:var(--text-3);font-size:11px;" />' +
                '</div>';
        }
        if (node.subtype === 'event_lead' || node.subtype === 'event_form') {
            var sources = ['Any', 'Website', 'Social', 'Referral', 'Ad Campaign'];
            html += '<div class="prop-group"><div class="prop-label">Source Filter</div>' +
                '<div class="tag-list">' +
                sources.map(function (s) {
                    return '<span class="tag' + (c.source === s ? ' active' : '') + '" onclick="updateConfig(\'' + id + '\',\'source\',\'' + s + '\');' +
                        'this.closest(\'.tag-list\').querySelectorAll(\'.tag\').forEach(function(t){t.classList.remove(\'active\')});this.classList.add(\'active\')">' + s + '</span>';
                }).join('') +
                '</div></div>';
        }
    }

    // ── ACTIONS ───────────────────────────────────────────
    if (node.subtype === 'send_email') {
        html += '<div class="prop-group"><div class="prop-label">Template</div>' +
            buildSelect([{
                value: '',
                label: 'Select template...'
            }, 'Welcome Email', 'Follow-up #1', 'Demo Invite', 'Proposal Sent', 'Win Confirmation'],
                c.template || '', id, 'template') +
            '</div>' +
            '<div class="prop-group"><div class="prop-label">From</div>' +
            buildSelect(['Account owner', 'sales@company.com', 'support@company.com'], c.from || 'Account owner', id, 'from') +
            '</div>' +
            '<div class="prop-group"><div class="prop-label">Delay (optional)</div>' +
            buildSelect(['Immediately', 'After 1 hour', 'After 1 day', 'After 3 days'], c.delay || 'Immediately', id, 'delay') +
            '</div>';
    }

    if (node.subtype === 'send_sms') {
        html += '<div class="prop-group"><div class="prop-label">Message</div>' +
            buildTextarea(c.message, 'Hi {{contact.name}}, ...', id, 'message') +
            '<div style="font-size:10px;color:var(--text-3);margin-top:4px;">Variables: {{contact.name}}, {{deal.value}}</div>' +
            '</div>';
    }

    if (node.subtype === 'create_task') {
        html += '<div class="prop-group"><div class="prop-label">Task Title</div>' +
            buildInput(c.taskTitle, 'Call the lead...', id, 'taskTitle') +
            '</div>' +
            '<div class="prop-group"><div class="prop-label">Assign To</div>' +
            buildSelect(['Account owner', 'Any sales rep', 'John Smith', 'Maria Garcia'], c.assignee || 'Account owner', id, 'assignee') +
            '</div>' +
            '<div class="prop-group"><div class="prop-label">Due In</div>' +
            buildSelect(['1 hour', 'Same day', 'Next day', '3 days', '1 week'], c.dueIn || '1 hour', id, 'dueIn') +
            '</div>';
    }

    if (node.subtype === 'update_field') {
        html += '<div class="prop-group"><div class="prop-label">Field</div>' +
            buildSelect(['Lead Status', 'Lead Score', 'Assignee', 'Priority', 'Custom Field 1'], c.field || 'Lead Status', id, 'field') +
            '</div>' +
            '<div class="prop-group"><div class="prop-label">New Value</div>' +
            buildInput(c.value, 'Value or {{variable}}', id, 'value') +
            '</div>';
    }

    if (node.subtype === 'add_tag') {
        var allTags = ['Hot Lead', 'Interested', 'Demo Scheduled', 'Pricing Sent', 'VIP'];
        var activeTags = c.tags || [];
        html += '<div class="prop-group"><div class="prop-label">Tags to Add</div>' +
            '<div class="tag-list">' +
            allTags.map(function (t) {
                var isActive = activeTags.indexOf(t) !== -1;
                return '<span class="tag' + (isActive ? ' active' : '') + '" onclick="toggleTag(\'' + id + '\',\'' + t + '\',this)">' + t + '</span>';
            }).join('') +
            '</div></div>';
    }

    if (node.subtype === 'notify') {
        html += '<div class="prop-group"><div class="prop-label">Message</div>' +
            buildTextarea(c.message, 'New deal created: {{deal.name}}', id, 'message') +
            '</div>' +
            '<div class="prop-group"><div class="prop-label">Notify</div>' +
            buildSelect(['Account owner', 'All sales reps', 'Specific user'], c.notifyTo || 'Account owner', id, 'notifyTo') +
            '</div>';
    }

    if (node.subtype === 'move_stage') {
        html += '<div class="prop-group"><div class="prop-label">Target Stage</div>' +
            buildSelect(['New', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost'], c.stage || 'New', id, 'stage') +
            '</div>';
    }

    if (node.subtype === 'webhook_call') {
        html += '<div class="prop-group"><div class="prop-label">Method</div>' +
            buildSelect(['POST', 'GET', 'PUT', 'PATCH'], c.method || 'POST', id, 'method') +
            '</div>' +
            '<div class="prop-group"><div class="prop-label">URL</div>' +
            buildInput(c.url, 'https://api.example.com/...', id, 'url') +
            '</div>' +
            '<div class="prop-group"><div class="prop-label">Body (JSON)</div>' +
            buildTextarea(c.body, '{"contact_id": "{{contact.id}}"}', id, 'body', 'style="font-family:monospace;font-size:11px;"') +
            '</div>';
    }

    // ── LOGIC ─────────────────────────────────────────────
    if (node.subtype === 'if_else') {
        html += '<div class="prop-group"><div class="prop-label">Field</div>' +
            buildSelect(['Lead Score', 'Lead Status', 'Deal Value', 'Tag contains', 'Custom Field'], c.condField || 'Lead Score', id, 'condField') +
            '</div>' +
            '<div class="prop-group"><div class="prop-label">Operator</div>' +
            buildSelect(['equals', 'not equals', 'greater than', 'less than', 'contains', 'is empty'], c.operator || 'equals', id, 'operator') +
            '</div>' +
            '<div class="prop-group"><div class="prop-label">Value</div>' +
            buildInput(c.condValue, 'e.g. 80', id, 'condValue') +
            '</div>' +
            '<div style="background:#f59e0b11;border:1px solid #f59e0b33;border-radius:8px;padding:10px;font-size:11px;color:var(--text-2);margin-top:8px;">' +
            '<strong style="color:#f59e0b">Yes</strong> = condition is true<br>' +
            '<strong style="color:#ef4444">No</strong> = condition is false' +
            '</div>';
    }

    if (node.subtype === 'wait_time') {
        html += '<div class="prop-group"><div class="prop-label">Wait Type</div>' +
            buildSelect(['Fixed Duration', 'Until Date/Time', 'Until Event'], c.waitType || 'Fixed Duration', id, 'waitType') +
            '</div>' +
            '<div class="prop-group"><div class="prop-label">Duration</div>' +
            '<div style="display:flex;gap:8px">' +
            '<input class="prop-input" type="number" value="' + (c.durValue || '1') + '" min="1" style="width:70px"' +
            ' oninput="updateConfigSilent(\'' + id + '\',\'durValue\',this.value)" />' +
            buildSelect(['minutes', 'hours', 'days', 'weeks'], c.durUnit || 'hours', id, 'durUnit') +
            '</div></div>';
    }

    html += '<button class="delete-node-btn" onclick="deleteNode(\'' + id + '\')">🗑 Delete Node</button>';
    return html;
}

// Full re-render (for selects, tags) — rebuilds node card + properties panel
function updateConfig(nodeId: string, key: string, value: string): void {
    if (!nodes[nodeId]) return;
    nodes[nodeId].config[key as keyof NodeConfig] = value as any;
    var el = document.getElementById(nodeId);
    if (el) {
        el.remove();
        renderNode(nodes[nodeId]);
        var newEl = document.getElementById(nodeId);
        if (newEl) newEl.classList.add('selected');
        showProperties(nodeId);
        renderConnections();
    }
}

// Silent update (for text inputs / textareas) — updates node card only, preserves focus
function updateConfigSilent(nodeId: string, key: string, value: string): void {
    if (!nodes[nodeId]) return;
    nodes[nodeId].config[key as keyof NodeConfig] = value as any;
    var el = document.getElementById(nodeId);
    if (el) {
        el.remove();
        renderNode(nodes[nodeId]);
        var newEl = document.getElementById(nodeId);
        if (newEl) newEl.classList.add('selected');
        renderConnections();
    }
}

// Toggle tag in add_tag node
function toggleTag(nodeId: string, tag: string, el: HTMLElement): void {
    if (!nodes[nodeId]) return;
    var tags = nodes[nodeId].config.tags || [];
    var idx = tags.indexOf(tag);
    if (idx === -1) {
        tags.push(tag);
        el.classList.add('active');
    } else {
        tags.splice(idx, 1);
        el.classList.remove('active');
    }
    nodes[nodeId].config.tags = tags;
    // Update node card without rebuilding properties
    var nodeEl = document.getElementById(nodeId);
    if (nodeEl) {
        nodeEl.remove();
        renderNode(nodes[nodeId]);
        var newEl = document.getElementById(nodeId);
        if (newEl) newEl.classList.add('selected');
        renderConnections();
    }
}
