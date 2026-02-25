<?php
require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

try {
    $pdo = mf_pdo();
    
    // Add stripe_customer_id column to users if not exists
    try {
        $pdo->query("SELECT stripe_customer_id FROM users LIMIT 1");
    } catch (Exception $e) {
        $pdo->exec("ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) DEFAULT NULL");
        echo "Coluna 'stripe_customer_id' adicionada com sucesso.\n";
    }

    echo json_encode(['ok' => true, 'message' => 'Schema updated successfully for Stripe']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => $e->getMessage()]);
}
