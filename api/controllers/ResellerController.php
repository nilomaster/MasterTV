<?php
// Reseller Management Controller (CRUD)
// Strictly ASCII comments only

class ResellerController {
    private $pdo;

    public function __construct($pdo) {
        $this->pdo = $pdo;
    }

    public function handleRequest() {
        if ($this->pdo === null) {
            sendResponse(['success' => false, 'message' => 'Servidor de banco de dados offline.'], 503);
        }

        $method = $_SERVER['REQUEST_METHOD'];

        switch ($method) {
            case 'GET':
                $this->listResellers();
                break;
            case 'POST':
                $this->createReseller();
                break;
            case 'PUT':
                $this->updateReseller();
                break;
            default:
                sendResponse(['success' => false, 'message' => 'Metodo nao suportado.'], 405);
        }
    }

    private function listResellers() {
        try {
            $stmt = $this->pdo->query("SELECT id, name, username, phone, credits, price_per_credit, status, notes, created_at FROM `users` WHERE `role` = 'reseller' ORDER BY id DESC");
            $resellers = $stmt->fetchAll();
            sendResponse(['success' => true, 'resellers' => $resellers]);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'message' => 'Erro ao listar revendedores: ' . $e->getMessage()], 500);
        }
    }

    private function createReseller() {
        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        $name = trim($data['name'] ?? '');
        $username = trim($data['username'] ?? '');
        $password = trim($data['password'] ?? '');
        $credits = (int)($data['credits'] ?? 10);
        $phone = trim($data['phone'] ?? '');

        if (empty($name) || empty($username) || empty($password)) {
            sendResponse(['success' => false, 'message' => 'Nome, usuario e senha sao obrigatorios.'], 400);
        }

        $chk = $this->pdo->prepare("SELECT id FROM `users` WHERE `username` = :u LIMIT 1");
        $chk->execute([':u' => $username]);
        if ($chk->fetch()) {
            sendResponse(['success' => false, 'message' => 'Usuario ja existe.'], 409);
        }

        $hash = password_hash($password, PASSWORD_BCRYPT);

        try {
            $ins = $this->pdo->prepare("INSERT INTO `users` (`role`, `name`, `username`, `password_hash`, `phone`, `credits`, `status`) VALUES ('reseller', :n, :u, :p, :ph, :c, 'active')");
            $ins->execute([
                ':n' => $name,
                ':u' => $username,
                ':p' => $hash,
                ':ph' => $phone,
                ':c' => $credits,
            ]);
            sendResponse(['success' => true, 'message' => 'Revendedor cadastrado com sucesso.']);
        } catch (Exception $e) {
            sendResponse(['success' => false, 'message' => 'Erro ao criar revendedor: ' . $e->getMessage()], 500);
        }
    }

    private function updateReseller() {
        $data = json_decode(file_get_contents('php://input'), true);
        $resellerId = (int)($data['id'] ?? 0);
        $action = $data['action'] ?? '';

        if (!$resellerId) {
            sendResponse(['success' => false, 'message' => 'ID invalido.'], 400);
        }

        try {
            if ($action === 'add_credits') {
                $credits = (int)($data['credits'] ?? 0);
                $stmt = $this->pdo->prepare("UPDATE `users` SET `credits` = `credits` + :c WHERE `id` = :id");
                $stmt->execute([':c' => $credits, ':id' => $resellerId]);

                // Record transaction
                $tx = $this->pdo->prepare("INSERT INTO `credit_transactions` (`reseller_id`, `amount`, `transaction_type`, `description`) VALUES (:r, :a, 'credit_added', 'Injecao manual de creditos pelo Admin')");
                $tx->execute([':r' => $resellerId, ':a' => $credits]);

                sendResponse(['success' => true, 'message' => "Adicionados {$credits} creditos ao revendedor."]);
            } else {
                sendResponse(['success' => false, 'message' => 'Acao invalida.'], 400);
            }
        } catch (Exception $e) {
            sendResponse(['success' => false, 'message' => 'Erro ao atualizar: ' . $e->getMessage()], 500);
        }
    }
}

