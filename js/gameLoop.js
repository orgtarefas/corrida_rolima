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
        if (!gameOver) updateGame(delta);
        drawGame();
        animationId = requestAnimationFrame(gameUpdate);
    }
    
    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(gameUpdate);
}

function updateGame(delta) {
    if (delta <= 0) delta = 0.016;
    
    const moveY = calcularMovimentoVertical(playerCar.velocidade, playerCar.isBraking, delta);
    playerCar.y += moveY;
    
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
    
    let moveX = 0;
    if (keysPressed['arrowleft'] || keysPressed['a']) moveX = -1;
    if (keysPressed['arrowright'] || keysPressed['d']) moveX = 1;
    
    if (moveX !== 0) {
        const moveSpeed = calcularVelocidadeLateral(playerCar.velocidade, velMax);
        playerCar.x += moveX * moveSpeed;
        playerCar.x = Math.max(ROAD_LEFT, Math.min(ROAD_RIGHT - playerCar.width, playerCar.x));
    }
    
    updateObstacles(delta);
    checkCollisions(delta);
    
    if (invincible) {
        invincibleTimer -= delta;
        if (invincibleTimer <= 0) invincible = false;
    }
}