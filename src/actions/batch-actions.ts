"use server";

import { db } from "@/lib/db";
import { ALL_ZONE_NUMBERS } from "@/data/carcas-zone-data";
import { CONTAMINANT_KEYS } from "@/data/contaminants";
import { ActionResponse, CarcasEntry } from "@/types/interfaces";
import { RowDataPacket } from "mysql2";
import { queries } from "@/db/queries";

// MARK: Read queries

export async function getBatchByNumber(
  batchNumber: string,
): Promise<ActionResponse<CarcasEntry[]>> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      queries.getHistoricDataForBatch,
      [batchNumber],
    );

    return { success: true, data: rows as CarcasEntry[] };
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
    const [rows] = await db.query<RowDataPacket[]>(queries.getHistoryData);

    const items = rows.map((row) => ({
      date: new Date(row.date).toISOString(),
      batch_number: row.batch_number as string,
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
    const [rows] = await db.query<RowDataPacket[]>(queries.getTodaysBatches);
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
  query: string,
): Promise<ActionResponse<{ batch_number: string }[]>> {
  if (!query) return { success: true, data: [] };
  try {
    const [rows] = await db.query<RowDataPacket[]>(queries.getBatchSearch, [
      query,
    ]);
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

    const [rows] = await db.query<RowDataPacket[]>(
      queries.getTodaysBatchByNumber,
      [batchNumber],
    );
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

    await db.query(queries.updateCounter(counterName), [change, id]);

    const [rows] = await db.query<RowDataPacket[]>(queries.getRowById, [id]);

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
  const values = zoneNumbers.map((zoneNumber) => [
    batchDate,
    batchNumber,
    zoneNumber,
    ...CONTAMINANT_KEYS.map(() => 0),
  ]);

  await db.query(queries.createNewBatch, [values]);
}

// Guarantees today's batch has a row for every current zone before it's opened.
// Why: the set of zones can grow over time, so a batch created earlier today (or
// migrated from an older schema) may be missing newer zones. We backfill only the
// missing ones — reusing the batch's existing date — so the UI never renders gaps
// and counters for new zones start from a real, writable DB row (not a placeholder).
async function ensureTodaysBatch(batchNumber: string): Promise<void> {
  const [rows] = await db.query<RowDataPacket[]>(
    queries.getTodaysBatchByNumber,
    [batchNumber],
  );

  if (rows.length === 0) {
    await insertBatchZoneRows(batchNumber, ALL_ZONE_NUMBERS);
    return;
  }

  const existingZones = new Set(rows.map((row) => Number(row.zone_number)));
  const missingZones = ALL_ZONE_NUMBERS.filter(
    (zoneNumber) => !existingZones.has(zoneNumber),
  );

  if (missingZones.length === 0) return;

  const batchDate = new Date(rows[0].date as string);
  await insertBatchZoneRows(batchNumber, missingZones, batchDate);
}
