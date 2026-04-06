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

// Posições do CARRO
let posicaoCarro = {
    x: 0,
    y: 0.08,
    z: 0
};
let escalaCarro = 1;

// ========== LUZES DOS FARÓIS ==========
let farolFrontalEsquerdo = null;
let farolFrontalDireito = null;
let farolTraseiroEsquerdo = null;
let farolTraseiroDireito = null;

let esferaFE = null;
let esferaFD = null;
let esferaTE = null;
let esferaTD = null;

let posicoesFarois = {
    frontal_esquerdo: { x: -1.00, y: 0.15, z: 3.90 },
    frontal_direito: { x: 1.00, y: 0.15, z: 3.90 },
    traseiro_esquerdo: { x: -0.95, y: 0.25, z: -4.25 },
    traseiro_direito: { x: 0.95, y: 0.25, z: -4.25 }
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
    camera.position.set(6, 3, 7);
    camera.lookAt(0, 0.3, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
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
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(15, 15), new THREE.MeshStandardMaterial({ color: 0x2a2a3a, roughness: 0.4 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    const gridHelper = new THREE.GridHelper(15, 20, 0x88aaff, 0x335588);
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

// ==================== ATUALIZAR POSIÇÃO DO CARRO ====================
function atualizarPosicaoCarro() {
    if (!carModel) return;
    
    carModel.position.set(posicaoCarro.x, posicaoCarro.y, posicaoCarro.z);
    carModel.scale.set(escalaCarro, escalaCarro, escalaCarro);
    
    // Atualizar valores nos sliders
    document.getElementById('carro_x').value = posicaoCarro.x;
    document.getElementById('carro_y').value = posicaoCarro.y;
    document.getElementById('carro_z').value = posicaoCarro.z;
    document.getElementById('carro_escala').value = escalaCarro;
    
    // Atualizar texto
    document.getElementById('carro_coords').textContent = `${posicaoCarro.x.toFixed(2)}, ${posicaoCarro.y.toFixed(2)}, ${posicaoCarro.z.toFixed(2)}`;
    document.getElementById('carro_scale').textContent = escalaCarro.toFixed(2);
    
    console.log(`🚗 Carro movido para: X=${posicaoCarro.x}, Y=${posicaoCarro.y}, Z=${posicaoCarro.z} | Escala: ${escalaCarro}`);
}

// ==================== CRIAR LUZES ====================
function criarLuzesFarois() {
    if (!carModel) return;
    
    farolFrontalEsquerdo = new THREE.SpotLight(0xffaa66);
    farolFrontalEsquerdo.angle = 0.6;
    farolFrontalEsquerdo.penumbra = 0.3;
    farolFrontalEsquerdo.distance = 20;
    farolFrontalEsquerdo.decay = 1.0;
    farolFrontalEsquerdo.castShadow = true;
    farolFrontalEsquerdo.target = carModel;
    farolFrontalEsquerdo.target.position.set(0, 0.15, 10);
    
    farolFrontalDireito = new THREE.SpotLight(0xffaa66);
    farolFrontalDireito.angle = 0.6;
    farolFrontalDireito.penumbra = 0.3;
    farolFrontalDireito.distance = 20;
    farolFrontalDireito.decay = 1.0;
    farolFrontalDireito.castShadow = true;
    farolFrontalDireito.target = carModel;
    farolFrontalDireito.target.position.set(0, 0.15, 10);
    
    farolTraseiroEsquerdo = new THREE.SpotLight(0xff3333);
    farolTraseiroEsquerdo.angle = 0.5;
    farolTraseiroEsquerdo.penumbra = 0.3;
    farolTraseiroEsquerdo.distance = 15;
    farolTraseiroEsquerdo.decay = 1.0;
    farolTraseiroEsquerdo.castShadow = true;
    farolTraseiroEsquerdo.target = carModel;
    farolTraseiroEsquerdo.target.position.set(0, 0.25, -10);
    
    farolTraseiroDireito = new THREE.SpotLight(0xff3333);
    farolTraseiroDireito.angle = 0.5;
    farolTraseiroDireito.penumbra = 0.3;
    farolTraseiroDireito.distance = 15;
    farolTraseiroDireito.decay = 1.0;
    farolTraseiroDireito.castShadow = true;
    farolTraseiroDireito.target = carModel;
    farolTraseiroDireito.target.position.set(0, 0.25, -10);
    
    carModel.add(farolFrontalEsquerdo);
    carModel.add(farolFrontalDireito);
    carModel.add(farolTraseiroEsquerdo);
    carModel.add(farolTraseiroDireito);
    carModel.add(farolFrontalEsquerdo.target);
    carModel.add(farolFrontalDireito.target);
    carModel.add(farolTraseiroEsquerdo.target);
    carModel.add(farolTraseiroDireito.target);
    
    // Esferas visuais
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
}

function atualizarPosicoesLuzes() {
    if (!farolFrontalEsquerdo) return;
    
    farolFrontalEsquerdo.position.set(posicoesFarois.frontal_esquerdo.x, posicoesFarois.frontal_esquerdo.y, posicoesFarois.frontal_esquerdo.z);
    farolFrontalDireito.position.set(posicoesFarois.frontal_direito.x, posicoesFarois.frontal_direito.y, posicoesFarois.frontal_direito.z);
    farolTraseiroEsquerdo.position.set(posicoesFarois.traseiro_esquerdo.x, posicoesFarois.traseiro_esquerdo.y, posicoesFarois.traseiro_esquerdo.z);
    farolTraseiroDireito.position.set(posicoesFarois.traseiro_direito.x, posicoesFarois.traseiro_direito.y, posicoesFarois.traseiro_direito.z);
    
    if (esferaFE) esferaFE.position.set(posicoesFarois.frontal_esquerdo.x, posicoesFarois.frontal_esquerdo.y, posicoesFarois.frontal_esquerdo.z);
    if (esferaFD) esferaFD.position.set(posicoesFarois.frontal_direito.x, posicoesFarois.frontal_direito.y, posicoesFarois.frontal_direito.z);
    if (esferaTE) esferaTE.position.set(posicoesFarois.traseiro_esquerdo.x, posicoesFarois.traseiro_esquerdo.y, posicoesFarois.traseiro_esquerdo.z);
    if (esferaTD) esferaTD.position.set(posicoesFarois.traseiro_direito.x, posicoesFarois.traseiro_direito.y, posicoesFarois.traseiro_direito.z);
    
    // Atualizar sliders dos faróis
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
    
    document.getElementById('fe_coords').textContent = `${posicoesFarois.frontal_esquerdo.x.toFixed(2)}, ${posicoesFarois.frontal_esquerdo.y.toFixed(2)}, ${posicoesFarois.frontal_esquerdo.z.toFixed(2)}`;
    document.getElementById('fd_coords').textContent = `${posicoesFarois.frontal_direito.x.toFixed(2)}, ${posicoesFarois.frontal_direito.y.toFixed(2)}, ${posicoesFarois.frontal_direito.z.toFixed(2)}`;
    document.getElementById('te_coords').textContent = `${posicoesFarois.traseiro_esquerdo.x.toFixed(2)}, ${posicoesFarois.traseiro_esquerdo.y.toFixed(2)}, ${posicoesFarois.traseiro_esquerdo.z.toFixed(2)}`;
    document.getElementById('td_coords').textContent = `${posicoesFarois.traseiro_direito.x.toFixed(2)}, ${posicoesFarois.traseiro_direito.y.toFixed(2)}, ${posicoesFarois.traseiro_direito.z.toFixed(2)}`;
}

// ========== FUNÇÕES DOS FARÓIS ==========
function ajustarFarol(tipo, eixo, valor) {
    posicoesFarois[tipo][eixo] = parseFloat(valor);
    atualizarPosicoesLuzes();
    if (faroisLigados) ligarFarois();
}

function ligarFarois() {
    if (farolFrontalEsquerdo) farolFrontalEsquerdo.intensity = 1.5;
    if (farolFrontalDireito) farolFrontalDireito.intensity = 1.5;
    if (farolTraseiroEsquerdo) farolTraseiroEsquerdo.intensity = 1.0;
    if (farolTraseiroDireito) farolTraseiroDireito.intensity = 1.0;
    faroisLigados = true;
    document.getElementById('btnFarol').textContent = '🔆 DESLIGAR FARÓIS';
}

function desligarFarois() {
    if (farolFrontalEsquerdo) farolFrontalEsquerdo.intensity = 0;
    if (farolFrontalDireito) farolFrontalDireito.intensity = 0;
    if (farolTraseiroEsquerdo) farolTraseiroEsquerdo.intensity = 0;
    if (farolTraseiroDireito) farolTraseiroDireito.intensity = 0;
    faroisLigados = false;
    document.getElementById('btnFarol').textContent = '💡 LIGAR FARÓIS';
}

function toggleFarois() {
    if (faroisLigados) desligarFarois();
    else ligarFarois();
}

function salvarFarois() {
    localStorage.setItem('posicoes_farois', JSON.stringify(posicoesFarois));
    mostrarToast('✅ Posições dos faróis salvas!', 'success');
}

function resetarFarois() {
    posicoesFarois = {
        frontal_esquerdo: { x: -1.00, y: 0.15, z: 3.90 },
        frontal_direito: { x: 1.00, y: 0.15, z: 3.90 },
        traseiro_esquerdo: { x: -0.95, y: 0.25, z: -4.25 },
        traseiro_direito: { x: 0.95, y: 0.25, z: -4.25 }
    };
    atualizarPosicoesLuzes();
    mostrarToast('🔄 Faróis resetados', 'info');
}

// ========== FUNÇÕES DO CARRO ==========
function ajustarCarro(eixo, valor) {
    posicaoCarro[eixo] = parseFloat(valor);
    atualizarPosicaoCarro();
}

function ajustarEscalaCarro(valor) {
    escalaCarro = parseFloat(valor);
    atualizarPosicaoCarro();
}

function salvarPosicaoCarro() {
    const dados = {
        posicao: posicaoCarro,
        escala: escalaCarro
    };
    localStorage.setItem('posicao_carro', JSON.stringify(dados));
    mostrarToast('✅ Posição do carro salva!', 'success');
    console.log('Posição do carro salva:', dados);
}

function resetarCarro() {
    posicaoCarro = { x: 0, y: 0.08, z: 0 };
    escalaCarro = 1;
    atualizarPosicaoCarro();
    mostrarToast('🔄 Carro resetado', 'info');
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
            const scaleAuto = 1.5 / maxDim;
            
            escalaCarro = scaleAuto;
            carModel.scale.set(escalaCarro, escalaCarro, escalaCarro);
            
            // Carregar posição salva do carro
            const salvaCarro = localStorage.getItem('posicao_carro');
            if (salvaCarro) {
                try {
                    const loaded = JSON.parse(salvaCarro);
                    posicaoCarro = loaded.posicao;
                    escalaCarro = loaded.escala;
                } catch(e) {}
            }
            
            carModel.position.set(posicaoCarro.x, posicaoCarro.y, posicaoCarro.z);
            carModel.scale.set(escalaCarro, escalaCarro, escalaCarro);
            
            carModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            scene.add(carModel);
            currentCar = carModel;
            
            // Carregar posições dos faróis
            const salvos = localStorage.getItem('posicoes_farois');
            if (salvos) {
                try {
                    const loaded = JSON.parse(salvos);
                    posicoesFarois = loaded;
                } catch(e) {}
            }
            
            criarLuzesFarois();
            atualizarPosicaoCarro();
            
            loadingDiv.classList.add('hidden');
            mostrarToast('✅ Carro carregado! Use os painéis para ajustar', 'success');
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
    document.getElementById('btnSalvarFarois').addEventListener('click', salvarFarois);
    document.getElementById('btnResetarFarois').addEventListener('click', resetarFarois);
    document.getElementById('btnSalvarCarro').addEventListener('click', salvarPosicaoCarro);
    document.getElementById('btnResetarCarro').addEventListener('click', resetarCarro);
    
    // Eventos do carro
    document.getElementById('carro_x').addEventListener('input', (e) => ajustarCarro('x', e.target.value));
    document.getElementById('carro_y').addEventListener('input', (e) => ajustarCarro('y', e.target.value));
    document.getElementById('carro_z').addEventListener('input', (e) => ajustarCarro('z', e.target.value));
    document.getElementById('carro_escala').addEventListener('input', (e) => ajustarEscalaCarro(e.target.value));
    
    // Eventos dos faróis
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
    
    console.log('🚀 Sistema completo inicializado!');
    console.log('🎮 Use os painéis para ajustar CARRO e FARÓIS');
});
