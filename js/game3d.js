// ==================== JOGO 3D COM THREE.JS - DESCIDA DE LADEIRA ====================

let scene, camera, renderer;
let trackGroup, carMesh;
let obstacles3d = [];
let gameActive3D = false;
let roadLines = [];
let roadSegments = [];

// Constantes 3D
const ROAD_WIDTH = 4.5;
const ROAD_LENGTH = 300;
const CAR_Y_POS = 0.5;
let roadScrollOffset = 0;

function init3D() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    // Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a2a3a);
    scene.fog = new THREE.FogExp2(0x1a2a3a, 0.008);
    
    // Câmera (posicionada atrás do carro)
    camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2.5, 6);
    camera.lookAt(0, 0.5, -2);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Iluminação
    setupLighting3D();
    
    // Criar pista infinita
    createInfiniteRoad3D();
    
    // Criar obstáculos
    createObstaclesPool3D();
    
    // Criar árvores laterais
    createTrees3D();
    
    // Criar céu e nuvens
    createSky3D();
    
    // Animação
    animate3D();
    
    window.addEventListener('resize', onWindowResize3D);
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
    
    // Luz de preenchimento traseira
    const backLight = new THREE.PointLight(0x4466aa, 0.5);
    backLight.position.set(0, 5, -10);
    scene.add(backLight);
    
    // Luz de chão
    const groundLight = new THREE.PointLight(0xaa8866, 0.3);
    groundLight.position.set(0, -1, 0);
    scene.add(groundLight);
}

function createInfiniteRoad3D() {
    trackGroup = new THREE.Group();
    
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6, metalness: 0.1 });
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffdd88, emissive: 0x442200 });
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0x8B7355 });
    
    // Criar segmentos de pista para efeito infinito
    for (let i = 0; i < 40; i++) {
        const z = -i * 2;
        
        // Asfalto
        const road = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH, 0.1, 1.8), asphaltMat);
        road.position.set(0, -0.2, z);
        road.castShadow = true;
        road.receiveShadow = true;
        trackGroup.add(road);
        
        // Linha central (tracejada)
        if (i % 2 === 0) {
            const line = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.12, 0.8), lineMat);
            line.position.set(0, -0.12, z);
            trackGroup.add(line);
        }
        
        // Bordas
        const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 1.8), edgeMat);
        leftEdge.position.set(-ROAD_WIDTH/2 - 0.15, -0.15, z);
        trackGroup.add(leftEdge);
        
        const rightEdge = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.1, 1.8), edgeMat);
        rightEdge.position.set(ROAD_WIDTH/2 + 0.15, -0.15, z);
        trackGroup.add(rightEdge);
        
        roadSegments.push(road);
    }
    
    scene.add(trackGroup);
}

function createTrees3D() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.7 });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.5 });
    
    for (let z = -60; z < 10; z += 4) {
        // Árvores do lado esquerdo
        const treeLeft = createTree(trunkMat, foliageMat);
        treeLeft.position.set(-ROAD_WIDTH - 1.2, -0.3, z);
        scene.add(treeLeft);
        
        // Árvores do lado direito
        const treeRight = createTree(trunkMat, foliageMat);
        treeRight.position.set(ROAD_WIDTH + 1.2, -0.3, z);
        scene.add(treeRight);
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

function createSky3D() {
    // Céu com gradiente (usando spheres ou apenas cor de fundo)
    // Adicionar algumas nuvens
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xeeeeff, emissive: 0x8888aa, transparent: true, opacity: 0.7 });
    
    for (let i = 0; i < 15; i++) {
        const cloud = new THREE.Group();
        const x = (Math.random() - 0.5) * 30;
        const z = (Math.random() - 0.5) * 50 - 20;
        const y = 8 + Math.random() * 5;
        
        const p1 = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 8), cloudMat);
        const p2 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), cloudMat);
        p2.position.set(0.7, -0.2, 0.3);
        const p3 = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 8), cloudMat);
        p3.position.set(-0.6, -0.1, 0.2);
        
        cloud.add(p1, p2, p3);
        cloud.position.set(x, y, z);
        scene.add(cloud);
    }
}

function createObstaclesPool3D() {
    const types = [
        { name: 'Pedra', geo: new THREE.DodecahedronGeometry(0.35), color: 0x888888, y: -0.15, damage: 15 },
        { name: 'Tronco', geo: new THREE.CylinderGeometry(0.4, 0.45, 0.7, 8), color: 0x8B4513, y: -0.1, damage: 12 },
        { name: 'Galho', geo: new THREE.BoxGeometry(0.8, 0.15, 0.35), color: 0x654321, y: -0.2, damage: 8 },
        { name: 'Buraco', geo: new THREE.CylinderGeometry(0.55, 0.6, 0.15, 8), color: 0x4a2c1a, y: -0.25, damage: 25 }
    ];
    
    for (let i = 0; i < 25; i++) {
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

function createCar3D(color = 0xff6b35) {
    const carGroup = new THREE.Group();
    
    // Corpo principal
    const bodyGeo = new THREE.BoxGeometry(0.75, 0.35, 1.25);
    const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.2;
    body.castShadow = true;
    carGroup.add(body);
    
    // Teto/Assento
    const roofGeo = new THREE.BoxGeometry(0.6, 0.25, 0.85);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 0.45;
    roof.castShadow = true;
    carGroup.add(roof);
    
    // Rodas
    const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.12, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.4 });
    const wheelPos = [[-0.5, 0.12, -0.55], [0.5, 0.12, -0.55], [-0.5, 0.12, 0.55], [0.5, 0.12, 0.55]];
    
    wheelPos.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.castShadow = true;
        carGroup.add(wheel);
    });
    
    // Detalhes (faróis)
    const lightMat = new THREE.MeshStandardMaterial({ color: 0xffaa66, emissive: 0xff4411 });
    const frontLight = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), lightMat);
    frontLight.position.set(0.35, 0.2, -0.65);
    carGroup.add(frontLight);
    
    const frontLight2 = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 8), lightMat);
    frontLight2.position.set(-0.35, 0.2, -0.65);
    carGroup.add(frontLight2);
    
    return carGroup;
}

function startGame3D() {
    if (gameActive3D) return;
    
    init3D();
    
    // Criar carro do jogador
    carMesh = createCar3D(0xff6b35);
    carMesh.position.set(0, CAR_Y_POS, 0);
    scene.add(carMesh);
    
    gameActive3D = true;
    
    // Mostrar HUD
    document.getElementById('gameHud').style.display = 'block';
    document.getElementById('raceControls').style.display = 'flex';
}

function stopGame3D() {
    gameActive3D = false;
    
    if (carMesh) scene.remove(carMesh);
    if (trackGroup) scene.remove(trackGroup);
    
    document.getElementById('gameHud').style.display = 'none';
    document.getElementById('raceControls').style.display = 'none';
}

function updateGame3DVisuals() {
    if (!gameActive3D || !carMesh) return;
    
    // ========== EFEITO DE DESCIDA ==========
    // A pista "sobe" em direção ao carro, simulando descida
    const scrollSpeed = playerCar.velocidade * 0.025;
    roadScrollOffset += scrollSpeed;
    
    // Atualizar posição dos segmentos da pista (efeito infinito)
    roadSegments.forEach((segment, index) => {
        let newZ = segment.position.z + scrollSpeed;
        if (newZ > 3) {
            newZ = -78;
        }
        segment.position.z = newZ;
    });
    
    // Atualizar posição do carro (horizontal)
    const targetX = (playerCar.x - 400) / 55;
    carMesh.position.x += (targetX - carMesh.position.x) * 0.15;
    
    // Inclinação nas curvas
    carMesh.rotation.z = -carMesh.position.x * 0.25;
    carMesh.rotation.x = Math.sin(Date.now() * 0.015) * 0.03;
    
    // ========== ATUALIZAR CÂMERA ==========
    // Câmera acompanha o carro com efeito de movimento
    const targetCamX = carMesh.position.x * 0.4;
    const targetCamY = 2.2 + Math.abs(carMesh.position.x) * 0.3;
    const targetCamZ = 5.5 + playerCar.velocidade * 0.003;
    
    camera.position.x += (targetCamX - camera.position.x) * 0.08;
    camera.position.y += (targetCamY - camera.position.y) * 0.08;
    camera.position.z += (targetCamZ - camera.position.z) * 0.08;
    camera.lookAt(carMesh.position.x, 0.3, carMesh.position.z - 2);
    
    // ========== ATUALIZAR OBSTÁCULOS ==========
    updateObstacles3DVisuals();
    
    // ========== ATUALIZAR OUTROS JOGADORES ==========
    updateOtherPlayers3DVisuals();
    
    // ========== ATUALIZAR UI ==========
    updateRaceUI3D();
}

function updateObstacles3DVisuals() {
    // Gerar novos obstáculos
    if (Math.random() < 0.025 && gameActive3D) {
        const inactiveObs = obstacles3d.find(obs => !obs.userData.active);
        if (inactiveObs) {
            const posX = (Math.random() - 0.5) * (ROAD_WIDTH - 1.2);
            inactiveObs.position.x = posX;
            inactiveObs.position.z = -25;
            inactiveObs.userData.active = true;
            inactiveObs.userData.speed = 0;
            inactiveObs.visible = true;
        }
    }
    
    // Mover obstáculos em direção ao carro (descida)
    obstacles3d.forEach(obs => {
        if (obs.userData.active) {
            const moveSpeed = playerCar.velocidade * 0.028;
            obs.position.z += moveSpeed;
            
            // Verificar colisão
            if (!invincible && obs.userData.active && 
                Math.abs(obs.position.x - carMesh.position.x) < 0.55 && 
                Math.abs(obs.position.z - carMesh.position.z) < 1.2) {
                
                playerCar.durability -= obs.userData.damage;
                invincible = true;
                invincibleTimer = 0.8;
                obs.userData.active = false;
                obs.visible = false;
                
                // Efeito visual de impacto
                if (typeof createImpactEffect === 'function') createImpactEffect(obs.position);
                
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

function updateOtherPlayers3DVisuals() {
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
            // Posição do outro jogador baseada na distância
            const distanceDiff = (other.distancia - playerCar.distancia) * 0.045;
            const xPos = (other.x - 400) / 55;
            
            window.otherCars[name].position.x = xPos;
            window.otherCars[name].position.z = Math.min(6, Math.max(-8, distanceDiff));
            window.otherCars[name].position.y = CAR_Y_POS;
        }
    }
}

function updateRaceUI3D() {
    const distanceEl = document.getElementById('distanceDisplay');
    const speedEl = document.getElementById('speedDisplay');
    const durabilityEl = document.getElementById('durabilityDisplay');
    const positionEl = document.getElementById('positionDisplay');
    
    if (distanceEl) distanceEl.textContent = Math.floor(playerCar.distancia);
    if (speedEl) speedEl.textContent = Math.floor(playerCar.velocidade);
    if (durabilityEl) durabilityEl.textContent = Math.max(0, Math.floor(playerCar.durability));
    
    let position = 1;
    for (let [name, other] of Object.entries(window.otherPlayers || {})) {
        if (other.distancia > playerCar.distancia) position++;
    }
    if (positionEl) positionEl.textContent = position;
}

function createImpactEffect(position) {
    // Criar partículas de impacto
    const particleCount = 8;
    const particleMat = new THREE.MeshStandardMaterial({ color: 0xff6600, emissive: 0x442200 });
    
    for (let i = 0; i < particleCount; i++) {
        const particle = new THREE.Mesh(new THREE.SphereGeometry(0.08, 4, 4), particleMat);
        particle.position.copy(position);
        particle.userData = { life: 0.5, velocity: { x: (Math.random() - 0.5) * 0.3, y: Math.random() * 0.2, z: (Math.random() - 0.5) * 0.3 } };
        scene.add(particle);
        
        setTimeout(() => scene.remove(particle), 500);
    }
}

function animate3D() {
    requestAnimationFrame(animate3D);
    
    if (gameActive3D && renderer && scene && camera) {
        updateGame3DVisuals();
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

// Função auxiliar
function hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}
