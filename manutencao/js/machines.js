/* ================================================================
   PCM BR AÇO - Machine Data
   ================================================================ */

const MachineData = (() => {

  const CATEGORIES = {
    'Corte e Dobra': { icon: 'fa-scissors', color: '#E74C3C' },
    'Telas e Colunas': { icon: 'fa-border-all', color: '#3498DB' },
    'Movimentação': { icon: 'fa-truck-fast', color: '#F39C12' },
    'Equipamentos Auxiliares': { icon: 'fa-gear', color: '#27AE60' },
    'Outros': { icon: 'fa-wrench', color: '#9B59B6' }
  };

  function getSeedMaquinas() {
    const now = Utils.nowISO();
    return [
      // CORTE E DOBRA
      { id: Utils.generateId(), nome: 'Cortadeira Vergalhão 1', codigo: 'CVG-01', categoria: 'Corte e Dobra', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Galpão 1', responsavel: 'Jailto Ferrbel Br Aco', criadoEm: now },
      { id: Utils.generateId(), nome: 'Cortadeira Vergalhão 2', codigo: 'CVG-02', categoria: 'Corte e Dobra', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Galpão 1', responsavel: 'Jailto Ferrbel Br Aco', criadoEm: now },
      { id: Utils.generateId(), nome: 'Dobradeira Automática 1', codigo: 'DOB-01', categoria: 'Corte e Dobra', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Galpão 1', responsavel: 'Fábio Junior Br Aco', criadoEm: now },
      { id: Utils.generateId(), nome: 'Dobradeira Automática 2', codigo: 'DOB-02', categoria: 'Corte e Dobra', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Galpão 1', responsavel: 'Fábio Junior Br Aco', criadoEm: now },
      { id: Utils.generateId(), nome: 'Eura 13 (Estribadeira)', codigo: 'EUR-01', categoria: 'Corte e Dobra', fabricante: 'Eura', modelo: 'Eura 13', ano: null, status: 'ativa', criticidade: 'media', localizacao: 'Galpão 1', responsavel: 'Jailto Ferrbel Br Aco', criadoEm: now },
      { id: Utils.generateId(), nome: 'DR Mack', codigo: 'DRM-01', categoria: 'Corte e Dobra', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'media', localizacao: 'Galpão 1', responsavel: '', criadoEm: now },
      // TELAS E COLUNAS
      { id: Utils.generateId(), nome: 'Trelimaxx 1', codigo: 'TLX-01', categoria: 'Telas e Colunas', fabricante: 'Trelimaxx', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Galpão 2 - Setor A', responsavel: 'Paulo Ricardo Mecatronica', criadoEm: now },
      { id: Utils.generateId(), nome: 'Trelimaxx 2', codigo: 'TLX-02', categoria: 'Telas e Colunas', fabricante: 'Trelimaxx', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Galpão 2 - Setor B', responsavel: 'Paulo Ricardo Mecatronica', criadoEm: now },
      { id: Utils.generateId(), nome: 'Dhalmar', codigo: 'DHL-01', categoria: 'Telas e Colunas', fabricante: 'Dhalmar', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Galpão 2', responsavel: 'Lucas Manut BR Aço', criadoEm: now },
      { id: Utils.generateId(), nome: 'MEP', codigo: 'MEP-01', categoria: 'Telas e Colunas', fabricante: 'MEP', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Galpão 2', responsavel: 'Lucas Manut BR Aço', criadoEm: now },
      { id: Utils.generateId(), nome: 'Schnell (Colunas)', codigo: 'SCH-01', categoria: 'Telas e Colunas', fabricante: 'Schnell', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Galpão 2', responsavel: '', criadoEm: now },
      { id: Utils.generateId(), nome: 'FGR (Soldas)', codigo: 'FGR-01', categoria: 'Telas e Colunas', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'media', localizacao: 'Galpão 2', responsavel: '', criadoEm: now },
      // MOVIMENTAÇÃO
      { id: Utils.generateId(), nome: 'Pórtico Rolante 1', codigo: 'POR-01', categoria: 'Movimentação', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Pátio Externo', responsavel: 'Fábio Junior Br Aco', criadoEm: now },
      { id: Utils.generateId(), nome: 'Pórtico Rolante 2', codigo: 'POR-02', categoria: 'Movimentação', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Pátio Externo', responsavel: 'Fábio Junior Br Aco', criadoEm: now },
      { id: Utils.generateId(), nome: 'Pórtico Logística', codigo: 'POR-03', categoria: 'Movimentação', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Pátio Logística', responsavel: '', criadoEm: now },
      { id: Utils.generateId(), nome: 'Empilhadeira 1', codigo: 'EMP-01', categoria: 'Movimentação', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Pátio', responsavel: 'Raimundo BR Aço', criadoEm: now },
      { id: Utils.generateId(), nome: 'Empilhadeira 2', codigo: 'EMP-02', categoria: 'Movimentação', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Pátio', responsavel: 'Raimundo BR Aço', criadoEm: now },
      { id: Utils.generateId(), nome: 'Empilhadeira 3', codigo: 'EMP-03', categoria: 'Movimentação', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'media', localizacao: 'Pátio', responsavel: '', criadoEm: now },
      // EQUIPAMENTOS AUXILIARES
      { id: Utils.generateId(), nome: 'Compressor Principal (Ingersoll 50hp)', codigo: 'CMP-01', categoria: 'Equipamentos Auxiliares', fabricante: 'Ingersoll Rand', modelo: '50hp', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Casa de Máquinas', responsavel: 'Lucas Manut BR Aço', criadoEm: now },
      { id: Utils.generateId(), nome: 'Compressor Reserva', codigo: 'CMP-02', categoria: 'Equipamentos Auxiliares', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'media', localizacao: 'Casa de Máquinas', responsavel: 'Lucas Manut BR Aço', criadoEm: now },
      { id: Utils.generateId(), nome: 'QGD (Quadro Geral de Distribuição)', codigo: 'QGD-01', categoria: 'Equipamentos Auxiliares', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Casa de Máquinas', responsavel: 'Paulo Ricardo Mecatronica', criadoEm: now },
      { id: Utils.generateId(), nome: 'Casa de Máquinas', codigo: 'CDM-01', categoria: 'Equipamentos Auxiliares', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Casa de Máquinas', responsavel: 'Paulo Ricardo Mecatronica', criadoEm: now },
      // OUTROS
      { id: Utils.generateId(), nome: 'Trefiladeira (Trefila)', codigo: 'TRF-01', categoria: 'Outros', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'alta', localizacao: 'Galpão 3', responsavel: '', criadoEm: now },
      { id: Utils.generateId(), nome: 'Decapador', codigo: 'DEC-01', categoria: 'Outros', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'media', localizacao: 'Galpão 3', responsavel: '', criadoEm: now },
      { id: Utils.generateId(), nome: 'DHE12', codigo: 'DHE-01', categoria: 'Outros', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'media', localizacao: 'Galpão 3', responsavel: '', criadoEm: now },
      { id: Utils.generateId(), nome: 'Máquina de Malhas', codigo: 'MAL-01', categoria: 'Outros', fabricante: '', modelo: '', ano: null, status: 'ativa', criticidade: 'media', localizacao: 'Galpão 3', responsavel: '', criadoEm: now }
    ];
  }

  function getCategoryInfo(cat) {
    return CATEGORIES[cat] || { icon: 'fa-cog', color: '#888' };
  }

  function groupByCategory(maquinas) {
    const groups = {};
    Object.keys(CATEGORIES).forEach(c => groups[c] = []);
    maquinas.forEach(m => {
      const cat = m.categoria || 'Outros';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(m);
    });
    return groups;
  }

  function renderMaquinaOptions(selectEl, selectedVal) {
    const maquinas = DB.Maquinas.getAll().filter(m => m.status !== 'inativa');
    const groups = groupByCategory(maquinas);
    selectEl.innerHTML = '<option value="">-- Selecione a máquina --</option>';
    Object.entries(groups).forEach(([cat, mqs]) => {
      if (!mqs.length) return;
      const og = document.createElement('optgroup');
      og.label = cat;
      mqs.sort((a,b) => a.nome.localeCompare(b.nome)).forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.nome;
        opt.textContent = m.nome;
        if (m.nome === selectedVal) opt.selected = true;
        og.appendChild(opt);
      });
      selectEl.appendChild(og);
    });
  }

  function renderResponsavelOptions(selectEl, selectedVal) {
    const resp = DB.Responsaveis.getAll().filter(r => r.status !== 'afastado');
    selectEl.innerHTML = '<option value="">-- Selecione o responsável --</option>';
    resp.sort((a,b) => a.nome.localeCompare(b.nome)).forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.nome;
      opt.textContent = r.nome + (r.funcao ? ` (${r.funcao})` : '');
      if (r.nome === selectedVal) opt.selected = true;
      selectEl.appendChild(opt);
    });
  }

  return { getSeedMaquinas, getCategoryInfo, groupByCategory, renderMaquinaOptions, renderResponsavelOptions, CATEGORIES };
})();
