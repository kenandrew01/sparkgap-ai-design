import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Ruler, Sparkles, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Pad = {
  name: string; x_mm: number; y_mm: number; width_mm: number; height_mm: number;
  shape: "rect" | "round" | "oval"; layer: "top" | "bottom" | "through";
};
type Footprint = {
  component_name: string; package_type: string; summary: string;
  dimensions: { body_width_mm: number; body_length_mm: number; pitch_mm: number; overall_width_mm: number; overall_length_mm: number };
  pads: Pad[];
  courtyard: { width_mm: number; height_mm: number };
  silkscreen: string[];
  assembly_notes: string[];
  confidence: "high" | "medium" | "low";
};

const EXAMPLES = [
  "ESP32-WROOM-32 module",
  "QFN-48, 7x7mm body, 0.5mm pitch, exposed pad",
  "USB-C 16-pin mid-mount receptacle",
  "0805 resistor (imperial)",
  "SOIC-8, 1.27mm pitch",
  "BGA-256, 1.0mm pitch, 17x17mm",
];

const csv = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

function padsCsv(f: Footprint): string {
  const rows: (string | number)[][] = [["Pad", "X(mm)", "Y(mm)", "Width(mm)", "Height(mm)", "Shape", "Layer"]];
  f.pads.forEach((p) => rows.push([p.name, p.x_mm, p.y_mm, p.width_mm, p.height_mm, p.shape, p.layer]));
  return rows.map((r) => r.map(csv).join(",")).join("\n") + "\n";
}

/** Altium-importable pick-and-place style pad table. */
function altiumCsv(f: Footprint): string {
  const rows = [["Designator", "Pad", "Center-X(mm)", "Center-Y(mm)", "Shape", "Layer"]];
  f.pads.forEach((p) =>
    rows.push([f.component_name, p.name, p.x_mm.toFixed(3), p.y_mm.toFixed(3), p.shape, p.layer === "through" ? "Multi-Layer" : p.layer === "top" ? "TopLayer" : "BottomLayer"]),
  );
  return rows.map((r) => r.map(csv).join(",")).join("\n") + "\n";
}

function download(name: string, content: string, type = "text/csv") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

const FootprintPreview = ({ f }: { f: Footprint }) => {
  const { viewBox, scale } = useMemo(() => {
    const w = Math.max(f.courtyard.width_mm, f.dimensions.overall_width_mm, 1);
    const h = Math.max(f.courtyard.height_mm, f.dimensions.overall_length_mm, 1);
    const pad = Math.max(w, h) * 0.15;
    return { viewBox: `${-w / 2 - pad} ${-h / 2 - pad} ${w + pad * 2} ${h + pad * 2}`, scale: 1 };
  }, [f]);

  return (
    <svg viewBox={viewBox} className="w-full h-auto rounded-xl border border-border bg-background" role="img" aria-label="Footprint preview">
      {/* courtyard */}
      <rect x={-f.courtyard.width_mm / 2} y={-f.courtyard.height_mm / 2} width={f.courtyard.width_mm} height={f.courtyard.height_mm}
        fill="none" stroke="hsl(var(--muted-foreground))" strokeWidth={0.08 * scale} strokeDasharray="0.3 0.2" />
      {/* body / silkscreen */}
      <rect x={-f.dimensions.body_width_mm / 2} y={-f.dimensions.body_length_mm / 2} width={f.dimensions.body_width_mm} height={f.dimensions.body_length_mm}
        fill="none" stroke="hsl(var(--foreground))" strokeWidth={0.12 * scale} opacity={0.7} />
      {/* pads (SVG y is down, so flip) */}
      {f.pads.map((p) =>
        p.shape === "rect" ? (
          <rect key={p.name} x={p.x_mm - p.width_mm / 2} y={-p.y_mm - p.height_mm / 2} width={p.width_mm} height={p.height_mm}
            fill="hsl(var(--primary))" opacity={p.layer === "bottom" ? 0.45 : 0.9} rx={Math.min(p.width_mm, p.height_mm) * 0.15} />
        ) : (
          <ellipse key={p.name} cx={p.x_mm} cy={-p.y_mm} rx={p.width_mm / 2} ry={p.height_mm / 2}
            fill="hsl(var(--primary))" opacity={p.layer === "bottom" ? 0.45 : 0.9} />
        ),
      )}
      {/* pin 1 marker */}
      {f.pads[0] && <circle cx={f.pads[0].x_mm} cy={-f.pads[0].y_mm} r={Math.max(f.pads[0].width_mm, f.pads[0].height_mm) * 0.9}
        fill="none" stroke="hsl(var(--primary))" strokeWidth={0.1 * scale} />}
    </svg>
  );
};

const PcbFootprintAI = () => {
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Footprint | null>(null);
  const { toast } = useToast();

  const generate = async (text?: string) => {
    const desc = (text ?? description).trim();
    if (desc.length < 3) {
      toast({ title: "Describe the component first", description: "A part number, package type, or dimensions.", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-footprint`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ description: desc }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data || data.error) {
        setLoading(false);
        toast({ title: "Generation failed", description: data?.error ?? "Please try again.", variant: "destructive" });
        return;
      }
      setResult(data as Footprint);
    } catch (e) {
      toast({ title: "Generation failed", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto flex h-14 items-center gap-4 px-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold">PCB <span className="gradient-text">Footprint</span> AI</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-6xl flex-1">
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
            Generate a <span className="gradient-text text-glow">footprint</span> from a description
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Type a part number, package, or datasheet dimensions. The AI draws the land pattern to IPC-7351 —
            pads, courtyard and silkscreen — ready to export for Altium.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input */}
          <div>
            <div className="rounded-xl border border-border bg-card p-6 mb-6">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. STM32F103C8T6 in LQFP-48, 7x7mm body, 0.5mm pitch…"
                className="min-h-[120px] mb-4"
                maxLength={4000}
              />
              <Button onClick={() => generate()} disabled={loading} className="w-full box-glow" size="lg">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating footprint…</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate Footprint</>}
              </Button>
            </div>

            <h2 className="text-sm font-semibold mb-3 flex items-center gap-2"><Ruler className="h-4 w-4 text-primary" /> Try an example</h2>
            <div className="flex flex-wrap gap-2 mb-8">
              {EXAMPLES.map((ex) => (
                <button key={ex} onClick={() => { setDescription(ex); generate(ex); }} disabled={loading}
                  className="rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-50">
                  {ex}
                </button>
              ))}
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold mb-3">What you can describe</h2>
              <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
                <li>A part number — the AI uses the manufacturer's standard package.</li>
                <li>A package type — QFN, BGA, SOIC, SOT-23, 0402/0805, through-hole and more.</li>
                <li>Datasheet dimensions — body size, pitch, pin count, exposed pad.</li>
                <li>Connectors and modules — USB-C, board-to-board, ESP32/RF modules.</li>
              </ul>
              <p className="text-xs text-muted-foreground mt-4">
                Always verify critical dimensions against the manufacturer datasheet before production.
              </p>
            </div>
          </div>

          {/* Result */}
          <div>
            {loading && (
              <div className="rounded-xl border border-border bg-card p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
                <p className="text-muted-foreground">The AI is drawing the land pattern…</p>
              </div>
            )}
            {!loading && !result && (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
                <Zap className="h-10 w-10 text-muted-foreground/40 mb-4" />
                <p className="text-muted-foreground">Your generated footprint preview will appear here.</p>
              </div>
            )}
            {!loading && result && (
              <div className="space-y-6">
                <div className="rounded-xl border border-border bg-card p-6">
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                      <h2 className="text-xl font-bold">{result.component_name}</h2>
                      <p className="text-sm text-muted-foreground">{result.package_type} · {result.pads.length} pads · confidence: {result.confidence}</p>
                    </div>
                  </div>
                  <FootprintPreview f={result} />
                  <p className="text-sm text-muted-foreground mt-4">{result.summary}</p>
                </div>

                <div className="rounded-xl border border-border bg-card p-6">
                  <h3 className="font-semibold mb-3">Dimensions</h3>
                  <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    <div className="flex justify-between"><dt className="text-muted-foreground">Body</dt><dd>{result.dimensions.body_width_mm} × {result.dimensions.body_length_mm} mm</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Pitch</dt><dd>{result.dimensions.pitch_mm} mm</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Overall</dt><dd>{result.dimensions.overall_width_mm} × {result.dimensions.overall_length_mm} mm</dd></div>
                    <div className="flex justify-between"><dt className="text-muted-foreground">Courtyard</dt><dd>{result.courtyard.width_mm} × {result.courtyard.height_mm} mm</dd></div>
                  </dl>
                </div>

                {result.assembly_notes.length > 0 && (
                  <div className="rounded-xl border border-border bg-card p-6">
                    <h3 className="font-semibold mb-3">Assembly notes</h3>
                    <ul className="text-sm text-muted-foreground space-y-1.5 list-disc list-inside">
                      {result.assembly_notes.map((n, i) => <li key={i}>{n}</li>)}
                    </ul>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => download(`${result.component_name}-pads.csv`, padsCsv(result))}>
                    <Download className="mr-2 h-4 w-4" /> Pad table (CSV)
                  </Button>
                  <Button variant="outline" onClick={() => download(`${result.component_name}-altium.csv`, altiumCsv(result))}>
                    <Download className="mr-2 h-4 w-4" /> Altium import (CSV)
                  </Button>
                  <Button variant="outline" onClick={() => download(`${result.component_name}-footprint.json`, JSON.stringify(result, null, 2), "application/json")}>
                    <Download className="mr-2 h-4 w-4" /> JSON
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PcbFootprintAI;
