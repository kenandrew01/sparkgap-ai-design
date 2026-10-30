import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, CheckCircle2, Download, FileUp, History as HistoryIcon,
  Loader2, Send, TriangleAlert, ZoomIn, ZoomOut, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  DAILY_LIMIT, ExtractedPackage, FootprintJson, DensityLevel, Warning,
  bumpRateLimit, checkRateLimit, downloadFile, loadHistory, saveHistoryEntry,
  toKicadMod, validateFootprint, svgToDownload, HistoryEntry,
} from "@/lib/footprintGen";

type Stage = "idle" | "finding" | "reading" | "calculating" | "review";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;
const FN_HEADERS = {
  "Content-Type": "application/json",
  apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
};

const RANGE_FIELDS = ["overall_span_mm", "lead_width_mm", "lead_length_mm"] as const;

const EMPTY_EXTRACTED: ExtractedPackage = {
  part_number: null, manufacturer: null, datasheet_url: null, package_family: null,
  pin_count: null, pitch_mm: null, body_length_mm: null, body_width_mm: null,
  overall_span_mm: null, lead_width_mm: null, lead_length_mm: null,
  body_height_max_mm: null, exposed_pad: null, pin1_location: null,
  source_page: null, confidence: 0, notes: null, recommended_land_pattern: null,
};

// ---------- zoom/pan SVG preview ----------
const Preview = ({ f }: { f: FootprintJson }) => {
  const [view, setView] = useState({ cx: 0, cy: 0, scale: 30 }); // px per mm
  const drag = useRef<{ x: number; y: number } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const c = f.courtyard;
  const midX = c.x + c.width / 2, midY = c.y + c.height / 2;
  const W = 560, H = 420;

  const toSvg = (x: number, y: number) => ({
    x: W / 2 + (x - midX - view.cx) * view.scale,
    y: H / 2 - (y - midY - view.cy) * view.scale,
  });

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setView((v) => ({ ...v, scale: Math.min(300, Math.max(4, v.scale * (e.deltaY < 0 ? 1.15 : 0.87))) }));
  };
  const onPointerDown = (e: React.PointerEvent) => { drag.current = { x: e.clientX, y: e.clientY }; };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = (e.clientX - drag.current.x) / view.scale;
    const dy = (e.clientY - drag.current.y) / view.scale;
    drag.current = { x: e.clientX, y: e.clientY };
    setView((v) => ({ ...v, cx: v.cx - dx, cy: v.cy + dy }));
  };
  const onPointerUp = () => { drag.current = null; };

  const dimLabels = useMemo(() => {
    const p1 = toSvg(c.x, c.y + c.height);
    const p2 = toSvg(c.x + c.width, c.y + c.height);
    const p3 = toSvg(c.x, c.y);
    return { p1, p2, p3 };
  }, [c, view]);

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 touch-none select-none cursor-grab active:cursor-grabbing"
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        role="img"
        aria-label="Footprint preview"
      >
        {/* courtyard — yellow */}
        {(() => {
          const a = toSvg(c.x, c.y + c.height), b = toSvg(c.x + c.width, c.y);
          return <rect x={a.x} y={b.y} width={b.x - a.x} height={a.y - b.y} fill="none" stroke="#eab308" strokeWidth={1} strokeDasharray="5 3" />;
        })()}
        {/* silkscreen — white */}
        {f.silkscreen.map((l, i) => {
          const a = toSvg(l.x1, l.y1), b = toSvg(l.x2, l.y2);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#f8fafc" strokeWidth={1.5} />;
        })}
        {/* pads — copper red */}
        {f.pads.map((p) => {
          const a = toSvg(p.x - p.width / 2, p.y + p.height / 2);
          const w = p.width * view.scale, h = p.height * view.scale;
          const isPin1 = p.number === "1";
          return (
            <g key={p.number}>
              <rect x={a.x} y={a.y} width={w} height={h} fill="#c2410c" stroke="#fdba74" strokeWidth={isPin1 ? 2 : 0.5} rx={Math.min(w, h) * 0.12} />
              {w > 14 && h > 10 && (
                <text x={a.x + w / 2} y={a.y + h / 2} textAnchor="middle" dominantBaseline="central" fontSize={Math.min(11, h * 0.5)} fill="#fff7ed" fontFamily="monospace">
                  {p.number}
                </text>
              )}
            </g>
          );
        })}
        {/* pin 1 marker */}
        {f.pin1_marker && (() => {
          const m = toSvg(f.pin1_marker.x, f.pin1_marker.y);
          return <circle cx={m.x} cy={m.y} r={4} fill="none" stroke="#f8fafc" strokeWidth={1.5} />;
        })()}
        {/* dimension labels */}
        <text x={(dimLabels.p1.x + dimLabels.p2.x) / 2} y={dimLabels.p1.y + 16} textAnchor="middle" fontSize={11} fill="#94a3b8" fontFamily="monospace">
          {c.width.toFixed(2)} mm
        </text>
        <text x={dimLabels.p1.x - 8} y={(dimLabels.p1.y + dimLabels.p3.y) / 2} textAnchor="end" dominantBaseline="central" fontSize={11} fill="#94a3b8" fontFamily="monospace">
          {c.height.toFixed(2)} mm
        </text>
      </svg>
      <div className="absolute top-2 right-2 flex gap-1">
        <button aria-label="Zoom in" onClick={() => setView((v) => ({ ...v, scale: Math.min(300, v.scale * 1.3) }))} className="rounded bg-slate-800/80 p-1.5 text-slate-300 hover:text-white"><ZoomIn className="h-4 w-4" /></button>
        <button aria-label="Zoom out" onClick={() => setView((v) => ({ ...v, scale: Math.max(4, v.scale * 0.77) }))} className="rounded bg-slate-800/80 p-1.5 text-slate-300 hover:text-white"><ZoomOut className="h-4 w-4" /></button>
      </div>
      <p className="mt-1 text-xs text-slate-500">Scroll to zoom · drag to pan · courtyard {c.width.toFixed(2)} × {c.height.toFixed(2)} mm</p>
    </div>
  );
};

// ---------- editable field helpers ----------
const num = (s: string): number | null => {
  const v = parseFloat(s);
  return s.trim() === "" || Number.isNaN(v) ? null : v;
};

const FootprintGen = () => {
  const [stage, setStage] = useState<Stage>("idle");
  const [part, setPart] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [extracted, setExtracted] = useState<ExtractedPackage>(EMPTY_EXTRACTED);
  const [footprint, setFootprint] = useState<FootprintJson | null>(null);
  const [buildError, setBuildError] = useState<string | null>(null);
  const [density, setDensity] = useState<DensityLevel>("nominal");
  const [confirmed, setConfirmed] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>(() => loadHistory());
  const [showHistory, setShowHistory] = useState(false);
  const [queued, setQueued] = useState(false);
  const { toast } = useToast();
  const svgRef = useRef<HTMLDivElement>(null);

  const rate = checkRateLimit();

  const runExtract = async () => {
    if (!part.trim() && !pdfFile) {
      toast({ title: "Enter a part number or upload a datasheet", variant: "destructive" });
      return;
    }
    if (!rate.allowed) {
      toast({ title: `Daily limit reached (${DAILY_LIMIT}/day)`, description: "Try again tomorrow.", variant: "destructive" });
      return;
    }
    setBuildError(null);
    setFootprint(null);
    setConfirmed(false);
    setQueued(false);
    try {
      setStage(pdfFile ? "reading" : "finding");
      const body: Record<string, string> = {};
      if (part.trim()) body.part_number = part.trim();
      if (pdfFile) {
        const buf = await pdfFile.arrayBuffer();
        let bin = "";
        new Uint8Array(buf).forEach((b) => (bin += String.fromCharCode(b)));
        body.pdf_base64 = btoa(bin);
        body.filename = pdfFile.name;
      }
      const res = await fetch(`${FN_URL}/footprintgen-extract`, { method: "POST", headers: FN_HEADERS, body: JSON.stringify(body) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.error) {
        toast({ title: "Extraction failed", description: data?.error ?? "Please try again.", variant: "destructive" });
        setStage("idle");
        return;
      }
      bumpRateLimit();
      setExtracted({ ...EMPTY_EXTRACTED, ...data });
      await runBuild({ ...EMPTY_EXTRACTED, ...data }, density);
    } catch (err) {
      toast({ title: "Extraction failed", description: err instanceof Error ? err.message : "Please try again.", variant: "destructive" });
      setStage("idle");
    }
  };

  const runBuild = async (ext: ExtractedPackage, dens: DensityLevel) => {
    setStage("calculating");
    setBuildError(null);
    try {
      const res = await fetch(`${FN_URL}/footprintgen-build`, { method: "POST", headers: FN_HEADERS, body: JSON.stringify({ extracted: ext, density: dens }) });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.error) {
        setFootprint(null);
        setBuildError(data?.error ?? "Footprint build failed.");
      } else {
        setFootprint(data as FootprintJson);
        setBuildError(null);
      }
      setStage("review");
    } catch (err) {
      setBuildError(err instanceof Error ? err.message : "Footprint build failed.");
      setStage("review");
    }
  };

  const warnings: Warning[] = useMemo(
    () => (stage === "review" ? validateFootprint(extracted, footprint) : []),
    [stage, extracted, footprint],
  );
  const hasErrors = warnings.some((w) => w.level === "error");

  const setField = <K extends keyof ExtractedPackage>(key: K, value: ExtractedPackage[K]) =>
    setExtracted((e) => ({ ...e, [key]: value }));

  const setRange = (key: (typeof RANGE_FIELDS)[number], sub: "min" | "nom" | "max", value: number | null) =>
    setExtracted((e) => ({ ...e, [key]: { min: null, nom: null, max: null, ...(e[key] ?? {}), [sub]: value } }));

  const confirmAndSave = () => {
    const entry: HistoryEntry = {
      id: crypto.randomUUID(),
      at: Date.now(),
      part: extracted.part_number ?? part ?? "unknown",
      extracted,
      footprint,
    };
    saveHistoryEntry(entry);
    setHistory(loadHistory());
  };

  const sendToAltium = async () => {
    const { error } = await supabase.from("altium_jobs").insert({
      payload: JSON.parse(JSON.stringify({ extracted, footprint })),
      status: "pending",
    });
    if (error) {
      toast({ title: "Could not queue the job", description: error.message, variant: "destructive" });
    } else {
      setQueued(true);
      toast({ title: "Sent to Altium queue", description: "Status: pending." });
    }
  };

  const busy = stage === "finding" || stage === "reading" || stage === "calculating";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* header */}
      <div className="border-b border-slate-200 bg-white/90 backdrop-blur sticky top-0 z-10">
        <div className="container mx-auto flex h-14 items-center gap-4 px-6">
          <Link to="/" className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors">
            <ArrowLeft className="h-4 w-4" /><span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            <span className="font-semibold">Footprint<span className="text-orange-600">Gen</span></span>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-xs text-slate-500 font-mono">{rate.used}/{DAILY_LIMIT} today</span>
            <Button variant="outline" size="sm" onClick={() => setShowHistory((s) => !s)}>
              <HistoryIcon className="mr-2 h-4 w-4" /> History
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 max-w-6xl">
        {/* input */}
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
          <h1 className="text-2xl font-bold mb-1">Generate a PCB footprint from a part number</h1>
          <p className="text-sm text-slate-500 mb-5">e.g. LM358DR, STM32F103C8T6, 0603 resistor — or upload the datasheet PDF.</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              value={part}
              onChange={(e) => setPart(e.target.value)}
              placeholder="Enter part number"
              className="font-mono"
              onKeyDown={(e) => e.key === "Enter" && !busy && runExtract()}
            />
            <label className="flex items-center gap-2 rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-600 cursor-pointer hover:bg-slate-50 whitespace-nowrap">
              <FileUp className="h-4 w-4" />
              {pdfFile ? pdfFile.name : "Upload datasheet PDF"}
              <input
                type="file" accept="application/pdf" className="hidden"
                onChange={(e) => setPdfFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <Button onClick={runExtract} disabled={busy} className="bg-orange-600 hover:bg-orange-700 text-white whitespace-nowrap">
              {busy ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Working…</> : "Generate"}
            </Button>
          </div>

          {busy && (
            <div className="mt-5 flex items-center gap-3 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
              {stage === "finding" && "Finding part…"}
              {stage === "reading" && "Reading datasheet…"}
              {stage === "calculating" && "Calculating land pattern…"}
            </div>
          )}

          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-slate-500">Density level:</span>
            {(["most", "nominal", "least"] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDensity(d)}
                className={`rounded-full border px-3 py-1 text-xs capitalize transition-colors ${density === d ? "border-orange-600 bg-orange-50 text-orange-700" : "border-slate-300 text-slate-500 hover:border-slate-400"}`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        {/* history panel */}
        {showHistory && (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm mb-8">
            <h2 className="font-semibold mb-3">Previous generations (this browser)</h2>
            {history.length === 0 && <p className="text-sm text-slate-500">Nothing yet.</p>}
            <ul className="divide-y divide-slate-100">
              {history.map((h) => (
                <li key={h.id} className="py-2 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-mono text-sm">{h.part}</span>
                    <span className="ml-3 text-xs text-slate-400">{new Date(h.at).toLocaleString()}</span>
                  </div>
                  <Button
                    variant="outline" size="sm"
                    onClick={() => { setExtracted(h.extracted); setFootprint(h.footprint); setStage("review"); setShowHistory(false); setConfirmed(false); }}
                  >
                    Open
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* review screen */}
        {stage === "review" && (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* left: editable extracted data */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-semibold mb-4">Extracted package data</h2>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <label className="block">
                  <span className="text-xs text-slate-500">Part number</span>
                  <Input className="font-mono" value={extracted.part_number ?? ""} onChange={(e) => setField("part_number", e.target.value || null)} />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">Manufacturer</span>
                  <Input value={extracted.manufacturer ?? ""} onChange={(e) => setField("manufacturer", e.target.value || null)} />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">Package family</span>
                  <select
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    value={extracted.package_family ?? ""}
                    onChange={(e) => setField("package_family", (e.target.value || null) as ExtractedPackage["package_family"])}
                  >
                    <option value="">—</option>
                    {["SOIC", "SOP", "TSSOP", "QFN", "DFN", "SOT-23", "CHIP"].map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">Pin count</span>
                  <Input type="number" className="font-mono" value={extracted.pin_count ?? ""} onChange={(e) => setField("pin_count", e.target.value ? parseInt(e.target.value) : null)} />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">Pitch (mm)</span>
                  <Input type="number" step="0.05" className="font-mono" value={extracted.pitch_mm ?? ""} onChange={(e) => setField("pitch_mm", num(e.target.value))} />
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">Body L × W (mm)</span>
                  <div className="flex gap-2">
                    <Input type="number" step="0.1" className="font-mono" value={extracted.body_length_mm ?? ""} onChange={(e) => setField("body_length_mm", num(e.target.value))} />
                    <Input type="number" step="0.1" className="font-mono" value={extracted.body_width_mm ?? ""} onChange={(e) => setField("body_width_mm", num(e.target.value))} />
                  </div>
                </label>
                {RANGE_FIELDS.map((key) => (
                  <label key={key} className="block col-span-2">
                    <span className="text-xs text-slate-500">{key.replace(/_mm$/, "").replace(/_/g, " ")} (mm) — min / nom / max</span>
                    <div className="flex gap-2">
                      {(["min", "nom", "max"] as const).map((sub) => (
                        <Input
                          key={sub} type="number" step="0.01" placeholder={sub} className="font-mono"
                          value={extracted[key]?.[sub] ?? ""}
                          onChange={(e) => setRange(key, sub, num(e.target.value))}
                        />
                      ))}
                    </div>
                  </label>
                ))}
                <label className="block">
                  <span className="text-xs text-slate-500">Exposed pad L × W (mm)</span>
                  <div className="flex gap-2">
                    <Input type="number" step="0.1" className="font-mono" value={extracted.exposed_pad?.length_mm ?? ""} onChange={(e) => setField("exposed_pad", e.target.value ? { length_mm: num(e.target.value)!, width_mm: extracted.exposed_pad?.width_mm ?? 0 } : null)} />
                    <Input type="number" step="0.1" className="font-mono" value={extracted.exposed_pad?.width_mm ?? ""} onChange={(e) => setField("exposed_pad", e.target.value ? { length_mm: extracted.exposed_pad?.length_mm ?? 0, width_mm: num(e.target.value)! } : null)} />
                  </div>
                </label>
                <label className="block">
                  <span className="text-xs text-slate-500">Pin 1 location</span>
                  <Input value={extracted.pin1_location ?? ""} onChange={(e) => setField("pin1_location", e.target.value || null)} />
                </label>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                {extracted.datasheet_url && (
                  <a href={extracted.datasheet_url} target="_blank" rel="noreferrer" className="text-orange-600 underline">Source datasheet</a>
                )}
                {extracted.source_page != null && <span>page {extracted.source_page}</span>}
                <span className="font-mono">confidence {extracted.confidence.toFixed(2)}</span>
              </div>
              {extracted.notes && <p className="mt-2 text-xs text-slate-500">{extracted.notes}</p>}

              <Button
                variant="outline" className="mt-5 w-full" disabled={busy}
                onClick={() => runBuild(extracted, density)}
              >
                Recalculate land pattern
              </Button>
            </div>

            {/* right: preview + warnings + confirm */}
            <div className="space-y-4">
              <div ref={svgRef} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                {footprint ? <Preview f={footprint} /> : (
                  <div className="rounded-lg border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">
                    {buildError ?? "No footprint could be calculated for this package family."}
                  </div>
                )}
                {footprint && (
                  <p className="mt-2 text-xs text-slate-500">
                    {footprint.name} · {footprint.pads.length} pads · {footprint.source === "manufacturer_recommended" ? "manufacturer recommended land pattern" : `IPC-7351B calculated (${footprint.density})`}
                  </p>
                )}
              </div>

              {warnings.length > 0 && (
                <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                  <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><TriangleAlert className="h-4 w-4 text-amber-500" /> Warnings</h3>
                  <ul className="space-y-1.5 text-sm">
                    {warnings.map((w, i) => (
                      <li key={i} className={w.level === "error" ? "text-red-600" : "text-amber-600"}>{w.message}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <label className={`flex items-start gap-3 text-sm ${hasErrors ? "opacity-50" : ""}`}>
                  <Checkbox
                    checked={confirmed}
                    disabled={hasErrors || !footprint}
                    onCheckedChange={(v) => setConfirmed(v === true)}
                    className="mt-0.5"
                  />
                  I verified these dimensions against the datasheet.
                </label>
                {hasErrors && <p className="mt-1 text-xs text-red-600">Fix the red warnings above before confirming.</p>}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="sm" disabled={!confirmed || !footprint}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                    onClick={() => { confirmAndSave(); downloadFile(`${footprint!.name}.kicad_mod`, toKicadMod(footprint!, extracted.part_number ?? ""), "text/plain"); }}
                  >
                    <Download className="mr-2 h-4 w-4" /> KiCad .kicad_mod
                  </Button>
                  <Button
                    size="sm" variant="outline" disabled={!confirmed}
                    onClick={() => { confirmAndSave(); downloadFile(`${extracted.part_number ?? "footprint"}-spec.json`, JSON.stringify({ extracted, footprint }, null, 2), "application/json"); }}
                  >
                    <Download className="mr-2 h-4 w-4" /> JSON
                  </Button>
                  <Button
                    size="sm" variant="outline" disabled={!confirmed || !footprint}
                    onClick={() => {
                      const svg = svgRef.current?.querySelector("svg");
                      if (svg) { confirmAndSave(); downloadFile(`${footprint!.name}.svg`, svgToDownload(svg), "image/svg+xml"); }
                    }}
                  >
                    <Download className="mr-2 h-4 w-4" /> SVG
                  </Button>
                  <Button size="sm" variant="outline" disabled={!confirmed || queued} onClick={sendToAltium}>
                    {queued ? <><CheckCircle2 className="mr-2 h-4 w-4 text-green-600" /> Queued</> : <><Send className="mr-2 h-4 w-4" /> Send to Altium queue</>}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="mt-10 text-center text-xs text-slate-400">
          Verify every footprint against the manufacturer datasheet before fabrication.
        </p>
      </div>
    </div>
  );
};

export default FootprintGen;
