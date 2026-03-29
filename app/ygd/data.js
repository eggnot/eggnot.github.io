// --- Data Management (CSV Import/Export) ---

function exportCSV() {
    let csv = "Set,Date,Color,Content\n";
    const entries = []; // Array of {s, d, c, t}

    Object.keys(localStorage).forEach(k => {
        let set = 'def', key = k;
        if (k.startsWith('SET:')) {
            const parts = k.split(':');
            set = parts[1];
            key = parts.slice(2).join(':');
        }
        
        if (key.startsWith('D_')) {
            const date = key.substring(2);
            const color = localStorage.getItem(k.replace('D_', 'C_')) || "";
            const content = (localStorage.getItem(k) || "").replace(/"/g, '""');
            entries.push({ set, date, color, content });
        }
    });

    entries.sort((a,b) => (a.set + a.date).localeCompare(b.set + a.date)).forEach(e => {
        csv += `${e.set},${e.date},${e.color},"${e.content}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diary_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 100);
}

function importCSV(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        // Regex for: Space,Date,Color,"Content"
        const regex = /^([^,\r\n]+),([^,\r\n]+),([^,\r\n]*),"((?:[^"]|"")*)"(?:\r?\n|$)/gm;
        let match;
        let count = 0;

        while ((match = regex.exec(text)) !== null) {
            const space = match[1].trim();
            const date = match[2].trim();
            const color = match[3].trim();
            const content = match[4].replace(/""/g, '"');

            if (space === "Set" || space === "Space") continue; // Skip CSV header

            if (space && date) {
                if (!sets.includes(space)) {
                    sets.push(space);
                    localStorage.setItem('tgu_sets', JSON.stringify(sets));
                }
                const prefix = space === 'def' ? '' : `SET:${space}:`;
                
                const dKey = `${prefix}D_${date}`;
                const cKey = `${prefix}C_${date}`;

                if (content) localStorage.setItem(dKey, content);
                else localStorage.removeItem(dKey);

                if (color) localStorage.setItem(cKey, color);
                else localStorage.removeItem(cKey);
                
                count++;
            }
        }
        renderGrid();
        alert(`Import complete: ${count} entries processed.`);
        input.value = ''; // Reset input to allow re-importing the same file
    };
    reader.readAsText(file);
}

function clearAllData() {
    if (confirm("Are you sure you want to delete ALL your diary entries, colors, and spaces? This cannot be undone.")) {
        localStorage.clear();
        location.reload();
    }
}

function fillRandomData() {
    const lorem = "you are beautiful beast and i love you even if we don't know each other it's just feeling before thoughts".split(' ');

    const allDays = [];
    for (let m = 0; m < 12; m++) {
        const days = new Date(currentYear, m + 1, 0).getDate();
        for (let d = 1; d <= days; d++) {
            allDays.push({ m: m + 1, d });
        }
    }

    // Pick 15 unique random days
    for (let i = 0; i < 15; i++) {
        if (allDays.length === 0) break;
        const idx = Math.floor(Math.random() * allDays.length);
        const day = allDays.splice(idx, 1)[0];
        
        const count = Math.floor(Math.random() * (100 - 5 + 1)) + 5;
        const words = [];
        for (let j = 0; j < count; j++) {
            words.push(lorem[Math.floor(Math.random() * lorem.length)]);
        }
        
        localStorage.setItem(getStorageKey(currentYear, day.m, day.d), words.join(' '));
    }
    renderGrid();
    alert(`Debug: 15 random entries added to ${currentYear}.`);
}