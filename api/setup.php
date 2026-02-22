<?php
/**
 * MeuFreelas - Setup do banco de dados (criar/atualizar tabelas)
 * Acesso: https://meufreelas.com.br/api/setup.php
 * Executar uma vez após deploy; pode rodar de novo para corrigir estrutura.
 */
error_reporting(E_ALL);
ini_set('display_errors', '0');

require_once __DIR__ . '/load_env.php';

$dbHost = $_ENV['DB_HOST'] ?? 'localhost';
$dbPort = $_ENV['DB_PORT'] ?? '3306';
$dbName = $_ENV['DB_NAME'] ?? 'u892594395_meufreelas';
$dbUser = $_ENV['DB_USER'] ?? 'u892594395_meufreelas27';
$dbPass = $_ENV['DB_PASS'] ?? '';

header('Content-Type: application/json; charset=utf-8');

$result = ['ok' => false, 'steps' => [], 'errors' => [], 'tables' => [], 'writeTest' => null];

try {
    $dsn = "mysql:host=$dbHost;port=$dbPort;charset=utf8mb4";
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    $result['steps'][] = 'Conexão MySQL (sem database) OK';
} catch (PDOException $e) {
    $result['errors'][] = 'Conexão falhou: ' . $e->getMessage();
    $result['steps'][] = 'Verifique api/.env (DB_HOST, DB_PORT, DB_USER, DB_PASS)';
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

try {
    $pdo->exec("CREATE DATABASE IF NOT EXISTS `" . str_replace('`', '``', $dbName) . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $result['steps'][] = "Database `$dbName` criado/verificado";
} catch (PDOException $e) {
    $result['errors'][] = 'Database: ' . $e->getMessage();
}

try {
    $pdo->exec("USE `" . str_replace('`', '``', $dbName) . "`");
} catch (PDOException $e) {
    $result['errors'][] = 'USE database: ' . $e->getMessage();
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

$createUsers = "CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('freelancer','client','admin') NOT NULL,
    avatar VARCHAR(500) DEFAULT NULL,
    phone VARCHAR(50) DEFAULT NULL,
    location VARCHAR(255) DEFAULT NULL,
    bio TEXT DEFAULT NULL,
    skills JSON DEFAULT NULL,
    hourly_rate VARCHAR(50) DEFAULT NULL,
    rating DECIMAL(3,2) DEFAULT 0,
    completed_projects INT DEFAULT 0,
    has_freelancer_account TINYINT(1) DEFAULT 0,
    has_client_account TINYINT(1) DEFAULT 0,
    is_verified TINYINT(1) DEFAULT 0,
    is_premium TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";

try {
    $pdo->exec($createUsers);
    $result['tables'][] = 'users';
    $result['steps'][] = 'Tabela users criada/verificada';
} catch (PDOException $e) {
    $result['errors'][] = 'users: ' . $e->getMessage();
}

$columnsToAdd = [
    'has_freelancer_account' => "ALTER TABLE users ADD COLUMN has_freelancer_account TINYINT(1) DEFAULT 0",
    'has_client_account'     => "ALTER TABLE users ADD COLUMN has_client_account TINYINT(1) DEFAULT 0",
    'activation_token'       => "ALTER TABLE users ADD COLUMN activation_token VARCHAR(64) DEFAULT NULL",
    'activation_token_expires_at' => "ALTER TABLE users ADD COLUMN activation_token_expires_at TIMESTAMP NULL DEFAULT NULL",
    'password_reset_token'   => "ALTER TABLE users ADD COLUMN password_reset_token VARCHAR(64) DEFAULT NULL",
    'password_reset_expires_at' => "ALTER TABLE users ADD COLUMN password_reset_expires_at TIMESTAMP NULL DEFAULT NULL",
];
foreach ($columnsToAdd as $col => $sql) {
    try {
        $pdo->exec($sql);
        $result['steps'][] = "Coluna $col adicionada";
    } catch (PDOException $e) {
        if (strpos($e->getMessage(), 'Duplicate column') === false) {
            $result['errors'][] = $col . ': ' . $e->getMessage();
        }
    }
}

$otherTables = [
    'projects' => "CREATE TABLE IF NOT EXISTS projects (
        id VARCHAR(36) PRIMARY KEY,
        client_id VARCHAR(36) NOT NULL,
        title VARCHAR(500) NOT NULL,
        description TEXT NOT NULL,
        budget VARCHAR(100) DEFAULT NULL,
        category VARCHAR(255) NOT NULL,
        skills JSON DEFAULT NULL,
        experience_level VARCHAR(50) DEFAULT 'intermediate',
        proposal_days VARCHAR(20) DEFAULT '30',
        visibility VARCHAR(20) DEFAULT 'public',
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_client (client_id),
        INDEX idx_status (status),
        INDEX idx_category (category)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    'proposals' => "CREATE TABLE IF NOT EXISTS proposals (
        id VARCHAR(36) PRIMARY KEY,
        project_id VARCHAR(36) NOT NULL,
        freelancer_id VARCHAR(36) NOT NULL,
        amount VARCHAR(100) NOT NULL,
        delivery_days VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_project (project_id),
        INDEX idx_freelancer (freelancer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    'conversations' => "CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(36) PRIMARY KEY,
        project_id VARCHAR(36) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_project (project_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    'conversation_participants' => "CREATE TABLE IF NOT EXISTS conversation_participants (
        conversation_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        PRIMARY KEY (conversation_id, user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    'messages' => "CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY,
        conversation_id VARCHAR(36) NOT NULL,
        sender_id VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conversation (conversation_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    'favorites' => "CREATE TABLE IF NOT EXISTS favorites (
        user_id VARCHAR(36) NOT NULL,
        freelancer_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, freelancer_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    'payments' => "CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        proposal_id VARCHAR(36) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    'notifications' => "CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT DEFAULT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_read (user_id, is_read)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
    'sanctions' => "CREATE TABLE IF NOT EXISTS sanctions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        reason TEXT NOT NULL,
        sanction_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
];

foreach ($otherTables as $name => $sql) {
    try {
        $pdo->exec($sql);
        $result['tables'][] = $name;
    } catch (PDOException $e) {
        $result['errors'][] = $name . ': ' . $e->getMessage();
    }
}

$testEmail = '__setup_test_' . time() . '@test.local';
$testId = bin2hex(random_bytes(18));
$testHash = password_hash('test', PASSWORD_DEFAULT);
try {
    $stmt = $pdo->prepare('INSERT INTO users (id, email, password_hash, name, type, avatar, rating, completed_projects, has_freelancer_account, has_client_account) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 1, 0)');
    $stmt->execute([$testId, $testEmail, $testHash, 'Setup Test', 'freelancer', null]);
    $pdo->prepare('DELETE FROM users WHERE id = ?')->execute([$testId]);
    $result['writeTest'] = 'OK';
    $result['steps'][] = 'Teste de escrita em users: sucesso';
} catch (PDOException $e) {
    $result['writeTest'] = 'FALHOU';
    $result['errors'][] = 'Teste de escrita: ' . $e->getMessage();
}

$count = 0;
try {
    $r = $pdo->query('SELECT COUNT(*) AS c FROM users');
    if ($r) $count = (int) $r->fetch()['c'];
} catch (PDOException $e) {
    // ignore
}
$result['usersCount'] = $count;

// Verificar se SMTP está configurado (e-mails de ativação, etc.)
$result['smtp_configured'] = false;
if (file_exists(__DIR__ . '/EmailService.php')) {
    require_once __DIR__ . '/EmailService.php';
    $emailService = new EmailService($_ENV);
    $result['smtp_configured'] = $emailService->isConfigured();
}
if (!$result['smtp_configured']) {
    $result['steps'][] = 'SMTP não configurado: defina SMTP_USER e SMTP_PASS no api/.env (senha da caixa noreply@meufreelas.com.br no hPanel) para enviar e-mails de ativação.';
}

$result['ok'] = empty($result['errors']);
$result['message'] = $result['ok']
    ? 'Banco configurado. Tabelas: ' . implode(', ', $result['tables']) . '. Usuários: ' . $count . '. SMTP: ' . ($result['smtp_configured'] ? 'configurado' : 'não configurado') . '.'
    : 'Alguns erros ocorreram. Corrija e rode setup de novo.';

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
