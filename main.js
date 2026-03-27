// ==================== PONTO DE ENTRADA ====================

document.addEventListener('DOMContentLoaded', () => {
    // Login
    document.getElementById('loginBtn').onclick = login;
    document.getElementById('playerName').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
    
    // Logout
    document.getElementById('logoutBtn').onclick = logout;
    
    // Criar sala
    document.getElementById('createRoomBtn').onclick = () => {
        document.getElementById('configModal').classList.add('show');
    };
    
    // Cancelar sala
    document.getElementById('cancelRoomBtn').onclick = cancelRoom;
    
    // Voltar da corrida
    document.getElementById('backToGarageBtn').onclick = () => {
        stopGame3D();
        showScreen('garageScreen');
        updateGarageUI();
    };
    
    // Sair da corrida
    document.getElementById('exitRaceBtn').onclick = exitRace;
    
    // Copiar código
    document.getElementById('copyCodeBtn').onclick = () => {
        const code = document.getElementById('roomCodeDisplay').textContent;
        navigator.clipboard.writeText(code);
        alert('Código copiado!');
    };
    
    // Modal de configuração
    const modal = document.getElementById('configModal');
    let distanceVal = 1000;
    let playersVal = 1;
    
    document.getElementById('distanceValue').textContent = distanceVal;
    document.getElementById('playersCount').textContent = playersVal;
    
    document.getElementById('distMinus').onclick = () => {
        if (distanceVal > 300) {
            distanceVal -= 100;
            document.getElementById('distanceValue').textContent = distanceVal;
        }
    };
    document.getElementById('distPlus').onclick = () => {
        if (distanceVal < 5000) {
            distanceVal += 100;
            document.getElementById('distanceValue').textContent = distanceVal;
        }
    };
    document.getElementById('playersMinus').onclick = () => {
        if (playersVal > 1) {
            playersVal--;
            document.getElementById('playersCount').textContent = playersVal;
        }
    };
    document.getElementById('playersPlus').onclick = () => {
        if (playersVal < 6) {
            playersVal++;
            document.getElementById('playersCount').textContent = playersVal;
        }
    };
    
    document.getElementById('confirmConfigBtn').onclick = () => {
        modal.classList.remove('show');
        createRoomWithConfig(playersVal, distanceVal);
    };
    document.getElementById('cancelConfigBtn').onclick = () => {
        modal.classList.remove('show');
    };
    
    // Upgrades
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.onclick = (e) => {
            const type = e.target.dataset.upgrade;
            if (type) buyUpgrade(type);
        };
    });
    
    // Controles do jogo
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        
        if (key === 'a' || key === 'd' || key === 'arrowleft' || key === 'arrowright') {
            keysPressed[key] = true;
        }
        
        if (key === 's' || key === 'arrowdown') {
            e.preventDefault();
            if (raceActive) playerCar.isBraking = true;
        }
        
        if (key === 'escape' && raceActive) exitRace();
    });
    
    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key === 's' || key === 'arrowdown') playerCar.isBraking = false;
        delete keysPressed[key];
    });
});