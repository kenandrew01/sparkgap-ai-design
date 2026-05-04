import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5" />
      <div className="container relative z-10 mx-auto px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Ready to <span className="gradient-text text-glow">Supercharge</span> Your PCB Design?
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-10 text-lg">
          Join thousands of engineers who are already designing better boards faster with Sparkgap.AI.
        </p>
        <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 box-glow px-10 text-base">
          Get Started for Free
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};

export default CTASection;