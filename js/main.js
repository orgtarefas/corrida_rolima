// ==================== PONTO DE ENTRADA PRINCIPAL ====================

let raceActive = false;
let raceStarted = false;
let gameOver = false;
let keysPressed = {};
let animationId = null;

document.addEventListener('DOMContentLoaded', () => {
    setupGlobalEventListeners();
});

function setupGlobalEventListeners() {
    // Login
    document.getElementById('loginBtn')?.addEventListener('click', login);
    document.getElementById('playerName')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') login();
    });
    
    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', logout);
    
    // Corrida
    document.getElementById('exitRaceBtn')?.addEventListener('click', () => {
        if (typeof exitRace === 'function') exitRace();
    });
    document.getElementById('backToGarageBtn')?.addEventListener('click', () => {
        if (typeof backToGarage === 'function') backToGarage();
    });
    
    // Sala
    document.getElementById('createRoomBtn')?.addEventListener('click', showConfigModal);
    document.getElementById('joinRoomBtn')?.addEventListener('click', showJoinModal);
    document.getElementById('confirmJoinBtn')?.addEventListener('click', () => {
        if (typeof joinRoom === 'function') joinRoom();
    });
    document.getElementById('cancelJoinBtn')?.addEventListener('click', hideJoinModal);
    
    // Upgrades
    document.querySelectorAll('.upgrade-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const upgrade = e.target.dataset.upgrade;
            if (upgrade) buyUpgrade(upgrade);
        });
    });
    
    // Controles do jogo
    window.addEventListener('keydown', (e) => {
        const key = e.key;
        
        if (raceActive && !gameOver) {
            if (key === 'ArrowDown' || key === 's' || key === 'S') {
                e.preventDefault();
                playerCar.isBraking = true;
            }
            if (key === 'ArrowLeft' || key === 'ArrowRight' || 
                key === 'a' || key === 'A' || key === 'd' || key === 'D') {
                e.preventDefault();
                keysPressed[key.toLowerCase()] = true;
            }
        }
        
        if (raceActive && key === 'Escape' && typeof exitRace === 'function') exitRace();
    });
    
    window.addEventListener('keyup', (e) => {
        const key = e.key;
        if (key === 'ArrowDown' || key === 's' || key === 'S') {
            playerCar.isBraking = false;
        }
        const keyLower = key.toLowerCase();
        if (keysPressed[keyLower]) delete keysPressed[keyLower];
    });
}

function updateGamePhysics(delta) {
    if (!raceActive || gameOver) return;
    
    // Movimento vertical
    const moveY = calcularMovimentoVertical(playerCar.velocidade, playerCar.isBraking, delta);
    playerCar.y += moveY;
    
    // Velocidade
    if (playerCar.isBraking) {
        playerCar.velocidade = Math.max(VELOCIDADES.movimentoVertical.velocidadeMinima, 
            playerCar.velocidade - VELOCIDADES.movimentoVertical.forcaFreio * delta);
    } else {
        playerCar.velocidade += VELOCIDADES.carrinho.aceleracaoGravidade * delta;
    }
    
    playerCar.y = Math.max(TOP_Y, Math.min(BOTTOM_Y, playerCar.y));
    
    let velMax = calcularVelocidadeMaximaAtual(playerCar.distancia, VELOCIDADES.carrinho.velocidadeMaximaBase);
    playerCar.velocidade = Math.min(velMax, Math.max(VELOCIDADES.movimentoVertical.velocidadeMinima, playerCar.velocidade));
    playerCar.distancia += calcularPontuacao(playerCar.velocidade, delta);
    
    // Movimento horizontal
    let moveX = 0;
    if (keysPressed['arrowleft'] || keysPressed['a']) moveX = -1;
    if (keysPressed['arrowright'] || keysPressed['d']) moveX = 1;
    
    if (moveX !== 0) {
        const moveSpeed = calcularVelocidadeLateral(playerCar.velocidade, velMax);
        playerCar.x += moveX * moveSpeed;
        playerCar.x = Math.max(ROAD_LEFT, Math.min(ROAD_RIGHT - playerCar.width, playerCar.x));
    }
    
    // Invincibilidade
    if (invincible) {
        invincibleTimer -= delta;
        if (invincibleTimer <= 0) invincible = false;
    }
}

function startRacePhysics() {
    applyUpgradesToCar();
    raceActive = true;
    gameOver = false;
    
    let lastTime = 0;
    function physicsLoop(time) {
        if (!raceActive) return;
        const delta = Math.min(0.033, (time - lastTime) / 1000);
        lastTime = time;
        updateGamePhysics(delta);
        requestAnimationFrame(physicsLoop);
    }
    requestAnimationFrame(physicsLoop);
}

// Exportar para uso global
window.raceActive = raceActive;
window.gameOver = gameOver;
window.keysPressed = keysPressed;
window.startRacePhysics = startRacePhysics;
