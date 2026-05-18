/* ================================================================
   PCM BR AÇO — Módulo Ordens de Serviço (OS)
   ================================================================ */

const OS_Module = (() => {

  // ---- Configurações de Status ----
  const STATUS_CFG = {
    aberta:               { label: 'Aberta',           badgeCls: 'badge-pendente',  icon: 'fa-circle-dot',         step: 0 },
    diagnostico:          { label: 'Diagnóstico',      badgeCls: 'badge-andamento', icon: 'fa-magnifying-glass',   step: 1 },
    aguardando_aprovacao: { label: 'Ag. Aprovação',    badgeCls: 'badge-pausada',   icon: 'fa-clock',              step: 2 },
    aprovada:             { label: 'Aprovada',         badgeCls: 'badge-media',     icon: 'fa-thumbs-up',          step: 2 },
    em_execucao:          { label: 'Em Execução',      badgeCls: 'badge-andamento', icon: 'fa-spinner fa-spin',    step: 3 },
    pausada:              { label: 'Pausada',          badgeCls: 'badge-pausada',   icon: 'fa-pause',              step: 3 },
    aguardando_peca:      { label: 'Ag. Peça',         badgeCls: 'badge-pausada',   icon: 'fa-box',                step: 3 },
    aguardando_validacao: { label: 'Ag. Validação',    badgeCls: 'badge-andamento', icon: 'fa-clipboard-check',    step: 4 },
    concluida:            { label: 'Concluída',        badgeCls: 'badge-concluida', icon: 'fa-circle-check',       step: 5 },
    cancelada:            { label: 'Cancelada',        badgeCls: 'badge-cancelada', icon: 'fa-ban',                step: -1 }
  };

  const TIPO_CFG = {
    preventiva: { label: 'Preventiva', icon: 'fa-calendar-check', cls: 'preventiva' },
    corretiva:  { label: 'Corretiva',  icon: 'fa-wrench',          cls: 'corretiva' },
    melhoria:   { label: 'Melhoria',   icon: 'fa-arrow-up-right-dots', cls: 'preventiva' },
    instalacao: { label: 'Instalação', icon: 'fa-screwdriver-wrench',  cls: 'preventiva' }
  };

  // ---- Estado local ----
  let _osFilter = 'todas';
  let _osSearch = '';

  // ---- Gerar número da OS ----
  function generateNumero() {
    const all = DB.OS.getAll();
    const year = new Date().getFullYear();
    const count = all.filter(o => o.numero && o.numero.includes(String(year))).length;
    return `OS-${year}-${String(count + 1).padStart(3, '0')}`;
  }

  // ================================================================
  // RENDER PRINCIPAL
  // ================================================================
  function render() {
    renderStats();
    renderList();
  }

  function renderStats() {
    const el = document.getElementById('osStats');
    if (!el) return;
    const all = DB.OS.getAll();
    const abertas     = all.filter(o => o.status === 'aberta').length;
    const emAndamento = all.filter(o => ['diagnostico','aprovada','em_execucao','pausada','aguardando_peca'].includes(o.status)).length;
    const aguardando  = all.filter(o => ['aguardando_aprovacao','aguardando_validacao'].includes(o.status)).length;
    const concluidas  = all.filter(o => o.status === 'concluida').length;
    const mesAtual    = new Date().getMonth();
    const totalMes    = all.filter(o => new Date(o.criadoEm).getMonth() === mesAtual).length;

    el.innerHTML = `
      <div class="stat-card" style="--stat-color:#EF4444;--stat-bg:rgba(239,68,68,0.08)">
        <div class="stat-top"><div class="stat-icon"><i class="fa-solid fa-circle-dot"></i></div></div>
        <div class="stat-value">${abertas}</div>
        <div class="stat-label">Abertas</div>
        <div class="stat-sub">aguardando início</div>
      </div>
      <div class="stat-card" style="--stat-color:#6366F1;--stat-bg:rgba(99,102,241,0.08)">
        <div class="stat-top"><div class="stat-icon"><i class="fa-solid fa-gears"></i></div></div>
        <div class="stat-value">${emAndamento}</div>
        <div class="stat-label">Em Andamento</div>
        <div class="stat-sub">diagnóstico / execução</div>
      </div>
      <div class="stat-card" style="--stat-color:#F59E0B;--stat-bg:rgba(245,158,11,0.08)">
        <div class="stat-top"><div class="stat-icon"><i class="fa-solid fa-clock"></i></div></div>
        <div class="stat-value">${aguardando}</div>
        <div class="stat-label">Aguardando</div>
        <div class="stat-sub">aprovação ou validação</div>
      </div>
      <div class="stat-card" style="--stat-color:#10B981;--stat-bg:rgba(16,185,129,0.08)">
        <div class="stat-top"><div class="stat-icon"><i class="fa-solid fa-circle-check"></i></div></div>
        <div class="stat-value">${concluidas}</div>
        <div class="stat-label">Concluídas</div>
        <div class="stat-sub">${totalMes} este mês</div>
      </div>
    `;
  }

  function renderList() {
    const el = document.getElementById('osCardsList');
    if (!el) return;
    let all = DB.OS.getAll();

    switch (_osFilter) {
      case 'abertas':    all = all.filter(o => o.status === 'aberta'); break;
      case 'andamento':  all = all.filter(o => ['diagnostico','aprovada','em_execucao','pausada','aguardando_peca'].includes(o.status)); break;
      case 'aguardando': all = all.filter(o => ['aguardando_aprovacao','aguardando_validacao'].includes(o.status)); break;
      case 'concluidas': all = all.filter(o => o.status === 'concluida'); break;
      case 'canceladas': all = all.filter(o => o.status === 'cancelada'); break;
    }

    if (_osSearch) {
      const q = _osSearch.toLowerCase();
      all = all.filter(o =>
        Utils.matchSearch(o.numero, q) ||
        Utils.matchSearch(o.maquina, q) ||
        Utils.matchSearch(o.descricaoProblema, q) ||
        Utils.matchSearch(o.solicitante, q)
      );
    }

    all.sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''));

    if (!all.length) {
      el.innerHTML = `
        <div class="empty-state">
          <i class="fa-solid fa-file-contract"></i>
          <p>Nenhuma OS encontrada para este filtro</p>
          <button class="btn btn-primary" onclick="OS_Module.openModalNova()">
            <i class="fa-solid fa-plus"></i> Criar Ordem de Serviço
          </button>
        </div>`;
      return;
    }
    el.innerHTML = all.map(os => _cardHtml(os)).join('');
  }

  function _cardHtml(os) {
    const sc  = STATUS_CFG[os.status] || STATUS_CFG.aberta;
    const tc  = TIPO_CFG[os.tipo] || TIPO_CFG.corretiva;
    const executor = (os.execucao?.responsaveis || []).join(', ') || os.diagnostico?.tecnico || '';
    const data = Utils.formatDate((os.criadoEm || '').split('T')[0]);
    const parada = os.impactoProducao === 'parada_total';

    return `
      <div class="manut-card ${os.prioridade}" onclick="OS_Module.openModalDetalhes('${os.id}')" style="cursor:pointer">
        <div class="manut-card-header">
          <span class="manut-card-id">${os.numero}</span>
          <span class="manut-card-maquina">${Utils.escapeHTML(os.maquina)}</span>
          <span class="manut-card-status">
            <span class="badge ${sc.badgeCls}"><i class="fa-solid ${sc.icon}"></i> ${sc.label}</span>
          </span>
        </div>
        <div class="manut-card-body">
          <div class="manut-card-desc">${Utils.escapeHTML(os.descricaoProblema)}</div>
          <div class="manut-card-meta">
            <span class="meta-item"><i class="fa-solid fa-user"></i> ${Utils.escapeHTML(os.solicitante)}</span>
            <span class="meta-item"><i class="fa-solid fa-calendar"></i> ${data}</span>
            ${executor ? `<span class="meta-item"><i class="fa-solid fa-helmet-safety"></i> ${Utils.escapeHTML(executor)}</span>` : ''}
            ${parada ? `<span class="meta-item overdue pulse"><i class="fa-solid fa-circle-stop"></i> Parada Total</span>` : ''}
          </div>
        </div>
        <div class="manut-card-footer">
          <span class="manut-card-tipo ${tc.cls}"><i class="fa-solid ${tc.icon}"></i> ${tc.label}</span>
          <div class="manut-card-actions">
            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation(); OS_Module.openModalDetalhes('${os.id}')">
              <i class="fa-solid fa-eye"></i> Ver Detalhes
            </button>
            <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation(); OS_Module.imprimirOS('${os.id}')" title="Imprimir">
              <i class="fa-solid fa-print"></i>
            </button>
          </div>
        </div>
      </div>`;
  }

  // ================================================================
  // MODAL: NOVA OS
  // ================================================================
  function openModalNova() {
    Utils.setVal('osEditId', '');
    Utils.setVal('osSolicitante', '');
    Utils.setVal('osFuncao', '');
    Utils.setVal('osDescricaoProblema', '');

    // Populate machines
    const sel = document.getElementById('osMaquina');
    if (sel) {
      const nomes = DB.Maquinas.getNomes();
      sel.innerHTML = '<option value="">Selecionar máquina...</option>' +
        nomes.map(n => `<option value="${Utils.escapeHTML(n)}">${Utils.escapeHTML(n)}</option>`).join('');
    }

    // Reset radios
    _setRadio('osTipo', 'corretiva');
    _setRadio('osPrioridade', 'alta');
    _setRadio('osImpacto', 'sem_impacto');

    const t = document.getElementById('modalOsNovaTitle');
    if (t) t.innerHTML = '<i class="fa-solid fa-file-circle-plus"></i> Nova Ordem de Serviço';

    PCM.openModal('modal-os-nova');
  }

  function saveOSNova() {
    const maquina          = Utils.val('osMaquina');
    const solicitante      = Utils.val('osSolicitante').trim();
    const funcao           = Utils.val('osFuncao').trim();
    const descricaoProblema = Utils.val('osDescricaoProblema').trim();
    const tipo             = _getRadio('osTipo') || 'corretiva';
    const prioridade       = _getRadio('osPrioridade') || 'alta';
    const impactoProducao  = _getRadio('osImpacto') || 'sem_impacto';

    if (!maquina)                              { Utils.toast('Selecione a máquina', 'warning'); return; }
    if (!solicitante)                          { Utils.toast('Informe o solicitante', 'warning'); return; }
    if (!descricaoProblema || descricaoProblema.length < 15)
                                               { Utils.toast('Descreva o problema (mín. 15 caracteres)', 'warning'); return; }

    const os = DB.OS.add({ tipo, prioridade, status: 'aberta', maquina, solicitante, funcao, descricaoProblema, impactoProducao, criadoPor: solicitante });
    PCM.closeModal();
    Utils.toast(`OS ${os.numero} criada com sucesso!`, 'success');
    render();
    PCM.updateBadges();
  }

  // ================================================================
  // MODAL: DETALHES OS
  // ================================================================
  function openModalDetalhes(id) {
    const os = DB.OS.getById(id);
    if (!os) { Utils.toast('OS não encontrada', 'error'); return; }
    const el = document.getElementById('osDetalhesContent');
    if (el) el.innerHTML = _detalhesHtml(os);
    PCM.openModal('modal-os-detalhes');
  }

  function _detalhesHtml(os) {
    const sc  = STATUS_CFG[os.status] || STATUS_CFG.aberta;
    const tc  = TIPO_CFG[os.tipo] || TIPO_CFG.corretiva;

    return `
      <div class="os-header-strip">
        <div>
          <div class="os-header-meta">
            <span class="os-numero">${os.numero}</span>
            <span class="badge badge-${os.prioridade === 'critica' ? 'critica' : os.prioridade === 'alta' ? 'alta' : os.prioridade === 'media' ? 'media' : 'baixa'}">${{critica:'🔴 Crítica',alta:'🟠 Alta',media:'🟡 Média',baixa:'🟢 Baixa'}[os.prioridade]||os.prioridade}</span>
            <span class="badge badge-andamento"><i class="fa-solid ${tc.icon}"></i> ${tc.label}</span>
          </div>
          <div class="os-maquina-titulo">${Utils.escapeHTML(os.maquina)}</div>
        </div>
        <span class="badge ${sc.badgeCls}" style="font-size:13px;padding:6px 14px;align-self:flex-start">
          <i class="fa-solid ${sc.icon}"></i> ${sc.label}
        </span>
      </div>

      ${_timelineHtml(os)}

      <div class="os-detalhes-sections">
        ${_secaoAbertura(os)}
        ${os.diagnostico ? _secaoDiagnostico(os) : ''}
        ${os.aprovacao    ? _secaoAprovacao(os)   : ''}
        ${os.execucao     ? _secaoExecucao(os)     : ''}
        ${os.validacao    ? _secaoValidacao(os)    : ''}
      </div>

      ${_actionAreaHtml(os)}
    `;
  }

  function _timelineHtml(os) {
    const steps = [
      { label: 'Abertura',    icon: 'fa-circle-dot',       done: true },
      { label: 'Diagnóstico', icon: 'fa-magnifying-glass', done: !!os.diagnostico },
      { label: 'Aprovação',   icon: 'fa-clipboard-check',  done: !!os.aprovacao },
      { label: 'Execução',    icon: 'fa-wrench',           done: !!(os.execucao && os.execucao.dataTermino) },
      { label: 'Validação',   icon: 'fa-star',             done: !!os.validacao }
    ];
    const currentStep = (STATUS_CFG[os.status] || {}).step ?? 0;

    return `
      <div class="os-timeline">
        ${steps.map((s, i) => `
          <div class="os-tl-step ${s.done ? 'done' : ''} ${i === currentStep && !['concluida','cancelada'].includes(os.status) ? 'active' : ''}">
            <div class="os-tl-dot"><i class="fa-solid ${s.icon}"></i></div>
            <div class="os-tl-label">${s.label}</div>
          </div>
          ${i < steps.length - 1 ? `<div class="os-tl-line ${s.done ? 'done' : ''}"></div>` : ''}
        `).join('')}
      </div>`;
  }

  function _secaoAbertura(os) {
    return `
      <div class="os-ds-section">
        <div class="os-ds-title"><i class="fa-solid fa-circle-dot"></i> Abertura</div>
        <div class="detail-grid">
          <div class="detail-field"><label>Solicitante</label><div class="value">${Utils.escapeHTML(os.solicitante)}${os.funcao ? ' <span style="color:var(--text-muted)">— '+Utils.escapeHTML(os.funcao)+'</span>' : ''}</div></div>
          <div class="detail-field"><label>Data/Hora</label><div class="value">${Utils.formatDateTime(os.criadoEm)}</div></div>
          <div class="detail-field"><label>Impacto na Produção</label><div class="value">${{parada_total:'🔴 Parada Total',producao_reduzida:'🟡 Produção Reduzida',sem_impacto:'🟢 Sem Impacto'}[os.impactoProducao]||os.impactoProducao}</div></div>
          <div class="detail-field full"><label>Descrição do Problema</label><div class="value">${Utils.escapeHTML(os.descricaoProblema)}</div></div>
        </div>
      </div>`;
  }

  function _secaoDiagnostico(os) {
    const d = os.diagnostico;
    const temFalta = d.pecasNecessarias?.some(p => !p.emEstoque);
    return `
      <div class="os-ds-section">
        <div class="os-ds-title"><i class="fa-solid fa-magnifying-glass"></i> Diagnóstico</div>
        <div class="detail-grid">
          <div class="detail-field"><label>Técnico</label><div class="value">${Utils.escapeHTML(d.tecnico)}</div></div>
          <div class="detail-field"><label>Data</label><div class="value">${Utils.formatDateTime(d.data)}</div></div>
          <div class="detail-field full"><label>Causa Raiz</label><div class="value">${Utils.escapeHTML(d.causaRaiz)}</div></div>
          <div class="detail-field full"><label>Solução Proposta</label><div class="value">${Utils.escapeHTML(d.solucaoProposta)}</div></div>
          <div class="detail-field"><label>Tempo Estimado</label><div class="value">${d.tempoEstimado}h</div></div>
          <div class="detail-field"><label>Custo Estimado</label><div class="value">R$ ${(d.custoEstimado||0).toFixed(2)}</div></div>
          ${d.pecasNecessarias?.length ? `
            <div class="detail-field full">
              <label>Peças Necessárias ${temFalta ? '<span style="color:var(--danger)">⚠️ Faltam peças no estoque</span>' : ''}</label>
              <div class="value os-pecas-list">
                ${d.pecasNecessarias.map(p => `
                  <span class="badge ${p.emEstoque ? 'badge-media' : 'badge-critica'}" style="margin:2px">
                    ${Utils.escapeHTML(p.descricao)} ×${p.quantidade}
                    ${p.emEstoque ? '' : ' ⚠️'}
                  </span>`).join('')}
              </div>
            </div>` : ''}
        </div>
      </div>`;
  }

  function _secaoAprovacao(os) {
    const a = os.aprovacao;
    return `
      <div class="os-ds-section">
        <div class="os-ds-title"><i class="fa-solid fa-clipboard-check"></i> Aprovação</div>
        <div class="detail-grid">
          <div class="detail-field"><label>Aprovador</label><div class="value">${Utils.escapeHTML(a.aprovador)}</div></div>
          <div class="detail-field"><label>Data</label><div class="value">${Utils.formatDateTime(a.data)}</div></div>
          <div class="detail-field"><label>Decisão</label><div class="value">
            <span class="badge ${a.status === 'aprovada' ? 'badge-concluida' : 'badge-cancelada'}">
              ${a.status === 'aprovada' ? '✅ Aprovada' : '❌ Reprovada'}
            </span>
          </div></div>
          ${a.observacoes ? `<div class="detail-field full"><label>Observações</label><div class="value">${Utils.escapeHTML(a.observacoes)}</div></div>` : ''}
        </div>
      </div>`;
  }

  function _secaoExecucao(os) {
    const e = os.execucao;
    return `
      <div class="os-ds-section">
        <div class="os-ds-title"><i class="fa-solid fa-wrench"></i> Execução</div>
        <div class="detail-grid">
          <div class="detail-field"><label>Responsáveis</label><div class="value">${Utils.escapeHTML((e.responsaveis||[]).join(', '))}</div></div>
          <div class="detail-field"><label>Início</label><div class="value">${Utils.formatDateTime(e.dataInicio)}</div></div>
          ${e.dataTermino ? `<div class="detail-field"><label>Término</label><div class="value">${Utils.formatDateTime(e.dataTermino)}</div></div>` : ''}
          ${e.tempoReal != null ? `<div class="detail-field"><label>Tempo Real</label><div class="value">${e.tempoReal}h</div></div>` : ''}
          ${e.servicosRealizados ? `<div class="detail-field full"><label>Serviços Realizados</label><div class="value">${Utils.escapeHTML(e.servicosRealizados)}</div></div>` : ''}
          ${e.observacoes ? `<div class="detail-field full"><label>Observações</label><div class="value">${Utils.escapeHTML(e.observacoes)}</div></div>` : ''}
          ${e.pecasUtilizadas?.length ? `
            <div class="detail-field full">
              <label>Peças Utilizadas</label>
              <div class="value os-pecas-list">
                ${e.pecasUtilizadas.map(p => `
                  <span class="badge badge-andamento" style="margin:2px">
                    ${Utils.escapeHTML(p.descricao)} ×${p.quantidade} → R$ ${(p.custoTotal||0).toFixed(2)}
                  </span>`).join('')}
              </div>
            </div>` : ''}
          ${e.custoTotal != null && e.custoTotal > 0 ? `
            <div class="detail-field">
              <label>Custo Peças</label>
              <div class="value">R$ ${(e.custoPecas||0).toLocaleString('pt-BR', {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            </div>
            <div class="detail-field">
              <label>Custo Mão de Obra</label>
              <div class="value">R$ ${(e.custoMaoDeObra||0).toLocaleString('pt-BR', {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            </div>
            <div class="detail-field" style="font-weight:700;color:var(--primary)">
              <label>Custo Total</label>
              <div class="value">R$ ${(e.custoTotal||0).toLocaleString('pt-BR', {minimumFractionDigits:2,maximumFractionDigits:2})}</div>
            </div>` : ''}
        </div>
      </div>`;
  }

  function _secaoValidacao(os) {
    const v = os.validacao;
    return `
      <div class="os-ds-section">
        <div class="os-ds-title"><i class="fa-solid fa-star"></i> Validação</div>
        <div class="detail-grid">
          <div class="detail-field"><label>Validador</label><div class="value">${Utils.escapeHTML(v.validador)}</div></div>
          <div class="detail-field"><label>Data</label><div class="value">${Utils.formatDateTime(v.data)}</div></div>
          <div class="detail-field"><label>Resultado</label><div class="value">
            <span class="badge ${v.funcionamentoOK ? 'badge-concluida' : 'badge-cancelada'}">
              ${v.funcionamentoOK ? '✅ Funcionando OK' : '⚠️ Com problemas'}
            </span>
          </div></div>
          ${v.observacoes ? `<div class="detail-field full"><label>Observações</label><div class="value">${Utils.escapeHTML(v.observacoes)}</div></div>` : ''}
          ${v.proximaManutencao ? `<div class="detail-field"><label>Próxima Manutenção</label><div class="value">${Utils.formatDate(v.proximaManutencao)}</div></div>` : ''}
        </div>
      </div>`;
  }

  // ---- Área de Ação por Status ----
  function _actionAreaHtml(os) {
    if (['concluida', 'cancelada'].includes(os.status)) {
      return `<div class="os-action-area os-action-done">
        <i class="fa-solid fa-${os.status === 'concluida' ? 'circle-check' : 'ban'}" style="font-size:24px"></i>
        <span>OS ${os.status === 'concluida' ? 'Concluída com Sucesso' : 'Cancelada'}</span>
      </div>`;
    }

    const respOptions = DB.Responsaveis.getNomes().map(n => `<option value="${Utils.escapeHTML(n)}">`).join('');
    const id = os.id;

    const actions = {
      aberta: `
        <div class="os-action-title"><i class="fa-solid fa-magnifying-glass"></i> Iniciar Diagnóstico</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">Técnico Responsável</label>
            <input type="text" id="osDiagTecnico" placeholder="Nome do técnico" list="osDiagRespList">
            <datalist id="osDiagRespList">${respOptions}</datalist>
          </div>
          <div class="form-group">
            <label class="form-label required">Tempo Estimado (h)</label>
            <input type="number" id="osDiagTempo" min="0.5" step="0.5" value="2">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Causa Raiz</label>
          <textarea id="osDiagCausaRaiz" rows="2" placeholder="Descreva a causa raiz identificada..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label required">Solução Proposta</label>
          <textarea id="osDiagSolucao" rows="2" placeholder="Descreva a solução proposta..."></textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Peças Necessárias <span class="field-hint">(separadas por vírgula)</span></label>
          <input type="text" id="osDiagPecas" placeholder="Ex: Rolamento 6007, Disjuntor 40A">
        </div>
        <div class="os-action-btns">
          <button class="btn btn-danger btn-sm" onclick="OS_Module.cancelarOS('${id}')"><i class="fa-solid fa-ban"></i> Cancelar OS</button>
          <button class="btn btn-primary" onclick="OS_Module.saveDiagnostico('${id}')"><i class="fa-solid fa-paper-plane"></i> Enviar para Aprovação</button>
        </div>`,

      diagnostico: `
        <div class="os-action-title"><i class="fa-solid fa-magnifying-glass"></i> Completar Diagnóstico</div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label required">Técnico</label>
            <input type="text" id="osDiagTecnico" value="${Utils.escapeHTML(os.diagnostico?.tecnico||'')}" list="osDiagRespList2">
            <datalist id="osDiagRespList2">${respOptions}</datalist>
          </div>
          <div class="form-group">
            <label class="form-label required">Tempo Estimado (h)</label>
            <input type="number" id="osDiagTempo" min="0.5" step="0.5" value="${os.diagnostico?.tempoEstimado||2}">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label required">Causa Raiz</label>
          <textarea id="osDiagCausaRaiz" rows="2">${Utils.escapeHTML(os.diagnostico?.causaRaiz||'')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label required">Solução Proposta</label>
          <textarea id="osDiagSolucao" rows="2">${Utils.escapeHTML(os.diagnostico?.solucaoProposta||'')}</textarea>
        </div>
        <div class="form-group">
          <label class="form-label">Peças Necessárias</label>
          <input type="text" id="osDiagPecas" value="${Utils.escapeHTML((os.diagnostico?.pecasNecessarias||[]).map(p=>p.descricao).join(', '))}">
        </div>
        <div class="os-action-btns">
          <button class="btn btn-primary" onclick="OS_Module.saveDiagnostico('${id}')"><i class="fa-solid fa-paper-plane"></i> Enviar para Aprovação</button>
        </div>`,

      aguardando_aprovacao: `
        <div class="os-action-title"><i class="fa-solid fa-clipboard-check"></i> Aprovar ou Reprovar</div>
        <div class="form-group">
          <label class="form-label required">Aprovador</label>
          <input type="text" id="osAprovador" placeholder="Nome do aprovador">
        </div>
        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea id="osAprovObs" rows="2" placeholder="Motivo da aprovação ou reprovação..."></textarea>
        </div>
        <div class="os-action-btns">
          <button class="btn btn-danger" onclick="OS_Module.saveAprovacao('${id}', false)"><i class="fa-solid fa-xmark"></i> Reprovar</button>
          <button class="btn btn-success" onclick="OS_Module.saveAprovacao('${id}', true)"><i class="fa-solid fa-check"></i> Aprovar OS</button>
        </div>`,

      aprovada: `
        <div class="os-action-title"><i class="fa-solid fa-play"></i> Iniciar Execução</div>
        <div class="form-group">
          <label class="form-label required">Técnico(s) Executores</label>
          <input type="text" id="osExecResp" placeholder="Ex: Jailto Ferrbel, Fábio Junior" list="osExecRespList">
          <datalist id="osExecRespList">${respOptions}</datalist>
        </div>
        <div class="os-action-btns">
          <button class="btn btn-primary" onclick="OS_Module.startExecucao('${id}')"><i class="fa-solid fa-play"></i> Iniciar Execução</button>
        </div>`,

      em_execucao: `
        <div class="os-action-title"><i class="fa-solid fa-flag-checkered"></i> Concluir Execução</div>
        <div class="form-group">
          <label class="form-label required">Serviços Realizados</label>
          <textarea id="osExecServicos" rows="3" placeholder="Descreva tudo que foi realizado..."></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Peças Utilizadas <span class="field-hint">(Ex: 2x Rolamento, 1x Disjuntor)</span></label>
            <input type="text" id="osExecPecas" placeholder="2x Rolamento 6007, 1x Disjuntor 40A">
          </div>
          <div class="form-group">
            <label class="form-label">Tempo Real (h)</label>
            <input type="number" id="osExecTempo" min="0.5" step="0.5" placeholder="Ex: 2.5">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea id="osExecObs" rows="2" placeholder="Observações finais..."></textarea>
        </div>
        <div class="os-action-btns">
          <button class="btn btn-warning btn-sm" onclick="OS_Module.pausarOS('${id}')"><i class="fa-solid fa-pause"></i> Pausar</button>
          <button class="btn btn-secondary btn-sm" onclick="OS_Module.aguardarPeca('${id}')"><i class="fa-solid fa-box"></i> Ag. Peça</button>
          <button class="btn btn-primary" onclick="OS_Module.concludeExecucao('${id}')"><i class="fa-solid fa-flag-checkered"></i> Concluir Execução</button>
        </div>`,

      pausada: `
        <div class="os-action-title" style="color:var(--warning)"><i class="fa-solid fa-pause"></i> OS Pausada</div>
        <p style="font-size:13px;color:var(--text-muted);margin:8px 0 16px">Retome quando as condições permitirem.</p>
        <div class="os-action-btns">
          <button class="btn btn-danger btn-sm" onclick="OS_Module.cancelarOS('${id}')"><i class="fa-solid fa-ban"></i> Cancelar</button>
          <button class="btn btn-primary" onclick="OS_Module.retomarOS('${id}')"><i class="fa-solid fa-play"></i> Retomar Execução</button>
        </div>`,

      aguardando_peca: `
        <div class="os-action-title" style="color:var(--warning)"><i class="fa-solid fa-box"></i> Aguardando Peça</div>
        <p style="font-size:13px;color:var(--text-muted);margin:8px 0 16px">OS aguardando chegada de peças/materiais.</p>
        <div class="os-action-btns">
          <button class="btn btn-primary" onclick="OS_Module.pecaChegou('${id}')"><i class="fa-solid fa-box-open"></i> Peça Chegou — Retomar</button>
        </div>`,

      aguardando_validacao: `
        <div class="os-action-title"><i class="fa-solid fa-star"></i> Validar Execução</div>
        <div class="form-group">
          <label class="form-label required">Validador</label>
          <input type="text" id="osValidador" placeholder="Nome do validador">
        </div>
        <div class="form-group">
          <label class="form-label">Próxima Manutenção</label>
          <input type="date" id="osProximaManutencao">
        </div>
        <div class="form-group">
          <label class="form-label">Observações</label>
          <textarea id="osValidObs" rows="2" placeholder="Observações da validação..."></textarea>
        </div>
        <div class="os-action-btns">
          <button class="btn btn-danger" onclick="OS_Module.saveValidacao('${id}', false)"><i class="fa-solid fa-rotate-left"></i> Problema Persiste</button>
          <button class="btn btn-success" onclick="OS_Module.saveValidacao('${id}', true)"><i class="fa-solid fa-check"></i> Validar OK</button>
        </div>`
    };

    const content = actions[os.status] || '';
    return content ? `<div class="os-action-area">${content}</div>` : '';
  }

  // ================================================================
  // HANDLERS DE AÇÃO
  // ================================================================
  function saveDiagnostico(id) {
    const tecnico   = Utils.val('osDiagTecnico').trim();
    const causaRaiz = Utils.val('osDiagCausaRaiz').trim();
    const solucao   = Utils.val('osDiagSolucao').trim();
    const tempo     = parseFloat(Utils.val('osDiagTempo')) || 2;
    const pecasTxt  = Utils.val('osDiagPecas');

    if (!tecnico)   { Utils.toast('Informe o técnico responsável', 'warning'); return; }
    if (!causaRaiz) { Utils.toast('Descreva a causa raiz', 'warning'); return; }
    if (!solucao)   { Utils.toast('Descreva a solução proposta', 'warning'); return; }

    const allPecas = DB.Pecas.getAll();
    const pecasNecessarias = pecasTxt
      ? pecasTxt.split(',').map(s => {
          const desc = s.trim();
          if (!desc) return null;
          const found = allPecas.find(p => Utils.matchSearch(p.descricao, desc.toLowerCase()));
          return {
            descricao: desc,
            codigoPeca: found?.codigo || '',
            quantidade: 1,
            unidade: found?.unidade || 'un',
            emEstoque: found ? (found.estoqueAtual || 0) > 0 : false,
            quantidadeEstoque: found?.estoqueAtual || 0,
            custoUnitario: found?.custo || 0
          };
        }).filter(Boolean)
      : [];

    const custoEstimado = pecasNecessarias.reduce((s, p) => s + p.custoUnitario * p.quantidade, 0);
    const semEstoque    = pecasNecessarias.some(p => !p.emEstoque);

    DB.OS.update(id, {
      status: 'aguardando_aprovacao',
      diagnostico: { tecnico, data: Utils.nowISO(), causaRaiz, solucaoProposta: solucao, pecasNecessarias, tempoEstimado: tempo, custoEstimado }
    });

    PCM.closeModal();
    Utils.toast('Diagnóstico salvo! OS enviada para aprovação.', 'success');
    if (semEstoque) setTimeout(() => Utils.toast('⚠️ Uma ou mais peças não estão em estoque!', 'warning'), 400);
    render(); PCM.updateBadges();
  }

  function saveAprovacao(id, aprovado) {
    const aprovador = Utils.val('osAprovador').trim();
    const obs       = Utils.val('osAprovObs').trim();
    if (!aprovador) { Utils.toast('Informe o aprovador', 'warning'); return; }

    DB.OS.update(id, {
      status: aprovado ? 'aprovada' : 'aberta',
      aprovacao: { aprovador, data: Utils.nowISO(), status: aprovado ? 'aprovada' : 'reprovada', observacoes: obs }
    });
    PCM.closeModal();
    Utils.toast(aprovado ? '✅ OS Aprovada!' : '❌ OS reprovada — voltando para abertura', aprovado ? 'success' : 'warning');
    render(); PCM.updateBadges();
  }

  function startExecucao(id) {
    const resp = Utils.val('osExecResp').trim();
    if (!resp) { Utils.toast('Informe os executores', 'warning'); return; }
    DB.OS.update(id, {
      status: 'em_execucao',
      execucao: { responsaveis: resp.split(',').map(r => r.trim()).filter(Boolean), dataInicio: Utils.nowISO(), pecasUtilizadas: [], servicosRealizados: '', observacoes: '' }
    });
    PCM.closeModal();
    Utils.toast('Execução iniciada!', 'success');
    render(); PCM.updateBadges();
  }

  function concludeExecucao(id) {
    const servicos  = Utils.val('osExecServicos').trim();
    const pecasTxt  = Utils.val('osExecPecas');
    const tempoReal = parseFloat(Utils.val('osExecTempo')) || null;
    const obs       = Utils.val('osExecObs').trim();
    if (!servicos)  { Utils.toast('Descreva os serviços realizados', 'warning'); return; }

    const os = DB.OS.getById(id);
    const execAtual = os?.execucao || {};
    const allPecas  = DB.Pecas.getAll();

    const pecasUtilizadas = pecasTxt
      ? pecasTxt.split(',').map(s => {
          const m    = s.trim().match(/^(\d+)\s*[x×]\s*(.+)$/i) || [null, 1, s.trim()];
          const qty  = parseInt(m[1]) || 1;
          const desc = (m[2] || s).trim();
          if (!desc) return null;
          const found = allPecas.find(p => Utils.matchSearch(p.descricao, desc.toLowerCase()));
          if (found) {
            DB.Pecas.updateEstoque(found.id, -qty);
            DB.Movimentacoes.add({ tipo: 'saida', itemId: found.id, descricaoItem: found.descricao, quantidade: qty, quantidadeAntes: found.estoqueAtual, quantidadeDepois: Math.max(0, (found.estoqueAtual||0) - qty), motivo: `OS ${os?.numero}`, osRelacionada: os?.numero, responsavel: (execAtual.responsaveis||[]).join(', ') });
          }
          return { descricao: desc, codigoPeca: found?.codigo||'', quantidade: qty, custoUnitario: found?.custo||0, custoTotal: (found?.custo||0) * qty };
        }).filter(Boolean)
      : [];

    // ---- Calcular custo ----
    const custoPecas = pecasUtilizadas.reduce((s, p) => s + (p.custoTotal || 0), 0);
    const respNome = (execAtual.responsaveis || [])[0] || '';
    const respObj = DB.Responsaveis ? DB.Responsaveis.getAll().find(r => r.nome === respNome) : null;
    const custoHora = respObj?.custoHora || 0;
    const custoMaoDeObra = (tempoReal || 0) * custoHora;
    const custoTotal = custoPecas + custoMaoDeObra;

    DB.OS.update(id, {
      status: 'aguardando_validacao',
      execucao: {
        ...execAtual,
        dataTermino: Utils.nowISO(),
        tempoReal,
        pecasUtilizadas,
        servicosRealizados: servicos,
        observacoes: obs,
        custoPecas,
        custoMaoDeObra,
        custoTotal
      }
    });
    PCM.closeModal();
    Utils.toast('Execução concluída! Aguardando validação.', 'success');
    render(); PCM.updateBadges();
  }

  function pausarOS(id)    { DB.OS.update(id, { status: 'pausada' });       PCM.closeModal(); Utils.toast('OS pausada', 'warning');          render(); PCM.updateBadges(); }
  function retomarOS(id)   { DB.OS.update(id, { status: 'em_execucao' });   PCM.closeModal(); Utils.toast('OS retomada!', 'success');         render(); PCM.updateBadges(); }
  function aguardarPeca(id){ DB.OS.update(id, { status: 'aguardando_peca'});PCM.closeModal(); Utils.toast('OS aguardando peça', 'warning');   render(); PCM.updateBadges(); }
  function pecaChegou(id)  { DB.OS.update(id, { status: 'em_execucao' });   PCM.closeModal(); Utils.toast('Execução retomada!', 'success');   render(); PCM.updateBadges(); }

  function saveValidacao(id, ok) {
    const validador = Utils.val('osValidador').trim();
    const obs       = Utils.val('osValidObs').trim();
    const proxima   = Utils.val('osProximaManutencao') || null;
    if (!validador) { Utils.toast('Informe o validador', 'warning'); return; }
    DB.OS.update(id, {
      status: ok ? 'concluida' : 'em_execucao',
      validacao: { validador, data: Utils.nowISO(), funcionamentoOK: ok, observacoes: obs, proximaManutencao: proxima }
    });
    PCM.closeModal();
    Utils.toast(ok ? '✅ OS concluída e validada!' : '⚠️ OS voltando para execução', ok ? 'success' : 'warning');
    render(); PCM.updateBadges();
  }

  function cancelarOS(id) {
    if (!confirm('Confirmar cancelamento desta OS? Esta ação não pode ser desfeita.')) return;
    DB.OS.update(id, { status: 'cancelada', canceladoEm: Utils.nowISO() });
    PCM.closeModal();
    Utils.toast('OS cancelada', 'warning');
    render(); PCM.updateBadges();
  }

  // ================================================================
  // IMPRESSÃO
  // ================================================================
  function imprimirOS(id) {
    const os = DB.OS.getById(id);
    if (!os) return;
    const win = window.open('', '_blank', 'width=800,height=600');
    win.document.write(`<!DOCTYPE html><html><head><title>OS ${os.numero}</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; color: #111; font-size: 13px; }
        h1 { font-size: 20px; margin-bottom: 4px; }
        .meta { color: #666; margin-bottom: 20px; }
        h2 { font-size: 14px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-top: 20px; color: #1F4E78; }
        .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px; }
        .field label { font-size: 10px; text-transform: uppercase; color: #888; display: block; margin-bottom: 2px; }
        .field .val { font-weight: 600; }
        .assinaturas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 40px; }
        .ass-box { border-top: 1px solid #333; padding-top: 8px; text-align: center; font-size: 11px; }
        @media print { body { margin: 20px; } }
      </style></head><body>
      <h1>Ordem de Serviço — ${os.numero}</h1>
      <div class="meta">
        BR Aço | ${new Date().toLocaleDateString('pt-BR')} |
        Tipo: <strong>${os.tipo}</strong> |
        Prioridade: <strong>${os.prioridade}</strong> |
        Status: <strong>${(STATUS_CFG[os.status]||{}).label||os.status}</strong>
      </div>
      <h2>1. Abertura</h2>
      <div class="grid">
        <div class="field"><label>Máquina</label><div class="val">${os.maquina}</div></div>
        <div class="field"><label>Solicitante</label><div class="val">${os.solicitante} ${os.funcao?'('+os.funcao+')':''}</div></div>
        <div class="field"><label>Data</label><div class="val">${new Date(os.criadoEm).toLocaleString('pt-BR')}</div></div>
        <div class="field"><label>Impacto</label><div class="val">${{parada_total:'Parada Total',producao_reduzida:'Produção Reduzida',sem_impacto:'Sem Impacto'}[os.impactoProducao]||''}</div></div>
        <div class="field" style="grid-column:1/-1"><label>Descrição do Problema</label><div class="val">${os.descricaoProblema}</div></div>
      </div>
      ${os.diagnostico ? `<h2>2. Diagnóstico</h2><div class="grid">
        <div class="field"><label>Técnico</label><div class="val">${os.diagnostico.tecnico}</div></div>
        <div class="field"><label>Tempo Estimado</label><div class="val">${os.diagnostico.tempoEstimado}h</div></div>
        <div class="field" style="grid-column:1/-1"><label>Causa Raiz</label><div class="val">${os.diagnostico.causaRaiz}</div></div>
        <div class="field" style="grid-column:1/-1"><label>Solução Proposta</label><div class="val">${os.diagnostico.solucaoProposta}</div></div>
      </div>` : ''}
      ${os.execucao ? `<h2>3. Execução</h2><div class="grid">
        <div class="field"><label>Responsáveis</label><div class="val">${(os.execucao.responsaveis||[]).join(', ')}</div></div>
        <div class="field"><label>Tempo Real</label><div class="val">${os.execucao.tempoReal||'—'}h</div></div>
        <div class="field" style="grid-column:1/-1"><label>Serviços Realizados</label><div class="val">${os.execucao.servicosRealizados||'—'}</div></div>
      </div>` : ''}
      <div class="assinaturas">
        <div class="ass-box">Técnico Executor<br><br><br></div>
        <div class="ass-box">Validador<br><br><br></div>
        <div class="ass-box">Coordenador<br><br><br></div>
      </div>
      <script>window.onload=()=>window.print();<\/script>
    </body></html>`);
    win.document.close();
  }

  // ================================================================
  // FILTROS
  // ================================================================
  function setFilter(f) {
    _osFilter = f;
    document.querySelectorAll('#osFilterTabs .filter-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.filter === f);
    });
    renderList();
  }

  function setSearch(q) {
    _osSearch = q;
    renderList();
  }

  // ================================================================
  // HELPERS
  // ================================================================
  function _setRadio(name, val) {
    const r = document.querySelector(`input[name="${name}"][value="${val}"]`);
    if (r) r.checked = true;
  }

  function _getRadio(name) {
    return document.querySelector(`input[name="${name}"]:checked`)?.value;
  }

  // ================================================================
  // PUBLIC API
  // ================================================================
  return {
    render, renderStats,
    openModalNova, saveOSNova,
    openModalDetalhes,
    saveDiagnostico, saveAprovacao,
    startExecucao, concludeExecucao,
    pausarOS, retomarOS, aguardarPeca, pecaChegou, saveValidacao,
    cancelarOS, imprimirOS,
    setFilter, setSearch
  };
})();
