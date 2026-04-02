// ═══════════════════════════════════════════════════════════
// NODE MANAGER
// ═══════════════════════════════════════════════════════════

class NodeManager {
    private readonly NODE_DEFS: Record<string, Record<string, NodeDef>> = {
        trigger: {
            event_lead: {label: 'New Lead', icon: '⚡', badge: 'TRIGGER', color: '#3b82f6'},
            event_deal: {label: 'Deal Stage', icon: '💼', badge: 'TRIGGER', color: '#3b82f6'},
            event_form: {label: 'Form Submit', icon: '📋', badge: 'TRIGGER', color: '#3b82f6'},
            schedule: {label: 'Schedule', icon: '🕐', badge: 'TRIGGER', color: '#3b82f6'},
            webhook: {label: 'Webhook', icon: '🔗', badge: 'TRIGGER', color: '#3b82f6'},
            activity_created: {label: 'Activity Created', icon: '📌', badge: 'TRIGGER', color: '#3b82f6'},
            lead_assigned: {label: 'Lead Assigned', icon: '👤', badge: 'TRIGGER', color: '#3b82f6'},
            client_assigned: {label: 'Client Assigned', icon: '🏢', badge: 'TRIGGER', color: '#3b82f6'},
            deal_assigned: {label: 'Deal Assigned', icon: '💼', badge: 'TRIGGER', color: '#3b82f6'},
            trial_expiring: {label: 'Trial Expiring', icon: '⏰', badge: 'TRIGGER', color: '#3b82f6'},
            manager_leaving: {label: 'Manager Leaving', icon: '🚪', badge: 'TRIGGER', color: '#3b82f6'},
            subscription_cancelled: {label: 'Subscription Cancelled', icon: '❌', badge: 'TRIGGER', color: '#3b82f6'},
            lead_wrote: {label: 'Lead Wrote', icon: '💬', badge: 'TRIGGER', color: '#3b82f6'},
            lead_messaged: {label: 'Lead Messaged', icon: '📨', badge: 'TRIGGER', color: '#3b82f6'},
            deal_created: {label: 'Deal Created', icon: '🤝', badge: 'TRIGGER', color: '#3b82f6'},
            contact_created: {label: 'Contact Created', icon: '👥', badge: 'TRIGGER', color: '#3b82f6'},
            call_ended: {label: 'Call Ended', icon: '📞', badge: 'TRIGGER', color: '#3b82f6'},
            order_paid: {label: 'Order Paid', icon: '💳', badge: 'TRIGGER', color: '#3b82f6'},
            deal_stage_changed: {label: 'Deal Stage Changed', icon: '📊', badge: 'TRIGGER', color: '#3b82f6'},
            client_status_stuck: {label: 'Client Status Stuck', icon: '🔒', badge: 'TRIGGER', color: '#3b82f6'},
            touch_reminder: {label: 'Touch Reminder', icon: '🔔', badge: 'TRIGGER', color: '#3b82f6'},
            account_expiring: {label: 'Account Expiring', icon: '⚠️', badge: 'TRIGGER', color: '#3b82f6'},
            client_pipeline_change: {label: 'Client Pipeline Change', icon: '🔄', badge: 'TRIGGER', color: '#3b82f6'},
            lead_unprocessed: {label: 'Lead Unprocessed', icon: '⏳', badge: 'TRIGGER', color: '#3b82f6'},
            activity_overdue: {label: 'Activity Overdue', icon: '🚨', badge: 'TRIGGER', color: '#3b82f6'},
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
            get_managers: {label: 'Get Managers', icon: '👥', badge: 'ACTION', color: '#7c6aff'},
            create_activity: {label: 'Create Activity', icon: '📌', badge: 'ACTION', color: '#7c6aff'},
            add_note: {label: 'Add Note', icon: '📝', badge: 'ACTION', color: '#7c6aff'},
            deal_stage_move: {label: 'Deal Stage Move', icon: '📊', badge: 'ACTION', color: '#7c6aff'},
            new_email_template: {label: 'New Email Template', icon: '📄', badge: 'ACTION', color: '#7c6aff'},
            get_email_templates: {label: 'Get Email Templates', icon: '📂', badge: 'ACTION', color: '#7c6aff'},
            email_manager: {label: 'Email Manager', icon: '📨', badge: 'ACTION', color: '#7c6aff'},
            email_client: {label: 'Email Client', icon: '📩', badge: 'ACTION', color: '#7c6aff'},
            web_hook: {label: 'Web Hook', icon: '🔌', badge: 'ACTION', color: '#7c6aff'},
            reschedule_activities: {label: 'Reschedule Activities', icon: '📅', badge: 'ACTION', color: '#7c6aff'},
            update_lead: {label: 'Update Lead', icon: '👤', badge: 'ACTION', color: '#7c6aff'},
            update_client: {label: 'Update Client', icon: '🏢', badge: 'ACTION', color: '#7c6aff'},
        },
        condition: {
            if_else: {label: 'Condition', icon: '🔀', badge: 'LOGIC', color: '#f59e0b'},
        },
        gate: {
            any_action_done: {label: 'Any Action Done', icon: '☑️', badge: 'LOGIC', color: '#f59e0b'},
            all_actions_done: {label: 'All Actions Done', icon: '✅', badge: 'LOGIC', color: '#f59e0b'},
        },
        wait: {
            wait_time: {label: 'Wait / Delay', icon: '⏳', badge: 'WAIT', color: '#ec4899'},
        },
        end: {
            end: {label: 'End', icon: '🏁', badge: 'END', color: '#22c55e'},
        },
    };

    private readonly BADGE_COLORS: Record<string, string> = {
        TRIGGER: '#3b82f6', ACTION: '#7c6aff', LOGIC: '#f59e0b', WAIT: '#ec4899', END: '#22c55e',
    };

    constructor(private state: AppState) {
    }

    getDef(type: string, subtype: string): NodeDef {
        return this.NODE_DEFS[type][subtype];
    }

    onDragStart(e: DragEvent): void {
        this.state.draggedType = (e.currentTarget as HTMLElement).dataset.type!;
        this.state.draggedSubtype = (e.currentTarget as HTMLElement).dataset.subtype!;
        e.dataTransfer!.effectAllowed = 'copy';
    }

    onDrop(e: DragEvent): void {
        e.preventDefault();
        if (!this.state.draggedType) return;
        const rect = document.getElementById('canvasWrap')!.getBoundingClientRect();
        const x = (e.clientX - rect.left - this.state.panX) / this.state.scale - 90;
        const y = (e.clientY - rect.top - this.state.panY) / this.state.scale - 40;
        this.create(this.state.draggedType, this.state.draggedSubtype!, x, y);
        this.state.draggedType = null;
        this.state.draggedSubtype = null;
        document.getElementById('canvasHint')!.classList.add('hidden');
    }

    create(type: string, subtype: string, x: number, y: number, config?: Partial<NodeConfig>): string {
        config = config || {};
        const id = 'node_' + (++this.state.nodeCounter);
        const def = this.NODE_DEFS[type][subtype];
        const node: FlowNode = {
            id,
            type,
            subtype,
            x,
            y,
            config: Object.assign({label: def.label}, config),
        };
        this.state.nodes[id] = node;
        this.render(node);
        return id;
    }

    render(node: FlowNode): void {
        const def = this.NODE_DEFS[node.type][node.subtype];
        const el = document.createElement('div');
        el.className = 'flow-node type-' + node.type;
        el.id = node.id;
        el.style.left = node.x + 'px';
        el.style.top = node.y + 'px';

        const badgeColor = this.BADGE_COLORS[def.badge] || '#7c6aff';
        const isCondition = node.type === 'condition';
        const isEnd = node.type === 'end';
        const isTrigger = node.type === 'trigger';

        let portsHtml = '';
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
            '<div class="node-sublabel">' + this.getSublabel(node) + '</div>' +
            '</div>' +
            '<span class="node-badge" style="background:' + badgeColor + '22;color:' + badgeColor + ';border:1px solid ' + badgeColor + '44">' + def.badge + '</span>' +
            '</div>' +
            this.getBody(node) +
            '</div>' +
            portsHtml;

        this.state.canvas.appendChild(el);

        el.querySelector('.node-card')!.addEventListener('mousedown', (e: Event) => {
            const me = e as MouseEvent;
            if ((me.target as Element).classList.contains('port')) return;
            me.stopPropagation();
            Canvas.startDragNode(me, node.id);
            Props.select(node.id);
        });

        el.addEventListener('mouseup', (e: Event) => {
            const {connectingFrom} = this.state;
            if (!connectingFrom || connectingFrom.nodeId === node.id) return;
            (e as MouseEvent).stopPropagation();
            Conns.finish(node.id);
        });

        el.querySelectorAll('.port').forEach(port => {
            port.addEventListener('mousedown', (e: Event) => {
                const me = e as MouseEvent;
                me.stopPropagation();
                const portEl = port as HTMLElement;
                if (portEl.dataset.port!.startsWith('out') || portEl.dataset.port === 'out') {
                    Conns.start(me, node.id, portEl.dataset.port!);
                }
            });
            port.addEventListener('mouseup', (e: Event) => {
                (e as MouseEvent).stopPropagation();
                const portEl = port as HTMLElement;
                const {connectingFrom} = this.state;
                if (connectingFrom && portEl.dataset.port === 'in' && portEl.dataset.node !== connectingFrom.nodeId) {
                    Conns.finish(portEl.dataset.node!);
                }
            });
        });

        Canvas.update();
    }

    delete(nodeId: string): void {
        document.getElementById(nodeId)?.remove();
        delete this.state.nodes[nodeId];
        this.state.connections = this.state.connections.filter(c => c.from !== nodeId && c.to !== nodeId);
        Conns.render();
        Props.select(null);
        if (Object.keys(this.state.nodes).length === 0) {
            document.getElementById('canvasHint')!.classList.remove('hidden');
        }
    }

    private getSublabel(node: FlowNode): string {
        const c = node.config;
        if (node.type === 'trigger') {
            if (node.subtype === 'schedule') return c.cron || 'Not configured';
            if (node.subtype === 'webhook') return 'URL: /hooks/' + node.id;
            if (node.subtype === 'event_deal') return (c.fromStage || 'Any') + ' → ' + (c.toStage || 'Any');
            if (node.subtype === 'activity_created') return c.activityType || 'Any type';
            if (node.subtype === 'lead_assigned') return c.assignee || 'Any manager';
            if (node.subtype === 'client_assigned') return c.assignee || 'Any manager';
            if (node.subtype === 'deal_assigned') return c.pipeline || 'Any pipeline';
            if (node.subtype === 'trial_expiring') return (c.daysLeft || '7') + ' days left';
            if (node.subtype === 'manager_leaving') return c.department || 'Any department';
            if (node.subtype === 'subscription_cancelled') return c.plan || 'Any plan';
            if (node.subtype === 'lead_wrote') return c.channel || 'Any channel';
            if (node.subtype === 'lead_messaged') return c.channel || 'Any channel';
            if (node.subtype === 'deal_created') return c.pipeline || 'Any pipeline';
            if (node.subtype === 'contact_created') return c.source || 'Any source';
            if (node.subtype === 'call_ended') return c.outcome || 'Any outcome';
            if (node.subtype === 'order_paid') return c.minAmount ? '≥ ' + c.minAmount : 'Any amount';
            if (node.subtype === 'deal_stage_changed') return (c.fromStage || 'Any') + ' → ' + (c.toStage || 'Any');
            if (node.subtype === 'client_status_stuck') return (c.clientStatus || 'Any') + ' · ' + (c.stuckDays || '7') + 'd';
            if (node.subtype === 'touch_reminder') return (c.touchDays || '30') + ' days no touch';
            if (node.subtype === 'account_expiring') return (c.daysLeft || '60') + ' days to expire';
            if (node.subtype === 'client_pipeline_change') return (c.fromPipeline || 'Any') + ' → ' + (c.toPipeline || 'Any');
            if (node.subtype === 'lead_unprocessed') return (c.timeLimit || '1') + ' ' + (c.timeUnit || 'hours');
            if (node.subtype === 'activity_overdue') return c.activityType || 'Any type';
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
        if (node.subtype === 'get_managers') return c.territory ? c.territory : 'All territories';
        if (node.subtype === 'create_activity') return (c.activityType || 'Call') + (c.taskTitle ? ': ' + c.taskTitle : '');
        if (node.subtype === 'add_note') return c.entityType ? c.entityType + ': ' + (c.noteText ? c.noteText.substring(0, 22) + '…' : '…') : 'Not configured';
        if (node.subtype === 'deal_stage_move') return c.stage ? '→ ' + c.stage : 'Select stage';
        if (node.subtype === 'new_email_template') return c.templateName || 'Not configured';
        if (node.subtype === 'get_email_templates') return c.category || 'All categories';
        if (node.subtype === 'email_manager') return c.managerRole ? c.managerRole + (c.subject ? ': ' + c.subject : '') : 'Not configured';
        if (node.subtype === 'email_client') return c.subject || 'No subject';
        if (node.subtype === 'web_hook') return c.webhookName || 'Not configured';
        if (node.subtype === 'reschedule_activities') return c.newTime || 'Start of next day';
        if (node.subtype === 'update_lead') return c.leadField ? c.leadField + ' = ' + (c.value || '?') : 'Not configured';
        if (node.subtype === 'update_client') return c.clientField ? c.clientField + ' = ' + (c.value || '?') : 'Not configured';
        if (node.subtype === 'any_action_done') return 'At least 1 action';
        if (node.subtype === 'all_actions_done') return 'All actions';
        if (node.subtype === 'wait_time') return (c.durValue || '1') + ' ' + (c.durUnit || 'hours');
        if (node.subtype === 'if_else') return c.condField ? (c.condField + ' ' + (c.operator || '') + ' ' + (c.condValue || '')) : 'Set condition';
        return '';
    }

    private getBody(node: FlowNode): string {
        const c = node.config;
        if (node.type === 'condition') {
            const condText = c.condField
                ? '<span style="color:#f59e0b">' + c.condField + '</span> ' + (c.operator || '') + ' <span style="color:var(--text)">' + (c.condValue || '?') + '</span>'
                : 'Click to configure condition';
            return '<div class="node-body" style="padding-bottom:18px;font-size:11px;color:var(--text-2);">' + condText + '</div>';
        }
        if (node.type === 'gate') {
            const text = node.subtype === 'any_action_done'
                ? 'Proceeds when <strong style="color:#f59e0b">≥ 1</strong> branch completes'
                : 'Proceeds when <strong style="color:#f59e0b">all</strong> branches complete';
            return '<div class="node-body" style="font-size:11px;color:var(--text-2);">' + text + '</div>';
        }
        if (node.type === 'wait') {
            return '<div class="node-body" style="font-size:11px;color:var(--text-2);">⏳ ' + (c.durValue || '1') + ' ' + (c.durUnit || 'hours') + '</div>';
        }
        return '';
    }
}

const NodeMgr = new NodeManager(state);

function onDragStart(e: DragEvent): void {
    NodeMgr.onDragStart(e);
}

function onDrop(e: DragEvent): void {
    NodeMgr.onDrop(e);
}

function createNode(type: string, subtype: string, x: number, y: number, config?: Partial<NodeConfig>): string {
    return NodeMgr.create(type, subtype, x, y, config);
}

function renderNode(node: FlowNode): void {
    NodeMgr.render(node);
}

function deleteNode(nodeId: string): void {
    NodeMgr.delete(nodeId);
}
