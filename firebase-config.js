// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBWLFEq3F8b0fZX4llE1_IvFOydQfw8mYE",
  authDomain: "sitemotel-e0cce.firebaseapp.com",
  projectId: "sitemotel-e0cce",
  storageBucket: "sitemotel-e0cce.firebasestorage.app",
  messagingSenderId: "211787809269",
  appId: "1:211787809269:web:69395a4a7ab8bef476e0bc",
  measurementId: "G-KMBKJRMN9B"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Configurações do WhatsApp
const WHATSAPP_NUMBER = "5511999999999"; // Substitua pelo seu número

// Função para enviar mensagem no WhatsApp
function enviarWhatsApp(dados) {
    const mensagem = `
🏨 *Nova Reserva - Motel LambMiBolas*

👤 *Cliente:* ${dados.nome}
🚗 *Placa:* ${dados.placa}
🏠 *Quarto:* ${dados.quarto}
📅 *Data:* ${dados.data}
⏰ *Entrada:* ${dados.horaEntrada}
⏱️ *Duração:* ${dados.horas} horas
💰 *Valor:* R$ ${dados.valor}

_Reserva confirmada com sucesso!_
    `.trim();
    
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensagem)}`;
    window.open(url, '_blank');
}