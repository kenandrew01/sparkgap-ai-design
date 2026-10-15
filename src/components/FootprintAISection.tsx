import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutGrid, Ruler, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  { icon: Sparkles, title: "Describe the part", text: "Give the AI a component name, datasheet details or a photo." },
  { icon: Ruler, title: "AI builds the footprint", text: "Pads, courtyard and silkscreen generated to the datasheet." },
  { icon: LayoutGrid, title: "Export to Altium", text: "Download the footprint library and drop it into your board." },
];

const FootprintAISection = () => (
  <section className="py-24 bg-secondary/30">
    <div className="container mx-auto px-6 max-w-5xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-glow bg-secondary/50 px-4 py-1.5 mb-6">
        <LayoutGrid className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">PCB Footprint AI</span>
      </div>
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5">
        Generate <span className="gradient-text text-glow">footprints</span> in seconds
      </h2>
      <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
        Tell the AI what component you need a footprint for and it draws one — pads, courtyard and silkscreen,
        ready for Altium. No datasheet hunting, no manual pad editing.
      </p>
      <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left">
        {steps.map((s) => (
          <div key={s.title} className="rounded-xl border border-border bg-card p-5">
            <div className="rounded-md bg-primary/10 p-2 inline-flex mb-3">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-1">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
      <Button size="lg" className="box-glow px-10 text-base" asChild>
        <Link to="/footprint-ai">Open PCB Footprint AI <ArrowRight className="ml-2 h-4 w-4" /></Link>
      </Button>
    </div>
  </section>
);

export default FootprintAISection;
