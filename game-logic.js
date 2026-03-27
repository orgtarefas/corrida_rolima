// ==================== LÓGICA DO JOGO ====================

let raceActive = false;
let gameOver = false;
let raceStarted = false;
let raceDistanceTotal = 1000;
let keysPressed = {};

// Dados do carro do jogador
let playerCar = {
    x: 0,
    y: 0,
    velocidade: 0,
    distancia: 0,
    durability: 100,
    handling: 7,
    isBraking: false,
    width: 0.8
};

let invincible = false;
let invincibleTimer = 0;
let lastTime = 0;

// Aplica upgrades ao carro
function applyUpgrades() {
    let up = window.currentPlayer?.upgrades || {};
    playerCar.velocidade = 0;
    playerCar.durability = 100 + (up.durability || 0) * 12;
    playerCar.handling = 6 + (up.control || 0) * 0.7;
    playerCar.distancia = 0;
    playerCar.x = 0;
    playerCar.isBraking = false;
    invincible = false;
    gameOver = false;
}

// Física do jogo
function updatePhysics(delta) {
    if (!raceActive || gameOver) return;
    
    // Freio / aceleração
    if (playerCar.isBraking) {
        playerCar.velocidade = Math.max(20, playerCar.velocidade - 45 * delta);
    } else {
        let maxSpeed = 320 + (window.currentPlayer?.upgrades?.speed || 0) * 12;
        playerCar.velocidade += 1.2 * delta * 60;
        if (playerCar.velocidade > maxSpeed) playerCar.velocidade = maxSpeed;
    }
    
    // Movimento lateral
    let move = 0;
    if (keysPressed['a'] || keysPressed['arrowleft']) move = -1;
    if (keysPressed['d'] || keysPressed['arrowright']) move = 1;
    let lateralSpeed = (5 + playerCar.velocidade * 0.015) * (playerCar.handling / 7);
    lateralSpeed = Math.min(9, lateralSpeed);
    playerCar.x += move * lateralSpeed * delta * 60;
    playerCar.x = Math.max(-2.2, Math.min(2.2, playerCar.x));
    
    // Distância percorrida
    playerCar.distancia += playerCar.velocidade * delta * 0.12;
    
    // Verificar fim da corrida
    if (playerCar.distancia >= raceDistanceTotal && !gameOver) {
        finishRace();
    }
}

// Inicia o loop de física
function startPhysicsLoop() {
    function loop(now) {
        if (!raceActive) return;
        let dt = Math.min(0.033, (now - (lastTime || now)) / 1000);
        lastTime = now;
        updatePhysics(dt);
        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
}

// Finaliza a corrida
async function finishRace() {
    raceActive = false;
    raceStarted = false;
    
    // Parar sincronização multiplayer
    if (window.positionInterval) {
        clearInterval(window.positionInterval);
        window.positionInterval = null;
    }
    
    // Calcular pontos
    let points = Math.floor(playerCar.distancia / 15) + 30;
    if (playerCar.durability <= 0) points = Math.floor(points * 0.5);
    if (points < 10) points = 10;
    
    // Atualizar jogador
    if (window.currentPlayer) {
        window.currentPlayer.points = (window.currentPlayer.points || 0) + points;
        if (playerCar.distancia >= raceDistanceTotal && playerCar.durability > 0) {
            window.currentPlayer.wins = (window.currentPlayer.wins || 0) + 1;
        }
        await database.ref(`players/${window.currentPlayer.name}`).update({
            points: window.currentPlayer.points,
            wins: window.currentPlayer.wins
        });
        if (typeof updateGarageUI === 'function') updateGarageUI();
    }
    
    // Mostrar resultado
    let title = playerCar.durability <= 0 ? "💔 CARRINHO QUEBROU!" :
                (playerCar.distancia >= raceDistanceTotal ? "🏆 VITÓRIA!" : "🏁 CORRIDA FINALIZADA");
    document.getElementById('resultTitle').innerHTML = title;
    document.getElementById('resultReward').innerHTML = `Distância: ${Math.floor(playerCar.distancia)}m | +${points}⭐`;
    
    // Limpar sala multiplayer
    if (window.currentRoomId) {
        await database.ref(`rooms/${window.currentRoomId}`).remove();
        await database.ref(`races/${window.currentRoomId}`).remove();
        if (window.roomListener) database.ref(`rooms/${window.currentRoomId}`).off();
        window.currentRoomId = null;
    }
    
    if (typeof stopGame3D === 'function') stopGame3D();
    showScreen('raceResult');
}

// Sair da corrida
function exitRace() {
    raceActive = false;
    raceStarted = false;
    
    if (window.positionInterval) {
        clearInterval(window.positionInterval);
        window.positionInterval = null;
    }
    
    if (window.currentRoomId) {
        database.ref(`rooms/${window.currentRoomId}`).remove();
        database.ref(`races/${window.currentRoomId}`).remove();
        if (window.roomListener) database.ref(`rooms/${window.currentRoomId}`).off();
        window.currentRoomId = null;
    }
    
    if (typeof stopGame3D === 'function') stopGame3D();
    showScreen('garageScreen');
    if (typeof updateGarageUI === 'function') updateGarageUI();
}

// Mostrar tela
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId)?.classList.add('active');
}

// Gerar código de sala
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 6).toUpperCase();
}