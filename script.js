import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ========== INICIALIZAÇÃO ==========
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xE8F0F8); // Fundo claro azulado
scene.fog = new THREE.FogExp2(0xE8F0F8, 0.008); // Névoa clara

// Câmera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(5, 2.5, 6);
camera.lookAt(0, 0.2, 0);

// Renderizador
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Controles
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.2;
controls.enableZoom = true;
controls.enablePan = true;
controls.target.set(0, 0.2, 0);

// Parar rotação automática quando o usuário interagir
let autoRotateTimeout;
controls.addEventListener('start', () => {
    controls.autoRotate = false;
    clearTimeout(autoRotateTimeout);
});
controls.addEventListener('end', () => {
    autoRotateTimeout = setTimeout(() => {
        controls.autoRotate = true;
    }, 3000);
});

// ========== LUZES (AMBIENTE CLARO) ==========

// Luz ambiente forte para clarear tudo
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);

// Luz principal direcional (sol)
const mainLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
mainLight.position.set(5, 10, 7);
mainLight.castShadow = true;
mainLight.receiveShadow = true;
mainLight.shadow.mapSize.width = 1024;
mainLight.shadow.mapSize.height = 1024;
mainLight.shadow.camera.near = 0.5;
mainLight.shadow.camera.far = 15;
mainLight.shadow.camera.left = -5;
mainLight.shadow.camera.right = 5;
mainLight.shadow.camera.top = 5;
mainLight.shadow.camera.bottom = -5;
scene.add(mainLight);

// Luz de preenchimento frontal (clareia a frente)
const frontLight = new THREE.PointLight(0xffffff, 0.6);
frontLight.position.set(0, 2, 5);
scene.add(frontLight);

// Luz lateral direita (quente)
const rightLight = new THREE.PointLight(0xffaa88, 0.5);
rightLight.position.set(4, 2, 2);
scene.add(rightLight);

// Luz lateral esquerda (fria)
const leftLight = new THREE.PointLight(0x88aaff, 0.5);
leftLight.position.set(-4, 2, 2);
scene.add(leftLight);

// Luz traseira
const backLight = new THREE.PointLight(0xffaa66, 0.4);
backLight.position.set(0, 1.5, -5);
scene.add(backLight);

// Luz de topo
const topLight = new THREE.PointLight(0xffffff, 0.4);
topLight.position.set(0, 5, 0);
scene.add(topLight);

// ========== CHÃO E REFERÊNCIA ==========

// Chão claro com sombra
const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xE0E8F0,
    roughness: 0.6,
    metalness: 0.1,
    transparent: true,
    opacity: 0.8
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.25;
floor.receiveShadow = true;
scene.add(floor);

// Grade de referência (mais clara)
const gridHelper = new THREE.GridHelper(12, 20, 0x88aacc, 0xaabbcc);
gridHelper.position.y = -0.24;
scene.add(gridHelper);

// Plano de sombra para o carro
const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.ShadowMaterial({ opacity: 0.5, color: 0x000000, transparent: true, side: THREE.DoubleSide })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.24;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// ========== CARREGAR CARRO ==========
const loader = new GLTFLoader();
const loadingDiv = document.getElementById('loading');
let carModel = null;

loader.load('./models/car1/car1.glb',
    (gltf) => {
        carModel = gltf.scene;
        
        // Calcular bounding box para ajuste automático
        const box = new THREE.Box3().setFromObject(carModel);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        
        // Ajustar escala (tamanho adequado para a cena)
        const targetHeight = 1.2;
        const scale = targetHeight / maxDim;
        carModel.scale.set(scale, scale, scale);
        
        // POSICIONAR NO CHÃO
        // O chão está em Y = -0.25, ajustamos para que as rodas toquem o chão
        carModel.position.set(
            -center.x * scale,
            -center.y * scale + 0.01,
            -center.z * scale
        );
        
        // Habilitar sombras em todas as partes do carro
        carModel.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        
        scene.add(carModel);
        
        // Esconder loading
        loadingDiv.classList.add('hidden');
        
        console.log('✅ Carro carregado com sucesso!');
        console.log(`📏 Dimensões originais: ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`);
        console.log(`🔍 Escala aplicada: ${scale.toFixed(3)}x`);
        console.log(`📍 Posição final: Y = ${(-center.y * scale + 0.01).toFixed(3)}`);
    },
    (progress) => {
        if (progress.total) {
            const percent = Math.round(progress.loaded / progress.total * 100);
            const loadingDiv = document.getElementById('loading');
            if (loadingDiv) {
                const p = loadingDiv.querySelector('p');
                if (p) p.textContent = `Carregando modelo 3D... ${percent}%`;
            }
            console.log(`Carregando: ${percent}%`);
        }
    },
    (error) => {
        console.error('❌ Erro ao carregar o modelo:', error);
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.innerHTML = `
                <div class="spinner"></div>
                <p>❌ Erro ao carregar o modelo!</p>
                <p style="font-size:12px; margin-top:10px;">Verifique se o arquivo está em:<br>models/car1/car1.glb</p>
            `;
            loadingDiv.style.background = 'rgba(255,0,0,0.85)';
        }
    }
);

// ========== ANIMAÇÃO ==========
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

// ========== REDIMENSIONAMENTO ==========
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ========== INFORMAÇÕES NO CONSOLE ==========
console.log('🚀 Sistema 3D inicializado com ambiente claro!');
console.log('📁 Caminho do modelo: ./models/car1/car1.glb');
console.log('💡 Luzes configuradas para ambiente claro');
console.log('📍 Carro será posicionado automaticamente no chão');
