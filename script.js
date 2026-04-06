import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { 
    salvarConfiguracaoCarro, 
    carregarConfiguracaoCarro, 
    salvarEstatistica,
    listarConfiguracoes,
    excluirConfiguracao,
    ouvirMudancasCarro 
} from './firebase-config.js';

// ========== CONFIGURAÇÕES ==========
let scene, camera, renderer, controls;
let carModel = null;
let carroId = 'carro_principal'; // ID único para este carro

// Cores disponíveis
const coresDisponiveis = {
    vermelho: 0xff3333,
    azul: 0x3366ff,
    verde: 0x33ff66,
    amarelo: 0xffcc00,
    preto: 0x222222,
    branco: 0xeeeeee,
    prata: 0xcccccc,
    laranja: 0xff6600,
    roxo: 0x9933ff,
    rosa: 0xff66cc
};

const coresListras = {
    branco: 0xffffff,
    preto: 0x000000,
    amarelo: 0xffcc00,
    vermelho: 0xff3333,
    azul: 0x3366ff,
    dourado: 0xffaa33,
    prata: 0xcccccc
};

// Configuração atual
let configCarro = {
    corPrincipal: 0xff3333,
    corListra: 0xffffff,
    listrasAtivas: true,
    estiloListra: 'dupla',
    ultimaAtualizacao: Date.now()
};

let carregandoConfig = false;

// ========== INICIALIZAÇÃO ==========
async function init() {
    initGaragem();
    await carregarConfiguracoesDoFirebase();
    carregarCarro();
    setupEventListeners();
}

function initGaragem() {
    const container = document.getElementById('canvas-container');
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a2e);
    scene.fog = new THREE.FogExp2(0x1a1a2e, 0.008);
    
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(5, 3, 6);
    camera.lookAt(0, 0.2, 0);
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = false;
    controls.enableZoom = true;
    controls.enablePan = true;
    controls.target.set(0, 0.3, 0);
    
    // Luzes
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const mainLight = new THREE.DirectionalLight(0xfff5e0, 1.2);
    mainLight.position.set(5, 8, 4);
    mainLight.castShadow = true;
    mainLight.receiveShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);
    
    const fillLight = new THREE.PointLight(0x4466cc, 0.3);
    fillLight.position.set(-2, 3, 4);
    scene.add(fillLight);
    
    const backLight = new THREE.PointLight(0xffaa66, 0.4);
    backLight.position.set(0, 2, -3);
    scene.add(backLight);
    
    criarGaragem();
    animate();
}

function criarGaragem() {
    // Chão
    const floorMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x2a2a3a, 
        roughness: 0.3, 
        metalness: 0.1
    });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(12, 12), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.25;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Grid
    const gridHelper = new THREE.GridHelper(12, 20, 0x88aaff, 0x335588);
    gridHelper.position.y = -0.24;
    scene.add(gridHelper);
    
    // Paredes
    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x3a3a4a, roughness: 0.5 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(12, 3, 0.2), wallMaterial);
    backWall.position.set(0, 1.2, -5.8);
    backWall.receiveShadow = true;
    scene.add(backWall);
}

// ========== FIREBASE INTEGRAÇÃO ==========
async function carregarConfiguracoesDoFirebase() {
    carregandoConfig = true;
    mostrarToast('📡 Carregando configurações salvas...', 'info');
    
    const configuracaoSalva = await carregarConfiguracaoCarro(carroId);
    
    if (configuracaoSalva) {
        configCarro = {
            ...configCarro,
            ...configuracaoSalva
        };
        console.log('✅ Configuração carregada do Firebase:', configCarro);
        mostrarToast('🎨 Configuração carregada com sucesso!', 'success');
    } else {
        console.log('ℹ️ Nenhuma configuração salva encontrada. Usando padrão.');
        mostrarToast('✨ Usando configuração padrão', 'info');
    }
    
    carregandoConfig = false;
    
    // Atualizar UI com configuração carregada
    atualizarUI();
}

async function salvarConfiguracoesNoFirebase() {
    if (carregandoConfig) return;
    
    configCarro.ultimaAtualizacao = Date.now();
    const sucesso = await salvarConfiguracaoCarro(carroId, configCarro);
    
    if (sucesso) {
        mostrarToast('💾 Configuração salva no Firebase!', 'success');
        
        // Salvar estatística
        const corNome = Object.keys(coresDisponiveis).find(
            key => coresDisponiveis[key] === configCarro.corPrincipal
        );
        await salvarEstatistica('personalizacao', corNome || 'desconhecida', {
            listrasAtivas: configCarro.listrasAtivas,
            estiloListra: configCarro.estiloListra
        });
    } else {
        mostrarToast('❌ Erro ao salvar configuração', 'error');
    }
}

function atualizarUI() {
    // Atualizar botão de listras
    const btnToggle = document.getElementById('btnToggleListras');
    if (btnToggle) {
        btnToggle.textContent = configCarro.listrasAtivas ? '🔘 Remover Listras' : '✅ Mostrar Listras';
    }
    
    // Atualizar estilo ativo
    document.querySelectorAll('.btn-estilo').forEach(btn => {
        btn.classList.remove('ativo');
    });
    const estiloBtn = document.getElementById(`btnListra${configCarro.estiloListra.charAt(0).toUpperCase() + configCarro.estiloListra.slice(1)}`);
    if (estiloBtn) estiloBtn.classList.add('ativo');
}

// ========== CARREGAR CARRO ==========
function carregarCarro() {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.classList.remove('hidden');
    
    const loader = new GLTFLoader();
    
    // Tentar carregar de diferentes caminhos
    const caminhos = [
        './models/car1/car1.glb',
        './models/car1.glb',
        '/models/car1/car1.glb'
    ];
    
    function tentarCarregar(index = 0) {
        if (index >= caminhos.length) {
            console.error('❌ Não foi possível carregar o modelo');
            loadingDiv.innerHTML = '<div class="spinner"></div><p>❌ Erro! Verifique o arquivo car1.glb</p>';
            return;
        }
        
        console.log(`📁 Tentando carregar: ${caminhos[index]}`);
        
        loader.load(caminhos[index],
            (gltf) => {
                carModel = gltf.scene;
                
                // Ajustar posição e escala
                const box = new THREE.Box3().setFromObject(carModel);
                const size = box.getSize(new THREE.Vector3());
                const center = box.getCenter(new THREE.Vector3());
                const maxDim = Math.max(size.x, size.y, size.z);
                const scale = 1.2 / maxDim;
                
                carModel.scale.set(scale, scale, scale);
                carModel.position.set(
                    -center.x * scale,
                    -center.y * scale - 0.04,
                    -center.z * scale
                );
                
                // Configurar materiais
                carModel.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        
                        if (child.material) {
                            const nomeLower = child.name.toLowerCase();
                            const corAtual = child.material.color ? child.material.color.getHex() : null;
                            
                            if (nomeLower.includes('stripe') || nomeLower.includes('listra') || 
                                nomeLower.includes('line') || corAtual === 0xffffff) {
                                child.material.userData = { tipo: 'listra', original: corAtual };
                            } else if (nomeLower.includes('body') || nomeLower.includes('carroceria') ||
                                     nomeLower.includes('paint') || corAtual === 0xff3333) {
                                child.material.userData = { tipo: 'carroceria', original: corAtual };
                            } else {
                                child.material.userData = { tipo: 'outro', original: corAtual };
                            }
                        }
                    }
                });
                
                scene.add(carModel);
                aplicarPersonalizacao();
                
                loadingDiv.classList.add('hidden');
                mostrarToast('🚗 Carro carregado com sucesso!', 'success');
                console.log('✅ Carro carregado e personalização aplicada!');
            },
            (progress) => {
                if (progress.total) {
                    const percent = Math.round(progress.loaded / progress.total * 100);
                    const p = document.querySelector('#loading p');
                    if (p) p.textContent = `Carregando... ${percent}%`;
                }
            },
            (error) => {
                console.warn(`❌ Falha ao carregar ${caminhos[index]}:`, error);
                tentarCarregar(index + 1);
            }
        );
    }
    
    tentarCarregar();
}

// ========== APLICAR PERSONALIZAÇÃO ==========
function aplicarPersonalizacao() {
    if (!carModel) return;
    
    carModel.traverse((child) => {
        if (child.isMesh && child.material) {
            const tipo = child.material.userData?.tipo;
            
            if (tipo === 'carroceria') {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => {
                        mat.color.setHex(configCarro.corPrincipal);
                        mat.needsUpdate = true;
                    });
                } else {
                    child.material.color.setHex(configCarro.corPrincipal);
                    child.material.needsUpdate = true;
                }
            }
            else if (tipo === 'listra') {
                if (configCarro.listrasAtivas) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.color.setHex(configCarro.corListra);
                            mat.transparent = false;
                            mat.opacity = 1;
                            mat.needsUpdate = true;
                        });
                    } else {
                        child.material.color.setHex(configCarro.corListra);
                        child.material.transparent = false;
                        child.material.opacity = 1;
                        child.material.needsUpdate = true;
                    }
                } else {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(mat => {
                            mat.transparent = true;
                            mat.opacity = 0;
                            mat.needsUpdate = true;
                        });
                    } else {
                        child.material.transparent = true;
                        child.material.opacity = 0;
                        child.material.needsUpdate = true;
                    }
                }
            }
        }
    });
}

// ========== FUNÇÕES DE PERSONALIZAÇÃO ==========
function mudarCorPrincipal(corKey) {
    configCarro.corPrincipal = coresDisponiveis[corKey];
    aplicarPersonalizacao();
    mostrarToast(`🎨 Cor: ${corKey}`, 'success');
    salvarConfiguracoesNoFirebase();
}

function mudarCorListra(corKey) {
    configCarro.corListra = coresListras[corKey];
    aplicarPersonalizacao();
    mostrarToast(`🎨 Listras: ${corKey}`, 'success');
    salvarConfiguracoesNoFirebase();
}

function toggleListras() {
    configCarro.listrasAtivas = !configCarro.listrasAtivas;
    aplicarPersonalizacao();
    const btn = document.getElementById('btnToggleListras');
    if (btn) {
        btn.textContent = configCarro.listrasAtivas ? '🔘 Remover Listras' : '✅ Mostrar Listras';
    }
    mostrarToast(configCarro.listrasAtivas ? '🏁 Listras ativadas' : '🏁 Listras removidas', 'success');
    salvarConfiguracoesNoFirebase();
}

function mudarEstiloListra(estilo) {
    configCarro.estiloListra = estilo;
    mostrarToast(`🏁 Estilo: ${estilo}`, 'success');
    
    document.querySelectorAll('.btn-estilo').forEach(btn => {
        btn.classList.remove('ativo');
    });
    document.getElementById(`btnListra${estilo.charAt(0).toUpperCase() + estilo.slice(1)}`)?.classList.add('ativo');
    
    salvarConfiguracoesNoFirebase();
}

// Botão para resetar configuração
async function resetarConfiguracao() {
    if (confirm('Deseja resetar para as configurações padrão?')) {
        configCarro = {
            corPrincipal: 0xff3333,
            corListra: 0xffffff,
            listrasAtivas: true,
            estiloListra: 'dupla',
            ultimaAtualizacao: Date.now()
        };
        aplicarPersonalizacao();
        atualizarUI();
        await salvarConfiguracoesNoFirebase();
        mostrarToast('🔄 Configuração resetada!', 'success');
    }
}

// Botão para carregar última configuração
async function carregarUltimaConfiguracao() {
    await carregarConfiguracoesDoFirebase();
    aplicarPersonalizacao();
    atualizarUI();
}

function mostrarToast(mensagem, tipo = 'success') {
    const toastContainer = document.getElementById('toast');
    const toast = document.createElement('div');
    toast.className = `toast ${tipo === 'error' ? 'error' : tipo === 'info' ? 'info' : 'success'}`;
    toast.textContent = mensagem;
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 2000);
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

// ========== SETUP DOS EVENTOS ==========
function setupEventListeners() {
    // Cores da carroceria
    document.getElementById('btnVermelho')?.addEventListener('click', () => mudarCorPrincipal('vermelho'));
    document.getElementById('btnAzul')?.addEventListener('click', () => mudarCorPrincipal('azul'));
    document.getElementById('btnVerde')?.addEventListener('click', () => mudarCorPrincipal('verde'));
    document.getElementById('btnAmarelo')?.addEventListener('click', () => mudarCorPrincipal('amarelo'));
    document.getElementById('btnPreto')?.addEventListener('click', () => mudarCorPrincipal('preto'));
    document.getElementById('btnBranco')?.addEventListener('click', () => mudarCorPrincipal('branco'));
    document.getElementById('btnPrata')?.addEventListener('click', () => mudarCorPrincipal('prata'));
    document.getElementById('btnLaranja')?.addEventListener('click', () => mudarCorPrincipal('laranja'));
    document.getElementById('btnRoxo')?.addEventListener('click', () => mudarCorPrincipal('roxo'));
    document.getElementById('btnRosa')?.addEventListener('click', () => mudarCorPrincipal('rosa'));
    
    // Cores das listras
    document.getElementById('btnListraBranca')?.addEventListener('click', () => mudarCorListra('branco'));
    document.getElementById('btnListraPreta')?.addEventListener('click', () => mudarCorListra('preto'));
    document.getElementById('btnListraAmarela')?.addEventListener('click', () => mudarCorListra('amarelo'));
    document.getElementById('btnListraVermelha')?.addEventListener('click', () => mudarCorListra('vermelho'));
    document.getElementById('btnListraAzul')?.addEventListener('click', () => mudarCorListra('azul'));
    document.getElementById('btnListraDourada')?.addEventListener('click', () => mudarCorListra('dourado'));
    
    // Controle de listras
    document.getElementById('btnToggleListras')?.addEventListener('click', toggleListras);
    
    // Estilos de listras
    document.getElementById('btnListraDupla')?.addEventListener('click', () => mudarEstiloListra('dupla'));
    document.getElementById('btnListraSimples')?.addEventListener('click', () => mudarEstiloListra('simples'));
    document.getElementById('btnListraRacing')?.addEventListener('click', () => mudarEstiloListra('racing'));
}

// ========== INICIALIZAÇÃO ==========
init().catch(console.error);