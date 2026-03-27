// ==================== CONFIGURAÇÃO DO FIREBASE ====================
// Projeto: carrinho-rolima
// ID do projeto: frota-caminhao-producao

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
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Verificar conexão
const connectedRef = database.ref('.info/connected');
connectedRef.on('value', (snap) => {
    if (snap.val() === true) {
        console.log('✅ Firebase conectado!');
        console.log('📁 Projeto: carrinho-rolima');
        console.log('🆔 Project ID: frota-caminhao-producao');
    } else {
        console.log('❌ Firebase desconectado');
    }
});

// Exportar para uso global
window.database = database;