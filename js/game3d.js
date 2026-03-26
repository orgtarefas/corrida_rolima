// ==================== JOGO 3D COM THREE.JS (VERSÃO SEM MÓDULOS) ====================

let scene, camera, renderer;
let trackGroup, carMesh;
let obstacles3d = [];
let gameActive3D = false;

// Constantes 3D
const ROAD_WIDTH = 5;
const ROAD_LENGTH = 200;
const CAM_OFFSET = { x: 0, y: 3, z: 8 };

function init3D() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    // Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 40, 80);
    
    // Câmera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    
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
    dirLight.receiveShadow = true;
    scene.add(dirLight);
    
    const fillLight = new THREE.PointLight(0x4466cc, 0.3);
    fillLight.position.set(-5, 5, 5);
    scene.add(fillLight);
    
    // Chão/Grama
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x3a6b3a, roughness: 0.8 });
    const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(100, 300), groundMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.5;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);
    
    // Pista
    createTrack3D();
    
    // Obstáculos
    createObstacles3D();
    
    // Árvores
    createTrees3D();
    
    // Animação
    animate3D();
    
    window.addEventListener('resize', onWindowResize3D);
}

function createTrack3D() {
    trackGroup = new THREE.Group();
    
    const asphaltMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4 });
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffdd88 });
    const edgeMat = new THREE.MeshStandardMaterial({ color: 0xaa8866 });
    
    for (let z = -ROAD_LENGTH/2; z < ROAD_LENGTH/2; z += 1.5) {
        const offsetX = Math.sin(z * 0.08) * 1.5;
        
        // Asfalto
        const road = new THREE.Mesh(new THREE.BoxGeometry(ROAD_WIDTH, 0.1, 1.2), asphaltMat);
        road.position.set(offsetX, -0.3, z);
        road.castShadow = true;
        road.receiveShadow = true;
        trackGroup.add(road);
        
        // Linha central
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 1), lineMat);
        line.position.set(offsetX, -0.2, z);
        trackGroup.add(line);
        
        // Bordas
        const leftEdge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 1.2), edgeMat);
        leftEdge.position.set(offsetX - ROAD_WIDTH/2 - 0.15, -0.25, z);
        trackGroup.add(leftEdge);
        
        const rightEdge = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 1.2), edgeMat);
        rightEdge.position.set(offsetX + ROAD_WIDTH/2 + 0.15, -0.25, z);
        trackGroup.add(rightEdge);
    }
    
    scene.add(trackGroup);
}

function createTrees3D() {
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B });
    const foliageMat = new THREE.MeshStandardMaterial({ color: 0x4CAF50 });
    
    for (let z = -70; z < 70; z += 6) {
        const offsetX = Math.sin(z * 0.08) * 2;
        
        const leftPos = { x: offsetX - 4, z: z };
        const rightPos = { x: offsetX + 4, z: z };
        
        [leftPos, rightPos].forEach(pos => {
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 1, 6), trunkMat);
            trunk.position.y = 0.5;
            trunk.castShadow = true;
            tree.add(trunk);
            
            const foliage = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.9, 8), foliageMat);
            foliage.position.y = 1.1;
            foliage.castShadow = true;
            tree.add(foliage);
            
            tree.position.set(pos.x, -0.3, pos.z);
            scene.add(tree);
        });
    }
}

function createObstacles3D() {
    const types = [
        { name: 'Pedra', geo: new THREE.DodecahedronGeometry(0.35), color: 0x888888, y: -0.2 },
        { name: 'Tronco', geo: new THREE.CylinderGeometry(0.35, 0.4, 0.6, 8), color: 0x8B4513, y: -0.1 },
        { name: 'Galho', geo: new THREE.BoxGeometry(0.7, 0.2, 0.3), color: 0x654321, y: -0.25 }
    ];
    
    for (let i = 0; i < 30; i++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const mat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.7 });
        const mesh = new THREE.Mesh(type.geo, mat);
        mesh.position.y = type.y;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData = { active: false, type: type.name, damage: type.name === 'Pedra' ? 15 : 10 };
        mesh.visible = false;
        scene.add(mesh);
        obstacles3d.push(mesh);
    }
}

function createCar3D(color = 0xff6b35) {
    const carGroup = new THREE.Group();
    
    // Corpo
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 1.2), new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.6 }));
    body.position.y = 0.2;
    body.castShadow = true;
    carGroup.add(body);
    
    // Teto
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.8), new THREE.MeshStandardMaterial({ color: 0x8B4513 }));
    roof.position.y = 0.45;
    roof.castShadow = true;
    carGroup.add(roof);
    
    // Rodas
    const wheelGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.1, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
    const wheelPos = [[-0.45, 0.1, -0.55], [0.45, 0.1, -0.55], [-0.45, 0.1, 0.55], [0.45, 0.1, 0.55]];
    
    wheelPos.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.castShadow = true;
        carGroup.add(wheel);
    });
    
    return carGroup;
}

function startGame3D() {
    if (gameActive3D) return;
    
    init3D();
    
    // Criar carro do jogador
    carMesh = createCar3D(0xff6b35);
    carMesh.position.set(0, -0.1, 0);
    scene.add(carMesh);
    
    gameActive3D = true;
    
    // Mostrar HUD
    document.getElementById('gameHud').style.display = 'block';
    document.getElementById('raceControls').style.display = 'flex';
}

function stopGame3D() {
    gameActive3D = false;
    
    // Limpar cena
    if (carMesh) scene.remove(carMesh);
    if (trackGroup) scene.remove(trackGroup);
    
    // Esconder HUD
    document.getElementById('gameHud').style.display = 'none';
    document.getElementById('raceControls').style.display = 'none';
    
    // Recriar cena
    scene = null;
    renderer = null;
}

function updateGame3DVisuals() {
    if (!gameActive3D || !carMesh) return;
    
    // Atualizar posição do carro
    const carZ = -playerCar.distancia * 0.08;
    const carX = (playerCar.x - 400) / 60;
    carMesh.position.x = carX;
    carMesh.position.z = carZ;
    
    // Inclinação nas curvas
    carMesh.rotation.z = -carX * 0.2;
    
    // Atualizar câmera
    const targetCamPos = {
        x: carX * 0.5,
        y: 4 + Math.abs(carX) * 0.5,
        z: carZ + 8
    };
    camera.position.x += (targetCamPos.x - camera.position.x) * 0.05;
    camera.position.y += (targetCamPos.y - camera.position.y) * 0.05;
    camera.position.z += (targetCamPos.z - camera.position.z) * 0.05;
    camera.lookAt(carMesh.position);
    
    // Atualizar obstáculos
    updateObstacles3DVisuals();
    
    // Atualizar outros jogadores
    updateOtherPlayers3DVisuals();
    
    // Atualizar UI
    updateRaceUI3D();
}

function updateObstacles3DVisuals() {
    // Gerar obstáculos
    if (Math.random() < 0.02 && gameActive3D) {
        const inactiveObs = obstacles3d.find(obs => !obs.userData.active);
        if (inactiveObs) {
            const trackX = Math.sin(Date.now() * 0.003) * 1.5;
            inactiveObs.position.x = trackX + (Math.random() - 0.5) * 2.5;
            inactiveObs.position.z = 25;
            inactiveObs.userData.active = true;
            inactiveObs.visible = true;
        }
    }
    
    // Mover obstáculos
    obstacles3d.forEach(obs => {
        if (obs.userData.active) {
            obs.position.z -= playerCar.velocidade * 0.025;
            
            // Verificar colisão
            if (!invincible && obs.userData.active && Math.abs(obs.position.x - carMesh.position.x) < 0.6 && 
                Math.abs(obs.position.z - carMesh.position.z) < 1) {
                playerCar.durability -= obs.userData.damage;
                invincible = true;
                invincibleTimer = 0.8;
                obs.userData.active = false;
                obs.visible = false;
                
                if (playerCar.durability <= 0) {
                    gameOver = true;
                    raceActive = false;
                    showRaceResult();
                }
            }
            
            if (obs.position.z < -20) {
                obs.userData.active = false;
                obs.visible = false;
            }
        }
    });
}

function updateOtherPlayers3DVisuals() {
    // Limpar carros antigos
    for (let [name, car] of Object.entries(otherCars || {})) {
        if (!otherPlayers[name] && car.parent) scene.remove(car);
    }
    
    if (!otherCars) otherCars = {};
    
    for (let [name, other] of Object.entries(otherPlayers)) {
        if (!otherCars[name]) {
            const otherColor = Math.abs(hashCode(name) % 360);
            otherCars[name] = createCar3D(`hsl(${otherColor}, 70%, 55%)`);
            scene.add(otherCars[name]);
        }
        
        if (otherCars[name]) {
            const zPos = (other.distancia - playerCar.distancia) * 0.08;
            const xPos = (other.x - 400) / 60;
            otherCars[name].position.set(xPos, -0.1, Math.min(12, Math.max(-12, zPos)));
        }
    }
}

function updateRaceUI3D() {
    document.getElementById('distanceDisplay').textContent = Math.floor(playerCar.distancia);
    document.getElementById('speedDisplay').textContent = Math.floor(playerCar.velocidade);
    document.getElementById('durabilityDisplay').textContent = Math.max(0, Math.floor(playerCar.durability));
    
    let position = 1;
    for (let [name, other] of Object.entries(otherPlayers)) {
        if (other.distancia > playerCar.distancia) position++;
    }
    document.getElementById('positionDisplay').textContent = position;
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
