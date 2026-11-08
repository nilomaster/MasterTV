<?php
// MasterTV Unified API Front Controller Gateway
// Strictly ASCII comments only

require_once __DIR__ . '/config/app.php';

$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$pathParts = explode('/', trim($requestUri, '/'));
$endpoint = end($pathParts);
$endpoint = preg_replace('/\.php$/', '', strtolower($endpoint));

switch ($endpoint) {
    case 'auth':
        require_once __DIR__ . '/controllers/AuthController.php';
        $controller = new AuthController($pdo);
        $controller->handleLogin();
        break;

    case 'clients':
        require_once __DIR__ . '/controllers/ClientController.php';
        $controller = new ClientController($pdo);
        $controller->handleRequest();
        break;

    case 'content':
        require_once __DIR__ . '/controllers/ContentController.php';
        $controller = new ContentController($pdo);
        $controller->handleRequest();
        break;

    case 'resellers':
        require_once __DIR__ . '/controllers/ResellerController.php';
        $controller = new ResellerController($pdo);
        $controller->handleRequest();
        break;

    default:
        sendResponse([
            'success' => true,
            'service' => 'MasterTV API Gateway',
            'status' => 'online',
            'version' => '2.0.0',
            'endpoints' => [
                'auth' => '/api/routes/auth.php',
                'clients' => '/api/routes/clients.php',
                'content' => '/api/routes/content.php',
                'resellers' => '/api/routes/resellers.php',
            ]
        ]);
        break;
}

