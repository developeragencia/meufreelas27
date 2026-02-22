<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db.php';

$stripeWebhookSecret = trim((string)(mf_env('STRIPE_WEBHOOK_SECRET', '')));

try {
    $pdo = mf_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false]);
    exit;
}

$payload = file_get_contents('php://input') ?: '';
$sigHeader = $_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '';

if ($stripeWebhookSecret !== '' && $sigHeader !== '') {
    $parts = [];
    foreach (explode(',', $sigHeader) as $part) {
        [$k, $v] = array_pad(explode('=', trim($part), 2), 2, null);
        if ($k && $v) $parts[$k] = $v;
    }
    if (!empty($parts['t']) && !empty($parts['v1'])) {
        $expected = hash_hmac('sha256', $parts['t'] . '.' . $payload, $stripeWebhookSecret);
        if (!hash_equals($expected, $parts['v1'])) {
            http_response_code(400);
            echo json_encode(['ok' => false, 'error' => 'Assinatura inválida']);
            exit;
        }
    }
}

$event = json_decode($payload, true) ?? [];
if (($event['type'] ?? '') !== 'checkout.session.completed') {
    echo json_encode(['ok' => true, 'ignored' => true]);
    exit;
}

$session = $event['data']['object'] ?? [];
$externalId = (string)($session['id'] ?? '');
$metadata = $session['metadata'] ?? [];
$paymentId = (string)($metadata['payment_id'] ?? '');
$subscriptionId = (string)($metadata['subscription_id'] ?? '');

if ($subscriptionId !== '') {
    $stmt = $pdo->prepare('SELECT id, user_id, plan_code, billing_cycle FROM user_subscriptions WHERE id = ? AND status = ? LIMIT 1');
    $stmt->execute([$subscriptionId, 'pending']);
    $sub = $stmt->fetch();
    if ($sub) {
        $interval = ($sub['billing_cycle'] ?? '') === 'yearly' ? '1 YEAR' : '1 MONTH';
        $pdo->prepare('UPDATE user_subscriptions SET status = ?, started_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL ' . $interval . '), external_id = ? WHERE id = ?')
            ->execute(['active', $externalId, $subscriptionId]);
        $planType = (string)($sub['plan_code'] ?? 'pro');
        $pdo->prepare('UPDATE users SET is_premium = 1, plan_type = ?, plan_expires_at = DATE_ADD(NOW(), INTERVAL ' . $interval . ') WHERE id = ?')
            ->execute([$planType, $sub['user_id']]);
    }
    echo json_encode(['ok' => true]);
    exit;
}

if ($paymentId === '' && $externalId !== '') {
    $stmt = $pdo->prepare('SELECT id FROM payments WHERE external_id = ? LIMIT 1');
    $stmt->execute([$externalId]);
    $row = $stmt->fetch();
    if ($row) $paymentId = (string)$row['id'];
}
if ($paymentId === '') {
    echo json_encode(['ok' => true, 'ignored' => true]);
    exit;
}

$upd = $pdo->prepare('UPDATE payments SET status = "held" WHERE id = ? AND status IN ("pending","processing")');
$upd->execute([$paymentId]);
echo json_encode(['ok' => true]);
