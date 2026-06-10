-- Migrācija: maintable contaminant kolonnu pārsaukšana
-- Datubāze: pig-counters
-- MariaDB / MySQL
--
-- Pozicionālais kartējums (vecā kolonna → jaunais nosaukums):
--   hair           → hair
--   faceal         → foreign_object
--   grease_oil     → blood_clots
--   metal          → grease
--   rail_dust      → rail_dust
--   soft_plastic   → faceal_over_1cm
--   hard_plastic   → faceal_under_1cm
--   blood_clots    → ingesta_over_1cm
--   other          → ingesta_under_1cm
--   lymph_nodes    → other
--
-- Ieteicams pirms palaišanas izveidot rezerves kopiju:
--   mysqldump -u root -p pig-counters maintable > maintable_backup.sql

USE `pig-counters`;

START TRANSACTION;

-- 1. fāze: visām kolonnām pagaidu nosaukumi (izvairās no nosaukumu konfliktiem)
ALTER TABLE `maintable`
  CHANGE COLUMN `hair`          `_col_01` smallint(6) NOT NULL,
  CHANGE COLUMN `faceal`        `_col_02` smallint(6) NOT NULL,
  CHANGE COLUMN `grease_oil`    `_col_03` smallint(6) NOT NULL,
  CHANGE COLUMN `metal`         `_col_04` smallint(6) NOT NULL,
  CHANGE COLUMN `rail_dust`     `_col_05` smallint(6) NOT NULL,
  CHANGE COLUMN `soft_plastic`  `_col_06` smallint(6) NOT NULL,
  CHANGE COLUMN `hard_plastic`  `_col_07` smallint(6) NOT NULL,
  CHANGE COLUMN `blood_clots`   `_col_08` smallint(6) NOT NULL,
  CHANGE COLUMN `other`         `_col_09` smallint(6) NOT NULL,
  CHANGE COLUMN `lymph_nodes`   `_col_10` smallint(6) NOT NULL;

-- 2. fāze: galīgie nosaukumi secībā kā finālajā sarakstā
ALTER TABLE `maintable`
  CHANGE COLUMN `_col_01` `hair`                smallint(6) NOT NULL,
  CHANGE COLUMN `_col_02` `foreign_object`      smallint(6) NOT NULL,
  CHANGE COLUMN `_col_03` `blood_clots`         smallint(6) NOT NULL,
  CHANGE COLUMN `_col_04` `grease`              smallint(6) NOT NULL,
  CHANGE COLUMN `_col_05` `rail_dust`           smallint(6) NOT NULL,
  CHANGE COLUMN `_col_06` `faceal_over_1cm`    smallint(6) NOT NULL,
  CHANGE COLUMN `_col_07` `faceal_under_1cm`   smallint(6) NOT NULL,
  CHANGE COLUMN `_col_08` `ingesta_over_1cm`   smallint(6) NOT NULL,
  CHANGE COLUMN `_col_09` `ingesta_under_1cm`  smallint(6) NOT NULL,
  CHANGE COLUMN `_col_10` `other`               smallint(6) NOT NULL;

COMMIT;

-- Pārbaude pēc migrācijas:
-- DESCRIBE maintable;
-- SELECT hair, foreign_object, blood_clots, grease, rail_dust,
--        faceal_over_1cm, faceal_under_1cm, ingesta_over_1cm, ingesta_under_1cm, other
-- FROM maintable LIMIT 5;
