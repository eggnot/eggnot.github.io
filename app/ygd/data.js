// --- Data Management (CSV Import/Export) ---

function exportCSV() {
    let csv = "Date,Content\n";
    const keys = Object.keys(localStorage).filter(k => k.startsWith('D_')).sort();
    keys.forEach(k => {
        const date = k.replace('D_', '');
        const content = (localStorage.getItem(k) || "").replace(/"/g, '""');
        csv += `${date},"${content}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diary_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
}

function importCSV(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        const lines = e.target.result.split('\n');
        lines.slice(1).forEach(line => {
            const firstComma = line.indexOf(',');
            if (firstComma === -1) return;
            const date = line.substring(0, firstComma).trim();
            let content = line.substring(firstComma + 1).trim();
            if (content.startsWith('"') && content.endsWith('"')) {
                content = content.substring(1, content.length - 1).replace(/""/g, '"');
            }
            if (date && content) localStorage.setItem(`D_${date}`, content);
        });
        renderGrid();
        alert('Import complete');
    };
    reader.readAsText(file);
}