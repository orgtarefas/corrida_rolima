// firebase-config.js
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, onValue } from "firebase/database";

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

export { database, ref, set, get, update, onValue };
