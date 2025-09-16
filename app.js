/* =========================
   Utilidades DOM e Helpers
   ========================= */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const pad = (n) => String(n).padStart(2, "0");

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
};

const toInputDate = (val) => {
  // tenta converter dd/mm/yyyy para yyyy-mm-dd se necessário
  if (!val) return "";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
    const [dd, mm, yyyy] = val.split("/");
    return `${yyyy}-${mm}-${dd}`;
  }
  // assume que já é yyyy-mm-dd
  return val;
};

const formatBRL = (n) => {
  const num = typeof n === "number" ? n : Number(n || 0);
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

const parseNumber = (val) => {
  if (typeof val === "number") return val;
  if (!val) return 0;
  // aceita "1.234,56" e "1234.56"
  const norm = val.replace(/\./g, "").replace(",", ".");
  const num = Number(norm);
  return isNaN(num) ? 0 : num;
};

const sanitize = (str) => {
  if (str == null) return "";
  return String(str)
    .replace(/[<>&"]/g, (m) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[m]))
    .trim();
};

const onlyDigits = (s) => (s || "").replace(/\D+/g, "");

const normalizePhoneBR = (phone) => {
  const d = onlyDigits(phone);
  if (!d) return "";
  // se já vier com país, mantém, senão assume +55
  if (d.length >= 12 && d.startsWith("55")) return d;
  return `55${d}`;
};

const buildWhatsAppURL = (phone, text) => {
  const d = onlyDigits(phone);
  const encoded = encodeURIComponent(text);
  if (d) {
    const n = normalizePhoneBR(d);
    return `https://wa.me/${n}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
};

const uuid = () =>
  "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 15) >> 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

/* =========================
   Estado e Persistência
   ========================= */
const STORAGE_KEY = "nota-eletronica.os-list.v1";
const THEME_KEY = "nota-eletronica.theme";

const AppState = {
  items: [], // lista de OS
  filtered: [], // visão filtrada para paginação
  page: 1,
  pageSize: 10,
  editingId: null, // quando estiver editando
  lastId: 0, // auto incremento simples para exibição
};

const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (Array.isArray(data.items)) {
      AppState.items = data.items;
    }
    AppState.lastId = Number(data.lastId) || 0;
  } catch (e) {
    console.error("Erro ao carregar LocalStorage:", e);
  }
};

const saveState = () => {
  try {
    const data = {
      items: AppState.items,
      lastId: AppState.lastId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Erro ao salvar LocalStorage:", e);
  }
};

const nextId = () => {
  AppState.lastId += 1;
  return AppState.lastId;
};

/* =========================
   Seletores do DOM
   ========================= */
const els = {
  // Header / Navegação
  btnMenu: $("#btn-menu"),
  mainNav: $("#main-nav"),
  btnTheme: $("#btn-theme"),
  iconSun: $("#icon-sun"),
  iconMoon: $("#icon-moon"),
  btnNewOS: $("#btn-new-os"),

  // Formulário
  form: $("#form-os"),
  campos: {
    clienteNome: $("#cliente-nome"),
    clienteEndereco: $("#cliente-endereco"),
    clienteTelefone: $("#cliente-telefone"),
    clienteEmail: $("#cliente-email"),
    notaFabrica: $$('input[name="notaFabrica"]'),
    garantiaFab: $$('input[name="garantiaFab"]'),
    tipoAparelho: $("#tipo-aparelho"),
    marcaAparelho: $("#marca-aparelho"),
    modeloAparelho: $("#modelo-aparelho"),
    serialAparelho: $("#serial-aparelho"),
    defeitoRelatado: $("#defeito-relatado"),
    descricaoCliente: $("#descricao-cliente"),
    valorTotal: $("#valor-total"),
    dataEntrada: $("#data-entrada"),
    dataSaida: $("#data-saida"),
    statusAparelho: $("#status-aparelho"),
    condicoesAceite: $("#condicoes-aceite"),
  },
  statusList: $("#status-list"),

  // Ações do formulário
  btnSalvarOS: $("#btn-salvar-os"),
  btnLimpar: $("#btn-limpar-form"),
  btnExemplo: $("#btn-preencher-exemplo"),
  btnWhatsApp: $("#btn-whatsapp"),
  btnImprimir: $("#btn-imprimir"),

  // Lista / Tabela
  tbodyOS: $("#tbody-os"),
  templateRow: $("#row-os-template"),
  buscaOS: $("#busca-os"),
  filtroStatus: $("#filtro-status"),
  filtroTipo: $("#filtro-tipo"),
  btnExportar: $("#btn-exportar"),
  btnImportar: $("#btn-importar"),
  prevPage: $("#prev-page"),
  nextPage: $("#next-page"),
  pageInfo: $("#page-info"),

  // Modal de impressão
  printModal: $("#print-modal"),
  printFields: {
    osId: $("#print-os-id"),
    osData: $("#print-os-data"),
    cliNome: $("#print-cli-nome"),
    cliEndereco: $("#print-cli-endereco"),
    cliTelefone: $("#print-cli-telefone"),
    cliEmail: $("#print-cli-email"),
    apTipo: $("#print-ap-tipo"),
    apMarca: $("#print-ap-marca"),
    apModelo: $("#print-ap-modelo"),
    apSerial: $("#print-ap-serial"),
    apNota: $("#print-ap-nota"),
    apGarantia: $("#print-ap-garantia"),
    defeito: $("#print-defeito"),
    descricao: $("#print-descricao"),
    valor: $("#print-valor"),
    entrada: $("#print-entrada"),
    saida: $("#print-saida"),
    status: $("#print-status"),
  },
  btnPrintNow: $("#btn-print-now"),

  // Toasts / Loader / Tooltip
  toastStack: $("#toast-stack"),
  loader: $("#app-loader"),
  tooltip: $("#tooltip"),
  tooltipContent: $("#tooltip-content"),
  tooltipArrow: $("#tooltip-arrow"),

  // Rodapé
  year: $("#year"),
};

/* =========================
   Toasts
   ========================= */
const showToast = (title, msg = "", type = "success", timeout = 3500) => {
  const div = document.createElement("div");
  div.className = `toast ${type}`;
  div.innerHTML = `
    <div class="dot"></div>
    <div>
      <div class="title">${sanitize(title)}</div>
      <div class="msg">${sanitize(msg)}</div>
    </div>
    <button class="close" aria-label="Fechar">✕</button>
  `;
  els.toastStack.appendChild(div);
  const close = () => div.remove();
  div.querySelector(".close").addEventListener("click", close);
  setTimeout(close, timeout);
};

/* =========================
   Loader
   ========================= */
const showLoader = (show = true) => {
  if (!els.loader) return;
  if (show) {
    els.loader.hidden = false;
  } else {
    els.loader.hidden = true;
  }
};

/* =========================
   Tooltip (simples)
   ========================= */
let tooltipTimer = null;
const attachTooltip = (el, content) => {
  el.addEventListener("mouseenter", () => {
    clearTimeout(tooltipTimer);
    els.tooltipContent.textContent = content;
    els.tooltip.hidden = false;
    positionTooltip(el);
  });
  el.addEventListener("mouseleave", () => {
    tooltipTimer = setTimeout(() => (els.tooltip.hidden = true), 60);
  });
};
const positionTooltip = (anchor) => {
  const rect = anchor.getBoundingClientRect();
  const tip = els.tooltip;
  const tw = tip.offsetWidth;
  const th = tip.offsetHeight;
  const x = rect.left + rect.width / 2 - tw / 2;
  const y = rect.top - th - 10;
  tip.style.left = Math.max(8, x) + "px";
  tip.style.top = Math.max(8, y) + "px";
  els.tooltipArrow.style.left = tw / 2 - 5 + "px";
  els.tooltipArrow.style.top = th - 5 + "px";
};

/* =========================
   Tema
   ========================= */
const applyTheme = (theme) => {
  document.body.setAttribute("data-theme", theme);
  const isDark = theme === "dark";
  els.iconSun.hidden = isDark;
  els.iconMoon.hidden = !isDark;
  localStorage.setItem(THEME_KEY, theme);
};

const toggleTheme = () => {
  const cur = document.body.getAttribute("data-theme") || "light";
  applyTheme(cur === "light" ? "dark" : "light");
};

/* =========================
   Menu Mobile
   ========================= */
const toggleMenu = () => {
  const open = els.mainNav.classList.toggle("open");
  els.btnMenu.setAttribute("aria-expanded", String(open));
};
const closeMenu = () => {
  els.mainNav.classList.remove("open");
  els.btnMenu.setAttribute("aria-expanded", "false");
};

/* =========================
   Timeline de Status
   ========================= */
const STATUS_STEPS = [
  "Recebido na assistência",
  "Em diagnóstico",
  "Aguardando aprovação do cliente",
  "Em conserto",
  "Aguardando peças",
  "Consertado e testado 100%",
  "Pronto para retirada",
  "Entregue ao cliente",
];

const updateTimeline = (current) => {
  const items = $$("#status-list li");
  const idx = STATUS_STEPS.indexOf(current);
  items.forEach((li, i) => {
    li.classList.remove("is-active", "is-done");
    if (i < idx) li.classList.add("is-done");
    if (i === idx) li.classList.add("is-active");
  });
};

/* =========================
   Validação
   ========================= */
const validateForm = () => {
  const f = els.campos;
  let ok = true;

  // Campos obrigatórios
  const requiredFields = [
    f.clienteNome,
    f.clienteEndereco,
    f.clienteTelefone,
    f.tipoAparelho,
    f.marcaAparelho,
    f.modeloAparelho,
    f.defeitoRelatado,
    f.valorTotal,
    f.dataEntrada,
    f.statusAparelho,
  ];

  // Radios
  const notaChecked = f.notaFabrica.some((r) => r.checked);
  const garChecked = f.garantiaFab.some((r) => r.checked);
  if (!notaChecked || !garChecked) ok = false;

  requiredFields.forEach((el) => {
    if (!el.checkValidity() || !el.value.trim()) {
      el.classList.add("is-invalid");
      ok = false;
    } else {
      el.classList.remove("is-invalid");
    }
  });

  if (!els.campos.condicoesAceite.checked) ok = false;

  // Valor
  const val = parseNumber(f.valorTotal.value);
  if (val < 0) {
    f.valorTotal.classList.add("is-invalid");
    ok = false;
  }

  if (!ok) {
    els.form.classList.add("required-highlight");
    showToast("Verifique os campos", "Preencha todos os obrigatórios.", "warn");
  } else {
    els.form.classList.remove("required-highlight");
  }

  return ok;
};

/* =========================
   Leitura/Escrita de Form
   ========================= */
const readForm = () => {
  const f = els.campos;
  const nota = f.notaFabrica.find((r) => r.checked)?.value || "";
  const gar = f.garantiaFab.find((r) => r.checked)?.value || "";

  return {
    id: AppState.editingId || nextId(),
    uid: AppState.editingId ? (AppState.items.find((i) => i.id === AppState.editingId)?.uid || uuid()) : uuid(),
    clienteNome: sanitize(f.clienteNome.value),
    clienteEndereco: sanitize(f.clienteEndereco.value),
    clienteTelefone: sanitize(f.clienteTelefone.value),
    clienteEmail: sanitize(f.clienteEmail.value),
    notaFabrica: nota,
    garantiaFab: gar,
    tipoAparelho: sanitize(f.tipoAparelho.value),
    marcaAparelho: sanitize(f.marcaAparelho.value),
    modeloAparelho: sanitize(f.modeloAparelho.value),
    serialAparelho: sanitize(f.serialAparelho.value),
    defeitoRelatado: sanitize(f.defeitoRelatado.value),
    descricaoCliente: sanitize(f.descricaoCliente.value),
    valorTotal: parseNumber(f.valorTotal.value),
    dataEntrada: f.dataEntrada.value,
    dataSaida: f.dataSaida.value,
    statusAparelho: sanitize(f.statusAparelho.value),
    createdAt: AppState.editingId ? (AppState.items.find((i) => i.id === AppState.editingId)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

const fillForm = (data) => {
  const f = els.campos;
  f.clienteNome.value = data.clienteNome || "";
  f.clienteEndereco.value = data.clienteEndereco || "";
  f.clienteTelefone.value = data.clienteTelefone || "";
  f.clienteEmail.value = data.clienteEmail || "";
  els.campos.notaFabrica.forEach((r) => (r.checked = r.value === (data.notaFabrica || "")));
  els.campos.garantiaFab.forEach((r) => (r.checked = r.value === (data.garantiaFab || "")));
  f.tipoAparelho.value = data.tipoAparelho || "";
  f.marcaAparelho.value = data.marcaAparelho || "";
  f.modeloAparelho.value = data.modeloAparelho || "";
  f.serialAparelho.value = data.serialAparelho || "";
  f.defeitoRelatado.value = data.defeitoRelatado || "";
  f.descricaoCliente.value = data.descricaoCliente || "";
  f.valorTotal.value = data.valorTotal != null ? String(data.valorTotal) : "";
  f.dataEntrada.value = toInputDate(data.dataEntrada) || "";
  f.dataSaida.value = toInputDate(data.dataSaida) || "";
  f.statusAparelho.value = data.statusAparelho || "";
  els.campos.condicoesAceite.checked = true;
  updateTimeline(data.statusAparelho || "");
};

const clearForm = () => {
  els.form.reset();
  AppState.editingId = null;
  els.btnSalvarOS.textContent = "Salvar OS";
  els.campos.valorTotal.value = "";
  updateTimeline("");
};

/* =========================
   CRUD
   ========================= */
const createItem = (data) => {
  AppState.items.push(data);
  saveState();
};

const updateItem = (id, data) => {
  const idx = AppState.items.findIndex((i) => i.id === id);
  if (idx >= 0) {
    AppState.items[idx] = data;
    saveState();
  }
};

const deleteItem = (id) => {
  AppState.items = AppState.items.filter((i) => i.id !== id);
  saveState();
};

/* =========================
   Renderização da Tabela
   ========================= */
const applyFilters = () => {
  const q = sanitize(els.buscaOS.value).toLowerCase();
  const st = els.filtroStatus.value;
  const tp = els.filtroTipo.value;

  let list = [...AppState.items];

  if (q) {
    list = list.filter((it) => {
      const blob =
        `${it.clienteNome} ${it.clienteEndereco} ${it.clienteTelefone} ${it.tipoAparelho} ${it.marcaAparelho} ${it.modeloAparelho} ${it.statusAparelho}`.toLowerCase();
      return blob.includes(q);
    });
  }
  if (st) list = list.filter((it) => it.statusAparelho === st);
  if (tp) list = list.filter((it) => it.tipoAparelho === tp);

  // Ordena: mais recentes primeiro
  list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  AppState.filtered = list;
  AppState.page = 1;
};

const paginate = () => {
  const total = AppState.filtered.length;
  const pages = Math.max(1, Math.ceil(total / AppState.pageSize));
  AppState.page = Math.min(AppState.page, pages);

  const start = (AppState.page - 1) * AppState.pageSize;
  const end = start + AppState.pageSize;
  const slice = AppState.filtered.slice(start, end);

  els.prevPage.disabled = AppState.page <= 1;
  els.nextPage.disabled = AppState.page >= pages;
  els.pageInfo.textContent = `Página ${AppState.page} de ${pages}`;
  return slice;
};

const renderTable = () => {
  els.tbodyOS.innerHTML = "";
  const pageItems = paginate();

  if (!pageItems.length) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 9;
    td.innerHTML = `<div class="empty">Nenhuma OS encontrada</div>`;
    tr.appendChild(td);
    els.tbodyOS.appendChild(tr);
    return;
  }

  for (const item of pageItems) {
    const tr = els.templateRow.content.firstElementChild.cloneNode(true);
    const q = (sel) => tr.querySelector(sel);

    q(".col-id").textContent = item.id;
    q(".col-cliente").textContent = item.clienteNome;
    q(".col-contato").textContent = item.clienteTelefone || item.clienteEmail || "-";
    q(".col-aparelho").textContent = `${item.tipoAparelho} • ${item.marcaAparelho} • ${item.modeloAparelho}`;
    const tdStatus = q(".col-status");
    tdStatus.textContent = item.statusAparelho;
    tdStatus.dataset.status = item.statusAparelho;
    q(".col-entrada").textContent = formatDate(item.dataEntrada);
    q(".col-saida").textContent = item.dataSaida ? formatDate(item.dataSaida) : "-";
    q(".col-total").textContent = formatBRL(item.valorTotal);

    // Ações
    const btnView = q(".action-view");
    const btnEdit = q(".action-edit");
    const btnDel = q(".action-delete");
    const btnWpp = q(".action-whatsapp");

    attachTooltip(btnView, "Visualizar/Imprimir");
    attachTooltip(btnEdit, "Editar OS");
    attachTooltip(btnDel, "Excluir");
    attachTooltip(btnWpp, "Enviar via WhatsApp");

    btnView.addEventListener("click", () => openPrintPreview(item));
    btnEdit.addEventListener("click", () => {
      AppState.editingId = item.id;
      els.btnSalvarOS.textContent = "Atualizar OS";
      fillForm(item);
      // rola até o formulário
      document.location.hash = "#nova-os";
      showToast("Editando OS", `OS #${item.id} em edição.`, "success");
    });
    btnDel.addEventListener("click", async () => {
      if (!confirm(`Confirmar exclusão da OS #${item.id}?`)) return;
      showLoader(true);
      await sleep(250);
      deleteItem(item.id);
      refreshList();
      showLoader(false);
      showToast("Excluída", `OS #${item.id} removida.`, "success");
    });
    btnWpp.addEventListener("click", () => {
      const url = buildWhatsAppURL(item.clienteTelefone, composeWhatsAppMessage(item));
      window.open(url, "_blank", "noopener,noreferrer");
    });

    els.tbodyOS.appendChild(tr);
  }
};

/* =========================
   WhatsApp
   ========================= */
const composeWhatsAppMessage = (os) => {
  const linhas = [
    `Olá, ${os.clienteNome}!`,
    `Segue sua Nota Eletrônica (OS #${os.id}).`,
    "",
    `Aparelho: ${os.tipoAparelho} • ${os.marcaAparelho} • ${os.modeloAparelho}`,
    os.serialAparelho ? `Serial/IMEI: ${os.serialAparelho}` : "",
    `Nota fábrica: ${os.notaFabrica} | Garantia: ${os.garantiaFab}`,
    "",
    `Defeito relatado: ${os.defeitoRelatado}`,
    os.descricaoCliente ? `Descrição: ${os.descricaoCliente}` : "",
    `Entrada: ${formatDate(os.dataEntrada)}${os.dataSaida ? ` | Saída: ${formatDate(os.dataSaida)}` : ""}`,
    `Status: ${os.statusAparelho}`,
    `Valor total: ${formatBRL(os.valorTotal)}`,
    "",
    "Condições Gerais:",
    "1) Garantia dos serviços: 90 dias",
    "2) Garantia de produtos: apenas defeito de fabricação",
    "3) Não cobre mau uso/instalação/queda/desgaste",
    "4) Mercadorias fora do prazo podem ser desmontadas para custos",
    "5) Valores conforme OS",
    "",
    "Obrigado pela preferência!",
  ].filter(Boolean);
  return linhas.join("\n");
};

const handleWhatsAppButton = () => {
  if (!validateForm()) return;
  const data = readForm();
  const url = buildWhatsAppURL(data.clienteTelefone, composeWhatsAppMessage(data));
  window.open(url, "_blank", "noopener,noreferrer");
};

/* =========================
   Impressão
   ========================= */
const fillPrint = (os) => {
  const pf = els.printFields;
  pf.osId.textContent = os.id;
  pf.osData.textContent = formatDate(new Date().toISOString());
  pf.cliNome.textContent = os.clienteNome || "-";
  pf.cliEndereco.textContent = os.clienteEndereco || "-";
  pf.cliTelefone.textContent = os.clienteTelefone || "-";
  pf.cliEmail.textContent = os.clienteEmail || "-";
  pf.apTipo.textContent = os.tipoAparelho || "-";
  pf.apMarca.textContent = os.marcaAparelho || "-";
  pf.apModelo.textContent = os.modeloAparelho || "-";
  pf.apSerial.textContent = os.serialAparelho || "-";
  pf.apNota.textContent = os.notaFabrica || "-";
  pf.apGarantia.textContent = os.garantiaFab || "-";
  pf.defeito.textContent = os.defeitoRelatado || "-";
  pf.descricao.textContent = os.descricaoCliente || "-";
  pf.valor.textContent = formatBRL(os.valorTotal);
  pf.entrada.textContent = formatDate(os.dataEntrada) || "-";
  pf.saida.textContent = os.dataSaida ? formatDate(os.dataSaida) : "-";
  pf.status.textContent = os.statusAparelho || "-";
};

const openPrintPreview = (os) => {
  fillPrint(os);
  try {
    els.printModal.showModal();
  } catch {
    // fallback para browsers sem suporte
    els.printModal.setAttribute("open", "");
  }
};

const handleImprimir = () => {
  // imprime a partir do conteúdo atual do modal
  if (!els.printModal.hasAttribute("open")) {
    // se não estiver aberto, gera a prévia com dados do formulário atual
    if (!validateForm()) return;
    const data = readForm();
    fillPrint(data);
  }
  window.print();
};

/* =========================
   Import/Export JSON
   ========================= */
const exportJSON = () => {
  const data = {
    meta: { name: "Nota Eletrônica", version: 1, exportedAt: new Date().toISOString() },
    lastId: AppState.lastId,
    items: AppState.items,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nota-eletronica-os-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("Exportado", "Arquivo JSON gerado.", "success");
};

const importJSON = async () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json";
  input.onchange = async () => {
    const file = input.files?.[0];
    if (!file) return;
    showLoader(true);
    await sleep(150);
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data || !Array.isArray(data.items)) {
        throw new Error("Formato inválido");
      }
      // Mescla mantendo IDs únicos
      const maxCurrent = AppState.lastId;
      let changed = 0;
      for (const it of data.items) {
        if (!it || typeof it !== "object") continue;
        // evita colisão de id
        if (AppState.items.some((x) => x.uid === it.uid)) continue;
        AppState.lastId += 1;
        const copy = { ...it, id: AppState.lastId };
        AppState.items.push(copy);
        changed++;
      }
      saveState();
      refreshList();
      showToast("Importado", `${changed} OS adicionadas.`, "success");
    } catch (e) {
      console.error(e);
      showToast("Falha ao importar", "Verifique o arquivo JSON.", "error");
    } finally {
      showLoader(false);
    }
  };
  input.click();
};

/* =========================
   Eventos do Formulário
   ========================= */
const handleSubmit = async (ev) => {
  ev.preventDefault();
  if (!validateForm()) return;

  const data = readForm();
  showLoader(true);
  await sleep(200);

  if (AppState.editingId) {
    updateItem(AppState.editingId, data);
    showToast("Atualizada", `OS #${data.id} atualizada.`, "success");
  } else {
    createItem(data);
    showToast("Criada", `OS #${data.id} criada.`, "success");
  }

  refreshList();
  clearForm();
  showLoader(false);
};

const handleFillExample = () => {
  const exemplo = {
    clienteNome: "Maria Silva",
    clienteEndereco: "Rua das Flores, 123 - Centro, São Paulo/SP",
    clienteTelefone: "(11) 98888-7777",
    clienteEmail: "maria.silva@example.com",
    notaFabrica: "Não",
    garantiaFab: "Não",
    tipoAparelho: "Smartphone",
    marcaAparelho: "Samsung",
    modeloAparelho: "Galaxy S21",
    serialAparelho: "359876123456789",
    defeitoRelatado: "Aparelho não liga. Cliente relata queda recente.",
    descricaoCliente: "Será realizado diagnóstico completo e orçamento.",
    valorTotal: 350,
    dataEntrada: new Date().toISOString().slice(0, 10),
    dataSaida: "",
    statusAparelho: "Em diagnóstico",
  };
  fillForm(exemplo);
  showToast("Exemplo preenchido", "Você pode editar os campos.", "success");
};

const handleStatusChange = () => {
  const cur = els.campos.statusAparelho.value;
  updateTimeline(cur);
};

const handleNewOS = () => {
  clearForm();
  document.location.hash = "#nova-os";
  showToast("Nova OS", "Formulário pronto para preenchimento.", "success");
};

const handleClearForm = () => {
  clearForm();
  showToast("Limpo", "Formulário limpo.", "success");
};

/* =========================
   Filtros, busca e paginação
   ========================= */
const refreshList = () => {
  applyFilters();
  renderTable();
};

const handleSearch = () => {
  refreshList();
};

const handleFilter = () => {
  refreshList();
};

const handlePrevPage = () => {
  if (AppState.page > 1) {
    AppState.page -= 1;
    renderTable();
  }
};
const handleNextPage = () => {
  const pages = Math.max(1, Math.ceil(AppState.filtered.length / AppState.pageSize));
  if (AppState.page < pages) {
    AppState.page += 1;
    renderTable();
  }
};

/* =========================
   Ano no rodapé
   ========================= */
const updateYear = () => {
  const y = new Date().getFullYear();
  if (els.year) els.year.textContent = y;
};

/* =========================
   Interação WhatsApp/Imprimir
   ========================= */
const handlePrintButton = () => {
  if (!validateForm()) return;
  const data = readForm();
  openPrintPreview(data);
};

const initPrintDialog = () => {
  // fecha modal ao clicar fora (comportamento nativo do dialog não cobre tudo)
  els.printModal?.addEventListener("click", (e) => {
    const rect = els.printModal.querySelector(".modal-card")?.getBoundingClientRect();
    if (!rect) return;
    const inDialog =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (!inDialog) {
      try {
        els.printModal.close();
      } catch {
        els.printModal.removeAttribute("open");
      }
    }
  });
};

/* =========================
   Máscaras simples (telefone)
   ========================= */
const maskPhone = (ev) => {
  const el = ev.target;
  let v = onlyDigits(el.value);
  if (v.startsWith("55")) v = v.slice(2);
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 6) {
    el.value = `(${v.slice(0, 2)}) ${v.slice(2, 7)}-${v.slice(7)}`;
  } else if (v.length > 2) {
    el.value = `(${v.slice(0, 2)}) ${v.slice(2)}`;
  } else {
    el.value = v;
  }
};

/* =========================
   Inicialização
   ========================= */
const init = () => {
  // Carrega estado
  loadState();

  // Tema
  const savedTheme = localStorage.getItem(THEME_KEY) || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  applyTheme(savedTheme);

  // Ano no rodapé
  updateYear();

  // Eventos Header/Nav
  els.btnMenu?.addEventListener("click", toggleMenu);
  // fecha menu ao clicar num link
  $$("#main-nav a").forEach((a) =>
    a.addEventListener("click", () => {
      closeMenu();
    })
  );
  els.btnTheme?.addEventListener("click", toggleTheme);
  els.btnNewOS?.addEventListener("click", handleNewOS);

  // Form
  els.form?.addEventListener("submit", handleSubmit);
  els.btnLimpar?.addEventListener("click", handleClearForm);
  els.btnExemplo?.addEventListener("click", handleFillExample);
  els.btnWhatsApp?.addEventListener("click", handleWhatsAppButton);
  els.btnImprimir?.addEventListener("click", handlePrintButton);
  els.campos.statusAparelho?.addEventListener("change", handleStatusChange);
  els.campos.clienteTelefone?.addEventListener("input", maskPhone);

  // Lista e filtros
  els.buscaOS?.addEventListener("input", handleSearch);
  els.filtroStatus?.addEventListener("change", handleFilter);
  els.filtroTipo?.addEventListener("change", handleFilter);
  els.btnExportar?.addEventListener("click", exportJSON);
  els.btnImportar?.addEventListener("click", importJSON);
  els.prevPage?.addEventListener("click", handlePrevPage);
  els.nextPage?.addEventListener("click", handleNextPage);

  // Print dialog
  initPrintDialog();
  els.btnPrintNow?.addEventListener("click", () => {
    window.print();
  });

  // Inicializa timeline vazia
  updateTimeline("");

  // Renderiza lista ao iniciar
  refreshList();

  // Dica: tooltips nos botões globais
  if (els.btnExportar) attachTooltip(els.btnExportar, "Exportar JSON");
  if (els.btnImportar) attachTooltip(els.btnImportar, "Importar JSON");
  if (els.btnNewOS) attachTooltip(els.btnNewOS, "Criar nova OS");
};

document.addEventListener("DOMContentLoaded", init);

/* =========================
   Notas de Segurança
   =========================
   - As entradas de usuário são sanitizadas para exibição (sanitize()).
   - A exportação/importação é local, sem servidores.
   - Ao publicar, considere HTTPS e políticas de CSP.
   ========================= */

/* =========================
   Extensões futuras (stubs)
   ========================= */
// Registro de timestamps por status
const addStatusHistory = (os, status) => {
  // Futuro: armazenar histórico de alterações de status com data/hora
  // os.history = os.history || [];
  // os.history.push({ status, at: new Date().toISOString() });
};
// Upload de anexos (fotos)
const handleAttachments = () => {
  // Futuro: input type="file" + FileReader + armazenamento local/servidor
};
// Assinatura digital
const handleSignature = () => {
  // Futuro: canvas para assinatura e armazenamento da imagem base64
};

/* =========================
   Mapeamento de evento Enter
   ========================= */
els.form?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    // Evita envio involuntário em campos multiline
    if (e.target.matches("textarea")) return;
    // Faz submit manual para garantir validação custom
    e.preventDefault();
    els.form.requestSubmit();
  }
});

/* =========================
   Foco no primeiro inválido pós-validação
   ========================= */
const focusFirstInvalid = () => {
  const invalid = els.form.querySelector(".is-invalid, :invalid");
  if (invalid) invalid.focus();
};
els.form?.addEventListener("submit", () => {
  setTimeout(focusFirstInvalid, 0);
});

/* =========================
   Modo de Acessibilidade: aria-live
   ========================= */
const ariaAnnounce = (msg) => {
  const live = document.createElement("div");
  live.setAttribute("aria-live", "polite");
  live.className = "visually-hidden";
  live.textContent = msg;
  document.body.appendChild(live);
  setTimeout(() => live.remove(), 800);
};

/* =========================
   Observadores simples
   ========================= */
// Atualiza timeline em tempo real enquanto usuário muda status
els.campos.statusAparelho?.addEventListener("input", () => updateTimeline(els.campos.statusAparelho.value));

// Atualiza valor em tempo real (formatação live opcional)
// Mantemos número puro no input, a formatação BRL é feita na exibição/print
els.campos.valorTotal?.addEventListener("blur", (e) => {
  // opcional: validar numérico
  const n = parseNumber(e.target.value);
  if (isNaN(n) || n < 0) {
    e.target.classList.add("is-invalid");
    showToast("Valor inválido", "Digite um número válido.", "error");
  } else {
    e.target.classList.remove("is-invalid");
  }
});

/* =========================
   Criação de OS dummy em dev
   ========================= */
// Você pode descomentar para popular com dados de teste
/*
(() => {
  if (AppState.items.length === 0) {
    const sample = [
      {
        id: nextId(),
        uid: uuid(),
        clienteNome: "João Pereira",
        clienteEndereco: "Av. Brasil, 456 - RJ",
        clienteTelefone: "(21) 97777-5555",
        clienteEmail: "",
        notaFabrica: "Não",
        garantiaFab: "Não",
        tipoAparelho: "Notebook",
        marcaAparelho: "Dell",
        modeloAparelho: "Inspiron 15 3000",
        serialAparelho: "S/N 123-456-XYZ",
        defeitoRelatado: "Sem vídeo ao ligar.",
        descricaoCliente: "",
        valorTotal: 890,
        dataEntrada: "2025-07-05",
        dataSaida: "",
        statusAparelho: "Em diagnóstico",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: nextId(),
        uid: uuid(),
        clienteNome: "Ana Costa",
        clienteEndereco: "Rua Azul, 789 - SP",
        clienteTelefone: "(11) 96666-4444",
        clienteEmail: "ana@example.com",
        notaFabrica: "Sim",
        garantiaFab: "Não",
        tipoAparelho: "Tablet",
        marcaAparelho: "Apple",
        modeloAparelho: "iPad 9",
        serialAparelho: "A1B2C3D4",
        defeitoRelatado: "Troca de tela.",
        descricaoCliente: "Aguarda orçamento.",
        valorTotal: 1200,
        dataEntrada: "2025-07-10",
        dataSaida: "",
        statusAparelho: "Aguardando aprovação do cliente",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    AppState.items.push(...sample);
    saveState();
  }
})();
*/

/* =========================
   Shortcuts/Hotkeys (opcional)
   ========================= */
document.addEventListener("keydown", (e) => {
  if (e.ctrlKey && e.key.toLowerCase() === "s") {
    // Ctrl+S: salvar OS
    e.preventDefault();
    els.form?.requestSubmit();
  }
  if (e.ctrlKey && e.key.toLowerCase() === "f") {
    // Ctrl+F: foco na busca
    e.preventDefault();
    els.buscaOS?.focus();
  }
  if (e.ctrlKey && e.key.toLowerCase() === "n") {
    // Ctrl+N: nova OS
    e.preventDefault();
    handleNewOS();
  }
});

/* =========================
   Higiene de UI
   ========================= */
const setBusy = (btn, busy) => {
  if (!btn) return;
  btn.disabled = busy;
  if (busy) {
    btn.dataset._label = btn.textContent;
    btn.textContent = "Processando...";
  } else {
    if (btn.dataset._label) {
      btn.textContent = btn.dataset._label;
      delete btn.dataset._label;
    }
  }
};

els.btnExportar?.addEventListener("click", async (e) => {
  setBusy(e.currentTarget, true);
  await sleep(120);
  setBusy(e.currentTarget, false);
});

els.btnImportar?.addEventListener("click", async (e) => {
  setBusy(e.currentTarget, true);
  await sleep(120);
  setBusy(e.currentTarget, false);
});

/* =========================
   Preenchimento de Print via click na tabela
   ========================= */
// Já implementado em renderTable -> btnView

/* =========================
   Sincronização Storage (multi-aba)
   ========================= */
window.addEventListener("storage", (e) => {
  if (e.key === STORAGE_KEY) {
    try {
      const data = JSON.parse(e.newValue || "{}");
      if (Array.isArray(data.items)) {
        AppState.items = data.items;
        AppState.lastId = Number(data.lastId) || AppState.lastId;
        refreshList();
        showToast("Atualizado", "Dados sincronizados (outra aba).", "success");
      }
    } catch {}
  }
});

/* =========================
   Final: Log de inicialização
   ========================= */
console.log("%cNota Eletrônica", "color:#0ea5e9;font-weight:bold", "Aplicação iniciada.");
