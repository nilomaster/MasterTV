<?php
// MasterTV High-Performance Stream Proxy for HLS (.m3u8, .ts) and VOD (.mp4, .mkv)
// Bypasses Cloudflare User-Agent blocks, Mixed Content (HTTP on HTTPS), and CORS
// Strictly ASCII comments only as per project rules

// Allow CORS from any origin
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, HEAD, OPTIONS');
header('Access-Control-Allow-Headers: Range, Content-Type, Authorization, X-Requested-With');
header('Access-Control-Expose-Headers: Content-Length, Content-Range, Accept-Ranges');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

@set_time_limit(0);
@ini_set('memory_limit', '512M');

$url = '';
if (isset($_GET['url'])) {
    $url = trim($_GET['url']);
}

if (empty($url) || !filter_var($url, FILTER_VALIDATE_URL)) {
    http_response_code(400);
    header('Content-Type: application/json; charset=UTF-8');
    echo json_encode(['success' => false, 'message' => 'URL de streaming invalida ou ausente.']);
    exit;
}

// Determine if target is an HLS playlist (.m3u8)
$urlPath = parse_url($url, PHP_URL_PATH);
$isM3u8 = (substr($urlPath, -5) === '.m3u8' || strpos($url, '.m3u8') !== false);

// Proxy base URL to rewrite child segment links
$isHttps = (
    (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ||
    (isset($_SERVER['SERVER_PORT']) && $_SERVER['SERVER_PORT'] == 443) ||
    (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https')
);
$proto = $isHttps ? 'https://' : 'http://';
$host = $_SERVER['HTTP_HOST'] ?? 'mastertvhd.online';
$proxyEndpoint = $proto . $host . '/api/stream.php';

if ($isM3u8) {
    // 1. Fetch m3u8 playlist, follow redirects and rewrite segment URLs
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'IPTVSmartersPro');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: */*',
        'Connection: keep-alive',
    ]);

    $content = curl_exec($ch);
    $effectiveUrl = curl_getinfo($ch, CURLINFO_EFFECTIVE_URL);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($content === false || $httpCode < 200 || $httpCode >= 400) {
        http_response_code($httpCode >= 400 ? $httpCode : 502);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode(['success' => false, 'message' => 'Falha ao carregar playlist de streaming: ' . $httpCode]);
        exit;
    }

    // Determine base URL of the final redirected location
    $parsedEffective = parse_url($effectiveUrl);
    $effectiveScheme = $parsedEffective['scheme'] ?? 'http';
    $effectiveHost = $parsedEffective['host'] ?? '';
    $effectivePort = isset($parsedEffective['port']) ? ':' . $parsedEffective['port'] : '';
    $effectiveBasePath = '';
    if (isset($parsedEffective['path'])) {
        $effectiveBasePath = dirname($parsedEffective['path']);
        if ($effectiveBasePath === '.' || $effectiveBasePath === '/') {
            $effectiveBasePath = '';
        }
    }
    $originHostBase = $effectiveScheme . '://' . $effectiveHost . $effectivePort;

    // Rewrite lines in the M3U8 playlist
    $lines = explode("\n", $content);
    $rewrittenLines = [];

    foreach ($lines as $line) {
        $trimmed = trim($line);
        if (empty($trimmed)) {
            $rewrittenLines[] = $line;
            continue;
        }

        if ($trimmed[0] === '#') {
            // Check for URI= in EXT-X-KEY or EXT-X-MAP
            if (strpos($trimmed, 'URI="') !== false) {
                $trimmed = preg_replace_callback('/URI="([^"]+)"/', function($matches) use ($originHostBase, $effectiveBasePath, $proxyEndpoint) {
                    $origUri = $matches[1];
                    $absUri = $origUri;
                    if (strpos($origUri, 'http://') !== 0 && strpos($origUri, 'https://') !== 0) {
                        if ($origUri[0] === '/') {
                            $absUri = $originHostBase . $origUri;
                        } else {
                            $absUri = $originHostBase . $effectiveBasePath . '/' . $origUri;
                        }
                    }
                    return 'URI="' . $proxyEndpoint . '?url=' . urlencode($absUri) . '"';
                }, $trimmed);
            }
            $rewrittenLines[] = $trimmed;
            continue;
        }

        // Segment URL
        $segUrl = $trimmed;
        if (strpos($segUrl, 'http://') !== 0 && strpos($segUrl, 'https://') !== 0) {
            if ($segUrl[0] === '/') {
                $segUrl = $originHostBase . $segUrl;
            } else {
                $segUrl = $originHostBase . $effectiveBasePath . '/' . $segUrl;
            }
        }

        $rewrittenLines[] = $proxyEndpoint . '?url=' . urlencode($segUrl);
    }

    $rewrittenM3u8 = implode("\n", $rewrittenLines);
    header('Content-Type: application/vnd.apple.mpegurl; charset=UTF-8');
    header('Content-Length: ' . strlen($rewrittenM3u8));
    header('Cache-Control: no-cache, no-store, must-revalidate');
    echo $rewrittenM3u8;
    exit;
}

// 2. Direct Media Stream (TS chunk, MP4, MKV)
// Pass Range header if requested by player
$headers = [
    'Accept: */*',
    'Connection: keep-alive',
];

if (isset($_SERVER['HTTP_RANGE'])) {
    $headers[] = 'Range: ' . $_SERVER['HTTP_RANGE'];
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'IPTVSmartersPro');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_TIMEOUT, 60);
curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

// Forward response headers directly to client
curl_setopt($ch, CURLOPT_HEADERFUNCTION, function($ch, $headerLine) {
    $len = strlen($headerLine);
    if (preg_match('/^HTTP\/\d(?:\.\d)?\s+(\d+)/i', $headerLine, $m)) {
        http_response_code((int)$m[1]);
        return $len;
    }
    $parts = explode(':', $headerLine, 2);
    if (count($parts) === 2) {
        $headerName = strtolower(trim($parts[0]));
        $allowedHeaders = [
            'content-type',
            'content-length',
            'content-range',
            'accept-ranges',
            'cache-control',
            'last-modified',
            'etag'
        ];
        if (in_array($headerName, $allowedHeaders)) {
            header($headerLine, false);
        }
    }
    return $len;
});

// Stream body chunks directly to output buffer
curl_setopt($ch, CURLOPT_WRITEFUNCTION, function($ch, $chunk) {
    echo $chunk;
    if (ob_get_level() > 0) {
        ob_flush();
    }
    flush();
    return strlen($chunk);
});

curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
exit;
