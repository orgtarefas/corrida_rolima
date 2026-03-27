// ==================== PONTO DE ENTRADA ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Jogo carregado!');
    
    // ========== LOGIN ==========
    const loginBtn = document.getElementById('loginBtn');
    const playerNameInput = document.getElementById('playerName');
    
    if (loginBtn) {
        loginBtn.onclick = login;
    }
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });
    }
    
    // ========== LOGOUT ==========
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.onclick = logout;
    
    // ========== CRIAR SALA ==========
    const createRoomBtn = document.getElementById('createRoomBtn');
    if (createRoomBtn) {
        createRoomBtn.onclick = () => {
            document.getElementById('configModal').classList.add('show');
        };
    }
    
    // ========== ENTRAR EM SALA (BOTÃO) ==========
    const showJoinModalBtn = document.getElementById('showJoinModalBtn');
    if (showJoinModalBtn) {
        showJoinModalBtn.onclick = () => {
            document.getElementById('joinRoomModal').classList.add('show');
            document.getElementById('joinRoomCode').value = '';
            document.getElementById('joinRoomCode').focus();
        };
    }
    
    // ========== CONFIRMAR ENTRAR EM SALA ==========
    const confirmJoinRoomBtn = document.getElementById('confirmJoinRoomBtn');
    if (confirmJoinRoomBtn) {
        confirmJoinRoomBtn.onclick = joinExistingRoom;
    }
    
    // ========== CANCELAR ENTRAR EM SALA ==========
    const cancelJoinRoomBtn = document.getElementById('cancelJoinRoomBtn');
    if (cancelJoinRoomBtn) {
        cancelJoinRoomBtn.onclick = () => {
            document.getElementById('joinRoomModal').classList.remove('show');
            document.getElementById('joinRoomCode').value = '';
        };
    }
    
    // Permitir Enter no campo de código
    const joinRoomCodeInput = document.getElementById('joinRoomCode');
    if (joinRoomCodeInput) {
        joinRoomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') joinExistingRoom();
        });
    }
    
    // ========== CANCELAR SALA (AGUARDANDO) ==========
    const cancelRoomBtn = document.getElementById('cancelRoomBtn');
    if (cancelRoomBtn) cancelRoomBtn.onclick = cancelRoom;
    
    // ========== VOLTAR DA CORRIDA ==========
    const backToGarageBtn = document.getElementById('backToGarageBtn');
    if (backToGarageBtn) {
        backToGarageBtn.onclick = () => {
            if (typeof stopGame3D === 'function') stopGame3D();
            showScreen('garageScreen');
            if (typeof updateGarageUI === 'function') updateGarageUI();
        };
    }
    
    // ========== SAIR DA CORRIDA ==========
    const exitRaceBtn = document.getElementById('exitRaceBtn');
    if (exitRaceBtn) exitRaceBtn.onclick = exitRace;
    
    // ========== COPIAR CÓDIGO ==========
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    if (copyCodeBtn) {
        copyCodeBtn.onclick = () => {
            const code = document.getElementById('roomCodeDisplay').textContent;
            if (code) {
                navigator.clipboard.writeText(code);
                alert(`Código ${code} copiado!`);
            }
        };
    }
    
    // ========== MODAL DE CRIAÇÃO ==========
    const modal = document.getElementById('configModal');
    let distanceVal = 1000;
    let playersVal = 2;
    
    const distanceValueSpan = document.getElementById('distanceValue');
    const playersCountSpan = document.getElementById('playersCount');
    
    if (distanceValueSpan) distanceValueSpan.textContent = distanceVal;
    if (playersCountSpan) playersCountSpan.textContent = playersVal;
    
    const distMinus = document.getElementById('distMinus');
    const distPlus = document.getElementById('distPlus');
    const playersMinus = document.getElementById('playersMinus');
    const playersPlus = document.getElementById('playersPlus');
    const confirmConfigBtn = document.getElementById('confirmConfigBtn');
    const cancelConfigBtn = document.getElementById('cancelConfigBtn');
    
    if (distMinus) {
        distMinus.onclick = () => {
            if (distanceVal > 300) {
                distanceVal -= 100;
                distanceValueSpan.textContent = distanceVal;
            }
        };
    }
    
    if (distPlus) {
        distPlus.onclick = () => {
            if (distanceVal < 5000) {
                distanceVal += 100;
                distanceValueSpan.textContent = distanceVal;
            }
        };
    }
    
    if (playersMinus) {
        playersMinus.onclick = () => {
            if (playersVal > 2) {
                playersVal--;
                playersCountSpan.textContent = playersVal;
            }
        };
    }
    
    if (playersPlus) {
        playersPlus.onclick = () => {
            if (playersVal < 6) {
                playersVal++;
                playersCountSpan.textContent = playersVal;
            }
        };
    }
    
    if (confirmConfigBtn) {
        confirmConfigBtn.onclick = () => {
            modal.classList.remove('show');
            createRoomWithConfig(playersVal, distanceVal);
        };
    }
    
    if (cancelConfigBtn) {
        cancelConfigBtn.onclick = () => {
            modal.classList.remove('show');
        };
    }
    
    // ========== UPGRADES ==========
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.onclick = (e) => {
            const type = e.target.dataset.upgrade;
            if (type && typeof buyUpgrade === 'function') buyUpgrade(type);
        };
    });
    
    // ========== CONTROLES DO JOGO ==========
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        
        if (key === 'a' || key === 'd' || key === 'arrowleft' || key === 'arrowright') {
            if (typeof keysPressed !== 'undefined') keysPressed[key] = true;
            e.preventDefault();
        }
        
        if (key === 's' || key === 'arrowdown') {
            e.preventDefault();
            if (typeof playerCar !== 'undefined' && raceActive) playerCar.isBraking = true;
        }
        
        if (key === 'escape' && raceActive && typeof exitRace === 'function') {
            exitRace();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (key === 's' || key === 'arrowdown') {
            if (typeof playerCar !== 'undefined') playerCar.isBraking = false;
        }
        if (typeof keysPressed !== 'undefined') delete keysPressed[key];
    });
    
    // Fechar modais clicando fora
    window.onclick = (event) => {
        const configModal = document.getElementById('configModal');
        const joinModal = document.getElementById('joinRoomModal');
        if (event.target === configModal) configModal.classList.remove('show');
        if (event.target === joinModal) joinModal.classList.remove('show');
    };
});

// Função auxiliar para mostrar tela
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
}
