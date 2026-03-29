// --- Grid Structure Generation ---

const MONTH_LABELS = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(',');
const WEEK_LABELS = "SMTWTFS".split('');

function fullRebuild(isPortrait) {
    app.innerHTML = '';
    document.getElementById('current-year-display').textContent = currentYear;

    const now = new Date();
    const todayKey = getStorageKey(now.getFullYear(), now.getMonth() + 1, now.getDate());
    const todayStart = new Date().setHours(0, 0, 0, 0);

    const cols = isPortrait ? 14 : 39;
    const rows = isPortrait ? 39 : 14;
    const mainCols = isPortrait ? 12 : 37;
    const mainRows = isPortrait ? 37 : 12;
    app.style.gridTemplateColumns = `auto repeat(${mainCols}, 1fr) auto`;
    app.style.gridTemplateRows = `auto repeat(${mainRows}, 1fr) auto`;

    // Corner headers
    const corners = [[1, 1], [1, cols], [rows, 1], [rows, cols]];
    corners.forEach(([r, c]) => createHeader('', r, c));

    // Axis Headers
    const xMax = isPortrait ? 12 : 37;
    for (let i = 1; i <= xMax; i++) {
        const label = isPortrait ? MONTH_LABELS[i - 1] : WEEK_LABELS[(i - 1) % 7];
        const isSun = !isPortrait && (i - 1) % 7 === 0;
        createHeader(label, 1, i + 1, isSun);
        createHeader(label, rows, i + 1, isSun);
    }

    const yMax = isPortrait ? 37 : 12;
    for (let i = 1; i <= yMax; i++) {
        const label = isPortrait ? WEEK_LABELS[(i - 1) % 7] : MONTH_LABELS[i - 1];
        const isSun = isPortrait && (i - 1) % 7 === 0;
        const rowPos = rows - i;
        createHeader(label, rowPos, 1, isSun);
        createHeader(label, rowPos, cols, isSun);
    }

    // Grid Cells
    for (let m = 0; m < 12; m++) {
        const firstDay = new Date(currentYear, m, 1).getDay();
        const monthRow = rows - 1 - m;
        const monthCol = m + 2;

        for (let i = 0; i < 37; i++) {
            const dayNum = i - firstDay + 1;
            const dateObj = new Date(currentYear, m, dayNum);
            const isResidue = dateObj.getMonth() !== m || dateObj.getFullYear() !== currentYear;
            const storageKey = getStorageKey(dateObj.getFullYear(), dateObj.getMonth() + 1, dateObj.getDate());
            const content = localStorage.getItem(storageKey) || "";
            const color = localStorage.getItem(storageKey.replace('D_', 'C_'));

            const el = document.createElement('div');
            el.className = 'cell day-cell';
            if (isResidue) el.classList.add('residue');

            const row = isPortrait ? (rows - 1 - i) : monthRow;
            const col = isPortrait ? monthCol : (i + 2);
            el.style.gridRow = row;
            el.style.gridColumn = col;
            el.dataset.r = row;
            el.dataset.c = col;
            el.tabIndex = isResidue ? -1 : 0;
            el.dataset.key = storageKey;
            el.dataset.date = dateObj.toISOString();

            el.innerHTML = `<span class="day-number">${dateObj.getDate()}</span><div class="color-dot"></div>`;
            
            if (dateObj.getDay() === 0) el.classList.add('sunday');
            if (dateObj < todayStart) el.classList.add('past');
            if (content) el.classList.add('has-content');
            if (searchTerm && content.toLowerCase().includes(searchTerm)) el.classList.add('search-match');
            if (storageKey === todayKey) el.classList.add('today');

            const dot = el.querySelector('.color-dot');
            dot.style.backgroundColor = color || 'transparent';

            if (!isResidue) {
                el.onclick = () => { hideTooltip(); openEditor(dateObj, storageKey); };
                el.onmouseenter = (e) => showTooltip(e, storageKey);
                el.onmousemove = (e) => moveTooltip(e);
                el.onmouseleave = hideTooltip;
            }
            app.appendChild(el);
        }
    }
}

function createHeader(txt, r, c, sun) {
    const h = document.createElement('div');
    h.className = 'header';
    if (sun) h.classList.add('sunday-header');
    h.textContent = txt;
    h.style.gridRow = r;
    h.style.gridColumn = c;
    app.appendChild(h);
}