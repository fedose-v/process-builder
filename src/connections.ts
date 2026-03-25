// ═══════════════════════════════════════════════════════════
// CONNECTIONS
// ═══════════════════════════════════════════════════════════

class ConnectionManager {
    private hitData: ConnHitEntry[] = [];
    private hoverListenerAdded = false;

    constructor(private state: AppState) {}

    start(e: MouseEvent, nodeId: string, portType: string): void {
        this.state.connectingFrom = {nodeId, portType};
        this.state.previewLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.state.previewLine.classList.add('connection-line', 'preview');
        this.state.previewLine.setAttribute('marker-end', 'url(#arrow)');
        this.state.svgLayer.appendChild(this.state.previewLine);
    }

    finish(toNodeId: string): void {
        const {connectingFrom} = this.state;
        if (!connectingFrom) return;
        const existing = this.state.connections.find(c =>
            c.from === connectingFrom.nodeId && c.fromPort === connectingFrom.portType && c.to === toNodeId
        );
        if (!existing && connectingFrom.nodeId !== toNodeId) {
            this.state.connections.push({
                from: connectingFrom.nodeId,
                fromPort: connectingFrom.portType,
                to: toNodeId,
            });
            this.render();
        }
        this.cancel();
    }

    cancel(): void {
        if (this.state.previewLine) {
            this.state.previewLine.remove();
            this.state.previewLine = null;
        }
        this.state.connectingFrom = null;
    }

    getPortCenter(nodeId: string, portType: string): Point {
        const el = document.getElementById(nodeId);
        if (!el) return {x: 0, y: 0};
        const port = el.querySelector('[data-port="' + portType + '"]');
        const wrapRect = document.getElementById('canvasWrap')!.getBoundingClientRect();
        if (port) {
            const r = port.getBoundingClientRect();
            return {
                x: r.left + r.width / 2 - wrapRect.left,
                y: r.top + r.height / 2 - wrapRect.top,
            };
        }
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2 - wrapRect.left;
        if (portType === 'in') return {x: cx, y: r.top - wrapRect.top};
        return {x: cx, y: r.bottom - wrapRect.top};
    }

    cubicPath(x1: number, y1: number, x2: number, y2: number): string {
        const dy = Math.abs(y2 - y1);
        const cp = Math.max(60, dy * 0.5);
        return 'M ' + x1 + ' ' + y1 + ' C ' + x1 + ' ' + (y1 + cp) + ', ' + x2 + ' ' + (y2 - cp) + ', ' + x2 + ' ' + y2;
    }

    private sampleBezier(x1: number, y1: number, x2: number, y2: number): Point[] {
        const dy = Math.abs(y2 - y1);
        const cp = Math.max(60, dy * 0.5);
        const pts: Point[] = [];
        for (let i = 0; i <= 24; i++) {
            const t = i / 24;
            const u = 1 - t;
            pts.push({
                x: u * u * u * x1 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x2,
                y: u * u * u * y1 + 3 * u * u * t * (y1 + cp) + 3 * u * t * t * (y2 - cp) + t * t * t * y2,
            });
        }
        return pts;
    }

    private onHover(e: MouseEvent): void {
        const wrap = document.getElementById('canvasWrap')!;
        const rect = wrap.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const THRESHOLD = 12;
        this.hitData.forEach(h => {
            const near = h.points.some(p => {
                const dx = p.x - mx, dy = p.y - my;
                return dx * dx + dy * dy <= THRESHOLD * THRESHOLD;
            });
            h.btn.style.opacity = near ? '1' : '0';
            if (near) h.line.classList.add('conn-highlight');
            else h.line.classList.remove('conn-highlight');
        });
    }

    render(): void {
        const {svgLayer, canvas, connections, panX, panY, scale} = this.state;

        svgLayer.querySelectorAll('.conn-group, .connection-line:not(.preview)').forEach(e => e.remove());
        canvas.querySelectorAll('.conn-del-btn').forEach(e => e.remove());
        this.hitData = [];

        if (!this.hoverListenerAdded) {
            document.getElementById('canvasWrap')!.addEventListener('mousemove', e => this.onHover(e));
            this.hoverListenerAdded = true;
        }

        connections.forEach((conn, i) => {
            const fromPort = conn.fromPort || 'out';
            const from = this.getPortCenter(conn.from, fromPort);
            const to = this.getPortCenter(conn.to, 'in');
            const d = this.cubicPath(from.x, from.y, to.x, to.y);

            const isYes = fromPort === 'out_yes';
            const isNo = fromPort === 'out_no';
            const color = isYes ? '#22c55e' : (isNo ? '#ef4444' : '#7c6aff');
            const arrow = isYes ? 'arrow-yes' : (isNo ? 'arrow-no' : 'arrow');

            const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            g.classList.add('conn-group');

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            line.classList.add('connection-line');
            if (isYes) line.classList.add('yes');
            else if (isNo) line.classList.add('no');
            line.setAttribute('marker-end', 'url(#' + arrow + ')');
            line.setAttribute('d', d);
            g.appendChild(line);
            svgLayer.appendChild(g);

            const midX = (from.x + to.x) / 2;
            const midY = (from.y + to.y) / 2;
            const btnX = (midX - panX) / scale;
            const btnY = (midY - panY) / scale;

            const btn = document.createElement('div') as HTMLDivElement;
            btn.className = 'conn-del-btn';
            btn.style.left = btnX + 'px';
            btn.style.top = btnY + 'px';
            btn.style.borderColor = color;
            btn.style.color = color;
            btn.title = 'Remove connection';
            btn.textContent = '×';

            btn.addEventListener('mouseenter', () => { line.classList.add('conn-highlight'); });
            btn.addEventListener('click', (e: MouseEvent) => {
                e.stopPropagation();
                this.state.connections.splice(i, 1);
                this.render();
            });

            canvas.appendChild(btn);

            this.hitData.push({
                btn,
                line,
                points: this.sampleBezier(from.x, from.y, to.x, to.y),
            });
        });
    }
}

const Conns = new ConnectionManager(state);

function startConnecting(e: MouseEvent, nodeId: string, portType: string): void { Conns.start(e, nodeId, portType); }
function finishConnection(toNodeId: string): void { Conns.finish(toNodeId); }
function cancelConnecting(): void { Conns.cancel(); }
function renderConnections(): void { Conns.render(); }
