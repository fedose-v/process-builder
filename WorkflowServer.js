"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// ─── Server ───────────────────────────────────────────────────────────────────
class WorkflowServer {
    constructor() {
        this.app = (0, express_1.default)();
        this.port = process.env.PORT ?? 3000;
        this.dataDir = path_1.default.join(__dirname, 'data');
        this.dataFile = path_1.default.join(__dirname, 'data', 'workflows.json');
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
        this.registerRoutes();
    }
    load() {
        if (!fs_1.default.existsSync(this.dataFile))
            return [];
        try {
            return JSON.parse(fs_1.default.readFileSync(this.dataFile, 'utf8'));
        }
        catch {
            return [];
        }
    }
    persist(workflows) {
        fs_1.default.mkdirSync(this.dataDir, { recursive: true });
        fs_1.default.writeFileSync(this.dataFile, JSON.stringify(workflows, null, 2), 'utf8');
    }
    registerRoutes() {
        this.app.get('/', (_req, res) => {
            res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
        });
        this.app.get('/builder', (_req, res) => {
            res.sendFile(path_1.default.join(__dirname, 'public', 'builder.html'));
        });
        this.app.get('/api/workflows', (_req, res) => {
            res.json(this.load());
        });
        this.app.get('/api/workflows/:id', (req, res) => {
            const wf = this.load().find(w => w.id === req.params.id);
            if (!wf) {
                res.status(404).json({ error: 'Not found' });
                return;
            }
            res.json(wf);
        });
        this.app.post('/api/workflows', (req, res) => {
            const workflows = this.load();
            const now = new Date().toISOString();
            const wf = {
                id: `wf_${Date.now()}`,
                name: req.body.name || 'Untitled Workflow',
                active: Boolean(req.body.active),
                createdAt: now,
                updatedAt: now,
                nodes: req.body.nodes ?? {},
                connections: req.body.connections ?? [],
            };
            workflows.push(wf);
            this.persist(workflows);
            res.status(201).json(wf);
        });
        this.app.put('/api/workflows/:id', (req, res) => {
            const workflows = this.load();
            const idx = workflows.findIndex(w => w.id === req.params.id);
            if (idx === -1) {
                res.status(404).json({ error: 'Not found' });
                return;
            }
            workflows[idx] = {
                ...workflows[idx],
                name: req.body.name ?? workflows[idx].name,
                active: req.body.active !== undefined ? Boolean(req.body.active) : workflows[idx].active,
                nodes: req.body.nodes ?? workflows[idx].nodes,
                connections: req.body.connections ?? workflows[idx].connections,
                updatedAt: new Date().toISOString(),
            };
            this.persist(workflows);
            res.json(workflows[idx]);
        });
        this.app.patch('/api/workflows/:id/toggle', (req, res) => {
            const workflows = this.load();
            const idx = workflows.findIndex(w => w.id === req.params.id);
            if (idx === -1) {
                res.status(404).json({ error: 'Not found' });
                return;
            }
            workflows[idx].active = !workflows[idx].active;
            workflows[idx].updatedAt = new Date().toISOString();
            this.persist(workflows);
            res.json(workflows[idx]);
        });
        this.app.delete('/api/workflows/:id', (req, res) => {
            this.persist(this.load().filter(w => w.id !== req.params.id));
            res.json({ ok: true });
        });
    }
    start() {
        this.app.listen(this.port, () => {
            console.log(`CRM Process Builder running on http://localhost:${this.port}`);
        });
    }
}
new WorkflowServer().start();
