import { Upload, Cpu, Download } from "lucide-react";

const steps = [
  {
    icon: Upload,
    step: "01",
    title: "Upload Your Schematic",
    description: "Import your netlist or schematic from any popular EDA tool. We support KiCad, Altium, Eagle, and more.",
  },
  {
    icon: Cpu,
    step: "02",
    title: "AI Designs Your Board",
    description: "Our AI engine places components, routes traces, and optimizes your layout based on your constraints.",
  },
  {
    icon: Download,
    step: "03",
    title: "Export & Manufacture",
    description: "Download Gerber files, BOM, and pick-and-place data ready for your preferred PCB manufacturer.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Three simple steps from schematic to production-ready PCB.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.step} className="text-center relative">
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-12 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/40 to-transparent" />
              )}
              <div className="mx-auto mb-6 inline-flex h-24 w-24 items-center justify-center rounded-2xl border border-border bg-card">
                <step.icon className="h-10 w-10 text-primary" />
              </div>
              <div className="text-xs font-semibold text-primary mb-2">{step.step}</div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;