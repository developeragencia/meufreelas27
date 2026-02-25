<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

require_once __DIR__ . '/config.php';

$response = [
    'env_loaded' => false,
    'db_host' => getenv('DB_HOST') ?: $_ENV['DB_HOST'] ?? 'not set',
    'db_name' => getenv('DB_NAME') ?: $_ENV['DB_NAME'] ?? 'not set',
    'db_user' => getenv('DB_USER') ?: $_ENV['DB_USER'] ?? 'not set',
    'connection' => 'pending'
];

try {
    $host = $response['db_host'];
    $dbname = $response['db_name'];
    $user = $response['db_user'];
    $pass = getenv('DB_PASS') ?: $_ENV['DB_PASS'] ?? '';
    
    if ($host === 'not set') {
        throw new Exception('Variáveis de ambiente do banco de dados não encontradas.');
    }

    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8mb4";
    $pdo = new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    
    $response['connection'] = 'success';
    $response['server_info'] = $pdo->getAttribute(PDO::ATTR_SERVER_INFO);
    
} catch (PDOException $e) {
    $response['connection'] = 'failed';
    $response['error'] = $e->getMessage();
} catch (Exception $e) {
    $response['connection'] = 'failed';
    $response['error'] = $e->getMessage();
}

echo json_encode($response);
