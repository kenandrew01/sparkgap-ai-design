import { Activity, GitCompare, Layers, AlertTriangle, TrendingUp, Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const items = [
  {
    icon: Layers,
    title: "Stack-ups and trace geometries",
    text: "Suggests stack-ups and trace geometries for your target impedance.",
  },
  {
    icon: AlertTriangle,
    title: "Issue detection",
    text: "Flags discontinuities, via stubs, poor return paths and potential coupling.",
  },
  {
    icon: GitCompare,
    title: "Differential pairs",
    text: "Helps optimise differential-pair length matching and via transitions.",
  },
  {
    icon: Activity,
    title: "Simulation feedback",
    text: "Analyses simulation results and proposes geometry changes.",
  },
];

const SignalIntegritySection = () => (
  <section className="py-24 bg-secondary/30">
    <div className="container mx-auto px-6 max-w-5xl">
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 rounded-full border border-glow bg-secondary/50 px-4 py-1.5 mb-6">
          <TrendingUp className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">High potential</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5">
          AI for <span className="gradient-text text-glow">RF and high-speed signal integrity</span>
        </h2>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          The rules that make RF and high-speed boards work are precise and easy to check — which makes them
          a natural fit for AI.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-6 text-left">
        {items.map((s) => (
          <div key={s.title} className="rounded-xl border border-border bg-card p-5 flex gap-4">
            <div className="rounded-md bg-primary/10 p-2 h-fit shrink-0">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-muted-foreground">{s.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-glow bg-card/60 p-5 flex gap-4">
        <div className="rounded-md bg-primary/10 p-2 h-fit shrink-0">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">Future direction</p>
          <p className="text-sm text-muted-foreground">
            AI could explore thousands of candidate layouts and rank them using electromagnetic simulation
            results.
          </p>
        </div>
      </div>

      <div className="flex justify-center mt-8">
        <Button asChild size="lg" className="gap-2">
          <Link to="/signal-integrity"><Upload className="h-4 w-4" /> Analyse My Design</Link>
        </Button>
      </div>
    </div>
  </section>
);

export default SignalIntegritySection;
