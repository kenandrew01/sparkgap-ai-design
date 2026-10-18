import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MODEL = "openai/gpt-6-astra";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const PAD = {
  type: "object",
  additionalProperties: false,
  required: ["name", "x_mm", "y_mm", "width_mm", "height_mm", "shape", "layer"],
  properties: {
    name: { type: "string" },
    x_mm: { type: "number" },
    y_mm: { type: "number" },
    width_mm: { type: "number" },
    height_mm: { type: "number" },
    shape: { type: "string", enum: ["rect", "round", "oval"] },
    layer: { type: "string", enum: ["top", "bottom", "through"] },
  },
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["component_name", "package_type", "summary", "dimensions", "pads", "courtyard", "silkscreen", "assembly_notes", "confidence"],
  properties: {
    component_name: { type: "string" },
    package_type: { type: "string" },
    summary: { type: "string" },
    dimensions: {
      type: "object",
      additionalProperties: false,
      required: ["body_width_mm", "body_length_mm", "pitch_mm", "overall_width_mm", "overall_length_mm"],
      properties: {
        body_width_mm: { type: "number" },
        body_length_mm: { type: "number" },
        pitch_mm: { type: "number" },
        overall_width_mm: { type: "number" },
        overall_length_mm: { type: "number" },
      },
    },
    pads: { type: "array", items: PAD },
    courtyard: {
      type: "object",
      additionalProperties: false,
      required: ["width_mm", "height_mm"],
      properties: { width_mm: { type: "number" }, height_mm: { type: "number" } },
    },
    silkscreen: { type: "array", items: { type: "string" } },
    assembly_notes: { type: "array", items: { type: "string" } },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
  },
};

const PROMPT = `You are an expert PCB librarian who creates IPC-7351-compliant footprints. The user describes a component (part number, package, datasheet dimensions, or a plain description).

Generate a complete PCB land pattern (footprint) for it:
- Pad positions in mm, origin at the footprint centre, X right / Y up. Pin 1 at top-left or as standard for the package.
- Pad sizes follow IPC-7351 density level B (nominal) unless the datasheet says otherwise.
- Include the courtyard (keep-out) and silkscreen guidance.
- overall_width/overall_length = the full extent including pads.
- If the description is ambiguous, pick the most common package variant and say so in the summary; set confidence accordingly.
- For through-hole parts use layer "through" and round/oval pads.

Be precise and quantitative. Plain text only, no markdown.`;

async function callAI(apiKey: string, description: string) {
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
        { role: "user", content: `Create a PCB footprint for: ${description}` },
      ],
      text: { format: { type: "json_schema", name: "footprint", strict: true, schema: SCHEMA } },
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    let msg = `Footprint generation failed (${res.status}).`;
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
        return { status: 502, error: ev.response?.error?.message ?? ev.message ?? "Footprint generation failed." };
    }
  }
  if (refusal) return { status: 422, error: "The AI declined to generate this footprint." };
  if (!out) return { status: 502, error: "The AI returned an empty result." };
  return { status: 200, data: JSON.parse(out) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const description = typeof body?.description === "string" ? body.description.trim() : "";
    if (description.length < 3) return json({ error: "Please describe the component (part number, package, or dimensions)." }, 400);
    if (description.length > 4000) return json({ error: "Description is too long (max 4000 characters)." }, 400);
    const r = await callAI(Deno.env.get("LOVABLE_API_KEY")!, description);
    if (r.error) return json({ error: r.error }, r.status);
    return json(r.data);
  } catch (err) {
    console.error("generate-footprint error", err);
    return json({ error: "Generation failed. Please try again." }, 500);
  }
});
