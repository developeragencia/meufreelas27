<?php
/**
 * MeuFreelas - Entregas / Revisões / Conclusão de projeto
 * POST actions:
 * - list_deliveries { projectId, userId }
 * - create_delivery { projectId, freelancerId, message, deliveryUrl? }
 * - request_revision { deliveryId, clientId, feedback }
 * - approve_delivery { deliveryId, clientId, feedback? }
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

function create_notification(PDO $pdo, string $userId, string $title, string $message, string $type = 'project', ?string $link = null): void {
    $notificationId = bin2hex(random_bytes(18));
    try {
        $stmt = $pdo->prepare('INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$notificationId, $userId, $title, $message, $type, $link]);
        return;
    } catch (Throwable $e) {
        // fallback legado
    }
    try {
        $stmt = $pdo->prepare('INSERT INTO notifications (id, user_id, title, message) VALUES (?, ?, ?, ?)');
        $stmt->execute([$notificationId, $userId, $title, $message]);
    } catch (Throwable $e) {
        // não interrompe fluxo principal
    }
}

function map_delivery_status_to_ui(string $dbStatus): string {
    if ($dbStatus === 'revision_requested') return 'Revisão solicitada';
    if ($dbStatus === 'approved') return 'Aprovada';
    return 'Enviada';
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = trim((string)($input['action'] ?? ''));
if ($action === '') {
    echo json_encode(['ok' => false, 'error' => 'Ação inválida.']);
    exit;
}

if ($action === 'list_deliveries') {
    $projectId = trim((string)($input['projectId'] ?? ''));
    $userId = trim((string)($input['userId'] ?? ''));
    if ($projectId === '' || $userId === '') {
        echo json_encode(['ok' => false, 'error' => 'projectId e userId são obrigatórios.']);
        exit;
    }

    $access = $pdo->prepare("
        SELECT p.client_id
        FROM projects p
        WHERE p.id = ?
        LIMIT 1
    ");
    $access->execute([$projectId]);
    $project = $access->fetch();
    if (!$project) {
        echo json_encode(['ok' => false, 'error' => 'Projeto não encontrado.']);
        exit;
    }
    $isClient = ((string)$project['client_id'] === $userId);
    $isFreelancer = false;
    if (!$isClient) {
        $freelancerCheck = $pdo->prepare('SELECT 1 FROM proposals WHERE project_id = ? AND freelancer_id = ? LIMIT 1');
        $freelancerCheck->execute([$projectId, $userId]);
        $isFreelancer = (bool)$freelancerCheck->fetch();
    }
    if (!$isClient && !$isFreelancer) {
        echo json_encode(['ok' => false, 'error' => 'Sem permissão para visualizar entregas deste projeto.']);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT
            d.*,
            f.name AS freelancer_name
        FROM project_deliveries d
        INNER JOIN users f ON f.id = d.freelancer_id
        WHERE d.project_id = ?
        ORDER BY d.created_at DESC
    ");
    $stmt->execute([$projectId]);
    $rows = $stmt->fetchAll();

    $deliveries = array_map(function ($r) {
        return [
            'id' => $r['id'],
            'projectId' => $r['project_id'],
            'proposalId' => $r['proposal_id'],
            'freelancerId' => $r['freelancer_id'],
            'freelancerName' => $r['freelancer_name'],
            'message' => $r['message'],
            'deliveryUrl' => $r['delivery_url'],
            'status' => map_delivery_status_to_ui((string)$r['status']),
            'clientFeedback' => $r['client_feedback'],
            'createdAt' => $r['created_at'],
            'reviewedAt' => $r['reviewed_at'],
        ];
    }, $rows);

    echo json_encode(['ok' => true, 'deliveries' => $deliveries]);
    exit;
}

if ($action === 'create_delivery') {
    $projectId = trim((string)($input['projectId'] ?? ''));
    $freelancerId = trim((string)($input['freelancerId'] ?? ''));
    $message = trim((string)($input['message'] ?? ''));
    $deliveryUrl = trim((string)($input['deliveryUrl'] ?? ''));
    if ($projectId === '' || $freelancerId === '' || $message === '') {
        echo json_encode(['ok' => false, 'error' => 'projectId, freelancerId e message são obrigatórios.']);
        exit;
    }

    $proposalCheck = $pdo->prepare("
        SELECT p.id AS proposal_id, pr.client_id, pr.status AS project_status
        FROM proposals p
        INNER JOIN projects pr ON pr.id = p.project_id
        WHERE p.project_id = ? AND p.freelancer_id = ? AND p.status = 'accepted'
        LIMIT 1
    ");
    $proposalCheck->execute([$projectId, $freelancerId]);
    $accepted = $proposalCheck->fetch();
    if (!$accepted) {
        echo json_encode(['ok' => false, 'error' => 'Apenas freelancer contratado pode enviar entrega.']);
        exit;
    }
    if (($accepted['project_status'] ?? '') !== 'in_progress') {
        echo json_encode(['ok' => false, 'error' => 'Projeto precisa estar em andamento para receber entrega.']);
        exit;
    }

    $deliveryId = bin2hex(random_bytes(18));
    $insert = $pdo->prepare("
        INSERT INTO project_deliveries (id, project_id, proposal_id, freelancer_id, client_id, message, delivery_url, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')
    ");
    $insert->execute([
        $deliveryId,
        $projectId,
        $accepted['proposal_id'],
        $freelancerId,
        $accepted['client_id'],
        $message,
        $deliveryUrl !== '' ? $deliveryUrl : null,
    ]);

    create_notification(
        $pdo,
        (string)$accepted['client_id'],
        'Nova entrega recebida',
        'O freelancer enviou uma nova entrega para revisão.',
        'project',
        '/project/' . $projectId
    );

    echo json_encode(['ok' => true, 'message' => 'Entrega enviada com sucesso.']);
    exit;
}

if ($action === 'request_revision') {
    $deliveryId = trim((string)($input['deliveryId'] ?? ''));
    $clientId = trim((string)($input['clientId'] ?? ''));
    $feedback = trim((string)($input['feedback'] ?? ''));
    if ($deliveryId === '' || $clientId === '' || $feedback === '') {
        echo json_encode(['ok' => false, 'error' => 'deliveryId, clientId e feedback são obrigatórios.']);
        exit;
    }

    $check = $pdo->prepare('SELECT id, project_id, freelancer_id, client_id, status FROM project_deliveries WHERE id = ? LIMIT 1');
    $check->execute([$deliveryId]);
    $delivery = $check->fetch();
    if (!$delivery) {
        echo json_encode(['ok' => false, 'error' => 'Entrega não encontrada.']);
        exit;
    }
    if (($delivery['client_id'] ?? '') !== $clientId) {
        echo json_encode(['ok' => false, 'error' => 'Sem permissão para revisar esta entrega.']);
        exit;
    }
    if (($delivery['status'] ?? '') === 'approved') {
        echo json_encode(['ok' => false, 'error' => 'Entrega já foi aprovada.']);
        exit;
    }

    $upd = $pdo->prepare("UPDATE project_deliveries SET status = 'revision_requested', client_feedback = ?, reviewed_at = NOW() WHERE id = ?");
    $upd->execute([$feedback, $deliveryId]);

    create_notification(
        $pdo,
        (string)$delivery['freelancer_id'],
        'Revisão solicitada',
        'O cliente solicitou ajustes na sua entrega.',
        'project',
        '/project/' . (string)$delivery['project_id']
    );

    echo json_encode(['ok' => true, 'message' => 'Revisão solicitada com sucesso.']);
    exit;
}

if ($action === 'approve_delivery') {
    $deliveryId = trim((string)($input['deliveryId'] ?? ''));
    $clientId = trim((string)($input['clientId'] ?? ''));
    $feedback = trim((string)($input['feedback'] ?? ''));
    if ($deliveryId === '' || $clientId === '') {
        echo json_encode(['ok' => false, 'error' => 'deliveryId e clientId são obrigatórios.']);
        exit;
    }

    $check = $pdo->prepare('SELECT id, project_id, proposal_id, freelancer_id, client_id, status FROM project_deliveries WHERE id = ? LIMIT 1');
    $check->execute([$deliveryId]);
    $delivery = $check->fetch();
    if (!$delivery) {
        echo json_encode(['ok' => false, 'error' => 'Entrega não encontrada.']);
        exit;
    }
    if (($delivery['client_id'] ?? '') !== $clientId) {
        echo json_encode(['ok' => false, 'error' => 'Sem permissão para aprovar esta entrega.']);
        exit;
    }

    $pdo->beginTransaction();
    try {
        $upd = $pdo->prepare("UPDATE project_deliveries SET status = 'approved', client_feedback = ?, reviewed_at = NOW() WHERE id = ?");
        $upd->execute([$feedback !== '' ? $feedback : null, $deliveryId]);

        $projectUpd = $pdo->prepare("UPDATE projects SET status = 'completed' WHERE id = ?");
        $projectUpd->execute([(string)$delivery['project_id']]);

        if (!empty($delivery['proposal_id'])) {
            $paymentUpd = $pdo->prepare("UPDATE payments SET status = 'released', released_at = NOW() WHERE proposal_id = ? AND status IN ('held', 'processing', 'pending')");
            $paymentUpd->execute([(string)$delivery['proposal_id']]);
        }

        create_notification(
            $pdo,
            (string)$delivery['freelancer_id'],
            'Entrega aprovada',
            'Sua entrega foi aprovada e o projeto foi concluído.',
            'project',
            '/project/' . (string)$delivery['project_id']
        );
        create_notification(
            $pdo,
            (string)$delivery['freelancer_id'],
            'Pagamento liberado',
            'O pagamento do projeto foi liberado.',
            'payment',
            '/payments'
        );

        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        echo json_encode(['ok' => false, 'error' => 'Falha ao aprovar entrega.']);
        exit;
    }

    echo json_encode(['ok' => true, 'message' => 'Entrega aprovada e projeto concluído.']);
    exit;
}

echo json_encode(['ok' => false, 'error' => 'Ação inválida.']);
