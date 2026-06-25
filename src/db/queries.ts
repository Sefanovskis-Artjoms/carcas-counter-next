// MARK: Today's batch

export const queries = {
  getTodaysBatchByNumber: `
    SELECT * FROM maintable
    WHERE [date] = CAST(GETDATE() AS DATE) AND batch_number = @batchNumber
  `,

  getTodaysBatches: `
    SELECT DISTINCT batch_number FROM maintable
    WHERE [date] = CAST(GETDATE() AS DATE)
  `,

  // MARK: History

  getHistoryData: `
    SELECT [date], batch_number
    FROM maintable
    GROUP BY [date], batch_number
    ORDER BY [date] DESC
  `,

  getHistoricDataForBatch: `
    SELECT * FROM maintable
    WHERE batch_number = @batchNumber
    ORDER BY [date] DESC, zone_number ASC
  `,

  // SELECT DISTINCT can't ORDER BY a column that isn't selected in SQL Server,
  // so we GROUP BY the batch and order by its most recent date instead.
  getBatchSearch: `
    SELECT batch_number
    FROM maintable
    WHERE batch_number LIKE CONCAT('%', @query, '%')
    GROUP BY batch_number
    ORDER BY MAX([date]) DESC
  `,

  // MARK: Writes

  // Builds a multi-row INSERT (one row per zone). Counter columns are left out
  // on purpose so the table's DEFAULT 0 applies. @date and @batchNumber are
  // shared across all rows; each zone gets its own @zone<i> parameter.
  buildInsertBatchZoneRows: (zoneCount: number) => {
    const valueRows = Array.from(
      { length: zoneCount },
      (_, i) => `(@date, @batchNumber, @zone${i})`,
    ).join(", ");

    return `
      INSERT INTO maintable ([date], batch_number, zone_number)
      VALUES ${valueRows}
    `;
  },

  // GREATEST isn't available before SQL Server 2022, so we clamp at 0 with CASE.
  updateCounter: (counterName: string) => `
    UPDATE maintable
    SET ${counterName} = CASE
      WHEN ${counterName} + @change < 0 THEN 0
      ELSE ${counterName} + @change
    END
    WHERE id = @id
  `,

  // MARK: Row lookup

  getRowById: `SELECT * FROM maintable WHERE id = @id`,
};
