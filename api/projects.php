<?php
/**
 * MeuFreelas - Projetos
 * POST action:
 * - create_project { userId, title, description, category, budget?, skills?, experienceLevel?, proposalDays?, visibility? }
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método não permitido']);
    exit;
}

require_once __DIR__ . '/load_env.php';

$dbHost = $_ENV['DB_HOST'] ?? 'localhost';
$dbPort = $_ENV['DB_PORT'] ?? '3306';
$dbName = $_ENV['DB_NAME'] ?? 'u892594395_meufreelas';
$dbUser = $_ENV['DB_USER'] ?? 'u892594395_meufreelas27';
$dbPass = $_ENV['DB_PASS'] ?? '';

try {
    $pdo = new PDO(
        "mysql:host=$dbHost;port=$dbPort;dbname=$dbName;charset=utf8mb4",
        $dbUser,
        $dbPass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Erro de conexão com o banco.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = trim((string)($input['action'] ?? ''));

if ($action !== 'create_project') {
    echo json_encode(['ok' => false, 'error' => 'Ação inválida.']);
    exit;
}

$userId = trim((string)($input['userId'] ?? ''));
$title = trim((string)($input['title'] ?? ''));
$description = trim((string)($input['description'] ?? ''));
$category = trim((string)($input['category'] ?? ''));
$budget = trim((string)($input['budget'] ?? ''));
$skills = $input['skills'] ?? [];
$experienceLevel = trim((string)($input['experienceLevel'] ?? 'intermediate'));
$proposalDays = trim((string)($input['proposalDays'] ?? '30'));
$visibility = trim((string)($input['visibility'] ?? 'public'));

if ($userId === '' || $title === '' || $description === '' || $category === '') {
    echo json_encode(['ok' => false, 'error' => 'Preencha os campos obrigatórios.']);
    exit;
}

$userStmt = $pdo->prepare('SELECT id, type FROM users WHERE id = ? LIMIT 1');
$userStmt->execute([$userId]);
$author = $userStmt->fetch();
if (!$author || ($author['type'] ?? '') !== 'client') {
    echo json_encode(['ok' => false, 'error' => 'Apenas clientes podem publicar projetos.']);
    exit;
}

if (!is_array($skills)) $skills = [];
$normalizedSkills = [];
foreach ($skills as $skill) {
    $name = trim((string)$skill);
    if ($name !== '' && !in_array($name, $normalizedSkills, true)) {
        $normalizedSkills[] = $name;
    }
}

$projectId = bin2hex(random_bytes(18));
$stmt = $pdo->prepare("
    INSERT INTO projects (
        id, client_id, title, description, budget, category, skills, experience_level, proposal_days, visibility, status
    ) VALUES (
        :id, :client_id, :title, :description, :budget, :category, :skills, :experience_level, :proposal_days, :visibility, 'open'
    )
");
$stmt->execute([
    'id' => $projectId,
    'client_id' => $userId,
    'title' => $title,
    'description' => $description,
    'budget' => $budget !== '' ? $budget : null,
    'category' => $category,
    'skills' => json_encode($normalizedSkills, JSON_UNESCAPED_UNICODE),
    'experience_level' => $experienceLevel,
    'proposal_days' => $proposalDays,
    'visibility' => $visibility === 'private' ? 'private' : 'public',
]);

echo json_encode([
    'ok' => true,
    'project' => [
        'id' => $projectId,
        'clientId' => $userId,
        'title' => $title,
        'description' => $description,
        'category' => $category,
        'budget' => $budget,
        'skills' => $normalizedSkills,
        'experienceLevel' => $experienceLevel,
        'proposalDays' => $proposalDays,
        'visibility' => $visibility,
        'status' => 'Aberto',
        'proposals' => 0,
        'createdAt' => date('c'),
    ],
]);
