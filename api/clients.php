<?php
// MasterTV Client Management REST Endpoint (CRUD)
// Strictly ASCII comments only

require_once __DIR__ . '/config.php';

if ($pdo === null) {
    sendResponse(['success' => false, 'message' => 'Servidor de banco de dados offline.'], 503);
}

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        try {
            $stmt = $pdo->query("SELECT c.*, u.name as reseller_name FROM `clients` c LEFT JOIN `users` u ON c.reseller_id = u.id ORDER BY c.id DESC");
            $clients = $stmt->fetchAll();
            sendResponse(['success' => true, 'clients' => $clients]);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'message' => 'Erro ao listar clientes: ' . $e->getMessage()], 500);
        }
        break;

    case 'POST':
        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $name = trim($data['customer_name'] ?? '');
        $username = trim($data['username'] ?? '');
        $password = trim($data['password'] ?? '');
        $duration = $data['plan_duration'] ?? '30d';
        $resellerId = !empty($data['reseller_id']) ? (int)$data['reseller_id'] : null;
        $notes = trim($data['notes'] ?? '');

        if (empty($name) || empty($username) || empty($password)) {
            sendResponse(['success' => false, 'message' => 'Nome, usuario e senha sao obrigatorios.'], 400);
        }

        // Check unique username
        $chk = $pdo->prepare("SELECT id FROM `clients` WHERE `username` = :u LIMIT 1");
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
        $status = in_array($duration, ['1h', '2h', '4h', '24h']) ? 'trial' : 'active';

        try {
            $ins = $pdo->prepare("INSERT INTO `clients` (`reseller_id`, `customer_name`, `customer_phone`, `username`, `password`, `plan_duration`, `status`, `expires_at`, `notes`) VALUES (:r, :n, :p, :u, :pass, :d, :s, :e, :notes)");
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
            $newId = (int)$pdo->lastInsertId();

            sendResponse([
                'success' => true,
                'message' => 'Cliente cadastrado com sucesso.',
                'client_id' => $newId,
                'username' => $username,
                'password' => $password,
                'expires_at' => $expiresAt,
            ]);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'message' => 'Erro ao salvar cliente: ' . $e->getMessage()], 500);
        }
        break;

    case 'PUT':
        $data = json_decode(file_get_contents('php://input'), true);
        $clientId = (int)($data['id'] ?? 0);
        $action = $data['action'] ?? '';

        if (!$clientId) {
            sendResponse(['success' => false, 'message' => 'ID do cliente invalido.'], 400);
        }

        try {
            if ($action === 'renew') {
                $days = (int)($data['days'] ?? 30);
                $stmt = $pdo->prepare("UPDATE `clients` SET `expires_at` = DATE_ADD(GREATEST(`expires_at`, NOW()), INTERVAL :days DAY), `status` = 'active' WHERE `id` = :id");
                $stmt->execute([':days' => $days, ':id' => $clientId]);
                sendResponse(['success' => true, 'message' => "Cliente renovado por +{$days} dias."]);
            } elseif ($action === 'toggle_status') {
                $status = $data['status'] ?? 'active';
                $stmt = $pdo->prepare("UPDATE `clients` SET `status` = :s WHERE `id` = :id");
                $stmt->execute([':s' => $status, ':id' => $clientId]);
                sendResponse(['success' => true, 'message' => "Status atualizado para {$status}."]);
            } else {
                sendResponse(['success' => false, 'message' => 'Acao nao reconhecida.'], 400);
            }
        } catch (Exception $e) {
            sendResponse(['success' => false, 'message' => 'Erro ao atualizar: ' . $e->getMessage()], 500);
        }
        break;

    case 'DELETE':
        $data = json_decode(file_get_contents('php://input'), true);
        $clientId = (int)($data['id'] ?? $_GET['id'] ?? 0);

        if (!$clientId) {
            sendResponse(['success' => false, 'message' => 'ID invalido.'], 400);
        }

        try {
            $stmt = $pdo->prepare("DELETE FROM `clients` WHERE `id` = :id");
            $stmt->execute([':id' => $clientId]);
            sendResponse(['success' => true, 'message' => 'Cliente excluido com sucesso.']);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'message' => 'Erro ao excluir: ' . $e->getMessage()], 500);
        }
        break;

    default:
        sendResponse(['success' => false, 'message' => 'Metodo nao suportado.'], 405);
}

