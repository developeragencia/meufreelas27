<?php
// api/debug_payment.php
// Script de diagnóstico isolado - sem dependências externas além do PHP nativo

header('Content-Type: application/json');

// 1. CORS Debug
$origin = $_SERVER['HTTP_ORIGIN'] ?? 'none';
header("Access-Control-Allow-Origin: *"); // Permissivo para teste
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");

$diagnostics = [
    'status' => 'ok',
    'timestamp' => time(),
    'php_version' => phpversion(),
    'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'unknown',
    'request_method' => $_SERVER['REQUEST_METHOD'],
    'origin_header' => $origin,
    'https_active' => (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') ? 'yes' : 'no',
    'document_root' => $_SERVER['DOCUMENT_ROOT'],
    'cwd' => getcwd(),
];

// 2. Check Files
$filesToCheck = [
    'vendor/autoload.php',
    'config.php',
    'db.php',
    'payments.php',
    '.env'
];

$fileStatus = [];
foreach ($filesToCheck as $file) {
    $path = __DIR__ . '/' . $file;
    $exists = file_exists($path);
    $readable = is_readable($path);
    $fileStatus[$file] = [
        'exists' => $exists,
        'readable' => $readable,
        'size' => $exists ? filesize($path) : 0
    ];
}
$diagnostics['files'] = $fileStatus;

// 3. Check Stripe/MercadoPago Classes (if vendor exists)
if ($fileStatus['vendor/autoload.php']['exists']) {
    try {
        require_once __DIR__ . '/vendor/autoload.php';
        $diagnostics['classes'] = [
            'Stripe\Stripe' => class_exists('Stripe\Stripe'),
            'MercadoPago\SDK (Legacy)' => class_exists('MercadoPago\SDK'),
            'MercadoPago\MercadoPagoConfig (v3)' => class_exists('MercadoPago\MercadoPagoConfig')
        ];
    } catch (Throwable $e) {
        $diagnostics['autoload_error'] = $e->getMessage();
    }
} else {
    $diagnostics['autoload_error'] = 'vendor/autoload.php not found';
}

echo json_encode($diagnostics, JSON_PRETTY_PRINT);
