<?php
// MasterTV Authenticated & Anti-SSRF M3U Import Proxy
// Strictly ASCII comments only as per project rules

if (!function_exists('requireMasterAdmin')) {
    require_once __DIR__ . '/config/app.php';
}
if (!function_exists('safeFetchExternalM3u')) {
    require_once __DIR__ . '/helpers/ssrf_guard.php';
}

// Require active database connection and Master Admin authentication
if (!isset($pdo) || $pdo === null) {
    sendResponse(['success' => false, 'message' => 'Servidor de banco de dados offline.'], 503);
}
requireMasterAdmin($pdo);

// Increase memory and time limits for large M3U playlists within safe bounds
@set_time_limit(120);
@ini_set('memory_limit', '256M');

$url = '';
if (isset($_GET['url'])) {
    $url = trim((string)$_GET['url']);
} elseif (isset($_POST['url'])) {
    $url = trim((string)$_POST['url']);
} else {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $json = json_decode($rawInput, true);
        if (is_array($json) && isset($json['url'])) {
            $url = trim((string)$json['url']);
        }
    }
}

if ($url === '') {
    sendResponse(['success' => false, 'message' => 'URL invalida ou nao informada.'], 400);
}

$result = safeFetchExternalM3u($url, [
    'max_redirects' => 4,
    'max_bytes' => 52428800, // 50 MB max playlist size
    'connect_timeout' => 15,
    'timeout' => 90,
]);

if (empty($result['ok'])) {
    $statusCode = isset($result['http_code']) ? (int)$result['http_code'] : 400;
    $message = isset($result['message']) ? (string)$result['message'] : 'Erro ao baixar lista M3U.';
    sendResponse(['success' => false, 'message' => $message], $statusCode);
}

// Return raw playlist content directly
header('Content-Type: text/plain; charset=UTF-8');
header('Content-Disposition: inline; filename="playlist.m3u"');
header('X-Content-Type-Options: nosniff');
echo $result['body'];
exit;
