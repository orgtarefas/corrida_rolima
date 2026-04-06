// ==================== MAIN.JS COMPLETO AJUSTADO ====================
// Sistema de Seleção de Carros - Rolimã Racer

// Variáveis globais
let currentPlayer = null;
let currentRoom = null;
let raceActive = false;
let keysPressed = {};

// ==================== SISTEMA DE LOGIN ====================

function login() {
    const playerNameInput = document.getElementById('playerName');
    const playerName = playerNameInput.value.trim();
    
    if (!playerName) {
        alert('Por favor, digite seu nome!');
        return;
    }
    
    currentPlayer = {
        id: 'player_' + Date.now(),
        name: playerName,
        wins: 0,
        points: 100
    };
    
    // Salvar no localStorage
    localStorage.setItem('currentPlayer', JSON.stringify(currentPlayer));
    localStorage.setItem('playerPoints', '100');
    localStorage.setItem('playerWins', '0');
    
    // Inicializar carros desbloqueados
    if (!localStorage.getItem('carrosDesbloqueados')) {
        localStorage.setItem('carrosDesbloqueados', JSON.stringify(['carro1']));
    }
    
    // Inicializar carro selecionado
    if (!localStorage.getItem('carroSelecionado')) {
        localStorage.setItem('carroSelecionado', 'carro1');
    }
    
    // Atualizar interface
    document.getElementById('playerNameDisplay').textContent = `👤 ${playerName}`;
    
    // Atualizar stats
    updatePlayerStats();
    
    // Atualizar UI dos carros
    if (typeof atualizarUIcarro === 'function') {
        atualizarUIcarro();
    }
    
    // Ir para garagem
    showScreen('garageScreen');
}

function logout() {
    currentPlayer = null;
    localStorage.removeItem('currentPlayer');
    showScreen('loginScreen');
    document.getElementById('playerName').value = '';
}

function updatePlayerStats() {
    const wins = localStorage.getItem('playerWins') || '0';
    const points = localStorage.getItem('playerPoints') || '100';
    
    document.getElementById('winsCount').textContent = wins;
    document.getElementById('pointsCount').textContent = points;
}

function addPoints(amount) {
    let points = parseInt(localStorage.getItem('playerPoints') || '100');
    points += amount;
    localStorage.setItem('playerPoints', points);
    updatePlayerStats();
}

function addWin() {
    let wins = parseInt(localStorage.getItem('playerWins') || '0');
    wins++;
    localStorage.setItem('playerWins', wins);
    updatePlayerStats();
}

// ==================== SISTEMA DE CARROS ====================

let carroSelecionadoAtual = null;

function initCarSystem() {
    // Verificar se os carros estão configurados
    if (typeof CARROS === 'undefined') {
        console.warn('CARROS não definido. Verifique se cars-config.js foi carregado.');
        return;
    }
    
    carroSelecionadoAtual = localStorage.getItem('carroSelecionado') || 'carro1';
    
    // Atualizar UI
    if (typeof atualizarUIcarro === 'function') {
        atualizarUIcarro();
    }
    
    // Inicializar visual 3D
    if (typeof atualizarCarro3D === 'function') {
        atualizarCarro3D(carroSelecionadoAtual);
    }
    
    console.log('✅ Sistema de carros inicializado. Carro atual:', carroSelecionadoAtual);
}

function prevCarro() {
    if (typeof CARROS === 'undefined') return;
    
    const carrosIds = Object.keys(CARROS);
    const currentIndex = carrosIds.indexOf(carroSelecionadoAtual);
    
    if (currentIndex > 0) {
        const novoCarro = carrosIds[currentIndex - 1];
        previewCarro(novoCarro);
    }
}

function nextCarro() {
    if (typeof CARROS === 'undefined') return;
    
    const carrosIds = Object.keys(CARROS);
    const currentIndex = carrosIds.indexOf(carroSelecionadoAtual);
    
    if (currentIndex < carrosIds.length - 1) {
        const novoCarro = carrosIds[currentIndex + 1];
        previewCarro(novoCarro);
    }
}

function previewCarro(carId) {
    if (typeof CARROS === 'undefined' || !CARROS[carId]) return;
    
    const carro = CARROS[carId];
    const stats = typeof getCarStats === 'function' ? getCarStats(carId) : carro.stats;
    const desbloqueados = JSON.parse(localStorage.getItem('carrosDesbloqueados') || '["carro1"]');
    const isDesbloqueado = desbloqueados.includes(carId);
    
    // Atualizar preview visual
    const carNameEl = document.getElementById('carName');
    const carStatsEl = document.getElementById('carStats');
    const selectBtn = document.getElementById('selectCarBtn');
    
    if (carNameEl) {
        carNameEl.innerHTML = `${carro.nome} ${!isDesbloqueado ? '🔒' : ''}`;
    }
    
    if (carStatsEl) {
        const starCount = (valor) => {
            const stars = Math.round(valor / 20);
            return '★'.repeat(stars) + '☆'.repeat(5 - stars);
        };
        
        carStatsEl.innerHTML = `
            <span>⚡ Velocidade: ${stats.velocidade}% ${starCount(stats.velocidade)}</span>
            <span>🎮 Controle: ${stats.controle}% ${starCount(stats.controle)}</span>
            <span>💪 Durabilidade: ${stats.durabilidade}% ${starCount(stats.durabilidade)}</span>
            <span>🚀 Aceleração: ${stats.aceleracao}% ${starCount(stats.aceleracao)}</span>
            ${!isDesbloqueado ? `<span style="color:#ffaa00;">💰 Preço: ${carro.preco} pontos</span>` : ''}
        `;
    }
    
    if (selectBtn) {
        selectBtn.textContent = isDesbloqueado ? '✅ SELECIONAR CARRO' : `🔓 DESBLOQUEAR (${carro.preco} pts)`;
        selectBtn.style.opacity = '1';
        selectBtn.disabled = false;
    }
    
    // Armazenar carro em preview
    carroSelecionadoAtual = carId;
    
    // Atualizar visual 3D (prévia)
    if (typeof atualizarCarro3D === 'function') {
        atualizarCarro3D(carId);
    }
}

function selecionarCarroAtual() {
    if (!carroSelecionadoAtual) return;
    
    const desbloqueados = JSON.parse(localStorage.getItem('carrosDesbloqueados') || '["carro1"]');
    
    if (desbloqueados.includes(carroSelecionadoAtual)) {
        // Carro já desbloqueado - apenas selecionar
        localStorage.setItem('carroSelecionado', carroSelecionadoAtual);
        
        if (typeof selecionarCarro === 'function') {
            selecionarCarro(carroSelecionadoAtual);
        }
        
        alert(`✅ ${CARROS[carroSelecionadoAtual].nome} selecionado!`);
        
        // Atualizar UI
        if (typeof atualizarUIcarro === 'function') {
            atualizarUIcarro();
        }
    } else {
        // Tentar desbloquear
        const pontos = parseInt(localStorage.getItem('playerPoints') || '100');
        const preco = CARROS[carroSelecionadoAtual].preco;
        
        if (pontos >= preco) {
            // Desbloquear carro
            desbloqueados.push(carroSelecionadoAtual);
            localStorage.setItem('carrosDesbloqueados', JSON.stringify(desbloqueados));
            localStorage.setItem('playerPoints', pontos - preco);
            localStorage.setItem('carroSelecionado', carroSelecionadoAtual);
            
            if (typeof selecionarCarro === 'function') {
                selecionarCarro(carroSelecionadoAtual);
            }
            
            updatePlayerStats();
            alert(`🎉 PARABÉNS! ${CARROS[carroSelecionadoAtual].nome} desbloqueado!`);
            
            // Atualizar UI
            if (typeof atualizarUIcarro === 'function') {
                atualizarUIcarro();
            }
        } else {
            alert(`❌ Pontos insuficientes! Faltam ${preco - pontos} pontos para desbloquear ${CARROS[carroSelecionadoAtual].nome}.`);
        }
    }
}

// ==================== SISTEMA DE CORRIDA ====================

let distanciaTotal = 1000;
let corridaAtiva = false;

function createSoloRoom() {
    if (!currentPlayer) {
        alert('Faça login primeiro!');
        return;
    }
    
    // Pegar distancia selecionada
    const distanceSpan = document.getElementById('distanceValue');
    distanciaTotal = parseInt(distanceSpan.textContent) || 1000;
    
    // Pegar carro selecionado
    const carroId = localStorage.getItem('carroSelecionado') || 'carro1';
    const carroStats = typeof getCarStats === 'function' ? getCarStats(carroId) : null;
    
    console.log(`🏁 Iniciando corrida solo!`);
    console.log(`📏 Distância: ${distanciaTotal}m`);
    console.log(`🚗 Carro: ${carroId}`);
    
    // Atualizar HUD
    document.getElementById('totalDistance').textContent = distanciaTotal;
    document.getElementById('raceDistance').textContent = '0';
    document.getElementById('raceSpeed').textContent = '0';
    document.getElementById('raceDurability').textContent = '100';
    
    // Iniciar corrida
    showScreen('raceScreen');
    corridaAtiva = true;
    
    // Iniciar lógica da corrida
    startRaceLogic(carroStats);
}

function startRaceLogic(carroStats) {
    let distanciaPercorrida = 0;
    let velocidadeAtual = 0;
    let durabilidade = 100;
    let aceleracaoBase = carroStats ? carroStats.aceleracao / 10 : 8;
    let velocidadeMaxBase = carroStats ? carroStats.velocidade * 1.5 : 120;
    
    const updateInterval = setInterval(() => {
        if (!corridaAtiva) {
            clearInterval(updateInterval);
            return;
        }
        
        // Controles do jogador
        if (keysPressed['s'] || keysPressed['arrowdown']) {
            // Frear
            velocidadeAtual = Math.max(0, velocidadeAtual - 5);
        } else {
            // Acelerar
            velocidadeAtual = Math.min(velocidadeMaxBase, velocidadeAtual + aceleracaoBase);
        }
        
        // Atualizar distância
        distanciaPercorrida += velocidadeAtual * 0.016; // ~60fps
        distanciaPercorrida = Math.min(distanciaTotal, distanciaPercorrida);
        
        // Perder durabilidade por velocidade alta (opcional)
        if (velocidadeAtual > velocidadeMaxBase * 0.8) {
            durabilidade -= 0.1;
        }
        durabilidade = Math.max(0, durabilidade);
        
        // Atualizar HUD
        document.getElementById('raceDistance').textContent = Math.floor(distanciaPercorrida);
        document.getElementById('raceSpeed').textContent = Math.floor(velocidadeAtual);
        document.getElementById('raceDurability').textContent = Math.floor(durabilidade);
        
        // Verificar fim da corrida
        if (distanciaPercorrida >= distanciaTotal) {
            clearInterval(updateInterval);
            finishRace(true);
        }
        
        // Verificar destruição
        if (durabilidade <= 0) {
            clearInterval(updateInterval);
            finishRace(false);
        }
        
    }, 16); // ~60fps
}

function finishRace(venceu) {
    corridaAtiva = false;
    
    if (venceu) {
        // Calcular pontos ganhos
        const pontosGanhos = Math.floor(distanciaTotal / 10) + 50;
        addPoints(pontosGanhos);
        addWin();
        
        document.getElementById('resultTitle').textContent = '🏆 VITÓRIA! 🏆';
        document.getElementById('resultMessage').innerHTML = `
            Você completou a descida!<br>
            🎉 Ganhou ${pontosGanhos} pontos!<br>
            🚗 Distância: ${distanciaTotal}m
        `;
    } else {
        document.getElementById('resultTitle').textContent = '💥 QUEBROU! 💥';
        document.getElementById('resultMessage').innerHTML = `
            Seu carrinho não resistiu à descida!<br>
            📏 Você percorreu ${document.getElementById('raceDistance').textContent}m<br>
            Tente novamente com mais cuidado!
        `;
    }
    
    showScreen('resultScreen');
}

function exitRace() {
    if (corridaAtiva) {
        corridaAtiva = false;
        if (typeof stopGame3D === 'function') stopGame3D();
        showScreen('garageScreen');
        updatePlayerStats();
        if (typeof atualizarUIcarro === 'function') atualizarUIcarro();
    }
}

// ==================== SISTEMA DE TELAS ====================

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(screenId);
    if (target) target.classList.add('active');
    
    // Atualizar garagem quando mostrar
    if (screenId === 'garageScreen') {
        updatePlayerStats();
        if (typeof atualizarUIcarro === 'function') atualizarUIcarro();
    }
}

// ==================== EVENTOS E INICIALIZAÇÃO ====================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 Rolimã Racer - Inicializando...');
    
    // Verificar se já tem jogador logado
    const savedPlayer = localStorage.getItem('currentPlayer');
    if (savedPlayer) {
        try {
            currentPlayer = JSON.parse(savedPlayer);
            document.getElementById('playerNameDisplay').textContent = `👤 ${currentPlayer.name}`;
            updatePlayerStats();
            showScreen('garageScreen');
        } catch(e) {
            showScreen('loginScreen');
        }
    } else {
        showScreen('loginScreen');
    }
    
    // ========== LOGIN ==========
    const loginBtn = document.getElementById('loginBtn');
    const playerNameInput = document.getElementById('playerName');
    
    if (loginBtn) {
        loginBtn.onclick = login;
    }
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') login();
        });
    }
    
    // ========== LOGOUT ==========
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) logoutBtn.onclick = logout;
    
    // ========== NAVEGAÇÃO DE CARROS ==========
    const prevCarBtn = document.getElementById('prevCarBtn');
    const nextCarBtn = document.getElementById('nextCarBtn');
    const selectCarBtn = document.getElementById('selectCarBtn');
    
    if (prevCarBtn) prevCarBtn.onclick = prevCarro;
    if (nextCarBtn) nextCarBtn.onclick = nextCarro;
    if (selectCarBtn) selectCarBtn.onclick = selecionarCarroAtual;
    
    // ========== CRIAÇÃO DE CORRIDA SOLO ==========
    const createSoloRoomBtn = document.getElementById('createSoloRoomBtn');
    if (createSoloRoomBtn) createSoloRoomBtn.onclick = createSoloRoom;
    
    // ========== CONTROLES DE DISTÂNCIA ==========
    let distanceVal = 1000;
    const distanceValueSpan = document.getElementById('distanceValue');
    const distMinus = document.getElementById('distMinus');
    const distPlus = document.getElementById('distPlus');
    
    if (distanceValueSpan) distanceValueSpan.textContent = distanceVal;
    
    if (distMinus) {
        distMinus.onclick = () => {
            if (distanceVal > 300) {
                distanceVal -= 100;
                distanceValueSpan.textContent = distanceVal;
            }
        };
    }
    
    if (distPlus) {
        distPlus.onclick = () => {
            if (distanceVal < 5000) {
                distanceVal += 100;
                distanceValueSpan.textContent = distanceVal;
            }
        };
    }
    
    // ========== SAIR DA CORRIDA ==========
    const exitRaceBtn = document.getElementById('exitRaceBtn');
    if (exitRaceBtn) exitRaceBtn.onclick = exitRace;
    
    // ========== VOLTAR DA CORRIDA ==========
    const backToGarageBtn = document.getElementById('backToGarageBtn');
    if (backToGarageBtn) {
        backToGarageBtn.onclick = () => {
            if (typeof stopGame3D === 'function') stopGame3D();
            showScreen('garageScreen');
            updatePlayerStats();
            if (typeof atualizarUIcarro === 'function') atualizarUIcarro();
        };
    }
    
    // ========== CONTROLES DO TECLADO ==========
    window.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        
        if (key === 'a' || key === 'd' || key === 'arrowleft' || key === 'arrowright') {
            keysPressed[key] = true;
            e.preventDefault();
        }
        
        if (key === 's' || key === 'arrowdown') {
            keysPressed['s'] = true;
            e.preventDefault();
        }
    });
    
    window.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        delete keysPressed[key];
        delete keysPressed['arrowleft'];
        delete keysPressed['arrowright'];
        delete keysPressed['arrowdown'];
    });
    
    // ========== INICIALIZAR SISTEMA DE CARROS ==========
    setTimeout(() => {
        initCarSystem();
    }, 500);
    
    console.log('✅ Main.js inicializado com sucesso!');
});