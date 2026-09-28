import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import DesignFlow from "./pages/DesignFlow.tsx";
import PcbFootprintAI from "./pages/PcbFootprintAI.tsx";
import LeadTimeEstimator from "./pages/LeadTimeEstimator.tsx";
import AltiumMcp from "./pages/AltiumMcp.tsx";
import SchematicReview from "./pages/SchematicReview.tsx";
import SchematicReviewResult from "./pages/SchematicReviewResult.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/design" element={<DesignFlow />} />
          <Route path="/footprint-ai" element={<PcbFootprintAI />} />
          <Route path="/lead-time" element={<LeadTimeEstimator />} />
          <Route path="/altium-mcp" element={<AltiumMcp />} />
          <Route path="/schematic-review" element={<SchematicReview />} />
          <Route path="/schematic-review/:token" element={<SchematicReviewResult />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
