<?php
// Content, VOD and Channel Controller (CRUD)
// Strictly ASCII comments only

class ContentController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->initSchema();
    }

    private function initSchema() {
        if ($this->pdo === null) return;
        try {
            $this->pdo->exec("CREATE TABLE IF NOT EXISTS `contents` (
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
        } catch (Exception $e) {
            // Table already exists
        }
    }

    public function handleRequest() {
        if ($this->pdo === null) {
            sendResponse(['success' => false, 'message' => 'Servidor de banco de dados offline.'], 503);
        }

        $method = $_SERVER['REQUEST_METHOD'];

        switch ($method) {
            case 'GET':
                $this->listContents();
                break;
            case 'POST':
                $this->handlePost();
                break;
            default:
                sendResponse(['success' => false, 'message' => 'Metodo nao permitido.'], 405);
        }
    }

    private function listContents() {
        try {
            $type = isset($_GET['type']) ? trim($_GET['type']) : null;
            if ($type) {
                $stmt = $this->pdo->prepare("SELECT * FROM `contents` WHERE `type` = :t AND `status` = 'active' ORDER BY `created_at` DESC");
                $stmt->execute([':t' => $type]);
            } else {
                $stmt = $this->pdo->query("SELECT * FROM `contents` ORDER BY `created_at` DESC");
            }
            $items = $stmt->fetchAll();

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
    }

    private function handlePost() {
        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $action = trim($data['action'] ?? 'create');

        if ($action === 'delete') {
            $id = trim($data['id'] ?? '');
            if (empty($id)) {
                sendResponse(['success' => false, 'message' => 'ID do conteudo obrigatorio.'], 400);
            }
            try {
                $stmt = $this->pdo->prepare("DELETE FROM `contents` WHERE `id` = :id");
                $stmt->execute([':id' => $id]);
                sendResponse(['success' => true, 'message' => 'Conteudo excluido com sucesso.']);
            } catch (Exception $e) {
                sendResponse(['success' => false, 'message' => 'Erro ao excluir conteudo: ' . $e->getMessage()], 500);
            }
        }

        // Create or update content
        $id = trim($data['id'] ?? '');
        if (empty($id)) {
            $id = 'content_' . time() . '_' . bin2hex(random_bytes(4));
        }

        $type = in_array($data['type'] ?? '', ['movie', 'series', 'channel', 'anime', 'dorama']) ? $data['type'] : 'movie';
        $title = trim($data['title'] ?? '');
        if (empty($title)) {
            sendResponse(['success' => false, 'message' => 'O titulo e obrigatorio.'], 400);
        }

        $streamUrl = trim($data['stream_url'] ?? '');
        if (empty($streamUrl)) {
            sendResponse(['success' => false, 'message' => 'A URL de transmissao e obrigatoria.'], 400);
        }

        $episodesJson = isset($data['episodes_list']) ? json_encode($data['episodes_list'], JSON_UNESCAPED_UNICODE) : null;
        $sourcesJson = isset($data['sources_list']) ? json_encode($data['sources_list'], JSON_UNESCAPED_UNICODE) : null;
        $castJson = isset($data['cast']) ? json_encode($data['cast'], JSON_UNESCAPED_UNICODE) : null;

        try {
            $sql = "INSERT INTO `contents` (
                `id`, `type`, `title`, `tagline`, `rating`, `duration`, `year`, `content_rating`,
                `genres`, `poster_url`, `backdrop_url`, `stream_url`, `backup_stream_url`,
                `description`, `director`, `writers`, `production`, `channel_number`,
                `channel_category`, `current_program`, `epg_id`, `seasons`, `episodes`,
                `episodes_json`, `sources_json`, `cast_json`, `status`
            ) VALUES (
                :id, :type, :title, :tagline, :rating, :duration, :year, :content_rating,
                :genres, :poster_url, :backdrop_url, :stream_url, :backup_stream_url,
                :description, :director, :writers, :production, :channel_number,
                :channel_category, :current_program, :epg_id, :seasons, :episodes,
                :episodes_json, :sources_json, :cast_json, :status
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
                `status` = VALUES(`status`)";

            $stmt = $this->pdo->prepare($sql);
            $stmt->execute([
                ':id' => $id,
                ':type' => $type,
                ':title' => $title,
                ':tagline' => trim($data['tagline'] ?? ''),
                ':rating' => (float)($data['rating'] ?? 8.0),
                ':duration' => trim($data['duration'] ?? ''),
                ':year' => (int)($data['year'] ?? 2026),
                ':content_rating' => trim($data['content_rating'] ?? '14'),
                ':genres' => is_array($data['genres'] ?? null) ? implode(', ', $data['genres']) : trim($data['genres'] ?? 'Geral'),
                ':poster_url' => trim($data['poster_url'] ?? ''),
                ':backdrop_url' => trim($data['backdrop_url'] ?? ''),
                ':stream_url' => $streamUrl,
                ':backup_stream_url' => trim($data['backup_stream_url'] ?? ''),
                ':description' => trim($data['description'] ?? ''),
                ':director' => trim($data['director'] ?? ''),
                ':writers' => trim($data['writers'] ?? ''),
                ':production' => trim($data['production'] ?? ''),
                ':channel_number' => (int)($data['channel_number'] ?? 1),
                ':channel_category' => trim($data['channel_category'] ?? 'aberta'),
                ':current_program' => trim($data['current_program'] ?? ''),
                ':epg_id' => trim($data['epg_id'] ?? ''),
                ':seasons' => (int)($data['seasons'] ?? 1),
                ':episodes' => (int)($data['episodes'] ?? 1),
                ':episodes_json' => $episodesJson,
                ':sources_json' => $sourcesJson,
                ':cast_json' => $castJson,
                ':status' => in_array($data['status'] ?? '', ['active', 'inactive']) ? $data['status'] : 'active',
            ]);

            sendResponse([
                'success' => true,
                'message' => 'Conteudo salvo com sucesso!',
                'id' => $id
            ]);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'message' => 'Erro ao salvar conteudo: ' . $e->getMessage()], 500);
        }
    }
}

