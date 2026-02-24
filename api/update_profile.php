<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/db.php';

$input = file_get_contents('php://input');
$data = json_decode($input, true);

$userId = $data['userId'] ?? '';
$title = $data['title'] ?? null;
$bio = $data['bio'] ?? null;
$hourlyRate = $data['hourlyRate'] ?? null;
// Skills geralmente é JSON ou array, vamos assumir JSON string se vier
$skills = $data['skills'] ?? null;

if (!$userId) {
    echo json_encode(['ok' => false, 'error' => 'ID do usuário obrigatório']);
    exit;
}

try {
    $pdo = mf_pdo();
    
    // Garantir que colunas existam (segurança para não quebrar se o banco estiver desatualizado)
    $columns = [
        'title' => 'VARCHAR(255) NULL',
        'bio' => 'TEXT NULL',
        'hourly_rate' => 'VARCHAR(50) NULL',
        'skills' => 'JSON NULL' // Ou TEXT se MySQL antigo
    ];
    
    foreach ($columns as $col => $def) {
        try {
            $pdo->exec("ALTER TABLE users ADD COLUMN $col $def");
        } catch (PDOException $e) {
            // Ignorar erro de coluna já existente
        }
    }

    // Construir query dinâmica
    $fields = [];
    $params = [':id' => $userId];

    if ($title !== null) {
        $fields[] = "title = :title";
        $params[':title'] = $title;
    }
    if ($bio !== null) {
        $fields[] = "bio = :bio";
        $params[':bio'] = $bio;
    }
    if ($hourlyRate !== null) {
        $fields[] = "hourly_rate = :hourlyRate";
        $params[':hourlyRate'] = $hourlyRate;
    }
    if ($skills !== null) {
        $fields[] = "skills = :skills";
        $params[':skills'] = is_array($skills) ? json_encode($skills) : $skills;
    }

    if (empty($fields)) {
        echo json_encode(['ok' => true, 'message' => 'Nada a atualizar']);
        exit;
    }

    $sql = "UPDATE users SET " . implode(', ', $fields) . " WHERE id = :id";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['ok' => true]);
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Erro ao atualizar perfil: ' . $e->getMessage()]);
}
