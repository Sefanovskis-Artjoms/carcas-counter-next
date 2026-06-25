"use server";

import { query } from "@/lib/db";
import { ALL_ZONE_NUMBERS } from "@/data/carcas-zone-data";
import { CONTAMINANT_KEYS } from "@/data/contaminants";
import { ActionResponse, CarcasEntry } from "@/types/interfaces";
import { queries } from "@/db/queries";

// MARK: Read queries

export async function getBatchByNumber(
  batchNumber: string,
): Promise<ActionResponse<CarcasEntry[]>> {
  try {
    const rows = await query<CarcasEntry>(queries.getHistoricDataForBatch, {
      batchNumber,
    });

    return { success: true, data: rows };
  } catch {
    return {
      success: false,
      error: "Error while fetching data for batch: " + batchNumber,
    };
  }
}

export async function getAllHistoryItems(): Promise<
  ActionResponse<{ date: string; batch_number: string }[]>
> {
  try {
    const rows = await query<{ date: string | Date; batch_number: string }>(
      queries.getHistoryData,
    );

    const items = rows.map((row) => ({
      date: new Date(row.date).toISOString(),
      batch_number: row.batch_number,
    }));

    return { success: true, data: [...items] };
  } catch (error) {
    console.error("Database error in getAllHistoryItems:", error);
    return {
      success: false,
      error: "Error while fetching all history items.",
    };
  }
}

export async function getTodaysBatches(): Promise<
  ActionResponse<{ batch_number: string }[]>
> {
  try {
    const rows = await query<{ batch_number: string }>(
      queries.getTodaysBatches,
    );
    return {
      success: true,
      data: rows.map((row) => ({ batch_number: row.batch_number })),
    };
  } catch (error) {
    console.error("Error fetching today's batches:", error);
    return { success: false, error: "Database error" };
  }
}

export async function searchBatches(
  searchQuery: string,
): Promise<ActionResponse<{ batch_number: string }[]>> {
  if (!searchQuery) return { success: true, data: [] };
  try {
    const rows = await query<{ batch_number: string }>(queries.getBatchSearch, {
      query: searchQuery,
    });
    return {
      success: true,
      data: rows.map((row) => ({ batch_number: row.batch_number })),
    };
  } catch (error) {
    console.error("Error searching batches:", error);
    return { success: false, error: "Database error" };
  }
}

export async function getBatchData(
  batchNumber: string,
): Promise<ActionResponse<CarcasEntry[]>> {
  try {
    await ensureTodaysBatch(batchNumber);

    const rows = await query<CarcasEntry>(queries.getTodaysBatchByNumber, {
      batchNumber,
    });
    return { success: true, data: JSON.parse(JSON.stringify(rows)) };
  } catch (error) {
    console.error("Error fetching batch data:", error);
    return { success: false, error: "Database error" };
  }
}

// MARK: Batch lifecycle

export async function createNewBatch(
  batchNumber: string,
): Promise<ActionResponse> {
  const existing = (await searchBatches(batchNumber))?.data || [];
  const exactMatch = existing.find((b) => b.batch_number === batchNumber);

  if (exactMatch) {
    return { success: false, message: "Batch number already exists" };
  }

  try {
    await insertBatchZoneRows(batchNumber, ALL_ZONE_NUMBERS);
    return { success: true };
  } catch (error) {
    console.error("Error creating batch:", error);
    return { success: false, message: "Database error" };
  }
}

// MARK: Mutations

export async function updateCounterAction(
  id: number,
  counterName: string,
  increment: boolean,
  amount: number,
): Promise<ActionResponse<CarcasEntry>> {
  try {
    const change = increment ? amount : -amount;

    if (
      !CONTAMINANT_KEYS.includes(
        counterName as (typeof CONTAMINANT_KEYS)[number],
      )
    ) {
      throw new Error("Invalid column name");
    }

    await query(queries.updateCounter(counterName), { change, id });

    const rows = await query<CarcasEntry>(queries.getRowById, { id });

    const updatedRow = rows[0];

    return { success: true, data: JSON.parse(JSON.stringify(updatedRow)) };
  } catch (error) {
    console.error("Error updating counter:", error);
    return { success: false, error: "Database error" };
  }
}

// MARK: Private helpers

async function insertBatchZoneRows(
  batchNumber: string,
  zoneNumbers: readonly number[],
  batchDate: Date = new Date(),
): Promise<void> {
  if (zoneNumbers.length === 0) return;

  const params: Record<string, unknown> = {
    date: batchDate,
    batchNumber,
  };
  zoneNumbers.forEach((zoneNumber, i) => {
    params[`zone${i}`] = zoneNumber;
  });

  await query(queries.buildInsertBatchZoneRows(zoneNumbers.length), params);
}

// Guarantees today's batch has a row for every current zone before it's opened.
// Why: the set of zones can grow over time, so a batch created earlier today (or
// migrated from an older schema) may be missing newer zones. We backfill only the
// missing ones — reusing the batch's existing date — so the UI never renders gaps
// and counters for new zones start from a real, writable DB row (not a placeholder).
async function ensureTodaysBatch(batchNumber: string): Promise<void> {
  const rows = await query<CarcasEntry>(queries.getTodaysBatchByNumber, {
    batchNumber,
  });

  if (rows.length === 0) {
    await insertBatchZoneRows(batchNumber, ALL_ZONE_NUMBERS);
    return;
  }

  const existingZones = new Set(rows.map((row) => Number(row.zone_number)));
  const missingZones = ALL_ZONE_NUMBERS.filter(
    (zoneNumber) => !existingZones.has(zoneNumber),
  );

  if (missingZones.length === 0) return;

  const batchDate = new Date(rows[0].date);
  await insertBatchZoneRows(batchNumber, missingZones, batchDate);
}
