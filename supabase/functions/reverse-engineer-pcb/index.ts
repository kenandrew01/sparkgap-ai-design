import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MODEL = "openai/gpt-6-astra";
const MAX_BYTES = 8 * 1024 * 1024;
const MIME = ["image/jpeg", "image/png", "image/webp"];

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "board", "components", "nets", "notes"],
  properties: {
    summary: { type: "string" },
    board: {
      type: "object",
      additionalProperties: false,
      required: ["width_mm", "height_mm", "layers_visible"],
      properties: {
        width_mm: { type: "number" },
        height_mm: { type: "number" },
        layers_visible: { type: "string" },
      },
    },
    components: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["designator", "type", "value", "footprint", "x", "y", "w", "h", "confidence"],
        properties: {
          designator: { type: "string" },
          type: { type: "string" },
          value: { type: "string" },
          footprint: { type: "string" },
          x: { type: "number" },
          y: { type: "number" },
          w: { type: "number" },
          h: { type: "number" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
      },
    },
    nets: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "pins"],
        properties: { name: { type: "string" }, pins: { type: "array", items: { type: "string" } } },
      },
    },
    notes: { type: "array", items: { type: "string" } },
  },
};

const PROMPT = `You are an expert PCB reverse-engineering engineer. Analyse the photo of a printed circuit board.
1. Identify every visible component: designator (use silkscreen if readable, otherwise invent R1, C1, U1...), type, value or part number if readable (else "unknown"), likely footprint (e.g. 0805, SOIC-8, QFN-32, TO-220).
2. Give each component's position as a percentage of the board image: x,y = centre (0-100), w,h = size (0-100).
3. Infer the netlist by following visible traces, vias and known reference circuits. Pins are "DESIGNATOR-PIN" (e.g. "U1-4"). Name power nets GND, VCC, 3V3, 5V etc. where obvious.
4. Estimate board size in mm from typical part sizes.
5. In notes, list assumptions, hidden layers, and anything that needs manual verification.
Be honest: mark guesses with low confidence. Keep to at most 80 components and 80 nets.`;

async function callAI(apiKey: string, image: string) {
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
        {
          role: "user",
          content: [
            { type: "input_text", text: "Reverse engineer this PCB." },
            { type: "input_image", image_url: image },
          ],
        },
      ],
      text: { format: { type: "json_schema", name: "pcb_reverse", strict: true, schema: SCHEMA } },
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
  if (refusal) return { status: 422, error: "The AI declined to analyse this image." };
  if (!out) return { status: 502, error: "The AI returned an empty result." };
  return { status: 200, data: JSON.parse(out) };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const image = typeof body?.image === "string" ? body.image : "";
    const m = image.match(/^data:([a-z/]+);base64,/);
    if (!m || !MIME.includes(m[1])) return json({ error: "Please upload a JPG, PNG or WEBP image." }, 400);
    if ((image.length - m[0].length) * 0.75 > MAX_BYTES) return json({ error: "Image must be under 8 MB." }, 400);
    const r = await callAI(Deno.env.get("LOVABLE_API_KEY")!, image);
    if (r.error) return json({ error: r.error }, r.status);
    return json(r.data);
  } catch (err) {
    console.error("reverse-engineer-pcb error", err);
    return json({ error: "Analysis failed. Please try again." }, 500);
  }
});
