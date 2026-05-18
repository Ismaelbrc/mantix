const XLSX = require('C:/Users/ismae/.claude/node_modules/xlsx');
const fs = require('fs');

const wb = XLSX.readFile('C:/Users/ismae/Downloads/estoque_e_producao_464309617835151.xlsx');
const ws = wb.Sheets[wb.SheetNames[0]];
const data = XLSX.utils.sheet_to_json(ws, {header:1});

function excelDateToISO(serial) {
  if (serial == null || serial === '') return new Date().toISOString();
  const date = new Date(Math.round((serial - 25569) * 86400 * 1000));
  return date.toISOString();
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2,5) + Math.random().toString(36).substr(2,3);
}

const rows = data.slice(1).filter(r => r[1]);
const pecas = rows.map(r => ({
  id: genId(),
  descricao: (r[1] || '').toString().trim(),
  codigo: '',
  situacao: (r[0] || 'Ativo').toString().trim(),
  ncm: (r[3] || '').toString().trim(),
  categoria: 'Consumo',
  criticidade: 'importante',
  estoqueMinimo: 0,
  estoqueAtual: r[2] != null ? Number(r[2]) : 0,
  unidade: 'un',
  fornecedor: '',
  custo: 0,
  tipo: 'peca',
  criadoEm: excelDateToISO(r[4]),
  atualizadoEm: excelDateToISO(r[5])
}));

console.log('Total pecas:', pecas.length);
console.log('Ativos:', pecas.filter(p => p.situacao === 'Ativo').length);
console.log('Inativos:', pecas.filter(p => p.situacao === 'Inativo').length);
console.log('Sample:', JSON.stringify(pecas[0], null, 2));

fs.writeFileSync('C:/Users/ismae/.claude/braaco-pcm/pecas-import-data.json', JSON.stringify(pecas, null, 2));
console.log('Saved to pecas-import-data.json');
