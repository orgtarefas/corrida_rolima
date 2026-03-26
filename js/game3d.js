// ==================== JOGO 3D COM RELEVOS E SEMÁFORO ====================

let scene, camera, renderer;
let trackGroup, carMesh;
let obstacles3d = [];
let gameActive3D = false;
let raceDistance = 0;
let raceStartedFlag = false;
let startLight = null;
let countdown = 3;
let countdownActive = false;
let roadSegments = [];

// Suspensão do carro
let suspensionHeight = 0;
let suspensionTarget = 0;
let wheelRotation = 0;

function init3D(raceLength = 1000) {
    raceDistance = raceLength;
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    // Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1a2a);
    scene.fog = new THREE.FogExp2(0x0a1a2a, 0.008);
    
    // Câmera
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2.8, 7);
    camera.lookAt(0, 0.5, -3);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Iluminação
    setupLighting3D();
    
    // Pista
    createRoadWithTerrain();
    
    // Obstáculos
    createObstaclesPool3D();
    
    // Árvores e cenário
    createTreesAndProps();
    
    // Semáforo
    createStartLight();
    
    // Evento de redimensionamento
    window.addEventListener('resize', onWindowResize3D);
    
    // Iniciar contagem regressiva
    startCountdown();
}

function setupLighting3D() {
    // Luz ambiente
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);
    
    // Luz direcional (sol)
    const dirLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
    dirLight.position.set(10, 20, 5);
    dirLight.castShadow = true;
    dirLight.receiveShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);
    
    // Luz de preenchimento
    const fillLight = new THREE.PointLight(0x4466aa, 0.5);
    fillLight.position.set(0, 5, -5);
    scene.add(fillLight);
    
    // Luz traseira
    const backLight = new THREE.PointLight(0xffaa66, 0.3);
    backLight.position.set(0, 2, -8);
    scene.add(backLight);
}

function createRoadWithTerrain() {
    trackGroup = new THREE.Group();
    roadSegments = [];
    
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.5, metalness: 0.1 });
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffdd88, emissive: 0x442200 });
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    
    const ROAD_WIDTH = 4.2;
    const SEGMENT_LENGTH = 1.5;
    const SEGMENTS = 80;
    
    for (let i = 0; i < SEGMENTS; i++) {
        const z = -i * SEGMENT_LENGTH;
        
        // Calcular altura da pista com relevo
        const roadHeight = calcularAlturaPista(z);
        
        // Asfalto
        const road = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH, 0.12, SEGMENT_LENGTH), asphaltMat);
        road.position.set(0, roadHeight - 0.2, z);
        road.castShadow = true;
        road.receiveShadow = true;
        trackGroup.add(road);
        roadSegments.push(road);
        
        // Linha central (tracejada)
        if (i % 2 === 0) {
            const line = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 0.8), lineMat);
            line.position.set(0, roadHeight - 0.12, z);
            trackGroup.add(line);
        }
        
        // Bordas
        const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, SEGMENT_LENGTH), edgeMat);
        leftEdge.position.set(-ROAD_WIDTH/2 - 0.15, roadHeight - 0.15, z);
        trackGroup.add(leftEdge);
        
        const rightEdge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, SEGMENT_LENGTH), edgeMat);
        rightEdge.position.set(ROAD_WIDTH/2 + 0.15, roadHeight - 0.15, z);
        trackGroup.add(rightEdge);
        
        // Armazenar altura para referência
        road.userData = { height: roadHeight, z: z };
    }
    
    scene.add(trackGroup);
}

function createObstaclesPool3D() {
    const types = [
        { name: 'Pedra', geo: new THREE.DodecahedronGeometry(0.35), color: 0x888888, y: -0.15, damage: 15 },
        { name: 'Tronco', geo: new THREE.CylinderGeometry(0.4, 0.45, 0.7, 8), color: 0x8B4513, y: -0.1, damage: 12 },
        { name: 'Galho', geo: new THREE.BoxGeometry(0.8, 0.15, 0.35), color: 0x654321, y: -0.2, damage: 8 },
        { name: 'Buraco', geo: new THREE.CylinderGeometry(0.55, 0.6, 0.15, 8), color: 0x4a2c1a, y: -0.25, damage: 25 }
    ];
    
    for (let i = 0; i < 30; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const mat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.7 });
        const mesh = new THREE.Mesh(type.geo, mat);
        mesh.position.y = type.y;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { active: false, type: type.name, damage: type.damage, speed: 0 };
        mesh.visible = false;
        scene.add(mesh);
        obstacles3d.push(mesh);
    }
}

function createTreesAndProps() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
    
    for (let z = -80; z < 20; z += 4) {
        const terrainHeight = calcularAlturaPista(z);
        
        // Árvores esquerda
        const treeLeft = createTree(trunkMat, foliageMat);
        treeLeft.position.set(-4.2, terrainHeight - 0.2, z);
        scene.add(treeLeft);
        
        // Árvores direita
        const treeRight = createTree(trunkMat, foliageMat);
        treeRight.position.set(4.2, terrainHeight - 0.2, z);
        scene.add(treeRight);
        
        // Postes ocasionais
        if (z % 8 === 0) {
            const postMat = new THREE.MeshStandardMaterial({ color: 0xccaa88 });
            const post = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.2, 2.5, 4), postMat);
            post.position.set(-3.5, terrainHeight, z);
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

function createStartLight() {
    const lightGroup = new THREE.Group();
    
    // Poste
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 3, 6), poleMat);
    pole.position.y = 1.5;
    lightGroup.add(pole);
    
    // Suporte horizontal
    const armMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
    const arm = new THREE.Mesh(new THREE.BoxGeometry(1, 0.1, 0.2), armMat);
    arm.position.set(0.6, 2.5, 0);
    lightGroup.add(arm);
    
    // Luz vermelha
    const redMat = new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x440000 });
    const redLight = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), redMat);
    redLight.position.set(0.9, 2.5, 0);
    lightGroup.add(redLight);
    
    // Luz amarela
    const yellowMat = new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0x442200 });
    const yellowLight = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), yellowMat);
    yellowLight.position.set(0.9, 2.1, 0);
    yellowLight.visible = false;
    lightGroup.add(yellowLight);
    
    // Luz verde
    const greenMat = new THREE.MeshStandardMaterial({ color: 0x33ff33, emissive: 0x004400 });
    const greenLight = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 16), greenMat);
    greenLight.position.set(0.9, 1.7, 0);
    greenLight.visible = false;
    lightGroup.add(greenLight);
    
    lightGroup.position.set(3, 0.2, -5);
    scene.add(lightGroup);
    
    startLight = { red: redLight, yellow: yellowLight, green: greenLight, group: lightGroup };
}

function startCountdown() {
    countdownActive = true;
    countdown = 3;
    
    // Mostrar contagem na tela
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
        text-shadow: 0 0 20px rgba(0,0,0,0.5);
        z-index: 1000;
        font-family: monospace;
        background: rgba(0,0,0,0.7);
        padding: 30px 50px;
        border-radius: 30px;
        pointer-events: none;
    `;
    document.body.appendChild(countdownDiv);
    
    const countdownInterval = setInterval(() => {
        if (!countdownActive) {
            clearInterval(countdownInterval);
            countdownDiv.remove();
            return;
        }
        
        if (countdown === 3) {
            countdownDiv.textContent = '3';
            if (startLight) {
                startLight.red.material.color.setHex(0xff3333);
                startLight.red.material.emissive.setHex(0x441111);
            }
        } else if (countdown === 2) {
            countdownDiv.textContent = '2';
            if (startLight) {
                startLight.red.visible = false;
                startLight.yellow.visible = true;
                startLight.yellow.material.emissive.setHex(0x442200);
            }
        } else if (countdown === 1) {
            countdownDiv.textContent = '1';
            if (startLight) {
                startLight.yellow.visible = false;
                startLight.green.visible = true;
                startLight.green.material.emissive.setHex(0x114400);
            }
        } else if (countdown === 0) {
            countdownDiv.textContent = 'GO!';
            countdownDiv.style.color = '#4CAF50';
            clearInterval(countdownInterval);
            setTimeout(() => {
                countdownDiv.remove();
            }, 500);
            countdownActive = false;
            raceStartedFlag = true;
            if (startLight) {
                startLight.green.material.emissive.setHex(0x33ff33);
            }
            console.log('🏁 CORRIDA INICIADA!');
        }
        
        countdown--;
    }, 1000);
}

function createCar3D(color = 0xff6b35) {
    const carGroup = new THREE.Group();
    
    // Corpo principal
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.35, 1.3);
    const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.2;
    body.castShadow = true;
    carGroup.add(body);
    
    // Teto
    const roofGeo = new THREE.BoxGeometry(0.65, 0.25, 0.9);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 0.45;
    roof.castShadow = true;
    carGroup.add(roof);
    
    // Para-brisa
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x88aaff, metalness: 0.9, roughness: 0.2 });
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.15, 0.4), glassMat);
    windshield.position.set(0, 0.55, -0.45);
    carGroup.add(windshield);
    
    // Rodas
    const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 });
    const wheelPos = [[-0.55, 0.12, -0.6], [0.55, 0.12, -0.6], [-0.55, 0.12, 0.6], [0.55, 0.12, 0.6]];
    
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
    carMesh.position.set(0, 0.2, 0);
    scene.add(carMesh);
    
    gameActive3D = true;
    
    // Mostrar HUD
    const gameHud = document.getElementById('gameHud');
    const raceControls = document.getElementById('raceControls');
    const totalDistanceSpan = document.getElementById('totalDistanceDisplay');
    
    if (gameHud) gameHud.style.display = 'block';
    if (raceControls) raceControls.style.display = 'flex';
    if (totalDistanceSpan) totalDistanceSpan.textContent = raceLength;
}

function stopGame3D() {
    gameActive3D = false;
    raceStartedFlag = false;
    countdownActive = false;
    
    if (carMesh) scene.remove(carMesh);
    if (trackGroup) scene.remove(trackGroup);
    if (startLight) scene.remove(startLight.group);
    
    // Limpar obstáculos
    obstacles3d.forEach(obs => scene.remove(obs));
    obstacles3d = [];
    
    const gameHud = document.getElementById('gameHud');
    const raceControls = document.getElementById('raceControls');
    if (gameHud) gameHud.style.display = 'none';
    if (raceControls) raceControls.style.display = 'none';
}

function updateGame3DVisuals() {
    if (!gameActive3D || !carMesh) return;
    
    // Calcular posição na pista
    const trackZ = -playerCar.distancia * 0.045;
    
    // Calcular altura da pista na posição atual
    const roadHeight = calcularAlturaPista(trackZ);
    const curveOffset = calcularCurvaPista(trackZ);
    
    // SUSPENSÃO: carro acompanha o relevo
    suspensionTarget = roadHeight + 0.15;
    suspensionHeight += (suspensionTarget - suspensionHeight) * 0.2;
    carMesh.position.y = suspensionHeight;
    
    // Posição horizontal com curva
    const targetX = (playerCar.x - 400) / 55 + curveOffset;
    carMesh.position.x += (targetX - carMesh.position.x) * 0.15;
    
    // Inclinação do carro conforme curva e relevo
    carMesh.rotation.z = -carMesh.position.x * 0.25;
    carMesh.rotation.x = Math.sin(Date.now() * 0.02) * 0.02 + (roadHeight * 0.3);
    
    // RODAS GIRANDO
    if (raceStartedFlag) {
        wheelRotation += playerCar.velocidade * 0.025;
    }
    carMesh.children.forEach(child => {
        if (child.geometry && (child.geometry.type === 'CylinderGeometry')) {
            child.rotation.x = wheelRotation;
        }
    });
    
    // CÂMERA DINÂMICA
    const targetCamX = carMesh.position.x * 0.3;
    const targetCamY = 2.5 + Math.abs(carMesh.position.x) * 0.2 + (roadHeight * 0.2);
    const targetCamZ = 6 + (playerCar.velocidade * 0.003);
    
    camera.position.x += (targetCamX - camera.position.x) * 0.08;
    camera.position.y += (targetCamY - camera.position.y) * 0.08;
    camera.position.z += (targetCamZ - camera.position.z) * 0.08;
    camera.lookAt(carMesh.position.x, suspensionHeight + 0.3, carMesh.position.z - 2);
    
    if (raceStartedFlag) {
        updateObstacles3DVisuals(trackZ);
        updateOtherPlayers3DVisuals(trackZ);
        updateRaceUI3D();
        
        // Verificar fim da corrida
        if (playerCar.distancia >= raceDistance) {
            finishRace();
        }
    }
}

function updateObstacles3DVisuals(currentZ) {
    if (!raceStartedFlag) return;
    
    // Gerar novos obstáculos
    if (Math.random() < 0.02 && gameActive3D) {
        const inactiveObs = obstacles3d.find(obs => !obs.userData.active);
        if (inactiveObs) {
            const posX = (Math.random() - 0.5) * 3;
            const posZ = currentZ - 18;
            const roadHeight = calcularAlturaPista(posZ);
            
            inactiveObs.position.x = posX;
            inactiveObs.position.z = posZ;
            inactiveObs.position.y = roadHeight - 0.1;
            inactiveObs.userData.active = true;
            inactiveObs.visible = true;
        }
    }
    
    // Mover obstáculos
    obstacles3d.forEach(obs => {
        if (obs.userData.active) {
            obs.position.z += playerCar.velocidade * 0.032;
            const roadHeight = calcularAlturaPista(obs.position.z);
            obs.position.y = roadHeight - 0.1;
            
            // Verificar colisão
            if (!invincible && obs.userData.active && 
                Math.abs(obs.position.x - carMesh.position.x) < 0.65 && 
                Math.abs(obs.position.z - carMesh.position.z) < 1.2) {
                
                playerCar.durability -= obs.userData.damage;
                invincible = true;
                invincibleTimer = 0.8;
                obs.userData.active = false;
                obs.visible = false;
                
                // Efeito de impacto
                createImpactEffect(obs.position);
                
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

function createImpactEffect(position) {
    const particleMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0x442200 });
    for (let i = 0; i < 6; i++) {
        const particle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), particleMat);
        particle.position.copy(position);
        particle.userData = { life: 0.5 };
        scene.add(particle);
        setTimeout(() => scene.remove(particle), 300);
    }
}

function updateOtherPlayers3DVisuals(currentZ) {
    // Limpar carros antigos
    for (let [name, car] of Object.entries(window.otherCars || {})) {
        if (window.otherPlayers && !window.otherPlayers[name] && car.parent) {
            scene.remove(car);
            delete window.otherCars[name];
        }
    }
    
    if (!window.otherCars) window.otherCars = {};
    
    for (let [name, other] of Object.entries(window.otherPlayers || {})) {
        if (!window.otherCars[name]) {
            const otherColor = Math.abs(hashCode(name) % 360);
            window.otherCars[name] = createCar3D(`hsl(${otherColor}, 70%, 55%)`);
            scene.add(window.otherCars[name]);
        }
        
        if (window.otherCars[name]) {
            const distanceDiff = (other.distancia - playerCar.distancia) * 0.045;
            const xPos = (other.x - 400) / 55 + calcularCurvaPista(currentZ + distanceDiff);
            const roadHeight = calcularAlturaPista(currentZ + distanceDiff);
            
            window.otherCars[name].position.x = xPos;
            window.otherCars[name].position.z = Math.min(8, Math.max(-10, distanceDiff));
            window.otherCars[name].position.y = roadHeight + 0.15;
            
            // Rotação para outros carros
            window.otherCars[name].rotation.z = -xPos * 0.2;
        }
    }
}

function updateRaceUI3D() {
    const distanceEl = document.getElementById('distanceDisplay');
    const speedEl = document.getElementById('speedDisplay');
    const durabilityEl = document.getElementById('durabilityDisplay');
    const positionEl = document.getElementById('positionDisplay');
    const remainingEl = document.getElementById('remainingDisplay');
    
    if (distanceEl) distanceEl.textContent = Math.floor(playerCar.distancia);
    if (speedEl) speedEl.textContent = Math.floor(playerCar.velocidade);
    if (durabilityEl) durabilityEl.textContent = Math.max(0, Math.floor(playerCar.durability));
    
    let position = 1;
    for (let [name, other] of Object.entries(window.otherPlayers || {})) {
        if (other.distancia > playerCar.distancia) position++;
    }
    if (positionEl) positionEl.textContent = position;
    if (remainingEl) remainingEl.textContent = Math.max(0, Math.floor(raceDistance - playerCar.distancia));
}

function finishRace() {
    raceActive = false;
    raceStartedFlag = false;
    
    // Calcular pontos baseado na posição
    let position = 1;
    for (let [name, other] of Object.entries(window.otherPlayers || {})) {
        if (other.distancia > playerCar.distancia) position++;
    }
    
    let pointsEarned = Math.floor(raceDistance / 20) + 50;
    if (position === 1) pointsEarned += 100;
    else if (position === 2) pointsEarned += 50;
    else if (position === 3) pointsEarned += 25;
    pointsEarned = Math.min(300, pointsEarned);
    
    if (currentPlayer) {
        currentPlayer.points = (currentPlayer.points || 0) + pointsEarned;
        if (position === 1) currentPlayer.wins = (currentPlayer.wins || 0) + 1;
        database.ref(`players/${currentPlayer.name}`).update({ 
            points: currentPlayer.points,
            wins: currentPlayer.wins
        });
        updateGarageUI();
    }
    
    // Mostrar resultado
    alert(`🏁 CORRIDA FINALIZADA!\n\nPosição: ${position}º\nDistância: ${Math.floor(playerCar.distancia)}m\nPontos ganhos: +${pointsEarned}⭐`);
    
    exitRace();
}

function animate3D() {
    requestAnimationFrame(animate3D);
    
    if (gameActive3D && renderer && scene && camera) {
        if (raceStartedFlag) updateGame3DVisuals();
        renderer.render(scene, camera);
    } else if (renderer && scene && camera) {
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

// Funções auxiliares que usam VELOCIDADES
function calcularAlturaPista(posicaoZ) {
    if (typeof VELOCIDADES !== 'undefined') {
        const config = VELOCIDADES.pista;
        const ondulacao = Math.sin(posicaoZ * config.ondulacaoFrequencia) * config.ondulacaoAmplitude;
        const microOndulacao = Math.sin(posicaoZ * config.ondulacaoFrequencia * 3) * 0.1;
        return ondulacao + microOndulacao;
    }
    return Math.sin(posicaoZ * 0.05) * 0.3;
}

function calcularCurvaPista(posicaoZ) {
    if (typeof VELOCIDADES !== 'undefined') {
        const config = VELOCIDADES.pista;
        return Math.sin(posicaoZ * config.curvaFrequencia) * config.curvaAmplitude;
    }
    return Math.sin(posicaoZ * 0.03) * 1.2;
}
