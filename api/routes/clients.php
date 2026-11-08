<?php
// MasterTV Clients Route Endpoint
// Strictly ASCII comments only

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../controllers/ClientController.php';

$controller = new ClientController($pdo);
$controller->handleRequest();

