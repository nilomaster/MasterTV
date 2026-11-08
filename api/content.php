<?php
// MasterTV Content & VOD/Channel Management REST API Endpoint
// Strictly ASCII comments only

require_once __DIR__ . '/config.php';

if ($pdo === null) {
    sendResponse(['success' => false, 'message' => 'Servidor de banco de dados offline.'], 503);
}

// Auto-create contents table if it does not exist yet
try {
    $pdo->exec("CREATE TABLE IF NOT EXISTS `contents` (
        `id` VARCHAR(100) PRIMARY KEY,
        `type` ENUM('movie', 'series', 'channel', 'anime', 'dorama') NOT NULL DEFAULT 'movie',
        `title` VARCHAR(255) NOT NULL,
        `tagline` VARCHAR(255) NULL,
        `rating` DECIMAL(3,1) NOT NULL DEFAULT 8.0,
        `duration` VARCHAR(60) NULL,
        `year` INT NOT NULL DEFAULT 2026,
        `content_rating` VARCHAR(30) DEFAULT '14',
        `genres` VARCHAR(255) DEFAULT 'Geral',
        `poster_url` TEXT NOT NULL,
        `backdrop_url` TEXT NULL,
        `stream_url` TEXT NOT NULL,
        `backup_stream_url` TEXT NULL,
        `description` TEXT NULL,
        `director` VARCHAR(150) NULL,
        `writers` VARCHAR(150) NULL,
        `production` VARCHAR(150) NULL,
        `channel_number` INT DEFAULT 1,
        `channel_category` VARCHAR(60) DEFAULT 'aberta',
        `current_program` VARCHAR(150) NULL,
        `epg_id` VARCHAR(100) NULL,
        `seasons` INT DEFAULT 1,
        `episodes` INT DEFAULT 1,
        `episodes_json` LONGTEXT NULL,
        `sources_json` LONGTEXT NULL,
        `cast_json` LONGTEXT NULL,
        `status` ENUM('active', 'inactive') DEFAULT 'active',
        `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_type` (`type`),
        INDEX `idx_status` (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

    // Ensure sources_json, cast_json and epg_id columns exist if table was created previously
    try {
        $pdo->exec("ALTER TABLE `contents` ADD COLUMN `sources_json` LONGTEXT NULL AFTER `episodes_json`");
    } catch (Exception $alterEx) {}
    try {
        $pdo->exec("ALTER TABLE `contents` ADD COLUMN `cast_json` LONGTEXT NULL AFTER `sources_json`");
    } catch (Exception $alterEx2) {}
    try {
        $pdo->exec("ALTER TABLE `contents` ADD COLUMN `epg_id` VARCHAR(100) NULL AFTER `current_program`");
    } catch (Exception $alterEx3) {}
} catch (Exception $e) {
    // Continue even if table already exists or minor notice
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $type = isset($_GET['type']) ? trim($_GET['type']) : null;
            if ($type) {
                $stmt = $pdo->prepare("SELECT * FROM `contents` WHERE `type` = :t AND `status` = 'active' ORDER BY `created_at` DESC");
                $stmt->execute([':t' => $type]);
            } else {
                $stmt = $pdo->query("SELECT * FROM `contents` ORDER BY `created_at` DESC");
            }
            $items = $stmt->fetchAll();

            // Decode episodes_json, sources_json and cast_json
            $formatted = array_map(function($item) {
                $item['rating'] = (float)$item['rating'];
                $item['year'] = (int)$item['year'];
                $item['channel_number'] = (int)$item['channel_number'];
                $item['seasons'] = (int)$item['seasons'];
                $item['episodes'] = (int)$item['episodes'];
                $item['episodes_list'] = !empty($item['episodes_json']) ? json_decode($item['episodes_json'], true) : [];
                $item['sources_list'] = !empty($item['sources_json']) ? json_decode($item['sources_json'], true) : [];
                $item['cast'] = !empty($item['cast_json']) ? json_decode($item['cast_json'], true) : [];
                return $item;
            }, $items);

            sendResponse(['success' => true, 'contents' => $formatted]);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'message' => 'Erro ao listar conteudos: ' . $e->getMessage()], 500);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $action = trim($data['action'] ?? 'create');

        if ($action === 'delete') {
            $id = trim($data['id'] ?? '');
            if (empty($id)) {
                sendResponse(['success' => false, 'message' => 'ID do conteudo e obrigatorio.'], 400);
            }
            try {
                $stmt = $pdo->prepare("DELETE FROM `contents` WHERE `id` = :id");
                $stmt->execute([':id' => $id]);
                sendResponse(['success' => true, 'message' => 'Conteudo excluido com sucesso.']);
            } catch (Exception $e) {
                sendResponse(['success' => false, 'message' => 'Erro ao excluir conteudo: ' . $e->getMessage()], 500);
            }
        }

        // Create or update content
        $title = trim($data['title'] ?? '');
        $type = trim($data['type'] ?? 'movie');
        $streamUrl = trim($data['stream_url'] ?? '');
        $posterUrl = trim($data['poster_url'] ?? '');

        if (empty($title)) {
            sendResponse(['success' => false, 'message' => 'O nome/titulo do conteudo e obrigatorio.'], 400);
        }
        if (empty($streamUrl)) {
            sendResponse(['success' => false, 'message' => 'O link do stream (filme/canal) e obrigatorio.'], 400);
        }

        $id = !empty($data['id']) ? trim($data['id']) : ($type . '-' . time() . '-' . rand(100, 999));
        $tagline = trim($data['tagline'] ?? '');
        $rating = !empty($data['rating']) ? (float)$data['rating'] : 8.0;
        $duration = trim($data['duration'] ?? '');
        $year = !empty($data['year']) ? (int)$data['year'] : 2026;
        $contentRating = trim($data['content_rating'] ?? '14');
        $genres = trim($data['genres'] ?? 'Geral');
        $backdropUrl = trim($data['backdrop_url'] ?? $posterUrl);
        $backupStreamUrl = trim($data['backup_stream_url'] ?? '');
        $description = trim($data['description'] ?? '');
        $director = trim($data['director'] ?? '');
        $writers = trim($data['writers'] ?? '');
        $production = trim($data['production'] ?? '');
        $channelNumber = !empty($data['channel_number']) ? (int)$data['channel_number'] : 1;
        $channelCategory = trim($data['channel_category'] ?? 'aberta');
        $currentProgram = trim($data['current_program'] ?? '');
        $epgId = trim($data['epg_id'] ?? '');
        $seasons = !empty($data['seasons']) ? (int)$data['seasons'] : 1;
        $episodes = !empty($data['episodes']) ? (int)$data['episodes'] : 1;
        $episodesJson = !empty($data['episodes_list']) ? json_encode($data['episodes_list'], JSON_UNESCAPED_UNICODE) : null;
        $sourcesJson = !empty($data['sources_list']) ? json_encode($data['sources_list'], JSON_UNESCAPED_UNICODE) : null;
        $castJson = !empty($data['cast']) ? json_encode($data['cast'], JSON_UNESCAPED_UNICODE) : null;
        $status = trim($data['status'] ?? 'active');

        try {
            $stmt = $pdo->prepare("INSERT INTO `contents` (
                `id`, `type`, `title`, `tagline`, `rating`, `duration`, `year`, `content_rating`,
                `genres`, `poster_url`, `backdrop_url`, `stream_url`, `backup_stream_url`,
                `description`, `director`, `writers`, `production`, `channel_number`,
                `channel_category`, `current_program`, `epg_id`, `seasons`, `episodes`, `episodes_json`, `sources_json`, `cast_json`, `status`
            ) VALUES (
                :id, :type, :title, :tagline, :rating, :duration, :year, :content_rating,
                :genres, :poster_url, :backdrop_url, :stream_url, :backup_stream_url,
                :description, :director, :writers, :production, :channel_number,
                :channel_category, :current_program, :epg_id, :seasons, :episodes, :episodes_json, :sources_json, :cast_json, :status
            ) ON DUPLICATE KEY UPDATE
                `type` = VALUES(`type`),
                `title` = VALUES(`title`),
                `tagline` = VALUES(`tagline`),
                `rating` = VALUES(`rating`),
                `duration` = VALUES(`duration`),
                `year` = VALUES(`year`),
                `content_rating` = VALUES(`content_rating`),
                `genres` = VALUES(`genres`),
                `poster_url` = VALUES(`poster_url`),
                `backdrop_url` = VALUES(`backdrop_url`),
                `stream_url` = VALUES(`stream_url`),
                `backup_stream_url` = VALUES(`backup_stream_url`),
                `description` = VALUES(`description`),
                `director` = VALUES(`director`),
                `writers` = VALUES(`writers`),
                `production` = VALUES(`production`),
                `channel_number` = VALUES(`channel_number`),
                `channel_category` = VALUES(`channel_category`),
                `current_program` = VALUES(`current_program`),
                `epg_id` = VALUES(`epg_id`),
                `seasons` = VALUES(`seasons`),
                `episodes` = VALUES(`episodes`),
                `episodes_json` = VALUES(`episodes_json`),
                `sources_json` = VALUES(`sources_json`),
                `cast_json` = VALUES(`cast_json`),
                `status` = VALUES(`status`),
                `updated_at` = CURRENT_TIMESTAMP
            ");

            $stmt->execute([
                ':id' => $id,
                ':type' => $type,
                ':title' => $title,
                ':tagline' => $tagline,
                ':rating' => $rating,
                ':duration' => $duration,
                ':year' => $year,
                ':content_rating' => $contentRating,
                ':genres' => $genres,
                ':poster_url' => $posterUrl,
                ':backdrop_url' => $backdropUrl,
                ':stream_url' => $streamUrl,
                ':backup_stream_url' => $backupStreamUrl,
                ':description' => $description,
                ':director' => $director,
                ':writers' => $writers,
                ':production' => $production,
                ':channel_number' => $channelNumber,
                ':channel_category' => $channelCategory,
                ':current_program' => $currentProgram,
                ':epg_id' => $epgId,
                ':seasons' => $seasons,
                ':episodes' => $episodes,
                ':episodes_json' => $episodesJson,
                ':sources_json' => $sourcesJson,
                ':cast_json' => $castJson,
                ':status' => $status
            ]);

            sendResponse([
                'success' => true,
                'message' => 'Conteudo salvo com sucesso!',
                'id' => $id
            ]);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'message' => 'Erro ao salvar conteudo: ' . $e->getMessage()], 500);
        }
        break;

    default:
        sendResponse(['success' => false, 'message' => 'Metodo HTTP nao permitido.'], 405);
}

