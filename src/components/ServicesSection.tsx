import { CircuitBoard, MessagesSquare, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const services = [
  {
    icon: <CircuitBoard className="h-7 w-7" />,
    title: "PCB Layout Service",
    description:
      "Need a board laid out by an experienced engineer? I offer professional PCB layout services — from simple two-layer boards to complex multi-layer, high-speed designs.",
    points: [
      "Schematic capture to finished layout",
      "Multi-layer and high-speed design",
      "Impedance-controlled routing",
      "Manufacturing-ready outputs (Gerber, ODB++, pick & place)",
    ],
  },
  {
    icon: <MessagesSquare className="h-7 w-7" />,
    title: "Design Consultancy",
    description:
      "Get expert eyes on your design before you commit to fabrication. I help teams avoid costly respins with practical, hands-on consultancy.",
    points: [
      "Design reviews and design-for-manufacture checks",
      "Signal and power integrity guidance",
      "Component selection and sourcing advice",
      "Help adopting AI-assisted PCB design workflows",
    ],
  },
];

const ServicesSection = () => {
  return (
    <section id="services" className="py-24 border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            PCB Layout Services &amp; <span className="gradient-text">Consultancy</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Beyond the AI tools, I offer hands-on PCB layout services and design consultancy —
            based in London, UK, working with clients worldwide.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {services.map((service) => (
            <Card
              key={service.title}
              className="group border-border/50 hover:border-primary/30 transition-all hover:box-glow"
            >
              <CardContent className="p-8">
                <div className="rounded-full bg-primary/10 p-4 text-primary w-fit mb-5 group-hover:bg-primary/20 transition-colors">
                  {service.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{service.title}</h3>
                <p className="text-sm text-muted-foreground mb-5">{service.description}</p>
                <ul className="space-y-2.5">
                  {service.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-foreground/90">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button asChild size="lg" className="gap-2">
            <a href="#contact">
              Discuss Your Project
              <ArrowRight className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
