// --- Local Updates & Interaction Logic ---

function updateCellStates() {
    const now = new Date();
    const todayKey = getStorageKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const todayStart = new Date().setHours(0, 0, 0, 0);
    let foundAny = false;

    document.querySelectorAll('.day-cell').forEach(el => {
        const key = el.dataset.key;
        const dateObj = new Date(el.dataset.date);
        const content = localStorage.getItem(key) || "";
        const color = localStorage.getItem(key.replace('D_', 'C_'));

        el.classList.toggle('has-content', !!content);
        el.classList.toggle('today', key === todayKey);
        el.classList.toggle('past', dateObj < todayStart);

        const isMatch = searchTerm && content.toLowerCase().includes(searchTerm);
        el.classList.toggle('search-match', !!isMatch);
        if (isMatch) foundAny = true;

        const dot = el.querySelector('.color-dot');
        if (dot) dot.style.backgroundColor = color || 'transparent';
    });
    return foundAny;
}

function handleSearch(query) {
    const trimmed = query.trim();
    searchTerm = trimmed.length > 2 ? trimmed.toLowerCase() : "";
    const foundAny = updateCellStates();
    clearSearchBtn.classList.toggle('hidden', query.length === 0);
    searchBar.classList.toggle('search-found', !!(searchTerm && foundAny));
}

function clearSearch() {
    searchBar.value = "";
    handleSearch("");
}

function showTooltip(e, key) {
    let content = localStorage.getItem(key);
    if (!content) return hideTooltip();

    if (content.length > 600) content = content.substring(0, 600) + '...';

    if (searchTerm) {
        const escaped = content.replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[m]));
        const regex = new RegExp(`(${searchTerm})`, 'gi');
        tooltip.innerHTML = escaped.replace(regex, '<mark>$1</mark>');
    } else {
        tooltip.textContent = content;
    }

    tooltip.classList.remove('hidden');
    moveTooltip(e);
}

function moveTooltip(e) {
    const offset = 15;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    if (e.clientX > vw / 2) {
        tooltip.style.left = 'auto';
        tooltip.style.right = (vw - e.clientX + offset) + 'px';
    } else {
        tooltip.style.right = 'auto';
        tooltip.style.left = (e.clientX + offset) + 'px';
    }

    if (e.clientY > vh / 2) {
        tooltip.style.top = 'auto';
        tooltip.style.bottom = (vh - e.clientY + offset) + 'px';
    } else {
        tooltip.style.bottom = 'auto';
        tooltip.style.top = (e.clientY + offset) + 'px';
    }
}

function hideTooltip() {
    tooltip.classList.add('hidden');
}