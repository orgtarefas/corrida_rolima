import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { database, ref, set, get, update, onValue } from './firebase-config.js';

// ==================== CONFIGURAÇÃO DO CARRO ====================
const carro = {
    id: 'carro1',
    nome: '🔥 Fúria Vermelha',
    caminhoGLB: './models/car1/car1.glb',
    stats: {
        velocidade: 85,
        controle: 70,
        durabilidade: 65,
        aceleracao: 90
    }
};

// Variáveis globais
let scene, camera, renderer, controls;
let currentCar = null;
let faroisLigados = false;
let farolLuz = null;
let playerId = 'jogador_default';
let playerData = {
    pontos: 100,
    vitorias: 0,
    carroSelecionado: 'carro1'
};

// ==================== CENA 3D ====================
function init3D() {
    const container = document.getElementById('canvas-container');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122); // Fundo mais claro
    scene.fog = new THREE.FogExp2(0x111122, 0.005);
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 2.5, 6);
    camera.lookAt(0, 0, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x1a1a2e, 1);
    container.appendChild(renderer.domElement);
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.0;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.target.set(0, 0.3, 0);
    
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
    
    // ========== ILUMINAÇÃO MELHORADA (MAIS CLARA) ==========
    
    // Luz ambiente mais forte
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    
    // Luz principal (sol) mais forte
    const mainLight = new THREE.DirectionalLight(0xfff5e0, 1.5);
    mainLight.position.set(5, 8, 4);
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
    
    // Luz de preenchimento frontal
    const fillLight = new THREE.PointLight(0x88aaff, 0.6);
    fillLight.position.set(0, 2, 5);
    scene.add(fillLight);
    
    // Luz lateral direita
    const rightLight = new THREE.PointLight(0xffaa66, 0.5);
    rightLight.position.set(4, 2, 2);
    scene.add(rightLight);
    
    // Luz lateral esquerda
    const leftLight = new THREE.PointLight(0x66ccff, 0.5);
    leftLight.position.set(-4, 2, 2);
    scene.add(leftLight);
    
    // Luz traseira
    const backLight = new THREE.PointLight(0xff6633, 0.4);
    backLight.position.set(0, 1.5, -5);
    scene.add(backLight);
    
    // Luz de topo
    const topLight = new THREE.PointLight(0xffffff, 0.4);
    topLight.position.set(0, 5, 0);
    scene.add(topLight);
    
    // Luz de fundo (para clarear sombras)
    const backFillLight = new THREE.PointLight(0x4466aa, 0.3);
    backFillLight.position.set(0, 2, -3);
    scene.add(backFillLight);
    
    // ========== FAROL (será ligado/desligado) ==========
    farolLuz = new THREE.SpotLight(0xffaa66, 0);
    farolLuz.position.set(0, 0.4, 1.2);
    farolLuz.angle = 0.5;
    farolLuz.penumbra = 0.3;
    farolLuz.distance = 15;
    farolLuz.castShadow = true;
    scene.add(farolLuz);
    
    // ========== GARAGEM (CHÃO + PAREDES) ==========
    
    // Piso da garagem (chão)
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        roughness: 0.4,
        metalness: 0.1,
        side: THREE.DoubleSide
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Grade do chão (referência visual)
    const gridHelper = new THREE.GridHelper(12, 20, 0x88aaff, 0x335588);
    gridHelper.position.y = -0.19;
    scene.add(gridHelper);
    
    // Plano de sombra (para receber sombra do carro)
    const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.ShadowMaterial({ opacity: 0.5, color: 0x000000, transparent: true, side: THREE.DoubleSide })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.19;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);
    
    // Paredes da garagem (opcional, para efeito)
    const wallMaterial = new THREE.MeshStandardMaterial({
        color: 0x3a3a4a,
        roughness: 0.6,
        metalness: 0.1
    });
    
    // Parede traseira
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(12, 3, 0.2), wallMaterial);
    backWall.position.set(0, 1.2, -5.5);
    backWall.receiveShadow = true;
    scene.add(backWall);
    
    // Chão reflexivo (opcional)
    const reflectiveFloor = new THREE.Mesh(
        new THREE.PlaneGeometry(11, 11),
        new THREE.MeshStandardMaterial({ color: 0x1a1a2a, roughness: 0.2, metalness: 0.7, transparent: true, opacity: 0.3 })
    );
    reflectiveFloor.rotation.x = -Math.PI / 2;
    reflectiveFloor.position.y = -0.18;
    scene.add(reflectiveFloor);
    
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    if (camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

// ==================== CARREGAR MODELO GLB ====================
function carregarModelo() {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.classList.remove('hidden');
    
    if (currentCar) {
        scene.remove(currentCar);
    }
    
    const loader = new GLTFLoader();
    
    loader.load(carro.caminhoGLB, 
        (gltf) => {
            const model = gltf.scene;
            
            // Calcular bounding box
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            
            // Ajustar escala (altura alvo = 1.5 unidades para ficar no chão)
            const targetHeight = 1.5;
            const scale = targetHeight / maxDim;
            
            model.scale.set(scale, scale, scale);
            
            // POSIÇÃO: carro no chão (Y = -0.15 para que as rodas toquem o chão)
            model.position.set(
                -center.x * scale,
                -center.y * scale - 0.15,
                -center.z * scale
            );
            
            // Habilitar sombras
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            scene.add(model);
            currentCar = model;
            
            // Anexar o farol ao carro
            if (farolLuz && currentCar) {
                currentCar.add(farolLuz);
            }
            
            loadingDiv.classList.add('hidden');
            console.log('✅ Carro GLB carregado e posicionado no chão!');
            mostrarToast('✅ Carro 3D carregado!', 'success');
        },
        (progress) => {
            if (progress.total) {
                const percent = (progress.loaded / progress.total * 100).toFixed(0);
                const p = loadingDiv.querySelector('p');
                if (p) p.textContent = `Carregando modelo 3D... ${percent}%`;
            }
        },
        (error) => {
            console.error('Erro ao carregar GLB:', error);
            loadingDiv.classList.add('hidden');
            mostrarToast('❌ Arquivo car1.glb não encontrado!', 'error');
        }
    );
}

// ==================== FUNÇÃO DO FAROL ====================
function toggleFarol() {
    faroisLigados = !faroisLigados;
    
    if (farolLuz) {
        if (faroisLigados) {
            farolLuz.intensity = 1.2;
            farolLuz.distance = 15;
            mostrarToast('🔆 Faróis LIGADOS', 'success');
            console.log('Faróis ligados');
        } else {
            farolLuz.intensity = 0;
            mostrarToast('💡 Faróis DESLIGADOS', 'info');
            console.log('Faróis desligados');
        }
    }
}

// ==================== FIREBASE ====================
function carregarDadosFirebase() {
    const playerRef = ref(database, `jogadores/${playerId}`);
    
    onValue(playerRef, (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
            playerData = {
                pontos: data.pontos || 100,
                vitorias: data.vitorias || 0,
                carroSelecionado: data.carroSelecionado || 'carro1'
            };
        } else {
            set(playerRef, {
                pontos: 100,
                vitorias: 0,
                carroSelecionado: 'carro1'
            });
            playerData = { pontos: 100, vitorias: 0, carroSelecionado: 'carro1' };
        }
        
        atualizarUI();
    });
}

function atualizarUI() {
    document.getElementById('carName').textContent = carro.nome;
    document.getElementById('velocidade').textContent = carro.stats.velocidade;
    document.getElementById('controle').textContent = carro.stats.controle;
    document.getElementById('durabilidade').textContent = carro.stats.durabilidade;
    
    document.getElementById('velBar').style.width = `${carro.stats.velocidade}%`;
    document.getElementById('ctrlBar').style.width = `${carro.stats.controle}%`;
    document.getElementById('durBar').style.width = `${carro.stats.durabilidade}%`;
    
    document.getElementById('playerPoints').textContent = playerData.pontos;
    document.getElementById('playerWins').textContent = playerData.vitorias;
}

function selecionarCarro() {
    const playerRef = ref(database, `jogadores/${playerId}`);
    update(playerRef, { carroSelecionado: 'carro1' });
    mostrarToast(`✅ ${carro.nome} selecionado!`, 'success');
}

function mostrarToast(mensagem, tipo) {
    const toastContainer = document.getElementById('toast');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo === 'error' ? 'error' : ''}`;
    toast.textContent = mensagem;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

// ==================== EVENTO DO TECLADO (ESPAÇO) ====================
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault(); // Evita a página rolar
        toggleFarol();
    }
});

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    init3D();
    carregarDadosFirebase();
    
    setTimeout(() => {
        carregarModelo();
    }, 500);
    
    document.getElementById('selectCarBtn').addEventListener('click', selecionarCarro);
    
    console.log('🚀 Sistema inicializado! Pressione ESPAÇO para ligar/desligar faróis');
});
