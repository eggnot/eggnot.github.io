// --- Global Utilities ---
function getContrastColor(hex) {
    if (!hex) return '#000000';
    // Handle both HEX and RGB strings (computed styles often return rgb())
    const rgb = hex.match(/\d+/g);
    const r = rgb ? parseInt(rgb[0]) : parseInt(hex.slice(1, 3), 16);
    const g = rgb ? parseInt(rgb[1]) : parseInt(hex.slice(3, 5), 16);
    const b = rgb ? parseInt(rgb[2]) : parseInt(hex.slice(5, 7), 16);
    return (r * 0.299 + g * 0.587 + b * 0.114) < 128 ? '#ffffff' : '#000000';
}


    let app, editor, textArea, dateLabel, colorPicker, prevEntryBtn, nextEntryBtn, tooltip, searchBar, clearSearchBtn, lastFocusElement = null;
    let themeDefaults = {};

    let currentYear = new Date().getFullYear();
    let editingKey = null;
    let currentEditingDate = null;
    let searchTerm = "";

    let lastRenderedYear = null;
    let lastRenderedOrientation = null;
    let lastRenderedSet = null;

    let currentSet = localStorage.getItem('tgu_current_set') || 'def';
    let sets = JSON.parse(localStorage.getItem('tgu_sets') || '["def"]');

    // --- Core Logic ---

    function init() {
        app = document.getElementById('app');
        editor = document.getElementById('editor');
        textArea = document.getElementById('diary-text');
        dateLabel = document.getElementById('editor-date-label');
        colorPicker = document.getElementById('cell-color-picker');
        prevEntryBtn = document.getElementById('prev-entry-btn');
        nextEntryBtn = document.getElementById('next-entry-btn');
        tooltip = document.getElementById('tooltip');
        searchBar = document.getElementById('search-bar');
        clearSearchBtn = document.getElementById('clear-search');

        // Capture default theme colors from CSS before any overrides are applied
        ['--bg-content', '--primary', '--bg-tooltip'].forEach(v => {
            themeDefaults[v] = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
        });

        document.documentElement.style.setProperty('--text-on-content', getContrastColor(themeDefaults['--bg-content']));

        // Initialize Spaces and Theme
        if (!sets.includes(currentSet)) currentSet = 'def';
        updateSetSelector();
        applyGlobalSettings();
        applySetSettings();

        renderGrid();
        window.addEventListener('resize', renderGrid); // Re-render to fix grid placements if aspect ratio flips

        // Register Service Worker for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        }

        app.addEventListener('keydown', handleGridKeyDown);
        
        // History API for Back Button
        window.onpopstate = (e) => {
            if (editor.classList.contains('open')) closeEditor(false);
            const openModalEl = document.querySelector('.modal-window.open:not(#editor)');
            if (openModalEl) closeModal(openModalEl.id, false);
        };

        window.addEventListener('keydown', handleGlobalKey);
    }

    function handleGlobalKey(e) {
        if (e.key === "Escape") {
            if (editor.classList.contains('open')) { closeEditor(); return; }
            const openModalEl = document.querySelector('.modal-window.open:not(#editor)');
            if (openModalEl) closeModal(openModalEl.id);
            return;
        }

        if (e.key === 'Tab') {
            const modal = document.querySelector('.modal-window.open');
            if (!modal) return;

            const focusables = modal.querySelectorAll('button:not(:disabled), [href], input:not(.hidden), select, textarea, [tabindex]:not([tabindex="-1"])');
            if (focusables.length === 0) return;
            
            const first = focusables[0];
            const last = focusables[focusables.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                last.focus(); e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === last) {
                first.focus(); e.preventDefault();
            }
        }
    }

    function getSetKey(key) {
        return currentSet === 'def' ? key : `SET:${currentSet}:${key}`;
    }

    function getStorageKey(y, m, d) {
        const base = `D_${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        return getSetKey(base);
    }

    function getSetDataKeys() {
        const prefix = currentSet === 'def' ? 'D_' : `SET:${currentSet}:D_`;
        return Object.keys(localStorage).filter(k => k.startsWith(prefix)).sort();
    }

    function applyGlobalSettings() {
        // Load Animation
        const bgAnim = localStorage.getItem('tgu_global_bg_anim') !== 'false';
        const animToggle = document.getElementById('bg-animation-toggle');
        if (animToggle) animToggle.checked = bgAnim;
        toggleAnimation(bgAnim, false);

        // Load Font Size
        const fontSize = localStorage.getItem('tgu_global_font_size') || '16';
        const fontInput = document.getElementById('cfg-font-size');
        if (fontInput) fontInput.value = fontSize;
        updateFontSize(fontSize, false);

        // Load Modal Transparency
        const modalOpacity = localStorage.getItem('tgu_global_modal_opacity') || '1';
        const opacityInput = document.getElementById('cfg-modal-opacity');
        if (opacityInput) opacityInput.value = modalOpacity;
        updateModalOpacity(modalOpacity, false);
    }

    function applySetSettings() {
        // Load Theme Colors
        ['--bg-content', '--primary', '--bg-tooltip'].forEach(v => {
            const key = getSetKey('cfg_' + v.replace('--', ''));
            const saved = localStorage.getItem(key);
            if (saved) {
                document.documentElement.style.setProperty(v, saved);
                if (v === '--bg-content') {
                    const contrast = getContrastColor(saved);
                    document.documentElement.style.setProperty('--text-on-content', contrast);
                }
            } else {
                document.documentElement.style.removeProperty(v);
                if (v === '--bg-content') {
                    const contrast = getContrastColor(themeDefaults['--bg-content']);
                    document.documentElement.style.setProperty('--text-on-content', contrast);
                }
            }
            const input = document.getElementById('cfg-' + v.replace('--', ''));
            if (input) input.value = getComputedStyle(document.documentElement).getPropertyValue(v).trim();
        });
    }

    function handleGridKeyDown(e) {
        const active = document.activeElement;
        if (!active || !active.classList.contains('day-cell')) return;

        const r = parseInt(active.dataset.r);
        const c = parseInt(active.dataset.c);
        let tr = r, tc = c;

        switch (e.key) {
            case 'ArrowUp': tr--; break;
            case 'ArrowDown': tr++; break;
            case 'ArrowLeft': tc--; break;
            case 'ArrowRight': tc++; break;
            case 'Enter':
            case ' ':
                active.click(); // This only triggers if not a residue cell per listener logic
                e.preventDefault();
                return;
            default: return;
        }

        const target = app.querySelector(`.day-cell[data-r="${tr}"][data-c="${tc}"]`);
        if (target) {
            e.preventDefault();
            target.focus();
        }
    }

    function renderGrid() {
        const isPortrait = window.innerHeight > window.innerWidth;
        
        // Only perform full DOM reconstruction if structural parameters (Year, Orientation, Set) changed
        if (currentYear === lastRenderedYear && isPortrait === lastRenderedOrientation && currentSet === lastRenderedSet) {
            updateCellStates();
            return;
        }

        fullRebuild(isPortrait);
        
        lastRenderedYear = currentYear;
        lastRenderedOrientation = isPortrait;
        lastRenderedSet = currentSet;
    }

    // Ensure initialization happens after all scripts are loaded and DOM is ready
    window.addEventListener('DOMContentLoaded', () => {
        init();
    });
