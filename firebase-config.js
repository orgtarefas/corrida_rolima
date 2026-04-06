import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue, push, remove } from "firebase/database";

// Sua configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBfuqxgjW2KmK9t66-v_Z0SqRuXNB1sYo0",
  authDomain: "frota-caminhao-producao.firebaseapp.com",
  databaseURL: "https://frota-caminhao-producao-default-rtdb.firebaseio.com",
  projectId: "frota-caminhao-producao",
  storageBucket: "frota-caminhao-producao.firebasestorage.app",
  messagingSenderId: "470546136795",
  appId: "1:470546136795:web:455dfc40dea0e738b2d6fe"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

console.log('✅ Firebase Realtime Database conectado');

// Funções auxiliares para o sistema de carros
export const carrosRef = ref(database, 'carros');
export const configuracoesRef = ref(database, 'configuracoes');
export const estatisticasRef = ref(database, 'estatisticas');

// Salvar configuração do carro
export async function salvarConfiguracaoCarro(carroId, configuracao) {
  try {
    const configRef = ref(database, `carros/${carroId}/configuracao`);
    await set(configRef, {
      ...configuracao,
      ultimaAtualizacao: Date.now()
    });
    console.log(`✅ Configuração do carro ${carroId} salva!`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao salvar configuração:', error);
    return false;
  }
}

// Carregar configuração do carro
export async function carregarConfiguracaoCarro(carroId) {
  try {
    const configRef = ref(database, `carros/${carroId}/configuracao`);
    const snapshot = await get(configRef);
    if (snapshot.exists()) {
      console.log(`✅ Configuração do carro ${carroId} carregada!`);
      return snapshot.val();
    } else {
      console.log(`⚠️ Nenhuma configuração encontrada para ${carroId}`);
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao carregar configuração:', error);
    return null;
  }
}

// Salvar estatísticas de uso
export async function salvarEstatistica(acao, cor, detalhes = {}) {
  try {
    const statsRef = push(estatisticasRef);
    await set(statsRef, {
      acao: acao,
      cor: cor,
      timestamp: Date.now(),
      detalhes: detalhes,
      dataHora: new Date().toISOString()
    });
    console.log(`📊 Estatística salva: ${acao}`);
  } catch (error) {
    console.error('❌ Erro ao salvar estatística:', error);
  }
}

// Listar todas as configurações salvas
export async function listarConfiguracoes() {
  try {
    const snapshot = await get(carrosRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return {};
  } catch (error) {
    console.error('❌ Erro ao listar configurações:', error);
    return {};
  }
}

// Excluir configuração
export async function excluirConfiguracao(carroId) {
  try {
    const carroRef = ref(database, `carros/${carroId}`);
    await remove(carroRef);
    console.log(`✅ Configuração ${carroId} excluída!`);
    return true;
  } catch (error) {
    console.error('❌ Erro ao excluir configuração:', error);
    return false;
  }
}

// Escutar mudanças em tempo real
export function ouvirMudancasCarro(carroId, callback) {
  const configRef = ref(database, `carros/${carroId}/configuracao`);
  return onValue(configRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });
}

export { database, ref, set, get, update, onValue, push, remove };