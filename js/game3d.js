// ==================== JOGO 3D COM THREE.JS ====================

import * as THREE from 'three';

let scene, camera, renderer;
let track, car, obstacles3d = [];
let otherCars = {};
let gameActive = false;

// Configurações da câmera
const CAMERA_OFFSET = new THREE.Vector3(-5, 3, 8);

function init3D() {
    const container = document.getElementById('canvas-container');
    
    // Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 50, 100);
    
    // Câmera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Iluminação
    setupLighting();
    
    // Pista
    createTrack();
    
    // Obstáculos iniciais
    createInitialObstacles();
    
    // Animação
    animate();
    
    // Redimensionamento
    window.addEventListener('resize', onWindowResize);
}

function setupLighting() {
    // Luz ambiente
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);
    
    // Luz direcional (sol)
    const directionalLight = new THREE.DirectionalLight(0xfff5e6, 1);
    directionalLight.position.set(10, 20, 5);
    directionalLight.castShadow = true;
    directionalLight.receiveShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Luz de preenchimento
    const fillLight = new THREE.PointLight(0x4466cc, 0.3);
    fillLight.position.set(-5, 5, 5);
    scene.add(fillLight);
    
    // Luz de fundo
    const backLight = new THREE.PointLight(0xffaa66, 0.2);
    backLight.position.set(0, 5, -10);
    scene.add(backLight);
    
    // Grama/Chão
    const groundPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(100, 200),
        new THREE.MeshStandardMaterial({ color: 0x3a6b3a, roughness: 0.8, metalness: 0.1 })
    );
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = -0.5;
    groundPlane.receiveShadow = true;
    scene.add(groundPlane);
}

function createTrack() {
    track = new THREE.Group();
    
    // Pista principal
    const trackWidth = 6;
    const trackLength = 150;
    const trackCurve = 2;
    
    // Criar segmentos da pista
    for (let z = -trackLength/2; z < trackLength/2; z += 2) {
        const offsetX = Math.sin(z * 0.1) * trackCurve;
        
        // Asfalto
        const road = new THREE.Mesh(
            new THREE.BoxGeometry(trackWidth, 0.2, 2),
            new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.4, metalness: 0.1 })
        );
        road.position.set(offsetX, -0.3, z);
        road.castShadow = true;
        road.receiveShadow = true;
        track.add(road);
        
        // Faixa central
        const line = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.25, 1.5),
            new THREE.MeshStandardMaterial({ color: 0xffdd88, emissive: 0x442200 })
        );
        line.position.set(offsetX, -0.15, z);
        track.add(line);
        
        // Bordas
        const leftEdge = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.2, 2),
            new THREE.MeshStandardMaterial({ color: 0xaa8866 })
        );
        leftEdge.position.set(offsetX - trackWidth/2 - 0.15, -0.25, z);
        track.add(leftEdge);
        
        const rightEdge = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.2, 2),
            new THREE.MeshStandardMaterial({ color: 0xaa8866 })
        );
        rightEdge.position.set(offsetX + trackWidth/2 + 0.15, -0.25, z);
        track.add(rightEdge);
    }
    
    scene.add(track);
    
    // Árvores ao longo da pista
    for (let z = -70; z < 70; z += 8) {
        const offsetX = Math.sin(z * 0.1) * 3;
        
        const treePositions = [
            { x: offsetX - 5, z: z, size: 1.2 },
            { x: offsetX + 5, z: z, size: 1.5 }
        ];
        
        treePositions.forEach(pos => {
            const treeGroup = new THREE.Group();
            
            // Tronco
            const trunk = new THREE.Mesh(
                new THREE.CylinderGeometry(0.5, 0.6, 1.2, 6),
                new THREE.MeshStandardMaterial({ color: 0x8B5A2B, roughness: 0.7 })
            );
            trunk.position.y = 0.6;
            trunk.castShadow = true;
            treeGroup.add(trunk);
            
            // Copa
            const foliage1 = new THREE.Mesh(
                new THREE.ConeGeometry(0.8, 1, 8),
                new THREE.MeshStandardMaterial({ color: 0x4CAF50, roughness: 0.5 })
            );
            foliage1.position.y = 1.2;
            foliage1.castShadow = true;
            treeGroup.add(foliage1);
            
            const foliage2 = new THREE.Mesh(
                new THREE.ConeGeometry(0.6, 0.8, 8),
                new THREE.MeshStandardMaterial({ color: 0x5CB85C, roughness: 0.5 })
            );
            foliage2.position.y = 1.8;
            foliage2.castShadow = true;
            treeGroup.add(foliage2);
            
            treeGroup.position.set(pos.x, -0.3, pos.z);
            scene.add(treeGroup);
        });
    }
}

function createInitialObstacles() {
    // Obstáculos serão gerados dinamicamente
    for (let i = 0; i < 20; i++) {
        const obs = createObstacle3D('Pedra');
        obs.userData = { type: 'Pedra', damage: 15, active: false };
        scene.add(obs);
        obstacles3d.push(obs);
    }
}

function createObstacle3D(type) {
    let geometry, material, mesh;
    
    switch(type) {
        case 'Pedra':
            geometry = new THREE.DodecahedronGeometry(0.4);
            material = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8, metalness: 0.1 });
            mesh = new THREE.Mesh(geometry, material);
            break;
        case 'Buraco':
            geometry = new THREE.CylinderGeometry(0.5, 0.6, 0.2, 8);
            material = new THREE.MeshStandardMaterial({ color: 0x4a2c1a, roughness: 0.9 });
            mesh = new THREE.Mesh(geometry, material);
            mesh.rotation.x = Math.PI / 2;
            break;
        case 'Tronco':
            geometry = new THREE.CylinderGeometry(0.4, 0.45, 0.8, 8);
            material = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
            mesh = new THREE.Mesh(geometry, material);
            break;
        default:
            geometry = new THREE.BoxGeometry(0.6, 0.3, 0.6);
            material = new THREE.MeshStandardMaterial({ color: 0xCD853F });
            mesh = new THREE.Mesh(geometry, material);
    }
    
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
}

function createCar3D(color = 0xff6b35) {
    const carGroup = new THREE.Group();
    
    // Corpo
    const bodyGeo = new THREE.BoxGeometry(0.8, 0.4, 1.2);
    const bodyMat = new THREE.MeshStandardMaterial({ color: color, roughness: 0.3, metalness: 0.7 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.2;
    body.castShadow = true;
    carGroup.add(body);
    
    // Teto/Banco
    const roofGeo = new THREE.BoxGeometry(0.6, 0.3, 0.8);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = 0.45;
    roof.castShadow = true;
    carGroup.add(roof);
    
    // Rodas
    const wheelGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 });
    
    const positions = [[-0.5, 0.1, -0.5], [0.5, 0.1, -0.5], [-0.5, 0.1, 0.5], [0.5, 0.1, 0.5]];
    positions.forEach(pos => {
        const wheel = new THREE.Mesh(wheelGeo, wheelMat);
        wheel.rotation.z = Math.PI / 2;
        wheel.position.set(pos[0], pos[1], pos[2]);
        wheel.castShadow = true;
        carGroup.add(wheel);
    });
    
    return carGroup;
}

function updateCamera() {
    if (!car) return;
    
    // Câmera segue o carro
    const targetPosition = car.position.clone().add(CAMERA_OFFSET);
    camera.position.lerp(targetPosition, 0.05);
    camera.lookAt(car.position);
}

function updateObstacles3D() {
    // Atualizar posição dos obstáculos
    obstacles3d.forEach(obs => {
        if (obs.userData.active) {
            obs.position.z -= playerCar.velocidade * 0.02;
            
            if (obs.position.z < -20) {
                obs.userData.active = false;
                obs.visible = false;
            }
        }
    });
    
    // Gerar novos obstáculos
    if (Math.random() < 0.02 && gameActive) {
        const types = ['Pedra', 'Buraco', 'Tronco'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        const inactiveObs = obstacles3d.find(obs => !obs.userData.active);
        if (inactiveObs) {
            const trackPos = Math.sin(Date.now() * 0.003) * 2;
            inactiveObs.position.set(trackPos + (Math.random() - 0.5) * 3, -0.2, 30);
            inactiveObs.userData = { type: type, damage: type === 'Buraco' ? 25 : (type === 'Pedra' ? 15 : 12), active: true };
            inactiveObs.visible = true;
            
            // Atualizar aparência
            const newMesh = createObstacle3D(type);
            inactiveObs.geometry.dispose();
            inactiveObs.geometry = newMesh.geometry;
            inactiveObs.material = newMesh.material;
        }
    }
}

function updateOtherPlayers3D() {
    for (let [name, other] of Object.entries(otherPlayers)) {
        if (!otherCars[name]) {
            const otherColor = Math.abs(hashCode(name) % 360);
            otherCars[name] = createCar3D(`hsl(${otherColor}, 70%, 55%)`);
            scene.add(otherCars[name]);
        }
        
        if (otherCars[name]) {
            const zPos = (other.distancia - playerCar.distancia) * 0.5;
            otherCars[name].position.set(other.x / 50 - 4, -0.1, Math.min(15, Math.max(-15, zPos)));
        }
    }
}

function updateRaceUI() {
    document.getElementById('distanceDisplay').textContent = Math.floor(playerCar.distancia);
    document.getElementById('speedDisplay').textContent = Math.floor(playerCar.velocidade);
    document.getElementById('durabilityDisplay').textContent = Math.max(0, Math.floor(playerCar.durability));
    
    let position = 1;
    for (let [name, other] of Object.entries(otherPlayers)) {
        if (other.distancia > playerCar.distancia) position++;
    }
    document.getElementById('positionDisplay').textContent = position;
}

function animate() {
    if (!gameActive) {
        requestAnimationFrame(animate);
        if (renderer) renderer.render(scene, camera);
        return;
    }
    
    // Atualizar posição do carro
    if (car) {
        const speedEffect = playerCar.velocidade / 380;
        const turnSpeed = (playerCar.x - 400) / 50;
        
        car.position.x = (playerCar.x - 400) / 50;
        car.position.z = -playerCar.distancia * 0.1;
        
        // Inclinação nas curvas
        car.rotation.z = -turnSpeed * 0.3;
        car.rotation.x = Math.sin(Date.now() * 0.01) * 0.05;
        
        // Efeito de velocidade (partículas)
        if (playerCar.velocidade > 150) {
            // Efeito visual de velocidade
        }
    }
    
    updateObstacles3D();
    updateOtherPlayers3D();
    updateCamera();
    updateRaceUI();
    
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}

function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

function startGame3D() {
    init3D();
    car = createCar3D(0xff6b35);
    car.position.set(0, -0.1, 0);
    scene.add(car);
    gameActive = true;
    
    // Mostrar HUD
    document.getElementById('gameHud').style.display = 'block';
    document.getElementById('raceControls').style.display = 'flex';
}

function stopGame3D() {
    gameActive = false;
    document.getElementById('gameHud').style.display = 'none';
    document.getElementById('raceControls').style.display = 'none';
}

// Exportar funções
window.startGame3D = startGame3D;
window.stopGame3D = stopGame3D;
window.init3D = init3D;