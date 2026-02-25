<?php
// api/check_file.php
header('Content-Type: application/json');
$file = 'checkout_v2.php';
echo json_encode([
    'file' => $file,
    'exists' => file_exists(__DIR__ . '/' . $file),
    'path' => __DIR__ . '/' . $file
]);
