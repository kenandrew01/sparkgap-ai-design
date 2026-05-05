import { Quote, Zap, ShieldCheck, Users } from "lucide-react";

const values = [
  {
    icon: Zap,
    title: "Iterate Faster",
    description:
      "Physics-first AI turns months of layout into minutes — so programs advance faster and engineers get more design cycles without added overhead.",
  },
  {
    icon: ShieldCheck,
    title: "Physics-First Confidence",
    description:
      "All candidates undergo an extensive physics design review to ensure functionality and signal integrity before fabrication.",
  },
  {
    icon: Users,
    title: "Increase Engineering Bandwidth",
    description:
      "Sparkgap.AI frees engineers and PCB designers to focus on the complex, high-value tasks that drive real breakthroughs.",
  },
];

const TestimonialSection = () => {
  return (
    <section className="py-24 bg-secondary/20">
      <div className="container mx-auto px-6">
        {/* Testimonial */}
        <div className="max-w-3xl mx-auto text-center mb-20">
          <Quote className="h-10 w-10 text-primary mx-auto mb-6 opacity-60" />
          <blockquote className="text-xl md:text-2xl font-medium leading-relaxed mb-6 text-foreground">
            "AI-driven PCB design gives top engineers the superpower to turn weeks into days.
            It's a complete paradigm shift. When you iterate faster, you can out-innovate your competitors."
          </blockquote>
          <div>
            <p className="font-semibold text-foreground">Industry Expert</p>
            <p className="text-sm text-muted-foreground">
              Hardware Engineering Leader
            </p>
          </div>
        </div>

        {/* Value Props */}
        <div className="grid md:grid-cols-3 gap-8">
          {values.map((v) => (
            <div
              key={v.title}
              className="rounded-xl border border-border bg-card p-8 text-center transition-all duration-300 hover:border-glow hover:box-glow"
            >
              <div className="mx-auto mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-secondary">
                <v.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-3">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {v.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialSection;