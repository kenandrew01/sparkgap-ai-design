// IPC-7351B-style land pattern constants.
// These are EDITABLE DEFAULTS — tune them to your fab/assembly house.
// All values in millimetres.

export type DensityLevel = "most" | "nominal" | "least";

export interface FilletSet {
  toe: number;   // Jt — fillet at the toe (outer end) of the lead
  heel: number;  // Jh — fillet at the heel (inner end) of the lead
  side: number;  // Js — fillet on each side of the lead
  courtyard: number; // courtyard excess beyond the land/pad extent
}

// Gull-wing parts (SOIC, SOP, TSSOP, SOT-23 …)
export const GULLWING_FILLETS: Record<DensityLevel, FilletSet> = {
  most:    { toe: 0.55, heel: 0.45, side: 0.05, courtyard: 0.50 },
  nominal: { toe: 0.35, heel: 0.35, side: 0.03, courtyard: 0.25 },
  least:   { toe: 0.15, heel: 0.25, side: 0.01, courtyard: 0.10 },
};

// No-lead parts (QFN, DFN …) — heel is a small pull-back under the body
export const NOLEAD_FILLETS: Record<DensityLevel, FilletSet> = {
  most:    { toe: 0.45, heel: -0.04, side: 0.05, courtyard: 0.50 },
  nominal: { toe: 0.35, heel: -0.05, side: 0.03, courtyard: 0.25 },
  least:   { toe: 0.25, heel: -0.05, side: 0.01, courtyard: 0.10 },
};

// Exposed thermal pad: shrink vs. the package exposed pad (solder mask web)
export const EXPOSED_PAD_SHRINK_MM = 0.0; // keep 1:1 by default
export const EXPOSED_PAD_MAX_MM = 8.0;    // split larger pads into a grid

// Chip passives — nominal pad geometry per EIA size code.
// pad = { width (Y, across terminations), length (X, along part), gap (inner edge to inner edge) }
export const CHIP_PADS: Record<string, { width: number; length: number; gap: number }> = {
  "0201": { width: 0.30, length: 0.35, gap: 0.40 },
  "0402": { width: 0.60, length: 0.60, gap: 0.60 },
  "0603": { width: 0.90, length: 0.90, gap: 0.90 },
  "0805": { width: 1.30, length: 1.10, gap: 1.10 },
  "1206": { width: 1.80, length: 1.30, gap: 1.60 },
  "1210": { width: 2.80, length: 1.40, gap: 1.60 },
  "1812": { width: 3.40, length: 1.60, gap: 2.40 },
  "2010": { width: 2.80, length: 1.60, gap: 3.20 },
  "2512": { width: 3.40, length: 1.80, gap: 4.40 },
};

// Minimum manufacturable pad dimensions
export const MIN_PAD_WIDTH_MM = 0.15;
export const MIN_PAD_LENGTH_MM = 0.30;

// Silkscreen: line width and minimum clearance from pads
export const SILK_LINE_WIDTH_MM = 0.12;
export const SILK_PAD_CLEARANCE_MM = 0.20;

// Round pad coordinates to this grid to keep files clean
export const COORD_GRID_MM = 0.01;
