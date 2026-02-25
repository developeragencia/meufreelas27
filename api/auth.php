<?php
/**
 * MeuFreelas - API de autenticação (registro e login)
 * POST: register | login
 * Opcional: verificação Cloudflare Turnstile (turnstileToken) quando TURNSTILE_SECRET_KEY está definida.
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

require_once __DIR__ . '/db.php';

// --- JWT Helper Functions (Inlined to avoid require errors) ---
function jwt_base64url_encode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}
function jwt_encode($payload, $secret) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    $payload['iat'] = time();
    $payload['exp'] = time() + (60 * 60 * 24); // 24h
    $base64UrlHeader = jwt_base64url_encode($header);
    $base64UrlPayload = jwt_base64url_encode(json_encode($payload));
    $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $secret, true);
    $base64UrlSignature = jwt_base64url_encode($signature);
    return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
}
// -------------------------------------------------------------

/**
 * Verifica o token do Cloudflare Turnstile.
 * Retorna true se válido, false caso contrário.
 */
function mf_verify_turnstile(string $secretKey, string $token): bool {
    if ($token === '') return false;
    $url = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    $data = ['secret' => $secretKey, 'response' => $token];
    $opts = [
        'http' => [
            'method'  => 'POST',
            'header'  => 'Content-Type: application/x-www-form-urlencoded',
            'content' => http_build_query($data),
            'timeout' => 10,
        ],
    ];
    $ctx = stream_context_create($opts);
    $raw = @file_get_contents($url, false, $ctx);
    if ($raw === false) return false;
    $json = json_decode($raw, true);
    return isset($json['success']) && $json['success'] === true;
}

try {
    $pdo = mf_pdo();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Erro de conexão com o banco. Verifique variáveis DB_* no ambiente.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = $input['action'] ?? '';

$buildUserById = function (string $id) use ($pdo) {
    $stmt = $pdo->prepare('SELECT id, email, name, type, avatar, rating, completed_projects, has_freelancer_account, has_client_account, is_verified, is_premium, plan_type FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) return null;
    return [
        'id' => $row['id'],
        'email' => $row['email'],
        'name' => $row['name'],
        'type' => $row['type'],
        'avatar' => $row['avatar'],
        'rating' => (float)$row['rating'],
        'completedProjects' => (int)$row['completed_projects'],
        'hasFreelancerAccount' => (bool)$row['has_freelancer_account'],
        'hasClientAccount' => (bool)$row['has_client_account'],
        'isVerified' => (int)($row['is_verified'] ?? 0) === 1,
        'isPremium' => (int)($row['is_premium'] ?? 0) === 1,
        'planType' => (string)($row['plan_type'] ?? 'free'),
    ];
};

if ($action === 'register') {
    $turnstileSecret = mf_env('TURNSTILE_SECRET_KEY');
    if ($turnstileSecret !== null && $turnstileSecret !== '') {
        $turnstileToken = trim((string)($input['turnstileToken'] ?? ''));
        if ($turnstileToken === '') {
            echo json_encode(['ok' => false, 'error' => 'Verificação de segurança obrigatória. Atualize a página e tente novamente.']);
            exit;
        }
        if (!mf_verify_turnstile($turnstileSecret, $turnstileToken)) {
            echo json_encode(['ok' => false, 'error' => 'Verificação de segurança falhou. Tente novamente.']);
            exit;
        }
    }

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
        $stmt = $pdo->prepare('SELECT id, email, name, type, avatar, rating, completed_projects, has_freelancer_account, has_client_account, is_premium, plan_type FROM users WHERE id = ?');
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
            'isPremium' => (int)($row['is_premium'] ?? 0) === 1,
            'planType' => (string)($row['plan_type'] ?? 'free'),
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
    // Turnstile disabled for debugging
    /*
    $turnstileSecret = mf_env('TURNSTILE_SECRET_KEY');
    if ($turnstileSecret !== null && $turnstileSecret !== '') {
        $turnstileToken = trim((string)($input['turnstileToken'] ?? ''));
        if ($turnstileToken === '') {
            echo json_encode(['ok' => false, 'error' => 'Verificação de segurança obrigatória. Atualize a página e tente novamente.']);
            exit;
        }
        if (!mf_verify_turnstile($turnstileSecret, $turnstileToken)) {
            echo json_encode(['ok' => false, 'error' => 'Verificação de segurança falhou. Tente novamente.']);
            exit;
        }
    }
    */

    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (!$email || !$password) {
        echo json_encode(['ok' => false, 'error' => 'E-mail e senha obrigatórios.']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT id, email, password_hash, name, type, avatar, rating, completed_projects, has_freelancer_account, has_client_account, is_verified, is_premium, plan_type FROM users WHERE email = ?');
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
        'isPremium' => (int)($row['is_premium'] ?? 0) === 1,
        'planType' => (string)($row['plan_type'] ?? 'free'),
    ];
    $token = jwt_encode(['sub' => $user['id'], 'email' => $user['email']], $_ENV['JWT_SECRET'] ?? 'meufreelas_secret_key_change_this');
    echo json_encode(['ok' => true, 'user' => $user, 'token' => $token]);
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
        echo json_encode(['ok' => false, 'error' => 'Não foi possível enviar o e-mail. Verifique SMTP_USER/SMTP_PASS no ambiente de produção e se a pasta api/vendor está presente no servidor.']);
        exit;
    }
    echo json_encode(['ok' => true, 'message' => 'E-mail de ativação reenviado. Verifique sua caixa de entrada e o spam.']);
    exit;
}

if ($action === 'switch_account_type') {
    $userId = trim((string)($input['userId'] ?? ''));
    $targetType = trim((string)($input['targetType'] ?? ''));
    if ($userId === '' || !in_array($targetType, ['freelancer', 'client'], true)) {
        echo json_encode(['ok' => false, 'error' => 'userId e targetType são obrigatórios.']);
        exit;
    }
    $stmt = $pdo->prepare('SELECT id, has_freelancer_account, has_client_account FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) {
        echo json_encode(['ok' => false, 'error' => 'Usuário não encontrado.']);
        exit;
    }
    if ($targetType === 'freelancer' && (int)$row['has_freelancer_account'] !== 1) {
        echo json_encode(['ok' => false, 'error' => 'Conta freelancer não disponível para este usuário.']);
        exit;
    }
    if ($targetType === 'client' && (int)$row['has_client_account'] !== 1) {
        echo json_encode(['ok' => false, 'error' => 'Conta cliente não disponível para este usuário.']);
        exit;
    }
    $pdo->prepare('UPDATE users SET type = ? WHERE id = ?')->execute([$targetType, $userId]);
    $user = $buildUserById($userId);
    echo json_encode(['ok' => true, 'user' => $user]);
    exit;
}

if ($action === 'create_secondary_account') {
    $userId = trim((string)($input['userId'] ?? ''));
    $accountType = trim((string)($input['accountType'] ?? ''));
    if ($userId === '' || !in_array($accountType, ['freelancer', 'client'], true)) {
        echo json_encode(['ok' => false, 'error' => 'userId e accountType são obrigatórios.']);
        exit;
    }
    $stmt = $pdo->prepare('SELECT id, has_freelancer_account, has_client_account FROM users WHERE id = ? LIMIT 1');
    $stmt->execute([$userId]);
    $row = $stmt->fetch();
    if (!$row) {
        echo json_encode(['ok' => false, 'error' => 'Usuário não encontrado.']);
        exit;
    }
    $hasF = (int)$row['has_freelancer_account'] === 1;
    $hasC = (int)$row['has_client_account'] === 1;
    if ($accountType === 'freelancer') $hasF = true;
    if ($accountType === 'client') $hasC = true;
    $pdo->prepare('UPDATE users SET has_freelancer_account = ?, has_client_account = ?, type = ? WHERE id = ?')
        ->execute([$hasF ? 1 : 0, $hasC ? 1 : 0, $accountType, $userId]);
    $user = $buildUserById($userId);
    echo json_encode(['ok' => true, 'user' => $user]);
    exit;
}

echo json_encode(['ok' => false, 'error' => 'Ação inválida. Use action: register, login, resend_activation, switch_account_type ou create_secondary_account.']);
