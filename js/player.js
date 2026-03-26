// Gerenciamento do jogador
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
    if (raceActive) exitRace();
    if (currentRoomId) leaveRoom();
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
    await database.ref(`players/${currentPlayer.name}`).update({ points: currentPlayer.points, upgrades: playerUpgrades });
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
    
    drawCarPreview();
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

function drawCarPreview() {
    const canvas = document.getElementById('carCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width = 400; canvas.height = 300;
    
    ctx.fillStyle = '#2c5a2c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#654321'; ctx.fillRect(80, 0, 240, canvas.height);
    ctx.fillStyle = '#FFD700';
    for (let i = 0; i < 15; i++) ctx.fillRect(190, i * 25, 20, 12);
    
    const upgrades = currentPlayer?.upgrades || {};
    const color = `hsl(${20 + (upgrades.speed || 0) * 4}, 70%, 55%)`;
    
    ctx.save(); ctx.translate(200, 180);
    ctx.fillStyle = color; ctx.fillRect(-22, -18, 44, 36);
    ctx.fillStyle = '#8B4513'; ctx.fillRect(-17, -28, 34, 12);
    ctx.fillStyle = '#333';
    ctx.fillRect(-28, -14, 10, 28); ctx.fillRect(18, -14, 10, 28);
    ctx.fillRect(-28, 10, 10, 28); ctx.fillRect(18, 10, 10, 28);
    ctx.restore();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    const totalLevel = (upgrades.speed || 0) + (upgrades.control || 0) + (upgrades.durability || 0);
    ctx.fillText(`NÍVEL ${totalLevel}`, 160, 270);
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