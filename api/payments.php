<?php
/**
 * MeuFreelas - Financeiro / Escrow + Checkout (Stripe/Mercado Pago)
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
$apiOrigin = rtrim((string)(mf_env('API_ORIGIN', 'https://meufreelas.com.br')), '/');
$stripeSecret = trim((string)(mf_env('STRIPE_SECRET_KEY', '')));
$mpAccessToken = trim((string)(mf_env('MERCADOPAGO_ACCESS_TOKEN', '')));
$mpWebhookUrl = trim((string)(mf_env('MERCADOPAGO_WEBHOOK_URL', $apiOrigin . '/api/webhooks/mercadopago.php')));

try {
    $pdo = mf_pdo();
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Erro de conexão com o banco.']);
    exit;
}

function create_notification(PDO $pdo, string $userId, string $title, string $message, string $type = 'payment', ?string $link = null): void {
    $notificationId = bin2hex(random_bytes(18));
    try {
        $stmt = $pdo->prepare('INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$notificationId, $userId, $title, $message, $type, $link]);
        return;
    } catch (Throwable $e) {
        // fallback para esquema antigo sem type/link
    }
    try {
        $stmt = $pdo->prepare('INSERT INTO notifications (id, user_id, title, message) VALUES (?, ?, ?, ?)');
        $stmt->execute([$notificationId, $userId, $title, $message]);
    } catch (Throwable $e) {
        // ignora para não quebrar o fluxo financeiro
    }
}

function fmt_money(float $value): string {
    return 'R$ ' . number_format($value, 2, ',', '.');
}

function parse_amount_to_float(string $raw): float {
    $normalized = str_replace(',', '.', preg_replace('/[^0-9,\.]/', '', $raw) ?: '0');
    return (float)$normalized;
}

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

function payment_status_to_label(string $status): string {
    if ($status === 'released') return 'Concluído';
    if ($status === 'held' || $status === 'pending') return 'Pendente';
    return 'Em processamento';
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = trim((string)($input['action'] ?? ''));
if ($action === '') {
    echo json_encode(['ok' => false, 'error' => 'Ação inválida.']);
    exit;
}

if ($action === 'list_payments') {
    $userId = trim((string)($input['userId'] ?? ''));
    $userType = trim((string)($input['userType'] ?? ''));
    if ($userId === '' || !in_array($userType, ['client', 'freelancer'], true)) {
        echo json_encode(['ok' => false, 'error' => 'userId e userType são obrigatórios.']);
        exit;
    }

    $where = $userType === 'client' ? 'pay.client_id = ?' : 'pay.freelancer_id = ?';
    $sql = "
        SELECT
            pay.id,
            pay.amount,
            pay.platform_fee,
            pay.status,
            pay.created_at,
            pay.released_at,
            pay.provider,
            pr.title AS project_title
        FROM payments pay
        INNER JOIN proposals p ON p.id = pay.proposal_id
        INNER JOIN projects pr ON pr.id = p.project_id
        WHERE $where
        ORDER BY pay.created_at DESC
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute([$userId]);
    $rows = $stmt->fetchAll();

    $available = 0.0;
    $pending = 0.0;
    $monthReceived = 0.0;
    $currentYearMonth = date('Y-m');
    $transactions = [];

    foreach ($rows as $r) {
        $amount = (float)$r['amount'];
        $status = (string)$r['status'];
        $projectTitle = (string)($r['project_title'] ?? '');

        if ($userType === 'freelancer') {
            if ($status === 'released') {
                $available += $amount;
                if (strpos((string)$r['released_at'], $currentYearMonth) === 0) {
                    $monthReceived += $amount;
                }
            } else {
                $pending += $amount;
            }
        } else {
            if ($status !== 'refunded') {
                $monthReceived += $amount;
            }
        }

        $transactions[] = [
            'id' => $r['id'],
            'description' => $userType === 'client' ? 'Pagamento em garantia' : 'Recebimento de projeto',
            'amount' => fmt_money($amount),
            'type' => $userType === 'client' ? 'saida' : 'entrada',
            'rawStatus' => $status,
            'status' => payment_status_to_label($status),
            'date' => $r['created_at'],
            'project' => $projectTitle,
        ];
    }

    echo json_encode([
        'ok' => true,
        'summary' => [
            'balance' => fmt_money($available),
            'pending' => fmt_money($pending),
            'monthReceived' => fmt_money($monthReceived),
        ],
        'transactions' => $transactions,
    ]);
    exit;
}

if ($action === 'create_checkout') {
    $proposalId = trim((string)($input['proposalId'] ?? ''));
    $clientId = trim((string)($input['clientId'] ?? ''));
    $provider = strtolower(trim((string)($input['provider'] ?? 'stripe')));
    $successUrl = trim((string)($input['successUrl'] ?? ($frontendUrl . '/checkout/' . $proposalId . '?payment=success')));
    $cancelUrl = trim((string)($input['cancelUrl'] ?? ($frontendUrl . '/checkout/' . $proposalId . '?payment=cancel')));
    if ($proposalId === '' || $clientId === '' || !in_array($provider, ['stripe', 'mercadopago'], true)) {
        echo json_encode(['ok' => false, 'error' => 'proposalId, clientId e provider são obrigatórios.']);
        exit;
    }

    $query = $pdo->prepare("
        SELECT
            pay.id AS payment_id,
            pay.status AS payment_status,
            pay.amount,
            pay.platform_fee,
            pay.client_id,
            pr.title AS project_title
        FROM payments pay
        INNER JOIN proposals p ON p.id = pay.proposal_id
        INNER JOIN projects pr ON pr.id = p.project_id
        WHERE pay.proposal_id = ?
        LIMIT 1
    ");
    $query->execute([$proposalId]);
    $payment = $query->fetch();
    if (!$payment) {
        echo json_encode(['ok' => false, 'error' => 'Pagamento ainda não foi gerado para esta proposta.']);
        exit;
    }
    if (($payment['client_id'] ?? '') !== $clientId) {
        echo json_encode(['ok' => false, 'error' => 'Sem permissão para pagar esta proposta.']);
        exit;
    }
    if (($payment['payment_status'] ?? '') === 'released') {
        echo json_encode(['ok' => false, 'error' => 'Este pagamento já foi finalizado.']);
        exit;
    }

    $amount = (float)$payment['amount'];
    $platformFee = (float)$payment['platform_fee'];
    $totalAmount = round($amount + $platformFee, 2);
    $paymentId = (string)$payment['payment_id'];
    $projectTitle = (string)($payment['project_title'] ?? 'Projeto MeuFreelas');

    if ($provider === 'stripe') {
        if ($stripeSecret === '') {
            echo json_encode(['ok' => false, 'error' => 'Stripe não configurado no servidor.']);
            exit;
        }
        $res = http_post_form(
            'https://api.stripe.com/v1/checkout/sessions',
            [
                'mode' => 'payment',
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
                'line_items[0][price_data][currency]' => 'brl',
                'line_items[0][price_data][unit_amount]' => (string)max(1, (int)round($totalAmount * 100)),
                'line_items[0][price_data][product_data][name]' => $projectTitle,
                'line_items[0][quantity]' => '1',
                'metadata[payment_id]' => $paymentId,
                'metadata[proposal_id]' => $proposalId,
            ],
            ['Authorization: Bearer ' . $stripeSecret]
        );
        if ($res['error']) {
            echo json_encode(['ok' => false, 'error' => 'Falha de conexão com Stripe.']);
            exit;
        }
        $body = json_decode((string)$res['body'], true) ?? [];
        if ((int)$res['status'] < 200 || (int)$res['status'] >= 300 || empty($body['url']) || empty($body['id'])) {
            echo json_encode(['ok' => false, 'error' => 'Stripe rejeitou a criação do checkout.']);
            exit;
        }
        $upd = $pdo->prepare('UPDATE payments SET provider = "stripe", external_id = ?, checkout_url = ?, status = "processing" WHERE id = ?');
        $upd->execute([(string)$body['id'], (string)$body['url'], $paymentId]);
        echo json_encode(['ok' => true, 'checkoutUrl' => (string)$body['url'], 'paymentId' => $paymentId]);
        exit;
    }

    if ($mpAccessToken === '') {
        echo json_encode(['ok' => false, 'error' => 'Mercado Pago não configurado no servidor.']);
        exit;
    }
    $res = http_post_json(
        'https://api.mercadopago.com/checkout/preferences',
        [
            'items' => [[
                'title' => $projectTitle,
                'quantity' => 1,
                'unit_price' => $totalAmount,
                'currency_id' => 'BRL',
            ]],
            'external_reference' => $paymentId,
            'notification_url' => $mpWebhookUrl,
            'metadata' => [
                'payment_id' => $paymentId,
                'proposal_id' => $proposalId,
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
        echo json_encode(['ok' => false, 'error' => 'Mercado Pago rejeitou a criação do checkout.']);
        exit;
    }
    $upd = $pdo->prepare('UPDATE payments SET provider = "mercadopago", external_id = ?, checkout_url = ?, status = "processing" WHERE id = ?');
    $upd->execute([(string)$body['id'], (string)$body['init_point'], $paymentId]);
    echo json_encode(['ok' => true, 'checkoutUrl' => (string)$body['init_point'], 'paymentId' => $paymentId]);
    exit;
}

if ($action === 'release_payment') {
    $paymentId = trim((string)($input['paymentId'] ?? ''));
    $clientId = trim((string)($input['clientId'] ?? ''));
    if ($paymentId === '' || $clientId === '') {
        echo json_encode(['ok' => false, 'error' => 'paymentId e clientId são obrigatórios.']);
        exit;
    }
    $check = $pdo->prepare('SELECT id, client_id, freelancer_id, status FROM payments WHERE id = ? LIMIT 1');
    $check->execute([$paymentId]);
    $payment = $check->fetch();
    if (!$payment) {
        echo json_encode(['ok' => false, 'error' => 'Pagamento não encontrado.']);
        exit;
    }
    if (($payment['client_id'] ?? '') !== $clientId) {
        echo json_encode(['ok' => false, 'error' => 'Sem permissão para liberar este pagamento.']);
        exit;
    }
    if (($payment['status'] ?? '') !== 'held') {
        echo json_encode(['ok' => false, 'error' => 'Pagamento não está em garantia.']);
        exit;
    }
    $upd = $pdo->prepare('UPDATE payments SET status = "released", released_at = NOW() WHERE id = ?');
    $upd->execute([$paymentId]);

    if (!empty($payment['freelancer_id'])) {
        create_notification(
            $pdo,
            (string)$payment['freelancer_id'],
            'Pagamento liberado',
            'Seu pagamento foi liberado pelo cliente.',
            'payment',
            '/payments'
        );
    }

    echo json_encode(['ok' => true, 'message' => 'Pagamento liberado com sucesso.']);
    exit;
}

echo json_encode(['ok' => false, 'error' => 'Ação inválida.']);
