// Funções utilitárias
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function generateRoomCode() {
    const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 4; i++) code += letters[Math.floor(Math.random() * letters.length)];
    return code;
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}

function toggleFullscreen(btn) {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        btn.innerHTML = '✖ SAIR TELA CHEIA';
    } else {
        document.exitFullscreen();
        btn.innerHTML = '⛶ TELA CHEIA';
    }
}

// Constantes globais
const ROAD_LEFT = 45;
const ROAD_RIGHT = 755;
const TOP_Y = 60;
const BOTTOM_Y = 550;