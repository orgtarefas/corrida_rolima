// ==================== CONFIGURAÇÃO DO FIREBASE ====================
// Projeto: carrinho-rolima
// ID: frota-caminhao-producao

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
database.ref('.info/connected').on('value', (snap) => {
    if (snap.val()) {
        console.log('✅ Firebase conectado - Projeto: carrinho-rolima');
    } else {
        console.log('❌ Firebase desconectado');
    }
});

// Exportar para uso global
window.database = database;
