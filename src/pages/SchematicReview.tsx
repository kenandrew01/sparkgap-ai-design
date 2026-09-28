import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, Loader2, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = [".schdoc", ".prjpcb", ".zip"];

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
      </main>
    </div>
  );
};

export default SchematicReview;
