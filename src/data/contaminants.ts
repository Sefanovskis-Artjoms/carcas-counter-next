// MARK: Column definitions

export const CONTAMINANT_COLUMNS = [
  { key: "hair", displayName: "Hair", iconKey: "hair" },
  {
    key: "foreign_object",
    displayName: "Foreign Object",
    iconKey: "foreign-object",
    iconSize: "2.9rem",
  },
  { key: "blood_clots", displayName: "Blood Clots", iconKey: "blood-clots" },
  { key: "grease", displayName: "Grease", iconKey: "grease-oil" },
  {
    key: "rail_dust",
    displayName: "Rail Dust",
    iconKey: "rail-dust",
    iconSize: "3.2rem",
  },
  {
    key: "faceal_over_1cm",
    displayName: "Faceal\nOver 1cm",
    iconKey: "faceal",
    iconSize: "2.3rem",
  },
  {
    key: "faceal_under_1cm",
    displayName: "Faceal\nUnder 1cm",
    iconKey: "faceal",
    iconSize: "1.7rem",
  },
  {
    key: "ingesta_over_1cm",
    displayName: "Ingesta\nOver 1cm",
    iconKey: "lymph-nodes",
    iconSize: "2.5rem",
  },
  {
    key: "ingesta_under_1cm",
    displayName: "Ingesta\nUnder 1cm",
    iconKey: "lymph-nodes",
    iconSize: "1.85rem",
  },
  {
    key: "other",
    displayName: "Other",
    iconKey: "other",
    iconSize: "2.9rem",
  },
] as const;

// MARK: Types

export type ContaminantKey = (typeof CONTAMINANT_COLUMNS)[number]["key"];

// MARK: Keys & helpers

export const CONTAMINANT_KEYS: ContaminantKey[] = CONTAMINANT_COLUMNS.map(
  (column) => column.key
);

export function createEmptyContaminantCounts(): Record<ContaminantKey, number> {
  return Object.fromEntries(
    CONTAMINANT_KEYS.map((key) => [key, 0])
  ) as Record<ContaminantKey, number>;
}
