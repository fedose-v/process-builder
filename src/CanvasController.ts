// ═══════════════════════════════════════════════════════════
// CANVAS CONTROLLER
// ═══════════════════════════════════════════════════════════

class CanvasController {
    private isDraggingNode = false;
    private dragNodeId: string | null = null;
    private dragOffsetX = 0;
    private dragOffsetY = 0;
    private isPanning = false;
    private panStartX = 0;
    private panStartY = 0;

    constructor(private state: AppState) {
    }

    startDragNode(e: MouseEvent, nodeId: string): void {
        this.isDraggingNode = true;
        this.dragNodeId = nodeId;
        const node = this.state.nodes[nodeId];
        this.dragOffsetX = (e.clientX - this.state.panX) / this.state.scale - node.x;
        this.dragOffsetY = (e.clientY - this.state.panY) / this.state.scale - node.y;
    }

    onMouseDown(e: MouseEvent): void {
        if (e.target === document.getElementById('canvasWrap') ||
            (e.target as Element).classList.contains('canvas-bg') ||
            e.target === document.getElementById('canvas')) {
            this.isPanning = true;
            this.panStartX = e.clientX - this.state.panX;
            this.panStartY = e.clientY - this.state.panY;
            document.getElementById('canvas')!.classList.add('panning');
            Props.select(null);
        }
    }

    onMouseMove(e: MouseEvent): void {
        if (this.isDraggingNode && this.dragNodeId) {
            const node = this.state.nodes[this.dragNodeId];
            node.x = (e.clientX - this.state.panX) / this.state.scale - this.dragOffsetX;
            node.y = (e.clientY - this.state.panY) / this.state.scale - this.dragOffsetY;
            const el = document.getElementById(this.dragNodeId);
            if (el) {
                el.style.left = node.x + 'px';
                el.style.top = node.y + 'px';
            }
            Conns.render();
        }
        if (this.isPanning) {
            this.state.panX = e.clientX - this.panStartX;
            this.state.panY = e.clientY - this.panStartY;
            this.update();
            Conns.render();
        }
        const {connectingFrom, previewLine} = this.state;
        if (connectingFrom && previewLine) {
            const wrapRect = document.getElementById('canvasWrap')!.getBoundingClientRect();
            const mx = e.clientX - wrapRect.left;
            const my = e.clientY - wrapRect.top;
            const from = Conns.getPortCenter(connectingFrom.nodeId, connectingFrom.portType);
            previewLine.setAttribute('d', Conns.cubicPath(from.x, from.y, mx, my));
        }
    }

    onMouseUp(_e: MouseEvent): void {
        this.isDraggingNode = false;
        this.dragNodeId = null;
        this.isPanning = false;
        document.getElementById('canvas')!.classList.remove('panning');
        if (this.state.connectingFrom) Conns.cancel();
    }

    update(): void {
        const {canvas, panX, panY, scale} = this.state;
        canvas.style.transform = 'translate(' + panX + 'px, ' + panY + 'px) scale(' + scale + ')';
        canvas.style.transformOrigin = '0 0';
    }

    zoom(delta: number): void {
        this.state.scale = Math.min(2, Math.max(0.3, this.state.scale + delta));
        document.getElementById('zoomLabel')!.textContent = Math.round(this.state.scale * 100) + '%';
        this.update();
        Conns.render();
    }

    resetView(): void {
        this.state.scale = 1;
        this.state.panX = 0;
        this.state.panY = 0;
        document.getElementById('zoomLabel')!.textContent = '100%';
        this.update();
        Conns.render();
    }

    autoLayout(): void {
        const {nodes, connections} = this.state;
        const nodeIds = Object.keys(nodes);
        if (nodeIds.length === 0) return;

        const children: Record<string, string[]> = {};
        const parents: Record<string, string[]> = {};
        nodeIds.forEach(id => {
            children[id] = [];
            parents[id] = [];
        });
        connections.forEach(c => {
            if (children[c.from].indexOf(c.to) === -1) children[c.from].push(c.to);
            if (parents[c.to].indexOf(c.from) === -1) parents[c.to].push(c.from);
        });

        let roots = nodeIds.filter(id => parents[id].length === 0);
        if (roots.length === 0) roots = [nodeIds[0]];
        const levels: Record<string, number> = {};
        const queue = roots.slice();
        roots.forEach(r => {
            levels[r] = 0;
        });
        while (queue.length) {
            const curr = queue.shift()!;
            children[curr].forEach(child => {
                if (levels[child] === undefined || levels[child] < levels[curr] + 1) {
                    levels[child] = levels[curr] + 1;
                    queue.push(child);
                }
            });
        }
        nodeIds.forEach(id => {
            if (levels[id] === undefined) levels[id] = 0;
        });

        const slots: Record<string, number> = {};
        let slotCounter = 0;
        const visited: Record<string, boolean> = {};

        const assignSlots = (id: string): void => {
            if (visited[id]) return;
            visited[id] = true;
            const ch = children[id];
            if (ch.length === 0) {
                slots[id] = slotCounter++;
            } else {
                ch.forEach(child => assignSlots(child));
                const childSlots = ch.map(c => slots[c]);
                slots[id] = (Math.min(...childSlots) + Math.max(...childSlots)) / 2;
            }
        };

        roots.forEach(r => assignSlots(r));
        nodeIds.forEach(id => {
            if (!visited[id]) slots[id] = slotCounter++;
        });

        const minSlot = Math.min(...nodeIds.map(id => slots[id]));
        nodeIds.forEach(id => {
            slots[id] -= minSlot;
        });

        const nodeW = 220, nodeH = 90, hGap = 80, vGap = 50;
        const maxSlot = Math.max(...nodeIds.map(id => slots[id]));
        const startX = Math.max(40, 400 - (maxSlot * (nodeW + hGap) + nodeW) / 2);

        nodeIds.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.transition = 'left 0.4s cubic-bezier(0.4,0,0.2,1), top 0.4s cubic-bezier(0.4,0,0.2,1)';
        });

        nodeIds.forEach(id => {
            nodes[id].x = slots[id] * (nodeW + hGap) + startX;
            nodes[id].y = 60 + levels[id] * (nodeH + vGap);
            const el = document.getElementById(id);
            if (el) {
                el.style.left = nodes[id].x + 'px';
                el.style.top = nodes[id].y + 'px';
            }
        });

        let rafId: number;
        const tick = (): void => {
            Conns.render();
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        setTimeout(() => {
            cancelAnimationFrame(rafId);
            Conns.render();
            nodeIds.forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.transition = '';
            });
        }, 420);

        showToast('Layout applied');
    }
}

const Canvas = new CanvasController(state);

function startDragNode(e: MouseEvent, nodeId: string): void {
    Canvas.startDragNode(e, nodeId);
}

function onCanvasMouseDown(e: MouseEvent): void {
    Canvas.onMouseDown(e);
}

function onCanvasMouseMove(e: MouseEvent): void {
    Canvas.onMouseMove(e);
}

function onCanvasMouseUp(e: MouseEvent): void {
    Canvas.onMouseUp(e);
}

function updateCanvas(): void {
    Canvas.update();
}

function zoom(delta: number): void {
    Canvas.zoom(delta);
}

function resetView(): void {
    Canvas.resetView();
}

function autoLayout(): void {
    Canvas.autoLayout();
}
