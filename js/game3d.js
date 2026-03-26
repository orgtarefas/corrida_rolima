// ==================== JOGO 3D SIMPLIFICADO ====================

let scene, camera, renderer;
let carMesh;
let obstacles3d = [];
let gameActive3D = false;
let raceDistance = 0;
let raceStartedFlag = false;
let countdownActive = false;
let animationId = null;
let roadObjects = [];

// Verificar se Three.js está carregado
if (typeof THREE === 'undefined') {
    console.error('Three.js não carregado!');
    alert('Erro ao carregar gráficos 3D. Recarregue a página.');
}

function init3D(raceLength = 1000) {
    raceDistance = raceLength;
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error('Container não encontrado');
        return false;
    }
    
    try {
        // Limpar container
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        
        // Criar cena
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1a2a3a);
        scene.fog = new THREE.FogExp2(0x1a2a3a, 0.005);
        
        // Câmera
        camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.set(0, 3, 7);
        camera.lookAt(0, 0, -5);
        
        // Renderer
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        container.appendChild(renderer.domElement);
        
        // Iluminação
        setupLighting();
        
        // Criar elementos
        createRoad();
        createTrees();
        createObstacles();
        createStartLight();
        
        // Criar carro
        carMesh = createCar();
        scene.add(carMesh);
        
        // Iniciar contagem
        startCountdown();
        
        // Iniciar animação
        startAnimation();
        
        gameActive3D = true;
        
        // Mostrar HUD
        document.getElementById('gameHud').style.display = 'block';
        document.getElementById('raceControls').style.display = 'flex';
        const totalSpan = document.getElementById('totalDistanceDisplay');
        if (totalSpan) totalSpan.textContent = raceLength;
        
        return true;
    } catch (error) {
        console.error('Erro ao iniciar 3D:', error);
        return false;
    }
}

function setupLighting() {
    // Luz ambiente
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);
    
    // Luz direcional
    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1);
    dirLight.position.set(10, 20, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    // Luz de preenchimento
    const fillLight = new THREE.PointLight(0x4466cc, 0.4);
    fillLight.position.set(0, 5, -5);
    scene.add(fillLight);
}

function createRoad() {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5 });
    const roadLength = 150;
    const roadWidth = 4.5;
    
    // Pista
    const road = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, 0.1, roadLength), roadMat);
    road.position.set(0, -0.25, -roadLength / 2);
    road.receiveShadow = true;
    scene.add(road);
    
    // Linha central
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffdd88 });
    const centerLine = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, roadLength), lineMat);
    centerLine.position.set(0, -0.18, -roadLength / 2);
    scene.add(centerLine);
    
    // Bordas
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, roadLength), edgeMat);
    leftEdge.position.set(-roadWidth / 2 - 0.15, -0.2, -roadLength / 2);
    scene.add(leftEdge);
    
    const rightEdge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, roadLength), edgeMat);
    rightEdge.position.set(roadWidth / 2 + 0.15, -0.2, -roadLength / 2);
    scene.add(rightEdge);
}

function createTrees() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
    
    for (let z = -70; z < 20; z += 5) {
        // Esquerda
        const treeLeft = createTree(trunkMat, foliageMat);
        treeLeft.position.set(-3.8, -0.25, z);
        scene.add(treeLeft);
        
        // Direita
        const treeRight = createTree(trunkMat, foliageMat);
        treeRight.position.set(3.8, -0.25, z);
        scene.add(treeRight);
    }
}

function createTree(trunkMat, foliageMat) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1, 6), trunkMat);
    trunk.position.y = 0.5;
    trunk.castShadow = true;
    tree.add(trunk);
    
    const foliage = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.9, 8), foliageMat);
    foliage.position.y = 1.1;
    foliage.castShadow = true;
    tree.add(foliage);
    
    return tree;
}

function createObstacles() {
    const types = [
        { geo: new THREE.DodecahedronGeometry(0.38), color: 0x888888, y: -0.18, damage: 15 },
        { geo: new THREE.CylinderGeometry(0.42, 0.48, 0.7, 8), color: 0x8B4513, y: -0.15, damage: 12 },
        { geo: new THREE.BoxGeometry(0.8, 0.18, 0.4), color: 0x654321, y: -0.2, damage: 8 }
    ];
    
    for (let i = 0; i < 20; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const mat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.7 });
        const mesh = new THREE.Mesh(type.geo, mat);
        mesh.position.y = type.y;
        mesh.castShadow = true;
        mesh.userData = { active: false, damage: type.damage };
        mesh.visible = false;
        scene.add(mesh);
        obstacles3d.push(mesh);
    }
}

function createStartLight() {
    const lightGroup = new THREE.Group();
    
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 6), new THREE.MeshStandardMaterial({ color: 0x666666 }));
    pole.position.y = 1.5;
    lightGroup.add(pole);
    
    const redMat = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x331111 });
    const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), redMat);
    redLight.position.set(0, 2.5, 0);
    lightGroup.add(redLight);
    
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0x331100 });
    const yellowLight = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), yellowMat);
    yellowLight.position.set(0, 2.0, 0);
    yellowLight.visible = false;
    lightGroup.add(yellowLight);
    
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x33ff33, emissive: 0x113311 });
    const greenLight = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), greenMat);
    greenLight.position.set(0, 1.5, 0);
    greenLight.visible = false;
    lightGroup.add(greenLight);
    
    lightGroup.position.set(3.2, 0, -6);
    scene.add(lightGroup);
    
    window.startLight = { red: redLight, yellow: yellowLight, green: greenLight };
}

function createCar() {
    const carGroup = new THREE.Group();
    
    // Corpo
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.38, 1.3), 
        new THREE.MeshStandardMaterial({ color: 0xff6b35, roughness: 0.3, metalness: 0.6 }));
    body.position.y = 0.2;
    body.castShadow = true;
    carGroup.add(body);
    
    // Teto
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 0.9), 
        new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
    roof.position.y = 0.48;
    roof.castShadow = true;
    carGroup.add(roof);
    
    // Rodas
    const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 });
    const wheelPos = [[-0.6, 0.12, -0.6], [0.6, 0.12, -0.6], [-0.6, 0.12, 0.6], [0.6, 0.12, 0.6]];
    wheelPos.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.castShadow = true;
        carGroup.add(wheel);
    });
    
    return carGroup;
}

function startCountdown() {
    countdownActive = true;
    let count = 3;
    
    const countdownDiv = document.createElement('div');
    countdownDiv.id = 'countdownDisplay';
    countdownDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 70px;
        font-weight: bold;
        color: white;
        text-shadow: 0 0 20px black;
        z-index: 1000;
        background: rgba(0,0,0,0.8);
        padding: 25px 50px;
        border-radius: 40px;
        font-family: monospace;
        pointer-events: none;
    `;
    document.body.appendChild(countdownDiv);
    
    const interval = setInterval(() => {
        if (!countdownActive) {
            clearInterval(interval);
            if (countdownDiv && countdownDiv.parentNode) countdownDiv.remove();
            return;
        }
        
        if (count === 3) {
            countdownDiv.textContent = '3';
            if (window.startLight) window.startLight.red.visible = true;
        } else if (count === 2) {
            countdownDiv.textContent = '2';
            if (window.startLight) {
                window.startLight.red.visible = false;
                window.startLight.yellow.visible = true;
            }
        } else if (count === 1) {
            countdownDiv.textContent = '1';
            if (window.startLight) {
                window.startLight.yellow.visible = false;
                window.startLight.green.visible = true;
            }
        } else if (count === 0) {
            countdownDiv.textContent = 'GO!';
            countdownDiv.style.color = '#4CAF50';
            clearInterval(interval);
            setTimeout(() => {
                if (countdownDiv && countdownDiv.parentNode) countdownDiv.remove();
            }, 500);
            countdownActive = false;
            raceStartedFlag = true;
            console.log('🏁 CORRIDA INICIADA!');
        }
        count--;
    }, 1000);
}

function startAnimation() {
    if (animationId) cancelAnimationFrame(animationId);
    
    function animate() {
        if (!gameActive3D || !renderer || !scene || !camera) {
            return;
        }
        
        if (raceStartedFlag) {
            updateGame3D();
        }
        
        renderer.render(scene, camera);
        animationId = requestAnimationFrame(animate);
    }
    
    animate();
}

function updateGame3D() {
    if (!carMesh) return;
    
    // Posição do carro (descendo a pista)
    const targetZ = -playerCar.distancia * 0.045;
    const targetX = (playerCar.x - 400) / 55;
    
    // Atualizar posição
    carMesh.position.x += (targetX - carMesh.position.x) * 0.15;
    carMesh.position.z = targetZ;
    carMesh.position.y = 0.12;
    
    // Rotação
    carMesh.rotation.z = -carMesh.position.x * 0.2;
    
    // Câmera
    const camX = carMesh.position.x * 0.3;
    const camY = 2.8;
    const camZ = 6 + (playerCar.velocidade * 0.002);
    camera.position.x += (camX - camera.position.x) * 0.08;
    camera.position.y = camY;
    camera.position.z += (camZ - camera.position.z) * 0.08;
    camera.lookAt(carMesh.position.x, 0.2, carMesh.position.z - 3);
    
    // Obstáculos
    updateObstacles3D();
    
    // UI
    updateUI3D();
    
    // Verificar fim da corrida
    if (playerCar.distancia >= raceDistance) {
        finishRace3D();
    }
}

function updateObstacles3D() {
    // Gerar obstáculos
    if (Math.random() < 0.02 && raceStartedFlag) {
        const inactive = obstacles3d.find(obs => !obs.userData.active);
        if (inactive) {
            inactive.position.x = (Math.random() - 0.5) * 3;
            inactive.position.z = -25;
            inactive.userData.active = true;
            inactive.visible = true;
        }
    }
    
    // Mover e verificar colisões
    obstacles3d.forEach(obs => {
        if (obs.userData.active) {
            obs.position.z += playerCar.velocidade * 0.032;
            
            // Colisão
            if (!invincible && carMesh && 
                Math.abs(obs.position.x - carMesh.position.x) < 0.7 && 
                Math.abs(obs.position.z - carMesh.position.z) < 1.2) {
                
                playerCar.durability -= obs.userData.damage;
                invincible = true;
                invincibleTimer = 0.8;
                obs.userData.active = false;
                obs.visible = false;
                
                if (playerCar.durability <= 0) {
                    gameOver = true;
                    raceActive = false;
                    if (typeof showRaceResult === 'function') showRaceResult();
                }
            }
            
            if (obs.position.z > 10) {
                obs.userData.active = false;
                obs.visible = false;
            }
        }
    });
}

function updateUI3D() {
    const distEl = document.getElementById('distanceDisplay');
    const speedEl = document.getElementById('speedDisplay');
    const duraEl = document.getElementById('durabilityDisplay');
    const posEl = document.getElementById('positionDisplay');
    const remEl = document.getElementById('remainingDisplay');
    
    if (distEl) distEl.textContent = Math.floor(playerCar.distancia);
    if (speedEl) speedEl.textContent = Math.floor(playerCar.velocidade);
    if (duraEl) duraEl.textContent = Math.max(0, Math.floor(playerCar.durability));
    if (remEl) remEl.textContent = Math.max(0, Math.floor(raceDistance - playerCar.distancia));
    
    let position = 1;
    for (let [name, other] of Object.entries(window.otherPlayers || {})) {
        if (other.distancia > playerCar.distancia) position++;
    }
    if (posEl) posEl.textContent = position;
}

function finishRace3D() {
    raceActive = false;
    raceStartedFlag = false;
    
    let position = 1;
    for (let [name, other] of Object.entries(window.otherPlayers || {})) {
        if (other.distancia > playerCar.distancia) position++;
    }
    
    let points = Math.floor(raceDistance / 20) + 50;
    if (position === 1) points += 100;
    else if (position === 2) points += 50;
    points = Math.min(300, points);
    
    if (currentPlayer) {
        currentPlayer.points = (currentPlayer.points || 0) + points;
        if (position === 1) currentPlayer.wins = (currentPlayer.wins || 0) + 1;
        if (typeof database !== 'undefined') {
            database.ref(`players/${currentPlayer.name}`).update({ 
                points: currentPlayer.points, 
                wins: currentPlayer.wins 
            });
        }
        updateGarageUI();
    }
    
    alert(`🏁 CORRIDA FINALIZADA!\n\nPosição: ${position}º\nDistância: ${Math.floor(playerCar.distancia)}m\nPontos: +${points}⭐`);
    if (typeof exitRace === 'function') exitRace();
}

function stopGame3D() {
    gameActive3D = false;
    raceStartedFlag = false;
    countdownActive = false;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
        animationId = null;
    }
    
    const container = document.getElementById('canvas-container');
    if (container && renderer && renderer.domElement) {
        container.innerHTML = '';
    }
    
    document.getElementById('gameHud').style.display = 'none';
    document.getElementById('raceControls').style.display = 'none';
}

function startGame3D(raceLength = 1000) {
    if (gameActive3D) stopGame3D();
    init3D(raceLength);
}

// Exportar
window.startGame3D = startGame3D;
window.stopGame3D = stopGame3D;
