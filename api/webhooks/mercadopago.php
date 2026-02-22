<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../db.php';

$mpAccessToken = trim((string)(mf_env('MERCADOPAGO_ACCESS_TOKEN', '')));

try {
    $pdo = mf_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false]);
    exit;
}

$topic = $_GET['topic'] ?? ($_GET['type'] ?? '');
$id = $_GET['id'] ?? ($_GET['data_id'] ?? '');
$raw = file_get_contents('php://input') ?: '';
$payload = json_decode($raw, true) ?? [];
if ($id === '' && isset($payload['data']['id'])) $id = (string)$payload['data']['id'];
if ($topic === '' && isset($payload['type'])) $topic = (string)$payload['type'];

if ($mpAccessToken === '' || $id === '' || !in_array($topic, ['payment', 'payments'], true)) {
    echo json_encode(['ok' => true, 'ignored' => true]);
    exit;
}

$ch = curl_init('https://api.mercadopago.com/v1/payments/' . rawurlencode($id));
curl_setopt_array($ch, [
    CURLOPT_HTTPGET => true,
    CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . $mpAccessToken],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 30,
]);
$resp = curl_exec($ch);
$status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
if ($status < 200 || $status >= 300) {
    echo json_encode(['ok' => true, 'ignored' => true]);
    exit;
}

$paymentData = json_decode((string)$resp, true) ?? [];
$paymentStatus = (string)($paymentData['status'] ?? '');
$externalReference = (string)($paymentData['external_reference'] ?? '');
if ($externalReference === '') {
    echo json_encode(['ok' => true, 'ignored' => true]);
    exit;
}

if ($paymentStatus === 'approved') {
    $stmt = $pdo->prepare('SELECT id, user_id, plan_code, billing_cycle FROM user_subscriptions WHERE id = ? AND status = ? LIMIT 1');
    $stmt->execute([$externalReference, 'pending']);
    $sub = $stmt->fetch();
    if ($sub) {
        $interval = ($sub['billing_cycle'] ?? '') === 'yearly' ? '1 YEAR' : '1 MONTH';
        $pdo->prepare('UPDATE user_subscriptions SET status = ?, started_at = NOW(), expires_at = DATE_ADD(NOW(), INTERVAL ' . $interval . '), external_id = ? WHERE id = ?')
            ->execute(['active', (string)$id, $sub['id']]);
        $planType = (string)($sub['plan_code'] ?? 'pro');
        $pdo->prepare('UPDATE users SET is_premium = 1, plan_type = ?, plan_expires_at = DATE_ADD(NOW(), INTERVAL ' . $interval . ') WHERE id = ?')
            ->execute([$planType, $sub['user_id']]);
    } else {
        $upd = $pdo->prepare('UPDATE payments SET status = "held", external_id = ? WHERE id = ? AND status IN ("pending","processing")');
        $upd->execute([(string)$id, $externalReference]);
    }
}

echo json_encode(['ok' => true]);
