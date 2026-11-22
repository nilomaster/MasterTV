<?php
// Client Management Controller (CRUD) with Server-Side Staff Auth & Reseller Isolation
// Strictly ASCII comments only

class ClientController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function handleRequest() {
        if ($this->pdo === null) {
            sendResponse(['success' => false, 'message' => 'Servidor de banco de dados offline.'], 503);
        }

        // All client management operations require authenticated Admin Master or Reseller
        $staff = requireStaff($this->pdo);
        $method = $_SERVER['REQUEST_METHOD'];

        switch ($method) {
            case 'GET':
                $this->listClients($staff);
                break;
            case 'POST':
                $this->createClient($staff);
                break;
            case 'PUT':
                $this->updateClient($staff);
                break;
            case 'DELETE':
                $this->deleteClient($staff);
                break;
            default:
                sendResponse(['success' => false, 'message' => 'Metodo nao suportado.'], 405);
        }
    }

    private function listClients($staff) {
        try {
            if ($staff['role'] === 'reseller') {
                // Strict server-side reseller data isolation
                $stmt = $this->pdo->prepare(
                    "SELECT c.*, u.name as reseller_name
                     FROM `clients` c
                     LEFT JOIN `users` u ON c.reseller_id = u.id
                     WHERE c.reseller_id = :rid
                     ORDER BY c.id DESC"
                );
                $stmt->execute([':rid' => $staff['user_id']]);
            } else {
                $stmt = $this->pdo->query(
                    "SELECT c.*, u.name as reseller_name
                     FROM `clients` c
                     LEFT JOIN `users` u ON c.reseller_id = u.id
                     ORDER BY c.id DESC"
                );
            }
            $clients = $stmt->fetchAll();
            sendResponse(['success' => true, 'clients' => $clients]);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'message' => 'Erro ao listar clientes: ' . $e->getMessage()], 500);
        }
    }

    private function createClient($staff) {
        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $name = trim($data['customer_name'] ?? '');
        $username = trim($data['username'] ?? '');
        $password = trim($data['password'] ?? '');
        $duration = $data['plan_duration'] ?? '30d';
        $notes = trim($data['notes'] ?? '');

        // Prevent reseller ID spoofing: resellers can only create clients under their own user_id
        $resellerId = $staff['role'] === 'reseller'
            ? $staff['user_id']
            : (!empty($data['reseller_id']) ? (int)$data['reseller_id'] : null);

        if (empty($name) || empty($username) || empty($password)) {
            sendResponse(['success' => false, 'message' => 'Nome, usuario e senha sao obrigatorios.'], 400);
        }

        $isTrial = in_array($duration, ['1h', '2h', '4h', '24h'], true);

        // Enforce server-side credit balance for non-trial reseller activations
        if ($staff['role'] === 'reseller' && !$isTrial) {
            if ($staff['credits'] < 1) {
                sendResponse(['success' => false, 'message' => 'Saldo de creditos insuficiente para ativar este cliente.'], 402);
            }
        }

        // Check unique username
        $chk = $this->pdo->prepare("SELECT id FROM `clients` WHERE `username` = :u LIMIT 1");
        $chk->execute([':u' => $username]);
        if ($chk->fetch()) {
            sendResponse(['success' => false, 'message' => 'Este nome de usuario ja esta em uso.'], 409);
        }

        // Calculate expires_at
        $now = new DateTime();
        switch ($duration) {
            case '1h':  $now->modify('+1 hour'); break;
            case '2h':  $now->modify('+2 hours'); break;
            case '4h':  $now->modify('+4 hours'); break;
            case '24h': $now->modify('+1 day'); break;
            case '30d': $now->modify('+30 days'); break;
            case '90d': $now->modify('+90 days'); break;
            case '180d': $now->modify('+180 days'); break;
            case '365d': $now->modify('+365 days'); break;
            default: $now->modify('+30 days');
        }
        $expiresAt = $now->format('Y-m-d H:i:s');
        $status = $isTrial ? 'trial' : 'active';

        try {
            $this->pdo->beginTransaction();

            if ($staff['role'] === 'reseller' && !$isTrial) {
                $deb = $this->pdo->prepare("UPDATE `users` SET `credits` = `credits` - 1 WHERE `id` = :id AND `credits` >= 1");
                $deb->execute([':id' => $staff['user_id']]);
                if ($deb->rowCount() < 1) {
                    $this->pdo->rollBack();
                    sendResponse(['success' => false, 'message' => 'Saldo de creditos insuficiente.'], 402);
                }
                try {
                    $tx = $this->pdo->prepare("INSERT INTO `credit_transactions` (`reseller_id`, `amount`, `transaction_type`, `description`) VALUES (:r, -1, 'client_created', :d)");
                    $tx->execute([':r' => $staff['user_id'], ':d' => "Ativacao de cliente: {$name}"]);
                } catch (Exception $e) {
                    // Ignore optional transaction log table error
                }
            }

            $ins = $this->pdo->prepare("INSERT INTO `clients` (`reseller_id`, `customer_name`, `customer_phone`, `username`, `password`, `plan_duration`, `status`, `expires_at`, `notes`) VALUES (:r, :n, :p, :u, :pass, :d, :s, :e, :notes)");
            $ins->execute([
                ':r' => $resellerId,
                ':n' => $name,
                ':p' => $data['customer_phone'] ?? null,
                ':u' => $username,
                ':pass' => $password,
                ':d' => $duration,
                ':s' => $status,
                ':e' => $expiresAt,
                ':notes' => $notes,
            ]);
            $newId = (int)$this->pdo->lastInsertId();
            $this->pdo->commit();

            sendResponse([
                'success' => true,
                'message' => 'Cliente cadastrado com sucesso.',
                'client_id' => $newId,
                'username' => $username,
                'password' => $password,
                'expires_at' => $expiresAt,
            ]);
        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            sendResponse(['success' => false, 'message' => 'Erro ao salvar cliente: ' . $e->getMessage()], 500);
        }
    }

    private function assertClientOwnership($clientId, $staff) {
        if ($staff['role'] === 'admin') return;
        $chk = $this->pdo->prepare("SELECT id FROM `clients` WHERE `id` = :id AND `reseller_id` = :rid LIMIT 1");
        $chk->execute([':id' => $clientId, ':rid' => $staff['user_id']]);
        if (!$chk->fetch()) {
            sendResponse(['success' => false, 'code' => 'FORBIDDEN', 'message' => 'Acesso negado a este cliente.'], 403);
        }
    }

    private function updateClient($staff) {
        $data = json_decode(file_get_contents('php://input'), true);
        $clientId = (int)($data['id'] ?? 0);
        $action = $data['action'] ?? '';

        if (!$clientId) {
            sendResponse(['success' => false, 'message' => 'ID do cliente invalido.'], 400);
        }

        // Prevent ID tampering by resellers
        $this->assertClientOwnership($clientId, $staff);

        try {
            if ($action === 'renew') {
                $days = (int)($data['days'] ?? 30);
                if ($days <= 0) $days = 30;

                $this->pdo->beginTransaction();

                if ($staff['role'] === 'reseller') {
                    // Atomic server-side credit check and deduction (prevents negative balance under concurrency)
                    $deb = $this->pdo->prepare("UPDATE `users` SET `credits` = `credits` - 1 WHERE `id` = :id AND `credits` >= 1");
                    $deb->execute([':id' => $staff['user_id']]);
                    if ($deb->rowCount() < 1) {
                        $this->pdo->rollBack();
                        sendResponse(['success' => false, 'message' => 'Saldo de creditos insuficiente para renovar.'], 402);
                    }
                    try {
                        $tx = $this->pdo->prepare("INSERT INTO `credit_transactions` (`reseller_id`, `amount`, `transaction_type`, `description`) VALUES (:r, -1, 'client_renewed', :d)");
                        $tx->execute([':r' => $staff['user_id'], ':d' => "Renovacao de cliente #{$clientId} (+{$days}d)"]);
                    } catch (Exception $e) {
                        // Ignore optional transaction log table error
                    }
                }

                $stmt = $this->pdo->prepare("UPDATE `clients` SET `expires_at` = DATE_ADD(GREATEST(`expires_at`, NOW()), INTERVAL :days DAY), `status` = 'active' WHERE `id` = :id");
                $stmt->execute([':days' => $days, ':id' => $clientId]);
                $this->pdo->commit();

                sendResponse(['success' => true, 'message' => "Assinatura renovada por {$days} dias."]);
            }

            if ($action === 'toggle_status') {
                $status = ($data['status'] ?? '') === 'active' ? 'active' : 'blocked';
                $stmt = $this->pdo->prepare("UPDATE `clients` SET `status` = :s WHERE `id` = :id");
                $stmt->execute([':s' => $status, ':id' => $clientId]);
                sendResponse(['success' => true, 'message' => "Status alterado para {$status}."]);
            }

            if ($action === 'edit') {
                $stmt = $this->pdo->prepare("UPDATE `clients` SET `customer_name` = :n, `customer_phone` = :p, `password` = :pass, `notes` = :notes WHERE `id` = :id");
                $stmt->execute([
                    ':n' => trim($data['customer_name'] ?? ''),
                    ':p' => trim($data['customer_phone'] ?? ''),
                    ':pass' => trim($data['password'] ?? ''),
                    ':notes' => trim($data['notes'] ?? ''),
                    ':id' => $clientId,
                ]);
                sendResponse(['success' => true, 'message' => 'Dados do cliente atualizados com sucesso.']);
            }

            sendResponse(['success' => false, 'message' => 'Acao invalida.'], 400);
        } catch (Exception $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            sendResponse(['success' => false, 'message' => 'Erro ao atualizar: ' . $e->getMessage()], 500);
        }
    }

    private function deleteClient($staff) {
        $data = json_decode(file_get_contents('php://input'), true) ?? $_GET;
        $clientId = (int)($data['id'] ?? 0);

        if (!$clientId) {
            sendResponse(['success' => false, 'message' => 'ID do cliente obrigatorio.'], 400);
        }

        // Prevent ID tampering by resellers
        $this->assertClientOwnership($clientId, $staff);

        try {
            if ($staff['role'] === 'reseller') {
                $stmt = $this->pdo->prepare("DELETE FROM `clients` WHERE `id` = :id AND `reseller_id` = :rid");
                $stmt->execute([':id' => $clientId, ':rid' => $staff['user_id']]);
            } else {
                $stmt = $this->pdo->prepare("DELETE FROM `clients` WHERE `id` = :id");
                $stmt->execute([':id' => $clientId]);
            }
            sendResponse(['success' => true, 'message' => 'Cliente excluido com sucesso.']);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'message' => 'Erro ao excluir cliente: ' . $e->getMessage()], 500);
        }
    }
}
