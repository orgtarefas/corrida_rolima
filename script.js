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
let carModel = null;
let faroisLigados = false;

// ========== LUZES DOS FARÓIS ==========
let farolFrontalEsquerdo = null;
let farolFrontalDireito = null;
let farolTraseiroEsquerdo = null;
let farolTraseiroDireito = null;

// Esferas visuais para ajuste
let esferaFE = null;
let esferaFD = null;
let esferaTE = null;
let esferaTD = null;

// Posições atuais (valores padrão - você vai ajustar)
let posicoesFarois = {
    frontal_esquerdo: { x: -0.6, y: 0.3, z: 1.4 },
    frontal_direito: { x: 0.6, y: 0.3, z: 1.4 },
    traseiro_esquerdo: { x: -0.6, y: 0.3, z: -1.3 },
    traseiro_direito: { x: 0.6, y: 0.3, z: -1.3 }
};

let playerId = 'jogador_default';
let playerData = { pontos: 100, vitorias: 0, carroSelecionado: 'carro1' };

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
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false; // Desligado para facilitar ajuste
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.target.set(0, 0.3, 0);
    
    // Luzes da cena
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    mainLight.position.set(5, 8, 4);
    mainLight.castShadow = true;
    scene.add(mainLight);
    
    const fillLight = new THREE.PointLight(0x88aaff, 0.5);
    fillLight.position.set(0, 2, 5);
    scene.add(fillLight);
    
    // Chão
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.4 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    const gridHelper = new THREE.GridHelper(12, 20, 0x88aaff, 0x335588);
    gridHelper.position.y = -0.19;
    scene.add(gridHelper);
    
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

// ==================== CRIAR LUZES E ESFERAS ====================
function criarLuzesFarois() {
    if (!carModel) return;
    
    // Farol Frontal Esquerdo
    farolFrontalEsquerdo = new THREE.PointLight(0xffaa66, 0);
    farolFrontalEsquerdo.distance = 12;
    farolFrontalEsquerdo.decay = 1.5;
    farolFrontalEsquerdo.castShadow = true;
    
    // Farol Frontal Direito
    farolFrontalDireito = new THREE.PointLight(0xffaa66, 0);
    farolFrontalDireito.distance = 12;
    farolFrontalDireito.decay = 1.5;
    farolFrontalDireito.castShadow = true;
    
    // Farol Traseiro Esquerdo
    farolTraseiroEsquerdo = new THREE.PointLight(0xff3333, 0);
    farolTraseiroEsquerdo.distance = 8;
    farolTraseiroEsquerdo.decay = 1.5;
    
    // Farol Traseiro Direito
    farolTraseiroDireito = new THREE.PointLight(0xff3333, 0);
    farolTraseiroDireito.distance = 8;
    farolTraseiroDireito.decay = 1.5;
    
    // Adicionar ao carro
    carModel.add(farolFrontalEsquerdo);
    carModel.add(farolFrontalDireito);
    carModel.add(farolTraseiroEsquerdo);
    carModel.add(farolTraseiroDireito);
    
    // ESFERAS VISUAIS PARA AJUSTE
    const geometria = new THREE.SphereGeometry(0.08, 16, 16);
    
    esferaFE = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({ color: 0xffaa66, emissive: 0x442200 }));
    esferaFD = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({ color: 0xffaa66, emissive: 0x442200 }));
    esferaTE = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x440000 }));
    esferaTD = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x440000 }));
    
    carModel.add(esferaFE);
    carModel.add(esferaFD);
    carModel.add(esferaTE);
    carModel.add(esferaTD);
    
    atualizarPosicoesLuzes();
    
    console.log('✅ Luzes e esferas visíveis criadas');
}

function atualizarPosicoesLuzes() {
    if (!farolFrontalEsquerdo) return;
    
    // Atualizar posições das luzes
    farolFrontalEsquerdo.position.set(posicoesFarois.frontal_esquerdo.x, posicoesFarois.frontal_esquerdo.y, posicoesFarois.frontal_esquerdo.z);
    farolFrontalDireito.position.set(posicoesFarois.frontal_direito.x, posicoesFarois.frontal_direito.y, posicoesFarois.frontal_direito.z);
    farolTraseiroEsquerdo.position.set(posicoesFarois.traseiro_esquerdo.x, posicoesFarois.traseiro_esquerdo.y, posicoesFarois.traseiro_esquerdo.z);
    farolTraseiroDireito.position.set(posicoesFarois.traseiro_direito.x, posicoesFarois.traseiro_direito.y, posicoesFarois.traseiro_direito.z);
    
    // Atualizar posições das esferas visuais
    if (esferaFE) esferaFE.position.set(posicoesFarois.frontal_esquerdo.x, posicoesFarois.frontal_esquerdo.y, posicoesFarois.frontal_esquerdo.z);
    if (esferaFD) esferaFD.position.set(posicoesFarois.frontal_direito.x, posicoesFarois.frontal_direito.y, posicoesFarois.frontal_direito.z);
    if (esferaTE) esferaTE.position.set(posicoesFarois.traseiro_esquerdo.x, posicoesFarois.traseiro_esquerdo.y, posicoesFarois.traseiro_esquerdo.z);
    if (esferaTD) esferaTD.position.set(posicoesFarois.traseiro_direito.x, posicoesFarois.traseiro_direito.y, posicoesFarois.traseiro_direito.z);
    
    // Atualizar valores nos sliders
    document.getElementById('fe_x').value = posicoesFarois.frontal_esquerdo.x;
    document.getElementById('fe_y').value = posicoesFarois.frontal_esquerdo.y;
    document.getElementById('fe_z').value = posicoesFarois.frontal_esquerdo.z;
    document.getElementById('fd_x').value = posicoesFarois.frontal_direito.x;
    document.getElementById('fd_y').value = posicoesFarois.frontal_direito.y;
    document.getElementById('fd_z').value = posicoesFarois.frontal_direito.z;
    document.getElementById('te_x').value = posicoesFarois.traseiro_esquerdo.x;
    document.getElementById('te_y').value = posicoesFarois.traseiro_esquerdo.y;
    document.getElementById('te_z').value = posicoesFarois.traseiro_esquerdo.z;
    document.getElementById('td_x').value = posicoesFarois.traseiro_direito.x;
    document.getElementById('td_y').value = posicoesFarois.traseiro_direito.y;
    document.getElementById('td_z').value = posicoesFarois.traseiro_direito.z;
    
    // Atualizar texto das coordenadas
    document.getElementById('fe_coords').textContent = `${posicoesFarois.frontal_esquerdo.x.toFixed(2)}, ${posicoesFarois.frontal_esquerdo.y.toFixed(2)}, ${posicoesFarois.frontal_esquerdo.z.toFixed(2)}`;
    document.getElementById('fd_coords').textContent = `${posicoesFarois.frontal_direito.x.toFixed(2)}, ${posicoesFarois.frontal_direito.y.toFixed(2)}, ${posicoesFarois.frontal_direito.z.toFixed(2)}`;
    document.getElementById('te_coords').textContent = `${posicoesFarois.traseiro_esquerdo.x.toFixed(2)}, ${posicoesFarois.traseiro_esquerdo.y.toFixed(2)}, ${posicoesFarois.traseiro_esquerdo.z.toFixed(2)}`;
    document.getElementById('td_coords').textContent = `${posicoesFarois.traseiro_direito.x.toFixed(2)}, ${posicoesFarois.traseiro_direito.y.toFixed(2)}, ${posicoesFarois.traseiro_direito.z.toFixed(2)}`;
}

// ========== FUNÇÕES DE AJUSTE ==========
function ajustarFarol(tipo, eixo, valor) {
    posicoesFarois[tipo][eixo] = parseFloat(valor);
    atualizarPosicoesLuzes();
    
    // Se os faróis estiverem ligados, atualiza a intensidade para ver o efeito
    if (faroisLigados) {
        ligarFarois();
    }
}

function ligarFarois() {
    if (farolFrontalEsquerdo) farolFrontalEsquerdo.intensity = 1.0;
    if (farolFrontalDireito) farolFrontalDireito.intensity = 1.0;
    if (farolTraseiroEsquerdo) farolTraseiroEsquerdo.intensity = 0.8;
    if (farolTraseiroDireito) farolTraseiroDireito.intensity = 0.8;
    faroisLigados = true;
    document.getElementById('btnFarol').textContent = '🔆 DESLIGAR FARÓIS';
    console.log('Faróis ligados');
}

function desligarFarois() {
    if (farolFrontalEsquerdo) farolFrontalEsquerdo.intensity = 0;
    if (farolFrontalDireito) farolFrontalDireito.intensity = 0;
    if (farolTraseiroEsquerdo) farolTraseiroEsquerdo.intensity = 0;
    if (farolTraseiroDireito) farolTraseiroDireito.intensity = 0;
    faroisLigados = false;
    document.getElementById('btnFarol').textContent = '💡 LIGAR FARÓIS';
    console.log('Faróis desligados');
}

function toggleFarois() {
    if (faroisLigados) {
        desligarFarois();
    } else {
        ligarFarois();
    }
}

function salvarPosicoes() {
    const posicoesString = JSON.stringify(posicoesFarois, null, 2);
    localStorage.setItem('posicoes_farois', posicoesString);
    mostrarToast('✅ Posições dos faróis salvas!', 'success');
    console.log('Posições salvas:', posicoesString);
    
    // Mostrar código para copiar
    alert(`Posições salvas! Copie este código para usar no futuro:\n\n${posicoesString}`);
}

function resetarPosicoes() {
    posicoesFarois = {
        frontal_esquerdo: { x: -0.6, y: 0.3, z: 1.4 },
        frontal_direito: { x: 0.6, y: 0.3, z: 1.4 },
        traseiro_esquerdo: { x: -0.6, y: 0.3, z: -1.3 },
        traseiro_direito: { x: 0.6, y: 0.3, z: -1.3 }
    };
    atualizarPosicoesLuzes();
    mostrarToast('🔄 Posições resetadas para o padrão', 'info');
}

// ==================== CARREGAR MODELO ====================
function carregarModelo() {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.classList.remove('hidden');
    
    if (currentCar) scene.remove(currentCar);
    
    const loader = new GLTFLoader();
    
    loader.load(carro.caminhoGLB, 
        (gltf) => {
            carModel = gltf.scene;
            
            const box = new THREE.Box3().setFromObject(carModel);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 1.5 / maxDim;
            
            carModel.scale.set(scale, scale, scale);
            carModel.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
            
            carModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            scene.add(carModel);
            currentCar = carModel;
            
            // Carregar posições salvas
            const salvas = localStorage.getItem('posicoes_farois');
            if (salvas) {
                try {
                    const loaded = JSON.parse(salvas);
                    posicoesFarois = loaded;
                    console.log('Posições carregadas do localStorage');
                } catch(e) {}
            }
            
            criarLuzesFarois();
            
            loadingDiv.classList.add('hidden');
            mostrarToast('✅ Carro carregado! Ajuste os faróis com os controles', 'success');
        },
        (progress) => {
            if (progress.total) {
                const percent = (progress.loaded / progress.total * 100).toFixed(0);
                const p = loadingDiv.querySelector('p');
                if (p) p.textContent = `Carregando... ${percent}%`;
            }
        },
        (error) => {
            console.error('Erro:', error);
            loadingDiv.classList.add('hidden');
            mostrarToast('❌ Arquivo GLB não encontrado!', 'error');
        }
    );
}

// ==================== FIREBASE ====================
function carregarDadosFirebase() {
    const playerRef = ref(database, `jogadores/${playerId}`);
    onValue(playerRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            playerData = { pontos: data.pontos || 100, vitorias: data.vitorias || 0, carroSelecionado: data.carroSelecionado || 'carro1' };
        } else {
            set(playerRef, { pontos: 100, vitorias: 0, carroSelecionado: 'carro1' });
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

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    init3D();
    carregarDadosFirebase();
    
    setTimeout(() => carregarModelo(), 500);
    
    document.getElementById('selectCarBtn').addEventListener('click', selecionarCarro);
    document.getElementById('btnFarol').addEventListener('click', toggleFarois);
    document.getElementById('btnSalvar').addEventListener('click', salvarPosicoes);
    document.getElementById('btnResetar').addEventListener('click', resetarPosicoes);
    
    // Eventos dos sliders
    const sliders = ['fe', 'fd', 'te', 'td'];
    sliders.forEach(farol => {
        ['x', 'y', 'z'].forEach(eixo => {
            document.getElementById(`${farol}_${eixo}`).addEventListener('input', (e) => {
                let tipo;
                if (farol === 'fe') tipo = 'frontal_esquerdo';
                else if (farol === 'fd') tipo = 'frontal_direito';
                else if (farol === 'te') tipo = 'traseiro_esquerdo';
                else tipo = 'traseiro_direito';
                ajustarFarol(tipo, eixo, e.target.value);
            });
        });
    });
    
    console.log('🚀 Sistema de ajuste de faróis inicializado!');
    console.log('💡 Use os sliders para mover as esferas até os faróis do carro');
});
