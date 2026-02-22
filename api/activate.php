<?php
/**
 * MeuFreelas - Ativação de conta por link do e-mail
 * GET https://meufreelas.com.br/api/activate.php?token=xxx
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

require_once __DIR__ . '/db.php';

$token = trim($_GET['token'] ?? '');

if ($token === '') {
    echo json_encode(['ok' => false, 'error' => 'Token ausente. Use o link que enviamos no e-mail.']);
    exit;
}

try {
    $pdo = mf_pdo();
} catch (PDOException $e) {
    echo json_encode(['ok' => false, 'error' => 'Erro de conexão com banco.']);
    exit;
}

$stmt = $pdo->prepare('SELECT id FROM users WHERE activation_token = ? AND (activation_token_expires_at IS NULL OR activation_token_expires_at > NOW())');
$stmt->execute([$token]);
$row = $stmt->fetch();

if (!$row) {
    echo json_encode(['ok' => false, 'error' => 'Link inválido ou expirado. Solicite um novo e-mail de ativação.']);
    exit;
}

$pdo->prepare('UPDATE users SET is_verified = 1, activation_token = NULL, activation_token_expires_at = NULL WHERE id = ?')
    ->execute([$row['id']]);

echo json_encode(['ok' => true, 'message' => 'Conta ativada. Faça login para acessar o painel.']);
