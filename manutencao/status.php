<?php
/* Verificação de status do banco — remova após uso */
header('Content-Type: text/html; charset=utf-8');
require_once __DIR__ . '/config.php';

try {
    $pdo = new PDO("mysql:host=".DB_HOST.";dbname=".DB_NAME.";charset=utf8mb4",
        DB_USER, DB_PASSWORD, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (Exception $e) {
    die('<p style="color:red">Falha na conexão: ' . htmlspecialchars($e->getMessage()) . '</p>');
}

$tables = [
    'tbli_manutencoes'        => 'Manutenções',
    'tbli_maquinas'           => 'Máquinas',
    'tbli_responsaveis'       => 'Responsáveis',
    'tbli_pecas'              => 'Peças',
    'tbli_usuarios'           => 'Usuários',
    'tbli_planos_preventivos' => 'Planos Preventivos',
];

$rows = [];
foreach ($tables as $tbl => $label) {
    try {
        $n = $pdo->query("SELECT COUNT(*) FROM `$tbl`")->fetchColumn();
        // Extra info
        $extra = '';
        if ($tbl === 'tbli_manutencoes') {
            $status = $pdo->query("SELECT status, COUNT(*) as n FROM `$tbl` GROUP BY status")->fetchAll(PDO::FETCH_KEY_PAIR);
            $extra = implode(' | ', array_map(fn($s,$c)=>"$s: $c", array_keys($status), $status));
        }
        if ($tbl === 'tbli_planos_preventivos') {
            $freq = $pdo->query("SELECT frequencia, COUNT(*) as n FROM `$tbl` GROUP BY frequencia")->fetchAll(PDO::FETCH_KEY_PAIR);
            $extra = implode(' | ', array_map(fn($f,$c)=>"$f: $c", array_keys($freq), $freq));
        }
        $rows[] = ['label'=>$label,'table'=>$tbl,'count'=>$n,'extra'=>$extra,'ok'=>true];
    } catch (Exception $e) {
        $rows[] = ['label'=>$label,'table'=>$tbl,'count'=>0,'extra'=>$e->getMessage(),'ok'=>false];
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Status Mantix</title>
<style>
  body{font-family:monospace;background:#0f172a;color:#e2e8f0;padding:2rem}
  h1{color:#3b82f6}table{border-collapse:collapse;width:100%;max-width:700px}
  th,td{padding:10px 16px;text-align:left;border-bottom:1px solid #1e293b}
  th{color:#64748b;font-size:12px;text-transform:uppercase}
  .ok{color:#4ade80}.err{color:#f87171}.extra{color:#94a3b8;font-size:12px}
  .zero{color:#fbbf24}
</style></head>
<body>
<h1>📊 Status do Banco — Mantix</h1>
<p style="color:#64748b">Banco: <?= DB_NAME ?> @ <?= DB_HOST ?></p>
<table>
  <tr><th>Entidade</th><th>Tabela</th><th>Registros</th><th>Detalhe</th></tr>
  <?php foreach ($rows as $r): ?>
  <tr>
    <td><?= $r['label'] ?></td>
    <td style="color:#64748b;font-size:12px"><?= $r['table'] ?></td>
    <td class="<?= !$r['ok'] ? 'err' : ($r['count'] == 0 ? 'zero' : 'ok') ?>">
      <?= $r['ok'] ? $r['count'] : '❌' ?>
    </td>
    <td class="extra"><?= htmlspecialchars($r['extra']) ?></td>
  </tr>
  <?php endforeach; ?>
</table>
<?php
$total = array_sum(array_column(array_filter($rows, fn($r)=>$r['ok']), 'count'));
if ($total == 0): ?>
<p style="color:#fbbf24;margin-top:1.5rem">⚠️ Banco vazio — a migração ainda não foi executada.<br>
Crie <code>migrate-config.php</code> e acesse <a href="migrate.php" style="color:#3b82f6">migrate.php</a>.</p>
<?php else: ?>
<p style="color:#4ade80;margin-top:1.5rem">✅ <?= $total ?> registros encontrados no banco.</p>
<?php endif; ?>
</body></html>
