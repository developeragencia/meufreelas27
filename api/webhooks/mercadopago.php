<?php
header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/../load_env.php';

$dbHost = $_ENV['DB_HOST'] ?? 'localhost';
$dbPort = $_ENV['DB_PORT'] ?? '3306';
$dbName = $_ENV['DB_NAME'] ?? 'u892594395_meufreelas';
$dbUser = $_ENV['DB_USER'] ?? 'u892594395_meufreelas27';
$dbPass = $_ENV['DB_PASS'] ?? '';
$mpAccessToken = trim((string)($_ENV['MERCADOPAGO_ACCESS_TOKEN'] ?? ''));

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
    $upd = $pdo->prepare('UPDATE payments SET status = "held", external_id = ? WHERE id = ? AND status IN ("pending","processing")');
    $upd->execute([(string)$id, $externalReference]);
}

echo json_encode(['ok' => true]);
