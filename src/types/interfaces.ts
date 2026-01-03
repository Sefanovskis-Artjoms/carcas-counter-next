export interface CarcasEntry {
  id: number;
  date: string;
  batch_number: string;
  zone_number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
  hair: number;
  faceal: number;
  grease_oil: number;
  metal: number;
  rail_dust: number;
  soft_plastic: number;
  hard_plastic: number;
  blood_clots: number;
  other: number;
  lymph_nodes: number;
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
