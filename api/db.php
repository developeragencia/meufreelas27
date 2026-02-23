<?php
declare(strict_types=1);

require_once __DIR__ . '/load_env.php';

function mf_env(string $key, ?string $default = null): ?string
{
    if (isset($_ENV[$key]) && $_ENV[$key] !== '') {
        return (string)$_ENV[$key];
    }
    $v = getenv($key);
    if ($v !== false && $v !== '') {
        return (string)$v;
    }
    return $default;
}

function mf_first_env(array $keys, ?string $default = null): ?string
{
    foreach ($keys as $key) {
        $v = mf_env($key);
        if ($v !== null && $v !== '') {
            return $v;
        }
    }
    return $default;
}

function mf_db_config(): array
{
    $host = mf_first_env(['DB_HOST', 'MYSQLHOST'], 'localhost');
    $port = mf_first_env(['DB_PORT', 'MYSQLPORT'], '3306');
    $name = mf_first_env(['DB_NAME', 'MYSQLDATABASE'], '');
    $user = mf_first_env(['DB_USER', 'MYSQLUSER'], '');
    $pass = mf_first_env(['DB_PASS', 'MYSQLPASSWORD', 'MYSQL_PASSWORD', 'DB_PASSWORD'], '');

    $databaseUrl = mf_first_env(['DATABASE_URL', 'MYSQL_URL'], '');
    if ($databaseUrl) {
        $parts = parse_url($databaseUrl);
        if (is_array($parts)) {
            if (!empty($parts['host'])) $host = (string)$parts['host'];
            if (!empty($parts['port'])) $port = (string)$parts['port'];
            if (!empty($parts['path'])) $name = ltrim((string)$parts['path'], '/');
            if (isset($parts['user']) && $parts['user'] !== '') $user = (string)$parts['user'];
            if (isset($parts['pass'])) $pass = (string)$parts['pass'];
        }
    }

    return [
        'host' => $host ?: 'localhost',
        'port' => $port ?: '3306',
        'name' => $name ?: 'u892594395_meufreelas',
        'user' => $user ?: 'u892594395_meufreelas27',
        'pass' => $pass ?? '',
    ];
}

function mf_pdo(): PDO
{
    $cfg = mf_db_config();
    $dsn = "mysql:host={$cfg['host']};port={$cfg['port']};dbname={$cfg['name']};charset=utf8mb4";
    $opts = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ];
    try {
        return new PDO($dsn, $cfg['user'], $cfg['pass'], $opts);
    } catch (PDOException $e) {
        if (($cfg['host'] === 'localhost' || $cfg['host'] === '') && strpos($e->getMessage(), 'Connection') !== false) {
            $dsn = "mysql:host=127.0.0.1;port={$cfg['port']};dbname={$cfg['name']};charset=utf8mb4";
            return new PDO($dsn, $cfg['user'], $cfg['pass'], $opts);
        }
        throw $e;
    }
}
