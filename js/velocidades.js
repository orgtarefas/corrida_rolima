// ==================== CONFIGURAÇÃO DE VELOCIDADES ====================

const VELOCIDADES = {
    carrinho: {
        velocidadeInicial: 0,
        velocidadeMaximaBase: 380,
        aceleracaoGravidade: 1.3,
        velocidadeMaximaFinal: 550,
        perdaVelocidadeAoBater: 45,
    },
    movimentoLateral: {
        velocidadeBase: 5.5,
        multiplicadorVelocidade: 0.012,
        velocidadeMaxima: 12,
        velocidadeMinima: 4,
    },
    linhasPista: {
        velocidadeBase: 4,
        multiplicadorVelocidade: 0.045,
        velocidadeMaxima: 18,
    },
    obstaculos: {
        velocidadeBase: 3.5,
        multiplicadorVelocidade: 0.018,
        velocidadeMaxima: 16,
    },
    spawn: {
        intervaloBase: 0.7,
        intervaloMinimo: 0.4,
        reduzirComVelocidade: true,
    },
    movimentoVertical: {
        fatorDescida: 0.14,
        fatorSubidaFreio: 0.18,
        forcaFreio: 50,
        velocidadeMinima: 20,
    },
    pontuacao: {
        multiplicadorDistancia: 0.22,
    },
    // NOVAS CONFIGURAÇÕES DE PISTA
    pista: {
        comprimentoBase: 1000,      // metros base
        comprimentoMaximo: 5000,    // metros máximo
        ondulacaoFrequencia: 0.05,  // frequência das ondulações
        ondulacaoAmplitude: 0.3,    // altura das ondulações
        curvaFrequencia: 0.03,      // frequência das curvas
        curvaAmplitude: 1.5,        // intensidade das curvas
    }
};

// Funções existentes mantidas...
function calcularVelocidadeLateral(velocidadeCarro, velocidadeMaxima) {
    const config = VELOCIDADES.movimentoLateral;
    const proporcao = Math.min(1, velocidadeCarro / velocidadeMaxima);
    let moveSpeed = config.velocidadeBase + (proporcao * config.multiplicadorVelocidade * 100);
    return Math.min(config.velocidadeMaxima, Math.max(config.velocidadeMinima, moveSpeed));
}

function calcularVelocidadeLinha(velocidadeCarro) {
    const config = VELOCIDADES.linhasPista;
    return Math.min(config.velocidadeMaxima, config.velocidadeBase + (velocidadeCarro * config.multiplicadorVelocidade));
}

function calcularVelocidadeObstaculo(velocidadeCarro) {
    const config = VELOCIDADES.obstaculos;
    return Math.min(config.velocidadeMaxima, config.velocidadeBase + (velocidadeCarro * config.multiplicadorVelocidade));
}

function calcularVelocidadeMaximaAtual(distancia, velocidadeMaximaBase) {
    if (distancia < 300) return velocidadeMaximaBase;
    const incrementos = Math.floor((distancia - 300) / 150);
    return Math.min(VELOCIDADES.carrinho.velocidadeMaximaFinal, velocidadeMaximaBase + (incrementos * 6));
}

function calcularPontuacao(velocidade, delta) {
    return velocidade * delta * VELOCIDADES.pontuacao.multiplicadorDistancia;
}

function calcularIntervaloSpawn(velocidadeCarro) {
    const config = VELOCIDADES.spawn;
    if (!config.reduzirComVelocidade) return config.intervaloBase;
    return Math.max(config.intervaloMinimo, config.intervaloBase - (velocidadeCarro / 500));
}

function calcularMovimentoVertical(velocidade, isBraking, delta) {
    const config = VELOCIDADES.movimentoVertical;
    if (isBraking) return -velocidade * delta * config.fatorSubidaFreio;
    return velocidade * delta * config.fatorDescida;
}

// NOVA FUNÇÃO: Calcular altura da pista baseada na posição
function calcularAlturaPista(posicaoZ) {
    const config = VELOCIDADES.pista;
    // Ondulações senoidais para dar relevo
    const ondulacao = Math.sin(posicaoZ * config.ondulacaoFrequencia) * config.ondulacaoAmplitude;
    // Pequenas variações adicionais
    const microOndulacao = Math.sin(posicaoZ * config.ondulacaoFrequencia * 3) * 0.1;
    return ondulacao + microOndulacao;
}

// NOVA FUNÇÃO: Calcular curva da pista
function calcularCurvaPista(posicaoZ) {
    const config = VELOCIDADES.pista;
    return Math.sin(posicaoZ * config.curvaFrequencia) * config.curvaAmplitude;
}
