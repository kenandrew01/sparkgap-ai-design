import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import {
  CHIP_PADS,
  COORD_GRID_MM,
  EXPOSED_PAD_SHRINK_MM,
  GULLWING_FILLETS,
  MIN_PAD_LENGTH_MM,
  MIN_PAD_WIDTH_MM,
  NOLEAD_FILLETS,
  SILK_PAD_CLEARANCE_MM,
  type DensityLevel,
} from "./ipc_constants.ts";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const round = (v: number) => Math.round(v / COORD_GRID_MM) * COORD_GRID_MM;
const r3 = (v: number) => Math.round(v * 1000) / 1000;

interface Range { min: number | null; nom: number | null; max: number | null }
interface Extracted {
  part_number: string | null;
  package_family: string | null;
  pin_count: number | null;
  pitch_mm: number | null;
  body_length_mm: number | null;
  body_width_mm: number | null;
  overall_span_mm: Range | null;
  lead_width_mm: Range | null;
  lead_length_mm: Range | null;
  exposed_pad: { length_mm: number; width_mm: number } | null;
  recommended_land_pattern: { source: string; pads: LandPad[] } | null;
}
interface LandPad { name: string; x_mm: number; y_mm: number; width_mm: number; height_mm: number }

interface Pad {
  number: string; x: number; y: number; width: number; height: number;
  shape: "rect" | "round"; layer: "top";
}
interface SilkLine { x1: number; y1: number; x2: number; y2: number }
interface FootprintJson {
  name: string;
  family: string;
  density: DensityLevel;
  source: "calculated_ipc7351b" | "manufacturer_recommended";
  pads: Pad[];
  silkscreen: SilkLine[];
  courtyard: { x: number; y: number; width: number; height: number };
  pin1_marker: { x: number; y: number } | null;
  refdes: { x: number; y: number };
  unsupported?: string;
}

const GULLWING = new Set(["SOIC", "SOP", "TSSOP", "SOT-23"]);
const NOLEAD = new Set(["QFN", "DFN"]);

function nom(r: Range | null | undefined, fallback: number | null): number | null {
  if (r?.nom != null) return r.nom;
  if (r?.min != null && r?.max != null) return (r.min + r.max) / 2;
  return fallback;
}

function silkRect(hw: number, hh: number): SilkLine[] {
  return [
    { x1: -hw, y1: -hh, x2: hw, y2: -hh },
    { x1: hw, y1: -hh, x2: hw, y2: hh },
    { x1: hw, y1: hh, x2: -hw, y2: hh },
    { x1: -hw, y1: hh, x2: -hw, y2: -hh },
  ];
}

function courtyardFor(pads: Pad[], excess: number) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of pads) {
    minX = Math.min(minX, p.x - p.width / 2);
    maxX = Math.max(maxX, p.x + p.width / 2);
    minY = Math.min(minY, p.y - p.height / 2);
    maxY = Math.max(maxY, p.y + p.height / 2);
  }
  return {
    x: round(minX - excess),
    y: round(minY - excess),
    width: round(maxX - minX + excess * 2),
    height: round(maxY - minY + excess * 2),
  };
}

function buildGullWing(e: Extracted, density: DensityLevel): FootprintJson | { error: string } {
  const pins = e.pin_count;
  const pitch = e.pitch_mm;
  const span = nom(e.overall_span_mm, null);
  const leadLen = nom(e.lead_length_mm, null);
  const leadW = nom(e.lead_width_mm, null) ?? (pitch ? pitch * 0.5 : null);
  if (!pins || pins < 3 || !pitch || !span || !leadLen || !leadW) {
    return { error: "Missing required fields for a gull-wing package: pin_count, pitch_mm, overall_span_mm, lead_length_mm, lead_width_mm." };
  }
  const f = GULLWING_FILLETS[density];
  const perSide = Math.ceil(pins / 2);
  const spanMin = e.overall_span_mm?.min ?? span;
  const spanMax = e.overall_span_mm?.max ?? span;

  // Pad inner edge sits under the lead heel; outer edge extends past the toe.
  const inner = spanMin / 2 - leadLen + f.heel;
  const outer = spanMax / 2 + f.toe;
  const padLen = Math.max(outer - inner, MIN_PAD_LENGTH_MM);
  const padW = Math.max(leadW + 2 * f.side, MIN_PAD_WIDTH_MM);
  const cy = (inner + outer) / 2;

  const pads: Pad[] = [];
  for (let i = 0; i < perSide; i++) {
    const x = round((i - (perSide - 1) / 2) * pitch);
    pads.push({ number: String(i + 1), x, y: round(-cy), width: padW, height: round(padLen), shape: "rect", layer: "top" });
  }
  for (let i = 0; i < pins - perSide; i++) {
    const x = round(((pins - perSide - 1) / 2 - i) * pitch);
    pads.push({ number: String(perSide + i + 1), x, y: round(cy), width: padW, height: round(padLen), shape: "rect", layer: "top" });
  }

  const bodyW = e.body_width_mm ?? span - 2 * leadLen;
  const bodyL = e.body_length_mm ?? (perSide - 1) * pitch + pitch;
  const silk = silkRect(round(bodyL / 2), round(bodyW / 2));
  const cy2 = courtyardFor(pads, f.courtyard);
  return {
    name: `${e.package_family}-${pins}_${pitch}mm`,
    family: e.package_family!,
    density,
    source: "calculated_ipc7351b",
    pads,
    silkscreen: silk,
    courtyard: cy2,
    pin1_marker: pads[0] ? { x: pads[0].x, y: pads[0].y - pads[0].height / 2 - SILK_PAD_CLEARANCE_MM - 0.3 } : null,
    refdes: { x: 0, y: round(cy2.y - 0.6) },
  };
}

function buildNoLead(e: Extracted, density: DensityLevel): FootprintJson | { error: string } {
  const pins = e.pin_count;
  const pitch = e.pitch_mm;
  const bodyW = e.body_width_mm;
  const bodyL = e.body_length_mm;
  if (!pins || pins < 4 || !pitch || !bodyW || !bodyL) {
    return { error: "Missing required fields for a no-lead package: pin_count, pitch_mm, body_width_mm, body_length_mm." };
  }
  const f = NOLEAD_FILLETS[density];
  const perSide = Math.ceil(pins / 4) || 1;
  const leadLen = nom(e.lead_length_mm, 0.4)!;
  const leadW = nom(e.lead_width_mm, pitch * 0.5)!;

  const padW = Math.max(leadW + 2 * f.side, MIN_PAD_WIDTH_MM);
  const padLen = Math.max(leadLen + f.toe - f.heel, MIN_PAD_LENGTH_MM);

  const pads: Pad[] = [];
  let n = 1;
  // left + right columns (pins along body length)
  for (const sideX of [-1, 1]) {
    const outer = bodyW / 2 + f.toe;
    const cx = sideX * (outer - padLen / 2);
    for (let i = 0; i < perSide && n <= pins; i++, n++) {
      const y = round((i - (perSide - 1) / 2) * pitch);
      pads.push({ number: String(n), x: round(cx), y, width: round(padLen), height: padW, shape: "rect", layer: "top" });
    }
  }
  // bottom + top rows if pins remain (4-sided QFN)
  for (const sideY of [1, -1]) {
    const outer = bodyL / 2 + f.toe;
    const cyr = sideY * (outer - padLen / 2);
    for (let i = 0; i < perSide && n <= pins; i++, n++) {
      const x = round((i - (perSide - 1) / 2) * pitch);
      pads.push({ number: String(n), x, y: round(cyr), width: padW, height: round(padLen), shape: "rect", layer: "top" });
    }
  }

  if (e.exposed_pad) {
    const w = Math.max(e.exposed_pad.width_mm - EXPOSED_PAD_SHRINK_MM, 0.3);
    const l = Math.max(e.exposed_pad.length_mm - EXPOSED_PAD_SHRINK_MM, 0.3);
    pads.push({ number: String(pins + 1), x: 0, y: 0, width: round(w), height: round(l), shape: "rect", layer: "top" });
  }

  const silk = silkRect(round(bodyL / 2), round(bodyW / 2));
  const cy = courtyardFor(pads, f.courtyard);
  return {
    name: `${e.package_family}-${pins}_${pitch}mm`,
    family: e.package_family!,
    density,
    source: "calculated_ipc7351b",
    pads,
    silkscreen: silk,
    courtyard: cy,
    pin1_marker: pads[0] ? { x: pads[0].x - pads[0].width / 2 - SILK_PAD_CLEARANCE_MM - 0.3, y: pads[0].y } : null,
    refdes: { x: 0, y: round(cy.y - 0.6) },
  };
}

function buildChip(e: Extracted, density: DensityLevel): FootprintJson | { error: string } {
  // Match EIA size code from the part number or body dims (e.g. 0402, 0603, 0805)
  const m = (e.part_number ?? "").match(/\b(0201|0402|0603|0805|1206|1210|1812|2010|2512)\b/);
  const code = m?.[1];
  const table = code ? CHIP_PADS[code] : undefined;

  let padW: number, padLen: number, gap: number;
  if (table) {
    ({ width: padW, length: padLen, gap } = table);
  } else if (e.body_length_mm && e.body_width_mm) {
    // Fallback: derive from body dimensions
    padW = round(e.body_width_mm * 1.0);
    padLen = round(Math.max(e.body_length_mm * 0.3, MIN_PAD_LENGTH_MM));
    gap = round(e.body_length_mm * 0.4);
  } else {
    return { error: "Could not determine the chip size. Include the EIA size code (e.g. 0603) in the part number or provide body dimensions." };
  }

  const cx = (gap + padLen) / 2;
  const pads: Pad[] = [
    { number: "1", x: round(-cx), y: 0, width: round(padLen), height: padW, shape: "rect", layer: "top" },
    { number: "2", x: round(cx), y: 0, width: round(padLen), height: padW, shape: "rect", layer: "top" },
  ];
  const bodyL = e.body_length_mm ?? gap + padLen;
  const bodyW = e.body_width_mm ?? padW;
  const silk = silkRect(round(bodyL / 2), round(bodyW / 2));
  const cy = courtyardFor(pads, GULLWING_FILLETS[density].courtyard);
  return {
    name: `CHIP-${code ?? "custom"}`,
    family: "CHIP",
    density,
    source: "calculated_ipc7351b",
    pads,
    silkscreen: silk,
    courtyard: cy,
    pin1_marker: null,
    refdes: { x: 0, y: round(cy.y - 0.6) },
  };
}

function fromRecommended(e: Extracted, density: DensityLevel): FootprintJson | { error: string } {
  const lp = e.recommended_land_pattern!;
  const pads: Pad[] = lp.pads.map((p, i) => ({
    number: p.name || String(i + 1),
    x: round(p.x_mm), y: round(p.y_mm),
    width: round(p.width_mm), height: round(p.height_mm),
    shape: "rect", layer: "top",
  }));
  if (pads.length === 0) return { error: "The recommended land pattern contains no pads." };
  const bodyW = e.body_width_mm ?? 0;
  const bodyL = e.body_length_mm ?? 0;
  const silk = bodyW && bodyL ? silkRect(round(bodyL / 2), round(bodyW / 2)) : [];
  const excess = GULLWING_FILLETS[density].courtyard;
  const cy = courtyardFor(pads, excess);
  return {
    name: `${e.package_family ?? "PART"}-${e.pin_count ?? pads.length}_mfr`,
    family: e.package_family ?? "UNKNOWN",
    density,
    source: "manufacturer_recommended",
    pads,
    silkscreen: silk,
    courtyard: cy,
    pin1_marker: pads[0] ? { x: pads[0].x, y: pads[0].y - pads[0].height / 2 - SILK_PAD_CLEARANCE_MM - 0.3 } : null,
    refdes: { x: 0, y: round(cy.y - 0.6) },
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const e = body?.extracted as Extracted | undefined;
    const density: DensityLevel = ["most", "nominal", "least"].includes(body?.density) ? body.density : "nominal";
    if (!e || typeof e !== "object") return json({ error: "Missing extracted package data." }, 400);

    // Prefer the manufacturer's recommended land pattern when present.
    if (e.recommended_land_pattern?.pads?.length) {
      const r = fromRecommended(e, density);
      if ("error" in r) return json({ error: r.error }, 422);
      return json(r);
    }

    const fam = e.package_family;
    let r: FootprintJson | { error: string };
    if (fam && GULLWING.has(fam)) r = buildGullWing(e, density);
    else if (fam && NOLEAD.has(fam)) r = buildNoLead(e, density);
    else if (fam === "CHIP") r = buildChip(e, density);
    else {
      return json({
        error: "Package family not supported yet",
        unsupported: fam ?? "unknown",
        supported: ["SOIC", "SOP", "TSSOP", "SOT-23", "QFN", "DFN", "CHIP"],
      }, 422);
    }
    if ("error" in r) return json({ error: r.error }, 422);
    // Normalise coordinate precision
    r.pads = r.pads.map((p) => ({ ...p, x: r3(p.x), y: r3(p.y), width: r3(p.width), height: r3(p.height) }));
    return json(r);
  } catch (err) {
    console.error("footprintgen-build error", err);
    return json({ error: "Footprint build failed. Please try again." }, 500);
  }
});
