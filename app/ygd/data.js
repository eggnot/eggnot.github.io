// --- Data Management (CSV Import/Export) ---

function exportCSV() {
    let csv = "Date,Color,Content\n";
    // Collect all unique dates that have either text or a color assigned
    const dates = new Set();
    Object.keys(localStorage).forEach(k => {
        if (k.startsWith('D_') || k.startsWith('C_')) {
            dates.add(k.substring(2));
        }
    });

    Array.from(dates).sort().forEach(date => {
        const color = localStorage.getItem(`C_${date}`) || "";
        const content = (localStorage.getItem(`D_${date}`) || "").replace(/"/g, '""');
        csv += `${date},${color},"${content}"\n`;
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
        // Regex for: Date,Color,"Content"
        // Handles multi-line content inside quotes and escaped quotes ("")
        const regex = /^([^,\r\n]+),([^,\r\n]*),"((?:[^"]|"")*)"(?:\r?\n|$)/gm;
        let match;
        let count = 0;

        while ((match = regex.exec(text)) !== null) {
            const date = match[1].trim();
            const color = match[2].trim();
            const content = match[3].replace(/""/g, '"');

            if (date === "Date") continue; // Skip CSV header

            if (date) {
                const dKey = `D_${date}`;
                const cKey = `C_${date}`;

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
    if (confirm("Are you sure you want to delete ALL your diary entries and colors? This cannot be undone.")) {
        Object.keys(localStorage).forEach(k => {
            if (k.startsWith('D_') || k.startsWith('C_')) {
                localStorage.removeItem(k);
            }
        });
        renderGrid();
        alert("All data has been cleared.");
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