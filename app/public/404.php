<?php
/**
 * Handler de 404: se a requisição era para /api/, retorna JSON em vez de mandar para a SPA.
 * Assim /api/setup.php aparece como "não encontrado" em vez de abrir a home.
 */
header('Content-Type: application/json; charset=utf-8');
$uri = $_SERVER['REDIRECT_REQUEST_URI'] ?? $_SERVER['REQUEST_URI'] ?? '';
if (strpos($uri, '/api/') === 0 || strpos($uri, 'api/') === 0) {
    http_response_code(404);
    echo json_encode([
        'ok' => false,
        'error' => 'Endpoint da API não encontrado.',
        'dica' => 'Envie a pasta api/ do projeto para a raiz do site (ex.: public_html/api/). Estrutura: public_html/api/setup.php, auth.php, etc.',
    ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}
header('Location: /index.html');
exit;
