// ═══════════════════════════════════════════════════════════
// VALIDATE
// ═══════════════════════════════════════════════════════════

function clearValidationErrors(): void {
    Object.keys(nodes).forEach(id => {
        document.getElementById(id)?.classList.remove('invalid');
    });
}

function applyInvalid(ids: string[]): void {
    ids.forEach(id => document.getElementById(id)?.classList.add('invalid'));
}

function validateFlow(): boolean {
    const nodeIds = Object.keys(nodes);
    clearValidationErrors();

    if (nodeIds.length === 0) {
        showToast('Add at least one trigger to start');
        return false;
    }

    const triggers = nodeIds.filter(id => nodes[id].type === 'trigger');
    if (triggers.length === 0) {
        applyInvalid(nodeIds);
        showToast('⚠ No trigger found. Add a trigger node.');
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
        if (node.type === 'trigger') {
            bad = !hasOut;
        } else if (node.type === 'end') {
            bad = !hasIn;
        } else if (node.type === 'condition') {
            // Condition needs incoming + both Yes and No outputs
            bad = !hasIn || !hasOutYes || !hasOutNo;
        } else {
            bad = !hasIn || !hasOut;
        }

        if (bad) invalidIds.push(id);
    });

    applyInvalid(invalidIds);

    if (invalidIds.length > 0) {
        showToast(`⚠ ${invalidIds.length} node(s) have connection issues`);
        return false;
    }

    showToast('✓ Flow is valid and ready to activate!');
    return true;
}

// ═══════════════════════════════════════════════════════════
// SAVE / LOAD WORKFLOW
// ═══════════════════════════════════════════════════════════

function setActivationUI(active: boolean): void {
    const toggle = document.getElementById('activateToggle') as HTMLInputElement | null;
    const label = document.getElementById('activateLabel');
    if (toggle) toggle.checked = active;
    if (label) {
        label.textContent = active ? 'Active' : 'Inactive';
        label.className = `act-label ${active ? 'act-label--on' : ''}`;
    }
}

/**
 * Persists the current canvas state.
 * @param active - explicit active flag; if omitted the current toggle state is used.
 * @param silent - when true, skips the success toast (caller shows its own message).
 */
async function saveWorkflow(active?: boolean, silent = false): Promise<void> {
    const nameInput = document.querySelector<HTMLInputElement>('.process-name');
    const name = nameInput?.value.trim() || 'Untitled Workflow';

    // Resolve active state: explicit arg > current toggle > false
    const toggle = document.getElementById('activateToggle') as HTMLInputElement | null;
    const isActive = active ?? toggle?.checked ?? false;

    const payload = {name, nodes, connections, active: isActive};

    try {
        if (currentWorkflowId) {
            await fetch(`/api/workflows/${currentWorkflowId}`, {
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
            currentWorkflowId = wf.id;
            history.replaceState(null, '', `/builder?id=${wf.id}`);
        }
        if (!silent) showToast('✓ Workflow saved');
    } catch {
        showToast('⚠ Failed to save workflow');
    }
}

async function toggleActivation(checked: boolean): Promise<void> {
    if (checked && !validateFlow()) {
        setActivationUI(false);
        return;
    }
    setActivationUI(checked);
    await saveWorkflow(checked, true);
    showToast(checked ? '🚀 Workflow activated!' : '⏹ Workflow deactivated');
}

function loadFlowState(data: WorkflowData): void {
    // Restore header fields
    const nameInput = document.querySelector<HTMLInputElement>('.process-name');
    if (nameInput) nameInput.value = data.name;
    setActivationUI(data.active);

    // Clear existing canvas content
    Object.keys(nodes).forEach(id => document.getElementById(id)?.remove());
    Object.keys(nodes).forEach(id => {
        delete nodes[id];
    });
    connections.length = 0;
    nodeCounter = 0;

    // Restore nodes (use existing IDs from saved data, don't create new ones)
    Object.values(data.nodes).forEach(node => {
        nodes[node.id] = node;
        renderNode(node);
        // Keep nodeCounter ahead of the highest restored ID
        const num = parseInt(node.id.replace('node_', ''), 10);
        if (!isNaN(num) && num > nodeCounter) nodeCounter = num;
    });

    // Restore connections
    data.connections.forEach(c => connections.push(c));
    renderConnections();

    if (Object.keys(nodes).length > 0) {
        document.getElementById('canvasHint')?.classList.add('hidden');
    }
}

// ═══════════════════════════════════════════════════════════
// CANVAS ACTIONS
// ═══════════════════════════════════════════════════════════

function _doClear(): void {
    Object.keys(nodes).forEach(id => document.getElementById(id)?.remove());
    nodes = {};
    connections = [];
    nodeCounter = 0;
    svgLayer.querySelectorAll('.connection-line').forEach(e => e.remove());
    selectNode(null);
    document.getElementById('canvasHint')!.classList.remove('hidden');
}

function clearCanvas(): void {
    if (Object.keys(nodes).length === 0) return;
    showConfirm('Clear the entire canvas?', _doClear);
}

// ═══════════════════════════════════════════════════════════
// EXAMPLE FLOW
// ═══════════════════════════════════════════════════════════

function _buildExample(): void {
    document.getElementById('canvasHint')!.classList.add('hidden');

    const t1 = createNode('trigger', 'event_lead', 300, 40, {label: 'New Lead Arrives'});
    const a1 = createNode('action', 'send_email', 300, 180, {label: 'Send Welcome Email', template: 'Welcome Email'});
    const a2 = createNode('action', 'create_task', 300, 320, {
        label: 'Create Follow-up Task',
        taskTitle: 'Call the new lead',
        assignee: 'Account owner'
    });
    const c1 = createNode('condition', 'if_else', 300, 460, {
        label: 'Lead Score ≥ 80?',
        condField: 'Lead Score',
        operator: 'greater than',
        condValue: '80'
    });
    const a3 = createNode('action', 'move_stage', 120, 620, {label: 'Move to Negotiation', stage: 'Negotiation'});
    const a4 = createNode('action', 'notify', 490, 620, {
        label: 'Notify Sales Manager',
        message: 'Low score lead: {{contact.name}}'
    });
    const w1 = createNode('wait', 'wait_time', 120, 760, {label: 'Wait 2 Days', durValue: '2', durUnit: 'days'});
    const e1 = createNode('end', 'end', 120, 900, {label: 'End'});
    const e2 = createNode('end', 'end', 490, 760, {label: 'End'});

    // Connections are set after a tick so DOM positions are computed
    setTimeout(() => {
        connections = [
            {from: t1, fromPort: 'out', to: a1},
            {from: a1, fromPort: 'out', to: a2},
            {from: a2, fromPort: 'out', to: c1},
            {from: c1, fromPort: 'out_yes', to: a3},
            {from: c1, fromPort: 'out_no', to: a4},
            {from: a3, fromPort: 'out', to: w1},
            {from: w1, fromPort: 'out', to: e1},
            {from: a4, fromPort: 'out', to: e2},
        ];
        renderConnections();
    }, 100);
}

function loadExample(): void {
    if (Object.keys(nodes).length > 0) {
        showConfirm('Load example flow? Current canvas will be replaced.', () => {
            _doClear();
            _buildExample();
        });
    } else {
        _buildExample();
    }
}

// ═══════════════════════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════════════════════

function showToast(msg: string): void {
    const t = document.getElementById('toast')!;
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 2800);
}

// ═══════════════════════════════════════════════════════════
// KEYBOARD
// ═══════════════════════════════════════════════════════════

document.addEventListener('keydown', (e: KeyboardEvent) => {
    const active = document.activeElement as HTMLElement;
    const isEditing = active.tagName === 'INPUT' || active.tagName === 'TEXTAREA';

    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode && !isEditing) {
        deleteNode(selectedNode);
    }
    if (e.key === 'Escape') cancelConnecting();
});

// ═══════════════════════════════════════════════════════════
// CTRL + WHEEL ZOOM
// ═══════════════════════════════════════════════════════════

function onCanvasWheel(e: WheelEvent): void {
    if (!e.ctrlKey) return;
    e.preventDefault();

    const wrap = document.getElementById('canvasWrap')!;
    const rect = wrap.getBoundingClientRect();

    // Cursor position relative to canvasWrap
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    const delta = e.deltaY < 0 ? 0.1 : -0.1;
    const newScale = Math.min(2, Math.max(0.3, scale + delta));
    if (newScale === scale) return;

    // Adjust pan so the canvas point under the cursor stays fixed
    panX = cursorX - (cursorX - panX) * (newScale / scale);
    panY = cursorY - (cursorY - panY) * (newScale / scale);
    scale = newScale;

    document.getElementById('zoomLabel')!.textContent = `${Math.round(scale * 100)}%`;
    updateCanvas();
    renderConnections();
}

// ═══════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════

// Re-sync active toggle when the browser restores this page from bfcache.
// The user may have toggled the workflow on the home page and navigated back.
window.addEventListener('pageshow', async (e: PageTransitionEvent) => {
    if (e.persisted && currentWorkflowId) {
        try {
            const res = await fetch(`/api/workflows/${currentWorkflowId}`);
            if (res.ok) {
                const wf = (await res.json()) as WorkflowData;
                setActivationUI(wf.active);
            }
        } catch {
            // silently ignore — stale UI is better than a broken page
        }
    }
});

document.addEventListener('DOMContentLoaded', async () => {
    canvas = document.getElementById('canvas') as HTMLDivElement;
    svgLayer = document.getElementById('svg-layer') as unknown as SVGSVGElement;

    applyTheme(localStorage.getItem('theme') === 'light');

    const wrap = document.getElementById('canvasWrap')!;
    wrap.addEventListener('mousedown', onCanvasMouseDown);
    wrap.addEventListener('mousemove', onCanvasMouseMove);
    wrap.addEventListener('mouseup', onCanvasMouseUp);
    wrap.addEventListener('wheel', onCanvasWheel, {passive: false});

    initPanel();

    // Load workflow by ID from URL, or fall back to the example flow
    const wfId = new URLSearchParams(window.location.search).get('id');
    if (wfId) {
        currentWorkflowId = wfId;
        try {
            const res = await fetch(`/api/workflows/${wfId}`);
            if (res.ok) {
                loadFlowState((await res.json()) as WorkflowData);
            } else {
                loadExample();
            }
        } catch {
            loadExample();
        }
    } else {
        loadExample();
    }
});
