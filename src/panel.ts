// ═══════════════════════════════════════════════════════════
// PANEL DATA
// ═══════════════════════════════════════════════════════════
const PANEL_CATEGORIES: PanelCategory[] = [
    {
        id: 'trigger', label: 'Triggers', icon: '⚡', color: '#3b82f6', bg: '#1e3a5f',
        items: [
            {type: 'trigger', subtype: 'event_lead', icon: '⚡', name: 'New Lead', desc: 'Lead created', bg: '#1e3a5f'},
            {
                type: 'trigger',
                subtype: 'event_deal',
                icon: '💼',
                name: 'Deal Stage',
                desc: 'Stage changed',
                bg: '#1e3a5f'
            },
            {
                type: 'trigger',
                subtype: 'event_form',
                icon: '📋',
                name: 'Form Submit',
                desc: 'Form filled',
                bg: '#1e3a5f'
            },
            {type: 'trigger', subtype: 'schedule', icon: '🕐', name: 'Schedule', desc: 'Cron / date', bg: '#1e3a5f'},
            {type: 'trigger', subtype: 'webhook', icon: '🔗', name: 'Webhook', desc: 'External call', bg: '#1e3a5f'}
        ]
    },
    {
        id: 'action', label: 'Actions', icon: '⚙️', color: '#7c6aff', bg: '#2d1e5f',
        items: [
            {
                type: 'action',
                subtype: 'send_email',
                icon: '📧',
                name: 'Send Email',
                desc: 'Email template',
                bg: '#2d1e5f'
            },
            {type: 'action', subtype: 'send_sms', icon: '💬', name: 'Send SMS', desc: 'Text message', bg: '#2d1e5f'},
            {
                type: 'action',
                subtype: 'create_task',
                icon: '✅',
                name: 'Create Task',
                desc: 'Assign to user',
                bg: '#2d1e5f'
            },
            {
                type: 'action',
                subtype: 'update_field',
                icon: '✏️',
                name: 'Update Field',
                desc: 'Set CRM field',
                bg: '#2d1e5f'
            },
            {type: 'action', subtype: 'add_tag', icon: '🏷️', name: 'Add Tag', desc: 'Tag contact', bg: '#2d1e5f'},
            {type: 'action', subtype: 'notify', icon: '🔔', name: 'Notify User', desc: 'In-app alert', bg: '#2d1e5f'},
            {
                type: 'action',
                subtype: 'move_stage',
                icon: '🚀',
                name: 'Move Stage',
                desc: 'Pipeline stage',
                bg: '#2d1e5f'
            },
            {type: 'action', subtype: 'webhook_call', icon: '⚙️', name: 'HTTP Request', desc: 'Call API', bg: '#2d1e5f'}
        ]
    },
    {
        id: 'logic', label: 'Logic', icon: '🔀', color: '#f59e0b', bg: '#3b2a0f',
        items: [
            {
                type: 'condition',
                subtype: 'if_else',
                icon: '🔀',
                name: 'Condition',
                desc: 'If / Else branch',
                bg: '#3b2a0f'
            },
            {type: 'wait', subtype: 'wait_time', icon: '⏳', name: 'Wait / Delay', desc: 'Pause flow', bg: '#3d1e35'},
            {type: 'end', subtype: 'end', icon: '🏁', name: 'End', desc: 'Terminate flow', bg: '#1e3d2f'}
        ]
    }
];

var panelCollapsed: boolean = false;
var currentCategory: PanelCategory | null = null;

// ═══════════════════════════════════════════════════════════
// COLLAPSE / EXPAND
// ═══════════════════════════════════════════════════════════
function togglePanel(): void {
    panelCollapsed = !panelCollapsed;
    var panel = document.getElementById('panelLeft')!;
    var icon = document.getElementById('panelToggleIcon')!;
    panel.classList.toggle('collapsed', panelCollapsed);
    icon.style.transform = panelCollapsed ? 'scaleX(-1)' : '';
}

// ═══════════════════════════════════════════════════════════
// VIEW SWITCHING HELPERS
// ═══════════════════════════════════════════════════════════
function setView(name: 'categories' | 'items' | 'search'): void {
    document.getElementById('viewCategories')!.style.display = name === 'categories' ? '' : 'none';
    document.getElementById('viewItems')!.style.display = name === 'items' ? '' : 'none';
    document.getElementById('viewSearch')!.style.display = name === 'search' ? '' : 'none';
}

// ═══════════════════════════════════════════════════════════
// CATEGORY VIEW
// ═══════════════════════════════════════════════════════════
function showCategories(): void {
    currentCategory = null;
    (document.getElementById('panelSearch') as HTMLInputElement).value = '';
    setView('categories');
}

function renderCategories(): void {
    var list = document.getElementById('categoryList')!;
    list.innerHTML = PANEL_CATEGORIES.map(function (cat) {
        return '<div class="category-card" onclick="showCategory(\'' + cat.id + '\')">' +
            '<div class="category-card-icon" style="background:' + cat.bg + ';color:' + cat.color + '">' + cat.icon + '</div>' +
            '<div class="category-card-info">' +
            '<div class="category-card-name">' + cat.label + '</div>' +
            '<div class="category-card-count">' + cat.items.length + ' nodes</div>' +
            '</div>' +
            '<svg width="8" height="12" viewBox="0 0 8 12" fill="none" style="flex-shrink:0;color:var(--text-3)">' +
            '<path d="M1 2L6 6L1 10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
            '</div>';
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// ITEM VIEW
// ═══════════════════════════════════════════════════════════
function showCategory(categoryId: string): void {
    var cat: PanelCategory | null = null;
    for (var i = 0; i < PANEL_CATEGORIES.length; i++) {
        if (PANEL_CATEGORIES[i].id === categoryId) {
            cat = PANEL_CATEGORIES[i];
            break;
        }
    }
    if (!cat) return;
    currentCategory = cat;
    document.getElementById('panelCategoryTitle')!.textContent = cat.label;
    (document.getElementById('panelSearch') as HTMLInputElement).value = '';
    setView('items');
    renderItems(cat.items);
}

function renderItems(items: PanelItem[]): void {
    var list = document.getElementById('itemList')!;
    if (items.length === 0) {
        list.innerHTML = '<div class="panel-empty">No nodes found</div>';
        return;
    }
    list.innerHTML = items.map(function (item) {
        return buildItemHTML(item);
    }).join('');
}

function buildItemHTML(item: PanelItem): string {
    return '<div class="node-item" draggable="true"' +
        ' data-type="' + item.type + '" data-subtype="' + item.subtype + '"' +
        ' ondragstart="onDragStart(event)">' +
        '<div class="node-icon" style="background:' + item.bg + '">' + item.icon + '</div>' +
        '<div class="node-info">' +
        '<div class="node-name">' + item.name + '</div>' +
        '<div class="node-desc">' + item.desc + '</div>' +
        '</div>' +
        '</div>';
}

// ═══════════════════════════════════════════════════════════
// GLOBAL SEARCH
// ═══════════════════════════════════════════════════════════
function onPanelSearch(query: string): void {
    var q = query.toLowerCase().trim();

    if (!q) {
        // Restore the previous view
        if (currentCategory) {
            setView('items');
            renderItems(currentCategory.items);
        } else {
            setView('categories');
        }
        return;
    }

    // Search across all categories
    var groups: Array<{ cat: PanelCategory; items: PanelItem[] }> = [];
    PANEL_CATEGORIES.forEach(function (cat) {
        var matched = cat.items.filter(function (item) {
            return item.name.toLowerCase().indexOf(q) !== -1 ||
                item.desc.toLowerCase().indexOf(q) !== -1;
        });
        if (matched.length > 0) groups.push({cat: cat, items: matched});
    });

    setView('search');
    var list = document.getElementById('searchList')!;
    if (groups.length === 0) {
        list.innerHTML = '<div class="panel-empty">No nodes found</div>';
        return;
    }

    list.innerHTML = groups.map(function (g) {
        return '<div class="search-section-label" style="color:' + g.cat.color + '">' +
            '<span class="search-section-icon" style="background:' + g.cat.bg + ';color:' + g.cat.color + '">' + g.cat.icon + '</span>' +
            g.cat.label +
            '</div>' +
            g.items.map(function (item) {
                return buildItemHTML(item);
            }).join('');
    }).join('');
}

// ═══════════════════════════════════════════════════════════
// INIT (called from app.ts DOMContentLoaded)
// ═══════════════════════════════════════════════════════════
function initPanel(): void {
    renderCategories();
}
