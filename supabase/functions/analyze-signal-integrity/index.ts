import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MODEL = "openai/gpt-6-astra";
const MAX_TEXT = 60_000;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "verdict", "stackup", "differential_pairs", "issues", "simulation_feedback"],
  properties: {
    summary: { type: "string" },
    verdict: { type: "string", enum: ["pass", "needs_changes", "fail"] },
    stackup: {
      type: "object",
      additionalProperties: false,
      required: ["layers", "assessment", "suggestions"],
      properties: {
        layers: { type: "string" },
        assessment: { type: "string" },
        suggestions: { type: "array", items: { type: "string" } },
      },
    },
    differential_pairs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "assessment", "suggestion"],
        properties: {
          name: { type: "string" },
          assessment: { type: "string" },
          suggestion: { type: "string" },
        },
      },
    },
    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["severity", "location", "description", "suggestion"],
        properties: {
          severity: { type: "string", enum: ["high", "medium", "low"] },
          location: { type: "string" },
          description: { type: "string" },
          suggestion: { type: "string" },
        },
      },
    },
    simulation_feedback: { type: "array", items: { type: "string" } },
  },
};

const PROMPT = `You are an expert RF and high-speed signal-integrity engineer. The user uploads a design file describing a PCB stack-up, impedance targets, differential pairs, and/or simulation results (S-parameters, TDR, eye diagrams as text/CSV).

Analyse it for:
1. Stack-up: layer arrangement, dielectric thicknesses, trace geometries vs target impedance. Suggest concrete geometry changes (trace width, spacing, dielectric height).
2. Differential pairs: impedance, length matching/skew, via transitions, coupling.
3. Issues: discontinuities, via stubs, poor return paths, plane splits under high-speed nets, potential coupling/crosstalk.
4. Simulation feedback: interpret any simulation numbers given and propose geometry changes.

Be concrete and quantitative where possible. If the file lacks data for a section, say so plainly instead of guessing. Plain text only, no markdown.`;

async function callAI(apiKey: string, fileName: string, content: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "low", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      input: [
        { role: "system", content: PROMPT },
        { role: "user", content: `Analyse this design file "${fileName}":\n\n${content}` },
      ],
      text: { format: { type: "json_schema", name: "si_analysis", strict: true, schema: SCHEMA } },
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    let msg = `AI analysis failed (${res.status}).`;
    if (res.status === 402) msg = "The AI is temporarily unavailable (out of AI credits). Please try again later.";
    else if (res.status === 429) msg = "The AI is busy right now. Please try again in a minute.";
    else { try { msg = JSON.parse(body)?.error?.message ?? msg; } catch { /* ignore */ } }
    return { status: res.status, error: msg };
  }
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let buf = "", out = "", refusal = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += value;
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data:")) continue;
      const d = line.slice(5).trim();
      if (!d || d === "[DONE]") continue;
      let ev;
      try { ev = JSON.parse(d); } catch { continue; }
      if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
      else if (ev.type === "response.refusal.delta") refusal += ev.delta ?? "";
      else if (ev.type === "response.failed" || ev.type === "error")
        return { status: 502, error: ev.response?.error?.message ?? ev.message ?? "AI analysis failed." };
    }
  }
  if (refusal) return { status: 422, error: "The AI declined to analyse this file." };
  if (!out) return { status: 502, error: "The AI returned an empty result." };
  return { status: 200, data: JSON.parse(out) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const fileName = typeof body?.fileName === "string" ? body.fileName : "design.txt";
    const content = typeof body?.content === "string" ? body.content : "";
    if (!content.trim()) return json({ error: "The file appears to be empty or not readable as text." }, 400);
    const trimmed = content.slice(0, MAX_TEXT);
    const r = await callAI(Deno.env.get("LOVABLE_API_KEY")!, fileName, trimmed);
    if (r.error) return json({ error: r.error }, r.status);
    return json(r.data);
  } catch (err) {
    console.error("analyze-signal-integrity error", err);
    return json({ error: "Analysis failed. Please try again." }, 500);
  }
});
