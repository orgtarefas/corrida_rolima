// ==================== SISTEMA MULTIPLAYER ====================

let currentRoomId = null;
let roomListener = null;
let positionInterval = null;

// Criar sala com configuração
async function createRoomWithConfig(maxPlayers, distance) {
    if (!currentPlayer) {
        alert('Faça login primeiro!');
        return;
    }
    
    raceDistanceTotal = distance;
    const roomCode = generateRoomCode();
    currentRoomId = roomCode;
    
    const roomData = {
        code: roomCode,
        status: 'waiting',
        maxPlayers: maxPlayers,
        raceDistance: distance,
        players: {},
        createdAt: Date.now(),
        raceStarted: false
    };
    
    roomData.players[currentPlayer.name] = {
        name: currentPlayer.name,
        ready: true,
        joinedAt: Date.now()
    };
    
    try {
        await database.ref(`rooms/${roomCode}`).set(roomData);
        console.log(`✅ Sala criada: ${roomCode} | ${maxPlayers} jogadores | ${distance}m`);
        
        document.getElementById('roomCodeDisplay').textContent = roomCode;
        document.getElementById('maxPlayersCount').textContent = maxPlayers;
        document.getElementById('currentPlayersCount').textContent = '1';
        
        // Mostrar lista de jogadores
        const list = document.getElementById('playersList');
        list.innerHTML = `<li>👤 ${currentPlayer.name} (você)</li>`;
        
        listenRoomPlayers(roomCode);
        showScreen('waitingScreen');
        
        // Se for sala com 1 jogador, iniciar imediatamente
        if (maxPlayers === 1) {
            setTimeout(() => {
                startRaceImmediately(roomCode);
            }, 500);
        }
    } catch (error) {
        console.error('Erro ao criar sala:', error);
        alert('Erro ao criar sala. Tente novamente.');
    }
}

// Iniciar corrida imediatamente (modo solo)
async function startRaceImmediately(roomCode) {
    await database.ref(`rooms/${roomCode}`).update({
        raceStarted: true,
        status: 'racing',
        startTime: Date.now()
    });
    startRaceOnline(roomCode);
}

// Entrar em uma sala existente
async function joinExistingRoom() {
    const roomCodeInput = document.getElementById('joinRoomCode');
    const roomCode = roomCodeInput.value.trim().toUpperCase();
    
    if (!roomCode) {
        alert('Digite o código da sala!');
        return;
    }
    
    if (roomCode.length !== 4) {
        alert('Código deve ter 4 caracteres!');
        return;
    }
    
    try {
        const roomRef = database.ref(`rooms/${roomCode}`);
        const snapshot = await roomRef.once('value');
        const room = snapshot.val();
        
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
            alert(`Sala cheia! (${playerCount}/${maxPlayers})`);
            return;
        }
        
        // Verificar se jogador já está na sala
        if (room.players[currentPlayer.name]) {
            alert('Você já está nesta sala!');
            return;
        }
        
        // Entrar na sala
        await roomRef.child(`players/${currentPlayer.name}`).set({
            name: currentPlayer.name,
            ready: true,
            joinedAt: Date.now()
        });
        
        currentRoomId = roomCode;
        raceDistanceTotal = room.raceDistance || 1000;
        
        console.log(`✅ ${currentPlayer.name} entrou na sala ${roomCode}`);
        
        // Fechar modal e mostrar tela de espera
        document.getElementById('joinRoomModal').classList.remove('show');
        document.getElementById('joinRoomCode').value = '';
        
        document.getElementById('roomCodeDisplay').textContent = roomCode;
        document.getElementById('maxPlayersCount').textContent = maxPlayers;
        
        listenRoomPlayers(roomCode);
        showScreen('waitingScreen');
        
    } catch (error) {
        console.error('Erro ao entrar na sala:', error);
        alert('Erro ao entrar na sala. Tente novamente.');
    }
}

// Ouvir jogadores na sala
function listenRoomPlayers(roomCode) {
    if (roomListener) database.ref(`rooms/${roomCode}`).off();
    
    roomListener = database.ref(`rooms/${roomCode}`).on('value', async (snapshot) => {
        const room = snapshot.val();
        if (!room) return;
        
        const players = room.players || {};
        const count = Object.keys(players).length;
        const max = room.maxPlayers || 2;
        
        document.getElementById('currentPlayersCount').textContent = count;
        
        const list = document.getElementById('playersList');
        list.innerHTML = '';
        for (let [name] of Object.entries(players)) {
            const li = document.createElement('li');
            li.innerHTML = `${name === currentPlayer.name ? '👤' : '👥'} ${name} ${name === currentPlayer.name ? '(você)' : ''}`;
            list.appendChild(li);
        }
        
        // Iniciar corrida quando todos os jogadores estiverem prontos
        if (!room.raceStarted && count === max && max > 0) {
            console.log(`🎯 Todos os ${count} jogadores conectados! Iniciando corrida...`);
            await database.ref(`rooms/${roomCode}`).update({
                raceStarted: true,
                status: 'racing',
                startTime: Date.now()
            });
            startRaceOnline(roomCode);
        }
    });
}

// Iniciar corrida online
async function startRaceOnline(roomCode) {
    if (roomListener) {
        database.ref(`rooms/${roomCode}`).off('value', roomListener);
        roomListener = null;
    }
    
    try {
        const roomSnap = await database.ref(`rooms/${roomCode}`).once('value');
        const room = roomSnap.val();
        if (!room) return;
        
        raceDistanceTotal = room.raceDistance || 1000;
        
        // Criar dados da corrida
        const racePlayers = {};
        for (let [name, data] of Object.entries(room.players)) {
            racePlayers[name] = { 
                name: name, 
                x: 0, 
                distancia: 0, 
                velocidade: 0, 
                durability: 100,
                lastUpdate: Date.now()
            };
        }
        
        await database.ref(`races/${roomCode}`).set({
            roomCode: roomCode,
            players: racePlayers,
            raceDistance: raceDistanceTotal,
            startTime: Date.now()
        });
        
        console.log(`🏁 Corrida de ${raceDistanceTotal}m iniciada na sala ${roomCode}`);
        
        // Fechar tela de espera e iniciar jogo
        showScreen('garageScreen');
        
        // Pequeno delay para garantir que tudo foi salvo
        setTimeout(() => {
            startRace(true, roomCode);
        }, 100);
        
    } catch (error) {
        console.error('Erro ao iniciar corrida:', error);
        alert('Erro ao iniciar a corrida. Tente novamente.');
    }
}

// Iniciar corrida
function startRace(isMulti, roomCode = null) {
    if (!currentPlayer) {
        alert('Jogador não encontrado!');
        return;
    }
    
    console.log('🚗 Iniciando corrida...');
    
    applyUpgrades();
    playerCar.durability = 100 + (currentPlayer.upgrades?.durability || 0) * 12;
    playerCar.velocidade = 0;
    playerCar.distancia = 0;
    playerCar.x = 0;
    gameOver = false;
    raceActive = true;
    raceStarted = false;
    
    // Inicializar 3D
    init3D(raceDistanceTotal);
    
    // Contagem regressiva
    let count = 3;
    const div = document.createElement('div');
    div.id = 'countdownDiv';
    div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:80px;color:white;background:rgba(0,0,0,0.9);padding:30px 60px;border-radius:60px;z-index:1000;font-weight:bold;font-family:monospace;border:3px solid #ff6b35;';
    div.textContent = '3';
    document.body.appendChild(div);
    
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            div.textContent = count;
            div.style.color = 'white';
        } else if (count === 0) {
            div.textContent = 'GO!';
            div.style.color = '#4caf50';
            div.style.borderColor = '#4caf50';
        } else {
            clearInterval(interval);
            div.remove();
            raceStarted = true;
            console.log('🏁 GO! Corrida iniciada!');
        }
    }, 1000);
    
    startPhysicsLoop();
    
    // Sincronização multiplayer
    if (isMulti && roomCode) {
        startMultiplayerSync(roomCode);
    }
}

// Sincronizar posição no multiplayer
function startMultiplayerSync(roomCode) {
    if (positionInterval) clearInterval(positionInterval);
    
    positionInterval = setInterval(async () => {
        if (raceActive && !gameOver && currentPlayer && roomCode) {
            try {
                await database.ref(`races/${roomCode}/players/${currentPlayer.name}`).update({
                    x: playerCar.x,
                    distancia: playerCar.distancia,
                    velocidade: playerCar.velocidade,
                    durability: playerCar.durability,
                    lastUpdate: Date.now()
                });
            } catch (e) {
                console.warn('Erro ao sincronizar:', e);
            }
        }
    }, 80);
}

// Cancelar sala
async function cancelRoom() {
    if (currentRoomId) {
        try {
            await database.ref(`rooms/${currentRoomId}`).remove();
            if (roomListener) database.ref(`rooms/${currentRoomId}`).off();
        } catch (e) {
            console.warn('Erro ao cancelar sala:', e);
        }
        currentRoomId = null;
        roomListener = null;
    }
    showScreen('garageScreen');
    if (typeof updateGarageUI === 'function') updateGarageUI();
}

// Sair da sala (quando fecha o jogo)
function leaveRoom() {
    if (currentRoomId && currentPlayer) {
        database.ref(`rooms/${currentRoomId}/players/${currentPlayer.name}`).remove();
        if (roomListener) database.ref(`rooms/${currentRoomId}`).off();
        currentRoomId = null;
        roomListener = null;
    }
}
