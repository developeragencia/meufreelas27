<?php
// api/test_stripe_connection.php
ob_start();
ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

try {
    if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
        throw new Exception('vendor/autoload.php missing');
    }
    require_once __DIR__ . '/vendor/autoload.php';
    
    if (!file_exists(__DIR__ . '/config.php')) {
        throw new Exception('config.php missing');
    }
    require_once __DIR__ . '/config.php'; // Loads .env

    if (!isset($_ENV['STRIPE_SECRET_KEY'])) {
        throw new Exception('STRIPE_SECRET_KEY not set');
    }

    \Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

    // Test connection by retrieving account details
    $account = \Stripe\Account::retrieve();

    echo json_encode([
        'status' => 'ok',
        'stripe_account_id' => $account->id,
        'mode' => \Stripe\Stripe::$apiKey ? (substr(\Stripe\Stripe::$apiKey, 0, 7) === 'sk_live' ? 'live' : 'test') : 'unknown'
    ]);

} catch (Throwable $e) {
    echo json_encode([
        'status' => 'error',
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine()
    ]);
}
