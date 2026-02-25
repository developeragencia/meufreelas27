<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    $pdo = mf_pdo();
    
    // 1. Add connections column to users
    try {
        $pdo->query("SELECT connections FROM users LIMIT 1");
    } catch (Exception $e) {
        $pdo->exec("ALTER TABLE users ADD COLUMN connections INT DEFAULT 10");
        echo "Coluna 'connections' adicionada com sucesso.\n";
    }

    // 2. Ensure user_subscriptions has necessary columns
    // (Already checked in schema.sql, looks fine, but ensure logic matches)
    
    echo json_encode(['ok' => true, 'message' => 'Schema updated successfully']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
