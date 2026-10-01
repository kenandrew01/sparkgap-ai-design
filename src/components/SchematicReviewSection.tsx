import { Button } from "@/components/ui/button";
import { ArrowRight, Upload, BrainCircuit, ClipboardCheck, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import schematicReviewBg from "@/assets/schematic-review-bg.jpg";

const bullets = [
  { icon: Upload, text: "Upload your Altium .SchDoc, .PrjPcb or .zip" },
  { icon: BrainCircuit, text: "AI reads your design and hunts for issues" },
  { icon: ClipboardCheck, text: "Get a verdict and issue list, sorted by severity" },
];

const SchematicReviewSection = () => {
  return (
    <section className="relative py-28 overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={schematicReviewBg}
          alt="AI scanning a PCB circuit board"
          loading="lazy"
          width={1920}
          height={1088}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-background/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      </div>

      <div className="container relative z-10 mx-auto px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-glow bg-secondary/50 px-4 py-1.5 mb-6">
            <BrainCircuit className="h-3.5 w-3.5 text-primary animate-pulse-glow" />
            <span className="text-xs font-medium text-muted-foreground">New — AI Schematic Review</span>
          </div>

          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-5">
            Let AI <span className="gradient-text text-glow">Review Your Schematic</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-10 max-w-2xl mx-auto">
            Upload your Altium schematic or project and get an engineering report in minutes —
            missing decoupling, reset circuits, power issues and more, flagged before they cost you a respin.
          </p>

          <div className="grid sm:grid-cols-3 gap-4 mb-10 text-left">
            {bullets.map((b) => (
              <div
                key={b.text}
                className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-4 flex items-start gap-3"
              >
                <div className="rounded-md bg-primary/10 p-2 shrink-0">
                  <b.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm leading-snug">{b.text}</p>
              </div>
            ))}
          </div>

          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 box-glow px-10 text-base" asChild>
            <Link to="/schematic-review">
              Review My Schematic
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>

          <p className="mt-5 text-xs text-muted-foreground inline-flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            Free · No sign-up · Files deleted after 30 days
          </p>
        </div>
      </div>
    </section>
  );
};

export default SchematicReviewSection;
