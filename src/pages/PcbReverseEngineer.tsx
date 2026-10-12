import { useRef, useState } from "react";
import { Upload, Loader2, ScanLine, Download, Cpu, Network, AlertTriangle, ImageIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PcbResult, toBomCsv, toPickPlaceCsv, toProtelNetlist } from "@/lib/pcbExport";

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];

const download = (name: string, text: string) => {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
};

const confClass = { high: "border-primary", medium: "border-primary/60", low: "border-destructive/70" };

const PcbReverseEngineer = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [image, setImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PcbResult | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const pick = (f?: File | null) => {
    setError(null); setResult(null);
    if (!f) return;
    if (!TYPES.includes(f.type)) return setError("Please upload a JPG, PNG or WEBP image.");
    if (f.size > MAX_BYTES) return setError("Image must be under 8 MB.");
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(f);
  };

  const analyse = async () => {
    if (!image) return;
    setLoading(true); setError(null); setResult(null);
    const { data, error } = await supabase.functions.invoke("reverse-engineer-pcb", { body: { image } });
    setLoading(false);
    if (error) {
      let msg = "Analysis failed. Please try again.";
      try { msg = (await (error as { context?: Response }).context?.json())?.error ?? msg; } catch { /* ignore */ }
      return setError(msg);
    }
    if (data?.error) return setError(data.error);
    setResult(data as PcbResult);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 pt-28 pb-20 max-w-6xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-glow bg-secondary/50 px-4 py-1.5 mb-5">
            <ScanLine className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">AI Vision Reverse Engineering</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            PCB Photo to <span className="gradient-text">Altium</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload a clear, top-down photo of a circuit board. The AI identifies the parts, traces the connections and
            gives you a netlist, parts list and placement file you can import into Altium, plus a rough layout preview.
          </p>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-border hover:border-glow bg-card p-8 text-center transition-colors"
        >
          <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
            onChange={(e) => pick(e.target.files?.[0])} />
          {image ? (
            <img src={image} alt="Uploaded PCB" className="mx-auto max-h-80 rounded-lg" />
          ) : (
            <div className="py-8">
              <Upload className="h-10 w-10 text-primary mx-auto mb-3" />
              <p className="font-medium">Drop a PCB photo here or click to choose</p>
              <p className="text-sm text-muted-foreground mt-1">JPG, PNG or WEBP, up to 8 MB</p>
            </div>
          )}
        </div>

        <div className="flex justify-center mt-6">
          <Button size="lg" disabled={!image || loading} onClick={analyse} className="box-glow px-10">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Analysing board… (up to 2 min)</> : <><ScanLine className="h-4 w-4 mr-2" />Reverse Engineer</>}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center mt-3">
          Your image is analysed once and not stored. Results are AI estimates — always verify before manufacturing.
        </p>

        {error && (
          <div className="mt-6 rounded-xl border border-destructive/50 bg-destructive/10 p-4 text-sm flex gap-2">
            <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />{error}
          </div>
        )}

        {result && (
          <div className="mt-12 space-y-8">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-semibold mb-2">Summary</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{result.summary}</p>
              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                <span><Cpu className="inline h-4 w-4 text-primary mr-1" />{result.components.length} parts</span>
                <span><Network className="inline h-4 w-4 text-primary mr-1" />{result.nets.length} nets</span>
                <span>≈ {result.board.width_mm} × {result.board.height_mm} mm</span>
                <span>{result.board.layers_visible}</span>
              </div>
              <div className="flex flex-wrap gap-3 mt-6">
                <Button variant="secondary" onClick={() => download("reverse-engineered.NET", toProtelNetlist(result))}>
                  <Download className="h-4 w-4 mr-2" />Netlist (.NET for Altium)
                </Button>
                <Button variant="secondary" onClick={() => download("bom.csv", toBomCsv(result))}>
                  <Download className="h-4 w-4 mr-2" />Parts list (CSV)
                </Button>
                <Button variant="secondary" onClick={() => download("pick-place.csv", toPickPlaceCsv(result))}>
                  <Download className="h-4 w-4 mr-2" />Placement (CSV)
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                In Altium: create a PCB project, then Design → Import Netlist to load the parts and connections.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" />Rough layout preview</h2>
                <div className="relative w-full rounded-lg border border-glow bg-secondary/40 overflow-hidden"
                  style={{ aspectRatio: `${result.board.width_mm || 1} / ${result.board.height_mm || 1}` }}>
                  {result.components.map((c) => (
                    <div key={c.designator}
                      onMouseEnter={() => setHover(c.designator)} onMouseLeave={() => setHover(null)}
                      title={`${c.designator} · ${c.value} · ${c.footprint}`}
                      className={`absolute flex items-center justify-center rounded-sm border bg-card/80 text-[10px] font-mono ${confClass[c.confidence]} ${hover === c.designator ? "bg-primary/30" : ""}`}
                      style={{
                        left: `${Math.max(0, c.x - c.w / 2)}%`, top: `${Math.max(0, c.y - c.h / 2)}%`,
                        width: `${Math.max(c.w, 2)}%`, height: `${Math.max(c.h, 2)}%`,
                      }}>
                      {c.designator}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">Approximate placement only. Red outlines are low-confidence guesses.</p>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 max-h-[560px] overflow-auto">
                <h2 className="text-xl font-semibold mb-4">Components</h2>
                <table className="w-full text-sm">
                  <thead className="text-muted-foreground text-left"><tr><th className="pb-2">Ref</th><th>Type</th><th>Value</th><th>Footprint</th></tr></thead>
                  <tbody>
                    {result.components.map((c) => (
                      <tr key={c.designator} onMouseEnter={() => setHover(c.designator)} onMouseLeave={() => setHover(null)}
                        className={`border-t border-border ${hover === c.designator ? "bg-secondary" : ""}`}>
                        <td className="py-1.5 font-mono">{c.designator}</td><td>{c.type}</td><td>{c.value}</td><td>{c.footprint}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-border bg-card p-6 max-h-96 overflow-auto">
                <h2 className="text-xl font-semibold mb-4">Nets</h2>
                <ul className="space-y-2 text-sm">
                  {result.nets.map((n) => (
                    <li key={n.name}><span className="font-mono text-primary">{n.name}</span>: <span className="text-muted-foreground">{n.pins.join(", ")}</span></li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Notes & assumptions</h2>
                <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                  {result.notes.map((n, i) => <li key={i}>{n}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PcbReverseEngineer;
