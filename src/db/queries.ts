export const queries = {
  getTodaysBatchByNumber: `select * from maintable where date = CURDATE() and batch_number = ?`,

  getRowById: `select * from maintable where id = ?`,

  getTodaysBatches: `
    SELECT DISTINCT batch_number FROM maintable WHERE date = CURDATE()
  `,

  getHistoryData: `
    SELECT date, batch_number 
    FROM maintable 
    GROUP BY date, batch_number 
    ORDER BY date DESC
  `,

  createNewBatch: `
    INSERT INTO maintable 
    (date, batch_number, zone_number, hair, faceal, grease_oil, metal, rail_dust, soft_plastic, hard_plastic, blood_clots, other, lymph_nodes)
    VALUES ?
  `,

  updateCounter: (counterName: string) => `
    UPDATE maintable
    SET ${counterName} = GREATEST(0, ${counterName} + ?)
    WHERE id = ?
  `,

  getBatchSearch: `
    SELECT DISTINCT batch_number 
    FROM maintable 
    WHERE batch_number LIKE CONCAT('%', ?, '%')
    ORDER BY date DESC
  `,

  getHistoricDataForBatch: `
    SELECT * FROM maintable 
    WHERE batch_number = ? 
    ORDER BY date DESC, zone_number ASC
  `,
};
