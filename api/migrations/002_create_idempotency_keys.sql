-- MasterTV Migration 002: Create idempotency_keys table
-- Non-destructive migration for transactional idempotency on credit-consuming operations
-- Safe to run multiple times (CREATE TABLE IF NOT EXISTS)

CREATE TABLE IF NOT EXISTS `idempotency_keys` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `operation` VARCHAR(40) NOT NULL,
  `key_hash` CHAR(64) NOT NULL,
  `request_hash` CHAR(64) NOT NULL,
  `target_ref` VARCHAR(120) NULL,
  `status` ENUM('processing', 'completed') NOT NULL DEFAULT 'processing',
  `http_status` INT NULL,
  `response_json` MEDIUMTEXT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY `uniq_user_key` (`user_id`, `key_hash`),
  INDEX `idx_idem_user_op` (`user_id`, `operation`),
  INDEX `idx_idem_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
