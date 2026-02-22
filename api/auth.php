<?php
/**
 * MeuFreelas - API de autenticação (registro e login)
 * POST: register | login
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
    echo json_encode(['ok' => false, 'error' => 'Erro de conexão com o banco.', 'detail' => $e->getMessage()]);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? '';

if ($action === 'register') {
    $name = trim($input['name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';
    $type = $input['type'] ?? '';

    if (!$name || !$email || !$password || !in_array($type, ['freelancer', 'client'])) {
        echo json_encode(['ok' => false, 'error' => 'Dados incompletos (name, email, password, type).']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT id, type, is_verified FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $existing = $stmt->fetch();

    $siteUrl = 'https://meufreelas.com.br';
    $genToken = function () { return bin2hex(random_bytes(32)); };
    $sendActivationAndReturn = function ($userId, $userEmail, $userName, $userType) use ($pdo, $genToken, $siteUrl) {
        $token = $genToken();
        $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
        $pdo->prepare('UPDATE users SET is_verified = 0, activation_token = ?, activation_token_expires_at = ? WHERE id = ?')
            ->execute([$token, $expires, $userId]);
        $emailSent = false;
        if (file_exists(__DIR__ . '/EmailService.php')) {
            require_once __DIR__ . '/EmailService.php';
            $emailService = new EmailService($_ENV);
            $emailSent = $emailService->sendActivationEmail($userEmail, $userName, $userType, $siteUrl . '/ativar?token=' . $token);
        }
        $message = $emailSent
            ? 'Enviamos um e-mail de ativação. Clique no link para ativar sua conta e depois faça login.'
            : 'Conta criada, mas não foi possível enviar o e-mail. Na tela de login, use "Reenviar e-mail de ativação".';
        echo json_encode(['ok' => true, 'requiresActivation' => true, 'message' => $message, 'emailSent' => $emailSent]);
    };

    if ($existing) {
        if ($existing['type'] === $type) {
            $newHash = password_hash($password, PASSWORD_DEFAULT);
            $pdo->prepare('UPDATE users SET password_hash = ?, name = ? WHERE id = ?')
                ->execute([$newHash, $name, $existing['id']]);
            $sendActivationAndReturn($existing['id'], $email, $name, $type);
            exit;
        }
        $hasFreelancer = ($existing['type'] === 'freelancer' || $type === 'freelancer') ? 1 : 0;
        $hasClient = ($existing['type'] === 'client' || $type === 'client') ? 1 : 0;
        $newHash = password_hash($password, PASSWORD_DEFAULT);
        $pdo->prepare('UPDATE users SET password_hash = ?, has_freelancer_account = ?, has_client_account = ?, type = ? WHERE id = ?')
            ->execute([$newHash, $hasFreelancer, $hasClient, $type, $existing['id']]);
        $stmt = $pdo->prepare('SELECT id, email, name, type, avatar, rating, completed_projects, has_freelancer_account, has_client_account FROM users WHERE id = ?');
        $stmt->execute([$existing['id']]);
        $row = $stmt->fetch();
        $user = [
            'id' => $row['id'],
            'email' => $row['email'],
            'name' => $row['name'],
            'type' => $row['type'],
            'avatar' => $row['avatar'],
            'rating' => (float) $row['rating'],
            'completedProjects' => (int) $row['completed_projects'],
            'hasFreelancerAccount' => (bool) $row['has_freelancer_account'],
            'hasClientAccount' => (bool) $row['has_client_account'],
        ];
        echo json_encode(['ok' => true, 'user' => $user]);
        exit;
    }

    $id = bin2hex(random_bytes(18));
    $hash = password_hash($password, PASSWORD_DEFAULT);
    $avatar = 'https://ui-avatars.com/api/?name=' . urlencode($name) . '&background=003366&color=fff';
    $token = $genToken();
    $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
    $hasF = $type === 'freelancer' ? 1 : 0;
    $hasC = $type === 'client' ? 1 : 0;

    $sql = 'INSERT INTO users (id, email, password_hash, name, type, avatar, rating, completed_projects, has_freelancer_account, has_client_account, is_verified, activation_token, activation_token_expires_at) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?, 0, ?, ?)';
    $pdo->prepare($sql)->execute([$id, $email, $hash, $name, $type, $avatar, $hasF, $hasC, $token, $expires]);

    $emailSent = false;
    if (file_exists(__DIR__ . '/EmailService.php')) {
        require_once __DIR__ . '/EmailService.php';
        $emailService = new EmailService($_ENV);
        $emailSent = $emailService->sendActivationEmail($email, $name, $type, $siteUrl . '/ativar?token=' . $token);
    }
    $message = $emailSent
        ? 'Enviamos um e-mail de ativação. Clique no link para ativar sua conta e depois faça login.'
        : 'Conta criada, mas não foi possível enviar o e-mail. Na tela de login, use "Reenviar e-mail de ativação".';
    echo json_encode(['ok' => true, 'requiresActivation' => true, 'message' => $message, 'emailSent' => $emailSent]);
    exit;
}

if ($action === 'login') {
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (!$email || !$password) {
        echo json_encode(['ok' => false, 'error' => 'E-mail e senha obrigatórios.']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT id, email, password_hash, name, type, avatar, rating, completed_projects, has_freelancer_account, has_client_account, is_verified FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($password, $row['password_hash'])) {
        echo json_encode(['ok' => false, 'error' => 'E-mail ou senha incorretos.']);
        exit;
    }

    $isVerified = isset($row['is_verified']) ? (int) $row['is_verified'] : 1;
    if ($isVerified === 0) {
        echo json_encode(['ok' => false, 'error' => 'Ative sua conta pelo link enviado ao seu e-mail. Depois faça login.', 'code' => 'NOT_VERIFIED']);
        exit;
    }

    $user = [
        'id' => $row['id'],
        'email' => $row['email'],
        'name' => $row['name'],
        'type' => $row['type'],
        'avatar' => $row['avatar'],
        'rating' => (float) $row['rating'],
        'completedProjects' => (int) $row['completed_projects'],
        'hasFreelancerAccount' => (bool) $row['has_freelancer_account'],
        'hasClientAccount' => (bool) $row['has_client_account'],
    ];
    echo json_encode(['ok' => true, 'user' => $user]);
    exit;
}

if ($action === 'resend_activation') {
    $email = trim($input['email'] ?? '');
    if (!$email) {
        echo json_encode(['ok' => false, 'error' => 'E-mail obrigatório.']);
        exit;
    }
    $stmt = $pdo->prepare('SELECT id, name, type, is_verified FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();
    if (!$row) {
        echo json_encode(['ok' => false, 'error' => 'E-mail não encontrado.']);
        exit;
    }
    $isVerified = isset($row['is_verified']) ? (int) $row['is_verified'] : 1;
    if ($isVerified === 1) {
        echo json_encode(['ok' => false, 'error' => 'Esta conta já está ativada. Faça login.']);
        exit;
    }
    $siteUrl = 'https://meufreelas.com.br';
    $token = bin2hex(random_bytes(32));
    $expires = date('Y-m-d H:i:s', strtotime('+24 hours'));
    $pdo->prepare('UPDATE users SET activation_token = ?, activation_token_expires_at = ? WHERE id = ?')
        ->execute([$token, $expires, $row['id']]);
    $emailSent = false;
    if (file_exists(__DIR__ . '/EmailService.php')) {
        require_once __DIR__ . '/EmailService.php';
        $emailService = new EmailService($_ENV);
        $emailSent = $emailService->sendActivationEmail($email, $row['name'], $row['type'], $siteUrl . '/ativar?token=' . $token);
    }
    if (!$emailSent) {
        echo json_encode(['ok' => false, 'error' => 'Não foi possível enviar o e-mail. Verifique a configuração SMTP no servidor (api/.env com SMTP_PASS) ou tente novamente mais tarde.']);
        exit;
    }
    echo json_encode(['ok' => true, 'message' => 'E-mail de ativação reenviado. Verifique sua caixa de entrada e o spam.']);
    exit;
}

echo json_encode(['ok' => false, 'error' => 'Ação inválida. Use action: register, login ou resend_activation.']);
