<?php
// MasterTV Xtream Codes Compatible API (player_api.php)
// Allows Smart TVs, TV Boxes, UniTV, Smarters Pro, XCIPTV, and TiviMate to authenticate and load channels
// All comments in this file strictly use ASCII characters

ini_set('display_errors', '0');
error_reporting(0);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database Connection
$pdo = null;
$db_host = 'iptv_db.mysql.dbaas.com.br';
$db_user = 'iptv_db';
$db_pass = 'Senha2026!@#';
$db_name = 'iptv_db';

try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (Exception $e) {
    $pdo = null;
}

// Capture credentials from GET, POST or JSON body
$rawInput = json_decode(file_get_contents('php://input'), true);
$username = trim($_REQUEST['username'] ?? ($rawInput['username'] ?? ''));
$password = trim($_REQUEST['password'] ?? ($rawInput['password'] ?? ''));
$action   = trim($_REQUEST['action'] ?? ($rawInput['action'] ?? ''));

// Authentication Verification
if (empty($username) || empty($password) || $pdo === null) {
    echo json_encode(['user_info' => ['auth' => 0]]);
    exit();
}

$client = null;
try {
    $stmt = $pdo->prepare("SELECT * FROM `clients` WHERE `username` = :u LIMIT 1");
    $stmt->execute([':u' => $username]);
    $client = $stmt->fetch();
} catch (Exception $e) {
    echo json_encode(['user_info' => ['auth' => 0]]);
    exit();
}

if (!$client) {
    echo json_encode(['user_info' => ['auth' => 0]]);
    exit();
}

$validPass = ($client['password'] === $password || password_verify($password, $client['password']));
if (!$validPass) {
    echo json_encode(['user_info' => ['auth' => 0]]);
    exit();
}

if ($client['status'] === 'blocked') {
    echo json_encode([
        'user_info' => [
            'username' => $client['username'],
            'auth' => 0,
            'status' => 'Disabled',
            'message' => 'Linha bloqueada pela administracao.'
        ]
    ]);
    exit();
}

$now = time();
$exp = strtotime($client['expires_at']);
if ($exp < $now) {
    echo json_encode([
        'user_info' => [
            'username' => $client['username'],
            'auth' => 0,
            'status' => 'Expired',
            'exp_date' => (string)$exp,
            'message' => 'Linha de acesso expirada.'
        ]
    ]);
    exit();
}

// Host and protocol detection
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? 'mastertvhd.online';
$port = ($protocol === 'https') ? '443' : '80';

// Action Router
switch ($action) {
    case 'get_live_categories':
        try {
            $stmt = $pdo->query("SELECT DISTINCT COALESCE(NULLIF(channel_category, ''), 'Abertos') as cat FROM `contents` WHERE `type` = 'channel' AND `status` = 'active' ORDER BY cat ASC");
            $rows = $stmt->fetchAll();
            $categories = [];
            $catId = 1;
            foreach ($rows as $r) {
                $categories[] = [
                    'category_id' => (string)$catId,
                    'category_name' => $r['cat'],
                    'parent_id' => 0
                ];
                $catId++;
            }
            if (empty($categories)) {
                $categories[] = ['category_id' => '1', 'category_name' => 'Canais MasterTV', 'parent_id' => 0];
            }
            echo json_encode($categories, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([]);
        }
        break;

    case 'get_live_streams':
        try {
            $stmt = $pdo->query("SELECT * FROM `contents` WHERE `type` = 'channel' AND `status` = 'active' ORDER BY channel_number ASC, title ASC");
            $channels = $stmt->fetchAll();
            $streams = [];
            $idCounter = 1;
            foreach ($channels as $ch) {
                $streams[] = [
                    'num' => (int)($ch['channel_number'] ?: $idCounter),
                    'name' => $ch['title'],
                    'stream_type' => 'live',
                    'stream_id' => (int)$idCounter,
                    'stream_icon' => $ch['poster_url'] ?: '',
                    'epg_channel_id' => $ch['epg_id'] ?: $ch['title'],
                    'added' => (string)strtotime($ch['created_at']),
                    'category_id' => '1',
                    'custom_sid' => '',
                    'tv_archive' => 0,
                    'direct_source' => $ch['stream_url']
                ];
                $idCounter++;
            }
            echo json_encode($streams, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([]);
        }
        break;

    case 'get_vod_categories':
        try {
            $stmt = $pdo->query("SELECT DISTINCT COALESCE(NULLIF(genres, ''), 'Filmes') as cat FROM `contents` WHERE `type` = 'movie' AND `status` = 'active' ORDER BY cat ASC");
            $rows = $stmt->fetchAll();
            $categories = [];
            $catId = 1;
            foreach ($rows as $r) {
                $categories[] = [
                    'category_id' => (string)$catId,
                    'category_name' => $r['cat'],
                    'parent_id' => 0
                ];
                $catId++;
            }
            echo json_encode($categories, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([]);
        }
        break;

    case 'get_vod_streams':
        try {
            $stmt = $pdo->query("SELECT * FROM `contents` WHERE `type` = 'movie' AND `status` = 'active' ORDER BY title ASC");
            $movies = $stmt->fetchAll();
            $vodList = [];
            $idCounter = 1;
            foreach ($movies as $m) {
                $vodList[] = [
                    'num' => (int)$idCounter,
                    'name' => $m['title'],
                    'stream_type' => 'movie',
                    'stream_id' => (int)$idCounter,
                    'stream_icon' => $m['poster_url'] ?: '',
                    'rating' => (string)$m['rating'],
                    'rating_5based' => round(((float)$m['rating']) / 2, 1),
                    'added' => (string)strtotime($m['created_at']),
                    'category_id' => '1',
                    'container_extension' => 'mp4',
                    'direct_source' => $m['stream_url']
                ];
                $idCounter++;
            }
            echo json_encode($vodList, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([]);
        }
        break;

    case 'get_series_categories':
        try {
            $stmt = $pdo->query("SELECT DISTINCT COALESCE(NULLIF(genres, ''), 'Series') as cat FROM `contents` WHERE `type` = 'series' AND `status` = 'active' ORDER BY cat ASC");
            $rows = $stmt->fetchAll();
            $categories = [];
            $catId = 1;
            foreach ($rows as $r) {
                $categories[] = [
                    'category_id' => (string)$catId,
                    'category_name' => $r['cat'],
                    'parent_id' => 0
                ];
                $catId++;
            }
            echo json_encode($categories, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([]);
        }
        break;

    case 'get_series':
        try {
            $stmt = $pdo->query("SELECT * FROM `contents` WHERE `type` = 'series' AND `status` = 'active' ORDER BY title ASC");
            $series = $stmt->fetchAll();
            $seriesList = [];
            $idCounter = 1;
            foreach ($series as $s) {
                $seriesList[] = [
                    'num' => (int)$idCounter,
                    'name' => $s['title'],
                    'series_id' => (int)$idCounter,
                    'cover' => $s['poster_url'] ?: '',
                    'plot' => $s['description'] ?: '',
                    'cast' => '',
                    'rating' => (string)$s['rating'],
                    'rating_5based' => round(((float)$s['rating']) / 2, 1),
                    'genre' => $s['genres'] ?: 'Geral',
                    'releaseDate' => (string)$s['year'],
                    'last_modified' => (string)strtotime($s['updated_at'] ?? $s['created_at']),
                    'category_id' => '1'
                ];
                $idCounter++;
            }
            echo json_encode($seriesList, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        } catch (Exception $e) {
            echo json_encode([]);
        }
        break;

    default:
        // Default Handshake Authentication for Xtream Codes compatible apps
        echo json_encode([
            'user_info' => [
                'username' => $client['username'],
                'password' => $client['password'],
                'message' => 'MasterTV Conectado com Sucesso',
                'auth' => 1,
                'status' => 'Active',
                'exp_date' => (string)$exp,
                'is_trial' => '0',
                'active_cons' => '0',
                'created_at' => (string)strtotime($client['created_at'] ?? 'now'),
                'max_connections' => (string)($client['max_screens'] ?? 1),
                'allowed_output_formats' => ['m3u8', 'ts', 'rtmp']
            ],
            'server_info' => [
                'url' => $host,
                'port' => $port,
                'https_port' => '443',
                'server_protocol' => $protocol,
                'rtmp_port' => '8880',
                'timezone' => 'America/Sao_Paulo',
                'time_now' => date('Y-m-d H:i:s'),
                'timestamp_now' => time()
            ]
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        break;
}
