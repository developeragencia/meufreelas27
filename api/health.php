<?php
/**
 * MeuFreelas - Health check (API + banco)
 * GET https://meufreelas.com.br/api/health.php
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

$ok = true;
$db = 'off';
$usersCount = 0;

try {
    $pdo = new PDO(
        "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    $db = 'on';
    $r = $pdo->query('SELECT COUNT(*) AS c FROM users');
    if ($r) $usersCount = (int) $r->fetch()['c'];
} catch (PDOException $e) {
    $ok = false;
    $db = 'error: ' . $e->getMessage();
}

echo json_encode([
    'ok' => $ok,
    'api' => 'on',
    'database' => $db,
    'usersCount' => $usersCount,
    'message' => $ok ? 'API e banco OK. Cadastro e login salvam em users.' : 'Verifique api/.env e rode api/setup.php',
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
