import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { unzipSync } from "npm:fflate@0.8.2";

const MAX_CHARS = 120_000;
const MODEL = "openai/gpt-6-astra";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// Pull readable Altium records (|KEY=VALUE|...) and strings out of binary/text files.
function extractText(bytes: Uint8Array): string {
  const out: string[] = [];
  let cur = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b >= 32 && b < 127) cur += String.fromCharCode(b);
    else if (b === 10 || b === 13) cur += "\n";
    else {
      if (cur.trim().length >= 6) out.push(cur.trim());
      cur = "";
    }
  }
  if (cur.trim().length >= 6) out.push(cur.trim());
  // Drop noisy geometry-only fields to save space
  return out
    .map((s) => s.replace(/\|(LOCATION\.X|LOCATION\.Y|CORNER\.X|CORNER\.Y|COLOR|AREACOLOR|OWNERPARTDISPLAYMODE|INDEXINSHEET|X\d+|Y\d+|LOCATIONCOUNT|LINEWIDTH|ISSOLID|FONTID|UNIQUEID)=[^|]*/g, ""))
    .join("\n");
}

function extractFromFile(name: string, bytes: Uint8Array): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".zip")) {
    const files = unzipSync(bytes);
    const parts: string[] = [];
    for (const [path, data] of Object.entries(files)) {
      const p = path.toLowerCase();
      if (/\.(schdoc|prjpcb|net|txt|csv|bom)$/.test(p)) parts.push(`=== FILE: ${path} ===\n${extractText(data)}`);
    }
    if (!parts.length) throw new Error("The zip file contains no .SchDoc or .PrjPcb files.");
    return parts.join("\n\n");
  }
  return `=== FILE: ${name} ===\n${extractText(bytes)}`;
}

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "verdict", "issues"],
  properties: {
    summary: { type: "string" },
    verdict: { type: "string", enum: ["pass", "needs_changes", "fail"] },
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
  },
};

const PROMPT = `You are a senior electronics engineer reviewing an Altium schematic. Below is text extracted from the design files (Altium record format: RECORD=1 components, RECORD=2 pins, RECORD=17 power ports, RECORD=25 net labels, RECORD=41 parameters, RECORD=27 wires, etc.). Some data may be incomplete.
Review for: missing decoupling capacitors, unconnected or floating pins, power/ground naming issues, missing pull-up/pull-down resistors, incorrect component values or ratings, missing designators/footprints, ESD/protection gaps, and general best practices.
Reference specific designators or nets in "location". Be concrete and practical. If the data is too limited, say so in the summary. Keep the report under 25 issues.`;

async function callAI(apiKey: string, text: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey, "X-Lovable-AIG-SDK": "fetch" },
    body: JSON.stringify({
      model: MODEL,
      stream: true,
      store: false,
      reasoning: { effort: "medium", summary: "auto" },
      include: ["reasoning.encrypted_content"],
      input: [
        { role: "system", content: PROMPT },
        { role: "user", content: text },
      ],
      text: { format: { type: "json_schema", name: "schematic_review", strict: true, schema: SCHEMA } },
    }),
  });
  if (!res.ok || !res.body) {
    const body = await res.text().catch(() => "");
    let msg = `AI review failed (${res.status}).`;
    if (res.status === 402) msg = "The AI reviewer is temporarily unavailable (out of AI credits). Please try again later.";
    else if (res.status === 429) msg = "The AI reviewer is busy. Please try again later.";
    else { try { msg = JSON.parse(body)?.error?.message ?? msg; } catch { /* ignore */ } }
    throw new Error(msg);
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
      try {
        const ev = JSON.parse(d);
        if (ev.type === "response.output_text.delta") out += ev.delta ?? "";
        else if (ev.type === "response.refusal.delta") refusal += ev.delta ?? "";
        else if (ev.type === "response.failed" || ev.type === "error")
          throw new Error(ev.response?.error?.message ?? ev.message ?? "AI review failed.");
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
  if (refusal) throw new Error("The AI declined to review this file.");
  if (!out) throw new Error("The AI returned an empty review.");
  return JSON.parse(out);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  if (req.headers.get("Authorization") !== `Bearer ${serviceKey}`) return json({ error: "Unauthorized" }, 401);

  const body = await req.json().catch(() => ({}));
  const token = typeof body?.token === "string" ? body.token : "";
  if (!/^[a-f0-9]{64}$/.test(token)) return json({ error: "Invalid token" }, 400);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);
  // Atomically claim the job
  const { data: job } = await supabase
    .from("review_jobs")
    .update({ status: "processing" })
    .eq("token", token)
    .eq("status", "pending")
    .select("id, file_path, original_name")
    .maybeSingle();
  if (!job) return json({ ok: true, skipped: true });

  const work = async () => {
    try {
      const { data: blob, error: dlErr } = await supabase.storage.from("review-uploads").download(job.file_path);
      if (dlErr || !blob) throw new Error("Could not read the uploaded file.");
      let text = extractFromFile(job.original_name, new Uint8Array(await blob.arrayBuffer()));
      if (text.length < 50) throw new Error("No readable schematic data found in this file.");
      if (text.length > MAX_CHARS) text = text.slice(0, MAX_CHARS) + "\n[...truncated]";
      const report = await callAI(Deno.env.get("LOVABLE_API_KEY")!, text);
      await supabase.from("review_jobs").update({ status: "done", report, error: null }).eq("id", job.id);
    } catch (e) {
      console.error("process-review-job error", e);
      await supabase.from("review_jobs")
        .update({ status: "failed", error: (e as Error).message?.slice(0, 500) || "The review failed." })
        .eq("id", job.id);
    }
  };
  // @ts-ignore EdgeRuntime is provided by the Supabase runtime
  EdgeRuntime.waitUntil(work());
  return json({ ok: true });
});
