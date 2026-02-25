<?php
require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/auth.php';

header('Content-Type: application/json');

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

// Configurar Mercado Pago
MercadoPago\SDK::setAccessToken($_ENV['MERCADOPAGO_ACCESS_TOKEN']);

if ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // 1. Criar Preferência do Mercado Pago
    if ($action === 'create_preference_mp') {
        try {
            $preference = new MercadoPago\Preference();
            
            $item = new MercadoPago\Item();
            $item->title = $data['title'];
            $item->quantity = 1;
            $item->unit_price = (float)$data['price'];
            $item->currency_id = "BRL";
            
            $preference->items = array($item);
            
            // Dados do pagador
            $payer = new MercadoPago\Payer();
            $payer->email = $user['email'];
            $payer->name = $user['name'];
            $preference->payer = $payer;

            // Back URLs
            $preference->back_urls = array(
                "success" => $_ENV['FRONTEND_URL'] . "/payments/success",
                "failure" => $_ENV['FRONTEND_URL'] . "/payments/failure",
                "pending" => $_ENV['FRONTEND_URL'] . "/payments/pending"
            );
            $preference->auto_return = "approved";
            
            // Webhook para notificação
            $preference->notification_url = $_ENV['MERCADOPAGO_WEBHOOK_URL'];
            
            // External Reference para identificar o pedido no webhook
            $preference->external_reference = json_encode([
                'user_id' => $user['id'],
                'type' => $data['type'], // 'subscription' ou 'project_payment'
                'plan' => $data['plan'] ?? null,
                'project_id' => $data['project_id'] ?? null
            ]);

            $preference->save();

            echo json_encode(['preference_id' => $preference->id, 'init_point' => $preference->init_point]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    // 2. Criar PaymentIntent do Stripe
    elseif ($action === 'create_payment_intent_stripe') {
        try {
            $amount = (int)($data['price'] * 100); // Em centavos

            $paymentIntent = \Stripe\PaymentIntent::create([
                'amount' => $amount,
                'currency' => 'brl',
                'automatic_payment_methods' => [
                    'enabled' => true,
                ],
                'metadata' => [
                    'user_id' => $user['id'],
                    'type' => $data['type'],
                    'plan' => $data['plan'] ?? null,
                    'project_id' => $data['project_id'] ?? null
                ],
                'receipt_email' => $user['email'],
            ]);

            echo json_encode(['clientSecret' => $paymentIntent->client_secret]);
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }

    // 3. Create Checkout Session (Generic for MP/Stripe redirect flow)
    elseif ($action === 'create_checkout') {
        try {
            $provider = $data['provider'] ?? 'mercadopago';
            $amount = (float)($data['amount'] ?? 0);
            $title = $data['title'] ?? 'Pagamento';
            $successUrl = $data['successUrl'] ?? ($_ENV['FRONTEND_URL'] . "/payments/success");
            $cancelUrl = $data['cancelUrl'] ?? ($_ENV['FRONTEND_URL'] . "/payments/cancel");
            $proposalId = $data['proposalId'] ?? null;

            if ($amount <= 0) {
                throw new Exception('Valor inválido');
            }

            if ($provider === 'mercadopago') {
                $preference = new MercadoPago\Preference();
                $item = new MercadoPago\Item();
                $item->title = $title;
                $item->quantity = 1;
                $item->unit_price = $amount;
                $item->currency_id = "BRL";
                $preference->items = array($item);
                
                $payer = new MercadoPago\Payer();
                $payer->email = $user['email'];
                $payer->name = $user['name'];
                $preference->payer = $payer;

                $preference->back_urls = array(
                    "success" => $successUrl,
                    "failure" => $cancelUrl,
                    "pending" => $successUrl
                );
                $preference->auto_return = "approved";
                $preference->notification_url = $_ENV['MERCADOPAGO_WEBHOOK_URL'];
                $preference->external_reference = json_encode([
                    'user_id' => $user['id'],
                    'type' => 'project_payment',
                    'proposal_id' => $proposalId
                ]);

                $preference->save();
                echo json_encode(['checkoutUrl' => $preference->init_point]);

            } elseif ($provider === 'stripe') {
                $session = \Stripe\Checkout\Session::create([
                    'payment_method_types' => ['card'],
                    'line_items' => [[
                        'price_data' => [
                            'currency' => 'brl',
                            'product_data' => [
                                'name' => $title,
                            ],
                            'unit_amount' => (int)($amount * 100),
                        ],
                        'quantity' => 1,
                    ]],
                    'mode' => 'payment',
                    'success_url' => $successUrl,
                    'cancel_url' => $cancelUrl,
                    'customer_email' => $user['email'],
                    'metadata' => [
                        'user_id' => $user['id'],
                        'type' => 'project_payment',
                        'proposal_id' => $proposalId
                    ],
                ]);
                echo json_encode(['checkoutUrl' => $session->url]);
            } else {
                throw new Exception('Provedor inválido');
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['error' => $e->getMessage()]);
        }
    }
    
    // Caso nenhuma ação corresponda
    else {
        http_response_code(400);
        echo json_encode(['error' => 'Ação inválida: ' . $action . '. Use action: create_preference_mp ou create_payment_intent_stripe.']);
    }
} else {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
}
