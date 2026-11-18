/* Guia do Lab: interatividade (ambiente, progresso, busca, cenários). Sem dependências. */
(function () {
  'use strict';

  // ---------- Armazenamento seguro (localStorage pode falhar) ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem persistência */ } }
  };

  const toastEl = document.getElementById('toast');
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => toastEl.classList.remove('show'), 1800);
  }

  // ---------- Meu ambiente: substituição de {{MARCADORES}} ----------
  const DEFAULTS = {
    CATALOG: 'lab_datagov', WS_DBX: 'dbw-lab-datagov', RG: 'rg-lab-datagov', REGION: 'eastus2',
    GRP_ADMIN: 'grp-lab-datagov-admins', GRP_ENG: 'grp-lab-datagov-engenharia', GRP_READ: 'grp-lab-datagov-leitura',
    SP_FABRIC: 'sp-lab-fabric-mirror', FABRIC_WS: 'ws-lab-datagov', STORAGE: 'stlabdatagov',
    OWNER: 'seu.email@empresa.com', EXPIRA: '2026-12-31'
  };
  let env = Object.assign({}, store.get('env', {}));
  const val = (k) => (env[k] && String(env[k]).trim()) || DEFAULTS[k] || k;

  // Guarda o texto original de todo nó com marcador
  const tokenNodes = [];
  const walker = document.createTreeWalker(document.getElementById('main'), NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeValue.indexOf('{{') !== -1) tokenNodes.push({ node: n, orig: n.nodeValue });
  }
  function renderEnv() {
    tokenNodes.forEach(({ node, orig }) => {
      node.nodeValue = orig.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => val(k));
    });
    document.querySelectorAll('.v[data-k]').forEach(el => { el.textContent = val(el.dataset.k); });
  }
  const form = document.getElementById('env-form');
  Object.keys(DEFAULTS).forEach(k => {
    const input = form.elements[k];
    if (input && env[k]) input.value = env[k];
  });
  form.addEventListener('input', (e) => {
    if (!e.target.name) return;
    env[e.target.name] = e.target.value;
    store.set('env', env);
    renderEnv();
  });
  document.getElementById('env-reset').addEventListener('click', () => {
    env = {}; store.set('env', env); form.reset(); renderEnv(); toast('Valores limpos');
  });
  renderEnv();

  // ---------- Copiar código ----------
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.copy');
    if (!btn) return;
    const code = btn.closest('.code').querySelector('pre').innerText;
    const done = () => { btn.textContent = 'Copiado'; setTimeout(() => (btn.textContent = 'Copiar'), 1400); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code).then(done, () => fallbackCopy(code, done));
    } else fallbackCopy(code, done);
  });
  function fallbackCopy(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); cb(); } catch (e) { toast('Não foi possível copiar'); }
    document.body.removeChild(ta);
  }

  // ---------- Progresso dos módulos ----------
  const MODS = ['m0', 'm1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10'];
  const TITLES = {
    m0: 'Fundamentos e checagem', m1: 'Unity Catalog', m2: 'Volumes e ingestão', m3: 'Extração com IA',
    m4: 'Pipeline automatizado', m5: 'Busca e RAG', m6: 'Fabric: mirroring', m7: 'Proteção de dados',
    m8: 'Governança e linhagem', m9: 'Rede e identidade', m10: 'Custos e limpeza'
  };
  let progress = store.get('progress', {});
  function renderProgress() {
    let done = 0;
    MODS.forEach(m => {
      const isDone = !!progress[m];
      if (isDone) done++;
      const box = document.querySelector(`input[data-done="${m}"]`);
      if (box) box.checked = isDone;
      const det = document.getElementById(m);
      if (det) det.classList.toggle('complete', isDone);
      const link = document.querySelector(`#nav a[data-mod="${m}"]`);
      if (link) link.classList.toggle('done', isDone);
    });
    document.getElementById('progress-label').textContent = `${done}/${MODS.length}`;
    document.getElementById('progress-bar').style.width = `${(done / MODS.length) * 100}%`;
  }
  document.querySelectorAll('input[data-done]').forEach(box => {
    box.addEventListener('change', () => {
      progress[box.dataset.done] = box.checked ? new Date().toISOString().slice(0, 10) : false;
      store.set('progress', progress);
      renderProgress();
      if (box.checked) toast(`${box.dataset.done.toUpperCase()} concluído`);
    });
  });
  renderProgress();

  document.getElementById('export-progress').addEventListener('click', () => {
    const lines = ['| Módulo | Estado | Concluído em |', '|---|---|---|'];
    MODS.forEach(m => lines.push(`| ${m.toUpperCase()} ${TITLES[m]} | ${progress[m] ? 'concluído' : 'não iniciado / em andamento'} | ${progress[m] || ''} |`));
    const text = lines.join('\n');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast('Registro copiado'), () => fallbackCopy(text, () => toast('Registro copiado')));
    } else fallbackCopy(text, () => toast('Registro copiado'));
  });

  // ---------- Abrir módulo pelo hash ----------
  function openFromHash() {
    const id = location.hash.slice(1);
    const el = id && document.getElementById(id);
    if (el && el.tagName === 'DETAILS') { el.open = true; }
  }
  window.addEventListener('hashchange', openFromHash);
  openFromHash();

  // ---------- Menu móvel ----------
  document.getElementById('menu-toggle').addEventListener('click', () => document.body.classList.toggle('nav-open'));
  document.getElementById('nav').addEventListener('click', (e) => { if (e.target.closest('a')) document.body.classList.remove('nav-open'); });

  // ---------- Destaque da seção atual ----------
  const navLinks = Array.from(document.querySelectorAll('#nav a'));
  const sections = navLinks.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          navLinks.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + en.target.id));
        }
      });
    }, { rootMargin: '-70px 0px -70% 0px' });
    sections.forEach(s => io.observe(s));
  }

  // ---------- Tabela de recursos ----------
  const FEATURES = [
    ['Unity Catalog (habilitação automática)', 'dbx', 'ga', 'Automático em workspaces criados após 09/11/2023. Base de tudo.'],
    ['Volumes managed / external', 'dbx', 'ga', 'Arquivos governados por READ/WRITE VOLUME. Managed: retenção de 7 dias ao apagar.'],
    ['Tipo FILE (colunas de arquivo)', 'dbx', 'beta', 'Referências a arquivos em tabelas; ingestão como FILE no Auto Loader.'],
    ['ai_parse_document v2', 'dbx', 'ga', 'PDF, JPG, PNG, TIFF, DOC/DOCX, PPT/PPTX. Até 500 páginas e 100 MB. Runtime 17.3+. Disponível em East US 2.'],
    ['ai_extract v2.1', 'dbx', 'ga', 'Schema JSON tipado, enum, objetos aninhados, citações e score de confiança. Modo precision.'],
    ['ai_classify v2', 'dbx', 'ga', 'Classificação com até 500+ rótulos.'],
    ['ai_prep_search', 'dbx', 'beta', 'Chunks prontos para RAG com contexto. Runtime 18.2+.'],
    ['ai_search', 'dbx', 'beta', 'Busca + resposta fundamentada sobre índices.'],
    ['Databricks AI Search (ex-Vector Search)', 'dbx', 'ga', 'Índice Delta Sync; disponível em East US 2. Endpoint cobra enquanto existe.'],
    ['Tarefa ai_parse_document / ai_extract em Jobs', 'dbx', 'beta', 'Requer habilitar "Lakeflow AI Function Task" em Previews.'],
    ['AI Functions Asynchronous API', 'dbx', 'beta', 'Lotes via API; habilitar em Previews.'],
    ['Gatilho de chegada de arquivo (Jobs)', 'dbx', 'ga', 'Checa novos arquivos ~1x/min em volume ou external location.'],
    ['File events em external locations', 'dbx', 'ga', 'Habilitado por padrão em novas external locations; melhora Auto Loader e gatilhos.'],
    ['System tables (linhagem, billing)', 'dbx', 'ga', 'Disponível em East US 2. AI Functions aparece como AI_FUNCTIONS.'],
    ['Row filters e column masks', 'dbx', 'ga', 'Aplicação no Fabric via mirroring: não garantida (testar).'],
    ['Mirrored Azure Databricks catalog', 'fab', 'ga', 'Metadados + shortcut, somente leitura, tabelas Delta. Exige external data access e EXTERNAL USE SCHEMA.'],
    ['Mirroring atrás de private endpoint (VNet data gateway)', 'fab', 'ga', 'Exige VNet injection e private link; tutorial antigo ainda cita a restrição.'],
    ['Publish to OneLake (a partir do Databricks)', 'dbx', 'preview', 'Runtime 18.1+ ou serverless; nome de exibição só alfanumérico e _.'],
    ['OneLake security roles no item espelhado', 'fab', 'ver', 'Permissão Read no Azure Databricks mirrored catalog. Confirme o estágio (GA/preview) na doc antes de levar ao cliente.'],
    ['OneLake catalog (Explore / Govern / Secure)', 'fab', 'ga', 'Experiência principal de governança no Fabric.'],
    ['Pause/resume de capacidade', 'fab', 'ga', 'Só F SKU (e A SKU); trial não pausa. Mirroring precisa de Resume replication.'],
    ['Rótulos de sensibilidade no Fabric', 'pur', 'ga', 'Em todos os itens Fabric; acompanham exportações suportadas.'],
    ['DLP para Fabric e Power BI', 'pur', 'ga', 'Lakehouse, warehouse, KQL, mirrored, SQL e Cosmos DB, modelos semânticos. Licença E5 ou equivalente.'],
    ['DLP: ação Restrict access', 'pur', 'preview', 'Restringe o item ao dono/organização quando há violação.'],
    ['Protection policies no Fabric', 'pur', 'ver', 'Exige rótulo com controle de acesso e a configuração de rótulos habilitada no tenant.'],
    ['Purview Audit para Fabric', 'pur', 'ga', 'Atividades do Fabric no log de auditoria.'],
    ['Insider Risk: indicadores de Fabric', 'pur', 'ga', 'Indicadores prontos para Power BI e lakehouse.'],
    ['Purview Data Map / Unified Catalog', 'pur', 'ret', 'Sem contas novas; manutenção até 12/11/2027; consolidação no Fabric.'],
    ['Scan do Unity Catalog no Purview', 'pur', 'ret', 'Metastore, catálogos, schemas, tabelas, views, tags e linhagem via SQL Warehouse. Só faz sentido com conta existente.']
  ];
  const STATUS_LABEL = { ga: ['GA', 'ga'], beta: ['Beta', 'beta'], preview: ['Preview', 'preview'], ret: ['Aposentadoria', 'ret'], ver: ['Verificar', 'ver'] };
  const PLAT_LABEL = { dbx: ['Databricks', 'dbx'], fab: ['Fabric', 'fab'], pur: ['Purview', 'pur'] };
  const tbody = document.querySelector('#feat-table tbody');
  tbody.innerHTML = FEATURES.map(([name, plat, st, note]) =>
    `<tr data-plat="${plat}" data-st="${st}"><td><strong>${name}</strong></td>` +
    `<td><span class="tag ${PLAT_LABEL[plat][1]}">${PLAT_LABEL[plat][0]}</span></td>` +
    `<td><span class="tag ${STATUS_LABEL[st][1]}">${STATUS_LABEL[st][0]}</span></td><td class="small">${note}</td></tr>`
  ).join('');
  document.getElementById('feat-filters').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    document.querySelectorAll('#feat-filters button').forEach(x => x.classList.toggle('on', x === b));
    const f = b.dataset.f;
    tbody.querySelectorAll('tr').forEach(tr => {
      const p = tr.dataset.plat, s = tr.dataset.st;
      let show = f === 'all' || f === p || f === s || (f === 'preview' && (s === 'preview' || s === 'beta'));
      tr.style.display = show ? '' : 'none';
    });
  });

  // ---------- Casos de uso ----------
  const CASES = [
    { t: 'Seguradora: sinistros em PDF e fotos', c: 'dbx',
      in: 'Laudos de vistoria, fotos do sinistro, orçamentos de oficina.',
      x: 'ai_parse_document na silver; ai_extract para apólice, valor, data e causa; fotos ficam no volume.',
      out: 'Painel de sinistros no Power BI via mirroring da gold de consumo.',
      p: 'Volume de fotos sem EXTERNAL USE SCHEMA; conexão do mirroring com service principal só na gold.',
      w: 'Conexão criada com conta de arquiteto (admin) expunha a silver no Fabric.' },
    { t: 'Jurídico: contratos e aditivos', c: 'pur',
      in: 'Contratos DOCX e PDF, alguns escaneados e assinados digitalmente.',
      x: 'ai_extract com schema de cláusulas (vigência, multa, reajuste, foro) em modo precision; citações para auditoria.',
      out: 'Alertas de vencimento e busca por cláusula (RAG com ai_prep_search).',
      p: 'Rótulo Confidencial no item Fabric; DLP para dados pessoais das partes.',
      w: 'Assinatura digital pode reduzir precisão do parse: medir na fila de revisão.' },
    { t: 'Órgão público: processos digitalizados', c: 'fab',
      in: 'Processos administrativos escaneados com dados pessoais e classificação de sigilo.',
      x: 'Parse + extract do número do processo, assunto, interessado e grau de sigilo.',
      out: 'Indicadores de tramitação no Fabric.',
      p: 'Sem E5: row filter por sigilo no Unity Catalog, OneLake security com o mesmo grupo, gold com CPF mascarado; Audit habilitado.',
      w: 'Sem licença de DLP, a proteção vira desenho de dados; registrar como risco aceito.' },
    { t: 'RH: currículos e documentos admissionais', c: 'pur',
      in: 'Currículos, RG/CPF digitalizados, comprovantes.',
      x: 'Classificação por tipo de documento (ai_classify) e extração de campos não sensíveis para o funil.',
      out: 'Funil de recrutamento sem dados pessoais no Fabric.',
      p: 'Documentos de identidade nunca saem do volume; gold de consumo pseudonimizada.',
      w: 'Base legal e retenção definidas pelo DPO antes do primeiro arquivo.' },
    { t: 'Financeiro: notas fiscais e boletos', c: 'dbx',
      in: 'DANFE em PDF, XML eventual, boletos escaneados.',
      x: 'ai_extract com CNPJ, valor, vencimento e itens (arrays de objetos).',
      out: 'Conciliação e contas a pagar no Power BI.',
      p: 'Dados de empresa (CNPJ) com menor sensibilidade; manter controle de acesso por área.',
      w: 'Itens de nota com muitas linhas: usar modo precision e validar totais.' },
    { t: 'Engenharia: relatórios técnicos com diagramas', c: 'fab',
      in: 'PPTX e PDFs com figuras, tabelas e gráficos.',
      x: 'Parse com descrição de figuras e imageOutputPath para busca multimodal.',
      out: 'Assistente que responde citando página e figura.',
      p: 'Grants por projeto; índice de busca filtrado por metadados.',
      w: 'Descrição de figuras aumenta custo: ligar só onde há ganho.' }
  ];
  document.getElementById('cases').innerHTML = CASES.map(k => `
    <div class="card ${k.c}"><h4>${k.t}</h4>
      <dl class="kv" style="grid-template-columns:110px 1fr;margin:8px 0;font-size:14px">
        <dt>Entrada</dt><dd>${k.in}</dd>
        <dt>Extração</dt><dd>${k.x}</dd>
        <dt>Consumo</dt><dd>${k.out}</dd>
        <dt>Proteção</dt><dd>${k.p}</dd>
        <dt>Armadilha</dt><dd>${k.w}</dd>
      </dl></div>`).join('');

  // ---------- Seletor de cenários ----------
  const picker = document.getElementById('picker');
  const out = document.getElementById('scenario-out');
  function rec(level, title, body, tag) {
    return `<div class="rec ${level}"><h5>${tag ? `<span class="tag ${tag[0]}">${tag[1]}</span> ` : ''}${title}</h5><p>${body}</p></div>`;
  }
  function renderScenario() {
    const f = new FormData(picker);
    const rede = f.get('rede'), lic = f.get('lic'), dm = f.get('dm'), cons = f.get('cons'), pii = f.get('pii');
    const grande = f.get('grande'), esc = f.get('escaneado'), ext = f.get('externo');
    const r = [];
    r.push('<h3>Desenho recomendado</h3>');
    r.push(rec('ok', 'Base comum', 'Unity Catalog com catálogo por domínio, posse por grupo, volume managed de pouso, medalhão bronze/silver/gold e pipeline incremental com gatilho de chegada de arquivo.'));

    if (cons === 'fabric') {
      r.push(rec('ok', 'Consumo no Fabric via Mirrored Azure Databricks catalog', 'Espelhar só o schema de consumo. Conexão com service principal com SELECT + EXTERNAL USE SCHEMA. Refazer acesso com OneLake security usando os mesmos grupos.', ['fato', 'FATO']));
    } else if (cons === 'dbx') {
      r.push(rec('ok', 'Consumo no Databricks', 'Dashboards/Genie no Databricks; o Fabric não é necessário. Proteção concentrada no Unity Catalog (grants, filtros, máscaras). Purview só se houver outros itens no Fabric/M365.', ['inf', 'INFERÊNCIA']));
    } else {
      r.push(rec('ok', 'Busca / agente', 'ai_prep_search (Beta) + AI Search com filtros por metadados de sensibilidade; respostas citando a fonte. Testar exposição de trechos para usuários sem acesso ao documento.', ['prem', 'PREMISSA']));
    }

    if (rede === 'fechada') {
      r.push(rec('warn', 'Rede fechada', 'Mirroring com VNet data gateway (conexão em Manage connections; VNet injection + private link). Storage com firewall: liberar Workspace Identity do Fabric (trusted workspace access, que não aplica RLS/CLM do Unity Catalog). Purview scan, se houver, com Managed VNet IR. Esforço alto; dependência do time de rede.', ['fato', 'FATO']));
    } else {
      r.push(rec('ok', 'Rede aberta', 'Mirroring direto. Mesmo assim, documente o desenho de produção (M9) para não ser surpreendido.'));
    }

    if (lic === 'e5') {
      r.push(rec('ok', 'Proteção com Purview completo', 'Rótulos nos itens Fabric, DLP para Fabric em modo teste e depois enforcement, Audit e Insider Risk. Lembre: DLP consome capacidade.', ['fato', 'FATO']));
    } else if (lic === 'e3') {
      r.push(rec('warn', 'Rótulos sem DLP para Fabric', 'Rótulos de sensibilidade e Audit disponíveis; DLP para Fabric exige E5/E5 Compliance/IP&G ou Purview capacities. Compensar com gold sem PII e OneLake security.', ['fato', 'FATO']));
    } else {
      r.push(rec('bad', 'Sem licença de proteção', 'Proteção apenas por Unity Catalog e OneLake security. Publicar no Fabric só dados já anonimizados. Registrar como risco aceito pelo cliente.', ['inf', 'INFERÊNCIA']));
    }

    if (dm === 'sim') {
      r.push(rec('warn', 'Conta Purview Data Map existente', 'Funciona em manutenção até 12/11/2027. Não expandir escopo; planejar a governança no OneLake catalog + Unity Catalog. Scan do Unity Catalog só se agregar valor até a transição.', ['fato', 'FATO']));
    } else {
      r.push(rec('ok', 'Sem Data Map', 'Governança técnica no Unity Catalog e no OneLake catalog. Não há como criar conta nova.', ['fato', 'FATO']));
    }

    if (pii === 'alta') {
      r.push(rec('bad', 'Dados pessoais (LGPD)', 'O risco está no bruto e na silver. Volume raw só para engenharia, column mask na silver, gold de consumo pseudonimizada e só ela no Fabric. DLP como rede de segurança. Lacuna a declarar: DLP do Purview não inspeciona arquivos no Volume.', ['inf', 'INFERÊNCIA']));
    }
    if (grande) r.push(rec('warn', 'Documentos grandes', 'Limite de 500 páginas e 100 MB no ai_parse_document. Use pageRange em blocos ou divida antes; marque na bronze o que excede.', ['fato', 'FATO']));
    if (esc) r.push(rec('warn', 'Escaneados de baixa qualidade', 'Espere confiança menor e campos nulos. Fila de revisão humana, score de confiança no ai_extract e meta de qualidade acordada com o negócio.', ['inf', 'INFERÊNCIA']));
    if (ext) r.push(rec('warn', 'Outro sistema grava no storage', 'Use volume external numa subpasta da external location (nunca na raiz). Sistemas externos podem contornar o Unity Catalog: alinhe RBAC/ACL do storage ou use credential vending.', ['fato', 'FATO']));

    r.push('<h3>Validar no lab antes de prometer</h3>');
    const val = ['Comportamento de row filter/column mask em tabela espelhada'];
    if (lic === 'e5') val.push('Se o item Mirrored Azure Databricks catalog é avaliado pelo DLP como "mirrored database"');
    if (rede === 'fechada') val.push('Fluxo completo com VNet data gateway e firewall de storage');
    if (cons === 'rag') val.push('Exposição de trechos no índice de busca para usuários do grupo leitura');
    r.push('<ul class="tight">' + val.map(v => `<li>${v}</li>`).join('') + '</ul>');
    out.innerHTML = r.join('');
  }
  picker.addEventListener('change', renderScenario);
  renderScenario();

  // ---------- Busca ----------
  const search = document.getElementById('search');
  const pages = Array.from(document.querySelectorAll('section.page'));
  const modules = Array.from(document.querySelectorAll('details.module'));
  search.addEventListener('input', () => {
    const q = search.value.trim().toLowerCase();
    if (!q) {
      pages.forEach(p => p.classList.remove('hidden-by-search'));
      modules.forEach(m => m.classList.remove('hidden-by-search'));
      return;
    }
    pages.forEach(p => {
      const hit = p.textContent.toLowerCase().includes(q);
      p.classList.toggle('hidden-by-search', !hit);
    });
    modules.forEach(m => {
      const hit = m.innerText.toLowerCase().includes(q) || m.textContent.toLowerCase().includes(q);
      m.classList.toggle('hidden-by-search', !hit);
      if (hit) m.open = true;
    });
  });
})();
