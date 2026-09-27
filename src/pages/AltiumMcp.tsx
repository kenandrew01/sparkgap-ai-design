import { Link } from "react-router-dom";
import {
  ArrowLeft, Zap, Github, Terminal, Download, Settings, Wrench, Workflow,
  BookOpen, Users, AlertTriangle, Star, GitFork, ExternalLink, Youtube,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const EXAMPLE_COMMANDS = [
  "Run all output jobs",
  "Create a symbol for the part in the attached datasheet and use the currently open symbol as a reference example.",
  "Create a schematic symbol from the attached MPM3650 switching regulator datasheet and make sure to strictly follow the symbol placement rules.",
  "Create an op-amp symbol with a triangle body like the other op-amps in my library (symbols support line/polygon/arc/ellipse/label body graphics, not just rectangles)",
  "Find me the LM358 symbol in my opamp library and open it",
  "Create a multi-part symbol for a quad op-amp from the attached LM324 datasheet (creates parts A, B, C, D with shared V+/V- power pins)",
  "Create a PCB footprint for the SMD part in the attached datasheet and add it to my open PcbLib",
  "Duplicate my selected layout. (Will prompt user to now select destination components. Supports Component, Track, Arc, Via, Polygon, & Region)",
  "Show all my inner layers. Show the top and bottom layer. Turn off solder paste.",
  "Get me all parts on my design made by Molex",
  "Give me the description and part number of U4",
  "Place the selected parts on my pcb with best practices for a switching regulator, then verify clearances and show me a screenshot of the result",
  "Give me a list of all IC designators in my design",
  "Get me all length matching rules",
];

const TOOL_GROUPS: { title: string; tools: { name: string; desc: string }[] }[] = [
  {
    title: "Output Jobs",
    tools: [
      { name: "get_output_job_containers", desc: "Using currently open .OutJob file, reads all available output containers" },
      { name: "run_output_jobs", desc: "Pass a list of output job container names from the currently open .OutJob to run any number of them. .OutJob must be the currently focused document." },
    ],
  },
  {
    title: "Component Information",
    tools: [
      { name: "get_all_designators", desc: "Get a list of all component designators in the current board" },
      { name: "get_all_component_property_names", desc: "Get a list of all available component property names" },
      { name: "get_component_property_values", desc: "Get the values of a specific property for all components" },
      { name: "get_component_data", desc: "Get detailed data for specific components by designator" },
      { name: "get_component_pins", desc: "Get pin information for specified components" },
    ],
  },
  {
    title: "Schematic / Symbol",
    tools: [
      { name: "get_schematic_data", desc: "Get schematic data from the current design" },
      { name: "create_symbol", desc: "Create schematic symbols with multi-part support, active-low pin name overbars, per-pin length and visibility, and optional graphics (lines, polygons, arcs, ellipses, labels) for non-rectangular bodies like op-amp triangles and diode glyphs." },
      { name: "get_symbol_primitives", desc: "Inventory a .SchLib (every symbol with per-type primitive counts) or dump one symbol's complete geometry. The symbol creator round-trips a complete production library set exactly — 514/514 symbols with zero differences." },
      { name: "create_symbols_batch", desc: "Create many symbols in one script run from a plain-text spec file (bulk imports/migrations) — far faster and more robust than one create call per symbol." },
      { name: "get_symbol_placement_rules", desc: "Helper tool that reads symbol_placement_rules.txt to get pin placement rules for symbol creation." },
      { name: "get_library_symbol_reference", desc: "Helper tool to use an open library symbol as an example when creating a symbol." },
      { name: "search_library_symbol", desc: "Search for a symbol by name in a schematic library (.SchLib) and navigate to it. Supports partial name matching." },
    ],
  },
  {
    title: "Layout Operations",
    tools: [
      { name: "get_all_nets", desc: "Returns a list of unique nets from the PCB" },
      { name: "create_net_class", desc: "Create a net class from a list of nets" },
      { name: "get_pcb_layers", desc: "Get detailed layer information including electrical, mechanical, layer pairs, etc." },
      { name: "get_pcb_layer_stackup", desc: "Gets stackup info like dielectric, layer thickness, etc." },
      { name: "set_pcb_layer_visibility", desc: "Turn on or off any group of layers. For example turn on inner layers. Turn off silk." },
      { name: "get_pcb_rules", desc: "Gets the rule descriptions for all PCB rules in layout." },
      { name: "get_selected_components_coordinates", desc: "Get position, rotation, layer, and footprint information for currently selected components" },
      { name: "move_components", desc: "Move specified components by X and Y offsets" },
      { name: "set_component_position", desc: "Set one component's absolute position and rotation" },
      { name: "place_components", desc: "Batch absolute placement — place any number of components (x, y, rotation, top/bottom layer) in a single transaction / one undo step. The workhorse for AI-driven placement." },
      { name: "check_placement", desc: "Verify a placement — finds overlaps and clearance violations against every other component on the board using true primitive-to-primitive distances." },
      { name: "check_orientation", desc: "Advisory check for 2-pad passives whose rotation could be improved (e.g. a decoupling cap with its GND pad facing away from the IC)." },
      { name: "get_net_connections", desc: "For the nets touching a set of components, list every pad on each net board-wide with per-net airline (MST) lengths — the data behind connectivity-driven placement." },
      { name: "layout_duplicator", desc: "Starts layout duplication assuming you have already selected the source components on the PCB." },
      { name: "layout_duplicator_apply", desc: "Action #2 of layout_duplicator. The agent uses part info to predict the match between source and destination components, then sends those matches to the place script." },
    ],
  },
  {
    title: "PCB Footprint Library",
    tools: [
      { name: "create_pcb_footprint", desc: "Create a new PCB footprint in the currently active .PcbLib document. Supports SMD pads (Rect, Round, Oval) defined in mm relative to the component origin. Auto-generates a courtyard on Mech 15 and silkscreen with a pin 1 indicator." },
      { name: "get_footprint_primitives", desc: "Inventory a .PcbLib (per-footprint primitive counts) or dump complete footprint geometry — pads with full stack/hole detail, tracks, arcs, fills, texts, regions — in mils." },
      { name: "create_footprints_batch", desc: "Create many footprints in one script run from a plain-text spec file: SMD + through-hole pads, tracks, arcs, fills, texts, and regions on any layer. Round-trip verified against complete production libraries." },
    ],
  },
  {
    title: "Both Schematic & PCB",
    tools: [
      { name: "get_screenshot", desc: "Take a screenshot of the Altium PCB or Schematic window that is the current view, returned as a proper image the agent can see. An optional zoom_to list of designators makes Altium zoom to those components before capture." },
    ],
  },
  {
    title: "Scripting / Development",
    tools: [
      { name: "run_altium_script", desc: "Run a DelphiScript snippet in an isolated sandbox script project and get back a step-by-step log, the script's result, and — when a script dies — the exact statement that killed it." },
      { name: "ensure_altium_script_skill", desc: "Check whether the altium-script skill (Altium DelphiScript API reference, examples, and conventions) is installed, and install it on request." },
    ],
  },
  {
    title: "Server Status",
    tools: [
      { name: "get_server_status", desc: "Check the status of the MCP server, including paths to Altium and script files" },
    ],
  },
];

const HOW_IT_WORKS = [
  "It writes command requests to workspace\\request.json",
  "It launches Altium with instructions to run the Altium_API.PrjScr script",
  "The script processes the request and writes results to workspace\\response.json",
  "The server reads and returns the response",
];

const REFERENCES = [
  "Get scripts' project path from Jeff Collins and William Kitchen's stripped down version",
  "BlenderMCP: inspired by MCP being used in Blender — https://github.com/ahujasid/blender-mcp",
  "CopyDesignatorsToMechLayerPair script by Petar Perisin and Randy Clemmons — reference on how to .Replicate objects (used in layout duplicator)",
  "Petar Perisin's Select Bad Connections Script — understanding how to walk PCB primitives connected to a pad",
  "Matija Markovic and Petar Perisin Distribute Script — how to properly let the GUI know when tracks' nets are updated",
  "Petar Perisin's Room from Poly — reference to detect poly-to-pad overlap",
  "Petar Perisin's Layer Panel Script — reference for getting layers and changing layer visibility",
  "Jeff Collins' XIA_Release_Manager.pas script — the art of the Output Job (Altium Forums)",
];

const AltiumMcp = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex h-14 items-center gap-4 px-6">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-semibold">
              Spark<span className="gradient-text">gap</span>.AI — Altium MCP
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-10 space-y-10">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Altium MCP Server</h1>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Use Claude to control or ask questions about your Altium project. This is a Model Context
            Protocol (MCP) server that provides an interface to interact with Altium Designer through
            Python — allowing querying and manipulation of PCB designs programmatically.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="h-4 w-4 text-primary" /> 169 stars</span>
            <span className="flex items-center gap-1"><GitFork className="h-4 w-4 text-primary" /> 49 forks</span>
            <span>by <a href="https://x.com/coffeenmusic" target="_blank" rel="noreferrer" className="text-primary hover:underline">coffeenmusic</a></span>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90 box-glow">
              <a href="https://github.com/coffeenmusic/altium-mcp" target="_blank" rel="noreferrer">
                <Github className="mr-2 h-4 w-4" /> View on GitHub
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href="https://youtu.be/HKQMK-hluLs" target="_blank" rel="noreferrer">
                <Youtube className="mr-2 h-4 w-4" /> Watch on YouTube
              </a>
            </Button>
          </div>
        </div>

        {/* Example commands */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Terminal className="h-5 w-5 text-primary" /> Example Commands
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2 md:grid-cols-2">
              {EXAMPLE_COMMANDS.map((cmd) => (
                <li key={cmd} className="flex items-start gap-2 rounded-lg border border-border bg-secondary/20 px-3 py-2 text-sm text-muted-foreground">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {cmd}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Installation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5 text-primary" /> Installing the MCP Server
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p>
              The easiest way to install is to use Claude Code, point it to the repo and ask it to
              install it for you. Or alternatively:
            </p>
            <ol className="list-decimal space-y-2 pl-5">
              <li>
                Make sure Claude has Python 3.10+ installed:{" "}
                <code className="rounded bg-secondary/50 px-1.5 py-0.5 text-xs">drop down &gt; File &gt; Settings &gt; Extensions &gt; Advanced &gt; Python</code>.
                If not, install Python and add it to PATH.
              </li>
              <li>
                Download the <code className="rounded bg-secondary/50 px-1.5 py-0.5 text-xs">altium-mcp.dxt</code> desktop
                extension file from{" "}
                <a href="https://github.com/coffeenmusic/altium-mcp/releases" target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  releases <ExternalLink className="inline h-3 w-3" />
                </a>
              </li>
              <li>
                In Claude Desktop on Windows:{" "}
                <code className="rounded bg-secondary/50 px-1.5 py-0.5 text-xs">drop down &gt; File &gt; Settings &gt; Extensions &gt; Advanced &gt; Install Extension...</code>{" "}
                Select the .dxt file
              </li>
            </ol>
            <p>You shouldn't need to restart Claude and you should now see altium-mcp in the tool menu near the search bar.</p>
          </CardContent>
        </Card>

        {/* Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="h-5 w-5 text-primary" /> Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            <p>
              When launching Claude for the first time, the server will automatically try to locate your
              Altium Designer installation. It will search for all directories that start with{" "}
              <code className="rounded bg-secondary/50 px-1.5 py-0.5 text-xs">C:\Program Files\Altium\AD*</code>{" "}
              and use the one with the largest revision number. If it cannot find any, you will be prompted
              to select the Altium executable (X2.EXE) manually when you first run the server. Altium's
              DelphiScript scripting is used to create an API between the MCP server and Altium.
            </p>
          </CardContent>
        </Card>

        {/* Available tools */}
        <div className="space-y-4">
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Wrench className="h-6 w-6 text-primary" /> Available Tools
          </h2>
          <p className="text-sm text-muted-foreground">
            The server provides several tools to interact with Altium Designer:
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            {TOOL_GROUPS.map((group) => (
              <Card key={group.title}>
                <CardHeader>
                  <CardTitle className="text-base">{group.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {group.tools.map((tool) => (
                      <li key={tool.name} className="text-sm">
                        <code className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                          {tool.name}
                        </code>
                        <p className="mt-1 text-muted-foreground">{tool.desc}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* How it works */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Workflow className="h-5 w-5 text-primary" /> How It Works
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              The server communicates with Altium Designer using a scripting bridge:
            </p>
            <ol className="space-y-3">
              {HOW_IT_WORKS.map((step, i) => (
                <li key={step} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        {/* References */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BookOpen className="h-5 w-5 text-primary" /> References
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {REFERENCES.map((ref) => (
                <li key={ref} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {ref}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Contributors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" /> Contributors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="https://github.com/coffeedust" target="_blank" rel="noreferrer" className="text-primary hover:underline">coffeedust</a>
                {" "}— create_pcb_footprint tool for PcbLib automation (PR #7)
              </li>
              <li>
                <a href="https://github.com/fwolter" target="_blank" rel="noreferrer" className="text-primary hover:underline">fwolter</a>
                {" "}— Fix JSON parsing error when the decimal separator is a comma (PR #3)
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Disclaimer */}
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 flex items-start gap-3 text-sm text-muted-foreground">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
          <p>
            <span className="font-medium text-foreground">Disclaimer:</span> This is a third-party
            integration and not made by Altium. Made by{" "}
            <a href="https://x.com/coffeenmusic" target="_blank" rel="noreferrer" className="text-primary hover:underline">coffeenmusic</a>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AltiumMcp;
