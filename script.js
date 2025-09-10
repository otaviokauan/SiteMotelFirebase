// Import Firebase
import firebase from "firebase/app"
import "firebase/firestore"

const quartos = [
  {
    id: 1,
    nome: "Quarto Standard Deluxe",
    tipo: "standard",
    preco: 80,
    imagem: "luxury-hotel-room-with-modern-decor.jpg",
    descricao: "Ambiente aconchegante com decoração moderna e todas as comodidades essenciais.",
    caracteristicas: ["Ar Condicionado", 'TV Smart 43"', "Frigobar", "Wi-Fi Premium", "Banheiro Privativo"],
  },
  {
    id: 2,
    nome: "Quarto Standard Premium",
    tipo: "standard",
    preco: 95,
    imagem: "elegant-hotel-room-with-premium-amenities.jpg",
    descricao: "Espaço elegante com acabamentos refinados e vista privilegiada.",
    caracteristicas: ["Ar Condicionado", 'TV Smart 50"', "Frigobar Premium", "Wi-Fi Premium", "Hidromassagem"],
  },
  {
    id: 3,
    nome: "Quarto Standard Executivo",
    tipo: "standard",
    preco: 110,
    imagem: "luxury-hotel-room-with-modern-decor.jpg",
    descricao: "Ambiente sofisticado ideal para momentos especiais e relaxamento.",
    caracteristicas: ["Ar Condicionado", 'TV Smart 55"', "Frigobar Executivo", "Wi-Fi Premium", "Área de Trabalho"],
  },
  {
    id: 4,
    nome: "Quarto Standard Luxo",
    tipo: "standard",
    preco: 125,
    imagem: "elegant-hotel-room-with-premium-amenities.jpg",
    descricao: "Máximo conforto com design contemporâneo e amenidades de primeira classe.",
    caracteristicas: ["Ar Condicionado", 'TV Smart 65"', "Frigobar Luxo", "Wi-Fi Premium", "Sala de Estar"],
  },
  {
    id: 5,
    nome: "Suíte Master",
    tipo: "suite",
    preco: 180,
    imagem: "luxury-hotel-master-suite-with-separate-living-are.jpg",
    descricao: "Suíte espaçosa com sala separada, perfeita para uma experiência inesquecível.",
    caracteristicas: [
      "Ar Condicionado Dual",
      'TV Smart 75"',
      "Frigobar Premium",
      "Wi-Fi Premium",
      "Hidromassagem Dupla",
      "Sala Privativa",
    ],
  },
  {
    id: 6,
    nome: "Suíte Presidential",
    tipo: "suite",
    preco: 250,
    imagem: "presidential-hotel-suite-with-luxury-amenities-and.jpg",
    descricao: "O máximo em luxo e sofisticação, com amenidades exclusivas e design excepcional.",
    caracteristicas: [
      "Ar Condicionado Inteligente",
      'TV Smart 85"',
      "Frigobar Premium",
      "Wi-Fi Premium",
      "Spa Privativo",
      "Terraço Exclusivo",
      "Serviço Personalizado",
    ],
  },
]

const firebaseConfig = {
  apiKey: "sua-api-key-aqui",
  authDomain: "motel-lambmibolas.firebaseapp.com",
  projectId: "motel-lambmibolas",
  storageBucket: "motel-lambmibolas.appspot.com",
  messagingSenderId: "123456789",
  appId: "sua-app-id-aqui",
}

const whatsappNumber = "5511999999999" // Substitua pelo seu número

let db
try {
  firebase.initializeApp(firebaseConfig)
  db = firebase.firestore()
  console.log("[v0] Firebase initialized successfully")
} catch (error) {
  console.error("[v0] Firebase initialization error:", error)
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] DOM loaded, initializing app")
  carregarQuartos()
  inicializarEventos()
  preencherMesesRelatorio()
  carregarReservasAtivas()
})

function carregarQuartos() {
  const quartosGrid = document.getElementById("quartosGrid")
  const quartoSelect = document.getElementById("quartoSelecionado")

  if (!quartosGrid || !quartoSelect) {
    console.error("[v0] Required elements not found")
    return
  }

  quartoSelect.innerHTML = '<option value="">Selecione um quarto</option>'

  quartos.forEach((quarto) => {
    // Add to select
    const option = document.createElement("option")
    option.value = quarto.id
    option.textContent = `${quarto.nome} - R$ ${quarto.preco}/h`
    quartoSelect.appendChild(option)
  })

  console.log("[v0] Rooms loaded successfully")
}

function selecionarQuarto(quartoNome, preco) {
  const select = document.getElementById("quartoSelecionado")
  if (select) {
    // Encontrar o quarto pelo nome para pegar o ID
    const quarto = quartos.find((q) => q.nome.includes(quartoNome.split("-")[0]))
    if (quarto) {
      select.value = quarto.id
      calcularValorTotal()
    }

    // Smooth scroll to reservation section
    document.getElementById("reserva").scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }
}

function inicializarEventos() {
  // Form submission
  const form = document.getElementById("reservaForm")
  if (form) {
    form.addEventListener("submit", processarReserva)
  }

  // Value calculation triggers
  const triggers = ["quartoSelecionado", "horas"]
  triggers.forEach((id) => {
    const element = document.getElementById(id)
    if (element) {
      element.addEventListener("change", calcularValorTotal)
    }
  })

  // Admin modal
  const adminButton = document.getElementById("adminButton")
  const modal = document.getElementById("adminModal")
  const closeBtn = document.querySelector(".close")

  if (adminButton && modal) {
    adminButton.addEventListener("click", () => {
      modal.style.display = "block"
      carregarReservasAtivas()
    })
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener("click", () => {
      modal.style.display = "none"
    })
  }

  if (modal) {
    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none"
      }
    })
  }

  // Set minimum date to today
  const dataInput = document.getElementById("dataReserva")
  if (dataInput) {
    const today = new Date().toISOString().split("T")[0]
    dataInput.min = today
    dataInput.value = today
  }

  console.log("[v0] Events initialized successfully")
}

function calcularValorTotal() {
  const quartoId = document.getElementById("quartoSelecionado").value
  const horas = document.getElementById("horas").value
  const valorElement = document.getElementById("valorTotal")

  if (!quartoId || !horas || !valorElement) {
    if (valorElement) valorElement.textContent = "0,00"
    return
  }

  const quarto = quartos.find((q) => q.id == quartoId)
  if (!quarto) {
    valorElement.textContent = "0,00"
    return
  }

  const total = quarto.preco * Number.parseInt(horas)
  valorElement.textContent = total.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  console.log("[v0] Total calculated:", total)
}

async function processarReserva(event) {
  event.preventDefault()

  const loadingOverlay = document.getElementById("loadingOverlay")
  if (loadingOverlay) {
    loadingOverlay.style.display = "flex"
  }

  try {
    // Collect form data
    const formData = {
      nome: document.getElementById("nomeCliente").value.trim(),
      placa: document.getElementById("placaCarro").value.trim().toUpperCase(),
      quartoId: Number.parseInt(document.getElementById("quartoSelecionado").value),
      data: document.getElementById("dataReserva").value,
      horaEntrada: document.getElementById("horaEntrada").value,
      horas: Number.parseInt(document.getElementById("horas").value),
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      status: "ativa",
    }

    // Validation
    if (
      !formData.nome ||
      !formData.placa ||
      !formData.quartoId ||
      !formData.data ||
      !formData.horaEntrada ||
      !formData.horas
    ) {
      throw new Error("Todos os campos são obrigatórios")
    }

    // Validate license plate format
    const placaRegex = /^[A-Z]{3}-?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/
    if (!placaRegex.test(formData.placa)) {
      throw new Error("Formato de placa inválido")
    }

    const quarto = quartos.find((q) => q.id === formData.quartoId)
    if (!quarto) {
      throw new Error("Quarto não encontrado")
    }

    const valorTotal = quarto.preco * formData.horas
    formData.valorTotal = valorTotal
    formData.quartoNome = quarto.nome

    // Save to Firebase
    if (db) {
      await db.collection("reservas").add(formData)
      console.log("[v0] Reservation saved to Firebase")
    }

    // Send WhatsApp message
    enviarWhatsApp(formData)

    // Success feedback
    alert("Reserva confirmada com sucesso! Você será redirecionado para o WhatsApp.")

    // Reset form
    document.getElementById("reservaForm").reset()
    document.getElementById("valorTotal").textContent = "0,00"
  } catch (error) {
    console.error("[v0] Reservation error:", error)
    alert("Erro ao processar reserva: " + error.message)
  } finally {
    if (loadingOverlay) {
      loadingOverlay.style.display = "none"
    }
  }
}

function enviarWhatsApp(dados) {
  const dataFormatada = new Date(dados.data + "T00:00:00").toLocaleDateString("pt-BR")
  const horaFormatada = dados.horaEntrada

  const mensagem = `🏨 *NOVA RESERVA - MOTEL LAMBMIBOLAS*

👤 *Cliente:* ${dados.nome}
🚗 *Placa:* ${dados.placa}
🛏️ *Quarto:* ${dados.quartoNome}
📅 *Data:* ${dataFormatada}
🕐 *Hora de Entrada:* ${horaFormatada}
⏰ *Duração:* ${dados.horas} hora(s)
💰 *Valor Total:* R$ ${dados.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

✅ Reserva confirmada automaticamente pelo sistema.`

  const url = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(mensagem)}`
  window.open(url, "_blank")

  console.log("[v0] WhatsApp message sent")
}

async function carregarReservasAtivas() {
  const container = document.getElementById("reservasAtivas")
  if (!container || !db) return

  try {
    const snapshot = await db.collection("reservas").where("status", "==", "ativa").orderBy("timestamp", "desc").get()

    container.innerHTML = ""

    if (snapshot.empty) {
      container.innerHTML = '<p class="no-data">Nenhuma reserva ativa encontrada.</p>'
      return
    }

    snapshot.forEach((doc) => {
      const reserva = doc.data()
      const div = document.createElement("div")
      div.className = "reserva-item"
      div.innerHTML = `
                <div class="reserva-info">
                    <h4>${reserva.nome}</h4>
                    <p><strong>Quarto:</strong> ${reserva.quartoNome}</p>
                    <p><strong>Placa:</strong> ${reserva.placa}</p>
                    <p><strong>Data:</strong> ${new Date(reserva.data + "T00:00:00").toLocaleDateString("pt-BR")}</p>
                    <p><strong>Hora:</strong> ${reserva.horaEntrada}</p>
                    <p><strong>Duração:</strong> ${reserva.horas}h</p>
                    <p><strong>Valor:</strong> R$ ${reserva.valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
                <button class="checkout-button" onclick="fazerCheckout('${doc.id}')">
                    <i class="fas fa-sign-out-alt"></i> Check-out
                </button>
            `
      container.appendChild(div)
    })

    console.log("[v0] Active reservations loaded")
  } catch (error) {
    console.error("[v0] Error loading reservations:", error)
    container.innerHTML = '<p class="error">Erro ao carregar reservas.</p>'
  }
}

async function fazerCheckout(reservaId) {
  if (!confirm("Confirmar check-out desta reserva?")) return

  try {
    if (db) {
      await db.collection("reservas").doc(reservaId).update({
        status: "finalizada",
        checkoutTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
      })
    }

    alert("Check-out realizado com sucesso!")
    carregarReservasAtivas()

    console.log("[v0] Checkout completed for reservation:", reservaId)
  } catch (error) {
    console.error("[v0] Checkout error:", error)
    alert("Erro ao realizar check-out: " + error.message)
  }
}

function preencherMesesRelatorio() {
  const select = document.getElementById("mesRelatorio")
  if (!select) return

  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]

  const currentDate = new Date()
  const currentYear = currentDate.getFullYear()

  // Add current and previous months
  for (let i = 0; i < 12; i++) {
    const date = new Date(currentYear, currentDate.getMonth() - i, 1)
    const option = document.createElement("option")
    option.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    option.textContent = `${meses[date.getMonth()]} ${date.getFullYear()}`
    select.appendChild(option)
  }
}

async function gerarRelatorio() {
  const mes = document.getElementById("mesRelatorio").value
  const container = document.getElementById("relatorioContent")

  if (!mes || !container || !db) {
    alert("Selecione um mês para gerar o relatório")
    return
  }

  try {
    const [ano, mesNum] = mes.split("-")
    const inicioMes = new Date(ano, mesNum - 1, 1)
    const fimMes = new Date(ano, mesNum, 0)

    const snapshot = await db
      .collection("reservas")
      .where("data", ">=", inicioMes.toISOString().split("T")[0])
      .where("data", "<=", fimMes.toISOString().split("T")[0])
      .get()

    const reservas = []
    let totalFaturamento = 0
    const quartoStats = {}

    snapshot.forEach((doc) => {
      const reserva = doc.data()
      reservas.push(reserva)
      totalFaturamento += reserva.valorTotal || 0

      if (!quartoStats[reserva.quartoNome]) {
        quartoStats[reserva.quartoNome] = { count: 0, revenue: 0 }
      }
      quartoStats[reserva.quartoNome].count++
      quartoStats[reserva.quartoNome].revenue += reserva.valorTotal || 0
    })

    // Generate report HTML
    container.innerHTML = `
            <div class="relatorio-summary">
                <div class="summary-card">
                    <h4>Total de Reservas</h4>
                    <p class="summary-number">${reservas.length}</p>
                </div>
                <div class="summary-card">
                    <h4>Faturamento Total</h4>
                    <p class="summary-number">R$ ${totalFaturamento.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
                <div class="summary-card">
                    <h4>Ticket Médio</h4>
                    <p class="summary-number">R$ ${reservas.length ? (totalFaturamento / reservas.length).toLocaleString("pt-BR", { minimumFractionDigits: 2 }) : "0,00"}</p>
                </div>
            </div>
            
            <div class="relatorio-details">
                <h4>Desempenho por Quarto</h4>
                <div class="quartos-stats">
                    ${Object.entries(quartoStats)
                      .map(
                        ([nome, stats]) => `
                        <div class="quarto-stat">
                            <h5>${nome}</h5>
                            <p>Reservas: ${stats.count}</p>
                            <p>Receita: R$ ${stats.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                        </div>
                    `,
                      )
                      .join("")}
                </div>
            </div>
        `

    console.log("[v0] Report generated successfully")
  } catch (error) {
    console.error("[v0] Report generation error:", error)
    container.innerHTML = '<p class="error">Erro ao gerar relatório.</p>'
  }
}

function showTab(tabName) {
  // Hide all tabs
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active")
  })

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.remove("active")
  })

  // Show selected tab
  const selectedTab = document.getElementById(tabName)
  const selectedButton = document.querySelector(`[onclick="showTab('${tabName}')"]`)

  if (selectedTab) selectedTab.classList.add("active")
  if (selectedButton) selectedButton.classList.add("active")

  // Load data for specific tabs
  if (tabName === "reservas") {
    carregarReservasAtivas()
  }
}

function scrollToReserva() {
  document.getElementById("reserva").scrollIntoView({
    behavior: "smooth",
    block: "start",
  })
}

const adminStyles = `
<style>
.reserva-item {
    background: var(--neutral-light);
    padding: 1.5rem;
    border-radius: var(--border-radius);
    margin-bottom: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: var(--transition);
}

.reserva-item:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 15px var(--shadow-light);
}

.checkout-button {
    background: var(--primary-red);
    color: var(--neutral-white);
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: var(--transition);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
}

.checkout-button:hover {
    background: var(--primary-red-dark);
    transform: translateY(-1px);
}

.relatorio-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
}

.summary-card {
    background: var(--neutral-cream);
    padding: 1.5rem;
    border-radius: var(--border-radius);
    text-align: center;
    border: 2px solid var(--accent-gold);
}

.summary-number {
    font-family: var(--font-heading);
    font-size: 2rem;
    font-weight: 700;
    color: var(--primary-red);
    margin-top: 0.5rem;
}

.quartos-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.quarto-stat {
    background: var(--neutral-light);
    padding: 1rem;
    border-radius: var(--border-radius);
    border-left: 4px solid var(--accent-gold);
}

.no-data, .error {
    text-align: center;
    padding: 2rem;
    color: var(--text-medium);
    font-style: italic;
}

.error {
    color: var(--primary-red);
}
</style>
`

document.head.insertAdjacentHTML("beforeend", adminStyles)
