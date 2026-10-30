// FootprintGen shared types, validation and KiCad exporter.

export interface Range3 { min: number | null; nom: number | null; max: number | null }

export interface ExtractedPackage {
  part_number: string | null;
  manufacturer: string | null;
  datasheet_url: string | null;
  package_family: "SOIC" | "SOP" | "TSSOP" | "QFN" | "DFN" | "SOT-23" | "CHIP" | null;
  pin_count: number | null;
  pitch_mm: number | null;
  body_length_mm: number | null;
  body_width_mm: number | null;
  overall_span_mm: Range3 | null;
  lead_width_mm: Range3 | null;
  lead_length_mm: Range3 | null;
  body_height_max_mm: number | null;
  exposed_pad: { length_mm: number; width_mm: number } | null;
  pin1_location: string | null;
  source_page: number | null;
  confidence: number;
  notes: string | null;
  recommended_land_pattern: {
    source: string;
    pads: { name: string; x_mm: number; y_mm: number; width_mm: number; height_mm: number }[];
  } | null;
}

export interface FPad {
  number: string; x: number; y: number; width: number; height: number;
  shape: "rect" | "round"; layer: "top";
}
export interface SilkLine { x1: number; y1: number; x2: number; y2: number }

export interface FootprintJson {
  name: string;
  family: string;
  density: "most" | "nominal" | "least";
  source: "calculated_ipc7351b" | "manufacturer_recommended";
  pads: FPad[];
  silkscreen: SilkLine[];
  courtyard: { x: number; y: number; width: number; height: number };
  pin1_marker: { x: number; y: number } | null;
  refdes: { x: number; y: number };
}

export type DensityLevel = "most" | "nominal" | "least";

export interface Warning {
  level: "error" | "warn";
  message: string;
}

/** Automatic validation run before the user can confirm. */
export function validateFootprint(e: ExtractedPackage, f: FootprintJson | null): Warning[] {
  const w: Warning[] = [];

  if (e.confidence < 0.8) {
    w.push({ level: "error", message: `Low extraction confidence (${e.confidence.toFixed(2)}). Review every field against the datasheet.` });
  }

  const required: [string, unknown][] = [
    ["package_family", e.package_family],
    ["pin_count", e.pin_count],
  ];
  if (e.package_family !== "CHIP") {
    required.push(["pitch_mm", e.pitch_mm], ["body_length_mm", e.body_length_mm], ["body_width_mm", e.body_width_mm]);
  }
  for (const [name, val] of required) {
    if (val == null) w.push({ level: "error", message: `Required field "${name}" is empty — fill it in from the datasheet.` });
  }

  if (!f) return w;

  // Pad count must equal pin count (plus exposed pad)
  const expected = (e.pin_count ?? 0) + (e.exposed_pad ? 1 : 0);
  if (e.pin_count != null && f.pads.length !== expected) {
    w.push({ level: "error", message: `Pad count (${f.pads.length}) does not match pin count (${expected}).` });
  }

  // Pitch must match spacing between adjacent pads on the same row/column
  if (e.pitch_mm != null && f.pads.length >= 2) {
    const byRow = new Map<string, FPad[]>();
    for (const p of f.pads) {
      const key = Math.abs(p.width) < Math.abs(p.height) ? `c${p.x.toFixed(2)}` : `r${p.y.toFixed(2)}`;
      byRow.set(key, [...(byRow.get(key) ?? []), p]);
    }
    let pitchOk = true;
    for (const group of byRow.values()) {
      if (group.length < 2) continue;
      const vertical = Math.abs(group[0].width) < Math.abs(group[0].height);
      const sorted = [...group].sort((a, b) => (vertical ? a.y - b.y : a.x - b.x));
      for (let i = 1; i < sorted.length; i++) {
        const d = vertical ? sorted[i].y - sorted[i - 1].y : sorted[i].x - sorted[i - 1].x;
        if (Math.abs(d - e.pitch_mm) > 0.02) { pitchOk = false; break; }
      }
    }
    if (!pitchOk) w.push({ level: "error", message: `Pad spacing does not match the stated pitch of ${e.pitch_mm} mm.` });
  }

  // Computed span vs datasheet overall span
  const span = e.overall_span_mm;
  if (span && (span.min != null || span.max != null) && f.pads.length > 0) {
    let minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity;
    for (const p of f.pads) {
      minY = Math.min(minY, p.y - p.height / 2); maxY = Math.max(maxY, p.y + p.height / 2);
      minX = Math.min(minX, p.x - p.width / 2); maxX = Math.max(maxX, p.x + p.width / 2);
    }
    const extent = Math.max(maxY - minY, maxX - minX);
    const lo = span.min ?? span.nom ?? 0;
    const hi = span.max ?? span.nom ?? Infinity;
    if (extent < lo * 0.8 || extent > hi * 1.6) {
      w.push({ level: "warn", message: `Footprint extent (${extent.toFixed(2)} mm) looks off vs. the datasheet span (${lo}–${hi} mm).` });
    }
  }

  // Silkscreen must not overlap pads
  for (const l of f.silkscreen) {
    for (const p of f.pads) {
      const left = p.x - p.width / 2, right = p.x + p.width / 2;
      const top = p.y - p.height / 2, bottom = p.y + p.height / 2;
      const cx = Math.max(left, Math.min((l.x1 + l.x2) / 2, right));
      const cy = Math.max(top, Math.min((l.y1 + l.y2) / 2, bottom));
      const midInside = cx >= left && cx <= right && cy >= top && cy <= bottom;
      const segInside =
        (l.x1 >= left && l.x1 <= right && l.y1 >= top && l.y1 <= bottom) ||
        (l.x2 >= left && l.x2 <= right && l.y2 >= top && l.y2 <= bottom);
      if (segInside || (midInside && ((l.x1 === l.x2 && l.x1 >= left && l.x1 <= right) || (l.y1 === l.y2 && l.y1 >= top && l.y1 <= bottom)))) {
        w.push({ level: "warn", message: "Silkscreen overlaps a pad — check the outline clearance." });
        return w;
      }
    }
  }

  return w;
}

/** Convert footprint_json into a valid KiCad .kicad_mod file. */
export function toKicadMod(f: FootprintJson, description: string): string {
  const lines: string[] = [];
  lines.push(`(footprint "${f.name}" (version 20241229) (generator "footprintgen")`);
  lines.push(`  (layer "F.Cu")`);
  lines.push(`  (descr "${description.replace(/"/g, "'")}")`);
  lines.push(`  (attr smd)`);
  const fmt = (v: number) => v.toFixed(3);

  lines.push(`  (fp_text reference "REF**" (at ${fmt(f.refdes.x)} ${fmt(-f.refdes.y)}) (layer "F.SilkS") (effects (font (size 1 1) (thickness 0.15))))`);
  lines.push(`  (fp_text value "${f.name}" (at 0 ${fmt(-(f.refdes.y - 1.6))}) (layer "F.Fab") (effects (font (size 1 1) (thickness 0.15))))`);

  for (const l of f.silkscreen) {
    lines.push(`  (fp_line (start ${fmt(l.x1)} ${fmt(-l.y1)}) (end ${fmt(l.x2)} ${fmt(-l.y2)}) (stroke (width 0.12) (type solid)) (layer "F.SilkS"))`);
  }

  const c = f.courtyard;
  const cy = [ [c.x, c.y], [c.x + c.width, c.y], [c.x + c.width, c.y + c.height], [c.x, c.y + c.height] ];
  for (let i = 0; i < 4; i++) {
    const [x1, y1] = cy[i], [x2, y2] = cy[(i + 1) % 4];
    lines.push(`  (fp_line (start ${fmt(x1)} ${fmt(-y1)}) (end ${fmt(x2)} ${fmt(-y2)}) (stroke (width 0.05) (type solid)) (layer "F.CrtYd"))`);
  }

  if (f.pin1_marker) {
    lines.push(`  (fp_circle (center ${fmt(f.pin1_marker.x)} ${fmt(-f.pin1_marker.y)}) (end ${fmt(f.pin1_marker.x + 0.25)} ${fmt(-f.pin1_marker.y)}) (stroke (width 0.12) (type solid)) (fill none) (layer "F.SilkS"))`);
  }

  for (const p of f.pads) {
    const shape = p.shape === "round" ? "circle" : "rect";
    lines.push(`  (pad "${p.number}" smd ${shape} (at ${fmt(p.x)} ${fmt(-p.y)}) (size ${fmt(p.width)} ${fmt(p.height)}) (layers "F.Cu" "F.Paste" "F.Mask"))`);
  }

  lines.push(`)`);
  return lines.join("\n") + "\n";
}

/** Serialize the SVG element for download. */
export function svgToDownload(svg: SVGSVGElement): string {
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return `<?xml version="1.0" encoding="UTF-8"?>\n${clone.outerHTML}`;
}

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

// ---- per-browser history + rate limit (no sign-in) ----

export interface HistoryEntry {
  id: string;
  at: number;
  part: string;
  extracted: ExtractedPackage;
  footprint: FootprintJson | null;
}

const HISTORY_KEY = "footprintgen_history";
const RATE_KEY = "footprintgen_rate";
export const DAILY_LIMIT = 20;

export function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); } catch { return []; }
}

export function saveHistoryEntry(entry: HistoryEntry) {
  const list = [entry, ...loadHistory()].slice(0, 50);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}

export function checkRateLimit(): { allowed: boolean; used: number } {
  try {
    const raw = JSON.parse(localStorage.getItem(RATE_KEY) ?? "{}");
    const today = new Date().toISOString().slice(0, 10);
    const used = raw.day === today ? raw.count ?? 0 : 0;
    return { allowed: used < DAILY_LIMIT, used };
  } catch {
    return { allowed: true, used: 0 };
  }
}

export function bumpRateLimit() {
  const today = new Date().toISOString().slice(0, 10);
  const { used } = checkRateLimit();
  localStorage.setItem(RATE_KEY, JSON.stringify({ day: today, count: used + 1 }));
}
