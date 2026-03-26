// ==================== SISTEMA DE SALAS MULTIPLAYER ====================

let currentRoomId = null;
let currentRoom = null;
let roomListener = null;
let playersListener = null;
let positionSyncInterval = null;
let otherPlayers = {};
let otherCars = {};

async function createRoomWithConfig(maxPlayers) {
    if (!currentPlayer) return;
    
    try {
        const roomCode = generateRoomCode();
        currentRoomId = roomCode;
        
        const roomData = {
            id: roomCode, code: roomCode, status: 'waiting',
            maxPlayers: maxPlayers,
            players: {
                [currentPlayer.name]: {
                    name: currentPlayer.name, ready: true,
                    joinedAt: Date.now(), x: 400, y: TOP_Y
                }
            },
            createdAt: Date.now(), raceStarted: false
        };
        
        await database.ref(`rooms/${roomCode}`).set(roomData);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        listenForPlayers(roomCode);
        showWaitingRoom(roomCode);
        await navigator.clipboard.writeText(roomCode);
        alert(`Sala criada! Código: ${roomCode}\nMáximo: ${maxPlayers} jogadores`);
    } catch (error) {
        console.error('Erro ao criar sala:', error);
        alert('Erro ao criar sala.');
    }
}

async function joinRoom() {
    const roomCodeInput = document.getElementById('roomCodeInput');
    let roomCode = roomCodeInput?.value.trim().toUpperCase();
    if (!roomCode) { alert('Digite o código!'); return; }
    if (roomCode.length !== 4) { alert('Código deve ter 4 letras!'); return; }
    
    try {
        const roomRef = database.ref(`rooms/${roomCode}`);
        const room = (await roomRef.once('value')).val();
        
        if (!room) { alert('Sala não encontrada!'); return; }
        if (room.raceStarted) { alert('Corrida já começou!'); return; }
        
        const playerCount = Object.keys(room.players || {}).length;
        const maxPlayers = room.maxPlayers || 2;
        if (playerCount >= maxPlayers) { alert(`Sala cheia!`); return; }
        
        currentRoomId = roomCode;
        await roomRef.child(`players/${currentPlayer.name}`).set({
            name: currentPlayer.name, ready: true,
            joinedAt: Date.now(), x: 400, y: TOP_Y
        });
        
        hideJoinModal();
        listenForPlayers(roomCode);
        showWaitingRoom(roomCode);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao entrar na sala.');
    }
}

function listenForPlayers(roomCode) {
    const roomRef = database.ref(`rooms/${roomCode}`);
    
    roomListener = roomRef.on('value', async (snapshot) => {
        const room = snapshot.val();
        if (!room) return;
        currentRoom = room;
        
        const maxPlayers = room.maxPlayers || 2;
        const players = room.players || {};
        const playerCount = Object.keys(players).length;
        
        // Atualizar UI
        const currentSpan = document.getElementById('currentPlayersCount');
        const maxSpan = document.getElementById('maxPlayersCount');
        const playersList = document.getElementById('playersList');
        
        if (currentSpan) currentSpan.textContent = playerCount;
        if (maxSpan) maxSpan.textContent = maxPlayers;
        
        if (playersList) {
            playersList.innerHTML = '';
            for (let [name] of Object.entries(players)) {
                playersList.innerHTML += `<li>👤 ${name} ${name === currentPlayer.name ? '(você)' : ''}</li>`;
            }
        }
        
        // Atualizar outros jogadores
        otherPlayers = {};
        for (let [name, data] of Object.entries(players)) {
            if (name !== currentPlayer.name) {
                otherPlayers[name] = { ...data, y: data.y || TOP_Y };
            }
        }
        
        // Iniciar corrida quando todos estiverem prontos
        if (playerCount === maxPlayers && !room.raceStarted) {
            await database.ref(`rooms/${roomCode}`).update({
                raceStarted: true, status: 'racing', startTime: Date.now()
            });
            setTimeout(() => startRaceOnline(roomCode), 500);
        }
    });
}

async function startRaceOnline(roomCode) {
    if (!currentPlayer) return;
    
    if (roomListener) database.ref(`rooms/${roomCode}`).off('value', roomListener);
    const waitingScreen = document.getElementById('waitingScreen');
    if (waitingScreen) waitingScreen.classList.remove('active');
    
    gameOver = false;
    obstacles = [];
    raceStarted = true;
    raceActive = true;
    
    applyUpgradesToCar();
    invincible = false;
    invincibleTimer = 0;
    
    // Iniciar jogo 3D
    if (typeof startGame3D === 'function') startGame3D();
    if (typeof startRacePhysics === 'function') startRacePhysics();
    
    // Buscar todos os jogadores da sala
    const room = (await database.ref(`rooms/${roomCode}`).once('value')).val();
    const allPlayers = room?.players || {};
    
    const racePlayers = {};
    for (let [name, data] of Object.entries(allPlayers)) {
        racePlayers[name] = {
            name: name, x: data.x || 400, y: data.y || TOP_Y,
            distancia: 0, velocidade: VELOCIDADES.carrinho.velocidadeInicial,
            durability: 100, active: true
        };
    }
    
    await database.ref(`races/${roomCode}`).set({
        roomCode: roomCode, players: racePlayers, startTime: Date.now()
    });
    
    const playersRef = database.ref(`races/${roomCode}/players`);
    playersListener = playersRef.on('value', (snapshot) => {
        const players = snapshot.val() || {};
        otherPlayers = {};
        for (let [name, data] of Object.entries(players)) {
            if (name !== currentPlayer.name) otherPlayers[name] = data;
        }
    });
    
    startPositionSync(roomCode);
    
    console.log('🏁 Corrida 3D iniciada!');
}

function startPositionSync(roomCode) {
    if (positionSyncInterval) clearInterval(positionSyncInterval);
    
    positionSyncInterval = setInterval(async () => {
        if (raceActive && !gameOver && roomCode && currentPlayer) {
            try {
                await database.ref(`races/${roomCode}/players/${currentPlayer.name}`).update({
                    x: playerCar.x, y: playerCar.y,
                    distancia: playerCar.distancia, velocidade: playerCar.velocidade,
                    durability: playerCar.durability, lastUpdate: Date.now()
                });
            } catch (e) { console.warn(e); }
        }
    }, 50);
}

function showWaitingRoom(roomCode) {
    let waitingScreen = document.getElementById('waitingScreen');
    if (!waitingScreen) return;
    document.getElementById('roomCodeDisplay').textContent = roomCode;
    showScreen('waitingScreen');
}

async function cancelRoom() {
    if (currentRoomId) {
        await database.ref(`rooms/${currentRoomId}`).remove();
        if (roomListener) database.ref(`rooms/${currentRoomId}`).off('value', roomListener);
        currentRoomId = null;
    }
    showScreen('garageScreen');
    updateGarageUI();
}

async function leaveRoom() {
    if (currentRoomId && currentPlayer) {
        await database.ref(`rooms/${currentRoomId}/players/${currentPlayer.name}`).remove();
    }
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
    resultDiv.classList.remove('active');
    resultDiv.classList.add('active');
    showScreen('raceResult');
}

function exitRace() {
    raceActive = false;
    raceStarted = false;
    if (positionSyncInterval) clearInterval(positionSyncInterval);
    if (playersListener && currentRoomId) {
        database.ref(`races/${currentRoomId}/players`).off('value', playersListener);
    }
    if (currentRoomId) {
        database.ref(`races/${currentRoomId}`).remove();
        database.ref(`rooms/${currentRoomId}`).remove();
    }
    currentRoomId = null;
    keysPressed = {};
    
    if (typeof stopGame3D === 'function') stopGame3D();
    showScreen('garageScreen');
    updateGarageUI();
}

function backToGarage() {
    exitRace();
}
