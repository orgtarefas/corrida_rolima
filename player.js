// ==================== GERENCIAMENTO DO JOGADOR ====================

let currentPlayer = null;

// Login
async function login() {
    const name = document.getElementById('playerName').value.trim();
    if (!name) {
        alert('Digite seu nome!');
        return;
    }
    
    try {
        const playerRef = database.ref(`players/${name}`);
        const snapshot = await playerRef.once('value');
        
        if (snapshot.exists()) {
            currentPlayer = snapshot.val();
            currentPlayer.name = name;
        } else {
            currentPlayer = {
                name: name,
                wins: 0,
                points: 100,
                upgrades: { speed: 0, control: 0, durability: 0 }
            };
            await playerRef.set(currentPlayer);
        }
        
        document.getElementById('playerNameDisplay').textContent = currentPlayer.name;
        updateGarageUI();
        showScreen('garageScreen');
    } catch (error) {
        console.error('Erro no login:', error);
        alert('Erro ao conectar. Tente novamente.');
    }
}

// Logout
function logout() {
    if (raceActive) exitRace();
    if (currentRoomId) {
        database.ref(`rooms/${currentRoomId}/players/${currentPlayer.name}`).remove();
        if (roomListener) database.ref(`rooms/${currentRoomId}`).off();
        currentRoomId = null;
    }
    currentPlayer = null;
    document.getElementById('playerName').value = '';
    showScreen('loginScreen');
}

// Comprar upgrade
async function buyUpgrade(type) {
    if (!currentPlayer) return;
    
    const upgrades = currentPlayer.upgrades || {};
    const level = upgrades[type] || 0;
    if (level >= 10) {
        alert('Nível máximo atingido!');
        return;
    }
    
    const costs = { speed: 50, control: 30, durability: 45 };
    const cost = costs[type];
    
    if ((currentPlayer.points || 0) < cost) {
        alert(`Você precisa de ${cost}⭐ pontos!`);
        return;
    }
    
    currentPlayer.points -= cost;
    upgrades[type] = level + 1;
    currentPlayer.upgrades = upgrades;
    
    await database.ref(`players/${currentPlayer.name}`).update({
        points: currentPlayer.points,
        upgrades: upgrades
    });
    
    updateGarageUI();
}

// Atualizar UI da garagem
function updateGarageUI() {
    if (!currentPlayer) return;
    
    document.getElementById('winsCount').textContent = currentPlayer.wins || 0;
    document.getElementById('pointsCount').textContent = currentPlayer.points || 0;
    
    const upgrades = currentPlayer.upgrades || {};
    document.getElementById('speedLevel').textContent = upgrades.speed || 0;
    document.getElementById('controlLevel').textContent = upgrades.control || 0;
    document.getElementById('durabilityLevel').textContent = upgrades.durability || 0;
    
    document.getElementById('speedProgress').style.width = `${((upgrades.speed || 0) / 10) * 100}%`;
    document.getElementById('controlProgress').style.width = `${((upgrades.control || 0) / 10) * 100}%`;
    document.getElementById('durabilityProgress').style.width = `${((upgrades.durability || 0) / 10) * 100}%`;
    
    // Atualizar botões
    const points = currentPlayer.points || 0;
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        const type = btn.dataset.upgrade;
        const cost = { speed: 50, control: 30, durability: 45 }[type];
        btn.disabled = (upgrades[type] || 0) >= 10 || points < cost;
    });
}