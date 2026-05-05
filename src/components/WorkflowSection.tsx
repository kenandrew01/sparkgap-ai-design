import { useState } from "react";
import { Upload, Eye, RefreshCw, ClipboardCheck, Download } from "lucide-react";

const tabs = [
  {
    id: "workflow",
    icon: Upload,
    title: "Works With Your Existing Workflow",
    description:
      "Upload KiCad, Altium, Eagle, or OrCAD projects directly. Define the board outline, pre-place connectors, determine the floorplan. You control the constraints.",
  },
  {
    id: "physics",
    icon: Eye,
    title: "Physics-Aware Design",
    description:
      "Sparkgap.AI identifies bypass capacitors, impedance-controlled nets, differential pairs, and other critical considerations for your review. You see exactly what the AI will and won't account for up front.",
  },
  {
    id: "iterate",
    icon: RefreshCw,
    title: "Iterate More",
    description:
      "Try multiple stack-ups, multiple manufacturers, multiple form factors. All in parallel, in hours instead of weeks. Sparkgap.AI makes layout fast and abundant.",
  },
  {
    id: "review",
    icon: ClipboardCheck,
    title: "Transparent Design Review",
    description:
      "Sparkgap.AI evaluates each layout against the full list of physical constraints provided. You get clear feedback on which design aspects are truly 'done' and which need further review.",
  },
  {
    id: "handoff",
    icon: Download,
    title: "Seamless Board Handoff",
    description:
      "Sparkgap.AI returns files in the same format as you submitted. Run DRC, polish, generate fab files — all in the CAD tools you already use.",
  },
];

const WorkflowSection = () => {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <section className="py-24 relative">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">
            Go From Schematic to Board on Your Desk{" "}
            <span className="gradient-text">in a Fraction of the Time</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8 items-start">
          {/* Tab buttons */}
          <div className="flex flex-col gap-2">
            {tabs.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(i)}
                className={`text-left p-4 rounded-xl border transition-all duration-300 ${
                  activeTab === i
                    ? "border-primary/40 bg-primary/5 box-glow"
                    : "border-border bg-card hover:border-glow-soft"
                }`}
              >
                <div className="flex items-center gap-3 mb-1">
                  <tab.icon
                    className={`h-4 w-4 ${
                      activeTab === i ? "text-primary" : "text-muted-foreground"
                    }`}
                  />
                  <span
                    className={`font-semibold text-sm ${
                      activeTab === i ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {tab.title}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="rounded-2xl border border-border bg-card p-8 min-h-[320px] flex flex-col justify-center">
            <div className="mb-4 inline-flex rounded-lg bg-secondary p-3 w-fit">
              {(() => {
                const Icon = tabs[activeTab].icon;
                return <Icon className="h-6 w-6 text-primary" />;
              })()}
            </div>
            <h3 className="text-2xl font-bold mb-4">{tabs[activeTab].title}</h3>
            <p className="text-muted-foreground leading-relaxed text-base">
              {tabs[activeTab].description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WorkflowSection;