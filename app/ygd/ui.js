// --- General UI Logic ---

function changeYear(delta) {
    currentYear += delta;
    renderGrid();
}

function openModal(id) {
    const modal = document.getElementById(id);
    if (!modal.classList.contains('open')) lastFocusElement = document.activeElement;
    modal.classList.add('open');
    const firstInput = modal.querySelector('button, input, textarea');
    if (firstInput) setTimeout(() => firstInput.focus(), 100);
    history.pushState({modalOpen: id}, "");
}

function closeModal(id, goBack = true) {
    document.getElementById(id).classList.remove('open');
    if (lastFocusElement) lastFocusElement.focus();
    if (goBack) history.back();
}

function updateSetSelector() {
    const selectors = document.querySelectorAll('.set-selector-ui');
    if (selectors.length === 0) return;

    // Use captured defaults instead of live computed styles to avoid leakage from the active set
    const defaultColor = themeDefaults['--bg-content'] || '#d0ff8a';

    const optionsHtml = sets.map(s => {
        const configKey = s === 'def' ? 'cfg_bg-content' : `SET:${s}:cfg_bg-content`;
        const color = localStorage.getItem(configKey) || defaultColor;
        const style = `style="background-color: ${color}; color: ${getContrastColor(color)};"`;
        return `<option value="${s}" ${s === currentSet ? 'selected' : ''} ${style}>${s}</option>`;
    }).join('');

    const currentKey = currentSet === 'def' ? 'cfg_bg-content' : `SET:${currentSet}:cfg_bg-content`;
    const activeColor = localStorage.getItem(currentKey) || defaultColor;
    const activeTextColor = getContrastColor(activeColor);

    selectors.forEach(sel => {
        sel.innerHTML = optionsHtml;
        sel.style.backgroundColor = activeColor;
        sel.style.color = activeTextColor;
    });

    const display = document.getElementById('current-set-display');
    if (display) display.textContent = currentSet;
    const deleteBtn = document.getElementById('delete-set-btn');
    if (deleteBtn) deleteBtn.disabled = (currentSet === 'def');
}

function switchSet(name) {
    const isEditorOpen = editor.classList.contains('open');
    if (isEditorOpen) saveCurrentEntry();

    currentSet = name;
    localStorage.setItem('tgu_current_set', name);
    applySetSettings();
    renderGrid();
    updateSetSelector();

    if (isEditorOpen && currentEditingDate) {
        openEditor(currentEditingDate, getStorageKey(currentEditingDate.getFullYear(), currentEditingDate.getMonth() + 1, currentEditingDate.getDate()));
    }
}

function addNewSet() {
    const nameInput = document.getElementById('new-set-name');
    const name = nameInput.value.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!name || sets.includes(name)) return alert("Invalid or duplicate name.");
    
    sets.push(name);
    localStorage.setItem('tgu_sets', JSON.stringify(sets));
    nameInput.value = '';
    switchSet(name);
}

function deleteCurrentSet() {
    if (currentSet === 'def') return alert("Cannot delete the default set.");
    if (!confirm(`Delete set "${currentSet}" and ALL its data?`)) return;

    // Clean up storage
    const prefix = `SET:${currentSet}:`;
    Object.keys(localStorage).forEach(k => { if (k.startsWith(prefix)) localStorage.removeItem(k); });

    sets = sets.filter(s => s !== currentSet);
    localStorage.setItem('tgu_sets', JSON.stringify(sets));
    switchSet('def');
}

function toggleAnimation(enabled, save = true) {
    document.body.classList.toggle('animate-bg', enabled);
    if (save) localStorage.setItem('tgu_global_bg_anim', enabled);
}

function updateFontSize(size, save = true) {
    document.documentElement.style.setProperty('--font-size', size + 'pt');
    if (save) localStorage.setItem('tgu_global_font_size', size);
}

function updateModalOpacity(val, save = true) {
    document.documentElement.style.setProperty('--modal-opacity', val);
    if (save) localStorage.setItem('tgu_global_modal_opacity', val);
}

function updateThemeColor(varName, value) {
    document.documentElement.style.setProperty(varName, value);
    localStorage.setItem(getSetKey('cfg_' + varName.replace('--', '')), value);
    if (varName === '--bg-content') {
        const contrast = getContrastColor(value);
        document.documentElement.style.setProperty('--text-on-content', contrast);
        updateSetSelector();
    }
}