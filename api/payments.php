<?php
// Prevent any output before our JSON
ob_start();

// Force error reporting to be hidden from output, we will catch them
ini_set('display_errors', 0);
ini_set('log_errors', 1);
error_reporting(E_ALL);

header('Content-Type: application/json');

// Global Exception Handler
try {
    // 1. Check Dependencies
    if (!file_exists(__DIR__ . '/vendor/autoload.php')) {
        throw new Exception('vendor/autoload.php not found. Please run "composer install".');
    }
    require_once __DIR__ . '/vendor/autoload.php';

    if (!file_exists(__DIR__ . '/config.php')) {
        throw new Exception('config.php not found.');
    }
    require_once __DIR__ . '/config.php';

    if (!file_exists(__DIR__ . '/db.php')) {
        throw new Exception('db.php not found.');
    }
    require_once __DIR__ . '/db.php';

    // 2. CORS
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

    // 3. JWT Helpers (Fixed re-declaration issue)
    if (!function_exists('jwt_base64url_decode')) {
        function jwt_base64url_decode($data) {
            return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
        }
    }
    
    if (!function_exists('jwt_base64url_encode_verify')) {
        function jwt_base64url_encode_verify($data) { 
            return rtrim(strtr(base64_encode($data), '+/', '-_'), '='); 
        }
    }

    if (!function_exists('jwt_decode')) {
        function jwt_decode($token, $secret) {
            $parts = explode('.', $token);
            if (count($parts) !== 3) return null;
            $header = $parts[0];
            $payload = $parts[1];
            $signatureProvided = $parts[2];
            
            $signatureGenerated = hash_hmac('sha256', $header . "." . $payload, $secret, true);
            $base64UrlSignatureGenerated = jwt_base64url_encode_verify($signatureGenerated);
            
            if (!hash_equals($base64UrlSignatureGenerated, $signatureProvided)) return null;
            
            $payloadDecoded = json_decode(jwt_base64url_decode($payload), true);
            if (isset($payloadDecoded['exp']) && $payloadDecoded['exp'] < time()) return null;
            return $payloadDecoded;
        }
    }

    if (!function_exists('get_bearer_token')) {
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
    }

    // 4. Authenticate
    $token = get_bearer_token();
    if (!$token) {
        throw new Exception('Token not provided', 401);
    }
    
    $secret = $_ENV['JWT_SECRET'] ?? 'meufreelas_secret_key_change_this';
    $payload = jwt_decode($token, $secret);
    
    if (!$payload || !isset($payload['sub'])) {
        throw new Exception('Invalid token', 401);
    }
    
    $pdo = mf_pdo();
    $stmt = $pdo->prepare("SELECT * FROM users WHERE id = ?");
    $stmt->execute([$payload['sub']]);
    $user = $stmt->fetch();

    if (!$user) {
        throw new Exception('User not found', 401);
    }

    // 5. Main Logic
    $method = $_SERVER['REQUEST_METHOD'];
    $action = $_GET['action'] ?? '';

    // Configurar Stripe
    if (!isset($_ENV['STRIPE_SECRET_KEY'])) {
        throw new Exception('STRIPE_SECRET_KEY not set in .env');
    }
    \Stripe\Stripe::setApiKey($_ENV['STRIPE_SECRET_KEY']);

    if ($method === 'POST') {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Invalid JSON input');
        }

        // Action: create_subscription_intent (Embedded Checkout)
        if ($action === 'create_subscription_intent') {
            $amount = (int)($data['price'] * 100); 
            $planName = $data['title'] ?? 'Plano Premium';
            
            // 1. Obter ou Criar Customer
            $customerId = $user['stripe_customer_id'] ?? null;
            
            // Se não tiver ID ou se tiver mas o Stripe não reconhecer (pode ter sido deletado lá), cria um novo
            $customer = null;
            if ($customerId) {
                try {
                    $customer = \Stripe\Customer::retrieve($customerId);
                    if ($customer->deleted) {
                        $customerId = null;
                    }
                } catch (Exception $e) {
                    $customerId = null; // Inválido, criar novo
                }
            }

            if (!$customerId) {
                $customer = \Stripe\Customer::create([
                    'email' => $user['email'],
                    'name' => $user['name'],
                    'metadata' => ['user_id' => $user['id']]
                ]);
                $customerId = $customer->id;
                
                // Salvar ID no banco com Self-Healing
                try {
                    $pdo->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?")
                        ->execute([$customerId, $user['id']]);
                } catch (Exception $dbEx) {
                    // Tenta adicionar a coluna se não existir
                    if (strpos($dbEx->getMessage(), 'Unknown column') !== false || strpos($dbEx->getMessage(), 'coluna') !== false) {
                        $pdo->exec("ALTER TABLE users ADD COLUMN stripe_customer_id VARCHAR(255) DEFAULT NULL");
                        $pdo->prepare("UPDATE users SET stripe_customer_id = ? WHERE id = ?")
                            ->execute([$customerId, $user['id']]);
                    } else {
                        throw $dbEx;
                    }
                }
            }

            // 2. Criar Preço (Price) dinamicamente
            $price = \Stripe\Price::create([
                'unit_amount' => $amount,
                'currency' => 'brl',
                'recurring' => ['interval' => 'month'],
                'product_data' => ['name' => $planName],
            ]);

            // 3. Criar registro de assinatura local (Pendente)
            $subscriptionIdLocal = bin2hex(random_bytes(18));
            $planCode = $data['plan'] ?? 'pro'; 
            $billingCycle = $data['cycle'] ?? 'monthly';
            
            $stmtSub = $pdo->prepare("INSERT INTO user_subscriptions (id, user_id, plan_code, billing_cycle, provider, amount, status, created_at) VALUES (?, ?, ?, ?, 'stripe', ?, 'pending', NOW())");
            $stmtSub->execute([$subscriptionIdLocal, $user['id'], $planCode, $billingCycle, (float)$data['price']]);

            // 4. Criar Assinatura no Stripe
            $subscription = \Stripe\Subscription::create([
                'customer' => $customerId,
                'items' => [['price' => $price->id]],
                'payment_behavior' => 'default_incomplete',
                'payment_settings' => ['save_default_payment_method' => 'on_subscription'],
                'expand' => ['latest_invoice.payment_intent'],
                'metadata' => [
                    'user_id' => $user['id'],
                    'plan' => $planCode,
                    'subscription_id' => $subscriptionIdLocal
                ]
            ]);

            // 5. Atualizar registro local com ID da assinatura Stripe
            $pdo->prepare("UPDATE user_subscriptions SET external_id = ? WHERE id = ?")
                ->execute([$subscription->id, $subscriptionIdLocal]);

            // 6. Retornar Client Secret
            ob_clean(); // Clean any previous output
            echo json_encode([
                'clientSecret' => $subscription->latest_invoice->payment_intent->client_secret,
                'subscriptionId' => $subscription->id
            ]);
            exit;
        }
        
        // Action: create_checkout_session (Redirect) - Mantendo como backup
        elseif ($action === 'create_checkout_session') {
             // ... (código existente simplificado ou removido se não for usar)
             throw new Exception("Use create_subscription_intent instead.");
        }
        
        else {
            throw new Exception("Invalid action: $action", 400);
        }
    } else {
        throw new Exception("Method not allowed", 405);
    }

} catch (Throwable $e) {
    ob_clean(); // Clean any garbage output
    $code = $e->getCode();
    if (!is_int($code) || $code < 100 || $code > 599) $code = 500;
    http_response_code($code);
    echo json_encode([
        'error' => 'Server Error: ' . $e->getMessage(),
        'details' => [
            'file' => basename($e->getFile()),
            'line' => $e->getLine(),
            'trace' => $e->getTraceAsString() // Opcional, remover em prod se quiser
        ]
    ]);
}
exit;
