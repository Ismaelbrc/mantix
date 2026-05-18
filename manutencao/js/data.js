/* ================================================================
   PCM BR AÇO - Data Management (MySQL via API + cache)
   ================================================================ */

const DB = (() => {

  const API_BASE = '/ismael/mantix/api/api.php';

  // Entities stored in MySQL (shared across users)
  const MYSQL_ENTITIES = new Set(['manutencoes', 'maquinas', 'responsaveis', 'pecas', 'usuarios', 'planos']);

  // Keys for localStorage entities (per-browser only)
  const LS_KEYS = {
    os:            'mantix_ordens_servico',
    movimentacoes: 'mantix_movimentacoes',
    config:        'mantix_config',
  };

  // In-memory cache (populated from MySQL on init)
  const cache = {
    manutencoes: [], maquinas: [], responsaveis: [], pecas: [],
    usuarios: [], planos: [], os: [], movimentacoes: [], config: {}
  };

  // ---- API helpers (fire-and-forget for writes) ----
  function apiCall(method, entity, body, id) {
    let url = `${API_BASE}?entity=${encodeURIComponent(entity)}`;
    if (id) url += `&id=${encodeURIComponent(id)}`;
    return fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: (body && method !== 'DELETE' && method !== 'GET') ? JSON.stringify(body) : undefined
    }).catch(e => console.warn('[PCM API]', method, entity, e.message));
  }

  // ---- CRUD Helpers ----
  function getAll(key) {
    if (MYSQL_ENTITIES.has(key)) return [...(cache[key] || [])];
    return Utils.lsGet(LS_KEYS[key] || `mantix_${key}`, []);
  }

  function saveAll(key, data) {
    if (MYSQL_ENTITIES.has(key)) {
      cache[key] = Array.isArray(data) ? [...data] : data;
      // Note: bulk saveAll doesn't sync individual records to MySQL.
      // Use add/update/remove for individual changes.
    } else {
      if (LS_KEYS[key]) Utils.lsSet(LS_KEYS[key], data);
    }
  }

  function getById(key, id) {
    return getAll(key).find(i => i.id === id) || null;
  }

  function add(key, item) {
    if (!item.id) item.id = Utils.generateId();
    item.criadoEm = item.criadoEm || Utils.nowISO();

    if (MYSQL_ENTITIES.has(key)) {
      cache[key] = [...(cache[key] || []), item];
      apiCall('POST', key, item);
      return item;
    }

    // localStorage entity
    const all = Utils.lsGet(LS_KEYS[key] || `mantix_${key}`, []);
    all.push(item);
    Utils.lsSet(LS_KEYS[key] || `mantix_${key}`, all);
    return item;
  }

  function update(key, id, changes) {
    if (MYSQL_ENTITIES.has(key)) {
      const all = cache[key] || [];
      const idx = all.findIndex(i => i.id === id);
      if (idx === -1) return false;
      const updated = { ...all[idx], ...changes, atualizadoEm: Utils.nowISO() };
      cache[key] = [...all.slice(0, idx), updated, ...all.slice(idx + 1)];
      apiCall('PUT', key, changes, id);
      return updated;
    }

    // localStorage entity
    const all = Utils.lsGet(LS_KEYS[key] || `mantix_${key}`, []);
    const idx = all.findIndex(i => i.id === id);
    if (idx === -1) return false;
    all[idx] = { ...all[idx], ...changes, atualizadoEm: Utils.nowISO() };
    Utils.lsSet(LS_KEYS[key] || `mantix_${key}`, all);
    return all[idx];
  }

  function remove(key, id) {
    if (MYSQL_ENTITIES.has(key)) {
      cache[key] = (cache[key] || []).filter(i => i.id !== id);
      apiCall('DELETE', key, null, id);
      return true;
    }

    const all = Utils.lsGet(LS_KEYS[key] || `mantix_${key}`, []).filter(i => i.id !== id);
    Utils.lsSet(LS_KEYS[key] || `mantix_${key}`, all);
    return true;
  }

  // ---- Init: load all MySQL entities ----
  async function init() {
    try {
      const entities = [...MYSQL_ENTITIES];
      const results = await Promise.all(
        entities.map(e =>
          fetch(`${API_BASE}?entity=${encodeURIComponent(e)}`)
            .then(r => r.json())
            .catch(() => ({ data: [] }))
        )
      );
      entities.forEach((e, i) => {
        cache[e] = results[i].data || [];
      });
      return true;
    } catch (e) {
      console.error('[PCM] init failed:', e);
      return false;
    }
  }

  // ---- Maintenance ----
  const Manutencao = {
    getAll: () => getAll('manutencoes'),
    getById: (id) => getById('manutencoes', id),

    add(data) {
      const existing = getAll('manutencoes');
      const num = existing.length + 1;
      const item = {
        id: Utils.generateId(),
        numero: String(num).padStart(4, '0'),
        tipo: data.tipo || 'preventiva',
        prioridade: data.prioridade || 'media',
        maquina: data.maquina || '',
        descricao: data.descricao || '',
        pecas: data.pecas || '',
        responsavel: data.responsavel || '',
        dataPrevista: data.dataPrevista || '',
        tempoEstimado: data.tempoEstimado || null,
        recorrencia: data.recorrencia || 'nenhuma',
        status: data.status || 'pendente',
        criadoEm: Utils.nowISO(),
        criadoPor: 'Sistema',
        iniciadoEm: null,
        inicioObs: '',
        concluidoEm: data.concluidoEm || null,
        tempoReal: null,
        oQueFoiFeto: data.oQueFoiFeto || '',
        pecasUtilizadas: '',
        proximaManutencao: null,
        conclusaoObs: '',
        observacoes: data.observacoes || '',
        checklist: data.checklist || null,
        canceladoEm: null,
        pausadoEm: null,
        historico: [{ acao: 'criado', em: Utils.nowISO(), por: 'Sistema' }]
      };
      return add('manutencoes', item);
    },

    update: (id, changes) => update('manutencoes', id, changes),
    remove: (id) => remove('manutencoes', id),

    iniciar(id, hora, obs) {
      const m = getById('manutencoes', id);
      if (!m) return false;
      const [h, min] = hora.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(h, min, 0, 0);
      const changes = {
        status: 'andamento',
        iniciadoEm: startDate.toISOString(),
        inicioObs: obs || ''
      };
      if (!m.historico) m.historico = [];
      changes.historico = [...m.historico, { acao: 'iniciado', em: Utils.nowISO(), por: 'Sistema', obs }];
      return update('manutencoes', id, changes);
    },

    pausar(id) {
      const m = getById('manutencoes', id);
      if (!m) return false;
      const changes = { status: 'pausada', pausadoEm: Utils.nowISO() };
      if (!m.historico) m.historico = [];
      changes.historico = [...m.historico, { acao: 'pausado', em: Utils.nowISO(), por: 'Sistema' }];
      return update('manutencoes', id, changes);
    },

    concluir(id, hora, oQueFoiFeto, pecasUsadas, proximaData, obs) {
      const m = getById('manutencoes', id);
      if (!m) return false;
      const duracao = m.iniciadoEm ? Utils.calcDurationFromTimes(m.iniciadoEm, hora) : null;
      const [h, min] = hora.split(':').map(Number);
      const endDate = new Date(m.iniciadoEm || new Date());
      endDate.setHours(h, min, 0, 0);

      const changes = {
        status: 'concluida',
        concluidoEm: endDate.toISOString(),
        tempoReal: duracao ? duracao.totalMin : null,
        oQueFoiFeto,
        pecasUtilizadas: pecasUsadas || '',
        proximaManutencao: proximaData || null,
        conclusaoObs: obs || ''
      };
      if (!m.historico) m.historico = [];
      changes.historico = [...m.historico, { acao: 'concluido', em: Utils.nowISO(), por: 'Sistema', obs }];

      const result = update('manutencoes', id, changes);

      // Create next occurrence if recurring
      if (m.recorrencia && m.recorrencia !== 'nenhuma' && proximaData) {
        const next = {
          tipo: m.tipo, prioridade: m.prioridade, maquina: m.maquina,
          descricao: m.descricao, pecas: m.pecas, responsavel: m.responsavel,
          dataPrevista: proximaData, tempoEstimado: m.tempoEstimado,
          recorrencia: m.recorrencia, observacoes: m.observacoes
        };
        Manutencao.add(next);
      }

      return result;
    },

    cancelar(id) {
      const m = getById('manutencoes', id);
      if (!m) return false;
      const changes = { status: 'cancelada', canceladoEm: Utils.nowISO() };
      if (!m.historico) m.historico = [];
      changes.historico = [...m.historico, { acao: 'cancelado', em: Utils.nowISO(), por: 'Sistema' }];
      return update('manutencoes', id, changes);
    },

    filter(filter, search, sort, dir) {
      let items = getAll('manutencoes');
      const t = Utils.today();

      switch (filter) {
        case 'hoje':       items = items.filter(m => m.dataPrevista === t); break;
        case 'semana':     items = items.filter(m => Utils.isThisWeek(m.dataPrevista)); break;
        case 'mes':        items = items.filter(m => Utils.isThisMonth(m.dataPrevista)); break;
        case 'critica':    items = items.filter(m => m.prioridade === 'critica' && !['concluida','cancelada'].includes(m.status)); break;
        case 'alta':       items = items.filter(m => m.prioridade === 'alta'    && !['concluida','cancelada'].includes(m.status)); break;
        case 'preventiva': items = items.filter(m => m.tipo === 'preventiva'); break;
        case 'corretiva':  items = items.filter(m => m.tipo === 'corretiva'); break;
        case 'pendente':   items = items.filter(m => m.status === 'pendente'); break;
        case 'andamento':  items = items.filter(m => m.status === 'andamento'); break;
        case 'concluida':  items = items.filter(m => m.status === 'concluida'); break;
        case 'atrasada':   items = items.filter(m => Utils.isOverdue(m.dataPrevista, m.status)); break;
      }

      if (search) {
        const q = search.toLowerCase();
        items = items.filter(m =>
          Utils.matchSearch(m.maquina, q) || Utils.matchSearch(m.responsavel, q) ||
          Utils.matchSearch(m.descricao, q) || Utils.matchSearch(m.numero, q) ||
          Utils.matchSearch(m.status, q)
        );
      }

      const s = sort || 'dataPrevista';
      const d = dir === 'asc' ? 1 : -1;
      items.sort((a, b) => {
        if (s === 'prioridade') return (Utils.PRIORITY_ORDER[a.prioridade] - Utils.PRIORITY_ORDER[b.prioridade]) * d;
        if (s === 'dataPrevista') return (a.dataPrevista || '').localeCompare(b.dataPrevista || '') * d;
        return (a[s] || '').localeCompare(b[s] || '') * d;
      });

      return items;
    },

    getStats() {
      const all = getAll('manutencoes');
      const t = Utils.today();
      return {
        total: all.length,
        critica:    all.filter(m => m.prioridade === 'critica' && !['concluida', 'cancelada'].includes(m.status)).length,
        alta:       all.filter(m => m.prioridade === 'alta' && !['concluida', 'cancelada'].includes(m.status)).length,
        media:      all.filter(m => m.prioridade === 'media' && !['concluida', 'cancelada'].includes(m.status)).length,
        baixa:      all.filter(m => m.prioridade === 'baixa' && !['concluida', 'cancelada'].includes(m.status)).length,
        pendente:   all.filter(m => m.status === 'pendente').length,
        andamento:  all.filter(m => m.status === 'andamento').length,
        concluida:  all.filter(m => m.status === 'concluida').length,
        atrasada:   all.filter(m => Utils.isOverdue(m.dataPrevista, m.status)).length,
        hoje:       all.filter(m => m.dataPrevista === t && !['concluida', 'cancelada'].includes(m.status)).length,
        preventivas: all.filter(m => m.tipo === 'preventiva').length,
        corretivas:  all.filter(m => m.tipo === 'corretiva').length
      };
    },

    getForCalendar(year, month) {
      return getAll('manutencoes').filter(m => {
        if (!m.dataPrevista) return false;
        const d = new Date(m.dataPrevista + 'T00:00:00');
        return d.getFullYear() === year && d.getMonth() === month;
      });
    }
  };

  // ---- Machines ----
  const Maquinas = {
    getAll: () => getAll('maquinas'),
    getById: (id) => getById('maquinas', id),
    add: (data) => add('maquinas', data),
    update: (id, changes) => update('maquinas', id, changes),
    remove: (id) => remove('maquinas', id),
    getNomes: () => getAll('maquinas').filter(m => m.status !== 'inativa').map(m => m.nome).sort()
  };

  // ---- Responsáveis ----
  const Responsaveis = {
    getAll: () => getAll('responsaveis'),
    getById: (id) => getById('responsaveis', id),
    add: (data) => add('responsaveis', data),
    update: (id, changes) => update('responsaveis', id, changes),
    remove: (id) => remove('responsaveis', id),
    getNomes: () => getAll('responsaveis').filter(r => r.status !== 'afastado').map(r => r.nome).sort()
  };

  // ---- Peças ----
  const Pecas = {
    getAll: () => getAll('pecas'),
    getById: (id) => getById('pecas', id),
    add: (data) => add('pecas', data),
    update: (id, changes) => update('pecas', id, changes),
    remove: (id) => remove('pecas', id),

    updateEstoque(id, quantidade) {
      const p = getById('pecas', id);
      if (!p) return false;
      const novoEstoque = Math.max(0, (p.estoqueAtual || 0) + quantidade);
      return update('pecas', id, { estoqueAtual: novoEstoque });
    },

    getAlerts() {
      return getAll('pecas').filter(p => (p.estoqueAtual || 0) < (p.estoqueMinimo || 0));
    }
  };

  // ---- Ordens de Serviço (localStorage — schema MySQL diferente) ----
  const OS = {
    getAll: () => getAll('os'),
    getById: (id) => getById('os', id),

    add(data) {
      const existing = getAll('os');
      const year = new Date().getFullYear();
      const countYear = existing.filter(o => o.numero && o.numero.includes(String(year))).length;
      const numero = `OS-${year}-${String(countYear + 1).padStart(3, '0')}`;
      const item = {
        id: Utils.generateId(), numero,
        tipo: data.tipo || 'corretiva',
        prioridade: data.prioridade || 'alta',
        status: data.status || 'aberta',
        maquina: data.maquina || '',
        solicitante: data.solicitante || '',
        funcao: data.funcao || '',
        descricaoProblema: data.descricaoProblema || '',
        impactoProducao: data.impactoProducao || 'sem_impacto',
        diagnostico: data.diagnostico || null,
        aprovacao: data.aprovacao || null,
        execucao: data.execucao || null,
        validacao: data.validacao || null,
        criadoEm: data.criadoEm || Utils.nowISO(),
        criadoPor: data.criadoPor || 'Sistema',
        historico: data.historico || [{ acao: 'criado', em: Utils.nowISO(), por: data.criadoPor || 'Sistema' }]
      };
      const all = getAll('os');
      all.push(item);
      Utils.lsSet(LS_KEYS.os, all);
      return item;
    },

    update: (id, changes) => update('os', id, changes),
    remove: (id) => remove('os', id),

    getStats() {
      const all = getAll('os');
      const mesAtual = new Date().getMonth();
      const anoAtual = new Date().getFullYear();
      return {
        total: all.length,
        abertas:     all.filter(o => o.status === 'aberta').length,
        emAndamento: all.filter(o => ['diagnostico', 'aprovada', 'em_execucao', 'pausada', 'aguardando_peca'].includes(o.status)).length,
        aguardando:  all.filter(o => ['aguardando_aprovacao', 'aguardando_validacao'].includes(o.status)).length,
        concluidas:  all.filter(o => o.status === 'concluida').length,
        canceladas:  all.filter(o => o.status === 'cancelada').length,
        criticas:    all.filter(o => o.prioridade === 'critica' && !['concluida', 'cancelada'].includes(o.status)).length,
        esteMes:     all.filter(o => {
          const d = new Date(o.criadoEm || 0);
          return d.getMonth() === mesAtual && d.getFullYear() === anoAtual;
        }).length
      };
    }
  };

  // ---- Movimentações de Estoque (localStorage) ----
  const Movimentacoes = {
    getAll: () => getAll('movimentacoes'),
    getByPeca: (pecaId) => getAll('movimentacoes').filter(m => m.pecaId === pecaId),
    getByOS: (osId) => getAll('movimentacoes').filter(m => m.osId === osId),

    add(data) {
      const item = {
        id: Utils.generateId(),
        tipo: data.tipo || 'entrada',
        pecaId: data.pecaId || '',
        pecaDescricao: data.pecaDescricao || '',
        pecaCodigo: data.pecaCodigo || '',
        quantidade: data.quantidade || 0,
        estoqueAnterior: data.estoqueAnterior || 0,
        estoqueNovo: data.estoqueNovo || 0,
        motivo: data.motivo || '',
        osId: data.osId || null,
        osNumero: data.osNumero || null,
        responsavel: data.responsavel || 'Sistema',
        criadoEm: Utils.nowISO()
      };
      const all = getAll('movimentacoes');
      all.push(item);
      Utils.lsSet(LS_KEYS.movimentacoes, all);
      return item;
    },

    getLast(n) {
      return getAll('movimentacoes')
        .sort((a, b) => (b.criadoEm || '').localeCompare(a.criadoEm || ''))
        .slice(0, n || 20);
    }
  };

  // ---- Planos de Preventiva (MySQL) ----
  const Planos = {
    getAll: () => getAll('planos'),
    getById: (id) => getById('planos', id),

    add(data) {
      const plano = {
        id: 'plano-' + Utils.generateId(),
        nome: data.nome || 'Novo Plano',
        maquinas: data.maquinas || [],
        frequencia: data.frequencia || 'Mensal',
        tempoEstimado: data.tempoEstimado || 1,
        icon: data.icon || 'fa-list-check',
        secoes: data.secoes || [],
        ativo: true,
        criadoEm: Utils.nowISO()
      };
      return add('planos', plano);
    },

    update: (id, changes) => update('planos', id, changes),
    remove: (id) => remove('planos', id)
  };

  // ---- Usuários ----
  const PAPEIS = {
    admin:       { label: 'Administrador',    color: '#1E40AF', bg: 'rgba(30,64,175,0.1)' },
    gestor:      { label: 'Gestor',           color: '#059669', bg: 'rgba(5,150,105,0.1)' },
    almoxarife:  { label: 'Almoxarife',       color: '#D97706', bg: 'rgba(217,119,6,0.1)' },
    tecnico:     { label: 'Técnico/Mecânico', color: '#7C3AED', bg: 'rgba(124,58,237,0.1)' },
    solicitante: { label: 'Solicitante',      color: '#6B7280', bg: 'rgba(107,114,128,0.1)' }
  };

  const Usuarios = {
    PAPEIS,
    getAll: () => getAll('usuarios'),
    getById: (id) => getById('usuarios', id),

    add(data) {
      const item = {
        id: Utils.generateId(),
        nome: data.nome || '',
        papel: data.papel || 'solicitante',
        pin: String(data.pin || '1234').padStart(4, '0'),
        ativo: data.ativo !== false,
        criadoEm: Utils.nowISO()
      };
      return add('usuarios', item);
    },

    update(id, changes) {
      if (changes.pin) changes.pin = String(changes.pin).padStart(4, '0');
      return update('usuarios', id, changes);
    },

    remove: (id) => remove('usuarios', id),
    getNomes: () => getAll('usuarios').filter(u => u.ativo).map(u => u.nome).sort()
  };

  // ---- Sessão (localStorage — per browser) ----
  const SESSION_KEY = 'pcm_sessao';
  const Session = {
    get() { return Utils.lsGet(SESSION_KEY, null); },

    login(usuarioId, pin) {
      const usuario = getById('usuarios', usuarioId);
      if (!usuario || !usuario.ativo) return { ok: false, msg: 'Usuário não encontrado' };
      if (String(pin).padStart(4, '0') !== String(usuario.pin).padStart(4, '0')) {
        return { ok: false, msg: 'PIN incorreto' };
      }
      Utils.lsSet(SESSION_KEY, {
        id: usuario.id, nome: usuario.nome,
        papel: usuario.papel, loginEm: Utils.nowISO()
      });
      return { ok: true, usuario };
    },

    logout() { localStorage.removeItem(SESSION_KEY); },
    getNome() { const s = Utils.lsGet(SESSION_KEY, null); return s ? s.nome : 'Sistema'; },
    getPapel() { const s = Utils.lsGet(SESSION_KEY, null); return s ? s.papel : null; }
  };

  // ---- Backup / Restore ----
  function exportBackup() {
    return {
      version: '4.0',
      timestamp: Utils.nowISO(),
      empresa: 'BR Aço',
      data: {
        manutencoes: getAll('manutencoes'),
        maquinas:    getAll('maquinas'),
        responsaveis: getAll('responsaveis'),
        pecas:       getAll('pecas'),
        os:          getAll('os'),
        movimentacoes: getAll('movimentacoes'),
        usuarios:    getAll('usuarios'),
        planos:      getAll('planos'),
        config:      Utils.lsGet(LS_KEYS.config, {})
      }
    };
  }

  function importBackup(backup) {
    if (!backup || !backup.data) throw new Error('Arquivo de backup inválido');
    // MySQL entities: update cache + sync each item
    ['manutencoes', 'maquinas', 'responsaveis', 'pecas', 'usuarios', 'planos'].forEach(k => {
      if (backup.data[k]) {
        saveAll(k, backup.data[k]);
        backup.data[k].forEach(item => apiCall('POST', k, item));
      }
    });
    // localStorage entities
    if (backup.data.os)           Utils.lsSet(LS_KEYS.os, backup.data.os);
    if (backup.data.movimentacoes) Utils.lsSet(LS_KEYS.movimentacoes, backup.data.movimentacoes);
    if (backup.data.config)        Utils.lsSet(LS_KEYS.config, backup.data.config);
    return true;
  }

  function clearAll() {
    Object.values(LS_KEYS).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem(SESSION_KEY);
    ['manutencoes', 'maquinas', 'responsaveis', 'pecas', 'usuarios', 'planos'].forEach(k => {
      cache[k] = [];
      // Note: does NOT delete from MySQL — use server-side cleanup for that
    });
  }

  // ---- Patches (run after init to ensure data integrity) ----
  function applyPatches() {
    const usuariosAtuais = getAll('usuarios');

    // Ensure "Geral" user exists
    const temGeral = usuariosAtuais.some(u => u.nome === 'Geral');
    if (!temGeral && usuariosAtuais.length > 0) {
      Usuarios.add({ nome: 'Geral', papel: 'solicitante', pin: '1234' });
      console.log('PCM Patch: Usuário "Geral" adicionado ao MySQL.');
    }
  }

  // ---- Storage Info ----
  function getStorageInfo() {
    const total = getAll('manutencoes').length;
    return `MySQL: ${total} manutenções`;
  }

  return {
    init,
    Manutencao, Maquinas, Responsaveis, Pecas, OS, Movimentacoes, Planos, Usuarios, Session,
    exportBackup, importBackup, clearAll,
    applyPatches, getStorageInfo
  };
})();
