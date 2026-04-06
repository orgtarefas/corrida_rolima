// ==================== SCRIPT DE SELEÇÃO DE CARROS ====================

// Configuração dos carros
const CARROS = {
    carro1: {
        id: 'carro1',
        nome: '🔥 Fúria Vermelha',
        stats: {
            velocidade: 85,
            controle: 70,
            durabilidade: 65,
            aceleracao: 90
        },
        preco: 0,
        desbloqueado: true
    },
    carro2: {
        id: 'carro2',
        nome: '💪 Touro Azul',
        stats: {
            velocidade: 60,
            controle: 50,
            durabilidade: 95,
            aceleracao: 45
        },
        preco: 500,
        desbloqueado: false
    }
};

// Variáveis globais
let carroSelecionado = null;

// ==================== FUNÇÕES PRINCIPAIS ====================

// Inicializar o sistema
function init() {
    // Carregar desbloqueios salvos
    carregarDesbloqueios();
    
    // Adicionar eventos aos cards
    document.querySelectorAll('.car-card').forEach(card => {
        card.addEventListener('click', () => {
            const carId = card.dataset.carId;
            selecionarCarro(carId);
        });
    });
    
    // Evento do botão confirmar
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
        confirmBtn.addEventListener('click', confirmarSelecao);
    }
    
    // Verificar se já tem carro salvo
    const salvo = localStorage.getItem('carroSelecionado');
    if (salvo && CARROS[salvo]) {
        selecionarCarro(salvo);
    }
    
    console.log('✅ Sistema de seleção de carros inicializado');
}

// Carregar desbloqueios do localStorage
function carregarDesbloqueios() {
    const desbloqueados = localStorage.getItem('carrosDesbloqueados');
    
    if (desbloqueados) {
        const lista = JSON.parse(desbloqueados);
        lista.forEach(carId => {
            if (CARROS[carId]) {
                CARROS[carId].desbloqueado = true;
            }
        });
    } else {
        // Primeira vez: apenas carro1 desbloqueado
        localStorage.setItem('carrosDesbloqueados', JSON.stringify(['carro1']));
    }
    
    // Atualizar UI dos preços
    atualizarUIprecos();
}

// Salvar desbloqueios no localStorage
function salvarDesbloqueios() {
    const desbloqueados = Object.keys(CARROS).filter(id => CARROS[id].desbloqueado);
    localStorage.setItem('carrosDesbloqueados', JSON.stringify(desbloqueados));
}

// Atualizar UI dos preços (mostrar bloqueado/desbloqueado)
function atualizarUIprecos() {
    document.querySelectorAll('.car-card').forEach(card => {
        const carId = card.dataset.carId;
        const carro = CARROS[carId];
        const priceDiv = card.querySelector('.car-price');
        
        if (carro && priceDiv) {
            if (carro.desbloqueado) {
                priceDiv.innerHTML = '✅ DESBLOQUEADO';
                priceDiv.style.color = '#4caf50';
            } else {
                priceDiv.innerHTML = `🔒 DESBLOQUEAR (${carro.preco} pontos)`;
                priceDiv.style.color = '#ffaa66';
            }
        }
    });
}

// Selecionar um carro
function selecionarCarro(carId) {
    const carro = CARROS[carId];
    
    if (!carro) {
        console.error('Carro não encontrado:', carId);
        return;
    }
    
    // Se não estiver desbloqueado, tentar desbloquear
    if (!carro.desbloqueado) {
        const pontos = parseInt(localStorage.getItem('playerPoints') || '0');
        
        if (pontos >= carro.preco) {
            // Desbloquear carro
            carro.desbloqueado = true;
            localStorage.setItem('playerPoints', pontos - carro.preco);
            salvarDesbloqueios();
            atualizarUIprecos();
            
            // Mostrar mensagem de sucesso
            mostrarMensagem(`🎉 Parabéns! ${carro.nome} foi desbloqueado!`, 'success');
        } else {
            // Pontos insuficientes
            mostrarMensagem(`❌ Pontos insuficientes! Faltam ${carro.preco - pontos} pontos para desbloquear ${carro.nome}.`, 'error');
            return;
        }
    }
    
    // Remover seleção de todos os cards
    document.querySelectorAll('.car-card').forEach(card => {
        card.classList.remove('selecionado');
    });
    
    // Adicionar seleção ao card atual
    const cardSelecionado = document.querySelector(`.car-card[data-car-id="${carId}"]`);
    if (cardSelecionado) {
        cardSelecionado.classList.add('selecionado');
    }
    
    // Salvar seleção
    carroSelecionado = carId;
    
    // Habilitar botão confirmar
    const confirmBtn = document.getElementById('confirmBtn');
    if (confirmBtn) {
        confirmBtn.disabled = false;
    }
    
    // Atualizar display
    atualizarDisplaySelecionado(carro);
    
    console.log(`🚗 Carro selecionado: ${carro.nome}`);
}

// Atualizar display do carro selecionado
function atualizarDisplaySelecionado(carro) {
    const display = document.getElementById('selectedCarDisplay');
    if (display) {
        display.innerHTML = `
            🏎️ Carro selecionado: <strong>${carro.nome}</strong> | 
            ⚡ ${carro.stats.velocidade}% Vel. | 
            🎮 ${carro.stats.controle}% Ctrl | 
            💪 ${carro.stats.durabilidade}% Dur.
        `;
    }
}

// Confirmar seleção e salvar
function confirmarSelecao() {
    if (!carroSelecionado) {
        mostrarMensagem('⚠️ Selecione um carro primeiro!', 'warning');
        return;
    }
    
    const carro = CARROS[carroSelecionado];
    
    if (!carro.desbloqueado) {
        mostrarMensagem(`⚠️ ${carro.nome} ainda não foi desbloqueado!`, 'warning');
        return;
    }
    
    // Salvar no localStorage
    localStorage.setItem('carroSelecionado', carroSelecionado);
    
    // Mostrar mensagem de sucesso
    mostrarMensagem(`✅ ${carro.nome} confirmado! Pronto para a corrida!`, 'success');
    
    // Aqui você pode redirecionar para o jogo ou iniciar a corrida
    console.log('🎮 Carro confirmado:', carro.nome);
    
    // Exemplo: setTimeout(() => { window.location.href = 'jogo.html'; }, 1500);
}

// Mostrar mensagem temporária
function mostrarMensagem(texto, tipo) {
    // Remover mensagem anterior se existir
    const msgAntiga = document.querySelector('.toast-message');
    if (msgAntiga) msgAntiga.remove();
    
    // Criar nova mensagem
    const msg = document.createElement('div');
    msg.className = `toast-message ${tipo}`;
    msg.textContent = texto;
    
    // Estilizar
    msg.style.position = 'fixed';
    msg.style.bottom = '20px';
    msg.style.left = '50%';
    msg.style.transform = 'translateX(-50%)';
    msg.style.padding = '12px 24px';
    msg.style.borderRadius = '50px';
    msg.style.fontWeight = 'bold';
    msg.style.zIndex = '1000';
    msg.style.animation = 'fadeInUp 0.3s ease';
    
    switch(tipo) {
        case 'success':
            msg.style.background = '#4caf50';
            msg.style.color = 'white';
            break;
        case 'error':
            msg.style.background = '#f44336';
            msg.style.color = 'white';
            break;
        case 'warning':
            msg.style.background = '#ff9800';
            msg.style.color = 'white';
            break;
        default:
            msg.style.background = '#333';
            msg.style.color = 'white';
    }
    
    document.body.appendChild(msg);
    
    // Remover após 3 segundos
    setTimeout(() => {
        msg.style.opacity = '0';
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}

// Adicionar pontos (para desbloquear carros)
function adicionarPontos(quantidade) {
    let pontos = parseInt(localStorage.getItem('playerPoints') || '0');
    pontos += quantidade;
    localStorage.setItem('playerPoints', pontos);
    console.log(`💰 +${quantidade} pontos! Total: ${pontos}`);
    return pontos;
}

// ==================== INICIALIZAR ====================
document.addEventListener('DOMContentLoaded', () => {
    init();
});

// Adicionar animação CSS dinamicamente
const style = document.createElement('style');
style.textContent = `
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
        }
    }
    .toast-message {
        animation: fadeInUp 0.3s ease;
    }
`;
document.head.appendChild(style);