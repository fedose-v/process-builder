// ═══════════════════════════════════════════════════════════
// DRAG NODES
// ═══════════════════════════════════════════════════════════
function startDragNode(e: MouseEvent, nodeId: string): void {
    isDraggingNode = true;
    dragNodeId = nodeId;
    const node = nodes[nodeId];
    dragOffsetX = (e.clientX - panX) / scale - node.x;
    dragOffsetY = (e.clientY - panY) / scale - node.y;
}

// ═══════════════════════════════════════════════════════════
// CANVAS MOUSE EVENTS
// ═══════════════════════════════════════════════════════════
function onCanvasMouseDown(e: MouseEvent): void {
    if (e.target === document.getElementById('canvasWrap') ||
        (e.target as Element).classList.contains('canvas-bg') ||
        e.target === document.getElementById('canvas')) {
        isPanning = true;
        panStartX = e.clientX - panX;
        panStartY = e.clientY - panY;
        document.getElementById('canvas')!.classList.add('panning');
        selectNode(null);
    }
}

function onCanvasMouseMove(e: MouseEvent): void {
    if (isDraggingNode && dragNodeId) {
        const node = nodes[dragNodeId];
        node.x = (e.clientX - panX) / scale - dragOffsetX;
        node.y = (e.clientY - panY) / scale - dragOffsetY;
        const el = document.getElementById(dragNodeId);
        if (el) {
            el.style.left = node.x + 'px';
            el.style.top = node.y + 'px';
        }
        renderConnections();
    }
    if (isPanning) {
        panX = e.clientX - panStartX;
        panY = e.clientY - panStartY;
        updateCanvas();
        renderConnections();
    }
    if (connectingFrom && previewLine) {
        const wrapRect = document.getElementById('canvasWrap')!.getBoundingClientRect();
        const mx = e.clientX - wrapRect.left;
        const my = e.clientY - wrapRect.top;
        const from = getPortCenter(connectingFrom.nodeId, connectingFrom.portType);
        previewLine.setAttribute('d', cubicPath(from.x, from.y, mx, my));
    }
}

function onCanvasMouseUp(e: MouseEvent): void {
    isDraggingNode = false;
    dragNodeId = null;
    isPanning = false;
    document.getElementById('canvas')!.classList.remove('panning');
    if (connectingFrom) cancelConnecting();
}

function updateCanvas(): void {
    canvas.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + scale + ')';
    canvas.style.transformOrigin = '0 0';
}

// ═══════════════════════════════════════════════════════════
// TOOLS & ZOOM
// ═══════════════════════════════════════════════════════════
function setTool(tool: string): void {
    currentTool = tool;
    document.querySelectorAll('.tool-btn').forEach(function (b) {
        b.classList.remove('active');
    });
    const btn = document.getElementById('tool-' + tool);
    if (btn) btn.classList.add('active');
}

function zoom(delta: number): void {
    scale = Math.min(2, Math.max(0.3, scale + delta));
    document.getElementById('zoomLabel')!.textContent = Math.round(scale * 100) + '%';
    updateCanvas();
    renderConnections();
}

function resetView(): void {
    scale = 1;
    panX = 0;
    panY = 0;
    document.getElementById('zoomLabel')!.textContent = '100%';
    updateCanvas();
    renderConnections();
}

// ═══════════════════════════════════════════════════════════
// AUTO LAYOUT
// ═══════════════════════════════════════════════════════════
function autoLayout(): void {
    const nodeIds = Object.keys(nodes);
    if (nodeIds.length === 0) return;

    // Build adjacency
    let children: Record<string, string[]> = {};
    let parents: Record<string, string[]> = {};
    nodeIds.forEach(function (id) {
        children[id] = [];
        parents[id] = [];
    });
    connections.forEach(function (c) {
        if (children[c.from].indexOf(c.to) === -1) children[c.from].push(c.to);
        if (parents[c.to].indexOf(c.from) === -1) parents[c.to].push(c.from);
    });

    // Assign levels via BFS
    let roots = nodeIds.filter(function (id) {
        return parents[id].length === 0;
    });
    if (roots.length === 0) roots = [nodeIds[0]];
    let levels: Record<string, number> = {};
    let queue = roots.slice();
    roots.forEach(function (r) {
        levels[r] = 0;
    });
    while (queue.length) {
        const curr = queue.shift()!;
        children[curr].forEach(function (child) {
            if (levels[child] === undefined || levels[child] < levels[curr] + 1) {
                levels[child] = levels[curr] + 1;
                queue.push(child);
            }
        });
    }
    nodeIds.forEach(function (id) {
        if (levels[id] === undefined) levels[id] = 0;
    });

    // Assign x-slots via DFS: leaves get sequential integer slots,
    // branch nodes are centered over their children — this prevents
    // condition branches from overlapping.
    let slots: Record<string, number> = {};
    let slotCounter = 0;
    let visited: Record<string, boolean> = {};

    function assignSlots(id: string): void {
        if (visited[id]) return;
        visited[id] = true;
        const ch = children[id];
        if (ch.length === 0) {
            slots[id] = slotCounter++;
        } else {
            ch.forEach(function (child) {
                assignSlots(child);
            });
            const childSlots = ch.map(function (c) {
                return slots[c];
            });
            slots[id] = (Math.min.apply(null, childSlots) + Math.max.apply(null, childSlots)) / 2;
        }
    }

    roots.forEach(function (r) {
        assignSlots(r);
    });
    // Handle disconnected nodes
    nodeIds.forEach(function (id) {
        if (!visited[id]) {
            slots[id] = slotCounter++;
        }
    });

    // Normalize slots so minimum is 0
    const minSlot = Math.min.apply(null, nodeIds.map(function (id) {
        return slots[id];
    }));
    nodeIds.forEach(function (id) {
        slots[id] -= minSlot;
    });

    const nodeW = 220, nodeH = 90, hGap = 80, vGap = 50;

    // Center the layout horizontally: compute startX so the layout's
    // midpoint lands at x=400 (typical canvas center).
    // Layout spans: startX … startX + maxSlot*(nodeW+hGap) + nodeW
    const maxSlot = Math.max.apply(null, nodeIds.map(function (id) {
        return slots[id];
    }));
    const startX = Math.max(40, 400 - (maxSlot * (nodeW + hGap) + nodeW) / 2);

    // Apply positions with smooth CSS transition
    nodeIds.forEach(function (id) {
        const el = document.getElementById(id);
        if (el) el.style.transition = 'left 0.4s cubic-bezier(0.4,0,0.2,1), top 0.4s cubic-bezier(0.4,0,0.2,1)';
    });

    nodeIds.forEach(function (id) {
        nodes[id].x = slots[id] * (nodeW + hGap) + startX;
        nodes[id].y = 60 + levels[id] * (nodeH + vGap);
        const el = document.getElementById(id);
        if (el) {
            el.style.left = nodes[id].x + 'px';
            el.style.top = nodes[id].y + 'px';
        }
    });

    // Redraw connections during animation, then clean up transition
    let rafId: number;

    function tick() {
        renderConnections();
        rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    setTimeout(function () {
        cancelAnimationFrame(rafId);
        renderConnections();
        nodeIds.forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.style.transition = '';
        });
    }, 420);

    showToast('Layout applied');
}
