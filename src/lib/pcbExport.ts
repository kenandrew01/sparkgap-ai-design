export type PcbComponent = {
  designator: string; type: string; value: string; footprint: string;
  x: number; y: number; w: number; h: number; confidence: "high" | "medium" | "low";
};
export type PcbNet = { name: string; pins: string[] };
export type PcbResult = {
  summary: string;
  board: { width_mm: number; height_mm: number; layers_visible: string };
  components: PcbComponent[];
  nets: PcbNet[];
  notes: string[];
};

const clean = (s: string) => s.replace(/[\r\n\[\]()]/g, " ").trim() || "unknown";

/** Protel/Altium-importable netlist (.NET). */
export function toProtelNetlist(r: PcbResult): string {
  const parts = r.components.map((c) => `[\n${clean(c.designator)}\n${clean(c.footprint)}\n${clean(c.value)}\n\n\n\n]`);
  const nets = r.nets.map((n) => `(\n${clean(n.name)}\n${n.pins.map(clean).join("\n")}\n)`);
  return [...parts, ...nets].join("\n") + "\n";
}

const csv = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

export function toBomCsv(r: PcbResult): string {
  const rows = [["Designator", "Type", "Value", "Footprint", "Confidence"]];
  r.components.forEach((c) => rows.push([c.designator, c.type, c.value, c.footprint, c.confidence]));
  return rows.map((row) => row.map(csv).join(",")).join("\n") + "\n";
}

/** Altium pick-and-place style CSV (mm, origin bottom-left). */
export function toPickPlaceCsv(r: PcbResult): string {
  const { width_mm: W, height_mm: H } = r.board;
  const rows = [["Designator", "Footprint", "Center-X(mm)", "Center-Y(mm)", "Layer", "Rotation"]];
  r.components.forEach((c) =>
    rows.push([c.designator, c.footprint, ((c.x / 100) * W).toFixed(2), ((1 - c.y / 100) * H).toFixed(2), "TopLayer", "0"]),
  );
  return rows.map((row) => row.map(csv).join(",")).join("\n") + "\n";
}
