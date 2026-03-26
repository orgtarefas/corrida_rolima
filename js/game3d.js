// ==================== JOGO 3D COM PISTA CONTÍNUA ====================

let scene, camera, renderer;
let carMesh;
let obstacles3d = [];
let gameActive3D = false;
let raceDistance = 0;
let raceStartedFlag = false;
let countdownActive = false;
let roadStrip = null;

// Suspensão
let suspensionHeight = 0;
let lastRoadHeight = 0;

// Sistema de setas para outros jogadores
let arrowIndicators = {};

function init3D(raceLength = 1000) {
    raceDistance = raceLength;
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    // Limpar container
    while (container.firstChild) container.removeChild(container.firstChild);
    
    // Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1a2a);
    scene.fog = new THREE.FogExp2(0x0a1a2a, 0.006);
    
    // Câmera
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2.5, 6);
    camera.lookAt(0, 0, -5);
    
    // Renderer
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
    
    const fillLight = new THREE.PointLight(0x4466cc, 0.4);
    fillLight.position.set(0, 5, -5);
    scene.add(fillLight);
    
    // Chão/Grama
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a6b3a, roughness: 0.9 });
    const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(60, 300), groundMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.4;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);
    
    // Pista contínua
    createContinuousRoad();
    
    // Árvores
    createContinuousTrees();
    
    // Obstáculos
    createObstaclesPool();
    
    // Semáforo
    createStartLight();
    
    // Iniciar contagem
    startCountdown();
    
    // Animação
    animate3D();
    
    window.addEventListener('resize', onWindowResize3D);
}

function createContinuousRoad() {
    // Pista principal (uma peça longa e contínua)
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.1 });
    const roadLength = 200;
    const roadWidth = 5;
    
    const road = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, 0.1, roadLength), roadMat);
    road.position.set(0, -0.25, -roadLength / 2);
    road.receiveShadow = true;
    road.castShadow = true;
    scene.add(road);
    
    // Linha central (contínua, não segmentada)
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffdd88, emissive: 0x442200 });
    const centerLine = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, roadLength), lineMat);
    centerLine.position.set(0, -0.18, -roadLength / 2);
    scene.add(centerLine);
    
    // Bordas
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, roadLength), edgeMat);
    leftEdge.position.set(-roadWidth / 2 - 0.15, -0.2, -roadLength / 2);
    scene.add(leftEdge);
    
    const rightEdge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.12, roadLength), edgeMat);
    rightEdge.position.set(roadWidth / 2 + 0.15, -0.2, -roadLength / 2);
    scene.add(rightEdge);
    
    // Faixas laterais decorativas
    const stripeMat = new THREE.MeshStandardMaterial({ color: 0xffaa66 });
    for (let z = -roadLength / 2; z < roadLength / 2; z += 8) {
        const leftStripe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 1.5), stripeMat);
        leftStripe.position.set(-roadWidth / 2 - 0.5, -0.15, z);
        scene.add(leftStripe);
        
        const rightStripe = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 1.5), stripeMat);
        rightStripe.position.set(roadWidth / 2 + 0.5, -0.15, z);
        scene.add(rightStripe);
    }
}

function createContinuousTrees() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
    
    for (let z = -90; z < 20; z += 4.5) {
        // Esquerda
        const treeLeft = createTree(trunkMat, foliageMat);
        treeLeft.position.set(-4.2, -0.25, z);
        scene.add(treeLeft);
        
        // Direita
        const treeRight = createTree(trunkMat, foliageMat);
        treeRight.position.set(4.2, -0.25, z);
        scene.add(treeRight);
        
        // Postes ocasionais
        if (Math.abs(z) % 12 < 1) {
            const postMat = new THREE.MeshStandardMaterial({ color: 0xccaa88 });
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 2.2, 4), postMat);
            post.position.set(-3.8, -0.2, z);
            post.castShadow = true;
            scene.add(post);
        }
    }
}

function createTree(trunkMat, foliageMat) {
    const tree = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.45, 1, 6), trunkMat);
    trunk.position.y = 0.5;
    trunk.castShadow = true;
    tree.add(trunk);
    
    const foliage1 = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.8, 8), foliageMat);
    foliage1.position.y = 1.1;
    foliage1.castShadow = true;
    tree.add(foliage1);
    
    const foliage2 = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.7, 8), foliageMat);
    foliage2.position.y = 1.6;
    foliage2.castShadow = true;
    tree.add(foliage2);
    
    return tree;
}

function createObstaclesPool() {
    const types = [
        { geo: new THREE.DodecahedronGeometry(0.38), color: 0x888888, y: -0.18, damage: 15 },
        { geo: new THREE.CylinderGeometry(0.42, 0.48, 0.75, 8), color: 0x8B4513, y: -0.15, damage: 12 },
        { geo: new THREE.BoxGeometry(0.85, 0.18, 0.4), color: 0x654321, y: -0.22, damage: 8 }
    ];
    
    for (let i = 0; i < 25; i++) {
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
    
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3.5, 6), new THREE.MeshStandardMaterial({ color: 0x666666 }));
    pole.position.y = 1.8;
    lightGroup.add(pole);
    
    const redMat = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x331111 });
    const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), redMat);
    redLight.position.set(0, 3, 0);
    lightGroup.add(redLight);
    
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0x331100 });
    const yellowLight = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), yellowMat);
    yellowLight.position.set(0, 2.4, 0);
    yellowLight.visible = false;
    lightGroup.add(yellowLight);
    
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x33ff33, emissive: 0x113311 });
    const greenLight = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 16), greenMat);
    greenLight.position.set(0, 1.8, 0);
    greenLight.visible = false;
    lightGroup.add(greenLight);
    
    lightGroup.position.set(3.5, 0, -8);
    scene.add(lightGroup);
    
    window.startLight = { red: redLight, yellow: yellowLight, green: greenLight };
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
        font-size: 80px;
        font-weight: bold;
        color: white;
        text-shadow: 0 0 20px black;
        z-index: 1000;
        background: rgba(0,0,0,0.8);
        padding: 30px 60px;
        border-radius: 50px;
        font-family: monospace;
        pointer-events: none;
    `;
    document.body.appendChild(countdownDiv);
    
    const interval = setInterval(() => {
        if (!countdownActive) {
            clearInterval(interval);
            if (countdownDiv) countdownDiv.remove();
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
            countdownDiv.style.fontSize = '100px';
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
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.38, 1.3), new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.7 }));
    body.position.y = 0.2;
    body.castShadow = true;
    carGroup.add(body);
    
    // Teto
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.28, 0.9), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
    roof.position.y = 0.48;
    roof.castShadow = true;
    carGroup.add(roof);
    
    // Para-brisa
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88aaff, metalness: 0.9 });
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.18, 0.45), glassMat);
    windshield.position.set(0, 0.55, -0.5);
    carGroup.add(windshield);
    
    // Rodas
    const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
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

function startGame3D(raceLength = 1000) {
    if (gameActive3D) return;
    
    init3D(raceLength);
    
    carMesh = createCar3D(0xff6b35);
    carMesh.position.set(0, 0.18, 1.5);
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
    
    // Limpar setas
    for (let key in arrowIndicators) {
        if (arrowIndicators[key] && arrowIndicators[key].parentNode) {
            arrowIndicators[key].parentNode.removeChild(arrowIndicators[key]);
        }
    }
    arrowIndicators = {};
    
    document.getElementById('gameHud').style.display = 'none';
    document.getElementById('raceControls').style.display = 'none';
}

function updateGame3DVisuals() {
    if (!gameActive3D || !carMesh) return;
    
    // ========== POSIÇÃO DO CARRO NA PISTA ==========
    // O carro se move ao longo do eixo Z (descendo a pista)
    const targetZ = -playerCar.distancia * 0.045;
    const targetX = (playerCar.x - 400) / 55;
    
    // Suspensão (carro colado na pista)
    const roadHeight = Math.sin(targetZ * 0.12) * 0.08 + Math.sin(targetZ * 0.35) * 0.04;
    suspensionHeight = roadHeight + 0.12;
    
    carMesh.position.x += (targetX - carMesh.position.x) * 0.15;
    carMesh.position.z += (targetZ - carMesh.position.z) * 0.1;
    carMesh.position.y = suspensionHeight;
    
    // Inclinação do carro
    carMesh.rotation.z = -carMesh.position.x * 0.22;
    carMesh.rotation.x = roadHeight * 0.5;
    
    // Rodas girando
    if (raceStartedFlag) {
        wheelRotation += playerCar.velocidade * 0.028;
        carMesh.children.forEach(child => {
            if (child.geometry && child.geometry.type === 'CylinderGeometry') {
                child.rotation.x = wheelRotation;
            }
        });
    }
    
    // ========== CÂMERA ==========
    const targetCamX = carMesh.position.x * 0.35;
    const targetCamY = 2.4 + Math.abs(carMesh.position.x) * 0.15;
    const targetCamZ = 5.5 + (playerCar.velocidade * 0.002);
    
    camera.position.x += (targetCamX - camera.position.x) * 0.08;
    camera.position.y += (targetCamY - camera.position.y) * 0.08;
    camera.position.z += (targetCamZ - camera.position.z) * 0.08;
    camera.lookAt(carMesh.position.x, carMesh.position.y + 0.2, carMesh.position.z - 3);
    
    // ========== OBSTÁCULOS ==========
    if (raceStartedFlag) {
        updateObstacles();
        updateOtherPlayers();
        updateUI();
        
        if (playerCar.distancia >= raceDistance) {
            finishRace();
        }
    }
}

function updateObstacles() {
    // Gerar novos obstáculos
    if (Math.random() < 0.018 && raceStartedFlag) {
        const inactive = obstacles3d.find(obs => !obs.userData.active);
        if (inactive) {
            inactive.position.x = (Math.random() - 0.5) * 3.2;
            inactive.position.z = -25;
            inactive.position.y = -0.12;
            inactive.userData.active = true;
            inactive.visible = true;
        }
    }
    
    // Mover obstáculos
    obstacles3d.forEach(obs => {
        if (obs.userData.active) {
            obs.position.z += playerCar.velocidade * 0.035;
            
            // Colisão
            if (!invincible && 
                Math.abs(obs.position.x - carMesh.position.x) < 0.7 && 
                Math.abs(obs.position.z - carMesh.position.z) < 1.3) {
                
                playerCar.durability -= obs.userData.damage;
                invincible = true;
                invincibleTimer = 0.8;
                obs.userData.active = false;
                obs.visible = false;
                
                // Efeito visual
                createHitEffect(obs.position);
                
                if (playerCar.durability <= 0) {
                    gameOver = true;
                    raceActive = false;
                    if (typeof showRaceResult === 'function') showRaceResult();
                }
            }
            
            if (obs.position.z > 12) {
                obs.userData.active = false;
                obs.visible = false;
            }
        }
    });
}

function createHitEffect(position) {
    const particleMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
    for (let i = 0; i < 8; i++) {
        const particle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), particleMat);
        particle.position.copy(position);
        scene.add(particle);
        setTimeout(() => scene.remove(particle), 200);
    }
}

function updateOtherPlayers() {
    if (!window.otherCars) window.otherCars = {};
    
    // Limpar carros antigos
    for (let [name, car] of Object.entries(window.otherCars)) {
        if (window.otherPlayers && !window.otherPlayers[name] && car.parent) {
            scene.remove(car);
            delete window.otherCars[name];
        }
    }
    
    for (let [name, other] of Object.entries(window.otherPlayers || {})) {
        const diffDist = (other.distancia - playerCar.distancia);
        const isVisible = Math.abs(diffDist) < 25;
        
        if (!isVisible) {
            // Criar/Atualizar seta indicadora
            updateArrowIndicator(name, diffDist);
        } else {
            // Remover seta se existir
            if (arrowIndicators[name]) {
                arrowIndicators[name].remove();
                delete arrowIndicators[name];
            }
            
            // Criar/Atualizar carro 3D
            if (!window.otherCars[name]) {
                const otherColor = Math.abs(hashCode(name) % 360);
                window.otherCars[name] = createCar3D(`hsl(${otherColor}, 70%, 55%)`);
                scene.add(window.otherCars[name]);
            }
            
            if (window.otherCars[name]) {
                const zPos = diffDist * 0.045;
                const xPos = (other.x - 400) / 55;
                const roadHeight = Math.sin(zPos * 0.12) * 0.08;
                
                window.otherCars[name].position.set(xPos, roadHeight + 0.12, Math.min(10, Math.max(-12, zPos)));
                window.otherCars[name].rotation.z = -xPos * 0.2;
            }
        }
    }
}

function updateArrowIndicator(playerName, distanceDiff) {
    if (!arrowIndicators[playerName]) {
        const arrowDiv = document.createElement('div');
        arrowDiv.style.cssText = `
            position: fixed;
            left: 50%;
            transform: translateX(-50%);
            font-size: 40px;
            text-align: center;
            z-index: 100;
            background: rgba(0,0,0,0.7);
            border-radius: 50px;
            padding: 10px 20px;
            font-weight: bold;
            animation: pulse 1s infinite;
        `;
        document.body.appendChild(arrowDiv);
        arrowIndicators[playerName] = arrowDiv;
    }
    
    const arrow = arrowIndicators[playerName];
    
    if (distanceDiff > 0) {
        // Jogador está na frente (mais abaixo na tela)
        arrow.style.bottom = '20px';
        arrow.style.top = 'auto';
        arrow.innerHTML = `⬇️ ${playerName} ⬇️`;
        arrow.style.color = '#ffaa66';
        arrow.style.borderBottom = '3px solid #ffaa66';
    } else {
        // Jogador está atrás (mais acima na tela)
        arrow.style.top = '20px';
        arrow.style.bottom = 'auto';
        arrow.innerHTML = `⬆️ ${playerName} ⬆️`;
        arrow.style.color = '#4CAF50';
        arrow.style.borderTop = '3px solid #4CAF50';
    }
    
    // Animação CSS
    if (!document.querySelector('#arrowStyle')) {
        const style = document.createElement('style');
        style.id = 'arrowStyle';
        style.textContent = `
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: translateX(-50%) scale(1); }
                50% { opacity: 0.7; transform: translateX(-50%) scale(1.05); }
            }
        `;
        document.head.appendChild(style);
    }
}

function updateUI() {
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

function finishRace() {
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
        database.ref(`players/${currentPlayer.name}`).update({ 
            points: currentPlayer.points, 
            wins: currentPlayer.wins 
        });
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

// Exportar
window.startGame3D = startGame3D;
window.stopGame3D = stopGame3D;
