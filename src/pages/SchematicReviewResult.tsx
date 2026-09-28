import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, AlertTriangle, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

type Severity = "high" | "medium" | "low";
type Issue = { severity: Severity; location: string; description: string; suggestion: string };
type Report = { summary: string; verdict: "pass" | "needs_changes" | "fail"; issues: Issue[] };
type Job = { original_name: string; status: "pending" | "processing" | "done" | "failed"; report: Report | null; error: string | null };

const SEV_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
const SEV_CLASS: Record<string, string> = {
  high: "bg-destructive/15 text-destructive border-destructive/40",
  medium: "bg-primary/15 text-primary border-primary/40",
  low: "bg-muted text-muted-foreground border-border",
};
const VERDICT = {
  pass: { label: "Pass", icon: CheckCircle2, cls: "text-primary" },
  needs_changes: { label: "Needs changes", icon: AlertCircle, cls: "text-foreground" },
  fail: { label: "Fail", icon: XCircle, cls: "text-destructive" },
} as const;

const str = (v: unknown) => (typeof v === "string" ? v : v == null ? "" : String(v));

const SchematicReviewResult = () => {
  const { token } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      const { data, error } = await supabase.functions.invoke("get-review-job", { body: { token } });
      if (stopped) return;
      if (error) {
        let msg = "Could not load review.";
        try {
          const b = await (error as { context?: Response }).context?.json();
          if (b?.error) msg = b.error;
        } catch { /* ignore */ }
        setLoadError(msg);
        return;
      }
      setJob(data as Job);
      if (data?.status !== "done" && data?.status !== "failed") timer = setTimeout(poll, 5000);
    };
    poll();
    return () => { stopped = true; clearTimeout(timer); };
  }, [token]);

  const report = job?.report;
  const issues = Array.isArray(report?.issues)
    ? [...report!.issues].sort((a, b) => (SEV_ORDER[a?.severity] ?? 3) - (SEV_ORDER[b?.severity] ?? 3))
    : [];
  const verdict = report && VERDICT[report.verdict as keyof typeof VERDICT];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-6 pt-32 pb-20 max-w-3xl">
        <Link to="/schematic-review" className="text-sm text-muted-foreground hover:text-foreground">← New review</Link>
        <h1 className="text-4xl font-bold tracking-tight mt-4 mb-2">
          Schematic <span className="gradient-text">Review</span>
        </h1>
        {job && <p className="text-muted-foreground mb-8 break-all">{str(job.original_name)}</p>}

        {loadError && (
          <Card className="border-destructive/40"><CardContent className="p-6 text-destructive">{loadError}</CardContent></Card>
        )}

        {!loadError && (!job || job.status === "pending" || job.status === "processing") && (
          <Card className="border-glow box-glow">
            <CardContent className="p-10 flex flex-col items-center gap-4 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-lg">Your schematic is being reviewed, this takes a few minutes.</p>
            </CardContent>
          </Card>
        )}

        {job?.status === "failed" && (
          <Card className="border-destructive/40">
            <CardContent className="p-6 flex gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
              <p className="text-destructive whitespace-pre-wrap">{str(job.error) || "The review failed."}</p>
            </CardContent>
          </Card>
        )}

        {job?.status === "done" && report && (
          <div className="space-y-6">
            <Card className="border-glow box-glow">
              <CardContent className="p-6 space-y-3">
                {verdict && (
                  <div className={`flex items-center gap-2 text-xl font-semibold ${verdict.cls}`}>
                    <verdict.icon className="h-6 w-6" /> {verdict.label}
                  </div>
                )}
                <p className="text-muted-foreground whitespace-pre-wrap">{str(report.summary)}</p>
              </CardContent>
            </Card>

            <h2 className="text-2xl font-semibold">Issues ({issues.length})</h2>
            {issues.length === 0 && <p className="text-muted-foreground">No issues found.</p>}
            {issues.map((i, idx) => (
              <Card key={idx}>
                <CardContent className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className={`uppercase ${SEV_CLASS[i?.severity] ?? SEV_CLASS.low}`}>
                      {str(i?.severity)}
                    </Badge>
                    <span className="text-sm font-mono text-muted-foreground break-all">{str(i?.location)}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{str(i?.description)}</p>
                  {i?.suggestion && (
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      <span className="text-primary font-medium">Suggestion: </span>{str(i.suggestion)}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default SchematicReviewResult;
