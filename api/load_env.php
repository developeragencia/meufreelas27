<?php
/**
 * Carrega variáveis de ambiente: arquivo .env (raiz ou api/) e depois getenv/$_SERVER.
 * Na Hostinger, se as variáveis do painel não chegarem ao PHP, crie api/.env no servidor.
 */
$_ENV = [];

$loadEnvFile = function (string $path): void {
    if (!file_exists($path) || !is_readable($path)) return;
    foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') !== false) {
            list($k, $v) = explode('=', $line, 2);
            $v = trim($v);
            if (strlen($v) >= 2 && (($v[0] === '"' && $v[strlen($v)-1] === '"') || ($v[0] === "'" && $v[strlen($v)-1] === "'"))) {
                $v = substr($v, 1, -1);
            }
            $_ENV[trim($k)] = $v;
        }
    }
};

$paths = [
    __DIR__ . '/.env',
    __DIR__ . '/../.env',
];
if (!empty($_SERVER['DOCUMENT_ROOT'])) {
    $paths[] = $_SERVER['DOCUMENT_ROOT'] . '/api/.env';
    $paths[] = rtrim($_SERVER['DOCUMENT_ROOT'], '/') . '/.env';
}
foreach (array_unique($paths) as $p) {
    $loadEnvFile($p);
}

$envKeys = [
    'DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS',
    'MYSQLHOST', 'MYSQLPORT', 'MYSQLDATABASE', 'MYSQLUSER', 'MYSQLPASSWORD',
    'DATABASE_URL', 'DB_PASSWORD',
    'API_ORIGIN', 'FRONTEND_URL',
    'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'SMTP_FROM_NAME', 'SMTP_SECURE',
    'STRIPE_SECRET_KEY', 'STRIPE_SECRET', 'STRIPE_API_KEY', 'STRIPE_WEBHOOK_SECRET', 'STRIPE_WEBHOOK_SECRET_KEY',
    'MERCADOPAGO_ACCESS_TOKEN', 'MP_ACCESS_TOKEN', 'MERCADOPAGO_WEBHOOK_URL', 'MERCADOPAGO_WEBHOOK_SECRET',
    'JWT_SECRET', 'JWT_REFRESH_SECRET', 'JWT_ACCESS_EXP', 'JWT_REFRESH_EXP',
    'VITE_API_URL', 'VITE_API_FALLBACK_URL', 'VITE_APP_DOMAIN',
    'TURNSTILE_SECRET_KEY'
];
foreach ($envKeys as $k) {
    $v = getenv($k);
    if ($v !== false && $v !== '') {
        $_ENV[$k] = is_string($v) ? trim($v) : $v;
    }
    if (!empty($_ENV[$k])) continue;
    if (isset($_SERVER[$k]) && $_SERVER[$k] !== '') {
        $_ENV[$k] = trim((string) $_SERVER[$k]);
    }
    $kLower = strtolower($k);
    if (empty($_ENV[$k]) && isset($_SERVER[$kLower]) && $_SERVER[$kLower] !== '') {
        $_ENV[$k] = trim((string) $_SERVER[$kLower]);
    }
    if (empty($_ENV[$k])) {
        $v = getenv($kLower);
        if ($v !== false && $v !== '') $_ENV[$k] = trim((string) $v);
    }
}
