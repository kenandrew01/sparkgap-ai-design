import { useRef, useState } from "react";
import { Upload, Loader2, Activity, Layers, GitCompare, AlertTriangle, FileText, TrendingUp } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 2 * 1024 * 1024;
const EXTS = [".txt", ".csv", ".md", ".json", ".net", ".stackup", ".s1p", ".s2p", ".s4p"];

interface SiResult {
  summary: string;
  verdict: "pass" | "needs_changes" | "fail";
  stackup: { layers: string; assessment: string; suggestions: string[] };
  differential_pairs: { name: string; assessment: string; suggestion: string }[];
  issues: { severity: "high" | "medium" | "low"; location: string; description: string; suggestion: string }[];
  simulation_feedback: string[];
}

const verdictStyle: Record<SiResult["verdict"], string> = {
  pass: "text-primary border-primary",
  needs_changes: "text-yellow-400 border-yellow-400/60",
  fail: "text-destructive border-destructive",
};
const verdictLabel = { pass: "Pass", needs_changes: "Needs changes", fail: "Fail" };
const sevOrder = { high: 0, medium: 1, low: 2 };
const sevStyle = {
  high: "border-destructive/70 text-destructive",
  medium: "border-yellow-400/60 text-yellow-400",
  low: "border-primary/60 text-primary",
};

const SignalIntegrity = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; content: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SiResult | null>(null);

  const pick = (f?: File | null) => {
    setError(null); setResult(null);
    if (!f) return;
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!EXTS.includes(ext)) return setError(`Please upload a text-based file: ${EXTS.join(", ")}.`);
    if (f.size > MAX_BYTES) return setError("File must be under 2 MB.");
    const reader = new FileReader();
    reader.onload = () => setFile({ name: f.name, content: reader.result as string });
    reader.onerror = () => setError("Could not read that file.");
    reader.readAsText(f);
  };

  const analyse = async () => {
    if (!file) return;
    setLoading(true); setError(null); setResult(null);
    const { data, error } = await supabase.functions.invoke("analyze-signal-integrity", {
      body: { fileName: file.name, content: file.content },
    });
    setLoading(false);
    if (error) {
      let msg = "Analysis failed. Please try again.";
      try { msg = (await (error as { context?: Response }).context?.json())?.error ?? msg; } catch { /* ignore */ }
      return setError(msg);
    }
    if (data?.error) return setError(data.error);
    setResult(data as SiResult);
  };

  const issues = result ? [...result.issues].sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]) : [];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 pt-28 pb-20 max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-glow bg-secondary/50 px-4 py-1.5 mb-5">
            <Activity className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">AI Signal Integrity Analysis</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            RF &amp; High-Speed <span className="gradient-text">Signal Integrity</span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Upload a text file describing your stack-up, impedance targets, differential pairs or simulation results
            (CSV, Touchstone, netlist, notes). The AI checks your stack-up and trace geometry, flags discontinuities
            and poor return paths, and gives simulation feedback with concrete geometry changes.
          </p>
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); pick(e.dataTransfer.files?.[0]); }}
          className="cursor-pointer rounded-2xl border-2 border-dashed border-border hover:border-glow bg-card p-8 text-center transition-colors"
        >
          <input ref={inputRef} type="file" accept={EXTS.join(",")} className="hidden"
            onChange={(e) => pick(e.target.files?.[0])} />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div className="text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">{(file.content.length / 1024).toFixed(1)} KB of text — click to replace</p>
              </div>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-primary mx-auto mb-3" />
              <p className="font-medium mb-1">Drop your design file here, or click to browse</p>
              <p className="text-sm text-muted-foreground">
                Stack-up tables, impedance calcs, diff-pair rules, netlists or simulation exports — {EXTS.join(", ")} (max 2 MB)
              </p>
            </>
          )}
        </div>

        <div className="flex justify-center mt-6">
          <Button onClick={analyse} disabled={!file || loading} size="lg" className="gap-2">
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Analysing…</> : <><Activity className="h-4 w-4" /> Analyse My Design</>}
          </Button>
        </div>
        {loading && (
          <p className="text-center text-sm text-muted-foreground mt-3">
            The AI is reviewing your stack-up, differential pairs and simulation data — this can take a minute.
          </p>
        )}
        {error && <p className="text-center text-sm text-destructive mt-4">{error}</p>}

        {result && (
          <div className="mt-12 space-y-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between gap-4 flex-wrap mb-3">
                <h2 className="text-xl font-semibold">Analysis result</h2>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${verdictStyle[result.verdict]}`}>
                  {verdictLabel[result.verdict]}
                </span>
              </div>
              <p className="text-muted-foreground whitespace-pre-wrap">{result.summary}</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Stack-up</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2 whitespace-pre-wrap">{result.stackup.layers}</p>
              <p className="text-sm mb-3 whitespace-pre-wrap">{result.stackup.assessment}</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                {result.stackup.suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>

            {result.differential_pairs.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="flex items-center gap-2 mb-3">
                  <GitCompare className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Differential pairs</h3>
                </div>
                <div className="space-y-4">
                  {result.differential_pairs.map((dp, i) => (
                    <div key={i} className="rounded-lg border border-border bg-secondary/30 p-4">
                      <p className="font-medium text-sm mb-1">{dp.name}</p>
                      <p className="text-sm text-muted-foreground mb-1 whitespace-pre-wrap">{dp.assessment}</p>
                      <p className="text-sm whitespace-pre-wrap">{dp.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {issues.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Issues found</h3>
                </div>
                <div className="space-y-3">
                  {issues.map((iss, i) => (
                    <div key={i} className="rounded-xl border border-border bg-card p-5">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold uppercase ${sevStyle[iss.severity]}`}>
                          {iss.severity}
                        </span>
                        <span className="text-sm font-medium">{iss.location}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1 whitespace-pre-wrap">{iss.description}</p>
                      <p className="text-sm whitespace-pre-wrap">{iss.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.simulation_feedback.length > 0 && (
              <div className="rounded-2xl border border-glow bg-card/60 p-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold">Simulation feedback</h3>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {result.simulation_feedback.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SignalIntegrity;
