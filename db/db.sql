-- =============================================================================
-- Carcas Counter — database setup script (Microsoft SQL Server)
-- =============================================================================
-- Run this once to create the database and the table the app needs.
--
-- How to run:
--   * SSMS / Azure Data Studio: open this file and Execute.
--   * Command line (sqlcmd):  sqlcmd -S localhost -U sa -P your_password -i db/db.sql
--
-- IMPORTANT: the database name below must match DB_NAME in your .env file.
-- =============================================================================

-- 1) Create the database if it doesn't exist yet.
IF DB_ID(N'pickstock-carcas-counters') IS NULL
  CREATE DATABASE [pickstock-carcas-counters];
GO

USE [pickstock-carcas-counters];
GO

-- 2) Create the single table the app reads from and writes to ("maintable").
--    Each row = one carcas zone of one batch on one day, with its contaminant
--    counters. A new batch inserts one row per zone (see src/actions + queries.ts).
--    Unicode text uses NVARCHAR; there is no UNSIGNED in SQL Server, so plain
--    INT/TINYINT is used and values are kept >= 0 by the app's update logic.
IF OBJECT_ID(N'dbo.maintable', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.maintable (
    id                INT IDENTITY(1,1) NOT NULL,

    -- The day the batch was recorded (the app filters by CAST(GETDATE() AS DATE)).
    [date]            DATE NOT NULL,

    -- Batch identifier entered by the user (digits only, up to 6 — kept as text).
    batch_number      NVARCHAR(16) NOT NULL,

    -- Carcas zone number (1–13).
    zone_number       TINYINT NOT NULL,

    -- Contaminant counters. All start at 0 and are never negative.
    hair              INT NOT NULL DEFAULT 0,
    foreign_object    INT NOT NULL DEFAULT 0,
    blood_clots       INT NOT NULL DEFAULT 0,
    grease            INT NOT NULL DEFAULT 0,
    rail_dust         INT NOT NULL DEFAULT 0,
    faceal_over_1cm   INT NOT NULL DEFAULT 0,
    faceal_under_1cm  INT NOT NULL DEFAULT 0,
    ingesta_over_1cm  INT NOT NULL DEFAULT 0,
    ingesta_under_1cm INT NOT NULL DEFAULT 0,
    other             INT NOT NULL DEFAULT 0,

    CONSTRAINT PK_maintable PRIMARY KEY (id),

    -- One row per (day, batch, zone) — prevents accidental duplicate zone rows.
    CONSTRAINT uq_day_batch_zone UNIQUE ([date], batch_number, zone_number)
  );

  -- Speeds up the "today" and batch-search/history lookups in queries.ts.
  CREATE INDEX idx_date_batch ON dbo.maintable ([date], batch_number);
  CREATE INDEX idx_batch_number ON dbo.maintable (batch_number);
END
GO
