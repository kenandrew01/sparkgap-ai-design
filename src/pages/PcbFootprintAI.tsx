import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

const PCB_FOOTPRINT_URL = "https://ai-footprint-creator.lovable.app";

const PcbFootprintAI = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-6">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Back</span>
            </Link>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <span className="font-semibold">
                PCB <span className="gradient-text">Footprint</span> AI
              </span>
            </div>
          </div>
          <Button size="sm" variant="outline" asChild>
            <a href={PCB_FOOTPRINT_URL} target="_blank" rel="noopener noreferrer">
              Open in new tab
              <ExternalLink className="ml-2 h-3.5 w-3.5" />
            </a>
          </Button>
        </div>
      </div>

      <div className="flex-1 relative">
        <iframe
          src={PCB_FOOTPRINT_URL}
          title="PCB Footprint AI"
          className="absolute inset-0 h-full w-full border-0"
          allow="clipboard-read; clipboard-write"
        />
      </div>
    </div>
  );
};

export default PcbFootprintAI;