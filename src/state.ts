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

// ═══════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════
var nodes: Record<string, FlowNode> = {};
var connections: Connection[] = [];
var selectedNode: string | null = null;
var draggedType: string | null = null;
var draggedSubtype: string | null = null;
var currentTool: string = 'select';
var scale: number = 1;
var connectingFrom: ConnectingFrom | null = null;
var previewLine: SVGPathElement | null = null;
var nodeCounter: number = 0;
var isDraggingNode: boolean = false;
var dragNodeId: string | null = null;
var dragOffsetX: number = 0;
var dragOffsetY: number = 0;
var isPanning: boolean = false;
var panStartX: number = 0;
var panStartY: number = 0;
var panX: number = 0;
var panY: number = 0;
var canvas: HTMLDivElement;
var svgLayer: SVGSVGElement;
