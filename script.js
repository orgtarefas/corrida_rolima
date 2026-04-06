import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { MTLLoader } from 'three/addons/loaders/MTLLoader.js';
import { database } from './firebase-config.js';
import { ref, get, set, update, onValue } from 'firebase/database';

// ==================== CONFIGURAÇÃO ====================
const modeloPath = './models/car1/car1.obj';
const mtlPath = './models/car1/car1.mtl';

// Variáveis globais
let currentCar = null;
let currentScene = null;
let pontosJogador = 0;
let playerId = 'jogador_teste'; // Depois você pode implementar login

// Configuração dos carros disponíveis
const carrosDisponiveis = {
    carro1: {
        id: 'carro1',
        nome: '🔥 Fúria Vermelha',
        caminho: './models/car1/car1.obj',
        mtl: './models/car1/car1.mtl',
        preco: 0,
        stats: { velocidade: 85, controle: 70, durabilidade: 65, aceleracao: 90 }
    },
    carro2: {
        id: 'carro2',
        nome: '💪 Touro Azul',
        caminho: './models/car2/car2.obj', // Você vai adicionar depois
        mtl: './models/car2/car2.mtl',
        preco: 500,
        stats: { velocidade: 60, controle: 50, durabilidade: 95, aceleracao: 45 }
    }
};

// ==================== CENA 3D ====================
function initScene() {
    // Cena
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111122);
    scene.fog = new THREE.Fog(0x111122, 10, 30);
    
    // Câmera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(4, 3, 5);
    camera.lookAt(0, 0.5, 0);
    
    // Renderizador
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);
    
    // Controles
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
    
    const topLight = new THREE.PointLight(0xffffff, 0.3);
    topLight.position.set(0, 5, 0);
    scene.add(topLight);
    
    // Chão com grade
    const gridHelper = new THREE.GridHelper(10, 20, 0x888888, 0x444444);
    gridHelper.position.y = -0.5;
    scene.add(gridHelper);
    
    const shadowPlane = new THREE.Mesh(
        new THREE.PlaneGeometry(8, 8),
        new THREE.ShadowMaterial({ opacity: 0.3, color: 0x000000, transparent: true, side: THREE.DoubleSide })
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.5;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);
    
    // Animação
    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
    
    // Redimensionamento
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    return { scene, camera, controls, renderer };
}

// ==================== CARREGAR MODELO 3D ====================
function carregarModelo(caminhoOBJ, caminhoMTL = null, corPadrao = 0xcc3333) {
    if (currentCar) {
        currentScene.remove(currentCar);
    }
    
    const infoDiv = document.getElementById('info');
    infoDiv.innerHTML = '🚗 Carregando modelo 3D...';
    
    const finalizarModelo = (object) => {
        // Calcular bounding box para ajuste automático
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
        
        // Habilitar sombras e ajustar materiais
        object.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                
                // Se não tiver material, cria um material padrão
                if (!child.material) {
                    child.material = new THREE.MeshStandardMaterial({
                        color: corPadrao,
                        roughness: 0.4,
                        metalness: 0.6
                    });
                }
            }
        });
        
        currentScene.add(object);
        currentCar = object;
        
        infoDiv.innerHTML = `✅ Modelo carregado!<br>⭐ Pontos: ${pontosJogador}`;
    };
    
    const progressoModelo = (progress) => {
        if (progress.total) {
            const percent = (progress.loaded / progress.total * 100).toFixed(0);
            infoDiv.innerHTML = `🚗 Carregando: ${percent}%`;
        }
    };
    
    const erroModelo = (error) => {
        console.error('Erro ao carregar modelo:', error);
        infoDiv.innerHTML = '❌ Erro ao carregar modelo! Verifique o console (F12)';
    };
    
    // Tentar carregar com MTL primeiro
    if (caminhoMTL) {
        fetch(caminhoMTL, { method: 'HEAD' })
            .then(response => {
                if (response.ok) {
                    const mtlLoader = new MTLLoader();
                    mtlLoader.setPath(caminhoMTL.substring(0, caminhoMTL.lastIndexOf('/') + 1));
                    mtlLoader.load(caminhoMTL, (materials) => {
                        materials.preload();
                        const objLoader = new OBJLoader();
                        objLoader.setMaterials(materials);
                        objLoader.load(caminhoOBJ, finalizarModelo, progressoModelo, erroModelo);
                    }, undefined, () => {
                        carregarSemMTL(caminhoOBJ, corPadrao);
                    });
                } else {
                    carregarSemMTL(caminhoOBJ, corPadrao);
                }
            })
            .catch(() => carregarSemMTL(caminhoOBJ, corPadrao));
    } else {
        carregarSemMTL(caminhoOBJ, corPadrao);
    }
    
    function carregarSemMTL(objPath, cor) {
        const objLoader = new OBJLoader();
        objLoader.load(objPath, finalizarModelo, progressoModelo, erroModelo);
    }
}

// ==================== FIREBASE FUNCTIONS ====================

// Carregar dados do jogador do Firebase
function carregarDadosJogador() {
    const playerRef = ref(database, `jogadores/${playerId}`);
    
    onValue(playerRef, (snapshot) => {
        const data = snapshot.val();
        
        if (data) {
            pontosJogador = data.pontos || 0;
            
            // Atualizar botões baseado nos carros desbloqueados
            const desbloqueados = data.carrosDesbloqueados || ['carro1'];
            Object.keys(carrosDisponiveis).forEach(carId => {
                const btn = document.querySelector(`.car-btn[data-car="${carId}"]`);
                if (btn) {
                    const isDesbloqueado = desbloqueados.includes(carId);
                    if (isDesbloqueado) {
                        btn.classList.remove('locked');
                        btn.disabled = false;
                    } else {
                        btn.classList.add('locked');
                        btn.disabled = true;
                        btn.title = `Precisa de ${carrosDisponiveis[carId].preco} pontos`;
                    }
                }
            });
            
            // Carregar carro selecionado
            const carroSelecionado = data.carroSelecionado || 'carro1';
            const carro = carrosDisponiveis[carroSelecionado];
            if (carro && desbloqueados.includes(carroSelecionado)) {
                carregarModelo(carro.caminho, carro.mtl);
                destacarBotao(carroSelecionado);
            } else {
                carregarModelo(carrosDisponiveis.carro1.caminho, carrosDisponiveis.carro1.mtl);
                destacarBotao('carro1');
            }
        } else {
            // Criar novo jogador
            const novoJogador = {
                pontos: 100,
                carrosDesbloqueados: ['carro1'],
                carroSelecionado: 'carro1',
                vitorias: 0
            };
            set(playerRef, novoJogador);
            pontosJogador = 100;
            carregarModelo(carrosDisponiveis.carro1.caminho, carrosDisponiveis.carro1.mtl);
        }
        
        atualizarInfoTela();
    });
}

// Salvar pontos no Firebase
function salvarPontos(novosPontos) {
    const playerRef = ref(database, `jogadores/${playerId}/pontos`);
    set(playerRef, novosPontos);
    pontosJogador = novosPontos;
    atualizarInfoTela();
}

// Desbloquear carro
function desbloquearCarro(carroId) {
    const carro = carrosDisponiveis[carroId];
    if (!carro) return false;
    
    if (pontosJogador >= carro.preco) {
        const novosPontos = pontosJogador - carro.preco;
        
        // Atualizar pontos e desbloqueios no Firebase
        const playerRef = ref(database, `jogadores/${playerId}`);
        
        get(playerRef).then((snapshot) => {
            const data = snapshot.val();
            const desbloqueados = data.carrosDesbloqueados || ['carro1'];
            
            if (!desbloqueados.includes(carroId)) {
                desbloqueados.push(carroId);
                update(playerRef, {
                    pontos: novosPontos,
                    carrosDesbloqueados: desbloqueados
                });
                
                pontosJogador = novosPontos;
                alert(`🎉 ${carro.nome} desbloqueado!`);
                
                // Habilitar botão
                const btn = document.querySelector(`.car-btn[data-car="${carroId}"]`);
                if (btn) {
                    btn.classList.remove('locked');
                    btn.disabled = false;
                }
                
                return true;
            }
        });
        return true;
    } else {
        alert(`❌ Pontos insuficientes! Faltam ${carro.preco - pontosJogador} pontos`);
        return false;
    }
}

// Selecionar carro
function selecionarCarro(carroId) {
    const carro = carrosDisponiveis[carroId];
    if (!carro) return;
    
    // Verificar se está desbloqueado
    const playerRef = ref(database, `jogadores/${playerId}`);
    get(playerRef).then((snapshot) => {
        const data = snapshot.val();
        const desbloqueados = data.carrosDesbloqueados || ['carro1'];
        
        if (desbloqueados.includes(carroId)) {
            // Salvar seleção no Firebase
            update(playerRef, { carroSelecionado: carroId });
            carregarModelo(carro.caminho, carro.mtl);
            destacarBotao(carroId);
        } else {
            // Tentar desbloquear
            desbloquearCarro(carroId);
        }
    });
}

function destacarBotao(carroId) {
    document.querySelectorAll('.car-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.car === carroId) {
            btn.classList.add('active');
        }
    });
}

function atualizarInfoTela() {
    const infoDiv = document.getElementById('info');
    infoDiv.innerHTML = `🚗 Rolimã Racer<br>⭐ Pontos: ${pontosJogador}`;
}

// ==================== CRIAR BOTÕES DE SELEÇÃO ====================
function criarBotoesSelecao() {
    const selectorDiv = document.createElement('div');
    selectorDiv.className = 'car-selector';
    
    Object.keys(carrosDisponiveis).forEach(carroId => {
        const carro = carrosDisponiveis[carroId];
        const btn = document.createElement('button');
        btn.className = 'car-btn';
        btn.dataset.car = carroId;
        btn.textContent = `${carro.nome} ${carro.preco > 0 ? `(${carro.preco} pts)` : ''}`;
        btn.onclick = () => selecionarCarro(carroId);
        selectorDiv.appendChild(btn);
    });
    
    document.body.appendChild(selectorDiv);
}

// ==================== INICIALIZAÇÃO ====================
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar cena 3D
    const { scene } = initScene();
    currentScene = scene;
    
    // Criar botões de seleção
    criarBotoesSelecao();
    
    // Carregar dados do Firebase
    carregarDadosJogador();
    
    console.log('🚀 Sistema inicializado com Firebase Realtime Database');
});
