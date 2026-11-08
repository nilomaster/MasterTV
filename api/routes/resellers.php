<?php
// MasterTV Resellers Route Endpoint
// Strictly ASCII comments only

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../controllers/ResellerController.php';

$controller = new ResellerController($pdo);
$controller->handleRequest();

