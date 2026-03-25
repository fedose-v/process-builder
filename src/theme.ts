// ═══════════════════════════════════════════════════════════
// THEME — shared between the builder and the home page
// ═══════════════════════════════════════════════════════════

const MOON_ICON =
    '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';

const SUN_ICON =
    '<circle cx="12" cy="12" r="5"/>' +
    '<line x1="12" y1="1" x2="12" y2="3"/>' +
    '<line x1="12" y1="21" x2="12" y2="23"/>' +
    '<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>' +
    '<line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>' +
    '<line x1="1" y1="12" x2="3" y2="12"/>' +
    '<line x1="21" y1="12" x2="23" y2="12"/>' +
    '<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>' +
    '<line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';

function applyTheme(light: boolean): void {
    document.documentElement.classList.toggle('light', light);
    const icon = document.getElementById('themeIcon');
    if (icon) icon.innerHTML = light ? MOON_ICON : SUN_ICON;
}

function toggleTheme(): void {
    const isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
    applyTheme(isLight);
}

// ═══════════════════════════════════════════════════════════
// CONFIRM MODAL — shared between the builder and the home page
// ═══════════════════════════════════════════════════════════

function showConfirm(message: string, onConfirm: () => void, danger = false): void {
    // Inject styles once
    if (!document.getElementById('confirmStyles')) {
        const s = document.createElement('style');
        s.id = 'confirmStyles';
        s.textContent = `
#confirmOverlay{position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;opacity:0;pointer-events:none;transition:opacity .15s}
#confirmOverlay.cm-visible{opacity:1;pointer-events:all}
#confirmBox{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;width:320px;max-width:calc(100vw - 32px);box-shadow:0 24px 64px rgba(0,0,0,.35);transform:scale(.95);transition:transform .15s}
#confirmOverlay.cm-visible #confirmBox{transform:scale(1)}
#confirmMsg{color:var(--text);font-size:14px;line-height:1.55;margin-bottom:20px}
#confirmActions{display:flex;gap:8px;justify-content:flex-end}
#confirmActions button{padding:7px 16px;border-radius:7px;font-size:13px;font-weight:500;cursor:pointer;border:1px solid var(--border);transition:all .15s}
#confirmCancel{background:transparent;color:var(--text-2)}
#confirmCancel:hover{background:var(--surface-hov);color:var(--text)}
#confirmOk{background:transparent}
#confirmOk.cm-danger{color:#ef4444;border-color:#ef444466}
#confirmOk.cm-danger:hover{background:#ef444422}
#confirmOk.cm-safe{color:#7c6aff;border-color:#7c6aff66}
#confirmOk.cm-safe:hover{background:#7c6aff22}`;
        document.head.appendChild(s);
    }

    // Build modal DOM once
    let overlay = document.getElementById('confirmOverlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'confirmOverlay';
        overlay.innerHTML =
            '<div id="confirmBox">' +
            '<div id="confirmMsg"></div>' +
            '<div id="confirmActions">' +
            '<button id="confirmCancel">Cancel</button>' +
            '<button id="confirmOk">Confirm</button>' +
            '</div></div>';
        document.body.appendChild(overlay);
    }

    document.getElementById('confirmMsg')!.textContent = message;
    const okBtn = document.getElementById('confirmOk')!;
    okBtn.className = danger ? 'cm-danger' : 'cm-safe';
    okBtn.textContent = danger ? 'Delete' : 'Confirm';

    const hide = (): void => { overlay!.classList.remove('cm-visible'); };

    const onOk = (): void => {
        hide();
        cleanup();
        onConfirm();
    };
    const onCancel = (): void => {
        hide();
        cleanup();
    };
    const onKey = (e: KeyboardEvent): void => {
        if (e.key === 'Escape') onCancel();
        else if (e.key === 'Enter') onOk();
    };
    const onBackdrop = (e: MouseEvent): void => {
        if (e.target === overlay) onCancel();
    };
    const cleanup = (): void => {
        document.removeEventListener('keydown', onKey);
        overlay!.removeEventListener('click', onBackdrop);
    };

    okBtn.onclick = onOk;
    document.getElementById('confirmCancel')!.onclick = onCancel;
    overlay.addEventListener('click', onBackdrop);
    document.addEventListener('keydown', onKey);

    overlay.classList.add('cm-visible');
}
