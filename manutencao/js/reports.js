/* ================================================================
   PCM BR AÇO - Reports & KPIs
   ================================================================ */

const Reports = (() => {

  function getPeriodFilter(period) {
    const now = new Date();
    switch(period) {
      case 'mes': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear(), now.getMonth()+1, 0).toISOString().split('T')[0];
        return { start, end };
      }
      case 'trimestre': {
        const q = Math.floor(now.getMonth() / 3);
        const start = new Date(now.getFullYear(), q*3, 1).toISOString().split('T')[0];
        const end = new Date(now.getFullYear(), q*3+3, 0).toISOString().split('T')[0];
        return { start, end };
      }
      case 'ano': {
        return { start: now.getFullYear() + '-01-01', end: now.getFullYear() + '-12-31' };
      }
      default: return { start: '2000-01-01', end: '2099-12-31' };
    }
  }

  function filterByPeriod(items, period) {
    const { start, end } = getPeriodFilter(period);
    return items.filter(m => {
      const d = m.criadoEm ? m.criadoEm.split('T')[0] : (m.dataPrevista || '');
      return d >= start && d <= end;
    });
  }

  function calcKPIs(period) {
    const all = DB.Manutencao.getAll();
    const filtered = filterByPeriod(all, period);
    const concluidas = filtered.filter(m => m.status === 'concluida');
    const preventivas = filtered.filter(m => m.tipo === 'preventiva');
    const corretivas = filtered.filter(m => m.tipo === 'corretiva');
    const prevConc = concluidas.filter(m => m.tipo === 'preventiva');
    const atrasadas = filtered.filter(m => Utils.isOverdue(m.dataPrevista, m.status));

    // Avg repair time
    const tempos = concluidas.filter(m => m.tempoReal).map(m => m.tempoReal);
    const avgRepairTime = tempos.length ? (tempos.reduce((a,b) => a+b, 0) / tempos.length / 60).toFixed(1) : 0;

    // Preventiva compliance
    const prevTotal = preventivas.length;
    const prevConclPct = prevTotal ? Math.round((prevConc.length / prevTotal) * 100) : 0;

    // Machine availability (simplified: based on corretivas paradas)
    const maquinas = DB.Maquinas.getAll();
    const totalMaq = maquinas.filter(m => m.status !== 'inativa').length;

    // Hours stopped (from completed corretivas with tempo real)
    const horasParadas = corretivas.filter(m => m.tempoReal).reduce((a,m) => a + (m.tempoReal/60), 0).toFixed(1);

    return {
      total: filtered.length,
      concluidas: concluidas.length,
      pendentes: filtered.filter(m => m.status === 'pendente').length,
      andamento: filtered.filter(m => m.status === 'andamento').length,
      preventivas: preventivas.length,
      corretivas: corretivas.length,
      atrasadas: atrasadas.length,
      prevConclPct,
      avgRepairTime,
      horasParadas,
      totalMaquinas: totalMaq,
      period
    };
  }

  function renderKPIGrid(period) {
    const kpi = calcKPIs(period);
    const container = document.getElementById('kpiGrid');
    if (!container) return;

    const periodLabel = { mes: 'Este Mês', trimestre: 'Trimestre', ano: 'Este Ano', total: 'Todo o Período' }[period] || period;

    container.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-title">Total de Manutenções</div>
        <div class="kpi-value">${kpi.total}</div>
        <div class="kpi-meta">${periodLabel}</div>
        <div class="kpi-trend neutral"><i class="fa-solid fa-chart-line"></i> ${kpi.preventivas} prev. / ${kpi.corretivas} corr.</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Concluídas</div>
        <div class="kpi-value">${kpi.concluidas}<span class="kpi-unit"> / ${kpi.total}</span></div>
        <div class="kpi-progress">
          <div class="kpi-progress-bar">
            <div class="kpi-progress-fill" style="width:${Utils.pct(kpi.concluidas, kpi.total)}%; background:${Utils.colorByPct(Utils.pct(kpi.concluidas, kpi.total))}"></div>
          </div>
        </div>
        <div class="kpi-meta">${Utils.pct(kpi.concluidas, kpi.total)}% concluídas</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Preventivas Realizadas</div>
        <div class="kpi-value">${kpi.prevConclPct}<span class="kpi-unit">%</span></div>
        <div class="kpi-progress">
          <div class="kpi-progress-bar">
            <div class="kpi-progress-fill" style="width:${kpi.prevConclPct}%; background:${Utils.colorByPct(kpi.prevConclPct)}"></div>
          </div>
        </div>
        <div class="kpi-meta">Meta: 100% <span class="${kpi.prevConclPct >= 90 ? 'kpi-trend good' : 'kpi-trend bad'}">${kpi.prevConclPct >= 90 ? '✅' : '⚠️'}</span></div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">MTTR (Tempo Médio Reparo)</div>
        <div class="kpi-value">${kpi.avgRepairTime}<span class="kpi-unit"> h</span></div>
        <div class="kpi-meta">Baseado em ${DB.Manutencao.getAll().filter(m=>m.tempoReal).length} registros</div>
        <div class="kpi-trend ${parseFloat(kpi.avgRepairTime) <= 4 ? 'good' : 'bad'}">
          <i class="fa-solid fa-clock"></i> Meta: ≤ 4h ${parseFloat(kpi.avgRepairTime) <= 4 ? '✅' : '🔴'}
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Atrasadas</div>
        <div class="kpi-value ${kpi.atrasadas > 0 ? 'danger' : ''}">${kpi.atrasadas}</div>
        <div class="kpi-meta">Manutenções com prazo vencido</div>
        <div class="kpi-trend ${kpi.atrasadas === 0 ? 'good' : 'bad'}">
          ${kpi.atrasadas === 0 ? '<i class="fa-solid fa-check"></i> Tudo em dia ✅' : '<i class="fa-solid fa-triangle-exclamation"></i> Requer atenção 🔴'}
        </div>
      </div>
      <div class="kpi-card">
        <div class="kpi-title">Horas de Parada</div>
        <div class="kpi-value">${kpi.horasParadas}<span class="kpi-unit"> h</span></div>
        <div class="kpi-meta">Paradas por manutenção corretiva</div>
        <div class="kpi-trend ${parseFloat(kpi.horasParadas) <= 8 ? 'good' : 'bad'}">
          <i class="fa-solid fa-stop-circle"></i> ${kpi.corretivas} corretivas no período
        </div>
      </div>
    `;

    // Fix danger style
    container.querySelectorAll('.kpi-value.danger').forEach(el => { el.style.color = 'var(--danger)'; });
  }

  function renderChartMaquina(period) {
    const all = filterByPeriod(DB.Manutencao.getAll(), period);
    const counts = {};
    all.forEach(m => { counts[m.maquina] = (counts[m.maquina] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]).slice(0, 10);
    const max = sorted.length ? sorted[0][1] : 1;

    const colors = ['#4A90E2','#E74C3C','#27AE60','#F39C12','#9B59B6','#3498DB','#E67E22','#1ABC9C','#E91E63','#FF5722'];

    const container = document.getElementById('chartMaquina');
    if (!container) return;
    if (!sorted.length) { container.innerHTML = '<div class="loading">Sem dados no período</div>'; return; }

    container.innerHTML = sorted.map(([maq, cnt], i) => `
      <div class="chart-bar-row">
        <div class="chart-bar-label" title="${Utils.escapeHTML(maq)}">${Utils.escapeHTML(Utils.truncate(maq, 16))}</div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width:${Math.round((cnt/max)*100)}%; background:${colors[i%colors.length]}">${cnt}</div>
        </div>
        <div class="chart-bar-value">${cnt}</div>
      </div>
    `).join('');
  }

  function renderChartTipo(period) {
    const all = filterByPeriod(DB.Manutencao.getAll(), period);
    const total = all.length || 1;
    const prev = all.filter(m => m.tipo === 'preventiva').length;
    const corr = all.filter(m => m.tipo === 'corretiva').length;

    const container = document.getElementById('chartTipo');
    if (!container) return;

    const prevPct = Math.round((prev/total)*100);
    const corrPct = Math.round((corr/total)*100);

    container.innerHTML = `
      <div style="padding:16px">
        <div style="height:16px; background:var(--bg); border-radius:8px; overflow:hidden; display:flex; margin-bottom:16px;">
          <div style="width:${prevPct}%; background:var(--success); transition:width 1s ease;"></div>
          <div style="width:${corrPct}%; background:var(--danger); transition:width 1s ease;"></div>
        </div>
        <div class="pie-legend">
          <div class="pie-legend-item">
            <div class="pie-legend-dot" style="background:var(--success)"></div>
            <span class="pie-legend-label">Preventivas</span>
            <span class="pie-legend-value">${prev}</span>
            <span class="pie-legend-pct">${prevPct}%</span>
          </div>
          <div class="pie-legend-item">
            <div class="pie-legend-dot" style="background:var(--danger)"></div>
            <span class="pie-legend-label">Corretivas</span>
            <span class="pie-legend-value">${corr}</span>
            <span class="pie-legend-pct">${corrPct}%</span>
          </div>
          <div class="pie-legend-item">
            <div class="pie-legend-dot" style="background:var(--warning)"></div>
            <span class="pie-legend-label">Concluídas</span>
            <span class="pie-legend-value">${all.filter(m=>m.status==='concluida').length}</span>
            <span class="pie-legend-pct">${Math.round(all.filter(m=>m.status==='concluida').length/total*100)}%</span>
          </div>
          <div class="pie-legend-item">
            <div class="pie-legend-dot" style="background:var(--danger)"></div>
            <span class="pie-legend-label">Atrasadas</span>
            <span class="pie-legend-value">${all.filter(m=>Utils.isOverdue(m.dataPrevista,m.status)).length}</span>
            <span class="pie-legend-pct">—</span>
          </div>
        </div>
      </div>
    `;
  }

  function renderChartEquipe(period) {
    const all = filterByPeriod(DB.Manutencao.getAll(), period);
    const counts = {};
    all.forEach(m => { if (m.responsavel) counts[m.responsavel] = (counts[m.responsavel] || 0) + 1; });
    const sorted = Object.entries(counts).sort((a,b) => b[1]-a[1]);
    const max = sorted.length ? sorted[0][1] : 1;

    const container = document.getElementById('chartEquipe');
    if (!container) return;
    if (!sorted.length) { container.innerHTML = '<div class="loading">Sem dados</div>'; return; }

    const colors = ['#4A90E2','#27AE60','#F39C12','#E74C3C','#9B59B6','#3498DB'];
    container.innerHTML = sorted.map(([resp, cnt], i) => `
      <div class="chart-bar-row">
        <div class="chart-bar-label" title="${Utils.escapeHTML(resp)}">${Utils.escapeHTML(Utils.truncate(resp.split(' ')[0], 12))}</div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width:${Math.round((cnt/max)*100)}%; background:${colors[i%colors.length]}">${cnt}</div>
        </div>
        <div class="chart-bar-value">${cnt}</div>
      </div>
    `).join('');
  }

  function renderChartMensal(period) {
    const all = DB.Manutencao.getAll();
    const year = new Date().getFullYear();
    const months = {};
    for (let i = 0; i < 12; i++) months[i] = 0;

    all.filter(m => {
      const d = m.criadoEm || m.dataPrevista || '';
      return d.startsWith(year);
    }).forEach(m => {
      const d = new Date((m.criadoEm || m.dataPrevista) + (m.criadoEm ? '' : 'T00:00:00'));
      const mo = d.getMonth();
      months[mo] = (months[mo] || 0) + 1;
    });

    const monthNames = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const vals = Object.values(months);
    const max = Math.max(...vals) || 1;

    const container = document.getElementById('chartMensal');
    if (!container) return;

    container.innerHTML = monthNames.map((mn, i) => `
      <div class="chart-bar-row">
        <div class="chart-bar-label">${mn}</div>
        <div class="chart-bar-track">
          <div class="chart-bar-fill" style="width:${Math.round((vals[i]/max)*100)}%; background:${i === new Date().getMonth() ? 'var(--secondary)' : '#6FA8EE'}">${vals[i]||''}</div>
        </div>
        <div class="chart-bar-value">${vals[i]||0}</div>
      </div>
    `).join('');
  }

  function renderHistorico(period) {
    const all = filterByPeriod(DB.Manutencao.getAll(), period).slice(0, 50);
    const container = document.getElementById('historicoTable');
    if (!container) return;

    if (!all.length) { container.innerHTML = '<div class="empty-state" style="padding:30px"><i class="fa-solid fa-file"></i><p>Nenhum registro no período</p></div>'; return; }

    container.innerHTML = `
      <table class="historico-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Máquina</th>
            <th>Tipo</th>
            <th>Descrição</th>
            <th>Responsável</th>
            <th>Data Prevista</th>
            <th>Status</th>
            <th>Tempo Real</th>
          </tr>
        </thead>
        <tbody>
          ${all.map(m => `
            <tr style="cursor:pointer" onclick="PCM.showDetalhes('${m.id}')">
              <td><code style="font-size:11px">#${m.numero||'—'}</code></td>
              <td>${Utils.escapeHTML(m.maquina)}</td>
              <td>${Utils.tipoBadge(m.tipo)}</td>
              <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${Utils.escapeHTML(m.descricao)}">${Utils.escapeHTML(Utils.truncate(m.descricao, 40))}</td>
              <td>${Utils.escapeHTML(Utils.truncate(m.responsavel, 18))}</td>
              <td>${Utils.formatDate(m.dataPrevista)}</td>
              <td>${Utils.statusBadge(m.status)}</td>
              <td>${m.tempoReal ? Math.floor(m.tempoReal/60) + 'h ' + (m.tempoReal%60) + 'min' : '—'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  // ================================================================
  // INDICADORES DE MANUTENÇÃO (ativos críticos)
  // ================================================================

  /** Calcula horas de operação por semana a partir do horariosOperacao */
  function _calcHorasSemana(horarios) {
    if (!horarios) return 8 * 5; // fallback: 40h/semana
    const dias = ['seg','ter','qua','qui','sex','sab','dom'];
    return dias.reduce((sum, d) => {
      const dia = horarios[d];
      if (!dia || !dia.ativo) return sum;
      const [ih, im] = (dia.inicio || '08:00').split(':').map(Number);
      const [fh, fm] = (dia.fim   || '17:00').split(':').map(Number);
      const horas = (fh + fm/60) - (ih + im/60);
      return sum + Math.max(0, horas);
    }, 0);
  }

  /** Dias entre duas datas YYYY-MM-DD (inclusive) */
  function _daysBetween(start, end) {
    const a = new Date(start + 'T00:00:00');
    const b = new Date(end   + 'T23:59:59');
    return Math.max(1, Math.round((b - a) / (1000 * 60 * 60 * 24)));
  }

  function calcIndicadoresCriticos(period) {
    const { start, end } = getPeriodFilter(period);
    const maquinas = (DB.Maquinas ? DB.Maquinas.getAll() : [])
      .filter(m => m.ehCritico && m.status !== 'inativa');
    const osAll = DB.OS ? DB.OS.getAll() : [];

    const diasPeriodo = _daysBetween(start, end);

    return maquinas.map(maq => {
      const osCorretivas = osAll.filter(o =>
        o.maquina === maq.nome &&
        o.tipo === 'corretiva' &&
        o.status === 'concluida' &&
        o.criadoEm && o.criadoEm.split('T')[0] >= start &&
        o.criadoEm.split('T')[0] <= end
      );

      const horasSemana = _calcHorasSemana(maq.horariosOperacao);
      const horasTotalPeriodo = (diasPeriodo / 7) * horasSemana;

      const horasParada = osCorretivas.reduce((s, o) => {
        return s + (o.execucao?.tempoReal || 0); // tempoReal em horas
      }, 0);

      const horasOperando = Math.max(0, horasTotalPeriodo - horasParada);
      const nFalhas = osCorretivas.length;

      const disponibilidade = horasTotalPeriodo > 0
        ? Math.max(0, (horasOperando / horasTotalPeriodo) * 100)
        : null;

      const mtbf = nFalhas > 0 ? (horasOperando / nFalhas) : null;
      const mttr = nFalhas > 0 ? (horasParada / nFalhas) : null;

      // Custo total de manutenção para esta máquina (todo período)
      const custoManutencao = osAll
        .filter(o => o.maquina === maq.nome && o.execucao?.custoTotal)
        .reduce((s, o) => s + (o.execucao.custoTotal || 0), 0);

      // CPMV = custo / valor de reposição × 100
      const cpmv = (maq.valor > 0) ? (custoManutencao / maq.valor) * 100 : null;

      return { maq, disponibilidade, mtbf, mttr, nFalhas, horasParada, horasTotalPeriodo, custoManutencao, cpmv };
    });
  }

  function calcIMP(period) {
    const { start, end } = getPeriodFilter(period);
    const osAll = (DB.OS ? DB.OS.getAll() : []).filter(o =>
      o.status === 'concluida' &&
      o.criadoEm && o.criadoEm.split('T')[0] >= start &&
      o.criadoEm.split('T')[0] <= end
    );
    const preventivas = osAll.filter(o => o.tipo === 'preventiva').length;
    return osAll.length > 0 ? Math.round((preventivas / osAll.length) * 100) : 0;
  }

  function calcBacklog() {
    const osAtivas = (DB.OS ? DB.OS.getAll() : [])
      .filter(o => !['concluida','cancelada'].includes(o.status));
    const horasBacklog = osAtivas.reduce((s, o) =>
      s + (o.diagnostico?.tempoEstimado || 0), 0);
    return { count: osAtivas.length, horas: horasBacklog };
  }

  function calcCustos(period) {
    const { start, end } = getPeriodFilter(period);
    return (DB.OS ? DB.OS.getAll() : [])
      .filter(o =>
        o.status === 'concluida' &&
        o.criadoEm && o.criadoEm.split('T')[0] >= start &&
        o.criadoEm.split('T')[0] <= end
      )
      .reduce((s, o) => s + (o.execucao?.custoTotal || 0), 0);
  }

  function renderIndicadoresCriticos(period) {
    const contEl = document.getElementById('indicadoresCriticos');
    const tabEl  = document.getElementById('tabelaMaquinasCriticas');
    if (!contEl && !tabEl) return;

    const dados = calcIndicadoresCriticos(period);

    if (!dados.length) {
      if (contEl) contEl.innerHTML = '<div class="loading" style="padding:24px">Nenhum ativo crítico cadastrado. Marque máquinas como "Crítico" em Configurações → Máquinas.</div>';
      if (tabEl)  tabEl.innerHTML = '';
      return;
    }

    // Cards globais (médias)
    if (contEl) {
      const dispMedia = dados.filter(d => d.disponibilidade != null);
      const dispVal = dispMedia.length
        ? (dispMedia.reduce((s,d) => s + d.disponibilidade, 0) / dispMedia.length).toFixed(1)
        : null;

      const mtbfMedia = dados.filter(d => d.mtbf != null);
      const mtbfVal = mtbfMedia.length
        ? (mtbfMedia.reduce((s,d) => s + d.mtbf, 0) / mtbfMedia.length).toFixed(1)
        : null;

      const mttrMedia = dados.filter(d => d.mttr != null);
      const mttrVal = mttrMedia.length
        ? (mttrMedia.reduce((s,d) => s + d.mttr, 0) / mttrMedia.length).toFixed(1)
        : null;

      const imp = calcIMP(period);
      const nFalhasTotal = dados.reduce((s,d) => s + d.nFalhas, 0);

      const dispCor = dispVal == null ? '#6B7280' : (parseFloat(dispVal) >= 90 ? '#059669' : parseFloat(dispVal) >= 75 ? '#D97706' : '#DC2626');

      contEl.innerHTML = `
        <div class="indicador-card" style="--ind-color:${dispCor}">
          <div class="ind-icon"><i class="fa-solid fa-gauge-high"></i></div>
          <div class="ind-body">
            <div class="ind-title">Disponibilidade Média</div>
            <div class="ind-value" style="color:${dispCor}">${dispVal != null ? dispVal + '%' : '—'}</div>
            <div class="ind-meta">Ativos críticos no período • Meta ≥ 90%</div>
          </div>
        </div>
        <div class="indicador-card">
          <div class="ind-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>
          <div class="ind-body">
            <div class="ind-title">MTBF (Tempo entre Falhas)</div>
            <div class="ind-value">${mtbfVal != null ? mtbfVal + ' h' : '—'}</div>
            <div class="ind-meta">Horas operando entre falhas</div>
          </div>
        </div>
        <div class="indicador-card">
          <div class="ind-icon"><i class="fa-solid fa-screwdriver-wrench"></i></div>
          <div class="ind-body">
            <div class="ind-title">MTTR (Tempo Médio Reparo)</div>
            <div class="ind-value">${mttrVal != null ? mttrVal + ' h' : '—'}</div>
            <div class="ind-meta">Tempo médio para restaurar operação</div>
          </div>
        </div>
        <div class="indicador-card" style="--ind-color:${imp >= 70 ? '#059669' : imp >= 50 ? '#D97706' : '#DC2626'}">
          <div class="ind-icon"><i class="fa-solid fa-calendar-check"></i></div>
          <div class="ind-body">
            <div class="ind-title">IMP (Índice de Manutenção Preventiva)</div>
            <div class="ind-value" style="color:${imp >= 70 ? '#059669' : imp >= 50 ? '#D97706' : '#DC2626'}">${imp}%</div>
            <div class="ind-meta">Preventivas / Total concluídas • Meta ≥ 70%</div>
          </div>
        </div>
      `;
    }

    // Tabela por máquina
    if (tabEl) {
      if (!dados.length) { tabEl.innerHTML = ''; return; }
      tabEl.innerHTML = `
        <table class="data-table">
          <thead>
            <tr>
              <th>Ativo</th>
              <th style="text-align:center">Falhas</th>
              <th style="text-align:center">Disponibilidade</th>
              <th style="text-align:center">MTBF (h)</th>
              <th style="text-align:center">MTTR (h)</th>
              <th style="text-align:right">Custo Manutenção</th>
              <th style="text-align:center">CPMV (%)</th>
            </tr>
          </thead>
          <tbody>
            ${dados.map(d => {
              const dispTxt = d.disponibilidade != null ? d.disponibilidade.toFixed(1) + '%' : '—';
              const dispCor = d.disponibilidade == null ? '' : d.disponibilidade >= 90 ? 'color:#059669;font-weight:600' : d.disponibilidade >= 75 ? 'color:#D97706;font-weight:600' : 'color:#DC2626;font-weight:600';
              return `<tr>
                <td><strong>${Utils.escapeHTML(d.maq.nome)}</strong></td>
                <td style="text-align:center">${d.nFalhas}</td>
                <td style="text-align:center;${dispCor}">${dispTxt}</td>
                <td style="text-align:center">${d.mtbf != null ? d.mtbf.toFixed(1) : '—'}</td>
                <td style="text-align:center">${d.mttr != null ? d.mttr.toFixed(1) : '—'}</td>
                <td style="text-align:right">R$ ${d.custoManutencao.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
                <td style="text-align:center">${d.cpmv != null ? d.cpmv.toFixed(1) + '%' : '—'}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>`;
    }
  }

  function renderIndicadoresGerais(period) {
    const el = document.getElementById('indicadoresCustos');
    if (!el) return;

    const custoTotal = calcCustos(period);
    const backlog = calcBacklog();

    el.innerHTML = `
      <div class="indicador-card">
        <div class="ind-icon"><i class="fa-solid fa-dollar-sign"></i></div>
        <div class="ind-body">
          <div class="ind-title">Custo Total de Manutenção</div>
          <div class="ind-value">R$ ${custoTotal.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2})}</div>
          <div class="ind-meta">OS concluídas no período (peças + MO)</div>
        </div>
      </div>
      <div class="indicador-card" style="--ind-color:${backlog.count > 10 ? '#DC2626' : backlog.count > 5 ? '#D97706' : '#059669'}">
        <div class="ind-icon"><i class="fa-solid fa-list-check"></i></div>
        <div class="ind-body">
          <div class="ind-title">Backlog de OS</div>
          <div class="ind-value" style="color:${backlog.count > 10 ? '#DC2626' : backlog.count > 5 ? '#D97706' : '#059669'}">${backlog.count} OS</div>
          <div class="ind-meta">${backlog.horas > 0 ? '≈ ' + backlog.horas + 'h estimadas pendentes' : 'OS em aberto (sem prazo definido)'}</div>
        </div>
      </div>
    `;
  }

  function renderAll(period) {
    renderKPIGrid(period);
    renderIndicadoresCriticos(period);
    renderIndicadoresGerais(period);
    renderChartMaquina(period);
    renderChartTipo(period);
    renderChartEquipe(period);
    renderChartMensal(period);
    renderHistorico(period);
  }

  function exportPDF() {
    Utils.toast('Abrindo janela de impressão para PDF...', 'info');
    setTimeout(() => window.print(), 500);
  }

  function printReport() {
    window.print();
  }

  function exportCSVReport(period) {
    const all = filterByPeriod(DB.Manutencao.getAll(), period);
    const rows = [
      ['#', 'Tipo', 'Prioridade', 'Máquina', 'Descrição', 'Responsável', 'Data Prevista', 'Status', 'Criado Em', 'Concluído Em', 'Tempo Real (min)', 'O que foi feito', 'Peças utilizadas']
    ];
    all.forEach(m => {
      rows.push([
        m.numero || '',
        m.tipo,
        m.prioridade,
        m.maquina,
        m.descricao,
        m.responsavel,
        m.dataPrevista,
        Utils.statusLabel(m.status),
        Utils.formatDateTime(m.criadoEm),
        Utils.formatDateTime(m.concluidoEm),
        m.tempoReal || '',
        m.oQueFoiFeto || '',
        m.pecasUtilizadas || ''
      ]);
    });
    const period_label = { mes: 'mes', trimestre: 'trimestre', ano: 'ano', total: 'total' }[period] || 'relatorio';
    Utils.downloadCSV(`pcm-relatorio-${period_label}-${Utils.today()}.csv`, rows);
  }

  return { renderAll, renderKPIGrid, exportPDF, printReport, exportCSVReport };
})();
