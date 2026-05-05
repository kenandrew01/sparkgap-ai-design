import { ArrowRight, Cpu, Headphones, Users } from "lucide-react";

const cards = [
  {
    icon: Cpu,
    title: "The First AI to Fully Automate Complete PCB Layout",
    description:
      "Generate multiple candidates in hours. AI validates every trace with physics-first analysis.",
    link: "#features",
    linkText: "Product Overview",
  },
  {
    icon: Headphones,
    title: "Enterprise-Grade Support for Mission-Critical Environments",
    description:
      "Premium, proactive support engineered for high-stakes PCB development.",
    link: "#contact",
    linkText: "Help & Documentation",
  },
  {
    icon: Users,
    title: "We Speak Your Language",
    description:
      "We're engineers who want to design hardware faster.",
    link: "#contact",
    linkText: "Company Overview",
  },
];

const BottomCTASection = () => {
  return (
    <section className="py-24">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((c) => (
            <a
              key={c.title}
              href={c.link}
              className="group rounded-2xl border border-border bg-card p-8 transition-all duration-300 hover:border-glow hover:box-glow flex flex-col"
            >
              <div className="mb-4 inline-flex rounded-lg bg-secondary p-3 w-fit">
                <c.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-bold mb-3 leading-snug">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6 flex-1">
                {c.description}
              </p>
              <span className="inline-flex items-center text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                {c.linkText}
                <ArrowRight className="ml-1 h-4 w-4" />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BottomCTASection;