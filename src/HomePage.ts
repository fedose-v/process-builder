// ═══════════════════════════════════════════════════════════
// HOME PAGE — workflow list
// ═══════════════════════════════════════════════════════════

class HomePage {
    private timeAgo(iso: string): string {
        const diff = Date.now() - new Date(iso).getTime();
        const minutes = Math.floor(diff / 60_000);
        const hours = Math.floor(diff / 3_600_000);
        const days = Math.floor(diff / 86_400_000);

        if (minutes < 1) return 'just now';
        if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
        if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
        if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
        return new Date(iso).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'});
    }

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    showToast(msg: string): void {
        const t = document.getElementById('toast')!;
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 2800);
    }

    render(workflows: WorkflowSummary[]): void {
        const grid = document.getElementById('workflowGrid')!;
        const empty = document.getElementById('emptyState')!;
        const counter = document.getElementById('workflowCount')!;

        counter.textContent = `${workflows.length} workflow${workflows.length === 1 ? '' : 's'}`;

        if (workflows.length === 0) {
            grid.innerHTML = '';
            empty.style.display = '';
            return;
        }

        empty.style.display = 'none';
        grid.innerHTML = workflows.map(wf => `
    <div class="wf-card" data-id="${wf.id}">
      <a href="/builder?id=${wf.id}" class="wf-card-body">
        <div class="wf-icon">⚡</div>
        <div class="wf-info">
          <div class="wf-name">${this.escapeHtml(wf.name)}</div>
          <div class="wf-meta">Updated ${this.timeAgo(wf.updatedAt)}</div>
        </div>
      </a>
      <div class="wf-card-footer">
        <label class="wf-toggle" title="${wf.active ? 'Deactivate' : 'Activate'}">
          <input
            type="checkbox"
            ${wf.active ? 'checked' : ''}
            onchange="handleToggle('${wf.id}', this)"
          />
          <span class="wf-toggle-track">
            <span class="wf-toggle-thumb"></span>
          </span>
        </label>
        <span class="wf-status ${wf.active ? 'active' : 'inactive'}">
          ${wf.active ? 'Active' : 'Inactive'}
        </span>
        <div class="wf-actions">
          <button class="wf-btn wf-btn-delete" onclick="handleDelete('${wf.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
    }

    async fetch(): Promise<void> {
        try {
            const res = await fetch('/api/workflows');
            const workflows = (await res.json()) as WorkflowSummary[];
            this.render(workflows.slice().sort(
                (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
            ));
        } catch {
            this.showToast('⚠ Failed to load workflows');
        }
    }

    handleDelete(id: string): void {
        showConfirm('Delete this workflow? This cannot be undone.', async () => {
            try {
                await fetch(`/api/workflows/${id}`, {method: 'DELETE'});
                this.showToast('Workflow deleted');
                await this.fetch();
            } catch {
                this.showToast('⚠ Failed to delete workflow');
            }
        }, true);
    }

    async handleToggle(id: string, checkbox: HTMLInputElement): Promise<void> {
        try {
            const res = await fetch(`/api/workflows/${id}/toggle`, {method: 'PATCH'});
            const updated = (await res.json()) as WorkflowSummary;

            const card = document.querySelector<HTMLElement>(`.wf-card[data-id="${id}"]`);
            const badge = card?.querySelector<HTMLElement>('.wf-status');
            if (badge) {
                badge.textContent = updated.active ? 'Active' : 'Inactive';
                badge.className = `wf-status ${updated.active ? 'active' : 'inactive'}`;
            }
            if (card) {
                const label = card.querySelector<HTMLLabelElement>('.wf-toggle');
                if (label) label.title = updated.active ? 'Deactivate' : 'Activate';
            }
            this.showToast(updated.active ? 'Workflow activated' : 'Workflow deactivated');
        } catch {
            checkbox.checked = !checkbox.checked;
            this.showToast('⚠ Failed to update workflow');
        }
    }
}

const Home = new HomePage();

function handleDelete(id: string): void {
    Home.handleDelete(id);
}

function handleToggle(id: string, checkbox: HTMLInputElement): void {
    Home.handleToggle(id, checkbox);
}

document.addEventListener('DOMContentLoaded', () => {
    Theme.apply(localStorage.getItem('theme') === 'light');
    Home.fetch();
});

window.addEventListener('pageshow', (e: PageTransitionEvent) => {
    if (e.persisted) Home.fetch();
});
