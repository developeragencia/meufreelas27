<?php
/**
 * MeuFreelas - Projetos (CRUD básico + busca)
 * POST actions:
 * - create_project
 * - list_projects
 * - get_project
 * - update_project
 * - delete_project
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

function normalize_status_for_ui(string $dbStatus): string {
    if ($dbStatus === 'in_progress') return 'Em andamento';
    if ($dbStatus === 'completed') return 'Concluído';
    if ($dbStatus === 'cancelled') return 'Cancelado';
    return 'Aberto';
}

function normalize_status_for_db(string $uiStatus): string {
    $s = strtolower(trim($uiStatus));
    if ($s === 'em andamento' || $s === 'in_progress') return 'in_progress';
    if ($s === 'concluído' || $s === 'concluido' || $s === 'completed') return 'completed';
    if ($s === 'cancelado' || $s === 'cancelled') return 'cancelled';
    return 'open';
}

function normalize_skills($skills): array {
    if (!is_array($skills)) return [];
    $normalized = [];
    foreach ($skills as $skill) {
        $name = trim((string)$skill);
        if ($name !== '' && !in_array($name, $normalized, true)) $normalized[] = $name;
    }
    return $normalized;
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = trim((string)($input['action'] ?? ''));

if ($action === 'create_project') {
    $userId = trim((string)($input['userId'] ?? ''));
    $title = trim((string)($input['title'] ?? ''));
    $description = trim((string)($input['description'] ?? ''));
    $category = trim((string)($input['category'] ?? ''));
    $budget = trim((string)($input['budget'] ?? ''));
    $skills = normalize_skills($input['skills'] ?? []);
    $experienceLevel = trim((string)($input['experienceLevel'] ?? 'intermediate'));
    $proposalDays = trim((string)($input['proposalDays'] ?? '30'));
    $visibility = trim((string)($input['visibility'] ?? 'public'));

    if ($userId === '' || $title === '' || $description === '' || $category === '') {
        echo json_encode(['ok' => false, 'error' => 'Preencha os campos obrigatórios.']);
        exit;
    }

    $userStmt = $pdo->prepare('SELECT id, type, has_client_account FROM users WHERE id = ? LIMIT 1');
    $userStmt->execute([$userId]);
    $author = $userStmt->fetch();
    $isClient = $author && (($author['type'] ?? '') === 'client' || (int)($author['has_client_account'] ?? 0) === 1);
    if (!$isClient) {
        echo json_encode(['ok' => false, 'error' => 'Apenas clientes podem publicar projetos.']);
        exit;
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
        'skills' => json_encode($skills, JSON_UNESCAPED_UNICODE),
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
            'skills' => $skills,
            'experienceLevel' => $experienceLevel,
            'proposalDays' => $proposalDays,
            'visibility' => $visibility,
            'status' => 'Aberto',
            'proposals' => 0,
            'createdAt' => date('c'),
        ],
    ]);
    exit;
}

if ($action === 'list_projects') {
    $clientId = trim((string)($input['clientId'] ?? ''));
    $status = trim((string)($input['status'] ?? ''));
    $search = trim((string)($input['search'] ?? ''));
    $category = trim((string)($input['category'] ?? ''));
    $sortBy = trim((string)($input['sortBy'] ?? 'recent'));

    $where = [];
    $params = [];

    if ($clientId !== '') {
        $where[] = 'p.client_id = :client_id';
        $params['client_id'] = $clientId;
    }
    if ($status !== '' && strtolower($status) !== 'todos' && strtolower($status) !== 'all') {
        $where[] = 'p.status = :status';
        $params['status'] = normalize_status_for_db($status);
    }
    if ($search !== '') {
        $where[] = '(p.title LIKE :search OR p.description LIKE :search)';
        $params['search'] = '%' . $search . '%';
    }
    if ($category !== '') {
        $where[] = 'p.category = :category';
        $params['category'] = $category;
    }

    $whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';
    $orderSql = $sortBy === 'relevance'
        ? 'ORDER BY p.updated_at DESC, p.created_at DESC'
        : 'ORDER BY p.created_at DESC';

    $sql = "
        SELECT
            p.*,
            u.name AS client_name,
            COUNT(pr.id) AS proposals_count
        FROM projects p
        INNER JOIN users u ON u.id = p.client_id
        LEFT JOIN proposals pr ON pr.project_id = p.id
        $whereSql
        GROUP BY p.id
        $orderSql
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $projects = array_map(function ($r) {
        $skills = [];
        if (!empty($r['skills'])) {
            $parsed = json_decode($r['skills'], true);
            if (is_array($parsed)) $skills = $parsed;
        }
        return [
            'id' => $r['id'],
            'clientId' => $r['client_id'],
            'clientName' => $r['client_name'],
            'title' => $r['title'],
            'description' => $r['description'],
            'budget' => (string)($r['budget'] ?? ''),
            'category' => $r['category'],
            'skills' => $skills,
            'experienceLevel' => $r['experience_level'],
            'proposalDays' => $r['proposal_days'],
            'visibility' => $r['visibility'],
            'status' => normalize_status_for_ui((string)$r['status']),
            'proposals' => (int)$r['proposals_count'],
            'createdAt' => $r['created_at'],
            'updatedAt' => $r['updated_at'],
        ];
    }, $rows);

    echo json_encode(['ok' => true, 'projects' => $projects]);
    exit;
}

if ($action === 'get_project') {
    $projectId = trim((string)($input['projectId'] ?? ''));
    if ($projectId === '') {
        echo json_encode(['ok' => false, 'error' => 'projectId é obrigatório.']);
        exit;
    }
    $stmt = $pdo->prepare("
        SELECT p.*, u.name AS client_name, COUNT(pr.id) AS proposals_count
        FROM projects p
        INNER JOIN users u ON u.id = p.client_id
        LEFT JOIN proposals pr ON pr.project_id = p.id
        WHERE p.id = :id
        GROUP BY p.id
        LIMIT 1
    ");
    $stmt->execute(['id' => $projectId]);
    $r = $stmt->fetch();
    if (!$r) {
        echo json_encode(['ok' => false, 'error' => 'Projeto não encontrado.']);
        exit;
    }
    $skills = [];
    if (!empty($r['skills'])) {
        $parsed = json_decode($r['skills'], true);
        if (is_array($parsed)) $skills = $parsed;
    }
    echo json_encode([
        'ok' => true,
        'project' => [
            'id' => $r['id'],
            'clientId' => $r['client_id'],
            'clientName' => $r['client_name'],
            'title' => $r['title'],
            'description' => $r['description'],
            'budget' => (string)($r['budget'] ?? ''),
            'category' => $r['category'],
            'skills' => $skills,
            'experienceLevel' => $r['experience_level'],
            'proposalDays' => $r['proposal_days'],
            'visibility' => $r['visibility'],
            'status' => normalize_status_for_ui((string)$r['status']),
            'proposals' => (int)$r['proposals_count'],
            'createdAt' => $r['created_at'],
            'updatedAt' => $r['updated_at'],
        ],
    ]);
    exit;
}

if ($action === 'update_project') {
    $projectId = trim((string)($input['projectId'] ?? ''));
    $userId = trim((string)($input['userId'] ?? ''));
    if ($projectId === '' || $userId === '') {
        echo json_encode(['ok' => false, 'error' => 'projectId e userId são obrigatórios.']);
        exit;
    }

    $check = $pdo->prepare('SELECT id, client_id FROM projects WHERE id = ? LIMIT 1');
    $check->execute([$projectId]);
    $project = $check->fetch();
    if (!$project) {
        echo json_encode(['ok' => false, 'error' => 'Projeto não encontrado.']);
        exit;
    }
    if (($project['client_id'] ?? '') !== $userId) {
        echo json_encode(['ok' => false, 'error' => 'Sem permissão para editar este projeto.']);
        exit;
    }

    $title = trim((string)($input['title'] ?? ''));
    $description = trim((string)($input['description'] ?? ''));
    $category = trim((string)($input['category'] ?? ''));
    $budget = trim((string)($input['budget'] ?? ''));
    $status = trim((string)($input['status'] ?? ''));
    $skills = normalize_skills($input['skills'] ?? []);
    $experienceLevel = trim((string)($input['experienceLevel'] ?? ''));
    $proposalDays = trim((string)($input['proposalDays'] ?? ''));
    $visibility = trim((string)($input['visibility'] ?? ''));

    $fields = [];
    $params = ['id' => $projectId];

    if ($title !== '') { $fields[] = 'title = :title'; $params['title'] = $title; }
    if ($description !== '') { $fields[] = 'description = :description'; $params['description'] = $description; }
    if ($category !== '') { $fields[] = 'category = :category'; $params['category'] = $category; }
    if ($budget !== '') { $fields[] = 'budget = :budget'; $params['budget'] = $budget; }
    if ($status !== '') { $fields[] = 'status = :status'; $params['status'] = normalize_status_for_db($status); }
    if (count($skills)) { $fields[] = 'skills = :skills'; $params['skills'] = json_encode($skills, JSON_UNESCAPED_UNICODE); }
    if ($experienceLevel !== '') { $fields[] = 'experience_level = :experience_level'; $params['experience_level'] = $experienceLevel; }
    if ($proposalDays !== '') { $fields[] = 'proposal_days = :proposal_days'; $params['proposal_days'] = $proposalDays; }
    if ($visibility !== '') { $fields[] = 'visibility = :visibility'; $params['visibility'] = $visibility === 'private' ? 'private' : 'public'; }

    if (!count($fields)) {
        echo json_encode(['ok' => false, 'error' => 'Nenhum campo para atualizar.']);
        exit;
    }

    $sql = 'UPDATE projects SET ' . implode(', ', $fields) . ' WHERE id = :id';
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    echo json_encode(['ok' => true, 'message' => 'Projeto atualizado com sucesso.']);
    exit;
}

if ($action === 'delete_project') {
    $projectId = trim((string)($input['projectId'] ?? ''));
    $userId = trim((string)($input['userId'] ?? ''));
    if ($projectId === '' || $userId === '') {
        echo json_encode(['ok' => false, 'error' => 'projectId e userId são obrigatórios.']);
        exit;
    }
    $check = $pdo->prepare('SELECT id, client_id FROM projects WHERE id = ? LIMIT 1');
    $check->execute([$projectId]);
    $project = $check->fetch();
    if (!$project) {
        echo json_encode(['ok' => false, 'error' => 'Projeto não encontrado.']);
        exit;
    }
    if (($project['client_id'] ?? '') !== $userId) {
        echo json_encode(['ok' => false, 'error' => 'Sem permissão para excluir este projeto.']);
        exit;
    }
    $del = $pdo->prepare('DELETE FROM projects WHERE id = ?');
    $del->execute([$projectId]);
    echo json_encode(['ok' => true, 'message' => 'Projeto excluído com sucesso.']);
    exit;
}

echo json_encode(['ok' => false, 'error' => 'Ação inválida.']);
