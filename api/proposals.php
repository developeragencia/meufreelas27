<?php
/**
 * MeuFreelas - Propostas (CRUD principal)
 * POST actions:
 * - create_proposal
 * - list_proposals
 * - update_proposal_status
 * - delete_proposal
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

function create_notification(PDO $pdo, string $userId, string $title, string $message, string $type = 'system', ?string $link = null): void {
    $notificationId = bin2hex(random_bytes(18));
    try {
        $stmt = $pdo->prepare('INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$notificationId, $userId, $title, $message, $type, $link]);
        return;
    } catch (Throwable $e) {
        // fallback para bancos antigos sem colunas type/link
    }
    try {
        $stmt = $pdo->prepare('INSERT INTO notifications (id, user_id, title, message) VALUES (?, ?, ?, ?)');
        $stmt->execute([$notificationId, $userId, $title, $message]);
    } catch (Throwable $e) {
        // ignora para não quebrar fluxo principal
    }
}

function normalize_proposal_status_for_ui(string $dbStatus): string {
    if ($dbStatus === 'accepted') return 'Aceita';
    if ($dbStatus === 'rejected') return 'Recusada';
    return 'Pendente';
}

function normalize_proposal_status_for_db(string $uiStatus): string {
    $s = strtolower(trim($uiStatus));
    if ($s === 'aceita' || $s === 'accepted') return 'accepted';
    if ($s === 'recusada' || $s === 'rejected') return 'rejected';
    return 'pending';
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = trim((string)($input['action'] ?? ''));

if ($action === 'create_proposal') {
    $projectId = trim((string)($input['projectId'] ?? ''));
    $freelancerId = trim((string)($input['freelancerId'] ?? ''));
    $amount = trim((string)($input['amount'] ?? ''));
    $deliveryDays = trim((string)($input['deliveryDays'] ?? ''));
    $message = trim((string)($input['message'] ?? ''));

    if ($projectId === '' || $freelancerId === '' || $amount === '' || $deliveryDays === '' || $message === '') {
        echo json_encode(['ok' => false, 'error' => 'Campos obrigatórios ausentes para proposta.']);
        exit;
    }

    $projectStmt = $pdo->prepare('SELECT id, client_id, status FROM projects WHERE id = ? LIMIT 1');
    $projectStmt->execute([$projectId]);
    $project = $projectStmt->fetch();
    if (!$project) {
        echo json_encode(['ok' => false, 'error' => 'Projeto não encontrado.']);
        exit;
    }
    if (($project['status'] ?? '') !== 'open') {
        echo json_encode(['ok' => false, 'error' => 'Este projeto não está aberto para propostas.']);
        exit;
    }

    $freelancerStmt = $pdo->prepare('SELECT id, type FROM users WHERE id = ? LIMIT 1');
    $freelancerStmt->execute([$freelancerId]);
    $freelancer = $freelancerStmt->fetch();
    if (!$freelancer || ($freelancer['type'] ?? '') !== 'freelancer') {
        echo json_encode(['ok' => false, 'error' => 'Apenas freelancers podem enviar propostas.']);
        exit;
    }

    $existing = $pdo->prepare('SELECT id FROM proposals WHERE project_id = ? AND freelancer_id = ? LIMIT 1');
    $existing->execute([$projectId, $freelancerId]);
    if ($existing->fetch()) {
        echo json_encode(['ok' => false, 'error' => 'Você já enviou proposta para este projeto.']);
        exit;
    }

    $proposalId = bin2hex(random_bytes(18));
    $ins = $pdo->prepare("
        INSERT INTO proposals (id, project_id, freelancer_id, amount, delivery_days, message, status)
        VALUES (:id, :project_id, :freelancer_id, :amount, :delivery_days, :message, 'pending')
    ");
    $ins->execute([
        'id' => $proposalId,
        'project_id' => $projectId,
        'freelancer_id' => $freelancerId,
        'amount' => $amount,
        'delivery_days' => $deliveryDays,
        'message' => $message,
    ]);

    create_notification(
        $pdo,
        (string)$project['client_id'],
        'Nova proposta recebida',
        'Você recebeu uma nova proposta para seu projeto.',
        'project',
        '/project/' . $projectId
    );

    echo json_encode([
        'ok' => true,
        'proposal' => [
            'id' => $proposalId,
            'projectId' => $projectId,
            'freelancerId' => $freelancerId,
            'value' => $amount,
            'deliveryDays' => $deliveryDays,
            'message' => $message,
            'status' => 'Pendente',
            'createdAt' => date('c'),
        ],
    ]);
    exit;
}

if ($action === 'list_proposals') {
    $projectId = trim((string)($input['projectId'] ?? ''));
    $freelancerId = trim((string)($input['freelancerId'] ?? ''));
    $clientId = trim((string)($input['clientId'] ?? ''));
    $status = trim((string)($input['status'] ?? ''));

    $where = [];
    $params = [];

    if ($projectId !== '') {
        $where[] = 'p.project_id = :project_id';
        $params['project_id'] = $projectId;
    }
    if ($freelancerId !== '') {
        $where[] = 'p.freelancer_id = :freelancer_id';
        $params['freelancer_id'] = $freelancerId;
    }
    if ($clientId !== '') {
        $where[] = 'prj.client_id = :client_id';
        $params['client_id'] = $clientId;
    }
    if ($status !== '' && strtolower($status) !== 'todas' && strtolower($status) !== 'all') {
        $where[] = 'p.status = :status';
        $params['status'] = normalize_proposal_status_for_db($status);
    }

    $whereSql = count($where) ? ('WHERE ' . implode(' AND ', $where)) : '';
    $sql = "
        SELECT
            p.*,
            prj.title AS project_title,
            prj.client_id AS client_id,
            c.name AS client_name,
            c.avatar AS client_avatar,
            f.name AS freelancer_name,
            f.avatar AS freelancer_avatar,
            f.rating AS freelancer_rating
        FROM proposals p
        INNER JOIN projects prj ON prj.id = p.project_id
        INNER JOIN users c ON c.id = prj.client_id
        INNER JOIN users f ON f.id = p.freelancer_id
        $whereSql
        ORDER BY p.created_at DESC
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    $proposals = array_map(function ($r) {
        return [
            'id' => $r['id'],
            'projectId' => $r['project_id'],
            'projectTitle' => $r['project_title'],
            'clientId' => $r['client_id'],
            'clientName' => $r['client_name'],
            'clientAvatar' => $r['client_avatar'],
            'freelancerId' => $r['freelancer_id'],
            'freelancerName' => $r['freelancer_name'],
            'freelancerAvatar' => $r['freelancer_avatar'],
            'freelancerRating' => (float)($r['freelancer_rating'] ?? 0),
            'value' => (string)$r['amount'],
            'deliveryDays' => (string)$r['delivery_days'],
            'message' => $r['message'],
            'status' => normalize_proposal_status_for_ui((string)$r['status']),
            'createdAt' => $r['created_at'],
        ];
    }, $rows);

    echo json_encode(['ok' => true, 'proposals' => $proposals]);
    exit;
}

if ($action === 'update_proposal_status') {
    $proposalId = trim((string)($input['proposalId'] ?? ''));
    $clientId = trim((string)($input['clientId'] ?? ''));
    $status = trim((string)($input['status'] ?? ''));
    if ($proposalId === '' || $clientId === '' || $status === '') {
        echo json_encode(['ok' => false, 'error' => 'proposalId, clientId e status são obrigatórios.']);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT p.id, p.project_id, prj.client_id
        FROM proposals p
        INNER JOIN projects prj ON prj.id = p.project_id
        WHERE p.id = ?
        LIMIT 1
    ");
    $stmt->execute([$proposalId]);
    $proposal = $stmt->fetch();
    if (!$proposal) {
        echo json_encode(['ok' => false, 'error' => 'Proposta não encontrada.']);
        exit;
    }
    if (($proposal['client_id'] ?? '') !== $clientId) {
        echo json_encode(['ok' => false, 'error' => 'Sem permissão para alterar esta proposta.']);
        exit;
    }

    $newStatus = normalize_proposal_status_for_db($status);
    $upd = $pdo->prepare('UPDATE proposals SET status = ? WHERE id = ?');
    $upd->execute([$newStatus, $proposalId]);

    if ($newStatus === 'accepted') {
        $closeOthers = $pdo->prepare('UPDATE proposals SET status = "rejected" WHERE project_id = ? AND id <> ?');
        $closeOthers->execute([$proposal['project_id'], $proposalId]);
        $closeProject = $pdo->prepare('UPDATE projects SET status = "in_progress" WHERE id = ?');
        $closeProject->execute([$proposal['project_id']]);
    }

    $proposalDetail = $pdo->prepare('SELECT freelancer_id, project_id FROM proposals WHERE id = ? LIMIT 1');
    $proposalDetail->execute([$proposalId]);
    $proposalDetailRow = $proposalDetail->fetch();
    if ($proposalDetailRow) {
        if ($newStatus === 'accepted') {
            create_notification(
                $pdo,
                (string)$proposalDetailRow['freelancer_id'],
                'Proposta aceita',
                'Sua proposta foi aceita pelo cliente.',
                'project',
                '/project/' . (string)$proposalDetailRow['project_id']
            );
        } elseif ($newStatus === 'rejected') {
            create_notification(
                $pdo,
                (string)$proposalDetailRow['freelancer_id'],
                'Proposta recusada',
                'Sua proposta foi recusada pelo cliente.',
                'project',
                '/project/' . (string)$proposalDetailRow['project_id']
            );
        }
    }

    echo json_encode(['ok' => true, 'message' => 'Status da proposta atualizado.']);
    exit;
}

if ($action === 'delete_proposal') {
    $proposalId = trim((string)($input['proposalId'] ?? ''));
    $freelancerId = trim((string)($input['freelancerId'] ?? ''));
    if ($proposalId === '' || $freelancerId === '') {
        echo json_encode(['ok' => false, 'error' => 'proposalId e freelancerId são obrigatórios.']);
        exit;
    }
    $check = $pdo->prepare('SELECT id, freelancer_id, status FROM proposals WHERE id = ? LIMIT 1');
    $check->execute([$proposalId]);
    $proposal = $check->fetch();
    if (!$proposal) {
        echo json_encode(['ok' => false, 'error' => 'Proposta não encontrada.']);
        exit;
    }
    if (($proposal['freelancer_id'] ?? '') !== $freelancerId) {
        echo json_encode(['ok' => false, 'error' => 'Sem permissão para excluir esta proposta.']);
        exit;
    }
    if (($proposal['status'] ?? '') === 'accepted') {
        echo json_encode(['ok' => false, 'error' => 'Não é possível excluir proposta já aceita.']);
        exit;
    }
    $del = $pdo->prepare('DELETE FROM proposals WHERE id = ?');
    $del->execute([$proposalId]);
    echo json_encode(['ok' => true, 'message' => 'Proposta removida.']);
    exit;
}

echo json_encode(['ok' => false, 'error' => 'Ação inválida.']);
