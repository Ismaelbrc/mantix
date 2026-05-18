/* ================================================================
   PCM BR AÇO - Preventive Maintenance Templates (with CRUD)
   ================================================================ */

const Templates = (() => {

  const STORAGE_KEY = 'pcm_planos_preventivos';
  const CHECKLIST_KEY = 'pcm_checklist_estados';

  // ---- Seed templates (default plans) ----
  const SEEDS = [
    {
      id: 'trelimaxx',
      nome: 'Trelimaxx 1 / Trelimaxx 2',
      maquinas: ['Trelimaxx 1', 'Trelimaxx 2'],
      frequencia: 'Mensal',
      tempoEstimado: 4,
      icon: 'fa-border-all',
      secoes: [
        {
          titulo: '1. Sistema Elétrico',
          itens: [
            'Inspecionar disjuntores e fusíveis',
            'Verificar conexões e bornes elétricos',
            'Testar aterramento',
            'Medir corrente de operação (dentro do nominal)',
            'Verificar aquecimento de cabos e conexões',
            'Verificar estado do painel de controle'
          ]
        },
        {
          titulo: '2. Roletes Móveis do Arraste',
          itens: [
            'Inspecionar desgaste dos roletes',
            'Verificar alinhamento dos roletes',
            'Lubrificar rolamentos dos roletes',
            'Ajustar tensão e pressão dos roletes',
            'Verificar estado das molas de tensão'
          ]
        },
        {
          titulo: '3. Sistema Hidráulico',
          itens: [
            'Verificar arruelas de trava',
            'Inspecionar mangueiras hidráulicas',
            'Verificar nível do óleo hidráulico',
            'Testar pressão do sistema',
            'Verificar vazamentos'
          ]
        },
        {
          titulo: '4. Sistema Pneumático',
          itens: [
            'Inspecionar mangueiras de ar',
            'Verificar abraçadeiras e conexões',
            'Testar vazamentos pneumáticos',
            'Verificar filtros de ar e lubrificador',
            'Drenar condensado dos filtros'
          ]
        },
        {
          titulo: '5. Bases e Suportes',
          itens: [
            'Verificar fixação dos suportes',
            'Inspecionar roscas e parafusos',
            'Reapertar parafusos de fixação',
            'Verificar vibração e desalinhamento'
          ]
        },
        {
          titulo: '6. Lubrificação Geral',
          itens: [
            'Lubrificar pontos de articulação',
            'Verificar nível do lubrificante centralizado',
            'Aplicar graxa nos mancais',
            'Limpar excesso de lubrificante'
          ]
        }
      ]
    },
    {
      id: 'portico',
      nome: 'Pórticos Rolantes (1, 2 e Logística)',
      maquinas: ['Pórtico Rolante 1', 'Pórtico Rolante 2', 'Pórtico Logística'],
      frequencia: 'Mensal',
      tempoEstimado: 3,
      icon: 'fa-truck-fast',
      secoes: [
        {
          titulo: '1. Sistema de Translação',
          itens: [
            'Inspecionar rodas de translação',
            'Verificar trilhos e fixação',
            'Verificar folga entre rodas e trilho',
            'Lubrificar rodas e guias de translação'
          ]
        },
        {
          titulo: '2. Sistema de Elevação',
          itens: [
            'Inspecionar cabo de aço',
            'Verificar tambor de enrolamento',
            'Testar freio eletromagnético',
            'Lubrificar redutor de elevação',
            'Verificar estado do gancho e trava de segurança'
          ]
        },
        {
          titulo: '3. Sistema Elétrico',
          itens: [
            'Verificar cabos e conectores',
            'Testar botoeiras de comando',
            'Verificar limitadores de curso',
            'Inspecionar motor elétrico',
            'Verificar fusíveis e disjuntores'
          ]
        },
        {
          titulo: '4. Estrutura Metálica',
          itens: [
            'Inspecionar soldas e uniões',
            'Verificar parafusos de fixação da estrutura',
            'Verificar sinais de corrosão',
            'Pintura e proteção anticorrosiva (se necessário)'
          ]
        },
        {
          titulo: '5. Dispositivos de Segurança',
          itens: [
            'Testar botoeira de emergência',
            'Verificar sinalizador sonoro/visual',
            'Testar limitadores de sobrecarga',
            'Verificar balizamentos e sinalizações'
          ]
        }
      ]
    },
    {
      id: 'empilhadeira',
      nome: 'Empilhadeiras (1, 2 e 3)',
      maquinas: ['Empilhadeira 1', 'Empilhadeira 2', 'Empilhadeira 3'],
      frequencia: 'Trimestral',
      tempoEstimado: 4,
      icon: 'fa-truck-ramp-box',
      secoes: [
        {
          titulo: '1. Sistema Hidráulico',
          itens: [
            'Verificar nível do óleo hidráulico',
            'Trocar óleo hidráulico (conforme km)',
            'Inspecionar mangueiras e conexões',
            'Verificar bombas e válvulas',
            'Testar funcionamento do mastro'
          ]
        },
        {
          titulo: '2. Motor e Transmissão',
          itens: [
            'Verificar nível do óleo do motor',
            'Trocar filtro de óleo',
            'Inspecionar correia dentada',
            'Verificar velas de ignição (gasolina)',
            'Verificar bateria e eletrólito'
          ]
        },
        {
          titulo: '3. Sistema de Freios',
          itens: [
            'Inspecionar pastilhas/lonas de freio',
            'Testar freio de serviço',
            'Verificar freio de estacionamento',
            'Verificar fluido de freio'
          ]
        },
        {
          titulo: '4. Pneus e Direção',
          itens: [
            'Verificar estado dos pneus',
            'Calibrar pressão dos pneus',
            'Verificar sistema de direção',
            'Lubrificar pivôs e articulações'
          ]
        },
        {
          titulo: '5. Garfos e Estrutura',
          itens: [
            'Inspecionar garfos (trincas, desgaste)',
            'Verificar encaixe dos garfos',
            'Lubrificar correntes do mastro',
            'Verificar cilindro de inclinação'
          ]
        },
        {
          titulo: '6. Segurança',
          itens: [
            'Testar buzina',
            'Verificar extintor de incêndio',
            'Verificar cinto de segurança',
            'Testar iluminação',
            'Verificar estado do capô protetor'
          ]
        }
      ]
    },
    {
      id: 'compressor',
      nome: 'Compressores (Principal e Reserva)',
      maquinas: ['Compressor Principal (Ingersoll 50hp)', 'Compressor Reserva'],
      frequencia: 'Mensal',
      tempoEstimado: 2,
      icon: 'fa-wind',
      secoes: [
        {
          titulo: '1. Sistema de Ar',
          itens: [
            'Trocar filtro de ar de entrada',
            'Verificar válvulas de admissão e descarga',
            'Testar pressão de trabalho',
            'Verificar válvula de alívio de pressão',
            'Drenar condensado do reservatório'
          ]
        },
        {
          titulo: '2. Sistema de Óleo',
          itens: [
            'Verificar nível de óleo',
            'Trocar óleo lubrificante (conforme horas)',
            'Trocar filtro de óleo',
            'Verificar vazamentos de óleo'
          ]
        },
        {
          titulo: '3. Sistema de Resfriamento',
          itens: [
            'Limpar radiador e aletas',
            'Verificar ventilador de resfriamento',
            'Verificar temperatura de operação',
            'Inspecionar mangueiras de resfriamento'
          ]
        },
        {
          titulo: '4. Motor Elétrico',
          itens: [
            'Verificar aquecimento do motor',
            'Medir corrente de operação',
            'Verificar rolamentos',
            'Lubrificar rolamentos',
            'Verificar conexões elétricas'
          ]
        },
        {
          titulo: '5. Geral',
          itens: [
            'Verificar correias de transmissão',
            'Testar pressostato',
            'Verificar manômetros',
            'Verificar estado físico geral',
            'Limpar área ao redor do compressor'
          ]
        }
      ]
    },
    {
      id: 'trefila',
      nome: 'Trefiladeira (Trefila)',
      maquinas: ['Trefiladeira (Trefila)'],
      frequencia: 'Mensal',
      tempoEstimado: 3,
      icon: 'fa-circle-nodes',
      secoes: [
        {
          titulo: '1. Sistema de Tração',
          itens: [
            'Verificar desgaste dos rolos trefiladores',
            'Inspecionar alinhamento dos rolos',
            'Verificar caixas de sabão',
            'Checar nível de sabão trefilador',
            'Verificar tensão do arame'
          ]
        },
        {
          titulo: '2. Sistema de Lubrificação',
          itens: [
            'Verificar nível de óleo das caixas de engrenagem',
            'Trocar óleo se necessário',
            'Lubrificar mancais e rolamentos',
            'Verificar estado das fieiras'
          ]
        },
        {
          titulo: '3. Sistema Elétrico',
          itens: [
            'Verificar motor principal',
            'Testar sensores de parada',
            'Verificar inversor de frequência',
            'Inspecionar painel de controle'
          ]
        }
      ]
    },
    {
      id: 'cortadeiras',
      nome: 'Cortadeiras de Vergalhão (1 e 2)',
      maquinas: ['Cortadeira Vergalhão 1', 'Cortadeira Vergalhão 2'],
      frequencia: 'Mensal',
      tempoEstimado: 2,
      icon: 'fa-scissors',
      secoes: [
        {
          titulo: '1. Sistema de Corte',
          itens: [
            'Verificar desgaste das facas',
            'Ajustar folga das facas',
            'Lubrificar guias das facas',
            'Verificar estado das lâminas'
          ]
        },
        {
          titulo: '2. Sistema Hidráulico',
          itens: [
            'Verificar nível de óleo',
            'Verificar mangueiras e conexões',
            'Testar pressão do sistema',
            'Verificar cilindros hidráulicos'
          ]
        },
        {
          titulo: '3. Sistema Elétrico',
          itens: [
            'Verificar painel de controle',
            'Testar sensores de posição',
            'Verificar motor e inversores',
            'Inspecionar fiações e conexões'
          ]
        },
        {
          titulo: '4. Geral',
          itens: [
            'Limpar resíduos de corte',
            'Verificar mesas de alimentação',
            'Testar dispositivos de segurança',
            'Reapertar parafusos gerais'
          ]
        }
      ]
    },
    {
      id: 'dobradeiras',
      nome: 'Dobradeiras Automáticas (1 e 2)',
      maquinas: ['Dobradeira Automática 1', 'Dobradeira Automática 2'],
      frequencia: 'Mensal',
      tempoEstimado: 2.5,
      icon: 'fa-rotate',
      secoes: [
        {
          titulo: '1. Sistema de Dobra',
          itens: [
            'Verificar desgaste dos pinos de dobra',
            'Lubrificar guias e trilhos',
            'Verificar alinhamento dos roletes',
            'Ajustar parâmetros de dobra'
          ]
        },
        {
          titulo: '2. Sistema Pneumático',
          itens: [
            'Verificar pressão pneumática',
            'Inspecionar válvulas e atuadores',
            'Verificar mangueiras e conexões',
            'Drenar filtros de ar'
          ]
        },
        {
          titulo: '3. CLP e Controle',
          itens: [
            'Verificar parâmetros do CLP',
            'Testar programa de dobra',
            'Verificar IHM (tela de operação)',
            'Verificar cabos de comunicação'
          ]
        }
      ]
    },
    {
      id: 'mep-dhalmar',
      nome: 'MEP e Dhalmar (Telas)',
      maquinas: ['MEP', 'Dhalmar'],
      frequencia: 'Mensal',
      tempoEstimado: 3,
      icon: 'fa-table-cells',
      secoes: [
        {
          titulo: '1. Sistema de Soldagem',
          itens: [
            'Verificar eletrodos de solda',
            'Inspecionar transformadores de solda',
            'Verificar resfriamento dos eletrodos',
            'Testar qualidade das soldas'
          ]
        },
        {
          titulo: '2. Sistema de Alimentação',
          itens: [
            'Verificar rolos de alimentação',
            'Inspecionar guias dos arames',
            'Lubrificar sistema de alimentação',
            'Verificar tensão dos arames'
          ]
        },
        {
          titulo: '3. Sistema de Corte',
          itens: [
            'Verificar lâminas de corte',
            'Ajustar medidas de corte',
            'Lubrificar guias de corte'
          ]
        },
        {
          titulo: '4. Sistema Elétrico/Eletrônico',
          itens: [
            'Verificar painéis de controle',
            'Testar sensores e encoders',
            'Verificar inversores de frequência',
            'Inspecionar fiações'
          ]
        }
      ]
    }
  ];

  // ---- CRUD (delegated to DB.Planos → MySQL) ----
  function getAll() {
    // DB.Planos reads from MySQL cache (populated on init)
    const fromDB = DB.Planos.getAll();
    // Fallback to seed templates if MySQL is empty
    if (fromDB && fromDB.length > 0) return fromDB;
    return [...SEEDS];
  }

  function getById(id) {
    return getAll().find(p => p.id === id) || null;
  }

  function getForMaquina(maquinaNome) {
    return getAll().find(t =>
      Array.isArray(t.maquinas) &&
      t.maquinas.some(m => m.toLowerCase() === (maquinaNome || '').toLowerCase())
    );
  }

  function add(data) {
    return DB.Planos.add(data);
  }

  function update(id, changes) {
    return DB.Planos.update(id, changes);
  }

  function remove(id) {
    DB.Planos.remove(id);
    return true;
  }

  // ---- Checklist state persistence ----
  function saveChecklistState(templateId, state, obs) {
    const all = Utils.lsGet(CHECKLIST_KEY, {});
    all[templateId] = { state, obs: obs || '', savedAt: Utils.nowISO() };
    Utils.lsSet(CHECKLIST_KEY, all);
  }

  function getChecklistSavedState(templateId) {
    return (Utils.lsGet(CHECKLIST_KEY, {}))[templateId] || null;
  }

  function clearChecklistState(templateId) {
    const all = Utils.lsGet(CHECKLIST_KEY, {});
    delete all[templateId];
    Utils.lsSet(CHECKLIST_KEY, all);
  }

  // ---- Checklist rendering ----
  function renderChecklist(template, checklistState) {
    let html = '';
    template.secoes.forEach((secao, si) => {
      html += `<div class="checklist-section">
        <div class="checklist-section-title">${Utils.escapeHTML(secao.titulo)}</div>
        ${secao.itens.map((item, ii) => {
          const key = `${si}-${ii}`;
          const checked = checklistState && checklistState[key];
          return `<div class="checklist-item ${checked ? 'checked' : ''}" id="ci-${key}">
            <input type="checkbox" id="chk-${key}" ${checked ? 'checked' : ''} onchange="Templates.toggleCheck('${key}', this.checked)">
            <label for="chk-${key}">${Utils.escapeHTML(item)}</label>
          </div>`;
        }).join('')}
      </div>`;
    });
    return html;
  }

  // ---- Checklist state (in-memory for current session) ----
  let _currentChecklistState = {};
  let _currentTemplateId = null;

  function toggleCheck(key, checked) {
    _currentChecklistState[key] = checked;
    updateProgress();
    // Auto-save on every change
    if (_currentTemplateId) {
      const obs = document.getElementById('checklistObs')?.value || '';
      saveChecklistState(_currentTemplateId, _currentChecklistState, obs);
    }
  }

  function updateProgress() {
    const template = getById(_currentTemplateId);
    if (!template) return;
    const total = countTotal(template);
    const checked = countChecked(_currentChecklistState);
    const el = document.getElementById('checklistProgress');
    if (el) {
      const pct = total > 0 ? Math.round(checked / total * 100) : 0;
      const color = pct === 100 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--primary)';
      el.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;margin-top:8px">
          <div style="flex:1;height:8px;background:var(--border);border-radius:4px;overflow:hidden">
            <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width 0.3s ease"></div>
          </div>
          <span style="font-size:13px;color:var(--text-secondary);white-space:nowrap;font-weight:500">${checked} / ${total} itens &nbsp;(${pct}%)</span>
        </div>`;
    }
  }

  function startChecklist(templateId, maquina) {
    _currentTemplateId = templateId;
    const saved = getChecklistSavedState(templateId);
    _currentChecklistState = saved ? { ...saved.state } : {};
    const template = getById(templateId) || getForMaquina(maquina);
    return { template, state: _currentChecklistState, savedState: saved };
  }

  function getChecklistState() { return _currentChecklistState; }
  function getCurrentTemplateId() { return _currentTemplateId; }
  function countChecked(state) { return Object.values(state).filter(Boolean).length; }
  function countTotal(template) { return template.secoes.reduce((a, s) => a + s.itens.length, 0); }

  return {
    getAll, getById, getForMaquina,
    add, update, remove,
    renderChecklist, toggleCheck, updateProgress,
    startChecklist, getChecklistState, getCurrentTemplateId,
    countChecked, countTotal,
    saveChecklistState, getChecklistSavedState, clearChecklistState
  };
})();
