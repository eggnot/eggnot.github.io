    let app, editor, textArea, dateLabel, colorPicker;

    let currentYear = new Date().getFullYear();
    let editingKey = null;
    let currentEditingDate = null;

    let lastRenderedYear = null;
    let lastRenderedOrientation = null;

    const MONTH_LABELS = "Jan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec".split(',');
    const WEEK_LABELS = "SMTWTFS".split('');

    // --- Core Logic ---

    function init() {
        app = document.getElementById('app');
        editor = document.getElementById('editor');
        textArea = document.getElementById('diary-text');
        dateLabel = document.getElementById('editor-date-label');
        colorPicker = document.getElementById('cell-color-picker');

        renderGrid();
        window.addEventListener('resize', renderGrid); // Re-render to fix grid placements if aspect ratio flips
        
        // History API for Back Button
        window.onpopstate = (e) => {
            if (editor.classList.contains('open')) closeEditor(false);
            closeModal('help-modal');
            closeModal('settings-modal');
        };

        window.addEventListener('keydown', (e) => {
            if (e.key === "Escape") closeEditor();
        });
    }

    function getStorageKey(y, m, d) {
        return `D_${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    }

    function renderGrid() {
        const isPortrait = window.innerHeight > window.innerWidth;
        
        // Only perform full DOM reconstruction if structural parameters changed
        if (currentYear === lastRenderedYear && isPortrait === lastRenderedOrientation) {
            updateCellStates();
            return;
        }

        fullRebuild(isPortrait);
        
        lastRenderedYear = currentYear;
        lastRenderedOrientation = isPortrait;
    }

    function updateCellStates() {
        const now = new Date();
        const todayKey = getStorageKey(now.getFullYear(), now.getMonth()+1, now.getDate());
        const todayStart = new Date().setHours(0,0,0,0);

        document.querySelectorAll('.day-cell').forEach(el => {
            const key = el.dataset.key;
            const colorKey = key.replace('D_', 'C_');
            const dateObj = new Date(el.dataset.date);
            const content = localStorage.getItem(key) || "";
            const color = localStorage.getItem(colorKey);

            el.classList.toggle('has-content', !!content);
            el.classList.toggle('today', key === todayKey);
            el.classList.toggle('past', dateObj < todayStart);

            const dot = el.querySelector('.color-dot');
            if (dot) dot.style.backgroundColor = color || 'transparent';
        });
    }

    function fullRebuild(isPortrait) {
        app.innerHTML = '';
        document.getElementById('current-year-display').textContent = currentYear;

        const cols = isPortrait ? 14 : 39;
        const rows = isPortrait ? 39 : 14;
        const mainCols = isPortrait ? 12 : 37;
        const mainRows = isPortrait ? 37 : 12;
        app.style.gridTemplateColumns = `auto repeat(${mainCols}, 1fr) auto`;
        app.style.gridTemplateRows = `auto repeat(${mainRows}, 1fr) auto`;

        // --- Draw Axis Headers ---
        // Top and Bottom Headers
        const xMax = isPortrait ? 12 : 37;
        for(let i=1; i<=xMax; i++) {
            const label = isPortrait ? MONTH_LABELS[i-1] : WEEK_LABELS[(i-1)%7];
            const isSun = !isPortrait && (i-1)%7 === 0;
            
            // Top
            createHeader(label, 1, i + 1, isSun);
            // Bottom
            createHeader(label, rows, i + 1, isSun);
        }

        // Left and Right Headers
        const yMax = isPortrait ? 37 : 12;
        for(let i=1; i<=yMax; i++) {
            // Bottom-to-top logic: i=1 is the bottom row
            const labelIndex = i-1;
            const label = isPortrait ? WEEK_LABELS[labelIndex%7] : MONTH_LABELS[labelIndex];
            const isSun = isPortrait && labelIndex%7 === 0;
            const rowPos = rows - i; 

            // Left
            createHeader(label, rowPos, 1, isSun);
            // Right
            createHeader(label, rowPos, cols, isSun);
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

        // --- Helper for Sunday styling ---
        function checkSunday(month, day) {
            return new Date(currentYear, month, day).getDay() === 0;
        }

        // --- Draw Grid Cells ---
        // Mapping logic:
        // Landscape: x=d+offset, y=month (bottom-to-top)
        // Portrait: x=month, y=d+offset (bottom-to-top)

        // 2. Grid Cells
        for (let m = 0; m < 12; m++) {
            const daysInMonth = new Date(currentYear, m + 1, 0).getDate();
            const firstDay = new Date(currentYear, m, 1).getDay(); // 0(Sun) to 6(Sat)
            const todayStart = new Date().setHours(0,0,0,0);

            // Row index calculation:
            // Landscape: Month m=0 is Row 13 (rows - 1 - m).
            // Portrait: Offset d+firstDay starts at Row 38 (rows - (d+firstDay)).
            
            // Col index calculation:
            // Landscape: d+firstDay starts at Col 2.
            // Portrait: Month m=0 is Col 2.

            const monthRow = rows - 1 - m;
            const monthCol = m + 2;
            
            for (let d = 1; d <= daysInMonth; d++) {
                const el = document.createElement('div');
                el.className = 'cell day-cell';
                
                // Grid Placement
                // M (0-11) -> 1-12
                // D (1-31) + Shift
                const dayIndex = d + firstDay;
                const row = isPortrait ? (rows - dayIndex) : monthRow;
                const col = isPortrait ? monthCol : (dayIndex + 1);
                
                el.style.gridRow = row;
                el.style.gridColumn = col;

                const dateObj = new Date(currentYear, m, d);
                const storageKey = getStorageKey(currentYear, m + 1, d);
                const content = localStorage.getItem(storageKey) || "";
                const color = localStorage.getItem(storageKey.replace('D_', 'C_'));
                
                // Attach metadata for lightweight updates
                el.dataset.key = storageKey;
                el.dataset.date = dateObj.toISOString();

                // Display Digit
                const span = document.createElement('span');
                span.className = 'day-number';
                span.textContent = d;
                el.appendChild(span);

                // Background Color Dot
                const dot = document.createElement('div');
                dot.className = 'color-dot';
                dot.style.backgroundColor = color || 'transparent';
                el.appendChild(dot);

                if (checkSunday(m, d)) el.classList.add('sunday');
                if (dateObj < todayStart) el.classList.add('past');
                if (content) el.classList.add('has-content');

                el.onclick = () => openEditor(dateObj, storageKey);
                app.appendChild(el);
            }
        }
    }

    init();
