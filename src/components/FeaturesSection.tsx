import { Brain, Cpu, Shield, Zap, Layers, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Auto-Routing",
    description: "Intelligent trace routing that optimizes signal integrity, power delivery, and thermal performance automatically.",
  },
  {
    icon: Shield,
    title: "DRC in Real-Time",
    description: "Catch design rule violations as you work. No more waiting until the end to find critical errors.",
  },
  {
    icon: Cpu,
    title: "Component Placement",
    description: "AI suggests optimal component placement based on electrical constraints and manufacturing requirements.",
  },
  {
    icon: Zap,
    title: "10x Faster Iteration",
    description: "Go from schematic to production-ready board in hours instead of weeks with AI-assisted workflows.",
  },
  {
    icon: Layers,
    title: "Multi-Layer Support",
    description: "Design complex multi-layer boards with intelligent stack-up recommendations and impedance control.",
  },
  {
    icon: BarChart3,
    title: "Signal Analysis",
    description: "Built-in signal integrity and power integrity analysis powered by machine learning models.",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Everything You Need to
            <span className="gradient-text"> Design Smarter</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            From auto-routing to real-time error checking, Sparkgap.AI handles the complexity so you can focus on innovation.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:border-glow hover:box-glow"
            >
              <div className="mb-4 inline-flex rounded-lg bg-secondary p-2.5">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;