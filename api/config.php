<?php
/**
 * MeuFreelas - Configuração API (Hostinger - meufreelas.com.br)
 * Carrega variáveis de .env ou usa padrão para produção.
 */

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

/**
 * Helper para carregar variáveis de ambiente de forma segura
 */
function mf_env($key, $default = null) {
    return $_ENV[$key] ?? getenv($key) ?? $default;
}

// Configurações do ReCaptcha
$_ENV['RECAPTCHA_SECRET_KEY'] = mf_env('RECAPTCHA_SECRET_KEY', '6LdAHncsAAAAANvPjU4sL2hG3Qup2glxhbALzVud');

define('DB_HOST', mf_env('DB_HOST', 'localhost'));
define('DB_PORT', $_ENV['DB_PORT'] ?? '3306');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'u892594395_meufreelas');
define('DB_USER', $_ENV['DB_USER'] ?? 'u892594395_meufreelas27');
define('DB_PASS', $_ENV['DB_PASS'] ?? '');
define('API_ORIGIN', $_ENV['API_ORIGIN'] ?? 'https://meufreelas.com.br');

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . API_ORIGIN);
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        $dsn = 'mysql:host=' . DB_HOST . ';port=' . DB_PORT . ';dbname=' . DB_NAME . ';charset=utf8mb4';
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ]);
    }
    return $pdo;
}
