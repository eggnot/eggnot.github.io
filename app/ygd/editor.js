// --- Editor Logic & Navigation ---

function openEditor(dateObj, key) {
    editingKey = key;
    currentEditingDate = new Date(dateObj);
    const content = localStorage.getItem(key) || "";
    const color = localStorage.getItem(key.replace('D_', 'C_')) || "#ffffff";
    
    textArea.value = content;
    colorPicker.value = color;
    dateLabel.innerText = dateObj.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    
    // Update Prev/Next entry buttons based on existing entries
    const keys = Object.keys(localStorage).filter(k => k.startsWith('D_')).sort();
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

    const setNavBtn = (btn, targetKey, isPrev) => {
        if (targetKey) {
            const parts = targetKey.split('_')[1].split('-');
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            const shortDate = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            btn.innerText = isPrev ? `⟪ ${shortDate}` : `${shortDate} ⟫`;
            btn.classList.remove('hidden');
        } else {
            btn.classList.add('hidden');
        }
    };

    setNavBtn(prevEntryBtn, prevKey, true);
    setNavBtn(nextEntryBtn, nextKey, false);

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