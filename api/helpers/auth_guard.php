<?php
// MasterTV Administrative Authentication and Role Guard Helper
// Validates signed session tokens in MySQL for Master Admin and Reseller endpoints
// Strictly ASCII comments only

function ensureAdminSessionsTable($pdo) {
    if ($pdo === null) return;
    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS `admin_sessions` (
            `token_hash` CHAR(64) PRIMARY KEY,
            `user_id` INT NOT NULL,
            `username` VARCHAR(120) NOT NULL,
            `role` ENUM('admin', 'reseller') NOT NULL,
            `expires_at` DATETIME NOT NULL,
            `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX `idx_expires` (`expires_at`),
            INDEX `idx_user` (`user_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
    } catch (Exception $e) {
        // Ignore if table already exists
    }
}

function extractRequestAuthToken() {
    $token = '';

    // 1. Custom header fallback (reliable on shared hosting where Apache strips Authorization)
    if (!empty($_SERVER['HTTP_X_ADMIN_TOKEN'])) {
        $token = trim((string)$_SERVER['HTTP_X_ADMIN_TOKEN']);
    }

    // 2. Standard Authorization: Bearer <token>
    if ($token === '') {
        $authHeader = '';
        if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
            $authHeader = (string)$_SERVER['HTTP_AUTHORIZATION'];
        } elseif (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
            $authHeader = (string)$_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        } elseif (function_exists('getallheaders')) {
            $headers = getallheaders();
            foreach ($headers as $k => $v) {
                $lk = strtolower((string)$k);
                if ($lk === 'x-admin-token' && !empty($v)) {
                    $token = trim((string)$v);
                    break;
                }
                if ($lk === 'authorization' && !empty($v)) {
                    $authHeader = (string)$v;
                }
            }
        }

        if ($token === '' && stripos($authHeader, 'Bearer ') === 0) {
            $token = trim(substr($authHeader, 7));
        }
    }

    return $token;
}

function createAdminSessionToken($pdo, $userId, $username, $role) {
    ensureAdminSessionsTable($pdo);
    $rawToken = bin2hex(random_bytes(32));
    $tokenHash = hash('sha256', $rawToken);
    $expiresAt = date('Y-m-d H:i:s', strtotime('+7 days'));

    try {
        // Opportunistic cleanup of expired tokens
        $pdo->exec("DELETE FROM `admin_sessions` WHERE `expires_at` < NOW()");
        $stmt = $pdo->prepare(
            "INSERT INTO `admin_sessions` (`token_hash`, `user_id`, `username`, `role`, `expires_at`) VALUES (:h, :uid, :u, :r, :exp)"
        );
        $stmt->execute([
            ':h' => $tokenHash,
            ':uid' => (int)$userId,
            ':u' => (string)$username,
            ':r' => $role === 'admin' ? 'admin' : 'reseller',
            ':exp' => $expiresAt,
        ]);
    } catch (Exception $e) {
        return null;
    }

    return [
        'token' => $rawToken,
        'expires_at' => $expiresAt,
    ];
}

function revokeAdminSessionToken($pdo, $rawToken) {
    if ($pdo === null || empty($rawToken)) return;
    ensureAdminSessionsTable($pdo);
    try {
        $stmt = $pdo->prepare("DELETE FROM `admin_sessions` WHERE `token_hash` = :h");
        $stmt->execute([':h' => hash('sha256', $rawToken)]);
    } catch (Exception $e) {
        // Ignore cleanup errors
    }
}

function getAuthenticatedStaff($pdo) {
    if ($pdo === null) return null;
    $rawToken = extractRequestAuthToken();
    if ($rawToken === '' || strlen($rawToken) < 32) {
        return null;
    }

    ensureAdminSessionsTable($pdo);

    try {
        $stmt = $pdo->prepare(
            "SELECT s.user_id, s.username, s.role, s.expires_at, u.name, u.credits, u.status
             FROM `admin_sessions` s
             INNER JOIN `users` u ON u.id = s.user_id
             WHERE s.token_hash = :h AND s.expires_at > NOW()
             LIMIT 1"
        );
        $stmt->execute([':h' => hash('sha256', $rawToken)]);
        $row = $stmt->fetch();

        if (!$row) {
            return null;
        }
        if (($row['status'] ?? 'active') === 'blocked') {
            return null;
        }

        return [
            'user_id' => (int)$row['user_id'],
            'username' => (string)$row['username'],
            'name' => (string)($row['name'] ?? $row['username']),
            'role' => $row['role'] === 'admin' ? 'admin' : 'reseller',
            'credits' => (int)($row['credits'] ?? 0),
            'expires_at' => (string)$row['expires_at'],
        ];
    } catch (Exception $e) {
        return null;
    }
}

function requireStaff($pdo) {
    $staff = getAuthenticatedStaff($pdo);
    if ($staff === null) {
        sendResponse([
            'success' => false,
            'code' => 'UNAUTHORIZED',
            'message' => 'Sessao administrativa invalida ou expirada. Faca login novamente.',
        ], 401);
    }
    return $staff;
}

function requireMasterAdmin($pdo) {
    $staff = requireStaff($pdo);
    if ($staff['role'] !== 'admin') {
        sendResponse([
            'success' => false,
            'code' => 'FORBIDDEN',
            'message' => 'Acesso negado. Operacao exclusiva do Administrador Master.',
        ], 403);
    }
    return $staff;
}
