<?php
// MasterTV Auth Route Endpoint
// Strictly ASCII comments only

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../controllers/AuthController.php';

$controller = new AuthController($pdo);
$controller->handleLogin();

