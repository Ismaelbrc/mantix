<?php
/* ================================================================
   PCM BR AÇO - REST API (MySQL)
   ================================================================ */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ---- DB Connection ----
require_once __DIR__ . '/../config.php';
try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASSWORD,
        [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_TIMEOUT            => 10
        ]
    );
} catch (Exception $e) {
    http_response_code(503);
    echo json_encode(['ok' => false, 'error' => 'DB unavailable: ' . $e->getMessage()]);
    exit;
}

// ---- Entity → table mapping ----
$TABLES = [
    'manutencoes'   => 'tbli_manutencoes',
    'maquinas'      => 'tbli_maquinas',
    'responsaveis'  => 'tbli_responsaveis',
    'pecas'         => 'tbli_pecas',
    'usuarios'      => 'tbli_usuarios',
    'planos'        => 'tbli_planos_preventivos',
];

// ---- JSON fields per table (stored as longtext, need encode/decode) ----
$JSON_FIELDS = [
    'tbli_manutencoes'        => ['historico', 'checklist'],
    'tbli_maquinas'           => ['horariosOperacao'],
    'tbli_responsaveis'       => [],
    'tbli_pecas'              => [],
    'tbli_usuarios'           => [],
    'tbli_planos_preventivos' => ['maquinas', 'secoes'],
];

// ---- Request params ----
$entity = $_GET['entity'] ?? '';
$id     = $_GET['id']     ?? null;
$method = $_SERVER['REQUEST_METHOD'];
$body   = json_decode(file_get_contents('php://input'), true) ?? [];

if (!isset($TABLES[$entity])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => "Entity '$entity' not found"]);
    exit;
}

$table  = $TABLES[$entity];
$jf     = $JSON_FIELDS[$table] ?? [];

// ---- Helpers ----
function decodeRow($row, $jsonFields) {
    foreach ($jsonFields as $f) {
        if (array_key_exists($f, $row) && is_string($row[$f]) && $row[$f] !== '') {
            $decoded = json_decode($row[$f], true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $row[$f] = $decoded;
            }
        }
    }
    // Cast boolean-like fields
    if (isset($row['ativo'])) $row['ativo'] = (bool)$row['ativo'];
    if (isset($row['ehCritico'])) $row['ehCritico'] = (bool)$row['ehCritico'];
    return $row;
}

function encodeRow($data, $jsonFields) {
    foreach ($jsonFields as $f) {
        if (isset($data[$f]) && !is_string($data[$f])) {
            $data[$f] = json_encode($data[$f], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        }
    }
    return $data;
}

function sanitizeForDB($data) {
    // Remove keys that shouldn't be in DB (e.g. undefined JS values)
    return array_filter($data, fn($v) => $v !== null || is_bool($v) || is_numeric($v));
}

// ================================================================
try {
    // ---- GET all ----
    if ($method === 'GET' && !$id) {
        $order = in_array($table, ['manutencoes', 'planos_preventivos']) ? 'criadoEm DESC' : 'criadoEm ASC';
        $rows  = $pdo->query("SELECT * FROM `$table` ORDER BY $order")->fetchAll();
        $rows  = array_map(fn($r) => decodeRow($r, $jf), $rows);
        echo json_encode(['ok' => true, 'data' => array_values($rows)]);

    // ---- GET by id ----
    } elseif ($method === 'GET' && $id) {
        $stmt = $pdo->prepare("SELECT * FROM `$table` WHERE id = ?");
        $stmt->execute([$id]);
        $row = $stmt->fetch();
        if (!$row) { http_response_code(404); echo json_encode(['ok' => false, 'error' => 'Not found']); exit; }
        echo json_encode(['ok' => true, 'data' => decodeRow($row, $jf)]);

    // ---- POST (create or upsert) ----
    } elseif ($method === 'POST') {
        if (empty($body)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Empty body']);
            exit;
        }

        $data = encodeRow($body, $jf);

        // Build INSERT ... ON DUPLICATE KEY UPDATE
        $cols    = array_keys($data);
        $colList = implode(',', array_map(fn($c) => "`$c`", $cols));
        $holders = implode(',', array_map(fn($c) => ":$c", $cols));
        $updates = implode(',', array_map(fn($c) => "`$c`=:upd_$c", $cols));

        // Duplicate params for ON DUPLICATE KEY UPDATE
        $params = [];
        foreach ($data as $k => $v) {
            $params[$k]       = $v;
            $params["upd_$k"] = $v;
        }

        $stmt = $pdo->prepare("INSERT INTO `$table` ($colList) VALUES ($holders) ON DUPLICATE KEY UPDATE $updates");
        $stmt->execute($params);
        echo json_encode(['ok' => true, 'id' => $data['id'] ?? $pdo->lastInsertId()]);

    // ---- PUT (update) ----
    } elseif ($method === 'PUT' && $id) {
        if (empty($body)) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Empty body']);
            exit;
        }

        $data = encodeRow($body, $jf);
        // Remove 'id' from the SET clause if present
        unset($data['id']);

        if (empty($data)) {
            echo json_encode(['ok' => true, 'updated' => 0]);
            exit;
        }

        $sets   = implode(',', array_map(fn($c) => "`$c`=:$c", array_keys($data)));
        $data['_id'] = $id;
        $stmt   = $pdo->prepare("UPDATE `$table` SET $sets WHERE id=:_id");
        $stmt->execute($data);
        echo json_encode(['ok' => true, 'updated' => $stmt->rowCount()]);

    // ---- DELETE ----
    } elseif ($method === 'DELETE' && $id) {
        $stmt = $pdo->prepare("DELETE FROM `$table` WHERE id=?");
        $stmt->execute([$id]);
        echo json_encode(['ok' => true, 'deleted' => $stmt->rowCount()]);

    } else {
        http_response_code(405);
        echo json_encode(['ok' => false, 'error' => 'Method not allowed']);
    }

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
