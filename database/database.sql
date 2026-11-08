-- MasterTV IPTV & VOD - Complete Database Schema for MySQL / MariaDB (Locaweb / Hosting)
-- Strictly ASCII comments only

-- 1. Resellers & Admins table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `role` ENUM('admin', 'reseller') NOT NULL DEFAULT 'reseller',
  `name` VARCHAR(120) NOT NULL,
  `username` VARCHAR(60) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(30) NULL,
  `credits` INT NOT NULL DEFAULT 0,
  `price_per_credit` DECIMAL(10,2) NOT NULL DEFAULT 15.00,
  `status` ENUM('active', 'blocked') NOT NULL DEFAULT 'active',
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Client Lines (IPTV subscribers and trials)
CREATE TABLE IF NOT EXISTS `clients` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reseller_id` INT NULL,
  `customer_name` VARCHAR(120) NOT NULL,
  `customer_phone` VARCHAR(30) NULL,
  `username` VARCHAR(60) NOT NULL UNIQUE,
  `password` VARCHAR(60) NOT NULL,
  `plan_duration` ENUM('1h', '2h', '4h', '24h', '30d', '90d', '180d', '365d') NOT NULL DEFAULT '30d',
  `status` ENUM('active', 'trial', 'expired', 'blocked') NOT NULL DEFAULT 'active',
  `max_screens` INT NOT NULL DEFAULT 1,
  `active_screens` INT NOT NULL DEFAULT 0,
  `expires_at` DATETIME NOT NULL,
  `last_connected_at` DATETIME NULL,
  `last_ip_address` VARCHAR(45) NULL,
  `notes` TEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`reseller_id`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  INDEX `idx_username` (`username`),
  INDEX `idx_status` (`status`),
  INDEX `idx_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Credit transactions history
CREATE TABLE IF NOT EXISTS `credit_transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `reseller_id` INT NOT NULL,
  `amount` INT NOT NULL,
  `transaction_type` ENUM('credit_added', 'credit_deducted', 'client_created', 'client_renewed') NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`reseller_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Content catalog (Movies, Series, Live Channels, Animes, Doramas)
CREATE TABLE IF NOT EXISTS `contents` (
  `id` VARCHAR(100) PRIMARY KEY,
  `type` ENUM('movie', 'series', 'channel', 'anime', 'dorama') NOT NULL DEFAULT 'movie',
  `title` VARCHAR(255) NOT NULL,
  `tagline` VARCHAR(255) NULL,
  `rating` DECIMAL(3,1) NOT NULL DEFAULT 8.0,
  `duration` VARCHAR(60) NULL,
  `year` INT NOT NULL DEFAULT 2026,
  `content_rating` VARCHAR(30) DEFAULT '14',
  `genres` VARCHAR(255) DEFAULT 'Geral',
  `poster_url` TEXT NOT NULL,
  `backdrop_url` TEXT NULL,
  `stream_url` TEXT NOT NULL,
  `backup_stream_url` TEXT NULL,
  `description` TEXT NULL,
  `director` VARCHAR(150) NULL,
  `writers` VARCHAR(150) NULL,
  `production` VARCHAR(150) NULL,
  `channel_number` INT DEFAULT 1,
  `channel_category` VARCHAR(60) DEFAULT 'aberta',
  `current_program` VARCHAR(150) NULL,
  `seasons` INT DEFAULT 1,
  `episodes` INT DEFAULT 1,
  `episodes_json` LONGTEXT NULL,
  `status` ENUM('active', 'inactive') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_type` (`type`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Default Master Admin user (admin / mastertv123)
-- Password hash for 'mastertv123'
INSERT INTO `users` (`id`, `role`, `name`, `username`, `password_hash`, `phone`, `credits`, `status`)
VALUES (1, 'admin', 'Administrador Master', 'admin', '$2y$10$wE1b1q.O2z3r7iLpM1F18uS5kZfJ59a9QjT9wYp9N4O2c8z4pZpKy', '5511999999999', 9999, 'active')
ON DUPLICATE KEY UPDATE `id` = `id`;

