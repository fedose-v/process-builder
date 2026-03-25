// ═══════════════════════════════════════════════════════════
// PROPERTIES PANEL
// ═══════════════════════════════════════════════════════════

class PropertiesPanel {
    selectedNode: string | null = null;

    constructor(private state: AppState) {}

    select(id: string | null): void {
        if (this.selectedNode) {
            document.getElementById(this.selectedNode)?.classList.remove('selected');
        }
        this.selectedNode = id;
        const panel = document.getElementById('panelRight');
        if (id) {
            document.getElementById(id)?.classList.add('selected');
            panel?.classList.add('open');
            this.show(id);
        } else {
            panel?.classList.remove('open');
            this.show(null);
        }
    }

    show(id: string | null): void {
        const title = document.getElementById('propTitle')!;
        const sub = document.getElementById('propSub')!;
        const body = document.getElementById('propBody')!;
        if (!id) {
            title.textContent = 'Properties';
            sub.textContent = 'Select a node to configure';
            body.innerHTML = '<div class="empty-panel">Click on any node to view and edit its properties here.</div>';
            return;
        }
        const node = this.state.nodes[id];
        const def = NodeMgr.getDef(node.type, node.subtype);
        title.textContent = def.icon + ' ' + def.label;
        sub.textContent = def.badge + ' · ' + node.id;
        body.innerHTML = this.buildForm(node);
    }

    private buildSelect(opts: Array<string | {value: string; label: string}>, cur: string, nodeId: string, key: string): string {
        const handler = 'onchange="updateConfig(\'' + nodeId + '\',\'' + key + '\',this.value)"';
        const options = opts.map(o => {
            const v = typeof o === 'object' ? o.value : o;
            const l = typeof o === 'object' ? o.label : o;
            return '<option value="' + v + '"' + (cur === v ? ' selected' : '') + '>' + l + '</option>';
        }).join('');
        return '<select class="prop-select" ' + handler + '>' + options + '</select>';
    }

    private buildInput(val: string | undefined, placeholder: string, nodeId: string, key: string, extra = ''): string {
        return '<input class="prop-input" value="' + (val || '').replace(/"/g, '&quot;') + '" placeholder="' + placeholder + '" ' + extra +
            ' oninput="updateConfigSilent(\'' + nodeId + '\',\'' + key + '\',this.value)" />';
    }

    private buildTextarea(val: string | undefined, placeholder: string, nodeId: string, key: string, extra = ''): string {
        return '<textarea class="prop-textarea" ' + extra + ' placeholder="' + placeholder + '"' +
            ' oninput="updateConfigSilent(\'' + nodeId + '\',\'' + key + '\',this.value)">' + (val || '') + '</textarea>';
    }

    buildForm(node: FlowNode): string {
        const id = node.id;
        const c = node.config;
        let html = '';

        html += '<div class="prop-group"><div class="prop-label">Label</div>' +
            this.buildInput(c.label, 'Node label', id, 'label') +
            '</div>';

        if (node.type === 'trigger') {
            if (node.subtype === 'schedule') {
                html += '<div class="prop-group"><div class="prop-label">Schedule</div>' +
                    this.buildSelect(['Every hour', 'Every day 9:00', 'Every Monday 8:00', '1st of month', 'Custom cron'], c.cron || 'Every hour', id, 'cron') +
                    '</div>';
            }
            if (node.subtype === 'event_deal') {
                html += '<div class="prop-group"><div class="prop-label">From Stage</div>' +
                    this.buildSelect(['Any', 'New', 'Contacted', 'Proposal', 'Negotiation'], c.fromStage || 'Any', id, 'fromStage') +
                    '</div>' +
                    '<div class="prop-group"><div class="prop-label">To Stage</div>' +
                    this.buildSelect(['Any', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost'], c.toStage || 'Any', id, 'toStage') +
                    '</div>';
            }
            if (node.subtype === 'webhook') {
                html += '<div class="prop-group"><div class="prop-label">Webhook URL (readonly)</div>' +
                    '<input class="prop-input" readonly value="https://crm.example.com/hooks/' + id + '" style="color:var(--text-3);font-size:11px;" />' +
                    '</div>';
            }
            if (node.subtype === 'event_lead' || node.subtype === 'event_form') {
                const sources = ['Any', 'Website', 'Social', 'Referral', 'Ad Campaign'];
                html += '<div class="prop-group"><div class="prop-label">Source Filter</div>' +
                    '<div class="tag-list">' +
                    sources.map(s =>
                        '<span class="tag' + (c.source === s ? ' active' : '') + '" onclick="updateConfig(\'' + id + '\',\'source\',\'' + s + '\');' +
                        'this.closest(\'.tag-list\').querySelectorAll(\'.tag\').forEach(function(t){t.classList.remove(\'active\')});this.classList.add(\'active\')">' + s + '</span>'
                    ).join('') +
                    '</div></div>';
            }
        }

        if (node.subtype === 'send_email') {
            html += '<div class="prop-group"><div class="prop-label">Template</div>' +
                this.buildSelect([{value: '', label: 'Select template...'}, 'Welcome Email', 'Follow-up #1', 'Demo Invite', 'Proposal Sent', 'Win Confirmation'],
                    c.template || '', id, 'template') +
                '</div>' +
                '<div class="prop-group"><div class="prop-label">From</div>' +
                this.buildSelect(['Account owner', 'sales@company.com', 'support@company.com'], c.from || 'Account owner', id, 'from') +
                '</div>' +
                '<div class="prop-group"><div class="prop-label">Delay (optional)</div>' +
                this.buildSelect(['Immediately', 'After 1 hour', 'After 1 day', 'After 3 days'], c.delay || 'Immediately', id, 'delay') +
                '</div>';
        }

        if (node.subtype === 'send_sms') {
            html += '<div class="prop-group"><div class="prop-label">Message</div>' +
                this.buildTextarea(c.message, 'Hi {{contact.name}}, ...', id, 'message') +
                '<div style="font-size:10px;color:var(--text-3);margin-top:4px;">Variables: {{contact.name}}, {{deal.value}}</div>' +
                '</div>';
        }

        if (node.subtype === 'create_task') {
            html += '<div class="prop-group"><div class="prop-label">Task Title</div>' +
                this.buildInput(c.taskTitle, 'Call the lead...', id, 'taskTitle') +
                '</div>' +
                '<div class="prop-group"><div class="prop-label">Assign To</div>' +
                this.buildSelect(['Account owner', 'Any sales rep', 'John Smith', 'Maria Garcia'], c.assignee || 'Account owner', id, 'assignee') +
                '</div>' +
                '<div class="prop-group"><div class="prop-label">Due In</div>' +
                this.buildSelect(['1 hour', 'Same day', 'Next day', '3 days', '1 week'], c.dueIn || '1 hour', id, 'dueIn') +
                '</div>';
        }

        if (node.subtype === 'update_field') {
            html += '<div class="prop-group"><div class="prop-label">Field</div>' +
                this.buildSelect(['Lead Status', 'Lead Score', 'Assignee', 'Priority', 'Custom Field 1'], c.field || 'Lead Status', id, 'field') +
                '</div>' +
                '<div class="prop-group"><div class="prop-label">New Value</div>' +
                this.buildInput(c.value, 'Value or {{variable}}', id, 'value') +
                '</div>';
        }

        if (node.subtype === 'add_tag') {
            const allTags = ['Hot Lead', 'Interested', 'Demo Scheduled', 'Pricing Sent', 'VIP'];
            const activeTags = c.tags || [];
            html += '<div class="prop-group"><div class="prop-label">Tags to Add</div>' +
                '<div class="tag-list">' +
                allTags.map(t => {
                    const isActive = activeTags.indexOf(t) !== -1;
                    return '<span class="tag' + (isActive ? ' active' : '') + '" onclick="toggleTag(\'' + id + '\',\'' + t + '\',this)">' + t + '</span>';
                }).join('') +
                '</div></div>';
        }

        if (node.subtype === 'notify') {
            html += '<div class="prop-group"><div class="prop-label">Message</div>' +
                this.buildTextarea(c.message, 'New deal created: {{deal.name}}', id, 'message') +
                '</div>' +
                '<div class="prop-group"><div class="prop-label">Notify</div>' +
                this.buildSelect(['Account owner', 'All sales reps', 'Specific user'], c.notifyTo || 'Account owner', id, 'notifyTo') +
                '</div>';
        }

        if (node.subtype === 'move_stage') {
            html += '<div class="prop-group"><div class="prop-label">Target Stage</div>' +
                this.buildSelect(['New', 'Contacted', 'Proposal', 'Negotiation', 'Won', 'Lost'], c.stage || 'New', id, 'stage') +
                '</div>';
        }

        if (node.subtype === 'webhook_call') {
            html += '<div class="prop-group"><div class="prop-label">Method</div>' +
                this.buildSelect(['POST', 'GET', 'PUT', 'PATCH'], c.method || 'POST', id, 'method') +
                '</div>' +
                '<div class="prop-group"><div class="prop-label">URL</div>' +
                this.buildInput(c.url, 'https://api.example.com/...', id, 'url') +
                '</div>' +
                '<div class="prop-group"><div class="prop-label">Body (JSON)</div>' +
                this.buildTextarea(c.body, '{"contact_id": "{{contact.id}}"}', id, 'body', 'style="font-family:monospace;font-size:11px;"') +
                '</div>';
        }

        if (node.subtype === 'if_else') {
            html += '<div class="prop-group"><div class="prop-label">Field</div>' +
                this.buildSelect(['Lead Score', 'Lead Status', 'Deal Value', 'Tag contains', 'Custom Field'], c.condField || 'Lead Score', id, 'condField') +
                '</div>' +
                '<div class="prop-group"><div class="prop-label">Operator</div>' +
                this.buildSelect(['equals', 'not equals', 'greater than', 'less than', 'contains', 'is empty'], c.operator || 'equals', id, 'operator') +
                '</div>' +
                '<div class="prop-group"><div class="prop-label">Value</div>' +
                this.buildInput(c.condValue, 'e.g. 80', id, 'condValue') +
                '</div>' +
                '<div style="background:#f59e0b11;border:1px solid #f59e0b33;border-radius:8px;padding:10px;font-size:11px;color:var(--text-2);margin-top:8px;">' +
                '<strong style="color:#f59e0b">Yes</strong> = condition is true<br>' +
                '<strong style="color:#ef4444">No</strong> = condition is false' +
                '</div>';
        }

        if (node.subtype === 'wait_time') {
            html += '<div class="prop-group"><div class="prop-label">Wait Type</div>' +
                this.buildSelect(['Fixed Duration', 'Until Date/Time', 'Until Event'], c.waitType || 'Fixed Duration', id, 'waitType') +
                '</div>' +
                '<div class="prop-group"><div class="prop-label">Duration</div>' +
                '<div style="display:flex;gap:8px">' +
                '<input class="prop-input" type="number" value="' + (c.durValue || '1') + '" min="1" style="width:70px"' +
                ' oninput="updateConfigSilent(\'' + id + '\',\'durValue\',this.value)" />' +
                this.buildSelect(['minutes', 'hours', 'days', 'weeks'], c.durUnit || 'hours', id, 'durUnit') +
                '</div></div>';
        }

        html += '<button class="delete-node-btn" onclick="deleteNode(\'' + id + '\')">🗑 Delete Node</button>';
        return html;
    }

    updateConfig(nodeId: string, key: string, value: string): void {
        const {nodes} = this.state;
        if (!nodes[nodeId]) return;
        nodes[nodeId].config[key as keyof NodeConfig] = value as any;
        const el = document.getElementById(nodeId);
        if (el) {
            el.remove();
            NodeMgr.render(nodes[nodeId]);
            document.getElementById(nodeId)?.classList.add('selected');
            this.show(nodeId);
            Conns.render();
        }
    }

    updateConfigSilent(nodeId: string, key: string, value: string): void {
        const {nodes} = this.state;
        if (!nodes[nodeId]) return;
        nodes[nodeId].config[key as keyof NodeConfig] = value as any;
        const el = document.getElementById(nodeId);
        if (el) {
            el.remove();
            NodeMgr.render(nodes[nodeId]);
            document.getElementById(nodeId)?.classList.add('selected');
            Conns.render();
        }
    }

    toggleTag(nodeId: string, tag: string, el: HTMLElement): void {
        const {nodes} = this.state;
        if (!nodes[nodeId]) return;
        const tags = nodes[nodeId].config.tags || [];
        const idx = tags.indexOf(tag);
        if (idx === -1) {
            tags.push(tag);
            el.classList.add('active');
        } else {
            tags.splice(idx, 1);
            el.classList.remove('active');
        }
        nodes[nodeId].config.tags = tags;
        const nodeEl = document.getElementById(nodeId);
        if (nodeEl) {
            nodeEl.remove();
            NodeMgr.render(nodes[nodeId]);
            document.getElementById(nodeId)?.classList.add('selected');
            Conns.render();
        }
    }
}

const Props = new PropertiesPanel(state);

function selectNode(id: string | null): void { Props.select(id); }
function showProperties(id: string | null): void { Props.show(id); }
function updateConfig(nodeId: string, key: string, value: string): void { Props.updateConfig(nodeId, key, value); }
function updateConfigSilent(nodeId: string, key: string, value: string): void { Props.updateConfigSilent(nodeId, key, value); }
function toggleTag(nodeId: string, tag: string, el: HTMLElement): void { Props.toggleTag(nodeId, tag, el); }
