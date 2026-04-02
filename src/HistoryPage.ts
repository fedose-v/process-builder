// ═══════════════════════════════════════════════════════════
// HISTORY PAGE — workflow run history
// ═══════════════════════════════════════════════════════════

class HistoryPage {
    private workflowNames: Map<string, string> = new Map();

    private escapeHtml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    private formatDate(iso: string): string {
        const d = new Date(iso);
        const day = String(d.getDate()).padStart(2, '0');
        const month = d.toLocaleString('en', {month: 'short'});
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${day} ${month} ${hh}:${mm}`;
    }

    private formatDuration(ms: number): string {
        if (ms < 1000) return `${ms}ms`;
        const s = ms / 1000;
        return s % 1 === 0 ? `${s}s` : `${s.toFixed(1)}s`;
    }

    private populateFilter(workflows: WorkflowSummary[]): void {
        const sel = document.getElementById('wfFilter') as HTMLSelectElement;
        workflows
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name))
            .forEach(wf => {
                const opt = document.createElement('option');
                opt.value = wf.id;
                opt.textContent = wf.name;
                sel.appendChild(opt);
            });
    }

    render(runs: RunRecord[], filter: string): void {
        const filtered = filter ? runs.filter(r => r.workflowId === filter) : runs;
        const counter = document.getElementById('runCount')!;
        const tbody = document.getElementById('runsBody')!;
        const empty = document.getElementById('emptyState')!;
        const table = document.getElementById('runsTable')!;

        counter.textContent = `${filtered.length} run${filtered.length === 1 ? '' : 's'}`;

        if (filtered.length === 0) {
            table.style.display = 'none';
            empty.style.display = '';
            return;
        }

        table.style.display = '';
        empty.style.display = 'none';

        tbody.innerHTML = filtered.map(r => {
            const isErr = r.status === 'error';
            const wfName = this.escapeHtml(this.workflowNames.get(r.workflowId) ?? r.workflowId);
            const statusCell = isErr
                ? `<span class="run-badge run-badge-err">Error</span>`
                : `<span class="run-badge run-badge-ok">Success</span>`;
            const errorInfo = isErr && r.errorNodeLabel
                ? `<div class="hist-error-info">
                     <span class="hist-error-step">${this.escapeHtml(r.errorNodeLabel)}</span>
                     <span class="hist-error-msg">${this.escapeHtml(r.errorMessage ?? '')}</span>
                   </div>`
                : '';
            return `<tr class="${isErr ? 'row-err' : ''}">
              <td class="col-wf">
                <a href="/builder?id=${r.workflowId}" class="hist-wf-link">${wfName}</a>
              </td>
              <td class="col-date">${this.formatDate(r.startedAt)}</td>
              <td class="col-dur">${this.formatDuration(r.duration)}</td>
              <td class="col-status">${statusCell}</td>
              <td class="col-err">${errorInfo}</td>
            </tr>`;
        }).join('');
    }

    async fetch(): Promise<void> {
        try {
            const [wfRes, runsRes] = await Promise.all([
                fetch('/api/workflows'),
                fetch('/api/runs'),
            ]);
            const workflows = (await wfRes.json()) as WorkflowSummary[];
            const runs = (await runsRes.json()) as RunRecord[];

            workflows.forEach(wf => this.workflowNames.set(wf.id, wf.name));
            this.populateFilter(workflows);

            const filter = new URLSearchParams(location.search).get('workflow') ?? '';
            const sel = document.getElementById('wfFilter') as HTMLSelectElement;
            if (filter) sel.value = filter;

            this.render(runs, filter);

            sel.addEventListener('change', () => this.render(runs, sel.value));
        } catch {
            document.getElementById('runsBody')!.innerHTML =
                `<tr><td colspan="5" class="hist-load-err">⚠ Failed to load run history</td></tr>`;
        }
    }
}

const HistoryView = new HistoryPage();

document.addEventListener('DOMContentLoaded', () => {
    Theme.apply(localStorage.getItem('theme') === 'light');
    void HistoryView.fetch();
});
