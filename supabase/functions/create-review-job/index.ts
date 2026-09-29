import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const MAX_BYTES = 20 * 1024 * 1024;
const ALLOWED = [".schdoc", ".prjpcb", ".zip"];
const DAILY_LIMIT = 3;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

async function sha256(s: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const form = await req.formData().catch(() => null);
    const file = form?.get("file");
    if (!(file instanceof File)) return json({ error: "No file provided" }, 400);

    const name = file.name.slice(0, 255);
    const lower = name.toLowerCase();
    const ext = ALLOWED.find((e) => lower.endsWith(e));
    if (!ext) return json({ error: "Only .SchDoc, .PrjPcb or .zip files are allowed" }, 400);
    if (file.size === 0 || file.size > MAX_BYTES) return json({ error: "File must be between 1 byte and 20 MB" }, 400);

    const ip =
      req.headers.get("cf-connecting-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";
    const ipHash = await sha256(ip);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countErr } = await supabase
      .from("review_jobs")
      .select("id", { count: "exact", head: true })
      .eq("ip_hash", ipHash)
      .gte("created_at", since);
    if (countErr) throw countErr;
    if ((count ?? 0) >= DAILY_LIMIT) {
      return json({ error: "Daily limit reached (3 reviews per day). Please try again tomorrow." }, 429);
    }

    const token = randomToken();
    const filePath = `${token}/${crypto.randomUUID()}${ext}`;
    const { error: upErr } = await supabase.storage
      .from("review-uploads")
      .upload(filePath, file, { contentType: file.type || "application/octet-stream" });
    if (upErr) throw upErr;

    const { error: insErr } = await supabase.from("review_jobs").insert({
      token,
      file_path: filePath,
      original_name: name,
      ip_hash: ipHash,
    });
    if (insErr) {
      await supabase.storage.from("review-uploads").remove([filePath]);
      throw insErr;
    }

    // Kick off the AI review in the background
    const kick = fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/process-review-job`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({ token }),
    }).catch((e) => console.error("kick process-review-job failed", e));
    // @ts-ignore EdgeRuntime is provided by the Supabase runtime
    EdgeRuntime.waitUntil(kick);

    return json({ token });
  } catch (err) {
    console.error("create-review-job error", err);
    return json({ error: "Upload failed. Please try again." }, 500);
  }
});
