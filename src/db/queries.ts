// MARK: Today's batch

export const queries = {
  getTodaysBatchByNumber: `select * from maintable where date = CURDATE() and batch_number = ?`,

  getTodaysBatches: `
    SELECT DISTINCT batch_number FROM maintable WHERE date = CURDATE()
  `,

  // MARK: History

  getHistoryData: `
    SELECT date, batch_number 
    FROM maintable 
    GROUP BY date, batch_number 
    ORDER BY date DESC
  `,

  getHistoricDataForBatch: `
    SELECT * FROM maintable 
    WHERE batch_number = ? 
    ORDER BY date DESC, zone_number ASC
  `,

  getBatchSearch: `
    SELECT DISTINCT batch_number 
    FROM maintable 
    WHERE batch_number LIKE CONCAT('%', ?, '%')
    ORDER BY date DESC
  `,

  // MARK: Writes

  createNewBatch: `
    INSERT INTO maintable 
    (date, batch_number, zone_number, hair, foreign_object, blood_clots, grease, rail_dust, faceal_over_1cm, faceal_under_1cm, ingesta_over_1cm, ingesta_under_1cm, other)
    VALUES ?
  `,

  updateCounter: (counterName: string) => `
    UPDATE maintable
    SET ${counterName} = GREATEST(0, ${counterName} + ?)
    WHERE id = ?
  `,

  // MARK: Row lookup

  getRowById: `select * from maintable where id = ?`,
};
