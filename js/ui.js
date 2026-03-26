function showJoinModal() {
    const modal = document.getElementById('joinModal');
    const input = document.getElementById('roomCodeInput');
    if (modal) {
        if (input) input.value = '';
        modal.classList.remove('hidden');
    }
}

function hideJoinModal() {
    const modal = document.getElementById('joinModal');
    if (modal) modal.classList.add('hidden');
}

function showConfigModal() {
    const modal = document.getElementById('roomConfigModal');
    if (modal) modal.classList.remove('hidden');
}

function hideConfigModal() {
    const modal = document.getElementById('roomConfigModal');
    if (modal) modal.classList.add('hidden');
}

function showWaitingRoom(roomCode) {
    let waitingScreen = document.getElementById('waitingScreen');
    if (!waitingScreen) {
        waitingScreen = document.createElement('div');
        waitingScreen.id = 'waitingScreen';
        waitingScreen.className = 'screen';
        waitingScreen.innerHTML = `
            <div class="waiting-container">
                <h2>🎮 AGUARDANDO JOGADORES</h2>
                <div class="room-code">
                    <span>CÓDIGO:</span>
                    <h1 id="roomCodeDisplay">${roomCode}</h1>
                    <button id="copyCodeBtn">📋 COPIAR</button>
                </div>
                <div class="players-list">
                    <h3>JOGADORES (<span id="currentPlayersCount">0</span>/<span id="maxPlayersCount">0</span>)</h3>
                    <ul id="playersList"></ul>
                </div>
                <div class="waiting-info">
                    <p>⏳ Aguardando jogadores...</p>
                </div>
                <button id="cancelRoomBtn" class="btn-exit">CANCELAR</button>
            </div>`;
        document.querySelector('.container').appendChild(waitingScreen);
        
        document.getElementById('copyCodeBtn')?.addEventListener('click', () => {
            navigator.clipboard.writeText(roomCode);
            alert('Código copiado!');
        });
        document.getElementById('cancelRoomBtn')?.addEventListener('click', () => cancelRoom());
    }
    document.getElementById('roomCodeDisplay').textContent = roomCode;
    showScreen('waitingScreen');
}

function showRaceResult() {
    const resultDiv = document.getElementById('raceResult');
    const title = document.getElementById('resultTitle');
    const reward = document.getElementById('resultReward');
    if (!resultDiv) return;
    
    let pointsEarned = Math.floor(playerCar.distancia / 25) + 10;
    pointsEarned = Math.min(100, pointsEarned);
    
    if (playerCar.durability <= 0) {
        title.textContent = '💔 CARRINHO QUEBROU!';
        title.style.color = '#F44336';
        pointsEarned = Math.floor(pointsEarned * 0.5);
    } else {
        title.textContent = '🏁 CORRIDA FINALIZADA!';
        title.style.color = '#4CAF50';
    }
    reward.textContent = `Distância: ${Math.floor(playerCar.distancia)}m | +${pointsEarned}⭐ pontos!`;
    
    if (currentPlayer) {
        currentPlayer.points = (currentPlayer.points || 0) + pointsEarned;
        database.ref(`players/${currentPlayer.name}`).update({ points: currentPlayer.points });
        updateGarageUI();
    }
    resultDiv.classList.remove('hidden');
}

function createRoomConfigModal() {
    let configModal = document.getElementById('roomConfigModal');
    if (!configModal) {
        configModal = document.createElement('div');
        configModal.id = 'roomConfigModal';
        configModal.className = 'modal hidden';
        configModal.innerHTML = `
            <div class="modal-content">
                <h3>🎮 CONFIGURAR SALA</h3>
                <p>Número de jogadores:</p>
                <div class="players-selector">
                    <button id="playersMinus" class="btn-small">-</button>
                    <span id="playersCount">2</span>
                    <button id="playersPlus" class="btn-small">+</button>
                </div>
                <p class="small-text">Mínimo: 2 | Máximo: 6</p>
                <div class="modal-buttons">
                    <button id="confirmConfigBtn" class="btn-primary">CRIAR SALA</button>
                    <button id="cancelConfigBtn" class="btn-exit">CANCELAR</button>
                </div>
            </div>`;
        document.querySelector('.container').appendChild(configModal);
        
        let selectedMaxPlayers = 2;
        document.getElementById('playersMinus')?.addEventListener('click', () => {
            if (selectedMaxPlayers > 2) {
                selectedMaxPlayers--;
                document.getElementById('playersCount').textContent = selectedMaxPlayers;
            }
        });
        document.getElementById('playersPlus')?.addEventListener('click', () => {
            if (selectedMaxPlayers < 6) {
                selectedMaxPlayers++;
                document.getElementById('playersCount').textContent = selectedMaxPlayers;
            }
        });
        document.getElementById('confirmConfigBtn')?.addEventListener('click', () => {
            hideConfigModal();
            createRoomWithConfig(selectedMaxPlayers);
        });
        document.getElementById('cancelConfigBtn')?.addEventListener('click', hideConfigModal);
    }
}

function createFullscreenButton() {
    const btn = document.createElement('button');
    btn.innerHTML = '⛶ TELA CHEIA';
    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: #ff6b35;
        color: white;
        border: none;
        padding: 12px 20px;
        border-radius: 30px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    btn.onclick = () => toggleFullscreen(btn);
    document.body.appendChild(btn);
}