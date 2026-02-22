<?php
/**
 * Carrega variáveis de ambiente: primeiro do arquivo .env, depois do ambiente (painel Hostinger).
 * Assim as variáveis definidas em "Implantações" na Hostinger têm prioridade.
 */
$envFile = __DIR__ . '/.env';
$_ENV = [];
if (file_exists($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
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
}
$envKeys = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASS', 'API_ORIGIN', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM', 'SMTP_FROM_NAME', 'VITE_API_URL', 'VITE_APP_DOMAIN'];
foreach ($envKeys as $k) {
    $v = getenv($k);
    if ($v !== false && $v !== '') {
        $_ENV[$k] = $v;
    }
}
