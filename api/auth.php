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
$dbName = $_ENV['DB_NAME'] ?? 'u892594395_meufreelas';
$dbUser = $_ENV['DB_USER'] ?? 'u892594395_meufreelas27';
$dbPass = $_ENV['DB_PASS'] ?? '';

try {
    $pdo = new PDO(
        "mysql:host=$dbHost;dbname=$dbName;charset=utf8mb4",
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

    $stmt = $pdo->prepare('SELECT id, type FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $existing = $stmt->fetch();

    if ($existing) {
        if ($existing['type'] === $type) {
            echo json_encode(['ok' => false, 'error' => 'Este e-mail já está cadastrado com este tipo de conta.']);
            exit;
        }
        $hasFreelancer = ($existing['type'] === 'freelancer' || $type === 'freelancer') ? 1 : 0;
        $hasClient = ($existing['type'] === 'client' || $type === 'client') ? 1 : 0;
        $pdo->prepare('UPDATE users SET has_freelancer_account = ?, has_client_account = ?, type = ? WHERE id = ?')
            ->execute([$hasFreelancer, $hasClient, $type, $existing['id']]);
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

    $sql = 'INSERT INTO users (id, email, password_hash, name, type, avatar, rating, completed_projects, has_freelancer_account, has_client_account) VALUES (?, ?, ?, ?, ?, ?, 0, 0, ?, ?)';
    $hasF = $type === 'freelancer' ? 1 : 0;
    $hasC = $type === 'client' ? 1 : 0;
    $pdo->prepare($sql)->execute([$id, $email, $hash, $name, $type, $avatar, $hasF, $hasC]);

    $user = [
        'id' => $id,
        'email' => $email,
        'name' => $name,
        'type' => $type,
        'avatar' => $avatar,
        'rating' => 0,
        'completedProjects' => 0,
        'hasFreelancerAccount' => $type === 'freelancer',
        'hasClientAccount' => $type === 'client',
    ];
    echo json_encode(['ok' => true, 'user' => $user]);
    exit;
}

if ($action === 'login') {
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (!$email || !$password) {
        echo json_encode(['ok' => false, 'error' => 'E-mail e senha obrigatórios.']);
        exit;
    }

    $stmt = $pdo->prepare('SELECT id, email, password_hash, name, type, avatar, rating, completed_projects, has_freelancer_account, has_client_account FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $row = $stmt->fetch();

    if (!$row || !password_verify($password, $row['password_hash'])) {
        echo json_encode(['ok' => false, 'error' => 'E-mail ou senha incorretos.']);
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

echo json_encode(['ok' => false, 'error' => 'Ação inválida. Use action: register ou login.']);
