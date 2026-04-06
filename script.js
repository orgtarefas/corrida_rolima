import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';

// ==================== CONFIGURAÇÃO ====================
const modeloPath = './models/car1/car1.obj';
const mtlPath = './models/car1/car1.mtl';  // Se tiver arquivo MTL

// ==================== CENA ====================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x111122);
scene.fog = new THREE.Fog(0x111122, 10, 30);

// ==================== CÂMERA ====================
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(4, 3, 5);
camera.lookAt(0, 0.5, 0);

// ==================== RENDERIZADOR ====================
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// ==================== CONTROLES ====================
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.5;
controls.enableZoom = true;
controls.enablePan = true;
controls.target.set(0, 0.5, 0);

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

// ==================== LUZES ====================

// Luz ambiente
const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
scene.add(ambientLight);

// Luz principal (direcional)
const mainLight = new THREE.DirectionalLight(0xffffff, 1);
mainLight.position.set(5, 10, 7);
mainLight.castShadow = true;
mainLight.receiveShadow = true;
mainLight.shadow.mapSize.width = 1024;
mainLight.shadow.mapSize.height = 1024;
scene.add(mainLight);

// Luz de preenchimento (lateral)
const fillLight = new THREE.PointLight(0x4466cc, 0.4);
fillLight.position.set(-2, 3, 4);
scene.add(fillLight);

// Luz traseira
const backLight = new THREE.PointLight(0xffaa66, 0.3);
backLight.position.set(0, 2, -5);
scene.add(backLight);

// Luz superior
const topLight = new THREE.PointLight(0xffffff, 0.3);
topLight.position.set(0, 5, 0);
scene.add(topLight);

// ==================== CHÃO E REFERÊNCIA ====================

// Grid (grade no chão)
const gridHelper = new THREE.GridHelper(10, 20, 0x888888, 0x444444);
gridHelper.position.y = -0.5;
scene.add(gridHelper);

// Plano de sombra
const shadowPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(8, 8),
    new THREE.ShadowMaterial({ opacity: 0.3, color: 0x000000, transparent: true, side: THREE.DoubleSide })
);
shadowPlane.rotation.x = -Math.PI / 2;
shadowPlane.position.y = -0.5;
shadowPlane.receiveShadow = true;
scene.add(shadowPlane);

// ==================== FUNÇÃO PARA CARREGAR O MODELO ====================

function carregarModelo() {
    const infoDiv = document.getElementById('info');
    
    // Verificar se existe arquivo MTL
    fetch(mtlPath, { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                // Carregar com MTL
                carregarComMTL();
            } else {
                // Carregar só OBJ
                carregarSemMTL();
            }
        })
        .catch(() => {
            carregarSemMTL();
        });
}

function carregarComMTL() {
    console.log('📁 Carregando com MTL...');
    
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('./models/car1/');
    mtlLoader.setTexturePath('./models/car1/textures/');
    
    mtlLoader.load(mtlPath, (materials) => {
        materials.preload();
        
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.setPath('./models/car1/');
        
        objLoader.load(modeloPath, 
            (object) => {
                console.log('✅ Modelo carregado com sucesso!');
                finalizarModelo(object);
            },
            (progress) => {
                const percent = (progress.loaded / progress.total * 100).toFixed(0);
                document.getElementById('info').innerHTML = `🚗 Carregando: ${percent}%`;
            },
            (error) => {
                console.error('Erro:', error);
                mostrarErro();
            }
        );
    }, undefined, (error) => {
        console.warn('Erro no MTL:', error);
        carregarSemMTL();
    });
}

function carregarSemMTL() {
    console.log('📁 Carregando apenas OBJ...');
    
    const objLoader = new OBJLoader();
    objLoader.setPath('./models/car1/');
    
    objLoader.load(modeloPath,
        (object) => {
            console.log('✅ Modelo carregado com sucesso!');
            finalizarModelo(object);
        },
        (progress) => {
            const percent = (progress.loaded / progress.total * 100).toFixed(0);
            document.getElementById('info').innerHTML = `🚗 Carregando: ${percent}%`;
        },
        (error) => {
            console.error('Erro:', error);
            mostrarErro();
        }
    );
}

function finalizarModelo(object) {
    // Calcular bounding box para ajuste automático
    const box = new THREE.Box3().setFromObject(object);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    
    // Ajustar escala (altura alvo = 2.5 unidades)
    const targetSize = 2.5;
    const scale = targetSize / maxDim;
    object.scale.set(scale, scale, scale);
    
    // Centralizar e posicionar
    object.position.set(
        -center.x * scale,
        -center.y * scale + 0.2,
        -center.z * scale
    );
    
    // Habilitar sombras e ajustar materiais
    object.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Se não tiver material (caso não tenha MTL), cria um material padrão
            if (!child.material) {
                child.material = new THREE.MeshStandardMaterial({
                    color: 0xcc3333,
                    roughness: 0.4,
                    metalness: 0.6
                });
            }
        }
    });
    
    scene.add(object);
    
    // Atualizar informação na tela
    const infoDiv = document.getElementById('info');
    infoDiv.innerHTML = `✅ Carro carregado!<br>📏 Tamanho: ${maxDim.toFixed(2)}m | Escala: ${scale.toFixed(2)}x`;
    infoDiv.style.background = 'rgba(0,100,0,0.8)';
    
    // Remover mensagem de erro se existir
    const errorMsg = document.querySelector('.error-message');
    if (errorMsg) errorMsg.remove();
}

function mostrarErro() {
    const infoDiv = document.getElementById('info');
    infoDiv.innerHTML = '❌ Erro ao carregar o modelo!<br>Verifique o console (F12)';
    infoDiv.style.background = 'rgba(255,0,0,0.8)';
    
    // Criar mensagem detalhada
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <h3>❌ Erro ao carregar o modelo</h3>
        <p>Verifique se:</p>
        <ul style="text-align: left;">
            <li>O arquivo está em: <strong>models/car1/car1.obj</strong></li>
            <li>Você está usando um servidor local (Live Server)</li>
            <li>As texturas estão na pasta <strong>models/car1/textures/</strong></li>
        </ul>
        <button onclick="location.reload()" style="margin-top:10px; padding:8px 20px; cursor:pointer;">🔄 Tentar Novamente</button>
    `;
    document.body.appendChild(errorDiv);
}

// ==================== ANIMAÇÃO ====================

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();

// ==================== REDIMENSIONAMENTO ====================

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==================== INICIAR ====================
carregarModelo();

console.log('🚀 Sistema 3D inicializado');
