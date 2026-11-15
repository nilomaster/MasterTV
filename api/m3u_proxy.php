<?php
// MasterTV High-Performance M3U and IPTV Stream Proxy
// Bypasses CORS and sets IPTV User-Agent (IPTVSmartersPro)
// Strictly ASCII comments only as per project rules

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Disable script timeout and increase memory for large 30MB+ playlists
@set_time_limit(180);
@ini_set('memory_limit', '512M');

$url = '';
if (isset($_GET['url'])) {
    $url = trim($_GET['url']);
} elseif (isset($_POST['url'])) {
    $url = trim($_POST['url']);
} else {
    $rawInput = file_get_contents('php://input');
    if (!empty($rawInput)) {
        $json = json_decode($rawInput, true);
        if (isset($json['url'])) {
            $url = trim($json['url']);
        }
    }
}

if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['success' => false, 'message' => 'URL invalida ou nao informada.']);
    exit;
}

// Initialize cURL with IPTV Smarters Pro user agent
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_TIMEOUT, 120);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 20);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'IPTVSmartersPro');
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Accept: */*',
    'Connection: keep-alive',
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError = curl_error($ch);
curl_close($ch);

if ($response === false || $httpCode < 200 || $httpCode >= 400) {
    http_response_code($httpCode >= 400 ? $httpCode : 502);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode([
        'success' => false,
        'message' => 'Erro ao baixar lista M3U do servidor de origem: ' . ($curlError ?: 'Codigo HTTP ' . $httpCode),
    ]);
    exit;
}

// Return raw playlist content directly
header('Content-Type: text/plain; charset=UTF-8');
header('Content-Disposition: inline; filename="playlist.m3u"');
echo $response;
exit;
