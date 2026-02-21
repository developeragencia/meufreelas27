<?php
/**
 * MeuFreelas API - meufreelas.com.br
 * Raiz da API. Execute setup.php uma vez para criar as tabelas.
 */
header('Content-Type: application/json; charset=utf-8');
echo json_encode([
    'api' => 'MeuFreelas',
    'domain' => 'meufreelas.com.br',
    'version' => '1.0',
    'setup' => 'Acesse /api/setup.php uma vez para criar as tabelas do banco.',
], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
