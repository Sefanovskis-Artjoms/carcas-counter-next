"use server";

import { db } from "@/lib/db";
import { ActionResponse, CarcasEntry } from "@/types/interfaces";
import { RowDataPacket } from "mysql2";
import { queries } from "@/db/queries";

export async function getBatchByNumber(
  batchNumber: string
): Promise<ActionResponse<CarcasEntry[]>> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      queries.getHistoricDataForBatch,
      [batchNumber]
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
  query: string
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

export async function createNewBatch(
  batchNumber: string
): Promise<ActionResponse> {
  const existing = (await searchBatches(batchNumber))?.data || [];
  const exactMatch = existing.find((b) => b.batch_number === batchNumber);

  if (exactMatch) {
    return { success: false, message: "Batch number already exists" };
  }

  try {
    const values = Array.from({ length: 8 }, (_, i) => [
      new Date(),
      batchNumber,
      i + 1,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
      0,
    ]);

    await db.query(queries.createNewBatch, [values]);

    return { success: true };
  } catch (error) {
    console.error("Error creating batch:", error);
    return { success: false, message: "Database error" };
  }
}

export async function getBatchData(
  batchNumber: string
): Promise<ActionResponse<CarcasEntry[]>> {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      queries.getTodaysBatchByNumber,
      [batchNumber]
    );
    return { success: true, data: JSON.parse(JSON.stringify(rows)) };
  } catch (error) {
    console.error("Error fetching batch data:", error);
    return { success: false, error: "Database error" };
  }
}

export async function updateCounterAction(
  id: number,
  counterName: string,
  increment: boolean,
  amount: number
): Promise<ActionResponse<CarcasEntry>> {
  try {
    const change = increment ? amount : -amount;

    const allowedColumns = [
      "hair",
      "faceal",
      "grease_oil",
      "metal",
      "rail_dust",
      "soft_plastic",
      "hard_plastic",
      "blood_clots",
      "other",
      "lymph_nodes",
    ];

    if (!allowedColumns.includes(counterName)) {
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
