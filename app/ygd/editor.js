// --- Editor Logic & Navigation ---

function openEditor(dateObj, key) {
    editingKey = key;
    currentEditingDate = new Date(dateObj);
    const content = localStorage.getItem(key) || "";
    const color = localStorage.getItem(key.replace('D_', 'C_')) || "#ffffff";
    
    textArea.value = content;
    colorPicker.value = color;
    dateLabel.innerText = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    editor.classList.add('open');
    history.pushState({editorOpen: true}, ""); // Push state for back button support
}

function saveCurrentEntry() {
    if (!editingKey) return;
    const val = textArea.value.trim();
    const color = colorPicker.value;
    const colorKey = editingKey.replace('D_', 'C_');

    if (val) {
        localStorage.setItem(editingKey, textArea.value);
    } else {
        localStorage.removeItem(editingKey);
    }

    // Save color if it's not the default white
    if (color && color.toLowerCase() !== '#ffffff') {
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
    if (goBack) history.back();
}

function clearColor() {
    colorPicker.value = "#ffffff";
}

function navigateDay(delta) {
    saveCurrentEntry();
    currentEditingDate.setDate(currentEditingDate.getDate() + delta);
    const newKey = getStorageKey(currentEditingDate.getFullYear(), currentEditingDate.getMonth()+1, currentEditingDate.getDate());
    openEditor(currentEditingDate, newKey);
}

function navigateEntry(delta) {
    saveCurrentEntry();
    const keys = Object.keys(localStorage).filter(k => k.startsWith('D_')).sort();
    
    let index = delta > 0 
        ? keys.findIndex(k => k > editingKey)
        : keys.reverse().findIndex(k => k < editingKey);

    if (index !== -1) {
        const newKey = delta > 0 ? keys[index] : keys[index];
        const parts = newKey.split('_')[1].split('-');
        const nextDate = new Date(parts[0], parts[1]-1, parts[2]);
        openEditor(nextDate, newKey);
    }
}