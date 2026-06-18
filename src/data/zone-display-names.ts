import { CarcasPart, CarcasZoneNumber } from "./carcas-zone-data";

// MARK: Types

export type CarcasSelectablePart = Exclude<CarcasPart, "whole">;

// MARK: UI options

export const CARCAS_PART_SELECT_OPTIONS: {
  value: CarcasSelectablePart;
  label: string;
  title: string;
}[] = [
  { value: "fq", label: "FQ", title: "Fore quarter" },
  { value: "hq", label: "HQ", title: "Hind quarter" },
];

// MARK: Zone labels

export const ZONE_DISPLAY_NAMES: Record<CarcasZoneNumber, string> = {
  1: "Shin",
  2: "Clod",
  3: "Neck",
  4: "Brisket",
  5: "LMC / Feather",
  6: "Chuck and Blade",
  7: "FQ Rib",
  8: "HQ Rib",
  9: "Flank",
  10: "Sirloin",
  11: "Rump",
  12: "Topside Silverside",
  13: "Leg",
};

export const ZONE_LETTERS: Record<CarcasZoneNumber, string> = {
  1: "A",
  2: "B",
  3: "C",
  4: "D",
  5: "E",
  6: "F",
  7: "G",
  8: "H",
  9: "I",
  10: "J",
  11: "K",
  12: "L",
  13: "M",
};

// MARK: Helpers

export function getZoneDisplayLabel(zoneNumber: number): string {
  const zone = zoneNumber as CarcasZoneNumber;
  const letter = ZONE_LETTERS[zone];
  const name = ZONE_DISPLAY_NAMES[zone];

  if (!letter || !name) return String(zoneNumber);

  return `${letter} - ${name}`;
}
