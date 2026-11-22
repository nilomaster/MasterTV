-- MasterTV P0 Security Non-Destructive Migration
-- Creates the admin_sessions table for signed staff session tokens (Master Admin & Reseller)
-- Safe to run multiple times (CREATE TABLE IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS `admin_sessions` (
    `token_hash` CHAR(64) NOT NULL PRIMARY KEY,
    `user_id` INT NOT NULL,
    `username` VARCHAR(120) NOT NULL,
    `role` ENUM('admin', 'reseller') NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_admin_sessions_expires` (`expires_at`),
    INDEX `idx_admin_sessions_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
