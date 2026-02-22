<?php
/**
 * MeuFreelas - Redefinir senha com token recebido por e-mail
 * POST { "token": "xxx", "password": "nova_senha" }
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
    echo json_encode(['ok' => false, 'error' => 'Erro de conexão.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$token = trim($input['token'] ?? '');
$password = $input['password'] ?? '';
if (!$token || strlen($password) < 6) {
    echo json_encode(['ok' => false, 'error' => 'Token inválido ou senha muito curta (mínimo 6 caracteres).']);
    exit;
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE password_reset_token = ? AND password_reset_expires_at > NOW()');
$stmt->execute([$token]);
$row = $stmt->fetch();
if (!$row) {
    echo json_encode(['ok' => false, 'error' => 'Link inválido ou expirado. Solicite uma nova recuperação de senha.']);
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$pdo->prepare('UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires_at = NULL WHERE id = ?')
    ->execute([$hash, $row['id']]);

echo json_encode(['ok' => true, 'message' => 'Senha alterada. Faça login com a nova senha.']);
exit;
