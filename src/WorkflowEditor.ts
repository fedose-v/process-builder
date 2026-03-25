// ═══════════════════════════════════════════════════════════
// WORKFLOW EDITOR
// ═══════════════════════════════════════════════════════════

class WorkflowEditor {
    constructor(private state: AppState) {
    }

    // ── Validation ───────────────────────────────────────────────────────────────

    private clearValidationErrors(): void {
        Object.keys(this.state.nodes).forEach(id => {
            document.getElementById(id)?.classList.remove('invalid');
        });
    }

    private applyInvalid(ids: string[]): void {
        ids.forEach(id => document.getElementById(id)?.classList.add('invalid'));
    }

    validate(): boolean {
        const {nodes, connections} = this.state;
        const nodeIds = Object.keys(nodes);
        this.clearValidationErrors();

        if (nodeIds.length === 0) {
            this.showToast('Add at least one trigger to start');
            return false;
        }

        const triggers = nodeIds.filter(id => nodes[id].type === 'trigger');
        if (triggers.length === 0) {
            this.applyInvalid(nodeIds);
            this.showToast('⚠ No trigger found. Add a trigger node.');
            return false;
        }

        const invalidIds: string[] = [];
        nodeIds.forEach(id => {
            const node = nodes[id];
            const hasIn = connections.some(c => c.to === id);
            const hasOut = connections.some(c => c.from === id);
            const hasOutYes = connections.some(c => c.from === id && c.fromPort === 'out_yes');
            const hasOutNo = connections.some(c => c.from === id && c.fromPort === 'out_no');

            let bad = false;
            if (node.type === 'trigger') bad = !hasOut;
            else if (node.type === 'end') bad = !hasIn;
            else if (node.type === 'condition') bad = !hasIn || !hasOutYes || !hasOutNo;
            else bad = !hasIn || !hasOut;

            if (bad) invalidIds.push(id);
        });

        this.applyInvalid(invalidIds);

        if (invalidIds.length > 0) {
            this.showToast(`⚠ ${invalidIds.length} node(s) have connection issues`);
            return false;
        }

        this.showToast('✓ Flow is valid and ready to activate!');
        return true;
    }

    // ── Activation UI ────────────────────────────────────────────────────────────

    setActivationUI(active: boolean): void {
        const toggle = document.getElementById('activateToggle') as HTMLInputElement | null;
        const label = document.getElementById('activateLabel');
        if (toggle) toggle.checked = active;
        if (label) {
            label.textContent = active ? 'Active' : 'Inactive';
            label.className = `act-label ${active ? 'act-label--on' : ''}`;
        }
    }

    // ── Save / Load ──────────────────────────────────────────────────────────────

    async save(active?: boolean, silent = false): Promise<void> {
        const nameInput = document.querySelector<HTMLInputElement>('.process-name');
        const name = nameInput?.value.trim() || 'Untitled Workflow';
        const toggle = document.getElementById('activateToggle') as HTMLInputElement | null;
        const isActive = active ?? toggle?.checked ?? false;
        const {nodes, connections} = this.state;
        const payload = {name, nodes, connections, active: isActive};

        try {
            if (this.state.currentWorkflowId) {
                await fetch(`/api/workflows/${this.state.currentWorkflowId}`, {
                    method: 'PUT',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload),
                });
            } else {
                const res = await fetch('/api/workflows', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(payload),
                });
                const wf = (await res.json()) as WorkflowData;
                this.state.currentWorkflowId = wf.id;
                history.replaceState(null, '', `/builder?id=${wf.id}`);
            }
            if (!silent) this.showToast('✓ Workflow saved');
        } catch {
            this.showToast('⚠ Failed to save workflow');
        }
    }

    async toggleActivation(checked: boolean): Promise<void> {
        if (checked && !this.validate()) {
            this.setActivationUI(false);
            return;
        }
        this.setActivationUI(checked);
        await this.save(checked, true);
        this.showToast(checked ? '🚀 Workflow activated!' : '⏹ Workflow deactivated');
    }

    loadFlowState(data: WorkflowData): void {
        const nameInput = document.querySelector<HTMLInputElement>('.process-name');
        if (nameInput) nameInput.value = data.name;
        this.setActivationUI(data.active);

        Object.keys(this.state.nodes).forEach(id => document.getElementById(id)?.remove());
        Object.keys(this.state.nodes).forEach(id => {
            delete this.state.nodes[id];
        });
        this.state.connections.length = 0;
        this.state.nodeCounter = 0;

        Object.values(data.nodes).forEach(node => {
            this.state.nodes[node.id] = node;
            NodeMgr.render(node);
            const num = parseInt(node.id.replace('node_', ''), 10);
            if (!isNaN(num) && num > this.state.nodeCounter) this.state.nodeCounter = num;
        });

        data.connections.forEach(c => this.state.connections.push(c));
        Conns.render();

        if (Object.keys(this.state.nodes).length > 0) {
            document.getElementById('canvasHint')?.classList.add('hidden');
        }
    }

    // ── Canvas actions ───────────────────────────────────────────────────────────

    private doClear(): void {
        Object.keys(this.state.nodes).forEach(id => document.getElementById(id)?.remove());
        this.state.nodes = {};
        this.state.connections = [];
        this.state.nodeCounter = 0;
        this.state.svgLayer.querySelectorAll('.connection-line').forEach(e => e.remove());
        Props.select(null);
        document.getElementById('canvasHint')!.classList.remove('hidden');
    }

    clear(): void {
        if (Object.keys(this.state.nodes).length === 0) return;
        showConfirm('Clear the entire canvas?', () => this.doClear());
    }

    // ── Example flow ─────────────────────────────────────────────────────────────

    private buildExample(): void {
        document.getElementById('canvasHint')!.classList.add('hidden');

        const t1 = NodeMgr.create('trigger', 'event_lead', 300, 40, {label: 'New Lead Arrives'});
        const a1 = NodeMgr.create('action', 'send_email', 300, 180, {
            label: 'Send Welcome Email',
            template: 'Welcome Email'
        });
        const a2 = NodeMgr.create('action', 'create_task', 300, 320, {
            label: 'Create Follow-up Task',
            taskTitle: 'Call the new lead',
            assignee: 'Account owner',
        });
        const c1 = NodeMgr.create('condition', 'if_else', 300, 460, {
            label: 'Lead Score ≥ 80?',
            condField: 'Lead Score',
            operator: 'greater than',
            condValue: '80',
        });
        const a3 = NodeMgr.create('action', 'move_stage', 120, 620, {
            label: 'Move to Negotiation',
            stage: 'Negotiation'
        });
        const a4 = NodeMgr.create('action', 'notify', 490, 620, {
            label: 'Notify Sales Manager',
            message: 'Low score lead: {{contact.name}}',
        });
        const w1 = NodeMgr.create('wait', 'wait_time', 120, 760, {
            label: 'Wait 2 Days',
            durValue: '2',
            durUnit: 'days'
        });
        const e1 = NodeMgr.create('end', 'end', 120, 900, {label: 'End'});
        const e2 = NodeMgr.create('end', 'end', 490, 760, {label: 'End'});

        setTimeout(() => {
            this.state.connections = [
                {from: t1, fromPort: 'out', to: a1},
                {from: a1, fromPort: 'out', to: a2},
                {from: a2, fromPort: 'out', to: c1},
                {from: c1, fromPort: 'out_yes', to: a3},
                {from: c1, fromPort: 'out_no', to: a4},
                {from: a3, fromPort: 'out', to: w1},
                {from: w1, fromPort: 'out', to: e1},
                {from: a4, fromPort: 'out', to: e2},
            ];
            Conns.render();
        }, 100);
    }

    loadExample(): void {
        if (Object.keys(this.state.nodes).length > 0) {
            showConfirm('Load example flow? Current canvas will be replaced.', () => {
                this.doClear();
                this.buildExample();
            });
        } else {
            this.buildExample();
        }
    }

    // ── Toast ────────────────────────────────────────────────────────────────────

    showToast(msg: string): void {
        const t = document.getElementById('toast')!;
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2800);
    }

    // ── Ctrl+Wheel zoom ──────────────────────────────────────────────────────────

    onWheel(e: WheelEvent): void {
        if (!e.ctrlKey) return;
        e.preventDefault();

        const wrap = document.getElementById('canvasWrap')!;
        const rect = wrap.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        const delta = e.deltaY < 0 ? 0.1 : -0.1;
        const newScale = Math.min(2, Math.max(0.3, this.state.scale + delta));
        if (newScale === this.state.scale) return;

        this.state.panX = cursorX - (cursorX - this.state.panX) * (newScale / this.state.scale);
        this.state.panY = cursorY - (cursorY - this.state.panY) * (newScale / this.state.scale);
        this.state.scale = newScale;

        document.getElementById('zoomLabel')!.textContent = `${Math.round(this.state.scale * 100)}%`;
        Canvas.update();
        Conns.render();
    }

    // ── Init ─────────────────────────────────────────────────────────────────────

    async init(): Promise<void> {
        this.state.canvas = document.getElementById('canvas') as HTMLDivElement;
        this.state.svgLayer = document.getElementById('svg-layer') as unknown as SVGSVGElement;

        Theme.apply(localStorage.getItem('theme') === 'light');

        const wrap = document.getElementById('canvasWrap')!;
        wrap.addEventListener('mousedown', e => Canvas.onMouseDown(e));
        wrap.addEventListener('mousemove', e => Canvas.onMouseMove(e));
        wrap.addEventListener('mouseup', e => Canvas.onMouseUp(e));
        wrap.addEventListener('wheel', e => this.onWheel(e), {passive: false});

        Panel.init();

        const wfId = new URLSearchParams(window.location.search).get('id');
        if (wfId) {
            this.state.currentWorkflowId = wfId;
            try {
                const res = await fetch(`/api/workflows/${wfId}`);
                if (res.ok) {
                    this.loadFlowState((await res.json()) as WorkflowData);
                } else {
                    this.loadExample();
                }
            } catch {
                this.loadExample();
            }
        } else {
            this.loadExample();
        }
    }
}

const Editor = new WorkflowEditor(state);

// ── Global wrappers ───────────────────────────────────────────────────────────
function validateFlow(): boolean {
    return Editor.validate();
}

async function saveWorkflow(active?: boolean, silent = false): Promise<void> {
    return Editor.save(active, silent);
}

async function toggleActivation(checked: boolean): Promise<void> {
    return Editor.toggleActivation(checked);
}

function clearCanvas(): void {
    Editor.clear();
}

function loadExample(): void {
    Editor.loadExample();
}

function showToast(msg: string): void {
    Editor.showToast(msg);
}

// ── Keyboard ─────────────────────────────────────────────────────────────────
document.addEventListener('keydown', (e: KeyboardEvent) => {
    const active = document.activeElement as HTMLElement;
    const isEditing = active.tagName === 'INPUT' || active.tagName === 'TEXTAREA';
    if ((e.key === 'Delete' || e.key === 'Backspace') && Props.selectedNode && !isEditing) {
        NodeMgr.delete(Props.selectedNode);
    }
    if (e.key === 'Escape') Conns.cancel();
});

// ── bfcache sync ─────────────────────────────────────────────────────────────
window.addEventListener('pageshow', async (e: PageTransitionEvent) => {
    if (e.persisted && state.currentWorkflowId) {
        try {
            const res = await fetch(`/api/workflows/${state.currentWorkflowId}`);
            if (res.ok) {
                const wf = (await res.json()) as WorkflowData;
                Editor.setActivationUI(wf.active);
            }
        } catch {
            // silently ignore — stale UI is better than a broken page
        }
    }
});

document.addEventListener('DOMContentLoaded', () => Editor.init());
