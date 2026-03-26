// ==================== LOOP PRINCIPAL DO JOGO ====================

let raceActive = false;
let raceStarted = false;
let gameOver = false;
let raceResultShown = false;
let animationId = null;
let keysPressed = {};

function startGameLoop() {
    let lastTimestamp = 0;
    
    function gameUpdate(timestamp) {
        if (!raceActive) return;
        
        const delta = Math.min(0.033, (timestamp - lastTimestamp) / 1000);
        lastTimestamp = timestamp;
        
        if (!gameOver) {
            updateGame(delta);
        }
        drawGame();
        
        animationId = requestAnimationFrame(gameUpdate);
    }
    
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameUpdate);
}

function updateGame(delta) {
    if (delta <= 0) delta = 0.016;
    
    // ========== MOVIMENTO VERTICAL ==========
    const moveY = calcularMovimentoVertical(playerCar.velocidade, playerCar.isBraking, delta);
    playerCar.y += moveY;
    
    // ========== VELOCIDADE ==========
    if (playerCar.isBraking) {
        // Freando - perde velocidade
        playerCar.velocidade = Math.max(
            VELOCIDADES.movimentoVertical.velocidadeMinima, 
            playerCar.velocidade - VELOCIDADES.movimentoVertical.forcaFreio * delta
        );
    } else {
        // Descendo - ganha velocidade
        playerCar.velocidade += VELOCIDADES.carrinho.aceleracaoGravidade * delta;
    }
    
    // Limites verticais da pista
    playerCar.y = Math.max(TOP_Y, Math.min(BOTTOM_Y, playerCar.y));
    
    // Limite de velocidade máxima
    let velMax = calcularVelocidadeMaximaAtual(playerCar.distancia, VELOCIDADES.carrinho.velocidadeMaximaBase);
    playerCar.velocidade = Math.min(velMax, Math.max(VELOCIDADES.movimentoVertical.velocidadeMinima, playerCar.velocidade));
    
    // ========== PONTUAÇÃO (distância percorrida) ==========
    playerCar.distancia += calcularPontuacao(playerCar.velocidade, delta);
    
    // ========== MOVIMENTO HORIZONTAL ==========
    let moveX = 0;
    if (keysPressed['arrowleft'] || keysPressed['a']) moveX = -1;
    if (keysPressed['arrowright'] || keysPressed['d']) moveX = 1;
    
    if (moveX !== 0) {
        const moveSpeed = calcularVelocidadeLateral(playerCar.velocidade, velMax);
        playerCar.x += moveX * moveSpeed;
        playerCar.x = Math.max(ROAD_LEFT, Math.min(ROAD_RIGHT - playerCar.width, playerCar.x));
    }
    
    // ========== OBSTÁCULOS ==========
    updateObstacles(delta);
    
    // ========== COLISÕES ==========
    checkCollisions(delta);
    
    // ========== INVINCIBILIDADE ==========
    if (invincible) {
        invincibleTimer -= delta;
        if (invincibleTimer <= 0) {
            invincible = false;
        }
    }
}
