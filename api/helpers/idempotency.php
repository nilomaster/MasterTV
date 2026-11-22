<?php
// Transactional Idempotency Helper for Credit-Consuming Operations
// Strictly ASCII comments only

function ensureIdempotencyTable($pdo) {
    static $checked = false;
    if ($checked || $pdo === null) {
        return;
    }
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `idempotency_keys` (
            `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
            `user_id` INT NOT NULL,
            `operation` VARCHAR(40) NOT NULL,
            `key_hash` CHAR(64) NOT NULL,
            `request_hash` CHAR(64) NOT NULL,
            `target_ref` VARCHAR(120) NULL,
            `status` ENUM('processing', 'completed') NOT NULL DEFAULT 'processing',
            `http_status` INT NULL,
            `response_json` MEDIUMTEXT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            UNIQUE KEY `uniq_user_key` (`user_id`, `key_hash`),
            INDEX `idx_idem_user_op` (`user_id`, `operation`),
            INDEX `idx_idem_created` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
        $checked = true;
    } catch (Exception $e) {
        // Table may already exist via migration 002_create_idempotency_keys.sql
        $checked = true;
    }
}

function extractIdempotencyKey($data = null) {
    $raw = '';
    if (!empty($_SERVER['HTTP_X_IDEMPOTENCY_KEY'])) {
        $raw = trim((string)$_SERVER['HTTP_X_IDEMPOTENCY_KEY']);
    } elseif (function_exists('getallheaders')) {
        $headers = getallheaders();
        if (is_array($headers)) {
            foreach ($headers as $k => $v) {
                if (strtolower($k) === 'x-idempotency-key') {
                    $raw = trim((string)$v);
                    break;
                }
            }
        }
    }

    if ($raw === '' && is_array($data) && isset($data['idempotency_key'])) {
        $raw = trim((string)$data['idempotency_key']);
    }

    if ($raw === '') {
        return null;
    }

    // Validate key length and printable ASCII characters
    if (strlen($raw) < 8 || strlen($raw) > 128 || !preg_match('/^[A-Za-z0-9._:-]+$/', $raw)) {
        sendResponse([
            'success' => false,
            'code' => 'INVALID_IDEMPOTENCY_KEY',
            'message' => 'Chave de idempotencia invalida. Use entre 8 e 128 caracteres alfanumericos.',
        ], 400);
    }

    return $raw;
}

function buildIdempotencyRequestHash($operation, array $params) {
    ksort($params);
    $canonical = json_encode([
        'operation' => (string)$operation,
        'params' => $params,
    ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    return hash('sha256', (string)$canonical);
}

// Claims an idempotency key inside an active transaction.
// Returns ['state' => 'claimed', 'id' => int] when this request owns execution.
// On duplicate key, rolls back the current transaction and either:
//   - replays the committed response (same operation & request_hash), OR
//   - responds 409 Conflict (key reused for different operation/params or still processing).
function claimIdempotencyKey($pdo, $userId, $operation, $rawKey, $requestHash, $targetRef = null) {
    $keyHash = hash('sha256', $rawKey);

    try {
        $ins = $pdo->prepare(
            "INSERT INTO `idempotency_keys` (`user_id`, `operation`, `key_hash`, `request_hash`, `target_ref`, `status`)
             VALUES (:uid, :op, :kh, :rh, :tref, 'processing')"
        );
        $ins->execute([
            ':uid' => (int)$userId,
            ':op' => (string)$operation,
            ':kh' => $keyHash,
            ':rh' => $requestHash,
            ':tref' => $targetRef !== null ? substr((string)$targetRef, 0, 120) : null,
        ]);

        return [
            'state' => 'claimed',
            'id' => (int)$pdo->lastInsertId(),
        ];
    } catch (PDOException $e) {
        $sqlState = (string)$e->getCode();
        $driverCode = isset($e->errorInfo[1]) ? (int)$e->errorInfo[1] : 0;

        if ($sqlState !== '23000' && $driverCode !== 1062) {
            throw $e;
        }

        // Duplicate key: rollback our open transaction so we read fresh committed state
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }

        $sel = $pdo->prepare(
            "SELECT `operation`, `request_hash`, `status`, `http_status`, `response_json`
             FROM `idempotency_keys`
             WHERE `user_id` = :uid AND `key_hash` = :kh
             LIMIT 1"
        );
        $sel->execute([
            ':uid' => (int)$userId,
            ':kh' => $keyHash,
        ]);
        $existing = $sel->fetch();

        if (!$existing) {
            // Previous concurrent transaction rolled back; caller can safely retry
            sendResponse([
                'success' => false,
                'code' => 'IDEMPOTENCY_RETRY',
                'message' => 'Operacao concorrente nao concluida. Tente novamente.',
            ], 409);
        }

        if ($existing['operation'] !== (string)$operation || !hash_equals($existing['request_hash'], $requestHash)) {
            sendResponse([
                'success' => false,
                'code' => 'IDEMPOTENCY_CONFLICT',
                'message' => 'Chave de idempotencia ja utilizada para outra operacao ou parametros diferentes.',
            ], 409);
        }

        if ($existing['status'] === 'completed' && !empty($existing['response_json'])) {
            $statusCode = (int)($existing['http_status'] ?: 200);
            $decoded = json_decode($existing['response_json'], true);
            if (is_array($decoded)) {
                $decoded['idempotent_replay'] = true;
                sendResponse($decoded, $statusCode);
            }
            http_response_code($statusCode);
            header('Content-Type: application/json; charset=UTF-8');
            echo $existing['response_json'];
            exit;
        }

        sendResponse([
            'success' => false,
            'code' => 'IDEMPOTENCY_IN_PROGRESS',
            'message' => 'Esta operacao ainda esta em processamento. Aguarde alguns segundos.',
        ], 409);
    }
}

function completeIdempotencyKey($pdo, $idempotencyRowId, $httpStatus, array $responsePayload) {
    if (!$idempotencyRowId) {
        return;
    }
    $encoded = json_encode($responsePayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    $upd = $pdo->prepare(
        "UPDATE `idempotency_keys`
         SET `status` = 'completed', `http_status` = :code, `response_json` = :resp
         WHERE `id` = :id"
    );
    $upd->execute([
        ':code' => (int)$httpStatus,
        ':resp' => $encoded,
        ':id' => (int)$idempotencyRowId,
    ]);
}
