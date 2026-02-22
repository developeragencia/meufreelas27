<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../load_env.php';

$dbHost = $_ENV['DB_HOST'] ?? 'localhost';
$dbPort = $_ENV['DB_PORT'] ?? '3306';
$dbName = $_ENV['DB_NAME'] ?? 'u892594395_meufreelas';
$dbUser = $_ENV['DB_USER'] ?? 'u892594395_meufreelas27';
$dbPass = $_ENV['DB_PASS'] ?? '';
$stripeWebhookSecret = trim((string)($_ENV['STRIPE_WEBHOOK_SECRET'] ?? ''));

try {
    $pdo = new PDO(
        "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
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
$paymentId = (string)($session['metadata']['payment_id'] ?? '');
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
