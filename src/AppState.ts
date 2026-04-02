// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

interface NodeConfig {
    label?: string;
    cron?: string;
    fromStage?: string;
    toStage?: string;
    source?: string;
    template?: string;
    from?: string;
    delay?: string;
    message?: string;
    taskTitle?: string;
    assignee?: string;
    dueIn?: string;
    field?: string;
    value?: string;
    tags?: string[];
    notifyTo?: string;
    stage?: string;
    method?: string;
    url?: string;
    body?: string;
    condField?: string;
    operator?: string;
    condValue?: string;
    waitType?: string;
    durValue?: string;
    durUnit?: string;
    // get_managers
    territory?: string;
    role?: string;
    // create_activity
    activityType?: string;
    // add_note
    entityType?: string;
    noteText?: string;
    // deal_stage_move / new_email_template / get_email_templates
    pipeline?: string;
    templateName?: string;
    subject?: string;
    category?: string;
    // email_manager
    managerRole?: string;
    // web_hook
    webhookName?: string;
    // reschedule_activities
    newTime?: string;
    // update_lead / update_client
    leadField?: string;
    clientField?: string;
}

interface FlowNode {
    id: string;
    type: string;
    subtype: string;
    x: number;
    y: number;
    config: NodeConfig;
}

interface Connection {
    from: string;
    fromPort: string;
    to: string;
}

interface ConnectingFrom {
    nodeId: string;
    portType: string;
}

interface Point {
    x: number;
    y: number;
}

interface ConnHitEntry {
    btn: HTMLDivElement;
    line: SVGPathElement;
    points: Point[];
}

interface NodeDef {
    label: string;
    icon: string;
    badge: string;
    color: string;
}

interface PanelItem {
    type: string;
    subtype: string;
    icon: string;
    name: string;
    desc: string;
    bg: string;
}

interface PanelCategory {
    id: string;
    label: string;
    icon: string;
    color: string;
    bg: string;
    items: PanelItem[];
}

// Workflow data shapes shared between the builder and the home page
interface WorkflowSummary {
    id: string;
    name: string;
    active: boolean;
    createdAt: string;
    updatedAt: string;
}

interface WorkflowData extends WorkflowSummary {
    nodes: Record<string, FlowNode>;
    connections: Connection[];
}

// ═══════════════════════════════════════════════════════════
// APPLICATION STATE — single shared instance for the builder
// ═══════════════════════════════════════════════════════════

class AppState {
    // Canvas data
    nodes: Record<string, FlowNode> = {};
    connections: Connection[] = [];
    nodeCounter: number = 0;

    // Drag-from-panel
    draggedType: string | null = null;
    draggedSubtype: string | null = null;

    // Viewport
    panX: number = 0;
    panY: number = 0;
    scale: number = 1;

    // Active connection being drawn
    connectingFrom: ConnectingFrom | null = null;
    previewLine: SVGPathElement | null = null;

    // DOM references (assigned on DOMContentLoaded)
    canvas!: HTMLDivElement;
    svgLayer!: SVGSVGElement;

    // Workflow persistence
    currentWorkflowId: string | null = null;
}

const state = new AppState();
