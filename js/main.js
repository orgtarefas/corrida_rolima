document.addEventListener('DOMContentLoaded', () => {
    setupGlobalEventListeners();
    createFullscreenButton();
    createRoomConfigModal();
});

function setupGlobalEventListeners() {
    document.getElementById('loginBtn')?.addEventListener('click', login);
    document.getElementById('playerName')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
    
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    document.getElementById('exitRaceBtn')?.addEventListener('click', exitRace);
    document.getElementById('backToGarageBtn')?.addEventListener('click', backToGarage);
    document.getElementById('createRoomBtn')?.addEventListener('click', showConfigModal);
    document.getElementById('joinRoomBtn')?.addEventListener('click', showJoinModal);
    document.getElementById('confirmJoinBtn')?.addEventListener('click', joinRoom);
    document.getElementById('cancelJoinBtn')?.addEventListener('click', hideJoinModal);
    
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const upgrade = e.target.dataset.upgrade;
            if (upgrade) buyUpgrade(upgrade);
        });
    });
    
    window.addEventListener('keydown', (e) => {
        const key = e.key;
        if (raceActive && !gameOver) {
            if (key === 'ArrowDown' || key === 's' || key === 'S') {
                e.preventDefault();
                playerCar.isBraking = true;
            }
            if (key === 'ArrowLeft' || key === 'ArrowRight' || 
                key === 'a' || key === 'A' || key === 'd' || key === 'D') {
                e.preventDefault();
                keysPressed[key.toLowerCase()] = true;
            }
        }
        if (raceActive && key === 'Escape') exitRace();
    });
    
    window.addEventListener('keyup', (e) => {
        const key = e.key;
        if (key === 'ArrowDown' || key === 's' || key === 'S') {
            playerCar.isBraking = false;
        }
        const keyLower = key.toLowerCase();
        if (keysPressed[keyLower]) delete keysPressed[keyLower];
    });
    
    document.getElementById('playerName')?.addEventListener('keydown', (e) => e.stopPropagation());
}