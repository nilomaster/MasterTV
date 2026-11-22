<?php
// MasterTV User Favorites Route Endpoint
// Strictly ASCII comments only

require_once __DIR__ . '/../config/app.php';
require_once __DIR__ . '/../controllers/FavoritesController.php';

$controller = new FavoritesController($pdo);
$controller->handleRequest();
