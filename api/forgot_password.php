<?php
/**
 * MeuFreelas - Solicitar e-mail de recuperação de senha
 * POST { "email": "user@example.com" }
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
$email = trim($input['email'] ?? '');
if (!$email || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['ok' => false, 'error' => 'E-mail inválido.']);
    exit;
}

$stmt = $pdo->prepare('SELECT id, name FROM users WHERE email = ?');
$stmt->execute([$email]);
$row = $stmt->fetch();
if (!$row) {
    echo json_encode(['ok' => true, 'message' => 'Se o e-mail existir em nossa base, você receberá as instruções.']);
    exit;
}

$token = bin2hex(random_bytes(32));
$expires = date('Y-m-d H:i:s', strtotime('+60 minutes'));

try {
    $pdo->prepare('UPDATE users SET password_reset_token = ?, password_reset_expires_at = ? WHERE id = ?')
    ->execute([$token, $expires, $row['id']]);
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Unknown column') !== false) {
        try {
            $pdo->exec('ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(64) DEFAULT NULL');
            $pdo->exec('ALTER TABLE users ADD COLUMN password_reset_expires_at TIMESTAMP NULL DEFAULT NULL');
            $pdo->prepare('UPDATE users SET password_reset_token = ?, password_reset_expires_at = ? WHERE id = ?')->execute([$token, $expires, $row['id']]);
        } catch (PDOException $e2) {
            http_response_code(500);
            echo json_encode(['ok' => false, 'error' => 'Erro ao gerar link. Rode api/setup.php uma vez.']);
            exit;
        }
    } else {
        throw $e;
    }
}

$siteUrl = 'https://meufreelas.com.br';
$resetLink = $siteUrl . '/reset-password?token=' . $token;
$emailSent = false;
if (file_exists(__DIR__ . '/EmailService.php')) {
    require_once __DIR__ . '/EmailService.php';
    $emailService = new EmailService($_ENV);
    $emailSent = $emailService->sendPasswordReset($email, $row['name'], $resetLink, 60);
}

if (!$emailSent) {
    echo json_encode(['ok' => false, 'error' => 'Não foi possível enviar o e-mail. Tente novamente mais tarde.']);
    exit;
}
echo json_encode(['ok' => true, 'message' => 'Se o e-mail existir em nossa base, você receberá as instruções em alguns minutos. Verifique também a pasta de spam.']);
exit;
