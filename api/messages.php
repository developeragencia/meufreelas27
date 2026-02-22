<?php
/**
 * MeuFreelas - Conversas e mensagens (sem mocks)
 * POST action:
 * - list_conversations { userId }
 * - get_messages { userId, conversationId }
 * - send_message { userId, conversationId, content }
 * - ensure_conversation { userId, participantId, projectId? }
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

function create_notification(PDO $pdo, string $userId, string $title, string $message, string $type = 'message', ?string $link = null): void {
    $notificationId = bin2hex(random_bytes(18));
    try {
        $stmt = $pdo->prepare('INSERT INTO notifications (id, user_id, title, message, type, link) VALUES (?, ?, ?, ?, ?, ?)');
        $stmt->execute([$notificationId, $userId, $title, $message, $type, $link]);
        return;
    } catch (Throwable $e) {
        // fallback para estrutura legada
    }
    try {
        $stmt = $pdo->prepare('INSERT INTO notifications (id, user_id, title, message) VALUES (?, ?, ?, ?)');
        $stmt->execute([$notificationId, $userId, $title, $message]);
    } catch (Throwable $e) {
        // não interrompe o fluxo principal de mensagem
    }
}

$input = json_decode(file_get_contents('php://input'), true) ?? [];
$action = trim((string)($input['action'] ?? ''));
$userId = trim((string)($input['userId'] ?? ''));

if ($action === '' || $userId === '') {
    echo json_encode(['ok' => false, 'error' => 'Ação e userId são obrigatórios.']);
    exit;
}

if ($action === 'list_conversations') {
    $sql = "
        SELECT
            c.id,
            c.project_id,
            u.id AS participant_id,
            u.name AS participant_name,
            u.avatar AS participant_avatar,
            u.type AS participant_type,
            p.title AS project_title,
            p.budget AS project_value,
            (
                SELECT m1.content
                FROM messages m1
                WHERE m1.conversation_id = c.id
                ORDER BY m1.created_at DESC
                LIMIT 1
            ) AS last_message,
            (
                SELECT m2.created_at
                FROM messages m2
                WHERE m2.conversation_id = c.id
                ORDER BY m2.created_at DESC
                LIMIT 1
            ) AS last_message_at
        FROM conversations c
        INNER JOIN conversation_participants self_cp
            ON self_cp.conversation_id = c.id AND self_cp.user_id = :uid
        INNER JOIN conversation_participants other_cp
            ON other_cp.conversation_id = c.id AND other_cp.user_id <> :uid
        INNER JOIN users u
            ON u.id = other_cp.user_id
        LEFT JOIN projects p
            ON p.id = c.project_id
        ORDER BY COALESCE(last_message_at, c.created_at) DESC
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute(['uid' => $userId]);
    $rows = $stmt->fetchAll();

    $conversations = array_map(function ($r) {
        return [
            'id' => $r['id'],
            'participantId' => $r['participant_id'],
            'participantName' => $r['participant_name'],
            'participantAvatar' => $r['participant_avatar'],
            'participantTitle' => $r['participant_type'] === 'freelancer' ? 'Freelancer' : 'Contratante',
            'lastMessage' => $r['last_message'] ?: 'Sem mensagens',
            'lastMessageTime' => $r['last_message_at'] ?: null,
            'unreadCount' => 0,
            'online' => false,
            'projectTitle' => $r['project_title'],
            'projectValue' => $r['project_value'],
        ];
    }, $rows);

    echo json_encode(['ok' => true, 'conversations' => $conversations]);
    exit;
}

if ($action === 'get_messages') {
    $conversationId = trim((string)($input['conversationId'] ?? ''));
    if ($conversationId === '') {
        echo json_encode(['ok' => false, 'error' => 'conversationId é obrigatório.']);
        exit;
    }

    $check = $pdo->prepare('SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ? LIMIT 1');
    $check->execute([$conversationId, $userId]);
    if (!$check->fetch()) {
        echo json_encode(['ok' => false, 'error' => 'Acesso negado à conversa.']);
        exit;
    }

    $stmt = $pdo->prepare("
        SELECT m.id, m.sender_id, m.content, m.created_at, u.name AS sender_name, u.avatar AS sender_avatar
        FROM messages m
        INNER JOIN users u ON u.id = m.sender_id
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC
    ");
    $stmt->execute([$conversationId]);
    $rows = $stmt->fetchAll();

    $messages = array_map(function ($r) {
        return [
            'id' => $r['id'],
            'senderId' => $r['sender_id'],
            'senderName' => $r['sender_name'],
            'senderAvatar' => $r['sender_avatar'],
            'content' => $r['content'],
            'timestamp' => $r['created_at'],
            'read' => true,
        ];
    }, $rows);

    echo json_encode(['ok' => true, 'messages' => $messages]);
    exit;
}

if ($action === 'send_message') {
    $conversationId = trim((string)($input['conversationId'] ?? ''));
    $content = trim((string)($input['content'] ?? ''));
    if ($conversationId === '' || $content === '') {
        echo json_encode(['ok' => false, 'error' => 'conversationId e content são obrigatórios.']);
        exit;
    }

    $check = $pdo->prepare('SELECT 1 FROM conversation_participants WHERE conversation_id = ? AND user_id = ? LIMIT 1');
    $check->execute([$conversationId, $userId]);
    if (!$check->fetch()) {
        echo json_encode(['ok' => false, 'error' => 'Acesso negado à conversa.']);
        exit;
    }

    $messageId = bin2hex(random_bytes(18));
    $insert = $pdo->prepare('INSERT INTO messages (id, conversation_id, sender_id, content) VALUES (?, ?, ?, ?)');
    $insert->execute([$messageId, $conversationId, $userId, $content]);

    $recipientStmt = $pdo->prepare('SELECT user_id FROM conversation_participants WHERE conversation_id = ? AND user_id <> ? LIMIT 1');
    $recipientStmt->execute([$conversationId, $userId]);
    $recipient = $recipientStmt->fetch();
    if ($recipient && !empty($recipient['user_id'])) {
        create_notification(
            $pdo,
            (string)$recipient['user_id'],
            'Nova mensagem recebida',
            'Você recebeu uma nova mensagem no chat.',
            'message',
            '/messages?conversation=' . $conversationId
        );
    }

    $sender = $pdo->prepare('SELECT name, avatar FROM users WHERE id = ? LIMIT 1');
    $sender->execute([$userId]);
    $senderRow = $sender->fetch();

    echo json_encode([
        'ok' => true,
        'message' => [
            'id' => $messageId,
            'senderId' => $userId,
            'senderName' => $senderRow['name'] ?? 'Você',
            'senderAvatar' => $senderRow['avatar'] ?? null,
            'content' => $content,
            'timestamp' => date('Y-m-d H:i:s'),
            'read' => true,
        ],
    ]);
    exit;
}

if ($action === 'ensure_conversation') {
    $participantId = trim((string)($input['participantId'] ?? ''));
    $projectId = trim((string)($input['projectId'] ?? ''));
    if ($participantId === '') {
        echo json_encode(['ok' => false, 'error' => 'participantId é obrigatório.']);
        exit;
    }
    if ($participantId === $userId) {
        echo json_encode(['ok' => false, 'error' => 'Não é possível criar conversa consigo mesmo.']);
        exit;
    }

    $sql = "
        SELECT c.id
        FROM conversations c
        INNER JOIN conversation_participants a ON a.conversation_id = c.id AND a.user_id = :u1
        INNER JOIN conversation_participants b ON b.conversation_id = c.id AND b.user_id = :u2
        WHERE (:pid = '' OR c.project_id = :pid)
        LIMIT 1
    ";
    $find = $pdo->prepare($sql);
    $find->execute(['u1' => $userId, 'u2' => $participantId, 'pid' => $projectId]);
    $existing = $find->fetch();
    if ($existing) {
        echo json_encode(['ok' => true, 'conversationId' => $existing['id']]);
        exit;
    }

    $conversationId = bin2hex(random_bytes(18));
    $create = $pdo->prepare('INSERT INTO conversations (id, project_id) VALUES (?, ?)');
    $create->execute([$conversationId, $projectId !== '' ? $projectId : null]);

    $cp = $pdo->prepare('INSERT INTO conversation_participants (conversation_id, user_id) VALUES (?, ?)');
    $cp->execute([$conversationId, $userId]);
    $cp->execute([$conversationId, $participantId]);

    echo json_encode(['ok' => true, 'conversationId' => $conversationId]);
    exit;
}

echo json_encode(['ok' => false, 'error' => 'Ação inválida.']);
