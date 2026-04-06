import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ===== CONFIGURAÇÕES =====
let scene, camera, renderer;
let carroModelo = null;
let cenarioModelo = null;

// Estado do carro
let carro = {
    velocidade: 0,
    angulo: 0,
    x: 0,
    z: 0
};

// Teclas
const teclas = {
    ArrowUp: false, ArrowDown: false,
    ArrowLeft: false, ArrowRight: false,
    KeyW: false, KeyS: false,
    KeyA: false, KeyD: false,
    Space: false
};

// ===== INICIALIZAR CENA =====
function init() {
    // Cena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 50, 100);
    
    // Câmera
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Renderizador
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.body.appendChild(renderer.domElement);
    
    // Luzes
    const luzAmbiente = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(luzAmbiente);
    
    const luzSol = new THREE.DirectionalLight(0xffffff, 1);
    luzSol.position.set(10, 20, 5);
    luzSol.castShadow = true;
    scene.add(luzSol);
    
    // Carregar objetos
    carregarCenario();
    carregarCarro();
    
    // Eventos
    window.addEventListener('keydown', (e) => {
        if (teclas.hasOwnProperty(e.code)) teclas[e.code] = true;
        if (e.code === 'Space') e.preventDefault();
    });
    window.addEventListener('keyup', (e) => {
        if (teclas.hasOwnProperty(e.code)) teclas[e.code] = false;
    });
    
    // Iniciar animação
    animate();
}

// ===== CARREGAR CENÁRIO (scene.glb) =====
function carregarCenario() {
    const loader = new GLTFLoader();
    // PROcurando por scene.glb dentro de maps/map1/
    const caminhos = [
        './models/maps/map1/scene.glb',
        'models/maps/map1/scene.glb',
        '/models/maps/map1/scene.glb',
        './models/maps/map1/map1.glb',
        'models/maps/map1/map1.glb'
    ];
    
    let tentativa = 0;
    
    function tentarCarregar() {
        if (tentativa >= caminhos.length) {
            document.getElementById('loading').innerHTML = '❌ Cenário não encontrado! Verifique a pasta models/maps/map1/';
            document.getElementById('loading').style.background = 'rgba(255,0,0,0.8)';
            console.error('Cenário não encontrado em nenhum caminho');
            return;
        }
        
        console.log('Tentando carregar:', caminhos[tentativa]);
        document.getElementById('loading').innerHTML = `Carregando cenário... (tentativa ${tentativa + 1})`;
        
        loader.load(caminhos[tentativa],
            (gltf) => {
                cenarioModelo = gltf.scene;
                cenarioModelo.position.y = -1.5;
                cenarioModelo.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(cenarioModelo);
                console.log('✅ Cenário carregado de:', caminhos[tentativa]);
                verificarCarregamento();
            },
            undefined,
            (erro) => {
                console.warn('Falha ao carregar:', caminhos[tentativa]);
                tentativa++;
                tentarCarregar();
            }
        );
    }
    
    tentarCarregar();
}

// ===== CARREGAR CARRO =====
function carregarCarro() {
    const loader = new GLTFLoader();
    const caminhos = [
        './models/car1/car1.glb',
        'models/car1/car1.glb',
        '/models/car1/car1.glb'
    ];
    
    let tentativa = 0;
    
    function tentarCarregar() {
        if (tentativa >= caminhos.length) {
            document.getElementById('loading').innerHTML = '❌ Carro não encontrado! Verifique a pasta models/car1/';
            document.getElementById('loading').style.background = 'rgba(255,0,0,0.8)';
            console.error('Carro não encontrado');
            return;
        }
        
        console.log('Tentando carregar carro:', caminhos[tentativa]);
        
        loader.load(caminhos[tentativa],
            (gltf) => {
                carroModelo = gltf.scene;
                
                // Ajustar tamanho
                const caixa = new THREE.Box3().setFromObject(carroModelo);
                const tamanho = caixa.getSize(new THREE.Vector3());
                const escala = 0.8 / Math.max(tamanho.x, tamanho.y, tamanho.z);
                
                carroModelo.scale.set(escala, escala, escala);
                carroModelo.position.y = -1.2;
                carroModelo.castShadow = true;
                
                scene.add(carroModelo);
                console.log('✅ Carro carregado de:', caminhos[tentativa]);
                verificarCarregamento();
            },
            undefined,
            (erro) => {
                console.warn('Falha carro:', caminhos[tentativa]);
                tentativa++;
                tentarCarregar();
            }
        );
    }
    
    tentarCarregar();
}

// ===== VERIFICAR SE TUDO CARREGOU =====
function verificarCarregamento() {
    if (carroModelo && cenarioModelo) {
        document.getElementById('loading').style.display = 'none';
        console.log('🎉 Tudo carregado! Use WASD para dirigir');
    }
}

// ===== ATUALIZAR VELOCÍMETRO =====
function atualizarVelocimetro() {
    const vel = Math.abs(Math.floor(carro.velocidade));
    document.getElementById('velocimetro').innerHTML = `${vel} km/h`;
    
    // Mudar cor baseado na velocidade
    if (vel > 150) {
        document.getElementById('velocimetro').style.color = '#ff0000';
        document.getElementById('velocimetro').style.borderColor = '#ff0000';
    } else if (vel > 80) {
        document.getElementById('velocimetro').style.color = '#ffff00';
        document.getElementById('velocimetro').style.borderColor = '#ffff00';
    } else {
        document.getElementById('velocimetro').style.color = '#00ff00';
        document.getElementById('velocimetro').style.borderColor = '#00ff00';
    }
}

// ===== FÍSICA DO CARRO =====
function atualizarFisica() {
    if (!carroModelo) return;
    
    // Acelerar (W ou ↑)
    if (teclas.ArrowUp || teclas.KeyW) {
        carro.velocidade = Math.min(carro.velocidade + 0.5, 200);
    }
    // Frear/Ré (S ou ↓)
    else if (teclas.ArrowDown || teclas.KeyS) {
        carro.velocidade = Math.max(carro.velocidade - 0.8, -80);
    }
    // Resistência
    else {
        carro.velocidade *= 0.98;
        if (Math.abs(carro.velocidade) < 0.1) carro.velocidade = 0;
    }
    
    // Direção (A/D ou ←/→)
    let direcao = 0;
    if (teclas.ArrowLeft || teclas.KeyA) direcao = -1;
    if (teclas.ArrowRight || teclas.KeyD) direcao = 1;
    
    if (Math.abs(carro.velocidade) > 1) {
        const forcaDirecao = 0.05 * (Math.abs(carro.velocidade) / 200);
        carro.angulo += direcao * forcaDirecao;
    }
    
    // Drift (Espaço)
    if (teclas.Space && Math.abs(carro.velocidade) > 30) {
        carro.angulo += direcao * 0.03;
        carro.velocidade *= 0.99;
    }
    
    // Atualizar posição
    carro.x += Math.sin(carro.angulo) * carro.velocidade * 0.05;
    carro.z += Math.cos(carro.angulo) * carro.velocidade * 0.05;
    
    // Aplicar ao modelo
    carroModelo.position.x = carro.x;
    carroModelo.position.z = carro.z;
    carroModelo.rotation.y = carro.angulo;
    
    // Efeito visual de inclinação
    carroModelo.rotation.z = direcao * 0.1;
    
    // Atualizar velocímetro
    atualizarVelocimetro();
    
    // Atualizar câmera (segue o carro)
    const alvoX = carro.x;
    const alvoZ = carro.z;
    const cameraX = alvoX - Math.sin(carro.angulo) * 8;
    const cameraZ = alvoZ - Math.cos(carro.angulo) * 8;
    
    camera.position.x = cameraX;
    camera.position.z = cameraZ;
    camera.position.y = carroModelo.position.y + 2.5;
    camera.lookAt(alvoX, carroModelo.position.y + 0.5, alvoZ);
}

// ===== ANIMAÇÃO =====
function animate() {
    requestAnimationFrame(animate);
    atualizarFisica();
    renderer.render(scene, camera);
}

// ===== REDIMENSIONAR =====
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ===== INICIAR =====
init();
