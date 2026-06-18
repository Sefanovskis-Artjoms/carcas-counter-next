-- =============================================================================
-- Carcas Counter — database setup script
-- =============================================================================
-- Run this once to create the database and the table the app needs.
--
-- How to run:
--   * phpMyAdmin:  open the "Import" tab and choose this file, OR paste the
--                  contents into the "SQL" tab and press "Go".
--   * Command line: mysql -u root -p < db/db.sql
--
-- IMPORTANT: the database name below must match DB_NAME in your .env file.
-- =============================================================================

-- 1) Create the database (uses utf8mb4 so any character/emoji is supported).
CREATE DATABASE IF NOT EXISTS `pickstock-carcas-counters`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `pickstock-carcas-counters`;

-- 2) Create the single table the app reads from and writes to ("maintable").
--    Each row = one carcas zone of one batch on one day, with its contaminant
--    counters. A new batch inserts one row per zone (see src/data + queries.ts).
CREATE TABLE IF NOT EXISTS `maintable` (
  `id`                INT UNSIGNED NOT NULL AUTO_INCREMENT,

  -- The day the batch was recorded (the app filters by CURDATE()).
  `date`              DATE NOT NULL,

  -- Batch identifier entered by the user (digits only, up to 6 — kept as text).
  `batch_number`      VARCHAR(16) NOT NULL,

  -- Carcas zone number (1–13).
  `zone_number`       TINYINT UNSIGNED NOT NULL,

  -- Contaminant counters. All start at 0 and are never negative.
  `hair`              INT UNSIGNED NOT NULL DEFAULT 0,
  `foreign_object`    INT UNSIGNED NOT NULL DEFAULT 0,
  `blood_clots`       INT UNSIGNED NOT NULL DEFAULT 0,
  `grease`            INT UNSIGNED NOT NULL DEFAULT 0,
  `rail_dust`         INT UNSIGNED NOT NULL DEFAULT 0,
  `faceal_over_1cm`   INT UNSIGNED NOT NULL DEFAULT 0,
  `faceal_under_1cm`  INT UNSIGNED NOT NULL DEFAULT 0,
  `ingesta_over_1cm`  INT UNSIGNED NOT NULL DEFAULT 0,
  `ingesta_under_1cm` INT UNSIGNED NOT NULL DEFAULT 0,
  `other`             INT UNSIGNED NOT NULL DEFAULT 0,

  PRIMARY KEY (`id`),

  -- One row per (day, batch, zone) — prevents accidental duplicate zone rows.
  UNIQUE KEY `uq_day_batch_zone` (`date`, `batch_number`, `zone_number`),

  -- Speeds up the "today" and batch-search/history lookups in queries.ts.
  KEY `idx_date_batch` (`date`, `batch_number`),
  KEY `idx_batch_number` (`batch_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
