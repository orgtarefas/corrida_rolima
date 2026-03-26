// ==================== SISTEMA DE SALAS MULTIPLAYER ====================

let currentRoomId = null;
let currentRoom = null;
let roomListener = null;
let playersListener = null;
let positionSyncInterval = null;
let otherPlayers = {};
let raceTotalDistance = 1000;

async function createRoomWithConfig(maxPlayers, distance) {
    if (!currentPlayer) return;
    raceTotalDistance = distance;
    
    try {
        const roomCode = generateRoomCode();
        currentRoomId = roomCode;
        
        const roomData = {
            id: roomCode,
            code: roomCode,
            status: 'waiting',
            maxPlayers: maxPlayers,
            raceDistance: distance,
            players: {
                [currentPlayer.name]: {
                    name: currentPlayer.name,
                    ready: true,
                    joinedAt: Date.now(),
                    x: 400,
                    y: TOP_Y,
                    distancia: 0,
                    velocidade: 0
                }
            },
            createdAt: Date.now(),
            raceStarted: false
        };
        
        await database.ref(`rooms/${roomCode}`).set(roomData);
        console.log(`✅ Sala criada: ${roomCode} | ${distance}m | ${maxPlayers} jogadores`);
        
        await new Promise(resolve => setTimeout(resolve, 500));
        
        listenForPlayers(roomCode);
        showWaitingRoom(roomCode);
        
        await navigator.clipboard.writeText(roomCode);
        alert(`Sala criada!\nCódigo: ${roomCode}\nDistância: ${distance}m\nMáximo: ${maxPlayers} jogadores`);
        
    } catch (error) {
        console.error('Erro ao criar sala:', error);
        alert('Erro ao criar sala.');
    }
}

async function joinRoom() {
    const roomCodeInput = document.getElementById('roomCodeInput');
    let roomCode = roomCodeInput?.value.trim().toUpperCase();
    
    if (!roomCode) { alert('Digite o código da sala!'); return; }
    if (roomCode.length !== 4) { alert('Código deve ter 4 letras!'); return; }
    
    try {
        const roomRef = database.ref(`rooms/${roomCode}`);
        const room = (await roomRef.once('value')).val();
        
        if (!room) { alert('Sala não encontrada!'); return; }
        if (room.raceStarted) { alert('Corrida já começou!'); return; }
        
        const playerCount = Object.keys(room.players || {}).length;
        const maxPlayers = room.maxPlayers || 2;
        
        if (playerCount >= maxPlayers) { alert(`Sala cheia! (${maxPlayers}/${maxPlayers})`); return; }
        
        currentRoomId = roomCode;
        raceTotalDistance = room.raceDistance || 1000;
        
        await roomRef.child(`players/${currentPlayer.name}`).set({
            name: currentPlayer.name,
            ready: true,
            joinedAt: Date.now(),
            x: 400,
            y: TOP_Y,
            distancia: 0,
            velocidade: 0
        });
        
        console.log(`✅ Jogador ${currentPlayer.name} entrou na sala ${roomCode}`);
        
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
        
        console.log(`👥 Sala ${roomCode}: ${playerCount}/${maxPlayers} jogadores`);
        
        const currentSpan = document.getElementById('currentPlayersCount');
        const maxSpan = document.getElementById('maxPlayersCount');
        const playersList = document.getElementById('playersList');
        
        if (currentSpan) currentSpan.textContent = playerCount;
        if (maxSpan) maxSpan.textContent = maxPlayers;
        
        if (playersList) {
            playersList.innerHTML = '';
            for (let [name, data] of Object.entries(players)) {
                const li = document.createElement('li');
                li.innerHTML = `👤 ${name} ${name === currentPlayer.name ? '(você)' : ''}`;
                playersList.appendChild(li);
            }
        }
        
        otherPlayers = {};
        for (let [name, data] of Object.entries(players)) {
            if (name !== currentPlayer.name) {
                otherPlayers[name] = { ...data, y: data.y || TOP_Y, distancia: data.distancia || 0 };
            }
        }
        
        if (playerCount === maxPlayers && !room.raceStarted) {
            console.log(`🎯 TODOS OS ${playerCount} JOGADORES CONECTADOS! Iniciando contagem...`);
            
            await database.ref(`rooms/${roomCode}`).update({
                raceStarted: true,
                status: 'racing',
                startTime: Date.now()
            });
            
            setTimeout(() => {
                startRaceOnline(roomCode);
            }, 500);
        }
    });
}

async function startRaceOnline(roomCode) {
    if (!currentPlayer) return;
    
    console.log(`🏁 INICIANDO CORRIDA DE ${raceTotalDistance}m NA SALA ${roomCode}...`);
    
    if (roomListener) database.ref(`rooms/${roomCode}`).off('value', roomListener);
    
    const waitingScreen = document.getElementById('waitingScreen');
    if (waitingScreen) waitingScreen.classList.remove('active');
    
    gameOver = false;
    raceResultShown = false;
    obstacles = [];
    raceStarted = true;
    raceActive = true;
    
    applyUpgradesToCar();
    playerCar.velocidade = 0;
    playerCar.distancia = 0;
    invincible = false;
    invincibleTimer = 0;
    
    const room = (await database.ref(`rooms/${roomCode}`).once('value')).val();
    const allPlayers = room?.players || {};
    
    const racePlayers = {};
    for (let [name, data] of Object.entries(allPlayers)) {
        racePlayers[name] = {
            name: name,
            x: data.x || 400,
            y: data.y || TOP_Y,
            distancia: 0,
            velocidade: 0,
            durability: 100,
            active: true
        };
    }
    
    await database.ref(`races/${roomCode}`).set({
        roomCode: roomCode,
        players: racePlayers,
        raceDistance: raceTotalDistance,
        startTime: Date.now()
    });
    
    const playersRef = database.ref(`races/${roomCode}/players`);
    playersListener = playersRef.on('value', (snapshot) => {
        const players = snapshot.val() || {};
        otherPlayers = {};
        for (let [name, data] of Object.entries(players)) {
            if (name !== currentPlayer.name) {
                otherPlayers[name] = data;
            }
        }
        console.log(`👥 Corrida: ${Object.keys(players).length} jogadores`);
    });
    
    if (typeof startGame3D === 'function') {
        startGame3D(raceTotalDistance);
    }
    if (typeof startRacePhysics === 'function') {
        startRacePhysics();
    }
    
    startPositionSync(roomCode);
    
    console.log('🏁 CORRIDA PRONTA! AGUARDANDO SINAL VERDE...');
}

function startPositionSync(roomCode) {
    if (positionSyncInterval) clearInterval(positionSyncInterval);
    
    positionSyncInterval = setInterval(async () => {
        if (raceActive && !gameOver && roomCode && currentPlayer) {
            try {
                await database.ref(`races/${roomCode}/players/${currentPlayer.name}`).update({
                    x: playerCar.x,
                    y: playerCar.y,
                    distancia: playerCar.distancia,
                    velocidade: playerCar.velocidade,
                    durability: playerCar.durability,
                    lastUpdate: Date.now()
                });
            } catch (e) { console.warn(e); }
        }
    }, 50);
}

function showWaitingRoom(roomCode) {
    const waitingScreen = document.getElementById('waitingScreen');
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    const maxSpan = document.getElementById('maxPlayersCount');
    
    if (roomCodeDisplay) roomCodeDisplay.textContent = roomCode;
    if (maxSpan && currentRoom) maxSpan.textContent = currentRoom.maxPlayers || 2;
    
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
