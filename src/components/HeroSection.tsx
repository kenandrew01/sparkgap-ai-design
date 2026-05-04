import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Play, X } from "lucide-react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import heroPcb from "@/assets/hero-pcb.jpg";
import demoVideoAsset from "@/assets/demo-video.mp4.asset.json";

const HeroSection = () => {
  const [demoOpen, setDemoOpen] = useState(false);

  return (
    <>
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroPcb}
          alt="PCB circuit board design"
          width={1920}
          height={1080}
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
      </div>

      <div className="container relative z-10 mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-glow bg-secondary/50 px-4 py-1.5 mb-8">
          <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse-glow" />
          <span className="text-xs font-medium text-muted-foreground">AI-Powered PCB Design</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6">
          Design PCBs at the
          <br />
          <span className="gradient-text text-glow">Speed of Thought</span>
        </h1>

        <p className="mx-auto max-w-2xl text-lg text-muted-foreground mb-10">
          Sparkgap.AI uses advanced artificial intelligence to automate PCB layout,
          optimize routing, and catch errors before they become costly mistakes.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 box-glow px-8 text-base" asChild>
            <Link to="/design">
              Start Designing Free
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-border hover:border-glow-soft hover:bg-secondary/50 px-8 text-base"
            onClick={() => setDemoOpen(true)}
          >
            <Play className="mr-2 h-4 w-4" />
            Watch Demo
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">No credit card required · Free tier available</p>
      </div>
    </section>

    <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
      <DialogContent className="max-w-4xl p-0 bg-background border-border overflow-hidden">
        <DialogTitle className="sr-only">Sparkgap.AI Demo Video</DialogTitle>
        <div className="relative aspect-video">
          <video
            src={demoVideoAsset.url}
            className="h-full w-full"
            controls
            autoPlay
            playsInline
          />
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};

export default HeroSection;