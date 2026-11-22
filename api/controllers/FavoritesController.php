<?php
// MasterTV User Favorites Sync Controller (MySQL PDO)
// Syncs per-user favorite channels/items across Web Desktop and Android APK
// Strictly ASCII comments only

class FavoritesController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
        $this->ensureTableExists();
    }

    private function ensureTableExists() {
        try {
            $sql = "CREATE TABLE IF NOT EXISTS user_favorites (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(120) NOT NULL,
                item_id VARCHAR(191) NOT NULL,
                item_type VARCHAR(32) NOT NULL DEFAULT 'channel',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uniq_user_item (username, item_id, item_type),
                KEY idx_user_type (username, item_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4";
            $this->pdo->exec($sql);
        } catch (Exception $e) {
            // Table creation error will surface on query if DB permissions disallow DDL
        }
    }

    private function sanitizeUsername($raw) {
        $clean = trim((string)$raw);
        if (strlen($clean) > 120) {
            $clean = substr($clean, 0, 120);
        }
        return $clean;
    }

    private function sanitizeItemId($raw) {
        $clean = trim((string)$raw);
        if (strlen($clean) > 191) {
            $clean = substr($clean, 0, 191);
        }
        return $clean;
    }

    private function sanitizeItemType($raw) {
        $clean = strtolower(trim((string)$raw));
        $allowed = ['channel', 'movie', 'series', 'anime', 'kids'];
        return in_array($clean, $allowed, true) ? $clean : 'channel';
    }

    private function getFavoritesList($username, $itemType) {
        $stmt = $this->pdo->prepare(
            "SELECT item_id FROM user_favorites WHERE username = :username AND item_type = :item_type ORDER BY created_at DESC"
        );
        $stmt->execute([
            ':username' => $username,
            ':item_type' => $itemType,
        ]);
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
        return is_array($rows) ? array_values(array_map('strval', $rows)) : [];
    }

    public function handleRequest() {
        header('Cache-Control: no-cache, no-store, must-revalidate, max-age=0');
        header('Pragma: no-cache');
        header('Expires: 0');

        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

        if ($method === 'GET') {
            $username = $this->sanitizeUsername($_GET['username'] ?? '');
            $itemType = $this->sanitizeItemType($_GET['item_type'] ?? 'channel');

            if ($username === '') {
                jsonError('Parametro username obrigatorio.', 400);
            }

            try {
                $favorites = $this->getFavoritesList($username, $itemType);
                jsonSuccess(['favorites' => $favorites]);
            } catch (Exception $e) {
                jsonError('Erro ao carregar favoritos do usuario.', 500);
            }
        }

        if ($method === 'POST') {
            $rawBody = file_get_contents('php://input');
            $input = json_decode($rawBody, true);
            if (!is_array($input)) {
                $input = $_POST;
            }

            $action = strtolower(trim((string)($input['action'] ?? 'toggle')));
            $username = $this->sanitizeUsername($input['username'] ?? '');
            $itemType = $this->sanitizeItemType($input['item_type'] ?? 'channel');

            if ($username === '') {
                jsonError('Usuario nao informado.', 400);
            }

            try {
                if ($action === 'toggle') {
                    $itemId = $this->sanitizeItemId($input['item_id'] ?? '');
                    if ($itemId === '') {
                        jsonError('Identificador do item obrigatorio.', 400);
                    }

                    $hasDesired = array_key_exists('desired_state', $input);
                    $desiredState = $hasDesired ? (bool)$input['desired_state'] : null;

                    $checkStmt = $this->pdo->prepare(
                        "SELECT id FROM user_favorites WHERE username = :username AND item_id = :item_id AND item_type = :item_type LIMIT 1"
                    );
                    $checkStmt->execute([
                        ':username' => $username,
                        ':item_id' => $itemId,
                        ':item_type' => $itemType,
                    ]);
                    $exists = (bool)$checkStmt->fetchColumn();

                    $shouldBeFavorite = $hasDesired ? $desiredState : !$exists;

                    if ($shouldBeFavorite && !$exists) {
                        $insStmt = $this->pdo->prepare(
                            "INSERT IGNORE INTO user_favorites (username, item_id, item_type) VALUES (:username, :item_id, :item_type)"
                        );
                        $insStmt->execute([
                            ':username' => $username,
                            ':item_id' => $itemId,
                            ':item_type' => $itemType,
                        ]);
                    } elseif (!$shouldBeFavorite && $exists) {
                        $delStmt = $this->pdo->prepare(
                            "DELETE FROM user_favorites WHERE username = :username AND item_id = :item_id AND item_type = :item_type"
                        );
                        $delStmt->execute([
                            ':username' => $username,
                            ':item_id' => $itemId,
                            ':item_type' => $itemType,
                        ]);
                    }

                    $favorites = $this->getFavoritesList($username, $itemType);
                    jsonSuccess([
                        'isFavorite' => $shouldBeFavorite,
                        'favorites' => $favorites,
                    ]);
                }

                jsonError('Acao invalida.', 400);
            } catch (Exception $e) {
                jsonError('Erro ao salvar favorito no banco de dados.', 500);
            }
        }

        jsonError('Metodo HTTP nao suportado.', 405);
    }
}
