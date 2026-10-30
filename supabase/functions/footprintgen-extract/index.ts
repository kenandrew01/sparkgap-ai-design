import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MODEL = "openai/gpt-6-astra";
const MAX_PDF_BYTES = 15 * 1024 * 1024;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const numOrNull = { type: ["number", "null"] };

const RANGE = {
  type: ["object", "null"],
  additionalProperties: false,
  required: ["min", "nom", "max"],
  properties: { min: numOrNull, nom: numOrNull, max: numOrNull },
};

const LAND_PAD = {
  type: "object",
  additionalProperties: false,
  required: ["name", "x_mm", "y_mm", "width_mm", "height_mm"],
  properties: {
    name: { type: "string" },
    x_mm: { type: "number" },
    y_mm: { type: "number" },
    width_mm: { type: "number" },
    height_mm: { type: "number" },
  },
};

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "part_number", "manufacturer", "datasheet_url", "package_family", "pin_count",
    "pitch_mm", "body_length_mm", "body_width_mm", "overall_span_mm",
    "lead_width_mm", "lead_length_mm", "body_height_max_mm", "exposed_pad",
    "pin1_location", "source_page", "confidence", "notes", "recommended_land_pattern",
  ],
  properties: {
    part_number: { type: ["string", "null"] },
    manufacturer: { type: ["string", "null"] },
    datasheet_url: { type: ["string", "null"] },
    package_family: {
      type: ["string", "null"],
      enum: ["SOIC", "SOP", "TSSOP", "QFN", "DFN", "SOT-23", "CHIP", null],
    },
    pin_count: { type: ["integer", "null"] },
    pitch_mm: numOrNull,
    body_length_mm: numOrNull,
    body_width_mm: numOrNull,
    overall_span_mm: RANGE,
    lead_width_mm: RANGE,
    lead_length_mm: RANGE,
    body_height_max_mm: numOrNull,
    exposed_pad: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["length_mm", "width_mm"],
      properties: { length_mm: { type: "number" }, width_mm: { type: "number" } },
    },
    pin1_location: { type: ["string", "null"] },
    source_page: { type: ["integer", "null"] },
    confidence: { type: "number" },
    notes: { type: ["string", "null"] },
    recommended_land_pattern: {
      type: ["object", "null"],
      additionalProperties: false,
      required: ["source", "pads"],
      properties: {
        source: { type: "string" },
        pads: { type: "array", items: LAND_PAD },
      },
    },
  },
};

const PROMPT = `You are a PCB librarian extracting mechanical package data from datasheets.

Locate the mechanical/package drawing and the recommended land pattern pages. Return ONLY JSON matching the schema. Rules:
- NEVER guess. Use null for anything not found in the source.
- package_family must be one of: SOIC, SOP, TSSOP (gull-wing), QFN, DFN (no-lead), SOT-23, CHIP (2-terminal chip passive like 0402/0603/0805). Use null if none fit.
- All dimensions in millimetres. pitch_mm is pin-to-pin spacing. overall_span_mm is the total lead-to-lead span across the body (gull-wing) or body width (no-lead).
- pin1_location: e.g. "top-left", "chamfer", "dot".
- source_page: the PDF page number of the package drawing you used.
- confidence: 0-1, how sure you are the extracted values are correct and complete.
- If the datasheet has a manufacturer recommended land pattern, extract every pad (name, centre x/y in mm relative to the part centre, width/height) into recommended_land_pattern with source naming the datasheet page.
- When the input is only a part number (no PDF), use the manufacturer's standard package data from your knowledge, set datasheet_url to the manufacturer's datasheet page if known, and lower confidence accordingly.
- notes: anything the engineer should double-check.`;

interface AiResult { status: number; data?: unknown; error?: string }

async function callAI(apiKey: string, userContent: unknown[]): Promise<AiResult> {
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
        { role: "user", content: userContent },
      ],
      text: { format: { type: "json_schema", name: "package_extraction", strict: true, schema: SCHEMA } },
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    let msg = `Extraction failed (${res.status}).`;
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
        return { status: 502, error: ev.response?.error?.message ?? ev.message ?? "Extraction failed." };
    }
  }
  if (refusal) return { status: 422, error: "The AI declined to process this input." };
  if (!out) return { status: 502, error: "The AI returned an empty result." };
  try {
    return { status: 200, data: JSON.parse(out) };
  } catch {
    return { status: 502, error: "The AI returned malformed data. Please try again." };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  try {
    const body = await req.json().catch(() => ({}));
    const partNumber = typeof body?.part_number === "string" ? body.part_number.trim() : "";
    const pdfBase64 = typeof body?.pdf_base64 === "string" ? body.pdf_base64 : "";
    const filename = typeof body?.filename === "string" ? body.filename.slice(0, 120) : "datasheet.pdf";

    if (!partNumber && !pdfBase64) {
      return json({ error: "Provide a part number or upload a datasheet PDF." }, 400);
    }
    if (partNumber.length > 120) return json({ error: "Part number is too long." }, 400);
    if (pdfBase64 && pdfBase64.length > MAX_PDF_BYTES * 1.4) {
      return json({ error: "PDF is too large (max 15 MB)." }, 413);
    }

    const userContent: unknown[] = [];
    if (pdfBase64) {
      userContent.push({
        type: "input_file",
        filename,
        file_data: `data:application/pdf;base64,${pdfBase64}`,
      });
      userContent.push({
        type: "input_text",
        text: `Extract the package data from this datasheet${partNumber ? ` for part ${partNumber}` : ""}.`,
      });
    } else {
      userContent.push({
        type: "input_text",
        text: `Extract the standard manufacturer package data for part number: ${partNumber}`,
      });
    }

    const r = await callAI(Deno.env.get("LOVABLE_API_KEY")!, userContent);
    if (r.error) return json({ error: r.error }, r.status);
    return json(r.data);
  } catch (err) {
    console.error("footprintgen-extract error", err);
    return json({ error: "Extraction failed. Please try again." }, 500);
  }
});
