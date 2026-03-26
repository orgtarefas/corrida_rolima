let obstacles = [];
let obstacleInterval = null;

const OBSTACLE_TYPES = [
    { name: 'Pedra', damage: 15, color: '#808080', width: 28, height: 28, icon: '🪨' },
    { name: 'Buraco', damage: 25, color: '#4a2c1a', width: 38, height: 22, icon: '🕳️' },
    { name: 'Tronco', damage: 12, color: '#8B4513', width: 45, height: 22, icon: '🪵' },
    { name: 'Galho', damage: 8, color: '#654321', width: 40, height: 18, icon: '🌿' }
];

function startObstacleSpawner() {
    if (obstacleInterval) clearInterval(obstacleInterval);
    obstacleInterval = setInterval(() => {
        if (raceActive && !gameOver) spawnObstacle();
    }, calcularIntervaloSpawn(playerCar.velocidade) * 1000);
}

function spawnObstacle() {
    const type = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
    let damage = type.damage;
    if (playerCar.velocidade > 200) damage = Math.floor(damage * 1.3);
    
    obstacles.push({
        x: ROAD_LEFT + Math.random() * (ROAD_RIGHT - ROAD_LEFT - type.width),
        y: BOTTOM_Y + 50,
        width: type.width, height: type.height,
        type: type.name, damage: damage,
        color: type.color, icon: type.icon
    });
}

function updateObstacles(delta) {
    const obsSpeed = calcularVelocidadeObstaculo(playerCar.velocidade);
    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].y -= obsSpeed;
    }
    obstacles = obstacles.filter(obs => obs.y > -50);
}

function checkCollisions(delta) {
    if (invincible) return;
    
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        if (playerCar.x < obs.x + obs.width && playerCar.x + playerCar.width > obs.x &&
            playerCar.y < obs.y + obs.height && playerCar.y + playerCar.height > obs.y) {
            
            playerCar.velocidade = Math.max(20, playerCar.velocidade - VELOCIDADES.carrinho.perdaVelocidadeAoBater);
            playerCar.durability -= obs.damage;
            invincible = true;
            invincibleTimer = 0.8;
            obstacles.splice(i, 1);
            
            if (playerCar.durability <= 0) {
                gameOver = true;
                raceActive = false;
                if (obstacleInterval) clearInterval(obstacleInterval);
                showRaceResult();
            }
            break;
        }
    }
}