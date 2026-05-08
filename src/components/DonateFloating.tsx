import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const DonateFloating = () => {
  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-xs">
      <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl p-5 shadow-2xl box-glow">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 inline-flex rounded-lg bg-secondary p-2 w-fit shrink-0">
            <Heart className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground leading-snug">
              Support our mission
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Donate so we can fund the development of this website and keep building tools for the hardware community.
            </p>
          </div>
        </div>
        <Button
          size="sm"
          className="w-full mt-4 bg-primary text-primary-foreground hover:bg-primary/90 box-glow"
          asChild
        >
          <a
            href="https://www.paypal.com/donate/?business=ken.andrew.locus@gmail.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Heart className="h-3.5 w-3.5 mr-2" />
            Donate Now
          </a>
        </Button>
      </div>
    </div>
  );
};

export default DonateFloating;
