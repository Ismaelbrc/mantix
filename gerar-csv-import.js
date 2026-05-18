const fs = require('fs');

const pecas = JSON.parse(fs.readFileSync('C:/Users/ismae/.claude/braaco-pcm/pecas-import-data.json', 'utf8'));

function isoToDateBR(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('pt-BR');
}

const header = ['Situação', 'Descrição', 'Quantidade', 'Código NCM', 'Inclusão', 'Última Alteração'];
const rows = pecas.map(p => [
  p.situacao || 'Ativo',
  p.descricao || '',
  p.estoqueAtual != null ? p.estoqueAtual : '',
  p.ncm || '',
  isoToDateBR(p.criadoEm),
  isoToDateBR(p.atualizadoEm)
]);

const all = [header, ...rows];
const csv = '\uFEFF' + all.map(r => r.map(c => '"' + String(c).replace(/"/g, '""') + '"').join(',')).join('\r\n');

const outPath = 'C:/Users/ismae/Downloads/pecas_br_aco_import.csv';
fs.writeFileSync(outPath, csv, 'utf8');
console.log('CSV gerado:', outPath);
console.log('Total linhas:', rows.length);
