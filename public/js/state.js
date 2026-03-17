// ═══════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════
var nodes = {};
var connections = [];
var selectedNode = null;
var draggedType = null;
var draggedSubtype = null;
var currentTool = 'select';
var scale = 1;
var connectingFrom = null;
var previewLine = null;
var nodeCounter = 0;
var isDraggingNode = false;
var dragNodeId = null;
var dragOffsetX = 0;
var dragOffsetY = 0;
var isPanning = false;
var panStartX = 0;
var panStartY = 0;
var panX = 0;
var panY = 0;
var canvas;
var svgLayer;
