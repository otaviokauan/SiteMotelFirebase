import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAnalytics } from "firebase/analytics"

const firebaseConfig = {
  apiKey: "AIzaSyBWLFEq3F8b0fZX4llE1_IvFOydQfw8mYE",
  authDomain: "sitemotel-e0cce.firebaseapp.com",
  projectId: "sitemotel-e0cce",
  storageBucket: "sitemotel-e0cce.firebasestorage.app",
  messagingSenderId: "211787809269",
  appId: "1:211787809269:web:69395a4a7ab8bef476e0bc",
  measurementId: "G-KMBKJRMN9B",
}

try {
  // Inicializar Firebase
  const app = initializeApp(firebaseConfig)
  const db = getFirestore(app)

  // Tentar inicializar Analytics apenas se disponível
  let analytics = null
  try {
    analytics = getAnalytics(app)
  } catch (analyticsError) {
    console.log("[v0] Analytics não disponível no ambiente atual")
  }

  // Exportar para uso global
  window.db = db
  window.firebase = {
    firestore: {
      FieldValue: {
        serverTimestamp: () => new Date(),
      },
    },
  }

  console.log("[v0] Firebase v9+ configurado com sucesso")

  // Mostrar status de conexão
  const statusElement = document.createElement("div")
  statusElement.className = "firebase-status show"
  statusElement.textContent = "✅ Firebase conectado"
  document.body.appendChild(statusElement)

  setTimeout(() => {
    statusElement.remove()
  }, 3000)
} catch (error) {
  console.error("[v0] Erro ao configurar Firebase:", error)

  // Mostrar erro de conexão
  const statusElement = document.createElement("div")
  statusElement.className = "firebase-status error show"
  statusElement.textContent = "❌ Erro no Firebase"
  document.body.appendChild(statusElement)

  setTimeout(() => {
    statusElement.remove()
  }, 5000)
}
