<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

// Enable CORS explicitly for payments
if (isset($_SERVER['HTTP_ORIGIN'])) {
    header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
    header('Access-Control-Allow-Credentials: true');
    header('Access-Control-Max-Age: 86400');
}
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_METHOD']))
        header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    if (isset($_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']))
        header("Access-Control-Allow-Headers: {$_SERVER['HTTP_ACCESS_CONTROL_REQUEST_HEADERS']}");
    exit(0);
}

// --- JWT Helper Functions (Inlined to avoid require errors) ---
function jwt_base64url_decode($data) {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
}
function jwt_decode($token, $secret) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    $header = $parts[0];
    $payload = $parts[1];
    $signatureProvided = $parts[2];
    
    // Recalculate signature to verify
    function jwt_base64url_encode_verify($data) { return rtrim(strtr(base64_encode($data), '+/', '-_'), '='); }
    
    $signatureGenerated = hash_hmac('sha256', $header . "." . $payload, $secret, true);
    $base64UrlSignatureGenerated = jwt_base64url_encode_verify($signatureGenerated);
    
    if (!hash_equals($base64UrlSignatureGenerated, $signatureProvided)) return null;
    
    $payloadDecoded = json_decode(jwt_base64url_decode($payload), true);
    if (isset($payloadDecoded['exp']) && $payloadDecoded['exp'] < time()) return null;
    return $payloadDecoded;
}
function get_bearer_token() {
    $headers = null;
    if (isset($_SERVER['Authorization'])) $headers = trim($_SERVER['Authorization']);
    else if (isset($_SERVER['HTTP_AUTHORIZATION'])) $headers = trim($_SERVER['HTTP_AUTHORIZATION']);
    elseif (function_exists('apache_request_headers')) {
        $requestHeaders = apache_request_headers();
        $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
        if (isset($requestHeaders['Authorization'])) $headers = trim($requestHeaders['Authorization']);
    }
    if (!empty($headers)) if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) return $matches[1];
    return null;
}
// -------------------------------------------------------------

header('Content-Type: application/json');

// Função de autenticação local (substitui a do auth.php)
function authenticate() {
    $token = get_bearer_token();
    if (!$token) return null;
    
    $secret = $_ENV['JWT_SECRET'] ?? 'meufreelas_secret_key_change_this';
    $payload = jwt_decode($token, $secret);
    
    if (!$payload || !isset($payload['sub'])) return null;
    
    try {
        $pdo = mf_pdo();
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
        $stmt->execute([$payload['sub']]);
        return $stmt->fetch();
    } catch (Exception $e) {
        return null;
    }
}

// Verificar autenticação
$user = authenticate();
if (!$user) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Configurar Stripe
\Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // 1. Criar Checkout Session do Stripe (Redirecionamento)
    if ($action === 'create_checkout_session') {
        try {
            $amount = (int)($data['price'] * 100); // Em centavos
            $title = $data['title'] ?? 'Plano Premium';
            $successUrl = $data['successUrl'] ?? ($_ENV['FRONTEND_URL'] . "/payments/success");
            $cancelUrl = $data['cancelUrl'] ?? ($_ENV['FRONTEND_URL'] . "/payments/cancel");

            // Criar registro de assinatura pendente no banco
            $subscriptionId = bin2hex(random_bytes(18));
            $planCode = $data['plan'] ?? 'pro'; // pro, premium
            $billingCycle = $data['cycle'] ?? 'monthly'; // monthly, yearly
            
            $stmtSub = $pdo->prepare("INSERT INTO user_subscriptions (id, user_id, plan_code, billing_cycle, provider, amount, status, created_at) VALUES (?, ?, ?, ?, 'stripe', ?, 'pending', NOW())");
            $stmtSub->execute([$subscriptionId, $user['id'], $planCode, $billingCycle, (float)$data['price']]);

            $session = \Stripe\Checkout\Session::create([
                'payment_method_types' => ['card'],
                'line_items' => [[
                    'price_data' => [
                        'currency' => 'brl',
                        'product_data' => [
                            'name' => $title,
                        ],
                        'unit_amount' => $amount,
                    ],
                    'quantity' => 1,
                ]],
                'mode' => 'payment',
                'success_url' => $successUrl,
                'cancel_url' => $cancelUrl,
                'customer_email' => $user['email'],
                'metadata' => [
                    'user_id' => $user['id'],
                    'type' => $data['type'], // subscription
                    'plan' => $planCode,
                    'subscription_id' => $subscriptionId,
                    'project_id' => $data['project_id'] ?? null
                ],
            ]);
            
            // Atualizar o registro com o ID externo
            $pdo->prepare("UPDATE user_subscriptions SET external_id = ?, checkout_url = ? WHERE id = ?")
                ->execute([$session->id, $session->url, $subscriptionId]);

            echo json_encode(['url' => $session->url]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => 'Stripe Checkout Error: ' . $e->getMessage()]);
        }
    }
    
    // Fallback para rotas inexistentes
    else {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
    }
}
