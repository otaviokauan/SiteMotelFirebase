const quartosDisponiveis = [
  { id: "standard-1", nome: "Quarto Standard 1", preco: 80 },
  { id: "standard-2", nome: "Quarto Standard 2", preco: 80 },
  { id: "standard-3", nome: "Quarto Standard 3", preco: 90 },
  { id: "standard-4", nome: "Quarto Standard 4", preco: 90 },
  { id: "suite-1", nome: "Suíte Premium 1", preco: 150 },
  { id: "suite-2", nome: "Suíte Premium 2", preco: 180 },
]

const whatsappNumber = "5542999860424" // Número atualizado

// Declare db and firebase variables
let db
let firebase

document.addEventListener("DOMContentLoaded", () => {
  console.log("[v0] DOM carregado, inicializando aplicação")

  setTimeout(() => {
    carregarQuartos()
    inicializarEventos()
    configurarDataMinima()
    preencherMesesRelatorio()
    preencherAnosRelatorio()
    console.log("[v0] Aplicação inicializada com sucesso")
  }, 1000)
})

async function verificarDisponibilidadeQuarto(quartoId, data, horaEntrada, horas) {
  if (!window.db) {
    console.log("[v0] Firebase não disponível, assumindo quarto disponível")
    return true
  }

  try {
    const { collection, query, where, getDocs } = await import("firebase/firestore")

    // Calcular hora de saída
    const [horaE, minutoE] = horaEntrada.split(":").map(Number)
    const horaEntradaMinutos = horaE * 60 + minutoE
    const horaSaidaMinutos = horaEntradaMinutos + horas * 60

    // Buscar reservas do mesmo quarto na mesma data
    const q = query(
      collection(window.db, "reservas"),
      where("quartoId", "==", quartoId),
      where("data", "==", data),
      where("status", "==", "ativa"),
    )

    const snapshot = await getDocs(q)

    // Verificar conflitos de horário
    for (const doc of snapshot.docs) {
      const reserva = doc.data()
      const [horaR, minutoR] = reserva.horaEntrada.split(":").map(Number)
      const horaReservaMinutos = horaR * 60 + minutoR
      const horaSaidaReservaMinutos = horaReservaMinutos + reserva.horas * 60

      // Verificar sobreposição de horários
      if (
        (horaEntradaMinutos >= horaReservaMinutos && horaEntradaMinutos < horaSaidaReservaMinutos) ||
        (horaSaidaMinutos > horaReservaMinutos && horaSaidaMinutos <= horaSaidaReservaMinutos) ||
        (horaEntradaMinutos <= horaReservaMinutos && horaSaidaMinutos >= horaSaidaReservaMinutos)
      ) {
        return false // Quarto ocupado neste horário
      }
    }

    return true // Quarto disponível
  } catch (error) {
    console.error("[v0] Erro ao verificar disponibilidade:", error)
    return true // Em caso de erro, assumir disponível
  }
}

async function carregarQuartos() {
  const quartoSelect = document.getElementById("quartoSelecionado")
  const dataInput = document.getElementById("dataReserva")
  const horaInput = document.getElementById("horaEntrada")
  const horasInput = document.getElementById("horas")

  if (!quartoSelect) {
    console.error("[v0] Select de quartos não encontrado")
    return
  }

  // Limpar opções existentes
  quartoSelect.innerHTML = '<option value="">Selecione um quarto</option>'

  // Se não temos data/hora selecionada, mostrar todos os quartos
  if (!dataInput?.value || !horaInput?.value || !horasInput?.value) {
    quartosDisponiveis.forEach((quarto) => {
      const option = document.createElement("option")
      option.value = quarto.id
      option.textContent = `${quarto.nome} - R$ ${quarto.preco}/h`
      option.dataset.preco = quarto.preco
      quartoSelect.appendChild(option)
    })
    console.log("[v0] Todos os quartos carregados")
    return
  }

  // Verificar disponibilidade de cada quarto
  for (const quarto of quartosDisponiveis) {
    const disponivel = await verificarDisponibilidadeQuarto(
      quarto.id,
      dataInput.value,
      horaInput.value,
      Number.parseInt(horasInput.value),
    )

    const option = document.createElement("option")
    option.value = quarto.id
    option.dataset.preco = quarto.preco

    if (disponivel) {
      option.textContent = `${quarto.nome} - R$ ${quarto.preco}/h`
    } else {
      option.textContent = `${quarto.nome} - OCUPADO`
      option.disabled = true
      option.style.color = "#ff6b6b"
    }

    quartoSelect.appendChild(option)
  }

  console.log("[v0] Quartos carregados com verificação de disponibilidade")
}

function selecionarQuarto(quartoId, preco) {
  console.log("[v0] Selecionando quarto:", quartoId, preco)

  const select = document.getElementById("quartoSelecionado")
  if (select) {
    select.value = quartoId
    calcularValorTotal()

    // Ir para seção de reserva
    document.getElementById("reserva").scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }
}

function scrollToReserva() {
  document.getElementById("reserva").scrollIntoView({
    behavior: "smooth",
    block: "start",
  })
}

let isAuthenticated = false
const adminPassword = "admin123" // Senha padrão - pode ser alterada

function showAdminLogin() {
  document.getElementById("adminLoginModal").style.display = "flex"
  document.getElementById("adminPassword").focus()
}

function closeAdminLogin() {
  document.getElementById("adminLoginModal").style.display = "none"
  document.getElementById("adminPassword").value = ""
}

function togglePasswordVisibility() {
  const passwordInput = document.getElementById("adminPassword")
  const toggleIcon = document.getElementById("passwordToggleIcon")

  if (passwordInput.type === "password") {
    passwordInput.type = "text"
    toggleIcon.className = "fas fa-eye-slash"
  } else {
    passwordInput.type = "password"
    toggleIcon.className = "fas fa-eye"
  }
}

function inicializarEventos() {
  // Evento do formulário de reserva
  const form = document.getElementById("reservaForm")
  if (form) {
    form.addEventListener("submit", processarReserva)
  }

  // Eventos para calcular valor total
  const quartoSelect = document.getElementById("quartoSelecionado")
  const horasSelect = document.getElementById("horas")

  if (quartoSelect) {
    quartoSelect.addEventListener("change", calcularValorTotal)
  }

  if (horasSelect) {
    horasSelect.addEventListener("change", calcularValorTotal)
  }

  const dataInput = document.getElementById("dataReserva")
  const horaInput = document.getElementById("horaEntrada")
  const horasInput = document.getElementById("horas")

  if (dataInput) {
    dataInput.addEventListener("change", carregarQuartos)
  }
  if (horaInput) {
    horaInput.addEventListener("change", carregarQuartos)
  }
  if (horasInput) {
    horasInput.addEventListener("change", carregarQuartos)
  }

  // Eventos do modal administrativo
  const adminButton = document.getElementById("adminButton")
  const modal = document.getElementById("adminModal")
  const closeBtn = document.querySelector(".close")

  if (adminButton) {
    adminButton.addEventListener("click", showAdminLogin)
  }

  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      if (modal) {
        modal.style.display = "none"
      }
    })
  }

  // Fechar modal clicando fora
  if (modal) {
    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none"
      }
    })
  }

  const adminLoginForm = document.getElementById("adminLoginForm")
  if (adminLoginForm) {
    adminLoginForm.addEventListener("submit", (e) => {
      e.preventDefault()
      const password = document.getElementById("adminPassword").value

      if (password === adminPassword) {
        isAuthenticated = true
        closeAdminLogin()
        document.getElementById("adminModal").style.display = "block"
        carregarReservasAtivas()

        // Animação de sucesso
        const loginButton = document.querySelector(".admin-login-button")
        loginButton.innerHTML = '<i class="fas fa-check"></i> Acesso Liberado'
        loginButton.style.background = "linear-gradient(135deg, #10b981, #059669)"

        setTimeout(() => {
          loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Painel'
          loginButton.style.background = ""
        }, 1000)
      } else {
        // Animação de erro
        const passwordInput = document.getElementById("adminPassword")
        const loginButton = document.querySelector(".admin-login-button")

        passwordInput.classList.add("error-shake")
        loginButton.innerHTML = '<i class="fas fa-times"></i> Senha Incorreta'
        loginButton.style.background = "linear-gradient(135deg, #ef4444, #dc2626)"

        setTimeout(() => {
          passwordInput.classList.remove("error-shake")
          loginButton.innerHTML = '<i class="fas fa-sign-in-alt"></i> Entrar no Painel'
          loginButton.style.background = ""
          passwordInput.value = ""
          passwordInput.focus()
        }, 2000)
      }
    })
  }

  console.log("[v0] Eventos inicializados")
}

function configurarDataMinima() {
  const dataInput = document.getElementById("dataReserva")
  if (dataInput) {
    const today = new Date().toISOString().split("T")[0]
    dataInput.min = today
    dataInput.value = today
  }
}

function calcularValorTotal() {
  const quartoSelect = document.getElementById("quartoSelecionado")
  const horasSelect = document.getElementById("horas")
  const valorElement = document.getElementById("valorTotal")

  if (!quartoSelect || !horasSelect || !valorElement) {
    console.error("[v0] Elementos necessários não encontrados")
    return
  }

  const horas = horasSelect.value

  if (!quartoSelect.value || !horas) {
    valorElement.textContent = "0,00"
    return
  }

  const selectedOption = quartoSelect.options[quartoSelect.selectedIndex]
  const preco = Number.parseFloat(selectedOption.dataset.preco)

  if (!preco) {
    valorElement.textContent = "0,00"
    return
  }

  const total = preco * Number.parseInt(horas)
  valorElement.textContent = total.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  console.log("[v0] Valor total calculado:", total)
}

async function processarReserva(event) {
  event.preventDefault()

  const loadingOverlay = document.getElementById("loadingOverlay")
  if (loadingOverlay) {
    loadingOverlay.style.display = "flex"
  }

  try {
    const quartoSelect = document.getElementById("quartoSelecionado")
    const selectedOption = quartoSelect.options[quartoSelect.selectedIndex]

    const formData = {
      nome: document.getElementById("nomeCliente").value.trim(),
      placa: document.getElementById("placaCarro").value.trim().toUpperCase(),
      quartoId: quartoSelect.value,
      quartoNome: selectedOption.text.split(" - ")[0],
      data: document.getElementById("dataReserva").value,
      horaEntrada: document.getElementById("horaEntrada").value,
      horas: Number.parseInt(document.getElementById("horas").value),
      valorTotal:
        Number.parseFloat(selectedOption.dataset.preco) * Number.parseInt(document.getElementById("horas").value),
      timestamp: new Date(),
      status: "ativa",
    }

    // Validações
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

    const placaRegex = /^[A-Z]{3}-?\d{4}$|^[A-Z]{3}\d[A-Z]\d{2}$/
    if (!placaRegex.test(formData.placa)) {
      throw new Error("Formato de placa inválido")
    }

    const disponivel = await verificarDisponibilidadeQuarto(
      formData.quartoId,
      formData.data,
      formData.horaEntrada,
      formData.horas,
    )

    if (!disponivel) {
      throw new Error("Quarto não disponível no horário selecionado. Por favor, escolha outro horário ou quarto.")
    }

    if (window.db) {
      try {
        const { collection, addDoc } = await import("firebase/firestore")
        const docRef = await addDoc(collection(window.db, "reservas"), formData)
        console.log("[v0] Reserva salva no Firebase com ID:", docRef.id)

        // Mostrar confirmação visual
        const statusElement = document.createElement("div")
        statusElement.className = "firebase-status show"
        statusElement.textContent = "✅ Reserva salva no banco de dados"
        document.body.appendChild(statusElement)

        setTimeout(() => {
          statusElement.remove()
        }, 3000)
      } catch (firebaseError) {
        console.error("[v0] Erro ao salvar no Firebase:", firebaseError)
        throw new Error("Erro ao salvar reserva no banco de dados: " + firebaseError.message)
      }
    } else {
      console.warn("[v0] Firebase não disponível, reserva não salva no banco")
      alert("Atenção: Reserva não foi salva no banco de dados (Firebase não conectado)")
    }

    enviarWhatsApp(formData)

    alert("Reserva confirmada com sucesso! Você será redirecionado para o WhatsApp.")

    // Limpar formulário e recarregar quartos
    document.getElementById("reservaForm").reset()
    document.getElementById("valorTotal").textContent = "0,00"
    configurarDataMinima()
    carregarQuartos()
  } catch (error) {
    console.error("[v0] Erro na reserva:", error)
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

  console.log("[v0] Mensagem WhatsApp enviada")
}

async function carregarReservasAtivas() {
  const container = document.getElementById("reservasAtivas")
  if (!container) return

  try {
    if (!window.db) {
      container.innerHTML =
        '<p class="no-data">Firebase não configurado. Configure o Firebase para ver as reservas.</p>'
      return
    }

    const { collection, query, where, orderBy, getDocs } = await import("firebase/firestore")
    const q = query(collection(window.db, "reservas"), where("status", "==", "ativa"), orderBy("timestamp", "desc"))

    const snapshot = await getDocs(q)

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

    console.log("[v0] Reservas ativas carregadas")
  } catch (error) {
    console.error("[v0] Erro ao carregar reservas:", error)
    container.innerHTML = '<p class="error">Erro ao carregar reservas.</p>'
  }
}

async function fazerCheckout(reservaId) {
  if (!confirm("Confirmar check-out desta reserva?")) return

  try {
    if (window.db) {
      const { doc, updateDoc } = await import("firebase/firestore")
      await updateDoc(doc(window.db, "reservas", reservaId), {
        status: "finalizada",
        checkoutTimestamp: new Date(),
      })
    }

    alert("Check-out realizado com sucesso!")
    carregarReservasAtivas()

    console.log("[v0] Check-out realizado para reserva:", reservaId)
  } catch (error) {
    console.error("[v0] Erro no check-out:", error)
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

  for (let i = 0; i < 12; i++) {
    const date = new Date(currentYear, currentDate.getMonth() - i, 1)
    const option = document.createElement("option")
    option.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    option.textContent = `${meses[date.getMonth()]} ${date.getFullYear()}`
    select.appendChild(option)
  }
}

function preencherAnosRelatorio() {
  const select = document.getElementById("anoRelatorio")
  if (!select) return

  const currentYear = new Date().getFullYear()

  for (let i = 0; i < 5; i++) {
    const year = currentYear - i
    const option = document.createElement("option")
    option.value = year
    option.textContent = year
    select.appendChild(option)
  }
}

async function gerarRelatorio() {
  const mes = document.getElementById("mesRelatorio").value
  const container = document.getElementById("relatorioContent")

  if (!mes || !container) {
    alert("Selecione um mês para gerar o relatório")
    return
  }

  container.innerHTML = '<div class="loading-spinner">Gerando relatório...</div>'

  try {
    if (!window.db) {
      container.innerHTML = '<p class="error">Firebase não configurado. Configure o Firebase para gerar relatórios.</p>'
      return
    }

    const [ano, mesNum] = mes.split("-")
    const inicioMes = `${ano}-${mesNum.padStart(2, "0")}-01`
    const fimMes = `${ano}-${mesNum.padStart(2, "0")}-31`

    console.log("[v0] Buscando reservas entre:", inicioMes, "e", fimMes)

    const { collection, query, where, getDocs } = await import("firebase/firestore")
    const q = query(collection(window.db, "reservas"), where("data", ">=", inicioMes), where("data", "<=", fimMes))

    const snapshot = await getDocs(q)
    console.log("[v0] Reservas encontradas:", snapshot.size)

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

    console.log("[v0] Relatório gerado com sucesso")
  } catch (error) {
    console.error("[v0] Erro ao gerar relatório:", error)
    container.innerHTML = `<p class="error">Erro ao gerar relatório: ${error.message}</p>`
  }
}

async function gerarRelatorioAnual() {
  const ano = document.getElementById("anoRelatorio").value
  const container = document.getElementById("relatorioAnualContent")

  if (!ano || !container) {
    alert("Selecione um ano para gerar o relatório")
    return
  }

  container.innerHTML = '<div class="loading-spinner">Gerando relatório anual...</div>'

  try {
    if (!window.db) {
      container.innerHTML = '<p class="error">Firebase não configurado. Configure o Firebase para gerar relatórios.</p>'
      return
    }

    const inicioAno = `${ano}-01-01`
    const fimAno = `${ano}-12-31`

    console.log("[v0] Buscando reservas entre:", inicioAno, "e", fimAno)

    const { collection, query, where, getDocs } = await import("firebase/firestore")
    const q = query(collection(window.db, "reservas"), where("data", ">=", inicioAno), where("data", "<=", fimAno))

    const snapshot = await getDocs(q)
    console.log("[v0] Reservas encontradas:", snapshot.size)

    const reservas = []
    let totalFaturamento = 0
    const quartoStats = {}
    const mesesStats = {}

    snapshot.forEach((doc) => {
      const reserva = doc.data()
      reservas.push(reserva)
      totalFaturamento += reserva.valorTotal || 0

      if (!quartoStats[reserva.quartoNome]) {
        quartoStats[reserva.quartoNome] = { count: 0, revenue: 0 }
      }
      quartoStats[reserva.quartoNome].count++
      quartoStats[reserva.quartoNome].revenue += reserva.valorTotal || 0

      const mes = new Date(reserva.data).getMonth()
      if (!mesesStats[mes]) {
        mesesStats[mes] = { count: 0, revenue: 0 }
      }
      mesesStats[mes].count++
      mesesStats[mes].revenue += reserva.valorTotal || 0
    })

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
        <div class="summary-card">
          <h4>Média Mensal</h4>
          <p class="summary-number">${Math.round(reservas.length / 12)} reservas</p>
        </div>
      </div>
      
      <div class="relatorio-details">
        <h4>Desempenho Mensal</h4>
        <div class="meses-stats">
          ${meses
            .map((nome, index) => {
              const stats = mesesStats[index] || { count: 0, revenue: 0 }
              return `
              <div class="mes-stat">
                <h5>${nome}</h5>
                <p>Reservas: ${stats.count}</p>
                <p>Receita: R$ ${stats.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              </div>
            `
            })
            .join("")}
        </div>
        
        <h4>Desempenho por Quarto</h4>
        <div class="quartos-stats">
          ${Object.entries(quartoStats)
            .map(
              ([nome, stats]) => `
            <div class="quarto-stat">
              <h5>${nome}</h5>
              <p>Reservas: ${stats.count}</p>
              <p>Receita: R$ ${stats.revenue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
              <p>% do Total: ${((stats.revenue / totalFaturamento) * 100).toFixed(1)}%</p>
            </div>
          `,
            )
            .join("")}
        </div>
      </div>
    `

    console.log("[v0] Relatório anual gerado com sucesso")
  } catch (error) {
    console.error("[v0] Erro ao gerar relatório anual:", error)
    container.innerHTML = `<p class="error">Erro ao gerar relatório anual: ${error.message}</p>`
  }
}

function showTab(tabName) {
  document.querySelectorAll(".tab-content").forEach((tab) => {
    tab.classList.remove("active")
  })

  document.querySelectorAll(".tab-button").forEach((button) => {
    button.classList.remove("active")
  })

  const selectedTab = document.getElementById(tabName)
  const selectedButton = document.querySelector(`[onclick="showTab('${tabName}')"]`)

  if (selectedTab) selectedTab.classList.add("active")
  if (selectedButton) selectedButton.classList.add("active")

  if (tabName === "reservas") {
    carregarReservasAtivas()
  }
}
