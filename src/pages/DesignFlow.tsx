import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, Cpu, CheckCircle, ArrowLeft, Zap, Layers, AlertTriangle, RotateCcw, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import pcbPreview from "@/assets/pcb-preview.jpg";

type Stage = "upload" | "uploading" | "processing" | "complete";

interface ProcessStep {
  label: string;
  icon: React.ReactNode;
  duration: number; // ms
}

const PROCESS_STEPS: ProcessStep[] = [
  { label: "Parsing netlist & extracting components", icon: <FileText className="h-4 w-4" />, duration: 2000 },
  { label: "Placing components with AI optimization", icon: <Cpu className="h-4 w-4" />, duration: 3000 },
  { label: "Auto-routing traces (multi-layer)", icon: <Layers className="h-4 w-4" />, duration: 4000 },
  { label: "Running design rule checks", icon: <AlertTriangle className="h-4 w-4" />, duration: 2000 },
  { label: "Generating final layout", icon: <Zap className="h-4 w-4" />, duration: 1500 },
];

const DesignFlow = () => {
  const [stage, setStage] = useState<Stage>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);
  const [previewOpacity, setPreviewOpacity] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const handleFile = useCallback((f: File) => {
    setFile(f);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, [handleFile]);

  const startProcessing = async () => {
    if (!file) return;
    setUploading(true);

    // Upload to cloud storage
    const filePath = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage
      .from("pcb-uploads")
      .upload(filePath, file);

    if (error) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    toast({ title: "File uploaded", description: "Starting AI design process…" });
    setUploading(false);
    setStage("processing");
    setCurrentStep(0);
    setStepProgress(0);
    setPreviewOpacity(0);
  };

  const reset = () => {
    setStage("upload");
    setFile(null);
    setCurrentStep(0);
    setStepProgress(0);
    setPreviewOpacity(0);
  };

  // Simulate AI processing steps
  useEffect(() => {
    if (stage !== "processing") return;
    if (currentStep >= PROCESS_STEPS.length) {
      setStage("complete");
      setPreviewOpacity(1);
      return;
    }

    const duration = PROCESS_STEPS[currentStep].duration;
    const interval = 50;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setStepProgress(pct);
      // Gradually reveal preview
      const overallPct = ((currentStep + pct / 100) / PROCESS_STEPS.length);
      setPreviewOpacity(overallPct * 0.85);

      if (elapsed >= duration) {
        clearInterval(timer);
        setCurrentStep((s) => s + 1);
        setStepProgress(0);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [stage, currentStep]);

  const overallProgress = stage === "complete"
    ? 100
    : stage === "processing"
      ? ((currentStep + stepProgress / 100) / PROCESS_STEPS.length) * 100
      : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center gap-4 px-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold">Spark<span className="gradient-text">gap</span>.AI — Design Studio</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10">
        {stage === "upload" && (
          <div className="mx-auto max-w-2xl space-y-8">
            <div className="text-center space-y-2">
              <h1 className="text-3xl font-bold">Upload Your Design</h1>
              <p className="text-muted-foreground">Upload a netlist (.net) or schematic (.kicad_sch, .sch) to begin AI-powered PCB layout.</p>
            </div>

            {/* Drop zone */}
            <div
              className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-all cursor-pointer ${
                dragOver ? "border-primary bg-primary/5 box-glow" : file ? "border-primary/50 bg-secondary/30" : "border-border hover:border-muted-foreground"
              }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input
                id="file-input"
                type="file"
                className="hidden"
                accept=".net,.kicad_sch,.sch,.csv,.json"
                onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
              />
              {file ? (
                <div className="space-y-3">
                  <FileText className="mx-auto h-12 w-12 text-primary" />
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="font-medium text-foreground">Drag & drop your file here</p>
                  <p className="text-sm text-muted-foreground">or click to browse · .net, .sch, .kicad_sch, .csv, .json</p>
                </div>
              )}
            </div>

            <div className="flex justify-center">
              <Button
                size="lg"
                disabled={!file || uploading}
                onClick={startProcessing}
                className="bg-primary text-primary-foreground hover:bg-primary/90 box-glow px-10"
              >
                {uploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Zap className="mr-2 h-4 w-4" />
                )}
                {uploading ? "Uploading…" : "Start AI Design"}
              </Button>
            </div>
          </div>
        )}

        {(stage === "processing" || stage === "complete") && (
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left: progress */}
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {stage === "complete" ? "Design Complete" : "AI Designing…"}
                </h2>
                <p className="text-sm text-muted-foreground">{file?.name}</p>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Overall progress</span>
                  <span className="font-medium">{Math.round(overallProgress)}%</span>
                </div>
                <Progress value={overallProgress} className="h-2" />
              </div>

              <div className="space-y-3">
                {PROCESS_STEPS.map((step, i) => {
                  const done = i < currentStep || stage === "complete";
                  const active = i === currentStep && stage === "processing";
                  return (
                    <Card key={i} className={`transition-all ${active ? "border-primary/50 box-glow" : done ? "border-primary/20 bg-secondary/20" : "opacity-40"}`}>
                      <CardContent className="flex items-center gap-3 p-4">
                        <div className={`rounded-full p-2 ${done ? "bg-primary/20 text-primary" : active ? "bg-primary/10 text-primary animate-pulse" : "bg-muted text-muted-foreground"}`}>
                          {done ? <CheckCircle className="h-4 w-4" /> : step.icon}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{step.label}</p>
                          {active && <Progress value={stepProgress} className="mt-2 h-1" />}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {stage === "complete" && (
                <div className="flex gap-3 pt-2">
                  <Button className="bg-primary text-primary-foreground hover:bg-primary/90 box-glow">
                    Export Gerber Files
                  </Button>
                  <Button variant="outline" onClick={reset}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    New Design
                  </Button>
                </div>
              )}
            </div>

            {/* Right: PCB preview */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">PCB Layout Preview</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative aspect-[4/3] bg-background">
                  {/* Grid pattern background */}
                  <div className="absolute inset-0" style={{
                    backgroundImage: "radial-gradient(circle, hsl(var(--muted-foreground) / 0.15) 1px, transparent 1px)",
                    backgroundSize: "20px 20px",
                  }} />
                  {/* PCB image fading in */}
                  <img
                    src={pcbPreview}
                    alt="AI-generated PCB layout preview"
                    className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700"
                    style={{ opacity: previewOpacity }}
                    loading="lazy"
                    width={1024}
                    height={768}
                  />
                  {stage === "processing" && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                    </div>
                  )}
                  {stage === "complete" && (
                    <div className="absolute bottom-3 right-3 rounded-md bg-primary/90 px-3 py-1.5 text-xs font-medium text-primary-foreground">
                      ✓ Design Ready
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesignFlow;