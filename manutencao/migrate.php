<?php
/* ================================================================
   MANTIX — Script de Migração de Dados
   Copia dados do banco de origem para tbli_* no banco de destino.

   ANTES DE USAR:
   1. Crie o arquivo migrate-config.php (já está no .gitignore)
      com as constantes SRC_HOST, SRC_DB, SRC_USER, SRC_PASS
   2. Acesse este arquivo via navegador UMA ÚNICA VEZ
   3. Remova migrate.php e migrate-config.php do servidor
   ================================================================ */

header('Content-Type: text/html; charset=utf-8');

$configFile = __DIR__ . '/migrate-config.php';
if (!file_exists($configFile)) {
    die('<pre style="color:red">ERRO: migrate-config.php não encontrado.
Crie o arquivo com:
  define("SRC_HOST", "host-origem");
  define("SRC_DB",   "banco-origem");
  define("SRC_USER", "usuario-origem");
  define("SRC_PASS", "senha-origem");
</pre>');
}
require_once $configFile;
require_once __DIR__ . '/config.php';

$TABLE_MAP = [
    'manutencoes'        => 'tbli_manutencoes',
    'maquinas'           => 'tbli_maquinas',
    'responsaveis'       => 'tbli_responsaveis',
    'pecas'              => 'tbli_pecas',
    'usuarios'           => 'tbli_usuarios',
    'planos_preventivos' => 'tbli_planos_preventivos',
];

$JSON_FIELDS = [
    'tbli_manutencoes'        => ['historico', 'checklist'],
    'tbli_maquinas'           => ['horariosOperacao'],
    'tbli_responsaveis'       => [],
    'tbli_pecas'              => [],
    'tbli_usuarios'           => [],
    'tbli_planos_preventivos' => ['maquinas', 'secoes'],
];

$log = [];
function logMsg(string $msg, string $type = 'info'): void { global $log; $log[] = compact('type','msg'); }

function connectDB(string $host, string $db, string $user, string $pass, string $label): ?PDO {
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$db;charset=utf8mb4", $user, $pass,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
        logMsg("✅ Conectado: $label ($db@$host)");
        return $pdo;
    } catch (Exception $e) {
        logMsg("❌ Falha $label: " . $e->getMessage(), 'error');
        return null;
    }
}

function runSchema(PDO $dst): void {
    $f = __DIR__ . '/schema.sql';
    if (!file_exists($f)) { logMsg('⚠️  schema.sql não encontrado.', 'warn'); return; }
    $count = 0;
    foreach (array_filter(array_map('trim', explode(';', file_get_contents($f)))) as $stmt) {
        if (!$stmt || str_starts_with($stmt,'--') || str_starts_with($stmt,'/*')) continue;
        try { $dst->exec($stmt); $count++; } catch (Exception $e) { /* ignora DROP/duplicado */ }
    }
    logMsg("📋 Schema aplicado ($count statements)");
}

function migrateTable(PDO $src, PDO $dst, string $srcTable, string $dstTable): void {
    try { $rows = $src->query("SELECT * FROM `$srcTable`")->fetchAll(); }
    catch (Exception $e) { logMsg("⚠️  $srcTable não existe na origem.", 'warn'); return; }
    if (empty($rows)) { logMsg("⏭️  $srcTable → $dstTable: vazia."); return; }
    $ok = $err = 0;
    foreach ($rows as $row) {
        $cols    = array_keys($row);
        $colList = implode(',', array_map(fn($c)=>"`$c`", $cols));
        $holders = implode(',', array_map(fn($c)=>":$c", $cols));
        $updates = implode(',', array_map(fn($c)=>"`$c`=:u_$c", $cols));
        $params  = [];
        foreach ($row as $k => $v) { $params[$k] = $v; $params["u_$k"] = $v; }
        try {
            $dst->prepare("INSERT INTO `$dstTable` ($colList) VALUES ($holders) ON DUPLICATE KEY UPDATE $updates")
                ->execute($params);
            $ok++;
        } catch (Exception $e) { logMsg("  ⚠️  id={$row['id']}: ".$e->getMessage(),'warn'); $err++; }
    }
    logMsg("✅ $srcTable → $dstTable: $ok migrados" . ($err ? ", $err erros" : "."));
}

// === EXECUÇÃO ===
$src = connectDB(SRC_HOST, SRC_DB, SRC_USER, SRC_PASS, 'ORIGEM');
$dst = connectDB(DB_HOST, DB_NAME, DB_USER, DB_PASSWORD, 'DESTINO');

if ($src && $dst) {
    runSchema($dst);
    foreach ($TABLE_MAP as $srcTable => $dstTable) migrateTable($src, $dst, $srcTable, $dstTable);
    logMsg('🎉 Migração concluída!');
} else {
    logMsg('❌ Migração abortada — falha de conexão.', 'error');
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Migração Mantix</title>
<style>
  body{font-family:monospace;background:#0f172a;color:#e2e8f0;padding:2rem}
  h1{color:#3b82f6}.info{color:#94a3b8}.error{color:#f87171}.warn{color:#fbbf24}
  .item{padding:4px 0}.box{background:#1e293b;border-radius:8px;padding:1.5rem;max-width:800px}
  .warn-box{background:#7f1d1d;border-radius:8px;padding:1rem;margin-top:2rem;color:#fca5a5}
</style></head>
<body>
<div class="box">
  <h1>🔄 Migração de Dados — Mantix</h1>
  <?php foreach ($log as $e): ?><div class="item <?=$e['type']?>"><?=htmlspecialchars($e['msg'])?></div><?php endforeach; ?>
</div>
<div class="warn-box">⚠️ <strong>Remova</strong> <code>migrate.php</code> e <code>migrate-config.php</code> do servidor após a migração.</div>
</body></html>
