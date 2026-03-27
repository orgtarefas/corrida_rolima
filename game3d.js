// ==================== MOTOR 3D ====================

let scene, camera, renderer, carMesh;
let obstacles3d = [];
let gameActive3D = false;
let animFrame = null;

// Inicializa o ambiente 3D
function init3D(distance) {
    raceDistanceTotal = distance;
    let container = document.getElementById('canvas-container');
    while (container.firstChild) container.removeChild(container.firstChild);
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a1a2a);
    scene.fog = new THREE.FogExp2(0x0a1a2a, 0.008);
    
    camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2.5, 5);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    // Iluminação
    const ambientLight = new THREE.AmbientLight(0x404060);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffeedd, 1);
    dirLight.position.set(5, 10, 7);
    dirLight.castShadow = true;
    scene.add(dirLight);
    
    // Pista
    const roadMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.6 });
    const roadPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 200, 1, 20), roadMat);
    roadPlane.rotation.x = -Math.PI / 2;
    roadPlane.position.set(0, -0.2, -100);
    roadPlane.receiveShadow = true;
    scene.add(roadPlane);
    
    // Linha central
    const lineMat = new THREE.MeshStandardMaterial({ color: 0xffcc88 });
    for (let i = -100; i < 0; i += 2) {
        const line = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.3), lineMat);
        line.position.set(0, -0.15, i);
        scene.add(line);
    }
    
    // Árvores
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8B5A2B });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x5a9e4e });
    for (let z = -80; z < 20; z += 4) {
        [-2.8, 2.8].forEach(x => {
            const tree = new THREE.Group();
            const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.2, 5), trunkMat);
            trunk.position.y = 0.6;
            tree.add(trunk);
            const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.5, 0.9, 6), leafMat);
            leaf.position.y = 1.2;
            tree.add(leaf);
            tree.position.set(x, -0.2, z);
            scene.add(tree);
        });
    }
    
    // Obstáculos
    for (let i = 0; i < 25; i++) {
        const geo = new THREE.DodecahedronGeometry(0.35);
        const mat = new THREE.MeshStandardMaterial({ color: 0xaa8866 });
        const obs = new THREE.Mesh(geo, mat);
        obs.castShadow = true;
        obs.visible = false;
        obs.userData = { active: false, damage: 12 };
        scene.add(obs);
        obstacles3d.push(obs);
    }
    
    // Carro
    const carGroup = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.4, 1.4),
        new THREE.MeshStandardMaterial({ color: 0xff6b35, metalness: 0.6 }));
    body.position.y = 0.2;
    carGroup.add(body);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.9),
        new THREE.MeshStandardMaterial({ color: 0xcc8844 }));
    roof.position.y = 0.5;
    carGroup.add(roof);
    const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.12, 12);
    const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    [[-0.6, 0.12, -0.6], [0.6, 0.12, -0.6], [-0.6, 0.12, 0.6], [0.6, 0.12, 0.6]].forEach(pos => {
        const w = new THREE.Mesh(wheelGeo, wheelMat);
        w.rotation.z = Math.PI / 2;
        w.position.set(pos[0], pos[1], pos[2]);
        carGroup.add(w);
    });
    scene.add(carGroup);
    carMesh = carGroup;
    
    gameActive3D = true;
    startAnimation();
    
    // Mostrar HUD
    document.getElementById('gameHud').style.display = 'block';
    document.getElementById('raceControls').style.display = 'flex';
    document.getElementById('totalDistanceDisplay').innerText = raceDistanceTotal;
}

// Animação
function startAnimation() {
    if (animFrame) cancelAnimationFrame(animFrame);
    
    function animate() {
        if (!gameActive3D) return;
        
        if (raceActive && !gameOver && raceStarted) {
            updateGame3D();
        }
        
        if (carMesh && camera) {
            const targetZ = -playerCar.distancia * 0.045;
            const targetX = playerCar.x * 1.2;
            carMesh.position.x += (targetX - carMesh.position.x) * 0.15;
            carMesh.position.z = targetZ;
            carMesh.position.y = 0.12 + Math.sin(Date.now() * 0.015) * 0.02;
            carMesh.rotation.z = -carMesh.position.x * 0.15;
            
            camera.position.x += (carMesh.position.x * 0.25 - camera.position.x) * 0.1;
            camera.position.y = 2.2 + playerCar.velocidade * 0.002;
            camera.position.z = 5 + playerCar.velocidade * 0.004;
            camera.lookAt(carMesh.position.x, 0.2, carMesh.position.z - 3);
        }
        
        renderer.render(scene, camera);
        animFrame = requestAnimationFrame(animate);
    }
    animate();
}

// Atualiza o jogo (obstáculos, UI)
function updateGame3D() {
    // Atualizar UI
    document.getElementById('distanceDisplay').innerText = Math.floor(playerCar.distancia);
    document.getElementById('speedDisplay').innerText = Math.floor(playerCar.velocidade);
    document.getElementById('durabilityDisplay').innerText = Math.max(0, Math.floor(playerCar.durability));
    document.getElementById('remainingDisplay').innerText = Math.max(0, Math.floor(raceDistanceTotal - playerCar.distancia));
    
    // Gerar obstáculos
    if (Math.random() < 0.018 && raceStarted && !gameOver) {
        const inactive = obstacles3d.find(o => !o.userData.active);
        if (inactive) {
            inactive.position.x = (Math.random() - 0.5) * 3.2;
            inactive.position.z = -28;
            inactive.userData.active = true;
            inactive.visible = true;
        }
    }
    
    // Mover obstáculos e verificar colisões
    obstacles3d.forEach(obs => {
        if (obs.userData.active) {
            obs.position.z += playerCar.velocidade * 0.032;
            
            if (!invincible && carMesh &&
                Math.abs(obs.position.x - carMesh.position.x) < 0.8 &&
                Math.abs(obs.position.z - carMesh.position.z) < 1.3) {
                playerCar.durability -= obs.userData.damage;
                invincible = true;
                invincibleTimer = 0.6;
                obs.userData.active = false;
                obs.visible = false;
                
                if (playerCar.durability <= 0) {
                    gameOver = true;
                    raceActive = false;
                    finishRace();
                }
            }
            
            if (obs.position.z > 12) {
                obs.userData.active = false;
                obs.visible = false;
            }
        }
    });
    
    if (invincible) {
        invincibleTimer -= 0.016;
        if (invincibleTimer <= 0) invincible = false;
    }
}

// Para o jogo 3D
function stopGame3D() {
    gameActive3D = false;
    if (animFrame) cancelAnimationFrame(animFrame);
    const container = document.getElementById('canvas-container');
    if (container) container.innerHTML = '';
    document.getElementById('gameHud').style.display = 'none';
    document.getElementById('raceControls').style.display = 'none';
}