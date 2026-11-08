<?php
// MasterTV Content Route Endpoint
// Strictly ASCII comments only

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../controllers/ContentController.php';

$controller = new ContentController($pdo);
$controller->handleRequest();

