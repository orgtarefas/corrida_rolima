// ==================== SISTEMA DE SALAS MULTIPLAYER ====================

let currentRoomId = null;
let currentRoom = null;
let roomListener = null;
let playersListener = null;
let positionSyncInterval = null;
let otherPlayers = {};

async function createRoomWithConfig(maxPlayers) {
    if (!currentPlayer) return;
    
    try {
        const roomCode = generateRoomCode();
        currentRoomId = roomCode;
        
        const roomData = {
            id: roomCode,
            code: roomCode,
            status: 'waiting',
            maxPlayers: maxPlayers,
            players: {
                [currentPlayer.name]: {
                    name: currentPlayer.name,
                    ready: true,
                    joinedAt: Date.now(),
                    x: 400,
                    y: TOP_Y,
                    distancia: 0,
                    velocidade: 70
                }
            },
            createdAt: Date.now(),
            raceStarted: false
        };
        
        await database.ref(`rooms/${roomCode}`).set(roomData);
        console.log(`✅ Sala criada: ${roomCode} para ${maxPlayers} jogadores`);
        
        // Aguardar um momento para garantir que os dados foram salvos
        await new Promise(resolve => setTimeout(resolve, 500));
        
        listenForPlayers(roomCode);
        showWaitingRoom(roomCode);
        
        await navigator.clipboard.writeText(roomCode);
        alert(`Sala criada! Código: ${roomCode}\nMáximo: ${maxPlayers} jogadores\nCompartilhe o código com seus amigos!`);
        
    } catch (error) {
        console.error('Erro ao criar sala:', error);
        alert('Erro ao criar sala. Verifique as regras do Firebase.');
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
        
        if (!room) { 
            alert('Sala não encontrada! Verifique o código.'); 
            return; 
        }
        
        if (room.raceStarted) { 
            alert('Esta corrida já começou!'); 
            return; 
        }
        
        const playerCount = Object.keys(room.players || {}).length;
        const maxPlayers = room.maxPlayers || 2;
        
        if (playerCount >= maxPlayers) { 
            alert(`Sala cheia! (${maxPlayers}/${maxPlayers})`); 
            return; 
        }
        
        currentRoomId = roomCode;
        
        // Adicionar jogador à sala
        await roomRef.child(`players/${currentPlayer.name}`).set({
            name: currentPlayer.name,
            ready: true,
            joinedAt: Date.now(),
            x: 400,
            y: TOP_Y,
            distancia: 0,
            velocidade: 70
        });
        
        console.log(`✅ Jogador ${currentPlayer.name} entrou na sala ${roomCode}`);
        
        hideJoinModal();
        listenForPlayers(roomCode);
        showWaitingRoom(roomCode);
        
    } catch (error) {
        console.error('Erro ao entrar na sala:', error);
        alert('Erro ao entrar na sala. Tente novamente.');
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
        
        // Atualizar UI da sala de espera
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
        
        // Atualizar outros jogadores
        otherPlayers = {};
        for (let [name, data] of Object.entries(players)) {
            if (name !== currentPlayer.name) {
                otherPlayers[name] = { 
                    ...data, 
                    y: data.y || TOP_Y,
                    distancia: data.distancia || 0
                };
            }
        }
        
        // INICIAR CORRIDA QUANDO TODOS ESTIVEREM NA SALA
        if (playerCount === maxPlayers && !room.raceStarted) {
            console.log(`🎯 TODOS OS ${playerCount} JOGADORES CONECTADOS! Iniciando corrida...`);
            
            // Marcar que a corrida começou
            await database.ref(`rooms/${roomCode}`).update({
                raceStarted: true,
                status: 'racing',
                startTime: Date.now()
            });
            
            // Pequeno delay para garantir que todos os dados foram salvos
            setTimeout(() => {
                startRaceOnline(roomCode);
            }, 500);
        } else if (playerCount < maxPlayers && !room.raceStarted) {
            console.log(`⏳ Aguardando mais ${maxPlayers - playerCount} jogador(es)...`);
        }
    });
}

async function startRaceOnline(roomCode) {
    if (!currentPlayer) return;
    
    console.log(`🏁 INICIANDO CORRIDA NA SALA ${roomCode}...`);
    
    // Limpar listener da sala de espera
    if (roomListener) {
        database.ref(`rooms/${roomCode}`).off('value', roomListener);
    }
    
    // Esconder tela de espera
    const waitingScreen = document.getElementById('waitingScreen');
    if (waitingScreen) waitingScreen.classList.remove('active');
    
    // Resetar estado do jogo
    gameOver = false;
    raceResultShown = false;
    obstacles = [];
    raceStarted = true;
    raceActive = true;
    
    // Aplicar upgrades ao carro
    applyUpgradesToCar();
    invincible = false;
    invincibleTimer = 0;
    
    // Buscar TODOS os jogadores da sala
    const room = (await database.ref(`rooms/${roomCode}`).once('value')).val();
    const allPlayers = room?.players || {};
    
    console.log(`👥 Jogadores na sala: ${Object.keys(allPlayers).length}`, Object.keys(allPlayers));
    
    // Criar estrutura da corrida com todos os jogadores
    const racePlayers = {};
    for (let [name, data] of Object.entries(allPlayers)) {
        racePlayers[name] = {
            name: name,
            x: data.x || 400,
            y: data.y || TOP_Y,
            distancia: 0,
            velocidade: VELOCIDADES.carrinho.velocidadeInicial,
            durability: 100,
            active: true
        };
    }
    
    // Salvar todos os jogadores na corrida
    await database.ref(`races/${roomCode}`).set({
        roomCode: roomCode,
        players: racePlayers,
        startTime: Date.now()
    });
    
    // Ouvir atualizações dos outros jogadores
    const playersRef = database.ref(`races/${roomCode}/players`);
    playersListener = playersRef.on('value', (snapshot) => {
        const players = snapshot.val() || {};
        otherPlayers = {};
        for (let [name, data] of Object.entries(players)) {
            if (name !== currentPlayer.name) {
                otherPlayers[name] = data;
            }
        }
        console.log(`👥 Atualização: ${Object.keys(players).length} jogadores na corrida | Outros: ${Object.keys(otherPlayers).length}`);
    });
    
    // Iniciar jogo 3D e física
    if (typeof startGame3D === 'function') {
        startGame3D();
    }
    if (typeof startRacePhysics === 'function') {
        startRacePhysics();
    }
    
    startPositionSync(roomCode);
    
    console.log('🏁 CORRIDA INICIADA!');
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
            } catch (e) {
                console.warn('Erro ao sincronizar:', e);
            }
        }
    }, 50);
}

function showWaitingRoom(roomCode) {
    const waitingScreen = document.getElementById('waitingScreen');
    const roomCodeDisplay = document.getElementById('roomCodeDisplay');
    if (roomCodeDisplay) roomCodeDisplay.textContent = roomCode;
    showScreen('waitingScreen');
}

async function cancelRoom() {
    if (currentRoomId) {
        await database.ref(`rooms/${currentRoomId}`).remove();
        if (roomListener) {
            database.ref(`rooms/${currentRoomId}`).off('value', roomListener);
        }
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
