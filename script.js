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
let carModel = null; // Referência ao modelo do carro

// ========== LUZES DOS FARÓIS ==========
let farolFrontalEsquerdo = null;
let farolFrontalDireito = null;
let farolTraseiroEsquerdo = null;
let farolTraseiroDireito = null;

// Posições relativas ao carro (valores aproximados - você pode ajustar)
const POSICOES_FAROIS = {
    frontal_esquerdo: { x: -0.6, y: 0.3, z: 1.4, cor: 0xffaa66, intensidade: 1.0 },
    frontal_direito:  { x: 0.6, y: 0.3, z: 1.4, cor: 0xffaa66, intensidade: 1.0 },
    traseiro_esquerdo: { x: -0.6, y: 0.3, z: -1.3, cor: 0xff3333, intensidade: 0.8 },
    traseiro_direito:  { x: 0.6, y: 0.3, z: -1.3, cor: 0xff3333, intensidade: 0.8 }
};

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
    scene.background = new THREE.Color(0x111122);
    scene.fog = new THREE.FogExp2(0x111122, 0.008);
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 2.5, 6);
    camera.lookAt(0, 0.3, 0);
    
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
    
    // ========== ILUMINAÇÃO AMBIENTE ==========
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // Luz principal
    const mainLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    mainLight.position.set(5, 8, 4);
    mainLight.castShadow = true;
    mainLight.receiveShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);
    
    // Luz de preenchimento
    const fillLight = new THREE.PointLight(0x88aaff, 0.5);
    fillLight.position.set(0, 2, 5);
    scene.add(fillLight);
    
    // Luz lateral direita
    const rightLight = new THREE.PointLight(0xffaa66, 0.4);
    rightLight.position.set(4, 2, 2);
    scene.add(rightLight);
    
    // Luz lateral esquerda
    const leftLight = new THREE.PointLight(0x66ccff, 0.4);
    leftLight.position.set(-4, 2, 2);
    scene.add(leftLight);
    
    // Luz de topo
    const topLight = new THREE.PointLight(0xffffff, 0.3);
    topLight.position.set(0, 4, 0);
    scene.add(topLight);
    
    // ========== GARAGEM ==========
    // Piso
    const floorMaterial = new THREE.MeshStandardMaterial({
        color: 0x2a2a3a,
        roughness: 0.4,
        metalness: 0.1
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Grade
    const gridHelper = new THREE.GridHelper(12, 20, 0x88aaff, 0x335588);
    gridHelper.position.y = -0.19;
    scene.add(gridHelper);
    
    // Plano de sombra
    const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.ShadowMaterial({ opacity: 0.5, color: 0x000000, transparent: true, side: THREE.DoubleSide })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.19;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);
    
    // Parede traseira
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.6 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(12, 3, 0.2), wallMaterial);
    backWall.position.set(0, 1.2, -5.5);
    backWall.receiveShadow = true;
    scene.add(backWall);
    
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

// ==================== CRIAR LUZES DOS FARÓIS ====================
function criarLuzesFarois() {
    // Farol Frontal Esquerdo
    farolFrontalEsquerdo = new THREE.PointLight(
        POSICOES_FAROIS.frontal_esquerdo.cor, 
        0
    );
    farolFrontalEsquerdo.position.set(
        POSICOES_FAROIS.frontal_esquerdo.x,
        POSICOES_FAROIS.frontal_esquerdo.y,
        POSICOES_FAROIS.frontal_esquerdo.z
    );
    farolFrontalEsquerdo.distance = 12;
    farolFrontalEsquerdo.decay = 1.5;
    farolFrontalEsquerdo.castShadow = true;
    
    // Farol Frontal Direito
    farolFrontalDireito = new THREE.PointLight(
        POSICOES_FAROIS.frontal_direito.cor,
        0
    );
    farolFrontalDireito.position.set(
        POSICOES_FAROIS.frontal_direito.x,
        POSICOES_FAROIS.frontal_direito.y,
        POSICOES_FAROIS.frontal_direito.z
    );
    farolFrontalDireito.distance = 12;
    farolFrontalDireito.decay = 1.5;
    farolFrontalDireito.castShadow = true;
    
    // Farol Traseiro Esquerdo
    farolTraseiroEsquerdo = new THREE.PointLight(
        POSICOES_FAROIS.traseiro_esquerdo.cor,
        0
    );
    farolTraseiroEsquerdo.position.set(
        POSICOES_FAROIS.traseiro_esquerdo.x,
        POSICOES_FAROIS.traseiro_esquerdo.y,
        POSICOES_FAROIS.traseiro_esquerdo.z
    );
    farolTraseiroEsquerdo.distance = 8;
    farolTraseiroEsquerdo.decay = 1.5;
    
    // Farol Traseiro Direito
    farolTraseiroDireito = new THREE.PointLight(
        POSICOES_FAROIS.traseiro_direito.cor,
        0
    );
    farolTraseiroDireito.position.set(
        POSICOES_FAROIS.traseiro_direito.x,
        POSICOES_FAROIS.traseiro_direito.y,
        POSICOES_FAROIS.traseiro_direito.z
    );
    farolTraseiroDireito.distance = 8;
    farolTraseiroDireito.decay = 1.5;
    
    // Adicionar as luzes ao carro (quando ele existir)
    if (carModel) {
        carModel.add(farolFrontalEsquerdo);
        carModel.add(farolFrontalDireito);
        carModel.add(farolTraseiroEsquerdo);
        carModel.add(farolTraseiroDireito);
    }
    
    console.log('✅ Luzes dos faróis criadas');
}

// ==================== LIGAR/DESLIGAR FARÓIS ====================
function ligarFarois() {
    if (farolFrontalEsquerdo) farolFrontalEsquerdo.intensity = POSICOES_FAROIS.frontal_esquerdo.intensidade;
    if (farolFrontalDireito) farolFrontalDireito.intensity = POSICOES_FAROIS.frontal_direito.intensidade;
    if (farolTraseiroEsquerdo) farolTraseiroEsquerdo.intensity = POSICOES_FAROIS.traseiro_esquerdo.intensidade;
    if (farolTraseiroDireito) farolTraseiroDireito.intensity = POSICOES_FAROIS.traseiro_direito.intensidade;
    
    faroisLigados = true;
    console.log('🔆 Faróis LIGADOS');
    mostrarToast('🔆 Faróis LIGADOS', 'success');
}

function desligarFarois() {
    if (farolFrontalEsquerdo) farolFrontalEsquerdo.intensity = 0;
    if (farolFrontalDireito) farolFrontalDireito.intensity = 0;
    if (farolTraseiroEsquerdo) farolTraseiroEsquerdo.intensity = 0;
    if (farolTraseiroDireito) farolTraseiroDireito.intensity = 0;
    
    faroisLigados = false;
    console.log('💡 Faróis DESLIGADOS');
    mostrarToast('💡 Faróis DESLIGADOS', 'info');
}

function toggleFarois() {
    if (faroisLigados) {
        desligarFarois();
    } else {
        ligarFarois();
    }
}

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
            carModel = gltf.scene;
            
            // Calcular bounding box
            const box = new THREE.Box3().setFromObject(carModel);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            
            // Ajustar escala
            const targetHeight = 1.5;
            const scale = targetHeight / maxDim;
            
            carModel.scale.set(scale, scale, scale);
            
            // Posicionar no chão
            carModel.position.set(
                -center.x * scale,
                -center.y * scale + 0.15,
                -center.z * scale
            );
            
            // Habilitar sombras
            carModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            scene.add(carModel);
            currentCar = carModel;
            
            // Criar e adicionar as luzes dos faróis ao carro
            criarLuzesFarois();
            
            // Adicionar esferas visuais para os faróis (opcional - ajuda a ver onde estão)
            adicionarEsferasFarois();
            
            loadingDiv.classList.add('hidden');
            console.log('✅ Carro GLB carregado com sucesso!');
            mostrarToast('✅ Carro 3D carregado! Pressione ESPAÇO para faróis', 'success');
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

// ========== OPCIONAL: Esferas para visualizar posições dos faróis ==========
function adicionarEsferasFarois() {
    // Isso é apenas para DEBUG - mostra onde as luzes estão posicionadas
    // Comente ou remova depois de ajustar as posições
    
    const geometria = new THREE.SphereGeometry(0.08, 8, 8);
    
    const esferaFE = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({ color: 0xffaa66, emissive: 0x442200 }));
    esferaFE.position.set(POSICOES_FAROIS.frontal_esquerdo.x, POSICOES_FAROIS.frontal_esquerdo.y, POSICOES_FAROIS.frontal_esquerdo.z);
    carModel.add(esferaFE);
    
    const esferaFD = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({ color: 0xffaa66, emissive: 0x442200 }));
    esferaFD.position.set(POSICOES_FAROIS.frontal_direito.x, POSICOES_FAROIS.frontal_direito.y, POSICOES_FAROIS.frontal_direito.z);
    carModel.add(esferaFD);
    
    const esferaTE = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x440000 }));
    esferaTE.position.set(POSICOES_FAROIS.traseiro_esquerdo.x, POSICOES_FAROIS.traseiro_esquerdo.y, POSICOES_FAROIS.traseiro_esquerdo.z);
    carModel.add(esferaTE);
    
    const esferaTD = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x440000 }));
    esferaTD.position.set(POSICOES_FAROIS.traseiro_direito.x, POSICOES_FAROIS.traseiro_direito.y, POSICOES_FAROIS.traseiro_direito.z);
    carModel.add(esferaTD);
    
    console.log('📍 Esferas de posição dos faróis adicionadas (visíveis para ajuste)');
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

// ==================== EVENTO DO TECLADO ====================
document.addEventListener('keydown', (event) => {
    if (event.code === 'Space') {
        event.preventDefault();
        toggleFarois();
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
    
    console.log('🚀 Sistema inicializado!');
    console.log('💡 Pressione ESPAÇO para ligar/desligar os faróis');
    console.log('📍 Posições dos faróis configuradas:');
    console.log('   - Frontal Esquerdo:', POSICOES_FAROIS.frontal_esquerdo);
    console.log('   - Frontal Direito:', POSICOES_FAROIS.frontal_direito);
    console.log('   - Traseiro Esquerdo:', POSICOES_FAROIS.traseiro_esquerdo);
    console.log('   - Traseiro Direito:', POSICOES_FAROIS.traseiro_direito);
});
