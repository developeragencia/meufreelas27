<?php
// api/v2/checkout.php
// Endpoint minimalista e blindado para criação de assinaturas

// 1. Configurações Iniciais
ob_start();
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');

// 2. Dependências
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/db.php';

// 3. CORS
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
    ob_end_clean();
    exit(0);
}

// 4. Autenticação (JWT Simplificado)
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

function jwt_decode_simple($token) {
    $parts = explode('.', $token);
    if (count($parts) !== 3) return null;
    $payload = $parts[1];
    $data = base64_decode(strtr($payload, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($payload)) % 4));
    return json_decode($data, true);
}

try {
    $token = get_bearer_token();
    if (!$token) throw new Exception('Token não fornecido', 401);
    
    $payload = jwt_decode_simple($token);
    if (!$payload || !isset($payload['sub'])) throw new Exception('Token inválido', 401);
    
    $userId = $payload['sub'];
    
    $pdo = mf_pdo();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$userId]);
    $user = $stmt->fetch();
    
    if (!$user) throw new Exception('Usuário não encontrado', 401);

    // 5. Processamento do Checkout
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') throw new Exception('Método inválido', 405);
    
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    if (!isset($data['plan']) || !isset($data['price'])) throw new Exception('Dados incompletos');

    // Configurar Stripe
    \Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

    // Obter Customer
    $customerId = $user['stripe_customer_id'] ?? null;
    if ($customerId) {
        try {
            $customer = \Stripe\Customer::retrieve($customerId);
            if ($customer->deleted) $customerId = null;
        } catch (Exception $e) { $customerId = null; }
    }

    if (!$customerId) {
        $customer = \Stripe\Customer::create([
            'email' => $user['email'],
            'name' => $user['name'],
            'metadata' => ['user_id' => $user['id']]
        ]);
        $customerId = $customer->id;
        
        // Salvar ID (com self-healing)
        try {
            $pdo->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?")->execute([$customerId, $user['id']]);
        } catch (Exception $e) {
            $pdo->exec("ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) DEFAULT NULL");
            $pdo->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?")->execute([$customerId, $user['id']]);
        }
    }

    // Criar Sessão de Checkout (Redirect) em vez de Assinatura Direta
    $amount = (int)($data['price'] * 100);
    $cycle = $data['cycle'] ?? 'month'; 
    $planName = $data['title'] ?? 'Assinatura Premium';
    
    // URL de retorno
    $successUrl = $_ENV['FRONTEND_URL'] . "/payments/success";
    $cancelUrl = $_ENV['FRONTEND_URL'] . "/payments/cancel";

    $subscriptionIdLocal = bin2hex(random_bytes(18));
    $billingCycle = ($cycle === 'year') ? 'yearly' : 'monthly';
    
    // Inserir Pending Subscription
    $pdo->prepare("INSERT INTO user_subscriptions (id, user_id, plan_code, billing_cycle, provider, amount, status, created_at) VALUES (?, ?, ?, ?, 'stripe', ?, 'pending', NOW())")
        ->execute([$subscriptionIdLocal, $user['id'], $data['plan'], $billingCycle, (float)$data['price']]);

    // Criar Sessão do Stripe
    $session = \Stripe\Checkout\Session::create([
        'customer' => $customerId,
        'payment_method_types' => ['card'],
        'line_items' => [[
            'price_data' => [
                'currency' => 'brl',
                'product_data' => [
                    'name' => $planName,
                ],
                'unit_amount' => $amount,
                'recurring' => ['interval' => $cycle],
            ],
            'quantity' => 1,
        ]],
        'mode' => 'subscription',
        'success_url' => $successUrl,
        'cancel_url' => $cancelUrl,
        'metadata' => [
            'user_id' => $user['id'],
            'plan' => $data['plan'],
            'subscription_id' => $subscriptionIdLocal,
            'cycle' => $billingCycle
        ]
    ]);
    
    // Atualizar External ID com o ID da Sessão
    $pdo->prepare("UPDATE user_subscriptions SET external_id = ?, checkout_url = ? WHERE id = ?")
        ->execute([$session->id, $session->url, $subscriptionIdLocal]);

    ob_clean();
    echo json_encode([
        'url' => $session->url,
        'subscriptionId' => $subscriptionIdLocal
    ]);

} catch (Throwable $e) {
    ob_clean();
    http_response_code(500);
    echo json_encode([
        'error' => $e->getMessage(),
        'file' => basename($e->getFile()),
        'line' => $e->getLine()
    ]);
}
