import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { database, ref, set, get, update, onValue } from './firebase-config.js';

// ==================== CONFIGURAÇÃO DO CARRO ====================
const carro = {
    id: 'carro1',
    nome: '🔥 Fúria Vermelha',
    caminhoGLB: './models/car1/car1.glb',  // ← USANDO GLB
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
    scene.background = new THREE.Color(0x0a0a1a);
    scene.fog = new THREE.FogExp2(0x0a0a1a, 0.008);
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 3, 6);
    camera.lookAt(0, 0.5, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;
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
    
    // Luzes
    const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(5, 10, 7);
    mainLight.castShadow = true;
    mainLight.receiveShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);
    
    const fillLight = new THREE.PointLight(0x88aaff, 0.4);
    fillLight.position.set(0, 1.5, 4);
    scene.add(fillLight);
    
    const warmLight = new THREE.PointLight(0xffaa66, 0.4);
    warmLight.position.set(-3, 2, 2);
    scene.add(warmLight);
    
    const rimLight = new THREE.PointLight(0xff6633, 0.5);
    rimLight.position.set(0, 1.5, -4);
    scene.add(rimLight);
    
    // Chão
    const gridHelper = new THREE.GridHelper(12, 20, 0x888888, 0x444444);
    gridHelper.position.y = -0.6;
    scene.add(gridHelper);
    
    const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.ShadowMaterial({ opacity: 0.4, color: 0x000000, transparent: true, side: THREE.DoubleSide })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.6;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);
    
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
            
            // Ajustar escala e posição
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2.5 / maxDim;
            
            model.scale.set(scale, scale, scale);
            model.position.set(
                -center.x * scale,
                -center.y * scale + 0.2,
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
            
            loadingDiv.classList.add('hidden');
            console.log('✅ Carro GLB carregado com sucesso!');
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
    }, 3000);
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    init3D();
    carregarDadosFirebase();
    
    setTimeout(() => {
        carregarModelo();
    }, 500);
    
    document.getElementById('selectCarBtn').addEventListener('click', selecionarCarro);
    
    console.log('🚀 Sistema inicializado!');
    console.log('📁 Caminho do GLB:', carro.caminhoGLB);
});
