// ==================== CONFIGURAÇÃO DOS CARROS ====================
// cars-config.js

const CARROS = {
    // Carro 1: Esportivo Vermelho
    carro1: {
        id: 'carro1',
        nome: '🔥 Furia Vermelha',
        cor: '#ff3333',
        stats: {
            velocidade: 85,
            controle: 70,
            durabilidade: 65,
            aceleracao: 90
        },
        modelo: 'sports_car',  // Referência para o modelo 3D
        preco: 0  // Grátis inicial
    },
    
    // Carro 2: Caminhonete Azul
    carro2: {
        id: 'carro2',
        nome: '💪 Touro Azul',
        cor: '#3366ff',
        stats: {
            velocidade: 60,
            controle: 50,
            durabilidade: 95,
            aceleracao: 45
        },
        modelo: 'truck',
        preco: 500  // Pontos para desbloquear
    }
};

// Carregar carro selecionado do localStorage
let carroSelecionado = localStorage.getItem('carroSelecionado') || 'carro1';

// Função para obter stats do carro com upgrades
function getCarStats(carId) {
    const carro = CARROS[carId];
    if (!carro) return CARROS.carro1.stats;
    
    const stats = { ...carro.stats };
    
    // Aplicar upgrades se existirem
    const upgrades = JSON.parse(localStorage.getItem('carUpgrades') || '{}');
    
    if (upgrades.velocidade) stats.velocidade += upgrades.velocidade * 5;
    if (upgrades.controle) stats.controle += upgrades.controle * 5;
    if (upgrades.durabilidade) stats.durabilidade += upgrades.durabilidade * 5;
    
    // Limitar máximo 100
    Object.keys(stats).forEach(key => {
        stats[key] = Math.min(100, stats[key]);
    });
    
    return stats;
}

// Função para desbloquear carro
function desbloquearCarro(carId) {
    const carro = CARROS[carId];
    if (!carro) return false;
    
    const desbloqueados = JSON.parse(localStorage.getItem('carrosDesbloqueados') || '["carro1"]');
    
    if (desbloqueados.includes(carId)) {
        return true; // Já desbloqueado
    }
    
    // Verificar pontos do jogador
    const pontos = parseInt(localStorage.getItem('playerPoints') || '100');
    
    if (pontos >= carro.preco) {
        desbloqueados.push(carId);
        localStorage.setItem('carrosDesbloqueados', JSON.stringify(desbloqueados));
        localStorage.setItem('playerPoints', pontos - carro.preco);
        return true;
    }
    
    return false;
}

// Função para selecionar carro
function selecionarCarro(carId) {
    if (!CARROS[carId]) return false;
    
    const desbloqueados = JSON.parse(localStorage.getItem('carrosDesbloqueados') || '["carro1"]');
    
    if (!desbloqueados.includes(carId)) {
        // Tentar desbloquear
        if (!desbloquearCarro(carId)) {
            alert(`❌ Pontos insuficientes! Precisa de ${CARROS[carId].preco} pontos.`);
            return false;
        }
    }
    
    carroSelecionado = carId;
    localStorage.setItem('carroSelecionado', carId);
    
    // Atualizar UI
    atualizarUIcarro();
    
    // Atualizar modelo 3D no PlayCanvas
    if (typeof atualizarCarro3D === 'function') {
        atualizarCarro3D(carId);
    }
    
    console.log(`🚗 Carro selecionado: ${CARROS[carId].nome}`);
    return true;
}

// Função para atualizar a UI dos carros
function atualizarUIcarro() {
    const carNameEl = document.getElementById('carName');
    const carStatsEl = document.getElementById('carStats');
    const prevBtn = document.getElementById('prevCarBtn');
    const nextBtn = document.getElementById('nextCarBtn');
    
    if (!carNameEl) return;
    
    const carro = CARROS[carroSelecionado];
    const stats = getCarStats(carroSelecionado);
    const desbloqueados = JSON.parse(localStorage.getItem('carrosDesbloqueados') || '["carro1"]');
    const isDesbloqueado = desbloqueados.includes(carroSelecionado);
    
    // Atualizar nome
    carNameEl.innerHTML = `${carro.nome} ${!isDesbloqueado ? '🔒' : '✅'}`;
    
    // Atualizar stats com estrelas
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
    
    // Atualizar botões de navegação
    const carrosIds = Object.keys(CARROS);
    const currentIndex = carrosIds.indexOf(carroSelecionado);
    
    if (prevBtn) prevBtn.disabled = currentIndex === 0;
    if (nextBtn) nextBtn.disabled = currentIndex === carrosIds.length - 1;
}

// Navegar entre carros
function nextCarro() {
    const carrosIds = Object.keys(CARROS);
    const currentIndex = carrosIds.indexOf(carroSelecionado);
    if (currentIndex < carrosIds.length - 1) {
        selecionarCarro(carrosIds[currentIndex + 1]);
    }
}

function prevCarro() {
    const carrosIds = Object.keys(CARROS);
    const currentIndex = carrosIds.indexOf(carroSelecionado);
    if (currentIndex > 0) {
        selecionarCarro(carrosIds[currentIndex - 1]);
    }
}