import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token : "";
    if (!/^[a-f0-9]{64}$/.test(token)) return json({ error: "Invalid link" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data, error } = await supabase
      .from("review_jobs")
      .select("original_name, status, report, error, created_at")
      .eq("token", token)
      .maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: "Review not found" }, 404);
    return json(data);
  } catch (err) {
    console.error("get-review-job error", err);
    return json({ error: "Could not load review" }, 500);
  }
});
