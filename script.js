import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { database, ref, set, get, update, onValue } from './firebase-config.js';

// ==================== CONFIGURAÇÃO DO CARRO ====================
const carro = {
    id: 'carro1',
    nome: '🔥 Fúria Vermelha',
    caminhoOBJ: './models/car1/car1.obj',
    caminhoMTL: './models/car1/car1.mtl',
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
    scene.fog = new THREE.Fog(0x0a0a1a, 10, 30);
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(4, 3, 5);
    camera.lookAt(0, 0.5, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    controls = new OrbitControls(camera, renderer.domElement);
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
    
    // Luzes
    const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xffffff, 1);
    mainLight.position.set(5, 10, 7);
    mainLight.castShadow = true;
    mainLight.receiveShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);
    
    const fillLight = new THREE.PointLight(0x4466cc, 0.4);
    fillLight.position.set(-2, 3, 4);
    scene.add(fillLight);
    
    const backLight = new THREE.PointLight(0xffaa66, 0.3);
    backLight.position.set(0, 2, -5);
    scene.add(backLight);
    
    const rimLight = new THREE.PointLight(0xff6633, 0.5);
    rimLight.position.set(2, 1, -3);
    scene.add(rimLight);
    
    // Chão com grade
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

// ==================== CARREGAR MODELO 3D ====================
function carregarModelo() {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.classList.remove('hidden');
    
    if (currentCar) {
        scene.remove(currentCar);
    }
    
    const finalizarModelo = (object) => {
        const box = new THREE.Box3().setFromObject(object);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        
        object.scale.set(scale, scale, scale);
        object.position.set(
            -center.x * scale,
            -center.y * scale + 0.2,
            -center.z * scale
        );
        
        object.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
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
        currentCar = object;
        
        loadingDiv.classList.add('hidden');
        console.log('✅ Modelo carregado com sucesso!');
    };
    
    const erroModelo = (error) => {
        console.error('Erro:', error);
        loadingDiv.classList.add('hidden');
        mostrarMensagem('❌ Erro ao carregar modelo! Verifique o console', 'error');
    };
    
    // Verificar se existe MTL
    fetch(carro.caminhoMTL, { method: 'HEAD' })
        .then(response => {
            if (response.ok) {
                const mtlLoader = new MTLLoader();
                mtlLoader.setPath('./models/car1/');
                mtlLoader.load(carro.caminhoMTL, (materials) => {
                    materials.preload();
                    const objLoader = new OBJLoader();
                    objLoader.setMaterials(materials);
                    objLoader.load(carro.caminhoOBJ, finalizarModelo, null, erroModelo);
                }, undefined, () => {
                    carregarSemMTL();
                });
            } else {
                carregarSemMTL();
            }
        })
        .catch(() => carregarSemMTL());
    
    function carregarSemMTL() {
        const objLoader = new OBJLoader();
        objLoader.load(carro.caminhoOBJ, finalizarModelo, null, erroModelo);
    }
}

// ==================== FIREBASE FUNCTIONS ====================

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
            // Criar novo jogador
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
    
    mostrarMensagem(`✅ ${carro.nome} selecionado! Pronto para a corrida!`, 'success');
}

function mostrarMensagem(texto, tipo) {
    const msg = document.createElement('div');
    msg.className = 'toast-message';
    msg.textContent = texto;
    msg.style.background = tipo === 'success' ? '#4caf50' : '#f44336';
    msg.style.color = 'white';
    document.body.appendChild(msg);
    
    setTimeout(() => {
        msg.style.opacity = '0';
        setTimeout(() => msg.remove(), 300);
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
    
    console.log('🚀 Sistema inicializado com Firebase!');
});
