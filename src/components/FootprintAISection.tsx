import { Button } from "@/components/ui/button";
import { ExternalLink, LayoutGrid, Ruler, Sparkles } from "lucide-react";

const PCB_FOOTPRINT_URL = "https://ai-footprint-creator.lovable.app";

const steps = [
  { icon: Sparkles, title: "Describe the part", text: "Give the component name, datasheet details or a photo." },
  { icon: Ruler, title: "AI builds the footprint", text: "Pads, courtyard and silkscreen generated to the datasheet." },
  { icon: LayoutGrid, title: "Export to Altium", text: "Download the footprint library and drop it into your board." },
];

const FootprintAISection = () => (
  <section className="py-24 bg-secondary/30">
    <div className="container mx-auto px-6 max-w-6xl">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 rounded-full border border-glow bg-secondary/50 px-4 py-1.5 mb-6">
          <LayoutGrid className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">PCB Footprint AI</span>
        </div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5">
          Generate <span className="gradient-text text-glow">footprints</span> in seconds
        </h2>
        <p className="text-muted-foreground text-lg mb-8 max-w-2xl mx-auto">
          Tell the AI what component you need a footprint for and it draws one — pads, courtyard and silkscreen
          ready for Altium. No datasheet hunting, no manual pad editing.
        </p>
      </div>

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

      <div className="rounded-2xl border border-border bg-card p-2 shadow-2xl">
        <div className="overflow-hidden rounded-xl border border-border/60">
          <iframe
            src={PCB_FOOTPRINT_URL}
            title="PCB Footprint AI"
            className="h-[70vh] min-h-[520px] w-full border-0 bg-background"
            allow="clipboard-read; clipboard-write"
            loading="lazy"
          />
        </div>
      </div>

      <div className="mt-8 text-center">
        <Button size="lg" variant="outline" className="px-8 text-base" asChild>
          <a href={PCB_FOOTPRINT_URL} target="_blank" rel="noopener noreferrer">
            Open Footprint AI in a new tab
            <ExternalLink className="ml-2 h-4 w-4" />
          </a>
        </Button>
        <p className="mt-4 text-sm text-muted-foreground">
          Works right here — the tool above is the full PCB Footprint AI.
        </p>
      </div>
    </div>
  </section>
);

export default FootprintAISection;
