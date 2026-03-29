// --- Editor Logic & Navigation ---

function openEditor(dateObj, key) {
    if (!editor.classList.contains('open')) lastFocusElement = document.activeElement;
    editingKey = key;
    currentEditingDate = new Date(dateObj);
    const content = localStorage.getItem(key) || "";
    const color = localStorage.getItem(key.replace('D_', 'C_')) || "#ffffff";
    
    textArea.value = content;
    colorPicker.value = color;
    const fullDate = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const shortDate = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    dateLabel.innerHTML = `<span class="full-date">${fullDate}</span><span class="short-date">${shortDate}</span>`;
    
    // Update Prev/Next entry buttons based on existing entries
    const keys = getSetDataKeys();
    const currentIndex = keys.indexOf(key);
    let prevKey, nextKey;

    if (currentIndex !== -1) {
        prevKey = keys[currentIndex - 1];
        nextKey = keys[currentIndex + 1];
    } else {
        const nextIdx = keys.findIndex(k => k > key);
        nextKey = keys[nextIdx];
        prevKey = nextIdx === -1 ? keys[keys.length - 1] : keys[nextIdx - 1];
    }

    updateNavButton(prevEntryBtn, prevKey, true);
    updateNavButton(nextEntryBtn, nextKey, false);

    editor.classList.add('open');
    setTimeout(() => textArea.focus(), 100);
    history.pushState({editorOpen: true}, ""); // Push state for back button support
}

function updateNavButton(btn, targetKey, isPrev) {
    if (targetKey) {
        const parts = targetKey.split('_')[1].split('-');
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        const shortDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        btn.innerText = isPrev ? `« ${shortDate}` : `${shortDate} »`;
        btn.disabled = false;
    } else {
        btn.innerText = isPrev ? `« no entries` : `no entries »`;
        btn.disabled = true;
    }
}

function saveCurrentEntry() {
    if (!editingKey) return;
    const val = textArea.value.trim();
    const color = colorPicker.value;
    const colorKey = editingKey.replace('D_', 'C_');

    // Helper to check if color is "really close to white" (threshold > 250/255)
    const isCloseToWhite = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return r > 250 && g > 250 && b > 250;
    };

    if (val) {
        localStorage.setItem(editingKey, textArea.value);
    } else {
        localStorage.removeItem(editingKey);
    }

    // Save color if it's not "close to white"
    if (color && !isCloseToWhite(color)) {
        localStorage.setItem(colorKey, color);
    } else {
        localStorage.removeItem(colorKey);
    }
}

function closeEditor(goBack = true) {
    saveCurrentEntry();
    editor.classList.remove('open');
    textArea.blur();
    renderGrid(); // Refresh view to show changes
    if (lastFocusElement) lastFocusElement.focus();
    if (goBack) history.back();
}

function navigateDay(delta) {
    saveCurrentEntry();
    currentEditingDate.setDate(currentEditingDate.getDate() + delta);
    const newKey = getStorageKey(currentEditingDate.getFullYear(), currentEditingDate.getMonth()+1, currentEditingDate.getDate());
    openEditor(currentEditingDate, newKey);
}

function navigateEntry(delta) {
    saveCurrentEntry();
    const keys = getSetDataKeys();
    const currentIndex = keys.indexOf(editingKey);
    let targetKey;
    
    if (currentIndex !== -1) {
        targetKey = keys[currentIndex + delta];
    } else {
        const nextIdx = keys.findIndex(k => k > editingKey);
        targetKey = delta > 0 ? keys[nextIdx] : (nextIdx === -1 ? keys[keys.length - 1] : keys[nextIdx - 1]);
    }

    if (targetKey) {
        const parts = targetKey.split('_')[1].split('-');
        const nextDate = new Date(parts[0], parts[1]-1, parts[2]);
        openEditor(nextDate, targetKey);
    }
}