import { CarcasZoneNumber } from "@/data/carcas-zone-data";
import { ContaminantKey } from "@/data/contaminants";

export interface CarcasEntry {
  id: number;
  date: string;
  batch_number: string;
  zone_number: CarcasZoneNumber;
  hair: number;
  foreign_object: number;
  blood_clots: number;
  grease: number;
  rail_dust: number;
  faceal_over_1cm: number;
  faceal_under_1cm: number;
  ingesta_over_1cm: number;
  ingesta_under_1cm: number;
  other: number;
}

export interface UpdateCounterPayload {
  id: number;
  counter_name: keyof CarcasEntry;
  amount: number;
  increment: boolean;
}

export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ServerToClientEvents {
  refresh_table: () => void;
}

export interface ClientToServerEvents {
  join_batch: (batchId: string) => void;
  update_data: (data: { batchId: string }) => void;
}
