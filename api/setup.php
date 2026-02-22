<?php
/**
 * MeuFreelas - Criação automática das tabelas (executar uma vez na Hostinger)
 * Acesso: https://meufreelas.com.br/api/setup.php
 */
error_reporting(E_ALL);
ini_set('display_errors', '0');

$envFile = __DIR__ . '/.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        if (strpos($line, '=') !== false) {
            list($key, $val) = explode('=', $line, 2);
            $_ENV[trim($key)] = trim($val, " \t\"'");
        }
    }
}

$dbHost = $_ENV['DB_HOST'] ?? 'localhost';
$dbPort = $_ENV['DB_PORT'] ?? '3306';
$dbName = $_ENV['DB_NAME'] ?? 'u892594395_meufreelas';
$dbUser = $_ENV['DB_USER'] ?? 'u892594395_meufreelas27';
$dbPass = $_ENV['DB_PASS'] ?? '';

header('Content-Type: application/json; charset=utf-8');

try {
    $dsn = 'mysql:host=' . $dbHost . ';port=' . $dbPort . ';dbname=' . $dbName . ';charset=utf8mb4';
    $pdo = new PDO($dsn, $dbUser, $dbPass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    die(json_encode([
        'ok' => false,
        'error' => 'Conexão com o banco falhou.',
        'detail' => $e->getMessage(),
        'dica' => 'Confira api/.env (DB_HOST, DB_NAME, DB_USER, DB_PASS) e se a pasta api/ está em public_html/api/ na Hostinger.'
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
}

$created = [];
$errors = [];

$tables = [
    "CREATE TABLE IF NOT EXISTS users (
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
    )",
    "CREATE TABLE IF NOT EXISTS projects (
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
        INDEX idx_category (category),
        FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS proposals (
        id VARCHAR(36) PRIMARY KEY,
        project_id VARCHAR(36) NOT NULL,
        freelancer_id VARCHAR(36) NOT NULL,
        amount VARCHAR(100) NOT NULL,
        delivery_days VARCHAR(20) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_project (project_id),
        INDEX idx_freelancer (freelancer_id),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS conversations (
        id VARCHAR(36) PRIMARY KEY,
        project_id VARCHAR(36) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_project (project_id)
    )",
    "CREATE TABLE IF NOT EXISTS conversation_participants (
        conversation_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        PRIMARY KEY (conversation_id, user_id),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(36) PRIMARY KEY,
        conversation_id VARCHAR(36) NOT NULL,
        sender_id VARCHAR(36) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_conversation (conversation_id),
        FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS favorites (
        user_id VARCHAR(36) NOT NULL,
        freelancer_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (user_id, freelancer_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        proposal_id VARCHAR(36) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (proposal_id) REFERENCES proposals(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT DEFAULT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user_read (user_id, is_read),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS sanctions (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        reason TEXT NOT NULL,
        sanction_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_user (user_id),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )"
];

foreach ($tables as $sql) {
    try {
        $pdo->exec($sql);
        preg_match('/CREATE TABLE IF NOT EXISTS (\w+)/', $sql, $m);
        if (!empty($m[1])) $created[] = $m[1];
    } catch (PDOException $e) {
        $errors[] = $e->getMessage();
    }
}

echo json_encode([
    'ok' => empty($errors),
    'tables' => $created,
    'errors' => $errors,
    'message' => empty($errors) ? 'Tabelas criadas/verificadas com sucesso.' : 'Algumas tabelas falharam.'
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
