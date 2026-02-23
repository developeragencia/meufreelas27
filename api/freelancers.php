<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método não permitido']);
    exit;
}

require_once __DIR__ . '/db.php';

function mf_to_username(string $name, string $fallbackId): string {
    $normalized = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name);
    if ($normalized === false) $normalized = $name;
    $normalized = strtolower(trim($normalized));
    $normalized = preg_replace('/[^a-z0-9]+/', '-', $normalized);
    $normalized = trim((string)$normalized, '-');
    if ($normalized === '') return $fallbackId;
    return $normalized;
}

function mf_json_to_array($value): array {
    if (is_array($value)) return $value;
    if (!is_string($value) || trim($value) === '') return [];
    $decoded = json_decode($value, true);
    return is_array($decoded) ? $decoded : [];
}

try {
    $pdo = mf_pdo();
} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'Erro de conexão com banco']);
    exit;
}

$action = (string)($_GET['action'] ?? 'list');
$username = trim((string)($_GET['username'] ?? ''));

$sql = "
    SELECT
      u.id,
      u.name,
      u.avatar,
      u.bio,
      u.skills,
      u.hourly_rate,
      u.rating,
      u.completed_projects,
      u.is_verified,
      u.is_premium,
      u.plan_type,
      u.created_at
    FROM users u
    WHERE (u.type = 'freelancer' OR u.has_freelancer_account = 1)
    ORDER BY u.is_premium DESC, u.rating DESC, u.completed_projects DESC, u.created_at ASC
";

$rows = $pdo->query($sql)->fetchAll();
$items = [];

foreach ($rows as $idx => $row) {
    $name = (string)($row['name'] ?? '');
    $id = (string)($row['id'] ?? '');
    $skills = mf_json_to_array($row['skills'] ?? null);
    $skills = array_values(array_filter(array_map(function ($s) {
        if (is_string($s)) return trim($s);
        if (is_array($s) && isset($s['name']) && is_string($s['name'])) return trim($s['name']);
        return '';
    }, $skills)));

    $bio = (string)($row['bio'] ?? '');
    $hourlyRate = (string)($row['hourly_rate'] ?? '');
    $planType = strtolower((string)($row['plan_type'] ?? 'free'));
    if (!in_array($planType, ['free', 'pro', 'premium'], true)) $planType = 'free';

    $completionChecks = [
        !empty($row['avatar']),
        $name !== '',
        $bio !== '',
        count($skills) > 0,
        $hourlyRate !== '',
    ];
    $profileCompletion = (int)round((count(array_filter($completionChecks)) / count($completionChecks)) * 100);

    $rankingScore = (int)round(
        ($planType === 'premium' ? 40 : ($planType === 'pro' ? 25 : 10)) +
        ((float)$row['rating'] * 10) +
        min(100, ((int)$row['completed_projects']) * 2) +
        ($profileCompletion * 0.2)
    );

    $item = [
        'id' => $id,
        'name' => $name,
        'username' => mf_to_username($name, $id),
        'avatar' => !empty($row['avatar']) ? $row['avatar'] : ('https://ui-avatars.com/api/?name=' . urlencode($name) . '&background=003366&color=fff'),
        'title' => $hourlyRate !== '' ? ('Freelancer • R$ ' . $hourlyRate . '/h') : 'Freelancer Profissional',
        'bio' => $bio !== '' ? $bio : 'Sem descrição informada.',
        'skills' => $skills,
        'rating' => (float)($row['rating'] ?? 0),
        'totalReviews' => (int)($row['completed_projects'] ?? 0),
        'completedProjects' => (int)($row['completed_projects'] ?? 0),
        'recommendations' => (int)($row['completed_projects'] ?? 0),
        'memberSince' => !empty($row['created_at']) ? date('d/m/Y', strtotime((string)$row['created_at'])) : '-',
        'ranking' => $idx + 1,
        'isPremium' => (int)($row['is_premium'] ?? 0) === 1,
        'isPro' => $planType === 'pro',
        'planTier' => $planType,
        'hasPhoto' => !empty($row['avatar']),
        'profileCompletion' => $profileCompletion,
        'rankingScore' => $rankingScore,
        'isVerified' => (int)($row['is_verified'] ?? 0) === 1,
        'registeredAt' => (string)($row['created_at'] ?? ''),
    ];
    $items[] = $item;
}

if ($action === 'get') {
    if ($username === '') {
        echo json_encode(['ok' => false, 'error' => 'username obrigatório']);
        exit;
    }
    foreach ($items as $item) {
        if ($item['username'] === $username || $item['id'] === $username) {
            echo json_encode(['ok' => true, 'freelancer' => $item]);
            exit;
        }
    }
    echo json_encode(['ok' => false, 'error' => 'Freelancer não encontrado']);
    exit;
}

echo json_encode(['ok' => true, 'freelancers' => $items, 'total' => count($items)]);

