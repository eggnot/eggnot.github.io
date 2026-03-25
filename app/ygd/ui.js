// --- General UI Logic ---

function changeYear(delta) {
    currentYear += delta;
    renderGrid();
}

function openModal(id) {
    document.getElementById(id).classList.add('open');
    history.pushState({modalOpen: id}, "");
}

function closeModal(id) {
    document.getElementById(id).classList.remove('open');
}