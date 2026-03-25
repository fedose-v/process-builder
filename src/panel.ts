// ═══════════════════════════════════════════════════════════
// PANEL CONTROLLER
// ═══════════════════════════════════════════════════════════

class PanelController {
    private readonly CATEGORIES: PanelCategory[] = [
        {
            id: 'trigger', label: 'Triggers', icon: '⚡', color: '#3b82f6', bg: '#1e3a5f',
            items: [
                {type: 'trigger', subtype: 'event_lead', icon: '⚡', name: 'New Lead', desc: 'Lead created', bg: '#1e3a5f'},
                {type: 'trigger', subtype: 'event_deal', icon: '💼', name: 'Deal Stage', desc: 'Stage changed', bg: '#1e3a5f'},
                {type: 'trigger', subtype: 'event_form', icon: '📋', name: 'Form Submit', desc: 'Form filled', bg: '#1e3a5f'},
                {type: 'trigger', subtype: 'schedule', icon: '🕐', name: 'Schedule', desc: 'Cron / date', bg: '#1e3a5f'},
                {type: 'trigger', subtype: 'webhook', icon: '🔗', name: 'Webhook', desc: 'External call', bg: '#1e3a5f'},
            ],
        },
        {
            id: 'action', label: 'Actions', icon: '⚙️', color: '#7c6aff', bg: '#2d1e5f',
            items: [
                {type: 'action', subtype: 'send_email', icon: '📧', name: 'Send Email', desc: 'Email template', bg: '#2d1e5f'},
                {type: 'action', subtype: 'send_sms', icon: '💬', name: 'Send SMS', desc: 'Text message', bg: '#2d1e5f'},
                {type: 'action', subtype: 'create_task', icon: '✅', name: 'Create Task', desc: 'Assign to user', bg: '#2d1e5f'},
                {type: 'action', subtype: 'update_field', icon: '✏️', name: 'Update Field', desc: 'Set CRM field', bg: '#2d1e5f'},
                {type: 'action', subtype: 'add_tag', icon: '🏷️', name: 'Add Tag', desc: 'Tag contact', bg: '#2d1e5f'},
                {type: 'action', subtype: 'notify', icon: '🔔', name: 'Notify User', desc: 'In-app alert', bg: '#2d1e5f'},
                {type: 'action', subtype: 'move_stage', icon: '🚀', name: 'Move Stage', desc: 'Pipeline stage', bg: '#2d1e5f'},
                {type: 'action', subtype: 'webhook_call', icon: '⚙️', name: 'HTTP Request', desc: 'Call API', bg: '#2d1e5f'},
            ],
        },
        {
            id: 'logic', label: 'Logic', icon: '🔀', color: '#f59e0b', bg: '#3b2a0f',
            items: [
                {type: 'condition', subtype: 'if_else', icon: '🔀', name: 'Condition', desc: 'If / Else branch', bg: '#3b2a0f'},
                {type: 'wait', subtype: 'wait_time', icon: '⏳', name: 'Wait / Delay', desc: 'Pause flow', bg: '#3d1e35'},
                {type: 'end', subtype: 'end', icon: '🏁', name: 'End', desc: 'Terminate flow', bg: '#1e3d2f'},
            ],
        },
    ];

    private collapsed = false;
    private currentCategory: PanelCategory | null = null;

    init(): void {
        this.renderCategories();
    }

    toggle(): void {
        this.collapsed = !this.collapsed;
        const panel = document.getElementById('panelLeft')!;
        const icon = document.getElementById('panelToggleIcon')!;
        panel.classList.toggle('collapsed', this.collapsed);
        icon.style.transform = this.collapsed ? 'scaleX(-1)' : '';
    }

    private setView(name: 'categories' | 'items' | 'search'): void {
        document.getElementById('viewCategories')!.style.display = name === 'categories' ? '' : 'none';
        document.getElementById('viewItems')!.style.display = name === 'items' ? '' : 'none';
        document.getElementById('viewSearch')!.style.display = name === 'search' ? '' : 'none';
    }

    showCategories(): void {
        this.currentCategory = null;
        (document.getElementById('panelSearch') as HTMLInputElement).value = '';
        this.setView('categories');
    }

    private renderCategories(): void {
        const list = document.getElementById('categoryList')!;
        list.innerHTML = this.CATEGORIES.map(cat =>
            '<div class="category-card" onclick="showCategory(\'' + cat.id + '\')">' +
            '<div class="category-card-icon" style="background:' + cat.bg + ';color:' + cat.color + '">' + cat.icon + '</div>' +
            '<div class="category-card-info">' +
            '<div class="category-card-name">' + cat.label + '</div>' +
            '<div class="category-card-count">' + cat.items.length + ' nodes</div>' +
            '</div>' +
            '<svg width="8" height="12" viewBox="0 0 8 12" fill="none" style="flex-shrink:0;color:var(--text-3)">' +
            '<path d="M1 2L6 6L1 10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>' +
            '</svg>' +
            '</div>'
        ).join('');
    }

    showCategory(categoryId: string): void {
        const cat = this.CATEGORIES.find(c => c.id === categoryId) || null;
        if (!cat) return;
        this.currentCategory = cat;
        document.getElementById('panelCategoryTitle')!.textContent = cat.label;
        (document.getElementById('panelSearch') as HTMLInputElement).value = '';
        this.setView('items');
        this.renderItems(cat.items);
    }

    private renderItems(items: PanelItem[]): void {
        const list = document.getElementById('itemList')!;
        if (items.length === 0) {
            list.innerHTML = '<div class="panel-empty">No nodes found</div>';
            return;
        }
        list.innerHTML = items.map(item => this.buildItemHTML(item)).join('');
    }

    private buildItemHTML(item: PanelItem): string {
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

    onSearch(query: string): void {
        const q = query.toLowerCase().trim();
        if (!q) {
            if (this.currentCategory) {
                this.setView('items');
                this.renderItems(this.currentCategory.items);
            } else {
                this.setView('categories');
            }
            return;
        }

        const groups: Array<{cat: PanelCategory; items: PanelItem[]}> = [];
        this.CATEGORIES.forEach(cat => {
            const matched = cat.items.filter(item =>
                item.name.toLowerCase().indexOf(q) !== -1 ||
                item.desc.toLowerCase().indexOf(q) !== -1
            );
            if (matched.length > 0) groups.push({cat, items: matched});
        });

        this.setView('search');
        const list = document.getElementById('searchList')!;
        if (groups.length === 0) {
            list.innerHTML = '<div class="panel-empty">No nodes found</div>';
            return;
        }

        list.innerHTML = groups.map(g =>
            '<div class="search-section-label" style="color:' + g.cat.color + '">' +
            '<span class="search-section-icon" style="background:' + g.cat.bg + ';color:' + g.cat.color + '">' + g.cat.icon + '</span>' +
            g.cat.label +
            '</div>' +
            g.items.map(item => this.buildItemHTML(item)).join('')
        ).join('');
    }
}

const Panel = new PanelController();

function togglePanel(): void { Panel.toggle(); }
function showCategories(): void { Panel.showCategories(); }
function showCategory(categoryId: string): void { Panel.showCategory(categoryId); }
function onPanelSearch(query: string): void { Panel.onSearch(query); }
function initPanel(): void { Panel.init(); }
