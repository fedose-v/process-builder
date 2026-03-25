import express, {Request, Response} from 'express';
import fs from 'fs';
import path from 'path';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkflowRecord {
    id: string;
    name: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
    nodes: Record<string, unknown>;
    connections: unknown[];
}

// ─── Server ───────────────────────────────────────────────────────────────────

class WorkflowServer {
    private readonly app = express();
    private readonly port = process.env.PORT ?? 3000;
    private readonly dataDir = path.join(__dirname, 'data');
    private readonly dataFile = path.join(__dirname, 'data', 'workflows.json');

    constructor() {
        this.app.use(express.json());
        this.app.use(express.static(path.join(__dirname, 'public')));
        this.registerRoutes();
    }

    private load(): WorkflowRecord[] {
        if (!fs.existsSync(this.dataFile)) return [];
        try {
            return JSON.parse(fs.readFileSync(this.dataFile, 'utf8')) as WorkflowRecord[];
        } catch {
            return [];
        }
    }

    private persist(workflows: WorkflowRecord[]): void {
        fs.mkdirSync(this.dataDir, {recursive: true});
        fs.writeFileSync(this.dataFile, JSON.stringify(workflows, null, 2), 'utf8');
    }

    private registerRoutes(): void {
        this.app.get('/', (_req: Request, res: Response) => {
            res.sendFile(path.join(__dirname, 'public', 'index.html'));
        });

        this.app.get('/builder', (_req: Request, res: Response) => {
            res.sendFile(path.join(__dirname, 'public', 'builder.html'));
        });

        this.app.get('/api/workflows', (_req: Request, res: Response) => {
            res.json(this.load());
        });

        this.app.get('/api/workflows/:id', (req: Request, res: Response) => {
            const wf = this.load().find(w => w.id === req.params.id);
            if (!wf) { res.status(404).json({error: 'Not found'}); return; }
            res.json(wf);
        });

        this.app.post('/api/workflows', (req: Request, res: Response) => {
            const workflows = this.load();
            const now = new Date().toISOString();
            const wf: WorkflowRecord = {
                id: `wf_${Date.now()}`,
                name: (req.body.name as string) || 'Untitled Workflow',
                active: Boolean(req.body.active),
                createdAt: now,
                updatedAt: now,
                nodes: (req.body.nodes as Record<string, unknown>) ?? {},
                connections: (req.body.connections as unknown[]) ?? [],
            };
            workflows.push(wf);
            this.persist(workflows);
            res.status(201).json(wf);
        });

        this.app.put('/api/workflows/:id', (req: Request, res: Response) => {
            const workflows = this.load();
            const idx = workflows.findIndex(w => w.id === req.params.id);
            if (idx === -1) { res.status(404).json({error: 'Not found'}); return; }
            workflows[idx] = {
                ...workflows[idx],
                name: (req.body.name as string) ?? workflows[idx].name,
                active: req.body.active !== undefined ? Boolean(req.body.active) : workflows[idx].active,
                nodes: (req.body.nodes as Record<string, unknown>) ?? workflows[idx].nodes,
                connections: (req.body.connections as unknown[]) ?? workflows[idx].connections,
                updatedAt: new Date().toISOString(),
            };
            this.persist(workflows);
            res.json(workflows[idx]);
        });

        this.app.patch('/api/workflows/:id/toggle', (req: Request, res: Response) => {
            const workflows = this.load();
            const idx = workflows.findIndex(w => w.id === req.params.id);
            if (idx === -1) { res.status(404).json({error: 'Not found'}); return; }
            workflows[idx].active = !workflows[idx].active;
            workflows[idx].updatedAt = new Date().toISOString();
            this.persist(workflows);
            res.json(workflows[idx]);
        });

        this.app.delete('/api/workflows/:id', (req: Request, res: Response) => {
            this.persist(this.load().filter(w => w.id !== req.params.id));
            res.json({ok: true});
        });
    }

    start(): void {
        this.app.listen(this.port, () => {
            console.log(`CRM Process Builder running on http://localhost:${this.port}`);
        });
    }
}

new WorkflowServer().start();
