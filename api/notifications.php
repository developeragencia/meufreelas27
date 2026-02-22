<?php
/**
 * MeuFreelas - Notificações
 * POST actions:
 * - list_notifications { userId }
 * - mark_read { userId, notificationId }
 * - mark_all_read { userId }
 * - delete_notification { userId, notificationId }
 * - clear_notifications { userId }
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método não permitido']);
    exit;
}

require_once __DIR__ . '/load_env.php';

$dbHost = $_ENV['DB_HOST'] ?? 'localhost';
$dbPort = $_ENV['DB_PORT'] ?? '3306';
$dbName = $_ENV['DB_NAME'] ?? 'u892594395_meufreelas';
$dbUser = $_ENV['DB_USER'] ?? 'u892594395_meufreelas27';
$dbPass = $_ENV['DB_PASS'] ?? '';

try {
    $pdo = new PDO(
        "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Erro de conexão com o banco.']);
    exit;
}

function has_column(PDO $pdo, string $table, string $column): bool {
    try {
        $stmt = $pdo->prepare("SHOW COLUMNS FROM `$table` LIKE ?");
        $stmt->execute([$column]);
        return (bool)$stmt->fetch();
    } catch (Throwable $e) {
        return false;
    }
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = trim((string)($input['action'] ?? ''));
$userId = trim((string)($input['userId'] ?? ''));
if ($action === '' || $userId === '') {
    echo json_encode(['ok' => false, 'error' => 'action e userId são obrigatórios.']);
    exit;
}

$hasType = has_column($pdo, 'notifications', 'type');
$hasLink = has_column($pdo, 'notifications', 'link');

if ($action === 'list_notifications') {
    $selectFields = 'id, user_id, title, message, is_read, created_at';
    if ($hasType) $selectFields .= ', type';
    if ($hasLink) $selectFields .= ', link';
    $stmt = $pdo->prepare("SELECT $selectFields FROM notifications WHERE user_id = ? ORDER BY created_at DESC");
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();
    $notifications = array_map(function ($r) {
        return [
            'id' => $r['id'],
            'type' => $r['type'] ?? 'system',
            'title' => $r['title'],
            'description' => $r['message'] ?? '',
            'date' => $r['created_at'],
            'isRead' => ((int)$r['is_read']) === 1,
            'link' => $r['link'] ?? null,
        ];
    }, $rows);
    echo json_encode(['ok' => true, 'notifications' => $notifications]);
    exit;
}

if ($action === 'mark_read') {
    $notificationId = trim((string)($input['notificationId'] ?? ''));
    if ($notificationId === '') {
        echo json_encode(['ok' => false, 'error' => 'notificationId é obrigatório.']);
        exit;
    }
    $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?');
    $stmt->execute([$notificationId, $userId]);
    echo json_encode(['ok' => true]);
    exit;
}

if ($action === 'mark_all_read') {
    $stmt = $pdo->prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?');
    $stmt->execute([$userId]);
    echo json_encode(['ok' => true]);
    exit;
}

if ($action === 'delete_notification') {
    $notificationId = trim((string)($input['notificationId'] ?? ''));
    if ($notificationId === '') {
        echo json_encode(['ok' => false, 'error' => 'notificationId é obrigatório.']);
        exit;
    }
    $stmt = $pdo->prepare('DELETE FROM notifications WHERE id = ? AND user_id = ?');
    $stmt->execute([$notificationId, $userId]);
    echo json_encode(['ok' => true]);
    exit;
}

if ($action === 'clear_notifications') {
    $stmt = $pdo->prepare('DELETE FROM notifications WHERE user_id = ?');
    $stmt->execute([$userId]);
    echo json_encode(['ok' => true]);
    exit;
}

echo json_encode(['ok' => false, 'error' => 'Ação inválida.']);
