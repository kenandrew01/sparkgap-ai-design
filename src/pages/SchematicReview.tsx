import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload, FileText, Loader2, ShieldCheck, FileArchive, FileBox,
  FileSpreadsheet, ScanLine, FileWarning, Clock, BrainCircuit, ClipboardCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = [".schdoc", ".prjpcb", ".zip"];

const SUPPORTED = [
  { icon: FileBox, ext: ".SchDoc", label: "Altium Schematic", note: "Best results" },
  { icon: FileText, ext: ".PrjPcb", label: "Altium Project", note: "Best results" },
  { icon: FileArchive, ext: ".zip", label: "Archive with netlists, BOMs or text exports", note: ".net / .csv / .bom / .txt" },
];

const COMING_SOON = [
  { icon: ScanLine, ext: "Gerber", label: "Gerber & drill files" },
  { icon: FileText, ext: "PDF", label: "PDF schematics" },
  { icon: FileBox, ext: "KiCad", label: "KiCad projects" },
  { icon: FileSpreadsheet, ext: "XLSX", label: "Spreadsheets" },
];

const STEPS = [
  { icon: Upload, title: "1. Upload", text: "Drop your Altium schematic or project file." },
  { icon: BrainCircuit, title: "2. AI Review", text: "The AI reads your design and hunts for issues." },
  { icon: ClipboardCheck, title: "3. Report", text: "Get a verdict and issue list, sorted by severity." },
];

const SchematicReview = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const pick = (f: File | undefined | null) => {
    setError(null);
    if (!f) return;
    const lower = f.name.toLowerCase();
    if (!ALLOWED.some((e) => lower.endsWith(e))) {
      setError("Only .SchDoc, .PrjPcb or .zip files are allowed.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File is larger than 20 MB.");
      return;
    }
    setFile(f);
  };

  const submit = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data, error } = await supabase.functions.invoke("create-review-job", { body: fd });
      if (error) {
        let msg = "Upload failed. Please try again.";
        try {
          const body = await (error as { context?: Response }).context?.json();
          if (body?.error) msg = body.error;
        } catch { /* ignore */ }
        throw new Error(msg);
      }
      if (!data?.token) throw new Error("Upload failed. Please try again.");
      navigate(`/schematic-review/${data.token}`);
    } catch (e) {
      setError((e as Error).message);
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 pt-32 pb-20 max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
          Schematic <span className="gradient-text">Review</span>
        </h1>
        <p className="text-muted-foreground mb-10">
          Upload your Altium schematic or project and get an AI review of potential issues.
        </p>

        {/* How it works */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
          {STEPS.map((s) => (
            <div
              key={s.title}
              className="rounded-lg border border-border bg-card p-4 flex items-start gap-3"
            >
              <div className="rounded-md bg-primary/10 p-2 shrink-0">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); pick(e.dataTransfer.files?.[0]); }}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-12 text-center transition-colors bg-card ${
            dragOver ? "border-primary box-glow" : "border-border hover:border-primary/50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".SchDoc,.PrjPcb,.zip,.schdoc,.prjpcb"
            className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <FileText className="h-10 w-10 text-primary" />
              <p className="font-medium break-all">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Upload className="h-10 w-10 text-primary" />
              <p className="font-medium">Drop your file here or click to browse</p>
              <p className="text-sm text-muted-foreground">.SchDoc, .PrjPcb or .zip — max 20 MB</p>
            </div>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

        <Button
          onClick={submit}
          disabled={!file || uploading}
          className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90 box-glow"
          size="lg"
        >
          {uploading ? <><Loader2 className="h-4 w-4 animate-spin" /> Uploading…</> : "Start Review"}
        </Button>

        <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
          <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
          <p>Your design is used only for this review and deleted after 30 days. Keep your result link private.</p>
        </div>

        {/* Supported formats */}
        <section className="mt-14">
          <h2 className="text-xl font-semibold mb-1">What the AI can read</h2>
          <p className="text-sm text-muted-foreground mb-5">
            The reviewer extracts real design data from these formats and flags engineering issues.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {SUPPORTED.map((f) => (
              <div
                key={f.ext}
                className="rounded-xl border border-border bg-card p-5 flex flex-col items-center text-center gap-2"
              >
                <div className="rounded-lg bg-primary/10 p-3">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="rounded bg-primary/15 text-primary text-xs font-mono font-semibold px-2 py-0.5">
                  {f.ext}
                </span>
                <p className="font-medium text-sm leading-snug">{f.label}</p>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-500">
                  <ShieldCheck className="h-3.5 w-3.5" /> Supported — {f.note}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-6">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
              <Clock className="h-3.5 w-3.5" /> Coming soon
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {COMING_SOON.map((f) => (
                <div
                  key={f.ext}
                  className="rounded-lg border border-dashed border-border bg-muted/30 p-4 flex flex-col items-center text-center gap-2 opacity-70"
                >
                  <f.icon className="h-5 w-5 text-muted-foreground" />
                  <span className="rounded bg-muted text-muted-foreground text-xs font-mono px-2 py-0.5">
                    {f.ext}
                  </span>
                  <p className="text-xs text-muted-foreground leading-snug">{f.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
            <FileWarning className="h-5 w-5 text-primary shrink-0" />
            <p>
              Supported extensions don't guarantee readable design content — binary-only files like Gerbers or
              flattened PDFs contain no readable design data. If little usable data is found, the review will
              tell you instead of guessing.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SchematicReview;
