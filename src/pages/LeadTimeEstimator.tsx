import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Zap, Calculator, Clock, Layers, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const HOURS_PER_DAY = 7.5;
const HOURS_PER_COMPONENT = 0.1;

const PCB_TYPES = [
  { label: "Rigid Board", factor: 1, note: "" },
  { label: "Power PCB", factor: 1.25, note: "" },
  { label: "Flex-Rigid PCB", factor: 1.25, note: "Add a few more days for flexible areas" },
  { label: "HDI (with BGA)", factor: 1.5, note: "Add a few more days for laser drill vias — blind/buried, BGA" },
  { label: "RF Board", factor: 1.5, note: "Add a few more days for microstrip/strip lines and co-planar waveguides" },
];

const BOARD_AREAS = [
  { label: "Less than 100×100 mm", factor: 1 },
  { label: "100×100 mm", factor: 1.25 },
  { label: "150×150 mm", factor: 1.5 },
  { label: "200×200 mm", factor: 1.75 },
  { label: "250×250 mm", factor: 2 },
  { label: "300×300 mm", factor: 2.25 },
  { label: "350×350 mm", factor: 2.5 },
  { label: "400×400 mm and above", factor: 3 },
];

const LAYER_OPTIONS = [
  { label: "2 layers", factor: 1 },
  { label: "4 layers", factor: 1.25 },
  { label: "6 layers", factor: 1.5 },
  { label: "8 layers", factor: 1.75 },
  { label: "10 layers", factor: 2 },
  { label: "12 layers", factor: 2.25 },
  { label: "More than 12 layers", factor: 2.5 },
];

const LeadTimeEstimator = () => {
  // Layout inputs
  const [components, setComponents] = useState(500);
  const [pcbType, setPcbType] = useState(1.5);
  const [boardArea, setBoardArea] = useState(1.25);
  const [layers, setLayers] = useState(1.25);

  // Library inputs
  const [newConnectors, setNewConnectors] = useState(2);
  const [newICs, setNewICs] = useState(10);
  const [otherFootprints, setOtherFootprints] = useState(3);

  // Additional phase inputs (days)
  const [reviewDays, setReviewDays] = useState(1);
  const [revisionDays, setRevisionDays] = useState(2);
  const [fabDwgDays, setFabDwgDays] = useState(1);
  const [dfmDays, setDfmDays] = useState(1);
  const [mechDays, setMechDays] = useState(3);

  const calc = useMemo(() => {
    const componentHours = components * HOURS_PER_COMPONENT;
    const layoutDays = Math.ceil((componentHours * pcbType * boardArea * layers) / HOURS_PER_DAY);

    const libraryHours = newConnectors * 1 + newICs * 0.5 + otherFootprints * 0.5;
    const libraryDays = Math.round(libraryHours / HOURS_PER_DAY);

    const total =
      layoutDays + libraryDays + reviewDays + revisionDays + fabDwgDays + dfmDays + mechDays;

    return { componentHours, layoutDays, libraryHours, libraryDays, total };
  }, [components, pcbType, boardArea, layers, newConnectors, newICs, otherFootprints, reviewDays, revisionDays, fabDwgDays, dfmDays, mechDays]);

  const typeNote = PCB_TYPES.find((t) => t.factor === pcbType)?.note;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center gap-4 px-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold">
              Spark<span className="gradient-text">gap</span>.AI — Lead Time Estimator
            </span>
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">PCB Design Lead Time Estimator</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Estimate your PCB layout lead time based on component count, board complexity, and library work.
            Formula: (Number of components × 0.1 hr × complexity factors) ÷ 7.5 hrs per day.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Layout calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Calculator className="h-5 w-5 text-primary" />
                PCB Layout Lead Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="components">Number of Components</Label>
                <Input
                  id="components"
                  type="number"
                  min={0}
                  value={components}
                  onChange={(e) => setComponents(Math.max(0, Number(e.target.value) || 0))}
                />
                <p className="text-xs text-muted-foreground">
                  Routing a simple component takes ~5 min (≈0.1 hr each, except BGA). → {calc.componentHours.toFixed(1)} hrs
                </p>
              </div>

              <div className="space-y-2">
                <Label>PCB Type (complexity factor)</Label>
                <Select value={String(pcbType)} onValueChange={(v) => setPcbType(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PCB_TYPES.map((t) => (
                      <SelectItem key={t.label} value={String(t.factor)}>
                        {t.label} — ×{t.factor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {typeNote && (
                  <p className="text-xs text-amber-500 flex items-start gap-1">
                    <Info className="h-3 w-3 mt-0.5 shrink-0" /> {typeNote}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Board Area (complexity factor)</Label>
                <Select value={String(boardArea)} onValueChange={(v) => setBoardArea(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {BOARD_AREAS.map((a) => (
                      <SelectItem key={a.label} value={String(a.factor)}>
                        {a.label} — ×{a.factor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Number of Layers (complexity factor)</Label>
                <Select value={String(layers)} onValueChange={(v) => setLayers(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LAYER_OPTIONS.map((l) => (
                      <SelectItem key={l.label} value={String(l.factor)}>
                        {l.label} — ×{l.factor}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
                <p className="text-sm text-muted-foreground">Placement + Layout Lead Time</p>
                <p className="text-4xl font-bold text-primary">{calc.layoutDays} days</p>
              </div>
            </CardContent>
          </Card>

          {/* Library calculator */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5 text-primary" />
                Library Time — New Footprints
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="connectors">How many are new connectors? (1 hr each)</Label>
                <Input id="connectors" type="number" min={0} value={newConnectors}
                  onChange={(e) => setNewConnectors(Math.max(0, Number(e.target.value) || 0))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ics">How many are new ICs? (0.5 hr each)</Label>
                <Input id="ics" type="number" min={0} value={newICs}
                  onChange={(e) => setNewICs(Math.max(0, Number(e.target.value) || 0))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="others">Any other footprints to make? (0.5 hr each)</Label>
                <Input id="others" type="number" min={0} value={otherFootprints}
                  onChange={(e) => setOtherFootprints(Math.max(0, Number(e.target.value) || 0))} />
              </div>

              <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total hours</span>
                  <span className="font-medium">{calc.libraryHours.toFixed(1)} hrs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Library lead time</span>
                  <span className="font-medium">{calc.libraryDays} day{calc.libraryDays === 1 ? "" : "s"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional phases + total */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Full Project Lead Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                { label: "Layout Review", value: reviewDays, set: setReviewDays },
                { label: "Layout Revision + Final Review", value: revisionDays, set: setRevisionDays, note: "Depends how complicated the changes are" },
                { label: "PCB Fabrication & Assembly Drawing", value: fabDwgDays, set: setFabDwgDays },
                { label: "DFM Check + Gerber Release", value: dfmDays, set: setDfmDays },
                { label: "Mechanical Work", value: mechDays, set: setMechDays, note: "e.g. clamshell making / metal works modifications" },
              ].map((f) => (
                <div key={f.label} className="space-y-2">
                  <Label>{f.label} (days)</Label>
                  <Input type="number" min={0} value={f.value}
                    onChange={(e) => f.set(Math.max(0, Number(e.target.value) || 0))} />
                  {f.note && <p className="text-xs text-muted-foreground">{f.note}</p>}
                </div>
              ))}
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <tbody>
                  {[
                    ["PCB Layout Lead Time", calc.layoutDays],
                    ["Library Time", calc.libraryDays],
                    ["Layout Review", reviewDays],
                    ["Layout Revision + Final Review", revisionDays],
                    ["PCB Fabrication & Assembly Drawing", fabDwgDays],
                    ["DFM Check + Gerber Release", dfmDays],
                    ["Mechanical Work", mechDays],
                  ].map(([label, days], i) => (
                    <tr key={label as string} className={i % 2 ? "bg-secondary/20" : ""}>
                      <td className="px-4 py-2.5 text-muted-foreground">{label}</td>
                      <td className="px-4 py-2.5 text-right font-medium">{days} day{days === 1 ? "" : "s"}</td>
                    </tr>
                  ))}
                  <tr className="border-t border-primary/30 bg-primary/10">
                    <td className="px-4 py-3 font-bold">Total Lead Time</td>
                    <td className="px-4 py-3 text-right text-xl font-bold text-primary">{calc.total} days</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rounded-lg border border-border bg-secondary/20 p-4 text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">Notes:</p>
              <p>1. Calculations assume a complete schematic and full component specifications have been provided.</p>
              <p>2. Additional time may be required for new schematic changes, new custom footprint creation, or extensive design reviews.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeadTimeEstimator;
