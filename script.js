import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { database, ref, set, update, onValue } from './firebase-config.js';

// Configuração
const carro = {
    nome: '🔥 Fúria Vermelha',
    caminhoGLB: './models/car1/car1.glb',
    stats: { velocidade: 85, controle: 70, durabilidade: 65 }
};

// Variáveis
let scene, camera, renderer, controls;
let carModel = null;
let faroisLigados = false;
let farolFE, farolFD, farolTE, farolTD;
let esferaFE, esferaFD, esferaTE, esferaTD;

// Posições dos faróis
let posicoesFarois = {
    frontal_esquerdo: { x: -1.00, y: 0.15, z: 3.90 },
    frontal_direito: { x: 1.00, y: 0.15, z: 3.90 },
    traseiro_esquerdo: { x: -0.95, y: 0.25, z: -4.25 },
    traseiro_direito: { x: 0.95, y: 0.25, z: -4.25 }
};

let playerId = 'jogador1';

// ==================== CENA SIMPLIFICADA ====================
function init3D() {
    const container = document.getElementById('canvas-container');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    scene.fog = new THREE.FogExp2(0x111122, 0.01);
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 2.5, 6);
    camera.lookAt(0, 0.2, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1;
    controls.enableZoom = true;
    controls.target.set(0, 0.2, 0);
    
    // Luzes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    mainLight.position.set(5, 8, 4);
    mainLight.castShadow = true;
    scene.add(mainLight);
    
    const fillLight = new THREE.PointLight(0x88aaff, 0.4);
    fillLight.position.set(0, 2, 5);
    scene.add(fillLight);
    
    // Chão simples
    const gridHelper = new THREE.GridHelper(12, 20, 0x88aaff, 0x335588);
    gridHelper.position.y = -0.2;
    scene.add(gridHelper);
    
    // Plano de sombra
    const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.ShadowMaterial({ opacity: 0.4, transparent: true })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.2;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);
    
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer) renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==================== CARREGAR CARRO (NO CHÃO E CENTRO) ====================
function carregarModelo() {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.classList.remove('hidden');
    
    const loader = new GLTFLoader();
    loader.load(carro.caminhoGLB, 
        (gltf) => {
            carModel = gltf.scene;
            
            // Ajustar escala (tamanho adequado)
            const box = new THREE.Box3().setFromObject(carModel);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 1.5 / maxDim;
            carModel.scale.set(scale, scale, scale);
            
            // POSIÇÃO: CENTRO e NO CHÃO
            const center = box.getCenter(new THREE.Vector3());
            carModel.position.set(
                -center.x * scale,
                -center.y * scale + 0.05,  // +0.05 para as rodas tocarem o chão
                -center.z * scale
            );
            
            // Sombras
            carModel.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });
            
            scene.add(carModel);
            
            // Criar faróis
            criarLuzesFarois();
            
            loadingDiv.classList.add('hidden');
            console.log('✅ Carro no centro e no chão!');
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
        }
    );
}

// ==================== FARÓIS ====================
function criarLuzesFarois() {
    if (!carModel) return;
    
    // Faróis dianteiros (apontam para frente)
    farolFE = new THREE.SpotLight(0xffaa66);
    farolFE.angle = 0.5;
    farolFE.penumbra = 0.3;
    farolFE.distance = 20;
    farolFE.castShadow = true;
    farolFE.target = carModel;
    farolFE.target.position.set(0, 0.15, 10);
    
    farolFD = new THREE.SpotLight(0xffaa66);
    farolFD.angle = 0.5;
    farolFD.penumbra = 0.3;
    farolFD.distance = 20;
    farolFD.castShadow = true;
    farolFD.target = carModel;
    farolFD.target.position.set(0, 0.15, 10);
    
    // Faróis traseiros (apontam para trás)
    farolTE = new THREE.SpotLight(0xff3333);
    farolTE.angle = 0.5;
    farolTE.penumbra = 0.3;
    farolTE.distance = 15;
    farolTE.castShadow = true;
    farolTE.target = carModel;
    farolTE.target.position.set(0, 0.25, -10);
    
    farolTD = new THREE.SpotLight(0xff3333);
    farolTD.angle = 0.5;
    farolTD.penumbra = 0.3;
    farolTD.distance = 15;
    farolTD.castShadow = true;
    farolTD.target = carModel;
    farolTD.target.position.set(0, 0.25, -10);
    
    carModel.add(farolFE, farolFD, farolTE, farolTD);
    carModel.add(farolFE.target, farolFD.target, farolTE.target, farolTD.target);
    
    // Esferas visuais
    const geo = new THREE.SphereGeometry(0.08, 16, 16);
    esferaFE = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffaa66, emissive: 0x442200 }));
    esferaFD = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xffaa66, emissive: 0x442200 }));
    esferaTE = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x440000 }));
    esferaTD = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0x440000 }));
    
    carModel.add(esferaFE, esferaFD, esferaTE, esferaTD);
    
    atualizarPosicoesFarois();
}

function atualizarPosicoesFarois() {
    if (!farolFE) return;
    
    farolFE.position.set(posicoesFarois.frontal_esquerdo.x, posicoesFarois.frontal_esquerdo.y, posicoesFarois.frontal_esquerdo.z);
    farolFD.position.set(posicoesFarois.frontal_direito.x, posicoesFarois.frontal_direito.y, posicoesFarois.frontal_direito.z);
    farolTE.position.set(posicoesFarois.traseiro_esquerdo.x, posicoesFarois.traseiro_esquerdo.y, posicoesFarois.traseiro_esquerdo.z);
    farolTD.position.set(posicoesFarois.traseiro_direito.x, posicoesFarois.traseiro_direito.y, posicoesFarois.traseiro_direito.z);
    
    esferaFE.position.set(posicoesFarois.frontal_esquerdo.x, posicoesFarois.frontal_esquerdo.y, posicoesFarois.frontal_esquerdo.z);
    esferaFD.position.set(posicoesFarois.frontal_direito.x, posicoesFarois.frontal_direito.y, posicoesFarois.frontal_direito.z);
    esferaTE.position.set(posicoesFarois.traseiro_esquerdo.x, posicoesFarois.traseiro_esquerdo.y, posicoesFarois.traseiro_esquerdo.z);
    esferaTD.position.set(posicoesFarois.traseiro_direito.x, posicoesFarois.traseiro_direito.y, posicoesFarois.traseiro_direito.z);
    
    // Atualizar sliders
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

function ajustarFarol(tipo, eixo, valor) {
    posicoesFarois[tipo][eixo] = parseFloat(valor);
    atualizarPosicoesFarois();
    if (faroisLigados) ligarFarois();
}

function ligarFarois() {
    if (farolFE) farolFE.intensity = 1.2;
    if (farolFD) farolFD.intensity = 1.2;
    if (farolTE) farolTE.intensity = 0.8;
    if (farolTD) farolTD.intensity = 0.8;
    faroisLigados = true;
    document.getElementById('btnFarol').textContent = '🔆 DESLIGAR FARÓIS';
}

function desligarFarois() {
    if (farolFE) farolFE.intensity = 0;
    if (farolFD) farolFD.intensity = 0;
    if (farolTE) farolTE.intensity = 0;
    if (farolTD) farolTD.intensity = 0;
    faroisLigados = false;
    document.getElementById('btnFarol').textContent = '💡 LIGAR FARÓIS';
}

function toggleFarois() {
    faroisLigados ? desligarFarois() : ligarFarois();
}

function salvarFarois() {
    localStorage.setItem('posicoes_farois', JSON.stringify(posicoesFarois));
    mostrarToast('✅ Posições dos faróis salvas!');
}

function mostrarToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.getElementById('toast').appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
}

// ==================== FIREBASE ====================
function carregarDadosFirebase() {
    const playerRef = ref(database, `jogadores/${playerId}`);
    onValue(playerRef, (snapshot) => {
        const data = snapshot.val();
        if (!data) {
            set(playerRef, { pontos: 100, vitorias: 0 });
        }
    });
}

function selecionarCarro() {
    const playerRef = ref(database, `jogadores/${playerId}`);
    update(playerRef, { carroSelecionado: 'carro1' });
    mostrarToast('✅ Carro selecionado!');
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    init3D();
    carregarDadosFirebase();
    
    setTimeout(() => carregarModelo(), 500);
    
    document.getElementById('selectCarBtn').addEventListener('click', selecionarCarro);
    document.getElementById('btnFarol').addEventListener('click', toggleFarois);
    document.getElementById('btnSalvarFarois').addEventListener('click', salvarFarois);
    
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
    
    // Carregar posições salvas
    const salvos = localStorage.getItem('posicoes_farois');
    if (salvos) {
        try {
            posicoesFarois = JSON.parse(salvos);
            atualizarPosicoesFarois();
        } catch(e) {}
    }
    
    console.log('🚀 Sistema simplificado - Carro no centro e no chão!');
});
