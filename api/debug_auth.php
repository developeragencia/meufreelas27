<?php
ini_set('display_errors', 1);
error_reporting(E_ALL);

// Simular POST login
$_SERVER['REQUEST_METHOD'] = 'POST';
$_POST['action'] = 'login';
// Mock input
$input = json_encode(['action' => 'login', 'email' => 'test@test.com', 'password' => 'test']);
// Override file_get_contents to return mock input? No easy way.
// Instead, let's just include auth.php and see if it crashes before reading input.
// Actually, auth.php reads php://input. I can't easily mock that without stream wrapper.

// Let's just check if we can require db.php without error.
try {
    require_once __DIR__ . '/db.php';
    echo "DB Loaded OK\n";
    $pdo = mf_pdo();
    echo "PDO OK\n";
} catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
    echo "Trace: " . $e->getTraceAsString() . "\n";
}
