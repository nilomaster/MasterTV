<?php
// Secure PDO MySQL Connection Module
// Strictly ASCII comments only

ini_set('display_errors', '0');
error_reporting(0);

$db_host = 'iptv_db.mysql.dbaas.com.br';
$db_user = 'iptv_db';
$db_pass = 'Senha2026!@#';
$db_name = 'iptv_db';

try {
    $pdo = new PDO("mysql:host={$db_host};dbname={$db_name};charset=utf8mb4", $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    // Fail safely without exposing database credentials
    $pdo = null;
}

