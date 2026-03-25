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

// ─── Storage ──────────────────────────────────────────────────────────────────

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'workflows.json');

function loadWorkflows(): WorkflowRecord[] {
    if (!fs.existsSync(DATA_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as WorkflowRecord[];
    } catch {
        return [];
    }
}

function persistWorkflows(workflows: WorkflowRecord[]): void {
    fs.mkdirSync(DATA_DIR, {recursive: true});
    fs.writeFileSync(DATA_FILE, JSON.stringify(workflows, null, 2), 'utf8');
}

// ─── App ──────────────────────────────────────────────────────────────────────

const app = express();
const PORT = process.env.PORT ?? 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Pages ────────────────────────────────────────────────────────────────────

app.get('/', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/builder', (_req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'builder.html'));
});

// ─── Workflow API ─────────────────────────────────────────────────────────────

app.get('/api/workflows', (_req: Request, res: Response) => {
    res.json(loadWorkflows());
});

app.get('/api/workflows/:id', (req: Request, res: Response) => {
    const wf = loadWorkflows().find(w => w.id === req.params.id);
    if (!wf) {
        res.status(404).json({error: 'Not found'});
        return;
    }
    res.json(wf);
});

app.post('/api/workflows', (req: Request, res: Response) => {
    const workflows = loadWorkflows();
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
    persistWorkflows(workflows);
    res.status(201).json(wf);
});

app.put('/api/workflows/:id', (req: Request, res: Response) => {
    const workflows = loadWorkflows();
    const idx = workflows.findIndex(w => w.id === req.params.id);
    if (idx === -1) {
        res.status(404).json({error: 'Not found'});
        return;
    }
    workflows[idx] = {
        ...workflows[idx],
        name: (req.body.name as string) ?? workflows[idx].name,
        active: req.body.active !== undefined ? Boolean(req.body.active) : workflows[idx].active,
        nodes: (req.body.nodes as Record<string, unknown>) ?? workflows[idx].nodes,
        connections: (req.body.connections as unknown[]) ?? workflows[idx].connections,
        updatedAt: new Date().toISOString(),
    };
    persistWorkflows(workflows);
    res.json(workflows[idx]);
});

app.patch('/api/workflows/:id/toggle', (req: Request, res: Response) => {
    const workflows = loadWorkflows();
    const idx = workflows.findIndex(w => w.id === req.params.id);
    if (idx === -1) {
        res.status(404).json({error: 'Not found'});
        return;
    }
    workflows[idx].active = !workflows[idx].active;
    workflows[idx].updatedAt = new Date().toISOString();
    persistWorkflows(workflows);
    res.json(workflows[idx]);
});

app.delete('/api/workflows/:id', (req: Request, res: Response) => {
    persistWorkflows(loadWorkflows().filter(w => w.id !== req.params.id));
    res.json({ok: true});
});

app.listen(PORT, () => {
    console.log(`CRM Process Builder running on http://localhost:${PORT}`);
});
