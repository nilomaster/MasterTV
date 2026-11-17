<?php
// MasterTV Xtream Codes Compatible Playlist Generator (get.php)
// Allows Smart TVs, UniTV, and IPTV apps to download the M3U Plus playlist
// All comments in this file strictly use ASCII characters

ini_set('display_errors', '0');
error_reporting(0);

$username = trim($_GET['username'] ?? '');
$password = trim($_GET['password'] ?? '');

if (empty($username) || empty($password)) {
    http_response_code(401);
    die('Acesso negado. Credenciais ausentes.');
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
    http_response_code(503);
    die('Servidor de banco de dados offline.');
}

try {
    $stmt = $pdo->prepare("SELECT * FROM `clients` WHERE `username` = :u LIMIT 1");
    $stmt->execute([':u' => $username]);
    $client = $stmt->fetch();
} catch (Exception $e) {
    http_response_code(500);
    die('Erro ao validar cliente.');
}

if (!$client) {
    http_response_code(401);
    die('Usuario ou senha incorretos.');
}

$validPass = ($client['password'] === $password || password_verify($password, $client['password']));
if (!$validPass) {
    http_response_code(401);
    die('Usuario ou senha incorretos.');
}

if ($client['status'] === 'blocked') {
    http_response_code(403);
    die('Linha suspensa.');
}

$now = time();
$exp = strtotime($client['expires_at']);
if ($exp < $now) {
    http_response_code(403);
    die('Assinatura vencida.');
}

// Set M3U Headers
header('Content-Type: audio/x-mpegurl; charset=utf-8');
header('Content-Disposition: attachment; filename="mastertv_playlist.m3u"');
header('Access-Control-Allow-Origin: *');

echo "#EXTM3U\n";

try {
    $stmt = $pdo->query("SELECT * FROM `contents` WHERE `status` = 'active' ORDER BY type ASC, channel_number ASC, title ASC");
    $items = $stmt->fetchAll();

    foreach ($items as $item) {
        $title = $item['title'];
        $logo = $item['poster_url'] ?: '';
        $epg = $item['epg_id'] ?: $title;
        $group = ($item['type'] === 'channel')
            ? ($item['channel_category'] ?: 'Canais Ao Vivo')
            : ($item['type'] === 'movie' ? 'Filmes' : 'Series');
        $url = $item['stream_url'];

        echo "#EXTINF:-1 tvg-id=\"{$epg}\" tvg-name=\"{$title}\" tvg-logo=\"{$logo}\" group-title=\"{$group}\",{$title}\n";
        echo "{$url}\n";
    }
} catch (Exception $e) {
    // End of playlist
}
