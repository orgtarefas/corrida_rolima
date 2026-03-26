// ==================== GERENCIAMENTO DO JOGADOR ====================

let currentPlayer = null;

const playerCar = {
    x: 400, y: 80, width: 32, height: 42,
    velocidade: 70, distancia: 0, durability: 100,
    handling: 7, isBraking: false,
};

let invincible = false;
let invincibleTimer = 0;

async function login() {
    const nameInput = document.getElementById('playerName');
    const name = nameInput?.value.trim();
    if (!name) { alert('Digite seu nome!'); return; }
    
    if (typeof database === 'undefined') {
        console.error('Firebase não inicializado!');
        alert('Erro de conexão. Recarregue a página.');
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
                name: name, wins: 0, points: 100,
                upgrades: { speed: 0, control: 0, durability: 0 }
            };
            await playerRef.set(currentPlayer);
        }
        
        document.getElementById('playerNameDisplay').textContent = currentPlayer.name;
        updateGarageUI();
        showScreen('garageScreen');
        console.log(`✅ Jogador logado: ${name}`);
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao conectar.');
    }
}

function logout() {
    if (typeof raceActive !== 'undefined' && raceActive && typeof exitRace === 'function') exitRace();
    if (currentRoomId && typeof leaveRoom === 'function') leaveRoom();
    currentPlayer = null;
    document.getElementById('playerName').value = '';
    showScreen('loginScreen');
}

async function buyUpgrade(upgradeType) {
    if (!currentPlayer) return;
    const playerUpgrades = currentPlayer.upgrades || {};
    let currentLevel = playerUpgrades[upgradeType] || 0;
    if (currentLevel >= 10) { alert('Nível máximo!'); return; }
    
    const costs = { speed: 50, control: 30, durability: 45 };
    const cost = costs[upgradeType];
    if ((currentPlayer.points || 0) < cost) { alert(`Precisa de ${cost}⭐`); return; }
    
    currentPlayer.points -= cost;
    playerUpgrades[upgradeType] = currentLevel + 1;
    currentPlayer.upgrades = playerUpgrades;
    
    if (typeof database !== 'undefined') {
        await database.ref(`players/${currentPlayer.name}`).update({ 
            points: currentPlayer.points, 
            upgrades: playerUpgrades 
        });
    }
    
    updateGarageUI();
}

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
    
    updateUpgradeButtons();
}

function updateUpgradeButtons() {
    if (!currentPlayer) return;
    const points = currentPlayer.points || 0;
    const upgrades = currentPlayer.upgrades || {};
    const costs = { speed: 50, control: 30, durability: 45 };
    
    const speedBtn = document.querySelector('[data-upgrade="speed"]');
    const controlBtn = document.querySelector('[data-upgrade="control"]');
    const durabilityBtn = document.querySelector('[data-upgrade="durability"]');
    
    if (speedBtn) speedBtn.disabled = (upgrades.speed || 0) >= 10 || points < costs.speed;
    if (controlBtn) controlBtn.disabled = (upgrades.control || 0) >= 10 || points < costs.control;
    if (durabilityBtn) durabilityBtn.disabled = (upgrades.durability || 0) >= 10 || points < costs.durability;
}

function applyUpgradesToCar() {
    const upgrades = currentPlayer?.upgrades || {};
    playerCar.velocidade = VELOCIDADES.carrinho.velocidadeInicial + (upgrades.speed || 0) * 3;
    playerCar.durability = 100 + (upgrades.durability || 0) * 15;
    playerCar.handling = 7 + (upgrades.control || 0) * 0.6;
    playerCar.distancia = 0;
    playerCar.x = 400;
    playerCar.y = TOP_Y;
    playerCar.isBraking = false;
}
