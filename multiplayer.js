// ==================== SISTEMA MULTIPLAYER ====================

let currentRoomId = null;
let roomListener = null;
let positionInterval = null;

// Criar sala com configuração
async function createRoomWithConfig(maxPlayers, distance) {
    if (!currentPlayer) return;
    
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
    
    await database.ref(`rooms/${roomCode}`).set(roomData);
    
    document.getElementById('roomCodeDisplay').textContent = roomCode;
    document.getElementById('maxPlayersCount').textContent = maxPlayers;
    
    listenRoomPlayers(roomCode);
    showScreen('waitingScreen');
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
            li.textContent = `${name} ${name === currentPlayer.name ? '(você)' : ''}`;
            list.appendChild(li);
        }
        
        // Iniciar corrida quando todos estiverem prontos
        if (!room.raceStarted && count === max) {
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
    if (roomListener) database.ref(`rooms/${roomCode}`).off();
    
    const roomSnap = await database.ref(`rooms/${roomCode}`).once('value');
    const room = roomSnap.val();
    if (!room) return;
    
    raceDistanceTotal = room.raceDistance || 1000;
    
    // Criar dados da corrida
    const racePlayers = {};
    for (let [name] of Object.entries(room.players)) {
        racePlayers[name] = { name, x: 0, distancia: 0, velocidade: 0, durability: 100 };
    }
    await database.ref(`races/${roomCode}`).set({
        roomCode,
        players: racePlayers,
        raceDistance: raceDistanceTotal,
        startTime: Date.now()
    });
    
    showScreen('garageScreen');
    startRace(true, roomCode);
}

// Iniciar corrida
function startRace(isMulti, roomCode = null) {
    if (!currentPlayer) return;
    
    applyUpgrades();
    playerCar.durability = 100 + (currentPlayer.upgrades?.durability || 0) * 12;
    playerCar.velocidade = 0;
    playerCar.distancia = 0;
    playerCar.x = 0;
    gameOver = false;
    raceActive = true;
    raceStarted = false;
    
    init3D(raceDistanceTotal);
    
    // Contagem regressiva
    let count = 3;
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);font-size:70px;color:white;background:black;padding:20px 40px;border-radius:50px;z-index:1000;font-weight:bold;';
    div.textContent = '3';
    document.body.appendChild(div);
    
    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            div.textContent = count;
        } else if (count === 0) {
            div.textContent = 'GO!';
            div.style.color = '#4caf50';
        } else {
            clearInterval(interval);
            div.remove();
            raceStarted = true;
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
        if (raceActive && currentPlayer && roomCode) {
            await database.ref(`races/${roomCode}/players/${currentPlayer.name}`).update({
                x: playerCar.x,
                distancia: playerCar.distancia,
                velocidade: playerCar.velocidade,
                durability: playerCar.durability,
                lastUpdate: Date.now()
            });
        }
    }, 80);
}

// Cancelar sala
async function cancelRoom() {
    if (currentRoomId) {
        await database.ref(`rooms/${currentRoomId}`).remove();
        if (roomListener) database.ref(`rooms/${currentRoomId}`).off();
        currentRoomId = null;
    }
    showScreen('garageScreen');
    updateGarageUI();
}