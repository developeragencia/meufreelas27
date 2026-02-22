<?php
/**
 * MeuFreelas - Ativação de conta por link do e-mail
 * GET https://meufreelas.com.br/api/activate.php?token=xxx
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$envFile = __DIR__ . '/.env';
$_ENV = [];
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($k, $v) = explode('=', $line, 2);
            $_ENV[trim($k)] = trim($v, " \t\"'");
        }
    }
}

$dbHost = $_ENV['DB_HOST'] ?? 'localhost';
$dbPort = $_ENV['DB_PORT'] ?? '3306';
$dbName = $_ENV['DB_NAME'] ?? 'u892594395_meufreelas';
$dbUser = $_ENV['DB_USER'] ?? 'u892594395_meufreelas27';
$dbPass = $_ENV['DB_PASS'] ?? '';

$token = trim($_GET['token'] ?? '');

if ($token === '') {
    echo json_encode(['ok' => false, 'error' => 'Token ausente. Use o link que enviamos no e-mail.']);
    exit;
}

try {
    $pdo = new PDO(
        "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (PDOException $e) {
    echo json_encode(['ok' => false, 'error' => 'Erro de conexão.']);
    exit;
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE activation_token = ? AND (activation_token_expires_at IS NULL OR activation_token_expires_at > NOW())');
$stmt->execute([$token]);
$row = $stmt->fetch();

if (!$row) {
    echo json_encode(['ok' => false, 'error' => 'Link inválido ou expirado. Solicite um novo e-mail de ativação.']);
    exit;
}

$pdo->prepare('UPDATE users SET is_verified = 1, activation_token = NULL, activation_token_expires_at = NULL WHERE id = ?')
    ->execute([$row['id']]);

echo json_encode(['ok' => true, 'message' => 'Conta ativada. Faça login para acessar o painel.']);
