import { Mail, Phone, MapPin, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const contactInfo = [
  {
    icon: <Mail className="h-5 w-5" />,
    label: "Email",
    value: "ken.andrew.locus@gmail.com",
    href: "mailto:ken.andrew.locus@gmail.com",
  },
  {
    icon: <Phone className="h-5 w-5" />,
    label: "Phone",
    value: "+44 7765 732780",
    href: "tel:+447765732780",
  },
  {
    icon: <MapPin className="h-5 w-5" />,
    label: "Location",
    value: "London, UK",
    href: null,
  },
  {
    icon: <Linkedin className="h-5 w-5" />,
    label: "LinkedIn",
    value: "Kenneth Andrew L.",
    href: "https://www.linkedin.com/in/kenneth-andrew-l-10a05091/",
  },
];

const ContactSection = () => {
  return (
    <section id="contact" className="py-24 border-t border-border/50">
      <div className="container mx-auto px-6">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Get in <span className="gradient-text">Touch</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Have questions about Sparkgap.AI or want to discuss your PCB design needs? Reach out anytime.
          </p>
        </div>

        <div className="mx-auto max-w-2xl grid gap-4 sm:grid-cols-2">
          {contactInfo.map((item) => {
            const inner = (
              <Card
                key={item.label}
                className="group border-border/50 hover:border-primary/30 transition-all hover:box-glow"
              >
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="rounded-full bg-primary/10 p-3 text-primary group-hover:bg-primary/20 transition-colors">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium text-foreground">{item.value}</p>
                  </div>
                </CardContent>
              </Card>
            );

            return item.href ? (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="block"
              >
                {inner}
              </a>
            ) : (
              <div key={item.label}>{inner}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ContactSection;