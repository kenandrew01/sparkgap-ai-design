import { Button } from "@/components/ui/button";
import { ArrowRight, Camera, ScanLine, FileDown } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  { icon: Camera, title: "Snap a photo", text: "Upload a clear top-down image of any PCB." },
  { icon: ScanLine, title: "AI vision", text: "Identifies parts, values and traces the connections." },
  { icon: FileDown, title: "Import to Altium", text: "Download a netlist, parts list and placement file." },
];

const ReverseEngineerSection = () => (
  <section className="py-24 bg-secondary/30">
    <div className="container mx-auto px-6 max-w-5xl text-center">
      <div className="inline-flex items-center gap-2 rounded-full border border-glow bg-secondary/50 px-4 py-1.5 mb-6">
        <ScanLine className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">New — PCB Reverse Engineering</span>
      </div>
      <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5">
        Turn a <span className="gradient-text text-glow">PCB Photo</span> into an Altium Design
      </h2>
      <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
        Lost the design files? Upload a picture of the board and our AI rebuilds the parts list, connections and a rough layout.
      </p>
      <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left">
        {steps.map((s) => (
          <div key={s.title} className="rounded-xl border border-border bg-card p-5">
            <div className="rounded-md bg-primary/10 p-2 inline-flex mb-3"><s.icon className="h-5 w-5 text-primary" /></div>
            <h3 className="font-semibold mb-1">{s.title}</h3>
            <p className="text-sm text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
      <Button size="lg" className="box-glow px-10 text-base" asChild>
        <Link to="/reverse-engineer">Reverse Engineer a PCB <ArrowRight className="ml-2 h-4 w-4" /></Link>
      </Button>
    </div>
  </section>
);

export default ReverseEngineerSection;
