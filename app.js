const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const pad = (n) => String(n).padStart(2, "0");

const formatDate = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()}`;
};
const toInputDate = (val) => /^\d{2}\/\d{2}\/\d{4}$/.test(val) ? val.replace(/(\d{2})\/(\d{2})\/(\d{4})/,"$3-$2-$1") : (val||"");
const formatBRL = (n) => (typeof n === "number" ? n : Number((n||"").replace(/\./g,"").replace(",",".")||0)).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const parseNumber = (val) => { if(typeof val==="number") return val; const x = Number((val||"").replace(/\./g,"").replace(",",".")||0); return isNaN(x)?0:x; };
const sanitize = (str) => str==null ? "" : String(str).replace(/[<>&"]/g, m=>({ "<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;" }[m])).trim();
const onlyDigits = (s) => (s||"").replace(/\D+/g,"");
const normalizePhoneBR = (p) => { const d = onlyDigits(p); if (!d) return ""; return (d.length>=12 && d.startsWith("55"))?d:`55${d}`; };
const buildWhatsAppURL = (phone, text) => {
  const d = onlyDigits(phone);
  const t = encodeURIComponent(text);
  return d ? `https://wa.me/${normalizePhoneBR(d)}?text=${t}` : `https://wa.me/?text=${t}`;
};
const uuid = () => "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=(crypto.getRandomValues(new Uint8Array(1))[0]&15);const v=c==="x"?r:(r&0x3)|0x8;return v.toString(16)});

// Estado
const STORAGE_KEY="nota-eletronica.os-list.v1";
const THEME_KEY="nota-eletronica.theme";
const AppState = { items:[], filtered:[], page:1, pageSize:10, editingId:null, lastId:0 };

// DOM
const els = {
  btnMenu: $("#btn-menu"), mainNav: $("#main-nav"), btnTheme: $("#btn-theme"), iconSun: $("#icon-sun"), iconMoon: $("#icon-moon"), btnNewOS: $("#btn-new-os"),
  form: $("#form-os"),
  campos: {
    clienteNome: $("#cliente-nome"), clienteEndereco: $("#cliente-endereco"), clienteTelefone: $("#cliente-telefone"), clienteEmail: $("#cliente-email"),
    notaFabrica: $$('input[name="notaFabrica"]'), garantiaFab: $$('input[name="garantiaFab"]'),
    tipoAparelho: $("#tipo-aparelho"), marcaAparelho: $("#marca-aparelho"), modeloAparelho: $("#modelo-aparelho"), serialAparelho: $("#serial-aparelho"),
    defeitoRelatado: $("#defeito-relatado"), descricaoCliente: $("#descricao-cliente"), valorTotal: $("#valor-total"),
    dataEntrada: $("#data-entrada"), dataSaida: $("#data-saida"), statusAparelho: $("#status-aparelho"), condicoesAceite: $("#condicoes-aceite"),
  },
  statusList: $("#status-list"),
  btnSalvarOS: $("#btn-salvar-os"), btnLimpar: $("#btn-limpar-form"), btnExemplo: $("#btn-preencher-exemplo"),
  btnWhatsApp: $("#btn-whatsapp"), btnImprimir: $("#btn-imprimir"),
  tbodyOS: $("#tbody-os"), templateRow: $("#row-os-template"),
  buscaOS: $("#busca-os"), filtroStatus: $("#filtro-status"), filtroTipo: $("#filtro-tipo"),
  btnExportar: $("#btn-exportar"), btnImportar: $("#btn-importar"),
  prevPage: $("#prev-page"), nextPage: $("#next-page"), pageInfo: $("#page-info"),
  printModal: $("#print-modal"),
  printFields: {
    osId: $("#print-os-id"), osData: $("#print-os-data"),
    cliNome: $("#print-cli-nome"), cliEndereco: $("#print-cli-endereco"), cliTelefone: $("#print-cli-telefone"), cliEmail: $("#print-cli-email"),
    apTipo: $("#print-ap-tipo"), apMarca: $("#print-ap-marca"), apModelo: $("#print-ap-modelo"), apSerial: $("#print-ap-serial"),
    apNota: $("#print-ap-nota"), apGarantia: $("#print-ap-garantia"),
    defeito: $("#print-defeito"), descricao: $("#print-descricao"),
    valor: $("#print-valor"), entrada: $("#print-entrada"), saida: $("#print-saida"), status: $("#print-status"),
  },
  btnPrintNow: $("#btn-print-now"),
  toastStack: $("#toast-stack"), loader: $("#app-loader"),
  tooltip: $("#tooltip"), tooltipContent: $("#tooltip-content"), tooltipArrow: $("#tooltip-arrow"),
  year: $("#year"),
};

/* Persistência */
const loadState = () => { try{ const raw=localStorage.getItem(STORAGE_KEY); if(!raw) return; const data=JSON.parse(raw); if(Array.isArray(data.items)) AppState.items=data.items; AppState.lastId=Number(data.lastId)||0; }catch(e){console.error(e)} };
const saveState = () => { try{ localStorage.setItem(STORAGE_KEY, JSON.stringify({items:AppState.items,lastId:AppState.lastId})); }catch(e){ console.error(e) } };
const nextId = () => (++AppState.lastId);

/* Toast/Loader/Tooltip */
const showToast=(title,msg="",type="success",timeout=3000)=>{const d=document.createElement("div");d.className=`toast ${type}`;d.innerHTML=`<div></div><div><div class="title">${sanitize(title)}</div><div class="msg">${sanitize(msg)}</div></div><button class="close" aria-label="Fechar">✕</button>`;els.toastStack.appendChild(d);const close=()=>d.remove();d.querySelector(".close").addEventListener("click",close);setTimeout(close,timeout)};
const showLoader=(b=true)=>{ if(!els.loader) return; els.loader.hidden=!b; };
const attachTooltip=(el,content)=>{ let t=null; el.addEventListener("mouseenter",()=>{ clearTimeout(t); els.tooltipContent.textContent=content; els.tooltip.hidden=false; const r=el.getBoundingClientRect(), tip=els.tooltip, tw=tip.offsetWidth, th=tip.offsetHeight; const x=r.left+r.width/2-tw/2, y=r.top-th-10; tip.style.left=Math.max(8,x)+"px"; tip.style.top=Math.max(8,y)+"px"; els.tooltipArrow.style.left=tw/2-5+"px"; els.tooltipArrow.style.top=th-5+"px"; }); el.addEventListener("mouseleave",()=>{ t=setTimeout(()=>els.tooltip.hidden=true,60) }); };

/* Tema/menu e header offset */
const applyTheme=(t)=>{document.body.setAttribute("data-theme",t);const dark=t==="dark";els.iconSun.hidden=dark;els.iconMoon.hidden=!dark;localStorage.setItem(THEME_KEY,t)};
const toggleTheme=()=>applyTheme((document.body.getAttribute("data-theme")||"light")==="light"?"dark":"light");

/* Backdrop menu + scroll lock */
let navBackdrop = null;
const ensureNavBackdrop = () => {
  if (!navBackdrop) {
    navBackdrop = document.getElementById("nav-backdrop");
    if (!navBackdrop) {
      navBackdrop = document.createElement("div");
      navBackdrop.id = "nav-backdrop";
      navBackdrop.className = "nav-backdrop";
      document.body.appendChild(navBackdrop);
    }
    navBackdrop.addEventListener("click", closeMenu);
  }
  return navBackdrop;
};
const lockScroll = (lock) => {
  document.body.classList.toggle("nav-open", !!lock);
};

/* Corrige recorte do topo: mede a altura real do header e ajusta a var CSS --header-h */
const applyHeaderOffset = () => {
  const header = document.querySelector(".app-header");
  if (!header) return;
  const h = header.getBoundingClientRect().height || 72;
  document.documentElement.style.setProperty("--header-h", `${Math.round(h)}px`);
};

const toggleMenu=()=>{const open=els.mainNav.classList.toggle("open");els.btnMenu.setAttribute("aria-expanded",String(open)); ensureNavBackdrop().classList.toggle("show", open); lockScroll(open); applyHeaderOffset();};
const closeMenu=()=>{els.mainNav.classList.remove("open");els.btnMenu.setAttribute("aria-expanded","false"); ensureNavBackdrop().classList.remove("show"); lockScroll(false); applyHeaderOffset();};

/* Timeline */
const STATUS_STEPS=["Recebido na assistência","Em diagnóstico","Aguardando aprovação do cliente","Em conserto","Aguardando peças","Consertado e testado 100%","Pronto para retirada","Entregue ao cliente"];
const updateTimeline=(current)=>{const items=$$("#status-list li");const idx=STATUS_STEPS.indexOf(current);items.forEach((li,i)=>{li.classList.remove("is-active","is-done");if(i<idx) li.classList.add("is-done");if(i===idx) li.classList.add("is-active")})};

/* Validação */
const validateForm=()=>{const f=els.campos;let ok=true;const req=[f.clienteNome,f.clienteEndereco,f.clienteTelefone,f.tipoAparelho,f.marcaAparelho,f.modeloAparelho,f.defeitoRelatado,f.valorTotal,f.dataEntrada,f.statusAparelho];const nota=f.notaFabrica.some(r=>r.checked), gar=f.garantiaFab.some(r=>r.checked); if(!nota||!gar) ok=false; req.forEach(el=>{if(!el.checkValidity()||!el.value.trim()){el.classList.add("is-invalid");ok=false}else{el.classList.remove("is-invalid")}}); if(!f.condicoesAceite.checked) ok=false; if(parseNumber(f.valorTotal.value)<0){f.valorTotal.classList.add("is-invalid");ok=false} if(!ok){els.form.classList.add("required-highlight");showToast("Verifique os campos","Preencha todos os obrigatórios.","warn")} else els.form.classList.remove("required-highlight"); return ok; };

/* Form IO */
const readForm=()=>{const f=els.campos;return{
  id: AppState.editingId || nextId(),
  uid: AppState.editingId ? (AppState.items.find(i=>i.id===AppState.editingId)?.uid||uuid()) : uuid(),
  clienteNome:sanitize(f.clienteNome.value), clienteEndereco:sanitize(f.clienteEndereco.value), clienteTelefone:sanitize(f.clienteTelefone.value), clienteEmail:sanitize(f.clienteEmail.value),
  notaFabrica:f.notaFabrica.find(r=>r.checked)?.value||"", garantiaFab:f.garantiaFab.find(r=>r.checked)?.value||"",
  tipoAparelho:sanitize(f.tipoAparelho.value), marcaAparelho:sanitize(f.marcaAparelho.value), modeloAparelho:sanitize(f.modeloAparelho.value), serialAparelho:sanitize(f.serialAparelho.value),
  defeitoRelatado:sanitize(f.defeitoRelatado.value), descricaoCliente:sanitize(f.descricaoCliente.value),
  valorTotal:parseNumber(f.valorTotal.value),
  dataEntrada:f.dataEntrada.value, dataSaida:f.dataSaida.value, statusAparelho:sanitize(f.statusAparelho.value),
  createdAt: AppState.editingId ? (AppState.items.find(i=>i.id===AppState.editingId)?.createdAt||new Date().toISOString()) : new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}};
const fillForm=(d)=>{const f=els.campos;
  f.clienteNome.value=d.clienteNome||""; f.clienteEndereco.value=d.clienteEndereco||""; f.clienteTelefone.value=d.clienteTelefone||""; f.clienteEmail.value=d.clienteEmail||"";
  els.campos.notaFabrica.forEach(r=>r.checked=r.value===(d.notaFabrica||"")); els.campos.garantiaFab.forEach(r=>r.checked=r.value===(d.garantiaFab||""));
  f.tipoAparelho.value=d.tipoAparelho||""; f.marcaAparelho.value=d.marcaAparelho||""; f.modeloAparelho.value=d.modeloAparelho||""; f.serialAparelho.value=d.serialAparelho||"";
  f.defeitoRelatado.value=d.defeitoRelatado||""; f.descricaoCliente.value=d.descricaoCliente||""; f.valorTotal.value=d.valorTotal!=null?String(d.valorTotal):"";
  f.dataEntrada.value=toInputDate(d.dataEntrada)||""; f.dataSaida.value=toInputDate(d.dataSaida)||""; f.statusAparelho.value=d.statusAparelho||"";
  f.condicoesAceite.checked=true; updateTimeline(d.statusAparelho||"");
};
const clearForm=()=>{els.form.reset();AppState.editingId=null;els.btnSalvarOS.textContent="Salvar OS";els.campos.valorTotal.value="";updateTimeline("")};

/* CRUD */
const createItem=(data)=>{AppState.items.push(data);saveState()};
const updateItem=(id,data)=>{const i=AppState.items.findIndex(x=>x.id===id);if(i>=0){AppState.items[i]=data;saveState()}};
const deleteItem=(id)=>{AppState.items=AppState.items.filter(i=>i.id!==id);saveState()};

/* Tabela/cards */
const setDataLabels=(tr)=>{const labels=["#","Cliente","Contato","Tipo/Marca/Modelo","Status","Entrada","Saída","Total (R$)","Ações"]; Array.from(tr.children).forEach((td,i)=>td.setAttribute("data-col",labels[i]||""))};
const applyFilters=()=>{const q=sanitize(els.buscaOS.value).toLowerCase(), st=els.filtroStatus.value, tp=els.filtroTipo.value; let list=[...AppState.items];
  if(q) list=list.filter(it=>`${it.clienteNome} ${it.clienteEndereco} ${it.clienteTelefone} ${it.tipoAparelho} ${it.marcaAparelho} ${it.modeloAparelho} ${it.statusAparelho}`.toLowerCase().includes(q));
  if(st) list=list.filter(it=>it.statusAparelho===st); if(tp) list=list.filter(it=>it.tipoAparelho===tp);
  list.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt)); AppState.filtered=list; AppState.page=1;
};
const paginate=()=>{const total=AppState.filtered.length; const pages=Math.max(1,Math.ceil(total/AppState.pageSize)); AppState.page=Math.min(AppState.page,pages);
  const start=(AppState.page-1)*AppState.pageSize, end=start+AppState.pageSize; const slice=AppState.filtered.slice(start,end);
  els.prevPage.disabled=AppState.page<=1; els.nextPage.disabled=AppState.page>=pages; els.pageInfo.textContent=`Página ${AppState.page} de ${pages}`; return slice;
};
const renderTable=()=>{els.tbodyOS.innerHTML=""; const pageItems=paginate(); if(!pageItems.length){const tr=document.createElement("tr");const td=document.createElement("td");td.colSpan=9;td.innerHTML=`<div class="empty">Nenhuma OS encontrada</div>`;tr.appendChild(td);els.tbodyOS.appendChild(tr);return;}
  for(const item of pageItems){const tr=els.templateRow.content.firstElementChild.cloneNode(true); const q=(s)=>tr.querySelector(s);
    q(".col-id").textContent=item.id;
    q(".col-cliente").textContent=item.clienteNome;
    q(".col-contato").textContent=item.clienteTelefone||item.clienteEmail||"-";
    q(".col-aparelho").textContent=`${item.tipoAparelho} • ${item.marcaAparelho} • ${item.modeloAparelho}`;
    const tdStatus=q(".col-status"); tdStatus.textContent=item.statusAparelho; tdStatus.dataset.status=item.statusAparelho;
    q(".col-entrada").textContent=formatDate(item.dataEntrada);
    q(".col-saida").textContent=item.dataSaida?formatDate(item.dataSaida):"-";
    q(".col-total").textContent=formatBRL(item.valorTotal);
    const btnView=q(".action-view"), btnEdit=q(".action-edit"), btnDel=q(".action-delete"), btnWpp=q(".action-whatsapp");
    attachTooltip(btnView,"Visualizar/Imprimir"); attachTooltip(btnEdit,"Editar OS"); attachTooltip(btnDel,"Excluir"); attachTooltip(btnWpp,"Enviar via WhatsApp");
    btnView.addEventListener("click",()=>openPrintPreview(item));
    btnEdit.addEventListener("click",()=>{AppState.editingId=item.id;els.btnSalvarOS.textContent="Atualizar OS";fillForm(item);location.hash="#nova-os";showToast("Editando OS",`OS #${item.id} em edição.`,"success")});
    btnDel.addEventListener("click",async()=>{if(!confirm(`Confirmar exclusão da OS #${item.id}?`)) return; showLoader(true); await sleep(200); deleteItem(item.id); refreshList(); showLoader(false); showToast("Excluída",`OS #${item.id} removida.`,"success")});
    btnWpp.addEventListener("click",()=>{window.open(buildWhatsAppURL(item.clienteTelefone,composeWhatsAppMessage(item)),"_blank","noopener,noreferrer")});
    setDataLabels(tr);
    els.tbodyOS.appendChild(tr);
  }
};

/* WhatsApp/Impressão */
const composeWhatsAppMessage=(os)=>[
  `Olá, ${os.clienteNome}!`,
  `Segue sua Nota Eletrônica (OS #${os.id}).`,
  "", `Aparelho: ${os.tipoAparelho} • ${os.marcaAparelho} • ${os.modeloAparelho}`,
  os.serialAparelho?`Serial/IMEI: ${os.serialAparelho}`:"",
  `Nota fábrica: ${os.notaFabrica} | Garantia: ${os.garantiaFab}`, "",
  `Defeito relatado: ${os.defeitoRelatado}`, os.descricaoCliente?`Descrição: ${os.descricaoCliente}`:"",
  `Entrada: ${formatDate(os.dataEntrada)}${os.dataSaida?` | Saída: ${formatDate(os.dataSaida)}`:""}`,
  `Status: ${os.statusAparelho}`, `Valor total: ${formatBRL(os.valorTotal)}`, "",
  "Condições Gerais:", "1) Garantia dos serviços: 90 dias","2) Garantia de produtos: defeito de fabricação",
  "3) Não cobre mau uso/instalação/queda/desgaste","4) Itens fora do prazo podem ser desmontados para custos","5) Valores conforme OS", "", "Obrigado!"
].filter(Boolean).join("\n");
const handleWhatsAppButton=()=>{ if(!validateForm()) return; const d=readForm(); window.open(buildWhatsAppURL(d.clienteTelefone,composeWhatsAppMessage(d)),"_blank","noopener,noreferrer") };
const fillPrint=(os)=>{const pf=els.printFields; pf.osId.textContent=os.id; pf.osData.textContent=formatDate(new Date().toISOString());
  pf.cliNome.textContent=os.clienteNome||"-"; pf.cliEndereco.textContent=os.clienteEndereco||"-"; pf.cliTelefone.textContent=os.clienteTelefone||"-"; pf.cliEmail.textContent=os.clienteEmail||"-";
  pf.apTipo.textContent=os.tipoAparelho||"-"; pf.apMarca.textContent=os.marcaAparelho||"-"; pf.apModelo.textContent=os.modeloAparelho||"-"; pf.apSerial.textContent=os.serialAparelho||"-";
  pf.apNota.textContent=os.notaFabrica||"-"; pf.apGarantia.textContent=os.garantiaFab||"-";
  pf.defeito.textContent=os.defeitoRelatado||"-"; pf.descricao.textContent=os.descricaoCliente||"-";
  pf.valor.textContent=formatBRL(os.valorTotal); pf.entrada.textContent=formatDate(os.dataEntrada)||"-"; pf.saida.textContent=os.dataSaida?formatDate(os.dataSaida):"-"; pf.status.textContent=os.statusAparelho||"-";
};
const openPrintPreview=(os)=>{fillPrint(os); try{els.printModal.showModal()}catch{els.printModal.setAttribute("open","")}};
const handlePrintButton=()=>{ if(!validateForm()) return; const d=readForm(); openPrintPreview(d); };

/* Import/Export */
const exportJSON=()=>{const data={meta:{name:"Nota Eletrônica",version:1,exportedAt:new Date().toISOString()},lastId:AppState.lastId,items:AppState.items}; const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}); const url=URL.createObjectURL(blob); const a=document.createElement("a"); a.href=url; a.download=`nota-eletronica-os-${Date.now()}.json`; a.click(); URL.revokeObjectURL(url); showToast("Exportado","Arquivo JSON gerado.","success")};
const importJSON=()=>{const input=document.createElement("input"); input.type="file"; input.accept="application/json"; input.onchange=async()=>{const file=input.files?.[0]; if(!file) return; showLoader(true); await sleep(150); try{const text=await file.text(); const data=JSON.parse(text); if(!data||!Array.isArray(data.items)) throw new Error("Formato inválido"); let added=0; for(const it of data.items){ if(!it||typeof it!=="object") continue; if(AppState.items.some(x=>x.uid===it.uid)) continue; AppState.lastId+=1; AppState.items.push({...it,id:AppState.lastId}); added++; } saveState(); refreshList(); showToast("Importado",`${added} OS adicionadas.`,"success"); }catch(e){console.error(e);showToast("Falha ao importar","Verifique o JSON.","error")} finally{showLoader(false)} }; input.click(); };

/* Eventos form */
const handleSubmit=async(e)=>{e.preventDefault(); if(!validateForm()) return; const data=readForm(); showLoader(true); await sleep(200);
  if(AppState.editingId){ updateItem(AppState.editingId,data); showToast("Atualizada",`OS #${data.id} atualizada.`,"success"); } else { createItem(data); showToast("Criada",`OS #${data.id} criada.`,"success"); }
  refreshList(); clearForm(); showLoader(false);
};
const handleStatusChange=()=>updateTimeline(els.campos.statusAparelho.value);
const handleNewOS=()=>{clearForm(); location.hash="#nova-os"; showToast("Nova OS","Formulário pronto.","success")};
const handleClearForm=()=>{clearForm(); showToast("Limpo","Formulário limpo.","success")};
const handleFillExample=()=>{ const ex={clienteNome:"Maria Silva",clienteEndereco:"Rua A, 123 - Centro",clienteTelefone:"(11) 98888-7777",clienteEmail:"",notaFabrica:"Não",garantiaFab:"Não",tipoAparelho:"Smartphone",marcaAparelho:"Samsung",modeloAparelho:"Galaxy S21",serialAparelho:"",defeitoRelatado:"Não liga",descricaoCliente:"",valorTotal:350,dataEntrada:new Date().toISOString().slice(0,10),dataSaida:"",statusAparelho:"Em diagnóstico"}; fillForm(ex); showToast("Exemplo","Campos preenchidos para teste.","success") };

/* Paginação/filtros */
const refreshList=()=>{applyFilters(); renderTable()};
const handleSearch=()=>refreshList();
const handleFilter=()=>refreshList();
const handlePrevPage=()=>{if(AppState.page>1){AppState.page--; renderTable()}};
const handleNextPage=()=>{const pages=Math.max(1,Math.ceil(AppState.filtered.length/AppState.pageSize)); if(AppState.page<pages){AppState.page++; renderTable()}};

/* Responsividade: ajustar pageSize */
const applyResponsivePageSize=()=>{AppState.pageSize=window.matchMedia("(max-width: 720px)").matches?5:10; refreshList();};

/* Máscara telefone */
const maskPhone=(e)=>{let v=onlyDigits(e.target.value); if(v.startsWith("55")) v=v.slice(2); if(v.length>11) v=v.slice(0,11);
  if(v.length>6) e.target.value=`(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
  else if(v.length>2) e.target.value=`(${v.slice(0,2)}) ${v.slice(2)}`;
  else e.target.value=v;
};

/* Inicialização */
const init=()=> {
  loadState();
  const savedTheme=localStorage.getItem(THEME_KEY) || (matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"); applyTheme(savedTheme);
  if(els.year) els.year.textContent=new Date().getFullYear();

  ensureNavBackdrop();
  applyHeaderOffset();

  els.btnMenu?.addEventListener("click",toggleMenu);
  $$("#main-nav a").forEach(a=>a.addEventListener("click",closeMenu));
  els.btnTheme?.addEventListener("click",toggleTheme);
  els.btnNewOS?.addEventListener("click",handleNewOS);

  els.form?.addEventListener("submit",handleSubmit);
  els.btnLimpar?.addEventListener("click",handleClearForm);
  els.btnExemplo?.addEventListener("click",handleFillExample);
  els.btnWhatsApp?.addEventListener("click",handleWhatsAppButton);
  els.btnImprimir?.addEventListener("click",handlePrintButton);
  els.campos.statusAparelho?.addEventListener("change",handleStatusChange);
  els.campos.clienteTelefone?.addEventListener("input",maskPhone);

  els.buscaOS?.addEventListener("input",handleSearch);
  els.filtroStatus?.addEventListener("change",handleFilter);
  els.filtroTipo?.addEventListener("change",handleFilter);
  els.btnExportar?.addEventListener("click",exportJSON);
  els.btnImportar?.addEventListener("click",importJSON);
  els.prevPage?.addEventListener("click",handlePrevPage);
  els.nextPage?.addEventListener("click",handleNextPage);

  // Print: fechar ao clicar fora
  els.printModal?.addEventListener("click",(e)=>{const rect=els.printModal.querySelector(".modal-card")?.getBoundingClientRect(); if(!rect) return;
    const inDlg = e.clientX>=rect.left && e.clientX<=rect.right && e.clientY>=rect.top && e.clientY<=rect.bottom;
    if(!inDlg){ try{els.printModal.close()}catch{els.printModal.removeAttribute("open")} }
  });
  els.btnPrintNow?.addEventListener("click",()=>window.print());

  // Tooltips globais
  if(els.btnExportar) attachTooltip(els.btnExportar,"Exportar JSON");
  if(els.btnImportar) attachTooltip(els.btnImportar,"Importar JSON");
  if(els.btnNewOS) attachTooltip(els.btnNewOS,"Criar nova OS");

  // Responsividade pageSize e header offset no resize
  applyResponsivePageSize();
  window.addEventListener("resize",()=>{applyResponsivePageSize(); applyHeaderOffset();});

  // Recalcula offset do header ao fim da transição do menu
  const nav = document.getElementById("main-nav");
  if (nav) nav.addEventListener("transitionend", () => requestAnimationFrame(applyHeaderOffset), { passive: true });

  // Render
  updateTimeline("");
  refreshList();
};

/* Multi-aba sync */
window.addEventListener("storage",(e)=>{ if(e.key===STORAGE_KEY){ try{ const data=JSON.parse(e.newValue||"{}"); if(Array.isArray(data.items)){ AppState.items=data.items; AppState.lastId=Number(data.lastId)||AppState.lastId; refreshList(); showToast("Atualizado","Sincronizado com outra aba.","success"); } }catch{} } });

document.addEventListener("DOMContentLoaded", init);

/* Acessibilidade/validação extra */
els.form?.addEventListener("keydown",(e)=>{ if(e.key==="Enter" && !e.target.matches("textarea")){ e.preventDefault(); els.form.requestSubmit(); }});
els.campos?.valorTotal?.addEventListener("blur",(e)=>{const n=parseNumber(e.target.value); if(isNaN(n)||n<0){e.target.classList.add("is-invalid");showToast("Valor inválido","Digite um número válido.","error")} else e.target.classList.remove("is-invalid")});
