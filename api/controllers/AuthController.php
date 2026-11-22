<?php
// Authentication Controller for Clients, Resellers and Master Admins
// Issues database-backed session tokens for administrative staff; zero hardcoded passwords
// Strictly ASCII comments only

class AuthController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function handleLogin() {
        $method = $_SERVER['REQUEST_METHOD'] ?? 'POST';

        // Verify active admin/reseller session token
        if ($method === 'GET' && isset($_GET['action']) && $_GET['action'] === 'me') {
            $staff = getAuthenticatedStaff($this->pdo);
            if (!$staff) {
                sendResponse(['success' => false, 'message' => 'Sessao administrativa invalida ou expirada.'], 401);
            }
            sendResponse([
                'success' => true,
                'user' => [
                    'id' => $staff['user_id'],
                    'username' => $staff['username'],
                    'name' => $staff['name'],
                    'role' => $staff['role'],
                    'credits' => $staff['credits'],
                ],
            ]);
        }

        if ($method !== 'POST') {
            sendResponse(['success' => false, 'message' => 'Metodo nao permitido.'], 405);
        }

        $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

        // Explicit admin logout (revokes token in admin_sessions)
        if (isset($input['action']) && $input['action'] === 'logout') {
            $rawToken = extractRequestAuthToken();
            revokeAdminSessionToken($this->pdo, $rawToken);
            sendResponse(['success' => true, 'message' => 'Sessao encerrada com sucesso.']);
        }

        $username = trim($input['username'] ?? '');
        $password = trim($input['password'] ?? '');
        $requireStaffOnly = !empty($input['admin_only']);

        if (empty($username) || empty($password)) {
            sendResponse(['success' => false, 'message' => 'Informe usuario e senha.'], 400);
        }

        if ($this->pdo === null) {
            sendResponse(['success' => false, 'message' => 'Servidor de banco de dados offline.'], 503);
        }

        // 1. Check Master Admin or Resellers in `users` table (strict password verification)
        try {
            $stmtUser = $this->pdo->prepare("SELECT * FROM `users` WHERE `username` = :u LIMIT 1");
            $stmtUser->execute([':u' => $username]);
            $user = $stmtUser->fetch();

            if ($user) {
                $storedHash = (string)($user['password_hash'] ?? '');
                $validPass = false;

                if ($storedHash !== '' && password_verify($password, $storedHash)) {
                    $validPass = true;
                } elseif ($storedHash !== '' && hash_equals($storedHash, $password)) {
                    // Legacy plaintext row: accept once and transparently upgrade to bcrypt
                    $validPass = true;
                    try {
                        $newHash = password_hash($password, PASSWORD_BCRYPT);
                        $up = $this->pdo->prepare("UPDATE `users` SET `password_hash` = :h WHERE `id` = :id");
                        $up->execute([':h' => $newHash, ':id' => (int)$user['id']]);
                    } catch (Exception $e) {
                        // Ignore hash upgrade failure
                    }
                }

                if ($validPass) {
                    if (($user['status'] ?? 'active') === 'blocked') {
                        sendResponse(['success' => false, 'message' => 'Usuario administrativo bloqueado.'], 403);
                    }

                    $role = ($user['role'] === 'admin') ? 'admin' : 'reseller';
                    $session = createAdminSessionToken($this->pdo, (int)$user['id'], $user['username'], $role);

                    sendResponse([
                        'success' => true,
                        'role' => $role,
                        'admin_token' => $session ? $session['token'] : null,
                        'token_expires_at' => $session ? $session['expires_at'] : null,
                        'message' => 'Autenticacao administrativa realizada com sucesso.',
                        'user' => [
                            'id' => (int)$user['id'],
                            'username' => $user['username'],
                            'name' => $user['name'],
                            'role' => $role,
                            'credits' => (int)($user['credits'] ?? 0),
                        ],
                        'client' => [
                            'id' => (int)$user['id'],
                            'username' => $user['username'],
                            'customer_name' => $user['name'] . ($role === 'admin' ? ' (Admin)' : ' (Revendedor)'),
                            'status' => 'active',
                            'plan_duration' => '365d',
                            'max_screens' => 99,
                            'expires_at' => date('Y-m-d H:i:s', strtotime('+10 years')),
                        ],
                    ]);
                }

                if ($requireStaffOnly) {
                    sendResponse(['success' => false, 'message' => 'Usuario ou senha administrativos incorretos.'], 401);
                }
            } elseif ($requireStaffOnly) {
                sendResponse(['success' => false, 'message' => 'Usuario ou senha administrativos incorretos.'], 401);
            }
        } catch (Exception $e) {
            if ($requireStaffOnly) {
                sendResponse(['success' => false, 'message' => 'Erro ao validar credenciais administrativas.'], 500);
            }
        }

        // 2. Check Client in `clients` table (for public player login)
        try {
            $stmtClient = $this->pdo->prepare("SELECT * FROM `clients` WHERE `username` = :u LIMIT 1");
            $stmtClient->execute([':u' => $username]);
            $client = $stmtClient->fetch();

            if (!$client || !hash_equals((string)$client['password'], $password)) {
                sendResponse(['success' => false, 'message' => 'Usuario ou senha incorretos.'], 401);
            }

            if ($client['status'] === 'blocked') {
                sendResponse(['success' => false, 'message' => 'Sua linha foi suspensa pelo suporte.'], 403);
            }

            $now = new DateTime();
            $expires = new DateTime($client['expires_at']);
            if ($expires < $now) {
                $up = $this->pdo->prepare("UPDATE `clients` SET `status` = 'expired' WHERE `id` = :id");
                $up->execute([':id' => $client['id']]);
                sendResponse(['success' => false, 'message' => 'Sua assinatura venceu. Entre em contato para renovar.'], 403);
            }

            // Update last connected metadata
            $ip = $_SERVER['REMOTE_ADDR'] ?? '';
            $upConn = $this->pdo->prepare("UPDATE `clients` SET `last_connected_at` = NOW(), `last_ip_address` = :ip WHERE `id` = :id");
            $upConn->execute([':ip' => $ip, ':id' => $client['id']]);

            sendResponse([
                'success' => true,
                'role' => 'client',
                'message' => 'Login realizado com sucesso.',
                'client' => [
                    'id' => (int)$client['id'],
                    'username' => $client['username'],
                    'customer_name' => $client['customer_name'],
                    'status' => $client['status'],
                    'plan_duration' => $client['plan_duration'],
                    'max_screens' => (int)($client['max_screens'] ?? 1),
                    'expires_at' => $client['expires_at'],
                ],
            ]);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'message' => 'Erro interno no servidor de autenticacao.'], 500);
        }
    }
}
