// ==================== JOGO 3D COM THREE.JS ====================

let scene, camera, renderer;
let carMesh;
let obstacles3d = [];
let gameActive3D = false;
let raceDistance = 0;
let raceStartedFlag = false;
let countdownActive = false;
let roadSegments = [];

// Suspensão
let suspensionHeight = 0;
let suspensionTarget = 0;
let wheelRotation = 0;

// Função principal de inicialização
function init3D(raceLength = 1000) {
    raceDistance = raceLength;
    const container = document.getElementById('canvas-container');
    if (!container) {
        console.error('Container não encontrado');
        return;
    }
    
    // Limpar container
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
    // Criar cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2a3a);
    scene.fog = new THREE.FogExp2(0x1a2a3a, 0.008);
    
    // Criar câmera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 3, 8);
    camera.lookAt(0, 0, -5);
    
    // Criar renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Iluminação
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1);
    dirLight.position.set(10, 20, 5);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    const fillLight = new THREE.PointLight(0x4466cc, 0.5);
    fillLight.position.set(0, 5, -5);
    scene.add(fillLight);
    
    // Chão/grama
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a6b3a, roughness: 0.8 });
    const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(50, 200), groundMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.5;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);
    
    // Criar pista
    createSimpleRoad();
    
    // Criar obstáculos
    createSimpleObstacles();
    
    // Criar árvores
    createSimpleTrees();
    
    // Criar semáforo
    createSimpleStartLight();
    
    // Iniciar contagem
    startSimpleCountdown();
    
    // Animação
    animate3D();
    
    window.addEventListener('resize', onWindowResize3D);
}

function createSimpleRoad() {
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffdd88 });
    
    for (let i = 0; i < 60; i++) {
        const z = -i * 2;
        
        // Segmento da pista
        const road = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.1, 1.8), roadMat);
        road.position.set(0, -0.2, z);
        road.castShadow = true;
        road.receiveShadow = true;
        scene.add(road);
        roadSegments.push(road);
        
        // Linha central
        if (i % 2 === 0) {
            const line = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.8), lineMat);
            line.position.set(0, -0.12, z);
            scene.add(line);
        }
        
        // Bordas
        const edgeMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
        const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 1.8), edgeMat);
        leftEdge.position.set(-2.4, -0.15, z);
        scene.add(leftEdge);
        
        const rightEdge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 1.8), edgeMat);
        rightEdge.position.set(2.4, -0.15, z);
        scene.add(rightEdge);
    }
}

function createSimpleObstacles() {
    const colors = [0x888888, 0x8B4513, 0x654321];
    const damages = [15, 12, 8];
    
    for (let i = 0; i < 20; i++) {
        const type = Math.floor(Math.random() * 3);
        let geometry;
        
        if (type === 0) geometry = new THREE.DodecahedronGeometry(0.35);
        else if (type === 1) geometry = new THREE.CylinderGeometry(0.4, 0.45, 0.7, 8);
        else geometry = new THREE.BoxGeometry(0.7, 0.2, 0.4);
        
        const mat = new THREE.MeshStandardMaterial({ color: colors[type], roughness: 0.7 });
        const mesh = new THREE.Mesh(geometry, mat);
        mesh.castShadow = true;
        mesh.userData = { active: false, damage: damages[type] };
        mesh.visible = false;
        scene.add(mesh);
        obstacles3d.push(mesh);
    }
}

function createSimpleTrees() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
    
    for (let z = -50; z < 20; z += 5) {
        // Esquerda
        const treeLeft = new THREE.Group();
        const trunkL = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1, 6), trunkMat);
        trunkL.position.y = 0.5;
        treeLeft.add(trunkL);
        const foliageL = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.8, 8), foliageMat);
        foliageL.position.y = 1.1;
        treeLeft.add(foliageL);
        treeLeft.position.set(-3.5, -0.3, z);
        scene.add(treeLeft);
        
        // Direita
        const treeRight = new THREE.Group();
        const trunkR = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1, 6), trunkMat);
        trunkR.position.y = 0.5;
        treeRight.add(trunkR);
        const foliageR = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.8, 8), foliageMat);
        foliageR.position.y = 1.1;
        treeRight.add(foliageR);
        treeRight.position.set(3.5, -0.3, z);
        scene.add(treeRight);
    }
}

function createSimpleStartLight() {
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
    
    lightGroup.position.set(3, 0, -5);
    scene.add(lightGroup);
    
    window.startLight = { red: redLight, yellow: yellowLight, green: greenLight };
}

function startSimpleCountdown() {
    countdownActive = true;
    let count = 3;
    
    const countdownDiv = document.createElement('div');
    countdownDiv.id = 'countdownDisplay';
    countdownDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 80px;
        font-weight: bold;
        color: white;
        text-shadow: 0 0 20px black;
        z-index: 1000;
        background: rgba(0,0,0,0.7);
        padding: 30px 50px;
        border-radius: 30px;
        font-family: monospace;
    `;
    document.body.appendChild(countdownDiv);
    
    const interval = setInterval(() => {
        if (!countdownActive) {
            clearInterval(interval);
            countdownDiv.remove();
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
            setTimeout(() => countdownDiv.remove(), 500);
            countdownActive = false;
            raceStartedFlag = true;
            console.log('🏁 CORRIDA INICIADA!');
        }
        count--;
    }, 1000);
}

function createCar3D(color = 0xff6b35) {
    const carGroup = new THREE.Group();
    
    // Corpo
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 1.2), new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.6 }));
    body.position.y = 0.2;
    body.castShadow = true;
    carGroup.add(body);
    
    // Teto
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.85), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
    roof.position.y = 0.45;
    roof.castShadow = true;
    carGroup.add(roof);
    
    // Rodas
    const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.7 });
    const wheelPos = [[-0.55, 0.12, -0.55], [0.55, 0.12, -0.55], [-0.55, 0.12, 0.55], [0.55, 0.12, 0.55]];
    wheelPos.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.castShadow = true;
        carGroup.add(wheel);
    });
    
    return carGroup;
}

function startGame3D(raceLength = 1000) {
    if (gameActive3D) return;
    
    init3D(raceLength);
    
    carMesh = createCar3D(0xff6b35);
    carMesh.position.set(0, 0.15, 0);
    scene.add(carMesh);
    
    gameActive3D = true;
    
    document.getElementById('gameHud').style.display = 'block';
    document.getElementById('raceControls').style.display = 'flex';
    const totalSpan = document.getElementById('totalDistanceDisplay');
    if (totalSpan) totalSpan.textContent = raceLength;
}

function stopGame3D() {
    gameActive3D = false;
    raceStartedFlag = false;
    countdownActive = false;
    
    if (carMesh && scene) scene.remove(carMesh);
    if (renderer && renderer.domElement) {
        const container = document.getElementById('canvas-container');
        if (container && renderer.domElement.parentNode === container) {
            container.removeChild(renderer.domElement);
        }
    }
    
    document.getElementById('gameHud').style.display = 'none';
    document.getElementById('raceControls').style.display = 'none';
}

function updateGame3DVisuals() {
    if (!gameActive3D || !carMesh) return;
    
    // Posição do carro
    const trackZ = -playerCar.distancia * 0.045;
    const targetX = (playerCar.x - 400) / 60;
    
    // Suspensão (simples)
    const roadHeight = Math.sin(trackZ * 0.1) * 0.15;
    suspensionTarget = roadHeight + 0.15;
    suspensionHeight += (suspensionTarget - suspensionHeight) * 0.2;
    carMesh.position.y = suspensionHeight;
    carMesh.position.x += (targetX - carMesh.position.x) * 0.15;
    carMesh.position.z = trackZ;
    
    // Rotação
    carMesh.rotation.z = -carMesh.position.x * 0.2;
    
    // Rodas girando
    if (raceStartedFlag) {
        wheelRotation += playerCar.velocidade * 0.025;
        carMesh.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'CylinderGeometry') {
                child.rotation.x = wheelRotation;
            }
        });
    }
    
    // Câmera
    const camX = carMesh.position.x * 0.4;
    const camY = 2.5 + Math.abs(carMesh.position.x) * 0.2;
    const camZ = 7 + playerCar.velocidade * 0.003;
    camera.position.x += (camX - camera.position.x) * 0.1;
    camera.position.y += (camY - camera.position.y) * 0.1;
    camera.position.z += (camZ - camera.position.z) * 0.1;
    camera.lookAt(carMesh.position.x, suspensionHeight + 0.2, carMesh.position.z - 2);
    
    // Obstáculos
    if (raceStartedFlag) {
        updateSimpleObstacles();
        updateSimpleOtherPlayers();
        updateSimpleUI();
        
        if (playerCar.distancia >= raceDistance) {
            finishSimpleRace();
        }
    }
}

function updateSimpleObstacles() {
    if (Math.random() < 0.02) {
        const inactive = obstacles3d.find(obs => !obs.userData.active);
        if (inactive) {
            inactive.position.x = (Math.random() - 0.5) * 3;
            inactive.position.z = -20;
            inactive.position.y = -0.1;
            inactive.userData.active = true;
            inactive.visible = true;
        }
    }
    
    obstacles3d.forEach(obs => {
        if (obs.userData.active) {
            obs.position.z += playerCar.velocidade * 0.03;
            
            // Colisão
            if (!invincible && Math.abs(obs.position.x - carMesh.position.x) < 0.7 && 
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
            
            if (obs.position.z > 8) {
                obs.userData.active = false;
                obs.visible = false;
            }
        }
    });
}

function updateSimpleOtherPlayers() {
    if (!window.otherCars) window.otherCars = {};
    
    for (let [name, other] of Object.entries(window.otherPlayers || {})) {
        if (!window.otherCars[name]) {
            const otherColor = Math.abs(hashCode(name) % 360);
            window.otherCars[name] = createCar3D(`hsl(${otherColor}, 70%, 55%)`);
            scene.add(window.otherCars[name]);
        }
        
        if (window.otherCars[name]) {
            const diff = (other.distancia - playerCar.distancia) * 0.045;
            const xPos = (other.x - 400) / 60;
            window.otherCars[name].position.set(xPos, 0.15, Math.min(6, Math.max(-8, diff)));
        }
    }
}

function updateSimpleUI() {
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

function finishSimpleRace() {
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
        database.ref(`players/${currentPlayer.name}`).update({ points: currentPlayer.points, wins: currentPlayer.wins });
        updateGarageUI();
    }
    
    alert(`🏁 CORRIDA FINALIZADA!\n\nPosição: ${position}º\nDistância: ${Math.floor(playerCar.distancia)}m\nPontos: +${points}⭐`);
    exitRace();
}

function animate3D() {
    requestAnimationFrame(animate3D);
    
    if (gameActive3D && renderer && scene && camera) {
        if (raceStartedFlag) updateGame3DVisuals();
        renderer.render(scene, camera);
    }
}

function onWindowResize3D() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

// Exportar para window
window.startGame3D = startGame3D;
window.stopGame3D = stopGame3D;
