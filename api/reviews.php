<?php
/**
 * MeuFreelas - Avaliações do freelancer (listar)
 * POST action: list_reviews { freelancerId }
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

require_once __DIR__ . '/load_env.php';
require_once __DIR__ . '/db.php';

$pdo = mf_pdo();
if (!$pdo) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Erro de conexão com o banco.']);
    exit;
}

$input = [];
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? [];
} elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['freelancerId'])) {
    $input = ['freelancerId' => $_GET['freelancerId']];
}

$freelancerId = trim((string)($input['freelancerId'] ?? ''));
if ($freelancerId === '') {
    echo json_encode(['ok' => false, 'error' => 'freelancerId é obrigatório.']);
    exit;
}

$stmt = $pdo->prepare("
    SELECT
        d.id,
        d.rating,
        d.client_feedback AS comment,
        d.reviewed_at AS date,
        c.name AS author_name,
        pr.title AS project_title
    FROM project_deliveries d
    INNER JOIN users c ON c.id = d.client_id
    INNER JOIN projects pr ON pr.id = d.project_id
    WHERE d.freelancer_id = ? AND d.status = 'approved' AND d.rating IS NOT NULL
    ORDER BY d.reviewed_at DESC
");
$stmt->execute([$freelancerId]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

$reviews = array_map(function ($r) {
    $date = $r['date'] ?? null;
    if ($date) {
        $ts = strtotime($date);
        $date = date('d/m/Y', $ts);
    }
    return [
        'author' => $r['author_name'] ?? 'Cliente',
        'rating' => (int) ($r['rating'] ?? 0),
        'comment' => $r['comment'] ?? '',
        'date' => $date ?? '',
        'project' => $r['project_title'] ?? '',
    ];
}, $rows);

echo json_encode(['ok' => true, 'reviews' => $reviews]);
