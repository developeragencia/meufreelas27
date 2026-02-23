<?php
/**
 * MeuFreelas - Assinaturas (checkout Stripe / Mercado Pago para planos Pro e Premium)
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

require_once __DIR__ . '/db.php';

$frontendUrl = rtrim((string)(mf_first_env(['FRONTEND_URL', 'VITE_APP_DOMAIN'], 'https://meufreelas.com.br')), '/');
$stripeSecret = trim((string)(mf_first_env(['STRIPE_SECRET_KEY', 'STRIPE_SECRET', 'STRIPE_API_KEY'], '')));
$mpAccessToken = trim((string)(mf_first_env(['MERCADOPAGO_ACCESS_TOKEN', 'MP_ACCESS_TOKEN'], '')));
$apiOrigin = rtrim((string)(mf_env('API_ORIGIN', 'https://meufreelas.com.br')), '/');
$mpWebhookUrl = trim((string)(mf_first_env(['MERCADOPAGO_WEBHOOK_URL'], $apiOrigin . '/api/webhooks/mercadopago.php')));

function env_key_configured(string $value): bool {
    if ($value === '') return false;
    if (preg_match('/COLOQUE|substitua|SUBSTITUA|placeholder|example|sk_live_51ABCdef|APP_USR-12345/i', $value)) return false;
    if (preg_match('/^sk_(live|test)_[a-zA-Z0-9]{20,}$/', $value)) return true;
    if (preg_match('/^APP_USR-[a-zA-Z0-9\-]{30,}$/', $value)) return true;
    return false;
}

function stripe_error_message(array $body): string {
    if (!empty($body['error']['message'])) return 'Stripe: ' . (string)$body['error']['message'];
    if (!empty($body['error']['code'])) return 'Stripe: ' . (string)$body['error']['code'];
    return 'Stripe rejeitou a criação do checkout.';
}

function mp_error_message(array $body): string {
    if (!empty($body['message'])) return 'Mercado Pago: ' . (string)$body['message'];
    if (!empty($body['cause'][0]['description'])) return 'Mercado Pago: ' . (string)$body['cause'][0]['description'];
    return 'Mercado Pago rejeitou a criação do checkout.';
}

try {
    $pdo = mf_pdo();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Erro de conexão com o banco.']);
    exit;
}

$plans = [
    'pro' => ['monthly' => 49.00, 'yearly' => 468.00],
    'premium' => ['monthly' => 99.00, 'yearly' => 948.00],
];

function http_post_form(string $url, array $data, array $headers = []): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => http_build_query($data),
        CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/x-www-form-urlencoded'], $headers),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
    ]);
    $resp = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    return ['status' => $status, 'body' => (string)$resp, 'error' => $err];
}

function http_post_json(string $url, array $data, array $headers = []): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json'], $headers),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 30,
    ]);
    $resp = curl_exec($ch);
    $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    return ['status' => $status, 'body' => (string)$resp, 'error' => $err];
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = trim((string)($input['action'] ?? ''));
if ($action !== 'create_checkout') {
    echo json_encode(['ok' => false, 'error' => 'Ação inválida. Use action: create_checkout.']);
    exit;
}

$userId = trim((string)($input['userId'] ?? ''));
$planCode = strtolower(trim((string)($input['planCode'] ?? '')));
$billingCycle = strtolower(trim((string)($input['billingCycle'] ?? 'monthly')));
$provider = strtolower(trim((string)($input['provider'] ?? 'stripe')));
$successUrl = trim((string)($input['successUrl'] ?? $frontendUrl . '/premium?subscription=success'));
$cancelUrl = trim((string)($input['cancelUrl'] ?? $frontendUrl . '/premium?subscription=cancel'));

if ($userId === '' || !isset($plans[$planCode]) || !in_array($billingCycle, ['monthly', 'yearly'], true) || !in_array($provider, ['stripe', 'mercadopago'], true)) {
    echo json_encode(['ok' => false, 'error' => 'Parâmetros inválidos: userId, planCode (pro|premium), billingCycle (monthly|yearly), provider (stripe|mercadopago).']);
    exit;
}

$amount = $plans[$planCode][$billingCycle];
$amountCents = (int)round($amount * 100);
$planLabel = $planCode === 'premium' ? 'Premium' : 'Pro';
$periodLabel = $billingCycle === 'yearly' ? 'Anual' : 'Mensal';

$subId = bin2hex(random_bytes(18));
$stmt = $pdo->prepare('INSERT INTO user_subscriptions (id, user_id, plan_code, billing_cycle, provider, amount, status) VALUES (?, ?, ?, ?, ?, ?, ?)');
$stmt->execute([$subId, $userId, $planCode, $billingCycle, $provider, $amount, 'pending']);

if ($provider === 'stripe') {
    if (!env_key_configured($stripeSecret)) {
        echo json_encode(['ok' => false, 'error' => 'Stripe não configurado no servidor. Coloque STRIPE_SECRET_KEY (sk_live_...) em api/.env no servidor ou nas variáveis da Hostinger.']);
        exit;
    }
    $res = http_post_form(
        'https://api.stripe.com/v1/checkout/sessions',
        [
            'mode' => 'payment',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'line_items[0][price_data][currency]' => 'brl',
            'line_items[0][price_data][unit_amount]' => (string)max(1, $amountCents),
            'line_items[0][price_data][product_data][name]' => 'MeuFreelas ' . $planLabel . ' - ' . $periodLabel,
            'line_items[0][quantity]' => '1',
            'metadata[subscription_id]' => $subId,
            'metadata[user_id]' => $userId,
            'metadata[plan_code]' => $planCode,
            'metadata[billing_cycle]' => $billingCycle,
        ],
        ['Authorization: Bearer ' . $stripeSecret]
    );
    if ($res['error']) {
        echo json_encode(['ok' => false, 'error' => 'Falha de conexão com Stripe.']);
        exit;
    }
    $body = json_decode((string)$res['body'], true) ?? [];
    if ((int)$res['status'] < 200 || (int)$res['status'] >= 300 || empty($body['url']) || empty($body['id'])) {
        echo json_encode(['ok' => false, 'error' => stripe_error_message($body)]);
        exit;
    }
    $pdo->prepare('UPDATE user_subscriptions SET external_id = ?, checkout_url = ? WHERE id = ?')->execute([(string)$body['id'], (string)$body['url'], $subId]);
    echo json_encode(['ok' => true, 'checkoutUrl' => (string)$body['url'], 'subscriptionId' => $subId]);
    exit;
}

if (!env_key_configured($mpAccessToken)) {
    echo json_encode(['ok' => false, 'error' => 'Mercado Pago não configurado no servidor. Coloque MERCADOPAGO_ACCESS_TOKEN (APP_USR_...) em api/.env no servidor ou nas variáveis da Hostinger.']);
    exit;
}
$res = http_post_json(
    'https://api.mercadopago.com/checkout/preferences',
    [
        'items' => [[
            'title' => 'MeuFreelas ' . $planLabel . ' - ' . $periodLabel,
            'quantity' => 1,
            'unit_price' => $amount,
            'currency_id' => 'BRL',
        ]],
        'external_reference' => $subId,
        'notification_url' => $mpWebhookUrl,
        'metadata' => [
            'subscription_id' => $subId,
            'user_id' => $userId,
            'plan_code' => $planCode,
            'billing_cycle' => $billingCycle,
        ],
        'back_urls' => [
            'success' => $successUrl,
            'failure' => $cancelUrl,
            'pending' => $cancelUrl,
        ],
        'auto_return' => 'approved',
    ],
    ['Authorization: Bearer ' . $mpAccessToken]
);
if ($res['error']) {
    echo json_encode(['ok' => false, 'error' => 'Falha de conexão com Mercado Pago.']);
    exit;
}
$body = json_decode((string)$res['body'], true) ?? [];
if ((int)$res['status'] < 200 || (int)$res['status'] >= 300 || empty($body['init_point']) || empty($body['id'])) {
    echo json_encode(['ok' => false, 'error' => mp_error_message($body)]);
    exit;
}
$pdo->prepare('UPDATE user_subscriptions SET external_id = ?, checkout_url = ? WHERE id = ?')->execute([(string)$body['id'], (string)$body['init_point'], $subId]);
echo json_encode(['ok' => true, 'checkoutUrl' => (string)$body['init_point'], 'subscriptionId' => $subId]);
