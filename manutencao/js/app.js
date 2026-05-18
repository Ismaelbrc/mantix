/* ================================================================
   PCM BR AÇO - Main Application
   ================================================================ */

const PCM = (() => {

  // ---- State ----
  let _currentSection = 'dashboard';
  let _currentFilter = 'todas';
  let _currentSort = 'dataPrevista';
  let _sortDir = 'asc';
  let _listSearch = '';
  let _currentModal = null;
  let _editId = null;
  let _pendingDeleteFn = null;
  let _calYear = new Date().getFullYear();
  let _calMonth = new Date().getMonth();
  let _currentChecklistManuId = null;
  let _currentIniciarId = null;
  let _currentConcluirId = null;
  let _editPlanoId = null;
  let _sistemaCount = 0;

  // ---- Sistemas e Tarefas Pré-definidos ----
  const SISTEMAS_PREDEFINIDOS = {
    'Sistema Elétrico': [
      'Verificar tensão de alimentação',
      'Inspecionar fiação e conexões',
      'Verificar fusíveis e disjuntores',
      'Testar botoeiras e sinalizadores',
      'Verificar aterramento',
      'Inspecionar painel elétrico',
      'Verificar estado dos contactores e relés',
      'Testar botão de parada de emergência',
    ],
    'Sistema Hidráulico': [
      'Verificar nível do óleo hidráulico',
      'Inspecionar mangueiras e conexões',
      'Verificar pressão do sistema',
      'Inspecionar vazamentos',
      'Limpar ou substituir filtros hidráulicos',
      'Verificar estado dos cilindros hidráulicos',
      'Verificar temperatura do óleo',
    ],
    'Sistema Pneumático': [
      'Verificar pressão do ar comprimido',
      'Drenar condensado do reservatório',
      'Inspecionar mangueiras e conexões',
      'Verificar FRL (Filtro-Regulador-Lubrificador)',
      'Testar válvulas pneumáticas',
      'Verificar atuadores pneumáticos',
    ],
    'Lubrificação': [
      'Lubrificar mancais e rolamentos',
      'Verificar nível de óleo das caixas de transmissão',
      'Trocar óleo conforme plano',
      'Graxar pontos de lubrificação',
      'Verificar sistema de lubrificação centralizada',
      'Limpar bicos de lubrificação',
    ],
    'Sistema Mecânico': [
      'Verificar folgas e desgastes',
      'Inspecionar correntes e correias',
      'Verificar alinhamento de eixos',
      'Inspecionar rolamentos (ruído e temperatura)',
      'Verificar acoplamentos',
      'Reapertar parafusos e fixações',
      'Verificar engrenagens e redutores',
    ],
    'Sistema de Refrigeração': [
      'Verificar nível do fluido de arrefecimento',
      'Limpar trocador de calor',
      'Verificar ventiladores e radiadores',
      'Aferir temperatura de operação',
      'Inspecionar bomba de circulação',
    ],
    'Estrutura e Fixação': [
      'Inspecionar estrutura por trincas e deformações',
      'Verificar parafusos de fixação da base',
      'Inspecionar proteções e tampas',
      'Verificar estado da pintura e revestimento',
      'Verificar nivelamento do equipamento',
    ],
    'Segurança': [
      'Testar botão(ões) de parada de emergência',
      'Verificar proteções e guards',
      'Verificar sinalização de segurança',
      'Inspecionar extintor próximo ao equipamento',
      'Testar alarmes e sensores de segurança',
      'Verificar travas e intertravamentos',
    ],
    'Limpeza Geral': [
      'Limpar área ao redor do equipamento',
      'Limpar painel de controle',
      'Remover resíduos internos',
      'Limpar filtros de ar',
      'Limpar pontos de acesso e manutenção',
    ],
  };

  function _getSistemasOptions(selected) {
    const opts = Object.keys(SISTEMAS_PREDEFINIDOS)
      .map(n => `<option value="${n}"${selected === n ? ' selected' : ''}>${n}</option>`)
      .join('');
    return `<option value="">— Selecione o sistema —</option>${opts}` +
      `<option value="__outro__"${selected === '__outro__' ? ' selected' : ''}>✏️ Outro (escrever)</option>`;
  }

  function _getTarefasOptions(nomeSistema, selected) {
    const tarefas = SISTEMAS_PREDEFINIDOS[nomeSistema] || [];
    const opts = tarefas
      .map(t => `<option value="${t}"${selected === t ? ' selected' : ''}>${t}</option>`)
      .join('');
    return `<option value="">— Selecione a tarefa —</option>${opts}` +
      `<option value="__outro__"${selected === '__outro__' ? ' selected' : ''}>✏️ Outra (escrever)</option>`;
  }

  // ================================================================
  // INIT
  // ================================================================
  async function init() {
    // Show loading overlay while fetching MySQL data
    const overlay = document.getElementById('pcm-loading-overlay');
    if (overlay) overlay.style.display = 'flex';

    const ok = await DB.init();
    if (!ok) {
      Utils.toast('Erro ao conectar ao banco de dados. Recarregue a página.', 'error');
    }

    DB.applyPatches();
    setupEventListeners();
    setupPinInputs();

    if (overlay) overlay.style.display = 'none';

    checkLogin();
    navigate('dashboard');
    updateBadges();
    updateStorageInfo();
    applyTheme();
    updateNotifications();

    // Update date badge
    const dateBadge = document.getElementById('dashboardDate');
    if (dateBadge) {
      const now = new Date();
      dateBadge.textContent = now.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    }

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
  }

  // ================================================================
  // NAVIGATION
  // ================================================================
  function navigate(section) {
    // Hide all sections
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show target section
    const sectionEl = document.getElementById('section-' + section);
    if (sectionEl) sectionEl.classList.add('active');

    // Activate nav item
    const navItem = document.querySelector(`[data-section="${section}"]`);
    if (navItem) navItem.classList.add('active');

    // Update breadcrumb
    const titles = {
      dashboard: 'Dashboard',
      manutencoes: 'Manutenções',
      'nova-manutencao': 'Nova Manutenção',
      preventivas: 'Preventivas',
      os: 'Ordens de Serviço',
      estoque: 'Gestão de Estoque',
      relatorios: 'Relatórios',
      configuracoes: 'Configurações'
    };
    const title = document.getElementById('currentSectionTitle');
    if (title) title.textContent = titles[section] || section;

    _currentSection = section;

    // Render the section
    switch(section) {
      case 'dashboard': renderDashboard(); break;
      case 'manutencoes': renderManutencoes(); break;
      case 'nova-manutencao': renderForm(null); break;
      case 'preventivas': renderPreventivas(); break;
      case 'os': if (typeof OS_Module !== 'undefined') OS_Module.render(); break;
      case 'estoque': renderEstoque(); break;
      case 'relatorios': {
        const period = document.getElementById('reportPeriod')?.value || 'mes';
        Reports.renderAll(period);
        break;
      }
      case 'configuracoes': renderConfiguracoes(); break;
    }

    // Close mobile menu
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.remove('mobile-open');
    const overlay = document.getElementById('mobileOverlay');
    if (overlay) overlay.classList.remove('active');

    // Scroll to top
    const contentArea = document.querySelector('.content-area');
    if (contentArea) contentArea.scrollTop = 0;
  }

  function goToFilter(filter) {
    _currentFilter = filter;
    navigate('manutencoes');
    document.querySelectorAll('.filter-tab').forEach(t => {
      t.classList.toggle('active', t.dataset.filter === filter);
    });
  }

  // ================================================================
  // DASHBOARD
  // ================================================================
  function renderDashboard() {
    renderStatsCards();
    renderAlerts();
    renderCalendar();
    renderRecentList();
    renderTeamToday();
  }

  function renderStatsCards() {
    const stats = DB.Manutencao.getStats();
    const container = document.getElementById('statsGrid');
    if (!container) return;

    const cards = [
      { label: 'Críticas',        value: stats.critica,   filter: 'critica',   sub: stats.atrasada + ' atrasadas',                               icon: 'fa-circle-exclamation', color: '#E74C3C', bg: 'rgba(231,76,60,0.1)' },
      { label: 'Alta Prioridade', value: stats.alta,      filter: 'alta',      sub: stats.hoje + ' para hoje',                                   icon: 'fa-circle-up',          color: '#F39C12', bg: 'rgba(243,156,18,0.1)' },
      { label: 'Pendentes',       value: stats.pendente,  filter: 'pendente',  sub: 'aguardando início',                                         icon: 'fa-clock',              color: '#95A5A6', bg: 'rgba(149,165,166,0.1)' },
      { label: 'Em Andamento',    value: stats.andamento, filter: 'andamento', sub: 'em execução agora',                                         icon: 'fa-play-circle',        color: '#4A90E2', bg: 'rgba(74,144,226,0.1)' },
      { label: 'Concluídas',      value: stats.concluida, filter: 'concluida', sub: 'total realizadas',                                          icon: 'fa-check-circle',       color: '#27AE60', bg: 'rgba(39,174,96,0.1)' },
      { label: 'Total',           value: stats.total,     filter: 'todas',     sub: stats.preventivas + ' prev / ' + stats.corretivas + ' corr', icon: 'fa-list-check',         color: '#1F4E78', bg: 'rgba(31,78,120,0.1)' }
    ];

    container.innerHTML = cards.map(c => `
      <div class="stat-card" style="--stat-color:${c.color}; --stat-bg:${c.bg}; cursor:pointer" onclick="PCM.goToFilter('${c.filter}')">
        <div class="stat-top">
          <div class="stat-icon"><i class="fa-solid ${c.icon}"></i></div>
        </div>
        <div class="stat-value">${c.value}</div>
        <div class="stat-label">${c.label}</div>
        <div class="stat-sub">${c.sub}</div>
      </div>
    `).join('');
  }

  function renderAlerts() {
    const container = document.getElementById('alertsContainer');
    if (!container) return;

    const alerts = [];
    const all = DB.Manutencao.getAll();
    const today = Utils.today();

    // Overdue
    all.filter(m => Utils.isOverdue(m.dataPrevista, m.status) && m.prioridade === 'critica').slice(0,3).forEach(m => {
      const days = Math.abs(Utils.daysUntil(m.dataPrevista));
      alerts.push({ type: 'critica', icon: 'fa-circle-xmark', title: `${m.maquina}: ${m.tipo === 'preventiva' ? 'Preventiva' : 'Corretiva'} atrasada há ${days} dia(s)`, desc: m.descricao, id: m.id });
    });

    // Today
    all.filter(m => m.dataPrevista === today && !['concluida','cancelada'].includes(m.status)).slice(0,2).forEach(m => {
      alerts.push({ type: 'alta', icon: 'fa-calendar-day', title: `${m.maquina}: ${m.descricao ? Utils.truncate(m.descricao, 50) : 'Manutenção'} — HOJE`, desc: `Responsável: ${m.responsavel || 'Não definido'}`, id: m.id });
    });

    // Stock alerts
    const stockAlerts = DB.Pecas.getAlerts().slice(0, 2);
    stockAlerts.forEach(p => {
      alerts.push({ type: 'estoque', icon: 'fa-box-open', title: `Estoque baixo: ${p.descricao}`, desc: `Atual: ${p.estoqueAtual} ${p.unidade} | Mínimo: ${p.estoqueMinimo} ${p.unidade}`, action: 'Ver Estoque', actionFn: "PCM.navigate('estoque')" });
    });

    if (!alerts.length) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = alerts.slice(0, 5).map(a => `
      <div class="alert-item ${a.type}">
        <i class="fa-solid ${a.icon} alert-icon"></i>
        <div class="alert-content">
          <div class="alert-title">${Utils.escapeHTML(a.title)}</div>
          ${a.desc ? `<div class="alert-desc">${Utils.escapeHTML(a.desc)}</div>` : ''}
        </div>
        ${a.id ? `<span class="alert-action" onclick="PCM.showDetalhes('${a.id}')">Ver</span>` : ''}
        ${a.actionFn ? `<span class="alert-action" onclick="${a.actionFn}">${a.action || 'Ver'}</span>` : ''}
      </div>
    `).join('');
  }

  function renderCalendar() {
    const calEl = document.getElementById('calendar');
    const monthYearEl = document.getElementById('calMonthYear');
    if (!calEl) return;

    monthYearEl.textContent = Utils.getMonthName(_calMonth) + ' ' + _calYear;

    const events = DB.Manutencao.getForCalendar(_calYear, _calMonth);

    const firstDay = new Date(_calYear, _calMonth, 1).getDay();
    const daysInMonth = new Date(_calYear, _calMonth + 1, 0).getDate();
    const daysInPrev = new Date(_calYear, _calMonth, 0).getDate();
    const today = Utils.today();

    const dayNames = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
    let html = '<div class="calendar-grid">';

    // Headers
    dayNames.forEach(d => { html += `<div class="cal-day-header">${d}</div>`; });

    // Prev month days
    for (let i = 0; i < firstDay; i++) {
      const day = daysInPrev - firstDay + i + 1;
      html += `<div class="cal-day other-month"><div class="cal-day-num">${day}</div></div>`;
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = _calYear + '-' + String(_calMonth+1).padStart(2,'0') + '-' + String(d).padStart(2,'0');
      const dayEvents = events.filter(e => e.dataPrevista === dateStr);
      const isToday = dateStr === today;

      html += `<div class="cal-day ${isToday ? 'today' : ''}" onclick="PCM.calDayClick('${dateStr}')">
        <div class="cal-day-num">${d}</div>
        <div class="cal-events">
          ${dayEvents.slice(0,3).map(e => `<div class="cal-event ${e.prioridade}" title="${Utils.escapeHTML(e.maquina)}">${Utils.truncate(e.maquina, 8)}</div>`).join('')}
          ${dayEvents.length > 3 ? `<div class="cal-event" style="background:#666">+${dayEvents.length-3}</div>` : ''}
        </div>
      </div>`;
    }

    // Next month fill
    const total = firstDay + daysInMonth;
    const remaining = (7 - (total % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      html += `<div class="cal-day other-month"><div class="cal-day-num">${i}</div></div>`;
    }

    html += '</div>';
    calEl.innerHTML = html;
  }

  function renderRecentList() {
    const container = document.getElementById('recentList');
    if (!container) return;
    const recent = DB.Manutencao.getAll().sort((a,b) => (b.criadoEm||'').localeCompare(a.criadoEm||'')).slice(0,8);
    if (!recent.length) { container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted)">Nenhuma manutenção</div>'; return; }
    container.innerHTML = recent.map(m => `
      <div class="recent-item" onclick="PCM.showDetalhes('${m.id}')">
        <div class="recent-dot ${m.prioridade}"></div>
        <div class="recent-info">
          <div class="recent-maquina">${Utils.escapeHTML(m.maquina)}</div>
          <div class="recent-desc">${Utils.escapeHTML(Utils.truncate(m.descricao, 35))}</div>
        </div>
        <div class="recent-date">${Utils.statusBadge(m.status)}</div>
      </div>
    `).join('');
  }

  function renderTeamToday() {
    const container = document.getElementById('teamToday');
    if (!container) return;
    const today = Utils.today();
    const all = DB.Manutencao.getAll();
    const teamMap = {};
    all.filter(m => m.dataPrevista === today && !['concluida','cancelada'].includes(m.status)).forEach(m => {
      if (m.responsavel) teamMap[m.responsavel] = (teamMap[m.responsavel] || 0) + 1;
    });
    const team = Object.entries(teamMap).sort((a,b) => b[1]-a[1]);
    if (!team.length) { container.innerHTML = '<div style="padding:12px 14px;color:var(--text-muted);font-size:13px">Nenhuma tarefa programada para hoje</div>'; return; }
    container.innerHTML = team.map(([nome, cnt]) => `
      <div class="team-item">
        <div class="team-avatar">${Utils.initials(nome)}</div>
        <div>
          <div class="team-name">${Utils.escapeHTML(nome.split(' ')[0])}</div>
          <div class="team-tasks">${cnt} tarefa${cnt>1?'s':''} hoje</div>
        </div>
        <div class="team-count">${cnt}</div>
      </div>
    `).join('');
  }

  // ================================================================
  // MANUTENCOES LIST
  // ================================================================
  function renderManutencoes() {
    const items = DB.Manutencao.filter(_currentFilter, _listSearch, _currentSort, _sortDir);
    const container = document.getElementById('manutencoesList');
    const emptyState = document.getElementById('emptyState');
    if (!container) return;

    if (!items.length) {
      container.innerHTML = '';
      if (emptyState) emptyState.style.display = 'block';
      return;
    }
    if (emptyState) emptyState.style.display = 'none';

    container.innerHTML = items.map(m => renderManutCard(m)).join('');
  }

  function renderManutCard(m) {
    const overdue = Utils.isOverdue(m.dataPrevista, m.status);
    const isToday = Utils.isToday(m.dataPrevista);
    const days = m.dataPrevista ? Utils.daysUntil(m.dataPrevista) : null;

    let dateClass = '';
    let dateText = Utils.formatDate(m.dataPrevista);
    if (overdue) { dateClass = 'overdue'; const d = Math.abs(days); dateText += ` (atrasada ${d} dia${d>1?'s':''}!)`; }
    else if (isToday) { dateClass = 'today'; dateText += ' (hoje!)'; }
    else if (days !== null && days <= 3) { dateClass = 'today'; dateText += ` (em ${days} dia${days>1?'s':''})`; }

    const statusActions = () => {
      const btns = [];
      if (m.status === 'pendente') {
        btns.push(`<button class="btn btn-sm btn-success" onclick="PCM.abrirIniciar('${m.id}')"><i class="fa-solid fa-play"></i> Iniciar</button>`);
      }
      if (m.status === 'andamento') {
        btns.push(`<button class="btn btn-sm btn-warning" onclick="PCM.pausar('${m.id}')"><i class="fa-solid fa-pause"></i> Pausar</button>`);
        btns.push(`<button class="btn btn-sm btn-success" onclick="PCM.abrirConcluir('${m.id}')"><i class="fa-solid fa-check"></i> Concluir</button>`);
      }
      if (m.status === 'pausada') {
        btns.push(`<button class="btn btn-sm btn-success" onclick="PCM.abrirIniciar('${m.id}')"><i class="fa-solid fa-play"></i> Retomar</button>`);
      }
      if (!['concluida','cancelada'].includes(m.status)) {
        btns.push(`<button class="btn btn-sm btn-secondary" onclick="PCM.editManutencao('${m.id}')"><i class="fa-solid fa-pen"></i> Editar</button>`);
      }
      btns.push(`<button class="btn btn-sm btn-secondary" onclick="PCM.showDetalhes('${m.id}')"><i class="fa-solid fa-eye"></i></button>`);
      if (!['concluida'].includes(m.status)) {
        btns.push(`<button class="btn btn-sm" style="border-color:var(--danger);color:var(--danger)" onclick="PCM.confirmDelete('${m.id}')"><i class="fa-solid fa-trash"></i></button>`);
      }
      return btns.join('');
    };

    return `
      <div class="manut-card ${m.prioridade} ${overdue ? 'pulse' : ''}">
        <div class="manut-card-header">
          <span class="manut-card-id">#${m.numero||'—'}</span>
          <span class="manut-card-maquina">${Utils.escapeHTML(m.maquina)}</span>
          <div class="manut-card-status">${Utils.statusBadge(m.status)}</div>
        </div>
        <div class="manut-card-body">
          <div class="manut-card-desc">${Utils.escapeHTML(Utils.truncate(m.descricao, 120))}</div>
          <div class="manut-card-meta">
            ${m.responsavel ? `<span class="meta-item"><i class="fa-solid fa-user"></i> ${Utils.escapeHTML(m.responsavel.split(' ')[0])}</span>` : ''}
            ${m.dataPrevista ? `<span class="meta-item ${dateClass}"><i class="fa-solid fa-calendar"></i> ${dateText}</span>` : ''}
            ${m.tempoEstimado ? `<span class="meta-item"><i class="fa-solid fa-clock"></i> ${m.tempoEstimado}h estimado</span>` : ''}
            ${m.pecas ? `<span class="meta-item"><i class="fa-solid fa-screwdriver-wrench"></i> ${Utils.escapeHTML(Utils.truncate(m.pecas, 30))}</span>` : ''}
          </div>
        </div>
        <div class="manut-card-footer">
          <div class="manut-card-tipo ${m.tipo}">
            <i class="fa-solid ${m.tipo === 'preventiva' ? 'fa-shield-check' : 'fa-triangle-exclamation'}"></i>
            ${m.tipo === 'preventiva' ? 'Preventiva' : 'Corretiva'}
            ${m.recorrencia && m.recorrencia !== 'nenhuma' ? `<span class="badge" style="margin-left:4px;background:rgba(74,144,226,0.1);color:var(--secondary);font-size:10px">${m.recorrencia}</span>` : ''}
          </div>
          <div class="manut-card-actions">
            ${statusActions()}
          </div>
        </div>
      </div>
    `;
  }

  // ================================================================
  // FORM
  // ================================================================
  function renderForm(id) {
    _editId = id || null;
    const titleEl = document.getElementById('formSectionTitle');
    if (titleEl) titleEl.textContent = id ? 'Editar Manutenção' : 'Nova Manutenção';

    const submitBtn = document.getElementById('formSubmitBtn');
    if (submitBtn) submitBtn.innerHTML = id ? '<i class="fa-solid fa-floppy-disk"></i> Atualizar Manutenção' : '<i class="fa-solid fa-floppy-disk"></i> Salvar Manutenção';

    // Populate dropdowns
    const maquinaSelect = document.getElementById('fMaquina');
    const respSelect = document.getElementById('fResponsavel');
    if (maquinaSelect) MachineData.renderMaquinaOptions(maquinaSelect, '');
    if (respSelect) MachineData.renderResponsavelOptions(respSelect, '');

    if (id) {
      const m = DB.Manutencao.getById(id);
      if (!m) return;
      document.getElementById('editId').value = id;
      document.querySelector(`input[name="tipo"][value="${m.tipo}"]`).checked = true;
      document.querySelector(`input[name="prioridade"][value="${m.prioridade}"]`).checked = true;
      Utils.setVal('fMaquina', m.maquina);
      Utils.setVal('fDescricao', m.descricao);
      Utils.setVal('fPecas', m.pecas);
      Utils.setVal('fResponsavel', m.responsavel);
      Utils.setVal('fDataPrevista', m.dataPrevista);
      Utils.setVal('fTempoEstimado', m.tempoEstimado || '');
      Utils.setVal('fObservacoes', m.observacoes || '');
      const recorrEl = document.querySelector(`input[name="recorrencia"][value="${m.recorrencia||'nenhuma'}"]`);
      if (recorrEl) recorrEl.checked = true;
    } else {
      document.getElementById('manutencaoForm').reset();
      document.getElementById('editId').value = '';
      // Set today as default date
      Utils.setVal('fDataPrevista', Utils.today());
    }

    updateRecorrenciaVisibility();
  }

  function updateRecorrenciaVisibility() {
    const tipo = document.querySelector('input[name="tipo"]:checked')?.value;
    const rg = document.getElementById('recorrenciaGroup');
    if (rg) rg.style.display = tipo === 'preventiva' ? 'block' : 'none';
  }

  function handleFormSubmit(e) {
    e.preventDefault();
    clearFormErrors();

    const tipo = document.querySelector('input[name="tipo"]:checked')?.value;
    const prioridade = document.querySelector('input[name="prioridade"]:checked')?.value;
    const maquina = Utils.val('fMaquina');
    const descricao = Utils.val('fDescricao');
    const responsavel = Utils.val('fResponsavel');
    const dataPrevista = Utils.val('fDataPrevista');
    const tempoEstimado = Utils.val('fTempoEstimado');
    const pecas = Utils.val('fPecas');
    const recorrencia = document.querySelector('input[name="recorrencia"]:checked')?.value || 'nenhuma';
    const observacoes = Utils.val('fObservacoes');

    let valid = true;
    if (!maquina) { showFieldError('maquina', 'Selecione a máquina'); valid = false; }
    if (!descricao || descricao.length < 10) { showFieldError('descricao', 'Mínimo 10 caracteres'); valid = false; }
    if (!responsavel) { showFieldError('responsavel', 'Selecione o responsável'); valid = false; }
    if (!dataPrevista) { showFieldError('dataPrevista', 'Informe a data prevista'); valid = false; }
    if (!valid) return;

    const data = { tipo, prioridade, maquina, descricao, pecas, responsavel, dataPrevista, tempoEstimado: parseFloat(tempoEstimado) || null, recorrencia, observacoes };

    if (_editId) {
      DB.Manutencao.update(_editId, data);
      Utils.toast('Manutenção atualizada com sucesso!', 'success');
    } else {
      DB.Manutencao.add(data);
      Utils.toast('Manutenção criada com sucesso!', 'success');
    }

    updateBadges();
    navigate('manutencoes');
  }

  function showFieldError(field, msg) {
    const el = document.getElementById('err-' + field);
    const inp = document.getElementById('f' + field.charAt(0).toUpperCase() + field.slice(1));
    if (el) el.textContent = msg;
    if (inp) inp.classList.add('error');
  }

  function clearFormErrors() {
    document.querySelectorAll('.field-error').forEach(e => e.textContent = '');
    document.querySelectorAll('.error').forEach(e => e.classList.remove('error'));
  }

  function editManutencao(id) {
    _editId = id;
    navigate('nova-manutencao');
    setTimeout(() => renderForm(id), 50);
  }

  // ================================================================
  // MODAL: INICIAR
  // ================================================================
  function abrirIniciar(id) {
    const m = DB.Manutencao.getById(id);
    if (!m) return;
    _currentIniciarId = id;

    const info = document.getElementById('modalIniciarInfo');
    if (info) info.innerHTML = `
      <div class="info-machine">${Utils.escapeHTML(m.maquina)}</div>
      <div class="info-desc">${Utils.escapeHTML(Utils.truncate(m.descricao, 80))}</div>
      <div class="info-badges">${Utils.tipoBadge(m.tipo)} ${Utils.statusBadge(m.status)} <span class="badge badge-${m.prioridade}">${Utils.priorityLabel(m.prioridade)}</span></div>
    `;
    Utils.setVal('modalIniciarHora', Utils.nowTime());
    Utils.setVal('modalIniciarObs', '');
    openModal('modal-iniciar');
  }

  function confirmarIniciar() {
    const hora = Utils.val('modalIniciarHora') || Utils.nowTime();
    const obs = Utils.val('modalIniciarObs');
    if (!_currentIniciarId) return;
    DB.Manutencao.iniciar(_currentIniciarId, hora, obs);
    Utils.toast('Manutenção iniciada!', 'success');
    closeModal();
    updateBadges();
    if (_currentSection === 'manutencoes') renderManutencoes();
    if (_currentSection === 'dashboard') renderDashboard();
  }

  // ================================================================
  // MODAL: CONCLUIR
  // ================================================================
  function abrirConcluir(id) {
    const m = DB.Manutencao.getById(id);
    if (!m) return;
    _currentConcluirId = id;

    const info = document.getElementById('modalConcluirInfo');
    if (info) {
      const startTime = m.iniciadoEm ? Utils.formatDateTime(m.iniciadoEm) : 'Não registrado';
      info.innerHTML = `
        <div class="info-machine">${Utils.escapeHTML(m.maquina)}</div>
        <div class="info-desc">${Utils.escapeHTML(Utils.truncate(m.descricao, 80))}</div>
        <div class="info-badges">${Utils.tipoBadge(m.tipo)} <span style="font-size:12px;color:var(--text-muted)">Iniciada: ${startTime}</span></div>
      `;
    }

    Utils.setVal('modalConcluirHora', Utils.nowTime());
    Utils.setVal('modalOqueFoiFeto', '');
    Utils.setVal('modalPecasUsadas', m.pecas || '');
    Utils.setVal('modalConcluirObs', '');

    // Suggest next date
    if (m.recorrencia && m.recorrencia !== 'nenhuma') {
      const nextDate = Utils.nextRecorrencia(Utils.today(), m.recorrencia);
      Utils.setVal('modalProximaData', nextDate || '');
    } else {
      Utils.setVal('modalProximaData', '');
    }

    const nextGroup = document.getElementById('proximaManutencaoGroup');
    if (nextGroup) nextGroup.style.display = m.tipo === 'preventiva' ? 'block' : 'none';

    // Update duration on time change
    const horaInput = document.getElementById('modalConcluirHora');
    if (horaInput) {
      horaInput.onchange = () => {
        if (m.iniciadoEm) {
          const dur = Utils.calcDurationFromTimes(m.iniciadoEm, horaInput.value);
          if (dur) Utils.setVal('modalTempoTotal', dur.text);
        }
      };
      if (m.iniciadoEm) {
        const dur = Utils.calcDurationFromTimes(m.iniciadoEm, Utils.nowTime());
        if (dur) Utils.setVal('modalTempoTotal', dur.text);
      }
    }

    openModal('modal-concluir');
  }

  function confirmarConcluir() {
    const hora = Utils.val('modalConcluirHora') || Utils.nowTime();
    const oQueFoiFeto = Utils.val('modalOqueFoiFeto');
    const pecasUsadas = Utils.val('modalPecasUsadas');
    const proximaData = Utils.val('modalProximaData');
    const obs = Utils.val('modalConcluirObs');

    if (!oQueFoiFeto.trim()) {
      Utils.toast('Descreva o que foi feito!', 'warning');
      document.getElementById('modalOqueFoiFeto')?.focus();
      return;
    }

    if (!_currentConcluirId) return;
    DB.Manutencao.concluir(_currentConcluirId, hora, oQueFoiFeto, pecasUsadas, proximaData, obs);
    Utils.toast('Manutenção concluída com sucesso! ✅', 'success');
    closeModal();
    updateBadges();
    if (_currentSection === 'manutencoes') renderManutencoes();
    if (_currentSection === 'dashboard') renderDashboard();
  }

  function pausar(id) {
    DB.Manutencao.pausar(id);
    Utils.toast('Manutenção pausada', 'warning');
    updateBadges();
    if (_currentSection === 'manutencoes') renderManutencoes();
    if (_currentSection === 'dashboard') renderDashboard();
  }

  // ================================================================
  // MODAL: DETALHES
  // ================================================================
  function showDetalhes(id) {
    const m = DB.Manutencao.getById(id);
    if (!m) return;

    const body = document.getElementById('modalDetalhesBody');
    const footer = document.getElementById('modalDetalhesFoter');
    if (!body) return;

    const durReal = m.tempoReal ? Math.floor(m.tempoReal/60) + 'h ' + (m.tempoReal%60) + 'min' : '—';

    body.innerHTML = `
      <div class="detail-grid">
        <div class="detail-field">
          <label>Máquina</label>
          <div class="value"><strong>${Utils.escapeHTML(m.maquina)}</strong></div>
        </div>
        <div class="detail-field">
          <label>Número</label>
          <div class="value"><code>#${m.numero||'—'}</code></div>
        </div>
        <div class="detail-field">
          <label>Tipo</label>
          <div class="value">${Utils.tipoBadge(m.tipo)}</div>
        </div>
        <div class="detail-field">
          <label>Prioridade</label>
          <div class="value"><span class="badge badge-${m.prioridade}">${Utils.priorityLabel(m.prioridade)}</span></div>
        </div>
        <div class="detail-field">
          <label>Status</label>
          <div class="value">${Utils.statusBadge(m.status)}</div>
        </div>
        <div class="detail-field">
          <label>Responsável</label>
          <div class="value">${Utils.escapeHTML(m.responsavel || '—')}</div>
        </div>
        <div class="detail-field full">
          <label>Descrição</label>
          <div class="value">${Utils.escapeHTML(m.descricao || '—')}</div>
        </div>
        ${m.pecas ? `<div class="detail-field full"><label>Peças Necessárias</label><div class="value">${Utils.escapeHTML(m.pecas)}</div></div>` : ''}
        <div class="detail-field">
          <label>Data Prevista</label>
          <div class="value">${Utils.formatDate(m.dataPrevista)}</div>
        </div>
        <div class="detail-field">
          <label>Tempo Estimado</label>
          <div class="value">${m.tempoEstimado ? m.tempoEstimado + 'h' : '—'}</div>
        </div>
        ${m.iniciadoEm ? `<div class="detail-field"><label>Início Real</label><div class="value">${Utils.formatDateTime(m.iniciadoEm)}</div></div>` : ''}
        ${m.concluidoEm ? `<div class="detail-field"><label>Conclusão Real</label><div class="value">${Utils.formatDateTime(m.concluidoEm)}</div></div>` : ''}
        ${m.tempoReal ? `<div class="detail-field"><label>Tempo Real</label><div class="value">${durReal}</div></div>` : ''}
        ${m.oQueFoiFeto ? `<div class="detail-field full"><label>O que foi feito</label><div class="value">${Utils.escapeHTML(m.oQueFoiFeto)}</div></div>` : ''}
        ${m.pecasUtilizadas ? `<div class="detail-field full"><label>Peças Utilizadas</label><div class="value">${Utils.escapeHTML(m.pecasUtilizadas)}</div></div>` : ''}
        ${m.proximaManutencao ? `<div class="detail-field"><label>Próxima Manutenção</label><div class="value">${Utils.formatDate(m.proximaManutencao)}</div></div>` : ''}
        ${m.observacoes ? `<div class="detail-field full"><label>Observações</label><div class="value">${Utils.escapeHTML(m.observacoes)}</div></div>` : ''}
      </div>
      <div class="detail-log">
        <div class="log-entry"><i class="fa-solid fa-plus"></i>Criado em ${Utils.formatDateTime(m.criadoEm)}</div>
        ${m.iniciadoEm ? `<div class="log-entry"><i class="fa-solid fa-play"></i>Iniciado em ${Utils.formatDateTime(m.iniciadoEm)}</div>` : ''}
        ${m.concluidoEm ? `<div class="log-entry"><i class="fa-solid fa-check"></i>Concluído em ${Utils.formatDateTime(m.concluidoEm)}</div>` : ''}
        ${m.canceladoEm ? `<div class="log-entry"><i class="fa-solid fa-xmark"></i>Cancelado em ${Utils.formatDateTime(m.canceladoEm)}</div>` : ''}
      </div>
    `;

    // Footer actions
    let footerHTML = '<button class="btn btn-secondary" onclick="PCM.closeModal()">Fechar</button>';
    footerHTML += `<button class="btn btn-secondary" onclick="window.print()"><i class="fa-solid fa-print"></i> Imprimir</button>`;
    if (m.status === 'pendente') footerHTML += `<button class="btn btn-success" onclick="PCM.closeModal();PCM.abrirIniciar('${id}')"><i class="fa-solid fa-play"></i> Iniciar</button>`;
    if (m.status === 'andamento') footerHTML += `<button class="btn btn-success" onclick="PCM.closeModal();PCM.abrirConcluir('${id}')"><i class="fa-solid fa-check"></i> Concluir</button>`;
    if (!['concluida','cancelada'].includes(m.status)) footerHTML += `<button class="btn btn-primary" onclick="PCM.closeModal();PCM.editManutencao('${id}')"><i class="fa-solid fa-pen"></i> Editar</button>`;
    footer.innerHTML = footerHTML;

    openModal('modal-detalhes');
  }

  // ================================================================
  // DELETE
  // ================================================================
  function confirmDelete(id) {
    const m = DB.Manutencao.getById(id);
    if (!m) return;
    const msgEl = document.getElementById('modalConfirmarMsg');
    if (msgEl) msgEl.textContent = `Excluir manutenção #${m.numero||''} - ${m.maquina}? Esta ação não pode ser desfeita.`;
    const btn = document.getElementById('confirmarDeleteBtn');
    if (btn) btn.onclick = () => {
      DB.Manutencao.remove(id);
      Utils.toast('Manutenção excluída', 'info');
      closeModal();
      updateBadges();
      renderManutencoes();
    };
    openModal('modal-confirmar');
  }

  // ================================================================
  // PREVENTIVAS
  // ================================================================
  function renderPreventivas() {
    renderTemplatesGrid();
    renderPreventivasAgendadas();
    populatePreventivaMaquinaFilter();
  }

  function populatePreventivaMaquinaFilter() {
    const sel = document.getElementById('preventivaMaquinaFilter');
    if (!sel) return;
    const maquinas = DB.Maquinas.getNomes();
    sel.innerHTML = '<option value="">Todas as máquinas</option>';
    maquinas.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m; opt.textContent = m;
      sel.appendChild(opt);
    });
  }

  function renderTemplatesGrid() {
    const container = document.getElementById('templatesGrid');
    if (!container) return;
    const templates = Templates.getAll();

    if (!templates.length) {
      container.innerHTML = '<div style="padding:24px;text-align:center;color:var(--text-muted);font-size:13px"><i class="fa-solid fa-clipboard-list" style="font-size:28px;display:block;margin-bottom:8px"></i>Nenhum plano cadastrado.<br>Clique em <strong>+ Novo Plano</strong> para começar.</div>';
      return;
    }

    container.innerHTML = templates.map(t => {
      const totalItens = t.secoes.reduce((a,s)=>a+s.itens.length, 0);
      const savedState = Templates.getChecklistSavedState(t.id);
      const hasSaved = savedState && Object.keys(savedState.state||{}).length > 0;
      const checkedCount = hasSaved ? Templates.countChecked(savedState.state) : 0;
      const pct = hasSaved && totalItens > 0 ? Math.round(checkedCount / totalItens * 100) : 0;

      return `
        <div class="template-item">
          <div class="template-icon-wrap" onclick="PCM.openTemplate('${t.id}')">
            <i class="fa-solid ${t.icon||'fa-list-check'}"></i>
          </div>
          <div class="template-info" onclick="PCM.openTemplate('${t.id}')">
            <div class="template-name">${Utils.escapeHTML(t.nome)}</div>
            <div class="template-freq">
              <i class="fa-solid fa-rotate"></i> ${t.frequencia} &nbsp;|&nbsp;
              <i class="fa-regular fa-clock"></i> ~${t.tempoEstimado}h &nbsp;|&nbsp;
              <i class="fa-solid fa-list-check"></i> ${totalItens} itens em ${t.secoes.length} sistema(s)
            </div>
            ${hasSaved ? `
              <div class="template-progress-bar" style="margin-top:6px">
                <div style="height:4px;background:var(--border);border-radius:2px;overflow:hidden;width:120px;display:inline-block">
                  <div style="width:${pct}%;height:100%;background:${pct===100?'var(--success)':'var(--warning)'};border-radius:2px"></div>
                </div>
                <span style="font-size:11px;color:var(--text-muted);margin-left:6px">${checkedCount}/${totalItens} (${pct}%) salvo</span>
              </div>` : ''}
          </div>
          <div class="template-actions">
            <button class="btn btn-sm btn-primary" title="Executar checklist" onclick="PCM.openTemplate('${t.id}')">
              <i class="fa-solid fa-play"></i> Executar
            </button>
            <button class="btn btn-sm btn-ghost" title="Editar plano" onclick="PCM.openModalPlano('${t.id}')">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-sm btn-danger-ghost" title="Excluir plano" onclick="PCM.deletePlano('${t.id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }

  function renderPreventivasAgendadas() {
    const container = document.getElementById('preventivasAgendadas');
    if (!container) return;
    const maquinaFilter = document.getElementById('preventivaMaquinaFilter')?.value || '';
    const today = Utils.today();
    const next30 = Utils.addDays(today, 30);

    let items = DB.Manutencao.getAll().filter(m =>
      m.tipo === 'preventiva' &&
      !['concluida','cancelada'].includes(m.status) &&
      m.dataPrevista <= next30
    );

    if (maquinaFilter) items = items.filter(m => m.maquina === maquinaFilter);
    items.sort((a,b) => (a.dataPrevista||'').localeCompare(b.dataPrevista||''));

    if (!items.length) {
      container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px">Nenhuma preventiva programada nos próximos 30 dias</div>';
      return;
    }

    container.innerHTML = items.map(m => {
      const overdue = Utils.isOverdue(m.dataPrevista, m.status);
      const isToday = Utils.isToday(m.dataPrevista);
      const d = new Date(m.dataPrevista + 'T00:00:00');
      const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

      return `
        <div class="prev-item ${overdue?'atrasada':''} ${isToday?'hoje':''}">
          <div class="prev-date">
            <div class="day">${d.getDate()}</div>
            <div class="month">${months[d.getMonth()]}</div>
          </div>
          <div class="prev-info">
            <div class="prev-maquina">${Utils.escapeHTML(m.maquina)}</div>
            <div class="prev-desc">${Utils.escapeHTML(Utils.truncate(m.descricao, 50))}</div>
          </div>
          <div class="prev-status">
            ${overdue ? '<span class="badge badge-critica">Atrasada</span>' : isToday ? '<span class="badge badge-alta">Hoje</span>' : Utils.statusBadge(m.status)}
            <button class="btn btn-sm btn-primary" style="margin-top:4px" onclick="PCM.abrirIniciar('${m.id}')"><i class="fa-solid fa-play"></i></button>
          </div>
        </div>
      `;
    }).join('');
  }

  function openTemplate(templateId) {
    const template = Templates.getAll().find(t => t.id === templateId);
    if (!template) return;

    const { savedState } = Templates.startChecklist(templateId, null);
    const state = Templates.getChecklistState();

    const titleEl = document.getElementById('modalTemplateTitle');
    const bodyEl = document.getElementById('modalTemplateBody');

    if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-list-check"></i> ${Utils.escapeHTML(template.nome)}`;

    if (bodyEl) {
      const maquinasStr = (template.maquinas || []).join(', ') || '—';
      const savedBanner = savedState
        ? `<div style="background:rgba(217,119,6,0.08);border:1px solid rgba(217,119,6,0.2);border-radius:var(--radius-sm);padding:8px 12px;margin-bottom:12px;font-size:12px;color:var(--warning);display:flex;align-items:center;gap:8px">
             <i class="fa-solid fa-rotate-left"></i>
             <span>Execução retomada — salva em ${Utils.formatDateTime(savedState.savedAt)}</span>
             <button class="btn btn-sm" style="margin-left:auto;font-size:11px;padding:2px 8px" onclick="Templates.clearChecklistState('${templateId}');PCM.openTemplate('${templateId}')">
               <i class="fa-solid fa-arrow-rotate-right"></i> Reiniciar
             </button>
           </div>`
        : '';

      bodyEl.innerHTML = `
        <div style="background:var(--bg);border-radius:var(--radius-sm);padding:10px 14px;margin-bottom:14px;font-size:13px;color:var(--text-secondary)">
          <i class="fa-solid fa-rotate" style="margin-right:4px"></i> ${template.frequencia} &nbsp;·&nbsp;
          <i class="fa-regular fa-clock" style="margin-right:4px"></i> ~${template.tempoEstimado}h &nbsp;·&nbsp;
          <i class="fa-solid fa-industry" style="margin-right:4px"></i> ${Utils.escapeHTML(maquinasStr)}
        </div>
        ${savedBanner}
        <div id="checklistContainer">${Templates.renderChecklist(template, state)}</div>
        <div class="form-group" style="margin-top:16px">
          <label class="form-label">Observações / Anomalias encontradas</label>
          <textarea id="checklistObs" rows="3" placeholder="Registre anomalias, peças substituídas, próximas ações...">${savedState?.obs || ''}</textarea>
        </div>
        <div id="checklistProgress"></div>
      `;
      // Draw progress bar with current state
      Templates.updateProgress();
    }
    _currentChecklistManuId = null;
    openModal('modal-template');
  }

  function savePartialChecklist() {
    const obs = document.getElementById('checklistObs')?.value || '';
    const state = Templates.getChecklistState();
    const templateId = Templates.getCurrentTemplateId();
    if (templateId) {
      Templates.saveChecklistState(templateId, state, obs);
      Utils.toast('Progresso salvo! Você pode continuar depois.', 'success');
    }
    // Refresh the grid to show progress bar
    renderTemplatesGrid();
    closeModal();
  }

  function concluirChecklist() {
    const obs = document.getElementById('checklistObs')?.value || '';
    const state = Templates.getChecklistState();
    const templateId = Templates.getCurrentTemplateId();
    const template = Templates.getAll().find(t => t.id === templateId);
    const total = template ? Templates.countTotal(template) : 0;
    const checked = Templates.countChecked(state);

    if (checked < total * 0.5) {
      Utils.toast(`Apenas ${checked}/${total} itens verificados. Complete pelo menos 50% antes de concluir.`, 'warning');
      return;
    }

    // Save final state
    if (templateId) Templates.saveChecklistState(templateId, state, obs);

    // Registrar execução como manutenção concluída
    if (template) {
      DB.Manutencao.add({
        tipo: 'preventiva',
        prioridade: 'media',
        maquina: (template.maquinas && template.maquinas[0]) || 'Geral',
        descricao: `Preventiva: ${template.nome}`,
        responsavel: 'Sistema',
        dataPrevista: Utils.nowISO().slice(0, 10),
        tempoEstimado: template.tempoEstimado || null,
        recorrencia: 'nenhuma',
        observacoes: obs,
        status: 'concluida',
        concluidoEm: Utils.nowISO(),
        oQueFoiFeto: `${checked}/${total} itens verificados`,
      });
    }

    Utils.toast(`✅ Preventiva concluída! ${checked}/${total} itens verificados.`, 'success');
    renderTemplatesGrid();
    closeModal();
  }

  // ================================================================
  // CRUD DE PLANOS DE PREVENTIVA
  // ================================================================

  function openModalPlano(id) {
    _editPlanoId = id || null;
    _sistemaCount = 0;

    const titleEl = document.getElementById('modalPlanoTitle');
    if (titleEl) titleEl.innerHTML = `<i class="fa-solid fa-clipboard-list"></i> ${id ? 'Editar Plano de Preventiva' : 'Novo Plano de Preventiva'}`;

    const plano = id ? Templates.getById(id) : null;

    // Populate basic fields
    const setVal = (elId, val) => { const el = document.getElementById(elId); if (el) el.value = val || ''; };
    setVal('planoNome', plano?.nome);
    setVal('planoFrequencia', plano?.frequencia || 'Mensal');
    setVal('planoTempo', plano?.tempoEstimado || '');
    setVal('planoMaquinas', (plano?.maquinas || []).join(', '));

    // Populate icon selector
    const iconSel = document.getElementById('planoIcone');
    if (iconSel) iconSel.value = plano?.icon || 'fa-list-check';

    // Build sistemas
    const builder = document.getElementById('sistemasBuilder');
    if (builder) {
      builder.innerHTML = '';
      _sistemaCount = 0;
      if (plano && plano.secoes && plano.secoes.length) {
        plano.secoes.forEach(s => _adicionarSistema(s.titulo, s.itens));
      } else {
        _adicionarSistema('', []);
      }
    }

    openModal('modal-plano-preventivo');
  }

  function _adicionarSistema(titulo, itens) {
    const idx = _sistemaCount++;
    const builder = document.getElementById('sistemasBuilder');
    if (!builder) return;

    // Verificar se titulo é pré-definido ou personalizado
    const nomesPredef = Object.keys(SISTEMAS_PREDEFINIDOS);
    const isPredef = titulo && nomesPredef.includes(titulo);
    const isOutro  = titulo && !isPredef;
    const selValue = isOutro ? '__outro__' : (titulo || '');

    const div = document.createElement('div');
    div.className = 'sistema-block';
    div.id = `sistema-blk-${idx}`;
    div.innerHTML = `
      <div class="sistema-header">
        <span class="sistema-num">Sistema ${idx + 1}</span>
        <div style="flex:1;display:flex;gap:6px;flex-direction:column">
          <select class="sistema-titulo-sel" onchange="PCM._onSistemaSelectChange(this, ${idx})">
            ${_getSistemasOptions(selValue)}
          </select>
          <input type="text" class="sistema-titulo" placeholder="Ex: Inspeção Visual, Teste de Carga..."
            value="${Utils.escapeHTML(isOutro ? titulo : '')}"
            style="display:${isOutro ? 'block' : 'none'}">
        </div>
        <button class="btn btn-sm btn-danger-ghost" onclick="PCM._removerSistema('sistema-blk-${idx}')" title="Remover sistema">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
      <div class="tarefas-list" id="tarefas-list-${idx}"></div>
      <button class="btn btn-ghost btn-sm add-tarefa-btn" onclick="PCM._adicionarTarefa(${idx})">
        <i class="fa-solid fa-plus"></i> Adicionar Tarefa
      </button>
    `;
    builder.appendChild(div);

    // Add existing tasks or one empty
    const taskList = itens && itens.length ? itens : [''];
    taskList.forEach(t => _adicionarTarefa(idx, t, titulo));
  }

  function _onSistemaSelectChange(sel, idx) {
    const block = document.getElementById(`sistema-blk-${idx}`);
    if (!block) return;
    const input = block.querySelector('.sistema-titulo');
    if (sel.value === '__outro__') {
      if (input) { input.style.display = 'block'; input.focus(); }
    } else {
      if (input) { input.style.display = 'none'; input.value = ''; }
      // Repopular os selects de tarefa já existentes para o novo sistema
      block.querySelectorAll('.tarefa-sel').forEach(tSel => {
        tSel.innerHTML = _getTarefasOptions(sel.value, '');
        const tInput = tSel.closest('.tarefa-item')?.querySelector('.tarefa-texto');
        if (tInput) { tInput.style.display = 'none'; tInput.value = ''; }
      });
    }
  }

  function _onTarefaSelectChange(sel) {
    const item = sel.closest('.tarefa-item');
    if (!item) return;
    const input = item.querySelector('.tarefa-texto');
    if (sel.value === '__outro__') {
      if (input) { input.style.display = 'block'; input.focus(); }
    } else {
      if (input) { input.style.display = 'none'; input.value = ''; }
    }
  }

  function _adicionarTarefa(sistemaIdx, texto, nomeSistemaHint) {
    const container = document.getElementById(`tarefas-list-${sistemaIdx}`);
    if (!container) return;

    // Descobrir o sistema selecionado para popular as opções
    const block = document.getElementById(`sistema-blk-${sistemaIdx}`);
    const sistSel = block?.querySelector('.sistema-titulo-sel');
    const nomeSistema = (sistSel && sistSel.value !== '__outro__' ? sistSel.value : null)
      || nomeSistemaHint || '';

    // Verificar se texto é pré-definido ou personalizado
    const tarefasPredef = SISTEMAS_PREDEFINIDOS[nomeSistema] || [];
    const isPredef = texto && tarefasPredef.includes(texto);
    const isOutro  = texto && !isPredef;
    const selValue = isOutro ? '__outro__' : (texto || '');

    const div = document.createElement('div');
    div.className = 'tarefa-item';
    div.innerHTML = `
      <i class="fa-solid fa-grip-vertical tarefa-drag" title="Arrastar"></i>
      <div style="flex:1;display:flex;gap:4px;flex-direction:column">
        <select class="tarefa-sel" onchange="PCM._onTarefaSelectChange(this)">
          ${_getTarefasOptions(nomeSistema, selValue)}
        </select>
        <input type="text" class="tarefa-texto" placeholder="Descreva a tarefa..."
          value="${Utils.escapeHTML(isOutro ? texto : '')}"
          style="display:${isOutro ? 'block' : 'none'}">
      </div>
      <button class="btn btn-icon btn-sm tarefa-remove-btn" onclick="this.closest('.tarefa-item').remove()" title="Remover tarefa">
        <i class="fa-solid fa-xmark"></i>
      </button>
    `;
    container.appendChild(div);
    // Focar no select quando adicionada via botão
    if (!texto) {
      const sel = div.querySelector('select');
      setTimeout(() => sel && sel.focus(), 50);
    }
  }

  function _removerSistema(blockId) {
    const el = document.getElementById(blockId);
    if (el) el.remove();
  }

  function adicionarSistemaNovo() {
    _adicionarSistema('', []);
    // Scroll builder to bottom
    const builder = document.getElementById('sistemasBuilder');
    if (builder) builder.scrollTop = builder.scrollHeight;
  }

  function savePlano() {
    const nome = (document.getElementById('planoNome')?.value || '').trim();
    if (!nome) { Utils.toast('Informe o nome do plano', 'warning'); return; }

    const frequencia = document.getElementById('planoFrequencia')?.value || 'Mensal';
    const tempoEstimado = parseFloat(document.getElementById('planoTempo')?.value) || 1;
    const icon = document.getElementById('planoIcone')?.value || 'fa-list-check';
    const maquinasStr = document.getElementById('planoMaquinas')?.value || '';
    const maquinas = maquinasStr.split(',').map(m => m.trim()).filter(Boolean);

    // Read sistemas (suporta select pré-definido + input livre)
    const secoes = [];
    document.querySelectorAll('.sistema-block').forEach(sist => {
      // Titulo do sistema
      const sSel   = sist.querySelector('.sistema-titulo-sel');
      const sInput = sist.querySelector('.sistema-titulo');
      let titulo = '';
      if (sSel && sSel.value === '__outro__') titulo = (sInput?.value || '').trim();
      else if (sSel && sSel.value)            titulo = sSel.value;
      else                                    titulo = (sInput?.value || '').trim();

      // Tarefas
      const itens = Array.from(sist.querySelectorAll('.tarefa-item')).map(item => {
        const tSel   = item.querySelector('.tarefa-sel');
        const tInput = item.querySelector('.tarefa-texto');
        if (tSel && tSel.value === '__outro__') return (tInput?.value || '').trim();
        if (tSel && tSel.value)                return tSel.value;
        return (tInput?.value || '').trim();
      }).filter(Boolean);

      if (titulo && itens.length) secoes.push({ titulo, itens });
    });

    if (!secoes.length) {
      Utils.toast('Preencha o nome do sistema e adicione pelo menos uma tarefa antes de salvar.', 'warning');
      return;
    }

    const data = { nome, frequencia, tempoEstimado, maquinas, secoes, icon };

    if (_editPlanoId) {
      Templates.update(_editPlanoId, data);
      Utils.toast('Plano atualizado com sucesso!', 'success');
    } else {
      Templates.add(data);
      Utils.toast('Plano criado com sucesso!', 'success');
    }

    closeModal();
    renderTemplatesGrid();
  }

  function deletePlano(id) {
    const plano = Templates.getById(id);
    if (!plano) return;
    _pendingDeleteFn = () => {
      Templates.remove(id);
      Templates.clearChecklistState(id);
      Utils.toast('Plano excluído', 'info');
      renderTemplatesGrid();
    };
    const msgEl = document.getElementById('modalConfirmarMsg');
    if (msgEl) msgEl.textContent = `Deseja excluir o plano "${plano.nome}"? O histórico de execução também será removido.`;
    const btn = document.getElementById('confirmarDeleteBtn');
    if (btn) btn.onclick = () => { _pendingDeleteFn && _pendingDeleteFn(); closeModal(); };
    openModal('modal-confirmar');
  }

  // ================================================================
  // ESTOQUE
  // ================================================================
  function renderEstoque() {
    renderEstoqueStats();
    renderEstoqueTable();
  }

  function renderEstoqueStats() {
    const container = document.getElementById('estoqueStats');
    if (!container) return;
    const pecas = DB.Pecas.getAll();
    const criticos = pecas.filter(p => (p.estoqueAtual||0) < (p.estoqueMinimo||0));
    const atencao = pecas.filter(p => {
      const a = p.estoqueAtual||0; const m = p.estoqueMinimo||0;
      return a >= m && a < m * 1.2;
    });
    const ok = pecas.filter(p => (p.estoqueAtual||0) >= (p.estoqueMinimo||0) * 1.2);

    container.innerHTML = `
      <div class="stat-card" style="--stat-color:var(--danger); --stat-bg:rgba(231,76,60,0.1)">
        <div class="stat-top"><div class="stat-icon"><i class="fa-solid fa-circle-xmark"></i></div></div>
        <div class="stat-value">${criticos.length}</div>
        <div class="stat-label">Estoque Crítico</div>
        <div class="stat-sub">Abaixo do mínimo</div>
      </div>
      <div class="stat-card" style="--stat-color:var(--warning); --stat-bg:rgba(243,156,18,0.1)">
        <div class="stat-top"><div class="stat-icon"><i class="fa-solid fa-triangle-exclamation"></i></div></div>
        <div class="stat-value">${atencao.length}</div>
        <div class="stat-label">Atenção</div>
        <div class="stat-sub">Próximo do mínimo</div>
      </div>
      <div class="stat-card" style="--stat-color:var(--success); --stat-bg:rgba(39,174,96,0.1)">
        <div class="stat-top"><div class="stat-icon"><i class="fa-solid fa-check-circle"></i></div></div>
        <div class="stat-value">${ok.length}</div>
        <div class="stat-label">Estoque OK</div>
        <div class="stat-sub">Adequado</div>
      </div>
      <div class="stat-card" style="--stat-color:var(--secondary); --stat-bg:rgba(74,144,226,0.1)">
        <div class="stat-top"><div class="stat-icon"><i class="fa-solid fa-boxes-stacked"></i></div></div>
        <div class="stat-value">${pecas.length}</div>
        <div class="stat-label">Total de Itens</div>
        <div class="stat-sub">Cadastrados</div>
      </div>
    `;
  }

  function renderEstoqueTable() {
    const body = document.getElementById('estoqueBody');
    if (!body) return;
    const search = Utils.val('estoqueSearch');
    const catFilter = document.getElementById('estoqueCatFilter')?.value || '';

    let pecas = DB.Pecas.getAll();
    if (search) pecas = pecas.filter(p => Utils.matchSearch(p.descricao, search) || Utils.matchSearch(p.codigo||'', search));
    if (catFilter) pecas = pecas.filter(p => p.criticidade === catFilter);

    pecas.sort((a,b) => {
      const aStatus = Utils.stockStatus(a.estoqueAtual||0, a.estoqueMinimo||0);
      const bStatus = Utils.stockStatus(b.estoqueAtual||0, b.estoqueMinimo||0);
      const order = { critico: 0, atencao: 1, ok: 2 };
      return (order[aStatus.cls]||2) - (order[bStatus.cls]||2);
    });

    if (!pecas.length) { body.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:30px;color:var(--text-muted)">Nenhuma peça encontrada</td></tr>'; return; }

    body.innerHTML = pecas.map(p => {
      const status = Utils.stockStatus(p.estoqueAtual||0, p.estoqueMinimo||0);
      const pct = Math.min(100, Math.round(((p.estoqueAtual||0) / Math.max(1, (p.estoqueMinimo||1) * 1.5)) * 100));
      const critLabel = { critica: '🔴 Crítica', importante: '🟡 Importante', consumo: '🟢 Consumo' }[p.criticidade] || p.criticidade;

      return `
        <tr>
          <td>
            <div style="font-weight:600">${Utils.escapeHTML(p.descricao)}</div>
            <div style="font-size:11px;color:var(--text-muted)">${p.codigo||''} ${p.categoria||''}</div>
          </td>
          <td><span class="badge" style="font-size:11px">${critLabel}</span></td>
          <td style="font-family:var(--font-mono)">${p.estoqueMinimo||0} ${p.unidade||'un'}</td>
          <td>
            <div class="stock-bar">
              <span style="font-family:var(--font-mono);font-weight:600;min-width:35px">${p.estoqueAtual||0}</span>
              <div class="stock-bar-track">
                <div class="stock-bar-fill ${status.cls}" style="width:${pct}%"></div>
              </div>
            </div>
          </td>
          <td><span class="badge badge-${status.cls==='critico'?'critica':status.cls==='atencao'?'alta':'media'}">${status.label}</span></td>
          <td>
            <div class="td-actions">
              <button class="btn btn-sm btn-secondary" onclick="PCM.editEstoque('${p.id}')" title="Editar"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-sm btn-success" onclick="PCM.openMovimentacao('${p.id}','entrada')" title="Entrada"><i class="fa-solid fa-arrow-down"></i></button>
              <button class="btn btn-sm btn-warning" onclick="PCM.openMovimentacao('${p.id}','saida')" title="Saída"><i class="fa-solid fa-arrow-up"></i></button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  function ajustarEstoque(id, qty) {
    // Kept for backward compat; abrir modal de movimentação
    openMovimentacao(id, qty > 0 ? 'entrada' : 'saida');
  }

  function openMovimentacao(id, tipoInicial) {
    // Populate select
    const sel = document.getElementById('movPecaSelect');
    if (sel) {
      const pecas = DB.Pecas.getAll();
      sel.innerHTML = '<option value="">Selecionar peça...</option>' +
        pecas.map(p => `<option value="${p.id}" ${p.id === id ? 'selected' : ''}>${Utils.escapeHTML(p.descricao)} (${p.estoqueAtual||0} ${p.unidade||'un'})</option>`).join('');
    }
    // Set tipo
    const tipo = tipoInicial || 'entrada';
    document.querySelectorAll('input[name="movTipo"]').forEach(r => { r.checked = r.value === tipo; });
    onMovTipoChange();
    onMovPecaChange();
    openModal('modal-movimentacao');
  }

  function onMovPecaChange() {
    const id = Utils.val('movPecaSelect');
    const box = document.getElementById('movEstoqueAtualInfo');
    const val = document.getElementById('movEstoqueAtualVal');
    if (id && box && val) {
      const p = DB.Pecas.getById(id);
      if (p) {
        val.textContent = `${p.estoqueAtual||0} ${p.unidade||'un'}`;
        box.style.display = 'block';
      }
    } else if (box) {
      box.style.display = 'none';
    }
  }

  function onMovTipoChange() {
    const tipo = document.querySelector('input[name="movTipo"]:checked')?.value || 'entrada';
    const label = document.getElementById('movQtdLabel');
    const btn = document.getElementById('movSaveBtn');
    if (label) {
      label.textContent = tipo === 'entrada' ? 'Quantidade a Adicionar' : tipo === 'saida' ? 'Quantidade a Retirar' : 'Novo Estoque Total';
    }
    if (btn) btn.className = `btn ${tipo === 'entrada' ? 'btn-success' : tipo === 'saida' ? 'btn-warning' : 'btn-primary'}`;
    const titleEl = document.getElementById('modalMovTitle');
    if (titleEl) {
      const icons = { entrada: 'fa-arrow-down', saida: 'fa-arrow-up', ajuste: 'fa-sliders' };
      const labels = { entrada: 'Entrada de Estoque', saida: 'Saída de Estoque', ajuste: 'Ajuste de Estoque' };
      titleEl.innerHTML = `<i class="fa-solid ${icons[tipo]||'fa-arrow-right-arrow-left'}"></i> ${labels[tipo]||'Movimentação'}`;
    }
  }

  function saveMovimentacao() {
    const pecaId = Utils.val('movPecaSelect');
    const tipo = document.querySelector('input[name="movTipo"]:checked')?.value || 'entrada';
    const qtd = parseFloat(Utils.val('movQuantidade')) || 0;
    const motivo = Utils.val('movMotivo').trim();
    const responsavel = Utils.val('movResponsavel').trim() || 'Sistema';

    if (!pecaId) { Utils.toast('Selecione a peça', 'warning'); return; }
    if (!qtd || qtd <= 0) { Utils.toast('Informe uma quantidade válida', 'warning'); return; }

    const p = DB.Pecas.getById(pecaId);
    if (!p) { Utils.toast('Peça não encontrada', 'error'); return; }

    const estoqueAnterior = p.estoqueAtual || 0;
    let estoqueNovo;

    if (tipo === 'entrada') {
      estoqueNovo = estoqueAnterior + qtd;
    } else if (tipo === 'saida') {
      if (qtd > estoqueAnterior) { Utils.toast(`Estoque insuficiente (atual: ${estoqueAnterior})`, 'error'); return; }
      estoqueNovo = estoqueAnterior - qtd;
    } else {
      // Ajuste = novo valor absoluto
      estoqueNovo = qtd;
    }

    DB.Pecas.updateEstoque(pecaId, estoqueNovo - estoqueAnterior);
    DB.Movimentacoes.add({ tipo, pecaId, pecaDescricao: p.descricao, pecaCodigo: p.codigo||'', quantidade: qtd, estoqueAnterior, estoqueNovo, motivo, responsavel });

    closeModal();
    renderEstoqueTable();
    renderEstoqueStats();
    updateBadges();

    const msg = tipo === 'entrada' ? `Entrada de ${qtd} ${p.unidade||'un'} registrada` : tipo === 'saida' ? `Saída de ${qtd} ${p.unidade||'un'} registrada` : `Estoque ajustado para ${estoqueNovo}`;
    Utils.toast(msg, tipo === 'saida' ? 'warning' : 'success');
  }

  function editEstoque(id) {
    const p = DB.Pecas.getById(id);
    if (!p) return;
    document.getElementById('pecaEditId').value = id;
    Utils.setVal('pecaDescricao', p.descricao);
    Utils.setVal('pecaCodigo', p.codigo||'');
    Utils.setVal('pecaCategoria', p.categoria||'Mecânica');
    Utils.setVal('pecaCriticidade', p.criticidade||'consumo');
    Utils.setVal('pecaEstMin', p.estoqueMinimo||0);
    Utils.setVal('pecaEstAtual', p.estoqueAtual||0);
    Utils.setVal('pecaUnidade', p.unidade||'un');
    Utils.setVal('pecaFornecedor', p.fornecedor||'');
    Utils.setVal('pecaCusto', p.custo||'');
    Utils.setVal('pecaTipo', p.tipo||'peca');
    _populatePecaMaquinaSelect(p.maquinaAssociada||'');
    onPecaTipoChange();
    const titleEl = document.getElementById('modalPecaTitle');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen"></i> Editar Peça';
    openModal('modal-peca');
  }

  function _populatePecaMaquinaSelect(selected) {
    const sel = document.getElementById('pecaMaquina');
    if (!sel) return;
    const maquinas = DB.Maquinas.getNomes();
    sel.innerHTML = '<option value="">— Qualquer —</option>' +
      maquinas.map(m => `<option value="${Utils.escapeHTML(m)}" ${m === selected ? 'selected' : ''}>${Utils.escapeHTML(m)}</option>`).join('');
  }

  function onPecaTipoChange() {
    const tipo = Utils.val('pecaTipo') || 'peca';
    const estoqueGroup = document.getElementById('pecaEstoqueGroup');
    if (estoqueGroup) {
      estoqueGroup.style.display = tipo === 'servico' ? 'none' : '';
    }
  }

  // ================================================================
  // CONFIGURAÇÕES
  // ================================================================
  function renderConfiguracoes() {
    renderMaquinasList();
    renderResponsaveisList();
    renderPecasConfigList();
    renderUsuariosList();
    _renderHorariosMaquina(null); // init horários para nova máquina
  }

  function renderMaquinasList() {
    const container = document.getElementById('maquinasList');
    if (!container) return;
    const maquinas = DB.Maquinas.getAll();
    const groups = MachineData.groupByCategory(maquinas);

    container.innerHTML = '';
    Object.entries(groups).forEach(([cat, mqs]) => {
      if (!mqs.length) return;
      const catInfo = MachineData.getCategoryInfo(cat);
      const section = document.createElement('div');
      section.style.cssText = 'grid-column:1/-1;margin-bottom:4px;margin-top:12px';
      section.innerHTML = `<h4 style="font-size:13px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.06em;display:flex;align-items:center;gap:6px"><i class="fa-solid ${catInfo.icon}" style="color:${catInfo.color}"></i> ${cat}</h4>`;
      container.appendChild(section);

      mqs.sort((a,b) => a.nome.localeCompare(b.nome)).forEach(m => {
        const card = document.createElement('div');
        card.className = 'config-item';
        const statusCls = { ativa: 'badge-media', inativa: 'badge-cancelada', manutencao: 'badge-andamento' }[m.status] || 'badge-pendente';
        card.innerHTML = `
          <div class="config-item-header">
            <div class="config-item-name">${Utils.escapeHTML(m.nome)}</div>
            <span class="badge ${statusCls}">${m.status||'ativa'}</span>
          </div>
          <div class="config-item-sub">
            ${m.codigo ? `<span>${m.codigo}</span>` : ''}
            ${m.fabricante ? `<span>• ${Utils.escapeHTML(m.fabricante)}</span>` : ''}
            ${m.modelo ? `<span>${Utils.escapeHTML(m.modelo)}</span>` : ''}
            ${m.localizacao ? `<span>• ${Utils.escapeHTML(m.localizacao)}</span>` : ''}
            ${m.numeroSerie ? `<span>• S/N: ${Utils.escapeHTML(m.numeroSerie)}</span>` : ''}
          </div>
          <div class="config-item-meta">
            <span class="badge badge-${m.criticidade==='alta'?'critica':m.criticidade==='media'?'media':'baixa'}">${m.criticidade||'media'}</span>
            ${m.ehCritico ? '<span class="badge" style="background:rgba(220,38,38,0.1);color:var(--danger)">⚠️ Crítico KPI</span>' : ''}
            ${m.valor ? `<span class="badge" style="background:var(--bg);color:var(--text-secondary)">R$ ${m.valor.toLocaleString('pt-BR', {minimumFractionDigits:2})}</span>` : ''}
            ${m.manualUrl ? `<a href="${Utils.escapeHTML(m.manualUrl)}" target="_blank" class="btn btn-sm btn-ghost" style="padding:2px 8px;font-size:11px"><i class="fa-solid fa-book"></i> Manual</a>` : ''}
          </div>
          <div class="config-item-actions">
            <button class="btn btn-sm btn-secondary" onclick="PCM.editMaquina('${m.id}')"><i class="fa-solid fa-pen"></i> Editar</button>
            <button class="btn btn-sm" style="border-color:var(--danger);color:var(--danger)" onclick="PCM.deleteMaquina('${m.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        `;
        container.appendChild(card);
      });
    });
  }

  function renderResponsaveisList() {
    const container = document.getElementById('responsaveisList');
    if (!container) return;
    const resp = DB.Responsaveis.getAll();
    container.innerHTML = resp.map(r => `
      <div class="config-item">
        <div class="config-item-header">
          <div style="display:flex;align-items:center;gap:8px">
            <div style="width:32px;height:32px;border-radius:50%;background:var(--primary);color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700">${Utils.initials(r.nome)}</div>
            <div class="config-item-name">${Utils.escapeHTML(r.nome)}</div>
          </div>
          <span class="badge ${r.status==='ativo'?'badge-media':r.status==='ferias'?'badge-andamento':'badge-cancelada'}">${r.status||'ativo'}</span>
        </div>
        <div class="config-item-sub">${r.funcao||''} ${r.telefone?'• '+r.telefone:''}</div>
        ${r.especialidades ? `<div class="config-item-sub">${Utils.escapeHTML(r.especialidades)}</div>` : ''}
        <div class="config-item-actions">
          <button class="btn btn-sm btn-secondary" onclick="PCM.editResponsavel('${r.id}')"><i class="fa-solid fa-pen"></i> Editar</button>
          <button class="btn btn-sm" style="border-color:var(--danger);color:var(--danger)" onclick="PCM.deleteResponsavel('${r.id}')"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `).join('');
  }

  function renderPecasConfigList() {
    const container = document.getElementById('pecasConfigList');
    if (!container) return;
    const pecas = DB.Pecas.getAll();
    container.innerHTML = pecas.map(p => {
      const status = Utils.stockStatus(p.estoqueAtual||0, p.estoqueMinimo||0);
      return `
        <div class="config-item">
          <div class="config-item-header">
            <div class="config-item-name">${Utils.escapeHTML(p.descricao)}</div>
            <span class="badge badge-${status.cls==='critico'?'critica':status.cls==='atencao'?'alta':'media'}">${status.label}</span>
          </div>
          <div class="config-item-sub">${p.codigo||''} • ${p.categoria||''} • ${p.criticidade||''}</div>
          <div class="config-item-sub">Est: ${p.estoqueAtual||0}/${p.estoqueMinimo||0} ${p.unidade||'un'}</div>
          <div class="config-item-actions">
            <button class="btn btn-sm btn-secondary" onclick="PCM.editEstoque('${p.id}')"><i class="fa-solid fa-pen"></i> Editar</button>
            <button class="btn btn-sm" style="border-color:var(--danger);color:var(--danger)" onclick="PCM.deletePeca('${p.id}')"><i class="fa-solid fa-trash"></i></button>
          </div>
        </div>
      `;
    }).join('');
  }

  // ================================================================
  // SISTEMA DE LOGIN / SESSÃO
  // ================================================================
  function checkLogin() {
    let user = DB.Session.get();
    if (!user) {
      // Auto-login sem senha: usa usuário "Geral" ou cria sessão padrão
      const usuarios = DB.Usuarios.getAll();
      const geral = usuarios.find(u => u.nome === 'Geral') || usuarios.find(u => u.ativo !== false) || null;
      if (geral) {
        DB.Session.login(geral.id, geral.pin);
        user = DB.Session.get();
      } else {
        // Fallback: sessão anônima sem usuário cadastrado ainda
        user = { id: 'anonimo', nome: 'Operador', papel: 'admin', loginEm: Utils.nowISO() };
      }
    }
    if (user) _updateUserBadge(user);
    return true;
  }

  function _populateLoginSelect() {
    const sel = document.getElementById('loginUserSelect');
    if (!sel) return;
    // Se não houver usuários, forçar patch agora
    if (DB.Usuarios.getAll().length === 0) DB.applyPatches();
    const usuarios = DB.Usuarios.getAll().filter(u => u.ativo);
    sel.innerHTML = '<option value="">Selecione seu nome...</option>' +
      usuarios.map(u => {
        const papelInfo = (DB.Usuarios.PAPEIS || {})[u.papel] || {};
        return `<option value="${u.id}">${Utils.escapeHTML(u.nome)} — ${papelInfo.label || u.papel}</option>`;
      }).join('');
  }

  function _updateUserBadge(user) {
    const nameEl = document.getElementById('userBadgeName');
    const papelEl = document.getElementById('userBadgePapel');
    if (nameEl) nameEl.textContent = user.nome || '';
    if (papelEl) {
      const papelInfo = DB.Usuarios.PAPEIS[user.papel] || {};
      papelEl.textContent = papelInfo.label || user.papel || '';
      papelEl.style.background = papelInfo.bg || 'var(--bg)';
      papelEl.style.color = papelInfo.color || 'var(--text-muted)';
    }
  }

  function doLogin() {
    const userId = document.getElementById('loginUserSelect')?.value;
    if (!userId) { Utils.toast('Selecione seu nome', 'warning'); return; }
    const pin = ['pin1','pin2','pin3','pin4'].map(id => document.getElementById(id)?.value || '').join('');
    if (pin.length < 4) { Utils.toast('Digite o PIN de 4 dígitos', 'warning'); return; }
    const result = DB.Session.login(userId, pin);
    if (!result.ok) {
      Utils.toast(result.msg || 'PIN incorreto', 'danger');
      // Limpa PIN
      ['pin1','pin2','pin3','pin4'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
      document.getElementById('pin1')?.focus();
      return;
    }
    document.getElementById('loginOverlay').style.display = 'none';
    _updateUserBadge(result.usuario);
    Utils.toast(`Bem-vindo, ${result.usuario.nome}!`, 'success');
  }

  function doLogout() {
    // Login removido — logout não tem efeito
  }

  function setupPinInputs() {
    // Auto-advance PIN inputs
    ['pin1','pin2','pin3','pin4'].forEach((id, idx, arr) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener('input', () => {
        el.value = el.value.replace(/\D/g,'').slice(0,1);
        if (el.value && idx < arr.length - 1) document.getElementById(arr[idx+1])?.focus();
        if (idx === arr.length - 1 && el.value) doLogin();
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && !el.value && idx > 0) document.getElementById(arr[idx-1])?.focus();
      });
    });
  }

  // ================================================================
  // CRUD USUÁRIOS
  // ================================================================
  function renderUsuariosList() {
    const container = document.getElementById('usuariosList');
    if (!container) return;
    const usuarios = DB.Usuarios.getAll();
    const papeis = DB.Usuarios.PAPEIS;

    // Group by papel
    const grupos = {};
    Object.keys(papeis).forEach(p => grupos[p] = []);
    usuarios.forEach(u => { if (grupos[u.papel]) grupos[u.papel].push(u); });

    container.innerHTML = Object.entries(grupos).map(([papel, lista]) => {
      if (!lista.length) return '';
      const info = papeis[papel] || {};
      return `
        <div class="usuarios-grupo">
          <div class="usuarios-grupo-label" style="color:${info.color||'var(--text-muted)'}">
            <span class="badge" style="background:${info.bg||'var(--bg)'};color:${info.color||'var(--text-muted)'}">${info.label || papel}</span>
            <span style="font-size:12px;color:var(--text-muted);margin-left:4px">${lista.length} usuário(s)</span>
          </div>
          ${lista.map(u => `
            <div class="config-item">
              <div class="config-item-header">
                <div class="config-item-name">${Utils.escapeHTML(u.nome)}</div>
                <span class="badge" style="background:${u.ativo ? 'rgba(5,150,105,0.1)' : 'rgba(107,114,128,0.1)'};color:${u.ativo ? 'var(--success)' : 'var(--text-muted)'}">
                  ${u.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </div>
              <div class="config-item-sub">PIN: ****</div>
              <div class="config-item-actions">
                <button class="btn btn-sm btn-secondary" onclick="PCM.editUsuario('${u.id}')"><i class="fa-solid fa-pen"></i> Editar</button>
                <button class="btn btn-sm" style="border-color:var(--danger);color:var(--danger)" onclick="PCM.deleteUsuario('${u.id}')"><i class="fa-solid fa-trash"></i></button>
              </div>
            </div>
          `).join('')}
        </div>
      `;
    }).join('');
  }

  function editUsuario(id) {
    const u = DB.Usuarios.getById(id);
    if (!u) return;
    document.getElementById('usuarioEditId').value = id;
    Utils.setVal('usuarioNome', u.nome);
    Utils.setVal('usuarioPapel', u.papel);
    Utils.setVal('usuarioPin', u.pin);
    Utils.setVal('usuarioPinConfirm', u.pin);
    Utils.setVal('usuarioAtivo', u.ativo ? 'true' : 'false');
    const titleEl = document.getElementById('modalUsuarioTitle');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen"></i> Editar Usuário';
    openModal('modal-usuario');
  }

  function saveUsuario() {
    const id = Utils.val('usuarioEditId');
    const nome = Utils.val('usuarioNome').trim();
    const papel = Utils.val('usuarioPapel');
    const pin = Utils.val('usuarioPin');
    const pinConfirm = Utils.val('usuarioPinConfirm');
    const ativo = Utils.val('usuarioAtivo') !== 'false';
    if (!nome) { Utils.toast('Informe o nome', 'warning'); return; }
    if (!pin || pin.length < 4) { Utils.toast('PIN deve ter 4 dígitos', 'warning'); return; }
    if (pin !== pinConfirm) { Utils.toast('PINs não conferem', 'warning'); return; }
    const data = { nome, papel, pin, ativo };
    if (id) { DB.Usuarios.update(id, data); Utils.toast('Usuário atualizado!', 'success'); }
    else { DB.Usuarios.add(data); Utils.toast('Usuário cadastrado!', 'success'); }
    closeModal();
    renderUsuariosList();
  }

  function deleteUsuario(id) {
    const u = DB.Usuarios.getById(id);
    if (!u) return;
    _pendingDeleteFn = () => {
      DB.Usuarios.remove(id);
      Utils.toast('Usuário excluído', 'info');
      renderUsuariosList();
    };
    const confirmTitle = document.getElementById('confirmTitle');
    const confirmMsg = document.getElementById('confirmMsg');
    if (confirmTitle) confirmTitle.textContent = 'Excluir Usuário';
    if (confirmMsg) confirmMsg.textContent = `Excluir o usuário "${u.nome}"?`;
    openModal('modal-confirmar');
  }

  // ================================================================
  // CRUD MODALS: MAQUINA
  // ================================================================
  function editMaquina(id) {
    const m = DB.Maquinas.getById(id);
    if (!m) return;
    document.getElementById('maqEditId').value = id;
    Utils.setVal('maqNome', m.nome);
    Utils.setVal('maqCodigo', m.codigo||'');
    Utils.setVal('maqCategoria', m.categoria);
    Utils.setVal('maqCriticidade', m.criticidade||'media');
    Utils.setVal('maqFabricante', m.fabricante||'');
    Utils.setVal('maqModelo', m.modelo||'');
    Utils.setVal('maqAno', m.ano||'');
    Utils.setVal('maqLocalizacao', m.localizacao||'');
    Utils.setVal('maqStatus', m.status||'ativa');
    Utils.setVal('maqNumeroSerie', m.numeroSerie||'');
    Utils.setVal('maqValor', m.valor||'');
    Utils.setVal('maqManualUrl', m.manualUrl||'');
    Utils.setVal('maqEhCritico', m.ehCritico ? 'true' : 'false');
    _renderHorariosMaquina(m.horariosOperacao || null);
    const titleEl = document.getElementById('modalMaquinaTitle');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen"></i> Editar Máquina';
    openModal('modal-maquina');
  }

  function _getDiasSemana() {
    return [
      { key: 'seg', label: 'Segunda' },
      { key: 'ter', label: 'Terça' },
      { key: 'qua', label: 'Quarta' },
      { key: 'qui', label: 'Quinta' },
      { key: 'sex', label: 'Sexta' },
      { key: 'sab', label: 'Sábado' },
      { key: 'dom', label: 'Domingo' }
    ];
  }

  function _renderHorariosMaquina(dados) {
    const container = document.getElementById('horariosMaquina');
    if (!container) return;
    const dias = _getDiasSemana();
    container.innerHTML = dias.map(d => {
      const h = (dados && dados[d.key]) || { ativo: false, inicio: '06:00', fim: '18:00' };
      return `
        <div class="horario-row" id="horario-row-${d.key}">
          <label class="horario-check">
            <input type="checkbox" id="hor-ativo-${d.key}" ${h.ativo ? 'checked' : ''}
              onchange="PCM._onHorarioToggle('${d.key}')">
            <span>${d.label}</span>
          </label>
          <div class="horario-times" id="horario-times-${d.key}" style="${h.ativo ? '' : 'opacity:0.3;pointer-events:none'}">
            <input type="time" id="hor-ini-${d.key}" value="${h.inicio||'06:00'}" class="horario-input">
            <span style="color:var(--text-muted);font-size:12px">até</span>
            <input type="time" id="hor-fim-${d.key}" value="${h.fim||'18:00'}" class="horario-input">
          </div>
        </div>
      `;
    }).join('');
  }

  function _onHorarioToggle(diaKey) {
    const chk = document.getElementById(`hor-ativo-${diaKey}`);
    const times = document.getElementById(`horario-times-${diaKey}`);
    if (times) {
      times.style.opacity = chk.checked ? '1' : '0.3';
      times.style.pointerEvents = chk.checked ? 'auto' : 'none';
    }
  }

  function _readHorariosMaquina() {
    const dias = _getDiasSemana();
    const result = {};
    dias.forEach(d => {
      const ativo = document.getElementById(`hor-ativo-${d.key}`)?.checked || false;
      const inicio = document.getElementById(`hor-ini-${d.key}`)?.value || '06:00';
      const fim = document.getElementById(`hor-fim-${d.key}`)?.value || '18:00';
      result[d.key] = { ativo, inicio, fim };
    });
    return result;
  }

  function saveMaquina() {
    const id = Utils.val('maqEditId');
    const nome = Utils.val('maqNome');
    const categoria = Utils.val('maqCategoria');
    if (!nome) { Utils.toast('Informe o nome da máquina', 'warning'); return; }
    if (!categoria) { Utils.toast('Selecione a categoria', 'warning'); return; }
    const data = {
      nome, codigo: Utils.val('maqCodigo'), categoria, criticidade: Utils.val('maqCriticidade'),
      fabricante: Utils.val('maqFabricante'), modelo: Utils.val('maqModelo'),
      ano: parseInt(Utils.val('maqAno'))||null, localizacao: Utils.val('maqLocalizacao'),
      status: Utils.val('maqStatus'),
      numeroSerie: Utils.val('maqNumeroSerie'),
      valor: parseFloat(Utils.val('maqValor')) || 0,
      manualUrl: Utils.val('maqManualUrl'),
      ehCritico: Utils.val('maqEhCritico') === 'true',
      horariosOperacao: _readHorariosMaquina()
    };
    if (id) { DB.Maquinas.update(id, data); Utils.toast('Máquina atualizada!', 'success'); }
    else { DB.Maquinas.add(data); Utils.toast('Máquina cadastrada!', 'success'); }
    closeModal();
    renderMaquinasList();
  }

  function deleteMaquina(id) {
    const m = DB.Maquinas.getById(id);
    if (!m) return;
    if (confirm(`Excluir máquina "${m.nome}"?`)) {
      DB.Maquinas.remove(id);
      Utils.toast('Máquina excluída', 'info');
      renderMaquinasList();
    }
  }

  // ================================================================
  // CRUD MODALS: RESPONSAVEL
  // ================================================================
  function editResponsavel(id) {
    const r = DB.Responsaveis.getById(id);
    if (!r) return;
    document.getElementById('respEditId').value = id;
    Utils.setVal('respNome', r.nome);
    Utils.setVal('respFuncao', r.funcao||'Mecânico');
    Utils.setVal('respTelefone', r.telefone||'');
    Utils.setVal('respStatus', r.status||'ativo');
    Utils.setVal('respEspecialidades', r.especialidades||'');
    Utils.setVal('respCustoHora', r.custoHora||'');
    const titleEl = document.getElementById('modalResponsavelTitle');
    if (titleEl) titleEl.innerHTML = '<i class="fa-solid fa-pen"></i> Editar Responsável';
    openModal('modal-responsavel');
  }

  function saveResponsavel() {
    const id = Utils.val('respEditId');
    const nome = Utils.val('respNome');
    if (!nome) { Utils.toast('Informe o nome', 'warning'); return; }
    const data = {
      nome, funcao: Utils.val('respFuncao'), telefone: Utils.val('respTelefone'),
      status: Utils.val('respStatus'), especialidades: Utils.val('respEspecialidades'),
      custoHora: parseFloat(Utils.val('respCustoHora')) || 0
    };
    if (id) { DB.Responsaveis.update(id, data); Utils.toast('Responsável atualizado!', 'success'); }
    else { DB.Responsaveis.add(data); Utils.toast('Responsável cadastrado!', 'success'); }
    closeModal();
    renderResponsaveisList();
  }

  function deleteResponsavel(id) {
    const r = DB.Responsaveis.getById(id);
    if (!r) return;
    if (confirm(`Excluir "${r.nome}"?`)) {
      DB.Responsaveis.remove(id);
      Utils.toast('Responsável excluído', 'info');
      renderResponsaveisList();
    }
  }

  // ================================================================
  // CRUD MODALS: PECA
  // ================================================================
  function savePeca() {
    const id = Utils.val('pecaEditId');
    const descricao = Utils.val('pecaDescricao');
    const estMin = parseInt(Utils.val('pecaEstMin'));
    const estAtual = parseInt(Utils.val('pecaEstAtual'));
    if (!descricao) { Utils.toast('Informe a descrição', 'warning'); return; }
    const data = {
      descricao, codigo: Utils.val('pecaCodigo'), categoria: Utils.val('pecaCategoria'),
      criticidade: Utils.val('pecaCriticidade'), estoqueMinimo: estMin||0, estoqueAtual: estAtual||0,
      unidade: Utils.val('pecaUnidade'), fornecedor: Utils.val('pecaFornecedor'),
      custo: parseFloat(Utils.val('pecaCusto'))||0,
      tipo: Utils.val('pecaTipo') || 'peca',
      maquinaAssociada: Utils.val('pecaMaquina') || ''
    };
    if (id) { DB.Pecas.update(id, data); Utils.toast('Peça atualizada!', 'success'); }
    else { DB.Pecas.add(data); Utils.toast('Peça cadastrada!', 'success'); }
    closeModal();
    if (_currentSection === 'estoque') { renderEstoqueTable(); renderEstoqueStats(); }
    if (_currentSection === 'configuracoes') renderPecasConfigList();
    updateBadges();
  }

  function deletePeca(id) {
    if (confirm('Excluir esta peça?')) {
      DB.Pecas.remove(id);
      Utils.toast('Peça excluída', 'info');
      renderPecasConfigList();
    }
  }

  // ================================================================
  // IMPORTAÇÃO DE PEÇAS (Template + Upload CSV/XLSX)
  // ================================================================
  let _importParsedData = [];

  function downloadTemplatePecas() {
    const header = ['Situação', 'Descrição', 'Quantidade', 'Código NCM', 'Inclusão', 'Última Alteração'];
    const exemplo = [
      ['Ativo', 'ROLAMENTO 6007', 5, '8482.10.10', '22/04/2022', '05/08/2025'],
      ['Ativo', 'DISJUNTOR 40A', 2, '8536.20.00', '22/04/2022', '05/08/2025'],
      ['Inativo', 'KIT REPARO CILINDRO 50MM', '', '4016.93.00', '22/04/2022', '05/08/2025'],
    ];
    const rows = [header, ...exemplo];
    const csvContent = rows.map(r => r.map(c => '"' + String(c || '').replace(/"/g, '""') + '"').join(',')).join('\r\n');
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_pecas_pcm.csv';
    a.click();
    URL.revokeObjectURL(url);
    Utils.toast('Template baixado!', 'success');
  }

  function openImportPecas() {
    _importParsedData = [];
    document.getElementById('importPreview').style.display = 'none';
    document.getElementById('importConfirmBtn').style.display = 'none';
    document.getElementById('importFileInput').value = '';
    document.getElementById('importDropZone').style.display = 'block';
    openModal('modal-import-pecas');
  }

  function handleImportDrop(event) {
    event.preventDefault();
    document.getElementById('importDropZone').style.borderColor = 'var(--border)';
    const file = event.dataTransfer.files[0];
    if (file) _processImportFile(file);
  }

  function handleImportFile(event) {
    const file = event.target.files[0];
    if (file) _processImportFile(file);
  }

  function _excelSerialToDate(serial) {
    if (!serial && serial !== 0) return '';
    if (typeof serial === 'string' && (serial.includes('/') || serial.includes('-'))) return serial;
    const date = new Date(Math.round((Number(serial) - 25569) * 86400 * 1000));
    if (isNaN(date.getTime())) return String(serial);
    return date.toLocaleDateString('pt-BR');
  }

  function _dateStrToISO(str) {
    if (!str) return new Date().toISOString();
    const s = String(str).trim();
    const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (m) return new Date(m[3] + '-' + m[2].padStart(2,'0') + '-' + m[1].padStart(2,'0')).toISOString();
    if (s.match(/^\d{4}-\d{2}-\d{2}/)) return new Date(s).toISOString();
    if (!isNaN(Number(s))) {
      return new Date(Math.round((Number(s) - 25569) * 86400 * 1000)).toISOString();
    }
    return new Date().toISOString();
  }

  function _processImportFile(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        if (rows.length < 2) { Utils.toast('Arquivo vazio ou sem dados', 'warning'); return; }

        const header = rows[0].map(h => String(h).toLowerCase().trim());
        const colSituacao   = header.findIndex(h => h.includes('situa'));
        const colDescricao  = header.findIndex(h => h.includes('descri'));
        const colQtd        = header.findIndex(h => h.includes('quanti') || h === 'qtd' || h === 'qty');
        const colNcm        = header.findIndex(h => h.includes('ncm') || h.includes('c\u00f3digo'));
        const colInclusao   = header.findIndex(h => h.includes('inclu'));
        const colAlteracao  = header.findIndex(h => h.includes('altera'));

        if (colDescricao < 0) { Utils.toast('Coluna "Descrição" não encontrada', 'warning'); return; }

        _importParsedData = rows.slice(1)
          .filter(r => r[colDescricao] && String(r[colDescricao]).trim())
          .map(r => ({
            situacao:     colSituacao  >= 0 ? String(r[colSituacao] || 'Ativo').trim()  : 'Ativo',
            descricao:    String(r[colDescricao] || '').trim(),
            estoqueAtual: colQtd >= 0 && r[colQtd] !== '' ? Number(r[colQtd]) || 0 : 0,
            ncm:          colNcm >= 0 ? String(r[colNcm] || '').trim() : '',
            criadoEm:     colInclusao  >= 0 ? _dateStrToISO(r[colInclusao])  : new Date().toISOString(),
            atualizadoEm: colAlteracao >= 0 ? _dateStrToISO(r[colAlteracao]) : new Date().toISOString(),
            _inclusaoFmt: colInclusao  >= 0 ? _excelSerialToDate(r[colInclusao]) : '',
          }));

        _renderImportPreview(file.name);
      } catch(err) {
        Utils.toast('Erro ao ler arquivo: ' + err.message, 'danger');
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function _renderImportPreview(fileName) {
    const total    = _importParsedData.length;
    const ativos   = _importParsedData.filter(p => p.situacao === 'Ativo').length;
    const inativos = total - ativos;

    document.getElementById('importStats').innerHTML =
      '<strong>' + fileName + '</strong> — <span style="color:var(--success)">' + ativos + ' ativos</span> · ' +
      '<span style="color:var(--text-muted)">' + inativos + ' inativos</span> · ' + total + ' total';

    const tbody = document.getElementById('importPreviewBody');
    tbody.innerHTML = _importParsedData.slice(0, 100).map(p =>
      '<tr style="border-bottom:1px solid var(--border)">' +
        '<td style="padding:6px 10px"><span style="font-size:11px;padding:2px 6px;border-radius:4px;' +
          'background:' + (p.situacao === 'Ativo' ? '#d1fae5' : '#f3f4f6') + ';' +
          'color:' + (p.situacao === 'Ativo' ? 'var(--success)' : 'var(--text-muted)') + '">' + p.situacao + '</span></td>' +
        '<td style="padding:6px 10px">' + p.descricao + '</td>' +
        '<td style="padding:6px 10px">' + (p.estoqueAtual || '—') + '</td>' +
        '<td style="padding:6px 10px;font-family:monospace;font-size:11px">' + (p.ncm || '—') + '</td>' +
        '<td style="padding:6px 10px;color:var(--text-muted)">' + (p._inclusaoFmt || '—') + '</td>' +
      '</tr>'
    ).join('') + (total > 100 ? '<tr><td colspan="5" style="padding:8px 10px;text-align:center;color:var(--text-muted);font-size:12px">... e mais ' + (total - 100) + ' itens</td></tr>' : '');

    document.getElementById('importDropZone').style.display = 'none';
    document.getElementById('importPreview').style.display  = 'block';
    document.getElementById('importConfirmBtn').style.display = 'inline-flex';
  }

  function confirmImportPecas() {
    if (!_importParsedData.length) return;
    const overwrite = document.getElementById('importOverwrite').checked;
    const existentes = DB.Pecas.getAll();
    let adicionadas = 0, substituidas = 0, ignoradas = 0;

    _importParsedData.forEach(p => {
      const duplicata = existentes.find(e => e.descricao.trim().toLowerCase() === p.descricao.toLowerCase());
      const obj = {
        descricao: p.descricao, codigo: '', situacao: p.situacao, ncm: p.ncm,
        categoria: 'Consumo', criticidade: 'importante', estoqueMinimo: 0,
        estoqueAtual: p.estoqueAtual, unidade: 'un', fornecedor: '', custo: 0,
        tipo: 'peca', criadoEm: p.criadoEm, atualizadoEm: p.atualizadoEm
      };
      if (duplicata) {
        if (overwrite) { DB.Pecas.update(duplicata.id, obj); substituidas++; }
        else ignoradas++;
      } else {
        DB.Pecas.add(obj);
        adicionadas++;
      }
    });

    closeModal();
    renderEstoqueTable();
    renderEstoqueStats();
    updateBadges();
    const msg = 'Importação concluída: ' + adicionadas + ' adicionadas' +
      (substituidas ? ', ' + substituidas + ' substituídas' : '') +
      (ignoradas ? ', ' + ignoradas + ' ignoradas (duplicadas)' : '');
    Utils.toast(msg, 'success');
    _importParsedData = [];
  }

  // ================================================================
  // MODAL MANAGEMENT
  // ================================================================
  function openModal(id) {
    if (_currentModal) closeModal();
    const modal = document.getElementById(id);
    const overlay = document.getElementById('modalOverlay');
    if (modal) { modal.classList.add('active'); modal.style.display = 'flex'; }
    if (overlay) overlay.classList.add('active');
    _currentModal = id;
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    if (_currentModal) {
      const modal = document.getElementById(_currentModal);
      if (modal) { modal.classList.remove('active'); modal.style.display = 'none'; }
    }
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('active');
    _currentModal = null;
    document.body.style.overflow = '';
  }

  // ================================================================
  // THEME
  // ================================================================
  function applyTheme() {
    const theme = localStorage.getItem('pcm_theme') || 'light';
    document.documentElement.setAttribute('data-theme', theme);
    const btn = document.getElementById('themeToggle');
    if (btn) btn.innerHTML = theme === 'dark' ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
  }

  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('pcm_theme', next);
    applyTheme();
  }

  // ================================================================
  // BADGES & NOTIFICATIONS
  // ================================================================
  function updateBadges() {
    const stats = DB.Manutencao.getStats();
    const stockAlerts = DB.Pecas.getAlerts().length;
    const osStats = DB.OS.getStats();
    const osPendentes = osStats.abertas + osStats.aguardando;

    const setB = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val > 0 ? val : ''; };
    setB('badge-dashboard', stats.critica + stats.atrasada);
    setB('badge-manutencoes', stats.pendente + stats.andamento);
    setB('badge-preventivas', stats.pendente);
    setB('badge-os', osPendentes);
    setB('badge-estoque', stockAlerts);

    const notifCount = stats.critica + stats.atrasada + stockAlerts + osStats.criticas;
    const notifBadge = document.getElementById('notifBadge');
    if (notifBadge) {
      notifBadge.textContent = notifCount;
      notifBadge.style.display = notifCount > 0 ? 'flex' : 'none';
    }
  }

  function updateNotifications() {
    const list = document.getElementById('notifList');
    if (!list) return;
    const all = DB.Manutencao.getAll();
    const today = Utils.today();
    const notifs = [];

    all.filter(m => Utils.isOverdue(m.dataPrevista, m.status)).slice(0,5).forEach(m => {
      notifs.push({ type: 'danger', text: `${m.maquina}: ${m.tipo} atrasada`, time: Utils.formatDate(m.dataPrevista) });
    });
    all.filter(m => m.dataPrevista === today && !['concluida','cancelada'].includes(m.status)).slice(0,3).forEach(m => {
      notifs.push({ type: 'warning', text: `Hoje: ${m.maquina} - ${Utils.truncate(m.descricao, 40)}`, time: 'Hoje' });
    });
    DB.Pecas.getAlerts().slice(0,3).forEach(p => {
      notifs.push({ type: 'danger', text: `Estoque: ${p.descricao} abaixo do mínimo`, time: 'Estoque' });
    });
    DB.OS.getAll().filter(o => o.status === 'aguardando_aprovacao').slice(0,3).forEach(o => {
      notifs.push({ type: 'warning', text: `OS ${o.numero}: ${Utils.truncate(o.maquina,25)} aguardando aprovação`, time: 'OS' });
    });
    DB.OS.getAll().filter(o => o.prioridade === 'critica' && !['concluida','cancelada'].includes(o.status)).slice(0,2).forEach(o => {
      notifs.push({ type: 'danger', text: `OS Crítica: ${o.numero} — ${Utils.truncate(o.maquina,25)}`, time: 'OS' });
    });

    if (!notifs.length) {
      list.innerHTML = '<div class="notif-empty"><i class="fa-solid fa-check-circle" style="font-size:24px;display:block;margin-bottom:8px;color:var(--success)"></i>Nenhuma notificação pendente!</div>';
      return;
    }
    list.innerHTML = notifs.map(n => `
      <div class="notif-item">
        <div class="notif-dot ${n.type}"></div>
        <div class="notif-text">${Utils.escapeHTML(n.text)}</div>
        <div class="notif-time">${n.time}</div>
      </div>
    `).join('');
  }

  function clearNotifications() {
    const list = document.getElementById('notifList');
    if (list) list.innerHTML = '<div class="notif-empty">Notificações limpas</div>';
  }

  // ================================================================
  // BACKUP
  // ================================================================
  function exportBackup() {
    const backup = DB.exportBackup();
    Utils.downloadJSON(`pcm-backup-${Utils.today()}.json`, backup);
    Utils.toast('Backup exportado com sucesso!', 'success');
  }

  function importBackup(inputEl) {
    const file = inputEl.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target.result);
        if (confirm('Isso irá SUBSTITUIR todos os dados atuais. Confirmar?')) {
          DB.importBackup(backup);
          Utils.toast('Dados importados com sucesso! Recarregando...', 'success');
          setTimeout(() => location.reload(), 1500);
        }
      } catch(err) {
        Utils.toast('Arquivo inválido: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    inputEl.value = '';
  }

  function clearAllData() {
    if (confirm('ATENÇÃO: Isso apagará TODOS os dados. Esta ação não pode ser desfeita!\n\nDeseja continuar?')) {
      if (confirm('Tem absoluta certeza? Faça um backup antes!')) {
        DB.clearAll();
        Utils.toast('Dados limpos. Recarregando...', 'info');
        setTimeout(() => location.reload(), 1500);
      }
    }
  }

  // ================================================================
  // EXPORT CSV
  // ================================================================
  function exportCSV() {
    const items = DB.Manutencao.filter(_currentFilter, _listSearch, _currentSort, _sortDir);
    const rows = [
      ['#', 'Tipo', 'Prioridade', 'Máquina', 'Descrição', 'Responsável', 'Data Prevista', 'Status', 'Tempo Est (h)', 'Criado Em', 'Concluído Em']
    ];
    items.forEach(m => {
      rows.push([m.numero||'', m.tipo, m.prioridade, m.maquina, m.descricao, m.responsavel, m.dataPrevista, Utils.statusLabel(m.status), m.tempoEstimado||'', Utils.formatDateTime(m.criadoEm), Utils.formatDateTime(m.concluidoEm)]);
    });
    Utils.downloadCSV(`pcm-manutencoes-${Utils.today()}.csv`, rows);
    Utils.toast('CSV exportado!', 'success');
  }

  // ================================================================
  // CALENDAR INTERACTIONS
  // ================================================================
  function calDayClick(dateStr) {
    const events = DB.Manutencao.getForCalendar(_calYear, _calMonth).filter(e => e.dataPrevista === dateStr);
    if (events.length === 1) {
      showDetalhes(events[0].id);
    } else if (events.length > 1) {
      _currentFilter = 'todas';
      _listSearch = dateStr;
      navigate('manutencoes');
      setTimeout(() => {
        const searchEl = document.getElementById('listSearch');
        if (searchEl) searchEl.value = Utils.formatDate(dateStr);
        _listSearch = Utils.formatDate(dateStr);
      }, 100);
    } else {
      // Create new maintenance for this date
      navigate('nova-manutencao');
      setTimeout(() => Utils.setVal('fDataPrevista', dateStr), 100);
    }
  }

  // ================================================================
  // STORAGE INFO
  // ================================================================
  function updateStorageInfo() {
    const el = document.getElementById('storageInfo');
    if (el) el.textContent = DB.getStorageInfo();
  }

  // ================================================================
  // EVENT LISTENERS
  // ================================================================
  function setupEventListeners() {
    // Sidebar toggle
    document.getElementById('sidebarToggle')?.addEventListener('click', () => {
      document.getElementById('sidebar')?.classList.toggle('collapsed');
    });

    // Mobile menu
    document.getElementById('mobileMenuBtn')?.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      sidebar?.classList.toggle('mobile-open');
      let overlay = document.getElementById('mobileOverlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'mobileOverlay';
        overlay.className = 'mobile-overlay';
        overlay.addEventListener('click', () => {
          sidebar?.classList.remove('mobile-open');
          overlay.classList.remove('active');
        });
        document.body.appendChild(overlay);
      }
      overlay.classList.toggle('active');
    });

    // Nav items
    document.querySelectorAll('.nav-item[data-section]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        navigate(item.dataset.section);
      });
    });

    // Theme toggle
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);

    // Form submit
    document.getElementById('manutencaoForm')?.addEventListener('submit', handleFormSubmit);

    // Tipo radio change
    document.querySelectorAll('input[name="tipo"]').forEach(r => {
      r.addEventListener('change', updateRecorrenciaVisibility);
    });

    // Filter tabs
    document.getElementById('filterTabs')?.addEventListener('click', (e) => {
      const tab = e.target.closest('.filter-tab');
      if (!tab) return;
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      _currentFilter = tab.dataset.filter;
      renderManutencoes();
    });

    // List search
    const listSearch = document.getElementById('listSearch');
    if (listSearch) {
      listSearch.addEventListener('input', Utils.debounce(() => {
        _listSearch = listSearch.value;
        renderManutencoes();
      }, 250));
    }

    // Sort
    document.getElementById('sortField')?.addEventListener('change', (e) => {
      _currentSort = e.target.value;
      renderManutencoes();
    });
    document.getElementById('sortDir')?.addEventListener('click', () => {
      _sortDir = _sortDir === 'asc' ? 'desc' : 'asc';
      const icon = document.querySelector('#sortDir i');
      if (icon) icon.className = `fa-solid fa-arrow-${_sortDir === 'asc' ? 'down' : 'up'}-wide-short`;
      renderManutencoes();
    });

    // Calendar nav
    document.getElementById('calPrev')?.addEventListener('click', () => {
      _calMonth--; if (_calMonth < 0) { _calMonth = 11; _calYear--; }
      renderCalendar();
    });
    document.getElementById('calNext')?.addEventListener('click', () => {
      _calMonth++; if (_calMonth > 11) { _calMonth = 0; _calYear++; }
      renderCalendar();
    });

    // Estoque search
    document.getElementById('estoqueSearch')?.addEventListener('input', Utils.debounce(() => {
      renderEstoqueTable();
    }, 250));
    document.getElementById('estoqueCatFilter')?.addEventListener('change', () => {
      renderEstoqueTable();
    });

    // Reports period
    document.getElementById('reportPeriod')?.addEventListener('change', (e) => {
      Reports.renderAll(e.target.value);
    });

    // Config tabs
    document.querySelectorAll('.config-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        document.querySelectorAll('.config-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.config-panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        const panel = document.getElementById('config-' + tab.dataset.config);
        if (panel) panel.classList.add('active');
      });
    });

    // Preventiva filter
    document.getElementById('preventivaMaquinaFilter')?.addEventListener('change', () => {
      renderPreventivasAgendadas();
    });

    // Notifications
    document.getElementById('notificationsBtn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      const dropdown = document.getElementById('notificationsDropdown');
      if (dropdown) {
        const isShown = dropdown.style.display !== 'none';
        dropdown.style.display = isShown ? 'none' : 'block';
        if (!isShown) updateNotifications();
      }
    });

    // Global search
    const globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
      globalSearch.addEventListener('input', Utils.debounce(() => {
        const q = globalSearch.value.trim();
        const dropdown = document.getElementById('searchDropdown');
        if (!dropdown) return;
        if (!q) { dropdown.style.display = 'none'; return; }
        const results = DB.Manutencao.filter('todas', q, 'dataPrevista', 'desc').slice(0, 8);
        if (!results.length) { dropdown.style.display = 'none'; return; }
        dropdown.innerHTML = results.map(m => `
          <div class="search-result-item" onclick="PCM.closeSearchDropdown();PCM.showDetalhes('${m.id}')">
            <i class="fa-solid fa-wrench"></i>
            <div class="search-result-text">
              <div class="title">${Utils.escapeHTML(m.maquina)} - #${m.numero||'—'}</div>
              <div class="sub">${Utils.escapeHTML(Utils.truncate(m.descricao, 50))} | ${Utils.statusLabel(m.status)}</div>
            </div>
          </div>
        `).join('');
        dropdown.style.display = 'block';
      }, 300));
    }

    // Close dropdowns on outside click
    document.addEventListener('click', (e) => {
      if (!e.target.closest('#notificationsBtn') && !e.target.closest('#notificationsDropdown')) {
        const nd = document.getElementById('notificationsDropdown');
        if (nd) nd.style.display = 'none';
      }
      if (!e.target.closest('#globalSearch') && !e.target.closest('#searchDropdown')) {
        const sd = document.getElementById('searchDropdown');
        if (sd) sd.style.display = 'none';
      }
    });

    // ESC to close modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && _currentModal) closeModal();
    });
  }

  function closeSearchDropdown() {
    const sd = document.getElementById('searchDropdown');
    if (sd) sd.style.display = 'none';
    const gs = document.getElementById('globalSearch');
    if (gs) gs.value = '';
  }

  function handleKeyboard(e) {
    // Ctrl+N: Nova manutenção
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      navigate('nova-manutencao');
    }
    // Ctrl+F: Focus search
    if (e.ctrlKey && e.key === 'f') {
      e.preventDefault();
      document.getElementById('globalSearch')?.focus();
    }
    // ESC: Close modal
    if (e.key === 'Escape') closeModal();
  }

  // ================================================================
  // PUBLIC API
  // ================================================================
  return {
    init, navigate,
    renderDashboard, renderManutencoes,
    abrirIniciar, confirmarIniciar,
    abrirConcluir, confirmarConcluir,
    pausar, confirmDelete,
    showDetalhes, editManutencao,
    renderPreventivas, openTemplate, savePartialChecklist, concluirChecklist,
    openModalPlano, adicionarSistemaNovo, savePlano, deletePlano,
    _adicionarSistema, _adicionarTarefa, _removerSistema,
    _onSistemaSelectChange, _onTarefaSelectChange,
    renderEstoque, ajustarEstoque, editEstoque, openMovimentacao, onMovPecaChange, onMovTipoChange, saveMovimentacao,
    renderConfiguracoes,
    openModal, closeModal,
    editMaquina, saveMaquina, deleteMaquina,
    editResponsavel, saveResponsavel, deleteResponsavel,
    savePeca, deletePeca, onPecaTipoChange,
    downloadTemplatePecas, openImportPecas, handleImportDrop, handleImportFile, confirmImportPecas,
    renderUsuariosList, editUsuario, saveUsuario, deleteUsuario,
    doLogin, doLogout, checkLogin,
    _onHorarioToggle, _renderHorariosMaquina,
    toggleTheme, exportBackup, importBackup, clearAllData,
    exportCSV, calDayClick, closeSearchDropdown,
    updateBadges, clearNotifications,
    goToFilter
  };
})();

// ================================================================
// BOOTSTRAP
// ================================================================
document.addEventListener('DOMContentLoaded', () => {
  PCM.init();
});
