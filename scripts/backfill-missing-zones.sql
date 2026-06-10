-- Migrācija: pievienot trūkstošās zonas (1–13) visām esošajām partijām
-- Datubāze: pig-counters
-- MariaDB / MySQL
--
-- Katrai unikālai (date, batch_number) kombinācijai tiek ievietotas
-- tikai tās zone_number vērtības, kuras vēl neeksistē.
--
-- Paredzēts pēc contaminant kolonnu pārsaukšanas (jaunie lauku nosaukumi).
--
-- Ieteicams pirms palaišanas izveidot rezerves kopiju:
--   mysqldump -u root -p pig-counters maintable > maintable_backup.sql

USE `pig-counters`;

START TRANSACTION;

INSERT INTO `maintable` (
  `date`,
  `batch_number`,
  `zone_number`,
  `hair`,
  `foreign_object`,
  `blood_clots`,
  `grease`,
  `rail_dust`,
  `faceal_over_1cm`,
  `faceal_under_1cm`,
  `ingesta_over_1cm`,
  `ingesta_under_1cm`,
  `other`
)
SELECT
  batches.`date`,
  batches.`batch_number`,
  zones.`zone_number`,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM (
  SELECT DISTINCT `date`, `batch_number`
  FROM `maintable`
) AS batches
CROSS JOIN (
  SELECT 1 AS `zone_number`
  UNION ALL SELECT 2
  UNION ALL SELECT 3
  UNION ALL SELECT 4
  UNION ALL SELECT 5
  UNION ALL SELECT 6
  UNION ALL SELECT 7
  UNION ALL SELECT 8
  UNION ALL SELECT 9
  UNION ALL SELECT 10
  UNION ALL SELECT 11
  UNION ALL SELECT 12
  UNION ALL SELECT 13
) AS zones
WHERE NOT EXISTS (
  SELECT 1
  FROM `maintable` AS existing
  WHERE existing.`date` = batches.`date`
    AND existing.`batch_number` = batches.`batch_number`
    AND existing.`zone_number` = zones.`zone_number`
);

COMMIT;

-- Pārbaude: nevienai partijai nedrīkst būt mazāk par 13 zonām
-- SELECT date, batch_number, COUNT(*) AS zone_count
-- FROM maintable
-- GROUP BY date, batch_number
-- HAVING zone_count < 13;

-- Pārbaude: kuru zonu skaits tika pievienots
-- SELECT ROW_COUNT() AS inserted_rows;
